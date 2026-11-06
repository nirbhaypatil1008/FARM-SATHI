import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useFarm } from '../FarmContext.jsx'

// Supported regional languages for FARM-SAATHI AI
export const ASSISTANT_LANGUAGES = [
  { code: 'en', bcp47: 'en-IN', label: 'English', native: 'English' },
  { code: 'kn', bcp47: 'kn-IN', label: 'Kannada', native: 'ಕನ್ನಡ' },
  { code: 'hi', bcp47: 'hi-IN', label: 'Hindi', native: 'हिन्दी' },
  { code: 'te', bcp47: 'te-IN', label: 'Telugu', native: 'తెలుగు' },
  { code: 'ta', bcp47: 'ta-IN', label: 'Tamil', native: 'தமிழ்' },
  { code: 'ml', bcp47: 'ml-IN', label: 'Malayalam', native: 'മലയാളം' },
  { code: 'mr', bcp47: 'mr-IN', label: 'Marathi', native: 'मराठी' },
  { code: 'bn', bcp47: 'bn-IN', label: 'Bengali', native: 'বাংলা' },
  { code: 'gu', bcp47: 'gu-IN', label: 'Gujarati', native: 'ગુજરાતી' },
  { code: 'pa', bcp47: 'pa-IN', label: 'Punjabi', native: 'ਪੰਜਾਬੀ' },
  { code: 'or', bcp47: 'or-IN', label: 'Odia', native: 'ଓଡ଼ିଆ' },
]

// Professional SVG Icons (No emoji buttons in UI)
function IconSprout({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M7 20h10" />
      <path d="M10 20c5.5-2.5.8-6.4 3-10" />
      <path d="M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4.1 5.5.8z" />
      <path d="M14.1 6a7 7 0 0 0-1.1 4c1.9-.1 3.3-.6 4.3-1.4 1-1 1.7-2.4 2-4.6-2.5 0-4.2.8-5.2 2z" />
    </svg>
  )
}

function IconPlus({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}

function IconSearch({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}

function IconTrash({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  )
}

function IconClose({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

function IconSend({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  )
}

function IconMic({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  )
}

function IconCopy({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  )
}

function IconCheck({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function IconSpeaker({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
    </svg>
  )
}

function IconPause({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="6" y="4" width="4" height="16" />
      <rect x="14" y="4" width="4" height="16" />
    </svg>
  )
}

function IconPlay({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  )
}

function IconStop({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="4" y="4" width="16" height="16" rx="2" />
    </svg>
  )
}

function IconRotate({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="23 4 23 10 17 10" />
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
    </svg>
  )
}

function IconThumbUp({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
    </svg>
  )
}

function IconThumbDown({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-3" />
    </svg>
  )
}

function IconSliders({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="4" y1="21" x2="4" y2="14" />
      <line x1="4" y1="10" x2="4" y2="3" />
      <line x1="12" y1="21" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12" y2="3" />
      <line x1="20" y1="21" x2="20" y2="16" />
      <line x1="20" y1="12" x2="20" y2="3" />
      <line x1="1" y1="14" x2="7" y2="14" />
      <line x1="9" y1="8" x2="15" y2="8" />
      <line x1="17" y1="16" x2="23" y2="16" />
    </svg>
  )
}

function IconSidebar({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <line x1="9" y1="3" x2="9" y2="21" />
    </svg>
  )
}

function IconPanel({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <line x1="15" y1="3" x2="15" y2="21" />
    </svg>
  )
}

function IconRefresh({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="23 4 23 10 17 10" />
      <polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
  )
}

function IconArrowLeft({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  )
}

function IconCalendar({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  )
}

function IconCloudSun({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 2v2M4.93 4.93l1.41 1.41M2 12h2M20 12h2M19.07 4.93l-1.41 1.41" />
      <path d="M15.5 17a4.5 4.5 0 0 0 2.5-8.2 6 6 0 0 0-11.4 2A4.5 4.5 0 0 0 7 19.5h8.5" />
    </svg>
  )
}

function IconStethoscope({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3" />
      <path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4" />
      <circle cx="20" cy="10" r="2" />
    </svg>
  )
}

function IconSoil({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 20c2-1 4-1 6 0s4 1 6 0 4-1 6 0" />
      <path d="M2 16c2-1 4-1 6 0s4 1 6 0 4-1 6 0" />
      <path d="M12 4v8" />
      <path d="m8 8 4-4 4 4" />
    </svg>
  )
}

function IconUser({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}

function IconMessage({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  )
}

// Inline Markdown Parser
function FormattedInline({ text }) {
  if (!text) return null
  const parts = []
  let remaining = text
  let keyIdx = 0

  while (remaining.length > 0) {
    const boldMatch = remaining.match(/\*\*(.+?)\*\*/)
    if (boldMatch && boldMatch.index !== undefined) {
      if (boldMatch.index > 0) {
        parts.push(<span key={keyIdx++}>{remaining.slice(0, boldMatch.index)}</span>)
      }
      parts.push(<strong key={keyIdx++}>{boldMatch[1]}</strong>)
      remaining = remaining.slice(boldMatch.index + boldMatch[0].length)
      continue
    }

    const codeMatch = remaining.match(/`([^`]+)`/)
    if (codeMatch && codeMatch.index !== undefined) {
      if (codeMatch.index > 0) {
        parts.push(<span key={keyIdx++}>{remaining.slice(0, codeMatch.index)}</span>)
      }
      parts.push(<code key={keyIdx++}>{codeMatch[1]}</code>)
      remaining = remaining.slice(codeMatch.index + codeMatch[0].length)
      continue
    }

    parts.push(<span key={keyIdx++}>{remaining}</span>)
    break
  }

  return <>{parts}</>
}

function MarkdownRenderer({ text }) {
  if (!text) return null
  const paragraphs = text.split(/\n\s*\n/)

  return (
    <div className="fs-markdown-body">
      {paragraphs.map((p, idx) => {
        const trimmed = p.trim()

        // Markdown Table
        if (trimmed.includes('|') && trimmed.split('\n').length >= 2) {
          const tableLines = trimmed.split('\n').filter((l) => l.trim().startsWith('|'))
          if (tableLines.length >= 2) {
            const headerCells = tableLines[0].split('|').map((c) => c.trim()).filter(Boolean)
            const rowLines = tableLines.slice(2)
            return (
              <div key={idx} className="fs-table-wrapper">
                <table className="fs-chat-table">
                  <thead>
                    <tr>
                      {headerCells.map((h, hIdx) => (
                        <th key={hIdx}><FormattedInline text={h} /></th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rowLines.map((row, rIdx) => {
                      const cells = row.split('|').map((c) => c.trim()).filter(Boolean)
                      return (
                        <tr key={rIdx}>
                          {cells.map((cell, cIdx) => (
                            <td key={cIdx}><FormattedInline text={cell} /></td>
                          ))}
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )
          }
        }

        const lines = p.split('\n')

        // Bullet List
        if (lines.length > 1 && lines.every((l) => l.trim().startsWith('- ') || l.trim().startsWith('* '))) {
          return (
            <ul key={idx} className="fs-chat-list">
              {lines.map((l, lIdx) => (
                <li key={lIdx}><FormattedInline text={l.replace(/^[-*]\s+/, '')} /></li>
              ))}
            </ul>
          )
        }

        // Numbered List
        if (lines.length > 1 && lines.every((l) => /^\d+\.\s+/.test(l.trim()))) {
          return (
            <ol key={idx} className="fs-chat-list numbered">
              {lines.map((l, lIdx) => (
                <li key={lIdx}><FormattedInline text={l.replace(/^\d+\.\s+/, '')} /></li>
              ))}
            </ol>
          )
        }

        // Headings
        if (p.startsWith('### ')) {
          return <h4 key={idx} className="fs-chat-h4"><FormattedInline text={p.slice(4)} /></h4>
        }
        if (p.startsWith('## ')) {
          return <h3 key={idx} className="fs-chat-h3"><FormattedInline text={p.slice(3)} /></h3>
        }
        if (p.startsWith('# ')) {
          return <h2 key={idx} className="fs-chat-h2"><FormattedInline text={p.slice(2)} /></h2>
        }
        if (p.startsWith('> ')) {
          return (
            <blockquote key={idx} className="fs-chat-quote">
              <FormattedInline text={p.slice(2)} />
            </blockquote>
          )
        }

        return (
          <p key={idx} className="fs-chat-p">
            {lines.map((line, lineIdx) => (
              <span key={lineIdx}>
                <FormattedInline text={line} />
                {lineIdx < lines.length - 1 && <br />}
              </span>
            ))}
          </p>
        )
      })}
    </div>
  )
}

// Four primary suggestion cards required by prompt
const WELCOME_SUGGESTIONS = [
  {
    title: 'Recommend the best crop for my farm.',
    desc: 'Based on current season, your soil type, and water availability',
    icon: <IconSprout className="fs-suggestion-icon" />,
  },
  {
    title: 'Explain my latest soil analysis.',
    desc: 'Visual classification, confidence, and soil health advice',
    icon: <IconSoil className="fs-suggestion-icon" />,
  },
  {
    title: 'Check my plant health.',
    desc: 'Review latest Crop Doctor diagnoses, symptoms, and organic remedies',
    icon: <IconStethoscope className="fs-suggestion-icon" />,
  },
  {
    title: 'What should I do today?',
    desc: 'View scheduled Farm Calendar tasks, irrigation, and weather alerts',
    icon: <IconCalendar className="fs-suggestion-icon" />,
  },
]

// Date grouping helper for conversation history
function groupConversationsByDate(conversations) {
  const groups = {
    today: [],
    yesterday: [],
    previous7Days: [],
    older: [],
  }
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const yesterdayStart = todayStart - 86400000
  const sevenDaysStart = todayStart - 7 * 86400000

  conversations.forEach((conv) => {
    const timestamp = new Date(conv.updated_at || conv.created_at || Date.now()).getTime()
    if (timestamp >= todayStart) {
      groups.today.push(conv)
    } else if (timestamp >= yesterdayStart) {
      groups.yesterday.push(conv)
    } else if (timestamp >= sevenDaysStart) {
      groups.previous7Days.push(conv)
    } else {
      groups.older.push(conv)
    }
  })
  return groups
}

export function AiAssistantPage({ voiceFirst = false }) {
  const { profile, crops, token, language: appLanguage, user } = useFarm()
  const navigate = useNavigate()
  const location = useLocation()

  const effectiveToken = useMemo(() => {
    if (token && typeof token === 'string' && token.trim().length > 0) return token.trim()
    try {
      const stored = localStorage.getItem('farm-saathi:chat-token')
      if (stored && stored.trim().length > 0) return stored.trim()
    } catch {}
    return 'guest-token-farmer'
  }, [token])

  // UI Layout States
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [contextPanelOpen, setContextPanelOpen] = useState(true)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)
  const [mobileContextOpen, setMobileContextOpen] = useState(false)

  // Language & Voice
  const [selectedLang, setSelectedLang] = useState(() => {
    const match = ASSISTANT_LANGUAGES.find((l) => l.code === appLanguage)
    return match ? match.code : 'en'
  })
  const currentLangObj = useMemo(
    () => ASSISTANT_LANGUAGES.find((l) => l.code === selectedLang) || ASSISTANT_LANGUAGES[0],
    [selectedLang]
  )
  const [speechSpeed, setSpeechSpeed] = useState(1.0)
  const [selectedVoiceUri, setSelectedVoiceUri] = useState('')
  const [autoVoiceMode, setAutoVoiceMode] = useState(voiceFirst)
  const [answerMode, setAnswerMode] = useState('auto') // 'auto' | 'quick' | 'deep'

  // Voice Interaction
  const [isListening, setIsListening] = useState(false)
  const [listeningStatus, setListeningStatus] = useState('')
  const [speakingMessageId, setSpeakingMessageId] = useState(null)
  const [speechPaused, setSpeechPaused] = useState(false)
  const [availableVoices, setAvailableVoices] = useState([])

  // Conversation & Messages
  const [conversationList, setConversationList] = useState([])
  const [conversationId, setConversationId] = useState('')
  const [historySearch, setHistorySearch] = useState('')
  const [messages, setMessages] = useState([])
  const [inputMessage, setInputMessage] = useState('')
  const [streamingDelta, setStreamingDelta] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [chatNotice, setChatNotice] = useState('')
  const [chatError, setChatError] = useState('')
  const [copiedId, setCopiedId] = useState(null)
  const [messageFeedback, setMessageFeedback] = useState({}) // { [id]: 'up' | 'down' }

  // Live Grounding Context Panel Data
  const [contextLoading, setContextLoading] = useState(false)
  const [latestSoil, setLatestSoil] = useState(null)
  const [latestPlant, setLatestPlant] = useState(null)
  const [liveWeather, setLiveWeather] = useState(null)
  const [todayTasks, setTodayTasks] = useState([])
  const [overdueTasksCount, setOverdueTasksCount] = useState(0)
  const [activeCropCycles, setActiveCropCycles] = useState([])

  const messagesEndRef = useRef(null)
  const textareaRef = useRef(null)
  const recognitionRef = useRef(null)
  const abortControllerRef = useRef(null)
  const settingsRef = useRef(null)

  const notify = (msg) => {
    setChatNotice(msg)
    setTimeout(() => setChatNotice(''), 3500)
  }

  // Load voices for regional TTS
  useEffect(() => {
    const updateVoices = () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        const voices = window.speechSynthesis.getVoices() || []
        setAvailableVoices(voices)
      }
    }
    updateVoices()
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = updateVoices
    }
  }, [])

  // Close settings popover on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target)) {
        setSettingsOpen(false)
      }
    }
    if (settingsOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [settingsOpen])

  // Fetch real context records for right panel
  const fetchFarmerContext = useCallback(async () => {
    setContextLoading(true)
    const headers = { Authorization: `Bearer ${effectiveToken}` }
    const loc = profile?.village || profile?.district || 'Mandya, Karnataka'

    try {
      const [soilRes, plantRes, todayRes, weatherRes, cropsRes] = await Promise.allSettled([
        fetch('/api/soil/history', { headers }).then((r) => (r.ok ? r.json() : null)),
        fetch('/api/crop-doctor/history', { headers }).then((r) => (r.ok ? r.json() : null)),
        fetch('/api/farm-calendar/today', { headers }).then((r) => (r.ok ? r.json() : null)),
        fetch(`/api/farm-calendar/weather-alerts?location=${encodeURIComponent(loc)}`, { headers }).then((r) => (r.ok ? r.json() : null)),
        fetch('/api/farm-calendar/crop-cycles', { headers }).then((r) => (r.ok ? r.json() : null)),
      ])

      if (soilRes.status === 'fulfilled' && soilRes.value?.analyses?.length > 0) {
        setLatestSoil(soilRes.value.analyses[0])
      }
      if (plantRes.status === 'fulfilled' && plantRes.value?.diagnoses?.length > 0) {
        setLatestPlant(plantRes.value.diagnoses[0])
      }
      if (todayRes.status === 'fulfilled' && todayRes.value) {
        setTodayTasks(todayRes.value.todayTasks || [])
        setOverdueTasksCount(todayRes.value.overdueCount || 0)
      }
      if (weatherRes.status === 'fulfilled' && weatherRes.value?.forecast?.length > 0) {
        setLiveWeather(weatherRes.value.forecast[0])
      }
      if (cropsRes.status === 'fulfilled' && cropsRes.value?.cropCycles) {
        setActiveCropCycles(cropsRes.value.cropCycles)
      }
    } catch (err) {
      console.warn('Error refreshing farmer context:', err)
    } finally {
      setContextLoading(false)
    }
  }, [effectiveToken, profile])

  useEffect(() => {
    fetchFarmerContext()
  }, [fetchFarmerContext])

  // Load conversation list
  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch('/api/chat/history', {
        headers: { Authorization: `Bearer ${effectiveToken}` },
      })
      if (res.ok) {
        const body = await res.json()
        const convs = body.conversations || []
        setConversationList(convs)
        if (!conversationId && convs.length > 0) {
          setConversationId(convs[0].id)
          setMessages(convs[0].messages || [])
        }
      }
    } catch (e) {
      console.warn('Could not load chat history:', e)
    }
  }, [effectiveToken, conversationId])

  useEffect(() => {
    fetchConversations()
  }, [fetchConversations])

  // Sync active conversation
  useEffect(() => {
    if (conversationId) {
      const active = conversationList.find((c) => c.id === conversationId)
      if (active) {
        setMessages(active.messages || [])
      }
    }
  }, [conversationId, conversationList])

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingDelta, isGenerating])

  // Cleanup audio & recognition
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel()
      }
      if (recognitionRef.current) {
        recognitionRef.current.abort()
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  // Auto-grow textarea
  const handleInputChange = (e) => {
    setInputMessage(e.target.value)
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`
    }
  }

  // --- ACTIONS ---

  const handleStartNewChat = async () => {
    setChatError('')
    try {
      const res = await fetch('/api/chat/new', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${effectiveToken}`,
        },
      })
      if (res.ok) {
        const body = await res.json()
        setConversationId(body.conversationId)
        setMessages([])
        setStreamingDelta('')
        notify('Started a new conversation')
        fetchConversations()
        setMobileDrawerOpen(false)
      }
    } catch (err) {
      setChatError('Could not start new chat: ' + err.message)
    }
  }

  const handleDeleteConversation = async (convId, e) => {
    if (e) e.stopPropagation()
    if (!window.confirm('Delete this conversation from your history?')) return
    try {
      const res = await fetch(`/api/chat/history/${convId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${effectiveToken}` },
      })
      if (res.ok) {
        setConversationList((prev) => prev.filter((c) => c.id !== convId))
        if (conversationId === convId) {
          setConversationId('')
          setMessages([])
        }
        notify('Conversation deleted')
      }
    } catch (err) {
      setChatError('Failed to delete conversation: ' + err.message)
    }
  }

  const handleClearAllHistory = async () => {
    if (!window.confirm('Permanently delete all conversation history?')) return
    try {
      const res = await fetch('/api/chat/history', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${effectiveToken}` },
      })
      if (res.ok) {
        setConversationList([])
        setConversationId('')
        setMessages([])
        notify('All conversation history cleared')
      }
    } catch (err) {
      setChatError('Failed to clear history: ' + err.message)
    }
  }

  // --- TTS ---
  const handleSpeakMessage = (msgId, text) => {
    if (!window.speechSynthesis) {
      alert('Text-to-speech is not supported on this browser.')
      return
    }

    if (speakingMessageId === msgId && !speechPaused) {
      window.speechSynthesis.pause()
      setSpeechPaused(true)
      return
    }

    if (speakingMessageId === msgId && speechPaused) {
      window.speechSynthesis.resume()
      setSpeechPaused(false)
      return
    }

    window.speechSynthesis.cancel()

    const cleanSpeechText = text
      .replace(/[*#`_~]/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .slice(0, 3000)

    const utterance = new SpeechSynthesisUtterance(cleanSpeechText)
    utterance.rate = Number(speechSpeed) || 1.0

    // Voice resolution: user chosen voice or matching regional tag
    let targetVoice = null
    if (selectedVoiceUri) {
      targetVoice = availableVoices.find((v) => v.voiceURI === selectedVoiceUri)
    }
    if (!targetVoice) {
      const bcpTag = currentLangObj.bcp47.toLowerCase()
      const langPrefix = currentLangObj.code.toLowerCase()
      targetVoice =
        availableVoices.find((v) => v.lang.toLowerCase() === bcpTag) ||
        availableVoices.find((v) => v.lang.toLowerCase().startsWith(langPrefix)) ||
        availableVoices.find((v) => v.lang.toLowerCase().includes(langPrefix)) ||
        null
    }

    if (targetVoice) {
      utterance.voice = targetVoice
      utterance.lang = targetVoice.lang
    } else {
      utterance.lang = currentLangObj.bcp47
    }

    utterance.onstart = () => {
      setSpeakingMessageId(msgId)
      setSpeechPaused(false)
    }
    utterance.onend = () => {
      setSpeakingMessageId(null)
      setSpeechPaused(false)
    }
    utterance.onerror = () => {
      setSpeakingMessageId(null)
      setSpeechPaused(false)
    }

    window.speechSynthesis.speak(utterance)
  }

  const handleStopSpeech = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }
    setSpeakingMessageId(null)
    setSpeechPaused(false)
  }

  // --- STT ---
  const handleToggleVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition

    if (!SpeechRecognition) {
      alert('Speech Recognition is not available in your browser. Use Google Chrome, Edge, or an Android browser for regional voice input.')
      return
    }

    if (isListening) {
      if (recognitionRef.current) recognitionRef.current.stop()
      setIsListening(false)
      setListeningStatus('')
      return
    }

    try {
      const recognition = new SpeechRecognition()
      recognitionRef.current = recognition
      recognition.lang = currentLangObj.bcp47
      recognition.interimResults = true
      recognition.continuous = false

      recognition.onstart = () => {
        setIsListening(true)
        setListeningStatus(`Listening in ${currentLangObj.native} (${currentLangObj.label})...`)
      }

      recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map((r) => r[0].transcript)
          .join('')
        setInputMessage(transcript)
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto'
          textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`
        }

        const isFinal = event.results[event.results.length - 1].isFinal
        if (isFinal) {
          setListeningStatus('Speech recognized. Tap send or edit message.')
          if (autoVoiceMode && transcript.trim()) {
            handleSendMessage(transcript.trim())
          }
        }
      }

      recognition.onerror = (event) => {
        setIsListening(false)
        if (event.error === 'not-allowed') {
          setListeningStatus('Microphone access was denied. Enable mic permissions in browser.')
        } else if (event.error === 'no-speech') {
          setListeningStatus('No speech was detected. Tap mic and speak again.')
        } else {
          setListeningStatus(`Voice recognition stopped (${event.error}).`)
        }
      }

      recognition.onend = () => {
        setIsListening(false)
      }

      recognition.start()
    } catch (err) {
      setIsListening(false)
      setListeningStatus('Microphone error: ' + err.message)
    }
  }

  // --- SEND MESSAGE / STREAM ---
  const handleSendMessage = async (customPrompt) => {
    const textToSend = (customPrompt || inputMessage).trim()
    if (!textToSend || isGenerating) return

    setInputMessage('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
    setChatError('')
    setIsGenerating(true)
    setStreamingDelta('')

    const tempUserMsg = {
      id: 'usr-' + Date.now(),
      role: 'user',
      content: textToSend,
      created_at: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, tempUserMsg])

    const abortController = new AbortController()
    abortControllerRef.current = abortController

    try {
      const payload = {
        conversationId: conversationId || undefined,
        message: textToSend,
        language: selectedLang,
        mode: answerMode,
        context: {
          farmer: profile ? {
            name: profile.name,
            village: profile.village,
            district: profile.district,
            state: profile.state,
            landSize: profile.landSize,
            landUnit: profile.landUnit,
            soil: profile.soil,
            water: profile.water,
            irrigation: profile.irrigation,
            budget: profile.budget,
          } : null,
          crops: crops || [],
        },
      }

      const res = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${effectiveToken}`,
        },
        body: JSON.stringify(payload),
        signal: abortController.signal,
      })

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}))
        throw new Error(errBody.error || `Server responded with status ${res.status}`)
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let fullReply = ''
      let buffer = ''

      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const events = buffer.split('\n\n')
        buffer = events.pop() || ''

        for (const rawEvent of events) {
          const lines = rawEvent.split('\n')
          const eventLine = lines.find((l) => l.startsWith('event: '))
          const dataLine = lines.find((l) => l.startsWith('data: '))
          if (!dataLine) continue

          const eventType = eventLine ? eventLine.slice(7).trim() : ''
          let dataObj = {}
          try {
            dataObj = JSON.parse(dataLine.slice(6))
          } catch {}

          if (eventType === 'conversation') {
            if (dataObj.conversationId && !conversationId) {
              setConversationId(dataObj.conversationId)
            }
          } else if (eventType === 'delta') {
            if (dataObj.text) {
              fullReply += dataObj.text
              setStreamingDelta(fullReply)
            }
          } else if (eventType === 'done') {
            if (dataObj.conversationId) {
              setConversationId(dataObj.conversationId)
            }
          } else if (eventType === 'error') {
            throw new Error(dataObj.error || 'Chat stream failed.')
          }
        }
      }

      const modelMsg = {
        id: 'mod-' + Date.now(),
        role: 'model',
        content: fullReply || 'Guidance completed.',
        created_at: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, modelMsg])
      setStreamingDelta('')
      fetchConversations()

      if (autoVoiceMode && fullReply) {
        handleSpeakMessage(modelMsg.id, fullReply)
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        notify('Response stopped by user')
        if (streamingDelta) {
          setMessages((prev) => [
            ...prev,
            { id: 'mod-' + Date.now(), role: 'model', content: streamingDelta, created_at: new Date().toISOString() },
          ])
          setStreamingDelta('')
        }
      } else {
        setChatError(err.message || 'Error communicating with agricultural AI.')
      }
    } finally {
      setIsGenerating(false)
      abortControllerRef.current = null
    }
  }

  const handleStopGenerating = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
  }

  const handleCopyText = (text, msgId) => {
    navigator.clipboard.writeText(text)
    setCopiedId(msgId)
    setTimeout(() => setCopiedId(null), 2000)
    notify('Copied to clipboard')
  }

  const handleToggleFeedback = (msgId, type) => {
    setMessageFeedback((prev) => ({
      ...prev,
      [msgId]: prev[msgId] === type ? null : type,
    }))
    notify(type === 'up' ? 'Helpful feedback recorded' : 'Feedback noted')
  }

  const handleRetryLast = () => {
    const lastUser = [...messages].reverse().find((m) => m.role === 'user')
    if (lastUser) {
      handleSendMessage(lastUser.content)
    }
  }

  // Pre-fill prompt from URL navigation state
  useEffect(() => {
    const prompt = location.state?.assistantPrompt
    if (prompt && typeof prompt === 'string') {
      setInputMessage(prompt)
      navigate(location.pathname, { replace: true, state: null })
      handleSendMessage(prompt)
    }
  }, [location.state])

  // Filter conversations
  const filteredConversations = useMemo(() => {
    return conversationList.filter((c) =>
      (c.title || '').toLowerCase().includes(historySearch.toLowerCase().trim())
    )
  }, [conversationList, historySearch])

  const groupedConversations = useMemo(() => {
    return groupConversationsByDate(filteredConversations)
  }, [filteredConversations])

  return (
    <div className="fs-chat-page-root">
      {/* Mobile Drawer Overlay */}
      {(mobileDrawerOpen || mobileContextOpen) && (
        <div
          className="fs-drawer-backdrop"
          onClick={() => {
            setMobileDrawerOpen(false)
            setMobileContextOpen(false)
          }}
        />
      )}

      {/* ========================================================
          1. LEFT SIDEBAR (History, Grouped Conversations, Actions)
          ======================================================== */}
      <aside className={`fs-sidebar ${sidebarCollapsed ? 'collapsed' : ''} ${mobileDrawerOpen ? 'mobile-open' : ''}`}>
        {/* Brand Row */}
        <div className="fs-sidebar-header">
          <div className="fs-sidebar-brand">
            <div className="fs-brand-logo">
              <img src="/favicon.svg" alt="Farm Saathi" className="fs-brand-svg" />
            </div>
            {!sidebarCollapsed && (
              <div className="fs-brand-meta">
                <span className="fs-brand-title">FARM-SATHI</span>
                <span className="fs-brand-badge">AI Assistant</span>
              </div>
            )}
          </div>
          <button
            type="button"
            className="fs-icon-btn fs-sidebar-toggle-btn"
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            aria-label="Toggle sidebar"
          >
            <IconSidebar className="fs-btn-svg" />
          </button>
        </div>

        {/* New Chat Button */}
        <div className="fs-sidebar-action-wrap">
          <button
            type="button"
            className="fs-new-chat-btn"
            onClick={handleStartNewChat}
            title="Start a new farming conversation"
          >
            <IconPlus className="fs-btn-svg" />
            {!sidebarCollapsed && <span>New Chat</span>}
          </button>
        </div>

        {/* Search Input */}
        {!sidebarCollapsed && (
          <div className="fs-search-box">
            <IconSearch className="fs-search-svg" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={historySearch}
              onChange={(e) => setHistorySearch(e.target.value)}
              aria-label="Search conversation history"
            />
            {historySearch && (
              <button
                type="button"
                className="fs-search-clear"
                onClick={() => setHistorySearch('')}
                aria-label="Clear search"
              >
                <IconClose className="fs-btn-svg-sm" />
              </button>
            )}
          </div>
        )}

        {/* History Grouped List */}
        <div className="fs-history-scrollable">
          {!sidebarCollapsed && (
            <>
              {filteredConversations.length === 0 ? (
                <div className="fs-empty-history">
                  <p>{conversationList.length === 0 ? 'No conversations yet' : 'No matching chats found'}</p>
                </div>
              ) : (
                <>
                  {groupedConversations.today.length > 0 && (
                    <div className="fs-history-group">
                      <div className="fs-group-label">Today</div>
                      {groupedConversations.today.map((c) => (
                        <div
                          key={c.id}
                          className={`fs-history-item ${c.id === conversationId ? 'active' : ''}`}
                          onClick={() => {
                            setConversationId(c.id)
                            setMobileDrawerOpen(false)
                          }}
                        >
                          <IconMessage className="fs-item-svg" />
                          <span className="fs-item-title" title={c.title || 'New conversation'}>
                            {c.title || 'New conversation'}
                          </span>
                          <button
                            type="button"
                            className="fs-item-delete"
                            title="Delete conversation"
                            onClick={(e) => handleDeleteConversation(c.id, e)}
                          >
                            <IconTrash className="fs-btn-svg-sm" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {groupedConversations.yesterday.length > 0 && (
                    <div className="fs-history-group">
                      <div className="fs-group-label">Yesterday</div>
                      {groupedConversations.yesterday.map((c) => (
                        <div
                          key={c.id}
                          className={`fs-history-item ${c.id === conversationId ? 'active' : ''}`}
                          onClick={() => {
                            setConversationId(c.id)
                            setMobileDrawerOpen(false)
                          }}
                        >
                          <IconMessage className="fs-item-svg" />
                          <span className="fs-item-title" title={c.title || 'New conversation'}>
                            {c.title || 'New conversation'}
                          </span>
                          <button
                            type="button"
                            className="fs-item-delete"
                            title="Delete conversation"
                            onClick={(e) => handleDeleteConversation(c.id, e)}
                          >
                            <IconTrash className="fs-btn-svg-sm" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {groupedConversations.previous7Days.length > 0 && (
                    <div className="fs-history-group">
                      <div className="fs-group-label">Previous 7 Days</div>
                      {groupedConversations.previous7Days.map((c) => (
                        <div
                          key={c.id}
                          className={`fs-history-item ${c.id === conversationId ? 'active' : ''}`}
                          onClick={() => {
                            setConversationId(c.id)
                            setMobileDrawerOpen(false)
                          }}
                        >
                          <IconMessage className="fs-item-svg" />
                          <span className="fs-item-title" title={c.title || 'New conversation'}>
                            {c.title || 'New conversation'}
                          </span>
                          <button
                            type="button"
                            className="fs-item-delete"
                            title="Delete conversation"
                            onClick={(e) => handleDeleteConversation(c.id, e)}
                          >
                            <IconTrash className="fs-btn-svg-sm" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {groupedConversations.older.length > 0 && (
                    <div className="fs-history-group">
                      <div className="fs-group-label">Older</div>
                      {groupedConversations.older.map((c) => (
                        <div
                          key={c.id}
                          className={`fs-history-item ${c.id === conversationId ? 'active' : ''}`}
                          onClick={() => {
                            setConversationId(c.id)
                            setMobileDrawerOpen(false)
                          }}
                        >
                          <IconMessage className="fs-item-svg" />
                          <span className="fs-item-title" title={c.title || 'New conversation'}>
                            {c.title || 'New conversation'}
                          </span>
                          <button
                            type="button"
                            className="fs-item-delete"
                            title="Delete conversation"
                            onClick={(e) => handleDeleteConversation(c.id, e)}
                          >
                            <IconTrash className="fs-btn-svg-sm" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>

        {/* Sidebar Footer */}
        <div className="fs-sidebar-footer">
          {conversationList.length > 0 && !sidebarCollapsed && (
            <button
              type="button"
              className="fs-clear-history-action"
              onClick={handleClearAllHistory}
            >
              <IconTrash className="fs-btn-svg-sm" />
              <span>Clear chat history</span>
            </button>
          )}

          <NavLink to="/" className="fs-back-dashboard-action" title="Back to Farm Dashboard">
            <IconArrowLeft className="fs-btn-svg-sm" />
            {!sidebarCollapsed && <span>Back to Dashboard</span>}
          </NavLink>
        </div>
      </aside>

      {/* ========================================================
          2. MAIN CHAT AREA (Header, Messages, Composer)
          ======================================================== */}
      <main className="fs-main-chat">
        {/* Header Bar */}
        <header className="fs-chat-header">
          <div className="fs-header-left">
            {/* Mobile menu trigger */}
            <button
              type="button"
              className="fs-icon-btn fs-mobile-menu-btn"
              onClick={() => setMobileDrawerOpen(true)}
              aria-label="Open conversation history"
            >
              <IconSidebar className="fs-btn-svg" />
            </button>

            <div className="fs-chat-title-block">
              <h1 className="fs-header-heading">FARM-SATHI Assistant</h1>
              <div className="fs-model-indicator">
                <span className="fs-live-dot" />
                <span className="fs-model-name">
                  {answerMode === 'deep'
                    ? 'Deep AI Mode'
                    : answerMode === 'quick'
                    ? 'Instant Knowledge'
                    : 'Auto-Routing · Gemini Grounded'}
                </span>
              </div>
            </div>
          </div>

          <div className="fs-header-actions">
            {/* Answer Mode Switcher Pill */}
            <div className="fs-mode-segmented-control" title="Choose AI Answer Mode">
              <button
                type="button"
                className={`fs-mode-btn ${answerMode === 'auto' ? 'active' : ''}`}
                onClick={() => setAnswerMode('auto')}
              >
                Auto
              </button>
              <button
                type="button"
                className={`fs-mode-btn ${answerMode === 'quick' ? 'active' : ''}`}
                onClick={() => setAnswerMode('quick')}
                title="Instant built-in farm advice (fast, no API needed)"
              >
                Quick
              </button>
              <button
                type="button"
                className={`fs-mode-btn ${answerMode === 'deep' ? 'active' : ''}`}
                onClick={() => setAnswerMode('deep')}
                title="Deep AI reasoning using Gemini model"
              >
                Deep AI
              </button>
            </div>

            {/* Settings Popover Trigger */}
            <div className="fs-popover-anchor" ref={settingsRef}>
              <button
                type="button"
                className={`fs-icon-btn ${settingsOpen ? 'active' : ''}`}
                onClick={() => setSettingsOpen(!settingsOpen)}
                title="Voice and language preferences"
                aria-label="Assistant settings"
              >
                <IconSliders className="fs-btn-svg" />
              </button>

              {/* Settings Dropdown Popover */}
              {settingsOpen && (
                <div className="fs-settings-popover">
                  <div className="fs-popover-title">Assistant Settings</div>

                  {/* Language Selection */}
                  <div className="fs-setting-row">
                    <label htmlFor="fs-lang-select">Language</label>
                    <select
                      id="fs-lang-select"
                      value={selectedLang}
                      onChange={(e) => setSelectedLang(e.target.value)}
                    >
                      {ASSISTANT_LANGUAGES.map((l) => (
                        <option key={l.code} value={l.code}>
                          {l.native} ({l.label})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Speech Rate */}
                  <div className="fs-setting-row">
                    <label htmlFor="fs-speed-select">Voice Speed</label>
                    <select
                      id="fs-speed-select"
                      value={speechSpeed}
                      onChange={(e) => setSpeechSpeed(Number(e.target.value))}
                    >
                      <option value={0.8}>0.8x (Slower)</option>
                      <option value={1.0}>1.0x (Normal)</option>
                      <option value={1.2}>1.2x (Faster)</option>
                    </select>
                  </div>

                  {/* Voice Selection (if supported by browser) */}
                  {availableVoices.length > 0 && (
                    <div className="fs-setting-row">
                      <label htmlFor="fs-voice-select">Synthesizer Voice</label>
                      <select
                        id="fs-voice-select"
                        value={selectedVoiceUri}
                        onChange={(e) => setSelectedVoiceUri(e.target.value)}
                      >
                        <option value="">Default Regional Voice</option>
                        {availableVoices
                          .filter((v) => {
                            const bcp = currentLangObj.bcp47.toLowerCase()
                            const prefix = currentLangObj.code.toLowerCase()
                            return (
                              v.lang.toLowerCase().includes(prefix) ||
                              v.lang.toLowerCase() === bcp ||
                              v.lang.toLowerCase().startsWith('en')
                            )
                          })
                          .slice(0, 10)
                          .map((v) => (
                            <option key={v.voiceURI} value={v.voiceURI}>
                              {v.name} ({v.lang})
                            </option>
                          ))}
                      </select>
                    </div>
                  )}

                  {/* Auto-Voice Mode Toggle */}
                  <div className="fs-setting-toggle-row">
                    <div>
                      <div className="fs-toggle-label">Hands-free Auto-Voice</div>
                      <div className="fs-toggle-sub">Automatically speak replies aloud</div>
                    </div>
                    <button
                      type="button"
                      className={`fs-switch ${autoVoiceMode ? 'checked' : ''}`}
                      onClick={() => setAutoVoiceMode(!autoVoiceMode)}
                      role="switch"
                      aria-checked={autoVoiceMode}
                    >
                      <span className="fs-switch-knob" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Right Context Panel Toggle */}
            <button
              type="button"
              className={`fs-icon-btn ${contextPanelOpen ? 'active' : ''}`}
              onClick={() => {
                setContextPanelOpen(!contextPanelOpen)
                setMobileContextOpen(!mobileContextOpen)
              }}
              title={contextPanelOpen ? 'Hide Farm Context Panel' : 'Show Farm Context Panel'}
              aria-label="Toggle farm context panel"
            >
              <IconPanel className="fs-btn-svg" />
            </button>
          </div>
        </header>

        {/* Banners */}
        {chatNotice && <div className="fs-alert-banner notice">{chatNotice}</div>}
        {chatError && <div className="fs-alert-banner error">{chatError}</div>}

        {/* Messages Stream Container */}
        <div className="fs-conversation-viewport">
          {messages.length === 0 && !streamingDelta ? (
            /* ========================================================
               3. WELCOME SCREEN (When no conversation started)
               ======================================================== */
            <div className="fs-welcome-hero">
              <div className="fs-welcome-badge">
                <IconSprout className="fs-welcome-badge-svg" />
                <span>Agricultural AI Assistant</span>
              </div>
              <h2 className="fs-welcome-title">Your Smart Farming Companion</h2>
              <p className="fs-welcome-subtitle">
                Ask anything about your farm. Get useful guidance based on your actual farm data.
              </p>

              {/* Four Suggestion Cards required by prompt */}
              <div className="fs-suggestions-grid">
                {WELCOME_SUGGESTIONS.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className="fs-suggestion-card"
                    onClick={() => handleSendMessage(item.title)}
                  >
                    <div className="fs-suggestion-icon-wrap">{item.icon}</div>
                    <div className="fs-suggestion-text-wrap">
                      <div className="fs-suggestion-card-title">{item.title}</div>
                      <div className="fs-suggestion-card-desc">{item.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* ========================================================
               4. CONVERSATION MESSAGES
               ======================================================== */
            <div className="fs-messages-flow">
              {messages.map((m) => (
                <div key={m.id} className={`fs-turn-row ${m.role === 'user' ? 'farmer' : 'assistant'}`}>
                  {m.role === 'model' && (
                    <div className="fs-turn-avatar assistant">
                      <IconSprout className="fs-avatar-svg" />
                    </div>
                  )}

                  <div className="fs-turn-content">
                    <div className="fs-turn-bubble">
                      {m.role === 'user' ? (
                        <p className="fs-user-message-text">{m.content}</p>
                      ) : (
                        <MarkdownRenderer text={m.content} />
                      )}
                    </div>

                    {/* Action Buttons under Assistant Messages */}
                    {m.role === 'model' && (
                      <div className="fs-turn-actions">
                        {/* Copy */}
                        <button
                          type="button"
                          className="fs-action-pill"
                          onClick={() => handleCopyText(m.content, m.id)}
                          title="Copy response to clipboard"
                        >
                          {copiedId === m.id ? (
                            <>
                              <IconCheck className="fs-action-svg text-green" />
                              <span>Copied</span>
                            </>
                          ) : (
                            <>
                              <IconCopy className="fs-action-svg" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>

                        {/* Listen (TTS) */}
                        <button
                          type="button"
                          className={`fs-action-pill ${speakingMessageId === m.id ? 'active-audio' : ''}`}
                          onClick={() => handleSpeakMessage(m.id, m.content)}
                          title="Listen with text-to-speech"
                        >
                          {speakingMessageId === m.id ? (
                            speechPaused ? (
                              <>
                                <IconPlay className="fs-action-svg" />
                                <span>Resume</span>
                              </>
                            ) : (
                              <>
                                <IconPause className="fs-action-svg" />
                                <span>Pause</span>
                              </>
                            )
                          ) : (
                            <>
                              <IconSpeaker className="fs-action-svg" />
                              <span>Listen</span>
                            </>
                          )}
                        </button>

                        {speakingMessageId === m.id && (
                          <button
                            type="button"
                            className="fs-action-pill"
                            onClick={handleStopSpeech}
                            title="Stop audio playback"
                          >
                            <IconStop className="fs-action-svg" />
                            <span>Stop</span>
                          </button>
                        )}

                        {/* Regenerate */}
                        <button
                          type="button"
                          className="fs-action-pill"
                          onClick={handleRetryLast}
                          title="Regenerate this response"
                        >
                          <IconRotate className="fs-action-svg" />
                          <span>Regenerate</span>
                        </button>

                        {/* Feedback (Thumbs Up / Down) */}
                        <div className="fs-feedback-group">
                          <button
                            type="button"
                            className={`fs-feedback-btn ${messageFeedback[m.id] === 'up' ? 'active-up' : ''}`}
                            onClick={() => handleToggleFeedback(m.id, 'up')}
                            title="Helpful response"
                          >
                            <IconThumbUp className="fs-action-svg" />
                          </button>
                          <button
                            type="button"
                            className={`fs-feedback-btn ${messageFeedback[m.id] === 'down' ? 'active-down' : ''}`}
                            onClick={() => handleToggleFeedback(m.id, 'down')}
                            title="Not helpful"
                          >
                            <IconThumbDown className="fs-action-svg" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Streaming Active Output */}
              {streamingDelta && (
                <div className="fs-turn-row assistant streaming">
                  <div className="fs-turn-avatar assistant">
                    <IconSprout className="fs-avatar-svg" />
                  </div>
                  <div className="fs-turn-content">
                    <div className="fs-turn-bubble">
                      <MarkdownRenderer text={streamingDelta} />
                      <span className="fs-streaming-cursor" />
                    </div>
                  </div>
                </div>
              )}

              {/* Thinking / Grounding State */}
              {isGenerating && !streamingDelta && (
                <div className="fs-turn-row assistant thinking">
                  <div className="fs-turn-avatar assistant">
                    <IconSprout className="fs-avatar-svg" />
                  </div>
                  <div className="fs-turn-content">
                    <div className="fs-thinking-box">
                      <span className="fs-typing-dots">
                        <span />
                        <span />
                        <span />
                      </span>
                      <span className="fs-thinking-text">
                        Reviewing your soil records, plant status, and weather...
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Floating Stop Generating Button */}
        {isGenerating && (
          <div className="fs-stop-generating-container">
            <button
              type="button"
              className="fs-stop-btn"
              onClick={handleStopGenerating}
              title="Stop generation"
            >
              <IconStop className="fs-btn-svg-sm" />
              <span>Stop generating</span>
            </button>
          </div>
        )}

        {/* ========================================================
            5. MESSAGE COMPOSER (Fixed bottom-aligned rounded dock)
            ======================================================== */}
        <footer className="fs-composer-dock">
          {/* Audio recording status waveform */}
          {listeningStatus && (
            <div className={`fs-voice-status-bar ${isListening ? 'active-recording' : ''}`}>
              <div className="fs-voice-waveform">
                <span className="fs-wave-bar" />
                <span className="fs-wave-bar" />
                <span className="fs-wave-bar" />
                <span className="fs-wave-bar" />
                <span className="fs-wave-bar" />
              </div>
              <span className="fs-voice-text">{listeningStatus}</span>
            </div>
          )}

          <form
            className="fs-composer-form"
            onSubmit={(e) => {
              e.preventDefault()
              handleSendMessage()
            }}
          >
            {/* Language indicator pill */}
            <div
              className="fs-composer-lang-pill"
              onClick={() => setSettingsOpen(true)}
              title="Click to change language or voice settings"
            >
              <span>{currentLangObj.native}</span>
            </div>

            {/* Multiline auto-expanding textarea */}
            <textarea
              ref={textareaRef}
              rows={1}
              value={inputMessage}
              onChange={handleInputChange}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSendMessage()
                }
              }}
              placeholder={`Ask in ${currentLangObj.native} or English (e.g., "Analyze my soil", "What should I sow?")...`}
              disabled={isGenerating}
              className="fs-composer-textarea"
            />

            {/* Microphone Button */}
            <button
              type="button"
              className={`fs-composer-btn mic ${isListening ? 'recording' : ''}`}
              onClick={handleToggleVoiceInput}
              title={
                isListening
                  ? 'Stop voice recording'
                  : `Tap to speak in ${currentLangObj.native} (${currentLangObj.label})`
              }
              aria-label="Voice input"
            >
              <IconMic className="fs-btn-svg" />
            </button>

            {/* Send Button */}
            <button
              type="submit"
              className="fs-composer-btn send"
              disabled={!inputMessage.trim() || isGenerating}
              title="Send message"
              aria-label="Send message"
            >
              <IconSend className="fs-btn-svg" />
            </button>
          </form>

          <div className="fs-composer-footnote">
            FARM-SATHI AI answers are grounded in your real soil tests, crop diagnoses, and live Open-Meteo weather.
          </div>
        </footer>
      </main>

      {/* ========================================================
          6. RIGHT CONTEXT PANEL (Live Authenticated Farmer Data)
          ======================================================== */}
      <aside className={`fs-context-panel ${contextPanelOpen ? 'open' : 'closed'} ${mobileContextOpen ? 'mobile-open' : ''}`}>
        <div className="fs-context-header">
          <div className="fs-context-header-title">
            <IconSprout className="fs-header-svg" />
            <span>Farm Context</span>
          </div>
          <div className="fs-context-header-actions">
            <button
              type="button"
              className={`fs-icon-btn ${contextLoading ? 'spinning' : ''}`}
              onClick={fetchFarmerContext}
              title="Refresh farm records"
              aria-label="Refresh farm records"
            >
              <IconRefresh className="fs-btn-svg-sm" />
            </button>
            <button
              type="button"
              className="fs-icon-btn fs-context-close-btn"
              onClick={() => {
                setContextPanelOpen(false)
                setMobileContextOpen(false)
              }}
              title="Close panel"
              aria-label="Close panel"
            >
              <IconClose className="fs-btn-svg-sm" />
            </button>
          </div>
        </div>

        <div className="fs-context-body">
          {/* 1. Farmer Profile Card */}
          <section className="fs-context-card">
            <div className="fs-card-label">
              <IconUser className="fs-card-svg" />
              <span>Farmer Profile</span>
            </div>
            <div className="fs-card-content">
              <div className="fs-kv-row">
                <span className="fs-k">Farmer</span>
                <span className="fs-v font-semibold">{user?.name || profile?.name || 'Farmer'}</span>
              </div>
              <div className="fs-kv-row">
                <span className="fs-k">Location</span>
                <span className="fs-v">{profile?.village ? `${profile.village}, ${profile.district || ''}` : profile?.district || 'Not recorded'}</span>
              </div>
              <div className="fs-kv-row">
                <span className="fs-k">Farm Size</span>
                <span className="fs-v">{profile?.landSize ? `${profile.landSize} ${profile.landUnit || 'acres'}` : 'Not recorded'}</span>
              </div>
              <div className="fs-kv-row">
                <span className="fs-k">Soil Profile</span>
                <span className="fs-v">{profile?.soil || 'Not recorded'}</span>
              </div>
              <div className="fs-kv-row">
                <span className="fs-k">Water Source</span>
                <span className="fs-v">{profile?.water || 'Not specified'}</span>
              </div>
            </div>
          </section>

          {/* 2. Current Live Weather */}
          <section className="fs-context-card">
            <div className="fs-card-label">
              <IconCloudSun className="fs-card-svg" />
              <span>Live Weather (Open-Meteo)</span>
            </div>
            <div className="fs-card-content">
              {liveWeather ? (
                <>
                  <div className="fs-weather-stat-row">
                    <div className="fs-weather-big-temp">{liveWeather.tempMax}°C</div>
                    <div className="fs-weather-stat-meta">
                      <div>Min: {liveWeather.tempMin}°C</div>
                      <div>Rain: {liveWeather.precipitationMm} mm ({liveWeather.precipitationProb}%)</div>
                    </div>
                  </div>
                  <div className="fs-weather-sub">
                    Wind: {liveWeather.windSpeedMax} km/h · Coordinates grounded
                  </div>
                </>
              ) : (
                <div className="fs-empty-card-note">
                  Weather forecast temporarily unavailable for this location.
                </div>
              )}
            </div>
          </section>

          {/* 3. Registered Crops */}
          <section className="fs-context-card">
            <div className="fs-card-label">
              <IconSprout className="fs-card-svg" />
              <span>Registered Crops ({activeCropCycles.length || crops?.length || 0})</span>
            </div>
            <div className="fs-card-content">
              {activeCropCycles.length > 0 ? (
                <div className="fs-mini-list">
                  {activeCropCycles.map((c) => (
                    <div key={c.id} className="fs-mini-list-item">
                      <div className="fs-item-primary">{c.crop_name} {c.crop_variety ? `(${c.crop_variety})` : ''}</div>
                      <div className="fs-item-secondary">
                        Sown: {c.sowing_date || 'N/A'} · Stage {c.current_stage_index || 1}
                      </div>
                    </div>
                  ))}
                </div>
              ) : crops && crops.length > 0 ? (
                <div className="fs-mini-list">
                  {crops.map((c, i) => (
                    <div key={i} className="fs-mini-list-item">
                      <div className="fs-item-primary">{c.name}</div>
                      <div className="fs-item-secondary">{c.variety || 'Standard'}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="fs-empty-card-note">
                  No active crops registered yet.{' '}
                  <NavLink to="/crop-growth" className="fs-card-link">Add a crop →</NavLink>
                </div>
              )}
            </div>
          </section>

          {/* 4. Latest Soil Analysis */}
          <section className="fs-context-card">
            <div className="fs-card-label">
              <IconSoil className="fs-card-svg" />
              <span>Latest Soil Analysis</span>
            </div>
            <div className="fs-card-content">
              {latestSoil ? (
                <>
                  <div className="fs-kv-row">
                    <span className="fs-k">Predicted Type</span>
                    <span className="fs-v font-semibold text-green">{latestSoil.predicted_class}</span>
                  </div>
                  <div className="fs-kv-row">
                    <span className="fs-k">Confidence</span>
                    <span className="fs-v">{Math.round((Number(latestSoil.confidence) || 0) * 100)}%</span>
                  </div>
                  <div className="fs-kv-row">
                    <span className="fs-k">Date</span>
                    <span className="fs-v">{String(latestSoil.created_at || '').slice(0, 10)}</span>
                  </div>
                  <NavLink to="/smart-water" className="fs-card-link">View full soil report →</NavLink>
                </>
              ) : (
                <div className="fs-empty-card-note">
                  No soil photo analyzed yet.{' '}
                  <NavLink to="/smart-water" className="fs-card-link">Analyze soil →</NavLink>
                </div>
              )}
            </div>
          </section>

          {/* 5. Latest Plant Diagnosis */}
          <section className="fs-context-card">
            <div className="fs-card-label">
              <IconStethoscope className="fs-card-svg" />
              <span>Latest Plant Diagnosis</span>
            </div>
            <div className="fs-card-content">
              {latestPlant ? (
                <>
                  <div className="fs-kv-row">
                    <span className="fs-k">Crop</span>
                    <span className="fs-v">{latestPlant.crop_name || 'Field leaf'}</span>
                  </div>
                  <div className="fs-kv-row">
                    <span className="fs-k">Condition</span>
                    <span className="fs-v font-semibold">{latestPlant.disease_name}</span>
                  </div>
                  <div className="fs-kv-row">
                    <span className="fs-k">Confidence</span>
                    <span className="fs-v">{latestPlant.confidence}%</span>
                  </div>
                  <div className="fs-kv-row">
                    <span className="fs-k">Severity</span>
                    <span className="fs-v">{latestPlant.severity || 'Medium'}</span>
                  </div>
                  <NavLink to="/crop-doctor" className="fs-card-link">View remedies in Crop Doctor →</NavLink>
                </>
              ) : (
                <div className="fs-empty-card-note">
                  No plant leaf diagnosed yet.{' '}
                  <NavLink to="/crop-doctor" className="fs-card-link">Scan plant leaf →</NavLink>
                </div>
              )}
            </div>
          </section>

          {/* 6. Today's Calendar Tasks */}
          <section className="fs-context-card">
            <div className="fs-card-label">
              <IconCalendar className="fs-card-svg" />
              <span>Today's Farm Tasks ({todayTasks.length})</span>
            </div>
            <div className="fs-card-content">
              {overdueTasksCount > 0 && (
                <div className="fs-overdue-alert">
                  ⚠️ {overdueTasksCount} overdue activity{overdueTasksCount > 1 ? 'ies' : ''}
                </div>
              )}
              {todayTasks.length > 0 ? (
                <div className="fs-mini-list">
                  {todayTasks.map((t) => (
                    <div key={t.id} className="fs-mini-list-item">
                      <div className="fs-item-primary">{t.title}</div>
                      <div className="fs-item-secondary">
                        {t.crop_name ? `${t.crop_name} · ` : ''}{t.activity_type || 'Field work'}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="fs-empty-card-note">
                  No pending tasks for today.{' '}
                  <NavLink to="/calendar" className="fs-card-link">Open Farm Calendar →</NavLink>
                </div>
              )}
            </div>
          </section>
        </div>
      </aside>
    </div>
  )
}
