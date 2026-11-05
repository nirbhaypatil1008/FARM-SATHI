import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { BrowserRouter, NavLink, Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import './AppMvp.css'

const FarmContext = createContext(null)
const navItems = [
  ['/', 'Dashboard', '⌂'], ['/my-farm', 'My farm', '⌂'], ['/crop-analyzer', 'Crop planner', '◈'],
  ['/crop-growth', 'Crop growth', '↗'], ['/crop-doctor', 'Crop Doctor', '✚'], ['/smart-water', 'Water & soil', '♧'],
  ['/weather', 'Weather', '☼'], ['/calendar', 'Farm calendar', '▦'], ['/market-price', 'Mandi prices', '₹'],
  ['/expenses', 'Expenses', '▤'], ['/budget', 'Budget', '◷'], ['/government-schemes', 'Schemes', '▧'],
  ['/loans', 'Loan guide', '₹'], ['/insurance', 'Insurance', '◇'], ['/ai-assistant', 'Farm assistant', '☏'], ['/voice-assistant', 'Voice assistant', '♫'],
  ['/notifications', 'Alerts', '♢'], ['/profile', 'My profile', '○'],
]

const stages = ['Land preparation', 'Seed selection', 'Sowing', 'Germination', 'Seedling', 'Vegetative growth', 'Flowering', 'Fruiting', 'Maturity', 'Harvesting']
const categories = ['Seeds', 'Fertilizers', 'Pesticides', 'Labor', 'Irrigation', 'Equipment', 'Transportation', 'Machinery rental', 'Other']

const t = (text, language) => {
  if (language !== 'kn') return text
  const words = {
    Dashboard: 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್', 'My farm': 'ನನ್ನ ಹೊಲ', 'Crop planner': 'ಬೆಳೆ ಯೋಜನೆ', 'Crop growth': 'ಬೆಳೆ ಬೆಳವಣಿಗೆ',
    Weather: 'ಹವಾಮಾನ', 'Farm calendar': 'ಕೃಷಿ ಕ್ಯಾಲೆಂಡರ್', Expenses: 'ವೆಚ್ಚಗಳು', 'My profile': 'ನನ್ನ ಪ್ರೊಫೈಲ್',
    'Welcome to Farm Saathi': 'ಫಾರ್ಮ್ ಸಾಥಿಗೆ ಸ್ವಾಗತ', 'Save profile': 'ಪ್ರೊಫೈಲ್ ಉಳಿಸಿ',
    'Add crop': 'ಬೆಳೆ ಸೇರಿಸಿ', 'Add expense': 'ವೆಚ್ಚ ಸೇರಿಸಿ', 'Add activity': 'ಕೆಲಸ ಸೇರಿಸಿ',
    'Ask the farm assistant': 'ಕೃಷಿ ಸಹಾಯಕರನ್ನು ಕೇಳಿ', 'Live weather': 'ನೈಜ ಹವಾಮಾನ',
  }
  return words[text] || text
}

function useStoredState(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const saved = localStorage.getItem(`farm-saathi:${key}`)
      if (!saved) return initialValue
      const parsed = JSON.parse(saved)
      const hasDemoModeSetting = localStorage.getItem('farm-saathi:demo-mode') !== null
      const savedProfile = localStorage.getItem('farm-saathi:profile')
      const profileIsEmpty = !savedProfile || JSON.parse(savedProfile) === null
      if (!hasDemoModeSetting && profileIsEmpty) {
        if (key === 'profile' && parsed === null) return initialValue
        if (['crops', 'expenses', 'tasks'].includes(key) && Array.isArray(parsed) && parsed.length === 0) return initialValue
      }
      return parsed
    } catch (error) {
      console.warn(`Could not read saved ${key} data.`, error)
      return initialValue
    }
  })
  const [error, setError] = useState('')
  const updateValue = (nextValue) => {
    setValue(nextValue)
    setError('')
  }

  useEffect(() => {
    const showStorageError = (event) => setError(event.detail)
    window.addEventListener('farm-saathi-storage-error', showStorageError)
    return () => window.removeEventListener('farm-saathi-storage-error', showStorageError)
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(`farm-saathi:${key}`, JSON.stringify(value))
    } catch (storageError) {
      console.error(`Could not save ${key} data.`, storageError)
      window.dispatchEvent(new CustomEvent('farm-saathi-storage-error', { detail: 'This browser could not save your latest changes. Check available storage and try again.' }))
    }
  }, [key, value])

  return [value, updateValue, error]
}

function FarmProvider({ children }) {
  const [profile, setProfile, profileError] = useStoredState('profile', demoProfile)
  const [crops, setCrops, cropsError] = useStoredState('crops', demoCrops)
  const [expenses, setExpenses, expensesError] = useStoredState('expenses', demoExpenses)
  const [tasks, setTasks, tasksError] = useStoredState('tasks', demoTasks)
  const [observations, setObservations, observationsError] = useStoredState('observations', [])
  const [demoMode, setDemoMode, demoModeError] = useStoredState('demo-mode', (() => {
    try {
      const existing = localStorage.getItem('farm-saathi:demo-mode')
      if (existing !== null) return JSON.parse(existing)
      const savedProfile = localStorage.getItem('farm-saathi:profile')
      return !savedProfile || JSON.parse(savedProfile) === null
    } catch (error) {
      console.warn('Could not determine whether to show project sample data.', error)
      return true
    }
  })())
  const [language, setLanguage] = useStoredState('language', 'en')
  const [darkMode, setDarkMode] = useStoredState('dark-mode', false)
  const storageError = [profileError, cropsError, expensesError, tasksError, observationsError, demoModeError].find(Boolean) || ''
  const value = { profile, setProfile, crops, setCrops, expenses, setExpenses, tasks, setTasks, observations, setObservations, demoMode, setDemoMode, language, setLanguage, darkMode, setDarkMode, storageError }
  return <FarmContext.Provider value={value}>{children}</FarmContext.Provider>
}

function useFarm() {
  const context = useContext(FarmContext)
  if (!context) throw new Error('Farm data must be used inside FarmProvider.')
  return context
}

const sessionNow = Date.now()
const sessionDate = new Date(sessionNow)
const money = (amount) => `₹${Number(amount || 0).toLocaleString('en-IN')}`
const dateToday = () => sessionDate.toISOString().slice(0, 10)
const dateOffset = (offset) => new Date(sessionNow + offset * 86400000).toISOString().slice(0, 10)
const daysSince = (date) => Math.max(0, Math.floor((sessionNow - new Date(`${date}T00:00:00`).getTime()) / 86400000))
const percent = (part, total) => total ? Math.min(100, Math.round((part / total) * 100)) : 0
const demoProfile = {
  name: 'Ramesh Gowda', phone: '', email: '', state: 'Karnataka', district: 'Mandya',
  village: 'Srirangapatna', landSize: 4.8, landUnit: 'acres', soil: 'Loamy',
  water: 'Moderate', irrigation: 'Drip', budget: 85000, preferredLanguage: 'English',
}
const demoCrops = [
  { id: 'demo-tomato', name: 'Tomato', field: 'North field', area: 1.5, sowingDate: dateOffset(-52), expectedHarvest: dateOffset(28), variety: 'Local hybrid', irrigation: 'Drip', stageIndex: 6, health: 'Not assessed' },
  { id: 'demo-paddy', name: 'Paddy', field: 'Canal plot', area: 2, sowingDate: dateOffset(-38), expectedHarvest: dateOffset(76), variety: 'Not recorded', irrigation: 'Canal', stageIndex: 5, health: 'Not assessed' },
  { id: 'demo-chilli', name: 'Chilli', field: 'East field', area: 1.3, sowingDate: dateOffset(-70), expectedHarvest: dateOffset(48), variety: 'Not recorded', irrigation: 'Drip', stageIndex: 7, health: 'Not assessed' },
]
const demoExpenses = [
  { id: 'demo-expense-1', category: 'Seeds', crop: 'Tomato', amount: 4800, date: dateOffset(-16), notes: 'Sample record' },
  { id: 'demo-expense-2', category: 'Fertilizers', crop: 'Paddy', amount: 7200, date: dateOffset(-8), notes: 'Sample record' },
  { id: 'demo-expense-3', category: 'Labor', crop: 'Chilli', amount: 5600, date: dateOffset(-3), notes: 'Sample record' },
]
const demoTasks = [
  { id: 'demo-task-1', title: 'Check drip lines in north field', date: dateToday(), type: 'Irrigation', crop: 'Tomato', done: false },
  { id: 'demo-task-2', title: 'Inspect paddy for water level', date: dateOffset(1), type: 'Inspection', crop: 'Paddy', done: false },
  { id: 'demo-task-3', title: 'Record chilli crop observations', date: dateOffset(2), type: 'Field work', crop: 'Chilli', done: false },
  { id: 'demo-task-4', title: 'Review field spending', date: dateOffset(4), type: 'Field work', crop: '', done: false },
]
const weatherDescription = (code) => ({
  0: ['Clear', '☀'], 1: ['Mostly clear', '🌤'], 2: ['Partly cloudy', '⛅'], 3: ['Overcast', '☁'],
  45: ['Fog', '🌫'], 48: ['Rime fog', '🌫'], 51: ['Light drizzle', '🌦'], 53: ['Drizzle', '🌦'],
  55: ['Heavy drizzle', '🌧'], 61: ['Light rain', '🌦'], 63: ['Rain', '🌧'], 65: ['Heavy rain', '🌧'],
  71: ['Light snow', '🌨'], 73: ['Snow', '🌨'], 75: ['Heavy snow', '🌨'], 80: ['Rain showers', '🌦'],
  81: ['Showers', '🌧'], 82: ['Heavy showers', '🌧'], 95: ['Thunderstorm', '⛈'], 96: ['Thunderstorm with hail', '⛈'], 99: ['Severe thunderstorm', '⛈'],
}[code] || ['Weather conditions', '☁'])

async function imageToDataUrl(file) {
  if (!file.type.startsWith('image/')) throw new Error('Choose an image file.')
  if (file.size > 12 * 1024 * 1024) throw new Error('Choose an image smaller than 12 MB.')
  let bitmap
  if (window.createImageBitmap) {
    bitmap = await createImageBitmap(file)
  } else {
    bitmap = await new Promise((resolve, reject) => {
      const image = new Image()
      const url = URL.createObjectURL(file)
      image.onload = () => { URL.revokeObjectURL(url); resolve(image) }
      image.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Could not read this image.')) }
      image.src = url
    })
  }
  const scale = Math.min(1, 960 / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(bitmap.width * scale))
  canvas.height = Math.max(1, Math.round(bitmap.height * scale))
  canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  if ('close' in bitmap) bitmap.close()
  const result = canvas.toDataURL('image/jpeg', 0.72)
  if (result.length > 1_300_000) throw new Error('This image is too large to save in browser storage. Choose a smaller image.')
  return result
}

function Card({ children, className = '' }) {
  return <section className={`m-card ${className}`}>{children}</section>
}

function Heading({ eyebrow, title, detail, action }) {
  return <div className="m-heading"><div>{eyebrow && <span className="m-eyebrow">{eyebrow}</span>}<h1>{title}</h1>{detail && <p>{detail}</p>}</div>{action}</div>
}

function Button({ children, variant = 'primary', ...props }) {
  return <button className={`m-button ${variant}`} {...props}>{children}</button>
}

function Layout() {
  const { profile, language, setLanguage, darkMode, setDarkMode, storageError } = useFarm()
  const loc = profile?.village || profile?.district || 'Add your location'
  const displayName = profile?.name || 'Farmer'
  const initials = displayName.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase()
  return <div className={`m-app ${darkMode ? 'dark' : ''}`}>
    <aside className="m-sidebar">
      <NavLink className="m-brand" to="/"><span className="m-brand-leaf">✿</span><span><b>FARM SAATHI</b><small>Farming made friendly</small></span></NavLink>
      <nav className="m-nav">{navItems.map(([path, label, icon]) => <NavLink key={path} to={path} end={path === '/'} className="m-nav-link"><span className="m-nav-icon">{icon}</span>{t(label, language)}</NavLink>)}</nav>
      <div className="m-sidebar-note">Your farm information stays in this browser.</div>
    </aside>
    <main className="m-main">
      <header className="m-topbar">
        <div className="m-mobile-brand"><span className="m-brand-leaf">✿</span><b>FARM SAATHI</b></div>
        <span className="m-location">⌖ {loc}</span>
        <div className="m-top-actions">
          <label className="m-language"><span className="sr-only">Language</span><select value={language} onChange={(event) => setLanguage(event.target.value)}><option value="en">English</option><option value="kn">ಕನ್ನಡ</option></select></label>
          <button className="m-theme" type="button" onClick={() => setDarkMode(!darkMode)} aria-label="Toggle dark mode">{darkMode ? '☼' : '◐'}</button>
          <NavLink className="m-profile-chip" to="/profile"><span className="m-avatar">{initials}</span><span>{displayName}</span></NavLink>
        </div>
      </header>
      {storageError && <div className="m-storage-error" role="alert">{storageError}</div>}
      <div className="m-content"><Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/my-farm" element={<MyFarmPage />} />
        <Route path="/crop-analyzer" element={<CropPlanner />} />
        <Route path="/crop-growth" element={<CropGrowthPage />} />
        <Route path="/crop-doctor" element={<DiseasePage />} />
        <Route path="/smart-water" element={<SoilWaterPage />} />
        <Route path="/weather" element={<WeatherPage />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/market-price" element={<MarketPage />} />
        <Route path="/expenses" element={<ExpensesPage />} />
        <Route path="/budget" element={<BudgetPage />} />
        <Route path="/government-schemes" element={<SchemesPage />} />
        <Route path="/loans" element={<LoansPage />} />
        <Route path="/insurance" element={<InsurancePage />} />
        <Route path="/ai-assistant" element={<AssistantPage />} />
        <Route path="/voice-assistant" element={<AssistantPage voiceFirst />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes></div>
      <nav className="m-bottom-nav">{[['/', 'Home', '⌂'], ['/my-farm', 'Farm', '♧'], ['/crop-growth', 'Crops', '↗'], ['/weather', 'Weather', '☼'], ['/profile', 'Profile', '○']].map(([path, label, icon]) => <NavLink to={path} end={path === '/'} key={path}><span>{icon}</span><small>{label}</small></NavLink>)}</nav>
    </main>
  </div>
}

function App() {
  return <FarmProvider><BrowserRouter><Layout /></BrowserRouter></FarmProvider>
}

function Dashboard() {
  const { profile, crops, expenses, tasks, language, demoMode, setDemoMode, setProfile, setCrops, setExpenses, setTasks, setObservations } = useFarm()
  const navigate = useNavigate()
  const pending = tasks.filter((task) => !task.done).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 4)
  const expenseTotal = expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0)
  const remainingBudget = Math.max(0, Number(profile?.budget || 0) - expenseTotal)
  const resetDemo = () => {
    if (!window.confirm('Replace all saved farm records in this browser with the sample project data?')) return
    setProfile(demoProfile)
    setCrops(demoCrops)
    setExpenses(demoExpenses)
    setTasks(demoTasks)
    setObservations([])
    setDemoMode(true)
  }
  const startWithOwnData = () => {
    if (!window.confirm('Remove the sample profile, crops, expenses, tasks and notes from this browser? You can then enter your own farm information.')) return
    setProfile(null)
    setCrops([])
    setExpenses([])
    setTasks([])
    setObservations([])
    setDemoMode(false)
  }
  if (!profile) return <Onboarding />
  return <div className="m-page">
    {demoMode && <div className="m-demo-banner"><span><b>PROJECT SAMPLE DATA</b><small>Example farm details, crops, tasks and expenses. Not real farmer records.</small></span><Button variant="light" onClick={() => navigate('/profile')}>Edit sample profile</Button><Button variant="light" onClick={resetDemo}>Reset samples</Button><Button variant="light" onClick={startWithOwnData}>Enter my own farm</Button></div>}
    <div className="m-welcome">
      <div><span className="m-eyebrow">{t('Welcome to Farm Saathi', language)}</span><h1>Namaste, {profile.name} <span>👋</span></h1><p>Your farm companion for the season ahead.</p><div className="m-welcome-meta"><span>⌖ {profile.village || profile.district}, {profile.state}</span><span>▣ {profile.landSize} {profile.landUnit}</span><span>♧ {profile.soil || 'Soil not recorded'} soil</span></div></div>
      <div className="m-welcome-art" aria-hidden="true"><div className="m-sun"></div><span>🌱</span><b>Growing together</b></div>
    </div>
    <section className="m-quick-grid">
      {[['Plan a crop', 'Compare options using farm details.', '/crop-analyzer', '◈', 'mint'], ['Track a crop', 'Update field stages and observations.', '/crop-growth', '↗', 'yellow'], ['Check weather', 'Get the latest forecast for this area.', '/weather', '☼', 'blue'], ['Ask the assistant', 'Summarize your records with the offline guide.', '/ai-assistant', '☏', 'peach'], ['Crop Doctor', 'Save a crop photo and describe a concern.', '/crop-doctor', '✚', 'mint'], ['Mandi prices', 'Open the official source for current rates.', '/market-price', '₹', 'yellow'], ['Expenses', 'Record costs and see category totals.', '/expenses', '▤', 'blue'], ['Farm calendar', 'Add and complete field reminders.', '/calendar', '▦', 'peach']].map(([title, detail, path, icon, color]) => <button key={title} className={`m-quick-card ${color}`} onClick={() => navigate(path)}><span>{icon}</span><b>{title}</b><small>{detail}</small><i>Open →</i></button>)}
    </section>
    <div className="m-stat-grid m-dashboard-stats">
      <Stat label="Registered land" value={`${profile.landSize} ${profile.landUnit}`} />
      <Stat label="Active crop records" value={crops.length} />
      <Stat label="Recorded expenses" value={money(expenseTotal)} />
      <Stat label="Budget remaining" value={profile.budget ? money(remainingBudget) : 'Not set'} />
    </div>
    <div className="m-dashboard-columns">
      <Card><div className="m-section-title"><div><span className="m-eyebrow">On your land</span><h2>My crops</h2></div><NavLink to="/crop-growth">Manage crops →</NavLink></div>
        {crops.length ? <div className="m-crop-list">{crops.slice(0, 4).map((crop) => <div key={crop.id}><CropSummary crop={crop} /><div className="m-dashboard-crop-progress"><div className="m-progress"><span style={{ width: `${crop.stageIndex < 0 ? 0 : percent(crop.stageIndex + 1, stages.length)}%` }} /></div><small>{crop.stageIndex < 0 ? 'Growth stage not recorded' : `${percent(crop.stageIndex + 1, stages.length)}% of recorded lifecycle`} · {crop.health || 'Health not assessed'}</small></div></div>)}</div> : <EmptyState title="No crops registered yet" detail="Add a crop with its sowing date to start tracking real progress." action={<Button onClick={() => navigate('/crop-growth')}>Register a crop</Button>} />}
      </Card>
      <Card><div className="m-section-title"><div><span className="m-eyebrow">Your next steps</span><h2>Upcoming activities</h2></div><NavLink to="/calendar">View calendar →</NavLink></div>
        {pending.length ? <ul className="m-task-list">{pending.map((task) => <li key={task.id}><span className="m-task-dot"></span><span><b>{task.title}</b><small>{task.date === dateToday() ? 'Today' : task.date}{task.crop ? ` · ${task.crop}` : ''}</small></span></li>)}</ul> : <EmptyState title="No upcoming activities" detail="Keep track of field work by adding tasks to your calendar." action={<Button variant="light" onClick={() => navigate('/calendar')}>Add activity</Button>} />}
      </Card>
    </div>
    <div className="m-dashboard-columns">
      <Card><div className="m-section-title"><div><span className="m-eyebrow">Farm finances</span><h2>Expense summary</h2></div><NavLink to="/expenses">See expenses →</NavLink></div><div className="m-finance-total">{money(expenseTotal)}<small>Total recorded farm expenses</small></div><div className="m-inline-stats"><span>{expenses.length} records</span><span>Budget: {profile.budget ? money(profile.budget) : 'Not set'}</span></div><div className="m-dashboard-expense-bars">{categories.map((category) => { const amount = expenses.filter((item) => item.category === category).reduce((sum, item) => sum + Number(item.amount || 0), 0); return amount ? <div key={category}><span>{category}</span><div className="m-progress"><span style={{ width: `${percent(amount, expenseTotal)}%` }} /></div><b>{money(amount)}</b></div> : null })}</div></Card>
      <WeatherPeek location={profile.village || profile.district || 'Mandya'} onOpen={() => navigate('/weather')} />
    </div>
    <div className="m-dashboard-columns">
      <Card><div className="m-section-title"><div><span className="m-eyebrow">Market information</span><h2>Mandi price highlights</h2></div><NavLink to="/market-price">Open source →</NavLink></div><div className="m-not-connected"><span>₹</span><p><b>Live prices not connected</b><small>We do not show sample rates as today's prices. Check Agmarknet for verified market reports.</small></p><a href="https://agmarknet.gov.in/" target="_blank" rel="noreferrer">Agmarknet ↗</a></div></Card>
      <Card><div className="m-section-title"><div><span className="m-eyebrow">Planning guidance</span><h2>Today on your farm</h2></div><NavLink to="/crop-analyzer">Plan a crop →</NavLink></div><p>Crop suggestions are planning estimates, not guarantees. Compare options using your soil, water availability, land size and budget.</p><NavLink className="m-button light" to="/crop-analyzer">View crop recommendations</NavLink><div className="m-dashboard-alert"><b>Health status is not assessed</b><small>Sample crop cards do not represent verified crop-health diagnostics. Add your own observations in Crop Growth.</small><NavLink to="/crop-doctor">Record a concern →</NavLink></div></Card>
    </div>
  </div>
}

function WeatherPeek({ location, onOpen }) {
  const [weather, setWeather] = useState(null)
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')
  const loadWeather = async () => {
    setStatus('loading')
    setError('')
    try {
      const locationResponse = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1&language=en&format=json`)
      if (!locationResponse.ok) throw new Error('Could not look up that area.')
      const locationData = await locationResponse.json()
      const place = locationData.results?.[0]
      if (!place) throw new Error('No matching location found. Check the district in your profile.')
      const query = new URLSearchParams({
        latitude: place.latitude,
        longitude: place.longitude,
        current: 'temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m',
        daily: 'precipitation_probability_max',
        timezone: 'auto',
        forecast_days: '1',
      })
      const weatherResponse = await fetch(`https://api.open-meteo.com/v1/forecast?${query}`)
      if (!weatherResponse.ok) throw new Error('Weather service is currently unavailable.')
      const data = await weatherResponse.json()
      setWeather({ ...data.current, place, rainChance: data.daily?.precipitation_probability_max?.[0] })
      setStatus('ready')
    } catch (requestError) {
      console.error('Dashboard weather lookup failed.', requestError)
      setError(requestError.message || 'Weather lookup failed. Check your connection.')
      setStatus('error')
    }
  }
  return <Card><div className="m-section-title"><div><span className="m-eyebrow">Area forecast</span><h2>Weather snapshot</h2></div><button className="m-plain-action" type="button" onClick={onOpen}>7-day →</button></div>
    {weather ? <div className="m-dashboard-weather"><div><span className="m-weather-symbol">{weatherDescription(weather.weather_code)[1]}</span><b>{Math.round(weather.temperature_2m)}°C</b><small>{weatherDescription(weather.weather_code)[0]} · {weather.place.name}</small></div><div><span>Humidity</span><b>{weather.relative_humidity_2m}%</b></div><div><span>Rain chance today</span><b>{weather.rainChance ?? '—'}%</b></div><small className="m-live-label">LIVE FORECAST · OPEN-METEO</small></div> : <div className="m-weather-empty"><span>☼</span><p><b>{status === 'loading' ? 'Checking current forecast…' : 'Live weather is not loaded'}</b><small>{error || `Fetch current conditions for ${location}. No sample weather is shown.`}</small></p><Button variant="light" onClick={loadWeather} disabled={status === 'loading'}>{status === 'loading' ? 'Loading…' : 'Check weather'}</Button></div>}
  </Card>
}

function Onboarding() {
  return <ProfileForm isNew />
}

function ProfilePage() {
  const { profile } = useFarm()
  return <div className="m-page"><Heading eyebrow="Farmer details" title={profile ? 'Your profile & farm settings' : 'Let’s set up your farm'} detail="These details personalize planning and weather. They are stored only in this browser." /><ProfileForm isNew={!profile} /></div>
}

function ProfileForm({ isNew = false }) {
  const { profile, setProfile, language } = useFarm()
  const navigate = useNavigate()
  const [form, setForm] = useState(profile || { name: '', phone: '', email: '', state: 'Karnataka', district: '', village: '', landSize: '', landUnit: 'acres', soil: '', water: 'Moderate', irrigation: 'Not specified', budget: '', preferredLanguage: 'English' })
  const change = (key) => (event) => setForm((previous) => ({ ...previous, [key]: event.target.value }))
  const submit = (event) => {
    event.preventDefault()
    if (!form.name.trim() || !form.state.trim() || !form.landSize || Number(form.landSize) <= 0) return
    setProfile({ ...form, name: form.name.trim(), landSize: Number(form.landSize), budget: Number(form.budget || 0) })
    if (isNew) navigate('/')
  }
  return <Card className="m-form-card"><form onSubmit={submit} className="m-form">
    <label>Farmer name *<input required value={form.name} onChange={change('name')} placeholder="Your name" /></label>
    <label>Mobile number<input type="tel" value={form.phone} onChange={change('phone')} placeholder="+91" /></label>
    <label>Email (optional)<input type="email" value={form.email} onChange={change('email')} /></label>
    <label>State *<input required value={form.state} onChange={change('state')} /></label>
    <label>District<input value={form.district} onChange={change('district')} placeholder="e.g. Mandya" /></label>
    <label>Village / town<input value={form.village} onChange={change('village')} /></label>
    <label>Land size *<div className="m-input-pair"><input type="number" min="0.01" step="0.01" required value={form.landSize} onChange={change('landSize')} /><select value={form.landUnit} onChange={change('landUnit')}><option>acres</option><option>hectares</option></select></div></label>
    <label>Available budget (₹)<input type="number" min="0" value={form.budget} onChange={change('budget')} placeholder="Optional" /></label>
    <label>Soil type (if known)<select value={form.soil} onChange={change('soil')}><option value="">Not known</option><option>Loamy</option><option>Clay</option><option>Sandy</option><option>Black soil</option><option>Red soil</option></select></label>
    <label>Water availability<select value={form.water} onChange={change('water')}><option>Reliable</option><option>Moderate</option><option>Limited</option><option>Rain-fed</option><option>Not known</option></select></label>
    <label>Irrigation method<select value={form.irrigation} onChange={change('irrigation')}><option>Not specified</option><option>Drip</option><option>Sprinkler</option><option>Flood</option><option>Rain-fed</option></select></label>
    <label>Preferred language<select value={form.preferredLanguage} onChange={change('preferredLanguage')}><option>English</option><option>Kannada</option></select></label>
    <div className="m-form-footer"><p>Local demo: profile data stays in browser storage. Secure account login is not connected.</p><Button type="submit">{t('Save profile', language)}</Button></div>
  </form></Card>
}

function MyFarmPage() {
  const { profile, crops } = useFarm()
  return <div className="m-page"><Heading eyebrow="My farm" title="Your land at a glance" detail="Edit your registered location, soil, water and land details in your profile." action={<NavLink className="m-button primary" to="/profile">Edit farm details</NavLink>} />
    <div className="m-stat-grid"><Stat label="Farm area" value={`${profile?.landSize || 0} ${profile?.landUnit || 'acres'}`} /><Stat label="Soil information" value={profile?.soil || 'Not provided'} /><Stat label="Water availability" value={profile?.water || 'Not provided'} /><Stat label="Irrigation" value={profile?.irrigation || 'Not specified'} /></div>
    <Card><div className="m-section-title"><h2>Registered crops and fields</h2><NavLink to="/crop-growth">Add crop →</NavLink></div>{crops.length ? <div className="m-crop-list">{crops.map((crop) => <CropSummary key={crop.id} crop={crop} />)}</div> : <EmptyState title="No fields added" detail="Register a crop to begin a field record." />}</Card>
  </div>
}

function CropPlanner() {
  const { profile } = useFarm()
  const [form, setForm] = useState({ season: 'Kharif', water: profile?.water || 'Moderate', soil: profile?.soil || '', category: 'Any crop', budget: profile?.budget || '' })
  const [compared, setCompared] = useState([])
  const recommendations = useMemo(() => {
    const catalog = [
      { name: 'Sorghum', soil: ['Black soil', 'Red soil', 'Loamy'], water: 'Low', duration: '90–120 days', cost: 17000, yield: '1.0–1.5 t/acre', need: 'Low to moderate', reason: 'Often considered for relatively dry conditions; confirm local variety and season.' },
      { name: 'Groundnut', soil: ['Sandy', 'Red soil', 'Loamy'], water: 'Moderate', duration: '100–130 days', cost: 22000, yield: '0.7–1.1 t/acre', need: 'Moderate', reason: 'Sandy or well-drained soil may suit groundnut; avoid waterlogging.' },
      { name: 'Maize', soil: ['Loamy', 'Black soil'], water: 'Moderate', duration: '90–120 days', cost: 26000, yield: '1.5–2.5 t/acre', need: 'Moderate to high', reason: 'Consider where drainage and water supply are adequate.' },
      { name: 'Paddy', soil: ['Clay', 'Loamy'], water: 'High', duration: '110–150 days', cost: 38000, yield: '1.5–2.5 t/acre', need: 'High', reason: 'Requires reliable water and a locally suitable planting window.' },
      { name: 'Green gram', soil: ['Sandy', 'Red soil', 'Loamy'], water: 'Low', duration: '60–75 days', cost: 14000, yield: '0.3–0.6 t/acre', need: 'Low', reason: 'Short duration option; verify seasonal suitability with local agriculture services.' },
    ]
    return catalog.map((crop) => {
      let score = 55
      if (form.soil && crop.soil.includes(form.soil)) score += 20
      if (form.water === 'Limited' || form.water === 'Rain-fed') score += crop.water === 'Low' ? 16 : crop.water === 'Moderate' ? 5 : -18
      if (form.water === 'Reliable') score += crop.water === 'High' ? 12 : 4
      if (form.budget && Number(form.budget) < crop.cost * Number(profile?.landSize || 1)) score -= 20
      if (form.season === 'Rabi' && ['Sorghum', 'Green gram'].includes(crop.name)) score += 4
      return { ...crop, score: Math.max(20, Math.min(95, score)), totalCost: Math.round(crop.cost * Number(profile?.landSize || 1)) }
    }).sort((a, b) => b.score - a.score)
  }, [form, profile])
  const toggle = (name) => setCompared((previous) => previous.includes(name) ? previous.filter((item) => item !== name) : previous.length < 3 ? [...previous, name] : previous)
  return <div className="m-page"><Heading eyebrow="Crop planning" title="Explore crop options" detail="A transparent rule-of-thumb shortlist using your soil, water, land and budget. Estimates are not guarantees; check with your local agriculture office before investing." />
    <Card><div className="m-form m-planner-form">
      <label>Soil type<select value={form.soil} onChange={(e) => setForm({ ...form, soil: e.target.value })}><option value="">Unknown</option><option>Loamy</option><option>Clay</option><option>Sandy</option><option>Black soil</option><option>Red soil</option></select></label>
      <label>Water availability<select value={form.water} onChange={(e) => setForm({ ...form, water: e.target.value })}><option>Reliable</option><option>Moderate</option><option>Limited</option><option>Rain-fed</option><option>Not known</option></select></label>
      <label>Season<select value={form.season} onChange={(e) => setForm({ ...form, season: e.target.value })}><option>Kharif</option><option>Rabi</option><option>Summer</option></select></label>
      <label>Budget (₹)<input type="number" min="0" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} /></label>
    </div></Card>
    <div className="m-recommend-grid">{recommendations.map((crop) => <Card key={crop.name}><div className="m-crop-card-head"><span className="m-crop-icon">♧</span><span className="m-score">{crop.score}/100 heuristic</span></div><h2>{crop.name}</h2><p>{crop.reason}</p><div className="m-estimate-label">PLANNING ESTIMATES · VERIFY LOCALLY</div><dl className="m-details"><div><dt>Duration</dt><dd>{crop.duration}</dd></div><div><dt>Water</dt><dd>{crop.need}</dd></div><div><dt>Cost for {profile?.landSize || 0} {profile?.landUnit || 'acres'}</dt><dd>{money(crop.totalCost)}</dd></div><div><dt>Indicative yield / acre</dt><dd>{crop.yield}</dd></div></dl><label className="m-compare"><input type="checkbox" checked={compared.includes(crop.name)} onChange={() => toggle(crop.name)} /> Add to compare (up to 3)</label></Card>)}</div>
    {compared.length > 1 && <Card><h2>Compare options</h2><div className="m-compare-table">{recommendations.filter((crop) => compared.includes(crop.name)).map((crop) => <div key={crop.name}><b>{crop.name}</b><span>Cost: {money(crop.totalCost)}</span><span>Water: {crop.need}</span><span>Duration: {crop.duration}</span><span>Yield estimate: {crop.yield}</span></div>)}</div></Card>}
  </div>
}

function CropGrowthPage() {
  const { crops, setCrops, observations, setObservations, language } = useFarm()
  const [form, setForm] = useState({ name: '', field: '', area: '', sowingDate: dateToday(), expectedHarvest: '', variety: '', irrigation: '' })
  const [note, setNote] = useState({})
  const [photoError, setPhotoError] = useState('')
  const addCrop = (event) => {
    event.preventDefault()
    setCrops((items) => [...items, { ...form, id: crypto.randomUUID(), area: Number(form.area), stageIndex: -1, health: 'Not assessed' }])
    setForm({ name: '', field: '', area: '', sowingDate: dateToday(), expectedHarvest: '', variety: '', irrigation: '' })
  }
  const updateStage = (id, value) => setCrops((items) => items.map((crop) => crop.id === id ? { ...crop, stageIndex: Number(value) } : crop))
  const addObservation = (id) => {
    if (!note[id]?.trim()) return
    setObservations((items) => [{ id: crypto.randomUUID(), cropId: id, text: note[id].trim(), date: dateToday() }, ...items])
    setNote((previous) => ({ ...previous, [id]: '' }))
  }
  return <div className="m-page"><Heading eyebrow="Crop tracking" title="Your growing season" detail="Growth days come from your sowing date. Change stages only when you have observed them; no measurements are generated." />
    <Card><h2>Register a crop</h2><form className="m-form m-crop-form" onSubmit={addCrop}><label>Crop name *<input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Tomato" /></label><label>Field name<input value={form.field} onChange={(e) => setForm({ ...form, field: e.target.value })} placeholder="North field" /></label><label>Area (acres) *<input required type="number" min="0.01" step="0.01" value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} /></label><label>Sowing date *<input required type="date" value={form.sowingDate} onChange={(e) => setForm({ ...form, sowingDate: e.target.value })} /></label><label>Expected harvest (optional)<input type="date" value={form.expectedHarvest} onChange={(e) => setForm({ ...form, expectedHarvest: e.target.value })} /></label><label>Variety<input value={form.variety} onChange={(e) => setForm({ ...form, variety: e.target.value })} /></label><label>Irrigation details<input value={form.irrigation} onChange={(e) => setForm({ ...form, irrigation: e.target.value })} /></label><Button type="submit">{t('Add crop', language)}</Button></form></Card>
    {!crops.length && <EmptyState title="No crops registered" detail="When you add a crop, its actual records will appear here." />}
    <div className="m-stack">{crops.map((crop) => {
      const age = daysSince(crop.sowingDate)
      const progress = Math.round(((crop.stageIndex + 1) / stages.length) * 100)
      return <Card key={crop.id}><div className="m-section-title"><div><span className="m-eyebrow">{crop.field || 'Field'} · {crop.area} acres</span><h2>{crop.name} {crop.variety && `· ${crop.variety}`}</h2></div><button className="m-delete" type="button" onClick={() => setCrops((items) => items.filter((item) => item.id !== crop.id))}>Remove</button></div><div className="m-crop-meta">{age} days since sowing · Expected harvest: {crop.expectedHarvest || 'Not recorded'} · Irrigation: {crop.irrigation || 'Not recorded'}</div><div className="m-progress"><span style={{ width: `${progress}%` }} /></div><div className="m-stage-line">{stages.map((stage, index) => <span className={index <= crop.stageIndex ? 'done' : ''} key={stage}>{index + 1}. {stage}</span>)}</div><label className="m-stage-select">Observed current stage<select value={crop.stageIndex} onChange={(e) => updateStage(crop.id, e.target.value)}><option value="-1">Not recorded</option>{stages.map((stage, index) => <option value={index} key={stage}>{stage}</option>)}</select></label><div className="m-observation-row"><input value={note[crop.id] || ''} onChange={(e) => setNote((previous) => ({ ...previous, [crop.id]: e.target.value }))} placeholder="Add an observation (e.g. leaves look healthy)" /><Button type="button" onClick={() => addObservation(crop.id)}>Save note</Button></div><label className="m-upload">Attach a crop photo<input type="file" accept="image/*" capture="environment" onChange={async (event) => { const file = event.target.files?.[0]; if (!file) return; setPhotoError(''); try { const photo = await imageToDataUrl(file); setObservations((items) => [{ id: crypto.randomUUID(), cropId: crop.id, date: dateToday(), text: 'Crop photo added to field history.', photo }, ...items]) } catch (photoError) { console.error('Could not process crop photo.', photoError); setPhotoError(photoError.message || 'Photo could not be saved.') } }} /><span>Photos are compressed and saved with this browser’s crop history.</span></label>{photoError && <p className="m-error" role="alert">{photoError}</p>}{observations.filter((item) => item.cropId === crop.id).length > 0 && <ul className="m-observation-list">{observations.filter((item) => item.cropId === crop.id).map((item) => <li key={item.id}><b>{item.date}</b> {item.text} {item.photo && <img className="m-history-photo" src={item.photo} alt={`Crop record from ${item.date}`} />} <button type="button" onClick={() => setObservations((all) => all.filter((entry) => entry.id !== item.id))}>Delete</button></li>)}</ul>}</Card>
    })}</div>
  </div>
}

function CropSummary({ crop }) {
  const stage = crop.stageIndex >= 0 ? stages[crop.stageIndex] : 'Stage not recorded'
  return <div className="m-crop-summary"><span className="m-crop-icon">♧</span><span><b>{crop.name}</b><small>{crop.field || 'Field'} · {stage} · {daysSince(crop.sowingDate)} days</small></span><i>{crop.area} ac</i></div>
}

function WeatherPage() {
  const { profile } = useFarm()
  const [location, setLocation] = useState(profile?.village || profile?.district || 'Mandya')
  const [weather, setWeather] = useState(null)
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')
  const load = async (event) => {
    event?.preventDefault()
    if (!location.trim()) return setError('Enter a town or district to look up weather.')
    setStatus('loading'); setError('')
    try {
      const geoResponse = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location.trim())}&count=1&language=en&format=json`)
      if (!geoResponse.ok) throw new Error(`Location lookup failed (${geoResponse.status}).`)
      const geo = await geoResponse.json()
      if (!geo.results?.length) throw new Error('No matching location found. Try a nearby town or district name.')
      const place = geo.results[0]
      const query = new URLSearchParams({ latitude: place.latitude, longitude: place.longitude, current: 'temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m', daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max', timezone: 'auto', forecast_days: '7' })
      const response = await fetch(`https://api.open-meteo.com/v1/forecast?${query}`)
      if (!response.ok) throw new Error(`Weather service failed (${response.status}).`)
      const forecast = await response.json()
      setWeather({ ...forecast, place, fetchedAt: new Date().toLocaleString(), weekdays: forecast.daily.time.map((day) => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][new Date(`${day}T12:00:00`).getDay()]) })
      setStatus('ready')
    } catch (requestError) {
      setStatus('error'); setError(requestError.message || 'Weather lookup failed. Check your connection and try again.')
    }
  }
  return <div className="m-page"><Heading eyebrow="Weather" title="Weather for your area" detail="Forecast loaded from Open-Meteo. Weather is not a substitute for local official warnings." />
    <Card><form className="m-search-row" onSubmit={load}><label>Town or district<input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Mandya" /></label><Button type="submit" disabled={status === 'loading'}>{status === 'loading' ? 'Loading…' : 'Refresh weather'}</Button></form>
      {status === 'loading' && <p className="m-muted">Finding location and latest forecast…</p>}{error && <p className="m-error" role="alert">{error}</p>}
      {weather && <><div className="m-weather-now"><span className="m-weather-symbol">{weatherDescription(weather.current.weather_code)[1]}</span><div><span className="m-eyebrow">Live forecast · {weather.place.name}, {weather.place.admin1 || weather.place.country}</span><h2>{Math.round(weather.current.temperature_2m)}°C · {weatherDescription(weather.current.weather_code)[0]}</h2><p>Humidity {weather.current.relative_humidity_2m}% · Wind {weather.current.wind_speed_10m} km/h · Rain now {weather.current.precipitation} mm</p></div></div><div className="m-forecast">{weather.daily.time.map((day, index) => <div key={day}><b>{weather.weekdays[index]}</b><span>{weatherDescription(weather.daily.weather_code[index])[1]} {Math.round(weather.daily.temperature_2m_max[index])}° / {Math.round(weather.daily.temperature_2m_min[index])}°</span><small>Rain chance {weather.daily.precipitation_probability_max[index] ?? '—'}%</small></div>)}</div><small className="m-muted">Source: Open-Meteo · Retrieved {weather.fetchedAt}</small></>}
    </Card>
    <Card><h2>Use the forecast carefully</h2><p>Forecasts can change and may not reflect conditions in your field. Check local advisories before irrigation, spraying, or other weather-sensitive work.</p></Card>
  </div>
}

function CalendarPage() {
  const { tasks, setTasks, crops, language } = useFarm()
  const [form, setForm] = useState({ title: '', date: dateToday(), type: 'Field work', crop: '' })
  const addTask = (event) => {
    event.preventDefault()
    setTasks((items) => [...items, { ...form, id: crypto.randomUUID(), done: false }].sort((a, b) => a.date.localeCompare(b.date)))
    setForm({ title: '', date: dateToday(), type: 'Field work', crop: '' })
  }
  return <div className="m-page"><Heading eyebrow="Crop calendar" title="Plan and record farm activities" detail="Tasks are reminders you create. The app does not infer a treatment or schedule without field data." />
    <Card><form className="m-form m-task-form" onSubmit={addTask}><label>Activity *<input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Inspect field" /></label><label>Date<input required type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></label><label>Type<select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}><option>Field work</option><option>Irrigation</option><option>Fertilizer</option><option>Inspection</option><option>Harvest</option></select></label><label>Crop<select value={form.crop} onChange={(e) => setForm({ ...form, crop: e.target.value })}><option value="">Any / not specified</option>{crops.map((crop) => <option key={crop.id}>{crop.name}</option>)}</select></label><Button type="submit">{t('Add activity', language)}</Button></form></Card>
    {tasks.length ? <Card><div className="m-task-list">{tasks.map((task) => <div key={task.id} className={`m-task-row ${task.done ? 'completed' : ''}`}><input type="checkbox" checked={task.done} onChange={() => setTasks((all) => all.map((item) => item.id === task.id ? { ...item, done: !item.done } : item))} aria-label={`Mark ${task.title} complete`} /><span><b>{task.title}</b><small>{task.date} · {task.type}{task.crop && ` · ${task.crop}`}</small></span><button className="m-delete" type="button" onClick={() => setTasks((all) => all.filter((item) => item.id !== task.id))}>Delete</button></div>)}</div></Card> : <EmptyState title="No activities planned" detail="Add a reminder for your next field task." />}
  </div>
}

function ExpensesPage() {
  const { expenses, setExpenses, crops, language } = useFarm()
  const [form, setForm] = useState({ category: 'Seeds', crop: '', date: dateToday(), amount: '', notes: '' })
  const [editing, setEditing] = useState(null)
  const [period, setPeriod] = useState('all')
  const [message, setMessage] = useState('')
  const cutoff = period === 'all' ? '' : new Date(sessionNow - (period === 'week' ? 7 : 30) * 86400000).toISOString().slice(0, 10)
  const visible = expenses.filter((item) => !cutoff || item.date >= cutoff)
  const total = visible.reduce((sum, item) => sum + Number(item.amount || 0), 0)
  const categoryTotals = categories.map((category) => ({ category, amount: visible.filter((item) => item.category === category).reduce((sum, item) => sum + Number(item.amount || 0), 0) })).filter((item) => item.amount > 0)
  const submit = (event) => {
    event.preventDefault()
    const entry = { ...form, id: editing || crypto.randomUUID(), amount: Number(form.amount) }
    setExpenses((items) => editing ? items.map((item) => item.id === editing ? entry : item) : [entry, ...items])
    setEditing(null); setForm({ category: 'Seeds', crop: '', date: dateToday(), amount: '', notes: '' })
    setMessage('Expense saved.')
  }
  const edit = (entry) => { setEditing(entry.id); setForm({ category: entry.category, crop: entry.crop, date: entry.date, amount: String(entry.amount), notes: entry.notes || '' }) }
  const exportCsv = () => {
    const rows = [['Date', 'Category', 'Crop', 'Amount INR', 'Notes'], ...visible.map((item) => [item.date, item.category, item.crop || '', item.amount, item.notes || ''])]
    const csv = rows.map((row) => row.map((field) => `"${String(field).replaceAll('"', '""')}"`).join(',')).join('\r\n')
    const link = document.createElement('a'); link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); link.download = 'farm-saathi-expenses.csv'; link.click(); URL.revokeObjectURL(link.href)
  }
  return <div className="m-page"><Heading eyebrow="Expense tracker" title="Know where your money goes" detail="Record actual spending and download your records anytime." action={<Button variant="light" onClick={exportCsv} disabled={!visible.length}>Export CSV</Button>} />
    <div className="m-stat-grid"><Stat label="Total in period" value={money(total)} /><Stat label="Records" value={visible.length} /><label className="m-filter">Show<select value={period} onChange={(e) => setPeriod(e.target.value)}><option value="all">All time</option><option value="week">Last 7 days</option><option value="month">Last 30 days</option></select></label></div>
    <Card><h2>{editing ? 'Edit expense' : 'Add expense'}</h2><form className="m-form m-expense-form" onSubmit={submit}><label>Category<select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>{categories.map((category) => <option key={category}>{category}</option>)}</select></label><label>Crop (optional)<select value={form.crop} onChange={(e) => setForm({ ...form, crop: e.target.value })}><option value="">Not linked</option>{crops.map((crop) => <option key={crop.id}>{crop.name}</option>)}</select></label><label>Date<input type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></label><label>Amount (₹)<input type="number" min="0.01" step="0.01" required value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></label><label className="m-wide-field">Notes<input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></label><div className="m-form-footer">{message && <span role="status">{message}</span>}<Button type="submit">{editing ? 'Save changes' : t('Add expense', language)}</Button>{editing && <Button variant="light" type="button" onClick={() => { setEditing(null); setForm({ category: 'Seeds', crop: '', date: dateToday(), amount: '', notes: '' }) }}>Cancel</Button>}</div></form></Card>
    {categoryTotals.length > 0 && <Card><h2>Category breakdown</h2><div className="m-breakdown">{categoryTotals.map((item) => <div key={item.category}><span>{item.category}</span><div className="m-progress"><span style={{ width: `${percent(item.amount, total)}%` }} /></div><b>{money(item.amount)}</b></div>)}</div></Card>}
    <Card><h2>Expense records</h2>{visible.length ? <div className="m-table">{visible.map((item) => <div className="m-expense-row" key={item.id}><div><b>{item.category}</b><small>{item.date} · {item.crop || 'Unlinked crop'}{item.notes ? ` · ${item.notes}` : ''}</small></div><strong>{money(item.amount)}</strong><button type="button" onClick={() => edit(item)}>Edit</button><button type="button" className="m-delete" onClick={() => setExpenses((all) => all.filter((entry) => entry.id !== item.id))}>Delete</button></div>)}</div> : <EmptyState title="No expenses in this period" detail="Add a record above when you make a farm purchase." />}</Card>
  </div>
}

function BudgetPage() {
  const { profile, expenses, crops } = useFarm()
  const spent = expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0)
  const budget = Number(profile?.budget || 0)
  return <div className="m-page"><Heading eyebrow="Budget" title="Season spending overview" detail="This summary uses your registered budget and expense records; it does not forecast crop profit." /><div className="m-stat-grid"><Stat label="Budget recorded" value={money(budget)} /><Stat label="Expenses recorded" value={money(spent)} /><Stat label="Budget remaining" value={money(Math.max(0, budget - spent))} /></div><Card><h2>Budget progress</h2><div className="m-progress"><span style={{ width: `${percent(spent, budget)}%` }} /></div><p className="m-muted">{budget ? `${percent(spent, budget)}% of recorded budget spent` : 'Add a budget in your profile to view progress.'}</p><p>{crops.length} crop records · {expenses.length} expense records</p></Card></div>
}

function DiseasePage() {
  const { crops, observations, setObservations } = useFarm()
  const [cropId, setCropId] = useState('')
  const [imageName, setImageName] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [note, setNote] = useState('')
  const [saved, setSaved] = useState(false)
  const [photoData, setPhotoData] = useState('')
  const [photoError, setPhotoError] = useState('')
  const loadImage = (file) => {
    if (imageUrl) URL.revokeObjectURL(imageUrl)
    if (!file) { setImageUrl(''); setPhotoData(''); setImageName(''); return }
    setImageName(file.name); setImageUrl(URL.createObjectURL(file)); setSaved(false); setPhotoError('')
    imageToDataUrl(file).then(setPhotoData).catch((error) => { console.error('Could not process disease observation photo.', error); setPhotoError(error.message || 'Photo could not be saved. Choose a smaller image.') })
  }
  const saveReport = () => {
    if (!cropId || !note.trim()) return
    if (imageName && !photoData) return setPhotoError('Wait for the photo to finish processing, or save the observation without a photo.')
    setObservations((items) => [{ id: crypto.randomUUID(), cropId, date: dateToday(), text: `Crop concern: ${note.trim()}${imageName ? ` (photo: ${imageName})` : ''}`, photo: photoData || undefined }, ...items])
    setSaved(true)
  }
  return <div className="m-page"><Heading eyebrow="Crop Doctor" title="Record a crop concern" detail="No disease-detection model is connected. This page will not guess a disease or recommend chemicals." />
    <div className="m-dashboard-columns"><Card><h2>Describe what you see</h2><label className="m-field-label">Affected crop<select value={cropId} onChange={(e) => setCropId(e.target.value)}><option value="">Choose a registered crop</option>{crops.map((crop) => <option key={crop.id} value={crop.id}>{crop.name} · {crop.field || 'Field'}</option>)}</select></label><label className="m-upload">Take or choose a crop photo<input type="file" accept="image/*" capture="environment" onChange={(e) => loadImage(e.target.files?.[0])} /><span>{imageName || 'Choose a clear, well-lit image'}</span></label>{imageUrl && <img className="m-preview-image" src={imageUrl} alt="Selected crop for observation" />}{photoError && <p className="m-error" role="alert">{photoError}</p>}<label className="m-field-label">Symptoms or observations<textarea rows="4" value={note} onChange={(e) => { setNote(e.target.value); setSaved(false) }} placeholder="Describe the visible changes. Avoid applying pesticides based only on an online guess." /></label><Button type="button" onClick={saveReport} disabled={!cropId || !note.trim() || Boolean(imageName && !photoData)}>Save observation</Button>{saved && <p className="m-success" role="status">Observation saved to the crop record. This is not an AI diagnosis.</p>}</Card><Card><span className="m-eyebrow">Status</span><h2>AI image analysis is not connected</h2><p>There is no vision service or agronomist review available in this app yet. If the crop is rapidly worsening, take the photo and observation to your local agriculture extension office.</p><p className="m-warning">Do not mix or apply pesticides without following the product label and qualified local guidance. Never use an image-only dosage recommendation.</p></Card></div>
    {observations.length > 0 && <Card><h2>Crop history observations</h2>{observations.map((item) => <div className="m-history" key={item.id}><b>{item.date}</b><span>{crops.find((crop) => crop.id === item.cropId)?.name || 'Crop'} · {item.text}{item.photo && <img className="m-history-photo" src={item.photo} alt={`Crop observation from ${item.date}`} />}</span></div>)}</Card>}
  </div>
}

function SoilWaterPage() {
  const { profile, crops } = useFarm()
  return <div className="m-page"><Heading eyebrow="Soil & water" title="Use measured information" detail="Soil tests and field measurements matter. This app does not infer nutrients or moisture without records." />
    <div className="m-stat-grid"><Stat label="Known soil type" value={profile?.soil || 'Not provided'} /><Stat label="Water availability" value={profile?.water || 'Not provided'} /><Stat label="Irrigation" value={profile?.irrigation || 'Not specified'} /></div>
    <Card><h2>Practical next steps</h2><ul className="m-bullets"><li>Use a soil test from a recognized lab to guide nutrient decisions.</li><li>Check soil moisture in the root zone before irrigating; recent rainfall may change needs.</li><li>Keep dates and amounts of irrigation and fertilizer in your crop record.</li><li>Ask a local agriculture officer for crop- and soil-specific rates.</li></ul><NavLink className="m-button light" to="/crop-growth">Open crop records</NavLink></Card>
    {crops.length > 0 && <Card><h2>Your active crop context</h2>{crops.map((crop) => <CropSummary key={crop.id} crop={crop} />)}</Card>}
  </div>
}

function MarketPage() {
  return <div className="m-page"><Heading eyebrow="Mandi prices" title="Find verified market prices" detail="No government market-data API is configured, so sample or stale prices are not displayed." /><Card className="m-live-unavailable"><span className="m-status-dot"></span><div><h2>Live price feed not connected</h2><p>Use the official Agmarknet portal to search reported commodity prices by state, district and market. Always check the market's date and unit before selling.</p><a className="m-button primary" href="https://agmarknet.gov.in/" target="_blank" rel="noreferrer">Open Agmarknet ↗</a></div></Card><Card><h2>Why no prices appear here</h2><p>Government data access requires a configured and validated data source. This demo does not invent min, max or modal prices, price history, or a “best mandi” result.</p><p className="m-muted">Source: Directorate of Marketing & Inspection, Government of India · Verify freshness on the official portal.</p></Card></div>
}

const schemes = [
  { name: 'PM-KISAN', description: 'Income support programme. Eligibility and enrolment status must be checked through official channels.', url: 'https://pmkisan.gov.in/' },
  { name: 'PM Fasal Bima Yojana', description: 'Crop insurance information, enrolment and claims. Availability and dates depend on notified crops and area.', url: 'https://pmfby.gov.in/' },
  { name: 'Soil Health Card', description: 'Soil testing and nutrient-management information through the government portal.', url: 'https://soilhealth.dac.gov.in/' },
  { name: 'Kisan Credit Card', description: 'Ask your bank about KCC eligibility, limits, interest and repayment terms.', url: 'https://www.myscheme.gov.in/' },
  { name: 'PM Krishi Sinchayee Yojana', description: 'Irrigation-related programme information. Check current state implementation and eligibility.', url: 'https://pmksy.gov.in/' },
]

function SchemesPage() {
  return <div className="m-page"><Heading eyebrow="Government support" title="Official schemes & services" detail="Links go to government portals. The app does not check eligibility, guarantee benefits, or submit applications." /><div className="m-recommend-grid">{schemes.map((scheme) => <Card key={scheme.name}><span className="m-eyebrow">Official information</span><h2>{scheme.name}</h2><p>{scheme.description}</p><a className="m-text-link" href={scheme.url} target="_blank" rel="noreferrer">Check official site ↗</a></Card>)}</div><p className="m-muted">Scheme rules and deadlines can change. Confirm the latest details with the official portal or local agriculture office.</p></div>
}

function LoansPage() {
  const [principal, setPrincipal] = useState('')
  const [rate, setRate] = useState('7')
  const [months, setMonths] = useState('12')
  const monthly = Number(rate) / 1200
  const emi = Number(principal) > 0 && Number(months) > 0 ? monthly ? Number(principal) * monthly * ((1 + monthly) ** Number(months)) / (((1 + monthly) ** Number(months)) - 1) : Number(principal) / Number(months) : 0
  return <div className="m-page"><Heading eyebrow="Loan guide" title="Understand a loan before applying" detail="Rates and approval are determined by the lender. Check current terms directly with your bank." /><Card><h2>Indicative EMI calculator</h2><div className="m-form m-planner-form"><label>Loan amount (₹)<input type="number" min="0" value={principal} onChange={(e) => setPrincipal(e.target.value)} /></label><label>Annual interest (%)<input type="number" min="0" step="0.1" value={rate} onChange={(e) => setRate(e.target.value)} /></label><label>Repayment period (months)<input type="number" min="1" value={months} onChange={(e) => setMonths(e.target.value)} /></label></div><div className="m-finance-total">{money(emi)}<small>Estimated monthly EMI · excludes fees and lender-specific terms</small></div></Card><Card><h2>Commonly discussed options</h2><ul className="m-bullets"><li>Crop loans and Kisan Credit Card through participating banks.</li><li>Agricultural equipment or irrigation loans, subject to lender eligibility.</li><li>Ask for the annual percentage rate, fees, repayment dates and any applicable interest subvention in writing.</li></ul><a className="m-text-link" href="https://www.myscheme.gov.in/" target="_blank" rel="noreferrer">Explore schemes on myScheme ↗</a></Card></div>
}

function InsurancePage() {
  return <div className="m-page"><Heading eyebrow="Crop insurance" title="Understand cover and claims" detail="This app does not issue policies, check enrolment, or submit claims." /><Card><h2>Pradhan Mantri Fasal Bima Yojana</h2><p>Notified crops, locations, enrolment windows, premiums and claim procedures are season-specific. Check current details on the official portal before relying on coverage.</p><a className="m-button primary" href="https://pmfby.gov.in/" target="_blank" rel="noreferrer">Open PMFBY portal ↗</a></Card><Card><h2>Before enrolling</h2><ul className="m-bullets"><li>Confirm that your crop and area are notified for the current season.</li><li>Check policy dates, covered risks, exclusions and claim reporting deadlines.</li><li>Keep policy details, land records, sowing information and bank details accessible.</li><li>Contact the official helpline or insurer promptly after crop loss; do not rely on this app for filing.</li></ul></Card></div>
}

const CHAT_TOKEN_KEY = 'farm-saathi:chat-token'

async function apiRequest(path, { token, ...options } = {}) {
  const response = await fetch(`/api${path}`, {
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })
  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new Error(body.error || `Request failed (${response.status}).`)
  }
  return response.status === 204 ? null : response.json()
}

async function lookupWeatherForChat(location) {
  if (!location) return { status: 'unavailable', reason: 'Farmer has not entered a district or town.' }
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), 7000)
  try {
    const geoResponse = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1&language=en&format=json`, { signal: controller.signal })
    if (!geoResponse.ok) throw new Error('Location lookup returned an error.')
    const place = (await geoResponse.json()).results?.[0]
    if (!place) throw new Error('No matching weather location was found.')
    const query = new URLSearchParams({
      latitude: place.latitude,
      longitude: place.longitude,
      current: 'temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m',
      daily: 'precipitation_probability_max',
      timezone: 'auto',
      forecast_days: '1',
    })
    const weatherResponse = await fetch(`https://api.open-meteo.com/v1/forecast?${query}`, { signal: controller.signal })
    if (!weatherResponse.ok) throw new Error('Weather forecast could not be retrieved.')
    const forecast = await weatherResponse.json()
    return {
      status: 'live forecast',
      source: 'Open-Meteo',
      retrievedAt: new Date().toISOString(),
      location: `${place.name}, ${place.admin1 || place.country}`,
      current: forecast.current,
      todayRainProbability: forecast.daily?.precipitation_probability_max?.[0] ?? null,
    }
  } catch (error) {
    console.warn('Could not include weather context in chat.', error)
    return { status: 'unavailable', reason: error.name === 'AbortError' ? 'Weather request timed out.' : error.message }
  } finally {
    window.clearTimeout(timeout)
  }
}

function AssistantPage({ voiceFirst = false }) {
  const { profile, crops, tasks, expenses, observations, language } = useFarm()
  const [token, setToken] = useState(() => localStorage.getItem(CHAT_TOKEN_KEY) || '')
  const [user, setUser] = useState(null)
  const [authMode, setAuthMode] = useState('login')
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '' })
  const [conversationList, setConversationList] = useState([])
  const [conversationId, setConversationId] = useState('')
  const [question, setQuestion] = useState('')
  const [pendingReply, setPendingReply] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [health, setHealth] = useState(null)
  const [voiceStatus, setVoiceStatus] = useState('')
  const [voiceLanguage, setVoiceLanguage] = useState(language === 'kn' ? 'kn-IN' : 'en-IN')
  const [speakingMessage, setSpeakingMessage] = useState('')
  const [speechPaused, setSpeechPaused] = useState(false)
  const recognitionRef = useRef(null)
  const context = {
    farmer: profile ? {
      name: profile.name,
      landSize: profile.landSize,
      landUnit: profile.landUnit,
      availableBudget: profile.budget,
      waterAvailability: profile.water,
      irrigationMethod: profile.irrigation,
    } : null,
    crops: crops.map((crop) => ({ ...crop, currentGrowthStage: crop.stageIndex >= 0 ? stages[crop.stageIndex] : 'not recorded', daysAfterSowing: daysSince(crop.sowingDate) })),
    location: profile ? { village: profile.village, district: profile.district, state: profile.state } : null,
    soilInformation: profile?.soil ? { type: profile.soil, source: 'farmer-entered profile; no test values provided' } : null,
    recentCropObservations: observations.slice(0, 15).map(({ cropId, date, text }) => ({ crop: crops.find((crop) => crop.id === cropId)?.name || 'Unknown crop', date, text })),
    fertilizerAndIrrigationHistory: expenses.filter((item) => /fertiliz|irrigat/i.test(item.category)).slice(0, 15),
    plannedAndCompletedActivities: tasks.slice(0, 15),
    recordedExpenses: expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0),
    weather: 'Not supplied unless fetched for this request. Do not infer current weather.',
    marketPrices: 'Not supplied. Do not invent current prices.',
  }
  const activeConversation = conversationList.find((item) => item.id === conversationId)
  const messages = activeConversation?.messages || []
  const suggestions = ['Why are my tomato leaves turning yellow?', 'Summarize my crop stages', 'How much did I record in expenses?', 'Where can I find current mandi prices?']

  useEffect(() => {
    let active = true
    apiRequest('/health').then((data) => { if (active) setHealth(data) }).catch((requestError) => { if (active) setHealth({ error: requestError.message }) })
    return () => { active = false }
  }, [])

  useEffect(() => {
    if (!token) return undefined
    let active = true
    apiRequest('/auth/me', { token }).then(async ({ user: currentUser }) => {
      const { conversations } = await apiRequest('/chat/history', { token })
      if (!active) return
      setUser(currentUser)
      setConversationList(conversations)
      setConversationId((current) => conversations.some((item) => item.id === current) ? current : conversations[0]?.id || '')
      setError('')
    }).catch((requestError) => {
      if (!active) return
      localStorage.removeItem(CHAT_TOKEN_KEY)
      setToken('')
      setError(requestError.message)
    })
    return () => { active = false }
  }, [token])

  useEffect(() => () => {
    recognitionRef.current?.stop()
    window.speechSynthesis?.cancel()
  }, [])

  const refreshHistory = async (keepId = conversationId) => {
    const { conversations } = await apiRequest('/chat/history', { token })
    setConversationList(conversations)
    setConversationId((current) => keepId && conversations.some((item) => item.id === keepId) ? keepId : current && conversations.some((item) => item.id === current) ? current : conversations[0]?.id || '')
  }

  const submitAuth = async (event) => {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      const endpoint = authMode === 'register' ? '/auth/register' : '/auth/login'
      const result = await apiRequest(endpoint, { method: 'POST', body: JSON.stringify(authForm) })
      localStorage.setItem(CHAT_TOKEN_KEY, result.token)
      setToken(result.token)
      setUser(result.user)
      setAuthForm({ name: '', email: '', password: '' })
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    localStorage.removeItem(CHAT_TOKEN_KEY)
    setToken('')
    setUser(null)
    setConversationList([])
    setConversationId('')
  }

  const newChat = async () => {
    setError('')
    try {
      const result = await apiRequest('/chat/new', { method: 'POST', token })
      setConversationId(result.conversationId)
      await refreshHistory(result.conversationId)
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  const removeChat = async () => {
    if (!conversationId || !window.confirm('Delete this conversation and its saved messages?')) return
    setError('')
    try {
      await apiRequest(`/chat/history/${conversationId}`, { method: 'DELETE', token })
      setConversationList((items) => items.filter((item) => item.id !== conversationId))
      setConversationId('')
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  const streamQuestion = async (text = question, retry = false) => {
    const prompt = text.trim()
    if (!prompt || loading) return
    setQuestion('')
    setError('')
    setNotice('')
    setPendingReply('')
    setLoading(true)
    let targetConversation = conversationId
    let streamError = ''
    try {
      const currentContext = {
        ...context,
        weather: await lookupWeatherForChat(profile?.village || profile?.district || ''),
      }
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ conversationId: targetConversation || undefined, message: prompt, context: currentContext, language: voiceLanguage.slice(0, 2) }),
      })
      if (!response.ok) {
        const body = await response.json().catch(() => ({}))
        throw new Error(body.error || `Chat request failed (${response.status}).`)
      }
      if (!response.body) throw new Error('This browser does not support streamed replies. Please refresh and try again.')
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let reply = ''
      while (true) {
        const { value, done } = await reader.read()
        buffer += decoder.decode(value || new Uint8Array(), { stream: !done })
        const events = buffer.split('\n\n')
        buffer = events.pop() || ''
        for (const rawEvent of events) {
          const eventName = rawEvent.match(/^event: ([^\n]+)/m)?.[1]
          const dataLine = rawEvent.split('\n').find((line) => line.startsWith('data: '))
          if (!dataLine) continue
          const data = JSON.parse(dataLine.slice(6))
          if (eventName === 'conversation') {
            targetConversation = data.conversationId
            setConversationId(targetConversation)
          } else if (eventName === 'delta') {
            reply += data.text
            setPendingReply(reply)
          } else if (eventName === 'error') {
            streamError = data.error
          }
        }
        if (done) break
      }
      await refreshHistory(targetConversation)
      if (streamError) throw new Error(streamError)
      setPendingReply('')
    } catch (requestError) {
      setError(requestError.message || 'Chat request failed.')
      if (retry) setNotice('Retry did not complete. Your question remains available below.')
    } finally {
      setLoading(false)
    }
  }

  const retryLast = () => {
    const lastUser = [...messages].reverse().find((message) => message.role === 'user')
    if (lastUser) streamQuestion(lastUser.content, true)
  }

  const startVoice = async () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) return setVoiceStatus('Speech recognition is not available in this browser. Type your question instead, or use a browser/device with Web Speech recognition support.')
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true })
      const recognition = new SpeechRecognition()
      recognitionRef.current = recognition
      recognition.lang = voiceLanguage
      recognition.interimResults = true
      recognition.continuous = false
      recognition.onstart = () => setVoiceStatus('Listening… speak now.')
      recognition.onresult = (event) => {
        const transcript = Array.from(event.results).map((result) => result[0].transcript).join('')
        setQuestion(transcript)
        if (event.results[event.results.length - 1].isFinal) setVoiceStatus('Speech recognized. Review or edit the text before sending.')
      }
      recognition.onerror = (event) => setVoiceStatus(event.error === 'not-allowed' ? 'Microphone permission was denied. Allow microphone access in browser settings, or type your question.' : `Speech recognition failed (${event.error}). Check your connection or type instead.`)
      recognition.onend = () => setVoiceStatus((current) => current === 'Listening… speak now.' ? 'No speech detected. Try again or type your question.' : current)
      recognition.start()
    } catch (requestError) {
      setVoiceStatus(requestError.name === 'NotAllowedError' ? 'Microphone permission was denied. Allow it in browser settings or type your question.' : `Microphone error: ${requestError.message}`)
    }
  }

  const stopVoice = () => {
    recognitionRef.current?.stop()
    setVoiceStatus('Listening stopped.')
  }

  const speak = (id, text) => {
    if (!window.speechSynthesis) return setVoiceStatus('Text-to-speech is not supported in this browser.')
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = voiceLanguage
    utterance.onstart = () => { setSpeakingMessage(id); setSpeechPaused(false) }
    utterance.onend = () => { setSpeakingMessage(''); setSpeechPaused(false) }
    utterance.onerror = () => { setSpeakingMessage(''); setVoiceStatus('Speech playback failed. Your written reply is still available.') }
    window.speechSynthesis.speak(utterance)
  }

  const pauseSpeech = () => {
    if (speechPaused) {
      window.speechSynthesis.resume()
      setSpeechPaused(false)
    } else {
      window.speechSynthesis.pause()
      setSpeechPaused(true)
    }
  }
  const stopSpeech = () => {
    window.speechSynthesis?.cancel()
    setSpeakingMessage('')
    setSpeechPaused(false)
  }
  const copy = async (text) => {
    try {
      await navigator.clipboard.writeText(text)
      setNotice('Reply copied to clipboard.')
    } catch (copyError) {
      console.error('Clipboard access failed.', copyError)
      setError('Could not copy this reply. Clipboard permission may be blocked.')
    }
  }

  if (!user) return <div className="m-page"><Heading eyebrow={voiceFirst ? 'Voice assistant' : 'Farm assistant'} title={voiceFirst ? 'Speak with your farm assistant' : 'Gemini farming assistant'} detail="Sign in or create an account to save conversations securely in the local backend database." /><Card className="m-auth-card"><div className="m-assistant-banner"><span>☏</span><div><h2>{health?.gemini?.configured ? 'Gemini configured' : 'Gemini key needed'}</h2><p>{health?.error ? `Backend unavailable: ${health.error}` : health?.gemini?.configured ? `Connected server model: ${health.gemini.model}` : 'Set GEMINI_API_KEY in server/.env and restart the backend to enable real AI replies.'}</p></div></div><div className="m-auth-tabs"><button type="button" className={authMode === 'login' ? 'active' : ''} onClick={() => setAuthMode('login')}>Sign in</button><button type="button" className={authMode === 'register' ? 'active' : ''} onClick={() => setAuthMode('register')}>Create account</button></div><form className="m-form" onSubmit={submitAuth}>{authMode === 'register' && <label>Your name<input autoComplete="name" required minLength="2" value={authForm.name} onChange={(event) => setAuthForm({ ...authForm, name: event.target.value })} /></label>}<label>Email<input autoComplete="email" type="email" required value={authForm.email} onChange={(event) => setAuthForm({ ...authForm, email: event.target.value })} /></label><label>Password (at least 10 characters)<input autoComplete={authMode === 'register' ? 'new-password' : 'current-password'} type="password" minLength="10" required value={authForm.password} onChange={(event) => setAuthForm({ ...authForm, password: event.target.value })} /></label><Button type="submit" disabled={loading}>{loading ? 'Please wait…' : authMode === 'register' ? 'Create account' : 'Sign in'}</Button></form>{error && <p className="m-error" role="alert">{error}</p>}<p className="m-muted">Account credentials and chat history are stored by the local Express service in SQLite. This is a development setup; use HTTPS and a production database before deployment.</p></Card></div>

  return <div className="m-page"><Heading eyebrow={voiceFirst ? 'Voice-first assistant' : 'Farm assistant'} title={voiceFirst ? 'Talk to your farm assistant' : 'Ask Gemini about your farm'} detail="Gemini uses the farm records currently available in this browser. It will be clear when information is missing." action={<div className="m-assistant-heading-actions"><span className={`m-backend-status ${health?.gemini?.configured ? 'ready' : ''}`}>{health?.gemini?.configured ? `Gemini · ${health.gemini.model}` : 'Gemini key not configured'}</span><Button variant="light" onClick={newChat}>＋ New chat</Button><Button variant="light" onClick={logout}>Sign out</Button></div>} />
    <Card><div className="m-assistant-banner"><span>{voiceFirst ? '♫' : '☏'}</span><div><h2>Hello, {user.name}</h2><p>Farm context included: {profile?.district || 'location not set'} · {crops.length} crops · {observations.length} observations · {expenses.length} expenses</p></div></div>
      <div className="m-chat-toolbar">{conversationList.length > 0 && <label>Conversation<select value={conversationId} onChange={(event) => setConversationId(event.target.value)}>{conversationList.map((item) => <option key={item.id} value={item.id}>{item.title.slice(0, 55)} · {new Date(item.updated_at).toLocaleDateString()}</option>)}</select></label>}{conversationId && <Button variant="light" onClick={removeChat}>Delete chat</Button>}</div>
      {voiceFirst && <section className="m-voice-console"><div className={`m-listening-indicator ${voiceStatus.startsWith('Listening') ? 'active' : ''}`}>{voiceStatus.startsWith('Listening') ? '● Listening' : '🎙'}</div><div><h2>Ask in your language</h2><p>{voiceStatus || 'Tap the microphone and speak. Recognized words appear below so you can review them before sending.'}</p></div><Button type="button" onClick={startVoice}>🎙 Start listening</Button><Button type="button" variant="light" onClick={stopVoice}>Stop listening</Button></section>}
      {messages.length === 0 && !pendingReply ? <div className="m-empty"><span className="m-empty-icon">☏</span><b>Start a new farming conversation</b><p>Ask a question and Gemini will use your farm details where they are available.</p></div> : <div className="m-chat-history">{messages.map((message) => <article className="m-chat-turn" key={message.id}><p className={`m-chat-${message.role === 'user' ? 'question' : 'reply'}`}><b>{message.role === 'user' ? 'You' : 'Farm Saathi · Gemini'}</b><span>{message.content}</span>{message.role === 'model' && <span className="m-message-actions"><button type="button" onClick={() => copy(message.content)}>Copy</button><button type="button" onClick={() => speak(message.id, message.content)}>🔊 Listen</button>{speakingMessage === message.id && <><button type="button" onClick={pauseSpeech}>{speechPaused ? 'Resume' : 'Pause'}</button><button type="button" onClick={stopSpeech}>Stop</button></>}</span>}</p></article>)}
      {pendingReply && <article className="m-chat-turn"><p className="m-chat-reply"><b>Farm Saathi · Gemini</b><span>{pendingReply}</span></p></article>}
      {loading && !pendingReply && <div className="m-typing"><span></span><span></span><span></span> Gemini is thinking…</div>}
      </div>}
      <div className="m-language-row"><label>Voice and answer language<select value={voiceLanguage} onChange={(event) => setVoiceLanguage(event.target.value)}><option value="en-IN">English (India)</option><option value="kn-IN">ಕನ್ನಡ (Kannada)</option><option value="hi-IN">हिन्दी (Hindi)</option><option value="ta-IN">தமிழ் (Tamil)</option><option value="te-IN">తెలుగు (Telugu)</option><option value="mr-IN">मराठी (Marathi)</option></select></label><small>Speech support depends on your browser/device. Gemini language output follows your selection where possible.</small></div>
      <form className="m-chat-compose" onSubmit={(event) => { event.preventDefault(); streamQuestion() }}><textarea rows={voiceFirst ? 4 : 3} value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Ask about your crops, field observations, expenses, or farming plans…" /><div><Button type="button" variant="light" onClick={startVoice}>🎙 Microphone</Button>{voiceStatus.startsWith('Listening') && <Button type="button" variant="light" onClick={stopVoice}>Stop microphone</Button>}<Button type="submit" disabled={!question.trim() || loading}>{loading ? 'Getting response…' : 'Send to Gemini'}</Button>{messages.some((message) => message.role === 'user') && <Button type="button" variant="light" onClick={retryLast} disabled={loading}>Retry last question</Button>}</div></form>
      {voiceStatus && !voiceFirst && <p className="m-muted" role="status">{voiceStatus}</p>}{error && <p className="m-error" role="alert">{error}</p>}{notice && <p className="m-success" role="status">{notice}</p>}
      <p className="m-warning">AI responses can be wrong. Do not treat them as a disease diagnosis, soil test, pesticide prescription, live price, or official eligibility decision.</p>
    </Card>
    <Card><h2>Suggested farming questions</h2><div className="m-topic-list">{suggestions.map((suggestion) => <div key={suggestion}><span>{suggestion}</span><button type="button" onClick={() => setQuestion(suggestion)}>Use question</button></div>)}</div></Card>
  </div>
}

function NotificationsPage() {
  const { tasks, crops } = useFarm()
  const due = tasks.filter((task) => !task.done && task.date <= dateToday())
  return <div className="m-page"><Heading eyebrow="Alerts" title="Your reminders" detail="Only reminders you create are shown. Push notifications are not configured." />{due.length ? <Card><h2>Due or overdue activities</h2>{due.map((task) => <div className="m-history" key={task.id}><b>{task.date}</b><span>{task.title}{task.crop && ` · ${task.crop}`}</span></div>)}</Card> : <EmptyState title="No activities due" detail="Add reminders in your farm calendar to see them here." />}<Card><h2>Records needing attention</h2><p>{crops.length ? `${crops.length} crop record${crops.length === 1 ? '' : 's'} available for tracking.` : 'Register a crop to start a crop record.'}</p><NavLink className="m-text-link" to="/crop-growth">Open crop tracker →</NavLink></Card></div>
}

function Stat({ label, value }) {
  return <Card className="m-stat"><span>{label}</span><b>{value}</b></Card>
}

function EmptyState({ title, detail, action }) {
  return <div className="m-empty"><span className="m-empty-icon">♧</span><b>{title}</b><p>{detail}</p>{action}</div>
}

export default App
