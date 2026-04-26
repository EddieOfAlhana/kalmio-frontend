import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { ArrowRight, CheckCircle2, XCircle, Clock, Leaf, ShoppingCart } from 'lucide-react'

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const } },
}

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.15 } },
}

export function LandingPage() {
  const { t } = useTranslation()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  const painPoints = [
    {
      icon: <Leaf className="h-6 w-6" />,
      problem: t('landing.pain.myth1.problem'),
      solution: t('landing.pain.myth1.solution'),
    },
    {
      icon: <ShoppingCart className="h-6 w-6" />,
      problem: t('landing.pain.myth2.problem'),
      solution: t('landing.pain.myth2.solution'),
    },
    {
      icon: <Clock className="h-6 w-6" />,
      problem: t('landing.pain.myth3.problem'),
      solution: t('landing.pain.myth3.solution'),
    },
  ]

  const steps = [
    { num: '01', title: t('landing.steps.step1.title'), desc: t('landing.steps.step1.desc') },
    { num: '02', title: t('landing.steps.step2.title'), desc: t('landing.steps.step2.desc') },
    { num: '03', title: t('landing.steps.step3.title'), desc: t('landing.steps.step3.desc') },
  ]

  return (
    <div className="w-full min-h-screen bg-[#F9F7F2] overflow-x-hidden">
      {/* Navbar */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? 'bg-[#1A1A1A] shadow-xl' : 'bg-transparent'
        }`}
      >
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="text-[#F28C28] font-headline text-xl font-bold tracking-tight">
            KALMIO
          </Link>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <Link
              to="/app/meal-plans"
              className="inline-flex items-center gap-1.5 bg-[#F28C28] text-white text-sm font-semibold px-5 py-2 rounded-full hover:opacity-90 transition-opacity"
            >
              {t('landing.nav.cta')}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative h-screen min-h-[600px] flex items-center justify-center text-center">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          src="/assets/hero_anim.mp4"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/80" />

        <div className="relative z-10 text-white px-6 max-w-3xl mx-auto">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="text-[#F28C28] font-semibold text-sm uppercase tracking-widest mb-4"
          >
            Beta
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.7 }}
            className="font-headline text-4xl sm:text-5xl md:text-6xl font-bold leading-tight mb-6"
          >
            {t('landing.hero.headline')}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="text-white/80 text-lg sm:text-xl leading-relaxed mb-10 max-w-2xl mx-auto"
          >
            {t('landing.hero.subheadline')}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.65, duration: 0.5 }}
          >
            <Link
              to="/app/meal-plans"
              className="inline-flex items-center gap-2 bg-[#F28C28] hover:bg-[#e07820] text-white font-bold text-lg px-8 py-4 rounded-full transition-colors shadow-lg"
            >
              {t('landing.hero.cta')}
              <ArrowRight className="h-5 w-5" />
            </Link>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}
        >
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex items-start justify-center pt-1.5">
            <div className="w-1 h-2 bg-white/50 rounded-full" />
          </div>
        </motion.div>
      </section>

      {/* ── Pain Points ── */}
      <section className="bg-[#1A1A1A] py-20 sm:py-28 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.6 }}
            className="text-center mb-14"
          >
            <h2 className="font-headline text-3xl sm:text-4xl font-bold text-white">
              {t('landing.pain.title')}
            </h2>
          </motion.div>

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-60px' }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {painPoints.map(({ icon, problem, solution }, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                className="bg-white/5 border border-white/10 rounded-3xl p-8"
              >
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-6 text-[#F28C28]"
                  style={{ background: 'rgba(242,140,40,0.12)' }}
                >
                  {icon}
                </div>
                <div className="flex items-start gap-2 mb-3">
                  <XCircle className="h-4 w-4 text-red-400/70 shrink-0 mt-0.5" />
                  <p className="text-white/40 text-sm line-through leading-snug">{problem}</p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[#4F7942] shrink-0 mt-0.5" />
                  <p className="text-white font-medium leading-snug">{solution}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── FOMO Strip ── */}
      <section className="bg-[#F28C28] py-16 sm:py-20 px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl mx-auto text-center"
        >
          <p className="font-headline font-bold text-white text-xl sm:text-2xl leading-relaxed mb-8">
            {t('landing.fomo.text')}
          </p>
          <Link
            to="/app/meal-plans"
            className="inline-flex items-center gap-2 bg-white text-[#F28C28] font-bold text-base px-8 py-4 rounded-full hover:bg-white/90 transition-colors"
          >
            {t('landing.hero.cta')}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </motion.div>
      </section>

      {/* ── How It Works ── */}
      <section className="bg-[#F9F7F2] py-20 sm:py-28 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="font-headline text-3xl sm:text-4xl font-bold text-[#1A1A1A]">
              {t('landing.steps.title')}
            </h2>
          </motion.div>

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-60px' }}
            className="grid grid-cols-1 md:grid-cols-3 gap-10"
          >
            {steps.map(({ num, title, desc }) => (
              <motion.div key={num} variants={fadeUp}>
                <div className="font-headline text-7xl font-bold leading-none mb-3 select-none"
                  style={{ color: 'rgba(242,140,40,0.18)' }}
                >
                  {num}
                </div>
                <h3 className="font-headline font-bold text-xl text-[#1A1A1A] mb-2">{title}</h3>
                <p className="text-[#1A1A1A]/60 leading-relaxed text-sm">{desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="bg-[#1A1A1A] py-20 sm:py-28 px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl mx-auto text-center"
        >
          <h2 className="font-headline text-3xl sm:text-4xl font-bold text-white mb-4">
            {t('landing.finalCta.title')}
          </h2>
          <p className="text-white/60 text-lg mb-10">
            {t('landing.finalCta.subtitle')}
          </p>
          <Link
            to="/app/meal-plans"
            className="inline-flex items-center gap-2 bg-[#F28C28] hover:bg-[#e07820] text-white font-bold text-lg px-10 py-4 rounded-full transition-colors"
          >
            {t('landing.finalCta.button')}
            <ArrowRight className="h-5 w-5" />
          </Link>
        </motion.div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-[#1A1A1A] border-t border-white/10 py-8 px-6 text-center">
        <p className="text-white/30 text-sm">© 2025 Kalmio · {t('common.version')}</p>
      </footer>
    </div>
  )
}
