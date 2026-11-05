import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import { config } from './config.js'
import { database } from './db.js'

const scrypt = promisify(scryptCallback)
const credentialsSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()),
  password: z.string().min(10).max(128),
})

export async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex')
  const derived = await scrypt(password, salt, 64)
  return `${salt}:${derived.toString('hex')}`
}

async function verifyPassword(password, storedHash) {
  const [salt, expectedHex] = storedHash.split(':')
  if (!salt || !expectedHex) return false
  const expected = Buffer.from(expectedHex, 'hex')
  const actual = await scrypt(password, salt, expected.length)
  return expected.length === actual.length && timingSafeEqual(expected, actual)
}

export function issueToken(user) {
  return jwt.sign({ sub: user.id, email: user.email, name: user.name }, config.JWT_SECRET, { expiresIn: config.JWT_EXPIRES_IN })
}

export function authenticate(req, res, next) {
  const value = req.get('authorization') || ''
  const [scheme, token] = value.split(' ')
  if (scheme !== 'Bearer' || !token) return res.status(401).json({ error: 'Sign in to use the farming assistant.' })
  try {
    const claims = jwt.verify(token, config.JWT_SECRET)
    if (typeof claims === 'string' || typeof claims.sub !== 'string') {
      return res.status(401).json({ error: 'Your session is invalid. Sign in again.' })
    }
    const user = database.prepare('SELECT id, name, email FROM users WHERE id = ?').get(claims.sub)
    if (!user) return res.status(401).json({ error: 'Your account is no longer available. Sign in again.' })
    req.user = user
    next()
  } catch {
    return res.status(401).json({ error: 'Your session expired or is invalid. Sign in again.' })
  }
}

export function authenticateOptional(req, res, next) {
  const value = req.get('authorization') || ''
  if (!value) return next()
  return authenticate(req, res, next)
}

export async function register(req, res, next) {
  const parsed = credentialsSchema.extend({ name: z.string().trim().min(2).max(80) }).safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: 'Enter your name, a valid email, and a password of at least 10 characters.', details: parsed.error.flatten().fieldErrors })
  try {
    const id = randomBytes(16).toString('hex')
    const passwordHash = await hashPassword(parsed.data.password)
    database.prepare('INSERT INTO users (id, name, email, password_hash) VALUES (?, ?, ?, ?)').run(id, parsed.data.name, parsed.data.email, passwordHash)
    const user = { id, name: parsed.data.name, email: parsed.data.email }
    return res.status(201).json({ token: issueToken(user), user })
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') return res.status(409).json({ error: 'An account with this email already exists. Sign in instead.' })
    return next(error)
  }
}

export async function login(req, res) {
  const parsed = credentialsSchema.pick({ email: true, password: true }).safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: 'Enter a valid email and password.' })
  const row = database.prepare('SELECT id, name, email, password_hash FROM users WHERE email = ?').get(parsed.data.email)
  const valid = row ? await verifyPassword(parsed.data.password, row.password_hash) : false
  if (!valid) return res.status(401).json({ error: 'Email or password is incorrect.' })
  const user = { id: row.id, name: row.name, email: row.email }
  return res.json({ token: issueToken(user), user })
}
