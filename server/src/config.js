import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { randomBytes } from 'node:crypto'
import dotenv from 'dotenv'
import { z } from 'zod'

const serverDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
dotenv.config({ path: path.join(serverDirectory, '.env') })

const environmentSchema = z.object({
  PORT: z.coerce.number().int().min(1).max(65535).default(5000),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  CLIENT_URL: z.string().url().default('http://localhost:5173'),
  JWT_SECRET: z.string().optional(),
  JWT_EXPIRES_IN: z.string().regex(/^\d+(s|m|h|d|w|y)$/, 'Use a duration such as 30m, 12h or 7d.').default('7d'),
  DATABASE_PATH: z.string().default(process.env.VERCEL ? '/tmp/farm-saathi.sqlite' : './data/farm-saathi.sqlite'),
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().trim().min(1).default('gemini-3.8-flash'),
  AI_SERVICE_URL: z.string().default('http://127.0.0.1:8000'),
})

const parsed = environmentSchema.safeParse(process.env)
if (!parsed.success) {
  console.error('Invalid server environment configuration:', parsed.error.flatten().fieldErrors)
  process.exit(1)
}

const env = parsed.data
const insecureJwtSecret = !env.JWT_SECRET || env.JWT_SECRET.length < 32 || /replace|change.?me|example/i.test(env.JWT_SECRET)

if (insecureJwtSecret && env.NODE_ENV === 'production') {
  console.error('JWT_SECRET is required in production and must be at least 32 characters. Set it in server/.env.')
  process.exit(1)
}

if (insecureJwtSecret) {
  env.JWT_SECRET = randomBytes(48).toString('base64url')
  console.warn('JWT_SECRET is not configured. Using a temporary development secret; all sessions expire when this server restarts.')
}

if (!env.GEMINI_API_KEY?.trim()) {
  console.warn('GEMINI_API_KEY is missing. Chat endpoints will return a setup message until configured in server/.env.')
}

export const config = Object.freeze({
  ...env,
  SERVER_DIRECTORY: serverDirectory,
  DATABASE_FILE: path.resolve(serverDirectory, env.DATABASE_PATH),
  GEMINI_API_KEY: env.GEMINI_API_KEY?.trim() || '',
})
