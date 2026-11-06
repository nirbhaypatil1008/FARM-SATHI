/**
 * Weather Advisory & Agricultural Conflict Detection Engine
 * Integrates Open-Meteo live forecasts to analyze planned farm activities
 * and generate actionable rescheduling suggestions.
 */

export async function fetchFarmWeather(location) {
  const loc = (location || '').trim() || 'Mandya, Karnataka'
  try {
    const geoRes = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(loc)}&count=1&language=en&format=json`,
      { headers: { 'User-Agent': 'FARM-SATHI/2.0' }, signal: AbortSignal.timeout(6000) }
    )
    if (!geoRes.ok) throw new Error(`Geocoding failed with status ${geoRes.status}`)
    const geoData = await geoRes.json()
    if (!geoData.results || !geoData.results.length) {
      throw new Error(`Location '${loc}' not found. Check district or village name.`)
    }
    const place = geoData.results[0]
    const { latitude, longitude, name, admin1, country } = place

    const query = new URLSearchParams({
      latitude: String(latitude),
      longitude: String(longitude),
      daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max',
      current: 'temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m',
      timezone: 'auto',
      forecast_days: '7',
    })

    const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?${query}`, {
      headers: { 'User-Agent': 'FARM-SATHI/2.0' },
      signal: AbortSignal.timeout(6000),
    })
    if (!weatherRes.ok) throw new Error(`Weather forecast failed with status ${weatherRes.status}`)
    const weatherData = await weatherRes.json()

    const dailyForecast = (weatherData.daily?.time || []).map((date, idx) => ({
      date,
      weatherCode: weatherData.daily.weather_code?.[idx] ?? 0,
      tempMax: weatherData.daily.temperature_2m_max?.[idx] ?? 30,
      tempMin: weatherData.daily.temperature_2m_min?.[idx] ?? 20,
      precipitationMm: weatherData.daily.precipitation_sum?.[idx] ?? 0,
      precipitationProb: weatherData.daily.precipitation_probability_max?.[idx] ?? 0,
      windSpeedMax: weatherData.daily.wind_speed_10m_max?.[idx] ?? 10,
    }))

    return {
      place: { name, state: admin1, country, latitude, longitude },
      current: weatherData.current || {},
      daily: dailyForecast,
      fetchedAt: new Date().toISOString(),
    }
  } catch (err) {
    console.warn('Live weather lookup failed, using seasonal estimate fallback:', err.message)
    // Safe seasonal fallback if offline
    const today = new Date()
    const fallbackDays = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today.getTime() + i * 86400000).toISOString().slice(0, 10)
      return {
        date: d,
        weatherCode: 1,
        tempMax: 31,
        tempMin: 21,
        precipitationMm: 0,
        precipitationProb: 10,
        windSpeedMax: 11,
      }
    })
    return {
      place: { name: loc, state: 'Karnataka', country: 'India', latitude: 12.52, longitude: 76.89 },
      current: { temperature_2m: 28, relative_humidity_2m: 65, precipitation: 0, weather_code: 1, wind_speed_10m: 10 },
      daily: fallbackDays,
      fetchedAt: new Date().toISOString(),
      isFallback: true,
    }
  }
}

/**
 * Analyzes upcoming tasks against 7-day weather forecast.
 * Identifies:
 *  - Rain vs foliar spraying / fertilizing / sowing / harvest
 *  - High winds vs spraying
 *  - Rain vs irrigation (postpone to save water and avoid waterlogging)
 *  - Extreme heat vs crop stage
 */
export function evaluateWeatherConflicts(tasks, forecastDaily) {
  const conflicts = []
  if (!Array.isArray(tasks) || !Array.isArray(forecastDaily)) return conflicts

  const forecastMap = new Map()
  for (const day of forecastDaily) {
    forecastMap.set(day.date, day)
  }

  // Find next clear day helper (rain prob < 30%, wind < 15km/h)
  const findNextClearDate = (fromDate) => {
    const fromTime = new Date(`${fromDate}T00:00:00`).getTime()
    for (const day of forecastDaily) {
      const dayTime = new Date(`${day.date}T00:00:00`).getTime()
      if (dayTime > fromTime && day.precipitationProb <= 30 && day.windSpeedMax <= 15) {
        return day.date
      }
    }
    // Default to +2 days if forecast window doesn't have ideal day
    return new Date(fromTime + 2 * 86400000).toISOString().slice(0, 10)
  }

  for (const task of tasks) {
    if (task.status === 'completed' || task.status === 'skipped') continue
    const weather = forecastMap.get(task.scheduledDate)
    if (!weather) continue

    const { precipitationMm, precipitationProb, windSpeedMax, tempMax } = weather

    // 1. Rain conflict on Foliar Spraying / Disease Inspection / Sowing
    if (
      (task.activityType === 'pest_monitoring' ||
        task.activityType === 'disease_inspection' ||
        task.activityType === 'sowing' ||
        task.title.toLowerCase().includes('spray')) &&
      (precipitationProb >= 55 || precipitationMm >= 5)
    ) {
      const suggestedDate = findNextClearDate(task.scheduledDate)
      conflicts.push({
        taskId: task.id,
        taskTitle: task.title,
        alertType: 'heavy_rain',
        severity: precipitationMm > 15 ? 'critical' : 'warning',
        forecastDate: task.scheduledDate,
        message: `Rain forecasted (${precipitationMm} mm, ${precipitationProb}% chance) on ${task.scheduledDate}. Spraying or sowing in wet soil risks chemical runoff or seed rot.`,
        recommendedAction: `Postpone foliar work until leaves are dry. Suggested alternative: ${suggestedDate}.`,
        suggestedDate,
      })
    }

    // 2. High Wind vs Spraying
    else if (
      (task.activityType === 'pest_monitoring' ||
        task.activityType === 'disease_inspection' ||
        task.title.toLowerCase().includes('spray')) &&
      windSpeedMax > 18
    ) {
      const suggestedDate = findNextClearDate(task.scheduledDate)
      conflicts.push({
        taskId: task.id,
        taskTitle: task.title,
        alertType: 'high_wind',
        severity: 'warning',
        forecastDate: task.scheduledDate,
        message: `Strong winds (${windSpeedMax} km/h) forecasted on ${task.scheduledDate}. High drift risk makes spraying ineffective.`,
        recommendedAction: `Reschedule spraying to early morning or calm day: ${suggestedDate}.`,
        suggestedDate,
      })
    }

    // 3. Significant Rain vs Scheduled Irrigation
    else if (task.activityType === 'irrigation' && (precipitationMm >= 10 || precipitationProb >= 65)) {
      const suggestedDate = findNextClearDate(task.scheduledDate)
      conflicts.push({
        taskId: task.id,
        taskTitle: task.title,
        alertType: 'heavy_rain',
        severity: 'warning',
        forecastDate: task.scheduledDate,
        message: `Substantial rain (${precipitationMm} mm, ${precipitationProb}% chance) forecasted on ${task.scheduledDate}.`,
        recommendedAction: `Review field soil moisture. Postpone irrigation to avoid root zone waterlogging. Re-check on ${suggestedDate}.`,
        suggestedDate,
      })
    }

    // 4. Heavy Rain during Harvest
    else if (task.activityType === 'harvest' && (precipitationMm >= 8 || precipitationProb >= 60)) {
      conflicts.push({
        taskId: task.id,
        taskTitle: task.title,
        alertType: 'heavy_rain',
        severity: 'critical',
        forecastDate: task.scheduledDate,
        message: `Rain warning during harvest window (${precipitationMm} mm on ${task.scheduledDate}). Moisture damages mature grain and fruits.`,
        recommendedAction: `Expedite harvest 1-2 days before the rain or shelter harvested produce under clean tarpaulins.`,
        suggestedDate: new Date(new Date(`${task.scheduledDate}T00:00:00`).getTime() - 86400000).toISOString().slice(0, 10),
      })
    }

    // 5. Extreme Heat Stress (> 38°C)
    else if (tempMax >= 38) {
      conflicts.push({
        taskId: task.id,
        taskTitle: task.title,
        alertType: 'heat_stress',
        severity: 'warning',
        forecastDate: task.scheduledDate,
        message: `High heat warning (${tempMax}°C) on ${task.scheduledDate}. Sensitive flowering / vegetative stages risk heat shock.`,
        recommendedAction: `Ensure evening irrigation and maintain organic mulch to keep root zone temperature cool.`,
        suggestedDate: null,
      })
    }
  }

  return conflicts
}

