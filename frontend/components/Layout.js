import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { isAuthenticated, getUser, fetchCurrentUser, logout } from '../lib/auth';
import {
  LayoutDashboard, TrendingUp, Package, MessageSquare,
  Brain, AlertTriangle, Lightbulb, User, LogOut,
  Bell, Search, Menu, X, ChevronRight, Zap
} from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Tableau de Bord', icon: LayoutDashboard },
  { href: '/sales', label: 'Analyse des Ventes', icon: TrendingUp },
  { href: '/products', label: 'Produits & Stock', icon: Package },
  { href: '/reviews', label: 'Avis Clients', icon: MessageSquare },
  { href: '/predictions', label: 'Prédictions IA', icon: Brain },
  { href: '/anomalies', label: 'Anomalies', icon: AlertTriangle },
  { href: '/recommendations', label: 'Recommandations', icon: Lightbulb },
  { href: '/profile', label: 'Mon Profil', icon: User },
];

export default function Layout({ children, title = 'Smart Business Assistant' }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications] = useState(4);

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
    <div className="min-h-screen bg-dark-900 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
    </div>
  );

  const Sidebar = ({ mobile = false }) => (
    <div className={`flex flex-col h-full ${mobile ? 'w-full' : 'w-64'}`}>
      {/* Logo */}
      <div className="p-6 border-b border-slate-700/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-white text-sm leading-tight">Smart Business</h1>
            <p className="text-xs text-slate-400">Assistant IA</p>
          </div>
        </div>
      </div>

      {/* User Info */}
      <div className="px-4 py-4 border-b border-slate-700/50">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-700/30">
          <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow">
            {user.name?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">{user.name}</p>
            <p className="text-xs text-slate-400 truncate">{user.company || user.email}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 mb-3">Menu Principal</p>
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            onClick={() => mobile && setSidebarOpen(false)}
            className={`nav-link ${router.pathname === href ? 'active' : ''}`}
          >
            <Icon className="w-4.5 h-4.5 flex-shrink-0" size={18} />
            <span className="text-sm">{label}</span>
            {router.pathname === href && <ChevronRight size={14} className="ml-auto opacity-60" />}
          </Link>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-slate-700/50">
        <button onClick={handleLogout} className="nav-link w-full text-red-400 hover:text-red-300 hover:bg-red-500/10">
          <LogOut size={18} />
          <span className="text-sm">Déconnexion</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-dark-900 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-dark-800 border-r border-slate-700/50 fixed h-full z-30 shadow-xl">
        <Sidebar />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <aside className="relative z-50 w-72 bg-dark-800 border-r border-slate-700/50 shadow-2xl flex flex-col">
            <div className="absolute top-4 right-4">
              <button onClick={() => setSidebarOpen(false)} className="p-2 rounded-lg hover:bg-slate-700">
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
        <header className="sticky top-0 z-20 bg-dark-850/80 backdrop-blur-md border-b border-slate-700/50 px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg hover:bg-slate-700 text-slate-400">
                <Menu size={20} />
              </button>
              <div>
                <h2 className="text-lg font-bold text-white">{title}</h2>
                <p className="text-xs text-slate-400 hidden sm:block">
                  {new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 bg-dark-900/80 border border-slate-700 rounded-xl px-3 py-2 w-56">
                <Search size={15} className="text-slate-400" />
                <input type="text" placeholder="Rechercher..." className="bg-transparent text-sm text-slate-300 placeholder-slate-500 outline-none w-full" />
              </div>
              <button className="relative p-2.5 rounded-xl bg-dark-900/80 border border-slate-700 hover:border-primary-500/50 transition-all">
                <Bell size={18} className="text-slate-300" />
                {notifications > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center font-bold text-white shadow">
                    {notifications}
                  </span>
                )}
              </button>
              <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm cursor-pointer shadow-lg">
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
        <footer className="text-center py-4 text-xs text-slate-500 border-t border-slate-700/30">
          Smart Business Assistant © 2024 — Propulsé par l'IA
        </footer>
      </div>
    </div>
  );
}
