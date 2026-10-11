import { useEffect, useRef, useState } from 'react'

export function Reveal({ children, delay = 0, className = '' }) {
  const ref = useRef(null)
  const [show, setShow] = useState(false)
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => e.isIntersecting && (setShow(true), io.disconnect()), { threshold: 0.12 })
    io.observe(ref.current)
    return () => io.disconnect()
  }, [])
  return <div ref={ref} style={{ transitionDelay: delay + 'ms' }} className={`reveal ${show ? 'show' : ''} ${className}`}>{children}</div>
}

export function Img({ src, alt = '', className = '' }) {
  const [bad, setBad] = useState(false)
  if (bad) return <div className={`bg-gradient-to-br from-zinc-800 to-zinc-950 ${className}`} />
  return <img src={src} alt={alt} loading="lazy" onError={() => setBad(true)} className={className} />
}

export function Section({ id, eyebrow, title, children, className = '' }) {
  return (
    <section id={id} className={`py-20 md:py-28 px-5 ${className}`}>
      <div className="max-w-7xl mx-auto">
        <Reveal className="text-center mb-14">
          <p className="text-gold tracking-[.3em] text-xs uppercase mb-3">{eyebrow}</p>
          <h2 className="h2">{title}</h2>
          <div className="w-16 h-px bg-gold mx-auto mt-5" />
        </Reveal>
        {children}
      </div>
    </section>
  )
}
