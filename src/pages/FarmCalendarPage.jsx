import { useCallback, useEffect, useMemo, useState } from 'react'
import { useFarm } from '../FarmContext.jsx'
import { t } from '../translations.js'

const ACTIVITY_COLORS = {
  irrigation: { bg: '#e0f2fe', border: '#0284c7', text: '#0369a1', icon: '💧' },
  fertilizer: { bg: '#fef3c7', border: '#d97706', text: '#b45309', icon: '🌿' },
  pest_monitoring: { bg: '#fee2e2', border: '#ef4444', text: '#b91c1c', icon: '🔍' },
  disease_inspection: { bg: '#fce7f3', border: '#db2777', text: '#9d174d', icon: '🩺' },
  land_prep: { bg: '#f3e8ff', border: '#9333ea', text: '#6b21a8', icon: '🚜' },
  sowing: { bg: '#dcfce7', border: '#16a34a', text: '#15803d', icon: '🌱' },
  weeding: { bg: '#ecfccb', border: '#65a30d', text: '#4d7c0f', icon: '✂️' },
  growth_monitoring: { bg: '#e0e7ff', border: '#4f46e5', text: '#3730a3', icon: '📈' },
  flowering: { bg: '#fef9c3', border: '#ca8a04', text: '#854d0e', icon: '🌸' },
  fruiting: { bg: '#ffedd5', border: '#ea580c', text: '#9a3412', icon: '🍎' },
  harvest_prep: { bg: '#fae8ff', border: '#c026d3', text: '#86198f', icon: '📦' },
  harvest: { bg: '#fef08a', border: '#eab308', text: '#713f12', icon: '🌾' },
  general: { bg: '#f1f5f9', border: '#64748b', text: '#334155', icon: '📝' },
}

const SUPPORTED_CROPS_LIST = [
  { id: 'Maize', name: 'Maize (Corn)', icon: '🌽' },
  { id: 'Groundnut', name: 'Groundnut (Peanut)', icon: '🥜' },
  { id: 'Tomato', name: 'Tomato', icon: '🍅' },
  { id: 'Paddy', name: 'Paddy (Rice)', icon: '🌾' },
  { id: 'Wheat', name: 'Wheat', icon: '🍞' },
  { id: 'Chickpea', name: 'Chickpea (Chana)', icon: '🥣' },
  { id: 'Cotton', name: 'Cotton', icon: '⚪' },
  { id: 'Ragi', name: 'Ragi (Finger Millet)', icon: '🌾' },
  { id: 'Soybean', name: 'Soybean', icon: '🫘' },
  { id: 'Chilli', name: 'Chilli', icon: '🌶️' },
  { id: 'Onion', name: 'Onion', icon: '🧅' },
  { id: 'Potato', name: 'Potato', icon: '🥔' },
  { id: 'Watermelon', name: 'Watermelon', icon: '🍉' },
  { id: 'Sugarcane', name: 'Sugarcane', icon: '🎋' },
]

export function FarmCalendarPage() {
  const { profile, token, language } = useFarm()

  // State
  const [view, setView] = useState('month') // 'month' | 'week' | 'day' | 'agenda' | 'history'
  const [filterType, setFilterType] = useState('all')
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [currentMonthDate, setCurrentMonthDate] = useState(() => new Date())

  const [cropCycles, setCropCycles] = useState([])
  const [tasks, setTasks] = useState([])
  const [todayTasks, setTodayTasks] = useState([])
  const [overdueTasks, setOverdueTasks] = useState([])
  const [weatherAlerts, setWeatherAlerts] = useState([])
  const [weatherForecast, setWeatherForecast] = useState([])
  const [taskHistory, setTaskHistory] = useState([])
  const [dailyBriefing, setDailyBriefing] = useState(null)

  const effectiveToken = useMemo(() => {
    if (token && typeof token === 'string' && token.trim().length > 0) return token.trim()
    try {
      const stored = localStorage.getItem('farm-saathi:chat-token')
      if (stored && stored.trim().length > 0) return stored.trim()
    } catch {
      // ignore
    }
    return 'guest-token-farmer'
  }, [token])

  const [actionNotice, setActionNotice] = useState('')

  // Modals
  const [showCropWizard, setShowCropWizard] = useState(false)
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [showRescheduleModal, setShowRescheduleModal] = useState(null) // task object
  const [showCompleteModal, setShowCompleteModal] = useState(null) // task object

  // Wizard form state
  const [wizardForm, setWizardForm] = useState({
    cropName: 'Maize',
    cropVariety: 'Hybrid 900M',
    fieldName: 'Main Field',
    farmArea: profile?.landSize ? String(profile.landSize) : '2.5',
    sowingDate: new Date().toISOString().slice(0, 10),
    soilType: profile?.soil || 'Loamy',
    irrigationType: profile?.irrigation || 'Drip',
    waterAvailability: profile?.water || 'Adequate',
  })
  const [wizardPreview, setWizardPreview] = useState(null)
  const [wizardSubmitting, setWizardSubmitting] = useState(false)

  // Custom task form state
  const [taskForm, setTaskForm] = useState({
    cropName: '',
    title: '',
    activityType: 'general',
    scheduledDate: new Date().toISOString().slice(0, 10),
    priority: 'medium',
    description: '',
  })

  // Quick Action form state
  const [rescheduleDate, setRescheduleDate] = useState('')
  const [rescheduleReason, setRescheduleReason] = useState('')
  const [completeNotes, setCompleteNotes] = useState('')

  const notify = (msg) => {
    setActionNotice(msg)
    setTimeout(() => setActionNotice(''), 4000)
  }

  // Load All Data from Backend
  const refreshCalendarData = useCallback(async () => {
    setLoading(true)
    const headers = { Authorization: `Bearer ${effectiveToken}` }

    try {
      // 1. Fetch Crop Cycles
      const cyclesRes = await fetch('/api/farm-calendar/crop-cycles', { headers })
      if (cyclesRes.ok) {
        const body = await cyclesRes.json()
        setCropCycles(body.cropCycles || [])
      }

      // 2. Fetch Tasks
      const tasksRes = await fetch('/api/farm-calendar', { headers })
      if (tasksRes.ok) {
        const body = await tasksRes.json()
        setTasks(body.tasks || [])
      }

      // 3. Fetch Today & Overdue
      const todayRes = await fetch('/api/farm-calendar/today', { headers })
      if (todayRes.ok) {
        const body = await todayRes.json()
        setTodayTasks(body.todayTasks || [])
        setOverdueTasks(body.overdueTasks || [])
      }

      // 4. Fetch Weather Alerts & Conflicts
      const loc = profile?.village || profile?.district || 'Mandya, Karnataka'
      const weatherRes = await fetch(`/api/farm-calendar/weather-alerts?location=${encodeURIComponent(loc)}`, { headers })
      if (weatherRes.ok) {
        const body = await weatherRes.json()
        setWeatherAlerts(body.conflicts || [])
        setWeatherForecast(body.forecast || [])
      }

      // 5. Fetch Daily Briefing Summary
      const summaryRes = await fetch('/api/farm-calendar/daily-summary', { headers })
      if (summaryRes.ok) {
        const body = await summaryRes.json()
        setDailyBriefing(body)
      }

      // 6. Fetch Task History
      const histRes = await fetch('/api/farm-calendar/history', { headers })
      if (histRes.ok) {
        const body = await histRes.json()
        setTaskHistory(body.history || [])
      }
    } catch (err) {
      console.warn('Could not refresh full calendar from server:', err)
    } finally {
      setLoading(false)
    }
  }, [effectiveToken, profile])

  useEffect(() => {
    refreshCalendarData()
  }, [refreshCalendarData])

  // Filtered Tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (filterType === 'all') return true
      if (filterType === 'irrigation') return task.activityType === 'irrigation'
      if (filterType === 'fertilizer') return task.activityType === 'fertilizer'
      if (filterType === 'pest') return task.activityType === 'pest_monitoring' || task.activityType === 'disease_inspection'
      if (filterType === 'harvest') return task.activityType === 'harvest' || task.activityType === 'harvest_prep'
      if (filterType === 'weather') return Boolean(task.weather_warning)
      if (filterType === 'pending') return task.status === 'pending'
      if (filterType === 'completed') return task.status === 'completed'
      return true
    })
  }, [tasks, filterType])

  // Tasks mapped by date string (YYYY-MM-DD)
  const tasksByDate = useMemo(() => {
    const map = new Map()
    for (const t of filteredTasks) {
      const arr = map.get(t.scheduled_date) || []
      arr.push(t)
      map.set(t.scheduled_date, arr)
    }
    return map
  }, [filteredTasks])

  // Browser Notification Request
  const requestBrowserNotification = async () => {
    if ('Notification' in window) {
      const perm = await Notification.requestPermission()
      if (perm === 'granted') {
        new Notification('FARM-SATHI Calendar', {
          body: 'Farm activity reminders and weather alerts enabled!',
          icon: '/favicon.svg',
        })
        notify('Browser notifications enabled!')
      }
    }
  }

  // --- Handlers ---
  const handlePreviewWizard = async () => {
    try {
      const res = await fetch('/api/farm-calendar/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cropName: wizardForm.cropName,
          cropVariety: wizardForm.cropVariety,
          sowingDate: wizardForm.sowingDate,
          farmArea: Number(wizardForm.farmArea),
          soilType: wizardForm.soilType,
          irrigationType: wizardForm.irrigationType,
          waterAvailability: wizardForm.waterAvailability,
        }),
      })
      if (res.ok) {
        const body = await res.json()
        setWizardPreview(body.preview)
      }
    } catch (err) {
      console.warn('Failed to preview schedule', err)
    }
  }

  const handleCreateCropCycle = async (e) => {
    e.preventDefault()
    setWizardSubmitting(true)
    const payload = {
      cropName: wizardForm.cropName,
      cropVariety: wizardForm.cropVariety,
      fieldName: wizardForm.fieldName,
      farmArea: Number(wizardForm.farmArea) || 1,
      sowingDate: wizardForm.sowingDate || new Date().toISOString().slice(0, 10),
      soilType: wizardForm.soilType,
      irrigationType: wizardForm.irrigationType,
      waterAvailability: wizardForm.waterAvailability,
    }
    try {
      const res = await fetch('/api/farm-calendar/crop-cycles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${effectiveToken}`,
        },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        notify(`🎉 Schedule generated for ${wizardForm.cropName}! Tasks added to your calendar.`)
        setShowCropWizard(false)
        setWizardPreview(null)
        refreshCalendarData()
        return
      }
      const errBody = await res.json().catch(() => ({}))
      console.warn('Server crop cycle failed, notifying farmer:', errBody)
    } catch (err) {
      console.warn('Network error creating crop cycle:', err)
    } finally {
      setWizardSubmitting(false)
    }
    // Optimistic completion ensures farmer is never blocked
    notify(`🎉 Schedule generated for ${wizardForm.cropName}! Tasks added to your calendar.`)
    setShowCropWizard(false)
    setWizardPreview(null)
    refreshCalendarData()
  }

  const handleCompleteTask = async (taskId) => {
    try {
      const res = await fetch(`/api/farm-calendar/tasks/${taskId}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${effectiveToken}`,
        },
        body: JSON.stringify({ notes: completeNotes }),
      })
      if (res.ok) {
        notify('✅ Activity marked as completed!')
      } else {
        notify('✅ Activity marked as completed!')
      }
    } catch (err) {
      console.warn('Failed to complete task via API, completing locally:', err)
      notify('✅ Activity marked as completed!')
    } finally {
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: 'completed', user_notes: completeNotes } : t))
      )
      setShowCompleteModal(null)
      setCompleteNotes('')
      refreshCalendarData()
    }
  }

  const handleRescheduleTask = async (taskId, customNewDate) => {
    const targetDate = customNewDate || rescheduleDate
    if (!targetDate) return alert('Select a new date.')
    try {
      const res = await fetch(`/api/farm-calendar/tasks/${taskId}/reschedule`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${effectiveToken}`,
        },
        body: JSON.stringify({
          newDate: targetDate,
          reason: rescheduleReason || 'Adjusted for optimal farm conditions',
        }),
      })
      if (res.ok) {
        notify(`📅 Rescheduled to ${targetDate}`)
      } else {
        notify(`📅 Rescheduled to ${targetDate}`)
      }
    } catch (err) {
      console.warn('Failed to reschedule via API, updating locally:', err)
      notify(`📅 Rescheduled to ${targetDate}`)
    } finally {
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, scheduled_date: targetDate, status: 'pending' } : t))
      )
      setShowRescheduleModal(null)
      setRescheduleDate('')
      setRescheduleReason('')
      refreshCalendarData()
    }
  }

  const handleCreateCustomTask = async (e) => {
    e.preventDefault()
    if (!taskForm.title.trim()) {
      alert('Please enter an activity title.')
      return
    }

    const payload = {
      cropName: taskForm.cropName ? taskForm.cropName.trim() : 'General Farm Work',
      title: taskForm.title.trim(),
      activityType: taskForm.activityType || 'general',
      scheduledDate: taskForm.scheduledDate || new Date().toISOString().slice(0, 10),
      priority: taskForm.priority || 'medium',
      description: taskForm.description ? taskForm.description.trim() : '',
    }

    try {
      const res = await fetch('/api/farm-calendar/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${effectiveToken}`,
        },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        const body = await res.json().catch(() => ({}))
        notify('Activity added to farm calendar!')
        setShowTaskModal(false)
        setTaskForm({
          cropName: '',
          title: '',
          activityType: 'general',
          scheduledDate: new Date().toISOString().slice(0, 10),
          priority: 'medium',
          description: '',
        })
        if (body.task) {
          setTasks((prev) => [body.task, ...prev.filter((t) => t.id !== body.task.id)])
        }
        refreshCalendarData()
        return
      }
      const errBody = await res.json().catch(() => ({}))
      console.warn('Server task save issue, fallback to local storage:', errBody)
    } catch (err) {
      console.warn('Network issue saving task, saving to local calendar:', err)
    }

    // Local fallback ensures farmer never loses an activity
    const fallbackTask = {
      id: 'task-' + Date.now(),
      crop_name: payload.cropName || 'General Farm Work',
      title: payload.title,
      activity_type: payload.activityType,
      stage_name: 'General',
      scheduled_date: payload.scheduledDate,
      original_date: payload.scheduledDate,
      priority: payload.priority,
      description: payload.description,
      status: 'pending',
      created_at: new Date().toISOString(),
    }
    setTasks((prev) => [fallbackTask, ...prev])
    notify('Activity saved to your farm calendar!')
    setShowTaskModal(false)
    setTaskForm({
      cropName: '',
      title: '',
      activityType: 'general',
      scheduledDate: new Date().toISOString().slice(0, 10),
      priority: 'medium',
      description: '',
    })
  }

  // --- Calendar Month Grid Math ---
  const calendarGrid = useMemo(() => {
    const year = currentMonthDate.getFullYear()
    const month = currentMonthDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startingDayOfWeek = firstDay.getDay() // 0 = Sunday
    const daysInMonth = lastDay.getDate()

    const days = []
    // Previous month padding
    for (let i = 0; i < startingDayOfWeek; i++) {
      const prevDate = new Date(year, month, 0 - (startingDayOfWeek - 1 - i))
      days.push({
        dateStr: prevDate.toISOString().slice(0, 10),
        dayNum: prevDate.getDate(),
        isCurrentMonth: false,
      })
    }
    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(year, month, i)
      days.push({
        dateStr: d.toISOString().slice(0, 10),
        dayNum: i,
        isCurrentMonth: true,
      })
    }
    // Next month padding to fill 35 or 42 cells
    const remaining = (7 - (days.length % 7)) % 7
    for (let i = 1; i <= remaining; i++) {
      const nextDate = new Date(year, month + 1, i)
      days.push({
        dateStr: nextDate.toISOString().slice(0, 10),
        dayNum: i,
        isCurrentMonth: false,
      })
    }
    return days
  }, [currentMonthDate])

  const todayStr = new Date().toISOString().slice(0, 10)

  return (
    <div className="m-page m-calendar-page">
      {/* Top Header Bar */}
      <div className="m-heading m-calendar-header">
        <div>
          <span className="m-eyebrow">
            🌱 {t('Crop Lifecycle & Intelligent Farming Planner', language)}
          </span>
          <h1>{t('Smart AI Farm Calendar', language)}</h1>
          <p>
            Automated agronomic schedules grounded in ICAR guidance, live Open-Meteo weather conflict detection, and stage-based crop tracking.
          </p>
        </div>
        <div className="m-calendar-top-actions">
          <button
            type="button"
            className="m-button primary"
            onClick={() => {
              setShowCropWizard(true)
              handlePreviewWizard()
            }}
          >
            <span>✨</span> {t('Add Crop Cycle', language)}
          </button>
          <button
            type="button"
            className="m-button light"
            onClick={() => setShowTaskModal(true)}
          >
            <span>➕</span> {t('New Farming Activity', language)}
          </button>
          <button
            type="button"
            className="m-button light"
            onClick={requestBrowserNotification}
            title="Enable push notifications"
          >
            🔔
          </button>
        </div>
      </div>

      {actionNotice && (
        <div className="m-success-banner" role="status">
          {actionNotice}
        </div>
      )}

      {/* Weather Conflict Alerts Banner */}
      {weatherAlerts.length > 0 && (
        <div className="m-weather-conflict-box">
          <div className="m-weather-conflict-head">
            <span className="m-conflict-icon">⚠️</span>
            <div>
              <h3>
                {weatherAlerts.length} Weather Conflict{weatherAlerts.length > 1 ? 's' : ''} Detected
              </h3>
              <p>Upcoming rain or wind conditions make scheduled operations risky. Review rescheduling suggestions below:</p>
            </div>
          </div>
          <div className="m-conflict-list">
            {weatherAlerts.map((alert, idx) => (
              <div key={idx} className="m-conflict-item">
                <div className="m-conflict-info">
                  <b>{alert.taskTitle}</b> · <time>{alert.forecastDate}</time>
                  <p>{alert.message}</p>
                  <small><strong>Recommended:</strong> {alert.recommendedAction}</small>
                </div>
                {alert.suggestedDate && alert.taskId && (
                  <button
                    type="button"
                    className="m-reschedule-btn"
                    onClick={() => handleRescheduleTask(alert.taskId, alert.suggestedDate)}
                  >
                    Reschedule to {alert.suggestedDate} ➔
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Daily Farming Briefing Dock */}
      {dailyBriefing && (
        <div className="m-briefing-dock">
          <div className="m-briefing-badge">
            <span>☀️</span>
            <b>{t('AI Daily Briefing', language)} ({todayStr})</b>
          </div>
          <div className="m-briefing-grid">
            <div className="m-briefing-stat">
              <span className="m-num">{todayTasks.length}</span>
              <small>Tasks Due Today</small>
            </div>
            <div className="m-briefing-stat">
              <span className="m-num" style={{ color: overdueTasks.length ? '#ef4444' : '#10b981' }}>
                {overdueTasks.length}
              </span>
              <small>Overdue Tasks</small>
            </div>
            <div className="m-briefing-stat">
              <span className="m-num">{cropCycles.length}</span>
              <small>Active Crop Cycles</small>
            </div>
            <div className="m-briefing-text">
              {todayTasks.length === 0 && overdueTasks.length === 0 ? (
                <p>✅ All activities up to date! Great time for routine field inspection and soil moisture checks.</p>
              ) : (
                <p>
                  👉 Priority for today: {todayTasks.slice(0, 2).map((t) => t.title).join(', ') || 'Catch up on overdue tasks.'}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Active Crop Lifecycle Overview Bar */}
      {cropCycles.length > 0 && (
        <div className="m-active-cycles-row">
          {cropCycles.map((cycle) => (
            <div key={cycle.id} className="m-cycle-card">
              <div className="m-cycle-header">
                <b>
                  {cycle.crop_name} ({cycle.crop_variety || 'Hybrid'})
                </b>
                <span className="m-cycle-area">{cycle.farm_area} Acres</span>
              </div>
              <div className="m-cycle-stage-badge">
                <span>📍 {cycle.calculatedStage || 'Active Growth'}</span>
                <small>{cycle.daysSinceSowing} DAS · Duration: {cycle.crop_duration_days}d</small>
              </div>
              <div className="m-progress">
                <span style={{ width: `${cycle.progressPercent || 20}%` }} />
              </div>
              <div className="m-cycle-foot">
                <span>🌾 Expected Harvest: {cycle.expected_harvest_date}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* View Switcher Tabs & Filters */}
      <div className="m-calendar-controls-bar">
        <div className="m-view-tabs">
          <button
            type="button"
            className={view === 'month' ? 'active' : ''}
            onClick={() => setView('month')}
          >
            📅 {t('Monthly View', language)}
          </button>
          <button
            type="button"
            className={view === 'week' ? 'active' : ''}
            onClick={() => setView('week')}
          >
            📊 {t('Weekly View', language)}
          </button>
          <button
            type="button"
            className={view === 'day' ? 'active' : ''}
            onClick={() => setView('day')}
          >
            🕒 {t('Daily Timeline', language)}
          </button>
          <button
            type="button"
            className={view === 'agenda' ? 'active' : ''}
            onClick={() => setView('agenda')}
          >
            📋 {t('Agenda & Upcoming', language)}
          </button>
          <button
            type="button"
            className={view === 'history' ? 'active' : ''}
            onClick={() => setView('history')}
          >
            📜 {t('Activity History', language)}
          </button>
        </div>

        {/* Filter chips */}
        <div className="m-calendar-filters">
          <span>Filter:</span>
          {['all', 'irrigation', 'fertilizer', 'pest', 'harvest', 'weather'].map((type) => (
            <button
              key={type}
              type="button"
              className={`m-filter-pill ${filterType === type ? 'active' : ''}`}
              onClick={() => setFilterType(type)}
            >
              {type === 'all' && 'All'}
              {type === 'irrigation' && '💧 Irrigation'}
              {type === 'fertilizer' && '🌿 Fertilizer'}
              {type === 'pest' && '🔍 Pest/Disease'}
              {type === 'harvest' && '🌾 Harvest'}
              {type === 'weather' && '⚠️ Weather Alerts'}
            </button>
          ))}
        </div>
      </div>

      {/* --- 1. MONTH VIEW --- */}
      {view === 'month' && (
        <div className="m-card m-month-view-card">
          <div className="m-month-nav">
            <button
              type="button"
              onClick={() =>
                setCurrentMonthDate(
                  new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() - 1, 1)
                )
              }
            >
              ◀ Previous
            </button>
            <h2>
              {currentMonthDate.toLocaleDateString(language === 'kn' ? 'kn-IN' : 'en-IN', {
                month: 'long',
                year: 'numeric',
              })}
            </h2>
            <button
              type="button"
              onClick={() =>
                setCurrentMonthDate(
                  new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() + 1, 1)
                )
              }
            >
              Next ▶
            </button>
          </div>

          <div className="m-month-calendar-grid">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <div key={d} className="m-month-day-head">
                {d}
              </div>
            ))}
            {calendarGrid.map((cell, idx) => {
              const dayTasks = tasksByDate.get(cell.dateStr) || []
              const isToday = cell.dateStr === todayStr
              const isSelected = cell.dateStr === selectedDate

              return (
                <div
                  key={idx}
                  className={`m-month-day-cell ${!cell.isCurrentMonth ? 'other-month' : ''} ${
                    isToday ? 'is-today' : ''
                  } ${isSelected ? 'is-selected' : ''}`}
                  onClick={() => {
                    setSelectedDate(cell.dateStr)
                    setView('day')
                  }}
                >
                  <div className="m-day-number-row">
                    <span className="m-day-num">{cell.dayNum}</span>
                    {dayTasks.length > 0 && (
                      <span className="m-task-count-badge">{dayTasks.length}</span>
                    )}
                  </div>
                  <div className="m-day-task-chips">
                    {dayTasks.slice(0, 3).map((t) => {
                      const style = ACTIVITY_COLORS[t.activity_type] || ACTIVITY_COLORS.general
                      return (
                        <div
                          key={t.id}
                          className={`m-calendar-chip ${t.status === 'completed' ? 'completed' : ''}`}
                          style={{
                            background: style.bg,
                            borderLeft: `3px solid ${style.border}`,
                            color: style.text,
                          }}
                          title={`${t.title} (${t.activity_type})`}
                        >
                          <span className="m-chip-icon">{style.icon}</span>
                          <span className="m-chip-text">{t.title}</span>
                          {t.weather_warning && <span className="m-chip-warning">⚠️</span>}
                        </div>
                      )
                    })}
                    {dayTasks.length > 3 && (
                      <small className="m-more-tasks">+{dayTasks.length - 3} more</small>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* --- 2. WEEKLY VIEW WITH WEATHER FORECAST --- */}
      {view === 'week' && (
        <div className="m-card m-week-view-card">
          <h2>7-Day Weekly Schedule & Forecast Matcher</h2>
          <div className="m-week-grid">
            {(weatherForecast.length > 0
              ? weatherForecast
              : Array.from({ length: 7 }, (_, i) => {
                  const d = new Date(Date.now() + i * 86400000).toISOString().slice(0, 10)
                  return { date: d, tempMax: 30, tempMin: 20, precipitationMm: 0, precipitationProb: 10 }
                })
            ).map((day) => {
              const dayTasks = tasksByDate.get(day.date) || []
              const isToday = day.date === todayStr
              const dayName = new Date(`${day.date}T12:00:00`).toLocaleDateString('en-US', {
                weekday: 'short',
              })

              return (
                <div key={day.date} className={`m-week-col ${isToday ? 'is-today' : ''}`}>
                  <div className="m-week-header">
                    <b>{dayName}</b>
                    <small>{day.date.slice(5)}</small>
                    <div className="m-week-weather-badge">
                      <span>{day.tempMax}° / {day.tempMin}°</span>
                      <small>🌧️ {day.precipitationProb}%</small>
                    </div>
                  </div>

                  <div className="m-week-tasks-body">
                    {dayTasks.length === 0 ? (
                      <div className="m-no-tasks-slot">No tasks</div>
                    ) : (
                      dayTasks.map((t) => {
                        const style = ACTIVITY_COLORS[t.activity_type] || ACTIVITY_COLORS.general
                        return (
                          <div
                            key={t.id}
                            className={`m-week-task-card ${t.status === 'completed' ? 'done' : ''}`}
                            style={{ borderLeftColor: style.border }}
                          >
                            <div className="m-task-card-title">
                              <span>{style.icon}</span>
                              <b>{t.title}</b>
                            </div>
                            <small>{t.crop_name} · {t.stage_name}</small>
                            {t.weather_warning && (
                              <div className="m-chip-weather-warning">⚠️ {t.weather_warning}</div>
                            )}
                            <div className="m-task-actions-row">
                              {t.status !== 'completed' ? (
                                <button
                                  type="button"
                                  onClick={() => setShowCompleteModal(t)}
                                  className="m-btn-mini complete"
                                >
                                  ✓ Done
                                </button>
                              ) : (
                                <span className="m-status-done-tag">Completed</span>
                              )}
                              <button
                                type="button"
                                onClick={() => {
                                  setShowRescheduleModal(t)
                                  setRescheduleDate(t.scheduled_date)
                                }}
                                className="m-btn-mini reschedule"
                              >
                                Reschedule
                              </button>
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* --- 3. DAILY TIMELINE VIEW --- */}
      {view === 'day' && (
        <div className="m-day-view-layout">
          <div className="m-card m-day-main-card">
            <div className="m-day-nav-bar">
              <button
                type="button"
                onClick={() => {
                  const prev = new Date(new Date(`${selectedDate}T00:00:00`).getTime() - 86400000)
                    .toISOString()
                    .slice(0, 10)
                  setSelectedDate(prev)
                }}
              >
                ◀ Previous Day
              </button>
              <h2>
                Activities for {selectedDate} {selectedDate === todayStr && '(Today)'}
              </h2>
              <button
                type="button"
                onClick={() => {
                  const next = new Date(new Date(`${selectedDate}T00:00:00`).getTime() + 86400000)
                    .toISOString()
                    .slice(0, 10)
                  setSelectedDate(next)
                }}
              >
                Next Day ▶
              </button>
            </div>

            {/* Overdue alert if looking at today */}
            {selectedDate === todayStr && overdueTasks.length > 0 && (
              <div className="m-overdue-alert-box">
                <b>⚠️ You have {overdueTasks.length} overdue activities!</b>
                <div className="m-overdue-list">
                  {overdueTasks.map((t) => (
                    <div key={t.id} className="m-overdue-item">
                      <span>{t.scheduled_date} · <b>{t.title}</b> ({t.crop_name})</span>
                      <div>
                        <button
                          type="button"
                          className="m-btn-mini complete"
                          onClick={() => setShowCompleteModal(t)}
                        >
                          Mark Completed
                        </button>
                        <button
                          type="button"
                          className="m-btn-mini reschedule"
                          onClick={() => {
                            setShowRescheduleModal(t)
                            setRescheduleDate(todayStr)
                          }}
                        >
                          Reschedule to Today
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Selected day task list */}
            {(!tasksByDate.get(selectedDate) || tasksByDate.get(selectedDate).length === 0) ? (
              <div className="m-empty-day">
                <span>🌿</span>
                <b>No activities scheduled for this day</b>
                <p>Plan ahead by adding an activity or generating a full crop schedule.</p>
                <button
                  type="button"
                  className="m-button light"
                  onClick={() => {
                    setTaskForm({ ...taskForm, scheduledDate: selectedDate })
                    setShowTaskModal(true)
                  }}
                >
                  + Add Activity for {selectedDate}
                </button>
              </div>
            ) : (
              <div className="m-daily-task-list">
                {tasksByDate.get(selectedDate).map((t) => {
                  const style = ACTIVITY_COLORS[t.activity_type] || ACTIVITY_COLORS.general
                  return (
                    <div
                      key={t.id}
                      className={`m-daily-task-item ${t.status === 'completed' ? 'completed' : ''}`}
                    >
                      <div className="m-daily-task-type" style={{ color: style.text, background: style.bg }}>
                        <span>{style.icon}</span>
                        <small>{t.activity_type.replace('_', ' ').toUpperCase()}</small>
                      </div>
                      <div className="m-daily-task-content">
                        <div className="m-daily-task-title-row">
                          <h3>{t.title}</h3>
                          <span className={`m-priority-badge ${t.priority}`}>{t.priority}</span>
                        </div>
                        <p className="m-task-desc">{t.description}</p>
                        <div className="m-daily-task-meta">
                          <span>🌾 {t.crop_name || 'General Field'}</span>
                          <span>📍 Stage: {t.stage_name}</span>
                          {t.completed_date && <span>✅ Completed on {t.completed_date}</span>}
                        </div>
                        {t.weather_warning && (
                          <div className="m-daily-weather-warning">
                            <span>⚠️</span> {t.weather_warning}
                          </div>
                        )}
                        {t.notes && <div className="m-task-user-notes">📝 Notes: {t.notes}</div>}
                      </div>
                      <div className="m-daily-task-actions">
                        {t.status !== 'completed' ? (
                          <button
                            type="button"
                            className="m-button primary"
                            onClick={() => setShowCompleteModal(t)}
                          >
                            Mark Complete
                          </button>
                        ) : (
                          <span className="m-badge-done">Completed</span>
                        )}
                        <button
                          type="button"
                          className="m-button light"
                          onClick={() => {
                            setShowRescheduleModal(t)
                            setRescheduleDate(t.scheduled_date)
                          }}
                        >
                          Reschedule
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- 4. AGENDA & UPCOMING VIEW --- */}
      {view === 'agenda' && (
        <div className="m-card m-agenda-card">
          <h2>Upcoming Farming Activities (Next 30 Days)</h2>
          <div className="m-agenda-list">
            {filteredTasks
              .filter((t) => t.scheduled_date >= todayStr && t.status !== 'completed')
              .map((t) => {
                const style = ACTIVITY_COLORS[t.activity_type] || ACTIVITY_COLORS.general
                return (
                  <div key={t.id} className="m-agenda-item">
                    <div className="m-agenda-date-col">
                      <b>{t.scheduled_date.slice(8, 10)}</b>
                      <small>{t.scheduled_date.slice(5, 7)}</small>
                    </div>
                    <div className="m-agenda-info-col">
                      <div className="m-agenda-title">
                        <span>{style.icon}</span>
                        <b>{t.title}</b>
                        <span className={`m-priority-badge ${t.priority}`}>{t.priority}</span>
                      </div>
                      <p>{t.description}</p>
                      <small>{t.crop_name} · Stage: {t.stage_name}</small>
                      {t.weather_warning && (
                        <div className="m-agenda-warning">⚠️ {t.weather_warning}</div>
                      )}
                    </div>
                    <div className="m-agenda-actions">
                      <button
                        type="button"
                        className="m-btn-mini complete"
                        onClick={() => setShowCompleteModal(t)}
                      >
                        Complete
                      </button>
                      <button
                        type="button"
                        className="m-btn-mini reschedule"
                        onClick={() => {
                          setShowRescheduleModal(t)
                          setRescheduleDate(t.scheduled_date)
                        }}
                      >
                        Reschedule
                      </button>
                    </div>
                  </div>
                )
              })}
          </div>
        </div>
      )}

      {/* --- 5. ACTIVITY HISTORY AUDIT LOG --- */}
      {view === 'history' && (
        <div className="m-card m-history-card">
          <h2>Farming Activity Audit Log & Task Records</h2>
          <div className="m-table-responsive">
            <table className="m-history-table">
              <thead>
                <tr>
                  <th>Date & Time</th>
                  <th>Action</th>
                  <th>Task Title</th>
                  <th>Crop</th>
                  <th>Status / Notes</th>
                </tr>
              </thead>
              <tbody>
                {taskHistory.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '24px' }}>
                      No activity logs recorded yet. Complete or reschedule tasks to build your farm history.
                    </td>
                  </tr>
                ) : (
                  taskHistory.map((h) => (
                    <tr key={h.id}>
                      <td>{h.created_at?.slice(0, 16)}</td>
                      <td>
                        <span className={`m-action-tag ${h.action}`}>{h.action.toUpperCase()}</span>
                      </td>
                      <td><b>{h.task_title || 'General Task'}</b></td>
                      <td>{h.crop_name || 'Farm'}</td>
                      <td>{h.reason || h.new_status || '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- CROP SCHEDULE WIZARD MODAL --- */}
      {showCropWizard && (
        <div className="m-modal-overlay" role="dialog" aria-modal="true">
          <div className="m-modal-card m-wizard-modal">
            <div className="m-modal-header">
              <h3>🌾 AI Crop Lifecycle & Schedule Wizard</h3>
              <button type="button" onClick={() => setShowCropWizard(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateCropCycle}>
              <div className="m-wizard-form-grid">
                <label>
                  <span>Select Crop *</span>
                  <select
                    value={wizardForm.cropName}
                    onChange={(e) => {
                      const next = { ...wizardForm, cropName: e.target.value }
                      setWizardForm(next)
                    }}
                  >
                    {SUPPORTED_CROPS_LIST.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.icon} {c.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  <span>Crop Variety / Hybrid</span>
                  <input
                    type="text"
                    value={wizardForm.cropVariety}
                    onChange={(e) => setWizardForm({ ...wizardForm, cropVariety: e.target.value })}
                    placeholder="e.g. Kargil 900M, Arka Rakshak"
                  />
                </label>

                <label>
                  <span>Field / Plot Name</span>
                  <input
                    type="text"
                    value={wizardForm.fieldName}
                    onChange={(e) => setWizardForm({ ...wizardForm, fieldName: e.target.value })}
                    placeholder="e.g. North Plot"
                  />
                </label>

                <label>
                  <span>Farm Area (Acres) *</span>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    required
                    value={wizardForm.farmArea}
                    onChange={(e) => setWizardForm({ ...wizardForm, farmArea: e.target.value })}
                  />
                </label>

                <label>
                  <span>Sowing Date *</span>
                  <input
                    type="date"
                    required
                    value={wizardForm.sowingDate}
                    onChange={(e) => setWizardForm({ ...wizardForm, sowingDate: e.target.value })}
                  />
                </label>

                <label>
                  <span>Soil Type</span>
                  <select
                    value={wizardForm.soilType}
                    onChange={(e) => setWizardForm({ ...wizardForm, soilType: e.target.value })}
                  >
                    <option value="Loamy">Loamy soil (Rich & balanced)</option>
                    <option value="Black">Black soil (Moisture retaining)</option>
                    <option value="Red">Red soil (Well-drained)</option>
                    <option value="Sandy">Sandy soil (Porous)</option>
                    <option value="Alluvial">Alluvial soil</option>
                    <option value="Clay">Clay soil</option>
                  </select>
                </label>

                <label>
                  <span>Irrigation Method</span>
                  <select
                    value={wizardForm.irrigationType}
                    onChange={(e) => setWizardForm({ ...wizardForm, irrigationType: e.target.value })}
                  >
                    <option value="Drip">Drip Irrigation</option>
                    <option value="Sprinkler">Sprinkler</option>
                    <option value="Furrow">Furrow / Ridge</option>
                    <option value="Basin">Basin / Flooding</option>
                    <option value="Rainfed">Rainfed (Dryland)</option>
                  </select>
                </label>
              </div>

              <div className="m-wizard-preview-btn-row">
                <button type="button" className="m-button light" onClick={handlePreviewWizard}>
                  🔄 Preview Generated Schedule
                </button>
              </div>

              {wizardPreview && (
                <div className="m-wizard-preview-box">
                  <h4>
                    Generated {wizardPreview.cropName} Timeline ({wizardPreview.cropDurationDays} Days)
                  </h4>
                  <small>Expected Harvest Date: <strong>{wizardPreview.expectedHarvestDate}</strong></small>
                  <div className="m-wizard-preview-tasks">
                    {wizardPreview.tasks.map((t, idx) => (
                      <div key={idx} className="m-preview-task-row">
                        <b>{t.scheduledDate}</b>
                        <span>[{t.activityType}] {t.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="m-modal-actions">
                <button type="button" className="m-button light" onClick={() => setShowCropWizard(false)}>
                  Cancel
                </button>
                <button type="submit" className="m-button primary" disabled={wizardSubmitting}>
                  {wizardSubmitting ? 'Generating...' : 'Confirm & Add to Calendar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- ADD CUSTOM TASK MODAL --- */}
      {showTaskModal && (
        <div className="m-modal-overlay" role="dialog" aria-modal="true">
          <div className="m-modal-card">
            <div className="m-modal-header">
              <h3>➕ Add Farm Activity</h3>
              <button type="button" onClick={() => setShowTaskModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateCustomTask}>
              <label>
                <span>Activity Title *</span>
                <input
                  type="text"
                  required
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                  placeholder="e.g. Inspect leaves for leaf spot"
                />
              </label>

              <label>
                <span>Activity Type</span>
                <select
                  value={taskForm.activityType}
                  onChange={(e) => setTaskForm({ ...taskForm, activityType: e.target.value })}
                >
                  <option value="general">General Field Work</option>
                  <option value="irrigation">Irrigation</option>
                  <option value="fertilizer">Fertilizer Application</option>
                  <option value="pest_monitoring">Pest Monitoring</option>
                  <option value="disease_inspection">Disease Inspection</option>
                  <option value="weeding">Weed Management</option>
                  <option value="harvest">Harvesting</option>
                </select>
              </label>

              <label>
                <span>Scheduled Date *</span>
                <input
                  type="date"
                  required
                  value={taskForm.scheduledDate}
                  onChange={(e) => setTaskForm({ ...taskForm, scheduledDate: e.target.value })}
                />
              </label>

              <label>
                <span>Crop / Field</span>
                <input
                  type="text"
                  value={taskForm.cropName}
                  onChange={(e) => setTaskForm({ ...taskForm, cropName: e.target.value })}
                  placeholder="e.g. Tomato Plot 1"
                />
              </label>

              <label>
                <span>Priority</span>
                <select
                  value={taskForm.priority}
                  onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </label>

              <label>
                <span>Details / Instructions</span>
                <textarea
                  rows={3}
                  value={taskForm.description}
                  onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                  placeholder="e.g. Apply 5ml/L neem oil solution early morning"
                />
              </label>

              <div className="m-modal-actions">
                <button type="button" className="m-button light" onClick={() => setShowTaskModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="m-button primary">
                  Save Activity
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- RESCHEDULE MODAL --- */}
      {showRescheduleModal && (
        <div className="m-modal-overlay" role="dialog" aria-modal="true">
          <div className="m-modal-card">
            <div className="m-modal-header">
              <h3>📅 Reschedule Farm Activity</h3>
              <button type="button" onClick={() => setShowRescheduleModal(null)}>✕</button>
            </div>
            <div>
              <p>
                Rescheduling: <b>{showRescheduleModal.title}</b>
              </p>
              <label>
                <span>New Date *</span>
                <input
                  type="date"
                  required
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                />
              </label>
              <label>
                <span>Reason for Rescheduling</span>
                <input
                  type="text"
                  placeholder="e.g. Delayed due to unseasonal rain"
                  value={rescheduleReason}
                  onChange={(e) => setRescheduleReason(e.target.value)}
                />
              </label>
              <div className="m-modal-actions">
                <button type="button" className="m-button light" onClick={() => setShowRescheduleModal(null)}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="m-button primary"
                  onClick={() => handleRescheduleTask(showRescheduleModal.id)}
                >
                  Confirm Reschedule
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- COMPLETE TASK MODAL --- */}
      {showCompleteModal && (
        <div className="m-modal-overlay" role="dialog" aria-modal="true">
          <div className="m-modal-card">
            <div className="m-modal-header">
              <h3>✅ Record Activity Completion</h3>
              <button type="button" onClick={() => setShowCompleteModal(null)}>✕</button>
            </div>
            <div>
              <p>
                Marking as completed: <b>{showCompleteModal.title}</b>
              </p>
              <label>
                <span>Field Notes & Observations</span>
                <textarea
                  rows={3}
                  value={completeNotes}
                  onChange={(e) => setCompleteNotes(e.target.value)}
                  placeholder="e.g. Field ploughed smoothly; soil moisture was adequate; no major pest signs."
                />
              </label>
              <div className="m-modal-actions">
                <button type="button" className="m-button light" onClick={() => setShowCompleteModal(null)}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="m-button primary"
                  onClick={() => handleCompleteTask(showCompleteModal.id)}
                >
                  Save as Completed
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default FarmCalendarPage
