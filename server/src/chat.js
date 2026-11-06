import { randomUUID } from 'node:crypto'
import { z } from 'zod'
import { database } from './db.js'
import { generateReply, generateReplyStream, geminiAvailability } from './gemini.js'
import { buildFarmerGroundingContext } from './farmerContext.js'
import { answerLocally, detectIntent, intentNeedsWeather } from './localAssistant.js'

const SUPPORTED_LANGUAGES = ['en', 'kn', 'hi', 'te', 'ta', 'ml', 'mr', 'bn', 'gu', 'pa', 'or']

const messageSchema = z.object({
  conversationId: z.string().uuid().optional(),
  message: z.string().trim().min(1).max(4000),
  context: z.record(z.string(), z.unknown()).default({}),
  language: z.enum(SUPPORTED_LANGUAGES).default('en'),
  mode: z.enum(['auto', 'quick', 'deep']).default('auto'),
  history: z.array(z.object({
    role: z.enum(['user', 'model']),
    content: z.string().min(1).max(4000),
  })).max(20).default([]),
})

const historyContextSchema = z.object({
  conversationId: z.string().uuid().optional(),
})

export function detectLanguageFromText(text, fallback = 'en') {
  if (!text || typeof text !== 'string') return fallback
  if (/[\u0C80-\u0CFF]/.test(text)) return 'kn' // Kannada
  if (/[\u0C00-\u0C7F]/.test(text)) return 'te' // Telugu
  if (/[\u0B80-\u0BFF]/.test(text)) return 'ta' // Tamil
  if (/[\u0D00-\u0D7F]/.test(text)) return 'ml' // Malayalam
  if (/[\u0980-\u09FF]/.test(text)) return 'bn' // Bengali
  if (/[\u0A80-\u0AFF]/.test(text)) return 'gu' // Gujarati
  if (/[\u0A00-\u0A7F]/.test(text)) return 'pa' // Punjabi
  if (/[\u0B00-\u0B7F]/.test(text)) return 'or' // Odia
  if (/[\u0900-\u097F]/.test(text)) return fallback === 'mr' ? 'mr' : 'hi' // Devanagari (Hindi / Marathi)
  return fallback
}

function validContext(context) {
  const serialized = JSON.stringify(context)
  if (serialized.length > 24_000) {
    const error = new Error('Farm context is too large. Send a smaller set of farm records.')
    error.status = 413
    throw error
  }
  return context
}

function ensureConversation(userId, conversationId, title = 'New conversation') {
  if (conversationId) {
    const row = database.prepare('SELECT id, title FROM conversations WHERE id = ? AND user_id = ?').get(conversationId, userId)
    if (!row) {
      const error = new Error('Conversation not found. Start a new chat.')
      error.status = 404
      throw error
    }
    if (row.title === 'New conversation' && !database.prepare('SELECT 1 FROM messages WHERE conversation_id = ? LIMIT 1').get(conversationId)) {
      database.prepare('UPDATE conversations SET title = ? WHERE id = ?').run(title.slice(0, 80), conversationId)
    }
    return conversationId
  }
  const id = randomUUID()
  database.prepare('INSERT INTO conversations (id, user_id, title) VALUES (?, ?, ?)').run(id, userId, title.slice(0, 80))
  return id
}

function savedHistory(conversationId) {
  return database.prepare('SELECT role, content FROM messages WHERE conversation_id = ? ORDER BY created_at DESC, rowid DESC LIMIT 20').all(conversationId).reverse()
}

function saveMessage(conversationId, role, content) {
  database.prepare('INSERT INTO messages (id, conversation_id, role, content) VALUES (?, ?, ?, ?)').run(randomUUID(), conversationId, role, content)
  database.prepare("UPDATE conversations SET updated_at = strftime('%Y-%m-%d %H:%M:%f', 'now') WHERE id = ?").run(conversationId)
}

function parseRequest(body) {
  const result = messageSchema.safeParse(body)
  if (!result.success) {
    const error = new Error('Enter a message (up to 4,000 characters) and valid chat context.')
    error.status = 400
    error.details = result.error.flatten().fieldErrors
    throw error
  }
  result.data.context = validContext(result.data.context)
  return result.data
}

export async function chat(req, res, next) {
  try {
    const input = parseRequest(req.body)
    const userId = req.user?.id
    const conversationId = userId ? ensureConversation(userId, input.conversationId, input.message) : undefined
    const recent = conversationId ? savedHistory(conversationId) : input.history
    const isRetry = recent.at(-1)?.role === 'user' && recent.at(-1).content === input.message
    const history = isRetry ? recent.slice(0, -1) : recent
    if (!isRetry && conversationId) saveMessage(conversationId, 'user', input.message)

    const detectedLanguage = detectLanguageFromText(input.message, input.language)
    const detection = detectIntent(input.message)
    const geminiReady = geminiAvailability().configured
    const farmerContext = await buildFarmerGroundingContext(userId, input.context, {
      includeWeather: input.mode === 'deep' || !detection.intent || detection.deep || intentNeedsWeather(detection.intent.id),
    })

    // 1. Instant built-in answer (no external API)
    const local = answerLocally({ message: input.message, language: detectedLanguage, context: farmerContext, mode: input.mode, geminiAvailable: geminiReady, detection })
    if (local) {
      if (conversationId) saveMessage(conversationId, 'model', local.reply)
      return res.json({ ...(conversationId ? { conversationId } : {}), reply: local.reply, language: detectedLanguage, source: 'local', suggestions: local.suggestions })
    }

    // 2. Deep answer from Gemini
    const reply = await generateReply({
      history,
      message: input.message,
      context: {
        ...input.context,
        ...farmerContext,
        selectedLanguage: detectedLanguage,
      },
    })
    if (conversationId) saveMessage(conversationId, 'model', reply)
    return res.json({ ...(conversationId ? { conversationId } : {}), reply, language: detectedLanguage, source: 'gemini' })
  } catch (error) {
    return next(error)
  }
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

/** Streams a locally generated answer in small pieces so it "types" naturally. */
async function writeLocalStream(res, text) {
  const pieces = text.match(/\S+\s*/g) || [text]
  for (let index = 0; index < pieces.length; index += 4) {
    if (res.writableEnded || res.destroyed) return
    res.write(`event: delta\ndata: ${JSON.stringify({ text: pieces.slice(index, index + 4).join('') })}\n\n`)
    await sleep(12)
  }
}

export async function streamChat(req, res, next) {
  let conversationId
  let userMessage
  try {
    const input = parseRequest(req.body)
    const userId = req.user?.id
    conversationId = userId ? ensureConversation(userId, input.conversationId, input.message) : randomUUID()
    const recent = userId ? savedHistory(conversationId) : input.history
    const isRetry = recent.at(-1)?.role === 'user' && recent.at(-1).content === input.message
    const history = isRetry ? recent.slice(0, -1) : recent
    userMessage = input.message
    if (!isRetry && userId) saveMessage(conversationId, 'user', userMessage)

    const detectedLanguage = detectLanguageFromText(input.message, input.language)
    const detection = detectIntent(input.message)
    const geminiReady = geminiAvailability().configured
    const farmerContext = await buildFarmerGroundingContext(userId, input.context, {
      includeWeather: input.mode === 'deep' || !detection.intent || detection.deep || intentNeedsWeather(detection.intent.id),
    })

    res.set({
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no'
    })
    res.flushHeaders()
    res.write(`event: conversation\ndata: ${JSON.stringify({ conversationId, language: detectedLanguage })}\n\n`)

    const sendLocal = async (local, source, notice) => {
      res.write(`event: meta\ndata: ${JSON.stringify({ source, intent: local.intent, ...(notice ? { notice } : {}) })}\n\n`)
      const text = notice ? `> ⚠️ ${notice}\n> Here is a quick answer from FARM-SAATHI's built-in farm knowledge.\n\n${local.reply}` : local.reply
      await writeLocalStream(res, text)
      if (local.suggestions?.length) res.write(`event: suggestions\ndata: ${JSON.stringify({ suggestions: local.suggestions })}\n\n`)
      if (userId) saveMessage(conversationId, 'model', text)
      res.write(`event: done\ndata: ${JSON.stringify({ conversationId, source })}\n\n`)
      return res.end()
    }

    // 1. Instant built-in answer (no external API call)
    const local = answerLocally({ message: input.message, language: detectedLanguage, context: farmerContext, mode: input.mode, geminiAvailable: geminiReady, detection })
    if (local) return sendLocal(local, 'local')

    // 2. Deep answer from Gemini, with built-in fallback if the API is unavailable
    res.write(`event: meta\ndata: ${JSON.stringify({ source: 'gemini' })}\n\n`)
    let reply = ''
    try {
      for await (const chunk of generateReplyStream({
        history,
        message: input.message,
        context: {
          ...input.context,
          ...farmerContext,
          selectedLanguage: detectedLanguage,
        },
      })) {
        reply += chunk
        res.write(`event: delta\ndata: ${JSON.stringify({ text: chunk })}\n\n`)
      }
    } catch (geminiError) {
      if (reply) throw geminiError
      const fallback = answerLocally({ message: input.message, language: detectedLanguage, context: farmerContext, mode: 'quick', geminiAvailable: false, detection, force: true })
      return sendLocal(fallback, 'local-fallback', `AI deep mode is unavailable right now: ${geminiError.message || 'unknown error'}`)
    }
    if (userId) saveMessage(conversationId, 'model', reply)
    res.write(`event: done\ndata: ${JSON.stringify({ conversationId, source: 'gemini' })}\n\n`)
    return res.end()
  } catch (error) {
    if (res.headersSent) {
      res.write(`event: error\ndata: ${JSON.stringify({ error: error.message || 'Chat stream failed.' })}\n\n`)
      return res.end()
    }
    return next(error)
  }
}

/** Lightweight summary of the farmer's live data for the assistant header badges. */
export async function contextSummary(req, res, next) {
  try {
    const location = String(req.query.location || '').slice(0, 120)
    const ctx = await buildFarmerGroundingContext(req.user.id, { location: { village: location } })
    const soil = Array.isArray(ctx.soilAnalyzer.latestReports) ? ctx.soilAnalyzer.latestReports[0] : null
    const plant = Array.isArray(ctx.plantAnalyzer.latestDiagnoses) ? ctx.plantAnalyzer.latestDiagnoses[0] : null
    return res.json({
      soil: soil ? { type: soil.predictedSoilClass, confidence: soil.modelConfidence } : null,
      plant: plant ? { crop: plant.cropName, condition: plant.diagnosedCondition, severity: plant.severity } : null,
      weather: ctx.weather?.currentTemperature ? { location: ctx.weather.location, temperature: ctx.weather.currentTemperature, humidity: ctx.weather.relativeHumidity } : null,
      todayTasks: Array.isArray(ctx.farmCalendar.todayActivities) ? ctx.farmCalendar.todayActivities.length : 0,
      overdueTasks: Array.isArray(ctx.farmCalendar.overdueActivities) ? ctx.farmCalendar.overdueActivities.length : 0,
      activeCrops: Array.isArray(ctx.activeCrops) ? ctx.activeCrops.length : 0,
      gemini: geminiAvailability(),
    })
  } catch (error) {
    return next(error)
  }
}

export function history(req, res, next) {
  try {
    const parsed = historyContextSchema.safeParse(req.query)
    if (!parsed.success) return res.status(400).json({ error: 'Invalid conversation id.' })
    const rows = parsed.data.conversationId
      ? database.prepare('SELECT id, title, created_at, updated_at FROM conversations WHERE id = ? AND user_id = ?').all(parsed.data.conversationId, req.user.id)
      : database.prepare('SELECT id, title, created_at, updated_at FROM conversations WHERE user_id = ? ORDER BY updated_at DESC LIMIT 50').all(req.user.id)
    const conversations = rows.map((row) => ({
      ...row,
      messages: database.prepare('SELECT id, role, content, created_at FROM messages WHERE conversation_id = ? ORDER BY created_at ASC, rowid ASC').all(row.id),
    }))
    return res.json({ conversations })
  } catch (error) {
    return next(error)
  }
}

export function newConversation(req, res) {
  const id = randomUUID()
  database.prepare('INSERT INTO conversations (id, user_id, title) VALUES (?, ?, ?)').run(id, req.user.id, 'New conversation')
  return res.status(201).json({ conversationId: id })
}

export function renameConversation(req, res, next) {
  try {
    const { id } = req.params
    const { title } = req.body || {}
    if (!title || !title.trim()) return res.status(400).json({ error: 'Conversation title cannot be empty.' })
    const result = database.prepare('UPDATE conversations SET title = ?, updated_at = strftime(\'%Y-%m-%d %H:%M:%f\', \'now\') WHERE id = ? AND user_id = ?').run(title.trim().slice(0, 80), id, req.user.id)
    if (!result.changes) return res.status(404).json({ error: 'Conversation not found.' })
    return res.json({ success: true, title: title.trim().slice(0, 80) })
  } catch (error) {
    return next(error)
  }
}

export function deleteAllConversations(req, res, next) {
  try {
    const result = database.prepare('DELETE FROM conversations WHERE user_id = ?').run(req.user.id)
    return res.json({ deleted: result.changes })
  } catch (error) {
    return next(error)
  }
}

export function deleteConversation(req, res, next) {
  try {
    const parsed = z.string().uuid().safeParse(req.params.id)
    if (!parsed.success) return res.status(400).json({ error: 'Invalid conversation id.' })
    const result = database.prepare('DELETE FROM conversations WHERE id = ? AND user_id = ?').run(parsed.data, req.user.id)
    if (!result.changes) return res.status(404).json({ error: 'Conversation not found.' })
    return res.status(204).end()
  } catch (error) {
    return next(error)
  }
}
