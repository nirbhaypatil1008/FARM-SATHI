import { randomUUID } from 'node:crypto'
import { z } from 'zod'
import { database } from './db.js'
import { generateFarmingCalendar, getCropTemplate, SUPPORTED_CROPS } from './cropSchedules.js'
import { evaluateWeatherConflicts, fetchFarmWeather } from './weatherAdvisory.js'

const cropCycleSchema = z.object({
  cropName: z.string().trim().min(2).max(100),
  cropVariety: z.string().trim().max(100).optional().default('Standard Hybrid'),
  fieldName: z.string().trim().max(100).optional().default('Main Field'),
  farmArea: z.number().positive().max(1000).optional().default(1.0),
  sowingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Sowing date must be YYYY-MM-DD'),
  soilType: z.string().trim().max(50).optional().default('Loamy'),
  irrigationType: z.string().trim().max(50).optional().default('Drip'),
  waterAvailability: z.string().trim().max(50).optional().default('Adequate'),
  customDuration: z.number().int().positive().max(365).optional().nullable(),
})

const taskSchema = z.object({
  cropCycleId: z.string().uuid().optional().nullable(),
  cropName: z.string().trim().max(100).optional().default(''),
  title: z.string().trim().min(2).max(200),
  activityType: z.enum([
    'land_prep', 'sowing', 'irrigation', 'fertilizer', 'weeding',
    'pest_monitoring', 'disease_inspection', 'growth_monitoring',
    'flowering', 'fruiting', 'harvest_prep', 'harvest', 'general',
  ]).default('general'),
  stageName: z.string().trim().max(100).optional().default('General'),
  scheduledDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  description: z.string().trim().max(1000).optional().default(''),
  fertilizerDetails: z.record(z.string(), z.unknown()).optional().nullable(),
  irrigationDetails: z.record(z.string(), z.unknown()).optional().nullable(),
})

function dateToday() {
  return new Date().toISOString().slice(0, 10)
}

function daysSince(dateStr) {
  const diff = Date.now() - new Date(`${dateStr}T00:00:00`).getTime()
  return Math.max(0, Math.floor(diff / 86400000))
}

// 1. Create a Crop Cycle & Auto-Generate Farming Tasks
export async function createCropCycle(req, res, next) {
  try {
    const parsed = cropCycleSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid crop cycle data.', details: parsed.error.flatten().fieldErrors })
    }
    const data = parsed.data
    const userId = req.user.id

    // Generate schedule
    const schedule = generateFarmingCalendar({
      cropName: data.cropName,
      cropVariety: data.cropVariety,
      sowingDate: data.sowingDate,
      farmArea: data.farmArea,
      soilType: data.soilType,
      irrigationType: data.irrigationType,
      waterAvailability: data.waterAvailability,
      customDuration: data.customDuration,
    })

    const cycleId = randomUUID()

    const createTransaction = database.transaction(() => {
      // Insert crop cycle
      database.prepare(`
        INSERT INTO crop_cycles (
          id, user_id, crop_name, crop_variety, field_name, farm_area,
          sowing_date, crop_duration_days, expected_harvest_date,
          soil_type, irrigation_type, water_availability, current_stage_index,
          health_status, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 'Good', 'active')
      `).run(
        cycleId, userId, schedule.cropName, schedule.cropVariety, data.fieldName, schedule.farmArea,
        schedule.sowingDate, schedule.cropDurationDays, schedule.expectedHarvestDate,
        schedule.soilType, schedule.irrigationType, schedule.waterAvailability
      )

      // Insert tasks
      const insertTaskStmt = database.prepare(`
        INSERT INTO calendar_tasks (
          id, user_id, crop_cycle_id, crop_name, title, activity_type,
          stage_name, scheduled_date, original_date, status, priority,
          description, fertilizer_details, irrigation_details, weather_warning
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?, NULL)
      `)

      const insertHistoryStmt = database.prepare(`
        INSERT INTO task_history (id, task_id, user_id, action, new_status, new_date, reason)
        VALUES (?, ?, ?, 'created', 'pending', ?, 'Generated via AI Crop Schedule Engine')
      `)

      for (const t of schedule.tasks) {
        const taskId = randomUUID()
        insertTaskStmt.run(
          taskId, userId, cycleId, schedule.cropName, t.title, t.activityType,
          t.stageName, t.scheduledDate, t.originalDate, t.priority,
          t.description, t.fertilizerDetails, t.irrigationDetails
        )
        insertHistoryStmt.run(randomUUID(), taskId, userId, t.scheduledDate)
      }
    })

    createTransaction()

    const createdCycle = database.prepare('SELECT * FROM crop_cycles WHERE id = ?').get(cycleId)
    const createdTasks = database.prepare('SELECT * FROM calendar_tasks WHERE crop_cycle_id = ? ORDER BY scheduled_date ASC').all(cycleId)

    return res.status(201).json({
      success: true,
      cropCycle: createdCycle,
      taskCount: createdTasks.length,
      tasks: createdTasks,
      stages: schedule.stages,
    })
  } catch (error) {
    return next(error)
  }
}

// 2. List All Crop Cycles for Authenticated Farmer
export function listCropCycles(req, res, next) {
  try {
    const userId = req.user.id
    const cycles = database.prepare(`
      SELECT c.*,
        (SELECT COUNT(*) FROM calendar_tasks WHERE crop_cycle_id = c.id) as total_tasks,
        (SELECT COUNT(*) FROM calendar_tasks WHERE crop_cycle_id = c.id AND status = 'completed') as completed_tasks,
        (SELECT COUNT(*) FROM calendar_tasks WHERE crop_cycle_id = c.id AND status = 'pending' AND scheduled_date <= date('now')) as due_tasks
      FROM crop_cycles c
      WHERE c.user_id = ?
      ORDER BY c.created_at DESC
    `).all(userId)

    const enhanced = cycles.map((c) => {
      const template = getCropTemplate(c.crop_name)
      const age = daysSince(c.sowing_date)
      const currentStage = template.stages.find((st) => age >= st.startDas && age <= st.endDas)?.name || (age > c.crop_duration_days ? 'Harvested' : 'Land Preparation')
      return {
        ...c,
        daysSinceSowing: age,
        calculatedStage: currentStage,
        durationDays: c.crop_duration_days,
        progressPercent: Math.min(100, Math.round((age / (c.crop_duration_days || 1)) * 100)),
      }
    })

    return res.json({ cropCycles: enhanced })
  } catch (error) {
    return next(error)
  }
}

// 3. Get Details of a Specific Crop Cycle
export function getCropCycleDetails(req, res, next) {
  try {
    const userId = req.user.id
    const cycleId = req.params.id

    const cycle = database.prepare('SELECT * FROM crop_cycles WHERE id = ? AND user_id = ?').get(cycleId, userId)
    if (!cycle) return res.status(404).json({ error: 'Crop cycle not found.' })

    const tasks = database.prepare('SELECT * FROM calendar_tasks WHERE crop_cycle_id = ? AND user_id = ? ORDER BY scheduled_date ASC').all(cycleId, userId)
    const observations = database.prepare('SELECT * FROM crop_observations WHERE crop_cycle_id = ? AND user_id = ? ORDER BY date DESC').all(cycleId, userId)
    const expenses = database.prepare('SELECT * FROM farm_expenses WHERE crop_cycle_id = ? AND user_id = ? ORDER BY date DESC').all(cycleId, userId)

    const template = getCropTemplate(cycle.crop_name)
    const age = daysSince(cycle.sowing_date)
    const calculatedStage = template.stages.find((st) => age >= st.startDas && age <= st.endDas)?.name || 'Vegetative'

    return res.json({
      cropCycle: cycle,
      daysSinceSowing: age,
      calculatedStage,
      stages: template.stages,
      tasks,
      observations,
      expenses,
    })
  } catch (error) {
    return next(error)
  }
}

// 4. Update Crop Cycle
export function updateCropCycle(req, res, next) {
  try {
    const userId = req.user.id
    const cycleId = req.params.id
    const { cropVariety, fieldName, currentStageIndex, healthStatus, actualHarvestDate, status } = req.body

    const existing = database.prepare('SELECT id FROM crop_cycles WHERE id = ? AND user_id = ?').get(cycleId, userId)
    if (!existing) return res.status(404).json({ error: 'Crop cycle not found.' })

    database.prepare(`
      UPDATE crop_cycles
      SET crop_variety = COALESCE(?, crop_variety),
          field_name = COALESCE(?, field_name),
          current_stage_index = COALESCE(?, current_stage_index),
          health_status = COALESCE(?, health_status),
          actual_harvest_date = COALESCE(?, actual_harvest_date),
          status = COALESCE(?, status),
          updated_at = strftime('%Y-%m-%d %H:%M:%f', 'now')
      WHERE id = ? AND user_id = ?
    `).run(cropVariety, fieldName, currentStageIndex, healthStatus, actualHarvestDate, status, cycleId, userId)

    const updated = database.prepare('SELECT * FROM crop_cycles WHERE id = ?').get(cycleId)
    return res.json({ success: true, cropCycle: updated })
  } catch (error) {
    return next(error)
  }
}

// 5. Delete Crop Cycle & Associated Tasks
export function deleteCropCycle(req, res, next) {
  try {
    const userId = req.user.id
    const cycleId = req.params.id

    const result = database.prepare('DELETE FROM crop_cycles WHERE id = ? AND user_id = ?').run(cycleId, userId)
    if (!result.changes) return res.status(404).json({ error: 'Crop cycle not found.' })

    return res.json({ success: true, message: 'Crop cycle and scheduled tasks deleted.' })
  } catch (error) {
    return next(error)
  }
}

// 6. Preview AI Schedule Generation (Without Persisting)
export function generateSchedulePreview(req, res, next) {
  try {
    const parsed = cropCycleSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid input.', details: parsed.error.flatten().fieldErrors })
    }
    const schedule = generateFarmingCalendar(parsed.data)
    return res.json({ preview: schedule })
  } catch (error) {
    return next(error)
  }
}

// 7. List Tasks with Filters (Date range, Crop, Activity type, Status)
export function listTasks(req, res, next) {
  try {
    const userId = req.user.id
    const { cropCycleId, status, fromDate, toDate, activityType } = req.query

    let sql = 'SELECT * FROM calendar_tasks WHERE user_id = ?'
    const params = [userId]

    if (cropCycleId) {
      sql += ' AND crop_cycle_id = ?'
      params.push(cropCycleId)
    }
    if (status) {
      sql += ' AND status = ?'
      params.push(status)
    }
    if (activityType) {
      sql += ' AND activity_type = ?'
      params.push(activityType)
    }
    if (fromDate) {
      sql += ' AND scheduled_date >= ?'
      params.push(fromDate)
    }
    if (toDate) {
      sql += ' AND scheduled_date <= ?'
      params.push(toDate)
    }

    sql += ' ORDER BY scheduled_date ASC, priority DESC'
    const tasks = database.prepare(sql).all(...params)

    return res.json({ tasks })
  } catch (error) {
    return next(error)
  }
}

// 8. Get Today's and Overdue Tasks
export function getTodayTasks(req, res, next) {
  try {
    const userId = req.user.id
    const today = dateToday()

    const todayTasks = database.prepare(`
      SELECT * FROM calendar_tasks
      WHERE user_id = ? AND scheduled_date = ?
      ORDER BY priority DESC, created_at ASC
    `).all(userId, today)

    const overdueTasks = database.prepare(`
      SELECT * FROM calendar_tasks
      WHERE user_id = ? AND scheduled_date < ? AND status = 'pending'
      ORDER BY scheduled_date ASC
    `).all(userId, today)

    return res.json({
      today,
      todayTasks,
      overdueTasks,
      summary: {
        totalToday: todayTasks.length,
        completedToday: todayTasks.filter((t) => t.status === 'completed').length,
        overdueCount: overdueTasks.length,
      },
    })
  } catch (error) {
    return next(error)
  }
}

// 9. Get Upcoming Tasks (Next 14 Days)
export function getUpcomingTasks(req, res, next) {
  try {
    const userId = req.user.id
    const today = dateToday()
    const futureDate = new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10)

    const upcoming = database.prepare(`
      SELECT * FROM calendar_tasks
      WHERE user_id = ? AND scheduled_date >= ? AND scheduled_date <= ?
      ORDER BY scheduled_date ASC
    `).all(userId, today, futureDate)

    return res.json({ fromDate: today, toDate: futureDate, tasks: upcoming })
  } catch (error) {
    return next(error)
  }
}

// 10. Create a Custom Task
export function createCustomTask(req, res, next) {
  try {
    const parsed = taskSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid task data.', details: parsed.error.flatten().fieldErrors })
    }
    const data = parsed.data
    const userId = req.user.id
    const taskId = randomUUID()

    database.prepare(`
      INSERT INTO calendar_tasks (
        id, user_id, crop_cycle_id, crop_name, title, activity_type,
        stage_name, scheduled_date, original_date, status, priority,
        description, fertilizer_details, irrigation_details
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?)
    `).run(
      taskId, userId, data.cropCycleId || null, data.cropName || '',
      data.title, data.activityType, data.stageName,
      data.scheduledDate, data.scheduledDate, data.priority,
      data.description,
      data.fertilizerDetails ? JSON.stringify(data.fertilizerDetails) : null,
      data.irrigationDetails ? JSON.stringify(data.irrigationDetails) : null
    )

    database.prepare(`
      INSERT INTO task_history (id, task_id, user_id, action, new_status, new_date, reason)
      VALUES (?, ?, ?, 'created', 'pending', ?, 'Manually added by farmer')
    `).run(randomUUID(), taskId, userId, data.scheduledDate)

    const task = database.prepare('SELECT * FROM calendar_tasks WHERE id = ?').get(taskId)
    return res.status(201).json({ success: true, task })
  } catch (error) {
    return next(error)
  }
}

// 10b. Update a Task
export function updateTask(req, res, next) {
  try {
    const userId = req.user.id
    const taskId = req.params.id
    const { title, description, priority, scheduledDate, notes } = req.body

    const existing = database.prepare('SELECT id FROM calendar_tasks WHERE id = ? AND user_id = ?').get(taskId, userId)
    if (!existing) return res.status(404).json({ error: 'Task not found.' })

    database.prepare(`
      UPDATE calendar_tasks
      SET title = COALESCE(?, title),
          description = COALESCE(?, description),
          priority = COALESCE(?, priority),
          scheduled_date = COALESCE(?, scheduled_date),
          notes = COALESCE(?, notes),
          updated_at = strftime('%Y-%m-%d %H:%M:%f', 'now')
      WHERE id = ? AND user_id = ?
    `).run(title, description, priority, scheduledDate, notes, taskId, userId)

    const updated = database.prepare('SELECT * FROM calendar_tasks WHERE id = ?').get(taskId)
    return res.json({ success: true, task: updated })
  } catch (error) {
    return next(error)
  }
}

// 11. Complete a Task
export function completeTask(req, res, next) {
  try {
    const userId = req.user.id
    const taskId = req.params.id
    const { notes = '', actualCompletionDate = dateToday() } = req.body

    const task = database.prepare('SELECT * FROM calendar_tasks WHERE id = ? AND user_id = ?').get(taskId, userId)
    if (!task) return res.status(404).json({ error: 'Task not found.' })

    database.prepare(`
      UPDATE calendar_tasks
      SET status = 'completed',
          completed_date = ?,
          notes = CASE WHEN ? != '' THEN ? ELSE notes END,
          updated_at = strftime('%Y-%m-%d %H:%M:%f', 'now')
      WHERE id = ? AND user_id = ?
    `).run(actualCompletionDate, notes, notes, taskId, userId)

    database.prepare(`
      INSERT INTO task_history (id, task_id, user_id, action, previous_status, new_status, new_date, reason)
      VALUES (?, ?, ?, 'completed', ?, 'completed', ?, ?)
    `).run(randomUUID(), taskId, userId, task.status, actualCompletionDate, notes || 'Marked completed')

    const updated = database.prepare('SELECT * FROM calendar_tasks WHERE id = ?').get(taskId)
    return res.json({ success: true, task: updated })
  } catch (error) {
    return next(error)
  }
}

// 12. Skip a Task
export function skipTask(req, res, next) {
  try {
    const userId = req.user.id
    const taskId = req.params.id
    const { reason = 'Not required for current field conditions' } = req.body

    const task = database.prepare('SELECT * FROM calendar_tasks WHERE id = ? AND user_id = ?').get(taskId, userId)
    if (!task) return res.status(404).json({ error: 'Task not found.' })

    database.prepare(`
      UPDATE calendar_tasks
      SET status = 'skipped',
          rescheduled_reason = ?,
          updated_at = strftime('%Y-%m-%d %H:%M:%f', 'now')
      WHERE id = ? AND user_id = ?
    `).run(reason, taskId, userId)

    database.prepare(`
      INSERT INTO task_history (id, task_id, user_id, action, previous_status, new_status, reason)
      VALUES (?, ?, ?, 'skipped', ?, 'skipped', ?)
    `).run(randomUUID(), taskId, userId, task.status, reason)

    const updated = database.prepare('SELECT * FROM calendar_tasks WHERE id = ?').get(taskId)
    return res.json({ success: true, task: updated })
  } catch (error) {
    return next(error)
  }
}

// 13. Reschedule a Task
export function rescheduleTask(req, res, next) {
  try {
    const userId = req.user.id
    const taskId = req.params.id
    const { newDate, reason = 'Rescheduled by farmer' } = req.body

    if (!newDate || !/^\d{4}-\d{2}-\d{2}$/.test(newDate)) {
      return res.status(400).json({ error: 'Valid newDate (YYYY-MM-DD) is required.' })
    }

    const task = database.prepare('SELECT * FROM calendar_tasks WHERE id = ? AND user_id = ?').get(taskId, userId)
    if (!task) return res.status(404).json({ error: 'Task not found.' })

    database.prepare(`
      UPDATE calendar_tasks
      SET scheduled_date = ?,
          status = 'rescheduled',
          rescheduled_reason = ?,
          weather_warning = NULL,
          updated_at = strftime('%Y-%m-%d %H:%M:%f', 'now')
      WHERE id = ? AND user_id = ?
    `).run(newDate, reason, taskId, userId)

    database.prepare(`
      INSERT INTO task_history (id, task_id, user_id, action, previous_date, new_date, reason)
      VALUES (?, ?, ?, 'rescheduled', ?, ?, ?)
    `).run(randomUUID(), taskId, userId, task.scheduledDate, newDate, reason)

    const updated = database.prepare('SELECT * FROM calendar_tasks WHERE id = ?').get(taskId)
    return res.json({ success: true, task: updated })
  } catch (error) {
    return next(error)
  }
}

// 14. Delete a Task
export function deleteTask(req, res, next) {
  try {
    const userId = req.user.id
    const taskId = req.params.id

    const result = database.prepare('DELETE FROM calendar_tasks WHERE id = ? AND user_id = ?').run(taskId, userId)
    if (!result.changes) return res.status(404).json({ error: 'Task not found.' })

    return res.json({ success: true, message: 'Task deleted.' })
  } catch (error) {
    return next(error)
  }
}

// 15. Check Weather Alerts & Evaluate Conflicts with Live Weather
export async function getWeatherAlerts(req, res, next) {
  try {
    const userId = req.user.id
    const location = req.query.location || 'Mandya, Karnataka'

    // Fetch live weather
    const weather = await fetchFarmWeather(location)

    // Fetch upcoming pending tasks for next 7 days
    const today = dateToday()
    const day7 = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10)
    const upcomingTasks = database.prepare(`
      SELECT * FROM calendar_tasks
      WHERE user_id = ? AND scheduled_date >= ? AND scheduled_date <= ? AND status != 'completed'
    `).all(userId, today, day7)

    // Evaluate conflicts
    const conflicts = evaluateWeatherConflicts(upcomingTasks, weather.daily)

    // Save or update alerts in SQLite
    const insertAlertStmt = database.prepare(`
      INSERT INTO weather_alerts (id, user_id, task_id, alert_type, severity, forecast_date, message, recommended_action)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)

    for (const c of conflicts) {
      if (c.taskId) {
        database.prepare(`UPDATE calendar_tasks SET weather_warning = ? WHERE id = ?`).run(c.message, c.taskId)
      }
      insertAlertStmt.run(randomUUID(), userId, c.taskId || null, c.alertType, c.severity, c.forecastDate, c.message, c.recommendedAction)
    }

    return res.json({
      location: weather.place,
      fetchedAt: weather.fetchedAt,
      forecast: weather.daily,
      conflicts,
      totalConflicts: conflicts.length,
    })
  } catch (error) {
    return next(error)
  }
}

// 16. Record an Actual Irrigation Application
export function recordIrrigation(req, res, next) {
  try {
    const userId = req.user.id
    const { taskId, cropCycleId, method = 'Drip', durationMinutes = 60, notes = '', date = dateToday() } = req.body

    if (taskId) {
      database.prepare(`
        UPDATE calendar_tasks
        SET status = 'completed',
            completed_date = ?,
            notes = ?,
            updated_at = strftime('%Y-%m-%d %H:%M:%f', 'now')
        WHERE id = ? AND user_id = ?
      `).run(date, `Irrigated using ${method} for ${durationMinutes} mins. ${notes}`, taskId, userId)
    }

    // Record in history
    database.prepare(`
      INSERT INTO task_history (id, task_id, user_id, action, new_status, new_date, reason)
      VALUES (?, ?, ?, 'completed', 'completed', ?, ?)
    `).run(randomUUID(), taskId || null, userId, date, `Irrigation event recorded (${method}, ${durationMinutes} mins)`)

    return res.status(201).json({ success: true, message: 'Irrigation recorded successfully.' })
  } catch (error) {
    return next(error)
  }
}

// 17. Record Fertilizer Application
export function recordFertilizer(req, res, next) {
  try {
    const userId = req.user.id
    const { taskId, cropCycleId, fertilizerName, quantity, unit = 'kg', method = 'Side placement', notes = '', date = dateToday() } = req.body

    if (!fertilizerName || !quantity) {
      return res.status(400).json({ error: 'Fertilizer name and quantity are required.' })
    }

    if (taskId) {
      database.prepare(`
        UPDATE calendar_tasks
        SET status = 'completed',
            completed_date = ?,
            notes = ?,
            updated_at = strftime('%Y-%m-%d %H:%M:%f', 'now')
        WHERE id = ? AND user_id = ?
      `).run(date, `Applied ${quantity} ${unit} of ${fertilizerName} via ${method}. ${notes}`, taskId, userId)
    }

    database.prepare(`
      INSERT INTO task_history (id, task_id, user_id, action, new_status, new_date, reason)
      VALUES (?, ?, ?, 'completed', 'completed', ?, ?)
    `).run(randomUUID(), taskId || null, userId, date, `Applied ${quantity} ${unit} of ${fertilizerName}`)

    return res.status(201).json({ success: true, message: 'Fertilizer application recorded.' })
  } catch (error) {
    return next(error)
  }
}

// 18. Record Farm Expense
export function recordFarmExpense(req, res, next) {
  try {
    const userId = req.user.id
    const { cropCycleId, category, cropName = '', amount, date = dateToday(), notes = '' } = req.body

    if (!category || !amount || Number.isNaN(Number(amount))) {
      return res.status(400).json({ error: 'Category and valid amount are required.' })
    }

    const expenseId = randomUUID()
    database.prepare(`
      INSERT INTO farm_expenses (id, user_id, crop_cycle_id, category, crop_name, amount, date, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(expenseId, userId, cropCycleId || null, category, cropName, Number(amount), date, notes)

    const created = database.prepare('SELECT * FROM farm_expenses WHERE id = ?').get(expenseId)
    return res.status(201).json({ success: true, expense: created })
  } catch (error) {
    return next(error)
  }
}

// 19. Get Farm Expenses
export function getFarmExpenses(req, res, next) {
  try {
    const userId = req.user.id
    const { cropCycleId } = req.query

    let sql = 'SELECT * FROM farm_expenses WHERE user_id = ?'
    const params = [userId]
    if (cropCycleId) {
      sql += ' AND crop_cycle_id = ?'
      params.push(cropCycleId)
    }
    sql += ' ORDER BY date DESC'

    const expenses = database.prepare(sql).all(...params)
    const totalAmount = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0)

    const categories = ['Seeds', 'Fertilizers', 'Pesticides', 'Labor', 'Irrigation', 'Equipment', 'Transportation', 'Machinery rental', 'Other']
    const breakdown = categories.map((cat) => ({
      category: cat,
      amount: expenses.filter((e) => e.category === cat).reduce((sum, e) => sum + Number(e.amount || 0), 0),
    })).filter((c) => c.amount > 0)

    return res.json({ expenses, totalAmount, breakdown })
  } catch (error) {
    return next(error)
  }
}

// 20. Get Task History Audit Log
export function getTaskHistory(req, res, next) {
  try {
    const userId = req.user.id
    const history = database.prepare(`
      SELECT h.*, t.title as task_title, t.activity_type, t.crop_name
      FROM task_history h
      LEFT JOIN calendar_tasks t ON t.id = h.task_id
      WHERE h.user_id = ?
      ORDER BY h.created_at DESC
      LIMIT 100
    `).all(userId)

    return res.json({ history })
  } catch (error) {
    return next(error)
  }
}

// 21. AI Daily Farming Briefing Summary
export async function getDailySummary(req, res, next) {
  try {
    const userId = req.user.id
    const today = dateToday()

    const todayTasks = database.prepare(`
      SELECT * FROM calendar_tasks
      WHERE user_id = ? AND scheduled_date = ?
      ORDER BY priority DESC
    `).all(userId, today)

    const overdueTasks = database.prepare(`
      SELECT * FROM calendar_tasks
      WHERE user_id = ? AND scheduled_date < ? AND status = 'pending'
      ORDER BY scheduled_date ASC
    `).all(userId, today)

    const activeCycles = database.prepare(`
      SELECT * FROM crop_cycles WHERE user_id = ? AND status = 'active'
    `).all(userId)

    const activeStages = activeCycles.map((c) => {
      const template = getCropTemplate(c.crop_name)
      const age = daysSince(c.sowing_date)
      const stage = template.stages.find((st) => age >= st.startDas && age <= st.endDas)?.name || 'Vegetative'
      return {
        crop: c.crop_name,
        variety: c.crop_variety,
        ageDays: age,
        currentStage: stage,
        expectedHarvest: c.expected_harvest_date,
      }
    })

    return res.json({
      today,
      todayTasks,
      overdueTasks,
      activeStages,
      briefing: {
        totalDueToday: todayTasks.length,
        criticalAlertsCount: todayTasks.filter((t) => t.priority === 'critical' || t.weather_warning).length,
        hasPendingIrrigation: todayTasks.some((t) => t.activityType === 'irrigation' && t.status === 'pending'),
        hasPendingFertilizer: todayTasks.some((t) => t.activityType === 'fertilizer' && t.status === 'pending'),
      },
    })
  } catch (error) {
    return next(error)
  }
}
