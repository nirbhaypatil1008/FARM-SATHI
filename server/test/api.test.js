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
const { parsePlantDiagnosis } = await import('../src/gemini.js')

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

test('health reports SQLite and whether Gemini is configured without exposing credentials', async () => {
  const response = await request('/api/health')
  assert.equal(response.status, 200)
  const body = await response.json()
  assert.equal(body.database, 'connected')
  assert.equal(body.gemini.configured, false)
  assert.equal(JSON.stringify(body).includes('GEMINI_API_KEY'), false)
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

  const deletedByOther = await request(`/api/chat/history/${conversationId}`, { method: 'DELETE', token: other.token })
  assert.equal(deletedByOther.status, 404)
  const deleted = await request(`/api/chat/history/${conversationId}`, { method: 'DELETE', token: loggedIn.token })
  assert.equal(deleted.status, 204)
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

  const invalidModelResponse = await withAiServiceResponse({}, 200, () => request('/api/crop-doctor/diagnose', {
    method: 'POST',
    token,
    body: cropImageForm({ buffer: png }),
  }))
  assert.equal(invalidModelResponse.status, 502)
  assert.match((await invalidModelResponse.json()).error, /invalid response/)
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
