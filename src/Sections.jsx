import { useState } from 'react'
import { BUSINESS as B, ABOUT_IMG } from './data'
import { Reveal, Img, Section } from './ui'
import shinir from './assests/shinir.jpg'

const links = [['Home', 'home'], ['About', 'about'], ['Services', 'services'], ['Gallery', 'gallery'], ['Pricing', 'pricing'], ['Contact', 'contact']]
export function Navbar() {
  const [open, setOpen] = useState(false)
  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-black/70 backdrop-blur-md border-b border-white/10">
      <nav className="max-w-7xl mx-auto flex items-center justify-between px-5 h-16">
        <a href="#home" className="font-serif text-xl"><span className="text-gold">Shinir</span> Photo Studio</a>
        <div className="hidden md:flex gap-8 text-sm">
          {links.map(([l, id]) => <a key={id} href={'#' + id} className="hover:text-gold transition">{l}</a>)}
        </div>
        <a href="#booking" className="hidden md:block btn-gold !py-2 text-sm">Book Now</a>
        <button aria-label="Menu" onClick={() => setOpen(!open)} className="md:hidden text-2xl text-gold">{open ? '✕' : '☰'}</button>
      </nav>
      {open && (
        <div className="md:hidden bg-black px-5 pb-5 flex flex-col gap-4">
          {[...links, ['Book Now', 'booking']].map(([l, id]) => <a key={id} onClick={() => setOpen(false)} href={'#' + id} className="py-1 hover:text-gold">{l}</a>)}
        </div>
      )}
    </header>
  )
}

export function Hero() {
  return (
    <section id="home" className="relative min-h-screen flex items-center justify-center text-center overflow-hidden">
      <img src={shinir} alt="" className="absolute inset-0 w-full h-full object-cover kb" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-ink" />
      <div className="relative px-5 max-w-3xl">
        <Reveal>
          <p className="text-gold tracking-[.4em] text-xs sm:text-sm uppercase mb-5">Photography • Editing • Printing</p>
          <h1 className="font-serif text-5xl sm:text-6xl md:text-7xl font-bold leading-tight">{B.name}</h1>
          <p className="mt-5 text-lg sm:text-xl text-white/80 font-light">{B.tagline}</p>
          <div className="mt-10 flex flex-wrap gap-4 justify-center">
            <a href="#booking" className="btn-gold">Book a Session</a>
            <a href="#gallery" className="btn-line">View Portfolio</a>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

export function About() {
  const stats = [['10+', 'Years Experience'], ['5000+', 'Happy Clients'], ['1000+', 'Events Covered']]
  return (
    <Section id="about" eyebrow="About Us" title="Where Every Frame Tells a Story">
      <div className="grid md:grid-cols-2 gap-12 items-center">
        <Reveal><Img src={ABOUT_IMG} alt="Studio" className="rounded-2xl w-full h-80 md:h-[460px] object-cover border border-gold/30" /></Reveal>
        <Reveal delay={150}>
          <p className="text-white/75 leading-relaxed">{B.name} is a full-service photography and Photoshop studio in Nepal. From weddings and portraits to passport photos, restoration and printing, we combine modern equipment with a warm, personal touch. [Replace with your studio story.]</p>
          <p className="text-white/75 leading-relaxed mt-4">Our team has years of experience capturing Nepali weddings, festivals and family moments, and delivering sharp, retouched results on time.</p>
          <div className="grid grid-cols-3 gap-4 mt-8">
            {stats.map(([n, l]) => <div key={l} className="text-center border border-white/10 rounded-xl py-4"><div className="font-serif text-2xl sm:text-3xl text-gold">{n}</div><div className="text-xs text-white/60 mt-1">{l}</div></div>)}
          </div>
        </Reveal>
      </div>
    </Section>
  )
}

export function Services({ services }) {
  return (
    <Section id="services" eyebrow="What We Do" title="Our Services" className="bg-zinc-950">
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {services.map((s, i) => (
          <Reveal key={s.id} delay={(i % 4) * 80}>
            <div className="h-full group border border-white/10 hover:border-gold rounded-2xl p-6 bg-white/[.03] transition hover:-translate-y-1">
              <div className="text-3xl mb-4">{s.icon}</div>
              <h3 className="font-serif text-lg mb-2 group-hover:text-gold transition">{s.title}</h3>
              <p className="text-sm text-white/60 mb-4">{s.desc}</p>
              <p className="text-gold text-sm font-medium">{s.price}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </Section>
  )
}

export function Gallery({ images }) {
  const cats = ['All', ...new Set(images.map((g) => g.cat))]
  const [cat, setCat] = useState('All')
  const [lb, setLb] = useState(null)
  const list = cat === 'All' ? images : images.filter((g) => g.cat === cat)
  return (
    <Section id="gallery" eyebrow="Portfolio" title="Our Work">
      <div className="flex flex-wrap justify-center gap-2 mb-10">
        {cats.map((c) => <button key={c} onClick={() => setCat(c)} className={`px-5 py-2 rounded-full text-sm border transition ${cat === c ? 'bg-gold text-black border-gold' : 'border-white/20 hover:border-gold'}`}>{c}</button>)}
      </div>
      <div className="columns-2 md:columns-3 lg:columns-4 gap-4 [&>*]:mb-4">
        {list.map((g) => (
          <button key={g.id} onClick={() => setLb(g)} className="block w-full overflow-hidden rounded-xl relative group">
            <Img src={g.src} alt={g.cat} className="w-full object-cover min-h-32 group-hover:scale-110 transition duration-700" />
            <span className="absolute bottom-0 inset-x-0 p-3 text-xs text-left bg-gradient-to-t from-black/80 opacity-0 group-hover:opacity-100 transition text-gold">{g.cat}</span>
          </button>
        ))}
      </div>
      {lb && <div onClick={() => setLb(null)} className="fixed inset-0 z-[60] bg-black/95 flex items-center justify-center p-4 cursor-zoom-out"><img src={lb.src.replace('w=900', 'w=1600')} alt="" className="max-h-full max-w-full rounded-lg" /></div>}
    </Section>
  )
}

export function Pricing({ packages }) {
  return (
    <Section id="pricing" eyebrow="Packages & Pricing" title="Choose Your Package" className="bg-zinc-950">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {packages.map((p, i) => (
          <Reveal key={p.id} delay={i * 100}>
            <div className={`h-full flex flex-col rounded-2xl p-7 border ${p.featured ? 'border-gold bg-gold/10 lg:scale-105' : 'border-white/10 bg-white/[.03]'}`}>
              {p.featured && <span className="self-start text-[10px] uppercase tracking-widest bg-gold text-black px-3 py-1 rounded-full mb-3">Most Popular</span>}
              <h3 className="font-serif text-2xl">{p.name}</h3>
              <p className="text-gold text-3xl font-serif my-4">{p.price}</p>
              <ul className="space-y-2 text-sm text-white/70 flex-1 mb-6">{p.features.map((f) => <li key={f}>✓ {f}</li>)}</ul>
              <a href={'#booking?pkg=' + encodeURIComponent(p.name)} onClick={() => sessionStorage.setItem('pkg', p.name)} className={p.featured ? 'btn-gold text-center' : 'btn-line text-center'}>Book This</a>
            </div>
          </Reveal>
        ))}
      </div>
    </Section>
  )
}

export function Contact() {
  const items = [['📞', 'Phone', B.phone, 'tel:' + B.phone], ['💬', 'WhatsApp', B.phone, 'https://wa.me/' + B.whatsapp], ['✉️', 'Email', B.email, 'mailto:' + B.email], ['📍', 'Address', B.address]]
  return (
    <Section id="contact" eyebrow="Get In Touch" title="Visit Our Studio" className="bg-zinc-950">
      <div className="grid lg:grid-cols-2 gap-10">
        <Reveal>
          <div className="space-y-4">
            {items.map(([i, l, v, h]) => (
              <div key={l} className="flex gap-4 items-center border border-white/10 rounded-xl p-4">
                <span className="text-2xl">{i}</span>
                <div><p className="text-xs text-gold uppercase tracking-widest">{l}</p>{h ? <a href={h} target="_blank" rel="noreferrer" className="hover:text-gold">{v}</a> : <p>{v}</p>}</div>
              </div>
            ))}
            <div className="border border-white/10 rounded-xl p-4">
              <p className="text-xs text-gold uppercase tracking-widest mb-2">Opening Hours</p>
              {B.hours.map(([d, t]) => <div key={d} className="flex justify-between text-sm py-1"><span>{d}</span><span className="text-white/60">{t}</span></div>)}
            </div>
            <div className="flex gap-3 flex-wrap">{Object.entries(B.social).map(([n, u]) => <a key={n} href={u} target="_blank" rel="noreferrer" className="btn-line !py-2 !px-5 text-sm capitalize">{n}</a>)}</div>
          </div>
        </Reveal>
        <Reveal delay={150}><iframe title="Map" src={B.mapEmbed} loading="lazy" className="w-full h-96 lg:h-full min-h-96 rounded-2xl border border-gold/30 grayscale invert-[.9] contrast-90" /></Reveal>
      </div>
    </Section>
  )
}

export function Footer() {
  return (
    <footer className="py-8 px-5 text-center text-sm text-white/50 border-t border-white/10">
      © {new Date().getFullYear()} {B.name}. All rights reserved. · <a href="#/admin" className="hover:text-gold">Admin</a>
      <a href={'https://wa.me/' + B.whatsapp} target="_blank" rel="noreferrer" aria-label="WhatsApp" className="fixed bottom-5 right-5 z-40 w-14 h-14 rounded-full bg-green-500 text-white text-2xl flex items-center justify-center shadow-lg hover:scale-110 transition">💬</a>
    </footer>
  )
}
