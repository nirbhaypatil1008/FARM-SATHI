import { app } from './app.js'
import { config } from './config.js'
import { database, isPostgres } from './db.js'

const server = app.listen(config.PORT, () => {
  console.log(`Farm Saathi API listening on http://localhost:${config.PORT}`)
  console.log(`Database engine: ${isPostgres ? 'PostgreSQL' : 'SQLite (' + config.DATABASE_FILE + ')'}`)
})

function shutdown(signal) {
  console.log(`${signal} received. Closing the API server.`)
  server.close(async () => {
    try {
      if (typeof database.close === 'function') {
        await database.close()
      }
    } catch (err) {
      console.error('Error closing database:', err.message)
    }
    process.exit(0)
  })
}

process.on('SIGINT', () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))
