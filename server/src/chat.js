import { randomUUID } from 'node:crypto'
import { z } from 'zod'
import { database } from './db.js'
import { generateReply, generateReplyStream } from './gemini.js'

const messageSchema = z.object({
  conversationId: z.string().uuid().optional(),
  message: z.string().trim().min(1).max(4000),
  context: z.record(z.string(), z.unknown()).default({}),
  language: z.enum(['en', 'kn', 'hi', 'ta', 'te', 'mr']).default('en'),
  history: z.array(z.object({
    role: z.enum(['user', 'model']),
    content: z.string().min(1).max(4000),
  })).max(20).default([]),
})
const historyContextSchema = z.object({
  conversationId: z.string().uuid().optional(),
})

function validContext(context) {
  const serialized = JSON.stringify(context)
  if (serialized.length > 16_000) {
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
    const reply = await generateReply({ history, message: input.message, context: { ...input.context, selectedLanguage: input.language } })
    if (conversationId) saveMessage(conversationId, 'model', reply)
    return res.json({ ...(conversationId ? { conversationId } : {}), reply })
  } catch (error) {
    return next(error)
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
    res.set({ 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache, no-transform', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' })
    res.flushHeaders()
    res.write(`event: conversation\ndata: ${JSON.stringify({ conversationId })}\n\n`)
    let reply = ''
    for await (const chunk of generateReplyStream({ history, message: input.message, context: { ...input.context, selectedLanguage: input.language } })) {
      reply += chunk
      res.write(`event: delta\ndata: ${JSON.stringify({ text: chunk })}\n\n`)
    }
    if (userId) saveMessage(conversationId, 'model', reply)
    res.write(`event: done\ndata: ${JSON.stringify({ conversationId })}\n\n`)
    return res.end()
  } catch (error) {
    if (res.headersSent) {
      res.write(`event: error\ndata: ${JSON.stringify({ error: error.message || 'Chat stream failed.' })}\n\n`)
      return res.end()
    }
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
