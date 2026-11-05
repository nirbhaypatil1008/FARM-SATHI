import assert from 'node:assert/strict'
import { randomBytes } from 'node:crypto'
import fs from 'node:fs'
import { after, before, test } from 'node:test'

process.env.NODE_ENV = 'test'
process.env.DATABASE_PATH = `./data/test-${process.pid}.sqlite`
process.env.JWT_SECRET = randomBytes(48).toString('base64url')
process.env.GEMINI_API_KEY = ''

const { app } = await import('../src/app.js')
const { database } = await import('../src/db.js')
const { config } = await import('../src/config.js')

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
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })
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
