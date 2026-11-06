import React from 'react'

export function IconBrandLogo({ size = 28, ...props }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="6" r="3" fill="#facc15" stroke="#ca8a04" strokeWidth="1.5" />
      <path d="M12 21V12" stroke="#15803d" strokeWidth="2.5" />
      <path d="M12 16c-3-2.5-7-2-7.5 1.5 3 0 6 .5 7.5-1.5z" fill="#22c55e" stroke="#16a34a" />
      <path d="M12 13c3-2.5 7-2 7.5 1.5-3 0-6 .5-7.5-1.5z" fill="#86efac" stroke="#16a34a" />
    </svg>
  )
}

export function IconDashboard({ size = 18, ...props }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="3" y="3" width="7" height="9" rx="1.5" fill="currentColor" fillOpacity="0.15" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" fill="currentColor" fillOpacity="0.15" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
      <circle cx="6.5" cy="7.5" r="1" fill="currentColor" />
      <circle cx="17.5" cy="16.5" r="1" fill="currentColor" />
    </svg>
  )
}

export function IconFarmerLogin({ size = 18, ...props }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="3" y="10" width="18" height="12" rx="3" fill="currentColor" fillOpacity="0.12" />
      <path d="M7 10V6.5a5 5 0 0 1 10 0V10" />
      <circle cx="12" cy="15" r="1.5" fill="currentColor" />
      <path d="M12 16.5v2.5" />
      <path d="M17 14l1.5 1.5 2.5-2.5" strokeWidth="2" stroke="#22c55e" />
    </svg>
  )
}

export function IconMyFarm({ size = 18, ...props }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M3 21h18" />
      <path d="M3 12l4.5-3.5 4.5 3.5v8H3v-8z" fill="currentColor" fillOpacity="0.15" />
      <path d="M6 21v-4h3v4" />
      <path d="M14 9l4-3 4 3v11h-8" />
      <path d="M18 13v3" />
      <circle cx="18" cy="5" r="1.5" fill="#facc15" stroke="none" />
      <path d="M12 21c2-1 4-1 6 0" />
    </svg>
  )
}

export function IconCropPlanner({ size = 18, ...props }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="3" y="3" width="18" height="18" rx="2.5" />
      <path d="M9 3v18" />
      <path d="M15 3v18" />
      <path d="M3 9h18" />
      <path d="M3 15h18" />
      <circle cx="6" cy="6" r="1.2" fill="#22c55e" stroke="none" />
      <circle cx="12" cy="12" r="1.2" fill="#facc15" stroke="none" />
      <circle cx="18" cy="18" r="1.2" fill="#38bdf8" stroke="none" />
    </svg>
  )
}

export function IconCropGrowth({ size = 18, ...props }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 22V9" strokeWidth="2.5" />
      <path d="M12 15c-3-2-6-1.5-6.5 1.5 2.5 0 5 .5 6.5-1.5z" fill="currentColor" fillOpacity="0.25" />
      <path d="M12 12c3-2 6-1.5 6.5 1.5-2.5 0-5 .5-6.5-1.5z" fill="currentColor" fillOpacity="0.25" />
      <path d="M12 6c-2-2-4-2-4.5.5 1.8 0 3.2.5 4.5-.5z" />
      <path d="M12 6c2-2 4-2 4.5.5-1.8 0-3.2.5-4.5-.5z" />
      <path d="M16 3h5v5" stroke="#22c55e" strokeWidth="2.2" />
      <path d="M21 3l-6 6" stroke="#22c55e" strokeWidth="2.2" />
    </svg>
  )
}

export function IconCropDoctor({ size = 18, ...props }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 21s8-4.5 8-10.5V5l-8-3-8 3v5.5C4 16.5 12 21 12 21z" fill="currentColor" fillOpacity="0.12" />
      <path d="M12 8v7" strokeWidth="2.5" stroke="#ef4444" />
      <path d="M8.5 11.5h7" strokeWidth="2.5" stroke="#ef4444" />
      <path d="M16 17c1.5-1 3.5 0 3.5 2" stroke="#22c55e" />
    </svg>
  )
}

export function IconWaterSoil({ size = 18, ...props }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 2.69l4.95 4.95a7 7 0 1 1-9.9 0L12 2.69z" fill="#38bdf8" fillOpacity="0.25" stroke="#0284c7" />
      <path d="M4 17c2.5-1 5-1 7.5 0s5 1 8.5 0" stroke="#16a34a" />
      <path d="M4 21c2.5-1 5-1 7.5 0s5 1 8.5 0" stroke="#ca8a04" />
      <circle cx="12" cy="11" r="1.5" fill="#0284c7" stroke="none" />
    </svg>
  )
}

export function IconWeather({ size = 18, ...props }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="10" r="4" fill="#facc15" fillOpacity="0.25" stroke="#eab308" />
      <path d="M12 2v2" stroke="#eab308" />
      <path d="M12 18v2" stroke="#eab308" />
      <path d="M4 10H2" stroke="#eab308" />
      <path d="M22 10h-2" stroke="#eab308" />
      <path d="M6.34 4.34l1.42 1.42" stroke="#eab308" />
      <path d="M16.24 14.24l1.42 1.42" stroke="#eab308" />
      <path d="M6.34 15.66l1.42-1.42" stroke="#eab308" />
      <path d="M16.24 5.76l1.42-1.42" stroke="#eab308" />
      <path d="M15 15a3.5 3.5 0 0 1 6 2.5 3.5 3.5 0 0 1-3.5 3.5h-8a3.5 3.5 0 0 1-.5-6.9 4 4 0 0 1 6 .9" fill="currentColor" fillOpacity="0.1" />
    </svg>
  )
}

export function IconFarmCalendar({ size = 18, ...props }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="3" y="4" width="18" height="18" rx="2.5" fill="currentColor" fillOpacity="0.1" />
      <path d="M16 2v4" stroke="#16a34a" />
      <path d="M8 2v4" stroke="#16a34a" />
      <path d="M3 10h18" />
      <circle cx="8" cy="14" r="1.2" fill="#22c55e" stroke="none" />
      <circle cx="12" cy="14" r="1.2" fill="currentColor" />
      <circle cx="16" cy="14" r="1.2" fill="currentColor" />
      <circle cx="8" cy="18" r="1.2" fill="currentColor" />
      <circle cx="12" cy="18" r="1.2" fill="#facc15" stroke="none" />
      <circle cx="16" cy="18" r="1.2" fill="currentColor" />
    </svg>
  )
}

export function IconMandiPrices({ size = 18, ...props }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 3v18" strokeWidth="2" />
      <path d="M6 7l6-2 6 2" strokeWidth="2" />
      <path d="M3 13l3-6 3 6a3 3 0 0 1-6 0z" fill="currentColor" fillOpacity="0.2" />
      <path d="M15 13l3-6 3 6a3 3 0 0 1-6 0z" fill="currentColor" fillOpacity="0.2" />
      <path d="M8 21h8" strokeWidth="2.5" />
    </svg>
  )
}

export function IconExpenses({ size = 18, ...props }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M4 2v20l3-2 3 2 3-2 3 2 4-2V2H4z" fill="currentColor" fillOpacity="0.1" />
      <path d="M8 7h8" stroke="#16a34a" />
      <path d="M8 11h8" />
      <path d="M8 15h5" />
    </svg>
  )
}

export function IconBudget({ size = 18, ...props }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z" fill="currentColor" fillOpacity="0.1" />
      <path d="M16 7V5a2 2 0 0 0-2-2H4" />
      <circle cx="17.5" cy="14" r="1.8" fill="#facc15" stroke="#ca8a04" />
      <path d="M8 14h3" />
    </svg>
  )
}

export function IconSchemes({ size = 18, ...props }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M2 9h20" />
      <path d="M12 2L2 7h20L12 2z" fill="currentColor" fillOpacity="0.2" />
      <path d="M4 9v9" strokeWidth="2.5" />
      <path d="M9 9v9" strokeWidth="2.5" />
      <path d="M15 9v9" strokeWidth="2.5" />
      <path d="M20 9v9" strokeWidth="2.5" />
      <path d="M2 18h20" />
      <path d="M1 21h22" strokeWidth="2.5" />
      <circle cx="12" cy="5.5" r="1" fill="#facc15" stroke="none" />
    </svg>
  )
}

export function IconLoans({ size = 18, ...props }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="2" y="5" width="20" height="14" rx="2.5" fill="currentColor" fillOpacity="0.1" />
      <path d="M2 10h20" />
      <path d="M6 15h4" stroke="#16a34a" />
      <circle cx="17" cy="14.5" r="2" fill="#facc15" stroke="#ca8a04" />
    </svg>
  )
}

export function IconInsurance({ size = 18, ...props }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="currentColor" fillOpacity="0.14" />
      <path d="M12 11v6" stroke="#22c55e" strokeWidth="2" />
      <path d="M12 13c-2-1.5-4-1-4.5 1 1.8 0 3.2.5 4.5-1z" fill="#22c55e" stroke="none" />
      <path d="M12 11c2-1.5 4-1 4.5 1-1.8 0-3.2.5-4.5-1z" fill="#86efac" stroke="none" />
    </svg>
  )
}

export function IconAiAssistant({ size = 18, ...props }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="4" y="8" width="16" height="12" rx="3" fill="currentColor" fillOpacity="0.12" />
      <path d="M12 2v6" stroke="#38bdf8" />
      <circle cx="12" cy="2" r="1.5" fill="#38bdf8" stroke="none" />
      <circle cx="9" cy="13" r="1.5" fill="#22c55e" stroke="none" />
      <circle cx="15" cy="13" r="1.5" fill="#22c55e" stroke="none" />
      <path d="M9.5 17h5" stroke="#38bdf8" />
      <path d="M2 13h2" />
      <path d="M20 13h2" />
    </svg>
  )
}

export function IconVoiceAssistant({ size = 18, ...props }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" fill="#38bdf8" fillOpacity="0.25" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" stroke="#38bdf8" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  )
}

export function IconAlerts({ size = 18, ...props }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" fill="currentColor" fillOpacity="0.1" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="#facc15" strokeWidth="2.2" />
      <circle cx="18" cy="4" r="3" fill="#ef4444" stroke="#ffffff" strokeWidth="1.5" />
    </svg>
  )
}

export function IconProfile({ size = 18, ...props }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" fill="currentColor" fillOpacity="0.15" />
      <circle cx="12" cy="7" r="4" fill="currentColor" fillOpacity="0.2" />
      <path d="M7 4.5c2.5-1.8 7.5-1.8 10 0" stroke="#facc15" strokeWidth="2" />
    </svg>
  )
}

export function IconSearch({ size = 16, ...props }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="11" cy="11" r="8" />
      <path d="M21 21l-4.35-4.35" />
    </svg>
  )
}

export function IconLocation({ size = 14, ...props }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7z" fill="currentColor" fillOpacity="0.15" />
      <circle cx="12" cy="9" r="2.5" fill="currentColor" />
    </svg>
  )
}

export function IconSun({ size = 16, ...props }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="#facc15" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="5" fill="#facc15" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  )
}

export function IconMoon({ size = 16, ...props }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="#93c5fd" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" fill="#93c5fd" fillOpacity="0.3" />
    </svg>
  )
}

export function IconSoil({ size = 20, ...props }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 3v9" stroke="#16a34a" strokeWidth="2.2" />
      <path d="M12 6c-2-2-4.5-1.5-5 1 2 0 4 .5 5-1z" fill="#22c55e" stroke="none" />
      <path d="M12 4.5c2-2 4.5-1.5 5 1-2 0-4 .5-5-1z" fill="#86efac" stroke="none" />
      <path d="M3 15c2-1 4-1 6 0s4 1 6 0 4-1 6 0" stroke="#ca8a04" strokeWidth="2" />
      <path d="M3 19c2-1 4-1 6 0s4 1 6 0 4-1 6 0" stroke="#854d0e" strokeWidth="2" />
    </svg>
  )
}

export function IconSprout({ size = 18, ...props }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 21V10" stroke="#16a34a" strokeWidth="2.2" />
      <path d="M12 14c-3-2.5-6.5-1.8-7 1.5 3 0 5.5.5 7-1.5z" fill="#22c55e" stroke="#15803d" />
      <path d="M12 11c3-2.5 6.5-1.8 7 1.5-3 0-5.5.5-7-1.5z" fill="#86efac" stroke="#15803d" />
      <circle cx="12" cy="7" r="1.5" fill="#facc15" stroke="none" />
    </svg>
  )
}

export function IconLand({ size = 18, ...props }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" fill="currentColor" fillOpacity="0.1" />
      <line x1="9" y1="3" x2="9" y2="18" stroke="#16a34a" />
      <line x1="15" y1="6" x2="15" y2="21" stroke="#16a34a" />
    </svg>
  )
}

export function IconChecklist({ size = 18, ...props }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="3" y="4" width="18" height="18" rx="2.5" fill="currentColor" fillOpacity="0.1" />
      <path d="M7 10l2 2 4-4" stroke="#22c55e" strokeWidth="2.5" />
      <path d="M15 11h2" />
      <path d="M7 16l2 2 4-4" stroke="#22c55e" strokeWidth="2.5" />
      <path d="M15 17h2" />
    </svg>
  )
}

export function IconHealthScore({ size = 18, ...props }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" fill="#ef4444" fillOpacity="0.15" stroke="#ef4444" />
      <polyline points="22 12 18 12 15 9 13 15 11 11 9 12 2 12" stroke="#22c55e" strokeWidth="2" />
    </svg>
  )
}
