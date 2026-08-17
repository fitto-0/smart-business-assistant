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
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/sales', label: 'Sales Analytics', icon: TrendingUp },
  { href: '/products', label: 'Products & Stock', icon: Package },
  { href: '/reviews', label: 'Customer Reviews', icon: MessageSquare },
  { href: '/predictions', label: 'AI Predictions', icon: Brain },
  { href: '/anomalies', label: 'Anomalies', icon: AlertTriangle },
  { href: '/recommendations', label: 'Recommendations', icon: Lightbulb },
  { href: '/profile', label: 'Profile', icon: User },
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
        <p className="portal-label px-4 mb-3">Menu</p>
        {navItems.map(({ href, label, icon: Icon }) => (
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
            <span className="text-sm">{label}</span>
            {router.pathname === href && <ChevronRight size={14} className="ml-auto opacity-60" />}
          </Link>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t hairline">
        <button onClick={handleLogout} className="portal-nav-link w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all">
          <LogOut size={18} />
          <span className="text-sm">Logout</span>
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
                <input type="text" placeholder="Search..." className="bg-transparent text-sm text-ink-secondary placeholder-muted outline-none w-full" />
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
    </div>
  );
}
