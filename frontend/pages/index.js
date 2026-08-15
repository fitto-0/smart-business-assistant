import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { isAuthenticated } from '../lib/auth';
import { Menu, X, ArrowRight } from 'lucide-react';

const NAV_LINKS = [
  { href: '#statement', label: 'About' },
  { href: '#releases', label: 'Features' },
  { href: '#roster', label: 'Team' },
  { href: '#dates', label: 'Events' },
];

const FEATURES = [
  {
    title: 'Sales Analytics',
    desc: 'Track revenue, orders and product performance in real time with beautiful dashboards.',
  },
  {
    title: 'Stock Management',
    desc: 'Monitor inventory, low-stock warnings and restock alerts before they hurt sales.',
  },
  {
    title: 'AI Predictions',
    desc: 'Forecast future revenue with machine learning models trained on your history.',
  },
  {
    title: 'Review Sentiment',
    desc: 'Understand what customers think with automatic NLP sentiment analysis.',
  },
  {
    title: 'Anomaly Detection',
    desc: 'Get alerted on stock ruptures and sales drops the moment they happen.',
  },
  {
    title: 'Smart Recommendations',
    desc: 'Actionable AI suggestions to boost sales and optimize your inventory.',
  },
];

const ROSTER = [
  { label: 'Analytics', name: 'Sales Intelligence', count: '12' },
  { label: 'Inventory', name: 'Stock Management', count: '8' },
  { label: 'Predictions', name: 'AI Forecasting', count: '6' },
  { label: 'Security', name: 'Data Protection', count: '4' },
];

const DATES = [
  { date: '2024-03-15', event: 'System Update', location: 'Global' },
  { date: '2024-04-01', event: 'New Features', location: 'Platform' },
  { date: '2024-05-15', event: 'AI Training', location: 'Cloud' },
  { date: '2024-06-01', event: 'Security Audit', location: 'Systems' },
];

export default function LandingPage() {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [transitionProgress, setTransitionProgress] = useState(0);
  const heroRef = useRef(null);
  const transitionRef = useRef(null);
  const statementRef = useRef(null);

  useEffect(() => {
    if (isAuthenticated()) router.push('/dashboard');

    const handleScroll = () => {
      if (!heroRef.current || !transitionRef.current) return;
      
      const heroRect = heroRef.current.getBoundingClientRect();
      const heroHeight = heroRef.current.offsetHeight;
      const viewportHeight = window.innerHeight;
      
      // Calculate scroll progress through hero (0 to 1)
      const progress = Math.min(1, Math.max(0, -heroRect.top / (heroHeight - viewportHeight)));
      setScrollProgress(progress);

      // Calculate transition section progress
      const transitionRect = transitionRef.current.getBoundingClientRect();
      const transitionProgress = Math.min(1, Math.max(0, -transitionRect.top / viewportHeight));
      setTransitionProgress(transitionProgress);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, [router]);

  const panelOffset = scrollProgress * 120; // Panels move outward
  const wordmarkScale = 1 + (scrollProgress * 0.3); // Wordmark grows
  const wordmarkSpacing = -0.02 - (scrollProgress * 0.01); // Tracking tightens
  const wordmarkSeparation = scrollProgress * 200; // Halves separate

  // Transition section animations
  const transitionImageX = transitionProgress * 40; // Image moves right
  const transitionImageScale = 1 - (transitionProgress * 0.2); // Image shrinks slightly
  const transitionTextOpacity = transitionProgress; // Text fades in
  const transitionTextY = 50 - (transitionProgress * 50); // Text moves up

  return (
    <div className="portal-landing min-h-screen overflow-x-hidden">
      {/* ===================== NAVIGATION ===================== */}
      <nav className="portal-nav">
        <div className="max-w-7xl mx-auto px-5 h-full flex items-center justify-between">
          {/* Left: menu + wordmark */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="lg:hidden p-2 rounded-lg border hairline hover:bg-ground-secondary transition"
              aria-label="Menu"
            >
              {menuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
            <Link href="/" className="flex items-center gap-2">
              <span className="portal-wordmark">
                Smart Business<span className="text-amber">.</span>
              </span>
            </Link>
          </div>

          {/* Center links (desktop) */}
          <div className="hidden lg:flex items-center gap-8">
            {NAV_LINKS.map((link) => (
              <a key={link.href} href={link.href} className="portal-nav-link">
                {link.label}
              </a>
            ))}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-3">
            <Link href="/login" className="portal-nav-link">Login</Link>
            <Link href="/register" className="portal-pill-btn">
              Get Started
            </Link>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="lg:hidden border-t hairline bg-ground-secondary">
            <div className="px-5 py-4 flex flex-col gap-1">
              {[...NAV_LINKS, { href: '/login', label: 'Login' }, { href: '/register', label: 'Get Started' }].map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="px-3 py-2.5 rounded-lg portal-nav-link hover:bg-ground-secondary/50 transition"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* ===================== PORTAL HERO ===================== */}
      <section ref={heroRef} className="portal-hero-stage">
        <div className="portal-sticky-stage">
          {/* Background layers */}
          <div 
            className="portal-bg-image"
            style={{
              backgroundImage: 'url("https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1920&q=80")',
            }}
          />
          <div className="portal-duotone-wash" style={{ opacity: scrollProgress * 0.5 }} />
          <div className="portal-radial-veil" />

          {/* Parting panels */}
          <div 
            className="portal-panel portal-panel-left"
            style={{ transform: `translateX(-${panelOffset}%)` }}
          />
          <div 
            className="portal-panel portal-panel-right"
            style={{ transform: `translateX(${panelOffset}%)` }}
          />

          {/* Accent dots */}
          <div className="portal-accent-dot portal-accent-dot-left" />
          <div className="portal-accent-dot portal-accent-dot-right" />

          {/* Wordmark */}
          <div className="portal-wordmark-container">
            <span 
              className="portal-wordmark-half portal-wordmark-left"
              style={{ 
                transform: `translateX(-${wordmarkSeparation}px) scale(${wordmarkScale})`,
                letterSpacing: `${wordmarkSpacing}em`,
              }}
            >
              Smart
            </span>
            <span 
              className="portal-wordmark-half portal-wordmark-right text-amber"
              style={{ 
                transform: `translateX(${wordmarkSeparation}px) scale(${wordmarkScale})`,
                letterSpacing: `${wordmarkSpacing}em`,
              }}
            >
              Business
            </span>
          </div>

          {/* Corner metadata */}
          <div className="portal-corner-pin portal-corner-top-left">
            EST. 2024
          </div>
        </div>
      </section>

      {/* ===================== TRANSITION SECTION ===================== */}
      <section ref={transitionRef} className="min-h-screen relative overflow-hidden py-24 px-5">
        <div className="max-w-7xl mx-auto h-full flex items-center">
          <div className="grid lg:grid-cols-2 gap-12 items-center w-full">
            {/* Left: Text content */}
            <div 
              className="relative z-10"
              style={{
                opacity: transitionTextOpacity,
                transform: `translateY(${transitionTextY}px)`,
              }}
            >
              <p className="portal-label mb-4">Welcome</p>
              <h2 className="portal-heading text-4xl lg:text-5xl mb-6 leading-tight">
                Transform your business with{' '}
                <span className="text-amber">artificial intelligence</span>
              </h2>
              <p className="portal-text max-w-md mb-8">
                Advanced sales analytics, revenue predictions and anomaly detection — 
                an AI platform that protects and grows your business data.
              </p>
            </div>

            {/* Right: Moving image */}
            <div 
              className="relative"
              style={{
                transform: `translateX(${transitionImageX}%) scale(${transitionImageScale})`,
              }}
            >
              <img 
                src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80"
                alt="Business Analytics"
                className="w-full h-auto rounded-lg shadow-2xl"
                style={{
                  filter: `brightness(${1 - transitionProgress * 0.2})`,
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ===================== STATEMENT FOLD ===================== */}
      <section ref={statementRef} id="statement" className="portal-statement-fold">
        <div className="max-w-7xl mx-auto w-full">
          <div className="portal-statement-content">
            <p className="portal-label mb-4">01 — About</p>
            <p className="portal-statement-text mb-6">
              Transform your business with{' '}
              <span className="portal-statement-accent">artificial intelligence</span>
              that protects and grows your data.
            </p>
            <p className="portal-statement-index">01</p>
          </div>
          <img 
            src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80"
            alt="Analytics"
            className="portal-floating-image"
          />
        </div>
      </section>

      {/* ===================== RELEASES / FEATURES ===================== */}
      <section id="releases" className="py-24 px-5">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: content */}
            <div>
              <p className="portal-label mb-4">02 — Features</p>
              <h2 className="portal-heading text-4xl mb-6">
                Everything you need
              </h2>
              <p className="portal-text mb-8 max-w-md">
                Advanced sales analytics, revenue predictions and anomaly detection — 
                an AI platform that protects and grows your business data.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/register" className="portal-pill-btn">
                  Get Started <ArrowRight size={14} />
                </Link>
                <Link href="/login" className="portal-nav-link">
                  Learn More
                </Link>
              </div>
            </div>

            {/* Right: card deck */}
            <div className="portal-card-deck">
              {FEATURES.slice(0, 4).map((feature, index) => (
                <div
                  key={feature.title}
                  className="portal-card"
                  style={{
                    transform: `translate(${index * 8}px, ${index * -4}px) rotate(${index * 2}deg) scale(${1 - index * 0.05})`,
                    zIndex: 10 - index,
                  }}
                >
                  <div className="p-6 text-center">
                    <h3 className="portal-heading text-lg mb-2">{feature.title}</h3>
                    <p className="portal-text text-xs">{feature.desc}</p>
                  </div>
                </div>
              ))}
              <div className="portal-card-hint">Drag to explore</div>
              <div className="portal-progress-dots">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className={`portal-progress-dot ${i === 0 ? 'active' : ''}`} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================== ROSTER ===================== */}
      <section id="roster" className="py-24 px-5 border-t hairline">
        <div className="max-w-7xl mx-auto">
          <p className="portal-label mb-8">03 — Capabilities</p>
          {ROSTER.map((item) => (
            <div key={item.name} className="portal-roster-row">
              <span className="portal-roster-label">{item.label}</span>
              <span className="portal-roster-name">{item.name}</span>
              <span className="portal-roster-count">{item.count}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ===================== DATES TABLE ===================== */}
      <section id="dates" className="py-24 px-5 border-t hairline">
        <div className="max-w-7xl mx-auto">
          <p className="portal-label mb-8">04 — Events</p>
          <table className="portal-dates-table">
            <thead>
              <tr>
                <th className="portal-dates-header">Date</th>
                <th className="portal-dates-header">Event</th>
                <th className="portal-dates-header">Location</th>
              </tr>
            </thead>
            <tbody>
              {DATES.map((item) => (
                <tr key={item.date}>
                  <td className="portal-dates-cell">{item.date}</td>
                  <td className="portal-dates-cell portal-dates-cell-primary">{item.event}</td>
                  <td className="portal-dates-cell">{item.location}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ===================== CLOSE / FOOTER ===================== */}
      <section className="py-24 px-5 border-t hairline">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="portal-close-wordmark mb-8">
            Smart Business
          </h2>
          <p className="portal-label mb-6">AI-Powered Business Intelligence</p>
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            <Link href="/register" className="portal-pill-btn">
              Get Started <ArrowRight size={14} />
            </Link>
            <Link href="/login" className="portal-nav-link">
              Login
            </Link>
          </div>
        </div>
      </section>

      {/* ===================== FOOTER STRIP ===================== */}
      <footer className="portal-footer-strip px-5">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="portal-label">© 2024 Smart Business Assistant</p>
          <div className="flex gap-6">
            <a href="#" className="portal-nav-link">Privacy</a>
            <a href="#" className="portal-nav-link">Terms</a>
            <a href="#" className="portal-nav-link">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
