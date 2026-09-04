import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { isAuthenticated, getUser, fetchCurrentUser, logout } from '../lib/auth';
import { useLanguage } from '../lib/LanguageContext';
import {
  LogOut,
  Bell, Search, Menu, X, ChevronRight, Zap, Globe, ShieldCheck, UserCog, Settings
} from 'lucide-react';
import Chatbot from './Chatbot';

const adminNavItems = [
  { href: '/admin', label: 'Admin dashboard', icon: ShieldCheck },
  { href: '/admin-users', label: 'User management', icon: UserCog },
  { href: '/admin-settings', label: 'System settings', icon: Settings },
];

export default function Layout({ children, title = 'Smart Business Assistant' }) {
  const router = useRouter();
  const { language, setLanguage, t } = useLanguage();
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotificationsMenu, setShowNotificationsMenu] = useState(false);

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

    const loadNotifications = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/auth/notifications?unreadOnly=true&limit=5`, {
          headers: {
            'Authorization': `Bearer ${document.cookie.replace(/(?:(?:^|.*;\s*)sba_token\s*=\s*([^;]*).*$)|^.*$/, "$1")}`,
          },
        });
        const data = await response.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.notifications?.length || 0);
      } catch (error) {
        console.error('Failed to load notifications:', error);
      }
    };

    loadUser();
    loadNotifications();
  }, [router]);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/auth/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${document.cookie.replace(/(?:(?:^|.*;\s*)sba_token\s*=\s*([^;]*).*$)|^.*$/, "$1")}`,
        },
      });
      if (response.ok) {
        setNotifications(notifications.filter(n => n.id !== notificationId));
        setUnreadCount(Math.max(0, unreadCount - 1));
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/auth/notifications/read-all`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${document.cookie.replace(/(?:(?:^|.*;\s*)sba_token\s*=\s*([^;]*).*$)|^.*$/, "$1")}`,
        },
      });
      if (response.ok) {
        setNotifications([]);
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
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
          <img src="/logo.png" alt="Smart Business Logo" className="w-10 h-10 rounded-xl shadow-lg object-contain" />
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
        {user.role === 'admin' && <>
          <p className="portal-label px-4 mb-3">Administration</p>
          {adminNavItems.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} onClick={() => mobile && setSidebarOpen(false)} className={`portal-nav-link flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium ${router.pathname === href ? 'bg-amber/10 text-amber' : 'text-ink-secondary hover:text-ink hover:bg-ground-secondary/50'}`}>
            <Icon size={18} className="flex-shrink-0" />
            <span className="text-sm">{label}</span>
            {router.pathname === href && <ChevronRight size={14} className="ml-auto opacity-60" />}
          </Link>
          ))}
        </>}
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
              
              <div className="relative">
                <button 
                  onClick={() => setShowNotificationsMenu(!showNotificationsMenu)}
                  className="relative p-2.5 rounded-xl bg-ground-secondary/80 border hairline hover:border-amber/50 transition-all"
                >
                  <Bell size={18} className="text-ink-secondary" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-amber rounded-full text-xs flex items-center justify-center font-bold text-ground shadow">
                      {unreadCount}
                    </span>
                  )}
                </button>
                
                {showNotificationsMenu && (
                  <div className="absolute right-0 top-full mt-2 bg-ground-secondary border hairline rounded-xl shadow-xl py-2 min-w-[320px] z-50 max-h-[400px] overflow-y-auto">
                    <div className="px-4 py-3 border-b hairline flex items-center justify-between">
                      <h3 className="font-semibold text-ink text-sm">Notifications</h3>
                      {unreadCount > 0 && (
                        <button onClick={handleMarkAllAsRead} className="text-xs text-amber hover:text-amber/80 transition-colors">
                          Mark all as read
                        </button>
                      )}
                    </div>
                    {notifications.length === 0 ? (
                      <div className="px-4 py-8 text-center">
                        <p className="portal-label text-muted text-sm">No notifications</p>
                      </div>
                    ) : (
                      <div className="divide-y hairline">
                        {notifications.map((notification) => (
                          <div 
                            key={notification.id} 
                            className="px-4 py-3 hover:bg-ground transition-colors cursor-pointer"
                            onClick={() => handleMarkAsRead(notification.id)}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`w-2 h-2 rounded-full mt-2 ${notification.read ? 'bg-muted' : 'bg-amber'}`} />
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-ink text-sm">{notification.title}</p>
                                <p className="portal-label text-muted text-xs mt-1 line-clamp-2">{notification.message}</p>
                                <p className="portal-label text-muted text-xs mt-2">
                                  {new Date(notification.created_at).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="relative">
                <button 
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="w-9 h-9 bg-teal rounded-full flex items-center justify-center text-ground font-bold text-sm cursor-pointer shadow-lg hover:bg-teal/80 transition-all"
                >
                  {user.avatar_url ? (
                    <img src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}${user.avatar_url}`} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    user.name?.[0]?.toUpperCase()
                  )}
                </button>
                
                {showProfileMenu && (
                  <div className="absolute right-0 top-full mt-2 bg-ground-secondary border hairline rounded-xl shadow-xl py-2 min-w-[200px] z-50">
                    <div className="px-4 py-3 border-b hairline">
                      <p className="font-semibold text-ink text-sm">{user.name}</p>
                      <p className="portal-label text-muted text-xs">{user.email}</p>
                    </div>
                    <Link href="/profile" onClick={() => setShowProfileMenu(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-ink-secondary hover:bg-ground transition-colors">
                      <User size={16} />
                      <span>{t('nav.profile')}</span>
                    </Link>
                    <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-ground hover:text-red-300 transition-colors">
                      <LogOut size={16} />
                      <span>{t('nav.logout')}</span>
                    </button>
                  </div>
                )}
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
