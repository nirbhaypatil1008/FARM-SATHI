import fs from 'node:fs'
import Database from 'better-sqlite3'
import pg from 'pg'
import { config } from '../src/config.js'
import { initPostgresSchema } from '../src/db.js'

const { Pool } = pg

const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL || config.POSTGRES_CONNECTION_STRING

if (!connectionString) {
  console.error('\n❌ Error: No PostgreSQL connection string provided.')
  console.error('Set POSTGRES_URL or DATABASE_URL before running this migration, for example:')
  console.error('  $env:POSTGRES_URL="postgresql://user:pass@host:5432/dbname"')
  console.error('  npm run migrate:postgres\n')
  process.exit(1)
}

if (!fs.existsSync(config.DATABASE_FILE)) {
  console.warn(`⚠️ SQLite file not found at ${config.DATABASE_FILE}. Skipping data migration.`)
  process.exit(0)
}

console.log('--- Starting Safe SQLite to PostgreSQL Migration ---')
console.log(`Source SQLite Database: ${config.DATABASE_FILE}`)
console.log(`Target PostgreSQL: ${connectionString.replace(/:\/\/[^:]+:[^@]+@/, '://***:***@')}`)

const sqlite = new Database(config.DATABASE_FILE, { readonly: true })
const pool = new Pool({
  connectionString,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
  max: 5,
})

const TABLES = [
  {
    name: 'users',
    conflictKey: 'id',
    columns: ['id', 'name', 'email', 'password_hash', 'created_at'],
  },
  {
    name: 'conversations',
    conflictKey: 'id',
    columns: ['id', 'user_id', 'title', 'created_at', 'updated_at'],
  },
  {
    name: 'messages',
    conflictKey: 'id',
    columns: ['id', 'conversation_id', 'role', 'content', 'created_at'],
  },
  {
    name: 'crop_diagnoses',
    conflictKey: 'id',
    columns: ['id', 'user_id', 'crop_name', 'disease_name', 'image_filename', 'image_mime_type', 'confidence', 'severity', 'result_json', 'created_at'],
  },
  {
    name: 'soil_analyses',
    conflictKey: 'id',
    columns: ['id', 'user_id', 'crop_name', 'location', 'image_filename', 'image_mime_type', 'predicted_class', 'confidence', 'model_version', 'result_json', 'created_at'],
  },
  {
    name: 'crop_cycles',
    conflictKey: 'id',
    columns: ['id', 'user_id', 'crop_name', 'crop_variety', 'field_name', 'farm_area', 'sowing_date', 'crop_duration_days', 'expected_harvest_date', 'actual_harvest_date', 'soil_type', 'irrigation_type', 'water_availability', 'current_stage_index', 'health_status', 'status', 'created_at', 'updated_at'],
  },
  {
    name: 'calendar_tasks',
    conflictKey: 'id',
    columns: ['id', 'user_id', 'crop_cycle_id', 'crop_name', 'title', 'activity_type', 'stage_name', 'scheduled_date', 'original_date', 'completed_date', 'status', 'priority', 'description', 'weather_warning', 'rescheduled_reason', 'fertilizer_details', 'irrigation_details', 'notes', 'image_filename', 'created_at', 'updated_at'],
  },
  {
    name: 'task_history',
    conflictKey: 'id',
    columns: ['id', 'task_id', 'user_id', 'action', 'previous_status', 'new_status', 'previous_date', 'new_date', 'reason', 'created_at'],
  },
  {
    name: 'weather_alerts',
    conflictKey: 'id',
    columns: ['id', 'user_id', 'crop_cycle_id', 'task_id', 'alert_type', 'severity', 'forecast_date', 'message', 'recommended_action', 'dismissed', 'created_at'],
  },
  {
    name: 'farm_expenses',
    conflictKey: 'id',
    columns: ['id', 'user_id', 'crop_cycle_id', 'category', 'crop_name', 'amount', 'date', 'notes', 'created_at'],
  },
  {
    name: 'crop_observations',
    conflictKey: 'id',
    columns: ['id', 'user_id', 'crop_cycle_id', 'date', 'stage_index', 'observation_text', 'image_filename', 'created_at'],
  },
]

async function runMigration() {
  const client = await pool.connect()
  try {
    console.log('Ensuring PostgreSQL schema and tables exist...')
    await initPostgresSchema(client)
    console.log('✓ PostgreSQL schema verified.')

    let totalMigrated = 0

    for (const table of TABLES) {
      // Check if table exists in SQLite
      const tableExists = sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name = ?").get(table.name)
      if (!tableExists) {
        console.log(`ℹ Table ${table.name} does not exist in SQLite, skipping.`)
        continue
      }

      const rows = sqlite.prepare(`SELECT * FROM ${table.name}`).all()
      if (rows.length === 0) {
        console.log(`ℹ Table ${table.name}: 0 rows found in SQLite.`)
        continue
      }

      console.log(`Migrating ${rows.length} records for ${table.name}...`)
      let insertedCount = 0

      for (const row of rows) {
        const rowCols = table.columns.filter((c) => row[c] !== undefined)
        const placeholders = rowCols.map((_, i) => `$${i + 1}`).join(', ')
        const values = rowCols.map((c) => row[c])

        const query = `
          INSERT INTO ${table.name} (${rowCols.join(', ')})
          VALUES (${placeholders})
          ON CONFLICT (${table.conflictKey}) DO NOTHING
        `
        const res = await client.query(query, values)
        if (res.rowCount > 0) insertedCount++
      }

      console.log(`✓ ${table.name}: ${insertedCount} new rows migrated (${rows.length - insertedCount} skipped as already present).`)
      totalMigrated += insertedCount
    }

    console.log('\n--- Migration Finished Successfully ---')
    console.log(`Total new rows written to PostgreSQL: ${totalMigrated}`)
    console.log('SQLite database was preserved intact and remains fully functional.')
  } catch (err) {
    console.error('\n❌ Migration failed with error:', err)
    process.exitCode = 1
  } finally {
    client.release()
    await pool.end()
    sqlite.close()
  }
}

runMigration()

