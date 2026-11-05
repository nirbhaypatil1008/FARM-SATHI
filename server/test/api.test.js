import assert from 'node:assert/strict'
import { randomBytes, randomUUID } from 'node:crypto'
import fs from 'node:fs'
import { after, before, test } from 'node:test'

process.env.NODE_ENV = 'test'
process.env.DATABASE_PATH = `./data/test-${process.pid}.sqlite`
process.env.JWT_SECRET = randomBytes(48).toString('base64url')
process.env.GEMINI_API_KEY = ''

const { app } = await import('../src/app.js')
const { database } = await import('../src/db.js')
const { config } = await import('../src/config.js')
const { buildInteractionInput, normalizeGeminiError, parsePlantDiagnosis, retryGeminiCall, retryGeminiStream } = await import('../src/gemini.js')

let server
let baseUrl

before(async () => {
  server = app.listen(0)
  await new Promise((resolve) => server.once('listening', resolve))
  baseUrl = `http://127.0.0.1:${server.address().port}`
})

after(async () => {
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))
  database.close()
  for (const suffix of ['', '-shm', '-wal']) {
    const file = `${config.DATABASE_FILE}${suffix}`
    if (fs.existsSync(file)) fs.rmSync(file)
  }
})

async function request(path, { token, ...options } = {}) {
  return fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      ...(options.body && !(options.body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })
}

async function createAccount(label = 'Crop Doctor Farmer') {
  const response = await request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name: label, email: `${randomBytes(5).toString('hex')}@example.test`, password: 'secure-password-123' }),
  })
  assert.equal(response.status, 201)
  return (await response.json()).token
}

function cropImageForm({ buffer, mime = 'image/png', filename = 'plant.png' }) {
  const form = new FormData()
  form.set('cropName', 'Tomato')
  form.set('observations', 'Spots visible on two leaves.')
  form.set('image', new Blob([buffer], { type: mime }), filename)
  return form
}

function soilImageForm({ buffer, mime = 'image/png', filename = 'soil.png' }) {
  const form = new FormData()
  form.set('cropName', 'Tomato')
  form.set('location', 'Mandya')
  form.set('image', new Blob([buffer], { type: mime }), filename)
  return form
}

async function withAiServiceResponse(body, status, run) {
  const originalFetch = globalThis.fetch
  globalThis.fetch = async (input, options) => {
    const url = typeof input === 'string' ? input : input.url
    if (url.startsWith(config.AI_SERVICE_URL)) {
      return Response.json(body, { status })
    }
    return originalFetch(input, options)
  }
  try {
    return await run()
  } finally {
    globalThis.fetch = originalFetch
  }
}

async function withAiServiceError(error, run) {
  const originalFetch = globalThis.fetch
  globalThis.fetch = async (input, options) => {
    const url = typeof input === 'string' ? input : input.url
    if (url.startsWith(config.AI_SERVICE_URL)) throw error
    return originalFetch(input, options)
  }
  try {
    return await run()
  } finally {
    globalThis.fetch = originalFetch
  }
}

test('health reports SQLite and whether Gemini is configured without exposing credentials', async () => {
  const response = await request('/api/health')
  assert.equal(response.status, 200)
  const body = await response.json()
  assert.equal(body.database, 'connected')
  assert.equal(body.gemini.configured, false)
  assert.equal(JSON.stringify(body).includes('GEMINI_API_KEY'), false)
})

test('Gemini chat retries temporary provider outages and returns safe actionable errors', async () => {
  const unavailable = Object.assign(new Error('Provider unavailable'), { status: 503 })
  const normalized = normalizeGeminiError(unavailable)
  assert.equal(normalized.status, 503)
  assert.match(normalized.message, /temporarily busy/)
  assert.match(normalizeGeminiError(new Error('{"error":{"code":404}}')).message, /configured Gemini model is unavailable/)
  assert.equal(normalizeGeminiError(Object.assign(new Error('High demand'), { code: 'UNAVAILABLE' })).status, 503)

  const interactionInput = buildInteractionInput(
    [{ role: 'user', content: 'Earlier question' }, { role: 'model', content: 'Earlier answer' }],
    'Current question',
    { crops: ['paddy'] },
  )
  assert.deepEqual(interactionInput.slice(0, 2), [
    { type: 'user_input', content: [{ type: 'text', text: 'Earlier question' }] },
    { type: 'model_output', content: [{ type: 'text', text: 'Earlier answer' }] },
  ])
  assert.equal(interactionInput[2].type, 'user_input')
  assert.match(interactionInput[2].content[0].text, /Available farmer context[\s\S]*Current question/)

  let callAttempts = 0
  const callResult = await retryGeminiCall(async () => {
    callAttempts += 1
    if (callAttempts === 1) throw unavailable
    return 'answer'
  })
  assert.equal(callResult, 'answer')
  assert.equal(callAttempts, 2)

  let streamAttempts = 0
  const responseStream = async function* () {
    yield { text: 'answer' }
  }
  const chunks = []
  for await (const chunk of retryGeminiStream(async () => {
    streamAttempts += 1
    if (streamAttempts === 1) throw unavailable
    return responseStream()
  })) chunks.push(chunk.text)
  assert.deepEqual(chunks, ['answer'])
  assert.equal(streamAttempts, 2)

  let partialStreamAttempts = 0
  const partialStream = async function* () {
    yield { text: 'partial' }
    throw unavailable
  }
  const partialChunks = []
  await assert.rejects(async () => {
    for await (const chunk of retryGeminiStream(async () => {
      partialStreamAttempts += 1
      return partialStream()
    })) partialChunks.push(chunk.text)
  }, /temporarily busy/)
  assert.deepEqual(partialChunks, ['partial'])
  assert.equal(partialStreamAttempts, 1)

  let partialInteractionAttempts = 0
  const partialInteractionStream = async function* () {
    yield { event_type: 'step.delta', delta: { type: 'text', text: 'partial' } }
    throw unavailable
  }
  const partialInteractionChunks = []
  await assert.rejects(async () => {
    for await (const chunk of retryGeminiStream(async () => {
      partialInteractionAttempts += 1
      return partialInteractionStream()
    })) partialInteractionChunks.push(chunk)
  }, /temporarily busy/)
  assert.deepEqual(partialInteractionChunks, [{ event_type: 'step.delta', delta: { type: 'text', text: 'partial' } }])
  assert.equal(partialInteractionAttempts, 1)
})

test('registration, login, protected history, and Gemini-missing error work', async () => {
  const email = `farmer-${randomBytes(4).toString('hex')}@example.test`
  const registration = await request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name: 'Test Farmer', email, password: 'secure-password-123' }),
  })
  assert.equal(registration.status, 201)
  const registered = await registration.json()
  assert.ok(registered.token)
  assert.equal(registered.user.email, email)

  const unauthenticated = await request('/api/chat/history')
  assert.equal(unauthenticated.status, 401)

  const guestStream = await request('/api/chat/stream', {
    method: 'POST',
    body: JSON.stringify({ message: 'How do I care for tomatoes?', history: [] }),
  })
  assert.equal(guestStream.status, 200)
  assert.match(await guestStream.text(), /event: error/)

  const login = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password: 'secure-password-123' }),
  })
  assert.equal(login.status, 200)
  const loggedIn = await login.json()

  const newConversation = await request('/api/chat/new', { method: 'POST', token: loggedIn.token })
  assert.equal(newConversation.status, 201)
  const { conversationId } = await newConversation.json()

  const chat = await request('/api/chat', {
    method: 'POST',
    token: loggedIn.token,
    body: JSON.stringify({ conversationId, message: 'How do I care for my crop?', context: { crops: [] } }),
  })
  assert.equal(chat.status, 503)
  assert.match((await chat.json()).error, /GEMINI_API_KEY/)

  const secondConversationResponse = await request('/api/chat/new', { method: 'POST', token: loggedIn.token })
  const secondConversation = await secondConversationResponse.json()
  const streamResponse = await request('/api/chat/stream', {
    method: 'POST',
    token: loggedIn.token,
    body: JSON.stringify({ conversationId: secondConversation.conversationId, message: 'Test streaming error handling.' }),
  })
  assert.equal(streamResponse.status, 200)
  assert.match(await streamResponse.text(), /event: error/)

  const historyResponse = await request('/api/chat/history', { token: loggedIn.token })
  const { conversations } = await historyResponse.json()
  assert.equal(conversations.length, 2)
  const savedConversation = conversations.find((item) => item.id === conversationId)
  assert.ok(savedConversation)
  assert.equal(savedConversation.messages.length, 1)
  assert.equal(savedConversation.messages[0].role, 'user')

  const otherRegistration = await request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name: 'Other Farmer', email: `other-${randomBytes(4).toString('hex')}@example.test`, password: 'another-secure-password' }),
  })
  const other = await otherRegistration.json()
  const otherHistory = await request(`/api/chat/history?conversationId=${conversationId}`, { token: other.token })
  assert.deepEqual((await otherHistory.json()).conversations, [])
  const otherConversation = await request('/api/chat/new', { method: 'POST', token: other.token })
  assert.equal(otherConversation.status, 201)

  const deletedByOther = await request(`/api/chat/history/${conversationId}`, { method: 'DELETE', token: other.token })
  assert.equal(deletedByOther.status, 404)
  const deleted = await request(`/api/chat/history/${conversationId}`, { method: 'DELETE', token: loggedIn.token })
  assert.equal(deleted.status, 204)

  const unauthenticatedClear = await request('/api/chat/history', { method: 'DELETE' })
  assert.equal(unauthenticatedClear.status, 401)
  const cleared = await request('/api/chat/history', { method: 'DELETE', token: loggedIn.token })
  assert.equal(cleared.status, 200)
  assert.equal((await cleared.json()).deleted, 1)
  const clearedHistory = await request('/api/chat/history', { token: loggedIn.token })
  assert.deepEqual((await clearedHistory.json()).conversations, [])
  const otherHistoryAfterClear = await request('/api/chat/history', { token: other.token })
  assert.equal((await otherHistoryAfterClear.json()).conversations.length, 1)
})

test('invalid input receives a useful validation response', async () => {
  const response = await request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name: 'X', email: 'not-an-email', password: 'short' }),
  })
  assert.equal(response.status, 400)
  assert.match((await response.json()).error, /valid email/)
})

test('Crop Doctor rejects unauthenticated, unsupported, malformed, and oversized uploads', async () => {
  const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  const unauthenticated = await request('/api/crop-doctor/diagnose', {
    method: 'POST',
    body: cropImageForm({ buffer: pngSignature }),
  })
  assert.equal(unauthenticated.status, 401)

  const token = await createAccount()
  const unsupported = await request('/api/crop-doctor/diagnose', {
    method: 'POST',
    token,
    body: cropImageForm({ buffer: Buffer.from('not an image'), mime: 'text/plain', filename: 'notes.txt' }),
  })
  assert.equal(unsupported.status, 400)
  assert.match((await unsupported.json()).error, /JPG, PNG, or WEBP/)

  const malformed = await request('/api/crop-doctor/diagnose', {
    method: 'POST',
    token,
    body: cropImageForm({ buffer: Buffer.from('not really a png') }),
  })
  assert.equal(malformed.status, 400)
  assert.match((await malformed.json()).error, /valid image/)

  const oversized = await request('/api/crop-doctor/diagnose', {
    method: 'POST',
    token,
    body: cropImageForm({ buffer: Buffer.alloc(5 * 1024 * 1024 + 1) }),
  })
  assert.equal(oversized.status, 413)

  const modelMissing = await withAiServiceResponse(
    { detail: 'plant_disease_model.keras is not installed.' },
    503,
    () => request('/api/crop-doctor/diagnose', {
      method: 'POST',
      token,
      body: cropImageForm({ buffer: pngSignature }),
    }),
  )
  assert.equal(modelMissing.status, 503)
  assert.match((await modelMissing.json()).error, /plant_disease_model\.keras/)
  const history = await request('/api/crop-doctor/history', { token })
  assert.deepEqual((await history.json()).diagnoses, [])
})

test('Crop Doctor supported-crops endpoint reports readiness and rejects malformed model responses', async () => {
  const supported = await withAiServiceResponse(
    { modelLoaded: false, message: 'Model weights are not installed.', crops: [{ crop: 'Tomato', diseases: ['healthy'] }] },
    200,
    () => request('/api/crop-doctor/supported-crops'),
  )
  assert.equal(supported.status, 200)
  assert.equal((await supported.json()).modelLoaded, false)

  const invalid = await withAiServiceResponse(
    { modelLoaded: true, crops: [{ crop: 42, diseases: [] }] },
    200,
    () => request('/api/crop-doctor/supported-crops'),
  )
  assert.equal(invalid.status, 502)
  assert.match((await invalid.json()).error, /invalid supported-crops response/)
})

test('AI-service connection errors are reported as connection failures or timeouts', async () => {
  const connectionError = new TypeError('fetch failed', {
    cause: Object.assign(new Error('connect failed'), { code: 'ECONNREFUSED' }),
  })
  const unavailable = await withAiServiceError(connectionError, () => request('/api/crop-doctor/supported-crops'))
  assert.equal(unavailable.status, 503)
  const unavailableBody = await unavailable.json()
  assert.match(unavailableBody.error, /refused the connection/)
  assert.match(unavailableBody.error, /AI_SERVICE_URL/)
  assert.equal(unavailableBody.error.includes(config.AI_SERVICE_URL), false)

  const timeoutError = Object.assign(new Error('request timed out'), { name: 'TimeoutError' })
  const timedOut = await withAiServiceError(timeoutError, () => request('/api/soil/status'))
  assert.equal(timedOut.status, 503)
  assert.match((await timedOut.json()).error, /timed out/)
})

test('Crop Doctor validates the model response and saves a private diagnosis history entry', async () => {
  const token = await createAccount('PlantVillage Diagnosis')
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jY7sAAAAASUVORK5CYII=', 'base64')
  const modelResult = {
    success: true,
    crop: 'Tomato',
    predictedDisease: 'Early blight',
    confidence: 0.91,
    status: 'possible_detection',
    topPredictions: [{ crop: 'Tomato', disease: 'Early blight', confidence: 0.91 }],
    modelVersion: '1.0.0-test',
    message: 'Possible visual match, not a confirmed diagnosis.',
    knowledge: {
      available: false,
      symptoms: [],
      possibleCauses: [],
      conduciveConditions: [],
      prevention: [],
      nextSteps: [],
      source: null,
      verifiedAt: null,
    },
  }
  const response = await withAiServiceResponse(modelResult, 200, () => request('/api/crop-doctor/diagnose', {
    method: 'POST',
    token,
    body: cropImageForm({ buffer: png }),
  }))
  assert.equal(response.status, 201)
  const { diagnosis } = await response.json()
  assert.equal(diagnosis.predictionStatus, 'possible_detection')
  assert.equal(diagnosis.diseaseName, 'Early blight')
  assert.equal(diagnosis.modelVersion, '1.0.0-test')

  const historyResponse = await request('/api/crop-doctor/history', { token })
  const { diagnoses } = await historyResponse.json()
  assert.equal(diagnoses.length, 1)
  assert.equal(diagnoses[0].id, diagnosis.id)

  const removed = await request(`/api/crop-doctor/history/${diagnosis.id}`, { method: 'DELETE', token })
  assert.equal(removed.status, 204)

  const savedCount = database.prepare('SELECT COUNT(*) AS count FROM crop_diagnoses').get().count
  const guestPreview = await withAiServiceResponse(modelResult, 200, () => request('/api/crop-doctor/preview', {
    method: 'POST',
    body: cropImageForm({ buffer: png }),
  }))
  assert.equal(guestPreview.status, 200)
  const guestDiagnosis = (await guestPreview.json()).diagnosis
  assert.equal(guestDiagnosis.diseaseName, 'Early blight')
  assert.equal(guestDiagnosis.id, undefined)
  assert.equal(database.prepare('SELECT COUNT(*) AS count FROM crop_diagnoses').get().count, savedCount)

  const invalidModelResponse = await withAiServiceResponse({}, 200, () => request('/api/crop-doctor/diagnose', {
    method: 'POST',
    token,
    body: cropImageForm({ buffer: png }),
  }))
  assert.equal(invalidModelResponse.status, 502)
  assert.match((await invalidModelResponse.json()).error, /invalid response/)
})

test('Soil Vision rejects unauthenticated, unsupported, malformed, and unavailable-model uploads', async () => {
  const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  const unauthenticated = await request('/api/soil/analyze', {
    method: 'POST',
    body: soilImageForm({ buffer: pngSignature }),
  })
  assert.equal(unauthenticated.status, 401)

  const token = await createAccount('Soil Image Farmer')
  const unsupported = await request('/api/soil/analyze', {
    method: 'POST',
    token,
    body: soilImageForm({ buffer: Buffer.from('not an image'), mime: 'text/plain', filename: 'notes.txt' }),
  })
  assert.equal(unsupported.status, 400)
  assert.match((await unsupported.json()).error, /JPG, PNG, or WEBP/)

  const malformed = await request('/api/soil/analyze', {
    method: 'POST',
    token,
    body: soilImageForm({ buffer: Buffer.from('not really a png') }),
  })
  assert.equal(malformed.status, 400)
  assert.match((await malformed.json()).error, /valid image/)

  const unavailable = await withAiServiceResponse(
    { detail: 'Soil model is not installed.' },
    503,
    () => request('/api/soil/analyze', {
      method: 'POST',
      token,
      body: soilImageForm({ buffer: pngSignature }),
    }),
  )
  assert.equal(unavailable.status, 503)
  assert.match((await unavailable.json()).error, /Soil model is not installed/)
  assert.deepEqual((await (await request('/api/soil/history', { token })).json()).analyses, [])
})

test('Soil Vision forwards real-shaped predictions and scopes saved history and images to each farmer', async () => {
  const ownerToken = await createAccount('Soil Analysis Owner')
  const otherToken = await createAccount('Another Soil Farmer')
  const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  const modelResult = {
    success: true,
    predicted_class: 'Type 2',
    confidence: 0.82,
    probabilities: { 'Type 1': 0.1, 'Type 2': 0.82, 'Type 3': 0.08 },
    model_ready: true,
    analysis_type: 'visual_soil_classification',
    model_name: 'MobileNetV2',
    model_version: 'soil-model-test',
    status: 'possible_detection',
    message: 'Possible visual match to a dataset class.',
    limitations: ['Image classification cannot measure exact pH or NPK.'],
    top_predictions: [
      { soilCategory: 'Type 2', confidence: 0.82 },
      { soilCategory: 'Type 1', confidence: 0.1 },
      { soilCategory: 'Type 3', confidence: 0.08 },
    ],
    visual_characteristics: [],
  }
  const response = await withAiServiceResponse(modelResult, 200, () => request('/api/soil/analyze', {
    method: 'POST',
    token: ownerToken,
    body: soilImageForm({ buffer: pngSignature }),
  }))
  assert.equal(response.status, 201)
  const { analysis } = await response.json()
  assert.equal(analysis.predicted_class, 'Type 2')
  assert.equal(analysis.probabilities['Type 2'], 0.82)
  assert.equal(analysis.cropName, 'Tomato')
  assert.equal(analysis.location, 'Mandya')

  const storedCount = database.prepare('SELECT COUNT(*) AS count FROM soil_analyses').get().count
  const guestPreview = await withAiServiceResponse(modelResult, 200, () => request('/api/soil/preview', {
    method: 'POST',
    body: soilImageForm({ buffer: pngSignature }),
  }))
  assert.equal(guestPreview.status, 200)
  const guestAnalysis = (await guestPreview.json()).analysis
  assert.equal(guestAnalysis.predicted_class, 'Type 2')
  assert.equal(guestAnalysis.id, undefined)
  assert.equal(database.prepare('SELECT COUNT(*) AS count FROM soil_analyses').get().count, storedCount)

  const ownerHistory = await request('/api/soil/history', { token: ownerToken })
  const analyses = (await ownerHistory.json()).analyses
  assert.equal(analyses.length, 1)
  assert.equal(analyses[0].id, analysis.id)
  const ownerImage = await request(`/api/soil/history/${analysis.id}/image`, { token: ownerToken })
  assert.equal(ownerImage.status, 200)
  const ownerDetail = await request(`/api/soil/history/${analysis.id}`, { token: ownerToken })
  assert.equal((await ownerDetail.json()).analysis.predicted_class, 'Type 2')

  assert.deepEqual((await (await request('/api/soil/history', { token: otherToken })).json()).analyses, [])
  assert.equal((await request(`/api/soil/history/${analysis.id}`, { token: otherToken })).status, 404)
  assert.equal((await request(`/api/soil/history/${analysis.id}/image`, { token: otherToken })).status, 404)
  assert.equal((await request(`/api/soil/history/${analysis.id}`, { method: 'DELETE', token: otherToken })).status, 404)
  assert.equal((await request(`/api/soil/history/${analysis.id}`, { method: 'DELETE', token: ownerToken })).status, 204)
})

test('Soil Vision status proxy reports readiness and rejects malformed AI-service responses', async () => {
  const status = await withAiServiceResponse(
    { model_loaded: false, model_name: 'MobileNetV2', model_version: null, class_count: 0, message: 'Soil model is missing.' },
    200,
    () => request('/api/soil/status'),
  )
  assert.equal(status.status, 200)
  assert.equal((await status.json()).model_loaded, false)

  const invalid = await withAiServiceResponse(
    { model_loaded: 'yes' },
    200,
    () => request('/api/soil/status'),
  )
  assert.equal(invalid.status, 502)
  assert.match((await invalid.json()).error, /invalid soil readiness/)
})

test('Crop Doctor history, images, and deletion are scoped to the authenticated farmer', async () => {
  const ownerToken = await createAccount('Diagnosis Owner')
  const otherToken = await createAccount('Other Farmer')
  const owner = await request('/api/auth/me', { token: ownerToken })
  const { user } = await owner.json()
  const diagnosisId = randomUUID()
  const result = {
    assessment: 'uncertain',
    plantName: 'Tomato',
    diseaseName: 'Unable to determine from this image',
    confidence: 20,
    severity: 'unknown',
  }
  database.prepare(`
    INSERT INTO crop_diagnoses
      (id, user_id, crop_name, disease_name, image_filename, image_mime_type, confidence, severity, result_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(diagnosisId, user.id, 'Tomato', result.diseaseName, `${diagnosisId}.png`, 'image/png', result.confidence, result.severity, JSON.stringify(result))

  const ownerHistory = await request('/api/crop-doctor/history', { token: ownerToken })
  const ownerDiagnoses = (await ownerHistory.json()).diagnoses
  assert.equal(ownerDiagnoses.length, 1)
  assert.equal(ownerDiagnoses[0].id, diagnosisId)
  assert.equal(ownerDiagnoses[0].diseaseName, result.diseaseName)

  const otherHistory = await request('/api/crop-doctor/history', { token: otherToken })
  assert.deepEqual((await otherHistory.json()).diagnoses, [])
  const otherImage = await request(`/api/crop-doctor/history/${diagnosisId}/image`, { token: otherToken })
  assert.equal(otherImage.status, 404)
  const otherDelete = await request(`/api/crop-doctor/history/${diagnosisId}`, { method: 'DELETE', token: otherToken })
  assert.equal(otherDelete.status, 404)

  const ownerDelete = await request(`/api/crop-doctor/history/${diagnosisId}`, { method: 'DELETE', token: ownerToken })
  assert.equal(ownerDelete.status, 204)
})

test('Crop Doctor structures uncertain model responses and strips unsafe treatment advice', () => {
  const assessment = {
    assessment: 'identified',
    plantName: 'Tomato',
    diseaseName: 'Possible leaf spot',
    confidence: 35,
    severity: 'moderate',
    symptoms: ['Small brown spots are visible.'],
    visibleSigns: ['Spots on the photographed leaf.'],
    possibleCauses: ['Several causes can look similar.'],
    conduciveConditions: ['High humidity may contribute.'],
    immediateActions: ['Apply fungicide at 5 ml per litre.'],
    farmingPractices: ['Improve airflow and avoid overhead irrigation.'],
    organicOptions: ['Use a plant spray.'],
    prevention: ['Clean field tools between plants.'],
    irrigationAndSoil: ['Avoid waterlogging.'],
    preventSpread: ['Avoid handling wet foliage.'],
    reinspectInDays: 5,
    professionalHelp: ['Consult a local extension officer.'],
  }
  const result = parsePlantDiagnosis(JSON.stringify(assessment))
  assert.equal(result.assessment, 'uncertain')
  assert.equal(result.diseaseName, 'Unable to determine from this image')
  assert.equal(result.confidence, 35)
  assert.equal(result.severity, 'unknown')
  assert.deepEqual(result.symptoms, [])
  assert.deepEqual(result.immediateActions, ['Take a closer, well-lit photo of one affected leaf and the whole plant.'])

  assessment.confidence = 80
  const identified = parsePlantDiagnosis(JSON.stringify(assessment))
  assert.equal(identified.assessment, 'identified')
  assert.deepEqual(identified.immediateActions, [])
  assert.deepEqual(identified.organicOptions, [])
  assert.deepEqual(identified.farmingPractices, ['Improve airflow and avoid overhead irrigation.'])
  assert.throws(() => parsePlantDiagnosis('not json'), /invalid result/)
})
