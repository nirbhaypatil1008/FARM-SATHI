import { BrowserRouter, NavLink, Route, Routes } from 'react-router-dom'
import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'

const navItems = [
  { label: 'Dashboard', path: '/', icon: '🏠' },
  { label: 'My Farm', path: '/my-farm', icon: '🌾' },
  { label: 'Crop Analyzer', path: '/crop-analyzer', icon: '📊' },
  { label: 'Crop Growth', path: '/crop-growth', icon: '🌱' },
  { label: 'Crop Doctor', path: '/crop-doctor', icon: '🩺' },
  { label: 'Smart Water', path: '/smart-water', icon: '💧' },
  { label: 'Market Price', path: '/market-price', icon: '🛒' },
  { label: 'Soil & Fertilizer', path: '/soil-fertilizer', icon: '🌿' },
  { label: 'Weather', path: '/weather', icon: '⛅' },
  { label: 'Schemes', path: '/government-schemes', icon: '🏛️' },
  { label: 'Loans', path: '/loans', icon: '💰' },
  { label: 'Insurance', path: '/insurance', icon: '🛡️' },
  { label: 'Expenses', path: '/expenses', icon: '🧾' },
  { label: 'Budget', path: '/budget', icon: '📈' },
  { label: 'AI Assistant', path: '/ai-assistant', icon: '🤖' },
  { label: 'Alerts', path: '/notifications', icon: '🔔' },
  { label: 'Profile', path: '/profile', icon: '👨‍🌾' },
]

const serviceCards = [
  { title: 'Crop Doctor', description: 'Check what is wrong with your crops.', path: '/crop-doctor', color: 'green', icon: '🩺' },
  { title: 'Smart Water', description: 'Know when and how much to water.', path: '/smart-water', color: 'blue', icon: '💧' },
  { title: 'Market Price', description: 'Find today\'s crop prices.', path: '/market-price', color: 'yellow', icon: '📦' },
  { title: 'Soil & Fertilizer', description: 'Understand your soil and plant nutrition.', path: '/soil-fertilizer', color: 'earth', icon: '🌿' },
  { title: 'Weather & Crop Calendar', description: 'Plan farming activities with weather.', path: '/weather', color: 'sky', icon: '⛅' },
  { title: 'Government Schemes', description: 'Discover benefits and government support.', path: '/government-schemes', color: 'cream', icon: '🏛️' },
]

const farmerData = {
  name: 'Ramesh Gowda',
  location: 'Mandya, Karnataka',
  weather: 'Sunny • 31°C',
  language: 'English',
}

const farmCrops = [
  { name: 'Tomato', stage: 'Flowering', progress: 72, health: 'Healthy', color: 'green' },
  { name: 'Rice', stage: 'Tillering', progress: 58, health: 'Stable', color: 'blue' },
  { name: 'Chilli', stage: 'Fruit Setting', progress: 64, health: 'Good', color: 'orange' },
]

const cropRecommendations = [
  { name: 'Maize', suitability: 92, investment: '₹18,500', yield: '3.8 t/acre', duration: '110 days', score: 'Excellent fit' },
  { name: 'Groundnut', suitability: 86, investment: '₹16,200', yield: '2.7 t/acre', duration: '120 days', score: 'Good fit' },
  { name: 'Sorghum', suitability: 79, investment: '₹12,900', yield: '2.3 t/acre', duration: '100 days', score: 'Moderate fit' },
]

const cropStages = [
  { label: 'Sowing', date: 'May 10', done: true },
  { label: 'Germination', date: 'May 18', done: true },
  { label: 'Vegetative', date: 'Jun 10', done: true },
  { label: 'Flowering', date: 'Jul 08', done: false },
  { label: 'Harvest', date: 'Aug 02', done: false },
]

const marketData = [
  { crop: 'Tomato', mandi: 'Mysuru', min: 1400, max: 1700, modal: 1580, unit: '₹/quintal', trend: '+7%' },
  { crop: 'Paddy', mandi: 'Mandya', min: 2020, max: 2160, modal: 2100, unit: '₹/quintal', trend: '+3%' },
  { crop: 'Maize', mandi: 'Bengaluru', min: 1750, max: 1920, modal: 1840, unit: '₹/quintal', trend: '+5%' },
  { crop: 'Wheat', mandi: 'Hubballi', min: 2400, max: 2580, modal: 2510, unit: '₹/quintal', trend: '+6%' },
]

const notifications = [
  { type: 'Weather', color: 'sky', text: 'Heavy rain expected in 48 hours. Plan irrigation delay.', time: '2h ago' },
  { type: 'Disease', color: 'orange', text: 'Leaf spot warning on tomato field plot B.', time: '4h ago' },
  { type: 'Reminder', color: 'green', text: 'Fertilizer application due for paddy field.', time: 'Today' },
  { type: 'Market', color: 'yellow', text: 'Tomato mandi rates improved by 7% in Mysuru.', time: 'Today' },
]

const weatherForecast = [
  { day: 'Mon', icon: '☀️', temp: '32°C' },
  { day: 'Tue', icon: '🌤️', temp: '31°C' },
  { day: 'Wed', icon: '🌧️', temp: '29°C' },
  { day: 'Thu', icon: '⛅', temp: '30°C' },
  { day: 'Fri', icon: '🌦️', temp: '32°C' },
  { day: 'Sat', icon: '☀️', temp: '33°C' },
  { day: 'Sun', icon: '🌤️', temp: '31°C' },
]

const soilMetrics = [
  { label: 'pH', value: '6.8' },
  { label: 'N', value: '42 kg/ha' },
  { label: 'P', value: '24 kg/ha' },
  { label: 'K', value: '31 kg/ha' },
  { label: 'Moisture', value: '62%' },
]

const schemeData = [
  { name: 'PM-KISAN', benefit: '₹6,000/year', eligibility: 'Registered small and marginal farmers', docs: ['Aadhaar', 'Bank account', 'Land records'], status: 'Eligible' },
  { name: 'Kisan Credit Card', benefit: 'Crop loan support', eligibility: 'Farmers with land ownership / tenancy proof', docs: ['KYC', 'Land documents', 'Bank passbook'], status: 'Check eligibility' },
  { name: 'Soil Health Card Scheme', benefit: 'Free nutrient testing', eligibility: 'Farmer with plot details', docs: ['Farmer ID', 'Plot address'], status: 'Open' },
]

const loanOptions = [
  { name: 'Crop Loan', rate: '7.5% p.a.', duration: '12 to 36 months', benefit: 'Seasonal working capital' },
  { name: 'Kisan Credit Card', rate: '8.2% p.a.', duration: '5 years', benefit: 'Flexible credit line' },
  { name: 'Equipment Loan', rate: '9.1% p.a.', duration: '3 years', benefit: 'Tractors, pumps, tools' },
]

const insuranceOptions = [
  { name: 'PMFBY', coverage: 'Crops against natural risk', docs: ['Aadhaar', 'Land records', 'Bank details'], status: 'Open enrollment' },
  { name: 'Weather-based insurance', coverage: 'Rainfall and temperature risk', docs: ['Plot details', 'Crop details'], status: 'Seasonal' },
]

const expenseSeed = [
  { id: 1, category: 'Seeds', crop: 'Tomato', amount: 3200, date: '2026-11-01' },
  { id: 2, category: 'Fertilizer', crop: 'Rice', amount: 4800, date: '2026-11-02' },
  { id: 3, category: 'Labour', crop: 'Chilli', amount: 6400, date: '2026-11-05' },
]

const budgetSummary = [
  { label: 'Total investment', value: '₹48,400' },
  { label: 'Current expenses', value: '₹21,700' },
  { label: 'Remaining budget', value: '₹26,700' },
  { label: 'Potential revenue', value: '₹72,500' },
  { label: 'Expected profit', value: '₹24,100' },
]

function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const saved = window.localStorage.getItem(key)
      return saved ? JSON.parse(saved) : initialValue
    } catch {
      return initialValue
    }
  })

  useEffect(() => {
    window.localStorage.setItem(key, JSON.stringify(value))
  }, [key, value])

  return [value, setValue]
}

function VoiceAssistant({ label = 'TALK TO ME', compact = false }) {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [inputText, setInputText] = useState('')
  const recognitionRef = useRef(null)

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition

    if (!SpeechRecognition) {
      return undefined
    }

    const recognition = new SpeechRecognition()
    recognition.lang = 'en-IN'
    recognition.interimResults = false
    recognition.continuous = false

    recognition.onstart = () => setIsListening(true)
    recognition.onend = () => setIsListening(false)
    recognition.onresult = (event) => {
      const result = event.results[0][0].transcript
      setTranscript(result)
      setInputText(result)
    }

    recognitionRef.current = recognition
    return () => recognition.stop()
  }, [])

  const startListening = async () => {
    if (!recognitionRef.current) {
      setTranscript('Voice support is not available in this browser. Please type your question below.')
      return
    }

    try {
      await navigator.mediaDevices.getUserMedia({ audio: true })
      recognitionRef.current.start()
    } catch {
      setTranscript('Microphone access is blocked. Please allow microphone permission or use text mode.')
    }
  }

  const stopSpeaking = () => window.speechSynthesis.cancel()

  const handleSpeak = () => {
    if (!transcript && !inputText) return
    const text = transcript || inputText
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'en-IN'
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(utterance)
  }

  return (
    <div className={`voice-panel ${compact ? 'compact' : ''}`}>
      <button type="button" className="voice-button" onClick={startListening}>
        <span className="voice-icon">🎙️</span>
        <span>
          {isListening ? 'LISTENING...' : label}
        </span>
      </button>
      <div className="voice-helper">Ask anything about your farming.</div>
      <div className="voice-box">
        <textarea
          value={inputText || transcript}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Type your question or spoken text appears here..."
        />
        <div className="voice-actions">
          <button type="button" className="secondary-btn" onClick={handleSpeak}>Listen to advice</button>
          <button type="button" className="secondary-btn ghost" onClick={stopSpeaking}>Stop speaking</button>
        </div>
      </div>
    </div>
  )
}

function Layout({ children }) {
  return (
    <BrowserRouter>
      <div className="farm-shell">
        <aside className="sidebar">
          <div className="brand-box">
            <div className="brand-mark">🌿</div>
            <div>
              <div className="brand-name">FARM SAATHI</div>
              <div className="brand-tag">Smart farming companion</div>
            </div>
          </div>

          <nav className="nav-menu">
            {navItems.map((item) => (
              <NavLink key={item.path} to={item.path} className="nav-item">
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </aside>

        <main className="main-panel">
          <header className="topbar">
            <div className="search-box">🔎 Search farm tips</div>
            <div className="topbar-actions">
              <button type="button" className="lang-btn">English ▾</button>
              <button type="button" className="icon-btn" aria-label="Notifications">🔔</button>
              <div className="profile-chip">
                <div className="avatar">RG</div>
                <div>
                  <strong>Ramesh</strong>
                  <small>Mandya</small>
                </div>
              </div>
            </div>
          </header>

          <div className="content-wrap">{children}</div>

          <nav className="mobile-nav">
            {navItems.slice(0, 6).map((item) => (
              <NavLink key={item.path} to={item.path} className="mobile-item">
                <span>{item.icon}</span>
                <small>{item.label}</small>
              </NavLink>
            ))}
          </nav>
        </main>
      </div>
    </BrowserRouter>
  )
}

function DashboardPage() {
  return (
    <>
      <section className="hero-panel">
        <div className="hero-copy">
          <div className="eyebrow">Hello Farmer! Welcome to Farm Saathi.</div>
          <h1>Ramesh Gowda</h1>
          <div className="hero-meta">
            <span>📍 Mandya, Karnataka</span>
            <span>☀️ 31°C • Sunny</span>
          </div>
        </div>
        <div className="hero-visual">
          <div className="illustration-card">🌾</div>
          <VoiceAssistant />
        </div>
      </section>

      <section className="service-grid">
        {serviceCards.map((card) => (
          <NavLink key={card.title} to={card.path} className={`service-card ${card.color}`}>
            <div className="service-emoji">{card.icon}</div>
            <h3>{card.title}</h3>
            <p>{card.description}</p>
          </NavLink>
        ))}
      </section>

      <section className="summary-grid">
        <div className="panel-card wide">
          <div className="panel-header">
            <h3>My Farm Overview</h3>
            <button type="button" className="secondary-btn">Add field</button>
          </div>
          <div className="farm-metrics">
            <div><strong>4.8 acres</strong><span>Total farm area</span></div>
            <div><strong>3 crops</strong><span>Active crops</span></div>
            <div><strong>92%</strong><span>Healthy field</span></div>
          </div>
        </div>

        <div className="panel-card">
          <div className="panel-header"><h3>Today's Activities</h3></div>
          <ul className="checklist">
            <li>✅ Irrigation check for paddy field</li>
            <li>✅ Soil moisture reading at 11:00 AM</li>
            <li>⚠️ Apply potassium to chilli plot</li>
            <li>📦 Visit mandi before 5 PM</li>
          </ul>
        </div>

        <div className="panel-card">
          <div className="panel-header"><h3>Expense Summary</h3></div>
          <div className="expense-ring">
            <div className="ring-center">
              <strong>₹18.4K</strong>
              <span>Spent this month</span>
            </div>
          </div>
        </div>
      </section>

      <section className="bottom-grid">
        <div className="panel-card">
          <div className="panel-header"><h3>Active Crops</h3></div>
          {farmCrops.map((crop) => (
            <div key={crop.name} className="mini-progress">
              <div className="label-row">
                <span>{crop.name}</span>
                <span>{crop.progress}%</span>
              </div>
              <div className="bar"><span style={{ width: `${crop.progress}%` }} /></div>
              <small>{crop.stage} • {crop.health}</small>
            </div>
          ))}
        </div>

        <div className="panel-card">
          <div className="panel-header"><h3>Market Price Highlights</h3></div>
          {marketData.slice(0, 3).map((item) => (
            <div key={item.crop} className="market-row">
              <div>
                <strong>{item.crop}</strong>
                <small>{item.mandi}</small>
              </div>
              <div className="market-value">₹{item.modal}</div>
            </div>
          ))}
        </div>

        <div className="panel-card">
          <div className="panel-header"><h3>Important Alerts</h3></div>
          <div className="alert-stack">
            {notifications.slice(0, 3).map((item) => (
              <div key={item.text} className={`alert-item ${item.color}`}>
                <span>{item.type}</span>
                <p>{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}

function MyFarmPage() {
  const [farmName, setFarmName] = useState('Green Valley Farm')
  const [fieldSize, setFieldSize] = useState('4.8 acres')
  const [soilType, setSoilType] = useState('Loamy')
  const [irrigation, setIrrigation] = useState('Drip')

  return (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <div className="eyebrow">My Farm</div>
          <h2>Farm management</h2>
        </div>
        <VoiceAssistant compact />
      </div>

      <section className="panel-grid two-column">
        <div className="panel-card">
          <div className="panel-header"><h3>Add field details</h3></div>
          <div className="form-grid">
            <label>
              Farm name
              <input value={farmName} onChange={(e) => setFarmName(e.target.value)} />
            </label>
            <label>
              Land size
              <input value={fieldSize} onChange={(e) => setFieldSize(e.target.value)} />
            </label>
            <label>
              Soil type
              <select value={soilType} onChange={(e) => setSoilType(e.target.value)}>
                <option>Loamy</option>
                <option>Clay</option>
                <option>Sandy</option>
                <option>Black soil</option>
              </select>
            </label>
            <label>
              Irrigation method
              <select value={irrigation} onChange={(e) => setIrrigation(e.target.value)}>
                <option>Drip</option>
                <option>Sprinkler</option>
                <option>Flood</option>
              </select>
            </label>
          </div>
        </div>

        <div className="panel-card">
          <div className="panel-header"><h3>Field snapshot</h3></div>
          <div className="field-summary">
            <div className="field-badge">🌱 {farmName}</div>
            <div className="field-badge">📏 {fieldSize}</div>
            <div className="field-badge">🟫 {soilType}</div>
            <div className="field-badge">💧 {irrigation}</div>
          </div>
        </div>
      </section>

      <section className="panel-card">
        <div className="panel-header"><h3>Active crops</h3></div>
        <div className="crop-gallery">
          {farmCrops.map((crop) => (
            <div key={crop.name} className="crop-tile">
              <div className="crop-art">🌾</div>
              <h4>{crop.name}</h4>
              <p>{crop.stage}</p>
              <span>{crop.health}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

function CropAnalyzerPage() {
  return (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <div className="eyebrow">Crop Analyzer</div>
          <h2>Best crop recommendation</h2>
        </div>
      </div>

      <section className="panel-grid two-column">
        <div className="panel-card">
          <div className="panel-header"><h3>Farm conditions</h3></div>
          <div className="form-grid">
            <label>Land size<input defaultValue="4.8 acres" /></label>
            <label>Soil type<select defaultValue="Loamy"><option>Loamy</option></select></label>
            <label>Weather<select defaultValue="Sunny"><option>Sunny</option></select></label>
            <label>Water availability<select defaultValue="Adequate"><option>Adequate</option></select></label>
            <label>Budget<input defaultValue="₹50,000" /></label>
            <label>Season<select defaultValue="Kharif"><option>Kharif</option></select></label>
          </div>
        </div>

        <div className="panel-card">
          <div className="panel-header"><h3>Suitable crops</h3></div>
          <div className="recommendation-list">
            {cropRecommendations.map((crop) => (
              <div key={crop.name} className="recommendation-card">
                <div className="recommendation-header">
                  <strong>{crop.name}</strong>
                  <span>{crop.score}</span>
                </div>
                <ul>
                  <li>Suitability score: {crop.suitability}/100</li>
                  <li>Investment: {crop.investment}</li>
                  <li>Yield: {crop.yield}</li>
                  <li>Duration: {crop.duration}</li>
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

function CropGrowthPage() {
  return (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <div className="eyebrow">Crop Growth Tracker</div>
          <h2>Tomato field progress</h2>
        </div>
      </div>

      <section className="panel-grid two-column">
        <div className="panel-card tall-panel">
          <div className="panel-header"><h3>Growth overview</h3></div>
          <div className="growth-top">
            <div className="crop-art large">🍅</div>
            <div>
              <strong>Flowering stage</strong>
              <p>Days after sowing: 52</p>
              <p>Crop health: Healthy</p>
            </div>
          </div>
          <div className="timeline">
            {cropStages.map((stage) => (
              <div key={stage.label} className={`timeline-step ${stage.done ? 'done' : ''}`}>
                <span>{stage.label}</span>
                <small>{stage.date}</small>
              </div>
            ))}
          </div>
        </div>

        <div className="panel-card">
          <div className="panel-header"><h3>Weather charts</h3></div>
          <div className="chart-bars">
            {[40, 70, 58, 88, 62, 75, 92].map((value, index) => (
              <div key={index} className="bar-col"><span style={{ height: `${value}%` }} /></div>
            ))}
          </div>
          <div className="chart-labels">
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day) => <span key={day}>{day}</span>)}
          </div>
        </div>
      </section>
    </div>
  )
}

function CropDoctorPage() {
  const [photoName, setPhotoName] = useState('tomato-leaf-demo.jpg')

  return (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <div className="eyebrow">Crop Doctor</div>
          <h2>Disease analyzer</h2>
        </div>
      </div>

      <section className="panel-grid two-column">
        <div className="panel-card">
          <div className="panel-header"><h3>Upload crop image</h3></div>
          <label className="upload-box">
            <input type="file" onChange={(e) => setPhotoName(e.target.files?.[0]?.name || 'tomato-leaf-demo.jpg')} />
            <span>📷 Click to upload a crop photo</span>
          </label>
          <div className="photo-preview">🪴</div>
          <p className="demo-note">Demo diagnosis only. This is not a live AI result.</p>
        </div>

        <div className="panel-card">
          <div className="panel-header"><h3>Diagnosis report</h3></div>
          <div className="result-box">
            <strong>Possible disease: Early blight</strong>
            <span>Confidence: 82%</span>
            <span>Severity: Moderate</span>
            <ul>
              <li>Symptoms: Brown spots with concentric rings</li>
              <li>Likely cause: High humidity and poor air circulation</li>
              <li>Recommended action: Remove infected leaves and improve spacing</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  )
}

function SmartWaterPage() {
  return (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <div className="eyebrow">Smart Water</div>
          <h2>Irrigation guidance</h2>
        </div>
      </div>

      <section className="panel-grid three-column">
        <div className="panel-card">
          <div className="panel-header"><h3>Water requirement</h3></div>
          <div className="water-card">
            <span>💧</span>
            <strong>14,200 L/day</strong>
            <small>Estimated water requirement for this field</small>
          </div>
        </div>

        <div className="panel-card">
          <div className="panel-header"><h3>Next schedule</h3></div>
          <ul className="list-stack">
            <li>Tomorrow • 6:30 AM • Drip irrigation</li>
            <li>Thursday • 6:15 AM • Top-up</li>
            <li>Saturday • 7:00 AM • Deep soil check</li>
          </ul>
        </div>

        <div className="panel-card">
          <div className="panel-header"><h3>Rainfall forecast</h3></div>
          <div className="forecast-box">
            <strong>42%</strong>
            <small>Chance of rain in 48 hours</small>
          </div>
        </div>
      </section>
    </div>
  )
}

function MarketPricePage() {
  return (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <div className="eyebrow">Market Price Tracker</div>
          <h2>Today\'s mandi prices</h2>
        </div>
        <button type="button" className="primary-btn">FIND BEST MARKET</button>
      </div>

      <section className="market-grid">
        {marketData.map((item) => (
          <div key={item.crop} className="market-card">
            <div className="market-top">
              <div className="crop-art small">🌾</div>
              <div>
                <h4>{item.crop}</h4>
                <small>{item.mandi}</small>
              </div>
            </div>
            <div className="price-block">
              <strong>₹{item.modal}</strong>
              <span>{item.unit}</span>
            </div>
            <div className="range-row">
              <span>Min: ₹{item.min}</span>
              <span>Max: ₹{item.max}</span>
            </div>
            <div className="trend">Trend {item.trend}</div>
          </div>
        ))}
      </section>
    </div>
  )
}

function SoilFertilizerPage() {
  return (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <div className="eyebrow">Soil & Fertilizer</div>
          <h2>Soil health insights</h2>
        </div>
      </div>

      <section className="panel-grid three-column">
        {soilMetrics.map((metric) => (
          <div key={metric.label} className="panel-card metric-card">
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
          </div>
        ))}
      </section>

      <section className="panel-card">
        <div className="panel-header"><h3>Fertilizer guidance</h3></div>
        <ul className="list-stack">
          <li>Suggested nutrient plan: Add 25 kg nitrogen per acre for paddy field.</li>
          <li>Potassium application recommended before flowering stage.</li>
          <li>Use compost blend for soil moisture retention in loamy plots.</li>
        </ul>
      </section>
    </div>
  )
}

function WeatherPage() {
  return (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <div className="eyebrow">Weather & Crop Calendar</div>
          <h2>Weather planning</h2>
        </div>
      </div>

      <section className="panel-grid two-column">
        <div className="panel-card">
          <div className="panel-header"><h3>Current weather</h3></div>
          <div className="weather-current">
            <div className="weather-icon">☀️</div>
            <div>
              <strong>31°C</strong>
              <span>Humidity 68%</span>
              <span>Wind 12 km/h</span>
            </div>
          </div>
        </div>

        <div className="panel-card">
          <div className="panel-header"><h3>Seven-day forecast</h3></div>
          <div className="forecast-strip">
            {weatherForecast.map((day) => (
              <div key={day.day} className="forecast-day">
                <span>{day.day}</span>
                <strong>{day.icon}</strong>
                <small>{day.temp}</small>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

function SchemesPage() {
  return (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <div className="eyebrow">Government Schemes</div>
          <h2>Benefits and support</h2>
        </div>
      </div>

      <section className="scheme-grid">
        {schemeData.map((scheme) => (
          <div key={scheme.name} className="scheme-card">
            <div className="scheme-header">
              <h3>{scheme.name}</h3>
              <span className="status-pill">{scheme.status}</span>
            </div>
            <strong>{scheme.benefit}</strong>
            <p>Eligibility: {scheme.eligibility}</p>
            <p>Required documents: {scheme.docs.join(', ')}</p>
            <div className="card-actions">
              <button type="button" className="secondary-btn">Check eligibility</button>
              <button type="button" className="primary-btn">View details</button>
            </div>
          </div>
        ))}
      </section>
    </div>
  )
}

function LoansPage() {
  return (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <div className="eyebrow">Agricultural Loans</div>
          <h2>Finance options</h2>
        </div>
      </div>

      <section className="market-grid">
        {loanOptions.map((loan) => (
          <div key={loan.name} className="panel-card loan-card">
            <h3>{loan.name}</h3>
            <p>Interest: {loan.rate}</p>
            <p>Term: {loan.duration}</p>
            <p>{loan.benefit}</p>
          </div>
        ))}
      </section>
    </div>
  )
}

function InsurancePage() {
  return (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <div className="eyebrow">Crop Insurance</div>
          <h2>Risk protection</h2>
        </div>
      </div>

      <section className="market-grid">
        {insuranceOptions.map((option) => (
          <div key={option.name} className="panel-card loan-card">
            <h3>{option.name}</h3>
            <p>{option.coverage}</p>
            <p>Documents: {option.docs.join(', ')}</p>
            <span className="status-pill">{option.status}</span>
          </div>
        ))}
      </section>
    </div>
  )
}

function ExpensePage() {
  const [expenses, setExpenses] = useLocalStorage('farm-saathi-expenses', expenseSeed)
  const [form, setForm] = useState({ category: 'Seeds', crop: 'Tomato', amount: '', date: '2026-11-10' })

  const total = useMemo(() => expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0), [expenses])

  const addExpense = () => {
    setExpenses((prev) => [
      ...prev,
      {
        id: Date.now(),
        category: form.category,
        crop: form.crop,
        amount: Number(form.amount || 0),
        date: form.date,
      },
    ])
    setForm({ category: 'Seeds', crop: 'Tomato', amount: '', date: '2026-11-10' })
  }

  return (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <div className="eyebrow">Daily Expense Tracker</div>
          <h2>Track spending</h2>
        </div>
      </div>

      <section className="panel-grid two-column">
        <div className="panel-card">
          <div className="panel-header"><h3>Add expense</h3></div>
          <div className="form-grid">
            <label>Category<select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}><option>Seeds</option><option>Fertilizer</option><option>Labour</option><option>Irrigation</option><option>Transport</option></select></label>
            <label>Crop<select value={form.crop} onChange={(e) => setForm({ ...form, crop: e.target.value })}><option>Tomato</option><option>Rice</option><option>Chilli</option></select></label>
            <label>Amount<input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></label>
            <label>Date<input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></label>
          </div>
          <button type="button" className="primary-btn" onClick={addExpense}>Add expense</button>
        </div>

        <div className="panel-card">
          <div className="panel-header"><h3>Spending summary</h3></div>
          <div className="expense-summary">
            <strong>₹{total.toLocaleString('en-IN')}</strong>
            <span>Total this season</span>
          </div>
          <div className="chart-bars small-bars">
            {[18, 36, 42, 68, 48, 72].map((value, index) => (
              <div key={index} className="bar-col"><span style={{ height: `${value}%` }} /></div>
            ))}
          </div>
        </div>
      </section>

      <section className="panel-card">
        <div className="panel-header"><h3>Expense list</h3></div>
        <div className="table-list">
          {expenses.map((item) => (
            <div key={item.id} className="row-item">
              <span>{item.category}</span>
              <span>{item.crop}</span>
              <span>{item.date}</span>
              <strong>₹{Number(item.amount).toLocaleString('en-IN')}</strong>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

function BudgetPage() {
  return (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <div className="eyebrow">Farm Budget and Profit</div>
          <h2>Financial overview</h2>
        </div>
      </div>

      <section className="summary-grid">
        {budgetSummary.map((item) => (
          <div key={item.label} className="panel-card compact-stat">
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </div>
        ))}
      </section>
    </div>
  )
}

function AssistantPage() {
  const suggestions = ['Need irrigation advice?', 'What is wrong with my chilli crop?', 'How much budget remains for harvest?']

  return (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <div className="eyebrow">AI Farming Assistant</div>
          <h2>Your crop companion</h2>
        </div>
      </div>

      <section className="panel-card chat-panel">
        <div className="messages">
          <div className="message ai">Good morning, Ramesh. Your tomato crop is flowering well and needs moderate irrigation today.</div>
          <div className="message user">Should I apply fertilizer this week?</div>
          <div className="message ai">Yes. A light potassium boost is recommended before the next rain window. Soil moisture is still within range.</div>
        </div>
        <div className="suggestions-row">
          {suggestions.map((item) => (
            <button key={item} type="button" className="secondary-btn ghost">{item}</button>
          ))}
        </div>
        <div className="chat-input-row">
          <input placeholder="Ask Farm Saathi..." />
          <button type="button" className="primary-btn">Send</button>
        </div>
      </section>
    </div>
  )
}

function NotificationsPage() {
  return (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <div className="eyebrow">Notifications</div>
          <h2>Farming alerts</h2>
        </div>
      </div>

      <section className="alert-list">
        {notifications.map((item) => (
          <div key={item.text} className={`notification-item ${item.color}`}>
            <span className="badge">{item.type}</span>
            <div>
              <strong>{item.text}</strong>
              <small>{item.time}</small>
            </div>
          </div>
        ))}
      </section>
    </div>
  )
}

function ProfilePage() {
  return (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <div className="eyebrow">Farmer Profile</div>
          <h2>Profile and settings</h2>
        </div>
      </div>

      <section className="profile-card">
        <div className="profile-avatar">RG</div>
        <div className="profile-info">
          <h3>Ramesh Gowda</h3>
          <p>📍 Mandya, Karnataka</p>
          <p>📞 +91 98765 43210</p>
          <p>🌾 Farm: Green Valley Farm</p>
        </div>
      </section>
    </div>
  )
}

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/my-farm" element={<MyFarmPage />} />
        <Route path="/crop-analyzer" element={<CropAnalyzerPage />} />
        <Route path="/crop-growth" element={<CropGrowthPage />} />
        <Route path="/crop-doctor" element={<CropDoctorPage />} />
        <Route path="/smart-water" element={<SmartWaterPage />} />
        <Route path="/market-price" element={<MarketPricePage />} />
        <Route path="/soil-fertilizer" element={<SoilFertilizerPage />} />
        <Route path="/weather" element={<WeatherPage />} />
        <Route path="/government-schemes" element={<SchemesPage />} />
        <Route path="/loans" element={<LoansPage />} />
        <Route path="/insurance" element={<InsurancePage />} />
        <Route path="/expenses" element={<ExpensePage />} />
        <Route path="/budget" element={<BudgetPage />} />
        <Route path="/ai-assistant" element={<AssistantPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Routes>
    </Layout>
  )
}

export default App
