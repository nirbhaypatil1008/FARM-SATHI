import fs from 'node:fs'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import multer from 'multer'
import { z } from 'zod'
import { aiServiceUnavailableMessage } from './aiServiceErrors.js'
import { config } from './config.js'
import { database } from './db.js'

const MAX_IMAGE_BYTES = 5 * 1024 * 1024
const imageDirectory = path.join(path.dirname(config.DATABASE_FILE), 'crop-diagnoses')
const allowedTypes = new Map([
  ['image/jpeg', { extension: 'jpg', matches: (buffer) => buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff }],
  ['image/png', { extension: 'png', matches: (buffer) => buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) }],
  ['image/webp', { extension: 'webp', matches: (buffer) => buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP' }],
])
const diagnoseSchema = z.object({
  cropName: z.string().trim().max(80).default(''),
  observations: z.string().trim().max(800).default(''),
})
const supportedCropsSchema = z.object({
  modelLoaded: z.boolean(),
  message: z.string().default(''),
  crops: z.array(z.object({
    crop: z.string().min(1),
    diseases: z.array(z.string()),
  })),
})

fs.mkdirSync(imageDirectory, { recursive: true })

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_IMAGE_BYTES, files: 1, fields: 2, fieldSize: 1000 },
  fileFilter: (_req, file, callback) => {
    if (!allowedTypes.has(file.mimetype)) return callback(new Error('Choose a JPG, PNG, or WEBP plant image.'))
    return callback(null, true)
  },
})

export function receiveCropImage(req, res, next) {
  upload.single('image')(req, res, (error) => {
    if (!error) return next()
    if (error instanceof multer.MulterError) {
      const status = error.code === 'LIMIT_FILE_SIZE' ? 413 : 400
      return res.status(status).json({ error: status === 413 ? 'Choose an image smaller than 5 MB.' : 'Upload one supported plant image.' })
    }
    return res.status(400).json({ error: error.message || 'Choose a JPG, PNG, or WEBP plant image.' })
  })
}

export async function supportedCropList(_req, res) {
  try {
    const response = await fetch(`${config.AI_SERVICE_URL.replace(/\/+$/, '')}/api/disease/supported-crops`, {
      signal: AbortSignal.timeout(5000),
    })
    const body = await response.json().catch(() => ({}))
    if (!response.ok) return res.status(response.status === 503 ? 503 : 502).json({ error: body.error || body.message || 'The disease model is not ready.', crops: [] })
    const supportedCrops = supportedCropsSchema.safeParse(body)
    if (!supportedCrops.success) {
      console.error('TensorFlow service returned an invalid supported-crops response.')
      return res.status(502).json({ error: 'The AI service returned an invalid supported-crops response.', crops: [] })
    }
    return res.json(supportedCrops.data)
  } catch (error) {
    return res.status(503).json({ error: aiServiceUnavailableMessage(error), crops: [] })
  }
}

function validateInput(req) {
  if (!req.file) {
    const error = new Error('Choose a JPG, PNG, or WEBP plant image to analyze.')
    error.status = 400
    throw error
  }
  const mime = allowedTypes.get(req.file.mimetype)
  if (!mime || !mime.matches(req.file.buffer)) {
    const error = new Error('The selected file is not a valid image of the declared type.')
    error.status = 400
    throw error
  }
  const fields = diagnoseSchema.safeParse(req.body)
  if (!fields.success) {
    const error = new Error('Enter a crop name and keep observations under 800 characters.')
    error.status = 400
    error.details = fields.error.flatten().fieldErrors
    throw error
  }
  return { ...fields.data, ...mime, mimeType: req.file.mimetype }
}

function formatDiagnosis(row) {
  return {
    id: row.id,
    cropName: row.crop_name,
    imageUrl: `/api/crop-doctor/history/${row.id}/image`,
    createdAt: row.created_at,
    ...JSON.parse(row.result_json),
  }
}

export async function diagnoseCrop(req, res, next) {
  let savedFilename
  try {
    const input = validateInput(req)
    const form = new FormData()
    form.set('file', new Blob([req.file.buffer], { type: input.mimeType }), `plant.${input.extension}`)
    if (input.cropName) form.set('crop_name', input.cropName)
    let response
    try {
      response = await fetch(`${config.AI_SERVICE_URL.replace(/\/+$/, '')}/api/disease/predict`, {
        method: 'POST',
        body: form,
        signal: AbortSignal.timeout(90_000),
      })
    } catch (serviceError) {
      const error = new Error(aiServiceUnavailableMessage(serviceError, 'plant-disease AI service'))
      error.status = 503
      throw error
    }
    const serviceBody = await response.json().catch(() => ({}))
    if (!response.ok) {
      const error = new Error(serviceBody.detail || serviceBody.error || `Plant-disease analysis failed (${response.status}).`)
      error.status = response.status === 413 ? 413 : response.status === 422 ? 400 : response.status >= 500 ? 503 : 502
      throw error
    }
    const predictionSchema = z.object({
      success: z.literal(true),
      crop: z.string().nullable(),
      predictedDisease: z.string(),
      confidence: z.number().min(0).max(1),
      status: z.enum(['possible_detection', 'healthy', 'inconclusive', 'unsupported_crop', 'crop_mismatch']),
      topPredictions: z.array(z.object({ crop: z.string(), disease: z.string(), confidence: z.number().min(0).max(1) })).max(5),
      modelVersion: z.string().min(1).max(80),
      message: z.string().max(600),
      knowledge: z.object({
        available: z.boolean(),
        symptoms: z.array(z.string()).default([]),
        possibleCauses: z.array(z.string()).default([]),
        conduciveConditions: z.array(z.string()).default([]),
        prevention: z.array(z.string()).default([]),
        nextSteps: z.array(z.string()).default([]),
        source: z.string().nullable().default(null),
        verifiedAt: z.string().nullable().default(null),
      }),
    }).safeParse(serviceBody)
    if (!predictionSchema.success) {
      console.error('TensorFlow service returned an invalid prediction response.')
      const error = new Error('Plant-disease analysis returned an invalid response. Please retry.')
      error.status = 502
      throw error
    }
    const prediction = predictionSchema.data
    const identified = ['possible_detection', 'healthy'].includes(prediction.status)
    const result = {
      assessment: identified ? 'identified' : 'uncertain',
      predictionStatus: prediction.status,
      plantName: prediction.crop || input.cropName || 'Crop not identified',
      diseaseName: prediction.predictedDisease,
      confidence: Math.round(prediction.confidence * 100),
      modelConfidence: prediction.confidence,
      topPredictions: prediction.topPredictions,
      modelVersion: prediction.modelVersion,
      message: prediction.message,
      farmerObservations: input.observations,
      severity: prediction.status === 'healthy' ? 'low' : 'unknown',
      symptoms: prediction.knowledge.symptoms,
      visibleSigns: [],
      possibleCauses: prediction.knowledge.possibleCauses,
      conduciveConditions: prediction.knowledge.conduciveConditions,
      immediateActions: prediction.knowledge.nextSteps,
      farmingPractices: [],
      organicOptions: [],
      prevention: prediction.knowledge.prevention,
      irrigationAndSoil: [],
      preventSpread: [],
      reinspectInDays: null,
      professionalHelp: [],
      knowledge: prediction.knowledge,
    }
    if (!req.user) {
      return res.json({ diagnosis: { ...result, createdAt: new Date().toISOString() } })
    }
    const id = randomUUID()
    savedFilename = `${id}.${input.extension}`
    await fs.promises.writeFile(path.join(imageDirectory, savedFilename), req.file.buffer, { flag: 'wx', mode: 0o600 })
    database.prepare(`
      INSERT INTO crop_diagnoses
        (id, user_id, crop_name, disease_name, image_filename, image_mime_type, confidence, severity, result_json)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, req.user.id, result.plantName, result.diseaseName, savedFilename, input.mimeType, result.confidence, result.severity, JSON.stringify(result))
    const row = database.prepare('SELECT * FROM crop_diagnoses WHERE id = ? AND user_id = ?').get(id, req.user.id)
    return res.status(201).json({ diagnosis: formatDiagnosis(row) })
  } catch (error) {
    if (savedFilename) {
      try {
        await fs.promises.unlink(path.join(imageDirectory, savedFilename))
      } catch (cleanupError) {
        if (cleanupError.code !== 'ENOENT') console.error('Could not remove an unreferenced crop image.', cleanupError)
      }
    }
    if (error.status) return res.status(error.status).json({ error: error.message, ...(error.details ? { details: error.details } : {}) })
    return next(error)
  }
}

export function diagnosisHistory(req, res, next) {
  try {
    const rows = database.prepare('SELECT * FROM crop_diagnoses WHERE user_id = ? ORDER BY created_at DESC LIMIT 100').all(req.user.id)
    return res.json({ diagnoses: rows.map(formatDiagnosis) })
  } catch (error) {
    return next(error)
  }
}

export function diagnosisImage(req, res, next) {
  try {
    const row = database.prepare('SELECT image_filename, image_mime_type FROM crop_diagnoses WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id)
    if (!row) return res.status(404).json({ error: 'Diagnosis image not found.' })
    const imagePath = path.join(imageDirectory, path.basename(row.image_filename))
    return res.type(row.image_mime_type).set('Cache-Control', 'private, no-store').sendFile(imagePath, (error) => {
      if (error && !res.headersSent) return next(error)
    })
  } catch (error) {
    return next(error)
  }
}

export async function deleteDiagnosis(req, res, next) {
  try {
    const row = database.prepare('SELECT image_filename FROM crop_diagnoses WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id)
    if (!row) return res.status(404).json({ error: 'Diagnosis not found.' })
    database.prepare('DELETE FROM crop_diagnoses WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id)
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
