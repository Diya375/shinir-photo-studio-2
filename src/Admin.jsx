import { useEffect, useState } from 'react'
import { api, t12 } from './api'
import { BUSINESS as B } from './data'

const BADGE = { pending: 'bg-yellow-500/20 text-yellow-300', approved: 'bg-green-500/20 text-green-300', rejected: 'bg-red-500/20 text-red-300', cancelled: 'bg-zinc-500/30 text-zinc-300', completed: 'bg-blue-500/20 text-blue-300' }
const ACTIONS = { pending: [['approved', 'Approve'], ['rejected', 'Reject'], ['cancelled', 'Cancel']], approved: [['completed', 'Mark Completed'], ['cancelled', 'Cancel']] }
const Tab = ({ a, ...p }) => <button {...p} className={`px-4 py-2 rounded-full text-sm border ${a ? 'bg-gold text-black border-gold' : 'border-white/20 hover:border-gold'}`} />

function Login({ onLogin }) {
  const [f, setF] = useState({ email: '', password: '' }), [err, setErr] = useState(''), [busy, setBusy] = useState(false)
  const go = async (e) => {
    e.preventDefault(); setBusy(true); setErr('')
    try { onLogin((await api('/admin/login', { method: 'POST', body: f })).email) } catch (x) { setErr(x.message) } finally { setBusy(false) }
  }
  return (
    <div className="min-h-screen flex items-center justify-center p-5">
      <form onSubmit={go} className="w-full max-w-sm border border-gold/30 rounded-2xl p-8 space-y-4">
        <h1 className="font-serif text-2xl text-center">Admin Login</h1>
        <input required type="email" placeholder="Email" className="input" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
        <input required type="password" placeholder="Password" className="input" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} />
        {err && <p className="text-red-400 text-sm text-center">{err}</p>}
        <button disabled={busy} className="btn-gold w-full disabled:opacity-60">{busy ? 'Signing in…' : 'Login'}</button>
        <a href="#/" className="block text-center text-sm text-white/50">← Back to website</a>
      </form>
    </div>
  )
}

const today = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Kathmandu' })
const waNum = (p) => { const d = String(p).replace(/\D/g, '').replace(/^0+/, ''); return d.length <= 10 ? '977' + d : d }
const WA_TEXT = {
  pending: (b) => `Hello ${b.name}, we received your booking ${b.ref} for ${b.service} on ${b.date} at ${t12(b.time)}. We will confirm shortly. – ${B.name}`,
  approved: (b) => `Hello ${b.name}, your booking ${b.ref} is CONFIRMED: ${b.service} on ${b.date} at ${t12(b.time)}. See you at the studio! – ${B.name}`,
  rejected: (b) => `Hello ${b.name}, sorry, we could not accept booking ${b.ref} for ${b.date} at ${t12(b.time)}. Please choose another time. – ${B.name}`,
  cancelled: (b) => `Hello ${b.name}, your booking ${b.ref} on ${b.date} at ${t12(b.time)} has been cancelled. – ${B.name}`,
  completed: (b) => `Hello ${b.name}, thank you for visiting ${B.name}! We hope you loved the results.`,
}

function Bookings() {
  const [all, setAll] = useState(null), [st, setSt] = useState('pending'), [q, setQ] = useState(''), [day, setDay] = useState('')
  const [err, setErr] = useState(''), [busy, setBusy] = useState(0)
  const load = () => api('/admin/bookings').then(setAll).catch((e) => setErr(e.message))
  useEffect(() => { load(); const i = setInterval(load, 30000); return () => clearInterval(i) }, [])
  const act = async (b, status) => {
    if (['rejected', 'cancelled'].includes(status) && !confirm(`${status === 'rejected' ? 'Reject' : 'Cancel'} booking ${b.ref}?`)) return
    setBusy(b.id); setErr('')
    try { await api(`/admin/bookings/${b.id}/status`, { method: 'PATCH', body: { status } }); await load() } catch (e) { setErr(e.message) } finally { setBusy(0) }
  }
  if (!all) return <p className="text-white/50">{err || 'Loading…'}</p>

  const T = today(), needle = q.trim().toLowerCase()
  const n = (f) => all.filter(f).length
  const stats = [
    ['Pending', n((b) => b.status === 'pending'), 'pending', 'text-yellow-300'],
    ['Today', n((b) => b.date === T && ['pending', 'approved'].includes(b.status)), 'today', 'text-gold'],
    ['Upcoming', n((b) => b.status === 'approved' && b.date >= T), 'approved', 'text-green-300'],
    ['To complete', n((b) => b.status === 'approved' && b.date < T), 'overdue', 'text-red-300'],
  ]
  const rank = (b) => (b.status === 'pending' ? 0 : b.status === 'approved' && b.date >= T ? 1 : 2)
  const rows = all
    .filter((b) => (st === 'today' ? b.date === T && ['pending', 'approved'].includes(b.status) : st === 'overdue' ? b.status === 'approved' && b.date < T : !st || b.status === st))
    .filter((b) => !day || b.date === day)
    .filter((b) => !needle || [b.name, b.phone, b.ref, b.email].some((x) => (x || '').toLowerCase().includes(needle)))
    .sort((a, b) => rank(a) - rank(b) || (rank(a) < 2 ? (a.date + a.time).localeCompare(b.date + b.time) : (b.date + b.time).localeCompare(a.date + a.time)))

  const exportCsv = () => {
    const cols = ['ref', 'name', 'phone', 'email', 'service', 'package', 'date', 'time', 'status', 'message']
    const esc = (v) => { let s = String(v ?? ''); if (/^[=+\-@]/.test(s)) s = "'" + s; return `"${s.replace(/"/g, '""')}"` }
    const csv = [cols.join(','), ...rows.map((b) => cols.map((c) => esc(b[c])).join(','))].join('\n')
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = `bookings-${T}.csv`; a.click()
  }

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {stats.map(([l, v, k, c]) => (
          <button key={l} onClick={() => setSt(k)} className={`text-left border rounded-xl p-4 transition ${st === k ? 'border-gold bg-gold/10' : 'border-white/10 hover:border-gold'}`}>
            <div className={`font-serif text-3xl ${c}`}>{v}</div><div className="text-xs text-white/60 mt-1">{l}</div>
          </button>
        ))}
      </div>
      <div className="flex gap-2 flex-wrap mb-4">
        {['', 'pending', 'approved', 'completed', 'rejected', 'cancelled'].map((s) => <Tab key={s} a={st === s} onClick={() => setSt(s)}>{s || 'All'} ({s ? n((b) => b.status === s) : all.length})</Tab>)}
      </div>
      <div className="flex gap-3 flex-wrap mb-4">
        <input placeholder="Search name, phone or ref…" className="input !py-2 flex-1 min-w-48" value={q} onChange={(e) => setQ(e.target.value)} />
        <input type="date" className="input !py-2 !w-auto [color-scheme:dark]" value={day} onChange={(e) => setDay(e.target.value)} />
        {(day || q) && <button className="text-sm text-white/60 underline" onClick={() => { setDay(''); setQ('') }}>Clear</button>}
        <button className="btn-line !py-2 !px-4 text-sm" onClick={exportCsv} disabled={!rows.length}>Export CSV</button>
      </div>
      {err && <p className="text-red-400 text-sm mb-3">{err}</p>}
      {!rows.length ? <p className="text-white/50">{st === 'pending' && !q && !day ? 'No pending bookings. You are all caught up ✓' : 'No bookings found.'}</p> : rows.map((b) => {
        const isToday = b.date === T && ['pending', 'approved'].includes(b.status)
        const overdue = b.status === 'approved' && b.date < T
        return (
          <div key={b.id} className={`border rounded-xl p-4 mb-3 grid sm:grid-cols-[1fr_auto] gap-3 ${b.status === 'pending' ? 'border-yellow-500/40' : 'border-white/10'}`}>
            <div className="text-sm space-y-1">
              <p className="font-semibold text-gold">{b.name} <span className="text-white/40 font-normal">· {b.ref}</span> <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${BADGE[b.status]}`}>{b.status}</span>
                {isToday && <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-gold text-black">TODAY</span>}
                {overdue && <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-red-500/30 text-red-200">Date passed – mark completed?</span>}
              </p>
              <p>📞 <a href={'tel:' + b.phone}>{b.phone}</a> {b.email && <>· ✉️ <a href={'mailto:' + b.email}>{b.email}</a></>}</p>
              <p>📸 {b.service}{b.package && ` — ${b.package}`}</p>
              <p>📅 {b.date} · ⏰ {t12(b.time)}</p>
              {b.message && <p className="text-white/60">“{b.message}”</p>}
              <p className="text-white/30 text-xs">Requested {b.created_at}</p>
            </div>
            <div className="flex sm:flex-col gap-2 flex-wrap">
              {(ACTIONS[b.status] || []).map(([s, l]) => <button key={s} disabled={busy === b.id} onClick={() => act(b, s)} className="btn-line !py-1 !px-4 text-xs disabled:opacity-50">{l}</button>)}
              <a target="_blank" rel="noreferrer" href={`https://wa.me/${waNum(b.phone)}?text=${encodeURIComponent(WA_TEXT[b.status](b))}`} className="btn-gold !py-1 !px-4 text-xs text-center">WhatsApp</a>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function Editor({ res, fields, blank }) {
  const [rows, setRows] = useState(null), [err, setErr] = useState(''), [msg, setMsg] = useState(''), [busy, setBusy] = useState(null)
  const load = () => api('/admin/' + res).then(setRows).catch((e) => setErr(e.message))
  useEffect(() => { setRows(null); load() }, [res])
  const edit = (id, k, v) => setRows(rows.map((r) => (r.id === id ? { ...r, [k]: v } : r)))
  const save = async (r) => {
    setBusy(r.id); setErr(''); setMsg('')
    try { await api('/admin/' + res + (r.isNew ? '' : '/' + r.id), { method: r.isNew ? 'POST' : 'PUT', body: r }); await load(); setMsg('Saved ✓') } catch (e) { setErr(e.message) } finally { setBusy(null) }
  }
  const del = async (r) => {
    if (r.isNew) return setRows(rows.filter((x) => x !== r))
    if (!confirm('Delete this item permanently?')) return
    try { await api(`/admin/${res}/${r.id}`, { method: 'DELETE' }); await load() } catch (e) { setErr(e.message) }
  }
  if (!rows) return <p className="text-white/50">{err || 'Loading…'}</p>
  return (
    <div className="space-y-3">
      {err && <p className="text-red-400 text-sm">{err}</p>}{msg && <p className="text-gold text-sm">{msg}</p>}
      {rows.map((r) => (
        <div key={r.id} className="border border-white/10 rounded-xl p-3 grid gap-2 sm:grid-cols-2">
          {res === 'gallery' && r.src && <img src={r.src} alt="" className="h-24 rounded-lg object-cover sm:col-span-2" />}
          {fields.map(([k, label, type]) => type === 'check'
            ? <label key={k} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!r[k]} onChange={(e) => edit(r.id, k, e.target.checked)} />{label}</label>
            : type === 'lines'
              ? <textarea key={k} rows="4" placeholder={label} className="input sm:col-span-2" value={(r[k] || []).join('\n')} onChange={(e) => edit(r.id, k, e.target.value.split('\n'))} />
              : <input key={k} placeholder={label} className="input !py-2" value={r[k] ?? ''} onChange={(e) => edit(r.id, k, e.target.value)} />)}
          <div className="flex gap-3 sm:col-span-2">
            <button disabled={busy === r.id} onClick={() => save(r)} className="btn-gold !py-1 !px-5 text-sm disabled:opacity-50">{busy === r.id ? 'Saving…' : 'Save'}</button>
            <button onClick={() => del(r)} className="text-red-400 text-sm">Delete</button>
          </div>
        </div>
      ))}
      <button className="btn-line !py-2 text-sm" onClick={() => setRows([{ ...blank, id: 'n' + Date.now(), isNew: true }, ...rows])}>+ Add New</button>
    </div>
  )
}

const TABS = {
  services: [['icon', 'Icon (emoji)'], ['title', 'Service name'], ['price', 'Price e.g. From Rs. 300'], ['desc', 'Description'], ['active', 'Visible on website', 'check']],
  packages: [['name', 'Package name'], ['price', 'Price e.g. Rs. 8,000'], ['features', 'One feature per line', 'lines'], ['featured', 'Highlight as popular', 'check'], ['active', 'Visible on website', 'check']],
  gallery: [['src', 'Image URL (https://…)'], ['cat', 'Category (Wedding, Portrait, …)']],
}
const BLANK = { services: { icon: '📷', title: '', desc: '', price: '', active: true }, packages: { name: '', price: '', features: [], featured: false, active: true }, gallery: { cat: 'Portrait', src: '' } }

export default function Admin() {
  const [user, setUser] = useState(undefined), [tab, setTab] = useState('bookings')
  useEffect(() => { api('/admin/me').then((d) => setUser(d.email)).catch(() => setUser(null)) }, [])
  if (user === undefined) return <p className="p-10 text-center text-white/50">Loading…</p>
  if (!user) return <Login onLogin={setUser} />
  return (
    <div className="max-w-5xl mx-auto px-5 py-8 min-h-screen">
      <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
        <h1 className="font-serif text-3xl">Admin <span className="text-gold">Dashboard</span></h1>
        <div className="flex gap-3"><a href="#/" className="btn-line !py-2 text-sm">View Site</a><button onClick={() => api('/admin/logout', { method: 'POST' }).then(() => setUser(null))} className="btn-line !py-2 text-sm">Logout</button></div>
      </div>
      <div className="flex gap-2 flex-wrap mb-6">{['bookings', 'services', 'packages', 'gallery'].map((k) => <Tab key={k} a={tab === k} onClick={() => setTab(k)}>{k[0].toUpperCase() + k.slice(1)}</Tab>)}</div>
      {tab === 'bookings' ? <Bookings /> : <Editor key={tab} res={tab} fields={TABS[tab]} blank={BLANK[tab]} />}
    </div>
  )
}