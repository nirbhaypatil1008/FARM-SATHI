import { database } from './db.js'
import { fetchFarmWeather } from './weatherAdvisory.js'

/**
 * Builds a comprehensive, verified context dictionary for the authenticated farmer.
 * Integrates real records from SQLite (soil_analyses, crop_diagnoses, crop_cycles,
 * calendar_tasks, farm_expenses) plus live Open-Meteo weather.
 */
export async function buildFarmerGroundingContext(userId, clientContext = {}, { includeWeather = true } = {}) {
  const profileInfo = clientContext.farmer || {}
  const location =
    clientContext.location?.village ||
    clientContext.location?.district ||
    profileInfo.village ||
    profileInfo.district ||
    'Mandya, Karnataka'

  // 1. Authenticated User Profile
  let userRecord = null
  if (userId) {
    try {
      userRecord = database.prepare('SELECT id, name, email FROM users WHERE id = ?').get(userId)
    } catch {}
  }

  // 2. Real Soil Analyzer Results
  let recentSoilAnalyses = []
  if (userId) {
    try {
      const rows = database.prepare(`
        SELECT id, crop_name, location, predicted_class, confidence, model_version, result_json, created_at
        FROM soil_analyses
        WHERE user_id = ?
        ORDER BY created_at DESC
        LIMIT 3
      `).all(userId)

      recentSoilAnalyses = rows.map((r) => {
        let parsed = {}
        try { parsed = JSON.parse(r.result_json) } catch {}
        return {
          id: r.id,
          date: r.created_at,
          cropName: r.crop_name || 'General Field',
          location: r.location,
          predictedSoilClass: r.predicted_class,
          modelConfidence: Math.round((Number(r.confidence) || 0) * 100) + '%',
          characteristics: parsed.characteristics || parsed.recommendations?.soilType || 'Visual ML model prediction',
          primaryRecommendations: parsed.recommendations?.suitableCrops || parsed.recommendations?.immediateActions || [],
          disclaimer: 'Visual ML prediction based on genuinely trained soil model. Not a laboratory chemical NPK test.'
        }
      })
    } catch (e) {
      console.warn('Could not read soil analyses for context:', e.message)
    }
  }

  // 3. Real Crop Doctor / Plant Health Diagnoses
  let recentCropDiagnoses = []
  if (userId) {
    try {
      const rows = database.prepare(`
        SELECT id, crop_name, disease_name, confidence, severity, result_json, created_at
        FROM crop_diagnoses
        WHERE user_id = ?
        ORDER BY created_at DESC
        LIMIT 3
      `).all(userId)

      recentCropDiagnoses = rows.map((r) => {
        let parsed = {}
        try { parsed = JSON.parse(r.result_json) } catch {}
        return {
          id: r.id,
          date: r.created_at,
          cropName: r.crop_name,
          diagnosedCondition: r.disease_name,
          confidence: r.confidence + '%',
          severity: r.severity,
          symptoms: parsed.symptoms || [],
          immediateActions: parsed.immediateActions || [],
          organicOptions: parsed.organicOptions || [],
          prevention: parsed.prevention || [],
          disclaimer: 'Visual screening model estimate. Confirm with local agriculture officer for severe infections.'
        }
      })
    } catch (e) {
      console.warn('Could not read crop diagnoses for context:', e.message)
    }
  }

  // 4. Real Active Crop Cycles & Growth Stages
  let activeCropCycles = []
  if (userId) {
    try {
      activeCropCycles = database.prepare(`
        SELECT id, crop_name, crop_variety, field_name, farm_area, sowing_date,
               crop_duration_days, expected_harvest_date, soil_type, irrigation_type,
               water_availability, current_stage_index, health_status
        FROM crop_cycles
        WHERE user_id = ? AND status = 'active'
        ORDER BY created_at DESC
        LIMIT 5
      `).all(userId)
    } catch (e) {
      console.warn('Could not read crop cycles for context:', e.message)
    }
  }

  // 5. Real Calendar Tasks (Today, Overdue & Next 7 Days)
  let todayTasks = []
  let overdueTasks = []
  let upcomingTasks = []
  if (userId) {
    try {
      const today = new Date().toISOString().slice(0, 10)
      todayTasks = database.prepare(`
        SELECT id, crop_name, title, activity_type, stage_name, scheduled_date, priority, description, fertilizer_details, irrigation_details
        FROM calendar_tasks
        WHERE user_id = ? AND scheduled_date = ? AND status = 'pending'
        LIMIT 8
      `).all(userId, today)

      overdueTasks = database.prepare(`
        SELECT id, crop_name, title, activity_type, stage_name, scheduled_date, priority
        FROM calendar_tasks
        WHERE user_id = ? AND scheduled_date < ? AND status = 'pending'
        ORDER BY scheduled_date ASC
        LIMIT 5
      `).all(userId, today)

      upcomingTasks = database.prepare(`
        SELECT id, crop_name, title, activity_type, stage_name, scheduled_date, priority
        FROM calendar_tasks
        WHERE user_id = ? AND scheduled_date > ? AND scheduled_date <= date(?, '+7 days') AND status = 'pending'
        ORDER BY scheduled_date ASC
        LIMIT 8
      `).all(userId, today, today)
    } catch (e) {
      console.warn('Could not read calendar tasks for context:', e.message)
    }
  }

  // 6. Live Open-Meteo Weather for Farmer Location
  let liveWeather = null
  if (includeWeather) try {
    const weatherResult = await fetchFarmWeather(location)
    if (weatherResult?.isFallback) {
      liveWeather = { location, note: 'Live weather service temporarily unreachable. Do not invent weather values.' }
    } else if (weatherResult && weatherResult.current) {
      liveWeather = {
        location: weatherResult.place ? `${weatherResult.place.name}, ${weatherResult.place.state}` : location,
        currentTemperature: weatherResult.current.temperature_2m + '°C',
        relativeHumidity: weatherResult.current.relative_humidity_2m + '%',
        currentPrecipitationMm: weatherResult.current.precipitation + ' mm',
        windSpeedKmH: weatherResult.current.wind_speed_10m + ' km/h',
        next3DaysForecast: (weatherResult.daily || []).slice(0, 3).map((d) => ({
          date: d.date,
          maxTemp: d.tempMax + '°C',
          minTemp: d.tempMin + '°C',
          rainSumMm: d.precipitationMm + ' mm',
          rainProbability: d.precipitationProb + '%',
        }))
      }
    }
  } catch (err) {
    console.warn('Weather fetch in chat context:', err.message)
    liveWeather = { location, note: 'Live weather service temporarily unreachable. Do not invent weather values.' }
  }

  // 7. Recent Farm Expenses
  let recentExpenses = []
  if (userId) {
    try {
      recentExpenses = database.prepare(`
        SELECT category, crop_name, amount, date, notes
        FROM farm_expenses
        WHERE user_id = ?
        ORDER BY date DESC
        LIMIT 6
      `).all(userId)
    } catch (e) {
      console.warn('Could not read expenses for context:', e.message)
    }
  }

  return {
    farmer: {
      name: userRecord?.name || profileInfo.name || 'Farmer',
      email: userRecord?.email || profileInfo.email || null,
      farmLocation: location,
      landSize: profileInfo.landSize ? `${profileInfo.landSize} ${profileInfo.landUnit || 'acres'}` : 'Not recorded',
      soilType: profileInfo.soil || (recentSoilAnalyses[0]?.predictedSoilClass) || 'Not recorded',
      waterSource: profileInfo.water || 'Not specified',
      irrigationMethod: profileInfo.irrigation || 'Not specified',
      budget: profileInfo.budget ? `₹${profileInfo.budget}` : 'Not specified',
    },
    soilAnalyzer: {
      hasRecords: recentSoilAnalyses.length > 0,
      latestReports: recentSoilAnalyses.length > 0 ? recentSoilAnalyses : 'No soil test image has been analyzed yet for this farmer.',
    },
    plantAnalyzer: {
      hasRecords: recentCropDiagnoses.length > 0,
      latestDiagnoses: recentCropDiagnoses.length > 0 ? recentCropDiagnoses : 'No plant health photos have been diagnosed yet for this farmer.',
    },
    activeCrops: activeCropCycles.length > 0 ? activeCropCycles : (clientContext.crops || 'No active crop cycles currently registered.'),
    farmCalendar: {
      todayActivities: todayTasks.length > 0 ? todayTasks : 'No pending activities scheduled for today.',
      overdueActivities: overdueTasks.length > 0 ? overdueTasks : 'No overdue activities.',
      upcoming7Days: upcomingTasks.length > 0 ? upcomingTasks : 'No activities scheduled for next 7 days.',
    },
    weather: liveWeather,
    recentExpenses: recentExpenses.length > 0 ? recentExpenses : 'No expenses recorded yet.',
  }
}

