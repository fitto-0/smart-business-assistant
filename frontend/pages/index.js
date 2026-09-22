import {
  useState,
  useEffect,
  useRef,
  Children,
  cloneElement,
  isValidElement,
} from "react";
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
  Zap,
  Shield,
  TrendingUp,
  Users,
  Clock,
  CheckCircle,
} from "lucide-react";
import VantaTrunk from "../components/VantaTrunk";

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

const HOW_IT_WORKS = [
  {
    number: "01",
    titleKey: "landing.howItWorks.uploadData",
    descKey: "landing.howItWorks.uploadDataDesc",
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
    descKey: "landing.howItWorks.takeActionDesc",
  },
];

const TESTIMONIALS = [
  {
    name: "Sara N.",
    role: "Operations · Mena Logistics",
    quote: "We used to run reports on Friday and argue about them on Monday. Now the numbers arrive with their context attached.",
    rating: 5,
  },
  {
    name: "Ahmed K.",
    role: "Founder · TechStart Morocco",
    quote: "The AI predictions have been game-changing. We can now forecast inventory needs with 95% accuracy.",
    rating: 5,
  },
  {
    name: "Leila B.",
    role: "Sales Director · RetailPro",
    quote: "Finally, a tool that understands our business. The anomaly detection has saved us thousands in stock losses.",
    rating: 5,
  },
];

const BENEFITS = [
  {
    icon: TrendingUp,
    titleKey: "landing.benefits.revenueGrowth",
    descKey: "landing.benefits.revenueGrowthDesc",
  },
  {
    icon: Clock,
    titleKey: "landing.benefits.timeSavings",
    descKey: "landing.benefits.timeSavingsDesc",
  },
  {
    icon: Shield,
    titleKey: "landing.benefits.dataSecurity",
    descKey: "landing.benefits.dataSecurityDesc",
  },
  {
    icon: Users,
    titleKey: "landing.benefits.teamCollaboration",
    descKey: "landing.benefits.teamCollaborationDesc",
  },
];

// Deterministic sparkline values — no Math.random, so the server and
// client render identical markup (avoids hydration mismatches).
const SPARK = Array.from({ length: 48 }, (_, i) => {
  const base = 0.34 + Math.sin(i * 0.31) * 0.22;
  const ripple = Math.sin(i * 1.7) * 0.06;
  const spike = i === 11 || i === 29 ? 0.3 : 0;
  return Math.min(1, Math.max(0.12, base + ripple + spike));
});

// ─────────────────────────────────────────────────────────────
//  Motion layer
//
//  Design intent: entrances are *time-based*, so they always play
//  to completion and stay smooth regardless of scroll speed. Only
//  the hero gets scroll-linked movement, and that loop is capped
//  and self-terminating so it never burns frames forever.
// ─────────────────────────────────────────────────────────────

/** Fires once when the element first crosses the viewport threshold. */
function useReveal(threshold = 0.15) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (typeof IntersectionObserver === "undefined") {
      setVisible(true); // SSR / very old browsers: just show the content
      return;
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { threshold, rootMargin: "0px 0px -8% 0px" },
    );

    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);

  return { ref, visible };
}

/** easeOutCubic — the only entrance curve used on this page. */
const EASE_ENTER = "cubic-bezier(0.16, 1, 0.3, 1)";

/**
 * Reveals its direct children one after another with refined timing.
 *
 * Uses cloneElement (not wrapper divs) so grid/flex parents and
 * first:/last: variants keep working exactly as authored.
 */
function Stagger({
  children,
  className = "",
  duration = 600,
  stagger = 100,
  offset = 24,
  as: Tag = "div",
}) {
  const { ref, visible } = useReveal(0.12);
  const items = Children.toArray(children);

  return (
    <Tag ref={ref} className={className}>
      {items.map((child, i) => {
        if (!isValidElement(child)) return child;

        const delay = i * stagger;
        return cloneElement(child, {
          key: child.key ?? i,
          style: {
            ...(child.props.style || {}),
            opacity: visible ? 1 : 0,
            transform: visible ? "none" : `translateY(${offset}px)`,
            transition: `opacity ${duration}ms ${EASE_ENTER} ${delay}ms, transform ${duration}ms ${EASE_ENTER} ${delay}ms`,
          },
        });
      })}
    </Tag>
  );
}

/**
 * Counts 0 → target with an easeOutCubic curve, once, when revealed.
 * Keeps its own rAF handle so it can be cancelled on unmount.
 */
function useCounter({ target = 2847, duration = 2000, delay = 400 } = {}) {
  const { ref, visible } = useReveal(0.35);
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!visible) return;

    let rafId = null;
    let timeoutId = null;

    const start = () => {
      const t0 = performance.now();
      const tick = (now) => {
        const p = Math.min(1, (now - t0) / duration);
        const eased = 1 - Math.pow(1 - p, 3);
        setValue(Math.round(eased * target));
        if (p < 1) rafId = requestAnimationFrame(tick);
      };
      rafId = requestAnimationFrame(tick);
    };

    timeoutId = setTimeout(start, delay);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [visible, target, duration, delay]);

  return { ref, value };
}

export default function LandingPage() {
  const router = useRouter();
  const { language, setLanguage, t } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [activeSection, setActiveSection] = useState("");

  // Animated counters via hook
  const teams = useCounter({ target: 2847, duration: 2000, delay: 400 });
  const satisfaction = useCounter({ target: 94, duration: 1800, delay: 600 });
  const uptime = useCounter({ target: 997, duration: 1600, delay: 800 });

  // Parallax hero
  const heroRef = useRef(null);
  const [heroY, setHeroY] = useState(0);
  useEffect(() => {
    if (!heroRef.current) return;
    let rafId = null;
    const update = () => {
      if (!heroRef.current) return;
      const rect = heroRef.current.getBoundingClientRect();
      const h = rect.height || 1;
      const vh = window.innerHeight || 1;
      const p = Math.min(1, Math.max(0, -rect.top / (h - vh)));
      // Subtle parallax (only 40px max)
      setHeroY(p * 40);
      rafId = requestAnimationFrame(update);
    };
    rafId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(rafId);
  }, []);

  // Redirect
  useEffect(() => {
    if (isAuthenticated() && !router.isReady) return;
    if (isAuthenticated() && router.isReady) {
      router.replace("/dashboard");
    }
  }, [router.isReady, isAuthenticated()]);

  // Active section tracking for navigation
  useEffect(() => {
    const sections = ["statement", "intelligence", "how-it-works", "benefits", "testimonials"];
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { threshold: 0.3 }
    );

    sections.forEach((id) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, []);

  // Smooth scroll handler
  const handleSmoothScroll = (e, href) => {
    e.preventDefault();
    const targetId = href.replace("#", "");
    const element = document.getElementById(targetId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
      setMenuOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas text-ink overflow-x-hidden">
      {/* ===================== NAVIGATION ===================== */}
      <nav className="fixed top-0 inset-x-0 z-50 h-[56px] border-b border-line bg-canvas/70 backdrop-blur-[14px]">
        <div className="max-w-[1200px] mx-auto px-5 h-full flex items-center justify-between gap-4">
          {/* Left — mobile toggle + wordmark */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              className="lg:hidden -ms-2 p-2 rounded-xs border border-line text-ink-2 hover:text-ink hover:bg-surface transition-colors"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
            >
              {menuOpen ? <X size={16} /> : <Menu size={16} />}
            </button>

            <Link href="/" className="flex items-baseline gap-0.5 group">
              <span className="font-display font-medium text-[14px] tracking-[-0.02em] text-ink leading-none">
                Smart Business
              </span>
              <span className="font-display text-[14px] leading-none text-ember-500">
                .
              </span>
            </Link>
          </div>

          {/* Centre — desktop links */}
          <div className="hidden lg:flex items-center gap-6">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={(e) => handleSmoothScroll(e, link.href)}
                className={`font-mono text-micro uppercase transition-colors ${
                  activeSection === link.href.replace("#", "")
                    ? "text-ember-500"
                    : "text-ink-3 hover:text-ink"
                }`}
              >
                {t(link.key)}
              </a>
            ))}
          </div>

          {/* Right — language + auth */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowLangMenu((v) => !v)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xs border border-line text-ink-3 hover:text-ink hover:bg-surface transition-colors"
                aria-label="Change language"
                aria-expanded={showLangMenu}
              >
                <Globe size={13} />
                <span className="hidden sm:inline font-mono text-micro uppercase">
                  {language}
                </span>
              </button>

              {showLangMenu && (
                <div className="absolute end-0 top-full mt-2 min-w-[136px] py-1.5 bg-surface border border-line">
                  {[
                    { code: "en", label: "English" },
                    { code: "fr", label: "Français" },
                    { code: "ar", label: "العربية" },
                  ].map((l) => (
                    <button
                      key={l.code}
                      type="button"
                      onClick={() => {
                        setLanguage(l.code);
                        setShowLangMenu(false);
                      }}
                      className={
                        "w-full flex items-center gap-3 px-3.5 py-2 text-start transition-colors hover:bg-surface-2 " +
                        (language === l.code ? "text-ember-500" : "text-ink-2")
                      }
                    >
                      <span className="font-mono text-micro uppercase w-5 shrink-0">
                        {l.code}
                      </span>
                      <span className="text-[13px]">{l.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <Link
              href="/login"
              className="hidden sm:inline font-mono text-micro uppercase text-ink-3 hover:text-ink transition-colors"
            >
              {t("landing.nav.login")}
            </Link>

            <Link
              href="/register"
              className="group inline-flex items-center gap-1.5 bg-ink text-canvas ps-3.5 pe-3 py-2 rounded-xs text-[11px] font-medium uppercase tracking-[0.12em] transition-colors hover:bg-ember-100"
            >
              <span>{t("landing.nav.getStarted")}</span>
              <ArrowRight
                size={11}
                className="transition-transform group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5"
              />
            </Link>
          </div>
        </div>

        {/* Mobile sheet */}
        {menuOpen && (
          <div className="lg:hidden border-t border-line bg-canvas">
            <div className="max-w-[1200px] mx-auto px-5 py-3 flex flex-col">
              {[
                ...NAV_LINKS,
                { href: "/login", key: "landing.nav.login" },
                { href: "/register", key: "landing.nav.getStarted" },
              ].map((link) => (
                <a
                  key={link.key + link.href}
                  href={link.href}
                  onClick={(e) => {
                    if (link.href.startsWith("#")) {
                      handleSmoothScroll(e, link.href);
                    } else {
                      setMenuOpen(false);
                    }
                  }}
                  className="py-3 border-b border-line last:border-b-0 font-mono text-micro uppercase text-ink-2 hover:text-ink transition-colors"
                >
                  {t(link.key)}
                </a>
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* ===================== HERO SECTION ===================== */}
      <section ref={heroRef} className="relative min-h-screen overflow-visible">
        <div className="grain" />

        <div
          className="relative z-10 max-w-[1200px] mx-auto px-5 pt-[78px] min-h-screen flex flex-col lg:flex-row items-start justify-between pb-20"
          style={{
            transform: `translateY(${heroY}px)`,
            transition: "transform 120ms cubic-bezier(0.22, 0.61, 0.36, 1)",
          }}
        >
          {/* Left side - Content */}
          <div className="max-w-[920px] flex-1 pt-20">
            <div className="flex items-center gap-3 mb-8 group">
              <span className="font-mono text-micro uppercase text-ember-500/70">
                {t("landing.hero.eyebrow")} · Morocco
              </span>
              <div className="h-px flex-1 bg-line opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            </div>

            <h1
              className="font-display font-medium text-statement text-ink leading-[0.92] tracking-[-0.035em] mb-8"
              style={{ letterSpacing: "-0.035em" }}
            >
              {t("landing.hero.title") || "We plant flags for brands"}
              <br />
              <span className="text-ember-500">
                {t("landing.hero.highlight") || "that last"}
              </span>
            </h1>

            <p className="text-xl text-ink-2 leading-[1.65] max-w-2xl mb-12">
              {t("landing.hero.tagline") ||
                "Turn your business data into your next decision."}
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mb-22">
              <Link
                href="/register"
                className="group inline-flex items-center justify-center gap-2 bg-ink text-canvas px-8 py-4 rounded-xs text-[12px] font-medium uppercase tracking-[0.14em] transition-all duration-300 hover:bg-ember-100 hover:shadow-lg hover:shadow-ember-500/20"
              >
                {t("landing.hero.cta") || "Start free"}
                <ArrowRight
                  size={13}
                  className="opacity-70 group-hover:opacity-100 group-hover:translate-x-[3px] transition-all"
                />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center border border-line text-ink px-8 py-4 rounded-xs text-[12px] font-medium uppercase tracking-[0.14em] transition-all duration-300 hover:bg-surface hover:border-ember-500/50"
              >
                {t("landing.hero.demo") || "See how it works"}
              </Link>
            </div>

            <Stagger
              className="flex flex-wrap gap-x-16 gap-y-10 pt-12 pb-8 border-t border-line"
              stagger={120}
            >
              <div className="flex flex-col">
                <p
                  ref={teams.ref}
                  className="font-display text-6xl text-ember-500 tabular-nums leading-tight tracking-tight"
                >
                  {teams.value.toLocaleString()}
                </p>
                <p className="font-mono text-micro uppercase text-ink-3 mt-4 tracking-wide">
                  {t("landing.hero.stats.teams")}
                </p>
              </div>

              <div className="flex flex-col">
                <p
                  ref={satisfaction.ref}
                  className="font-display text-6xl text-ink tabular-nums leading-tight tracking-tight"
                >
                  {satisfaction.value}%
                </p>
                <p className="font-mono text-micro uppercase text-ink-3 mt-4 tracking-wide">
                  {t("landing.hero.stats.satisfaction")}
                </p>
              </div>

              <div className="flex flex-col">
                <p
                  ref={uptime.ref}
                  className="font-display text-6xl text-ink tabular-nums leading-tight tracking-tight"
                >
                  {(uptime.value / 10).toFixed(1)}h
                </p>
                <p className="font-mono text-micro uppercase text-ink-3 mt-4 tracking-wide">
                  {t("landing.hero.stats.time")}
                </p>
              </div>
            </Stagger>
          </div>

          {/* Right side - Vanta animation */}
          <div className="hidden lg:block flex-1 h-full min-h-[600px] pt-10">
            <VantaTrunk />
          </div>
        </div>

        <div className="absolute bottom-10 inset-x-0 flex flex-col items-center gap-2 pointer-events-none">
          <span className="font-mono text-micro uppercase text-ink-3">
            {t("landing.hero.scroll") || "Scroll"}
          </span>
          <span className="relative block w-px h-6 bg-line overflow-hidden">
            <span className="absolute inset-x-0 top-0 h-1 bg-ember-500 animate-pulse" />
          </span>
        </div>
      </section>
      {/* ===================== FEATURES SECTION ===================== */}
      <section
        id="statement"
        className="relative py-32 px-5 border-t border-line"
      >
        <div className="max-w-[1100px] mx-auto">
          <Stagger className="max-w-[800px]">
            <p className="font-mono text-micro uppercase text-ember-500 mb-8 pt-4">
              {t("landing.features.intro") || "What we built"}
            </p>
            <h2
              className="font-display font-medium text-section text-ink leading-[0.95] tracking-[-0.03em] mb-10"
              style={{ letterSpacing: "-0.03em" }}
            >
              {t("landing.statement.heading") ||
                "Built for teams that read their numbers."}
            </h2>
            <p className="text-xl text-ink-2 leading-[1.7] mb-12 max-w-[620px]">
              {t("landing.statement.intro") ||
                "Smart Business Assistant transforms sales, inventory and customer data into decisions you can act on."}
            </p>

            {/* Feature ledger — hairline rows, no cards */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-0">
              {FEATURES.map((f, i) => (
                <div
                  key={f.titleKey}
                  className="py-8 border-t border-line first:pt-0 last:pb-0 group hover:bg-surface-2 transition-colors duration-300"
                >
                  <div className="flex items-start gap-3">
                    <div className="shrink-0 w-7 h-7 rounded-xs bg-surface border border-line flex items-center justify-center mt-0.5 group-hover:border-ember-500/50 transition-colors">
                      <f.icon size={13} className="text-ember-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-mono text-micro uppercase text-ember-500/80 mb-2 mt-1">
                        {String(i + 1).padStart(2, "0")}
                      </p>
                      <h3 className="font-display font-medium text-[14px] text-ink mb-2 group-hover:text-ember-500 transition-colors">
                        {t(f.titleKey)}
                      </h3>
                      <p className="font-mono text-micro uppercase text-ink-3 mb-1">
                        {t(f.subtitleKey)}
                      </p>
                      <p className="text-[12.5px] text-ink-2 leading-[1.65]">
                        {t(f.descKey)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Stagger>
        </div>
      </section>

      {/* ===================== ABOUT SECTION ===================== */}
      <section
        id="about"
        className="relative py-32 px-5 border-t border-line bg-surface"
      >
        <div className="max-w-[1000px] mx-auto">
          <Stagger>
            <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-start">
              {/* Left — editorial statement */}
              <div>
                <p className="font-mono text-micro uppercase text-ember-500 mb-6">
                  02 — About
                </p>
                <h2
                  className="font-display font-medium text-section text-ink leading-[0.95] tracking-[-0.03em] mb-6"
                  style={{ letterSpacing: "-0.03em" }}
                >
                  {t("landing.about.heading") || "Business data, explained."}
                  <br />
                  <span
                    className="text-ember-500"
                    style={{ fontVariationSettings: '"wght" 500' }}
                  >
                    {t("landing.about.subheading") || "Not just what happened."}
                  </span>
                </h2>
                <p className="text-xl text-ink-2 leading-[1.65] mb-8 max-w-[420px]">
                  {t("landing.about.description") ||
                    "Smart Business Assistant turns sales, inventory and customer data into decisions."}
                </p>

                <ul className="flex flex-wrap gap-x-8 gap-y-3">
                  {[
                    {
                      k: "landing.about.realTimeAnalytics",
                      fallback: "Real-time analytics",
                    },
                    {
                      k: "landing.about.aiPoweredPredictions",
                      fallback: "AI-powered predictions",
                    },
                    {
                      k: "landing.about.actionableInsights",
                      fallback: "Actionable insights",
                    },
                  ].map((item) => (
                    <li key={item.k} className="flex items-center gap-3">
                      <span
                        aria-hidden="true"
                        className="w-[5px] h-[5px] bg-ember-500 shrink-0"
                      />
                      <span className="text-ink-2 text-[15px]">
                        {t(item.k) || item.fallback}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Right — quiet numeric composition */}
              <div className="hidden md:flex items-center justify-center">
                <div className="relative w-56 h-56 border border-line">
                  <span
                    aria-hidden="true"
                    className="absolute -top-px -start-px w-2 h-2 border-t border-s-2 border-ember-500/60"
                  />
                  <span
                    aria-hidden="true"
                    className="absolute -bottom-px -end-px w-2 h-2 border-b border-e-2 border-ember-500/60"
                  />
                  <div className="absolute inset-0 grid grid-cols-2 grid-rows-2">
                    {[
                      { v: "01", l: "ingest" },
                      { v: "02", l: "model" },
                      { v: "03", l: "detect" },
                      { v: "04", l: "act" },
                    ].map((cell, i) => (
                      <div
                        key={cell.v}
                        className={
                          "flex flex-col justify-between p-5 " +
                          (i < 2 ? "border-b border-line " : "") +
                          (i % 2 === 0 ? "border-e border-line" : "")
                        }
                      >
                        <span className="font-mono text-micro text-ink-3">
                          {cell.v}
                        </span>
                        <span className="font-display font-medium text-[15px] text-ink">
                          {cell.l}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </Stagger>
        </div>
      </section>

      {/* ===================== INTELLIGENCE SECTION ===================== */}
      <section
        id="intelligence"
        className="relative py-32 px-5 border-t border-line"
      >
        <div className="max-w-[1000px] mx-auto">
          <Stagger>
            <div className="grid md:grid-cols-2 gap-12 md:gap-16">
              {/* Left — prose + stat tiles */}
              <div>
                <p className="font-mono text-micro uppercase text-ember-500 mb-6">
                  03 — Intelligence
                </p>
                <h2
                  className="font-display font-medium text-section text-ink leading-[0.95] tracking-[-0.03em] mb-6"
                  style={{ letterSpacing: "-0.03em" }}
                >
                  {t("landing.intelligence.title") ||
                    "One lens, not seven tabs."}
                </h2>
                <p className="text-ink-2 leading-[1.7] mb-10 max-w-[440px]">
                  {t("landing.intelligence.description") ||
                    "Ask a question in plain language and the assistant pulls revenue, inventory and sentiment into a single answer."}
                </p>

                <div className="grid grid-cols-3 border border-line">
                  {[
                    {
                      v: teams.value.toLocaleString(),
                      l: "requests / min",
                      tone: "text-ember-500",
                    },
                    {
                      v: satisfaction.value + "%",
                      l: "satisfaction",
                      tone: "text-ink",
                    },
                    {
                      v: uptime.value / 10 >= 99 ? "99.7%" : "—",
                      l: "uptime",
                      tone: "text-ink",
                    },
                  ].map((tile, i) => (
                    <div
                      key={tile.l}
                      className={
                        "px-5 py-6 " + (i < 2 ? "border-e border-line" : "")
                      }
                    >
                      <p
                        className={
                          "font-display text-[1.75rem] leading-none tabular-nums " +
                          tile.tone
                        }
                      >
                        {tile.v}
                      </p>
                      <p className="font-mono text-micro uppercase text-ink-3 mt-3">
                        {tile.l}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right — sparkline (deterministic, no Math.random: SSR-safe) */}
              <div className="border border-line p-5">
                <div className="flex items-center justify-between mb-5">
                  <p className="font-mono text-micro uppercase text-ink-3">
                    Live activity · 24h
                  </p>
                  <span className="inline-flex items-center gap-2">
                    <span
                      aria-hidden="true"
                      className="w-[5px] h-[5px] bg-ember-500 animate-pulse"
                    />
                    <span className="font-mono text-micro uppercase text-ember-500">
                      live
                    </span>
                  </span>
                </div>

                <div className="h-32 flex items-end gap-[2px]">
                  {SPARK.map((h, i) => (
                    <div
                      key={i}
                      className={
                        "flex-1 " +
                        (h > 0.82 ? "bg-ember-500" : "bg-ember-500/35")
                      }
                      style={{ height: Math.round(h * 100) + "%" }}
                      aria-hidden="true"
                    />
                  ))}
                </div>

                <div className="flex justify-between mt-3">
                  {["00:00", "06:00", "12:00", "18:00", "24:00"].map((l) => (
                    <span key={l} className="font-mono text-micro text-ink-3">
                      {l}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </Stagger>
        </div>
      </section>

      {/* ===================== HOW IT WORKS SECTION ===================== */}
      <section
        id="how-it-works"
        className="relative py-32 px-5 border-t border-line"
      >
        <div className="max-w-[960px] mx-auto">
          <Stagger>
            <p className="font-mono text-micro uppercase text-ember-500 mb-10 pt-4">
              04 — Process
            </p>

            <div className="flex flex-col">
              {HOW_IT_WORKS.map((item) => (
                <div
                  key={item.number}
                  className="relative flex gap-6 sm:gap-8 pb-10 last:pb-0 border-b border-line last:border-b-0 group"
                >
                  <div className="shrink-0">
                    <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xs border border-line flex items-center justify-center group-hover:border-ember-500/50 transition-colors">
                      <span className="font-mono text-base sm:text-lg text-ember-500/60 group-hover:text-ember-500 transition-colors">
                        {item.number}
                      </span>
                    </div>
                  </div>

                  <div className="flex-1 pt-1.5">
                    <h3 className="font-display font-medium text-lg sm:text-xl text-ink mb-2">
                      {t(item.titleKey)}
                    </h3>
                    <p className="text-ink-2 leading-[1.7] max-w-[52ch] text-[15px]">
                      {t(item.descKey)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Stagger>
        </div>
      </section>
      {/* ===================== BENEFITS SECTION ===================== */}
      <section
        id="benefits"
        className="relative py-32 px-5 border-t border-line"
      >
        <div className="max-w-[1000px] mx-auto">
          <Stagger>
            <div className="text-center mb-16 pt-4">
              <p className="font-mono text-micro uppercase text-ember-500 mb-6">
                {t("landing.testimonials.heading") || "Why choose us"}
              </p>
              <h2
                className="font-display font-medium text-section text-ink leading-[0.95] tracking-[-0.03em] mb-6"
                style={{ letterSpacing: "-0.03em" }}
              >
                {t("landing.benefits.revenueGrowth") || "Built for growth"}
              </h2>
              <p className="text-xl text-ink-2 leading-[1.6] max-w-[520px] mx-auto">
                {t("landing.testimonials.subtitle") ||
                  "Everything you need to scale your business with confidence."}
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {BENEFITS.map((benefit, i) => (
                <div
                  key={i}
                  className="p-6 border border-line bg-surface hover:border-ember-500/30 transition-colors duration-300 group"
                >
                  <div className="w-10 h-10 rounded-xs bg-surface-2 border border-line flex items-center justify-center mb-4 group-hover:border-ember-500/50 transition-colors">
                    <benefit.icon size={18} className="text-ember-500" />
                  </div>
                  <h3 className="font-display font-medium text-[15px] text-ink mb-2">
                    {t(benefit.titleKey) || benefit.titleKey}
                  </h3>
                  <p className="text-[13px] text-ink-2 leading-[1.6]">
                    {t(benefit.descKey) || benefit.descKey}
                  </p>
                </div>
              ))}
            </div>
          </Stagger>
        </div>
      </section>

      {/* ===================== TESTIMONIALS SECTION ===================== */}
      <section
        id="testimonials"
        className="relative py-32 px-5 border-t border-line bg-surface"
      >
        <div className="max-w-[1000px] mx-auto">
          <Stagger>
            <div className="text-center mb-16 pt-4">
              <p className="font-mono text-micro uppercase text-ember-500 mb-6">
                {t("landing.testimonials.heading") || "Testimonials"}
              </p>
              <h2
                className="font-display font-medium text-section text-ink leading-[0.95] tracking-[-0.03em] mb-6"
                style={{ letterSpacing: "-0.03em" }}
              >
                {t("landing.testimonials.heading") || "Trusted by teams worldwide"}
              </h2>
              <p className="text-xl text-ink-2 leading-[1.6] max-w-[520px] mx-auto">
                {t("landing.testimonials.subtitle") ||
                  "See what our customers have to say about their experience."}
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {TESTIMONIALS.map((testimonial, i) => (
                <div
                  key={i}
                  className="p-6 border border-line bg-canvas hover:border-ember-500/30 transition-colors duration-300"
                >
                  <div className="flex gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, starIndex) => (
                      <svg
                        key={starIndex}
                        className="w-4 h-4 text-ember-500"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <p className="text-ink-2 leading-[1.6] mb-6 min-h-[72px]">
                    "{testimonial.quote}"
                  </p>
                  <div>
                    <p className="font-display font-medium text-[14px] text-ink">
                      {testimonial.name}
                    </p>
                    <p className="font-mono text-micro uppercase text-ink-3 mt-1">
                      {testimonial.role}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Stagger>
        </div>
      </section>

      {/* ===================== CTA SECTION ===================== */}
      <section className="relative py-32 px-5 border-t border-line bg-surface">
        <div className="max-w-[640px] mx-auto">
          <Stagger className="text-center">
            <p className="font-mono text-micro uppercase text-ember-500 mb-6 pt-4">
              05 — Get started
            </p>
            <h2
              className="font-display font-medium text-section text-ink leading-[0.95] tracking-[-0.03em] mb-6"
              style={{ letterSpacing: "-0.03em" }}
            >
              {t("landing.cta.heading")}
            </h2>
            <p className="text-xl text-ink-2 leading-[1.6] mb-10 max-w-[460px] mx-auto">
              {t("landing.cta.description")}
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/register"
                className="group inline-flex items-center justify-center gap-2 bg-ink text-canvas px-9 py-4 rounded-xs text-[12px] font-medium uppercase tracking-[0.14em] transition-all duration-300 hover:bg-ember-100 hover:shadow-lg hover:shadow-ember-500/20"
              >
                {t("landing.cta.getStarted")}
                <ArrowRight
                  size={13}
                  className="opacity-70 transition-all group-hover:opacity-100 group-hover:translate-x-[3px]"
                />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center border border-line text-ink px-9 py-4 rounded-xs text-[12px] font-medium uppercase tracking-[0.14em] transition-all duration-300 hover:bg-canvas hover:border-ember-500/50"
              >
                {t("landing.cta.login")}
              </Link>
            </div>

            <p className="mt-6 font-mono text-micro uppercase text-ink-3">
              No credit card required · 14-day trial
            </p>
          </Stagger>
        </div>
      </section>

      {/* ===================== FOOTER ===================== */}
      <footer className="border-t border-line px-5 bg-surface pb-8">
        <div className="max-w-[1200px] mx-auto py-12 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex flex-col items-center sm:items-start gap-2">
            <Link href="/" className="flex items-baseline gap-0.5 group">
              <span className="font-display font-medium text-[14px] tracking-[-0.02em] text-ink leading-none">
                Smart Business
              </span>
              <span className="font-display text-[14px] leading-none text-ember-500">
                .
              </span>
            </Link>
            <p className="font-mono text-micro uppercase text-ink-3">
              {t("landing.footer.copyright").replace(
                "{year}",
                new Date().getFullYear(),
              )}
            </p>
          </div>

          <nav className="flex items-center gap-6">
            <Link
              href="/privacy"
              className="font-mono text-micro uppercase text-ink-3 hover:text-ink transition-colors"
            >
              {t("landing.footer.privacy")}
            </Link>
            <Link
              href="/terms"
              className="font-mono text-micro uppercase text-ink-3 hover:text-ink transition-colors"
            >
              {t("landing.footer.terms")}
            </Link>
            <Link
              href="/contact"
              className="font-mono text-micro uppercase text-ink-3 hover:text-ink transition-colors"
            >
              {t("landing.footer.contact")}
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
