import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { isAuthenticated } from '../lib/auth';
import {
  Zap, Menu, X, ArrowRight, TrendingUp, Brain, ShieldCheck,
  Package, LineChart, AlertTriangle, Lightbulb, Star, Lock,
} from 'lucide-react';

const NAV_LINKS = [
  { href: '#features', label: 'Features' },
  { href: '#benefits', label: 'Benefits' },
  { href: '#security', label: 'Security' },
];

const FEATURES = [
  {
    icon: LineChart,
    title: 'Sales Analytics',
    desc: 'Track revenue, orders and product performance in real time with beautiful dashboards.',
  },
  {
    icon: Package,
    title: 'Stock Management',
    desc: 'Monitor inventory, low-stock warnings and restock alerts before they hurt sales.',
  },
  {
    icon: Brain,
    title: 'AI Predictions',
    desc: 'Forecast future revenue with machine learning models trained on your history.',
  },
  {
    icon: Star,
    title: 'Review Sentiment',
    desc: 'Understand what customers think with automatic NLP sentiment analysis.',
  },
  {
    icon: AlertTriangle,
    title: 'Anomaly Detection',
    desc: 'Get alerted on stock ruptures and sales drops the moment they happen.',
  },
  {
    icon: Lightbulb,
    title: 'Smart Recommendations',
    desc: 'Actionable AI suggestions to boost sales and optimize your inventory.',
  },
];

const BENEFITS = [
  {
    title: 'Real-time Analytics & Monitoring',
    points: [
      'Instant visibility into sales, stock and revenue.',
      'Custom dashboards tailored to your business.',
      'Monthly targets vs actuals at a glance.',
    ],
  },
  {
    title: 'AI Predictions & Forecasting',
    points: [
      'Forecast sales and revenue with machine learning.',
      'Smart recommendations to act first.',
      'Confidence-scored predictions for every month.',
    ],
  },
  {
    title: 'Anomaly Detection & Alerts',
    points: [
      'Detect stock shortages and sales drops instantly.',
      'Proactive alerts that protect your margins.',
      'Categorize and resolve issues in one click.',
    ],
  },
];

const LOGOS = ['Auth', 'unity', 'Western Digital', 'Dropbox'];

const STATS = [
  { value: '+45%', label: 'avg. sales growth' },
  { value: '+120k', label: 'predictions generated' },
  { value: '+65k', label: 'insights delivered' },
];

export default function LandingPage() {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (isAuthenticated()) router.push('/dashboard');

    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, [router]);

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      <div className="grid-backdrop absolute inset-x-0 top-0 h-[110vh] pointer-events-none" />

      {/* ===================== NAV ===================== */}
      <header className={`fixed inset-x-0 top-0 z-50 landing-nav transition-all ${scrolled ? 'py-3' : 'py-5'}`}>
        <div className="max-w-7xl mx-auto px-5 sm:px-8 flex items-center justify-between">
          {/* Left: menu + logo */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="lg:hidden p-2 rounded-xl border border-white/15 hover:bg-white/10 transition"
              aria-label="Menu"
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg shadow-red-500/30">
                <Zap size={18} className="text-white" />
              </div>
              <div className="leading-tight">
                <p className="font-extrabold text-sm tracking-tight">Smart Business</p>
                <p className="text-[10px] text-white/50 uppercase tracking-widest">Assistant IA</p>
              </div>
            </Link>
          </div>

          {/* Center links (desktop) */}
          <nav className="hidden lg:flex items-center gap-8 text-sm text-white/60">
            {NAV_LINKS.map((link) => (
              <a key={link.href} href={link.href} className="hover:text-white transition-colors">{link.label}</a>
            ))}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-3">
            <Link href="/login" className="btn-ghost !py-2 !px-5 text-sm">Login</Link>
            <Link href="/register" className="btn-accent !py-2 !px-5 text-sm hidden sm:inline-flex">
              Get started <ArrowRight size={15} />
            </Link>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="lg:hidden border-t border-white/10 mt-3 animate-fade-in">
            <div className="px-5 py-4 flex flex-col gap-1">
              {[...NAV_LINKS, { href: '/login', label: 'Login' }, { href: '/register', label: 'Get started' }].map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="px-3 py-2.5 rounded-xl text-sm text-white/70 hover:bg-white/10 hover:text-white transition"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* ===================== HERO ===================== */}
      <section className="relative pt-36 pb-20 sm:pt-44 sm:pb-28">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-10">
            {/* Left: copy */}
            <div className="flex-1 text-center lg:text-left animate-slide-up">
              <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-orange-400 border border-orange-400/30 bg-orange-400/10 rounded-full px-4 py-1.5 mb-7">
                <Zap size={13} /> AI-powered business analytics
              </p>
              <h1 className="text-5xl sm:text-6xl xl:text-7xl font-extrabold leading-[1.02] tracking-tight">
                grow your
                <br />
                <span className="text-ghost">business</span> with
                <br />
                <span className="text-gradient-warm">artificial</span> intelligence
              </h1>
              <p className="mt-6 text-white/60 text-base sm:text-lg max-w-xl mx-auto lg:mx-0 leading-relaxed">
                Advanced sales analytics, revenue predictions and anomaly detection —
                an AI platform that protects and grows your business data.
              </p>
              <div className="mt-9 flex flex-wrap items-center justify-center lg:justify-start gap-4">
                <Link href="/register" className="btn-accent">
                  Get started <ArrowRight size={16} />
                </Link>
                <a href="#features" className="btn-ghost">Explore features</a>
              </div>
              <div className="mt-8 flex items-center justify-center lg:justify-start gap-5 text-xs text-white/40">
                <span className="flex items-center gap-1.5"><Lock size={13} className="text-emerald-400" /> Multi-tenant secure</span>
                <span className="flex items-center gap-1.5"><ShieldCheck size={13} className="text-orange-400" /> Your data stays private</span>
              </div>
            </div>

            {/* Right: abstract blob graphic */}
            <div className="flex-1 w-full max-w-lg lg:max-w-none relative">
              <div className="relative aspect-square max-w-md mx-auto">
                <div className="absolute inset-4 blob" />
                <div className="absolute inset-8 rounded-full bg-black/70 backdrop-blur-sm border border-white/10" />

                {/* Floating stat chips */}
                <div className="absolute top-8 -left-2 sm:left-0 animate-float">
                  <div className="glass-chip">
                    <p className="text-2xl font-extrabold">{STATS[0].value}</p>
                    <p className="text-[10px] uppercase tracking-wider text-white/50">{STATS[0].label}</p>
                  </div>
                </div>
                <div className="absolute top-1/2 -right-2 sm:right-0 -translate-y-1/2 animate-float-delay">
                  <div className="glass-chip">
                    <p className="text-2xl font-extrabold text-emerald-400">{STATS[1].value}</p>
                    <p className="text-[10px] uppercase tracking-wider text-white/50">{STATS[1].label}</p>
                  </div>
                </div>
                <div className="absolute bottom-10 left-4 animate-float">
                  <div className="glass-chip">
                    <p className="text-2xl font-extrabold text-orange-400">{STATS[2].value}</p>
                    <p className="text-[10px] uppercase tracking-wider text-white/50">{STATS[2].label}</p>
                  </div>
                </div>

                {/* Center emblem */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-orange-500 via-red-500 to-indigo-600 flex items-center justify-center shadow-2xl shadow-red-500/40 rotate-6">
                    <TrendingUp size={44} className="text-white" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================== LOGO STRIP ===================== */}
      <section className="py-12 border-y border-white/5">
        <p className="text-center text-xs uppercase tracking-widest text-white/35 mb-7">Trusted by modern teams</p>
        <div className="logo-strip">
          {LOGOS.map((logo) => (
            <span key={logo} className="text-xl sm:text-2xl font-bold text-white/60 select-none">{logo}</span>
          ))}
        </div>
      </section>

      {/* ===================== FEATURES ===================== */}
      <section id="features" className="py-24 sm:py-32">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-xs font-semibold uppercase tracking-widest text-orange-400 mb-4">Everything you need</p>
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
              One platform for your <span className="text-ghost">entire</span> business
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="group rounded-2xl border border-white/10 bg-white/[0.03] p-7 hover:bg-white/[0.06] hover:border-orange-400/40 transition-all duration-300 hover:-translate-y-1">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500/20 to-indigo-600/20 border border-white/10 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                  <Icon size={22} className="text-orange-400" />
                </div>
                <h3 className="font-bold text-lg mb-2">{title}</h3>
                <p className="text-sm text-white/55 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== CTA BAR ===================== */}
      <section className="py-10">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <div className="rounded-3xl border border-white/10 bg-gradient-to-r from-orange-500/15 via-transparent to-indigo-600/15 p-8 sm:p-12 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
            <p className="text-lg sm:text-2xl font-semibold leading-snug max-w-2xl">
              Protecting your business data with advanced AI,{' '}
              <span className="text-gradient-warm">encryption algorithms</span> and privacy-preserving techniques.
            </p>
            <Link href="/register" className="btn-ghost flex-shrink-0">
              To Know <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* ===================== BENEFITS ===================== */}
      <section id="benefits" className="py-24 sm:py-32">
        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold uppercase tracking-widest text-orange-400 mb-4">Why choose us</p>
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight">Our <span className="text-ghost">benefits</span></h2>
          </div>
          <div className="grid md:grid-cols-3">
            {BENEFITS.map((benefit, i) => (
              <div key={benefit.title} className={`${i > 0 ? 'benefit-col' : ''} p-8 sm:p-10`}>
                <h3 className="font-bold text-lg mb-5 flex items-center gap-2.5">
                  <span className="w-1.5 h-6 rounded-full bg-gradient-to-b from-orange-500 to-red-600 inline-block" />
                  {benefit.title}
                </h3>
                <ul className="space-y-3 text-sm text-white/60 leading-relaxed">
                  {benefit.points.map((point) => (
                    <li key={point} className="flex items-start gap-2.5">
                      <ArrowRight size={14} className="text-orange-400 mt-0.5 flex-shrink-0" />
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== SECURITY / CTA ===================== */}
      <section id="security" className="pb-28 px-5 sm:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-red-500/30">
            <ShieldCheck size={26} className="text-white" />
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4">
            Ready to <span className="text-gradient-warm">transform</span> your business?
          </h2>
          <p className="text-white/60 max-w-lg mx-auto mb-8">Create your free account and get AI-powered insights in minutes. No credit card required.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/register" className="btn-accent">
              Create free account <ArrowRight size={16} />
            </Link>
            <Link href="/login" className="btn-ghost">I already have an account</Link>
          </div>
        </div>
      </section>

      {/* ===================== FOOTER ===================== */}
      <footer className="border-t border-white/5 py-10">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-white/40">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
              <Zap size={14} className="text-white" />
            </div>
            <span className="font-semibold text-white/70">Smart Business Assistant</span>
          </div>
          <p>© 2024 Smart Business Assistant — AI Powered</p>
        </div>
      </footer>

      <style jsx>{`
        .glass-chip {
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 1rem;
          padding: 0.75rem 1rem;
          backdrop-filter: blur(12px);
          box-shadow: 0 12px 32px -8px rgba(0, 0, 0, 0.6);
          min-width: 128px;
        }
        @media (max-width: 480px) {
          .glass-chip { min-width: 110px; padding: 0.6rem 0.8rem; }
          .glass-chip p { font-size: 1.25rem; }
        }
      `}</style>
    </div>
  );
}
