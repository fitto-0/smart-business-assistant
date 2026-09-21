import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import {
  isAuthenticated,
  getUser,
  fetchCurrentUser,
  logout,
} from "../lib/auth";
import { apiGet, apiPut } from "../lib/api";
import { useLanguage } from "../lib/LanguageContext";
import {
  LogOut,
  Bell,
  Search,
  Menu,
  X,
  Globe,
  ShieldCheck,
  Settings,
  LayoutDashboard,
  ShoppingCart,
  Package,
  BarChart3,
  Brain,
  Lightbulb,
  MessageSquare,
  User,
  Shield,
  Database,
  FileText,
  ShoppingBag,
} from "lucide-react";
import Chatbot from "./Chatbot";

const API_ORIGIN = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"
).replace(/\/api\/?$/, "");

const getAssetUrl = (url) => {
  if (!url) return "";
  return url.startsWith("http") ? url : `${API_ORIGIN}${url}`;
};

const userNavItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/sales", label: "Sales", icon: ShoppingCart },
  { href: "/products", label: "Products", icon: Package },
  { href: "/anomalies", label: "Anomalies", icon: BarChart3 },
  { href: "/predictions", label: "Predictions", icon: Brain },
  { href: "/recommendations", label: "Recommendations", icon: Lightbulb },
  { href: "/reviews", label: "Reviews", icon: MessageSquare },
  { href: "/security", label: "Security", icon: Shield },
  { href: "/backup", label: "Backup", icon: Database },
  { href: "/reports", label: "Reports", icon: FileText },
  { href: "/profile", label: "Profile", icon: User },
];

const storefrontNavItems = [
  { href: "/dashboard/storefront", label: "Customize Store", icon: ShoppingBag },
];

const adminNavItems = [
  { href: "/admin", label: "Admin dashboard", icon: ShieldCheck },
  { href: "/admin-users", label: "User management", icon: User },
  { href: "/admin-settings", label: "System settings", icon: Settings },
  { href: "/profile", label: "Profile", icon: User },
];

export default function Layout({
  children,
  title = "Smart Business Assistant",
}) {
  const router = useRouter();
  const { language, setLanguage, t } = useLanguage();
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotificationsMenu, setShowNotificationsMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const ROUTE_META = {
    "/dashboard": { index: "01", fallback: "Dashboard" },
    "/sales": { index: "02", fallback: "Sales" },
    "/products": { index: "03", fallback: "Products" },
    "/anomalies": { index: "04", fallback: "Anomalies" },
    "/predictions": { index: "05", fallback: "Predictions" },
    "/recommendations": { index: "06", fallback: "Recommendations" },
    "/reviews": { index: "07", fallback: "Reviews" },
    "/security": { index: "08", fallback: "Security" },
    "/backup": { index: "09", fallback: "Backup" },
    "/reports": { index: "10", fallback: "Reports" },
    "/profile": { index: "11", fallback: "Profile" },
    "/dashboard/storefront": { index: "12", fallback: "Storefront" },
    "/admin": { index: "A1", fallback: "Admin" },
    "/admin-users": { index: "A2", fallback: "Users" },
    "/admin-settings": { index: "A3", fallback: "Settings" },
  };
  const routeMeta = (() => {
    const path = router.pathname || "";
    if (ROUTE_META[path]) return ROUTE_META[path];
    const base = `/${path.split("/").filter(Boolean)[0] || ""}`;
    if (ROUTE_META[base]) return ROUTE_META[base];
    return { index: "00", fallback: title };
  })();
  const routeIndex = routeMeta.index;
  const pageLabel = title && title !== "Smart Business Assistant" ? title : routeMeta.fallback;

  useEffect(() => {
    const loadUser = async () => {
      if (!isAuthenticated()) {
        router.push("/login");
        return;
      }

      try {
        const currentUser = await fetchCurrentUser();
        setUser(currentUser);
      } catch (error) {
        logout();
        router.push("/login");
      }
    };

    const loadNotifications = async () => {
      try {
        const data = await apiGet("/auth/notifications", {
          unreadOnly: true,
          limit: 5,
        });
        setNotifications(data.notifications || []);
        setUnreadCount(data.notifications?.length || 0);
      } catch (error) {
        console.error("Failed to load notifications:", error);
      }
    };

    loadUser();
    loadNotifications();
  }, [router]);

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await apiPut(`/auth/notifications/${notificationId}/read`);
      setNotifications(notifications.filter((n) => n.id !== notificationId));
      setUnreadCount(Math.max(0, unreadCount - 1));
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await apiPut("/auth/notifications/read-all");
      setNotifications([]);
      setUnreadCount(0);
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    }
  };

  if (!user)
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <div className="animate-spin rounded-xs h-8 w-8 border-t border-b border-ember-500"></div>
      </div>
    );

  const ledgerLink = (active) =>
    `relative flex items-center gap-3 px-3 py-2 rounded-xs text-[13.5px] transition-colors duration-200 border-s-2 ${
      active
        ? "border-s-ember-500 bg-surface text-ink font-medium"
        : "border-s-transparent text-ink-3 hover:text-ink hover:bg-surface"
    }`;
  const ledgerIcon = (active) =>
    `flex-shrink-0 ${active ? "text-ember-500" : "text-ink-3"}`;

  const Sidebar = ({ mobile = false }) => (
    <div className={`flex flex-col h-full ${mobile ? "w-full" : "w-60"}`}>
      {/* wordmark lockup */}
      <div className="px-5 pt-5 pb-4 border-b border-line">
        <Link
          href="/dashboard"
          onClick={() => mobile && setSidebarOpen(false)}
          className="flex items-center gap-2.5 group"
        >
          <span
            aria-hidden="true"
            className="w-2 h-2 shrink-0 bg-ember-500 group-hover:bg-ember-300 transition-colors"
          />
          <span className="font-display font-medium text-[15px] tracking-[-0.02em] text-ink leading-none">
            Smart Business
          </span>
        </Link>
        <p className="micro mt-2.5">
          {language === "ar"
            ? "مساعد الأعمال"
            : language === "fr"
              ? "Alger · Ops"
              : "Algiers · Ops"}
        </p>
      </div>

      {/* square monogram ledger row */}
      <div className="px-5 py-4 border-b border-line">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 shrink-0 rounded-xs bg-surface-2 border border-line flex items-center justify-center overflow-hidden">
            {user.avatar_url ? (
              <img
                src={getAssetUrl(user.avatar_url)}
                alt=""
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            ) : (
              <span className="font-mono text-[11px] text-ink-2">
                {user.name?.[0]?.toUpperCase() || "—"}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-medium text-ink truncate leading-tight">
              {user.name || "—"}
            </p>
            <p className="micro truncate mt-1 normal-case tracking-normal">
              {user.company || user.email}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation — square rows, ember start-bar, no pills, no chevrons */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {user.role !== "admin" && (
          <>
            <p className="micro px-3 mb-2">Workspace</p>
            {userNavItems.map(({ href, label, icon: Icon }) => {
              const active = router.pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => mobile && setSidebarOpen(false)}
                  aria-current={active ? "page" : undefined}
                  className={ledgerLink(active)}
                >
                  <Icon size={15} strokeWidth={active ? 2 : 1.75} className={ledgerIcon(active)} />
                  <span className="truncate">{label}</span>
                  {href === "/anomalies" && unreadCount > 0 && (
                    <span className="ms-auto font-mono text-[10px] tabular-nums text-clay border border-clay/40 rounded-xs px-1.5 py-0.5 leading-none">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </>
        )}
        {user.role !== "admin" && (
          <>
            <p className="micro px-3 mt-5 mb-2">Store</p>
            {storefrontNavItems.map(({ href, label, icon: Icon }) => {
              const active = router.pathname.startsWith("/dashboard/storefront");
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => mobile && setSidebarOpen(false)}
                  aria-current={active ? "page" : undefined}
                  className={ledgerLink(active)}
                >
                  <Icon size={15} strokeWidth={active ? 2 : 1.75} className={ledgerIcon(active)} />
                  <span className="truncate">{label}</span>
                </Link>
              );
            })}
          </>
        )}
        {user.role === "admin" && (
          <>
            <p className="micro px-3 mb-2">Administration</p>
            {adminNavItems.map(({ href, label, icon: Icon }) => {
              const active = router.pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => mobile && setSidebarOpen(false)}
                  aria-current={active ? "page" : undefined}
                  className={ledgerLink(active)}
                >
                  <Icon size={15} strokeWidth={active ? 2 : 1.75} className={ledgerIcon(active)} />
                  <span className="truncate">{label}</span>
                </Link>
              );
            })}
          </>
        )}

        {/* system group */}
        <div className="pt-4 mt-4 border-t border-line">
          <p className="micro px-3 mb-2">{t("nav.system") || "System"}</p>
          <Link
            href="/docs"
            onClick={() => mobile && setSidebarOpen(false)}
            className="flex items-center gap-3 px-3 py-2 rounded-xs text-[13.5px] text-ink-3 hover:text-ink hover:bg-surface transition-colors duration-200"
          >
            <FileText size={15} strokeWidth={1.75} className="flex-shrink-0 text-ink-3" />
            <span className="truncate">{t("nav.docs")}</span>
          </Link>
          <Link
            href="/contact"
            onClick={() => mobile && setSidebarOpen(false)}
            className="flex items-center gap-3 px-3 py-2 rounded-xs text-[13.5px] text-ink-3 hover:text-ink hover:bg-surface transition-colors duration-200"
          >
            <MessageSquare size={15} strokeWidth={1.75} className="flex-shrink-0 text-ink-3" />
            <span className="truncate">{t("nav.contact")}</span>
          </Link>
        </div>
      </nav>

      {/* Logout — quiet ledger row */}
      <div className="px-3 py-3 border-t border-line">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xs text-[13.5px] text-ink-3 hover:text-clay hover:bg-surface transition-colors duration-200"
        >
          <LogOut size={15} strokeWidth={1.75} />
          <span className="truncate">{t("nav.logout")}</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-canvas flex text-ink">
      {/* Desktop Sidebar — hairline-divided ledger rail */}
      <aside className="hidden lg:flex flex-col w-60 bg-canvas border-e border-line fixed h-full z-30">
        <Sidebar />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-[8px]"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="relative z-50 w-72 bg-canvas border-e border-line flex flex-col">
            <div className="absolute top-4 end-4">
              <button
                onClick={() => setSidebarOpen(false)}
                aria-label="Close navigation"
                className="w-8 h-8 rounded-xs hover:bg-surface flex items-center justify-center text-ink-2 hover:text-ink transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            <Sidebar mobile />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 lg:ms-60 flex flex-col min-h-screen min-w-0">
        {/* Topbar — h-14 hairline rule, route index, square icon cluster */}
        <header className="sticky top-0 z-20 bg-canvas/90 backdrop-blur-[14px] border-b border-line px-4 sm:px-6 h-14 flex items-center">
          <div className="flex items-center gap-2 w-full">
            <div className="flex items-center gap-2 min-w-0">
              <button
                onClick={() => setSidebarOpen(true)}
                aria-label="Open navigation"
                className="lg:hidden w-8 h-8 -ms-1 rounded-xs flex items-center justify-center text-ink-2 hover:text-ink hover:bg-surface transition-colors"
              >
                <Menu size={17} />
              </button>
              {/* route index annotation */}
              <div className="hidden sm:flex items-center gap-3 min-w-0 me-1">
                <span className="font-mono text-micro uppercase text-ember-500 tabular-nums">
                  {routeIndex}
                </span>
                <span aria-hidden="true" className="h-px w-6 bg-line shrink-0" />
                <span className="micro truncate">{pageLabel}</span>
              </div>
              <div className="sm:hidden min-w-0">
                <p className="text-[13px] font-medium text-ink truncate leading-tight">{pageLabel}</p>
              </div>
            </div>
            <div className="flex-1" />
            <div className="flex items-center gap-0.5">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const q = searchQuery.trim();
                  if (q) {
                    router.push(`/products?search=${encodeURIComponent(q)}`);
                    setSearchQuery("");
                  }
                }}
                role="search"
                className="hidden sm:flex items-center"
              >
                <div className="relative">
                  <Search
                    size={14}
                    className="absolute start-2.5 top-1/2 -translate-y-1/2 text-ink-3 pointer-events-none"
                  />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={`${t("common.search") || "Search"}…`}
                    aria-label={t("common.search") || "Search"}
                    className="w-40 focus:w-60 bg-transparent border border-transparent hover:border-line focus:border-ember-500/70 rounded-xs ps-8 pe-3 py-1.5 text-[13px] text-ink placeholder:text-ink-3 focus:outline-none transition-[width,border-color] duration-200"
                  />
                </div>
              </form>

              {/* Language — mono code, no emoji flags */}
              <div className="relative">
                <button
                  onClick={() => setShowLanguageMenu(!showLanguageMenu)}
                  aria-label="Language"
                  aria-expanded={showLanguageMenu}
                  className="h-8 px-2 rounded-xs flex items-center gap-1.5 text-ink-3 hover:text-ink hover:bg-surface transition-colors"
                >
                  <Globe size={15} strokeWidth={1.75} />
                  <span className="font-mono text-[10px] uppercase tracking-micro hidden sm:block">
                    {language}
                  </span>
                </button>

                {showLanguageMenu && (
                  <div className="absolute end-0 top-full mt-2 bg-surface border border-line rounded-xs py-1 min-w-[148px] z-50">
                    {[
                      { code: "en", label: "EN — English" },
                      { code: "fr", label: "FR — Français" },
                      { code: "ar", label: "AR — العربية" },
                    ].map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => {
                          setLanguage(lang.code);
                          setShowLanguageMenu(false);
                        }}
                        className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-start transition-colors ${
                          language === lang.code
                            ? "bg-canvas text-ink font-medium"
                            : "text-ink-3 hover:text-ink hover:bg-canvas"
                        }`}
                      >
                        <span className="font-mono text-[11px] tracking-label">{lang.label}</span>
                        {language === lang.code && (
                          <span aria-hidden="true" className="w-1 h-1 shrink-0 bg-ember-500" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="relative">
                <button
                  onClick={() =>
                    setShowNotificationsMenu(!showNotificationsMenu)
                  }
                  aria-label="Notifications"
                  aria-expanded={showNotificationsMenu}
                  className="relative w-8 h-8 rounded-xs flex items-center justify-center text-ink-3 hover:text-ink hover:bg-surface transition-colors"
                >
                  <Bell size={16} strokeWidth={1.75} />
                  {unreadCount > 0 && (
                    <span aria-hidden="true" className="absolute top-1.5 end-1.5 w-[5px] h-[5px] bg-clay" />
                  )}
                </button>

                {showNotificationsMenu && (
                  <div className="absolute end-0 top-full mt-2 bg-surface border border-line rounded-xs py-2 min-w-[320px] max-w-[86vw] z-50 max-h-[400px] overflow-y-auto">
                    <div className="px-4 py-2 border-b border-line flex items-center justify-between gap-3">
                      <h3 className="micro-2">
                        Notifications
                        {unreadCount > 0 && (
                          <span className="text-clay"> — {unreadCount}</span>
                        )}
                      </h3>
                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllAsRead}
                          className="font-mono text-micro uppercase text-ink-3 hover:text-ink transition-colors"
                        >
                          Mark all read
                        </button>
                      )}
                    </div>
                    {notifications.length === 0 ? (
                      <div className="px-4 py-8 text-center">
                        <p className="micro">
                          No notifications
                        </p>
                      </div>
                    ) : (
                      <div className="divide-y divide-line">
                        {notifications.map((notification) => (
                          <div
                            key={notification.id}
                            className="px-4 py-3 hover:bg-canvas transition-colors cursor-pointer"
                            onClick={() => handleMarkAsRead(notification.id)}
                          >
                            <div className="flex items-start gap-3">
                              <div
                                aria-hidden="true"
                                className={`w-[5px] h-[5px] mt-1.5 shrink-0 ${notification.read ? "bg-line" : "bg-ember-500"}`}
                              />
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-ink text-[13px] leading-snug">
                                  {notification.title}
                                </p>
                                <p className="text-ink-3 text-xs mt-1 line-clamp-2 leading-relaxed">
                                  {notification.message}
                                </p>
                                <p className="font-mono text-micro uppercase text-ink-3 mt-2">
                                  {new Date(
                                    notification.created_at,
                                  ).toLocaleDateString()}
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
              {/* profile — square monogram */}
              <div className="relative">
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  aria-label="Account"
                  aria-expanded={showProfileMenu}
                  className="w-8 h-8 rounded-xs bg-surface-2 border border-line hover:border-ember-500/60 flex items-center justify-center overflow-hidden transition-colors"
                >
                  {user.avatar_url ? (
                    <img
                      src={getAssetUrl(user.avatar_url)}
                      alt=""
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  ) : (
                    <span className="font-mono text-[11px] text-ink-2">
                      {user.name?.[0]?.toUpperCase() || "—"}
                    </span>
                  )}
                </button>

                {showProfileMenu && (
                  <div className="absolute end-0 top-full mt-2 bg-surface border border-line rounded-xs py-2 min-w-[200px] z-50">
                    <div className="px-4 py-2.5 border-b border-line">
                      <p className="font-medium text-ink text-[13px] truncate">
                        {user.name}
                      </p>
                      <p className="micro truncate mt-1 normal-case tracking-normal">
                        {user.email}
                      </p>
                    </div>
                    <Link
                      href="/profile"
                      onClick={() => setShowProfileMenu(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-[13px] text-ink-2 hover:text-ink hover:bg-canvas transition-colors"
                    >
                      <User size={15} strokeWidth={1.75} />
                      <span>{t("nav.profile")}</span>
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] text-ink-3 hover:text-clay hover:bg-canvas transition-colors"
                    >
                      <LogOut size={15} strokeWidth={1.75} />
                      <span>{t("nav.logout")}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content — 1440px cap, asymmetric gutters */}
        <main className="flex-1 px-4 sm:px-8 py-6 sm:py-8 max-w-[1440px] w-full mx-auto animate-fade-in">{children}</main>

        {/* Footer — hairline + mono annotations */}
        <footer className="px-4 sm:px-8 pb-6">
          <div aria-hidden="true" className="rule mb-4" />
          <div className="max-w-[1440px] mx-auto flex flex-wrap items-center justify-between gap-2">
            <p className="micro">
              Smart Business Assistant — © 2026
            </p>
            <p className="micro">
              {language === "ar" ? "Algiers — DZ" : language === "fr" ? "Alger — DZ" : "Algiers — DZ"} · {new Date().getFullYear()}
            </p>
          </div>
        </footer>
      </div>

      {/* AI Chatbot */}
      <Chatbot onOpenChange={Request error: {"error":{"message":"Insufficient Balance","type":"unknown_error","param":null,"code":"invalid_request_error"}}setChatOpen} />
    </div>
  );
}
