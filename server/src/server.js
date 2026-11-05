import { app } from './app.js'
import { config } from './config.js'
import { database } from './db.js'

const server = app.listen(config.PORT, () => {
  console.log(`Farm Saathi API listening on http://localhost:${config.PORT}`)
  console.log(`SQLite database: ${config.DATABASE_FILE}`)
})

function shutdown(signal) {
  console.log(`${signal} received. Closing the API server.`)
  server.close(() => {
    database.close()
    process.exit(0)
  })
}

process.on('SIGINT', () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))
