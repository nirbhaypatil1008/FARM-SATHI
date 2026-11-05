import fs from 'node:fs'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import multer from 'multer'
import { z } from 'zod'
import { config } from './config.js'
import { database } from './db.js'
import { analyzePlantImage } from './gemini.js'

const MAX_IMAGE_BYTES = 5 * 1024 * 1024
const imageDirectory = path.join(path.dirname(config.DATABASE_FILE), 'crop-diagnoses')
const allowedTypes = new Map([
  ['image/jpeg', { extension: 'jpg', matches: (buffer) => buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff }],
  ['image/png', { extension: 'png', matches: (buffer) => buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) }],
  ['image/webp', { extension: 'webp', matches: (buffer) => buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP' }],
])
const diagnoseSchema = z.object({
  cropName: z.string().trim().min(1).max(80),
  observations: z.string().trim().max(800).default(''),
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
    const result = await analyzePlantImage({
      image: req.file.buffer,
      mimeType: input.mimeType,
      cropName: input.cropName,
      observations: input.observations,
    })
    const id = randomUUID()
    savedFilename = `${id}.${input.extension}`
    await fs.promises.writeFile(path.join(imageDirectory, savedFilename), req.file.buffer, { flag: 'wx', mode: 0o600 })
    database.prepare(`
      INSERT INTO crop_diagnoses
        (id, user_id, crop_name, disease_name, image_filename, image_mime_type, confidence, severity, result_json)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, req.user.id, input.cropName, result.diseaseName, savedFilename, input.mimeType, result.confidence, result.severity, JSON.stringify(result))
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
