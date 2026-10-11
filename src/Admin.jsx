import { useEffect, useState } from 'react'
import { api, t12 } from './api'

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

function Bookings() {
  const [rows, setRows] = useState(null), [st, setSt] = useState(''), [err, setErr] = useState(''), [busy, setBusy] = useState(0)
  const load = () => api('/admin/bookings' + (st ? '?status=' + st : '')).then(setRows).catch((e) => setErr(e.message))
  useEffect(() => { setRows(null); load() }, [st])
  const act = async (b, status) => {
    if (['rejected', 'cancelled'].includes(status) && !confirm(`${status === 'rejected' ? 'Reject' : 'Cancel'} booking ${b.ref}?`)) return
    setBusy(b.id); setErr('')
    try { await api(`/admin/bookings/${b.id}/status`, { method: 'PATCH', body: { status } }); await load() } catch (e) { setErr(e.message) } finally { setBusy(0) }
  }
  return (
    <div>
      <div className="flex gap-2 flex-wrap mb-4">{['', 'pending', 'approved', 'completed', 'rejected', 'cancelled'].map((s) => <Tab key={s} a={st === s} onClick={() => setSt(s)}>{s || 'All'}</Tab>)}</div>
      {err && <p className="text-red-400 text-sm mb-3">{err}</p>}
      {!rows ? <p className="text-white/50">Loading…</p> : !rows.length ? <p className="text-white/50">No bookings found.</p> : rows.map((b) => (
        <div key={b.id} className="border border-white/10 rounded-xl p-4 mb-3 grid sm:grid-cols-[1fr_auto] gap-3">
          <div className="text-sm space-y-1">
            <p className="font-semibold text-gold">{b.name} <span className="text-white/40 font-normal">· {b.ref}</span> <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${BADGE[b.status]}`}>{b.status}</span></p>
            <p>📞 <a href={'tel:' + b.phone}>{b.phone}</a> {b.email && <>· ✉️ {b.email}</>}</p>
            <p>📸 {b.service}{b.package && ` — ${b.package}`}</p>
            <p>📅 {b.date} · ⏰ {t12(b.time)}</p>
            {b.message && <p className="text-white/60">“{b.message}”</p>}
          </div>
          <div className="flex sm:flex-col gap-2 flex-wrap">{(ACTIONS[b.status] || []).map(([s, l]) => <button key={s} disabled={busy === b.id} onClick={() => act(b, s)} className="btn-line !py-1 !px-4 text-xs disabled:opacity-50">{l}</button>)}</div>
        </div>
      ))}
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
