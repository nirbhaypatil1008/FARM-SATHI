import test from 'node:test'
import assert from 'node:assert/strict'
import { answerLocally, detectIntent } from '../src/localAssistant.js'

const context = {
  farmer: { name: 'Ravi', soilType: 'Red', waterSource: 'Low / rain-fed' },
  soilAnalyzer: { latestReports: 'No soil test image has been analyzed yet for this farmer.' },
  plantAnalyzer: { latestDiagnoses: 'none' },
  activeCrops: [],
  farmCalendar: {
    todayActivities: [{ title: 'Irrigate tomato field', crop_name: 'Tomato', scheduled_date: '2026-11-06', activity_type: 'irrigation', priority: 'high' }],
    overdueActivities: 'No overdue activities.',
    upcoming7Days: 'none',
  },
  weather: null,
  recentExpenses: [],
}

test('local assistant detects common intents with word boundaries', () => {
  assert.equal(detectIntent('What are my tasks today?').intent.id, 'tasks')
  assert.equal(detectIntent('Will it rain this week?').intent.id, 'weather')
  assert.equal(detectIntent('how to clean the drain').intent, null)
  assert.equal(detectIntent('Tips for growing tomatoes').crop.key, 'tomato')
  assert.equal(detectIntent('ಇಂದಿನ ಕೆಲಸಗಳು ಯಾವುವು?').intent.id, 'tasks')
  assert.ok(detectIntent('Compare rice and ragi in detail for my farm').deep)
})

test('local assistant answers from real records and never invents missing data', () => {
  const tasks = answerLocally({ message: 'What are my tasks today?', context })
  assert.match(tasks.reply, /Irrigate tomato field/)
  const soil = answerLocally({ message: 'Show my soil report', context })
  assert.match(soil.reply, /not analyzed a soil photo/)
  const weather = answerLocally({ message: 'How is the weather?', context })
  assert.match(weather.reply, /not available/)
  const crops = answerLocally({ message: 'Which crop should I plant now?', context })
  assert.match(crops.reply, /Crop suggestions/)
  assert.ok(crops.suggestions.length > 0)
})

test('deep or unmatched questions are routed to the AI model', () => {
  assert.equal(answerLocally({ message: 'Compare rice and ragi in detail for my farm', context }), null)
  assert.equal(answerLocally({ message: 'Tell me a story', context }), null)
  assert.equal(answerLocally({ message: 'What are my tasks today?', context, mode: 'deep' }), null)
  assert.match(answerLocally({ message: 'Tell me a story', context, mode: 'quick' }).reply, /Deep \(AI\)/)
})

