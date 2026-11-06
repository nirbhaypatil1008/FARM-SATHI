import assert from 'node:assert/strict'
import { randomBytes } from 'node:crypto'
import fs from 'node:fs'
import { after, before, test } from 'node:test'

process.env.NODE_ENV = 'test'
process.env.DATABASE_PATH = `./data/test-calendar-${process.pid}.sqlite`
process.env.JWT_SECRET = randomBytes(48).toString('base64url')

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
      ...(options.body && !(options.body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })
}

test('Farm Calendar: Reject unauthenticated requests', async () => {
  const res = await request('/api/farm-calendar/crop-cycles', {
    method: 'POST',
    body: JSON.stringify({ cropName: 'Maize' }),
  })
  assert.equal(res.status, 401)
})

test('Farm Calendar: Generate Schedule Preview without auth', async () => {
  const res = await request('/api/farm-calendar/generate', {
    method: 'POST',
    body: JSON.stringify({
      cropName: 'Maize',
      sowingDate: '2026-10-01',
      farmArea: 2.5,
      soilType: 'Black',
      irrigationType: 'Drip',
    }),
  })
  assert.equal(res.status, 200)
  const data = await res.json()
  assert.ok(data.preview)
  assert.equal(data.preview.cropName, 'Maize (Corn)')
  assert.ok(data.preview.tasks.length >= 8)
  assert.ok(data.preview.stages.length >= 5)
})

test('Farm Calendar: End-to-end Crop Cycle lifecycle & task workflow', async () => {
  // 1. Register a test farmer
  const email = `farmer-calendar-${Date.now()}@example.com`
  const regRes = await request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name: 'Kisan Ramesh', email, password: 'SecurePassword123!' }),
  })
  assert.equal(regRes.status, 201)
  const { token } = await regRes.json()
  assert.ok(token)

  // 2. Create Crop Cycle (Maize)
  const cycleRes = await request('/api/farm-calendar/crop-cycles', {
    method: 'POST',
    token,
    body: JSON.stringify({
      cropName: 'Maize',
      cropVariety: 'Kargil 900M',
      fieldName: 'North Plot A',
      farmArea: 3.0,
      sowingDate: '2026-10-01',
      soilType: 'Loamy',
      irrigationType: 'Drip',
    }),
  })
  assert.equal(cycleRes.status, 201)
  const cycleData = await cycleRes.json()
  assert.ok(cycleData.success)
  assert.equal(cycleData.cropCycle.crop_name, 'Maize (Corn)')
  assert.ok(cycleData.taskCount >= 8)

  const cycleId = cycleData.cropCycle.id

  // 3. List farmer's crop cycles
  const listRes = await request('/api/farm-calendar/crop-cycles', {
    method: 'GET',
    token,
  })
  assert.equal(listRes.status, 200)
  const listData = await listRes.json()
  assert.ok(listData.cropCycles.length >= 1)
  assert.equal(listData.cropCycles[0].id, cycleId)

  // 4. List tasks for this cycle
  const tasksRes = await request(`/api/farm-calendar?cropCycleId=${cycleId}`, {
    method: 'GET',
    token,
  })
  assert.equal(tasksRes.status, 200)
  const { tasks } = await tasksRes.json()
  assert.ok(tasks.length >= 8)
  const firstTask = tasks[0]

  // 5. Complete a task
  const completeRes = await request(`/api/farm-calendar/tasks/${firstTask.id}/complete`, {
    method: 'POST',
    token,
    body: JSON.stringify({ notes: 'Ploughed deeply with tractor rotavator.' }),
  })
  assert.equal(completeRes.status, 200)
  const completeData = await completeRes.json()
  assert.equal(completeData.task.status, 'completed')

  // 6. Reschedule a task
  const secondTask = tasks[1]
  const newDate = '2026-10-05'
  const rescheduleRes = await request(`/api/farm-calendar/tasks/${secondTask.id}/reschedule`, {
    method: 'POST',
    token,
    body: JSON.stringify({ newDate, reason: 'Rain delayed manure spreading' }),
  })
  assert.equal(rescheduleRes.status, 200)
  const rescheduleData = await rescheduleRes.json()
  assert.equal(rescheduleData.task.status, 'rescheduled')
  assert.equal(rescheduleData.task.scheduled_date, newDate)

  // 7. Record an actual irrigation event
  const irrRes = await request('/api/farm-calendar/irrigation', {
    method: 'POST',
    token,
    body: JSON.stringify({
      taskId: secondTask.id,
      cropCycleId: cycleId,
      method: 'Drip',
      durationMinutes: 90,
      notes: 'Applied 4500L via drip emitters',
    }),
  })
  assert.equal(irrRes.status, 201)

  // 8. Record an actual fertilizer application
  const fertRes = await request('/api/farm-calendar/fertilizer', {
    method: 'POST',
    token,
    body: JSON.stringify({
      cropCycleId: cycleId,
      fertilizerName: 'Urea (Nitrogen)',
      quantity: 50,
      unit: 'kg',
      method: 'Side placement',
    }),
  })
  assert.equal(fertRes.status, 201)

  // 9. Record a farm expense
  const expRes = await request('/api/farm-calendar/expenses', {
    method: 'POST',
    token,
    body: JSON.stringify({
      cropCycleId: cycleId,
      category: 'Seeds',
      cropName: 'Maize',
      amount: 4500,
      date: '2026-10-01',
      notes: 'Purchased 8kg Kargil hybrid seed',
    }),
  })
  assert.equal(expRes.status, 201)

  // 10. Check expenses summary
  const expListRes = await request('/api/farm-calendar/expenses', {
    method: 'GET',
    token,
  })
  assert.equal(expListRes.status, 200)
  const expListData = await expListRes.json()
  assert.equal(expListData.totalAmount, 4500)

  // 11. Check audit log / task history
  const histRes = await request('/api/farm-calendar/history', {
    method: 'GET',
    token,
  })
  assert.equal(histRes.status, 200)
  const histData = await histRes.json()
  assert.ok(histData.history.length >= 3)

  // 12. Check Daily Summary
  const summaryRes = await request('/api/farm-calendar/daily-summary', {
    method: 'GET',
    token,
  })
  assert.equal(summaryRes.status, 200)
  const summaryData = await summaryRes.json()
  assert.ok(summaryData.today)
  assert.ok(Array.isArray(summaryData.activeStages))

  // 13. Weather alerts & conflict detection
  const weatherRes = await request('/api/farm-calendar/weather-alerts?location=Mandya', {
    method: 'GET',
    token,
  })
  assert.equal(weatherRes.status, 200)
  const weatherData = await weatherRes.json()
  assert.ok(weatherData.forecast)
  assert.ok(Array.isArray(weatherData.conflicts))
})
