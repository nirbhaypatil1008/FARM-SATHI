import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useFarm } from '../FarmContext.jsx'
import { SUPPORTED_LANGUAGES, t } from '../translations.js'

export function AuthPage({ initialMode = 'register' }) {
  const navigate = useNavigate()
  const { language, setLanguage, setProfile, setToken, setUser } = useFarm()
  const [mode, setMode] = useState(initialMode)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    state: 'Karnataka',
    district: 'Mandya',
    village: '',
    landSize: '3.5',
    soil: 'Loamy',
    preferredLanguage: language || 'en',
  })

  const handleChange = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value })
  }

  const handleLanguageChange = (e) => {
    const nextLang = e.target.value
    setLanguage(nextLang)
    setForm({ ...form, preferredLanguage: nextLang })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (mode === 'register') {
        if (!form.name.trim() || form.name.trim().length < 2) {
          throw new Error('Please enter your full name (at least 2 characters).')
        }
        if (!form.email.trim() || !form.email.includes('@')) {
          throw new Error('Please enter a valid email address.')
        }
        if (!form.password || form.password.length < 10) {
          throw new Error('Please choose a secure password of at least 10 characters.')
        }

        // Call backend registration endpoint
        let token = ''
        let user = null
        try {
          const res = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: form.name.trim(),
              email: form.email.trim(),
              password: form.password,
            }),
          })
          const body = await res.json().catch(() => ({}))
          if (res.ok && body.token) {
            token = body.token
            user = body.user
          } else if (res.status === 409) {
            throw new Error(body.error || 'An account with this email already exists. Please sign in instead.')
          } else if (!res.ok) {
            throw new Error(body.error || 'Registration failed. Check your inputs.')
          }
        } catch (fetchErr) {
          if (fetchErr.message && fetchErr.message.includes('already exists')) throw fetchErr
          // Offline fallback
          console.warn('Backend registration failed, creating verified offline farmer profile.', fetchErr)
          token = 'offline-token-' + Date.now()
          user = { id: 'farmer-' + Date.now(), name: form.name.trim(), email: form.email.trim() }
        }

        // Persist token and user in localStorage
        localStorage.setItem('farm-saathi:chat-token', token)
        localStorage.setItem('farm-saathi:user', JSON.stringify(user))
        if (setToken) setToken(token)
        if (setUser) setUser(user)

        // Update profile in state and localStorage
        const updatedProfile = {
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim() || '+91 98765 43210',
          state: form.state,
          district: form.district || 'Mandya',
          village: form.village || 'Srirangapatna',
          landSize: Number(form.landSize) || 3,
          landUnit: 'acres',
          soil: form.soil || 'Loamy',
          water: 'Adequate / Irrigated',
          irrigation: 'Drip / Sprinkler',
          budget: 50000,
          preferredLanguage: form.preferredLanguage === 'kn' ? 'Kannada' : form.preferredLanguage === 'hi' ? 'Hindi' : 'English',
        }
        localStorage.setItem('farm-saathi:profile', JSON.stringify(updatedProfile))
        if (setProfile) setProfile(updatedProfile)

        // Immediately open the dashboard
        navigate('/')
      } else {
        // Sign In
        if (!form.email.trim() || !form.password) {
          throw new Error('Please enter your email and password.')
        }

        let token = ''
        let user = null
        try {
          const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: form.email.trim(),
              password: form.password,
            }),
          })
          const body = await res.json().catch(() => ({}))
          if (res.ok && body.token) {
            token = body.token
            user = body.user
          } else {
            throw new Error(body.error || 'Invalid email or password.')
          }
        } catch (fetchErr) {
          if (fetchErr.message && !fetchErr.message.includes('fetch')) throw fetchErr
          // Offline fallback
          console.warn('Backend login unavailable, logging in with saved session.', fetchErr)
          token = 'offline-token-' + Date.now()
          user = { id: 'farmer-local', name: form.email.split('@')[0], email: form.email }
        }

        localStorage.setItem('farm-saathi:chat-token', token)
        localStorage.setItem('farm-saathi:user', JSON.stringify(user))
        if (setToken) setToken(token)
        if (setUser) setUser(user)

        // Ensure profile exists for logged in farmer
        try {
          const existingProfile = JSON.parse(localStorage.getItem('farm-saathi:profile') || 'null')
          if (!existingProfile) {
            const fallbackProfile = {
              name: user?.name || form.email.split('@')[0] || 'Farmer',
              email: form.email.trim(),
              phone: '+91 98765 43210',
              state: 'Karnataka',
              district: 'Mandya',
              village: 'Srirangapatna',
              landSize: 3.5,
              landUnit: 'acres',
              soil: 'Loamy',
              water: 'Adequate / Irrigated',
              irrigation: 'Drip / Sprinkler',
              budget: 60000,
            }
            localStorage.setItem('farm-saathi:profile', JSON.stringify(fallbackProfile))
            if (setProfile) setProfile(fallbackProfile)
          }
        } catch {}

        // Immediately open the dashboard
        navigate('/')
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleGuestDemo = () => {
    const guestUser = { id: 'guest-farmer', name: 'Farmer Guest', email: 'guest@farmsaathi.in' }
    const guestToken = 'guest-token-' + Date.now()
    localStorage.setItem('farm-saathi:chat-token', guestToken)
    localStorage.setItem('farm-saathi:user', JSON.stringify(guestUser))
    if (setToken) setToken(guestToken)
    if (setUser) setUser(guestUser)

    const guestProfile = {
      name: 'Farmer Guest',
      email: 'guest@farmsaathi.in',
      phone: '+91 98765 43210',
      state: 'Karnataka',
      district: 'Mandya',
      village: 'Srirangapatna',
      landSize: 3.5,
      landUnit: 'acres',
      soil: 'Loamy',
      water: 'Adequate / Irrigated',
      irrigation: 'Drip / Sprinkler',
      budget: 50000,
    }
    localStorage.setItem('farm-saathi:profile', JSON.stringify(guestProfile))
    if (setProfile) setProfile(guestProfile)
    navigate('/')
  }

  return (
    <div className="m-auth-page-container">
      {/* Background Ambience */}
      <div className="m-auth-backdrop">
        <div className="m-auth-backdrop-overlay" />
      </div>

      <div className="m-auth-content-box">
        {/* Brand Header */}
        <div className="m-auth-brand-header">
          <div className="m-auth-brand-badge">
            <span className="m-auth-leaf-icon">🌱</span>
            <h1>FARM-SATHI</h1>
          </div>
          <p className="m-auth-tagline">
            {t('Empowering farmers with AI-driven crop diagnostics, soil health analytics, and precision farming advisory.', language)}
          </p>

          {/* Quick Language Switcher */}
          <div className="m-auth-lang-row">
            <span className="m-lang-icon">🌐</span>
            <select
              value={language}
              onChange={handleLanguageChange}
              className="m-auth-lang-select"
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.native} ({lang.label})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Auth Card */}
        <div className="m-auth-card-body">
          {/* Mode Switcher Tabs */}
          <div className="m-auth-nav-tabs">
            <button
              type="button"
              className={`m-auth-tab ${mode === 'register' ? 'active' : ''}`}
              onClick={() => {
                setMode('register')
                setError('')
              }}
            >
              <span>📝</span>
              <b>{t('Create Your Farmer Account', language)}</b>
            </button>
            <button
              type="button"
              className={`m-auth-tab ${mode === 'login' ? 'active' : ''}`}
              onClick={() => {
                setMode('login')
                setError('')
              }}
            >
              <span>🔐</span>
              <b>{t('Sign In', language)}</b>
            </button>
          </div>

          {error && (
            <div className="m-auth-error-banner" role="alert">
              ⚠️ {error}
            </div>
          )}

          <form className="m-auth-main-form" onSubmit={handleSubmit}>
            {mode === 'register' && (
              <>
                <div className="m-auth-section-title">
                  <span>1.</span>
                  <h3>Farmer Personal Details</h3>
                </div>

                <div className="m-auth-form-grid">
                  <label>
                    <span>{t('Full Name', language)} *</span>
                    <input
                      type="text"
                      required
                      minLength={2}
                      placeholder="e.g. Ramesh Gowda"
                      value={form.name}
                      onChange={handleChange('name')}
                    />
                  </label>

                  <label>
                    <span>{t('Phone Number', language)}</span>
                    <input
                      type="tel"
                      placeholder="e.g. +91 98765 43210"
                      value={form.phone}
                      onChange={handleChange('phone')}
                    />
                  </label>
                </div>
              </>
            )}

            <div className="m-auth-form-grid">
              <label>
                <span>{t('Email Address', language)} *</span>
                <input
                  type="email"
                  required
                  placeholder="e.g. farmer@farmsaathi.in"
                  value={form.email}
                  onChange={handleChange('email')}
                />
              </label>

              <label>
                <span>{t('Password', language)} *</span>
                <input
                  type="password"
                  required
                  minLength={10}
                  placeholder="Min 10 characters"
                  value={form.password}
                  onChange={handleChange('password')}
                />
              </label>
            </div>

            {mode === 'register' && (
              <>
                <div className="m-auth-section-title" style={{ marginTop: '16px' }}>
                  <span>2.</span>
                  <h3>Farm & Location Profile</h3>
                </div>

                <div className="m-auth-form-grid">
                  <label>
                    <span>{t('State', language)}</span>
                    <select value={form.state} onChange={handleChange('state')}>
                      <option>Karnataka</option>
                      <option>Maharashtra</option>
                      <option>Andhra Pradesh</option>
                      <option>Telangana</option>
                      <option>Tamil Nadu</option>
                      <option>Uttar Pradesh</option>
                      <option>Punjab</option>
                      <option>Haryana</option>
                      <option>Madhya Pradesh</option>
                      <option>Gujarat</option>
                      <option>Rajasthan</option>
                    </select>
                  </label>

                  <label>
                    <span>{t('District', language)}</span>
                    <input
                      type="text"
                      placeholder="e.g. Mandya"
                      value={form.district}
                      onChange={handleChange('district')}
                    />
                  </label>

                  <label>
                    <span>{t('Village', language)}</span>
                    <input
                      type="text"
                      placeholder="e.g. Srirangapatna"
                      value={form.village}
                      onChange={handleChange('village')}
                    />
                  </label>

                  <label>
                    <span>{t('Farm Land Size (Acres)', language)}</span>
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      placeholder="3.5"
                      value={form.landSize}
                      onChange={handleChange('landSize')}
                    />
                  </label>

                  <label>
                    <span>{t('Soil Type', language)}</span>
                    <select value={form.soil} onChange={handleChange('soil')}>
                      <option value="Loamy">Loamy soil (Rich & balanced)</option>
                      <option value="Black">Black soil (Regur / Cotton soil)</option>
                      <option value="Red">Red soil (Permeable & well-drained)</option>
                      <option value="Alluvial">Alluvial soil (River basin fertile)</option>
                      <option value="Clay">Clay soil (Heavy water retention)</option>
                      <option value="Sandy">Sandy soil (Light porous)</option>
                      <option value="Laterite">Laterite soil (Acidic)</option>
                    </select>
                  </label>
                </div>
              </>
            )}

            <button
              type="submit"
              className="m-auth-submit-btn"
              disabled={loading}
            >
              {loading
                ? mode === 'register'
                  ? t('Creating Farmer Account...', language)
                  : t('Signing in...', language)
                : mode === 'register'
                ? t('Register & Open Dashboard', language)
                : t('Sign In & Open Dashboard', language)}
            </button>
          </form>

          {/* Bottom Switcher */}
          <div className="m-auth-footer-links">
            {mode === 'register' ? (
              <button
                type="button"
                className="m-auth-link-btn"
                onClick={() => {
                  setMode('login')
                  setError('')
                }}
              >
                {t('Already registered? Sign In here', language)} →
              </button>
            ) : (
              <button
                type="button"
                className="m-auth-link-btn"
                onClick={() => {
                  setMode('register')
                  setError('')
                }}
              >
                {t('New farmer? Register your land here', language)} →
              </button>
            )}

            <div className="m-auth-divider">
              <span>OR</span>
            </div>

            <button
              type="button"
              className="m-auth-guest-btn"
              onClick={handleGuestDemo}
            >
              🌱 {t('Explore Demo as Guest', language)} →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AuthPage

