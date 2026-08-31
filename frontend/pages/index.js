import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { isAuthenticated } from "../lib/auth";
import { useLanguage } from "../lib/LanguageContext";
import {
  Menu,
  X,
  ArrowRight,
  BarChart3,
  Package,
  Brain,
  Heart,
  AlertTriangle,
  Lightbulb,
  Globe,
} from "lucide-react";
import GradientWaves from "../components/GradientWaves";

const NAV_LINKS = [
  { href: "#statement", key: "landing.nav.about" },
  { href: "#intelligence", key: "landing.nav.intelligence" },
  { href: "#how-it-works", key: "landing.nav.howItWorks" },
  { href: "/docs", key: "landing.nav.docs" },
  { href: "/contact", key: "landing.nav.contact" },
];

const FEATURES = [
  {
    icon: BarChart3,
    titleKey: "landing.features.salesAnalytics",
    subtitleKey: "landing.features.salesAnalyticsSubtitle",
    descKey: "landing.features.salesAnalyticsDesc",
  },
  {
    icon: Package,
    titleKey: "landing.features.stockManagement",
    subtitleKey: "landing.features.stockManagementSubtitle",
    descKey: "landing.features.stockManagementDesc",
  },
  {
    icon: Brain,
    titleKey: "landing.features.aiPredictions",
    subtitleKey: "landing.features.aiPredictionsSubtitle",
    descKey: "landing.features.aiPredictionsDesc",
  },
  {
    icon: Heart,
    titleKey: "landing.features.reviewSentiment",
    subtitleKey: "landing.features.reviewSentimentSubtitle",
    descKey: "landing.features.reviewSentimentDesc",
  },
  {
    icon: AlertTriangle,
    titleKey: "landing.features.anomalyDetection",
    subtitleKey: "landing.features.anomalyDetectionSubtitle",
    descKey: "landing.features.anomalyDetectionDesc",
  },
  {
    icon: Lightbulb,
    titleKey: "landing.features.smartRecommendations",
    subtitleKey: "landing.features.smartRecommendationsSubtitle",
    descKey: "landing.features.smartRecommendationsDesc",
  },
];

const INTELLIGENCE = [
  {
    number: "01",
    titleKey: "landing.intelligence.salesIntelligence",
    descKey: "landing.intelligence.salesIntelligenceDesc",
  },
  {
    number: "02",
    titleKey: "landing.intelligence.predictiveAnalytics",
    descKey: "landing.intelligence.predictiveAnalyticsDesc",
  },
  {
    number: "03",
    titleKey: "landing.intelligence.customerSentiment",
    descKey: "landing.intelligence.customerSentimentDesc",
  },
  { 
    number: "04", 
    titleKey: "landing.intelligence.businessAlerts", 
    descKey: "landing.intelligence.businessAlertsDesc" 
  },
];

const HOW_IT_WORKS = [
  { 
    number: "01", 
    titleKey: "landing.howItWorks.uploadData", 
    descKey: "landing.howItWorks.uploadDataDesc" 
  },
  {
    number: "02",
    titleKey: "landing.howItWorks.letAIAnalyze",
    descKey: "landing.howItWorks.letAIAnalyzeDesc",
  },
  {
    number: "03",
    titleKey: "landing.howItWorks.getInsights",
    descKey: "landing.howItWorks.getInsightsDesc",
  },
  { 
    number: "04", 
    titleKey: "landing.howItWorks.takeAction", 
    descKey: "landing.howItWorks.takeActionDesc" 
  },
];

export default function LandingPage() {
  const router = useRouter();
  const { language, setLanguage, t } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [transitionProgress, setTransitionProgress] = useState(0);
  const heroRef = useRef(null);
  const transitionRef = useRef(null);
  const statementRef = useRef(null);

  useEffect(() => {
    if (isAuthenticated()) router.push("/dashboard");

    const handleScroll = () => {
      if (!heroRef.current || !transitionRef.current) return;

      const heroRect = heroRef.current.getBoundingClientRect();
      const heroHeight = heroRef.current.offsetHeight;
      const viewportHeight = window.innerHeight;

      // Calculate scroll progress through hero (0 to 1)
      const progress = Math.min(
        1,
        Math.max(0, -heroRect.top / (heroHeight - viewportHeight)),
      );
      setScrollProgress(progress);

      // Calculate transition section progress
      const transitionRect = transitionRef.current.getBoundingClientRect();
      const transitionProgress = Math.min(
        1,
        Math.max(0, -transitionRect.top / viewportHeight),
      );
      setTransitionProgress(transitionProgress);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, [router]);

  // Calculate animation values based on scroll position (repeating)
  const scrollY = typeof window !== "undefined" ? window.scrollY : 0;
  const animationPhase = (scrollY / 100) % 1; // Creates a repeating 0-1 cycle every 100px
  const smoothAnimation = Math.sin(animationPhase * Math.PI); // Smooth sine wave

  const smartTranslateX = smoothAnimation * 30;
  const smartScale = 1 + smoothAnimation * 0.02;
  const smartTranslateY = smoothAnimation * -15;

  const panelOffset = scrollProgress * 120; // Panels move outward
  const wordmarkScale = 1 + scrollProgress * 0.3; // Wordmark grows
  const wordmarkSpacing = -0.02 - scrollProgress * 0.01; // Tracking tightens
  const wordmarkSeparation = scrollProgress * 200; // Halves separate

  // Transition section animations
  const transitionImageX = transitionProgress * 20; // Image moves right
  const transitionImageScale = 1 - transitionProgress * 0.1; // Image shrinks slightly
  const transitionTextOpacity = transitionProgress; // Text fades in
  const transitionTextY = 30 - transitionProgress * 30; // Text moves up

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
                {t(link.key)}
              </a>
            ))}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-3">
            {/* Language Selector */}
            <div className="relative">
              <button
                onClick={() => setShowLanguageMenu(!showLanguageMenu)}
                className="p-2 rounded-lg border hairline hover:bg-ground-secondary transition-colors flex items-center gap-2"
              >
                <Globe size={18} />
                <span className="hidden sm:inline text-sm">{language.toUpperCase()}</span>
              </button>
              
              {showLanguageMenu && (
                <div className="absolute right-0 top-full mt-2 bg-ground-secondary border hairline rounded-lg shadow-xl py-2 min-w-[140px] z-50">
                  <button
                    onClick={() => { setLanguage('en'); setShowLanguageMenu(false); }}
                    className={`w-full px-4 py-2 text-left text-sm hover:bg-ground transition-colors flex items-center gap-2 ${language === 'en' ? 'text-amber' : 'text-[#8A8A8A]'}`}
                  >
                    <span>🇬🇧</span>
                    <span>English</span>
                  </button>
                  <button
                    onClick={() => { setLanguage('fr'); setShowLanguageMenu(false); }}
                    className={`w-full px-4 py-2 text-left text-sm hover:bg-ground transition-colors flex items-center gap-2 ${language === 'fr' ? 'text-amber' : 'text-[#8A8A8A]'}`}
                  >
                    <span>🇫🇷</span>
                    <span>Français</span>
                  </button>
                  <button
                    onClick={() => { setLanguage('ar'); setShowLanguageMenu(false); }}
                    className={`w-full px-4 py-2 text-left text-sm hover:bg-ground transition-colors flex items-center gap-2 ${language === 'ar' ? 'text-amber' : 'text-[#8A8A8A]'}`}
                  >
                    <span>🇸🇦</span>
                    <span>العربية</span>
                  </button>
                </div>
              )}
            </div>
            
            <Link href="/login" className="portal-nav-link">
              {t('landing.nav.login')}
            </Link>
            <Link href="/register" className="portal-pill-btn">
              {t('landing.nav.getStarted')}
            </Link>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="lg:hidden border-t hairline bg-ground-secondary">
            <div className="px-5 py-4 flex flex-col gap-1">
              {[
                ...NAV_LINKS,
                { href: "/login", key: "landing.nav.login" },
                { href: "/register", key: "landing.nav.getStarted" },
              ].map((link) => (
                <a
                  key={link.key || link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="px-3 py-2.5 rounded-lg portal-nav-link hover:bg-ground-secondary/50 transition"
                >
                  {t(link.key || link.href)}
                </a>
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* ===================== HERO SECTION ===================== */}
      <section
        ref={heroRef}
        className="relative min-h-screen overflow-hidden bg-[#080808]"
      >
        {/* GradientWaves Background */}
        <div className="absolute inset-0 z-0">
          <GradientWaves
            horizonColor="#080808"
            waveColor="#F5A623"
            crestColor="#FF7210"
            speed={0.4}
            amplitude={2.5}
            waveScale={0.6}
            waveRatio={0.9}
            swell={35}
            turbulence={20}
            tilt={1.11}
            zoom={1.0}
            height={5.5}
            fogDepth={15}
            detail="medium"
            brightness={1.0}
            opacity={1.0}
            mouseInteraction={true}
            parallaxStrength={0.5}
            grain={true}
            grainIntensity={0.05}
          />
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-5 min-h-screen flex flex-col justify-center pt-20">
          {/* Asymmetric layout */}
          <div className="grid lg:grid-cols-12 gap-8 items-end">
            {/* Left - Oversized typography */}
            <div className="lg:col-span-8 space-y-4">
              <p
                className="portal-label text-[#F5A623] tracking-[0.3em]"
                style={{
                  transform: `translateY(${smoothAnimation * -10}px)`,
                }}
              >
                {t('landing.hero.subtitle')}
              </p>

              <h1
                className="font-syne font-extrabold text-[clamp(3rem,12vw,10rem)] leading-[0.85] tracking-tight"
                style={{
                  color: "#F5F5F5",
                  transform: `translateY(${smartTranslateY}px) scale(${smartScale})`,
                  transition: "transform 0.1s linear",
                }}
              >
                <span
                  className="block"
                  style={{
                    transform: `translateX(${-smartTranslateX}px)`,
                    transition: "transform 0.1s linear",
                  }}
                >
                  Smart
                </span>
                <span
                  className="block text-[#F5A623]"
                  style={{
                    transform: `translateX(${smartTranslateX}px)`,
                    transition: "transform 0.1s linear",
                  }}
                >
                  Business
                </span>
              </h1>

              <p
                className="font-sora text-xl lg:text-2xl text-[#8A8A8A] max-w-2xl leading-relaxed"
                style={{
                  transform: `translateY(${smoothAnimation * -15}px)`,
                }}
              >
                {t('landing.hero.tagline')}
              </p>
            </div>
          </div>

          {/* Scroll indicator */}
        </div>
      </section>

      {/* ===================== IMMERSIVE FEATURE SECTION ===================== */}
      <section
        ref={transitionRef}
        className="min-h-screen relative overflow-hidden py-32 px-5"
      >
        <div className="max-w-7xl mx-auto">
          {/* Large editorial heading */}
          <div className="mb-24">
            <p className="portal-label text-[#F5A623] mb-4">
              01 — Intelligence
            </p>
            <h2
              className="font-syne font-extrabold text-[clamp(2.5rem,8vw,6rem)] leading-[0.9] tracking-tight"
              style={{
                color: "#fffff",
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
                  <div className="mb-6 text-[#F5A623] group-hover:scale-110 transition-transform duration-500">
                    <feature.icon size={48} />
                  </div>
                  <h3 className="font-syne font-bold text-2xl lg:text-3xl text-[#F5F5F5] mb-3 group-hover:translate-x-2 transition-transform duration-300">
                    {t(feature.titleKey)}
                  </h3>
                  <p className="font-sora text-sm text-[#F5A623] uppercase tracking-wider mb-4">
                    {t(feature.subtitleKey)}
                  </p>
                  <p className="font-sora text-[#8A8A8A] leading-relaxed max-w-md">
                    {t(feature.descKey)}
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
      <section
        ref={statementRef}
        id="statement"
        className="min-h-screen relative overflow-hidden py-32 px-5"
      >
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-12 gap-16 items-center">
            {/* Left - Large editorial text */}
            <div className="lg:col-span-7">
              <p className="portal-label text-[#F5A623] mb-8">02 — About</p>
              <h2
                className="font-syne font-extrabold text-[clamp(2rem,6vw,5rem)] leading-[0.95] tracking-tight"
                style={{
                  color: "#F5F5F5",
                }}
              >
                {t('landing.about.heading')}
                <br />
                <br />
                <span style={{ color: "#F5A623" }}>
                  {t('landing.about.subheading')}
                </span>
              </h2>

              <div className="mt-12">
                <p
                  className="font-syne font-extrabold text-[clamp(4rem,15vw,12rem)] leading-none text-transparent"
                  style={{
                    WebkitTextStroke: "2px rgba(245, 166, 35, 0.2)",
                  }}
                >
                  {t('landing.about.ready')}
                </p>
              </div>
            </div>

            {/* Right - Description */}
            <div className="lg:col-span-5 lg:pl-16">
              <div className="border-l-2 border-[#F5A623]/30 pl-8">
                <p className="font-sora text-xl lg:text-2xl text-[#8A8A8A] leading-relaxed">
                  {t('landing.about.description')}
                </p>

                <div className="mt-8 space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-2 h-2 bg-[#F5A623]" />
                    <p className="font-sora text-[#8A8A8A]">
                      {t('landing.about.realTimeAnalytics')}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-2 h-2 bg-[#F5A623]" />
                    <p className="font-sora text-[#8A8A8A]">
                      {t('landing.about.aiPoweredPredictions')}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-2 h-2 bg-[#F5A623]" />
                    <p className="font-sora text-[#8A8A8A]">
                      {t('landing.about.actionableInsights')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================== INTELLIGENCE SECTION ===================== */}
      <section
        id="intelligence"
        className="min-h-screen relative overflow-hidden py-32 px-5 border-t border-white/10"
      >
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
                      {t(item.titleKey)}
                    </h3>
                    <p className="font-sora text-[#8A8A8A] leading-relaxed">
                      {t(item.descKey)}
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
      <section
        id="how-it-works"
        className="min-h-screen relative overflow-hidden py-32 px-5 border-t border-white/10"
      >
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
                  {t(item.titleKey)}
                </h3>
                <p className="font-sora text-[#8A8A8A] leading-relaxed">
                  {t(item.descKey)}
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
            {t('landing.cta.heading')}
          </h2>
          <p className="font-sora text-xl text-[#8A8A8A] mb-12 max-w-2xl mx-auto">
            {t('landing.cta.description')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="group inline-flex items-center justify-center gap-2 bg-[#F5A623] text-[#080808] px-10 py-4 rounded-sm font-sora font-semibold text-sm tracking-wider uppercase transition-all duration-300 hover:bg-[#E8913C] hover:translate-x-2"
            >
              {t('landing.cta.getStarted')}{" "}
              <ArrowRight
                size={16}
                className="group-hover:translate-x-1 transition-transform"
              />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center border border-white/20 text-white px-10 py-4 rounded-sm font-sora font-semibold text-sm tracking-wider uppercase transition-all duration-300 hover:bg-white/5 hover:border-white/40"
            >
              {t('landing.cta.login')}
            </Link>
          </div>
        </div>
      </section>

      {/* ===================== FOOTER STRIP ===================== */}
      <footer className="portal-footer-strip px-5">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="portal-label">
            {t('landing.footer.copyright').replace('{year}', new Date().getFullYear())}
          </p>
          <div className="flex gap-6">
            <Link href="/privacy" className="portal-nav-link">
              {t('landing.footer.privacy')}
            </Link>
            <Link href="/terms" className="portal-nav-link">
              {t('landing.footer.terms')}
            </Link>
            <Link href="/contact" className="portal-nav-link">
              {t('landing.footer.contact')}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
