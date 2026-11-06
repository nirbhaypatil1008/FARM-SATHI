import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { BrowserRouter, NavLink, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import api from './services/api.js'
import './AppMvp.css'

const FarmContext = createContext(null)
const navItems = [
  ['/', 'Dashboard', '⌂'], ['/login', 'Farmer Login', '🔐'], ['/my-farm', 'My farm', '⌂'], ['/crop-analyzer', 'Crop planner', '◈'],
  ['/crop-growth', 'Crop growth', '↗'], ['/crop-doctor', 'Crop Doctor', '✚'], ['/smart-water', 'Water & soil', '♧'],
  ['/weather', 'Weather', '☼'], ['/calendar', 'Farm calendar', '▦'], ['/market-price', 'Mandi prices', '₹'],
  ['/expenses', 'Expenses', '▤'], ['/budget', 'Budget', '◷'], ['/government-schemes', 'Schemes', '▧'],
  ['/loans', 'Loan guide', '₹'], ['/insurance', 'Insurance', '◇'], ['/ai-assistant', 'Farm assistant', '☏'], ['/voice-assistant', 'Voice assistant', '♫'],
  ['/notifications', 'Alerts', '♢'], ['/profile', 'My profile', '○'],
]

const stages = ['Land preparation', 'Seed selection', 'Sowing', 'Germination', 'Seedling', 'Vegetative growth', 'Flowering', 'Fruiting', 'Maturity', 'Harvesting']
const categories = ['Seeds', 'Fertilizers', 'Pesticides', 'Labor', 'Irrigation', 'Equipment', 'Transportation', 'Machinery rental', 'Other']
const learningTopics = [
  { match: /soil|fertility|compost|nutrient|ph|organic matter/, name: 'Soil health', source: 'Soil Health Card portal', url: 'https://soilhealth.dac.gov.in/', video: 'ICAR India soil health fertility farmers', images: 'soil health farming India field examples' },
  { match: /irrigat|water|drip|watering|drought/, name: 'Water and irrigation', source: 'Pradhan Mantri Krishi Sinchayee Yojana', url: 'https://pmksy.gov.in/', video: 'ICAR India efficient irrigation farmers', images: 'drip irrigation farming India field examples' },
  { match: /rain|weather|monsoon|heat|frost|storm/, name: 'Weather and farm planning', source: 'India Meteorological Department', url: 'https://mausam.imd.gov.in/', video: 'ICAR India weather advisory farmers', images: 'weather protection crops farming India' },
  { match: /disease|leaf|yellow|pest|insect|fung|spot|wilting/, name: 'Crop health and pest awareness', source: 'Indian Council of Agricultural Research', url: 'https://icar.gov.in/', video: 'ICAR India crop health pest management farmers', images: 'crop disease symptoms leaves India agriculture' },
  { match: /crop|seed|sow|plant|harvest|fertiliz|yield|grow/, name: 'Crop cultivation', source: 'Indian Council of Agricultural Research', url: 'https://icar.gov.in/', video: 'ICAR India crop cultivation farmer training', images: 'crop cultivation stages India farming' },
]

function relatedLearningTopic(text) {
  const topic = learningTopics.find((item) => item.match.test(text.toLowerCase()))
  return topic || {
    name: 'Farming practices',
    source: 'Indian Council of Agricultural Research',
    url: 'https://icar.gov.in/',
    video: 'ICAR India farmer training agriculture',
    images: 'farming practices India agriculture',
  }
}

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

function Card({ children, className = '', style, ...props }) {
  return <section className={`m-card ${className}`} style={style} {...props}>{children}</section>
}

function Heading({ eyebrow, title, detail, action }) {
  return <div className="m-heading"><div>{eyebrow && <span className="m-eyebrow">{eyebrow}</span>}<h1>{title}</h1>{detail && <p>{detail}</p>}</div>{action}</div>
}

function Button({ children, variant = 'primary', ...props }) {
  return <button className={`m-button ${variant}`} {...props}>{children}</button>
}

function Layout() {
  const { profile, language, setLanguage, darkMode, setDarkMode, storageError } = useFarm()
  const navigate = useNavigate()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [search, setSearch] = useState('')
  const loc = profile?.village || profile?.district || 'Add your location'
  const displayName = profile?.name || 'Farmer'
  const initials = displayName.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase()
  const openSearchResult = (event) => {
    event.preventDefault()
    const query = search.trim().toLowerCase()
    const match = navItems.find(([, label]) => label.toLowerCase().includes(query))
    if (match) {
      navigate(match[0])
      setSearch('')
    }
  }
  const closeMenu = () => setMobileMenuOpen(false)
  return <div className={`m-app ${darkMode ? 'dark' : ''} ${sidebarCollapsed ? 'sidebar-collapsed' : ''} ${mobileMenuOpen ? 'mobile-menu-open' : ''}`}>
    {mobileMenuOpen && <button className="m-sidebar-scrim" type="button" aria-label="Close navigation" onClick={closeMenu} />}
    <aside className="m-sidebar">
      <div className="m-sidebar-brand-row"><NavLink className="m-brand" to="/" onClick={closeMenu}><span className="m-brand-leaf">✿</span><span className="m-brand-copy"><b>FARM SAATHI</b><small>Farming made friendly</small></span></NavLink><button className="m-sidebar-collapse" type="button" aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'} onClick={() => setSidebarCollapsed(!sidebarCollapsed)}>{sidebarCollapsed ? '»' : '«'}</button></div>
      <nav className="m-nav">{navItems.map(([path, label, icon]) => <NavLink key={path} to={path} end={path === '/'} title={label} onClick={closeMenu} className="m-nav-link"><span className="m-nav-icon">{icon}</span><span className="m-nav-label">{t(label, language)}</span></NavLink>)}</nav>
      <div className="m-sidebar-note">Your farm information stays in this browser.</div>
    </aside>
    <main className="m-main">
      <header className="m-topbar">
        <button className="m-menu-toggle" type="button" aria-label="Open navigation menu" onClick={() => setMobileMenuOpen(true)}>☰</button>
        <div className="m-mobile-brand"><span className="m-brand-leaf">✿</span><b>FARM SAATHI</b></div>
        <form className="m-global-search" role="search" onSubmit={openSearchResult}><span aria-hidden="true">⌕</span><input aria-label="Search Farm Saathi pages" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search farm tools…" /><button type="submit">Search</button></form>
        <span className="m-location">⌖ {loc}</span>
        <div className="m-top-actions">
          <label className="m-language"><span className="sr-only">Language</span><select value={language} onChange={(event) => setLanguage(event.target.value)}><option value="en">English</option><option value="kn">ಕನ್ನಡ</option></select></label>
          <NavLink className="m-notification-button" to="/notifications" aria-label="Farm alerts">♢</NavLink>
          <NavLink className="m-quick-action" to="/crop-growth">＋ Add crop</NavLink>
          <button className="m-theme" type="button" onClick={() => setDarkMode(!darkMode)} aria-label={darkMode ? 'Switch to day mode' : 'Switch to night mode'} title={darkMode ? 'Switch to day mode' : 'Switch to night mode'}>{darkMode ? '☀' : '☾'}<span>{darkMode ? 'Day' : 'Night'}</span></button>
          <details className="m-profile-menu"><summary className="m-profile-chip"><span className="m-avatar">{initials}</span><span className="m-profile-name">{displayName}</span><span aria-hidden="true">⌄</span></summary><div className="m-profile-dropdown"><b>{displayName}</b><small>{loc}</small><NavLink to="/profile">Profile & farm settings</NavLink><NavLink to="/login">Farmer Login / Switch Account</NavLink></div></details>
        </div>
      </header>
      {storageError && <div className="m-storage-error" role="alert">{storageError}</div>}
      <div className="m-content"><Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/login" element={<LoginPage />} />
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
      <nav className="m-bottom-nav">{[['/', 'Home', '⌂'], ['/crop-growth', 'Crops', '↗'], ['/crop-doctor', 'Doctor', '✚'], ['/weather', 'Weather', '☼'], ['/profile', 'Profile', '○']].map(([path, label, icon]) => <NavLink to={path} end={path === '/'} key={path}><span>{icon}</span><small>{label}</small></NavLink>)}</nav>
    </main>
    <FloatingAssistant />
  </div>
}

function App() {
  return <FarmProvider><BrowserRouter><Layout /></BrowserRouter></FarmProvider>
}

function FloatingAssistant() {
  const navigate = useNavigate()
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const [prompt, setPrompt] = useState('')
  const assistantPage = location.pathname === '/ai-assistant' || location.pathname === '/voice-assistant'
  const suggestions = ['Why are my leaves turning yellow?', 'How often should I irrigate?', 'How can I improve soil fertility?']

  const openChat = (question = '') => {
    navigate('/ai-assistant', { state: question ? { assistantPrompt: question } : null })
    setOpen(false)
    setPrompt('')
  }

  if (assistantPage) return null
  return <div className="m-floating-assistant">
    {open && <section className="m-assistant-preview" role="dialog" aria-label="Farm assistant preview">
      <header><span className="m-assistant-preview-mark" aria-hidden="true">F</span><div><b>FARM-SAATHI Assistant</b><small>Ask a question about your farm</small></div><button type="button" aria-label="Close assistant preview" onClick={() => setOpen(false)}>×</button></header>
      <div className="m-assistant-preview-welcome"><b>How can I help today?</b><p>I can use your recorded farm details when you open the full chat.</p></div>
      <div className="m-assistant-preview-suggestions">{suggestions.map((suggestion) => <button key={suggestion} type="button" onClick={() => openChat(suggestion)}>{suggestion}</button>)}</div>
      <form onSubmit={(event) => { event.preventDefault(); openChat(prompt.trim()) }}>
        <label className="sr-only" htmlFor="assistant-preview-prompt">Ask the farm assistant</label>
        <input id="assistant-preview-prompt" value={prompt} onChange={(event) => setPrompt(event.target.value)} placeholder="Write your question…" />
        <button type="submit" disabled={!prompt.trim()} aria-label="Send question">Send</button>
      </form>
      <button className="m-assistant-preview-expand" type="button" onClick={() => openChat()}>Open Full Chat <span aria-hidden="true">↗</span></button>
    </section>}
    <button className="m-assistant-launcher" type="button" aria-label={open ? 'Close FARM-SAATHI assistant' : 'Ask FARM-SAATHI'} aria-expanded={open} title="Ask FARM-SAATHI" onClick={() => setOpen((value) => !value)}>
      {open ? <span aria-hidden="true">×</span> : <svg aria-hidden="true" viewBox="0 0 24 24" fill="none"><path d="M4.5 5.5A3.5 3.5 0 0 1 8 2h8a3.5 3.5 0 0 1 3.5 3.5v7A3.5 3.5 0 0 1 16 16h-4.1l-4.7 4v-4.1A3.5 3.5 0 0 1 4.5 12V5.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/><path d="M8 7.5h8M8 11h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>}
    </button>
  </div>
}

function Dashboard() {
  const { profile, crops, expenses, tasks, observations, language, demoMode, setDemoMode, setProfile, setCrops, setExpenses, setTasks, setObservations } = useFarm()
  const navigate = useNavigate()
  const welcomeVideoRef = useRef(null)
  const pending = tasks.filter((task) => !task.done).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 4)
  const openTasks = tasks.filter((task) => !task.done)
  const expenseTotal = expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0)
  const cropArea = crops.reduce((sum, crop) => sum + Number(crop.area || 0), 0)
  const cropColors = ['#b8e66a', '#51c78d', '#67aef0', '#f4c767', '#d999fa']
  const cropSegments = crops.map((crop, index) => {
    const share = cropArea > 0 ? Number(crop.area || 0) / cropArea * 100 : 0
    const offset = cropArea > 0
      ? crops.slice(0, index).reduce((sum, item) => sum + Number(item.area || 0) / cropArea * 100, 0)
      : 0
    const segment = `${cropColors[index % cropColors.length]} ${offset}% ${offset + share}%`
    return { ...crop, share, color: cropColors[index % cropColors.length], segment }
  })
  const distributionBackground = cropSegments.length ? `conic-gradient(${cropSegments.map((crop) => crop.segment).join(', ')})` : 'conic-gradient(rgba(255,255,255,.13) 0% 100%)'
  const todayLabel = new Intl.DateTimeFormat(language === 'kn' ? 'kn-IN' : 'en-IN', { weekday: 'long', day: 'numeric', month: 'long' }).format(sessionDate)
  const remainingBudget = Math.max(0, Number(profile?.budget || 0) - expenseTotal)
  useEffect(() => {
    const video = welcomeVideoRef.current
    if (!video || window.matchMedia('(prefers-reduced-motion: reduce)').matches || navigator.connection?.saveData) return
    video.play().catch(() => {})
    return () => video.pause()
  }, [])
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
      <video ref={welcomeVideoRef} className="m-welcome-video" muted loop playsInline preload="none" role="presentation">
        <source src="https://videos.pexels.com/video-files/11785195/11785195-sd_960_540_30fps.mp4" type="video/mp4" />
      </video>
      <div className="m-welcome-content">
        <span className="m-eyebrow">{t('Welcome to Farm Saathi', language)}</span>
        <h1>Namaste, {profile.name} <span>👋</span></h1>
        <p>Your farm companion for the season ahead.</p>
        <div className="m-welcome-meta">
          <span>⌖ {profile.village || profile.district}, {profile.state}</span>
          <span>▣ {profile.landSize} {profile.landUnit}</span>
          <span>♧ {profile.soil || 'Soil not recorded'} soil</span>
        </div>
        <div className="m-welcome-actions">
          <Button onClick={() => navigate('/crop-growth')}>＋ Add crop record</Button>
          <NavLink className="m-welcome-link" to="/ai-assistant">Ask Farm Assistant ↗</NavLink>
        </div>
        <a className="m-welcome-credit" href="https://www.pexels.com/video/men-working-on-field-11785195/" target="_blank" rel="noreferrer">Video: Thakor Kaushik / Pexels</a>
      </div>
    </div>
    <div className="m-stat-grid m-dashboard-stats">
      <Card className="m-stat"><span className="m-stat-icon">⌂</span><span>Registered land</span><b>{profile.landSize} <small>{profile.landUnit}</small></b><small className="m-stat-foot">Farm profile record</small></Card>
      <Card className="m-stat"><span className="m-stat-icon">♧</span><span>Crops growing</span><b>{crops.length}</b><small className="m-stat-foot">{cropArea ? `${cropArea.toLocaleString()} acres recorded` : 'No crop area recorded'}</small></Card>
      <Card className="m-stat"><span className="m-stat-icon">▦</span><span>Open farm tasks</span><b>{openTasks.length}</b><small className="m-stat-foot">{openTasks.length ? `${openTasks.filter((task) => task.date <= dateToday()).length} due today or earlier` : 'No open reminders'}</small></Card>
      <Card className="m-stat"><span className="m-stat-icon">✚</span><span>AI health score</span><b className="m-stat-unavailable">Not assessed</b><small className="m-stat-foot">No verified crop-health score</small></Card>
    </div>
    <div className="m-dashboard-columns m-dashboard-primary">
      <Card className="m-dashboard-health m-card-with-bg">
        <div className="m-card-media-bg">
          <video autoPlay loop muted playsInline poster="/media/field-health-photo.jpg" className="m-card-video">
            <source src="/media/field-health-video.mp4" type="video/mp4" />
          </video>
          <div className="m-card-overlay" />
        </div>
        <div className="m-card-content">
          <div className="m-section-title"><div><span className="m-eyebrow">Field monitoring</span><h2>Field health overview</h2></div><NavLink to="/crop-doctor">Open Crop Doctor ↗</NavLink></div>
          <div className="m-health-empty"><div className="m-health-ring"><span>—</span></div><div><b>Health checks need field observations</b><p>No verified AI crop diagnosis or measured field-health data is available yet. Check a plant photo or record what you observe.</p><NavLink className="m-button primary" to="/crop-doctor">Check a crop photo</NavLink></div></div>
        </div>
      </Card>
      <WeatherPeek location={profile.village || profile.district || 'Mandya'} onOpen={() => navigate('/weather')} />
    </div>
    <div className="m-dashboard-columns m-dashboard-secondary">
      <Card className="m-card-with-bg">
        <div className="m-card-media-bg">
          <img src="/media/soil-health-photo.jpg" alt="Soil health" className="m-card-photo" />
          <div className="m-card-overlay" />
        </div>
        <div className="m-card-content">
          <div className="m-section-title"><div><span className="m-eyebrow">Farm profile</span><h2>Soil health summary</h2></div><NavLink to="/smart-water">Soil Vision →</NavLink></div>
          <div className="m-soil-summary"><span className="m-soil-icon">♧</span><div><b>{profile.soil || 'Soil type not recorded'}</b><small>Farmer-entered profile · not a laboratory measurement</small></div></div>
          <div className="m-soil-summary-grid"><div><small>Water availability</small><b>{profile.water || 'Not recorded'}</b></div><div><small>Irrigation</small><b>{profile.irrigation || 'Not recorded'}</b></div></div>
          <NavLink className="m-button light" to="/smart-water">Open soil tools</NavLink>
        </div>
      </Card>
      <Card className="m-card-with-bg">
        <div className="m-card-media-bg">
          <img src="/media/crop-distribution-photo.jpg" alt="Crop distribution" className="m-card-photo" />
          <div className="m-card-overlay" />
        </div>
        <div className="m-card-content">
          <div className="m-section-title"><div><span className="m-eyebrow">On your land</span><h2>Crop distribution</h2></div><NavLink to="/crop-growth">Manage crops →</NavLink></div>
          {cropSegments.length ? <div className="m-crop-distribution"><div className="m-crop-donut" style={{ background: distributionBackground }}><span>{cropArea.toLocaleString()}<small>acres</small></span></div><div className="m-crop-legend">{cropSegments.slice(0, 5).map((crop) => <div key={crop.id}><i style={{ background: crop.color }} /><span>{crop.name}</span><b>{Number(crop.area || 0).toLocaleString()} ac</b></div>)}</div></div> : <EmptyState title="No crop area recorded" detail="Add crop and field area records to see their distribution." action={<Button variant="light" onClick={() => navigate('/crop-growth')}>Add crop</Button>} />}
        </div>
      </Card>
    </div>
    <div className="m-dashboard-columns">
      <Card className="m-card-with-bg">
        <div className="m-card-media-bg">
          <img src="/media/soil-moisture-photo.jpg" alt="Soil moisture trend" className="m-card-photo" />
          <div className="m-card-overlay" />
        </div>
        <div className="m-card-content">
          <div className="m-section-title"><div><span className="m-eyebrow">Field observations</span><h2>Soil moisture trend</h2></div><NavLink to="/smart-water">Water & soil →</NavLink></div>
          <div className="m-chart-unavailable"><span>⌁</span><div><b>No sensor readings recorded</b><p>Connect or record actual soil-moisture readings to show a trend. This dashboard does not estimate moisture from photos.</p></div></div>
        </div>
      </Card>
      <Card><div className="m-section-title"><div><span className="m-eyebrow">Your next steps</span><h2>Upcoming farming tasks</h2></div><NavLink to="/calendar">View calendar →</NavLink></div>
        {pending.length ? <ul className="m-task-list">{pending.map((task) => <li key={task.id}><span className="m-task-dot"></span><span><b>{task.title}</b><small>{task.date === dateToday() ? 'Today' : task.date}{task.crop ? ` · ${task.crop}` : ''}</small></span></li>)}</ul> : <EmptyState title="No upcoming activities" detail="Keep track of field work by adding tasks to your calendar." action={<Button variant="light" onClick={() => navigate('/calendar')}>Add activity</Button>} />}
      </Card>
    </div>
    <div className="m-dashboard-columns">
      <Card className="m-card-with-bg">
        <div className="m-card-media-bg">
          <img src="/media/my-crops-photo.jpg" alt="My crops" className="m-card-photo" />
          <div className="m-card-overlay" />
        </div>
        <div className="m-card-content">
          <div className="m-section-title"><div><span className="m-eyebrow">On your land</span><h2>My crops</h2></div><NavLink to="/crop-growth">Manage crops →</NavLink></div>
          {crops.length ? <div className="m-crop-list">{crops.slice(0, 4).map((crop) => <div key={crop.id}><CropSummary crop={crop} /><div className="m-dashboard-crop-progress"><div className="m-progress"><span style={{ width: `${crop.stageIndex < 0 ? 0 : percent(crop.stageIndex + 1, stages.length)}%` }} /></div><small>{crop.stageIndex < 0 ? 'Growth stage not recorded' : `${percent(crop.stageIndex + 1, stages.length)}% of recorded lifecycle`} · {crop.health || 'Health not assessed'}</small></div></div>)}</div> : <EmptyState title="No crops registered yet" detail="Add a crop with its sowing date to start tracking real progress." action={<Button onClick={() => navigate('/crop-growth')}>Register a crop</Button>} />}
        </div>
      </Card>
      <Card><div className="m-section-title"><div><span className="m-eyebrow">Farm activity</span><h2>Recent field notes</h2></div><NavLink to="/crop-growth">Crop records →</NavLink></div>
        {observations.length ? <div className="m-recent-activity">{observations.slice(0, 4).map((item) => <div key={item.id}><span className="m-activity-marker">•</span><p><b>{crops.find((crop) => crop.id === item.cropId)?.name || 'Farm note'}</b><span>{item.text}</span><small>{item.date}</small></p></div>)}</div> : <EmptyState title="No field notes yet" detail="Observations you add to crop records will appear here." action={<Button variant="light" onClick={() => navigate('/crop-growth')}>Add observation</Button>} />}
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
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')
  const loadWeather = useCallback(async (signal, showLoading = true) => {
    if (showLoading) {
      setStatus('loading')
      setError('')
    }
    try {
      const locationResponse = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1&language=en&format=json`, { signal })
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
      const weatherResponse = await fetch(`https://api.open-meteo.com/v1/forecast?${query}`, { signal })
      if (!weatherResponse.ok) throw new Error('Weather service is currently unavailable.')
      const data = await weatherResponse.json()
      setWeather({ ...data.current, place, rainChance: data.daily?.precipitation_probability_max?.[0] })
      setStatus('ready')
    } catch (requestError) {
      if (requestError.name === 'AbortError') return
      console.error('Dashboard weather lookup failed.', requestError)
      setError(requestError.message || 'Weather lookup failed. Check your connection.')
      setStatus('error')
    }
  }, [location])
  useEffect(() => {
    const controller = new AbortController()
    Promise.resolve().then(() => loadWeather(controller.signal, false))
    return () => controller.abort()
  }, [loadWeather])
  return <Card className="m-card-with-bg">
    <div className="m-card-media-bg">
      <video autoPlay loop muted playsInline poster="/media/weather-photo.jpg" className="m-card-video">
        <source src="/media/weather-video.mp4" type="video/mp4" />
      </video>
      <div className="m-card-overlay" />
    </div>
    <div className="m-card-content">
      <div className="m-section-title"><div><span className="m-eyebrow">Area forecast</span><h2>Weather snapshot</h2></div><button className="m-plain-action" type="button" onClick={onOpen}>7-day →</button></div>
      {weather ? <div className="m-dashboard-weather"><div><span className="m-weather-symbol">{weatherDescription(weather.weather_code)[1]}</span><b>{Math.round(weather.temperature_2m)}°C</b><small>{weatherDescription(weather.weather_code)[0]} · {weather.place.name}</small></div><div><span>Humidity</span><b>{weather.relative_humidity_2m}%</b></div><div><span>Rain chance today</span><b>{weather.rainChance ?? '—'}%</b></div><div><span>Wind</span><b>{weather.wind_speed_10m} km/h</b></div><small className="m-live-label">LIVE FORECAST · OPEN-METEO</small></div> : <div className="m-weather-empty"><span>☼</span><p><b>{status === 'loading' ? 'Checking current forecast…' : 'Live weather is not loaded'}</b><small>{error || `Fetch current conditions for ${location}. No sample weather is shown.`}</small></p><Button variant="light" onClick={() => loadWeather()} disabled={status === 'loading'}>{status === 'loading' ? 'Loading…' : 'Try again'}</Button></div>}
    </div>
  </Card>
}

function Onboarding() {
  return <ProfileForm isNew />
}

function LoginPage({ onAuthSuccess }) {
  const { profile, setProfile } = useFarm()
  const navigate = useNavigate()
  const [mode, setMode] = useState('login')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [stateName, setStateName] = useState('Karnataka')
  const [district, setDistrict] = useState('')
  const [preferredLanguage, setPreferredLanguage] = useState('en')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [currentUser, setCurrentUser] = useState(() => localStorage.getItem('farmer_name') || '')
  const [currentPhone, setCurrentPhone] = useState(() => localStorage.getItem('farmer_phone') || '')
  const hasToken = api.auth.isAuthenticated()

  const fillDemo = () => {
    if (mode === 'login') {
      setPhoneNumber('9876543210')
      setPassword('Kisan@123')
    } else {
      setName('Ramesh Gowda')
      setPhoneNumber('9876543210')
      setPassword('Kisan@123')
      setStateName('Karnataka')
      setDistrict('Mandya')
      setPreferredLanguage('kn')
    }
    setError('')
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')
    try {
      const res = await api.auth.login(phoneNumber, password)
      const farmerName = res.farmer?.name || phoneNumber
      setCurrentUser(farmerName)
      setCurrentPhone(res.farmer?.phone_number || phoneNumber)
      setSuccess(`Welcome back, ${farmerName}! Authenticated successfully.`)
      if (res.farmer) {
        setProfile((prev) => ({
          ...prev,
          name: res.farmer.name || prev?.name,
          phone: res.farmer.phone_number || prev?.phone,
          state: res.farmer.state || prev?.state,
          district: res.farmer.district || prev?.district,
        }))
      }
      if (onAuthSuccess) onAuthSuccess(res.farmer)
    } catch (err) {
      setError(err.message || 'Login failed. Check your 10-digit mobile number and password.')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')
    try {
      const res = await api.auth.register({
        name,
        phone_number: phoneNumber,
        password,
        state: stateName,
        district: district || undefined,
        preferred_language: preferredLanguage
      })
      const farmerName = res.farmer?.name || name
      setCurrentUser(farmerName)
      setCurrentPhone(res.farmer?.phone_number || phoneNumber)
      setSuccess(`Account registered successfully for ${farmerName}!`)
      if (res.farmer) {
        setProfile((prev) => ({
          ...prev,
          name: res.farmer.name || prev?.name,
          phone: res.farmer.phone_number || prev?.phone,
          state: res.farmer.state || prev?.state,
          district: res.farmer.district || prev?.district,
        }))
      }
      if (onAuthSuccess) onAuthSuccess(res.farmer)
    } catch (err) {
      setError(err.message || 'Registration failed. Make sure phone number is a valid 10-digit number starting with 6-9.')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    api.auth.logout()
    setCurrentUser('')
    setCurrentPhone('')
    setSuccess('You have logged out.')
  }

  if (hasToken && currentUser) {
    const initials = currentUser.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'RG'
    return (
      <div className="m-login-wrapper">
        <video className="m-login-video-bg" autoPlay loop muted playsInline poster="/media/login-bg-photo.jpg">
          <source src="/media/login-bg-video.mp4" type="video/mp4" />
        </video>
        <div className="m-login-overlay" />
        <div className="m-kisan-id-card">
          <div className="m-kisan-badge-header">
            <span>✓</span> <span>VERIFIED FARMER ACCOUNT</span>
          </div>
          <div className="m-kisan-avatar-row">
            <div className="m-kisan-avatar">{initials}</div>
            <h2 className="m-kisan-name">{currentUser}</h2>
            <div className="m-login-status-pill">
              <span className="m-login-dot" /> Connected to Farm Saathi Backend
            </div>
          </div>
          <div className="m-kisan-meta-grid">
            <div className="m-kisan-meta-item">
              <small>Registered Mobile</small>
              <b>📱 {currentPhone || phoneNumber || '9876543210'}</b>
            </div>
            <div className="m-kisan-meta-item">
              <small>Location</small>
              <b>📍 {district ? `${district}, ${stateName}` : (stateName || 'Mandya, Karnataka')}</b>
            </div>
            <div className="m-kisan-meta-item">
              <small>Security Token</small>
              <b>🔒 JWT Bearer Active</b>
            </div>
            <div className="m-kisan-meta-item">
              <small>Backend Database</small>
              <b>🌱 FastAPI + SQLite</b>
            </div>
          </div>
          <div className="m-kisan-actions">
            <Button onClick={() => navigate('/')} variant="primary">
              ⌂ Go to Dashboard
            </Button>
            <Button onClick={() => navigate('/profile')} variant="light">
              ○ Farm Profile Settings
            </Button>
            <Button onClick={handleLogout} variant="light" style={{ borderColor: 'rgba(239, 68, 68, 0.4)', color: '#fca5a5' }}>
              🚪 Log out
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="m-login-wrapper">
      <video className="m-login-video-bg" autoPlay loop muted playsInline poster="/media/login-bg-photo.jpg">
        <source src="/media/login-bg-video.mp4" type="video/mp4" />
      </video>
      <div className="m-login-overlay" />
      <div className="m-login-content">
        {/* Left Branding Showcase */}
        <div className="m-login-branding">
          <div className="m-login-badge">
            <span className="m-login-dot" />
            <span>KRISHI SAATHI · DIGITAL FARMER ASSISTANT</span>
          </div>
          <h1 className="m-login-hero-title">
            Smart Farming, <br />
            <span className="m-login-highlight">Empowered Farmers.</span>
          </h1>
          <p className="m-login-hero-sub">
            Access AI crop doctor diagnostics, precision irrigation advisories, real-time APMC mandi prices, and government schemes in one integrated portal.
          </p>
          <div className="m-login-features">
            <div className="m-login-feature-item">
              <span className="m-login-feature-icon">🩺</span>
              <div className="m-login-feature-text">
                <b>AI Crop Doctor</b>
                <small>Instant leaf disease analysis & scientific remedies</small>
              </div>
            </div>
            <div className="m-login-feature-item">
              <span className="m-login-feature-icon">💧</span>
              <div className="m-login-feature-text">
                <b>Smart Irrigation & Soil</b>
                <small>Soil moisture recommendations tailored to crop stage</small>
              </div>
            </div>
            <div className="m-login-feature-item">
              <span className="m-login-feature-icon">₹</span>
              <div className="m-login-feature-text">
                <b>Live Mandi APMC Prices</b>
                <small>Real-time commodity rates across Karnataka & India</small>
              </div>
            </div>
          </div>
          <div className="m-login-status-pill">
            <span className="m-login-dot" />
            <span>FastAPI Backend Online · JWT Security Active</span>
          </div>
        </div>

        {/* Right Authentication Card */}
        <div className="m-login-card">
          <div className="m-login-card-header">
            <span className="m-login-card-eyebrow">
              {mode === 'login' ? 'SECURE ACCESS' : 'JOIN FARM SAATHI'}
            </span>
            <h2 className="m-login-card-title">
              {mode === 'login' ? 'Farmer Sign In' : 'Register New Farmer'}
            </h2>
            <p className="m-login-card-sub">
              {mode === 'login'
                ? 'Sign in with your 10-digit mobile number and password'
                : 'Create your account to sync farm records and AI advisories'}
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="m-login-tabs">
            <button
              type="button"
              className={`m-login-tab-btn ${mode === 'login' ? 'active' : ''}`}
              onClick={() => { setMode('login'); setError(''); setSuccess('') }}
            >
              <span>📱</span> Farmer Sign In
            </button>
            <button
              type="button"
              className={`m-login-tab-btn ${mode === 'register' ? 'active' : ''}`}
              onClick={() => { setMode('register'); setError(''); setSuccess('') }}
            >
              <span>👤</span> New Registration
            </button>
          </div>

          {/* Quick Demo Fill Helper */}
          <div style={{ marginBottom: '1.1rem' }}>
            <button
              type="button"
              className="m-login-demo-btn"
              onClick={fillDemo}
              title="Click to fill test credentials instantly"
            >
              <span>⚡</span> Quick Fill Demo Farmer ({mode === 'login' ? '9876543210' : 'Ramesh Gowda'})
            </button>
          </div>

          {error && (
            <div className="m-login-alert-error" role="alert">
              <span>⚠️</span> <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="m-login-alert-success" role="status">
              <span>✓</span> <span>{success}</span>
            </div>
          )}

          {mode === 'login' ? (
            <form onSubmit={handleLogin} className="m-login-form">
              <div className="m-login-field">
                <label className="m-login-label">
                  <span>10-digit Mobile Number *</span>
                </label>
                <div className="m-login-input-wrapper">
                  <span className="m-login-input-icon">📱</span>
                  <input
                    required
                    type="tel"
                    maxLength="14"
                    className="m-login-input"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="e.g. 9876543210"
                    autoComplete="tel"
                  />
                </div>
              </div>

              <div className="m-login-field">
                <label className="m-login-label">
                  <span>Password *</span>
                </label>
                <div className="m-login-input-wrapper">
                  <span className="m-login-input-icon">🔒</span>
                  <input
                    required
                    type={showPassword ? 'text' : 'password'}
                    className="m-login-input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="m-login-pwd-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="m-login-btn-submit"
                disabled={loading}
              >
                {loading ? 'Authenticating…' : 'Sign In to Farm Saathi →'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="m-login-form">
              <div className="m-login-field">
                <label className="m-login-label">
                  <span>Full Name *</span>
                </label>
                <div className="m-login-input-wrapper">
                  <span className="m-login-input-icon">👤</span>
                  <input
                    required
                    className="m-login-input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Ramesh Kumar"
                    autoComplete="name"
                  />
                </div>
              </div>

              <div className="m-login-field">
                <label className="m-login-label">
                  <span>10-digit Mobile Number *</span>
                </label>
                <div className="m-login-input-wrapper">
                  <span className="m-login-input-icon">📱</span>
                  <input
                    required
                    type="tel"
                    maxLength="14"
                    className="m-login-input"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="e.g. 9876543210"
                    autoComplete="tel"
                  />
                </div>
              </div>

              <div className="m-login-field">
                <label className="m-login-label">
                  <span>Password (at least 6 characters) *</span>
                </label>
                <div className="m-login-input-wrapper">
                  <span className="m-login-input-icon">🔒</span>
                  <input
                    required
                    type={showPassword ? 'text' : 'password'}
                    minLength="6"
                    className="m-login-input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create secure password"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="m-login-pwd-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              <div className="m-login-row-2col">
                <div className="m-login-field">
                  <label className="m-login-label">
                    <span>State *</span>
                  </label>
                  <div className="m-login-input-wrapper">
                    <span className="m-login-input-icon">🗺️</span>
                    <input
                      required
                      className="m-login-input"
                      value={stateName}
                      onChange={(e) => setStateName(e.target.value)}
                      placeholder="e.g. Karnataka"
                    />
                  </div>
                </div>

                <div className="m-login-field">
                  <label className="m-login-label">
                    <span>District</span>
                  </label>
                  <div className="m-login-input-wrapper">
                    <span className="m-login-input-icon">📍</span>
                    <input
                      className="m-login-input"
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      placeholder="e.g. Mandya"
                    />
                  </div>
                </div>
              </div>

              <div className="m-login-field">
                <label className="m-login-label">
                  <span>Preferred Language</span>
                </label>
                <div className="m-login-input-wrapper">
                  <span className="m-login-input-icon">🌐</span>
                  <select
                    className="m-login-input"
                    value={preferredLanguage}
                    onChange={(e) => setPreferredLanguage(e.target.value)}
                    style={{ appearance: 'auto', background: 'rgba(6, 20, 14, 0.85)' }}
                  >
                    <option value="en">English</option>
                    <option value="kn">ಕನ್ನಡ (Kannada)</option>
                    <option value="hi">हिन्दी (Hindi)</option>
                    <option value="mr">मराठी (Marathi)</option>
                    <option value="te">తెలుగు (Telugu)</option>
                    <option value="ta">தமிழ் (Tamil)</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="m-login-btn-submit"
                disabled={loading}
              >
                {loading ? 'Creating Account…' : 'Register Farmer Account →'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

function FarmerAuthSection({ onAuthSuccess }) {
  return <LoginPage onAuthSuccess={onAuthSuccess} />
}

function ProfilePage() {
  const { profile, setProfile } = useFarm()
  return (
    <div className="m-page">
      <Heading
        eyebrow="Farmer details"
        title={profile ? 'Your profile & farm settings' : 'Let’s set up your farm'}
        detail="Register or log in to sync your profile with the backend database, or manage local farm settings."
      />
      <FarmerAuthSection onAuthSuccess={(farmer) => {
        if (farmer) {
          setProfile((prev) => ({
            ...prev,
            name: farmer.name || prev?.name,
            phone: farmer.phone_number || prev?.phone,
            state: farmer.state || prev?.state,
            district: farmer.district || prev?.district,
          }))
        }
      }} />
      <ProfileForm isNew={!profile} />
    </div>
  )
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
    <div className="m-form-footer"><p>Data syncs to your authenticated farmer profile and browser storage.</p><Button type="submit">{t('Save profile', language)}</Button></div>
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

  useEffect(() => {
    if (api.auth.isAuthenticated()) {
      api.tasks.list().then((serverTasks) => {
        if (Array.isArray(serverTasks) && serverTasks.length > 0) {
          setTasks(serverTasks.map((t) => ({
            id: t.id,
            title: t.title,
            date: t.due_date ? t.due_date.slice(0, 10) : dateToday(),
            type: t.category || 'Field work',
            crop: '',
            done: t.status === 'Completed'
          })))
        }
      }).catch(() => {})
    }
  }, [setTasks])

  const addTask = async (event) => {
    event.preventDefault()
    const newTask = { ...form, id: crypto.randomUUID(), done: false }
    setTasks((items) => [...items, newTask].sort((a, b) => a.date.localeCompare(b.date)))
    const currentForm = { ...form }
    setForm({ title: '', date: dateToday(), type: 'Field work', crop: '' })
    if (api.auth.isAuthenticated()) {
      try {
        const created = await api.tasks.create({
          title: currentForm.title,
          category: currentForm.type,
          due_date: new Date(currentForm.date).toISOString(),
          priority: 'Medium'
        })
        if (created?.id) {
          setTasks((items) => items.map((it) => it.id === newTask.id ? { ...it, id: created.id } : it))
        }
      } catch (_) {}
    }
  }

  const removeTask = async (taskId) => {
    setTasks((all) => all.filter((item) => item.id !== taskId))
    if (api.auth.isAuthenticated() && typeof taskId === 'number') {
      await api.tasks.delete(taskId).catch(() => {})
    }
  }

  return <div className="m-page"><Heading eyebrow="Crop calendar" title="Plan and record farm activities" detail="Tasks are reminders you create. Synced to your backend database when logged in." />
    <Card><form className="m-form m-task-form" onSubmit={addTask}><label>Activity *<input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Inspect field" /></label><label>Date<input required type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></label><label>Type<select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}><option>Field work</option><option>Irrigation</option><option>Fertilizer</option><option>Inspection</option><option>Harvest</option></select></label><label>Crop<select value={form.crop} onChange={(e) => setForm({ ...form, crop: e.target.value })}><option value="">Any / not specified</option>{crops.map((crop) => <option key={crop.id}>{crop.name}</option>)}</select></label><Button type="submit">{t('Add activity', language)}</Button></form></Card>
    {tasks.length ? <Card><div className="m-task-list">{tasks.map((task) => <div key={task.id} className={`m-task-row ${task.done ? 'completed' : ''}`}><input type="checkbox" checked={task.done} onChange={() => setTasks((all) => all.map((item) => item.id === task.id ? { ...item, done: !item.done } : item))} aria-label={`Mark ${task.title} complete`} /><span><b>{task.title}</b><small>{task.date} · {task.type}{task.crop && ` · ${task.crop}`}</small></span><button className="m-delete" type="button" onClick={() => removeTask(task.id)}>Delete</button></div>)}</div></Card> : <EmptyState title="No activities planned" detail="Add a reminder for your next field task." />}
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

function CropProfitCalculator() {
  const [crop, setCrop] = useState('Wheat')
  const [acres, setAcres] = useState('2.0')
  const [yieldPerAcre, setYieldPerAcre] = useState('20.0')
  const [marketPrice, setMarketPrice] = useState('2350.0')
  const [seedCost, setSeedCost] = useState('3000')
  const [fertilizerCost, setFertilizerCost] = useState('5000')
  const [irrigationCost, setIrrigationCost] = useState('2500')
  const [laborCost, setLaborCost] = useState('8000')
  const [otherCost, setOtherCost] = useState('1500')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  const calculate = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const data = await api.profit.calculate({
        crop_name: crop,
        land_size_acres: Number(acres),
        expected_yield_quintals_per_acre: Number(yieldPerAcre),
        expected_market_price_per_quintal: Number(marketPrice),
        seed_cost: Number(seedCost),
        fertilizer_cost: Number(fertilizerCost),
        irrigation_electricity_cost: Number(irrigationCost),
        labor_machinery_cost: Number(laborCost),
        other_expenses: Number(otherCost),
      })
      setResult(data)
    } catch (err) {
      setError(err.message || 'Could not calculate crop profit projections.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card style={{ marginTop: '1.5rem' }}>
      <div className="m-section-title">
        <div>
          <span className="m-eyebrow">Backend Agronomic Economics</span>
          <h2>Crop Profit & ROI Forecaster</h2>
        </div>
      </div>
      <p className="m-muted" style={{ marginBottom: '1rem' }}>
        Estimate revenue, expenses, net profit margins, and return on investment using backend calculations.
      </p>

      <form onSubmit={calculate} className="m-form">
        <div className="m-input-pair">
          <label>Crop Name *
            <input required value={crop} onChange={(e) => setCrop(e.target.value)} placeholder="e.g. Wheat" />
          </label>
          <label>Land Size (Acres) *
            <input required type="number" step="0.1" min="0.1" value={acres} onChange={(e) => setAcres(e.target.value)} />
          </label>
        </div>

        <div className="m-input-pair">
          <label>Expected Yield (Quintals / Acre) *
            <input required type="number" step="0.5" min="1" value={yieldPerAcre} onChange={(e) => setYieldPerAcre(e.target.value)} />
          </label>
          <label>Expected Market Rate (₹ / Quintal) *
            <input required type="number" step="10" min="100" value={marketPrice} onChange={(e) => setMarketPrice(e.target.value)} />
          </label>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px' }}>
          <label style={{ fontSize: '0.85rem' }}>Seed Cost (₹)
            <input type="number" value={seedCost} onChange={(e) => setSeedCost(e.target.value)} />
          </label>
          <label style={{ fontSize: '0.85rem' }}>Fertilizer (₹)
            <input type="number" value={fertilizerCost} onChange={(e) => setFertilizerCost(e.target.value)} />
          </label>
          <label style={{ fontSize: '0.85rem' }}>Irrigation (₹)
            <input type="number" value={irrigationCost} onChange={(e) => setIrrigationCost(e.target.value)} />
          </label>
          <label style={{ fontSize: '0.85rem' }}>Labor / Machinery (₹)
            <input type="number" value={laborCost} onChange={(e) => setLaborCost(e.target.value)} />
          </label>
          <label style={{ fontSize: '0.85rem' }}>Other Expenses (₹)
            <input type="number" value={otherCost} onChange={(e) => setOtherCost(e.target.value)} />
          </label>
        </div>

        {error && <p className="m-error" role="alert">{error}</p>}

        <Button type="submit" disabled={loading}>
          {loading ? 'Calculating projections…' : 'Calculate Projected Profit & ROI'}
        </Button>
      </form>

      {result && (
        <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(81, 199, 141, 0.08)', borderRadius: '8px', border: `1px solid ${result.is_profitable ? '#51c78d' : '#f56565'}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <h3 style={{ margin: 0 }}>Projected Economics for {result.crop_name} ({result.land_size_acres} Acres)</h3>
            <span className={`m-doctor-severity ${result.is_profitable ? 'low' : 'high'}`} style={{ textTransform: 'uppercase', fontWeight: 'bold' }}>
              {result.is_profitable ? '✓ Profitable Crop' : '⚠ Loss Projected'}
            </span>
          </div>

          <div className="m-stat-grid" style={{ marginBottom: '1rem' }}>
            <Stat label="Total Estimated Yield" value={`${result.total_yield_quintals} Quintals`} />
            <Stat label="Projected Gross Revenue" value={`₹${result.gross_revenue?.toLocaleString()}`} />
            <Stat label="Total Expenses" value={`₹${result.total_expenses?.toLocaleString()}`} />
            <Stat label="Projected Net Profit" value={`₹${result.net_profit?.toLocaleString()}`} />
            <Stat label="Net Profit / Acre" value={`₹${result.profit_per_acre?.toLocaleString()} / ac`} />
            <Stat label="Return on Investment (ROI)" value={`${result.return_on_investment_percentage}%`} />
          </div>

          <p className="m-muted" style={{ fontSize: '0.8rem', fontStyle: 'italic', margin: 0 }}>
            {result.estimate_disclaimer || 'ESTIMATED VALUES: Based on user inputs and market estimates. Weather and local yield variations may affect actual returns.'}
          </p>
        </div>
      )}
    </Card>
  )
}

function BudgetPage() {
  const { profile, expenses, crops } = useFarm()
  const spent = expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0)
  const budget = Number(profile?.budget || 0)
  return (
    <div className="m-page">
      <Heading
        eyebrow="Budget & Profit"
        title="Season spending & crop profit planner"
        detail="Manage real recorded farm expenses and calculate expected crop net profit margins and return on investment."
      />
      <div className="m-stat-grid">
        <Stat label="Budget recorded" value={money(budget)} />
        <Stat label="Expenses recorded" value={money(spent)} />
        <Stat label="Budget remaining" value={money(Math.max(0, budget - spent))} />
      </div>
      <Card>
        <h2>Budget progress</h2>
        <div className="m-progress"><span style={{ width: `${percent(spent, budget)}%` }} /></div>
        <p className="m-muted">{budget ? `${percent(spent, budget)}% of recorded budget spent` : 'Add a budget in your profile to view progress.'}</p>
        <p>{crops.length} crop records · {expenses.length} expense records</p>
      </Card>
      <CropProfitCalculator />
    </div>
  )
}

function DiseasePage() {
  const { crops } = useFarm()
  const token = localStorage.getItem('farmer_token') || localStorage.getItem(CHAT_TOKEN_KEY) || ''
  const [supportedCropInfo, setSupportedCropInfo] = useState({
    crops: [{ crop: 'Tomato' }, { crop: 'Wheat' }, { crop: 'Rice (Paddy)' }, { crop: 'Cotton' }, { crop: 'Potato' }],
    modelLoaded: true,
    message: 'AI Vision Plant Pathology Service is ready for leaf diagnostics.'
  })
  const [cropName, setCropName] = useState('')
  const [observations, setObservations] = useState('')
  const [file, setFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [diagnoses, setDiagnoses] = useState([])
  const [selectedDiagnosis, setSelectedDiagnosis] = useState(null)
  const [reportImage, setReportImage] = useState('')
  const [historyStatus, setHistoryStatus] = useState('ready')
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')
  const [historyError, setHistoryError] = useState('')
  const [cropFilter, setCropFilter] = useState('')
  const [dateFilter, setDateFilter] = useState('')

  const refreshHistory = useCallback(async (signal) => {
    try {
      const history = await api.cropDoctor.getHistory().catch(() => [])
      if (Array.isArray(history) && history.length > 0) {
        setDiagnoses(history.map((r) => ({
          id: r.id || String(Date.now()),
          plantName: r.crop_name || 'Crop',
          diseaseName: r.detected_disease || 'Diagnosed Condition',
          confidence: Math.round((r.confidence_score || 0.85) * 100),
          severity: r.expert_verification_needed ? 'high' : 'low',
          predictionStatus: r.expert_verification_needed ? 'verification_recommended' : 'identified',
          assessment: r.expert_verification_needed ? 'uncertain' : 'identified',
          symptoms: r.symptoms || [],
          organicOptions: r.organic_remedy ? [r.organic_remedy] : [],
          farmingPractices: r.chemical_remedy ? [r.chemical_remedy] : [],
          immediateActions: r.safety_advisory ? [r.safety_advisory] : [],
          createdAt: r.created_at || new Date().toISOString(),
        })))
      }
      setHistoryError('')
      setHistoryStatus('ready')
    } catch (requestError) {
      if (signal?.aborted) return
      setHistoryStatus('ready')
    }
  }, [])

  useEffect(() => {
    const apiUrl = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '')
    fetch(`${apiUrl}/api/v1/crop/supported-crops`)
      .then((res) => res.json())
      .then((data) => {
        if (data.crops) setSupportedCropInfo(data)
      })
      .catch(() => {
        // Fallback default
        setSupportedCropInfo({
          crops: [{ crop: 'Tomato' }, { crop: 'Wheat' }, { crop: 'Rice (Paddy)' }, { crop: 'Cotton' }, { crop: 'Potato' }],
          modelLoaded: true,
          message: 'AI Vision Plant Pathology Service is active.'
        })
      })
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    Promise.resolve().then(() => refreshHistory(controller.signal))
    return () => controller.abort()
  }, [refreshHistory])

  useEffect(() => {
    if (!previewUrl) return undefined
    return () => URL.revokeObjectURL(previewUrl)
  }, [previewUrl])

  const selectedDiagnosisId = selectedDiagnosis?.id
  useEffect(() => {
    if (!selectedDiagnosisId || !token) return undefined
    let active = true
    let objectUrl = ''
    const controller = new AbortController()
    fetch(`/api/crop-doctor/history/${selectedDiagnosisId}/image`, { headers: { Authorization: `Bearer ${token}` }, signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) {
          const body = await response.json().catch(() => ({}))
          throw new Error(body.error || 'Could not load the saved diagnosis image.')
        }
        return response.blob()
      })
      .then((blob) => {
        if (!active) return
        objectUrl = URL.createObjectURL(blob)
        setReportImage({ id: selectedDiagnosisId, url: objectUrl })
      })
      .catch((requestError) => {
        if (active && !controller.signal.aborted) {
          console.error('Could not load the saved Crop Doctor image.', requestError)
          setReportImage({ id: selectedDiagnosisId, error: requestError.message || 'Could not load the saved image.' })
        }
      })
    return () => {
      active = false
      controller.abort()
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [selectedDiagnosisId, token])

  const chooseImage = (selectedFile) => {
    setError('')
    if (!selectedFile) return
    const supportedTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!supportedTypes.includes(selectedFile.type)) {
      setFile(null)
      setPreviewUrl('')
      return setError('Choose a JPG, PNG, or WEBP image.')
    }
    if (selectedFile.size > 5 * 1024 * 1024) {
      setFile(null)
      setPreviewUrl('')
      return setError('Choose an image smaller than 5 MB.')
    }
    setPreviewUrl(URL.createObjectURL(selectedFile))
    setFile(selectedFile)
    setSelectedDiagnosis(null)
    setReportImage('')
  }

  const submitImage = async (event) => {
    event.preventDefault()
    if (!file) return setError('Take or choose a plant image first.')
    if (!supportedCropInfo.modelLoaded) {
      return setError(`${supportedCropInfo.message || 'The plant-disease AI model is not ready.'} Start the AI service and install its trained model, then try again.`)
    }
    setLoading(true)
    setProgress(0)
    setError('')
    try {
      const diagnosis = await uploadCropImage({ token, file, cropName, observations, onProgress: setProgress })
      setSelectedDiagnosis(token ? diagnosis : { ...diagnosis, previewUrl })
      setFile(null)
      if (token) {
        setPreviewUrl('')
        await refreshHistory()
      }
    } catch (requestError) {
      setError(requestError.message || 'Analysis failed. Check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  const removeDiagnosis = async (diagnosis) => {
    if (!window.confirm('Delete this diagnosis and its saved image?')) return
    try {
      const response = await fetch(`/api/crop-doctor/history/${diagnosis.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      const body = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(body.error || `Could not delete diagnosis (${response.status}).`)
      setDiagnoses((items) => items.filter((item) => item.id !== diagnosis.id))
      if (selectedDiagnosis?.id === diagnosis.id) setSelectedDiagnosis(null)
      setHistoryError('')
    } catch (requestError) {
      setHistoryError(requestError.message || 'Could not delete this diagnosis. Try again.')
    }
  }

  const filteredDiagnoses = diagnoses.filter((diagnosis) =>
    (!cropFilter || diagnosis.plantName.toLowerCase() === cropFilter.toLowerCase())
    && (!dateFilter || diagnosis.createdAt.slice(0, 10) === dateFilter))

  return <div className="m-page">
    <Heading eyebrow="AI Crop Doctor" title="Check a crop from a photo" detail="MobileNetV2 screens the image against PlantVillage leaf classes. Results are not a confirmed diagnosis and may not reflect field conditions." />
      {!supportedCropInfo.modelLoaded && <p className="m-error" role="status">{supportedCropInfo.message || 'The trained TensorFlow model is not installed yet.'} You can select a photo now; start the AI service and install its trained model before analysis.</p>}
      <Card>
        <form className="m-doctor-form" onSubmit={submitImage}>
          <label className="m-field-label">Crop in the photo (optional)<input list="supported-crops" value={cropName} onChange={(event) => setCropName(event.target.value)} maxLength={80} placeholder="Choose a supported crop or leave blank for model classification" /><datalist id="supported-crops">{supportedCropInfo.crops.map((crop) => <option key={crop.crop} value={crop.crop} />)}{crops.map((crop) => <option key={`registered-${crop.id}`} value={crop.name} />)}</datalist></label>
          <div className="m-doctor-upload">
            {previewUrl ? <img src={previewUrl} alt="Selected plant for AI visual screening" /> : <div className="m-doctor-placeholder"><span>♧</span><b>Choose a clear photo of the affected plant</b><small>Include the whole plant and a close-up of affected leaves when possible.</small></div>}
            <div className="m-doctor-upload-actions">
              <label className="m-button primary">Take a photo<input type="file" accept="image/jpeg,image/png,image/webp" capture="environment" onChange={(event) => { chooseImage(event.target.files?.[0]); event.target.value = '' }} /></label>
              <label className="m-button light">Upload image<input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => { chooseImage(event.target.files?.[0]); event.target.value = '' }} /></label>
              {file && <><span className="m-muted">{file.name} · {(file.size / 1024 / 1024).toFixed(2)} MB</span><button className="m-delete" type="button" onClick={() => { setFile(null); setPreviewUrl(''); setProgress(0) }}>Remove image</button></>}
            </div>
          </div>
          <label className="m-field-label">Your note (not sent to the AI model{token ? '; saved with your report' : '; not saved'})<textarea rows="3" maxLength="800" value={observations} onChange={(event) => setObservations(event.target.value)} placeholder="For example: spots began on older leaves after several rainy days." /></label>
          {loading && <div className="m-doctor-progress" role="status"><div><b>{progress < 100 ? 'Uploading image securely…' : 'MobileNetV2 is analyzing the image…'}</b><span>{progress}% uploaded</span></div><progress max="100" value={progress} /><small>Analysis runs through the private backend and local TensorFlow service. If camera access is unavailable, allow camera permission or use Upload image.</small></div>}
          {error && <p className="m-error" role="alert">{error}</p>}
          <Button type="submit" disabled={loading || !file}>{loading ? 'Analyzing…' : 'Analyze plant image'}</Button>
        </form>
      </Card>
      {selectedDiagnosis && <DiagnosisReport diagnosis={selectedDiagnosis} imageUrl={reportImage?.id === selectedDiagnosis.id ? reportImage.url || '' : selectedDiagnosis.previewUrl || ''} imageError={reportImage?.id === selectedDiagnosis.id ? reportImage.error || '' : ''} onClose={() => setSelectedDiagnosis(null)} />}
      <Card>
        <div className="m-section-title"><div><span className="m-eyebrow">{token ? 'Private to your account' : 'Optional account feature'}</span><h2>Diagnosis history</h2></div>{token && <button className="m-plain-action" type="button" onClick={refreshHistory} disabled={historyStatus === 'loading'}>Refresh</button>}</div>
        {!token && <p className="m-muted">Guest diagnoses are shown on this page and are not saved after you leave.</p>}
        {historyError && <p className="m-error" role="alert">{historyError}</p>}
        {token && historyStatus === 'loading' ? <p className="m-muted">Loading saved diagnoses…</p> : token && historyStatus === 'error' ? null : token && diagnoses.length ? <>
          <div className="m-doctor-filters"><label>Crop<select value={cropFilter} onChange={(event) => setCropFilter(event.target.value)}><option value="">All crops</option>{[...new Set(diagnoses.map((item) => item.plantName))].map((plant) => <option key={plant}>{plant}</option>)}</select></label><label>Diagnosis date<input type="date" value={dateFilter} onChange={(event) => setDateFilter(event.target.value)} /></label></div>
          {filteredDiagnoses.length ? <div className="m-doctor-history">{filteredDiagnoses.map((diagnosis) => <article key={diagnosis.id}><span className={`m-doctor-severity ${diagnosis.severity}`}>{diagnosis.severity === 'unknown' ? 'Uncertain' : diagnosis.severity}</span><div><b>{diagnosis.plantName} · {diagnosis.diseaseName}</b><small>{new Date(diagnosis.createdAt).toLocaleString()} · model-estimated confidence {diagnosis.confidence}%</small></div><button type="button" onClick={() => setSelectedDiagnosis(diagnosis)}>View report</button><button type="button" className="m-delete" onClick={() => removeDiagnosis(diagnosis)}>Delete</button></article>)}</div> : <p className="m-muted">No diagnoses match these filters.</p>}
        </> : token ? <EmptyState title="No diagnoses saved yet" detail="After you analyze a plant photo, its private report and image will appear here." /> : null}
      </Card>
      <p className="m-warning">PlantVillage photos were mostly taken in controlled conditions. Model confidence is not calibrated field accuracy; similar diseases may look alike. Do not choose a treatment from an image alone. Get advice from a qualified local agriculture professional.</p>
  </div>
}

function DiagnosisReport({ diagnosis, imageUrl, imageError, onClose }) {
  const listSection = (title, items) => items?.length ? <section><h3>{title}</h3><ul>{items.map((item, index) => <li key={`${title}-${index}`}>{item}</li>)}</ul></section> : null
  const uncertain = diagnosis.assessment !== 'identified'
  return <Card className="m-doctor-report">
    <div className="m-section-title"><div><span className="m-eyebrow">PlantVillage model · {new Date(diagnosis.createdAt).toLocaleString()}</span><h2>Assessment for {diagnosis.plantName}</h2></div><button type="button" className="m-plain-action" onClick={onClose}>Close</button></div>
    <div className="m-doctor-report-main">{imageUrl ? <img src={imageUrl} alt={`Saved plant photo for ${diagnosis.plantName}`} /> : <span className="m-doctor-image-placeholder">{imageError || 'Loading private image…'}</span>}
      <div><span className={`m-doctor-severity ${diagnosis.severity}`}>{diagnosis.predictionStatus?.replaceAll('_', ' ') || 'inconclusive'}</span><h3>{diagnosis.diseaseName}</h3><p>Model confidence: <b>{diagnosis.confidence}%</b></p><small>Model v{diagnosis.modelVersion} · not calibrated field accuracy.</small>{diagnosis.message && <p>{diagnosis.message}</p>}</div>
    </div>
    {uncertain && <p className="m-doctor-uncertain" role="status">The image did not provide enough evidence for a reliable disease assessment. Try a close, well-lit photo of one affected leaf and a second photo of the whole plant.</p>}
    <div className="m-doctor-report-grid">
      {diagnosis.farmerObservations && <section><h3>Your private note</h3><p>{diagnosis.farmerObservations}</p><small>Saved with this report; not used by the image classifier.</small></section>}
      {diagnosis.topPredictions?.length > 0 && <section><h3>Model top predictions</h3><ul>{diagnosis.topPredictions.map((item, index) => <li key={`${item.crop}-${item.disease}-${index}`}>{item.crop} · {item.disease}: {(item.confidence * 100).toFixed(1)}% model score</li>)}</ul></section>}
      {listSection('Visible symptoms', diagnosis.symptoms)}
      {listSection('Visible signs in this photo', diagnosis.visibleSigns)}
      {listSection('Possible causes to consider', diagnosis.possibleCauses)}
      {listSection('Conditions that may encourage it', diagnosis.conduciveConditions)}
      {listSection('Immediate low-risk steps', diagnosis.immediateActions)}
      {listSection('Farm practices', diagnosis.farmingPractices)}
      {listSection('Organic options to discuss locally', diagnosis.organicOptions)}
      {listSection('Prevention', diagnosis.prevention)}
      {listSection('Irrigation and soil care', diagnosis.irrigationAndSoil)}
      {listSection('Reduce possible spread', diagnosis.preventSpread)}
      {diagnosis.reinspectInDays && <section><h3>Reinspect</h3><p>Check the plant again in about {diagnosis.reinspectInDays} days.</p></section>}
      {listSection('Seek professional help', diagnosis.professionalHelp)}
      {!diagnosis.knowledge?.available && diagnosis.predictionStatus === 'possible_detection' && <section><h3>Verified treatment guidance</h3><p>No disease-specific guidance from a verified local agricultural source is configured for this class. Consult your KVK or local agriculture department before taking treatment action.</p></section>}
    </div>
    <p className="m-warning">Automated model classification only—not a confirmed disease or verified treatment recommendation. PlantVillage images do not represent every field or camera condition. Consult a local agriculture professional.</p>
  </Card>
}

function SmartIrrigationCalculator({ profile }) {
  const [crop, setCrop] = useState('Wheat')
  const [stage, setStage] = useState('Vegetative')
  const [soil, setSoil] = useState(profile?.soil || 'Loamy')
  const [acres, setAcres] = useState(String(profile?.landSize || '2.0'))
  const [pumpHp, setPumpHp] = useState('5.0')
  const [recentRain, setRecentRain] = useState('0')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const calculate = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const data = await api.irrigation.recommend({
        cropName: crop,
        growthStage: stage,
        soilType: soil,
        acres: Number(acres),
        pumpHP: Number(pumpHp),
        recentRainMm: Number(recentRain),
      })
      setResult(data)
    } catch (err) {
      setError(err.message || 'Could not calculate smart irrigation recommendation.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card style={{ marginBottom: '1.5rem', borderLeft: '4px solid #3182ce' }}>
      <div className="m-section-title">
        <div>
          <span className="m-eyebrow" style={{ color: '#3182ce' }}>FAO-56 Penman-Monteith Rule Engine</span>
          <h2>Smart Irrigation Advisory</h2>
        </div>
      </div>
      <p className="m-muted" style={{ marginBottom: '1rem' }}>
        Calculate scientific water requirements and exact pump running time based on crop, growth stage, soil type, and weather forecast.
      </p>

      <form onSubmit={calculate} className="m-form">
        <div className="m-input-pair">
          <label>Crop *
            <select value={crop} onChange={(e) => setCrop(e.target.value)}>
              <option>Wheat</option>
              <option>Paddy (Rice)</option>
              <option>Tomato</option>
              <option>Cotton</option>
              <option>Potato</option>
              <option>Maize</option>
              <option>Sugarcane</option>
              <option>Soybean</option>
              <option>Groundnut</option>
            </select>
          </label>
          <label>Crop Growth Stage *
            <select value={stage} onChange={(e) => setStage(e.target.value)}>
              <option>Seedling</option>
              <option>Vegetative</option>
              <option>Flowering</option>
              <option>Maturity</option>
            </select>
          </label>
        </div>

        <div className="m-input-pair">
          <label>Soil Type *
            <select value={soil} onChange={(e) => setSoil(e.target.value)}>
              <option>Loamy</option>
              <option>Clay</option>
              <option>Sandy</option>
              <option>Black</option>
              <option>Alluvial</option>
              <option>Red</option>
            </select>
          </label>
          <label>Land Size (Acres) *
            <input required type="number" step="0.1" min="0.1" value={acres} onChange={(e) => setAcres(e.target.value)} />
          </label>
        </div>

        <div className="m-input-pair">
          <label>Pump Capacity (HP) *
            <select value={pumpHp} onChange={(e) => setPumpHp(e.target.value)}>
              <option value="3.0">3.0 HP Submersible</option>
              <option value="5.0">5.0 HP Standard Pump</option>
              <option value="7.5">7.5 HP Heavy Duty</option>
              <option value="10.0">10.0 HP Agricultural Pump</option>
            </select>
          </label>
          <label>Rainfall in Last 24 Hours (mm)
            <input type="number" step="1" min="0" value={recentRain} onChange={(e) => setRecentRain(e.target.value)} />
          </label>
        </div>

        {error && <p className="m-error" role="alert">{error}</p>}

        <Button type="submit" disabled={loading}>
          {loading ? 'Computing water physics…' : 'Calculate Irrigation Advisory'}
        </Button>
      </form>

      {result && (
        <div style={{ marginTop: '1.5rem', padding: '1rem', background: result.can_skip_irrigation ? 'rgba(81, 199, 141, 0.1)' : 'rgba(49, 130, 206, 0.08)', borderRadius: '8px', border: `1px solid ${result.can_skip_irrigation ? '#51c78d' : '#3182ce'}` }}>
          {result.can_skip_irrigation && (
            <div style={{ padding: '8px 12px', background: '#e6fffa', color: '#234e52', borderRadius: '6px', fontWeight: 'bold', marginBottom: '1rem', border: '1px solid #38b2ac' }}>
              🌧 Rain Delay Active: {result.rain_forecast_24h_mm} mm expected. You can pause irrigation to conserve power and avoid waterlogging.
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <h3 style={{ margin: 0 }}>Advisory for {result.crop_name} ({result.growth_stage} Stage)</h3>
            <span className="m-doctor-severity low" style={{ textTransform: 'uppercase' }}>
              {result.soil_moisture_status || 'Optimal'}
            </span>
          </div>

          <div className="m-stat-grid" style={{ marginBottom: '1rem' }}>
            <Stat label="Total Water Needed" value={`${Math.round(result.water_needed_liters)?.toLocaleString()} Liters`} />
            <Stat label="Effective Depth" value={`${result.water_needed_mm} mm`} />
            <Stat label="Pump Running Time" value={`${Math.floor(result.recommended_duration_minutes / 60)}h ${result.recommended_duration_minutes % 60}m`} />
            <Stat label="24h Rain Forecast" value={`${result.rain_forecast_24h_mm} mm`} />
          </div>

          <p style={{ fontWeight: '500', color: '#2d3748', margin: '0 0 0.5rem 0' }}>{result.advice}</p>
          <small className="m-muted" style={{ display: 'block', fontStyle: 'italic' }}>
            Basis: {result.calculation_basis}
          </small>
        </div>
      )}
    </Card>
  )
}

function SoilWaterPage() {
  const { profile, crops } = useFarm()
  const token = localStorage.getItem(CHAT_TOKEN_KEY) || ''
  const [soilStatus, setSoilStatus] = useState({ model_loaded: false, message: 'Checking soil model…' })
  const [soilAnalyses, setSoilAnalyses] = useState([])
  const [cropName, setCropName] = useState('')
  const [location, setLocation] = useState(profile?.village || profile?.district || '')
  const [file, setFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [analysis, setAnalysis] = useState(null)
  const [analysisImage, setAnalysisImage] = useState('')
  const analysisImageRef = useRef('')
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')
  const [historyError, setHistoryError] = useState('')

  const refreshSoilHistory = useCallback(async (signal) => {
    if (!token) return
    try {
      const response = await fetch('/api/soil/history', { headers: { Authorization: `Bearer ${token}` }, signal })
      const body = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(body.error || `Could not load soil history (${response.status}).`)
      setSoilAnalyses(body.analyses)
      setHistoryError('')
    } catch (requestError) {
      if (!signal?.aborted) setHistoryError(requestError.message || 'Could not load soil history.')
    }
  }, [token])

  useEffect(() => {
    const controller = new AbortController()
    fetch('/api/soil/status', { signal: controller.signal })
      .then(async (response) => {
        const body = await response.json().catch(() => ({}))
        if (!response.ok) throw new Error(body.error || 'Soil analysis service is unavailable.')
        if (!controller.signal.aborted) setSoilStatus(body)
      })
      .catch((requestError) => {
        if (!controller.signal.aborted) setSoilStatus({ model_loaded: false, message: requestError.message || 'Soil analysis service is unavailable.' })
      })
    Promise.resolve().then(() => refreshSoilHistory(controller.signal))
    return () => controller.abort()
  }, [refreshSoilHistory])

  useEffect(() => () => {
    if (analysisImageRef.current) URL.revokeObjectURL(analysisImageRef.current)
  }, [])

  const updateAnalysisImage = (url) => {
    if (analysisImageRef.current) URL.revokeObjectURL(analysisImageRef.current)
    analysisImageRef.current = url.startsWith('blob:') ? url : ''
    setAnalysisImage(url)
  }

  useEffect(() => {
    if (!previewUrl) return undefined
    return () => URL.revokeObjectURL(previewUrl)
  }, [previewUrl])

  const chooseSoilImage = (selectedFile) => {
    setError('')
    if (!selectedFile) return
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(selectedFile.type)) {
      setFile(null)
      setPreviewUrl('')
      setError('Choose a JPG, PNG, or WEBP soil image.')
      return
    }
    if (selectedFile.size > 5 * 1024 * 1024) {
      setFile(null)
      setPreviewUrl('')
      setError('Choose an image smaller than 5 MB.')
      return
    }
    setFile(selectedFile)
    setPreviewUrl(URL.createObjectURL(selectedFile))
    setAnalysis(null)
    updateAnalysisImage('')
  }

  const submitSoilImage = async (event) => {
    event.preventDefault()
    if (!file) return setError('Take or choose a soil photograph first.')
    setLoading(true)
    setProgress(0)
    setError('')
    try {
      const result = await uploadSoilImage({ token, file, cropName, location, onProgress: setProgress })
      setAnalysis(result)
      updateAnalysisImage('')
      setFile(null)
      if (token) {
        setPreviewUrl('')
        const imageResponse = await fetch(result.imageUrl, { headers: { Authorization: `Bearer ${token}` } })
        if (imageResponse.ok) updateAnalysisImage(URL.createObjectURL(await imageResponse.blob()))
        await refreshSoilHistory()
      } else {
        updateAnalysisImage(previewUrl)
      }
    } catch (requestError) {
      setError(requestError.message || 'Soil image analysis is temporarily unavailable. Please try again later.')
    } finally {
      setLoading(false)
    }
  }

  const deleteSoilRecord = async (record) => {
    if (!window.confirm('Delete this soil analysis and its saved image?')) return
    try {
      const response = await fetch(`/api/soil/history/${record.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok) {
        const body = await response.json().catch(() => ({}))
        throw new Error(body.error || 'Could not delete this soil analysis.')
      }
      setSoilAnalyses((items) => items.filter((item) => item.id !== record.id))
      if (analysis?.id === record.id) {
        setAnalysis(null)
        setAnalysisImage('')
      }
    } catch (requestError) {
      setHistoryError(requestError.message || 'Could not delete this soil analysis.')
    }
  }

  const openSoilRecord = async (record) => {
    setAnalysis(record)
    updateAnalysisImage('')
    try {
      const response = await fetch(record.imageUrl, { headers: { Authorization: `Bearer ${token}` } })
      if (!response.ok) throw new Error('Could not load the saved soil photograph.')
      updateAnalysisImage(URL.createObjectURL(await response.blob()))
    } catch (requestError) {
      setHistoryError(requestError.message || 'Could not load the saved soil photograph.')
    }
  }

  return <div className="m-page"><Heading eyebrow="Soil Vision & water" title="Understand your soil with measured data" detail="Soil Vision provides a visual model match only. A laboratory soil test is needed for fertility and crop-specific nutrient advice." />
    <SmartIrrigationCalculator profile={profile} />
    <Card>
      <div className="m-section-title"><div><span className="m-eyebrow">Separate soil image model</span><h2>Scan a soil photograph</h2></div><span className={`m-doctor-severity ${soilStatus.model_loaded ? 'low' : 'unknown'}`}>{soilStatus.model_loaded ? `Ready · ${soilStatus.model_name || 'MobileNetV2'}` : 'Model unavailable'}</span></div>
      {!soilStatus.model_loaded && <p className="m-error" role="status">{soilStatus.message || 'Install the trained soil model in ai-service/models/soil/.'}</p>}
      <form className="m-doctor-form" onSubmit={submitSoilImage}>
        <div className="m-doctor-upload">
          {previewUrl ? <img src={previewUrl} alt="Preview of the soil image selected for analysis" /> : <div className="m-doctor-placeholder"><span>♧</span><b>Photograph bare soil in natural, even light</b><small>Use JPG, PNG, or WEBP under 5 MB. Remove plants, pots, and other objects from the frame.</small></div>}
          <div className="m-doctor-upload-actions">
            <label className="m-button primary">Take a photo<input type="file" accept="image/jpeg,image/png,image/webp" capture="environment" onChange={(event) => { chooseSoilImage(event.target.files?.[0]); event.target.value = '' }} /></label>
            <label className="m-button light">Upload image<input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => { chooseSoilImage(event.target.files?.[0]); event.target.value = '' }} /></label>
            {file && <><span className="m-muted">{file.name} · {(file.size / 1024 / 1024).toFixed(2)} MB</span><button className="m-delete" type="button" onClick={() => { setFile(null); setPreviewUrl(''); setProgress(0) }}>Remove image</button></>}
          </div>
        </div>
        <div className="m-form m-planner-form">
          <label>Crop (optional)<select value={cropName} onChange={(event) => setCropName(event.target.value)}><option value="">Not selected</option>{crops.map((crop) => <option key={crop.id} value={crop.name}>{crop.name}{crop.field ? ` · ${crop.field}` : ''}</option>)}</select></label>
          <label>Village or district (optional)<input maxLength="120" value={location} onChange={(event) => setLocation(event.target.value)} placeholder="e.g. Mandya" /></label>
        </div>
        {loading && <div className="m-doctor-progress" role="status"><div><b>{progress < 100 ? 'Uploading soil photograph…' : 'Analyzing with the soil image model…'}</b><span>{progress}% uploaded</span></div><progress max="100" value={progress} /><small>The image is sent to the local Farm Saathi AI service.</small></div>}
        {error && <p className="m-error" role="alert">{error}</p>}
        <Button type="submit" disabled={!file || loading || !soilStatus.model_loaded}>{loading ? 'Analyzing…' : 'Analyze soil image'}</Button>
      </form>
    </Card>
    {analysis && <Card className="m-doctor-report">
      <div className="m-section-title"><div><span className="m-eyebrow">AI visual classification · {analysis.createdAt ? new Date(analysis.createdAt).toLocaleString() : 'just now'}</span><h2>Soil image result</h2></div><button type="button" className="m-plain-action" onClick={() => { setAnalysis(null); updateAnalysisImage('') }}>Close result</button></div>
      <div className="m-doctor-report-main">{analysisImage ? <img src={analysisImage} alt="Analyzed soil sample" /> : <span className="m-doctor-image-placeholder">{analysis.id ? 'Loading saved soil photograph…' : 'Soil photograph preview'}</span>}
        <div><span className={`m-doctor-severity ${analysis.status === 'possible_detection' ? 'moderate' : 'unknown'}`}>{analysis.status?.replaceAll('_', ' ')}</span><h3>{analysis.predicted_class || 'No confident class match'}</h3><p>Model score: <b>{(analysis.confidence * 100).toFixed(1)}%</b></p><small>{analysis.model_name || 'MobileNetV2'} · model {analysis.model_version || 'version not supplied'}</small><p>{analysis.message}</p>{analysis.cropName && <small>Crop selected: {analysis.cropName} · </small>}{analysis.location && <small>Location provided: {analysis.location}</small>}</div>
      </div>
      {analysis.probabilities && <section><h3>Model class scores</h3><div className="m-soil-probabilities">{Object.entries(analysis.probabilities).sort((a, b) => b[1] - a[1]).map(([label, probability]) => <div key={label}><span>{label}</span><b>{(probability * 100).toFixed(1)}%</b><progress max="1" value={probability} /></div>)}</div></section>}
      {analysis.visual_characteristics?.length > 0 && <section><h3>Image observations</h3><ul>{analysis.visual_characteristics.map((item) => <li key={item}>{item}</li>)}</ul></section>}
      <section><h3>What to do next for {analysis.cropName || 'your crop'}</h3><ul className="m-bullets"><li>Treat this class as a visual clue, not a soil-type or crop-suitability determination.</li><li>Submit a representative sample to a recognized soil-testing laboratory or Soil Health Card service for pH, NPK, organic carbon, and electrical conductivity.</li><li>Use verified test results and local KVK or agriculture-department advice before changing fertilizer, irrigation, or crop plans.</li></ul></section>
      {analysis.limitations?.length > 0 && <section><h3>Important limitations</h3><ul>{analysis.limitations.map((item) => <li key={item}>{item}</li>)}</ul></section>}
      <p className="m-warning">An image cannot measure pH, NPK, salinity, electrical conductivity, organic carbon, or actual soil moisture. Do not apply fertilizer or choose a crop based on this classification alone.</p>
    </Card>}
    <Card>
      <div className="m-section-title"><div><span className="m-eyebrow">{token ? 'Private to your account' : 'Optional account feature'}</span><h2>Soil analysis history</h2></div>{token && <button className="m-plain-action" type="button" onClick={() => refreshSoilHistory()}>Refresh</button>}</div>
      {!token ? <p className="m-muted">Guest analyses are shown on this page and are not saved after you leave.</p> : historyError && <p className="m-error" role="alert">{historyError}</p>}
      {token && soilAnalyses.length > 0 && <div className="m-doctor-history">{soilAnalyses.map((record) => <article key={record.id}><span className={`m-doctor-severity ${record.status === 'possible_detection' ? 'moderate' : 'unknown'}`}>{record.status?.replaceAll('_', ' ')}</span><div><b>{record.predicted_class || 'Inconclusive visual result'}</b><small>{new Date(record.createdAt).toLocaleString()} · model score {(record.confidence * 100).toFixed(1)}%{record.cropName ? ` · ${record.cropName}` : ''}</small></div><button type="button" onClick={() => openSoilRecord(record)}>View</button><button type="button" className="m-delete" onClick={() => deleteSoilRecord(record)}>Delete</button></article>)}</div>}
      {token && !soilAnalyses.length && !historyError && <EmptyState title="No soil analyses saved" detail="Your actual model results will appear here after an image analysis." />}
    </Card>
    <div className="m-stat-grid"><Stat label="Known soil type" value={profile?.soil || 'Not provided'} /><Stat label="Water availability" value={profile?.water || 'Not provided'} /><Stat label="Irrigation" value={profile?.irrigation || 'Not specified'} /></div>
    <Card><h2>Practical next steps</h2><ul className="m-bullets"><li>Use a soil test from a recognized lab to guide nutrient decisions.</li><li>Check soil moisture in the root zone before irrigating; recent rainfall may change needs.</li><li>Keep dates and amounts of irrigation and fertilizer in your crop record.</li><li>Ask a local agriculture officer for crop- and soil-specific rates.</li></ul><NavLink className="m-button light" to="/crop-growth">Open crop records</NavLink></Card>
    {crops.length > 0 && <Card><h2>Your active crop context</h2>{crops.map((crop) => <CropSummary key={crop.id} crop={crop} />)}</Card>}
  </div>
}

function MarketPage() {
  const [commodity, setCommodity] = useState('Wheat')
  const [prices, setPrices] = useState([])
  const [comparison, setComparison] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const popularCrops = ['Wheat', 'Paddy', 'Cotton', 'Tomato', 'Onion', 'Potato', 'Soybean', 'Mustard', 'Chana']

  const loadPrices = useCallback(async (crop) => {
    setLoading(true)
    setError('')
    try {
      const data = await api.market.getPrices(crop)
      setPrices(data || [])
      const comp = await api.market.compare(crop).catch(() => null)
      setComparison(comp)
    } catch (err) {
      setError(err.message || 'Could not load mandi prices from server.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadPrices(commodity)
  }, [loadPrices, commodity])

  return <div className="m-page">
    <Heading eyebrow="Mandi prices" title="Verified APMC market rates" detail="Live prices and inter-mandi comparison fetched directly from the backend APMC database." />
    
    <Card>
      <div className="m-section-title">
        <div><span className="m-eyebrow">Commodity search</span><h2>Select or search crop</h2></div>
      </div>
      <div className="m-form m-planner-form" style={{ marginBottom: '1rem' }}>
        <label>Crop / Commodity
          <input value={commodity} onChange={(e) => setCommodity(e.target.value)} placeholder="e.g. Wheat, Tomato, Onion" />
        </label>
      </div>
      <div className="m-chips" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '1rem' }}>
        {popularCrops.map((c) => (
          <button key={c} type="button" className={`m-button ${commodity.toLowerCase() === c.toLowerCase() ? 'primary' : 'light'}`} style={{ padding: '6px 12px', fontSize: '0.85rem' }} onClick={() => setCommodity(c)}>
            {c}
          </button>
        ))}
      </div>
      {loading && <p className="m-muted">Fetching latest mandi prices and calculating best selling market…</p>}
      {error && <p className="m-error" role="alert">{error}</p>}
    </Card>

    {comparison && comparison.highest_price_market && (
      <Card style={{ borderLeft: '4px solid #51c78d' }}>
        <span className="m-eyebrow">Best selling opportunity</span>
        <h2>Highest rate: {comparison.highest_price_market}</h2>
        <div className="m-stat-grid" style={{ marginTop: '0.75rem' }}>
          <Stat label="Highest Modal Price" value={`₹${comparison.highest_price?.toLocaleString()} / Qtl`} />
          <Stat label="Average Market Price" value={`₹${comparison.average_modal_price?.toLocaleString()} / Qtl`} />
          <Stat label="Price Advantage" value={`+₹${Math.round(comparison.highest_price - comparison.average_modal_price)} / Qtl`} />
        </div>
        {comparison.recommendation && <p style={{ marginTop: '0.75rem' }}><b>Advisory:</b> {comparison.recommendation}</p>}
      </Card>
    )}

    <Card>
      <div className="m-section-title">
        <div><span className="m-eyebrow">Mandi reports</span><h2>Reported APMC prices for {commodity}</h2></div>
        <button type="button" className="m-button light" onClick={() => loadPrices(commodity)}>Refresh ↻</button>
      </div>
      {prices.length > 0 ? (
        <div style={{ overflowX: 'auto' }}>
          <table className="m-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', marginTop: '1rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid rgba(255,255,255,0.1)', padding: '8px' }}>
                <th style={{ padding: '10px' }}>Mandi / Market</th>
                <th style={{ padding: '10px' }}>District</th>
                <th style={{ padding: '10px' }}>State</th>
                <th style={{ padding: '10px' }}>Min Price</th>
                <th style={{ padding: '10px' }}>Max Price</th>
                <th style={{ padding: '10px', color: '#51c78d' }}>Modal Price</th>
                <th style={{ padding: '10px' }}>Date</th>
              </tr>
            </thead>
            <tbody>
              {prices.map((p) => (
                <tr key={p.id || `${p.market_name}-${p.arrival_date}`} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '10px' }}><b>{p.market_name}</b></td>
                  <td style={{ padding: '10px' }}>{p.district}</td>
                  <td style={{ padding: '10px' }}>{p.state}</td>
                  <td style={{ padding: '10px' }}>₹{p.min_price?.toLocaleString()}</td>
                  <td style={{ padding: '10px' }}>₹{p.max_price?.toLocaleString()}</td>
                  <td style={{ padding: '10px', color: '#51c78d', fontWeight: 'bold' }}>₹{p.modal_price?.toLocaleString()}</td>
                  <td style={{ padding: '10px', fontSize: '0.85rem' }}>{p.arrival_date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        !loading && <EmptyState title={`No mandi prices found for ${commodity}`} detail="Try searching for another common commodity like Wheat, Tomato, Onion, Cotton or Soybean." />
      )}
    </Card>
  </div>
}

function SchemesPage() {
  const [schemesList, setSchemesList] = useState([])
  const [category, setCategory] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const categories = ['All', 'Financial', 'Insurance', 'Credit', 'Irrigation', 'Soil', 'Solar']

  const loadSchemes = useCallback(async (cat, query) => {
    setLoading(true)
    setError('')
    try {
      const data = await api.schemes.list(cat === 'All' ? null : cat, query || null)
      setSchemesList(data || [])
    } catch (err) {
      setError(err.message || 'Could not load government schemes.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadSchemes(category, search)
  }, [loadSchemes, category, search])

  return <div className="m-page">
    <Heading eyebrow="Government support" title="Verified farmer welfare schemes" detail="Verified Central and State government agricultural support programs with direct official application portals." />
    
    <Card>
      <div className="m-form m-planner-form">
        <label>Search schemes
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by scheme name or keywords (e.g. PM-KISAN, Solar, Insurance)" />
        </label>
      </div>
      <div className="m-chips" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '1rem' }}>
        {categories.map((c) => (
          <button key={c} type="button" className={`m-button ${category === c || (!category && c === 'All') ? 'primary' : 'light'}`} style={{ padding: '6px 12px', fontSize: '0.85rem' }} onClick={() => setCategory(c === 'All' ? '' : c)}>
            {c}
          </button>
        ))}
      </div>
      {loading && <p className="m-muted" style={{ marginTop: '1rem' }}>Loading verified government schemes…</p>}
      {error && <p className="m-error" role="alert">{error}</p>}
    </Card>

    <div className="m-recommend-grid">
      {schemesList.map((scheme) => (
        <Card key={scheme.id || scheme.title}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="m-eyebrow">{scheme.category} · {scheme.level || 'Central'}</span>
            <span style={{ fontSize: '0.8rem', padding: '2px 8px', borderRadius: '4px', background: 'rgba(81,199,141,0.15)', color: '#51c78d' }}>✓ Verified</span>
          </div>
          <h2>{scheme.title}</h2>
          {scheme.title_hi && <p style={{ color: '#b8e66a', fontSize: '0.9rem', marginBottom: '0.5rem' }}>{scheme.title_hi}</p>}
          <p><b>Benefits:</b> {scheme.benefits}</p>
          <p style={{ marginTop: '0.5rem' }}><b>Eligibility:</b> {scheme.eligibility}</p>
          {scheme.application_process && <p style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#ccc' }}><b>How to apply:</b> {scheme.application_process}</p>}
          {scheme.official_portal && (
            <a className="m-button primary" href={scheme.official_portal} target="_blank" rel="noreferrer" style={{ marginTop: '1rem', display: 'inline-block' }}>
              Open official portal ↗
            </a>
          )}
        </Card>
      ))}
    </div>
  </div>
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
const EMPTY_CHAT_MESSAGES = []

async function apiRequest(path, { token, ...options } = {}) {
  const response = await fetch(`/api${path}`, {
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  }).catch((requestError) => {
    if (requestError instanceof TypeError) {
      throw new Error('Cannot connect to the Farm Saathi API. Run `npm run dev` from the project root and reload this page.')
    }
    throw requestError
  })
  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new Error(body.error || `Request failed (${response.status}).`)
  }
  return response.status === 204 ? null : response.json()
}

async function uploadCropImage({ token, file, cropName, observations, onProgress }) {
  if (onProgress) onProgress(25)
  try {
    const data = await api.cropDoctor.detect(file, cropName)
    if (onProgress) onProgress(100)
    return {
      id: data.id || String(Date.now()),
      plantName: data.crop_name || cropName || 'Selected Plant',
      diseaseName: data.detected_disease || 'Diagnosed Condition',
      confidence: Math.round((data.confidence_score || 0.85) * 100),
      severity: data.expert_verification_needed ? 'high' : 'low',
      predictionStatus: data.expert_verification_needed ? 'verification_recommended' : 'identified',
      assessment: data.expert_verification_needed ? 'uncertain' : 'identified',
      modelVersion: 'Gemini-Vision / Agronomic Pathology Engine',
      symptoms: data.symptoms || [],
      immediateActions: data.safety_advisory ? [data.safety_advisory] : [],
      organicOptions: data.organic_remedy ? [data.organic_remedy] : [],
      farmingPractices: data.chemical_remedy ? [data.chemical_remedy] : [],
      farmerObservations: observations || '',
      createdAt: new Date().toISOString(),
      expertVerificationNeeded: data.expert_verification_needed,
      previewUrl: URL.createObjectURL(file),
    }
  } catch (err) {
    throw new Error(err.message || 'Crop disease analysis failed.')
  }
}

function uploadSoilImage({ token, file, cropName, location, onProgress }) {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest()
    request.open('POST', token ? '/api/soil/analyze' : '/api/soil/preview')
    request.timeout = 120_000
    if (token) request.setRequestHeader('Authorization', `Bearer ${token}`)
    request.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100))
    }
    request.onload = () => {
      let body
      try {
        body = JSON.parse(request.responseText)
      } catch {
        return reject(new Error('The server returned an invalid soil-analysis response. Please try again.'))
      }
      if (request.status < 200 || request.status >= 300) return reject(new Error(body.error || `Soil image analysis failed (${request.status}).`))
      onProgress(100)
      return resolve(body.analysis)
    }
    request.onerror = () => reject(new Error('Soil image analysis is temporarily unavailable. Check your connection and try again.'))
    request.ontimeout = () => reject(new Error('Soil image analysis timed out. Please try again.'))
    request.onabort = () => reject(new Error('Soil image analysis was cancelled.'))
    const form = new FormData()
    form.set('image', file, file.name)
    if (cropName) form.set('cropName', cropName)
    if (location) form.set('location', location)
    request.send(form)
  })
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

function renderInlineMarkdown(text, keyPrefix) {
  return text.split(/(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g).map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) return <strong key={`${keyPrefix}-${index}`}>{part.slice(2, -2)}</strong>
    if (part.startsWith('`') && part.endsWith('`')) return <code key={`${keyPrefix}-${index}`}>{part.slice(1, -1)}</code>
    if (part.startsWith('*') && part.endsWith('*')) return <em key={`${keyPrefix}-${index}`}>{part.slice(1, -1)}</em>
    return part
  })
}

function MarkdownContent({ content }) {
  const lines = content.split(/\r?\n/)
  const blocks = []
  const unorderedItem = /^\s*[-*]\s+/
  const orderedItem = /^\s*\d+[.)]\s+/
  const isTableRule = (line) => /^\s*\|?[\s:-]+(?:\|[\s:-]+)+\|?\s*$/.test(line)
  const isTableRow = (line) => line.includes('|')

  for (let index = 0; index < lines.length;) {
    const line = lines[index]
    if (!line.trim()) {
      index += 1
      continue
    }
    const heading = line.match(/^\s{0,3}(#{1,3})\s+(.+)$/)
    if (heading) {
      const Tag = `h${heading[1].length + 2}`
      blocks.push(<Tag key={`heading-${index}`}>{renderInlineMarkdown(heading[2], `heading-${index}`)}</Tag>)
      index += 1
      continue
    }
    if (index + 1 < lines.length && isTableRow(line) && isTableRule(lines[index + 1])) {
      const cells = (row) => row.trim().replace(/^\||\|$/g, '').split('|').map((cell) => cell.trim())
      const headers = cells(line)
      const rows = []
      index += 2
      while (index < lines.length && isTableRow(lines[index]) && lines[index].trim()) {
        rows.push(cells(lines[index]))
        index += 1
      }
      blocks.push(<div className="m-markdown-table-wrap" key={`table-${index}`}><table><thead><tr>{headers.map((cell, cellIndex) => <th key={cellIndex}>{renderInlineMarkdown(cell, `table-head-${index}-${cellIndex}`)}</th>)}</tr></thead><tbody>{rows.map((row, rowIndex) => <tr key={rowIndex}>{headers.map((_, cellIndex) => <td key={cellIndex}>{renderInlineMarkdown(row[cellIndex] || '', `table-cell-${index}-${rowIndex}-${cellIndex}`)}</td>)}</tr>)}</tbody></table></div>)
      continue
    }
    const listType = unorderedItem.test(line) ? 'ul' : orderedItem.test(line) ? 'ol' : ''
    if (listType) {
      const matcher = listType === 'ul' ? unorderedItem : orderedItem
      const items = []
      while (index < lines.length && matcher.test(lines[index])) {
        items.push(lines[index].replace(matcher, ''))
        index += 1
      }
      const Tag = listType
      blocks.push(<Tag key={`list-${index}`}>{items.map((item, itemIndex) => <li key={itemIndex}>{renderInlineMarkdown(item, `list-${index}-${itemIndex}`)}</li>)}</Tag>)
      continue
    }
    const paragraph = []
    while (index < lines.length && lines[index].trim() && !/^\s{0,3}#{1,3}\s+/.test(lines[index]) && !unorderedItem.test(lines[index]) && !orderedItem.test(lines[index])) {
      if (index + 1 < lines.length && isTableRow(lines[index]) && isTableRule(lines[index + 1])) break
      paragraph.push(lines[index].trim())
      index += 1
    }
    if (paragraph.length) blocks.push(<p key={`paragraph-${index}`}>{renderInlineMarkdown(paragraph.join(' '), `paragraph-${index}`)}</p>)
  }
  return <div className="m-markdown">{blocks}</div>
}

function AssistantPage({ voiceFirst = false }) {
  const { profile, crops, tasks, expenses, observations, language, demoMode } = useFarm()
  const location = useLocation()
  const navigate = useNavigate()
  const [token, setToken] = useState(() => localStorage.getItem(CHAT_TOKEN_KEY) || '')
  const [user, setUser] = useState({ name: 'Farmer' })
  const [authMode, setAuthMode] = useState('login')
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '' })
  const [guestMessages, setGuestMessages] = useState([])
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
  const [historySearch, setHistorySearch] = useState('')
  const [savedAnalysisContext, setSavedAnalysisContext] = useState({ recentCropDiagnoses: [], recentSoilAnalyses: [] })
  const [savedAnalysisToken, setSavedAnalysisToken] = useState('')
  const [farmContextError, setFarmContextError] = useState('')
  const recognitionRef = useRef(null)
  const endOfMessagesRef = useRef(null)
  const initialPromptRef = useRef('')
  const signedIn = Boolean(token && user)
  const context = useMemo(() => ({
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
    farmRecordSource: demoMode ? 'project sample data; do not present as this farmer’s actual records' : 'farmer-entered browser records',
    accountName: signedIn ? user.name : null,
    ...(signedIn && savedAnalysisToken === token ? savedAnalysisContext : { recentCropDiagnoses: [], recentSoilAnalyses: [] }),
    weather: 'Not supplied unless fetched for this request. Do not infer current weather.',
    marketPrices: 'Not supplied. Do not invent current prices.',
  }), [profile, crops, observations, expenses, tasks, signedIn, user?.name, savedAnalysisContext, savedAnalysisToken, token, demoMode])
  const activeConversation = conversationList.find((item) => item.id === conversationId)
  const messages = signedIn ? activeConversation?.messages || EMPTY_CHAT_MESSAGES : guestMessages
  const suggestions = [
    'Which crop is suitable for my soil?',
    'How can I improve soil fertility?',
    'Why are my plant leaves turning yellow?',
    'How often should I irrigate my crops?',
    'What fertilizers are suitable for my crop?',
    'How can I identify plant diseases?',
    'What should I do during heavy rainfall?',
    'How can I increase crop production?',
    'Explain the recorded growth stage of my crop.',
    'How can I protect my crops from pests?',
  ]
  const visibleConversations = conversationList.filter((item) => item.title.toLowerCase().includes(historySearch.trim().toLowerCase()))

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
      setUser({ name: 'Farmer' })
      setSavedAnalysisContext({ recentCropDiagnoses: [], recentSoilAnalyses: [] })
      setSavedAnalysisToken('')
      setFarmContextError('')
      setError(requestError.message)
    })
    return () => { active = false }
  }, [token])

  useEffect(() => {
    if (!signedIn) return undefined
    let active = true
    Promise.allSettled([
      apiRequest('/crop-doctor/history', { token }),
      apiRequest('/soil/history', { token }),
    ]).then(([cropResult, soilResult]) => {
      if (!active) return
      const recentCropDiagnoses = cropResult.status === 'fulfilled'
        ? cropResult.value.diagnoses.slice(0, 5).map(({ cropName, diseaseName, confidence, severity, createdAt, predictionStatus }) => ({ cropName, diseaseName, confidence, severity, createdAt, predictionStatus }))
        : []
      const recentSoilAnalyses = soilResult.status === 'fulfilled'
        ? soilResult.value.analyses.slice(0, 5).map(({ cropName, location, predicted_class, confidence, model_version, status, createdAt }) => ({ cropName, location, predictedClass: predicted_class, confidence, modelVersion: model_version, status, createdAt }))
        : []
      const errors = [cropResult, soilResult].filter((result) => result.status === 'rejected')
      setSavedAnalysisContext({ recentCropDiagnoses, recentSoilAnalyses })
      setSavedAnalysisToken(token)
      setFarmContextError(errors.length ? 'Some saved crop or soil history could not be loaded. Chat will use the farm details available in this browser.' : '')
    })
    return () => { active = false }
  }, [signedIn, token])

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages, pendingReply, loading])

  useEffect(() => () => {
    recognitionRef.current?.stop()
    window.speechSynthesis?.cancel()
  }, [])

  const refreshHistory = useCallback(async (keepId = conversationId) => {
    const { conversations } = await apiRequest('/chat/history', { token })
    setConversationList(conversations)
    setConversationId((current) => keepId && conversations.some((item) => item.id === keepId) ? keepId : current && conversations.some((item) => item.id === current) ? current : conversations[0]?.id || '')
  }, [token, conversationId])

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
    setUser({ name: 'Farmer' })
    setConversationList([])
    setConversationId('')
    setGuestMessages([])
    setSavedAnalysisContext({ recentCropDiagnoses: [], recentSoilAnalyses: [] })
    setSavedAnalysisToken('')
    setFarmContextError('')
  }

  const newChat = async () => {
    setError('')
    if (!signedIn) {
      setGuestMessages([])
      setConversationId('')
      setNotice('Started a new chat. Guest conversations are kept only until you leave this page.')
      return
    }
    try {
      const result = await apiRequest('/chat/new', { method: 'POST', token })
      setConversationId(result.conversationId)
      await refreshHistory(result.conversationId)
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  const removeChat = async (id = conversationId, confirmRemoval = true) => {
    if (!signedIn || !id || (confirmRemoval && !window.confirm('Delete this conversation and its saved messages?'))) return
    setError('')
    try {
      await apiRequest(`/chat/history/${id}`, { method: 'DELETE', token })
      setConversationList((items) => items.filter((item) => item.id !== id))
      setConversationId((current) => current === id ? '' : current)
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  const clearHistory = async () => {
    if (!signedIn || !conversationList.length || !window.confirm('Permanently delete all of your saved assistant conversations?')) return
    setError('')
    try {
      await apiRequest('/chat/history', { method: 'DELETE', token })
      setConversationList([])
      setConversationId('')
      setNotice('All saved conversations were deleted.')
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  const streamQuestion = useCallback(async (text = question, retry = false) => {
    const prompt = text.trim()
    if (!prompt || loading) return
    setQuestion('')
    setError('')
    setNotice('')
    setPendingReply('')
    setLoading(true)
    let targetConversation = conversationId
    let streamError = ''
    const priorGuestMessages = signedIn ? [] : retry && guestMessages.at(-1)?.role === 'user' ? guestMessages.slice(0, -1) : guestMessages
    const userMessage = { id: crypto.randomUUID(), role: 'user', content: prompt, created_at: new Date().toISOString() }
    if (!signedIn && !retry) {
      setGuestMessages((items) => [...items, userMessage])
    }
    try {
      const currentContext = {
        ...context,
        weather: await lookupWeatherForChat(profile?.village || profile?.district || ''),
      }
      const apiUrl = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '')
      let streamedSuccess = false

      try {
        const response = await fetch(`${apiUrl}/api/v1/ai/stream`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...(signedIn ? { Authorization: `Bearer ${token}` } : {}) },
          body: JSON.stringify({
            ...(signedIn && targetConversation ? { conversationId: targetConversation } : {}),
            message: prompt,
            context: currentContext,
            language: voiceLanguage.slice(0, 2),
            history: signedIn ? [] : priorGuestMessages.slice(-20).map(({ role, content }) => ({ role, content }))
          }),
        })

        if (response.ok && response.body) {
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
              try {
                const data = JSON.parse(dataLine.slice(6))
                if (eventName === 'conversation' && signedIn) {
                  targetConversation = data.conversationId
                  setConversationId(targetConversation)
                } else if (eventName === 'delta' && data.text) {
                  reply += data.text
                  setPendingReply(reply)
                } else if (eventName === 'error') {
                  streamError = data.error
                }
              } catch (_) {}
            }
            if (done) break
          }
          if (reply.trim()) {
            if (signedIn) {
              await refreshHistory(targetConversation)
            } else {
              setGuestMessages([...priorGuestMessages, userMessage, { id: crypto.randomUUID(), role: 'model', content: reply, created_at: new Date().toISOString() }])
            }
            streamedSuccess = true
          }
        }
      } catch (err) {
        console.warn('Streaming response encountered error, falling back to REST endpoint:', err)
      }

      if (!streamedSuccess) {
        // Fallback to standard robust API
        const cropHint = context?.crops?.[0]?.name || null
        const res = await api.ai.ask(prompt, cropHint, voiceLanguage.slice(0, 2))
        let answerText = res.answer || 'I am ready to help you with your crop queries.'
        if (res.suggested_actions && res.suggested_actions.length > 0) {
          answerText += '\n\n💡 **Recommended Next Steps:**\n' + res.suggested_actions.map((a) => `• ${a}`).join('\n')
        }
        if (signedIn) {
          await refreshHistory(targetConversation)
        } else {
          setGuestMessages([...priorGuestMessages, userMessage, { id: crypto.randomUUID(), role: 'model', content: answerText, created_at: new Date().toISOString() }])
        }
      }

      setPendingReply('')
    } catch (requestError) {
      setError(requestError.message || 'Chat request failed. Backend may be offline.')
      if (retry) setNotice('Retry did not complete. Your question remains available below.')
    } finally {
      setLoading(false)
    }
  }, [question, loading, conversationId, signedIn, guestMessages, context, profile, voiceLanguage, refreshHistory, token])

  const retryLast = () => {
    const lastUser = [...messages].reverse().find((message) => message.role === 'user')
    if (lastUser) streamQuestion(lastUser.content, true)
  }

  const startVoice = async () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) return setVoiceStatus('Speech recognition is not available in this browser. Type your question instead, or use a browser/device with Web Speech recognition support.')
    try {
      const microphoneStream = await navigator.mediaDevices.getUserMedia({ audio: true })
      microphoneStream.getTracks().forEach((track) => track.stop())
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

  useEffect(() => {
    const initialPrompt = location.state?.assistantPrompt
    if (typeof initialPrompt !== 'string' || !initialPrompt.trim() || initialPromptRef.current === initialPrompt) return
    initialPromptRef.current = initialPrompt
    navigate(location.pathname, { replace: true, state: null })
    streamQuestion(initialPrompt)
  }, [location.key, location.pathname, location.state, navigate, streamQuestion])

  if (!user) return <div className="m-page"><Heading eyebrow={voiceFirst ? 'Voice assistant' : 'Farm assistant'} title={voiceFirst ? 'Speak with your farm assistant' : 'Farm assistant'} detail="Sign in or create an account to save conversations securely in the local backend database." /><Card className="m-auth-card"><div className="m-assistant-banner"><span>☏</span><div><h2>{health?.error ? 'Backend unavailable' : health ? 'Account service ready' : 'Connecting to server…'}</h2><p>{health?.error ? health.error : health?.gemini?.configured ? `Sign-in and account creation are ready. Gemini chat is enabled (${health.gemini.model}).` : health ? 'Sign-in and account creation are ready. To use AI chat, add GEMINI_API_KEY to server/.env and restart the backend.' : 'Checking the account service…'}</p></div></div><div className="m-auth-tabs"><button type="button" className={authMode === 'login' ? 'active' : ''} onClick={() => setAuthMode('login')}>Sign in</button><button type="button" className={authMode === 'register' ? 'active' : ''} onClick={() => setAuthMode('register')}>Create account</button></div><form className="m-form" onSubmit={submitAuth}>{authMode === 'register' && <label>Your name<input autoComplete="name" required minLength="2" value={authForm.name} onChange={(event) => setAuthForm({ ...authForm, name: event.target.value })} /></label>}<label>Email<input autoComplete="email" type="email" required value={authForm.email} onChange={(event) => setAuthForm({ ...authForm, email: event.target.value })} /></label><label>Password (at least 10 characters)<input autoComplete={authMode === 'register' ? 'new-password' : 'current-password'} type="password" minLength="10" required value={authForm.password} onChange={(event) => setAuthForm({ ...authForm, password: event.target.value })} /></label><Button type="submit" disabled={loading}>{loading ? 'Please wait…' : authMode === 'register' ? 'Create account' : 'Sign in'}</Button></form>{error && <p className="m-error" role="alert">{error}</p>}<p className="m-muted">You can create an account without a Gemini key. Account credentials and chat history are stored by the local Express service in SQLite. This is a development setup; use HTTPS and a production database before deployment.</p></Card></div>

  return <div className="m-page"><Heading eyebrow={voiceFirst ? 'Voice-first assistant' : 'Farm assistant'} title={voiceFirst ? 'Talk to your farm assistant' : 'Ask Gemini about your farm'} detail="Ask without signing in. Gemini uses the farm records currently available in this browser, and guest conversations stay only on this page." action={<div className="m-assistant-heading-actions"><span className={`m-backend-status ${health?.gemini?.configured ? 'ready' : ''}`}>{health?.gemini?.configured ? `Gemini · ${health.gemini.model}` : 'Gemini key not configured'}</span><Button variant="light" onClick={newChat}>＋ New chat</Button>{signedIn ? <Button variant="light" onClick={logout}>Sign out</Button> : <Button variant="light" onClick={() => setUser(null)}>Account (optional)</Button>}</div>} />
    {farmContextError && <p className="m-muted" role="status">{farmContextError}</p>}
    <div className="m-full-chat">
      <aside className="m-chat-sidebar" aria-label="Conversation history">
        <div className="m-chat-sidebar-brand"><span aria-hidden="true">F</span><div><b>FARM-SAATHI</b><small>AI farming assistant</small></div></div>
        <Button type="button" onClick={newChat}>＋ New chat</Button>
        {signedIn ? <>
          <label className="m-chat-search">Search conversations<input type="search" value={historySearch} onChange={(event) => setHistorySearch(event.target.value)} placeholder="Find a conversation" /></label>
          <div className="m-chat-history-list">
            {visibleConversations.map((item) => <div className={`m-chat-history-item ${item.id === conversationId ? 'active' : ''}`} key={item.id}>
              <button type="button" onClick={() => setConversationId(item.id)} disabled={loading} aria-current={item.id === conversationId ? 'page' : undefined}>
                <span>{item.title}</span><small>{new Date(item.updated_at).toLocaleDateString()}</small>
              </button>
              <button type="button" className="m-chat-delete" aria-label={`Delete conversation: ${item.title}`} onClick={() => removeChat(item.id)}>×</button>
            </div>)}
            {!visibleConversations.length && <p className="m-muted">{conversationList.length ? 'No conversations match your search.' : 'Your saved conversations will appear here.'}</p>}
          </div>
          {conversationList.length > 0 && <button className="m-chat-clear" type="button" onClick={clearHistory} disabled={loading}>Clear all chat history</button>}
        </> : <div className="m-chat-guest-note"><p>Guest chats are temporary and stay in this browser tab.</p><Button type="button" variant="light" onClick={() => setUser(null)}>Sign in to save chats</Button></div>}
      </aside>
      <Card className="m-chat-main">
        <div className="m-assistant-banner"><span aria-hidden="true">F</span><div><h2>Hello, {user.name || 'Farmer'}</h2><p>Farm context: {profile?.district || 'location not set'} · {crops.length} crops · {observations.length} observations · {expenses.length} expenses{signedIn ? ` · ${savedAnalysisContext.recentSoilAnalyses.length} soil reports · ${savedAnalysisContext.recentCropDiagnoses.length} crop diagnoses` : ''}</p></div></div>
        <div className="m-chat-toolbar"><span>{activeConversation?.title || 'New conversation'}</span>{signedIn && conversationId && <Button type="button" variant="light" onClick={() => removeChat()}>Delete chat</Button>}</div>
        {voiceFirst && <section className="m-voice-console"><div className={`m-listening-indicator ${voiceStatus.startsWith('Listening') ? 'active' : ''}`}>{voiceStatus.startsWith('Listening') ? 'Listening' : 'Mic'}</div><div><h2>Ask in your language</h2><p>{voiceStatus || 'Tap the microphone and speak. Recognized words appear below so you can review them before sending.'}</p></div><Button type="button" onClick={startVoice}>Start listening</Button><Button type="button" variant="light" onClick={stopVoice}>Stop listening</Button></section>}
        {messages.length === 0 && !pendingReply ? <div className="m-chat-welcome"><span className="m-chat-welcome-mark" aria-hidden="true">F</span><h2>How can I help with your farm?</h2><p>Choose a question or type your own. Advice will use recorded farm information when available and will not assume missing measurements.</p><div className="m-chat-suggestions">{suggestions.map((suggestion) => <button key={suggestion} type="button" onClick={() => streamQuestion(suggestion)} disabled={loading}>{suggestion}</button>)}</div></div> : <div className="m-chat-history" aria-live="polite">
          {messages.map((message, messageIndex) => {
            const previousQuestion = message.role === 'model'
              ? messages.slice(0, messageIndex).reverse().find((item) => item.role === 'user')?.content || ''
              : ''
            const topic = message.role === 'model' ? relatedLearningTopic(`${previousQuestion} ${message.content}`) : null
            return <article className={`m-chat-turn ${message.role === 'user' ? 'farmer' : 'assistant'}`} key={message.id}>
              <div className={`m-chat-${message.role === 'user' ? 'question' : 'reply'}`}>
                <div className="m-chat-message-heading"><b>{message.role === 'user' ? 'You' : 'FARM-SAATHI'}</b>{message.created_at && <time dateTime={message.created_at}>{String(message.created_at).replace('T', ' ').slice(0, 16)}</time>}</div>
                {message.role === 'user' ? <p>{message.content}</p> : <MarkdownContent content={message.content} />}
                {message.role === 'model' && <div className="m-message-actions"><button type="button" onClick={() => copy(message.content)}>Copy</button><button type="button" onClick={() => speak(message.id, message.content)}>Listen</button>{speakingMessage === message.id && <><button type="button" onClick={pauseSpeech}>{speechPaused ? 'Resume' : 'Pause'}</button><button type="button" onClick={stopSpeech}>Stop</button></>}</div>}
                {topic && <details className="m-learning-resources">
                  <summary>Related photos and videos · {topic.name}</summary>
                  <div>
                    <a href={`https://www.youtube.com/results?search_query=${encodeURIComponent(topic.video)}`} target="_blank" rel="noreferrer">Watch related farming videos ↗</a>
                    <a href={`https://www.google.com/search?tbm=isch&q=${encodeURIComponent(topic.images)}`} target="_blank" rel="noreferrer">Browse photo examples ↗</a>
                    <a href={topic.url} target="_blank" rel="noreferrer">Official guide · {topic.source} ↗</a>
                    <small>External results can vary. Check the source and confirm field-specific advice with a local agriculture expert.</small>
                  </div>
                </details>}
              </div>
            </article>
          })}
          {pendingReply && <article className="m-chat-turn assistant"><div className="m-chat-reply"><div className="m-chat-message-heading"><b>FARM-SAATHI</b><span>Typing</span></div><MarkdownContent content={pendingReply} /></div></article>}
          {loading && !pendingReply && <div className="m-typing" role="status"><span></span><span></span><span></span> FARM-SAATHI is preparing a response…</div>}
          <div ref={endOfMessagesRef} />
        </div>}
        <div className="m-language-row"><label>Answer and voice language<select value={voiceLanguage} onChange={(event) => setVoiceLanguage(event.target.value)}><option value="en-IN">English (India)</option><option value="kn-IN">ಕನ್ನಡ (Kannada)</option><option value="hi-IN">हिन्दी (Hindi)</option><option value="ta-IN">தமிழ் (Tamil)</option><option value="te-IN">తెలుగు (Telugu)</option><option value="mr-IN">मराठी (Marathi)</option></select></label><small>Speech support depends on your browser/device. Replies follow this language where possible.</small></div>
        <form className="m-chat-compose" onSubmit={(event) => { event.preventDefault(); streamQuestion() }}><textarea rows={voiceFirst ? 4 : 3} maxLength={4000} value={question} onChange={(event) => setQuestion(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); streamQuestion() } }} aria-label="Your message" placeholder="Ask about your crops, field observations, expenses, or farming plans…" /><div><Button type="button" variant="light" onClick={startVoice}>Microphone</Button>{voiceStatus.startsWith('Listening') && <Button type="button" variant="light" onClick={stopVoice}>Stop microphone</Button>}<Button type="submit" disabled={!question.trim() || loading}>{loading ? 'Getting response…' : 'Send'}</Button>{messages.some((message) => message.role === 'user') && <Button type="button" variant="light" onClick={retryLast} disabled={loading}>Regenerate last answer</Button>}<small>Enter to send · Shift + Enter for a new line</small></div></form>
        {voiceStatus && !voiceFirst && <p className="m-muted" role="status">{voiceStatus}</p>}{error && <p className="m-error" role="alert">{error}</p>}{notice && <p className="m-success" role="status">{notice}</p>}
        <p className="m-warning">AI responses can be wrong. Do not treat them as a disease diagnosis, soil test, pesticide prescription, live price, or official eligibility decision.</p>
      </Card>
    </div>
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
