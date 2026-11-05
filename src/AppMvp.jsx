import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { BrowserRouter, NavLink, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
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
const HERO_VIDEO_URL = '/farm-field-hero.mp4'
const HERO_POSTER_URL = '/farm-field-hero-poster.jpg'
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
      const legacyDemoMode = localStorage.getItem('farm-saathi:demo-mode') === 'true'
      if (legacyDemoMode && key === 'profile' && parsed?.district === 'Mandya' && parsed?.village === 'Srirangapatna' && parsed?.landSize === 4.8 && parsed?.soil === 'Loamy' && parsed?.irrigation === 'Drip' && parsed?.budget === 85000) return null
      if (legacyDemoMode && ['crops', 'expenses', 'tasks'].includes(key) && Array.isArray(parsed)) {
        return parsed.filter((record) => !String(record.id || '').startsWith('demo-'))
      }
      if (legacyDemoMode && key === 'demo-mode') return false
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
  const [profile, setProfile, profileError] = useStoredState('profile', null)
  const [crops, setCrops, cropsError] = useStoredState('crops', [])
  const [expenses, setExpenses, expensesError] = useStoredState('expenses', [])
  const [tasks, setTasks, tasksError] = useStoredState('tasks', [])
  const [observations, setObservations, observationsError] = useStoredState('observations', [])
  const [, , demoModeError] = useStoredState('demo-mode', false)
  const [language, setLanguage] = useStoredState('language', 'en')
  const [darkMode, setDarkMode] = useStoredState('dark-mode', false)
  const storageError = [profileError, cropsError, expensesError, tasksError, observationsError, demoModeError].find(Boolean) || ''
  const value = { profile, setProfile, crops, setCrops, expenses, setExpenses, tasks, setTasks, observations, setObservations, language, setLanguage, darkMode, setDarkMode, storageError }
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
const daysSince = (date) => Math.max(0, Math.floor((sessionNow - new Date(`${date}T00:00:00`).getTime()) / 86400000))
const percent = (part, total) => total ? Math.min(100, Math.round((part / total) * 100)) : 0
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
  const { profile, language, setLanguage, darkMode, setDarkMode, storageError, token, user, logout } = useFarm()
  const navigate = useNavigate()
  const location = useLocation()

  const isAuthRoute = location.pathname === '/register' || location.pathname === '/login'

  // If unauthenticated or explicitly on register/login, render dedicated AuthPage at beginning
  if (!token || isAuthRoute) {
    return <AuthPage initialMode={location.pathname === '/login' ? 'login' : 'register'} />
  }

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [search, setSearch] = useState('')
  const loc = profile?.village || profile?.district || 'Add your location'
  const displayName = user?.name || profile?.name || 'Farmer'
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
          <label className="m-language"><span className="sr-only">Language</span><select value={language} onChange={(event) => setLanguage(event.target.value)}>{SUPPORTED_LANGUAGES.map((lang) => <option key={lang.code} value={lang.code}>{lang.native} ({lang.label})</option>)}</select></label>
          <NavLink className="m-notification-button" to="/notifications" aria-label="Farm alerts">♢</NavLink>
          <NavLink className="m-quick-action" to="/crop-growth">＋ Add crop</NavLink>
          <button className="m-theme" type="button" onClick={() => setDarkMode(!darkMode)} aria-label={darkMode ? 'Switch to day mode' : 'Switch to night mode'} title={darkMode ? 'Switch to day mode' : 'Switch to night mode'}>{darkMode ? '☀' : '☾'}<span>{darkMode ? 'Day' : 'Night'}</span></button>
          <details className="m-profile-menu"><summary className="m-profile-chip"><span className="m-avatar">{initials}</span><span className="m-profile-name">{displayName}</span><span aria-hidden="true">⌄</span></summary><div className="m-profile-dropdown"><b>{displayName}</b><small>{loc}</small><NavLink to="/profile">{t('Profile & farm settings', language)}</NavLink><button type="button" className="m-plain-action" style={{ color: '#ef4444', marginTop: '8px', textAlign: 'left', cursor: 'pointer', padding: '6px 0', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700 }} onClick={() => { logout(); navigate('/register') }}>🚪 {t('Sign Out', language)}</button></div></details>
        </div>
      </header>
      {storageError && <div className="m-storage-error" role="alert">{storageError}</div>}
      <div className="m-content"><Routes>
        <Route path="/register" element={<AuthPage initialMode="register" />} />
        <Route path="/login" element={<AuthPage initialMode="login" />} />
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
  const { profile, crops, expenses, tasks, observations, language } = useFarm()
  const navigate = useNavigate()
  const videoRef = useRef(null)
  const [heroVideoFailed, setHeroVideoFailed] = useState(false)
  const [videoPlaying, setVideoPlaying] = useState(true)
  const [isMuted, setIsMuted] = useState(true)
  const [videoProgress, setVideoProgress] = useState(0)
  const [pixelMode, setPixelMode] = useState('matrix') // 'matrix' | 'dots' | 'scanline' | 'off'
  const [themeActive, setThemeActive] = useState(true)
  const [reduceMotion, setReduceMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)

  useEffect(() => {
    const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)')
    const updateMotionPreference = () => setReduceMotion(motionPreference.matches)
    motionPreference.addEventListener('change', updateMotionPreference)
    return () => motionPreference.removeEventListener('change', updateMotionPreference)
  }, [])

  const toggleVideoPlay = () => {
    if (!videoRef.current) return
    if (videoRef.current.paused) {
      videoRef.current.play().then(() => setVideoPlaying(true)).catch(() => {})
    } else {
      videoRef.current.pause()
      setVideoPlaying(false)
    }
  }

  const toggleMute = () => {
    if (!videoRef.current) return
    const nextMuted = !videoRef.current.muted
    videoRef.current.muted = nextMuted
    setIsMuted(nextMuted)
  }

  const cyclePixelMode = () => {
    const modes = ['matrix', 'dots', 'scanline', 'off']
    setPixelMode((curr) => modes[(modes.indexOf(curr) + 1) % modes.length])
  }

  const handleTimeUpdate = (event) => {
    const current = event.currentTarget.currentTime
    setVideoProgress(current)
    if (current >= 10.0) {
      event.currentTarget.currentTime = 0
      setVideoProgress(0)
    }
  }

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
  if (!profile) return <Onboarding />
  return <div className={`m-page m-dashboard-page ${themeActive ? 'm-dashboard-video-theme' : ''}`}>
    {themeActive && (
      <div className={`m-dashboard-videography ${!videoPlaying ? 'is-paused' : ''}`}>
        {!heroVideoFailed && !reduceMotion ? (
          <video
            ref={videoRef}
            className="m-dashboard-bg-video"
            aria-hidden="true"
            tabIndex={-1}
            autoPlay
            muted={isMuted}
            loop
            playsInline
            preload="auto"
            poster={HERO_POSTER_URL}
            onTimeUpdate={handleTimeUpdate}
            onError={() => setHeroVideoFailed(true)}
          >
            <source src={HERO_VIDEO_URL} type="video/mp4" />
          </video>
        ) : (
          <div className="m-dashboard-bg-poster" style={{ backgroundImage: `url(${HERO_POSTER_URL})` }} aria-hidden="true" />
        )}
        <div className={`m-dashboard-pixels-grid mode-${pixelMode}`} aria-hidden="true" />
        <div className="m-dashboard-vignette" aria-hidden="true" />
      </div>
    )}

    {/* UI Pixels 10-Second Live Videography Control Dock */}
    <div className="m-videography-hud" role="region" aria-label="Dashboard Videography Controls">
      <div className="m-videography-status">
        <span className={`m-videography-dot ${videoPlaying ? 'live' : 'paused'}`} aria-hidden="true" />
        <span className="m-videography-label">
          <b>UI Pixels Farm Videography</b>
          <small>Farmer working the land with farming tool · 10s Pexels loop</small>
        </span>
        <span className="m-videography-time-badge" aria-live="off">
          {videoProgress.toFixed(1)}s / 10.0s Loop
        </span>
      </div>
      <div className="m-videography-progress-track" title="10-second loop progress">
        <div className="m-videography-progress-bar" style={{ width: `${Math.min(100, Math.max(0, (videoProgress / 10) * 100))}%` }} />
      </div>
      <div className="m-videography-controls">
        <button
          type="button"
          className="m-videography-btn"
          onClick={toggleVideoPlay}
          title={videoPlaying ? 'Pause 10s background video' : 'Play 10s background video'}
          aria-label={videoPlaying ? 'Pause video' : 'Play video'}
        >
          {videoPlaying ? '⏸ Pause' : '▶ Play'}
        </button>
        <button
          type="button"
          className={`m-videography-btn ${!isMuted ? 'active' : ''}`}
          onClick={toggleMute}
          title={isMuted ? 'Unmute farm audio' : 'Mute audio'}
          aria-label={isMuted ? 'Unmute audio' : 'Mute audio'}
        >
          {isMuted ? '🔇 Muted' : '🔊 Sound'}
        </button>
        <button
          type="button"
          className={`m-videography-btn ${pixelMode !== 'off' ? 'active' : ''}`}
          onClick={cyclePixelMode}
          title="Cycle UI Pixels grid overlay (Matrix, Dots, Scanline, Off)"
        >
          ⊞ UI Pixels: <b>{pixelMode}</b>
        </button>
        <button
          type="button"
          className={`m-videography-btn ${themeActive ? 'active' : ''}`}
          onClick={() => setThemeActive(!themeActive)}
          title="Toggle ambient background videography theme"
        >
          {themeActive ? '✦ Theme Active' : '✧ Theme Off'}
        </button>
        <a
          className="m-videography-credit"
          href="https://www.pexels.com/video/farmer-tending-field-with-hoe-and-water-hose-37654726/"
          target="_blank"
          rel="noreferrer"
          title="View original stock video on Pexels"
        >
          Pexels ↗
        </a>
      </div>
    </div>

    <div className="m-welcome">
      {!themeActive && !heroVideoFailed && !reduceMotion && <video
        className="m-welcome-video"
        aria-hidden="true"
        tabIndex={-1}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        poster={HERO_POSTER_URL}
        onTimeUpdate={(event) => {
          if (event.currentTarget.currentTime >= 10) event.currentTarget.currentTime = 0
        }}
        onError={() => setHeroVideoFailed(true)}
      >
        <source src={HERO_VIDEO_URL} type="video/mp4" />
      </video>}
      <div className="m-welcome-copy"><span className="m-eyebrow">{todayLabel} · FARM OVERVIEW</span><h1>{t('Welcome back', language)}, {profile?.name ? profile.name.split(' ')[0] : 'Farmer'} <span>👋</span></h1><p>{t('Your fields are ready for another day of thoughtful growing.', language)}</p><div className="m-welcome-meta"><span>⌖ {profile.village || profile.district}, {profile.state}</span><span>▣ {profile.landSize} {profile.landUnit} registered</span></div><div className="m-welcome-actions"><Button onClick={() => navigate('/crop-growth')}>{t('+ Add crop record', language)}</Button><NavLink className="m-welcome-link" to="/ai-assistant">{t('Ask Farm Assistant →', language)}</NavLink></div></div>
      <a className="m-welcome-video-credit" href="https://www.pexels.com/video/farmer-tending-field-with-hoe-and-water-hose-37654726/" target="_blank" rel="noreferrer">Farmer at work · Pexels ↗</a>
    </div>
    <div className="m-stat-grid m-dashboard-stats">
      <Card className="m-stat"><span className="m-stat-icon">⌂</span><span>{t('Registered land', language)}</span><b>{profile.landSize} <small>{profile.landUnit}</small></b><small className="m-stat-foot">Farm profile record</small></Card>
      <Card className="m-stat"><span className="m-stat-icon">♧</span><span>{t('Crops registered', language)}</span><b>{crops.length}</b><small className="m-stat-foot">{cropArea ? `${cropArea.toLocaleString()} acres recorded` : 'No crop area recorded'}</small></Card>
      <Card className="m-stat"><span className="m-stat-icon">▦</span><span>Open farm tasks</span><b>{openTasks.length}</b><small className="m-stat-foot">{openTasks.length ? `${openTasks.filter((task) => task.date <= dateToday()).length} due today or earlier` : 'No open reminders'}</small></Card>
      <Card className="m-stat"><span className="m-stat-icon">✚</span><span>AI health score</span><b className="m-stat-unavailable">Not assessed</b><small className="m-stat-foot">No verified crop-health score</small></Card>
    </div>
    <div className="m-dashboard-columns m-dashboard-primary">
      <Card className="m-dashboard-health"><div className="m-section-title"><div><span className="m-eyebrow">Field monitoring</span><h2>{t('Field health overview', language)}</h2></div><NavLink to="/crop-doctor">{t('Open Crop Doctor →', language)}</NavLink></div>
        <div className="m-health-empty"><div className="m-health-ring"><span>—</span></div><div><b>Health checks need field observations</b><p>No verified AI crop diagnosis or measured field-health data is available yet. Check a plant photo or record what you observe.</p><NavLink className="m-button primary" to="/crop-doctor">Check a crop photo</NavLink></div></div>
      </Card>
      <WeatherPeek location={profile.village || profile.district || ''} onOpen={() => navigate('/weather')} />
    </div>
    <div className="m-dashboard-columns m-dashboard-secondary">
      <Card><div className="m-section-title"><div><span className="m-eyebrow">Farm profile</span><h2>{t('Soil health summary', language)}</h2></div><NavLink to="/smart-water">{t('Open soil tools', language)} →</NavLink></div><div className="m-soil-summary"><span className="m-soil-icon">♧</span><div><b>{profile.soil || 'Soil type not recorded'}</b><small>Farmer-entered profile · not a laboratory measurement</small></div></div><div className="m-soil-summary-grid"><div><small>Water availability</small><b>{profile.water || 'Not recorded'}</b></div><div><small>Irrigation</small><b>{profile.irrigation || 'Not recorded'}</b></div></div><NavLink className="m-button light" to="/smart-water">Open soil tools</NavLink></Card>
      <Card><div className="m-section-title"><div><span className="m-eyebrow">On your land</span><h2>Crop distribution</h2></div><NavLink to="/crop-growth">Manage crops →</NavLink></div>
        {cropSegments.length ? <div className="m-crop-distribution"><div className="m-crop-donut" style={{ background: distributionBackground }}><span>{cropArea.toLocaleString()}<small>acres</small></span></div><div className="m-crop-legend">{cropSegments.slice(0, 5).map((crop) => <div key={crop.id}><i style={{ background: crop.color }} /><span>{crop.name}</span><b>{Number(crop.area || 0).toLocaleString()} ac</b></div>)}</div></div> : <EmptyState title="No crop area recorded" detail="Add crop and field area records to see their distribution." action={<Button variant="light" onClick={() => navigate('/crop-growth')}>Add crop</Button>} />}
      </Card>
    </div>
    <div className="m-dashboard-columns">
      <Card><div className="m-section-title"><div><span className="m-eyebrow">Field observations</span><h2>Soil moisture trend</h2></div><NavLink to="/smart-water">Water & soil →</NavLink></div><div className="m-chart-unavailable"><span>⌁</span><div><b>No sensor readings recorded</b><p>Connect or record actual soil-moisture readings to show a trend. This dashboard does not estimate moisture from photos.</p></div></div></Card>
      <Card><div className="m-section-title"><div><span className="m-eyebrow">Your next steps</span><h2>Upcoming farming tasks</h2></div><NavLink to="/calendar">View calendar →</NavLink></div>
        {pending.length ? <ul className="m-task-list">{pending.map((task) => <li key={task.id}><span className="m-task-dot"></span><span><b>{task.title}</b><small>{task.date === dateToday() ? 'Today' : task.date}{task.crop ? ` · ${task.crop}` : ''}</small></span></li>)}</ul> : <EmptyState title="No upcoming activities" detail="Keep track of field work by adding tasks to your calendar." action={<Button variant="light" onClick={() => navigate('/calendar')}>Add activity</Button>} />}
      </Card>
    </div>
    <div className="m-dashboard-columns">
      <Card><div className="m-section-title"><div><span className="m-eyebrow">On your land</span><h2>My crops</h2></div><NavLink to="/crop-growth">Manage crops →</NavLink></div>
        {crops.length ? <div className="m-crop-list">{crops.slice(0, 4).map((crop) => <div key={crop.id}><CropSummary crop={crop} /><div className="m-dashboard-crop-progress"><div className="m-progress"><span style={{ width: `${crop.stageIndex < 0 ? 0 : percent(crop.stageIndex + 1, stages.length)}%` }} /></div><small>{crop.stageIndex < 0 ? 'Growth stage not recorded' : `${percent(crop.stageIndex + 1, stages.length)}% of recorded lifecycle`} · {crop.health || 'Health not assessed'}</small></div></div>)}</div> : <EmptyState title="No crops registered yet" detail="Add a crop with its sowing date to start tracking real progress." action={<Button onClick={() => navigate('/crop-growth')}>Register a crop</Button>} />}
      </Card>
      <Card><div className="m-section-title"><div><span className="m-eyebrow">Farm activity</span><h2>Recent field notes</h2></div><NavLink to="/crop-growth">Crop records →</NavLink></div>
        {observations.length ? <div className="m-recent-activity">{observations.slice(0, 4).map((item) => <div key={item.id}><span className="m-activity-marker">•</span><p><b>{crops.find((crop) => crop.id === item.cropId)?.name || 'Farm note'}</b><span>{item.text}</span><small>{item.date}</small></p></div>)}</div> : <EmptyState title="No field notes yet" detail="Observations you add to crop records will appear here." action={<Button variant="light" onClick={() => navigate('/crop-growth')}>Add observation</Button>} />}
      </Card>
    </div>
    <div className="m-dashboard-columns">
      <Card><div className="m-section-title"><div><span className="m-eyebrow">Farm finances</span><h2>Expense summary</h2></div><NavLink to="/expenses">See expenses →</NavLink></div>{expenses.length ? <><div className="m-finance-total">{money(expenseTotal)}<small>Total recorded farm expenses</small></div><div className="m-inline-stats"><span>{expenses.length} records</span><span>Budget: {profile.budget != null ? money(profile.budget) : 'Not recorded'}</span></div><div className="m-dashboard-expense-bars">{categories.map((category) => { const amount = expenses.filter((item) => item.category === category).reduce((sum, item) => sum + Number(item.amount || 0), 0); return amount ? <div key={category}><span>{category}</span><div className="m-progress"><span style={{ width: `${percent(amount, expenseTotal)}%` }} /></div><b>{money(amount)}</b></div> : null })}</div></> : <EmptyState title="No expenses recorded" detail="Add a record when you make a farm purchase; no spending is assumed." action={<Button variant="light" onClick={() => navigate('/expenses')}>Record an expense</Button>} />}</Card>
      <WeatherPeek location={profile.village || profile.district || ''} onOpen={() => navigate('/weather')} />
    </div>
    <div className="m-dashboard-columns">
      <Card><div className="m-section-title"><div><span className="m-eyebrow">Market information</span><h2>Mandi price highlights</h2></div><NavLink to="/market-price">Open source →</NavLink></div><div className="m-not-connected"><span>₹</span><p><b>Live prices not connected</b><small>We do not show sample rates as today's prices. Check Agmarknet for verified market reports.</small></p><a href="https://agmarknet.gov.in/" target="_blank" rel="noreferrer">Agmarknet ↗</a></div></Card>
      <Card><div className="m-section-title"><div><span className="m-eyebrow">Planning guidance</span><h2>Plan with verified local information</h2></div><NavLink to="/crop-analyzer">Open Crop Analyzer →</NavLink></div><p>No ranked crop predictions or yield estimates are shown without a verified local source.</p><div className="m-dashboard-alert"><b>Crop health is not assessed</b><small>No diagnosis or measured field-health data is available. Record observations or submit a crop photo when the trained model is ready.</small><NavLink to="/crop-doctor">Open Crop Doctor →</NavLink></div></Card>
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
    if (!location.trim()) {
      setError('Add your village or district in your profile before loading local weather.')
      setStatus('error')
      return
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
  return <Card><div className="m-section-title"><div><span className="m-eyebrow">Area forecast</span><h2>Weather snapshot</h2></div><button className="m-plain-action" type="button" onClick={onOpen}>7-day →</button></div>
    {weather ? <div className="m-dashboard-weather"><div><span className="m-weather-symbol">{weatherDescription(weather.weather_code)[1]}</span><b>{Math.round(weather.temperature_2m)}°C</b><small>{weatherDescription(weather.weather_code)[0]} · {weather.place.name}</small></div><div><span>Humidity</span><b>{weather.relative_humidity_2m}%</b></div><div><span>Rain chance today</span><b>{weather.rainChance ?? '—'}%</b></div><div><span>Wind</span><b>{weather.wind_speed_10m} km/h</b></div><small className="m-live-label">LIVE FORECAST · OPEN-METEO</small></div> : <div className="m-weather-empty"><span>☼</span><p><b>{status === 'loading' ? 'Checking current forecast…' : 'Live weather is not loaded'}</b><small>{error || `Fetch current conditions for ${location}. No sample weather is shown.`}</small></p><Button variant="light" onClick={() => loadWeather()} disabled={status === 'loading'}>{status === 'loading' ? 'Loading…' : 'Try again'}</Button></div>}
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
  const [form, setForm] = useState(profile || { name: '', phone: '', email: '', state: '', district: '', village: '', landSize: '', landUnit: 'acres', soil: '', water: 'Not known', irrigation: 'Not specified', budget: '', preferredLanguage: 'English' })
  const change = (key) => (event) => setForm((previous) => ({ ...previous, [key]: event.target.value }))
  const submit = (event) => {
    event.preventDefault()
    if (!form.name.trim() || !form.state.trim() || !form.landSize || Number(form.landSize) <= 0) return
    setProfile({ ...form, name: form.name.trim(), landSize: Number(form.landSize), budget: String(form.budget ?? '').trim() ? Number(form.budget) : null })
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
    <div className="m-form-footer"><p>Farm profile and crop records are stored in this browser; they are not synced to an account.</p><Button type="submit">{t('Save profile', language)}</Button></div>
  </form></Card>
}

function MyFarmPage() {
  const { profile, crops } = useFarm()
  return <div className="m-page"><Heading eyebrow="My farm" title="Your land at a glance" detail="Edit your registered location, soil, water and land details in your profile." action={<NavLink className="m-button primary" to="/profile">Edit farm details</NavLink>} />
    <div className="m-stat-grid"><Stat label="Farm area" value={profile?.landSize ? `${profile.landSize} ${profile.landUnit}` : 'Not recorded'} /><Stat label="Soil information" value={profile?.soil || 'Not provided'} /><Stat label="Water availability" value={profile?.water || 'Not provided'} /><Stat label="Irrigation" value={profile?.irrigation || 'Not specified'} /></div>
    <Card><div className="m-section-title"><h2>Registered crops and fields</h2><NavLink to="/crop-growth">Add crop →</NavLink></div>{crops.length ? <div className="m-crop-list">{crops.map((crop) => <CropSummary key={crop.id} crop={crop} />)}</div> : <EmptyState title="No fields added" detail="Register a crop to begin a field record." />}</Card>
  </div>
}


const CROP_CATALOG = [
  {
    id: 'maize',
    name: 'Maize (Corn)',
    localName: 'ಮೆಕ್ಕೆಜೋಳ / मक्का',
    icon: '🌽',
    category: 'Cereals & Millets',
    soils: ['Loamy', 'Black', 'Alluvial', 'Red'],
    seasons: ['Kharif (Monsoon/Summer)', 'Rabi (Winter)', 'Zaid (Summer)'],
    waterReq: 'Moderate / Rainfed',
    minRainfall: '500-750 mm',
    durationDays: 105,
    durationText: '95 - 110 days',
    costPerAcre: 18500,
    expectedYield: '28 - 34 quintals/acre',
    yieldPerAcreNum: 30,
    unitPrice: 2150,
    netProfitPerAcre: 46000,
    roi: '148%',
    risk: 'Low',
    suitabilityReason: 'Excellent response to warm climate and well-drained loams/black soil with moderate water requirement.',
    npkSchedule: '120 kg N : 60 kg P2O5 : 40 kg K2O per hectare. 1/3 N at sowing, 1/3 at knee-high, 1/3 at tasseling.',
    irrigationCritical: 'Knee-high stage (30-35 DAS), Tasseling (50-55 DAS), and Silking / Grain fill (65-75 DAS).',
    pestAlert: 'Scout for Fall Armyworm (FAW) on young whorls and stem borer; apply neem or chlorantraniliprole if needed.',
    companion: 'Pigeon pea (Tur) or Green gram in 2:1 intercrop ratio to enrich soil nitrogen.',
  },
  {
    id: 'groundnut',
    name: 'Groundnut (Peanut)',
    localName: 'ಕಡಲೆಕಾಯಿ / मूंगफली',
    icon: '🥜',
    category: 'Oilseeds & Cash Crops',
    soils: ['Red', 'Sandy', 'Loamy'],
    seasons: ['Kharif (Monsoon/Summer)', 'Rabi (Winter)'],
    waterReq: 'Moderate / Rainfed',
    minRainfall: '450-600 mm',
    durationDays: 115,
    durationText: '110 - 125 days',
    costPerAcre: 22000,
    expectedYield: '10 - 14 quintals/acre',
    yieldPerAcreNum: 12,
    unitPrice: 5800,
    netProfitPerAcre: 47600,
    roi: '116%',
    risk: 'Low to Moderate',
    suitabilityReason: 'Light porous red/sandy-loam soils allow easy pegging and pod development; fixes atmospheric nitrogen.',
    npkSchedule: '25 kg N : 50 kg P2O5 : 25 kg K2O + 200 kg Gypsum at flowering (45 DAS) for calcium and sulfur.',
    irrigationCritical: 'Flowering (30-40 DAS) and Pegging / Pod development (50-70 DAS). Avoid moisture stress during peg penetration.',
    pestAlert: 'Tikka leaf spot (Cercospora) and collar rot; ensure seed treatment with Trichoderma.',
    companion: 'Castor or Pearl millet as border trap crop; intercrop with Pigeon pea.',
  },
  {
    id: 'chickpea',
    name: 'Chickpea (Bengal Gram / Chana)',
    localName: 'ಕಡಲೆ / चना',
    icon: '🥣',
    category: 'Pulses',
    soils: ['Black', 'Clay', 'Loamy', 'Alluvial'],
    seasons: ['Rabi (Winter)'],
    waterReq: 'Scarce / Dryland',
    minRainfall: '300-450 mm',
    durationDays: 105,
    durationText: '100 - 115 days',
    costPerAcre: 14000,
    expectedYield: '8 - 12 quintals/acre',
    yieldPerAcreNum: 10,
    unitPrice: 5450,
    netProfitPerAcre: 40500,
    roi: '189%',
    risk: 'Low',
    suitabilityReason: 'Thrives in residual moisture of heavy black or clay-loam soils; ideal low-input high-return Rabi pulse.',
    npkSchedule: '20 kg N : 40 kg P2O5 : 20 kg K2O. Seed inoculation with Rhizobium and PSB biofertilizer.',
    irrigationCritical: 'Pre-flowering (45 DAS) and Pod development (70 DAS). Never irrigate during peak flowering.',
    pestAlert: 'Helicoverpa armigera (pod borer); install pheromone traps (5/acre) and spray HaNPV or bio-pesticides.',
    companion: 'Mustard or Linseed intercropped (4:1 row ratio) disrupts pod borer egg laying.',
  },
  {
    id: 'wheat',
    name: 'Wheat',
    localName: 'ಗೋಧಿ / गेहूं',
    icon: '🌾',
    category: 'Cereals & Millets',
    soils: ['Alluvial', 'Loamy', 'Clay', 'Black'],
    seasons: ['Rabi (Winter)'],
    waterReq: 'Adequate / Irrigated',
    minRainfall: '400-500 mm',
    durationDays: 120,
    durationText: '110 - 130 days',
    costPerAcre: 18000,
    expectedYield: '20 - 25 quintals/acre',
    yieldPerAcreNum: 22,
    unitPrice: 2425,
    netProfitPerAcre: 35350,
    roi: '96%',
    risk: 'Low',
    suitabilityReason: 'Cold winter climate combined with fertile alluvial or loamy soils yields stable grain and valuable straw.',
    npkSchedule: '120 kg N : 60 kg P2O5 : 40 kg K2O per hectare. Half N + full P & K at sowing; half N top-dressed.',
    irrigationCritical: 'Crown Root Initiation (CRI) at 21 DAS is mandatory; subsequent irrigations at Tillering, Jointing, Flowering, and Milk stages.',
    pestAlert: 'Yellow rust in cool regions and termites; seed treatment with chlorpyriphos or thiamethoxam.',
    companion: 'Mustard or Chickpea in traditional strip cropping.',
  },
  {
    id: 'cotton',
    name: 'Cotton',
    localName: 'ಹತ್ತಿ / कपास',
    icon: '☁️',
    category: 'Oilseeds & Cash Crops',
    soils: ['Black', 'Alluvial', 'Loamy'],
    seasons: ['Kharif (Monsoon/Summer)'],
    waterReq: 'Adequate / Irrigated',
    minRainfall: '650-1000 mm',
    durationDays: 165,
    durationText: '150 - 180 days',
    costPerAcre: 29000,
    expectedYield: '12 - 16 quintals/acre',
    yieldPerAcreNum: 14,
    unitPrice: 7100,
    netProfitPerAcre: 70400,
    roi: '142%',
    risk: 'Moderate',
    suitabilityReason: 'Deep black cotton soils with high moisture-retention capacity are historically the gold standard for cotton.',
    npkSchedule: '100 kg N : 50 kg P2O5 : 50 kg K2O in 3 split doses (sowing, square formation, flowering).',
    irrigationCritical: 'Flowering and boll formation stages. Avoid water stress when bolls are sizing.',
    pestAlert: 'Pink bollworm and sucking pests (thrips, whitefly, jassids); install light traps and scout regularly.',
    companion: 'Green gram or Cowpea intercrop provides supplementary income and natural predator habitat.',
  },
  {
    id: 'tomato',
    name: 'Tomato',
    localName: 'ಟೊಮ್ಯಾಟೊ / टमाटर',
    icon: '🍅',
    category: 'Vegetables',
    soils: ['Loamy', 'Red', 'Alluvial', 'Black'],
    seasons: ['Kharif (Monsoon/Summer)', 'Rabi (Winter)', 'Zaid (Summer)'],
    waterReq: 'Adequate / Irrigated',
    minRainfall: '600-800 mm',
    durationDays: 110,
    durationText: '90 - 120 days',
    costPerAcre: 38000,
    expectedYield: '160 - 220 quintals/acre',
    yieldPerAcreNum: 180,
    unitPrice: 1300,
    netProfitPerAcre: 196000,
    roi: '415%',
    risk: 'Moderate to High',
    suitabilityReason: 'High-value commercial horticultural crop with excellent returns when drip irrigation and trellising are used.',
    npkSchedule: '150 kg N : 100 kg P2O5 : 120 kg K2O per hectare through fertigation, plus micronutrient foliar spray.',
    irrigationCritical: 'Uniform light irrigations at 3-4 day intervals; avoid alternate soaking and drying to prevent blossom-end rot and fruit cracking.',
    pestAlert: 'Early/Late Blight and Tomato Leaf Curl Virus; manage whitefly vectors with yellow sticky cards.',
    companion: 'Marigold (Tagetes) border plantation suppresses soil nematodes and repels insect pests.',
  },
  {
    id: 'ragi',
    name: 'Finger Millet (Ragi)',
    localName: 'ರಾಗಿ / रागी',
    icon: '🌾',
    category: 'Cereals & Millets',
    soils: ['Red', 'Loamy', 'Laterite', 'Sandy'],
    seasons: ['Kharif (Monsoon/Summer)', 'Rabi (Winter)'],
    waterReq: 'Scarce / Dryland',
    minRainfall: '400-600 mm',
    durationDays: 105,
    durationText: '100 - 115 days',
    costPerAcre: 12500,
    expectedYield: '14 - 18 quintals/acre',
    yieldPerAcreNum: 16,
    unitPrice: 3850,
    netProfitPerAcre: 49100,
    roi: '292%',
    risk: 'Very Low',
    suitabilityReason: 'Extreme resilience to drought, thrives in acidic low-fertility red soils, very low pest incidence, high nutritional market demand.',
    npkSchedule: '50 kg N : 40 kg P2O5 : 25 kg K2O. Incorporate 5 tonnes farmyard manure (FYM) before planting.',
    irrigationCritical: 'Tillering and Grain filling; usually rainfed, but 1-2 protective irrigations double grain yield.',
    pestAlert: 'Blast disease (Pyricularia); use certified resistant seeds like ML-365, GPU-28 or MR-1.',
    companion: 'Pigeon pea or Field bean (Avare) in 8:2 row ratio provides balanced nutrition and soil enrichment.',
  },
  {
    id: 'paddy',
    name: 'Paddy Rice',
    localName: 'ಭತ್ತ / धान',
    icon: '🍚',
    category: 'Cereals & Millets',
    soils: ['Clay', 'Alluvial', 'Loamy'],
    seasons: ['Kharif (Monsoon/Summer)', 'Rabi (Winter)'],
    waterReq: 'Adequate / Irrigated',
    minRainfall: '1000-1500 mm',
    durationDays: 130,
    durationText: '120 - 140 days',
    costPerAcre: 26000,
    expectedYield: '28 - 36 quintals/acre',
    yieldPerAcreNum: 32,
    unitPrice: 2200,
    netProfitPerAcre: 44400,
    roi: '70%',
    risk: 'Low',
    suitabilityReason: 'Heavy clay and alluvial soils hold puddling water efficiently; assured staple market demand.',
    npkSchedule: '100 kg N : 50 kg P2O5 : 50 kg K2O + 25 kg Zinc Sulfate at transplanting.',
    irrigationCritical: 'Continuous saturation from transplanting to milk stage; drain water 10 days before harvest.',
    pestAlert: 'Stem borer, leaf folder, and blast; adopt alternate wetting and drying (AWD) to strengthen roots.',
    companion: 'Follow with Pulses (Urad/Moong) as relay crop using residual moisture (Rice fallows).',
  },
  {
    id: 'soybean',
    name: 'Soybean',
    localName: 'ಸೋಯಾಬೀನ್ / सोयाबीन',
    icon: '🌱',
    category: 'Oilseeds & Cash Crops',
    soils: ['Black', 'Loamy', 'Alluvial'],
    seasons: ['Kharif (Monsoon/Summer)'],
    waterReq: 'Moderate / Rainfed',
    minRainfall: '600-800 mm',
    durationDays: 95,
    durationText: '90 - 105 days',
    costPerAcre: 16500,
    expectedYield: '10 - 14 quintals/acre',
    yieldPerAcreNum: 12,
    unitPrice: 4600,
    netProfitPerAcre: 38700,
    roi: '134%',
    risk: 'Low to Moderate',
    suitabilityReason: 'Fast-maturing dual pulse-oilseed crop, deep rooting enriches black soil with biological nitrogen.',
    npkSchedule: '30 kg N : 60 kg P2O5 : 40 kg K2O. Treat seed with Bradyrhizobium japonicum.',
    irrigationCritical: 'Flowering and Pod-filling stages. Water stress at pod fill reduces grain weight.',
    pestAlert: 'Girdle beetle and rust; spray neem seed kernel extract or recommended biofungicide.',
    companion: 'Pigeon pea (4:2 ratio) or Maize; ideal Kharif precursor to Rabi Wheat.',
  },
  {
    id: 'sorghum',
    name: 'Sorghum (Jowar)',
    localName: 'ಜೋಳ / ज्वार',
    icon: '🌾',
    category: 'Cereals & Millets',
    soils: ['Black', 'Loamy', 'Clay', 'Red'],
    seasons: ['Kharif (Monsoon/Summer)', 'Rabi (Winter)'],
    waterReq: 'Scarce / Dryland',
    minRainfall: '400-600 mm',
    durationDays: 110,
    durationText: '100 - 115 days',
    costPerAcre: 13000,
    expectedYield: '14 - 18 quintals/acre',
    yieldPerAcreNum: 16,
    unitPrice: 2950,
    netProfitPerAcre: 34200,
    roi: '163%',
    risk: 'Very Low',
    suitabilityReason: 'Excellent drought resistance and extensive root system; provides high market value grain plus nutritious cattle fodder.',
    npkSchedule: '80 kg N : 40 kg P2O5 : 40 kg K2O. Split nitrogen half at sowing, half at knee-high.',
    irrigationCritical: 'Panicle initiation and grain filling stages if grown with irrigation.',
    pestAlert: 'Shoot fly in early seedlings (first 3 weeks); sow within 10 days of monsoon onset to escape damage.',
    companion: 'Cowpea or Green gram intercropping improves fodder protein and checks weeds.',
  },
  {
    id: 'chilli',
    name: 'Chilli',
    localName: 'ಮೆಣಸಿನಕಾಯಿ / मिर्च',
    icon: '🌶️',
    category: 'Vegetables',
    soils: ['Black', 'Loamy', 'Red'],
    seasons: ['Kharif (Monsoon/Summer)', 'Rabi (Winter)'],
    waterReq: 'Adequate / Irrigated',
    minRainfall: '600-800 mm',
    durationDays: 150,
    durationText: '140 - 160 days',
    costPerAcre: 34000,
    expectedYield: '14 - 18 quintals dry/acre',
    yieldPerAcreNum: 16,
    unitPrice: 11500,
    netProfitPerAcre: 150000,
    roi: '341%',
    risk: 'Moderate',
    suitabilityReason: 'Warm climate cash crop with substantial export and domestic market value; highly responsive to fertigation.',
    npkSchedule: '120 kg N : 60 kg P2O5 : 80 kg K2O. Top-dress nitrogen in 4 splits after every picking.',
    irrigationCritical: 'Light frequent irrigations; avoid water stagnation which causes root rot and damping off.',
    pestAlert: 'Thrips, mites, and Anthracnose fruit rot; apply sulfur for mites and neem oil for thrips.',
    companion: 'Onion or Coriander as border crop to confuse thrips.',
  },
  {
    id: 'onion',
    name: 'Onion',
    localName: 'ಈರುಳ್ಳಿ / प्याज',
    icon: '🧅',
    category: 'Vegetables',
    soils: ['Loamy', 'Alluvial', 'Red', 'Black'],
    seasons: ['Kharif (Monsoon/Summer)', 'Rabi (Winter)', 'Zaid (Summer)'],
    waterReq: 'Adequate / Irrigated',
    minRainfall: '550-700 mm',
    durationDays: 120,
    durationText: '110 - 130 days',
    costPerAcre: 32000,
    expectedYield: '90 - 130 quintals/acre',
    yieldPerAcreNum: 110,
    unitPrice: 1750,
    netProfitPerAcre: 160500,
    roi: '401%',
    risk: 'Moderate',
    suitabilityReason: 'High-demand vegetable staple with quick liquidity; requires loose, friable, well-aerated soil for bulb expansion.',
    npkSchedule: '100 kg N : 50 kg P2O5 : 50 kg K2O + 20 kg Sulfur per hectare for pungency and storage life.',
    irrigationCritical: 'Bulb enlargement stage requires regular moisture; withhold irrigation 12-15 days prior to harvest.',
    pestAlert: 'Thrips and Purple blotch; keep field weed-free to prevent thrips sheltering.',
    companion: 'Carrot or Beetroot in kitchen gardens; excellent rotation after paddy or maize.',
  },
  {
    id: 'green_gram',
    name: 'Green Gram (Moong)',
    localName: 'ಹೆಸರು ಕಾಳು / मूंग',
    icon: '🌿',
    category: 'Pulses',
    soils: ['Loamy', 'Alluvial', 'Red', 'Black', 'Sandy'],
    seasons: ['Kharif (Monsoon/Summer)', 'Zaid (Summer)'],
    waterReq: 'Scarce / Dryland',
    minRainfall: '350-500 mm',
    durationDays: 65,
    durationText: '60 - 70 days',
    costPerAcre: 9500,
    expectedYield: '6 - 8 quintals/acre',
    yieldPerAcreNum: 7,
    unitPrice: 7300,
    netProfitPerAcre: 41600,
    roi: '337%',
    risk: 'Low',
    suitabilityReason: 'Shortest duration cash pulse (65 days); restores nitrogen into soil, fits perfectly into gaps between main seasons.',
    npkSchedule: '20 kg N : 40 kg P2O5 : 20 kg K2O. Seed priming with rhizobium improves nodulation.',
    irrigationCritical: 'Branching and Pod development stages. Usually needs only 1-2 irrigations in summer.',
    pestAlert: 'Yellow mosaic virus (YMV); use resistant varieties (like IPM 02-3 or Pusa Vishal) and check whitefly.',
    companion: 'Ideal intercrop with Sugarcane, Cotton, or Maize.',
  },
  {
    id: 'mustard',
    name: 'Mustard (Rapeseed)',
    localName: 'ಸಾಸಿವೆ / सरसों',
    icon: '🌼',
    category: 'Oilseeds & Cash Crops',
    soils: ['Alluvial', 'Loamy', 'Clay'],
    seasons: ['Rabi (Winter)'],
    waterReq: 'Moderate / Rainfed',
    minRainfall: '350-450 mm',
    durationDays: 110,
    durationText: '100 - 120 days',
    costPerAcre: 13000,
    expectedYield: '8 - 12 quintals/acre',
    yieldPerAcreNum: 10,
    unitPrice: 5350,
    netProfitPerAcre: 40500,
    roi: '211%',
    risk: 'Low',
    suitabilityReason: 'Cool-season oilseed with minimal water needs; thrives in alluvial and loamy soils with deep root moisture.',
    npkSchedule: '80 kg N : 40 kg P2O5 : 40 kg K2O + 20 kg Sulfur. Sulfur directly increases oil content by 2-3%.',
    irrigationCritical: 'Rosette stage (30 DAS) and Siliquae (pod) filling stage (60-65 DAS).',
    pestAlert: 'Aphids during flowering; spray yellow sticky traps and apply dimethoate or neem oil if threshold crossed.',
    companion: 'Wheat-Mustard intercrop (9:1 ratio) is a proven northern and central Indian practice.',
  },
  {
    id: 'pigeon_pea',
    name: 'Pigeon Pea (Tur / Arhar)',
    localName: 'ತೊಗರಿ / अरहर',
    icon: '🍲',
    category: 'Pulses',
    soils: ['Black', 'Loamy', 'Red', 'Alluvial'],
    seasons: ['Kharif (Monsoon/Summer)'],
    waterReq: 'Moderate / Rainfed',
    minRainfall: '550-750 mm',
    durationDays: 165,
    durationText: '150 - 180 days',
    costPerAcre: 15500,
    expectedYield: '8 - 12 quintals/acre',
    yieldPerAcreNum: 10,
    unitPrice: 7100,
    netProfitPerAcre: 55500,
    roi: '258%',
    risk: 'Low to Moderate',
    suitabilityReason: 'Deep root architecture breaks hard subsoil layers; resilient to intermittent dry spells; fetches premium market price.',
    npkSchedule: '25 kg N : 50 kg P2O5 : 20 kg K2O. Requires phosphorus for active root nodule development.',
    irrigationCritical: 'Flower initiation (75-80 DAS) and Pod fill (110-120 DAS) if rains cease early.',
    pestAlert: 'Pod borer (Helicoverpa) and sterility mosaic; use Maruca-tolerant cultivars like TS-3R or ICP-8863.',
    companion: 'Universal companion intercrop with Cotton (1:1), Soybean (2:1), or Sorghum (2:1).',
  },
  {
    id: 'sugarcane',
    name: 'Sugarcane',
    localName: 'ಕಬ್ಬು / गन्ना',
    icon: '🎋',
    category: 'Oilseeds & Cash Crops',
    soils: ['Alluvial', 'Black', 'Loamy', 'Clay'],
    seasons: ['Kharif (Monsoon/Summer)', 'Rabi (Winter)', 'Year-round'],
    waterReq: 'Adequate / Irrigated',
    minRainfall: '1200-1500 mm',
    durationDays: 330,
    durationText: '300 - 365 days',
    costPerAcre: 48000,
    expectedYield: '360 - 450 quintals/acre',
    yieldPerAcreNum: 400,
    unitPrice: 320,
    netProfitPerAcre: 80000,
    roi: '66%',
    risk: 'Low',
    suitabilityReason: 'Long-duration industrial crop with guaranteed mill purchase (Fair & Remunerative Price); high biomass output.',
    npkSchedule: '250 kg N : 100 kg P2O5 : 120 kg K2O in 3 split doses up to 90 days after planting.',
    irrigationCritical: 'Formative phase (60-150 DAS) and Grand growth phase; drip with trash mulching saves 40% water.',
    pestAlert: 'Early shoot borer and Red rot; use single-bud seedlings and Trichogramma egg parasitoids.',
    companion: 'Short-duration pulses (Moong/Urad) can be grown in inter-row spaces during the first 60 days.',
  },
  {
    id: 'watermelon',
    name: 'Watermelon',
    localName: 'ಕಲ್ಲಂಗಡಿ / तरबूज',
    icon: '🍉',
    category: 'Vegetables',
    soils: ['Sandy', 'Loamy', 'Alluvial'],
    seasons: ['Zaid (Summer)'],
    waterReq: 'Adequate / Irrigated',
    minRainfall: '400-600 mm',
    durationDays: 85,
    durationText: '80 - 95 days',
    costPerAcre: 29000,
    expectedYield: '180 - 240 quintals/acre',
    yieldPerAcreNum: 200,
    unitPrice: 750,
    netProfitPerAcre: 121000,
    roi: '317%',
    risk: 'Moderate',
    suitabilityReason: 'Warm sunshine and porous sandy-loams promote high brix sugar accumulation and rapid harvest turnaround.',
    npkSchedule: '100 kg N : 60 kg P2O5 : 80 kg K2O. Drip fertigation with water-soluble 19:19:19 and 0:0:50.',
    irrigationCritical: 'Flowering and Fruit enlargement stages; reduce watering 1 week before harvest to enhance sweetness.',
    pestAlert: 'Fruit fly and downy mildew; install methyl eugenol pheromone traps (6/acre).',
    companion: 'Intercropping is not recommended due to vine sprawling; practice rotational green manuring.',
  },
  {
    id: 'potato',
    name: 'Potato',
    localName: 'ಆಲೂಗಡ್ಡೆ / आलू',
    icon: '🥔',
    category: 'Vegetables',
    soils: ['Loamy', 'Alluvial', 'Sandy'],
    seasons: ['Rabi (Winter)'],
    waterReq: 'Adequate / Irrigated',
    minRainfall: '450-600 mm',
    durationDays: 95,
    durationText: '90 - 105 days',
    costPerAcre: 36000,
    expectedYield: '90 - 130 quintals/acre',
    yieldPerAcreNum: 110,
    unitPrice: 1100,
    netProfitPerAcre: 85000,
    roi: '136%',
    risk: 'Moderate',
    suitabilityReason: 'Cool-season tuber crop requiring loose, well-drained, aerated soils for rapid stolon and tuber development.',
    npkSchedule: '150 kg N : 100 kg P2O5 : 120 kg K2O. Full P & K and half N as basal, half N at earthing-up (30 DAS).',
    irrigationCritical: 'Stolon formation (20-25 DAS) and Tuber bulking (45-65 DAS). Avoid water stress during tuber initiation.',
    pestAlert: 'Late blight and aphid vectors; apply preventive Mancozeb or metalaxyl during foggy cool weather.',
    companion: 'Mustard border or Maize windbreak; excellent rotational crop after Kharif green manure.',
  }
];

function CropPlanner() {
  const { profile, crops, setCrops, tasks, setTasks } = useFarm();
  const navigate = useNavigate();
  const token = localStorage.getItem(CHAT_TOKEN_KEY) || '';

  // Mode tab: 'image-analyzer' | 'crop-planner'
  const [activeTab, setActiveTab] = useState('image-analyzer');

  // Image Analyzer state
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [cropName, setCropName] = useState('');
  const [observations, setObservations] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [imgError, setImgError] = useState('');
  const [diagnosis, setDiagnosis] = useState(null);
  const [supportedCropInfo, setSupportedCropInfo] = useState({ crops: [], modelLoaded: true, message: '' });

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/crop-doctor/supported-crops', { signal: controller.signal })
      .then(async (res) => {
        const body = await res.json().catch(() => ({}));
        if (res.ok && !controller.signal.aborted) setSupportedCropInfo(body);
      })
      .catch(() => {});
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!previewUrl) return undefined;
    return () => URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const chooseImage = (selectedFile) => {
    setImgError('');
    if (!selectedFile) return;
    const supportedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!supportedTypes.includes(selectedFile.type)) {
      setFile(null);
      setPreviewUrl('');
      return setImgError('Please choose a JPG, PNG, or WEBP image.');
    }
    if (selectedFile.size > 5 * 1024 * 1024) {
      setFile(null);
      setPreviewUrl('');
      return setImgError('Image size must be smaller than 5 MB.');
    }
    setPreviewUrl(URL.createObjectURL(selectedFile));
    setFile(selectedFile);
    setDiagnosis(null);
  };

  const submitImage = async (event) => {
    event?.preventDefault();
    if (!file) return setImgError('Take or choose a plant leaf image first.');
    setLoading(true);
    setProgress(0);
    setImgError('');
    try {
      const result = await uploadCropImage({ token, file, cropName, observations, onProgress: setProgress });
      setDiagnosis({ ...result, previewUrl });
      showToast(`Analysis complete: ${result.plantName} — ${result.diseaseName}`);
    } catch (requestError) {
      setImgError(requestError.message || 'Analysis failed. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  // Normalize initial soil from profile
  const initialSoil = profile?.soil
    ? (profile.soil.toLowerCase().includes('black') ? 'Black'
      : profile.soil.toLowerCase().includes('red') ? 'Red'
      : profile.soil.toLowerCase().includes('clay') ? 'Clay'
      : profile.soil.toLowerCase().includes('sand') ? 'Sandy'
      : profile.soil.toLowerCase().includes('alluv') ? 'Alluvial'
      : profile.soil.toLowerCase().includes('later') ? 'Laterite'
      : 'Loamy')
    : 'Loamy';

  // Current Season based on month:
  // June-Oct: Kharif, Nov-Feb: Rabi, Mar-May: Zaid
  const currentMonth = new Date().getMonth();
  const defaultSeason = (currentMonth >= 5 && currentMonth <= 9)
    ? 'Kharif (Monsoon/Summer)'
    : (currentMonth >= 10 || currentMonth <= 1)
      ? 'Rabi (Winter)'
      : 'Zaid (Summer)';

  const [soil, setSoil] = useState(initialSoil);
  const [season, setSeason] = useState(defaultSeason);
  const [water, setWater] = useState(profile?.water || 'Adequate / Irrigated');
  const [irrigation, setIrrigation] = useState(profile?.irrigation || 'Drip / Sprinkler');
  const [landArea, setLandArea] = useState(profile?.landSize ? Number(profile.landSize) : 3);
  const [budgetPerAcre, setBudgetPerAcre] = useState(profile?.budget ? Math.round(Number(profile.budget) / (profile.landSize || 1)) : 35000);
  const [priority, setPriority] = useState('profit'); // 'profit' | 'balanced' | 'drought' | 'duration'
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCrop, setSelectedCrop] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  // Multi-Factor Agronomic Recommendation Engine
  const analyzedCrops = useMemo(() => {
    return CROP_CATALOG.map((crop) => {
      // 1. Soil Match (Weight: 35%)
      const isSoilPrimary = crop.soils.some((s) => s.toLowerCase() === soil.toLowerCase());
      const soilScore = isSoilPrimary ? 100 : (crop.soils.includes('Loamy') ? 70 : 40);

      // 2. Season Match (Weight: 25%)
      const isSeasonMatch = crop.seasons.some((s) => s.toLowerCase().startsWith(season.slice(0, 4).toLowerCase()) || s === 'Year-round');
      const seasonScore = isSeasonMatch ? 100 : 35;

      // 3. Water & Irrigation Match (Weight: 25%)
      let waterScore = 80;
      if (water.includes('Scarce') || water.includes('Dryland')) {
        if (crop.waterReq.includes('Scarce')) waterScore = 100;
        else if (crop.waterReq.includes('Moderate')) waterScore = 60;
        else waterScore = 20; // High water crop in scarce conditions
      } else if (water.includes('Adequate') || water.includes('Irrigated')) {
        waterScore = 100; // Can grow anything with water
      } else {
        // Moderate
        if (crop.waterReq.includes('Moderate') || crop.waterReq.includes('Scarce')) waterScore = 100;
        else waterScore = 65;
      }

      // 4. Budget & Priority Match (Weight: 15%)
      const budgetRatio = budgetPerAcre / crop.costPerAcre;
      let budgetScore = budgetRatio >= 1 ? 100 : Math.max(30, Math.round(budgetRatio * 100));

      // Weighted Base Score
      let baseScore = Math.round(soilScore * 0.35 + seasonScore * 0.25 + waterScore * 0.25 + budgetScore * 0.15);

      // Apply Priority Boosts
      if (priority === 'profit') {
        if (crop.netProfitPerAcre >= 60000) baseScore += 6;
      } else if (priority === 'drought') {
        if (crop.waterReq.includes('Scarce')) baseScore += 8;
      } else if (priority === 'duration') {
        if (crop.durationDays <= 100) baseScore += 8;
      } else if (priority === 'balanced') {
        if (crop.risk === 'Low' || crop.risk === 'Very Low') baseScore += 6;
      }

      const finalScore = Math.min(99, Math.max(35, baseScore));

      // Determine Fit Tier
      let tier = 'moderate';
      let tierLabel = 'Moderate / Conditional';
      let tierColor = '#f59e0b';
      if (finalScore >= 85) {
        tier = 'excellent';
        tierLabel = 'Top Recommended';
        tierColor = '#22c55e';
      } else if (finalScore >= 70) {
        tier = 'good';
        tierLabel = 'Good Fit';
        tierColor = '#3b82f6';
      }

      return {
        ...crop,
        score: finalScore,
        tier,
        tierLabel,
        tierColor,
        isSoilPrimary,
        isSeasonMatch,
        totalFarmCost: crop.costPerAcre * landArea,
        totalFarmRevenue: Math.round(crop.yieldPerAcreNum * crop.unitPrice * landArea),
        totalFarmNetProfit: crop.netProfitPerAcre * landArea,
      };
    })
    .filter((crop) => {
      const matchCat = selectedCategory === 'All' || crop.category === selectedCategory;
      const matchSearch = !searchQuery.trim() ||
        crop.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        crop.localName.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    })
    .sort((a, b) => b.score - a.score);
  }, [soil, season, water, irrigation, landArea, budgetPerAcre, priority, selectedCategory, searchQuery]);

  // Action: Add crop to active farm tracker
  const handleAddToFarm = (crop) => {
    const newCrop = {
      id: crypto.randomUUID(),
      name: crop.name.split(' (')[0],
      field: `${soil} Field Plot`,
      area: Number(landArea),
      sowingDate: dateToday(),
      expectedHarvest: new Date(Date.now() + crop.durationDays * 86400000).toISOString().slice(0, 10),
      variety: 'Recommended high-yield variety',
      irrigation: irrigation,
      stageIndex: 0, // Sowing stage
      health: 'Healthy',
    };
    setCrops((existing) => [...existing, newCrop]);
    showToast(`✓ Added ${newCrop.name} to your active crop tracker!`);
  };

  // Action: Add calendar planning tasks
  const handleAddTasks = (crop) => {
    const prepTask = {
      id: crypto.randomUUID(),
      title: `Prepare soil & basal fertilizer for ${crop.name.split(' (')[0]}`,
      date: dateToday(),
      done: false,
      crop: crop.name.split(' (')[0],
    };
    const sowTask = {
      id: crypto.randomUUID(),
      title: `Sow certified seeds of ${crop.name.split(' (')[0]}`,
      date: new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10),
      done: false,
      crop: crop.name.split(' (')[0],
    };
    setTasks((existing) => [prepTask, sowTask, ...existing]);
    showToast(`✓ Added 2 seasonal planning tasks to Farm Calendar!`);
  };

  const topMatch = analyzedCrops[0];

  return (
    <div className="m-page m-crop-analyzer-page">
      <Heading
        eyebrow="AI Crop Analyzer & Health Diagnosis"
        title="AI Plant Leaf Diagnosis & Crop Suitability"
        detail="Scan crop and leaf photographs for instant disease identification and verified organic management, or plan high-yield seasonal crop rotations for your farm."
      />

      {toastMessage && (
        <div className="m-analyzer-toast" role="status">
          {toastMessage}
        </div>
      )}

      {/* Mode Switcher Tabs */}
      <div className="m-analyzer-tabs">
        <button
          type="button"
          className={`m-analyzer-tab-btn ${activeTab === 'image-analyzer' ? 'active' : ''}`}
          onClick={() => setActiveTab('image-analyzer')}
        >
          <span className="m-tab-icon">📷</span>
          <div>
            <b>AI Plant & Crop Photo Diagnosis</b>
            <small>Detect leaf diseases, visual symptoms & organic remedies from photo</small>
          </div>
        </button>
        <button
          type="button"
          className={`m-analyzer-tab-btn ${activeTab === 'crop-planner' ? 'active' : ''}`}
          onClick={() => setActiveTab('crop-planner')}
        >
          <span className="m-tab-icon">🌾</span>
          <div>
            <b>Seasonal Crop Planner & Economics</b>
            <small>18-crop suitability engine based on soil, water & profit margin</small>
          </div>
        </button>
      </div>

      {activeTab === 'image-analyzer' && (
        <>
          <Card>
            <div className="m-section-title">
              <div>
                <span className="m-eyebrow">Visual Neural Screening</span>
                <h2>Upload or Capture Plant / Leaf Photo</h2>
              </div>
              <span className="m-analyzer-model-badge">
                🟢 MobileNetV2 Neural Model Active (38 Classes)
              </span>
            </div>

            <form className="m-doctor-form" onSubmit={submitImage}>
              <div className="m-doctor-upload">
                {previewUrl ? (
                  <img src={previewUrl} alt="Selected plant preview" />
                ) : (
                  <div className="m-doctor-placeholder">
                    <span>🌱</span>
                    <b>Capture or upload an affected leaf or plant photograph</b>
                    <small>For highest accuracy: Take a clear, close, well-lit photo showing both leaf spots and margins in natural daylight.</small>
                  </div>
                )}
                <div className="m-doctor-upload-actions">
                  <label className="m-button primary">
                    <span>📁 Choose Image</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(e) => chooseImage(e.target.files?.[0])}
                    />
                  </label>
                  <label className="m-button light">
                    <span>📷 Take Photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={(e) => chooseImage(e.target.files?.[0])}
                    />
                  </label>
                  {file && (
                    <button
                      type="button"
                      className="m-plain-action"
                      onClick={() => {
                        setFile(null);
                        setPreviewUrl('');
                        setDiagnosis(null);
                      }}
                    >
                      ✕ Remove Photo
                    </button>
                  )}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
                <label>
                  <span style={{ display: 'block', marginBottom: '6px', fontWeight: 600, fontSize: '0.9rem' }}>
                    Crop Type (Optional)
                  </span>
                  <select value={cropName} onChange={(e) => setCropName(e.target.value)}>
                    <option value="">Auto-detect from image</option>
                    {supportedCropInfo.crops?.map((c) => (
                      <option key={c.crop} value={c.crop}>
                        {c.crop}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  <span style={{ display: 'block', marginBottom: '6px', fontWeight: 600, fontSize: '0.9rem' }}>
                    Field Observation / Note (Optional)
                  </span>
                  <input
                    type="text"
                    value={observations}
                    maxLength={800}
                    placeholder="e.g. Yellowing concentric rings on lower leaves"
                    onChange={(e) => setObservations(e.target.value)}
                  />
                </label>
              </div>

              {imgError && <p className="m-error" role="alert">{imgError}</p>}

              {loading && (
                <div className="m-doctor-progress">
                  <div>
                    <span>Analyzing plant visual patterns...</span>
                    <span>{progress}%</span>
                  </div>
                  <progress value={progress} max="100" />
                  <small>Passing through MobileNetV2 38-class PlantVillage neural network and agronomic knowledge base.</small>
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <button
                  type="submit"
                  className="m-button primary"
                  disabled={loading || !file}
                >
                  {loading ? 'Analyzing Plant Photo...' : '🔍 Analyze Crop Photo'}
                </button>
                {diagnosis && (
                  <button
                    type="button"
                    className="m-button light"
                    onClick={() => {
                      setFile(null);
                      setPreviewUrl('');
                      setDiagnosis(null);
                    }}
                  >
                    Scan Another Leaf
                  </button>
                )}
              </div>
            </form>
          </Card>

          {diagnosis && (
            <DiagnosisReport
              diagnosis={diagnosis}
              imageUrl={diagnosis.previewUrl}
              onClose={() => setDiagnosis(null)}
            />
          )}

          <Card>
            <div className="m-section-title">
              <div>
                <span className="m-eyebrow">Best Practices</span>
                <h2>How to Capture Clear Plant Photos for AI Analysis</h2>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
              <div style={{ padding: '12px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--line)' }}>
                <b style={{ color: '#86efac' }}>1. Focus on Clear Symptoms</b>
                <p style={{ fontSize: '0.85rem', color: 'var(--muted)', margin: '4px 0 0' }}>Capture the boundary between diseased and healthy tissue on a single affected leaf.</p>
              </div>
              <div style={{ padding: '12px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--line)' }}>
                <b style={{ color: '#86efac' }}>2. Natural Lighting</b>
                <p style={{ fontSize: '0.85rem', color: 'var(--muted)', margin: '4px 0 0' }}>Take photos in morning daylight; avoid heavy flash reflections or deep shadows.</p>
              </div>
              <div style={{ padding: '12px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--line)' }}>
                <b style={{ color: '#86efac' }}>3. Steady Camera</b>
                <p style={{ fontSize: '0.85rem', color: 'var(--muted)', margin: '4px 0 0' }}>Hold your phone 15–25 cm away from the leaf so veins and spot margins stay crisp and in focus.</p>
              </div>
            </div>
          </Card>
        </>
      )}

      {activeTab === 'crop-planner' && (
        <>
          {/* Farm Conditions Input Panel */}
          <Card className="m-analyzer-input-card">
        <div className="m-section-title">
          <div>
            <span className="m-eyebrow">Input Farm Parameters</span>
            <h2>Field & Environmental Conditions</h2>
          </div>
          <button
            type="button"
            className="m-plain-action"
            onClick={() => {
              setSoil(initialSoil);
              setWater(profile?.water || 'Adequate / Irrigated');
              setIrrigation(profile?.irrigation || 'Drip / Sprinkler');
              setLandArea(profile?.landSize ? Number(profile.landSize) : 3);
              showToast('Reset inputs to your Farm Profile.');
            }}
          >
            ↺ Sync from Profile
          </button>
        </div>

        <div className="m-analyzer-form-grid">
          <label>
            <span>Soil Type</span>
            <select value={soil} onChange={(e) => setSoil(e.target.value)}>
              <option value="Loamy">Loamy soil (Rich & well-drained)</option>
              <option value="Black">Black soil (Regur / Cotton soil)</option>
              <option value="Red">Red soil (Iron-rich & permeable)</option>
              <option value="Alluvial">Alluvial soil (River basin / High fertility)</option>
              <option value="Clay">Clay soil (Heavy water-holding)</option>
              <option value="Sandy">Sandy soil (Light & porous)</option>
              <option value="Laterite">Laterite soil (Acidic & leaching)</option>
            </select>
          </label>

          <label>
            <span>Current / Target Season</span>
            <select value={season} onChange={(e) => setSeason(e.target.value)}>
              <option value="Rabi (Winter)">Rabi (Winter · Oct - Mar)</option>
              <option value="Kharif (Monsoon/Summer)">Kharif (Monsoon · Jun - Oct)</option>
              <option value="Zaid (Summer)">Zaid (Summer · Mar - Jun)</option>
            </select>
          </label>

          <label>
            <span>Water Availability</span>
            <select value={water} onChange={(e) => setWater(e.target.value)}>
              <option value="Adequate / Irrigated">Adequate / Irrigated (Canal/Borewell)</option>
              <option value="Moderate / Rainfed">Moderate / Rainfed (Good rainfall/ponds)</option>
              <option value="Scarce / Dryland">Scarce / Dryland (Low rainfall/no borewell)</option>
            </select>
          </label>

          <label>
            <span>Irrigation Method</span>
            <select value={irrigation} onChange={(e) => setIrrigation(e.target.value)}>
              <option value="Drip / Sprinkler">Drip / Micro-Sprinkler (Precision)</option>
              <option value="Canal / Flood">Canal / Furrow / Flood</option>
              <option value="Rainfed / Tube well">Purely Rainfed / Tube well</option>
            </select>
          </label>

          <label>
            <span>Farm Area (Acres)</span>
            <input
              type="number"
              min="0.25"
              step="0.25"
              value={landArea}
              onChange={(e) => setLandArea(Math.max(0.25, Number(e.target.value) || 1))}
            />
          </label>

          <label>
            <span>Target Budget / Acre (₹)</span>
            <input
              type="number"
              step="5000"
              min="5000"
              max="200000"
              value={budgetPerAcre}
              onChange={(e) => setBudgetPerAcre(Number(e.target.value) || 20000)}
            />
          </label>
        </div>

        <div className="m-analyzer-priority-row">
          <span className="m-field-label">Optimization Priority:</span>
          <div className="m-priority-chips">
            {[
              ['profit', '💰 Highest Net Profit & ROI'],
              ['balanced', '⚖️ Balanced & Low Risk'],
              ['drought', '🏜️ Drought Hardy / Low Water'],
              ['duration', '⚡ Fast Cycle (<100 Days)'],
            ].map(([key, label]) => (
              <button
                type="button"
                key={key}
                className={`m-priority-chip ${priority === key ? 'active' : ''}`}
                onClick={() => setPriority(key)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Summary Highlight Card */}
      {topMatch && (
        <Card className="m-analyzer-hero-card">
          <div className="m-analyzer-hero-badge">🏆 TOP MATCH FOR YOUR FIELD</div>
          <div className="m-analyzer-hero-content">
            <span className="m-analyzer-hero-icon">{topMatch.icon}</span>
            <div className="m-analyzer-hero-info">
              <div className="m-analyzer-hero-title">
                <h3>{topMatch.name}</h3>
                <small>{topMatch.localName}</small>
                <span className="m-analyzer-score-pill" style={{ background: topMatch.tierColor }}>
                  {topMatch.score}% Suitability Score
                </span>
              </div>
              <p>{topMatch.suitabilityReason}</p>
              <div className="m-analyzer-hero-metrics">
                <div>
                  <small>Est. Investment ({landArea} ac)</small>
                  <b>{money(topMatch.totalFarmCost)}</b>
                </div>
                <div>
                  <small>Expected Net Profit</small>
                  <b className="m-profit-text">{money(topMatch.totalFarmNetProfit)}</b>
                </div>
                <div>
                  <small>Duration</small>
                  <b>{topMatch.durationText}</b>
                </div>
                <div>
                  <small>Risk Level</small>
                  <b>{topMatch.risk}</b>
                </div>
              </div>
            </div>
          </div>
          <div className="m-analyzer-hero-actions">
            <Button onClick={() => setSelectedCrop(topMatch)}>
              View Full Agronomic Plan
            </Button>
            <Button variant="light" onClick={() => handleAddToFarm(topMatch)}>
              ＋ Add to My Farm Tracker
            </Button>
            <Button variant="light" onClick={() => handleAddTasks(topMatch)}>
              ▦ Schedule Calendar Tasks
            </Button>
          </div>
        </Card>
      )}

      {/* Filter & Search Bar */}
      <div className="m-analyzer-toolbar">
        <div className="m-analyzer-categories">
          {['All', 'Cereals & Millets', 'Pulses', 'Oilseeds & Cash Crops', 'Vegetables'].map((cat) => (
            <button
              key={cat}
              type="button"
              className={`m-category-pill ${selectedCategory === cat ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
        <div className="m-analyzer-search">
          <span>⌕</span>
          <input
            type="text"
            placeholder="Search crop by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Recommendations Cards Grid */}
      <div className="m-analyzer-grid">
        {analyzedCrops.map((crop, index) => (
          <div key={crop.id} className="m-crop-card">
            <div className="m-crop-card-header">
              <div className="m-crop-card-title">
                <span className="m-crop-card-icon">{crop.icon}</span>
                <div>
                  <h4>{crop.name}</h4>
                  <small>{crop.localName}</small>
                </div>
              </div>
              <div className="m-crop-score-badge" style={{ borderColor: crop.tierColor, color: crop.tierColor }}>
                <b>{crop.score}%</b>
                <small>Match</small>
              </div>
            </div>

            <div className="m-crop-card-bar">
              <div className="m-crop-card-fill" style={{ width: `${crop.score}%`, background: crop.tierColor }} />
            </div>

            <div className="m-crop-card-tags">
              <span className={`m-tag ${crop.tier}`}>{crop.tierLabel}</span>
              <span className="m-tag">{crop.category}</span>
              <span className="m-tag">⏱ {crop.durationText}</span>
            </div>

            <p className="m-crop-card-reason">{crop.suitabilityReason}</p>

            <div className="m-crop-card-stats">
              <div>
                <small>Cost / Acre</small>
                <b>{money(crop.costPerAcre)}</b>
              </div>
              <div>
                <small>Expected Yield</small>
                <b>{crop.expectedYield}</b>
              </div>
              <div>
                <small>Net Profit / Acre</small>
                <b className="m-profit-text">{money(crop.netProfitPerAcre)}</b>
              </div>
              <div>
                <small>Estimated ROI</small>
                <b>{crop.roi}</b>
              </div>
            </div>

            <div className="m-crop-card-footer">
              <button
                type="button"
                className="m-button light"
                onClick={() => setSelectedCrop(crop)}
              >
                Inspect Details →
              </button>
              <button
                type="button"
                className="m-button primary"
                onClick={() => handleAddToFarm(crop)}
                title="Add directly to your active crop tracker"
              >
                ＋ Add Crop
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Scientific Crop Rotation Advisory */}
      <Card className="m-rotation-advisory-card">
        <div className="m-section-title">
          <div>
            <span className="m-eyebrow">Scientific Soil Health Guide</span>
            <h2>Recommended Crop Rotation & Soil Conservation</h2>
          </div>
        </div>
        <div className="m-rotation-grid">
          <div className="m-rotation-item">
            <span className="m-rotation-icon">🔄</span>
            <div>
              <b>Cereal - Legume Rotation</b>
              <p>Following heavy nutrient feeders like Maize, Wheat, or Paddy with nitrogen-fixing pulses (Chickpea, Green Gram, or Pigeon pea) restores 30-40 kg natural atmospheric nitrogen per hectare and reduces synthetic urea dependence.</p>
            </div>
          </div>
          <div className="m-rotation-item">
            <span className="m-rotation-icon">🛡️</span>
            <div>
              <b>Disease Cycle Disruption</b>
              <p>Never plant tomatoes, chillies, or potatoes consecutively on the same plot. Rotating with non-solanaceous crops (Millets, Maize, or Pulses) breaks soil-borne wilt, nematodes, and fungal spore cycles.</p>
            </div>
          </div>
          <div className="m-rotation-item">
            <span className="m-rotation-icon">💧</span>
            <div>
              <b>Drought & Moisture Management</b>
              <p>In low rainfall or dryland situations, intercropping Sorghum or Pearl Millet with deep-rooted Pigeon pea provides drought insurance, soil moisture canopy cover, and dual revenue streams.</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Detailed Crop Modal Drawer */}
      {selectedCrop && (
        <div className="m-crop-modal-backdrop" onClick={() => setSelectedCrop(null)}>
          <div className="m-crop-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="m-crop-modal-header">
              <div className="m-crop-modal-title">
                <span className="m-crop-modal-icon">{selectedCrop.icon}</span>
                <div>
                  <h2>{selectedCrop.name}</h2>
                  <p>{selectedCrop.localName} · {selectedCrop.category}</p>
                </div>
              </div>
              <button
                type="button"
                className="m-crop-modal-close"
                onClick={() => setSelectedCrop(null)}
              >
                ✕
              </button>
            </div>

            <div className="m-crop-modal-body">
              {/* Financial Projections Table */}
              <div className="m-modal-section">
                <h3>💰 Economic Projections for Your Farm ({landArea} Acres)</h3>
                <div className="m-economic-table">
                  <div className="m-econ-row header">
                    <span>Metric</span>
                    <span>Per Single Acre</span>
                    <span>Total for Your Land ({landArea} ac)</span>
                  </div>
                  <div className="m-econ-row">
                    <span>Estimated Cultivation Investment</span>
                    <b>{money(selectedCrop.costPerAcre)}</b>
                    <b>{money(selectedCrop.totalFarmCost)}</b>
                  </div>
                  <div className="m-econ-row">
                    <span>Expected Market Yield</span>
                    <b>{selectedCrop.expectedYield}</b>
                    <b>{(selectedCrop.yieldPerAcreNum * landArea).toFixed(1)} quintals</b>
                  </div>
                  <div className="m-econ-row">
                    <span>Est. Market Gross Revenue</span>
                    <b>{money(selectedCrop.yieldPerAcreNum * selectedCrop.unitPrice)}</b>
                    <b>{money(selectedCrop.totalFarmRevenue)}</b>
                  </div>
                  <div className="m-econ-row highlight">
                    <span>Net Profit Margin (Est.)</span>
                    <b className="m-profit-text">{money(selectedCrop.netProfitPerAcre)}</b>
                    <b className="m-profit-text">{money(selectedCrop.totalFarmNetProfit)}</b>
                  </div>
                </div>
              </div>

              {/* Agronomic Recommendations Grid */}
              <div className="m-modal-section-grid">
                <div className="m-modal-info-box">
                  <h4>🧪 NPK Nutrient & Fertilizer Schedule</h4>
                  <p>{selectedCrop.npkSchedule}</p>
                </div>

                <div className="m-modal-info-box">
                  <h4>💧 Critical Irrigation Stages</h4>
                  <p>{selectedCrop.irrigationCritical}</p>
                </div>

                <div className="m-modal-info-box">
                  <h4>🐛 Seasonal Pest & Disease Watch</h4>
                  <p>{selectedCrop.pestAlert}</p>
                </div>

                <div className="m-modal-info-box">
                  <h4>🌿 Companion & Intercropping Advice</h4>
                  <p>{selectedCrop.companion}</p>
                </div>
              </div>
            </div>

            <div className="m-crop-modal-footer">
              <Button
                variant="light"
                onClick={() => {
                  window.print();
                }}
              >
                ⎙ Print Agronomic Plan
              </Button>
              <Button
                variant="light"
                onClick={() => {
                  handleAddTasks(selectedCrop);
                  setSelectedCrop(null);
                }}
              >
                ▦ Add to Calendar Tasks
              </Button>
              <Button
                onClick={() => {
                  handleAddToFarm(selectedCrop);
                  setSelectedCrop(null);
                  navigate('/crop-growth');
                }}
              >
                ＋ Add to My Farm Tracker & View
              </Button>
            </div>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
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
  const [location, setLocation] = useState(profile?.village || profile?.district || '')
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
    <div className="m-stat-grid"><Stat label="Total in period" value={visible.length ? money(total) : 'No records'} /><Stat label="Records" value={visible.length} /><label className="m-filter">Show<select value={period} onChange={(e) => setPeriod(e.target.value)}><option value="all">All time</option><option value="week">Last 7 days</option><option value="month">Last 30 days</option></select></label></div>
    <Card><h2>{editing ? 'Edit expense' : 'Add expense'}</h2><form className="m-form m-expense-form" onSubmit={submit}><label>Category<select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>{categories.map((category) => <option key={category}>{category}</option>)}</select></label><label>Crop (optional)<select value={form.crop} onChange={(e) => setForm({ ...form, crop: e.target.value })}><option value="">Not linked</option>{crops.map((crop) => <option key={crop.id}>{crop.name}</option>)}</select></label><label>Date<input type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></label><label>Amount (₹)<input type="number" min="0.01" step="0.01" required value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></label><label className="m-wide-field">Notes<input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></label><div className="m-form-footer">{message && <span role="status">{message}</span>}<Button type="submit">{editing ? 'Save changes' : t('Add expense', language)}</Button>{editing && <Button variant="light" type="button" onClick={() => { setEditing(null); setForm({ category: 'Seeds', crop: '', date: dateToday(), amount: '', notes: '' }) }}>Cancel</Button>}</div></form></Card>
    {categoryTotals.length > 0 && <Card><h2>Category breakdown</h2><div className="m-breakdown">{categoryTotals.map((item) => <div key={item.category}><span>{item.category}</span><div className="m-progress"><span style={{ width: `${percent(item.amount, total)}%` }} /></div><b>{money(item.amount)}</b></div>)}</div></Card>}
    <Card><h2>Expense records</h2>{visible.length ? <div className="m-table">{visible.map((item) => <div className="m-expense-row" key={item.id}><div><b>{item.category}</b><small>{item.date} · {item.crop || 'Unlinked crop'}{item.notes ? ` · ${item.notes}` : ''}</small></div><strong>{money(item.amount)}</strong><button type="button" onClick={() => edit(item)}>Edit</button><button type="button" className="m-delete" onClick={() => setExpenses((all) => all.filter((entry) => entry.id !== item.id))}>Delete</button></div>)}</div> : <EmptyState title="No expenses in this period" detail="Add a record above when you make a farm purchase." />}</Card>
  </div>
}

function BudgetPage() {
  const { profile, expenses, crops } = useFarm()
  const spent = expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0)
  const budgetRecorded = profile?.budget != null
  const budget = budgetRecorded ? Number(profile.budget) : 0
  const canCalculateRemaining = budgetRecorded && expenses.length > 0
  return <div className="m-page"><Heading eyebrow="Budget" title="Season spending overview" detail="This summary uses your registered budget and recorded expenses; it does not forecast crop profit." /><div className="m-stat-grid"><Stat label="Budget recorded" value={budgetRecorded ? money(budget) : 'Not recorded'} /><Stat label="Expenses recorded" value={expenses.length ? money(spent) : 'No records'} /><Stat label="Budget remaining" value={canCalculateRemaining ? money(Math.max(0, budget - spent)) : 'Not available'} /></div><Card><h2>Budget progress</h2><div className="m-progress"><span style={{ width: `${budgetRecorded && expenses.length ? percent(spent, budget) : 0}%` }} /></div><p className="m-muted">{!budgetRecorded ? 'Add a budget in your profile to view progress.' : !expenses.length ? 'Add expense records before calculating a remaining budget.' : `${percent(spent, budget)}% of recorded budget spent`}</p><p>{crops.length} crop records · {expenses.length} expense records</p></Card></div>
}

function DiseasePage() {
  const { crops } = useFarm()
  const token = localStorage.getItem(CHAT_TOKEN_KEY) || ''
  const [supportedCropInfo, setSupportedCropInfo] = useState({ crops: [], modelLoaded: false, message: 'Checking model status…' })
  const [cropName, setCropName] = useState('')
  const [observations, setObservations] = useState('')
  const [file, setFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [diagnoses, setDiagnoses] = useState([])
  const [selectedDiagnosis, setSelectedDiagnosis] = useState(null)
  const [reportImage, setReportImage] = useState('')
  const [historyStatus, setHistoryStatus] = useState(token ? 'loading' : 'signed-out')
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')
  const [historyError, setHistoryError] = useState('')
  const [cropFilter, setCropFilter] = useState('')
  const [dateFilter, setDateFilter] = useState('')

  const refreshHistory = useCallback(async (signal) => {
    if (!token) return
    try {
      const response = await fetch('/api/crop-doctor/history', { headers: { Authorization: `Bearer ${token}` }, signal })
      const body = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(body.error || `Could not load diagnosis history (${response.status}).`)
      setDiagnoses(body.diagnoses)
      setHistoryError('')
      setHistoryStatus('ready')
    } catch (requestError) {
      if (signal?.aborted) return
      setHistoryError(requestError.message || 'Could not load diagnosis history. Check your connection.')
      setHistoryStatus('error')
    }
  }, [token])

  useEffect(() => {
    const controller = new AbortController()
    fetch('/api/crop-doctor/supported-crops', { signal: controller.signal })
      .then(async (response) => {
        const body = await response.json().catch(() => ({}))
        if (!response.ok) throw new Error(body.error || 'Could not load supported crops.')
        if (!controller.signal.aborted) setSupportedCropInfo(body)
      })
      .catch((requestError) => {
        if (!controller.signal.aborted) {
          setSupportedCropInfo({ crops: [], modelLoaded: false, message: requestError.message || 'AI service is unavailable.' })
        }
      })
    return () => controller.abort()
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
      setSelectedDiagnosis({ ...diagnosis, previewUrl })
      setFile(null)
      if (token) {
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
    <div className="m-section-title">
      <div>
        <span className="m-eyebrow">PlantVillage MobileNetV2 Neural Model · {new Date(diagnosis.createdAt).toLocaleString()}</span>
        <h2>Assessment for {diagnosis.plantName}</h2>
      </div>
      <div style={{ display: 'flex', gap: '8px' }}>
        <button type="button" className="m-button light" style={{ padding: '6px 12px', fontSize: '0.85rem' }} onClick={() => window.print()}>
          🖨️ Print Report
        </button>
        <button type="button" className="m-plain-action" onClick={onClose}>Close</button>
      </div>
    </div>
    <div className="m-doctor-report-main">
      {imageUrl ? <img src={imageUrl} alt={`Saved plant photo for ${diagnosis.plantName}`} /> : <span className="m-doctor-image-placeholder">{imageError || 'Plant Photo'}</span>}
      <div>
        <span className={`m-doctor-severity ${diagnosis.severity}`}>{diagnosis.predictionStatus?.replaceAll('_', ' ') || 'inconclusive'}</span>
        <h3>{diagnosis.diseaseName}</h3>
        <div className="m-confidence-bar-container">
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
            <span>Model Confidence</span>
            <b>{diagnosis.confidence}%</b>
          </div>
          <div className="m-confidence-bar-track">
            <div
              className={`m-confidence-bar-fill ${diagnosis.confidence >= 55 ? 'high' : diagnosis.confidence >= 25 ? 'moderate' : 'low'}`}
              style={{ width: `${Math.min(100, Math.max(12, diagnosis.confidence))}%` }}
            />
          </div>
          <small style={{ color: 'var(--muted)' }}>
            {diagnosis.confidence >= 55 ? 'High confidence pattern match' : diagnosis.confidence >= 25 ? 'Moderate confidence visual pattern match' : 'Visual screening match'}
          </small>
        </div>
        <small>Model v{diagnosis.modelVersion} · PlantVillage 38-class classifier</small>
        {diagnosis.message && <p style={{ margin: '8px 0 0', fontSize: '0.88rem' }}>{diagnosis.message}</p>}
      </div>
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
  const [showMeasurements, setShowMeasurements] = useState(false)
  const [measurements, setMeasurements] = useState({
    ph: '',
    nitrogen: '',
    phosphorus: '',
    potassium: '',
    electricalConductivity: '',
    organicCarbon: '',
    soilMoisture: '',
    soilTemperature: '',
    measurementSource: 'farmer_entered',
  })

  const refreshSoilHistory = useCallback(async (signal) => {
    if (!token) return
    try {
      const response = await fetch('/api/soil/history', { headers: { Authorization: `Bearer ${token}` }, signal })
      const body = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(body.error || `Could not load soil history (${response.status}).`)
      setSoilAnalyses(body.analyses || [])
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
      setError('Choose a valid JPG, PNG, or WEBP soil image.')
      return
    }
    if (selectedFile.size > 5 * 1024 * 1024) {
      setFile(null)
      setPreviewUrl('')
      setError('Choose an image smaller than 5 MB.')
      return
    }
    if (selectedFile.size === 0) {
      setFile(null)
      setPreviewUrl('')
      setError('Selected image file is empty (0 bytes).')
      return
    }
    setFile(selectedFile)
    setPreviewUrl(URL.createObjectURL(selectedFile))
    setAnalysis(null)
    updateAnalysisImage('')
  }

  const submitSoilImage = async (event) => {
    event.preventDefault()
    if (!file) return setError('Take a photo or choose a soil image first.')
    setLoading(true)
    setProgress(0)
    setError('')
    try {
      const result = await uploadSoilImage({
        token,
        file,
        cropName,
        location,
        measurements: showMeasurements ? measurements : {},
        onProgress: setProgress,
      })
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

  const printReport = () => {
    window.print()
  }

  return (
    <div className="m-page">
      <Heading
        eyebrow="AI Soil Vision Analyzer"
        title="Comprehensive Soil Health & Crop Advisory"
        detail="Capture or upload a soil photograph to receive genuine AI visual classification, practical soil improvement strategies, and crop suitability guidance. Scientific testing separates visual matching from laboratory measurements."
      />

      {/* Model Readiness Card */}
      <Card>
        <div className="m-section-title">
          <div>
            <span className="m-eyebrow">MobileNetV2 Soil Classifier</span>
            <h2>Analyze Soil Photograph</h2>
          </div>
          <span className={`m-doctor-severity ${soilStatus.model_loaded ? 'low' : 'high'}`}>
            {soilStatus.model_loaded
              ? `Ready · ${soilStatus.model_name || 'MobileNetV2'} (${soilStatus.class_count || 7} Classes)`
              : 'Model Unavailable'}
          </span>
        </div>

        {!soilStatus.model_loaded && (
          <p className="m-error" role="status">
            {soilStatus.message || 'Trained soil model not loaded. Check ai-service/models/soil/.'}
          </p>
        )}

        <form className="m-doctor-form" onSubmit={submitSoilImage}>
          <div className="m-doctor-upload">
            {previewUrl ? (
              <img src={previewUrl} alt="Selected soil sample preview" />
            ) : (
              <div className="m-doctor-placeholder">
                <span>🌱</span>
                <b>Capture or upload a clear soil photograph</b>
                <small>Use JPG, PNG, or WEBP under 5 MB. Ensure natural lighting and bare soil without heavy plant cover.</small>
              </div>
            )}
            <div className="m-doctor-upload-actions">
              <label className="m-button primary">
                📷 Take a photo
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  capture="environment"
                  onChange={(event) => { chooseSoilImage(event.target.files?.[0]); event.target.value = '' }}
                />
              </label>
              <label className="m-button light">
                📁 Upload from gallery
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(event) => { chooseSoilImage(event.target.files?.[0]); event.target.value = '' }}
                />
              </label>
              {file && (
                <>
                  <span className="m-muted">{file.name} · {(file.size / 1024 / 1024).toFixed(2)} MB</span>
                  <button
                    className="m-delete"
                    type="button"
                    onClick={() => { setFile(null); setPreviewUrl(''); setProgress(0) }}
                  >
                    Remove image
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="m-form m-planner-form">
            <label>
              Target crop (optional)
              <select value={cropName} onChange={(event) => setCropName(event.target.value)}>
                <option value="">Not selected</option>
                {crops.map((crop) => (
                  <option key={crop.id} value={crop.name}>
                    {crop.name}{crop.field ? ` · ${crop.field}` : ''}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Village / District location (optional)
              <input
                maxLength="120"
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                placeholder="e.g. Mandya, Karnataka"
              />
            </label>
          </div>

          {/* Optional Scientific Soil Measurements */}
          <button
            type="button"
            className="m-soil-optional-toggle"
            onClick={() => setShowMeasurements(!showMeasurements)}
          >
            <span>🧪 Scientific Soil Test & Sensor Measurements (Optional)</span>
            <span>{showMeasurements ? '▲ Hide' : '▼ Add Lab / Sensor Data'}</span>
          </button>

          {showMeasurements && (
            <div className="m-soil-card-section" style={{ marginBottom: '16px' }}>
              <p className="m-muted" style={{ fontSize: '0.85rem', margin: '0 0 12px' }}>
                If you have an official Soil Health Card or local sensor reading, enter them here. These are saved and presented separately from AI visual predictions.
              </p>
              <div className="m-form m-planner-form" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))' }}>
                <label>
                  Data Source
                  <select
                    value={measurements.measurementSource}
                    onChange={(e) => setMeasurements({ ...measurements, measurementSource: e.target.value })}
                  >
                    <option value="farmer_entered">Farmer-entered</option>
                    <option value="laboratory_report">Laboratory Report</option>
                    <option value="sensor">Field Sensor</option>
                  </select>
                </label>
                <label>
                  Soil pH (0 - 14)
                  <input
                    placeholder="e.g. 6.8"
                    value={measurements.ph}
                    onChange={(e) => setMeasurements({ ...measurements, ph: e.target.value })}
                  />
                </label>
                <label>
                  Nitrogen (N, kg/ha)
                  <input
                    placeholder="e.g. 240"
                    value={measurements.nitrogen}
                    onChange={(e) => setMeasurements({ ...measurements, nitrogen: e.target.value })}
                  />
                </label>
                <label>
                  Phosphorus (P, kg/ha)
                  <input
                    placeholder="e.g. 18"
                    value={measurements.phosphorus}
                    onChange={(e) => setMeasurements({ ...measurements, phosphorus: e.target.value })}
                  />
                </label>
                <label>
                  Potassium (K, kg/ha)
                  <input
                    placeholder="e.g. 280"
                    value={measurements.potassium}
                    onChange={(e) => setMeasurements({ ...measurements, potassium: e.target.value })}
                  />
                </label>
                <label>
                  Electrical Cond. (dS/m)
                  <input
                    placeholder="e.g. 0.45"
                    value={measurements.electricalConductivity}
                    onChange={(e) => setMeasurements({ ...measurements, electricalConductivity: e.target.value })}
                  />
                </label>
                <label>
                  Organic Carbon (%)
                  <input
                    placeholder="e.g. 0.55"
                    value={measurements.organicCarbon}
                    onChange={(e) => setMeasurements({ ...measurements, organicCarbon: e.target.value })}
                  />
                </label>
                <label>
                  Soil Moisture (%)
                  <input
                    placeholder="e.g. 22"
                    value={measurements.soilMoisture}
                    onChange={(e) => setMeasurements({ ...measurements, soilMoisture: e.target.value })}
                  />
                </label>
                <label>
                  Soil Temperature (°C)
                  <input
                    placeholder="e.g. 26"
                    value={measurements.soilTemperature}
                    onChange={(e) => setMeasurements({ ...measurements, soilTemperature: e.target.value })}
                  />
                </label>
              </div>
            </div>
          )}

          {loading && (
            <div className="m-doctor-progress" role="status">
              <div>
                <b>{progress < 100 ? 'Uploading soil photograph…' : 'Analyzing with MobileNetV2 soil vision model…'}</b>
                <span>{progress}%</span>
              </div>
              <progress max="100" value={progress} />
              <small>Processing image through FARM-SATHI AI inference engine.</small>
            </div>
          )}

          {error && <p className="m-error" role="alert">{error}</p>}

          <Button type="submit" disabled={!file || loading || !soilStatus.model_loaded}>
            {loading ? 'Analyzing…' : '🔍 Analyze Soil Sample'}
          </Button>
        </form>
      </Card>

      {/* DETAILED SOIL ANALYSIS REPORT */}
      {analysis && (
        <Card className="m-doctor-report">
          <div className="m-soil-report-header">
            <div>
              <span className="m-eyebrow">
                AI Soil Analysis Report · {analysis.createdAt ? new Date(analysis.createdAt).toLocaleString() : 'Just now'}
              </span>
              <h2>{analysis.predicted_class || 'Inconclusive Visual Result'}</h2>
              <div className="m-soil-badge-bar">
                <span className={`m-doctor-severity ${analysis.status === 'possible_detection' ? 'low' : 'unknown'}`}>
                  {analysis.status === 'possible_detection' ? 'Confidently Identified' : 'Inconclusive Match'}
                </span>
                <span className="m-soil-badge">
                  Score: <b>{(analysis.confidence * 100).toFixed(1)}%</b>
                </span>
                <span className="m-soil-badge">
                  Model: {analysis.model_name || 'MobileNetV2'} v{analysis.model_version || '1.0.0'}
                </span>
                {analysis.cropName && <span className="m-soil-badge">Crop: {analysis.cropName}</span>}
                {analysis.location && <span className="m-soil-badge">📍 {analysis.location}</span>}
              </div>
            </div>
            <div className="m-soil-actions">
              <button type="button" className="m-button light" onClick={printReport}>
                🖨️ Print / Save PDF
              </button>
              <button
                type="button"
                className="m-plain-action"
                onClick={() => { setAnalysis(null); updateAnalysisImage('') }}
              >
                ✕ Close
              </button>
            </div>
          </div>

          <div className="m-doctor-report-main">
            {analysisImage ? (
              <img src={analysisImage} alt="Analyzed soil specimen" />
            ) : (
              <span className="m-doctor-image-placeholder">
                {analysis.id ? 'Loading saved soil photograph…' : 'Soil photograph preview'}
              </span>
            )}
            <div>
              <h3>AI Identification Summary</h3>
              <p>{analysis.message}</p>
              {analysis.scientific_testing_note && (
                <p className="m-muted" style={{ fontSize: '0.85rem', lineHeight: '1.45' }}>
                  ℹ️ {analysis.scientific_testing_note}
                </p>
              )}
            </div>
          </div>

          {/* Model Probability Breakdown */}
          {analysis.probabilities && (
            <section style={{ margin: '16px 0' }}>
              <h3>Model Confidence Across Soil Categories</h3>
              <div className="m-soil-probabilities">
                {Object.entries(analysis.probabilities)
                  .sort((a, b) => b[1] - a[1])
                  .map(([label, probability]) => (
                    <div key={label}>
                      <span>{label}</span>
                      <b>{(probability * 100).toFixed(1)}%</b>
                      <progress max="1" value={probability} />
                    </div>
                  ))}
              </div>
            </section>
          )}

          {/* Detailed Report Sections */}
          <div className="m-soil-report-grid">
            {/* Section B: Soil Characteristics */}
            <div className="m-soil-card-section">
              <h3>🔬 Visual Characteristics</h3>
              {analysis.soil_characteristics ? (
                <ul className="m-soil-kv-list">
                  <li><strong>Texture:</strong> <span>{analysis.soil_characteristics.texture}</span></li>
                  <li><strong>Color:</strong> <span>{analysis.soil_characteristics.color}</span></li>
                  <li><strong>Visible Surface Indicators:</strong> <span>{analysis.soil_characteristics.visible_indicators}</span></li>
                  <li><strong>Stones / Gravel:</strong> <span>{analysis.soil_characteristics.stones_gravel}</span></li>
                  <li><strong>Moisture Appearance:</strong> <span>{analysis.soil_characteristics.moisture_appearance}</span></li>
                  <li><strong>Drainage Behavior:</strong> <span>{analysis.soil_characteristics.drainage}</span></li>
                </ul>
              ) : (
                <ul className="m-bullets">
                  {analysis.visual_characteristics?.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
              <p className="m-muted" style={{ fontSize: '0.8rem', marginTop: '10px' }}>
                * A photograph alone cannot determine exact pH, NPK, EC, or organic carbon.
              </p>
            </div>

            {/* Section C: Soil Health Assessment */}
            <div className="m-soil-card-section">
              <h3>🩺 Soil Health Assessment</h3>
              {analysis.soil_health ? (
                <>
                  <p style={{ margin: '0 0 6px', fontWeight: '700', fontSize: '0.9rem', color: '#246739' }}>Observed Strengths:</p>
                  <ul className="m-bullets" style={{ marginBottom: '12px' }}>
                    {analysis.soil_health.strengths?.map((s, i) => <li key={i}>{s}</li>)}
                  </ul>
                  <p style={{ margin: '0 0 6px', fontWeight: '700', fontSize: '0.9rem', color: '#962e25' }}>Inherent Limitations:</p>
                  <ul className="m-bullets" style={{ marginBottom: '12px' }}>
                    {analysis.soil_health.limitations?.map((l, i) => <li key={i}>{l}</li>)}
                  </ul>
                  <p style={{ margin: '0 0 6px', fontWeight: '700', fontSize: '0.9rem', color: '#79550a' }}>Agricultural Concerns:</p>
                  <ul className="m-bullets">
                    {analysis.soil_health.concerns?.map((c, i) => <li key={i}>{c}</li>)}
                  </ul>
                </>
              ) : (
                <p className="m-muted">Visual assessment pending certified laboratory confirmation.</p>
              )}
            </div>

            {/* Section D: Soil Improvement Recommendations */}
            <div className="m-soil-card-section">
              <h3>🌾 Practical Improvement Actions</h3>
              {analysis.recommendations?.length > 0 ? (
                <ul className="m-bullets">
                  {analysis.recommendations.map((rec, i) => (
                    <li key={i}>{rec}</li>
                  ))}
                </ul>
              ) : (
                <ul className="m-bullets">
                  <li>Incorporate 10-12 tonnes/ha of well-decomposed FYM or vermicompost.</li>
                  <li>Practice green manuring with Sesbania (Dhaincha) or Sunnhemp.</li>
                  <li>Adopt drip irrigation or contour mulching to prevent moisture evaporation.</li>
                </ul>
              )}
            </div>

            {/* Section E: Crop Suitability */}
            <div className="m-soil-card-section">
              <h3>🌱 Crop Suitability</h3>
              {analysis.crop_suitability ? (
                <>
                  <p style={{ margin: '0 0 6px', fontWeight: '700', fontSize: '0.9rem' }}>Primary Suitable Crops:</p>
                  <div className="m-soil-chips">
                    {analysis.crop_suitability.primary_crops?.map((c) => (
                      <span key={c} className="m-soil-chip">{c}</span>
                    ))}
                  </div>
                  {analysis.crop_suitability.pulses_oilseeds?.length > 0 && (
                    <>
                      <p style={{ margin: '10px 0 6px', fontWeight: '700', fontSize: '0.9rem' }}>Pulses & Oilseeds:</p>
                      <div className="m-soil-chips">
                        {analysis.crop_suitability.pulses_oilseeds.map((p) => (
                          <span key={p} className="m-soil-chip">{p}</span>
                        ))}
                      </div>
                    </>
                  )}
                  {analysis.crop_suitability.prerequisites && (
                    <p className="m-muted" style={{ fontSize: '0.82rem', marginTop: '10px' }}>
                      <strong>Prerequisites:</strong> {analysis.crop_suitability.prerequisites}
                    </p>
                  )}
                </>
              ) : (
                <p className="m-muted">Final crop selection requires checking local rainfall and lab test results.</p>
              )}
            </div>
          </div>

          {/* Section F: Measured Laboratory & Sensor Data */}
          {analysis.measurements && Object.values(analysis.measurements).some(Boolean) && (
            <div className="m-soil-card-section" style={{ margin: '16px 0' }}>
              <h3>🧪 Scientific Soil Measurements Recorded</h3>
              <p className="m-muted" style={{ fontSize: '0.82rem', margin: '0 0 10px' }}>
                Source: <strong>{analysis.measurements.measurementSource?.replace('_', ' ').toUpperCase()}</strong> · Verified against soil laboratory testing.
              </p>
              <div className="m-soil-measurements-grid">
                {analysis.measurements.ph && (
                  <div className="m-soil-measurement-item">
                    <small>pH Reaction</small>
                    <b>{analysis.measurements.ph}</b>
                  </div>
                )}
                {analysis.measurements.nitrogen && (
                  <div className="m-soil-measurement-item">
                    <small>Available N</small>
                    <b>{analysis.measurements.nitrogen} kg/ha</b>
                  </div>
                )}
                {analysis.measurements.phosphorus && (
                  <div className="m-soil-measurement-item">
                    <small>Available P</small>
                    <b>{analysis.measurements.phosphorus} kg/ha</b>
                  </div>
                )}
                {analysis.measurements.potassium && (
                  <div className="m-soil-measurement-item">
                    <small>Available K</small>
                    <b>{analysis.measurements.potassium} kg/ha</b>
                  </div>
                )}
                {analysis.measurements.electricalConductivity && (
                  <div className="m-soil-measurement-item">
                    <small>Electrical Cond.</small>
                    <b>{analysis.measurements.electricalConductivity} dS/m</b>
                  </div>
                )}
                {analysis.measurements.organicCarbon && (
                  <div className="m-soil-measurement-item">
                    <small>Organic Carbon</small>
                    <b>{analysis.measurements.organicCarbon}%</b>
                  </div>
                )}
                {analysis.measurements.soilMoisture && (
                  <div className="m-soil-measurement-item">
                    <small>Soil Moisture</small>
                    <b>{analysis.measurements.soilMoisture}%</b>
                  </div>
                )}
                {analysis.measurements.soilTemperature && (
                  <div className="m-soil-measurement-item">
                    <small>Soil Temp</small>
                    <b>{analysis.measurements.soilTemperature}°C</b>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Fertilizer Management Guidance */}
          <div className="m-soil-card-section" style={{ margin: '16px 0' }}>
            <h3>💊 Fertilizer Advisory & Soil Testing Principles</h3>
            <ul className="m-bullets">
              {analysis.fertilizer_guidance?.map((f, i) => (
                <li key={i}>{f}</li>
              )) || (
                <li>Never apply exact fertilizer doses from a photo; obtain a certified laboratory Soil Health Card.</li>
              )}
            </ul>
            <p className="m-warning" style={{ marginTop: '12px' }}>
              ⚠️ An image cannot measure exact chemical fertility. Do not purchase or broadcast fertilizers without verified laboratory testing from a certified Krishi Vigyan Kendra (KVK) or government laboratory.
            </p>
          </div>

          {/* Limitations */}
          {analysis.limitations?.length > 0 && (
            <section style={{ margin: '16px 0' }}>
              <h3>Important Model & Scientific Limitations</h3>
              <ul className="m-bullets">
                {analysis.limitations.map((lim, i) => (
                  <li key={i}>{lim}</li>
                ))}
              </ul>
            </section>
          )}
        </Card>
      )}

      {/* ANALYSIS HISTORY CARD */}
      <Card>
        <div className="m-section-title">
          <div>
            <span className="m-eyebrow">{token ? 'Private to your account' : 'Optional account feature'}</span>
            <h2>Saved Soil Analysis History</h2>
          </div>
          {token && (
            <button className="m-plain-action" type="button" onClick={() => refreshSoilHistory()}>
              🔄 Refresh
            </button>
          )}
        </div>

        {!token ? (
          <p className="m-muted">
            Guest analyses are shown on this page and are not saved permanently. Register or log in to keep a permanent soil analysis history.
          </p>
        ) : historyError ? (
          <p className="m-error" role="alert">{historyError}</p>
        ) : null}

        {token && soilAnalyses.length > 0 && (
          <div className="m-doctor-history">
            {soilAnalyses.map((record) => (
              <article key={record.id} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '12px 0' }}>
                <img
                  src={record.imageUrl}
                  alt={record.predicted_class || 'Soil thumbnail'}
                  className="m-soil-history-thumb"
                  onError={(e) => { e.target.style.display = 'none' }}
                />
                <div style={{ flex: 1 }}>
                  <span className={`m-doctor-severity ${record.status === 'possible_detection' ? 'low' : 'unknown'}`}>
                    {record.status?.replaceAll('_', ' ')}
                  </span>
                  <b>{record.predicted_class || 'Inconclusive Result'}</b>
                  <small>
                    {new Date(record.createdAt).toLocaleString()} · Model score: {(record.confidence * 100).toFixed(1)}%
                    {record.cropName ? ` · Crop: ${record.cropName}` : ''}
                    {record.location ? ` · 📍 ${record.location}` : ''}
                  </small>
                </div>
                <button type="button" onClick={() => openSoilRecord(record)}>
                  View Report
                </button>
                <button type="button" className="m-delete" onClick={() => deleteSoilRecord(record)}>
                  Delete
                </button>
              </article>
            ))}
          </div>
        )}

        {token && !soilAnalyses.length && !historyError && (
          <EmptyState
            title="No soil analyses saved yet"
            detail="Your actual soil classification reports and laboratory measurements will be archived here after an image analysis."
          />
        )}
      </Card>

      {/* Practical next steps card */}
      <div className="m-stat-grid">
        <Stat label="Known soil type" value={profile?.soil || 'Not provided'} />
        <Stat label="Water availability" value={profile?.water || 'Not provided'} />
        <Stat label="Irrigation" value={profile?.irrigation || 'Not specified'} />
      </div>

      <Card>
        <h2>Practical Next Steps for Farm Soil Management</h2>
        <ul className="m-bullets">
          <li>Submit a representative composite soil sample (0-15 cm depth) to an authorized soil testing lab.</li>
          <li>Refer to the official Soil Health Card for customized NPK and micronutrient dosage.</li>
          <li>Check root-zone moisture before irrigating to optimize water usage.</li>
          <li>Consult local agriculture extension officers before modifying crop rotation cycles.</li>
        </ul>
        <NavLink className="m-button light" to="/crop-growth">
          Open Crop Records
        </NavLink>
      </Card>

      {crops.length > 0 && (
        <Card>
          <h2>Your Active Crop Context</h2>
          {crops.map((crop) => (
            <CropSummary key={crop.id} crop={crop} />
          ))}
        </Card>
      )}
    </div>
  )
}

function MarketPage() {
  return <div className="m-page"><Heading eyebrow="Mandi prices" title="Find verified market prices" detail="No government market-data API is configured, so sample or stale prices are not displayed." /><Card className="m-live-unavailable"><span className="m-status-dot"></span><div><h2>Live price feed not connected</h2><p>Use the official Agmarknet portal to search reported commodity prices by state, district and market. Always check the market's date and unit before selling.</p><a className="m-button primary" href="https://agmarknet.gov.in/" target="_blank" rel="noreferrer">Open Agmarknet ↗</a></div></Card><Card><h2>Why no prices appear here</h2><p>Government data access requires a configured and validated source. This app does not invent min, max or modal prices, price history, or a “best mandi” result.</p><p className="m-muted">Source: Directorate of Marketing & Inspection, Government of India · Verify freshness on the official portal.</p></Card></div>
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

function uploadCropImage({ token, file, cropName, observations, onProgress }) {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest()
    request.open('POST', token ? '/api/crop-doctor/diagnose' : '/api/crop-doctor/preview')
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
        return reject(new Error('The server returned an invalid response. Please try again.'))
      }
      if (request.status < 200 || request.status >= 300) return reject(new Error(body.error || `Image analysis failed (${request.status}).`))
      onProgress(100)
      return resolve(body.diagnosis)
    }
    request.onerror = () => reject(new Error('Could not reach the server. Check your internet connection and try again.'))
    request.ontimeout = () => reject(new Error('Image analysis timed out. Try again with a smaller or clearer image.'))
    request.onabort = () => reject(new Error('Image upload was cancelled.'))
    const form = new FormData()
    form.append('cropName', cropName.trim())
    form.append('observations', observations.trim())
    form.append('image', file, file.name)
    request.send(form)
  })
}

function uploadSoilImage({ token, file, cropName, location, measurements = {}, onProgress }) {
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
    if (measurements.ph) form.set('ph', measurements.ph)
    if (measurements.nitrogen) form.set('nitrogen', measurements.nitrogen)
    if (measurements.phosphorus) form.set('phosphorus', measurements.phosphorus)
    if (measurements.potassium) form.set('potassium', measurements.potassium)
    if (measurements.electricalConductivity) form.set('electricalConductivity', measurements.electricalConductivity)
    if (measurements.organicCarbon) form.set('organicCarbon', measurements.organicCarbon)
    if (measurements.soilMoisture) form.set('soilMoisture', measurements.soilMoisture)
    if (measurements.soilTemperature) form.set('soilTemperature', measurements.soilTemperature)
    if (measurements.measurementSource) form.set('measurementSource', measurements.measurementSource)
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
  const { profile, crops, tasks, expenses, observations, language } = useFarm()
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
    farmRecordSource: 'farmer-entered browser records; not synced to an account',
    accountName: signedIn ? user.name : null,
    ...(signedIn && savedAnalysisToken === token ? savedAnalysisContext : { recentCropDiagnoses: [], recentSoilAnalyses: [] }),
    weather: 'Not supplied unless fetched for this request. Do not infer current weather.',
    marketPrices: 'Not supplied. Do not invent current prices.',
  }), [profile, crops, observations, expenses, tasks, signedIn, user?.name, savedAnalysisContext, savedAnalysisToken, token])
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
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(signedIn ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ ...(signedIn && targetConversation ? { conversationId: targetConversation } : {}), message: prompt, context: currentContext, language: voiceLanguage.slice(0, 2), history: signedIn ? [] : priorGuestMessages.slice(-20).map(({ role, content }) => ({ role, content })) }),
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
            if (signedIn) {
              targetConversation = data.conversationId
              setConversationId(targetConversation)
            }
          } else if (eventName === 'delta') {
            reply += data.text
            setPendingReply(reply)
          } else if (eventName === 'error') {
            streamError = data.error
          }
        }
        if (done) break
      }
      if (signedIn) {
        await refreshHistory(targetConversation)
      } else {
        setGuestMessages([...priorGuestMessages, userMessage, ...(reply ? [{ id: crypto.randomUUID(), role: 'model', content: reply, created_at: new Date().toISOString() }] : [])])
      }
      if (streamError) throw new Error(streamError)
      setPendingReply('')
    } catch (requestError) {
      setError(requestError.message || 'Chat request failed.')
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
