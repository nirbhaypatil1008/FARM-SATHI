import fs from 'node:fs'
import path from 'node:path'
import Database from 'better-sqlite3'
import pg from 'pg'
import { config } from './config.js'

const { Pool } = pg

export const isPostgres = Boolean(
  config.POSTGRES_CONNECTION_STRING &&
  (config.POSTGRES_CONNECTION_STRING.startsWith('postgres://') ||
   config.POSTGRES_CONNECTION_STRING.startsWith('postgresql://'))
)

export const POSTGRES_SCHEMA = `
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS conversations (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'model')),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS crop_diagnoses (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    crop_name TEXT NOT NULL,
    disease_name TEXT NOT NULL,
    image_filename TEXT NOT NULL,
    image_mime_type TEXT NOT NULL,
    confidence INTEGER NOT NULL CHECK (confidence BETWEEN 0 AND 100),
    severity TEXT NOT NULL CHECK (severity IN ('low', 'moderate', 'high', 'unknown')),
    result_json TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS soil_analyses (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    crop_name TEXT NOT NULL DEFAULT '',
    location TEXT NOT NULL DEFAULT '',
    image_filename TEXT NOT NULL,
    image_mime_type TEXT NOT NULL,
    predicted_class TEXT,
    confidence REAL NOT NULL CHECK (confidence BETWEEN 0 AND 1),
    model_version TEXT,
    result_json TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS crop_cycles (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    crop_name TEXT NOT NULL,
    crop_variety TEXT NOT NULL DEFAULT '',
    field_name TEXT NOT NULL DEFAULT '',
    farm_area REAL NOT NULL DEFAULT 1.0,
    sowing_date TEXT NOT NULL,
    crop_duration_days INTEGER NOT NULL,
    expected_harvest_date TEXT NOT NULL,
    actual_harvest_date TEXT,
    soil_type TEXT NOT NULL DEFAULT 'Loamy',
    irrigation_type TEXT NOT NULL DEFAULT 'Drip',
    water_availability TEXT NOT NULL DEFAULT 'Adequate',
    current_stage_index INTEGER NOT NULL DEFAULT 0,
    health_status TEXT NOT NULL DEFAULT 'Good',
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS calendar_tasks (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    crop_cycle_id TEXT REFERENCES crop_cycles(id) ON DELETE CASCADE,
    crop_name TEXT NOT NULL DEFAULT '',
    title TEXT NOT NULL,
    activity_type TEXT NOT NULL CHECK (activity_type IN (
      'land_prep', 'sowing', 'irrigation', 'fertilizer', 'weeding',
      'pest_monitoring', 'disease_inspection', 'growth_monitoring',
      'flowering', 'fruiting', 'harvest_prep', 'harvest', 'general'
    )),
    stage_name TEXT NOT NULL DEFAULT 'General',
    scheduled_date TEXT NOT NULL,
    original_date TEXT NOT NULL,
    completed_date TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'skipped', 'rescheduled')),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    description TEXT NOT NULL DEFAULT '',
    weather_warning TEXT,
    rescheduled_reason TEXT,
    fertilizer_details TEXT,
    irrigation_details TEXT,
    notes TEXT NOT NULL DEFAULT '',
    image_filename TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS task_history (
    id TEXT PRIMARY KEY,
    task_id TEXT REFERENCES calendar_tasks(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    previous_status TEXT,
    new_status TEXT,
    previous_date TEXT,
    new_date TEXT,
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS weather_alerts (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    crop_cycle_id TEXT REFERENCES crop_cycles(id) ON DELETE CASCADE,
    task_id TEXT REFERENCES calendar_tasks(id) ON DELETE SET NULL,
    alert_type TEXT NOT NULL,
    severity TEXT NOT NULL DEFAULT 'warning' CHECK (severity IN ('info', 'warning', 'critical')),
    forecast_date TEXT NOT NULL,
    message TEXT NOT NULL,
    recommended_action TEXT NOT NULL,
    dismissed INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS farm_expenses (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    crop_cycle_id TEXT REFERENCES crop_cycles(id) ON DELETE SET NULL,
    category TEXT NOT NULL,
    crop_name TEXT NOT NULL DEFAULT '',
    amount REAL NOT NULL,
    date TEXT NOT NULL,
    notes TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS crop_observations (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    crop_cycle_id TEXT NOT NULL REFERENCES crop_cycles(id) ON DELETE CASCADE,
    date TEXT NOT NULL,
    stage_index INTEGER,
    observation_text TEXT NOT NULL,
    image_filename TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS messages_conversation_created_idx ON messages(conversation_id, created_at);
  CREATE INDEX IF NOT EXISTS conversations_user_updated_idx ON conversations(user_id, updated_at);
  CREATE INDEX IF NOT EXISTS crop_diagnoses_user_created_idx ON crop_diagnoses(user_id, created_at DESC);
  CREATE INDEX IF NOT EXISTS soil_analyses_user_created_idx ON soil_analyses(user_id, created_at DESC);
  CREATE INDEX IF NOT EXISTS crop_cycles_user_status_idx ON crop_cycles(user_id, status);
  CREATE INDEX IF NOT EXISTS calendar_tasks_user_date_idx ON calendar_tasks(user_id, scheduled_date ASC);
  CREATE INDEX IF NOT EXISTS calendar_tasks_cycle_idx ON calendar_tasks(crop_cycle_id);
  CREATE INDEX IF NOT EXISTS task_history_task_created_idx ON task_history(task_id, created_at DESC);
  CREATE INDEX IF NOT EXISTS weather_alerts_user_date_idx ON weather_alerts(user_id, forecast_date DESC);
  CREATE INDEX IF NOT EXISTS farm_expenses_user_date_idx ON farm_expenses(user_id, date DESC);
  CREATE INDEX IF NOT EXISTS crop_observations_cycle_idx ON crop_observations(crop_cycle_id, date DESC);
`

export async function initPostgresSchema(clientOrPool) {
  await clientOrPool.query(POSTGRES_SCHEMA)
}

function convertToPgSql(sql) {
  let paramIndex = 1
  return sql
    .replace(/\?/g, () => `$${paramIndex++}`)
    .replace(/INSERT\s+OR\s+IGNORE\s+INTO\s+([a-zA-Z0-9_]+)\s*\(([^)]+)\)\s*VALUES\s*\(([^)]+)\)/gi, (m, table, cols, vals) => {
      const conflictCol = table.toLowerCase() === 'users' ? '(id)' : '(id)'
      return `INSERT INTO ${table} (${cols}) VALUES (${vals}) ON CONFLICT ${conflictCol} DO NOTHING`
    })
    .replace(/\browid\b/gi, 'id')
    .replace(/datetime\('now'\)/gi, 'CURRENT_TIMESTAMP')
    .replace(/strftime\('[^']+',\s*'now'\)/gi, 'CURRENT_TIMESTAMP')
}

let databaseInstance

if (isPostgres) {
  const pool = new Pool({
    connectionString: config.POSTGRES_CONNECTION_STRING,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
    max: 10,
  })

  // Ensure tables exist on first connect
  initPostgresSchema(pool).catch((err) => {
    console.error('Failed to initialize PostgreSQL schema:', err.message)
  })

  databaseInstance = {
    isPostgres: true,
    pool,
    prepare(sql) {
      const pgSql = convertToPgSql(sql)
      return {
        async get(...params) {
          const flatParams = params.length === 1 && Array.isArray(params[0]) ? params[0] : params
          const res = await pool.query(pgSql, flatParams)
          return res.rows[0] || null
        },
        async all(...params) {
          const flatParams = params.length === 1 && Array.isArray(params[0]) ? params[0] : params
          const res = await pool.query(pgSql, flatParams)
          return res.rows
        },
        async run(...params) {
          const flatParams = params.length === 1 && Array.isArray(params[0]) ? params[0] : params
          const res = await pool.query(pgSql, flatParams)
          return { changes: res.rowCount, lastInsertRowid: null }
        },
      }
    },
    async exec(sql) {
      return pool.query(sql)
    },
    pragma() {
      // pragma is a no-op on PostgreSQL
    },
    transaction(fn) {
      return async (...args) => {
        const client = await pool.connect()
        try {
          await client.query('BEGIN')
          const result = await fn(...args)
          await client.query('COMMIT')
          return result
        } catch (err) {
          await client.query('ROLLBACK')
          throw err
        } finally {
          client.release()
        }
      }
    },
    async close() {
      return pool.end()
    },
  }
} else {
  // SQLite mode (for local development and existing test suite)
  fs.mkdirSync(path.dirname(config.DATABASE_FILE), { recursive: true })
  const sqlite = new Database(config.DATABASE_FILE)
  sqlite.pragma('journal_mode = WAL')
  sqlite.pragma('foreign_keys = ON')
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS conversations (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now')),
      updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now'))
    );
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
      role TEXT NOT NULL CHECK (role IN ('user', 'model')),
      content TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS crop_diagnoses (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      crop_name TEXT NOT NULL,
      disease_name TEXT NOT NULL,
      image_filename TEXT NOT NULL,
      image_mime_type TEXT NOT NULL,
      confidence INTEGER NOT NULL CHECK (confidence BETWEEN 0 AND 100),
      severity TEXT NOT NULL CHECK (severity IN ('low', 'moderate', 'high', 'unknown')),
      result_json TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now'))
    );
    CREATE TABLE IF NOT EXISTS soil_analyses (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      crop_name TEXT NOT NULL DEFAULT '',
      location TEXT NOT NULL DEFAULT '',
      image_filename TEXT NOT NULL,
      image_mime_type TEXT NOT NULL,
      predicted_class TEXT,
      confidence REAL NOT NULL CHECK (confidence BETWEEN 0 AND 1),
      model_version TEXT,
      result_json TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now'))
    );

    CREATE TABLE IF NOT EXISTS crop_cycles (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      crop_name TEXT NOT NULL,
      crop_variety TEXT NOT NULL DEFAULT '',
      field_name TEXT NOT NULL DEFAULT '',
      farm_area REAL NOT NULL DEFAULT 1.0,
      sowing_date TEXT NOT NULL,
      crop_duration_days INTEGER NOT NULL,
      expected_harvest_date TEXT NOT NULL,
      actual_harvest_date TEXT,
      soil_type TEXT NOT NULL DEFAULT 'Loamy',
      irrigation_type TEXT NOT NULL DEFAULT 'Drip',
      water_availability TEXT NOT NULL DEFAULT 'Adequate',
      current_stage_index INTEGER NOT NULL DEFAULT 0,
      health_status TEXT NOT NULL DEFAULT 'Good',
      status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now')),
      updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now'))
    );

    CREATE TABLE IF NOT EXISTS calendar_tasks (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      crop_cycle_id TEXT REFERENCES crop_cycles(id) ON DELETE CASCADE,
      crop_name TEXT NOT NULL DEFAULT '',
      title TEXT NOT NULL,
      activity_type TEXT NOT NULL CHECK (activity_type IN (
        'land_prep', 'sowing', 'irrigation', 'fertilizer', 'weeding',
        'pest_monitoring', 'disease_inspection', 'growth_monitoring',
        'flowering', 'fruiting', 'harvest_prep', 'harvest', 'general'
      )),
      stage_name TEXT NOT NULL DEFAULT 'General',
      scheduled_date TEXT NOT NULL,
      original_date TEXT NOT NULL,
      completed_date TEXT,
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'skipped', 'rescheduled')),
      priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
      description TEXT NOT NULL DEFAULT '',
      weather_warning TEXT,
      rescheduled_reason TEXT,
      fertilizer_details TEXT,
      irrigation_details TEXT,
      notes TEXT NOT NULL DEFAULT '',
      image_filename TEXT,
      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now')),
      updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now'))
    );

    CREATE TABLE IF NOT EXISTS task_history (
      id TEXT PRIMARY KEY,
      task_id TEXT REFERENCES calendar_tasks(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      action TEXT NOT NULL,
      previous_status TEXT,
      new_status TEXT,
      previous_date TEXT,
      new_date TEXT,
      reason TEXT,
      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now'))
    );

    CREATE TABLE IF NOT EXISTS weather_alerts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      crop_cycle_id TEXT REFERENCES crop_cycles(id) ON DELETE CASCADE,
      task_id TEXT REFERENCES calendar_tasks(id) ON DELETE SET NULL,
      alert_type TEXT NOT NULL,
      severity TEXT NOT NULL DEFAULT 'warning' CHECK (severity IN ('info', 'warning', 'critical')),
      forecast_date TEXT NOT NULL,
      message TEXT NOT NULL,
      recommended_action TEXT NOT NULL,
      dismissed INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now'))
    );

    CREATE TABLE IF NOT EXISTS farm_expenses (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      crop_cycle_id TEXT REFERENCES crop_cycles(id) ON DELETE SET NULL,
      category TEXT NOT NULL,
      crop_name TEXT NOT NULL DEFAULT '',
      amount REAL NOT NULL,
      date TEXT NOT NULL,
      notes TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now'))
    );

    CREATE TABLE IF NOT EXISTS crop_observations (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      crop_cycle_id TEXT NOT NULL REFERENCES crop_cycles(id) ON DELETE CASCADE,
      date TEXT NOT NULL,
      stage_index INTEGER,
      observation_text TEXT NOT NULL,
      image_filename TEXT,
      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now'))
    );

    CREATE INDEX IF NOT EXISTS messages_conversation_created_idx ON messages(conversation_id, created_at);
    CREATE INDEX IF NOT EXISTS conversations_user_updated_idx ON conversations(user_id, updated_at);
    CREATE INDEX IF NOT EXISTS crop_diagnoses_user_created_idx ON crop_diagnoses(user_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS soil_analyses_user_created_idx ON soil_analyses(user_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS crop_cycles_user_status_idx ON crop_cycles(user_id, status);
    CREATE INDEX IF NOT EXISTS calendar_tasks_user_date_idx ON calendar_tasks(user_id, scheduled_date ASC);
    CREATE INDEX IF NOT EXISTS calendar_tasks_cycle_idx ON calendar_tasks(crop_cycle_id);
    CREATE INDEX IF NOT EXISTS task_history_task_created_idx ON task_history(task_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS weather_alerts_user_date_idx ON weather_alerts(user_id, forecast_date DESC);
    CREATE INDEX IF NOT EXISTS farm_expenses_user_date_idx ON farm_expenses(user_id, date DESC);
    CREATE INDEX IF NOT EXISTS crop_observations_cycle_idx ON crop_observations(crop_cycle_id, date DESC);
  `)

  databaseInstance = sqlite
}

export const database = databaseInstance
