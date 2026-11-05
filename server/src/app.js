import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { rateLimit } from 'express-rate-limit'
import { config } from './config.js'
import { authenticate, authenticateOptional, login, register } from './auth.js'
import { chat, deleteConversation, history, newConversation, streamChat } from './chat.js'
import { deleteDiagnosis, diagnoseCrop, diagnosisHistory, diagnosisImage, receiveCropImage, supportedCropList } from './cropDoctor.js'
import { analyzeSoil, deleteSoilAnalysis, receiveSoilImage, soilAnalysisDetails, soilAnalysisImage, soilHistory, soilModelStatus } from './soilAnalysis.js'
import { geminiAvailability } from './gemini.js'

export const app = express()
app.disable('x-powered-by')
app.use(helmet())
app.use(cors({ origin: config.CLIENT_URL.split(',').map((item) => item.trim()), methods: ['GET', 'POST', 'DELETE'], allowedHeaders: ['Content-Type', 'Authorization'] }))
app.use(express.json({ limit: '128kb' }))
app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: true, legacyHeaders: false }))
app.use('/api/chat', rateLimit({ windowMs: 60 * 1000, limit: 20, standardHeaders: true, legacyHeaders: false }))
const guestChatLimit = rateLimit({
  windowMs: 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => Boolean(req.get('authorization')),
  handler: (_req, res) => res.status(429).json({ error: 'Too many guest chat requests. Please wait a minute and try again.' }),
})
const cropDiagnosisLimit = rateLimit({
  windowMs: 60 * 1000,
  limit: config.NODE_ENV === 'test' ? 100 : 6,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => res.status(429).json({ error: 'Too many image analyses. Please wait a minute and try again.' }),
})
const soilAnalysisLimit = rateLimit({
  windowMs: 60 * 1000,
  limit: config.NODE_ENV === 'test' ? 100 : 6,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => res.status(429).json({ error: 'Too many soil analyses. Please wait a minute and try again.' }),
})

app.get('/api/health', (_req, res) => res.json({ status: 'ok', gemini: geminiAvailability(), database: 'connected' }))
app.post('/api/auth/register', register)
app.post('/api/auth/login', login)
app.get('/api/auth/me', authenticate, (req, res) => res.json({ user: req.user }))
app.post('/api/chat', guestChatLimit, authenticateOptional, chat)
app.post('/api/chat/stream', guestChatLimit, authenticateOptional, streamChat)
app.get('/api/chat/history', authenticate, history)
app.post('/api/chat/new', authenticate, newConversation)
app.delete('/api/chat/history/:id', authenticate, deleteConversation)
app.get('/api/crop-doctor/supported-crops', supportedCropList)
app.post('/api/crop-doctor/preview', cropDiagnosisLimit, receiveCropImage, diagnoseCrop)
app.post('/api/crop-doctor/diagnose', cropDiagnosisLimit, authenticate, receiveCropImage, diagnoseCrop)
app.get('/api/crop-doctor/history', authenticate, diagnosisHistory)
app.get('/api/crop-doctor/history/:id/image', authenticate, diagnosisImage)
app.delete('/api/crop-doctor/history/:id', authenticate, deleteDiagnosis)
app.get('/api/soil/status', soilModelStatus)
app.post('/api/soil/preview', soilAnalysisLimit, receiveSoilImage, analyzeSoil)
app.post('/api/soil/analyze', soilAnalysisLimit, authenticate, receiveSoilImage, analyzeSoil)
app.get('/api/soil/history', authenticate, soilHistory)
app.get('/api/soil/history/:id', authenticate, soilAnalysisDetails)
app.get('/api/soil/history/:id/image', authenticate, soilAnalysisImage)
app.delete('/api/soil/history/:id', authenticate, deleteSoilAnalysis)

app.use((req, res) => res.status(404).json({ error: `No route for ${req.method} ${req.path}` }))
app.use((error, _req, res, _next) => {
  if (res.headersSent) return
  const status = Number.isInteger(error.status) ? error.status : 500
  if (status >= 500 && status !== 503) console.error('API request failed:', error)
  return res.status(status).json({
    error: status === 503 ? error.message : status >= 500 ? 'The server could not complete this request. Check the backend configuration and logs.' : error.message,
    ...(error.details ? { details: error.details } : {}),
  })
})
