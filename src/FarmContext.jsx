import { createContext, useCallback, useContext, useEffect, useState } from 'react'

export const CHAT_TOKEN_KEY = 'farm-saathi:chat-token'
export const USER_KEY = 'farm-saathi:user'
export const PROFILE_KEY = 'farm-saathi:profile'

export const FarmContext = createContext(null)

export function useStoredState(key, initialValue) {
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

export function FarmProvider({ children }) {
  const [profile, setProfile, profileError] = useStoredState('profile', null)
  const [crops, setCrops, cropsError] = useStoredState('crops', [])
  const [expenses, setExpenses, expensesError] = useStoredState('expenses', [])
  const [tasks, setTasks, tasksError] = useStoredState('tasks', [])
  const [observations, setObservations, observationsError] = useStoredState('observations', [])
  const [, , demoModeError] = useStoredState('demo-mode', false)
  const [language, setLanguage] = useStoredState('language', 'en')
  const [darkMode, setDarkMode] = useStoredState('dark-mode', false)

  const [token, setTokenRaw] = useState(() => {
    try {
      return localStorage.getItem(CHAT_TOKEN_KEY) || ''
    } catch {
      return ''
    }
  })

  const [user, setUserRaw] = useState(() => {
    try {
      const saved = localStorage.getItem(USER_KEY)
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })

  const setToken = useCallback((nextToken) => {
    const val = nextToken || ''
    setTokenRaw(val)
    try {
      if (val) {
        localStorage.setItem(CHAT_TOKEN_KEY, val)
      } else {
        localStorage.removeItem(CHAT_TOKEN_KEY)
      }
    } catch (e) {
      console.warn('Could not persist token', e)
    }
  }, [])

  const setUser = useCallback((nextUser) => {
    const val = nextUser || null
    setUserRaw(val)
    try {
      if (val) {
        localStorage.setItem(USER_KEY, JSON.stringify(val))
      } else {
        localStorage.removeItem(USER_KEY)
      }
    } catch (e) {
      console.warn('Could not persist user', e)
    }
  }, [])

  const logout = useCallback(() => {
    setTokenRaw('')
    setUserRaw(null)
    try {
      localStorage.removeItem(CHAT_TOKEN_KEY)
      localStorage.removeItem(USER_KEY)
    } catch (e) {
      console.warn('Could not remove auth items', e)
    }
  }, [])

  const storageError = [profileError, cropsError, expensesError, tasksError, observationsError, demoModeError].find(Boolean) || ''

  const value = {
    profile,
    setProfile,
    crops,
    setCrops,
    expenses,
    setExpenses,
    tasks,
    setTasks,
    observations,
    setObservations,
    language,
    setLanguage,
    darkMode,
    setDarkMode,
    token,
    setToken,
    user,
    setUser,
    logout,
    storageError,
  }

  return <FarmContext.Provider value={value}>{children}</FarmContext.Provider>
}

export function useFarm() {
  const context = useContext(FarmContext)
  if (!context) throw new Error('Farm data must be used inside FarmProvider.')
  return context
}

