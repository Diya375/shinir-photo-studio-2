import { useEffect, useState } from 'react'
import { BUSINESS as B } from './data'
import { Reveal, Section } from './ui'
import { api, t12 } from './api'

const empty = { name: '', phone: '', email: '', service: '', package: '', date: '', time: '', message: '' }
const Err = ({ m }) => (m ? <p className="text-red-400 text-xs mt-1">{m}</p> : null)
function check(f) {
  const e = {}
  if (f.name.trim().length < 2) e.name = 'Please enter your full name'
  if (!/^\+?[\d\s-]{7,18}$/.test(f.phone.trim())) e.phone = 'Enter a valid phone number'
  if (f.email && !/^\S+@\S+\.\S+$/.test(f.email)) e.email = 'Enter a valid email'
  if (!f.service) e.service = 'Select a service'
  if (!f.date) e.date = 'Choose a date'
  if (!f.time) e.time = 'Choose a time'
  return e
}

export function Booking({ services, packages }) {
  const [f, setF] = useState({ ...empty, package: sessionStorage.getItem('pkg') || '' })
  const [err, setErr] = useState({})
  const [slots, setSlots] = useState(null) // null = not loaded
  const [slotMsg, setSlotMsg] = useState('')
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [busy, setBusy] = useState(false)
  const [formErr, setFormErr] = useState('')
  const [done, setDone] = useState(null)
  const set = (k) => (e) => { setF({ ...f, [k]: e.target.value }); setErr({ ...err, [k]: '' }) }

  // "Book This" button on a pricing card pre-selects its package
  useEffect(() => {
    const h = (e) => setF((p) => ({ ...p, package: e.detail }))
    window.addEventListener('pick-package', h)
    return () => window.removeEventListener('pick-package', h)
  }, [])

  const loadSlots = (date) => {
    setSlots(null); setSlotMsg('')
    if (!date) return
    setLoadingSlots(true)
    api('/slots?date=' + date)
      .then((d) => { setSlots(d.slots); setSlotMsg(d.message || ''); setF((p) => (d.slots.find((s) => s.time === p.time && s.available) ? p : { ...p, time: '' })) })
      .catch((e) => setSlotMsg(e.message))
      .finally(() => setLoadingSlots(false))
  }
  useEffect(() => { loadSlots(f.date) }, [f.date])

  const submit = async (e) => {
    e.preventDefault(); setFormErr('')
    const v = check(f); setErr(v)
    if (Object.keys(v).length) return
    setBusy(true)
    try {
      setDone(await api('/bookings', { method: 'POST', body: f }))
      sessionStorage.removeItem('pkg'); setF(empty); setSlots(null)
    } catch (ex) {
      setFormErr(ex.message); if (ex.fields) setErr(ex.fields); if (ex.status === 409) loadSlots(f.date)
    } finally { setBusy(false) }
  }

  if (done) return (
    <Section id="booking" eyebrow="Appointments" title="Booking Received">
      <Reveal>
        <div className="max-w-xl mx-auto text-center border border-gold/40 rounded-2xl p-8 bg-white/[.03]">
          <div className="text-5xl mb-3">✅</div>
          <p className="text-white/70">Thank you, {done.name}! Your request is <span className="text-gold">pending approval</span>. We'll contact you on {done.phone} to confirm.</p>
          <p className="font-serif text-3xl text-gold my-5">{done.ref}</p>
          <div className="text-sm text-left space-y-1 border-t border-white/10 pt-4">
            <p>📸 {done.service}{done.package && ` — ${done.package}`}</p>
            <p>📅 {done.date} at {t12(done.time)}</p>
            <p className="text-white/50">Keep your reference number for any enquiry.</p>
          </div>
          <div className="flex gap-3 justify-center mt-6 flex-wrap">
            <a className="btn-gold !py-2 text-sm" target="_blank" rel="noreferrer" href={`https://wa.me/${B.whatsapp}?text=${encodeURIComponent(`Hello, my booking reference is ${done.ref}.`)}`}>Message us on WhatsApp</a>
            <button className="btn-line !py-2 text-sm" onClick={() => setDone(null)}>New Booking</button>
          </div>
        </div>
      </Reveal>
    </Section>
  )

  const bd = (k) => (err[k] ? '!border-red-500' : '')
  return (
    <Section id="booking" eyebrow="Appointments" title="Book Your Session">
      <Reveal>
        <form onSubmit={submit} noValidate className="max-w-3xl mx-auto grid sm:grid-cols-2 gap-4 border border-gold/30 rounded-2xl p-6 sm:p-10 bg-white/[.03]">
          <div><input placeholder="Full name *" maxLength={80} className={`input ${bd('name')}`} value={f.name} onChange={set('name')} /><Err m={err.name} /></div>
          <div><input type="tel" placeholder="Phone number *" className={`input ${bd('phone')}`} value={f.phone} onChange={set('phone')} /><Err m={err.phone} /></div>
          <div className="sm:col-span-2"><input type="email" placeholder="Email (optional)" className={`input ${bd('email')}`} value={f.email} onChange={set('email')} /><Err m={err.email} /></div>
          <div><select className={`input [&>option]:text-black ${bd('service')}`} value={f.service} onChange={set('service')}><option value="">Select service *</option>{services.map((s) => <option key={s.id}>{s.title}</option>)}</select><Err m={err.service} /></div>
          <div><select className="input [&>option]:text-black" value={f.package} onChange={set('package')}><option value="">Package (optional)</option>{packages.map((p) => <option key={p.id}>{p.name}</option>)}</select><Err m={err.package} /></div>
          <div><input type="date" min={new Date().toISOString().split('T')[0]} className={`input [color-scheme:dark] ${bd('date')}`} value={f.date} onChange={set('date')} /><Err m={err.date || slotMsg} /></div>
          <div>
            <select disabled={!slots} className={`input [&>option]:text-black disabled:opacity-50 ${bd('time')}`} value={f.time} onChange={set('time')}>
              <option value="">{loadingSlots ? 'Loading times…' : f.date ? 'Select time *' : 'Pick a date first'}</option>
              {slots?.map((s) => <option key={s.time} value={s.time} disabled={!s.available}>{t12(s.time)}{!s.available && ' (unavailable)'}</option>)}
            </select><Err m={err.time} />
          </div>
          <textarea rows="4" maxLength={1000} placeholder="Your requirements / special requests" className="input sm:col-span-2" value={f.message} onChange={set('message')} />
          {formErr && <p className="sm:col-span-2 text-center text-red-400 text-sm" role="alert">{formErr}</p>}
          <button disabled={busy} className="btn-gold sm:col-span-2 disabled:opacity-60">{busy ? 'Submitting…' : 'Submit Booking'}</button>
        </form>
      </Reveal>
    </Section>
  )
}