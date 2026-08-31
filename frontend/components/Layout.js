import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { isAuthenticated, getUser, fetchCurrentUser, logout } from '../lib/auth';
import { useLanguage } from '../lib/LanguageContext';
import {
  LayoutDashboard, TrendingUp, Package, MessageSquare,
  Brain, AlertTriangle, Lightbulb, User, LogOut,
  Bell, Search, Menu, X, ChevronRight, Zap, Globe
} from 'lucide-react';
import Chatbot from './Chatbot';

const navItems = [
  { href: '/dashboard', key: 'nav.dashboard', icon: LayoutDashboard },
  { href: '/sales', key: 'nav.sales', icon: TrendingUp },
  { href: '/products', key: 'nav.products', icon: Package },
  { href: '/reviews', key: 'nav.reviews', icon: MessageSquare },
  { href: '/predictions', key: 'nav.predictions', icon: Brain },
  { href: '/anomalies', key: 'nav.anomalies', icon: AlertTriangle },
  { href: '/recommendations', key: 'nav.recommendations', icon: Lightbulb },
  { href: '/profile', key: 'nav.profile', icon: User },
];

export default function Layout({ children, title = 'Smart Business Assistant' }) {
  const router = useRouter();
  const { language, setLanguage, t } = useLanguage();
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications] = useState(4);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      if (!isAuthenticated()) {
        router.push('/login');
        return;
      }

      try {
        const currentUser = await fetchCurrentUser();
        setUser(currentUser);
      } catch (error) {
        logout();
        router.push('/login');
      }
    };

    loadUser();
  }, [router]);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  if (!user) return (
    <div className="min-h-screen bg-ground flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber"></div>
    </div>
  );

  const Sidebar = ({ mobile = false }) => (
    <div className={`flex flex-col h-full ${mobile ? 'w-full' : 'w-64'}`}>
      {/* Logo */}
      <div className="p-6 border-b hairline">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber rounded-xl flex items-center justify-center shadow-lg">
            <Zap className="w-5 h-5 text-ground" />
          </div>
          <div>
            <h1 className="portal-heading text-ink text-sm leading-tight">Smart Business</h1>
            <p className="portal-label text-muted">AI Assistant</p>
          </div>
        </div>
      </div>

      {/* User Info */}
      <div className="px-4 py-4 border-b hairline">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-ground-secondary/30">
          <div className="w-9 h-9 bg-teal rounded-full flex items-center justify-center text-ground font-bold text-sm shadow">
            {user.name?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-ink truncate">{user.name}</p>
            <p className="portal-label text-muted truncate">{user.company || user.email}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <p className="portal-label px-4 mb-3">{t('common.menu') || 'Menu'}</p>
        {navItems.map(({ href, key, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            onClick={() => mobile && setSidebarOpen(false)}
            className={`portal-nav-link flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium ${
              router.pathname === href 
                ? 'bg-amber/10 text-amber' 
                : 'text-ink-secondary hover:text-ink hover:bg-ground-secondary/50'
            }`}
          >
            <Icon className="w-4.5 h-4.5 flex-shrink-0" size={18} />
            <span className="text-sm">{t(key)}</span>
            {router.pathname === href && <ChevronRight size={14} className="ml-auto opacity-60" />}
          </Link>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t hairline">
        <button onClick={handleLogout} className="portal-nav-link w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all">
          <LogOut size={18} />
          <span className="text-sm">{t('nav.logout')}</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-ground flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-ground-secondary border-r hairline fixed h-full z-30 shadow-xl">
        <Sidebar />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <aside className="relative z-50 w-72 bg-ground-secondary border-r hairline shadow-2xl flex flex-col">
            <div className="absolute top-4 right-4">
              <button onClick={() => setSidebarOpen(false)} className="p-2 rounded-lg hover:bg-ground">
                <X size={18} />
              </button>
            </div>
            <Sidebar mobile />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        {/* Topbar */}
        <header className="sticky top-0 z-20 bg-ground/85 backdrop-blur-md border-b hairline px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg hover:bg-ground-secondary text-ink-secondary">
                <Menu size={20} />
              </button>
              <div>
                <h2 className="portal-heading text-lg text-ink">{title}</h2>
                <p className="portal-label text-muted hidden sm:block">
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 bg-ground-secondary/80 border hairline rounded-xl px-3 py-2 w-56">
                <Search size={15} className="text-muted" />
                <input type="text" placeholder={t('common.search') || 'Search...'} className="bg-transparent text-sm text-ink-secondary placeholder-muted outline-none w-full" />
              </div>
              
              {/* Language Selector */}
              <div className="relative">
                <button
                  onClick={() => setShowLanguageMenu(!showLanguageMenu)}
                  className="p-2.5 rounded-xl bg-ground-secondary/80 border hairline hover:border-amber/50 transition-all flex items-center gap-2"
                >
                  <Globe size={18} className="text-ink-secondary" />
                  <span className="text-sm font-medium text-ink-secondary hidden sm:block">{language.toUpperCase()}</span>
                </button>
                
                {showLanguageMenu && (
                  <div className="absolute right-0 top-full mt-2 bg-ground-secondary border hairline rounded-xl shadow-xl py-2 min-w-[140px] z-50">
                    <button
                      onClick={() => { setLanguage('en'); setShowLanguageMenu(false); }}
                      className={`w-full px-4 py-2 text-left text-sm hover:bg-ground transition-colors flex items-center gap-2 ${language === 'en' ? 'text-amber' : 'text-ink-secondary'}`}
                    >
                      <span>🇬🇧</span>
                      <span>English</span>
                    </button>
                    <button
                      onClick={() => { setLanguage('fr'); setShowLanguageMenu(false); }}
                      className={`w-full px-4 py-2 text-left text-sm hover:bg-ground transition-colors flex items-center gap-2 ${language === 'fr' ? 'text-amber' : 'text-ink-secondary'}`}
                    >
                      <span>🇫🇷</span>
                      <span>Français</span>
                    </button>
                    <button
                      onClick={() => { setLanguage('ar'); setShowLanguageMenu(false); }}
                      className={`w-full px-4 py-2 text-left text-sm hover:bg-ground transition-colors flex items-center gap-2 ${language === 'ar' ? 'text-amber' : 'text-ink-secondary'}`}
                    >
                      <span>🇸🇦</span>
                      <span>العربية</span>
                    </button>
                  </div>
                )}
              </div>
              
              <button className="relative p-2.5 rounded-xl bg-ground-secondary/80 border hairline hover:border-amber/50 transition-all">
                <Bell size={18} className="text-ink-secondary" />
                {notifications > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-amber rounded-full text-xs flex items-center justify-center font-bold text-ground shadow">
                    {notifications}
                  </span>
                )}
              </button>
              <div className="w-9 h-9 bg-teal rounded-full flex items-center justify-center text-ground font-bold text-sm cursor-pointer shadow-lg">
                {user.name?.[0]?.toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 animate-fade-in">
          {children}
        </main>

        {/* Footer */}
        <footer className="text-center py-4 portal-label border-t hairline text-muted">
          Smart Business Assistant © 2026 — AI Powered
        </footer>
      </div>

      {/* AI Chatbot */}
      <Chatbot />
    </div>
  );
}
