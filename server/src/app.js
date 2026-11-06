import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { rateLimit } from 'express-rate-limit'
import { config } from './config.js'
import { authenticate, authenticateOptional, login, register } from './auth.js'
import { chat, contextSummary, deleteAllConversations, deleteConversation, history, newConversation, renameConversation, streamChat } from './chat.js'
import { deleteDiagnosis, diagnoseCrop, diagnosisHistory, diagnosisImage, receiveCropImage, supportedCropList } from './cropDoctor.js'
import { analyzeSoil, deleteSoilAnalysis, receiveSoilImage, soilAnalysisDetails, soilAnalysisImage, soilHistory, soilModelStatus } from './soilAnalysis.js'
import {
  completeTask,
  createCropCycle,
  createCustomTask,
  deleteCropCycle,
  deleteTask,
  generateSchedulePreview,
  getCropCycleDetails,
  getDailySummary,
  getFarmExpenses,
  getTaskHistory,
  getTodayTasks,
  getUpcomingTasks,
  getWeatherAlerts,
  listCropCycles,
  listTasks,
  recordFarmExpense,
  recordFertilizer,
  recordIrrigation,
  rescheduleTask,
  skipTask,
  updateCropCycle,
  updateTask,
} from './farmCalendar.js'
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
app.get('/api/chat/context-summary', authenticate, contextSummary)
app.get('/api/chat/history', authenticate, history)
app.delete('/api/chat/history', authenticate, deleteAllConversations)
app.post('/api/chat/new', authenticate, newConversation)
app.put('/api/chat/history/:id', authenticate, renameConversation)
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

// Farm Calendar & Crop Lifecycle Management APIs
app.post('/api/farm-calendar/crop-cycles', authenticate, createCropCycle)
app.get('/api/farm-calendar/crop-cycles', authenticate, listCropCycles)
app.get('/api/farm-calendar/crop-cycles/:id', authenticate, getCropCycleDetails)
app.put('/api/farm-calendar/crop-cycles/:id', authenticate, updateCropCycle)
app.delete('/api/farm-calendar/crop-cycles/:id', authenticate, deleteCropCycle)
app.post('/api/farm-calendar/generate', generateSchedulePreview)
app.get('/api/farm-calendar', authenticate, listTasks)
app.get('/api/farm-calendar/today', authenticate, getTodayTasks)
app.get('/api/farm-calendar/upcoming', authenticate, getUpcomingTasks)
app.post('/api/farm-calendar/tasks', authenticate, createCustomTask)
app.put('/api/farm-calendar/tasks/:id', authenticate, updateTask)
app.delete('/api/farm-calendar/tasks/:id', authenticate, deleteTask)
app.post('/api/farm-calendar/tasks/:id/complete', authenticate, completeTask)
app.post('/api/farm-calendar/tasks/:id/skip', authenticate, skipTask)
app.post('/api/farm-calendar/tasks/:id/reschedule', authenticate, rescheduleTask)
app.get('/api/farm-calendar/weather-alerts', authenticate, getWeatherAlerts)
app.post('/api/farm-calendar/irrigation', authenticate, recordIrrigation)
app.post('/api/farm-calendar/fertilizer', authenticate, recordFertilizer)
app.post('/api/farm-calendar/expenses', authenticate, recordFarmExpense)
app.get('/api/farm-calendar/expenses', authenticate, getFarmExpenses)
app.get('/api/farm-calendar/history', authenticate, getTaskHistory)
app.get('/api/farm-calendar/daily-summary', authenticate, getDailySummary)

app.use((req, res) => res.status(404).json({ error: `No route for ${req.method} ${req.path}` }))
app.use((error, _req, res, _next) => {
  if (res.headersSent) return
  const status = Number.isInteger(error.status) ? error.status : 500
  if (status >= 500 && status !== 503) console.error('API request failed:', error)
  return res.status(status).json({
    error: status === 503 || status === 504 ? error.message : status >= 500 ? 'The server could not complete this request. Check the backend configuration and logs.' : error.message,
    ...(error.details ? { details: error.details } : {}),
  })
})

export default app
