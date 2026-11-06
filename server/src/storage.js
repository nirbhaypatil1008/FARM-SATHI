import fs from 'node:fs'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import { config } from './config.js'

let vercelBlob = null
try {
  vercelBlob = await import('@vercel/blob')
} catch {
  // @vercel/blob optional fallback if not installed
}

export const hasObjectStorage = Boolean(
  process.env.BLOB_READ_WRITE_TOKEN || config.BLOB_READ_WRITE_TOKEN
)

export async function savePersistentImage({ folder, buffer, mimeType, extension }) {
  const token = process.env.BLOB_READ_WRITE_TOKEN || config.BLOB_READ_WRITE_TOKEN

  if (token && vercelBlob?.put) {
    const filename = `${folder}/${randomUUID()}.${extension}`
    const blob = await vercelBlob.put(filename, buffer, {
      access: 'public',
      contentType: mimeType,
      token,
    })
    return {
      storageType: 'blob',
      identifier: blob.url,
      url: blob.url,
    }
  }

  // Fallback to local storage (for local dev and test environments)
  const localDir = path.join(path.dirname(config.DATABASE_FILE), folder)
  await fs.promises.mkdir(localDir, { recursive: true })
  const filename = `${randomUUID()}.${extension}`
  const filePath = path.join(localDir, filename)
  await fs.promises.writeFile(filePath, buffer, { flag: 'wx', mode: 0o600 })
  return {
    storageType: 'local',
    identifier: filename,
    path: filePath,
  }
}

export async function serveStoredImage(res, identifier, mimeType, localFolder) {
  if (identifier.startsWith('http://') || identifier.startsWith('https://')) {
    // Cloud persistent blob storage: redirect client to global CDN
    return res.redirect(307, identifier)
  }

  // Local filesystem
  const localDir = path.join(path.dirname(config.DATABASE_FILE), localFolder)
  const filePath = path.join(localDir, path.basename(identifier))
  return res.type(mimeType).set('Cache-Control', 'private, no-store').sendFile(filePath, (error) => {
    if (error && !res.headersSent) {
      res.status(404).json({ error: 'Image file not found on disk.' })
    }
  })
}

export async function deleteStoredImage(identifier, localFolder) {
  const token = process.env.BLOB_READ_WRITE_TOKEN || config.BLOB_READ_WRITE_TOKEN

  if (identifier.startsWith('http://') || identifier.startsWith('https://')) {
    if (token && vercelBlob?.del) {
      try {
        await vercelBlob.del(identifier, { token })
      } catch (err) {
        console.error('Error deleting blob from persistent storage:', err.message)
      }
    }
    return
  }

  // Local filesystem
  const localDir = path.join(path.dirname(config.DATABASE_FILE), localFolder)
  const filePath = path.join(localDir, path.basename(identifier))
  try {
    await fs.promises.unlink(filePath)
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.error('Could not remove local image file:', error)
    }
  }
}

