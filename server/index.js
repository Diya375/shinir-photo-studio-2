import dotenv from 'dotenv'
import express from 'express'
import Database from 'better-sqlite3'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { SERVICES, PACKAGES, GALLERY } from '../src/data.js'

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
dotenv.config({ path: path.join(rootDir, '.env'), override: true })

const { PORT = 4000, JWT_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD, DB_PATH = 'server/data/studio.db', SLOT_START = '9', SLOT_END = '18', CLOSED_DAYS = '6', NODE_ENV } = process.env
if (!JWT_SECRET || JWT_SECRET.length < 24) throw new Error('Set JWT_SECRET (24+ chars) in .env')
const CLOSED = CLOSED_DAYS.split(',').filter(Boolean).map(Number)
const SLOTS = Array.from({ length: SLOT_END - SLOT_START }, (_, i) => String(+SLOT_START + i).padStart(2, '0') + ':00')
const ACTIVE = `('pending','approved','completed')`

// ---------- Database ----------
const dbPath = path.isAbsolute(DB_PATH) ? DB_PATH : path.resolve(rootDir, DB_PATH)
fs.mkdirSync(path.dirname(dbPath), { recursive: true })
const db = new Database(dbPath)
db.pragma('journal_mode = WAL')
db.exec(`
CREATE TABLE IF NOT EXISTS services(id INTEGER PRIMARY KEY, icon TEXT, title TEXT NOT NULL, descr TEXT, price TEXT, active INTEGER DEFAULT 1, sort INTEGER DEFAULT 0);
CREATE TABLE IF NOT EXISTS packages(id INTEGER PRIMARY KEY, name TEXT NOT NULL, price TEXT, features TEXT DEFAULT '[]', featured INTEGER DEFAULT 0, active INTEGER DEFAULT 1, sort INTEGER DEFAULT 0);
CREATE TABLE IF NOT EXISTS gallery(id INTEGER PRIMARY KEY, cat TEXT, src TEXT NOT NULL, sort INTEGER DEFAULT 0);
CREATE TABLE IF NOT EXISTS bookings(id INTEGER PRIMARY KEY, ref TEXT UNIQUE NOT NULL, name TEXT NOT NULL, phone TEXT NOT NULL, email TEXT, service TEXT NOT NULL, package TEXT, date TEXT NOT NULL, time TEXT NOT NULL, message TEXT, status TEXT NOT NULL DEFAULT 'pending', created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE UNIQUE INDEX IF NOT EXISTS uq_slot ON bookings(date,time) WHERE status IN ${ACTIVE};
CREATE TABLE IF NOT EXISTS admin(id INTEGER PRIMARY KEY, email TEXT UNIQUE NOT NULL, hash TEXT NOT NULL);`)

// First-run starter catalog (editable/deletable from the admin dashboard)
if (!db.prepare('SELECT 1 FROM services').get()) {
  SERVICES.forEach((s, i) => db.prepare('INSERT INTO services(icon,title,descr,price,sort) VALUES(?,?,?,?,?)').run(s.icon, s.title, s.desc, s.price, i))
  PACKAGES.forEach((p, i) => db.prepare('INSERT INTO packages(name,price,features,featured,sort) VALUES(?,?,?,?,?)').run(p.name, p.price, JSON.stringify(p.features), +p.featured, i))
  GALLERY.forEach((g, i) => db.prepare('INSERT INTO gallery(cat,src,sort) VALUES(?,?,?)').run(g.cat, g.src, i))
}
if (ADMIN_EMAIL && ADMIN_PASSWORD) {
  if (ADMIN_PASSWORD.length < 8) throw new Error('ADMIN_PASSWORD must be 8+ chars')
  db.prepare('DELETE FROM admin').run()
  db.prepare('INSERT INTO admin(email,hash) VALUES(?,?)').run(ADMIN_EMAIL.toLowerCase(), bcrypt.hashSync(ADMIN_PASSWORD, 12))
} else if (!db.prepare('SELECT 1 FROM admin').get()) throw new Error('Set ADMIN_EMAIL and ADMIN_PASSWORD in .env')
const DUMMY = bcrypt.hashSync('x', 10)

// ---------- Helpers ----------
const app = express()
app.disable('x-powered-by')
app.use((q, s, n) => { s.set({ 'X-Content-Type-Options': 'nosniff', 'X-Frame-Options': 'DENY', 'Referrer-Policy': 'same-origin' }); n() })
app.use(express.json({ limit: '20kb' }))
const hits = new Map()
const limit = (max, ms) => (q, s, n) => {
  const k = q.path + q.ip, now = Date.now(), a = (hits.get(k) || []).filter((t) => now - t < ms)
  if (a.length >= max) return s.status(429).json({ error: 'Too many attempts. Please try again later.' })
  hits.set(k, [...a, now]); n()
}
const npNow = () => new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Kathmandu' })
function dateError(d) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return 'Invalid date'
  const dt = new Date(d + 'T00:00:00Z')
  if (isNaN(dt) || dt.toISOString().slice(0, 10) !== d) return 'Invalid date'
  if (d < npNow().slice(0, 10)) return 'This date is in the past'
  if (CLOSED.includes(dt.getUTCDay())) return 'We are closed on this day'
  if (dt - Date.now() > 200 * 864e5) return 'Please choose a nearer date'
}
const slotsFor = (d) => {
  const taken = new Set(db.prepare(`SELECT time FROM bookings WHERE date=? AND status IN ${ACTIVE}`).all(d).map((r) => r.time))
  const now = npNow().slice(0, 16)
  return SLOTS.map((time) => ({ time, available: !taken.has(time) && `${d} ${time}` > now }))
}
const str = (v, max) => String(v ?? '').trim().slice(0, max)

// ---------- Public API ----------
const pubServices = () => db.prepare('SELECT id,icon,title,descr AS "desc",price FROM services WHERE active=1 ORDER BY sort,id').all()
const parsePkg = (p) => ({ ...p, features: JSON.parse(p.features || '[]'), featured: !!p.featured })
app.get('/api/catalog', (q, s) => s.json({
  services: pubServices(),
  packages: db.prepare('SELECT * FROM packages WHERE active=1 ORDER BY sort,id').all().map(parsePkg),
  gallery: db.prepare('SELECT id,cat,src FROM gallery ORDER BY sort,id DESC').all(),
}))
app.get('/api/slots', (q, s) => {
  const e = dateError(str(q.query.date, 10))
  s.json(e ? { slots: [], message: e } : { slots: slotsFor(q.query.date) })
})
app.post('/api/bookings', limit(10, 36e5), (q, s) => {
  const b = q.body || {}, f = { name: str(b.name, 80), phone: str(b.phone, 20), email: str(b.email, 120).toLowerCase(), service: str(b.service, 120), package: str(b.package, 120), date: str(b.date, 10), time: str(b.time, 5), message: str(b.message, 1000) }
  const fields = {}
  if (f.name.length < 2) fields.name = 'Please enter your full name'
  if (!/^\+?[\d\s-]{7,18}$/.test(f.phone)) fields.phone = 'Enter a valid phone number'
  if (f.email && !/^\S+@\S+\.\S+$/.test(f.email)) fields.email = 'Enter a valid email'
  if (!db.prepare('SELECT 1 FROM services WHERE title=? AND active=1').get(f.service)) fields.service = 'Please select a valid service'
  if (f.package && !db.prepare('SELECT 1 FROM packages WHERE name=? AND active=1').get(f.package)) fields.package = 'Invalid package'
  const de = dateError(f.date)
  if (de) fields.date = de
  else {
    const sl = slotsFor(f.date).find((x) => x.time === f.time)
    if (!sl) fields.time = 'Invalid time'
    else if (!sl.available) fields.time = 'This time slot is no longer available'
  }
  if (Object.keys(fields).length) return s.status(400).json({ error: 'Please fix the highlighted fields', fields })
  const ref = 'SH-' + crypto.randomBytes(3).toString('hex').toUpperCase()
  try {
    db.prepare('INSERT INTO bookings(ref,name,phone,email,service,package,date,time,message) VALUES(?,?,?,?,?,?,?,?,?)').run(ref, f.name, f.phone, f.email, f.service, f.package, f.date, f.time, f.message)
  } catch (e) {
    if (String(e.code).startsWith('SQLITE_CONSTRAINT')) return s.status(409).json({ error: 'Sorry, that time slot was just booked. Please pick another.', fields: { time: 'Slot just taken' } })
    throw e
  }
  s.status(201).json({ ref, status: 'pending', ...f })
})

// ---------- Admin auth ----------
const cookieOpts = { httpOnly: true, sameSite: 'strict', secure: NODE_ENV === 'production', maxAge: 8 * 36e5, path: '/' }
const setCookie = (s, v, o) => s.append('Set-Cookie', `token=${v}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${o.maxAge / 1000}${o.secure ? '; Secure' : ''}`)
app.post('/api/admin/login', limit(5, 9e5), (q, s) => {
  const row = db.prepare('SELECT * FROM admin WHERE email=?').get(str(q.body?.email, 120).toLowerCase())
  const ok = bcrypt.compareSync(String(q.body?.password ?? ''), row?.hash || DUMMY)
  if (!row || !ok) return s.status(401).json({ error: 'Invalid email or password' })
  setCookie(s, jwt.sign({ id: row.id, email: row.email }, JWT_SECRET, { expiresIn: '8h' }), cookieOpts)
  s.json({ email: row.email })
})
app.post('/api/admin/logout', (q, s) => { setCookie(s, '', { ...cookieOpts, maxAge: 0 }); s.json({ ok: true }) })
const auth = (q, s, n) => {
  const t = (q.headers.cookie || '').split(';').map((x) => x.trim()).find((x) => x.startsWith('token='))?.slice(6)
  try { q.admin = jwt.verify(t, JWT_SECRET); n() } catch { s.status(401).json({ error: 'Not authenticated' }) }
}
const admin = express.Router()
admin.use(auth)
admin.get('/me', (q, s) => s.json({ email: q.admin.email }))

// ---------- Admin: bookings ----------
admin.get('/bookings', (q, s) => {
  const st = str(q.query.status, 12)
  s.json(db.prepare(`SELECT * FROM bookings ${st ? 'WHERE status=?' : ''} ORDER BY date DESC,time DESC`).all(...(st ? [st] : [])))
})
const NEXT = { pending: ['approved', 'rejected', 'cancelled'], approved: ['completed', 'cancelled'] }
admin.patch('/bookings/:id/status', (q, s) => {
  const b = db.prepare('SELECT * FROM bookings WHERE id=?').get(q.params.id)
  if (!b) return s.status(404).json({ error: 'Booking not found' })
  if (!NEXT[b.status]?.includes(q.body?.status)) return s.status(400).json({ error: `Cannot change a ${b.status} booking to ${q.body?.status}` })
  db.prepare('UPDATE bookings SET status=? WHERE id=?').run(q.body.status, b.id)
  s.json({ ...b, status: q.body.status })
})

// ---------- Admin: catalog CRUD ----------
function crud(name, cols, pre, post, order) {
  const clean = (b) => { const o = pre(b || {}); return cols.map((c) => ['active', 'featured', 'sort'].includes(c) ? +(o[c] ?? (c === 'active' ? 1 : 0)) : str(o[c], c === 'features' ? 3000 : 600)) }
  const bad = (v) => (!v[cols.indexOf(cols.find((c) => ['title', 'name', 'src'].includes(c)))] ? 'Title / name / image URL is required' : name === 'gallery' && !/^(https?:\/\/|\/)/.test(v[1] === undefined ? '' : v[cols.indexOf('src')]) ? 'Image URL must start with http(s)://' : '')
  const get = (id) => post(db.prepare(`SELECT *${name === 'services' ? ', descr AS "desc"' : ''} FROM ${name} WHERE id=?`).get(id))
  const r = express.Router()
  r.get('/', (q, s) => s.json(db.prepare(`SELECT *${name === 'services' ? ', descr AS "desc"' : ''} FROM ${name} ORDER BY ${order}`).all().map(post)))
  r.post('/', (q, s) => { const v = clean(q.body), e = bad(v); if (e) return s.status(400).json({ error: e }); s.status(201).json(get(db.prepare(`INSERT INTO ${name}(${cols}) VALUES(${cols.map(() => '?')})`).run(v).lastInsertRowid)) })
  r.put('/:id', (q, s) => { const v = clean(q.body), e = bad(v); if (e) return s.status(400).json({ error: e }); const x = db.prepare(`UPDATE ${name} SET ${cols.map((c) => c + '=?')} WHERE id=?`).run(...v, q.params.id); x.changes ? s.json(get(q.params.id)) : s.status(404).json({ error: 'Not found' }) })
  r.delete('/:id', (q, s) => { db.prepare(`DELETE FROM ${name} WHERE id=?`).run(q.params.id); s.json({ ok: true }) })
  return r
}
admin.use('/services', crud('services', ['icon', 'title', 'descr', 'price', 'active', 'sort'], (b) => ({ ...b, descr: b.desc }), (x) => x, 'sort,id'))
admin.use('/packages', crud('packages', ['name', 'price', 'features', 'featured', 'active', 'sort'], (b) => ({ ...b, features: JSON.stringify((Array.isArray(b.features) ? b.features : []).map((f) => str(f, 120)).filter(Boolean)) }), (x) => (x ? parsePkg(x) : x), 'sort,id'))
admin.use('/gallery', crud('gallery', ['cat', 'src', 'sort'], (b) => b, (x) => x, 'sort,id DESC'))
app.use('/api/admin', admin)
app.use('/api', (q, s) => s.status(404).json({ error: 'Not found' }))

// ---------- Serve built frontend in production ----------
if (fs.existsSync('dist')) { app.use(express.static('dist')); app.get('*', (q, s) => s.sendFile(path.resolve('dist/index.html'))) }
app.use((err, q, s, n) => { if (err.type === 'entity.parse.failed') return s.status(400).json({ error: 'Invalid request' }); console.error(err); s.status(500).json({ error: 'Server error. Please try again.' }) })
app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`))