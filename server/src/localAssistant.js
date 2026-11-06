/**
 * FARM-SAATHI built-in assistant.
 *
 * Answers common farmer questions instantly without calling any external AI API.
 * Answers are built from the farmer's real records (calendar, soil, plant doctor,
 * weather, expenses) plus a small, conservative crop knowledge base.
 * Deep / open-ended questions return null so the caller can use Gemini instead.
 *
 * Rules followed: never invent soil measurements, exact fertilizer doses,
 * irrigation volumes, prices or weather values.
 */

// ---------------------------------------------------------------------------
// Crop knowledge base (general agronomy; durations are typical ranges)
// ---------------------------------------------------------------------------
const CROPS = [
  {
    key: 'rice', name: 'Rice (Paddy)', aliases: ['rice', 'paddy', 'dhan', 'धान', 'चावल', 'ಭತ್ತ', 'ಅಕ್ಕಿ'],
    seasons: ['kharif', 'rabi'], duration: '110–150 days (variety dependent)', water: 'high',
    soils: ['clay', 'loamy', 'alluvial', 'black'],
    tips: [
      'Use healthy nursery seedlings 20–25 days old for transplanting.',
      'Keep shallow standing water during tillering; drain the field 10–15 days before harvest.',
      'Watch for stem borer, leaf folder and blast disease, especially in humid weather.',
      'Apply nitrogen in splits (basal, tillering, panicle initiation) as per your soil test card.',
    ],
  },
  {
    key: 'wheat', name: 'Wheat', aliases: ['wheat', 'gehu', 'gehun', 'गेहूं', 'गेहूँ', 'ಗೋಧಿ'],
    seasons: ['rabi'], duration: '110–130 days', water: 'medium',
    soils: ['loamy', 'alluvial', 'clay', 'black'],
    tips: [
      'Sow in November for most plains regions; late sowing reduces yield.',
      'Critical irrigation stage: crown root initiation (about 20–25 days after sowing).',
      'Other important irrigation stages: tillering, flowering and grain filling.',
      'Watch for rust (yellow/brown streaks on leaves) in cool, humid weather.',
    ],
  },
  {
    key: 'maize', name: 'Maize', aliases: ['maize', 'corn', 'makka', 'मक्का', 'ಮೆಕ್ಕೆಜೋಳ'],
    seasons: ['kharif', 'rabi', 'zaid'], duration: '90–120 days', water: 'medium',
    soils: ['loamy', 'alluvial', 'red', 'black'],
    tips: [
      'Needs good drainage — waterlogging even for 1–2 days can damage young plants.',
      'Critical water stages: knee-high, tasseling and silking.',
      'Scout regularly for Fall Armyworm (holes in leaf whorl, sawdust-like frass).',
    ],
  },
  {
    key: 'ragi', name: 'Ragi (Finger millet)', aliases: ['ragi', 'finger millet', 'nachni', 'मडुआ', 'रागी', 'ರಾಗಿ'],
    seasons: ['kharif', 'rabi'], duration: '100–120 days', water: 'low',
    soils: ['red', 'loamy', 'sandy', 'laterite'],
    tips: [
      'Hardy and drought tolerant — a good choice when water is limited.',
      'Keep the field weed-free for the first 30–40 days.',
      'Watch for blast disease (spindle-shaped spots on leaves and neck).',
    ],
  },
  {
    key: 'tomato', name: 'Tomato', aliases: ['tomato', 'tamatar', 'टमाटर', 'ಟೊಮೆಟೊ', 'ಟೊಮ್ಯಾಟೊ'],
    seasons: ['kharif', 'rabi', 'zaid'], duration: '90–120 days after transplanting', water: 'medium',
    soils: ['loamy', 'red', 'sandy', 'alluvial'],
    tips: [
      'Transplant 25–30 day old seedlings; stake or trellis plants for better fruit quality.',
      'Water regularly and evenly — irregular watering causes fruit cracking and blossom-end rot.',
      'Drip irrigation with mulching saves water and reduces disease.',
      'Watch for early blight, leaf curl virus (spread by whitefly) and fruit borer.',
    ],
  },
  {
    key: 'sugarcane', name: 'Sugarcane', aliases: ['sugarcane', 'ganna', 'गन्ना', 'ಕಬ್ಬು'],
    seasons: ['zaid', 'kharif'], duration: '10–18 months', water: 'high',
    soils: ['loamy', 'black', 'alluvial', 'clay'],
    tips: [
      'Use healthy, disease-free setts from a reliable nursery.',
      'Trash mulching conserves moisture; drip irrigation can save significant water.',
      'Earthing up at 90–120 days supports the cane and prevents lodging.',
    ],
  },
  {
    key: 'cotton', name: 'Cotton', aliases: ['cotton', 'kapas', 'कपास', 'ಹತ್ತಿ'],
    seasons: ['kharif'], duration: '150–180 days', water: 'medium',
    soils: ['black', 'loamy', 'alluvial'],
    tips: [
      'Best on deep black soils with good drainage.',
      'Monitor pink bollworm with pheromone traps from flowering onward.',
      'Avoid excess nitrogen — it encourages pests and vegetative growth.',
    ],
  },
  {
    key: 'groundnut', name: 'Groundnut', aliases: ['groundnut', 'peanut', 'moongphali', 'मूंगफली', 'ಶೇಂಗಾ', 'ಕಡಲೆಕಾಯಿ'],
    seasons: ['kharif', 'rabi', 'zaid'], duration: '100–130 days', water: 'low',
    soils: ['sandy', 'red', 'loamy'],
    tips: [
      'Light, well-drained soils help pod development.',
      'Gypsum at flowering/pegging improves pod filling (dose as per local recommendation).',
      'Critical water stages: flowering, pegging and pod development.',
    ],
  },
  {
    key: 'onion', name: 'Onion', aliases: ['onion', 'pyaz', 'pyaaz', 'प्याज', 'ಈರುಳ್ಳಿ'],
    seasons: ['kharif', 'rabi'], duration: '100–150 days', water: 'medium',
    soils: ['loamy', 'alluvial', 'red'],
    tips: [
      'Shallow roots — needs frequent, light irrigation.',
      'Stop irrigation 10–15 days before harvest for better storage life.',
      'Watch for thrips and purple blotch in humid weather.',
    ],
  },
  {
    key: 'chilli', name: 'Chilli', aliases: ['chilli', 'chili', 'mirchi', 'मिर्च', 'ಮೆಣಸಿನಕಾಯಿ'],
    seasons: ['kharif', 'rabi'], duration: '150–180 days', water: 'medium',
    soils: ['loamy', 'black', 'red'],
    tips: [
      'Avoid waterlogging — it causes wilt and root rot.',
      'Watch for leaf curl (thrips/mites) and fruit rot.',
      'Yellow and blue sticky traps help monitor sucking pests.',
    ],
  },
  {
    key: 'potato', name: 'Potato', aliases: ['potato', 'aloo', 'आलू', 'ಆಲೂಗಡ್ಡೆ'],
    seasons: ['rabi'], duration: '90–120 days', water: 'medium',
    soils: ['loamy', 'sandy', 'alluvial'],
    tips: [
      'Use certified, disease-free seed tubers.',
      'Earthing up 25–30 days after planting protects tubers from greening.',
      'Late blight spreads fast in cool, cloudy, humid weather — scout often.',
    ],
  },
  {
    key: 'soybean', name: 'Soybean', aliases: ['soybean', 'soyabean', 'soya', 'सोयाबीन', 'ಸೋಯಾಬೀನ್'],
    seasons: ['kharif'], duration: '90–110 days', water: 'medium',
    soils: ['black', 'loamy', 'clay'],
    tips: [
      'Seed treatment with Rhizobium culture improves nitrogen fixation.',
      'Needs good drainage; avoid waterlogged fields.',
      'Watch for girdle beetle and yellow mosaic virus.',
    ],
  },
  {
    key: 'banana', name: 'Banana', aliases: ['banana', 'kela', 'केला', 'ಬಾಳೆ'],
    seasons: ['kharif', 'zaid'], duration: '11–15 months', water: 'high',
    soils: ['loamy', 'alluvial', 'clay'],
    tips: [
      'Use tissue-culture plantlets for uniform, disease-free crop.',
      'Drip irrigation with mulching works very well.',
      'Remove side suckers regularly and prop plants during bunch formation.',
    ],
  },
  {
    key: 'pulses', name: 'Pulses (Tur / Moong / Urad / Chana)', aliases: ['pulse', 'pulses', 'tur', 'toor', 'arhar', 'moong', 'urad', 'chana', 'gram', 'दाल', 'अरहर', 'चना', 'ತೊಗರಿ', 'ಹೆಸರು', 'ಕಡಲೆ'],
    seasons: ['kharif', 'rabi', 'zaid'], duration: '60–180 days (crop dependent)', water: 'low',
    soils: ['loamy', 'black', 'red', 'sandy'],
    tips: [
      'Pulses fix nitrogen and improve soil fertility for the next crop.',
      'Rhizobium seed treatment is low-cost and effective.',
      'Avoid waterlogging; most pulses prefer well-drained soils.',
    ],
  },
]

// ---------------------------------------------------------------------------
// Small translation table for data-driven answers
// ---------------------------------------------------------------------------
const T = {
  hello: {
    en: (n) => `Namaste ${n}! 🙏 I'm FARM-SAATHI, your farm assistant.`,
    hi: (n) => `नमस्ते ${n}! 🙏 मैं FARM-SAATHI हूँ, आपका खेती सहायक।`,
    kn: (n) => `ನಮಸ್ಕಾರ ${n}! 🙏 ನಾನು FARM-SAATHI, ನಿಮ್ಮ ಕೃಷಿ ಸಹಾಯಕ.`,
  },
  helpLine: {
    en: 'You can ask me about today\'s tasks, weather, irrigation, your soil report, plant diseases, fertilizers, crop choice and schemes.',
    hi: 'आप मुझसे आज के काम, मौसम, सिंचाई, मिट्टी रिपोर्ट, पौधों के रोग, खाद, फसल चयन और सरकारी योजनाओं के बारे में पूछ सकते हैं।',
    kn: 'ಇಂದಿನ ಕೆಲಸಗಳು, ಹವಾಮಾನ, ನೀರಾವರಿ, ಮಣ್ಣಿನ ವರದಿ, ಬೆಳೆ ರೋಗ, ಗೊಬ್ಬರ, ಬೆಳೆ ಆಯ್ಕೆ ಮತ್ತು ಯೋಜನೆಗಳ ಬಗ್ಗೆ ಕೇಳಬಹುದು.',
  },
  thanks: {
    en: 'You\'re welcome! 🌾 Ask me anything else about your farm anytime.',
    hi: 'आपका स्वागत है! 🌾 खेती से जुड़ा कुछ भी पूछें।',
    kn: 'ಸ್ವಾಗತ! 🌾 ನಿಮ್ಮ ಕೃಷಿ ಬಗ್ಗೆ ಏನಾದರೂ ಕೇಳಿ.',
  },
  todayTitle: { en: '📅 Today\'s farm tasks', hi: '📅 आज के खेत के काम', kn: '📅 ಇಂದಿನ ಕೃಷಿ ಕೆಲಸಗಳು' },
  noToday: { en: 'No pending tasks are scheduled for today.', hi: 'आज के लिए कोई काम निर्धारित नहीं है।', kn: 'ಇಂದು ಯಾವುದೇ ಬಾಕಿ ಕೆಲಸ ನಿಗದಿಯಾಗಿಲ್ಲ.' },
  overdueTitle: { en: '⚠️ Overdue', hi: '⚠️ बकाया काम', kn: '⚠️ ತಡವಾದ ಕೆಲಸಗಳು' },
  upcomingTitle: { en: '🗓️ Next 7 days', hi: '🗓️ अगले 7 दिन', kn: '🗓️ ಮುಂದಿನ 7 ದಿನಗಳು' },
  noCalendar: {
    en: 'Your Farm Calendar has no crop schedule yet. Add a crop in **Farm calendar** and I will track daily tasks for you.',
    hi: 'आपके फार्म कैलेंडर में अभी कोई फसल नहीं है। **Farm calendar** में फसल जोड़ें, मैं रोज़ के काम बताऊँगा।',
    kn: 'ನಿಮ್ಮ ಫಾರ್ಮ್ ಕ್ಯಾಲೆಂಡರ್‌ನಲ್ಲಿ ಇನ್ನೂ ಬೆಳೆ ಇಲ್ಲ. **Farm calendar** ನಲ್ಲಿ ಬೆಳೆ ಸೇರಿಸಿ.',
  },
  weatherTitle: { en: '⛅ Weather at your farm', hi: '⛅ आपके खेत का मौसम', kn: '⛅ ನಿಮ್ಮ ಜಮೀನಿನ ಹವಾಮಾನ' },
  noWeather: {
    en: 'Live weather is not available right now. Please check the **Weather** page or try again shortly — I will not guess weather values.',
    hi: 'अभी लाइव मौसम उपलब्ध नहीं है। कृपया **Weather** पेज देखें — मैं अनुमान से मौसम नहीं बताऊँगा।',
    kn: 'ಈಗ ಲೈವ್ ಹವಾಮಾನ ಲಭ್ಯವಿಲ್ಲ. ದಯವಿಟ್ಟು **Weather** ಪುಟ ನೋಡಿ.',
  },
  soilTitle: { en: '🌱 Your latest soil analysis', hi: '🌱 आपकी नवीनतम मिट्टी जांच', kn: '🌱 ನಿಮ್ಮ ಇತ್ತೀಚಿನ ಮಣ್ಣಿನ ವಿಶ್ಲೇಷಣೆ' },
  noSoil: {
    en: 'You have not analyzed a soil photo yet. Open **Water & soil** to upload a soil image. For exact pH and NPK values, get a free Soil Health Card test from your nearest Krishi Vigyan Kendra.',
    hi: 'आपने अभी तक मिट्टी की फोटो जांच नहीं की है। **Water & soil** में फोटो अपलोड करें। सटीक pH और NPK के लिए नज़दीकी कृषि विज्ञान केंद्र से सॉयल हेल्थ कार्ड जांच कराएँ।',
    kn: 'ನೀವು ಇನ್ನೂ ಮಣ್ಣಿನ ಫೋಟೋ ವಿಶ್ಲೇಷಿಸಿಲ್ಲ. **Water & soil** ನಲ್ಲಿ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ. ನಿಖರ pH ಮತ್ತು NPK ಗಾಗಿ ಹತ್ತಿರದ ಕೃಷಿ ವಿಜ್ಞಾನ ಕೇಂದ್ರದಲ್ಲಿ ಮಣ್ಣು ಪರೀಕ್ಷೆ ಮಾಡಿಸಿ.',
  },
  plantTitle: { en: '🩺 Your latest Crop Doctor result', hi: '🩺 आपका नवीनतम क्रॉप डॉक्टर परिणाम', kn: '🩺 ನಿಮ್ಮ ಇತ್ತೀಚಿನ ಕ್ರಾಪ್ ಡಾಕ್ಟರ್ ಫಲಿತಾಂಶ' },
}

const tr = (key, lang, ...args) => {
  const entry = T[key]
  if (!entry) return ''
  const value = entry[lang] || entry.en
  return typeof value === 'function' ? value(...args) : value
}

// ---------------------------------------------------------------------------
// Intent detection
// ---------------------------------------------------------------------------
// English keywords are matched on word boundaries; regional-script keywords as substrings.
const kw = (english, regional = []) => new RegExp(`\\b(?:${english.join('|')})\\b${regional.length ? `|${regional.join('|')}` : ''}`)

const INTENTS = [
  { id: 'greeting', kind: 'data', re: /^(hi+|hello|hey|namaste|namaskar|good (morning|afternoon|evening))\b|^(नमस्ते|नमस्कार|ನಮಸ್ಕಾರ|ಹಲೋ|வணக்கம்|నమస్కారం)/ },
  { id: 'thanks', kind: 'data', re: kw(['thanks?', 'thank you', 'thx', 'dhanyavad'], ['धन्यवाद', 'शुक्रिया', 'ಧನ್ಯವಾದ']) },
  { id: 'help', kind: 'data', re: kw(['what can you do', 'how can you help', 'help', 'who are you', 'your features'], ['मदद', 'ಸಹಾಯ']) },
  { id: 'tasks', kind: 'data', re: kw(['today', 'todo', 'tasks?', 'work to do', 'calendar', 'schedule', 'due', 'overdue', 'what should i do'], ['आज', 'काम', 'ಇಂದು', 'ಕೆಲಸ']) },
  { id: 'weather', kind: 'data', re: kw(['weather', 'rain', 'rains', 'raining', 'rainfall', 'forecast', 'temperature', 'humidity', 'humid', 'wind', 'windy', 'storm'], ['मौसम', 'बारिश', 'तापमान', 'ಹವಾಮಾನ', 'ಮಳೆ', 'ತಾಪಮಾನ']) },
  { id: 'irrigation', kind: 'data', re: kw(['irrigat\\w*', 'watering', 'water my', 'when to water', 'how often[\\w ]* water', 'drip', 'sprinkler'], ['सिंचाई', 'पानी', 'ನೀರಾವರಿ', 'ನೀರು']) },
  { id: 'soil', kind: 'data', re: kw(['soil report', 'my soil', 'soil test', 'soil analys\\w*', 'soil type', 'soil health', 'soil'], ['मिट्टी', 'ಮಣ್ಣು']) },
  { id: 'plant', kind: 'data', re: kw(['crop doctor', 'plant doctor', 'diagnos\\w*', 'my plants?', 'plant health', 'diseases?', 'infect\\w*', 'blight', 'fung\\w*', 'spots?'], ['रोग', 'बीमारी', 'ರೋಗ']) },
  { id: 'yellow', kind: 'knowledge', re: kw(['yellow\\w*', 'pale leaves', 'chlorosis'], ['पीली', 'पीले', 'ಹಳದಿ']) },
  { id: 'pest', kind: 'knowledge', re: kw(['pests?', 'insects?', 'aphids?', 'whitefly', 'worms?', 'caterpillars?', 'borers?', 'thrips', 'mites?', 'armyworm'], ['कीट', 'कीड़े', 'ಕೀಟ', 'ಹುಳು']) },
  { id: 'fertilizer', kind: 'knowledge', re: kw(['fertili[sz]\\w*', 'urea', 'npk', 'dap', 'potash', 'manure', 'nutrients?'], ['खाद', 'उर्वरक', 'ಗೊಬ್ಬರ', 'ರಸಗೊಬ್ಬರ']) },
  { id: 'organic', kind: 'knowledge', re: kw(['organic', 'natural farming', 'jeevamrut\\w*', 'jivamrut\\w*', 'vermi\\w*', 'compost', 'soil fertility', 'improve (my |the )?soil'], ['जैविक', 'ಸಾವಯವ']) },
  { id: 'recommend', kind: 'data', re: kw(['which crops?', 'what crops?', 'best crops?', 'what (should|can) i (plant|sow|grow)', 'what to (plant|sow|grow)', 'suitable crops?', 'crop suggestions?', 'recommend\\w*[\\w ]* crops?', 'crops? suits?'], ['कौन सी फसल', 'क्या बोएं', 'ಯಾವ ಬೆಳೆ']) },
  { id: 'mycrops', kind: 'data', re: kw(['my crops?', 'crop status', 'growth stage', 'harvest date', 'when[\\w ]* harvest', 'days after sowing'], ['मेरी फसल', 'ನನ್ನ ಬೆಳೆ']) },
  { id: 'expenses', kind: 'data', re: kw(['expenses?', 'spent', 'spending', 'costs?'], ['खर्च', 'ಖರ್ಚು']) },
  { id: 'schemes', kind: 'knowledge', re: kw(['schemes?', 'subsid\\w*', 'pm[- ]?kisan', 'insurance', 'pmfby', 'loans?', 'kcc', 'kisan credit', 'yojana'], ['योजना', 'बीमा', 'ऋण', 'ಯೋಜನೆ', 'ಸಾಲ', 'ವಿಮೆ']) },
  { id: 'price', kind: 'knowledge', re: kw(['prices?', 'mandi', 'market rates?', 'selling rates?'], ['भाव', 'मंडी', 'ದರ', 'ಮಾರುಕಟ್ಟೆ']) },
  { id: 'heavyrain', kind: 'knowledge', re: kw(['heavy rain\\w*', 'flood\\w*', 'waterlog\\w*', 'excess rain'], ['ज्यादा बारिश', 'ಅತಿ ಮಳೆ']) },
  { id: 'heat', kind: 'knowledge', re: kw(['heat ?wave', 'heat stress', 'too hot', 'high temperatures?', 'drought', 'dry spell'], ['सूखा', 'ಬಿಸಿಗಾಳಿ']) },
]

const DEEP_MARKERS = /(explain in detail|in detail|detailed|step[- ]by[- ]step|compare|comparison|difference between|business plan|strategy|calculate|profit|roi|research|why does|why do|why is|why are|analy[sz]e (my|the) (whole|entire)|full plan|essay)/

function findCrop(text) {
  return CROPS.find((crop) => crop.aliases.some((alias) => (
    /^[a-z ]+$/.test(alias)
      ? new RegExp(`(^|[^a-z])${alias}(es|s)?(?![a-z])`, 'i').test(text)
      : text.includes(alias)
  )))
}

export function detectIntent(message) {
  const text = String(message || '').toLowerCase().trim()
  const words = text.split(/\s+/).filter(Boolean)
  const crop = findCrop(text)
  // More specific intents first
  const order = ['heavyrain', 'heat', 'recommend', 'yellow', 'pest', 'fertilizer', 'organic', 'irrigation', 'soil', 'plant', 'mycrops', 'weather', 'tasks', 'expenses', 'schemes', 'price', 'help', 'thanks', 'greeting']
  let intent = null
  for (const id of order) {
    const candidate = INTENTS.find((item) => item.id === id)
    if (candidate.re.test(text)) { intent = candidate; break }
  }
  if (intent?.id === 'greeting' && words.length > 6) intent = null
  if (!intent && crop) intent = { id: 'cropinfo', kind: 'knowledge' }
  const deep = DEEP_MARKERS.test(text) || words.length > 24
  return { intent, crop, deep, words: words.length }
}

export function intentNeedsWeather(intentId) {
  return ['weather', 'irrigation', 'tasks', 'heavyrain', 'heat', 'recommend'].includes(intentId)
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const list = (value) => (Array.isArray(value) ? value : [])
const num = (value) => {
  const parsed = parseFloat(String(value ?? '').replace(/[^\d.-]/g, ''))
  return Number.isFinite(parsed) ? parsed : null
}

function currentSeason(date = new Date()) {
  const month = date.getMonth() + 1
  if (month >= 6 && month <= 9) return { id: 'kharif', label: 'Kharif (monsoon) season' }
  if (month >= 10 || month === 1) return { id: 'rabi', label: 'Rabi (winter) season' }
  return { id: 'zaid', label: 'Zaid (summer) season' }
}

function normalizeSoil(value) {
  const text = String(value || '').toLowerCase()
  for (const soil of ['black', 'red', 'clay', 'sandy', 'loamy', 'alluvial', 'laterite']) {
    if (text.includes(soil)) return soil
  }
  if (text.includes('loam')) return 'loamy'
  return null
}

function waterLevel(farmer) {
  const text = `${farmer?.waterSource || ''} ${farmer?.irrigationMethod || ''}`.toLowerCase()
  if (/low|scarce|rain[- ]?fed|limited|dry/.test(text)) return 'low'
  if (/adequate|irrigat|canal|borewell|well|drip|sprinkler|high/.test(text)) return 'good'
  return 'unknown'
}

function taskLine(task) {
  const crop = task.crop_name ? ` · ${task.crop_name}` : ''
  const date = task.scheduled_date ? ` (${task.scheduled_date})` : ''
  const priority = task.priority === 'high' ? ' 🔴' : ''
  return `- **${task.title}**${crop}${date}${priority}`
}

function weatherAdvice(weather) {
  const advice = []
  const forecast = list(weather?.next3DaysForecast)
  const rainy = forecast.find((day) => (num(day.rainProbability) ?? 0) >= 60 || (num(day.rainSumMm) ?? 0) >= 10)
  const wind = num(weather?.windSpeedKmH)
  const temp = num(weather?.currentTemperature)
  const maxTemp = Math.max(...forecast.map((day) => num(day.maxTemp) ?? -99), temp ?? -99)
  if (rainy) {
    advice.push(`🌧️ Rain is likely around **${rainy.date}** (${rainy.rainProbability} chance, ~${rainy.rainSumMm}). Review irrigation and avoid spraying pesticide/fertilizer just before rain. Check field drainage.`)
  }
  if (wind !== null && wind >= 20) advice.push(`💨 Wind is ${weather.windSpeedKmH} — not suitable for spraying (drift risk). Spray in calm morning/evening hours.`)
  if (maxTemp >= 35) advice.push(`🔥 High temperatures (up to ${maxTemp}°C) — check soil moisture more often and irrigate in early morning or evening to reduce heat stress.`)
  if (!advice.length) advice.push('✅ No major weather risk in the next 3 days. Normal field work can continue.')
  return advice
}

// ---------------------------------------------------------------------------
// Answer builders
// ---------------------------------------------------------------------------
function answerGreeting(ctx, lang) {
  const name = ctx.farmer?.name || 'Farmer'
  const today = list(ctx.farmCalendar?.todayActivities)
  const lines = [tr('hello', lang, name), '', tr('helpLine', lang)]
  if (today.length) lines.push('', `${tr('todayTitle', lang)}: **${today.length}**`)
  return {
    reply: lines.join('\n'),
    suggestions: ['What are my tasks today?', 'How is the weather this week?', 'Which crop should I plant now?', 'Show my soil report'],
  }
}

function answerHelp(ctx, lang) {
  return {
    reply: [
      tr('hello', lang, ctx.farmer?.name || 'Farmer'),
      '',
      '**I can answer instantly:**',
      '- 📅 Today\'s, overdue and upcoming farm tasks',
      '- ⛅ Live weather and spraying/irrigation advice',
      '- 🌱 Your soil analysis results',
      '- 🩺 Your Crop Doctor diagnoses',
      '- 🌾 Crop suggestions for the current season',
      '- 💧 Irrigation, fertilizer, pest and organic farming basics',
      '- 🏛️ Government schemes (PM-KISAN, PMFBY, KCC, Soil Health Card)',
      '',
      'For detailed questions (like "explain step by step" or "compare two crops"), I use the **Gemini AI** deep mode automatically.',
    ].join('\n'),
    suggestions: ['What are my tasks today?', 'Weather this week', 'Tips for growing tomato', 'Government schemes for farmers'],
  }
}

function answerTasks(ctx, lang) {
  const cal = ctx.farmCalendar || {}
  const today = list(cal.todayActivities)
  const overdue = list(cal.overdueActivities)
  const upcoming = list(cal.upcoming7Days)
  const hasCrops = Array.isArray(ctx.activeCrops) && ctx.activeCrops.length > 0
  if (!today.length && !overdue.length && !upcoming.length && !hasCrops) {
    return { reply: tr('noCalendar', lang), suggestions: ['Which crop should I plant now?', 'How is the weather?'] }
  }
  const lines = [`### ${tr('todayTitle', lang)}`]
  lines.push(today.length ? today.map(taskLine).join('\n') : tr('noToday', lang))
  if (overdue.length) lines.push('', `### ${tr('overdueTitle', lang)}`, overdue.map(taskLine).join('\n'))
  if (upcoming.length) lines.push('', `### ${tr('upcomingTitle', lang)}`, upcoming.slice(0, 5).map(taskLine).join('\n'))
  if (ctx.weather?.next3DaysForecast) {
    lines.push('', '**Weather check for these tasks:**', ...weatherAdvice(ctx.weather).map((item) => `- ${item}`))
  }
  lines.push('', '_Mark tasks done in **Farm calendar** to keep your schedule accurate._')
  return { reply: lines.join('\n'), suggestions: ['Should I irrigate today?', 'Weather this week', 'Show my crops'] }
}

function answerWeather(ctx, lang) {
  const weather = ctx.weather
  if (!weather || !weather.currentTemperature) return { reply: tr('noWeather', lang), suggestions: ['What are my tasks today?'] }
  const forecast = list(weather.next3DaysForecast)
  const lines = [
    `### ${tr('weatherTitle', lang)} — ${weather.location}`,
    `| Now | Value |`, `|---|---|`,
    `| 🌡️ Temperature | ${weather.currentTemperature} |`,
    `| 💧 Humidity | ${weather.relativeHumidity} |`,
    `| 🌧️ Rain now | ${weather.currentPrecipitationMm} |`,
    `| 💨 Wind | ${weather.windSpeedKmH} |`,
  ]
  if (forecast.length) {
    lines.push('', '**Next 3 days**', '| Date | Max / Min | Rain | Chance |', '|---|---|---|---|')
    forecast.forEach((day) => lines.push(`| ${day.date} | ${day.maxTemp} / ${day.minTemp} | ${day.rainSumMm} | ${day.rainProbability} |`))
  }
  lines.push('', '**Farm advice**', ...weatherAdvice(weather).map((item) => `- ${item}`))
  lines.push('', '_Source: Open-Meteo live forecast._')
  return { reply: lines.join('\n'), suggestions: ['Should I irrigate today?', 'Is it safe to spray pesticide?', 'What are my tasks today?'] }
}

function answerIrrigation(ctx, msg, crop) {
  const weather = ctx.weather
  const soil = normalizeSoil(ctx.farmer?.soilType)
  const lines = ['### 💧 Irrigation guidance']
  if (weather?.next3DaysForecast) {
    lines.push('**Based on live weather:**', ...weatherAdvice(weather).map((item) => `- ${item}`), '')
  }
  const irrigationTasks = list(ctx.farmCalendar?.todayActivities).filter((task) => /irrigat/i.test(`${task.activity_type} ${task.title}`))
  if (irrigationTasks.length) lines.push('**Scheduled today in your calendar:**', irrigationTasks.map(taskLine).join('\n'), '')
  lines.push(
    '**Simple field check (do this before watering):**',
    '- Take soil from 5–10 cm depth and press it in your hand.',
    '- If it **holds shape and feels moist** → irrigation can usually wait.',
    '- If it **crumbles and feels dry** → irrigate, preferably early morning or evening.',
  )
  if (soil === 'sandy' || soil === 'red') lines.push(`- Your soil (${ctx.farmer.soilType}) drains fast — light, more frequent irrigation works better.`)
  if (soil === 'clay' || soil === 'black') lines.push(`- Your soil (${ctx.farmer.soilType}) holds water longer — avoid over-irrigation and waterlogging.`)
  if (crop) lines.push('', `**${crop.name}:** water need is **${crop.water}**. ${crop.tips.find((tip) => /water|irrigat/i.test(tip)) || ''}`)
  lines.push('', '_No soil moisture sensor data is available, so this is an estimate — please inspect your field. Exact water quantity depends on crop stage, soil and irrigation method._')
  return { reply: lines.join('\n'), suggestions: ['Weather this week', 'What are my tasks today?', 'Benefits of drip irrigation'] }
}

function answerSoil(ctx, lang) {
  const reports = list(ctx.soilAnalyzer?.latestReports)
  if (!reports.length) return { reply: tr('noSoil', lang), suggestions: ['How can I improve soil fertility?', 'Which crop should I plant now?'] }
  const latest = reports[0]
  const recommendations = list(latest.primaryRecommendations)
  const lines = [
    `### ${tr('soilTitle', lang)}`,
    `- **Soil type (model prediction):** ${latest.predictedSoilClass}`,
    `- **Model confidence:** ${latest.modelConfidence}`,
    `- **Date:** ${String(latest.date || '').slice(0, 10)}`,
  ]
  if (typeof latest.characteristics === 'string') lines.push(`- **Characteristics:** ${latest.characteristics}`)
  if (recommendations.length) lines.push('', '**Suggestions from the analysis:**', ...recommendations.slice(0, 5).map((item) => `- ${typeof item === 'string' ? item : item.name || JSON.stringify(item)}`))
  lines.push('', `> ${latest.disclaimer}`, '', 'For exact **pH, N, P, K and organic carbon**, get a Soil Health Card lab test — I will not guess these values from a photo.')
  return { reply: lines.join('\n'), suggestions: ['Which crop suits my soil?', 'How can I improve soil fertility?', 'Fertilizer advice'] }
}

function answerPlant(ctx, lang) {
  const diagnoses = list(ctx.plantAnalyzer?.latestDiagnoses)
  if (!diagnoses.length) {
    return {
      reply: [
        '### 🩺 Plant health',
        'You have not scanned a plant photo yet. Open **Crop Doctor**, take a clear photo of the affected leaf in daylight, and I can explain the result.',
        '',
        '**Quick checks meanwhile:**',
        '- Spots with rings or yellow halo → often fungal (blight/leaf spot).',
        '- Curling, crinkled leaves → often virus spread by whitefly/thrips.',
        '- Holes or chewed leaves → caterpillars/beetles.',
        '- Remove badly affected leaves and avoid overhead watering.',
      ].join('\n'),
      suggestions: ['Why are my leaves turning yellow?', 'How to control pests organically?'],
    }
  }
  const latest = diagnoses[0]
  const lines = [
    `### ${tr('plantTitle', lang)}`,
    `- **Crop:** ${latest.cropName || 'Not specified'}`,
    `- **Condition:** ${latest.diagnosedCondition}`,
    `- **Confidence:** ${latest.confidence}`,
    `- **Severity:** ${latest.severity || 'Not rated'}`,
    `- **Date:** ${String(latest.date || '').slice(0, 10)}`,
  ]
  const actions = list(latest.immediateActions)
  const organic = list(latest.organicOptions)
  const prevention = list(latest.prevention)
  if (actions.length) lines.push('', '**What to do now:**', ...actions.slice(0, 5).map((item) => `- ${item}`))
  if (organic.length) lines.push('', '**Organic options:**', ...organic.slice(0, 4).map((item) => `- ${item}`))
  if (prevention.length) lines.push('', '**Prevention:**', ...prevention.slice(0, 4).map((item) => `- ${item}`))
  lines.push('', `> ${latest.disclaimer}`)
  return { reply: lines.join('\n'), suggestions: ['How to control pests organically?', 'Is it safe to spray today?', 'Show my soil report'] }
}

function answerRecommend(ctx) {
  const season = currentSeason()
  const soilRaw = ctx.farmer?.soilType
  const soil = normalizeSoil(soilRaw)
  const water = waterLevel(ctx.farmer)
  const scored = CROPS.map((crop) => {
    let score = 0
    const reasons = []
    if (crop.seasons.includes(season.id)) { score += 3; reasons.push(`suits ${season.label}`) }
    if (soil && crop.soils.includes(soil)) { score += 2; reasons.push(`grows well in ${soil} soil`) }
    if (water === 'low' && crop.water === 'low') { score += 2; reasons.push('needs little water') }
    if (water === 'low' && crop.water === 'high') score -= 3
    if (water === 'good' && crop.water !== 'low') score += 1
    return { crop, score, reasons }
  }).filter((item) => item.score >= 3).sort((a, b) => b.score - a.score).slice(0, 5)

  const lines = [
    '### 🌾 Crop suggestions for your farm',
    `- **Season now:** ${season.label}`,
    `- **Soil:** ${soilRaw && soilRaw !== 'Not recorded' ? soilRaw : 'not recorded (add it in My profile or run a soil analysis)'}`,
    `- **Water:** ${ctx.farmer?.waterSource || 'not specified'}`,
    '',
    '| Crop | Duration | Water need | Why |', '|---|---|---|---|',
    ...scored.map(({ crop, reasons }) => `| **${crop.name}** | ${crop.duration} | ${crop.water} | ${reasons.join(', ')} |`),
    '',
    '_This is a quick rule-based shortlist. Check local seed availability, market demand and your district agriculture office advice before sowing. For a detailed comparison, ask in Deep mode._',
  ]
  return {
    reply: lines.join('\n'),
    suggestions: scored.slice(0, 3).map(({ crop }) => `Tips for growing ${crop.name.split(' ')[0].toLowerCase()}`).concat(['Compare the top two crops in detail']),
  }
}

function answerMyCrops(ctx) {
  const crops = list(ctx.activeCrops)
  if (!crops.length) return { reply: tr('noCalendar', 'en'), suggestions: ['Which crop should I plant now?'] }
  const lines = ['### 🌿 Your active crops', '| Crop | Field | Sown | Harvest (expected) | Health |', '|---|---|---|---|---|']
  crops.forEach((crop) => {
    lines.push(`| **${crop.crop_name || crop.name}**${crop.crop_variety ? ` (${crop.crop_variety})` : ''} | ${crop.field_name || '-'} | ${crop.sowing_date || crop.sowingDate || '-'} | ${crop.expected_harvest_date || '-'} | ${crop.health_status || '-'} |`)
  })
  return { reply: lines.join('\n'), suggestions: ['What are my tasks today?', 'Should I irrigate today?'] }
}

function answerExpenses(ctx) {
  const expenses = list(ctx.recentExpenses)
  if (!expenses.length) return { reply: 'No farm expenses are recorded yet. Add them in **Expenses** to track your costs.', suggestions: ['What are my tasks today?'] }
  const total = expenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0)
  const lines = ['### 💰 Recent farm expenses', '| Date | Category | Crop | Amount |', '|---|---|---|---|']
  expenses.forEach((item) => lines.push(`| ${item.date} | ${item.category} | ${item.crop_name || '-'} | ₹${Number(item.amount || 0).toLocaleString('en-IN')} |`))
  lines.push('', `**Total of these entries:** ₹${total.toLocaleString('en-IN')}`)
  return { reply: lines.join('\n'), suggestions: ['How can I reduce farming costs?', 'Government schemes for farmers'] }
}

function answerCropInfo(crop) {
  return {
    reply: [
      `### 🌾 ${crop.name} — quick guide`,
      `- **Seasons:** ${crop.seasons.join(', ')}`,
      `- **Duration:** ${crop.duration}`,
      `- **Water need:** ${crop.water}`,
      `- **Suitable soils:** ${crop.soils.join(', ')}`,
      '',
      '**Key tips:**',
      ...crop.tips.map((tip) => `- ${tip}`),
      '',
      '_Fertilizer doses depend on your soil test and variety — follow your Soil Health Card or local agriculture officer._',
    ].join('\n'),
    suggestions: [`Pests in ${crop.key}`, `Irrigation for ${crop.key}`, `Detailed cultivation plan for ${crop.key}`],
  }
}

const KNOWLEDGE = {
  yellow: () => ({
    reply: [
      '### 🍂 Why leaves turn yellow — common causes',
      '| What you see | Likely cause | What to do |', '|---|---|---|',
      '| Older/lower leaves yellow first | Nitrogen deficiency | Apply nitrogen as per soil test; add compost |',
      '| Young leaves yellow, veins green | Iron/zinc deficiency | Micronutrient spray as advised by KVK |',
      '| Yellowing + wilting, wet soil | Over-watering / poor drainage | Reduce irrigation, improve drainage |',
      '| Yellow patches with spots | Fungal disease | Remove affected leaves; scan in Crop Doctor |',
      '| Yellow, curled leaves + tiny insects | Sucking pests / virus | Check leaf underside; use sticky traps |',
      '',
      '📸 For a precise answer, upload a clear leaf photo in **Crop Doctor**.',
    ].join('\n'),
    suggestions: ['Show my Crop Doctor result', 'How to control pests organically?', 'Fertilizer advice'],
  }),
  pest: (crop) => ({
    reply: [
      `### 🐛 Pest management${crop ? ` for ${crop.name}` : ''} (IPM approach)`,
      '1. **Scout weekly** — check leaf undersides, shoots and fruits.',
      '2. **Traps** — yellow sticky traps (whitefly/aphids), blue traps (thrips), pheromone traps (borers).',
      '3. **Neem-based spray** (as per label) for early, light infestations.',
      '4. **Encourage natural enemies** — ladybird beetles, spiders; avoid unnecessary broad-spectrum sprays.',
      '5. **Remove and destroy** heavily infested plant parts.',
      '6. **Chemical control only if damage crosses threshold** — use products recommended by your agriculture officer, follow label dose and waiting period.',
      ...(crop ? ['', `**Watch for in ${crop.name}:** ${crop.tips.find((tip) => /watch|monitor|scout/i.test(tip)) || 'common pests of the region.'}`] : []),
      '',
      '⚠️ Avoid spraying before rain or in strong wind.',
    ].join('\n'),
    suggestions: ['Is it safe to spray today?', 'Show my Crop Doctor result'],
  }),
  fertilizer: (crop, ctx) => ({
    reply: [
      `### 🧪 Fertilizer guidance${crop ? ` for ${crop.name}` : ''}`,
      '- **Start with a soil test** (Soil Health Card) — it tells you exactly how much N, P and K your field needs.',
      '- **Basal dose:** phosphorus and potash are usually applied at sowing/transplanting.',
      '- **Nitrogen in splits:** apply in 2–3 parts at key growth stages to reduce losses.',
      '- **Add organic matter:** FYM/compost/vermicompost improves soil and fertilizer efficiency.',
      '- **Apply when soil is moist**, not before heavy rain (nutrients wash away).',
      ...(list(ctx.soilAnalyzer?.latestReports).length ? ['', `Your latest soil analysis predicted **${ctx.soilAnalyzer.latestReports[0].predictedSoilClass}** soil — this is a photo-based type, not a nutrient test.`] : []),
      '',
      '_I don\'t give exact kg/acre doses without lab soil test values, to avoid wrong application. Use Deep mode with your soil test numbers for a calculated plan._',
    ].join('\n'),
    suggestions: ['How can I improve soil fertility naturally?', 'Show my soil report'],
  }),
  organic: () => ({
    reply: [
      '### 🌱 Improve soil fertility naturally',
      '- **Compost / FYM / vermicompost** — adds organic carbon and helpful microbes.',
      '- **Green manure** — grow and plough in sunhemp or dhaincha before the main crop.',
      '- **Crop rotation with pulses** — pulses fix nitrogen for the next crop.',
      '- **Mulching** — crop residue cover keeps moisture and feeds soil life. Avoid burning residue.',
      '- **Jeevamrut / biofertilizers** (Rhizobium, Azotobacter, PSB) — low-cost microbial boosters.',
      '- **Minimum tillage** — protects soil structure.',
    ].join('\n'),
    suggestions: ['Which crop should I plant now?', 'Fertilizer advice'],
  }),
  schemes: () => ({
    reply: [
      '### 🏛️ Key government schemes for farmers',
      '| Scheme | Benefit | Where to apply |', '|---|---|---|',
      '| **PM-KISAN** | Direct income support to eligible farmer families | pmkisan.gov.in / CSC |',
      '| **PMFBY** | Crop insurance against natural calamities | pmfby.gov.in / bank / CSC |',
      '| **Kisan Credit Card (KCC)** | Short-term crop loans at concessional interest | Your bank branch |',
      '| **Soil Health Card** | Free soil testing with nutrient advice | soilhealth.dac.gov.in / KVK |',
      '| **PMKSY** | Support for drip/sprinkler irrigation | State agriculture/horticulture dept |',
      '',
      '_Eligibility and amounts change — confirm on official portals or at your Raitha Samparka Kendra / agriculture office. See the **Schemes** page in the app._',
    ].join('\n'),
    suggestions: ['Benefits of drip irrigation', 'How to get a soil test?'],
  }),
  price: () => ({
    reply: [
      '### 📈 Market prices',
      'I don\'t have live mandi prices in quick mode, so I won\'t guess a rate.',
      '- Check today\'s prices on **Agmarknet** (agmarknet.gov.in) or **eNAM** (enam.gov.in).',
      '- Open the **Mandi prices** page in this app.',
      '- Compare 2–3 nearby mandis before selling, and consider transport cost.',
    ].join('\n'),
    suggestions: ['Government schemes for farmers', 'How can I reduce farming costs?'],
  }),
  heavyrain: () => ({
    reply: [
      '### 🌧️ Heavy rain — protect your crop',
      '- **Open drainage channels** so water does not stand in the field.',
      '- **Postpone irrigation, fertilizer and pesticide** application until rain stops.',
      '- **Support tall plants** (stakes/earthing up) to prevent lodging.',
      '- **After rain:** check for fungal diseases and root rot; remove infected plants.',
      '- **Harvest mature produce** early if heavy rain is forecast, and store it dry.',
      '- If crop loss happens, **inform your insurer (PMFBY) within 72 hours**.',
    ].join('\n'),
    suggestions: ['How is the weather this week?', 'Government schemes for farmers'],
  }),
  heat: () => ({
    reply: [
      '### 🔥 Heat / dry spell — protect your crop',
      '- **Irrigate early morning or evening** to reduce evaporation.',
      '- **Mulch** with crop residue or plastic to keep soil moist.',
      '- **Avoid fertilizer and spraying** during peak afternoon heat.',
      '- **Drip irrigation** delivers water efficiently to roots.',
      '- Check soil moisture more often, especially for young plants and flowering crops.',
    ].join('\n'),
    suggestions: ['Should I irrigate today?', 'How is the weather this week?'],
  }),
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------
/**
 * @param {{ message: string, language: string, context: object, mode?: 'auto'|'quick'|'deep', geminiAvailable?: boolean, detection?: object }} input
 * @returns {{ reply: string, suggestions: string[], intent: string } | null}
 */
export function answerLocally({ message, language = 'en', context = {}, mode = 'auto', geminiAvailable = true, detection, force = false }) {
  if (mode === 'deep' && !force) return null
  const { intent, crop, deep } = detection || detectIntent(message)
  const lang = ['en', 'hi', 'kn'].includes(language) ? language : 'en'

  if (!intent) {
    if (mode === 'quick' || force) {
      return {
        reply: [
          'I could not match this question to my built-in farm knowledge. 🤔',
          '',
          tr('helpLine', lang),
          '',
          'Switch to **Deep (AI)** mode for open-ended questions.',
        ].join('\n'),
        suggestions: ['What are my tasks today?', 'How is the weather?', 'Which crop should I plant now?'],
        intent: 'unknown',
      }
    }
    return null
  }

  if (mode === 'auto' && !force && geminiAvailable) {
    if (deep) return null
    // Non-English knowledge questions read better from the AI model
    if (intent.kind === 'knowledge' && language !== 'en') return null
  }

  let result
  switch (intent.id) {
    case 'greeting': result = answerGreeting(context, lang); break
    case 'thanks': result = { reply: tr('thanks', lang), suggestions: ['What are my tasks today?', 'How is the weather?'] }; break
    case 'help': result = answerHelp(context, lang); break
    case 'tasks': result = answerTasks(context, lang); break
    case 'weather': result = answerWeather(context, lang); break
    case 'irrigation': result = answerIrrigation(context, message, crop); break
    case 'soil': result = answerSoil(context, lang); break
    case 'plant': result = answerPlant(context, lang); break
    case 'recommend': result = answerRecommend(context); break
    case 'mycrops': result = answerMyCrops(context); break
    case 'expenses': result = answerExpenses(context); break
    case 'cropinfo': result = answerCropInfo(crop); break
    default: result = KNOWLEDGE[intent.id]?.(crop, context)
  }
  if (!result) return null
  return { ...result, suggestions: (result.suggestions || []).slice(0, 4), intent: intent.id }
}
