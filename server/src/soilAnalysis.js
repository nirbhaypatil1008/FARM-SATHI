import fs from 'node:fs'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import multer from 'multer'
import { z } from 'zod'
import { aiServiceUnavailableMessage } from './aiServiceErrors.js'
import { config } from './config.js'
import { database } from './db.js'

const MAX_IMAGE_BYTES = 5 * 1024 * 1024
const imageDirectory = path.join(path.dirname(config.DATABASE_FILE), 'soil-analyses')
const allowedTypes = new Map([
  ['image/jpeg', { extension: 'jpg', matches: (buffer) => buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff }],
  ['image/png', { extension: 'png', matches: (buffer) => buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) }],
  ['image/webp', { extension: 'webp', matches: (buffer) => buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP' }],
])
const analysisFields = z.object({
  cropName: z.string().trim().max(80).default(''),
  location: z.string().trim().max(120).default(''),
})
const probabilitySchema = z.record(z.string().min(1), z.number().min(0).max(1))
const predictionSchema = z.object({
  success: z.literal(true),
  predicted_class: z.string().nullable(),
  confidence: z.number().min(0).max(1),
  probabilities: probabilitySchema,
  model_ready: z.literal(true),
  analysis_type: z.literal('visual_soil_classification'),
  model_name: z.string().min(1).max(80),
  model_version: z.string().nullable(),
  status: z.enum(['possible_detection', 'inconclusive']),
  message: z.string().max(600),
  limitations: z.array(z.string().max(400)).max(10),
  top_predictions: z.array(z.object({
    soilCategory: z.string().min(1),
    confidence: z.number().min(0).max(1),
  })),
  visual_characteristics: z.array(z.string().max(300)).max(10),
})
const statusSchema = z.object({
  model_loaded: z.boolean(),
  model_name: z.string(),
  model_version: z.string().nullable(),
  class_count: z.number().int().nonnegative(),
  preprocessing: z.enum(['embedded_mobilenet_v2', 'mobilenet_v2']).default('embedded_mobilenet_v2'),
  message: z.string(),
})

fs.mkdirSync(imageDirectory, { recursive: true })

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_IMAGE_BYTES, files: 1, fields: 2, fieldSize: 512 },
  fileFilter: (_req, file, callback) => {
    if (!allowedTypes.has(file.mimetype)) return callback(new Error('Choose a JPG, PNG, or WEBP soil image.'))
    return callback(null, true)
  },
})

export function receiveSoilImage(req, res, next) {
  upload.single('image')(req, res, (error) => {
    if (!error) return next()
    if (error instanceof multer.MulterError) {
      const tooLarge = error.code === 'LIMIT_FILE_SIZE'
      return res.status(tooLarge ? 413 : 400).json({ error: tooLarge ? 'Choose an image smaller than 5 MB.' : 'Upload one supported soil image.' })
    }
    return res.status(400).json({ error: error.message || 'Choose a JPG, PNG, or WEBP soil image.' })
  })
}

export async function soilModelStatus(_req, res) {
  try {
    const response = await fetch(`${config.AI_SERVICE_URL.replace(/\/+$/, '')}/api/soil/status`, {
      signal: AbortSignal.timeout(5000),
    })
    const body = await response.json().catch(() => ({}))
    if (!response.ok) return res.status(response.status >= 500 ? 503 : 502).json({ error: body.detail || 'Could not read soil model status.', model_loaded: false })
    const status = statusSchema.safeParse(body)
    if (!status.success) {
      console.error('TensorFlow service returned an invalid soil readiness response.')
      return res.status(502).json({ error: 'The AI service returned an invalid soil readiness response.', model_loaded: false })
    }
    return res.json(status.data)
  } catch (error) {
    return res.status(503).json({
      error: aiServiceUnavailableMessage(error, 'soil-model readiness check'),
      model_loaded: false,
    })
  }
}

function validateInput(req) {
  if (!req.file) {
    const error = new Error('Choose a JPG, PNG, or WEBP soil image to analyze.')
    error.status = 400
    throw error
  }
  const fileType = allowedTypes.get(req.file.mimetype)
  if (!fileType || !fileType.matches(req.file.buffer)) {
    const error = new Error('The selected file is not a valid image of the declared type.')
    error.status = 400
    throw error
  }
  const fields = analysisFields.safeParse(req.body)
  if (!fields.success) {
    const error = new Error('Crop name or location is too long.')
    error.status = 400
    throw error
  }
  return { ...fields.data, ...fileType, mimeType: req.file.mimetype }
}

function formatAnalysis(row) {
  return {
    id: row.id,
    cropName: row.crop_name,
    location: row.location,
    imageUrl: `/api/soil/history/${row.id}/image`,
    createdAt: row.created_at,
    ...JSON.parse(row.result_json),
  }
}

export async function analyzeSoil(req, res, next) {
  let savedFilename
  try {
    const input = validateInput(req)
    const form = new FormData()
    form.set('file', new Blob([req.file.buffer], { type: input.mimeType }), `soil.${input.extension}`)
    let response
    try {
      response = await fetch(`${config.AI_SERVICE_URL.replace(/\/+$/, '')}/api/soil/predict`, {
        method: 'POST',
        body: form,
        signal: AbortSignal.timeout(90_000),
      })
    } catch (serviceError) {
      const error = new Error(aiServiceUnavailableMessage(serviceError, 'soil-analysis AI service'))
      error.status = 503
      throw error
    }
    const serviceBody = await response.json().catch(() => ({}))
    if (!response.ok) {
      const error = new Error(serviceBody.detail || 'Soil image analysis is temporarily unavailable. Please try again later.')
      error.status = response.status === 413 ? 413 : response.status === 415 || response.status === 422 ? 400 : response.status >= 500 ? 503 : 502
      throw error
    }
    const prediction = predictionSchema.safeParse(serviceBody)
    if (!prediction.success) {
      console.error('TensorFlow service returned an invalid soil prediction response.')
      const error = new Error('Soil analysis returned an invalid response. Please retry.')
      error.status = 502
      throw error
    }

    const result = prediction.data
    if (!req.user) {
      return res.json({
        analysis: {
          cropName: input.cropName,
          location: input.location,
          createdAt: new Date().toISOString(),
          ...result,
        },
      })
    }
    const id = randomUUID()
    savedFilename = `${id}.${input.extension}`
    await fs.promises.writeFile(path.join(imageDirectory, savedFilename), req.file.buffer, { flag: 'wx', mode: 0o600 })
    database.prepare(`
      INSERT INTO soil_analyses
        (id, user_id, crop_name, location, image_filename, image_mime_type, predicted_class, confidence, model_version, result_json)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, req.user.id, input.cropName, input.location, savedFilename, input.mimeType, result.predicted_class, result.confidence, result.model_version, JSON.stringify(result))
    const row = database.prepare('SELECT * FROM soil_analyses WHERE id = ? AND user_id = ?').get(id, req.user.id)
    return res.status(201).json({ analysis: formatAnalysis(row) })
  } catch (error) {
    if (savedFilename) {
      try {
        await fs.promises.unlink(path.join(imageDirectory, savedFilename))
      } catch (cleanupError) {
        if (cleanupError.code !== 'ENOENT') console.error('Could not remove an unreferenced soil image.', cleanupError)
      }
    }
    if (error.status) return res.status(error.status).json({ error: error.message })
    return next(error)
  }
}

export function soilHistory(req, res, next) {
  try {
    const rows = database.prepare('SELECT * FROM soil_analyses WHERE user_id = ? ORDER BY created_at DESC LIMIT 100').all(req.user.id)
    return res.json({ analyses: rows.map(formatAnalysis) })
  } catch (error) {
    return next(error)
  }
}

export function soilAnalysisDetails(req, res, next) {
  try {
    const row = database.prepare('SELECT * FROM soil_analyses WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id)
    if (!row) return res.status(404).json({ error: 'Soil analysis not found.' })
    return res.json({ analysis: formatAnalysis(row) })
  } catch (error) {
    return next(error)
  }
}

export function soilAnalysisImage(req, res, next) {
  try {
    const row = database.prepare('SELECT image_filename, image_mime_type FROM soil_analyses WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id)
    if (!row) return res.status(404).json({ error: 'Soil analysis image not found.' })
    const imagePath = path.join(imageDirectory, path.basename(row.image_filename))
    return res.type(row.image_mime_type).set('Cache-Control', 'private, no-store').sendFile(imagePath, (error) => {
      if (error && !res.headersSent) return next(error)
    })
  } catch (error) {
    return next(error)
  }
}

export async function deleteSoilAnalysis(req, res, next) {
  try {
    const row = database.prepare('SELECT image_filename FROM soil_analyses WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id)
    if (!row) return res.status(404).json({ error: 'Soil analysis not found.' })
    database.prepare('DELETE FROM soil_analyses WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id)
    try {
      await fs.promises.unlink(path.join(imageDirectory, path.basename(row.image_filename)))
    } catch (error) {
      if (error.code !== 'ENOENT') return next(error)
    }
    return res.status(204).end()
  } catch (error) {
    return next(error)
  }
}
