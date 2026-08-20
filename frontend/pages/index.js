import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { isAuthenticated } from '../lib/auth';
import { Menu, X, ArrowRight } from 'lucide-react';

const NAV_LINKS = [
  { href: '#statement', label: 'About' },
  { href: '#intelligence', label: 'Intelligence' },
  { href: '#how-it-works', label: 'How It Works' },
  { href: '/docs', label: 'Docs' },
  { href: '/contact', label: 'Contact' },
];

const FEATURES = [
  {
    icon: '✦',
    title: 'Sales Analytics',
    subtitle: 'Revenue & KPIs',
    desc: 'Track revenue, orders and product performance in real time with beautiful dashboards.',
  },
  {
    icon: '◉',
    title: 'Stock Management',
    subtitle: 'Inventory alerts',
    desc: 'Monitor inventory, low-stock warnings and restock alerts before they hurt sales.',
  },
  {
    icon: '↗',
    title: 'AI Predictions',
    subtitle: 'Forecast revenue',
    desc: 'Forecast future revenue with machine learning models trained on your history.',
  },
  {
    icon: '♡',
    title: 'Review Sentiment',
    subtitle: 'Understand users',
    desc: 'Understand what customers think with automatic NLP sentiment analysis.',
  },
  {
    icon: '⚡',
    title: 'Anomaly Detection',
    subtitle: 'Detect problems',
    desc: 'Get alerted on stock ruptures and sales drops the moment they happen.',
  },
  {
    icon: '✦',
    title: 'Smart Recommendations',
    subtitle: 'Grow your sales',
    desc: 'Actionable AI suggestions to boost sales and optimize your inventory.',
  },
];

const INTELLIGENCE = [
  { number: '01', title: 'Sales Intelligence', desc: 'Understand your revenue' },
  { number: '02', title: 'Predictive Analytics', desc: 'Know what happens next' },
  { number: '03', title: 'Customer Sentiment', desc: 'Understand your customers' },
  { number: '04', title: 'Business Alerts', desc: 'Detect problems instantly' },
];

const HOW_IT_WORKS = [
  { number: '01', title: 'Upload your data', desc: 'Import your sales CSV' },
  { number: '02', title: 'Let AI analyze', desc: 'Automatically detect patterns' },
  { number: '03', title: 'Get insights', desc: 'Predictions, anomalies & sentiment' },
  { number: '04', title: 'Take action', desc: 'Follow AI recommendations' },
];

export default function LandingPage() {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [transitionProgress, setTransitionProgress] = useState(0);
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const heroRef = useRef(null);
  const transitionRef = useRef(null);
  const statementRef = useRef(null);

  // Custom cursor effect
  useEffect(() => {
    const handleMouseMove = (e) => {
      setCursorPosition({ x: e.clientX, y: e.clientY });
    };

    const handleMouseOver = (e) => {
      if (e.target.tagName === 'A' || e.target.tagName === 'BUTTON' || e.target.closest('a') || e.target.closest('button')) {
        setIsHovering(true);
      } else {
        setIsHovering(false);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseover', handleMouseOver);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseover', handleMouseOver);
    };
  }, []);

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
    <div className="portal-landing min-h-screen overflow-x-hidden cursor-none">
      {/* Custom Cursor */}
      <div 
        className="fixed pointer-events-none z-50 hidden lg:block"
        style={{
          left: cursorPosition.x,
          top: cursorPosition.y,
          transform: 'translate(-50%, -50%)',
        }}
      >
        <div 
          className={`w-4 h-4 rounded-full bg-[#F5A623] transition-all duration-300 ${
            isHovering ? 'scale-150 bg-white' : ''
          }`}
        />
        <div 
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full border border-[#F5A623]/30 transition-all duration-300 ${
            isHovering ? 'scale-150 border-white/50' : ''
          }`}
        />
      </div>
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

      {/* ===================== HERO SECTION ===================== */}
      <section ref={heroRef} className="relative min-h-screen overflow-hidden bg-[#080808]">
        {/* Grain overlay */}
        <div className="absolute inset-0 opacity-30" style={{
          backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noise%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noise)%22/%3E%3C/svg%3E")',
        }} />

        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-5 min-h-screen flex flex-col justify-center pt-20">
          {/* Asymmetric layout */}
          <div className="grid lg:grid-cols-12 gap-8 items-end">
            {/* Left - Oversized typography */}
            <div className="lg:col-span-8 space-y-4">
              <p 
                className="portal-label text-[#F5A623] tracking-[0.3em]"
                style={{
                  opacity: 1 - scrollProgress * 2,
                  transform: `translateY(${scrollProgress * -30}px)`,
                }}
              >
                AI-POWERED BUSINESS INTELLIGENCE
              </p>
              
              <h1 
                className="font-syne font-extrabold text-[clamp(3rem,12vw,10rem)] leading-[0.85] tracking-tight"
                style={{
                  color: '#F5F5F5',
                  transform: `translateY(${scrollProgress * -50}px) scale(${1 + scrollProgress * 0.05})`,
                  transition: 'transform 0.1s linear',
                }}
              >
                <span 
                  className="block"
                  style={{
                    transform: `translateX(${-scrollProgress * 100}px)`,
                    transition: 'transform 0.1s linear',
                  }}
                >
                  Smart
                </span>
                <span 
                  className="block text-[#F5A623]"
                  style={{
                    transform: `translateX(${scrollProgress * 100}px)`,
                    transition: 'transform 0.1s linear',
                  }}
                >
                  Business
                </span>
              </h1>

              <p 
                className="font-sora text-xl lg:text-2xl text-[#8A8A8A] max-w-2xl leading-relaxed"
                style={{
                  opacity: 1 - scrollProgress * 1.5,
                  transform: `translateY(${scrollProgress * -40}px)`,
                }}
              >
                Turn your business data into your next decision.
              </p>
            </div>

            {/* Right - CTAs and metadata */}
            <div className="lg:col-span-4 space-y-6 pb-8"
              style={{
                opacity: 1 - scrollProgress * 2,
                transform: `translateY(${scrollProgress * -30}px)`,
              }}
            >
              <div className="space-y-4">
                <Link href="/register" className="group block">
                  <div className="bg-[#F5A623] text-[#080808] px-8 py-4 rounded-sm font-sora font-semibold text-sm tracking-wider uppercase transition-all duration-300 hover:bg-[#E8913C] hover:translate-x-2">
                    Get Started <ArrowRight size={16} className="inline ml-2 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
                <Link href="/login" className="group block">
                  <div className="border border-white/20 text-white px-8 py-4 rounded-sm font-sora font-semibold text-sm tracking-wider uppercase transition-all duration-300 hover:bg-white/5 hover:border-white/40">
                    Explore Platform
                  </div>
                </Link>
              </div>

              <div className="pt-8 border-t border-white/10">
                <p className="portal-label mb-2">EST. 2026</p>
                <p className="font-sora text-sm text-[#8A8A8A]">
                  AI-Powered Business Intelligence Platform
                </p>
              </div>
            </div>
          </div>

          {/* Scroll indicator */}
          <div 
            className="absolute bottom-8 left-1/2 -translate-x-1/2"
            style={{
              opacity: 1 - scrollProgress * 3,
              transform: `translateY(${scrollProgress * -20}px)`,
            }}
          >
            <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center pt-2">
              <div className="w-1 h-2 bg-[#F5A623] rounded-full animate-bounce" />
            </div>
          </div>
        </div>
      </section>

      {/* ===================== IMMERSIVE FEATURE SECTION ===================== */}
      <section ref={transitionRef} className="min-h-screen relative overflow-hidden py-32 px-5">
        <div className="max-w-7xl mx-auto">
          {/* Large editorial heading */}
          <div className="mb-24">
            <p className="portal-label text-[#F5A623] mb-4">01 — Intelligence</p>
            <h2 
              className="font-syne font-extrabold text-[clamp(2.5rem,8vw,6rem)] leading-[0.9] tracking-tight"
              style={{
                color: '#F5F5F5',
                opacity: transitionTextOpacity,
                transform: `translateY(${transitionTextY}px)`,
              }}
            >
              Everything you need
            </h2>
          </div>

          {/* Immersive feature grid */}
          <div className="grid md:grid-cols-2 gap-0">
            {FEATURES.map((feature, index) => (
              <div
                key={feature.title}
                className="group relative overflow-hidden border-t border-r border-white/10 p-12 lg:p-16 transition-all duration-500 hover:bg-[#111111]"
                style={{
                  animationDelay: `${index * 100}ms`,
                }}
              >
                {/* Background gradient on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#F5A623]/0 to-[#F5A623]/0 group-hover:from-[#F5A623]/5 group-hover:to-[#F5A623]/0 transition-all duration-500" />
                
                {/* Content */}
                <div className="relative z-10">
                  <div className="text-6xl mb-6 text-[#F5A623] group-hover:scale-110 transition-transform duration-500">
                    {feature.icon}
                  </div>
                  <h3 className="font-syne font-bold text-2xl lg:text-3xl text-[#F5F5F5] mb-3 group-hover:translate-x-2 transition-transform duration-300">
                    {feature.title}
                  </h3>
                  <p className="font-sora text-sm text-[#F5A623] uppercase tracking-wider mb-4">
                    {feature.subtitle}
                  </p>
                  <p className="font-sora text-[#8A8A8A] leading-relaxed max-w-md">
                    {feature.desc}
                  </p>
                </div>

                {/* Hover line */}
                <div className="absolute bottom-0 left-0 h-0.5 bg-[#F5A623] w-0 group-hover:w-full transition-all duration-500" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== DRAMATIC STATEMENT SECTION ===================== */}
      <section ref={statementRef} id="statement" className="min-h-screen relative overflow-hidden py-32 px-5">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-12 gap-16 items-center">
            {/* Left - Large editorial text */}
            <div className="lg:col-span-7">
              <p className="portal-label text-[#F5A623] mb-8">02 — About</p>
              <h2 
                className="font-syne font-extrabold text-[clamp(2rem,6vw,5rem)] leading-[0.95] tracking-tight"
                style={{
                  color: '#F5F5F5',
                }}
              >
                Business data shouldn't just tell you what happened.
                <br />
                <br />
                <span style={{ color: '#F5A623' }}>
                  It should tell you what happens next.
                </span>
              </h2>
              
              <div className="mt-12">
                <p className="font-syne font-extrabold text-[clamp(4rem,15vw,12rem)] leading-none text-transparent" style={{
                  WebkitTextStroke: '2px rgba(245, 166, 35, 0.2)',
                }}>
                  01
                </p>
              </div>
            </div>

            {/* Right - Description */}
            <div className="lg:col-span-5 lg:pl-16">
              <div className="border-l-2 border-[#F5A623]/30 pl-8">
                <p className="font-sora text-xl lg:text-2xl text-[#8A8A8A] leading-relaxed">
                  Smart Business Assistant transforms sales, inventory and customer data into actionable decisions.
                </p>
                
                <div className="mt-8 space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-2 h-2 bg-[#F5A623]" />
                    <p className="font-sora text-[#8A8A8A]">Real-time analytics</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-2 h-2 bg-[#F5A623]" />
                    <p className="font-sora text-[#8A8A8A]">AI-powered predictions</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-2 h-2 bg-[#F5A623]" />
                    <p className="font-sora text-[#8A8A8A]">Actionable insights</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================== INTELLIGENCE SECTION ===================== */}
      <section id="intelligence" className="min-h-screen relative overflow-hidden py-32 px-5 border-t border-white/10">
        <div className="max-w-7xl mx-auto">
          <p className="portal-label text-[#F5A623] mb-8">03 — Intelligence</p>
          
          <div className="grid md:grid-cols-2 gap-0">
            {INTELLIGENCE.map((item, index) => (
              <div
                key={item.title}
                className="group relative border-t border-r border-white/10 p-12 lg:p-20 transition-all duration-500 hover:bg-[#111111]"
              >
                <div className="flex gap-8 items-start">
                  <p className="font-syne font-extrabold text-6xl lg:text-8xl text-[#F5A623]/50 group-hover:text-[#F5A623] transition-colors duration-500">
                    {item.number}
                  </p>
                  <div>
                    <h3 className="font-syne font-bold text-2xl lg:text-3xl text-[#F5F5F5] mb-3 group-hover:translate-x-2 transition-transform duration-300">
                      {item.title}
                    </h3>
                    <p className="font-sora text-[#8A8A8A] leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 h-0.5 bg-[#F5A623] w-0 group-hover:w-full transition-all duration-500" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== HOW IT WORKS SECTION ===================== */}
      <section id="how-it-works" className="min-h-screen relative overflow-hidden py-32 px-5 border-t border-white/10">
        <div className="max-w-7xl mx-auto">
          <p className="portal-label text-[#F5A623] mb-8">04 — How It Works</p>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-0">
            {HOW_IT_WORKS.map((item, index) => (
              <div
                key={item.title}
                className="group relative border-t border-r border-white/10 p-12 lg:p-16 transition-all duration-500 hover:bg-[#111111]"
              >
                <p className="font-syne font-extrabold text-4xl lg:text-5xl text-[#F5A623]/50 group-hover:text-[#F5A623] transition-colors duration-500 mb-6">
                  {item.number}
                </p>
                <h3 className="font-syne font-bold text-xl lg:text-2xl text-[#F5F5F5] mb-3 group-hover:translate-x-2 transition-transform duration-300">
                  {item.title}
                </h3>
                <p className="font-sora text-[#8A8A8A] leading-relaxed">
                  {item.desc}
                </p>
                <div className="absolute bottom-0 left-0 h-0.5 bg-[#F5A623] w-0 group-hover:w-full transition-all duration-500" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== CTA SECTION ===================== */}
      <section className="py-32 px-5 border-t border-white/10">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-syne font-extrabold text-[clamp(2rem,6vw,5rem)] leading-[0.9] tracking-tight text-[#F5F5F5] mb-8">
            Ready to transform your business?
          </h2>
          <p className="font-sora text-xl text-[#8A8A8A] mb-12 max-w-2xl mx-auto">
            Start using AI-powered business intelligence today and make data-driven decisions that grow your business.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register" className="group inline-flex items-center justify-center gap-2 bg-[#F5A623] text-[#080808] px-10 py-4 rounded-sm font-sora font-semibold text-sm tracking-wider uppercase transition-all duration-300 hover:bg-[#E8913C] hover:translate-x-2">
              Get Started <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link href="/login" className="inline-flex items-center justify-center border border-white/20 text-white px-10 py-4 rounded-sm font-sora font-semibold text-sm tracking-wider uppercase transition-all duration-300 hover:bg-white/5 hover:border-white/40">
              Login
            </Link>
          </div>
        </div>
      </section>

      {/* ===================== FOOTER STRIP ===================== */}
      <footer className="portal-footer-strip px-5">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="portal-label">© {new Date().getFullYear()} Smart Business Assistant</p>
          <div className="flex gap-6">
            <Link href="/privacy" className="portal-nav-link">Privacy</Link>
            <Link href="/terms" className="portal-nav-link">Terms</Link>
            <Link href="/contact" className="portal-nav-link">Contact</Link>
          </div>
        </div>
      </footer>

      {/* ===================== FLOATING AI ASSISTANT ===================== */}
      <div className="portal-ai-assistant">
        <span className="portal-ai-assistant-icon">✦</span>
        <span className="portal-ai-assistant-label">Ask Smart AI</span>
      </div>
    </div>
  );
}
