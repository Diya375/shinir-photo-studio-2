import { useEffect, useState } from 'react'
import { api } from './api'
import { Navbar, Hero, About, Services, Gallery, Pricing, Contact, Footer } from './Sections'
import { Booking } from './Booking'
import Admin from './Admin'

export default function App() {
  const [route, setRoute] = useState(location.hash)
  const [cat, setCat] = useState(null)
  const [err, setErr] = useState('')
  const load = () => { setErr(''); api('/catalog').then(setCat).catch((e) => setErr(e.message)) }
  useEffect(() => { load(); const h = () => setRoute(location.hash); addEventListener('hashchange', h); return () => removeEventListener('hashchange', h) }, [])

  if (route === '#/admin') return <Admin />
  if (!cat) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center px-5">
      <p className="font-serif text-2xl"><span className="text-gold">Shinir</span> Photo Studio</p>
      <p className="text-white/60">{err || 'Loading…'}</p>
      {err && <button onClick={load} className="btn-gold">Try again</button>}
    </div>
  )
  return (
    <>
      <Navbar />
      <main>
        <Hero /><About /><Services services={cat.services} /><Gallery images={cat.gallery} />
        <Pricing packages={cat.packages} /><Booking services={cat.services} packages={cat.packages} /><Contact />
      </main>
      <Footer />
    </>
  )
}
