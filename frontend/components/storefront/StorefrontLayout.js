import { useState, useEffect } from "react";
import Link from "next/link";
import Head from "next/head";
import {
  ShoppingBag,
  Menu,
  X,
  Search,
  Heart,
  Facebook,
  Instagram,
  Twitter,
  Mail,
  Phone,
  MapPin,
} from "lucide-react";
import { useRouter } from "next/router";
import { AnimatePresence, motion } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";
import axios from "axios";
import { assetUrl } from "../../lib/assetUrl";
import { useCart, useWishlist } from "../../lib/cart";
import { money } from "../../lib/money";

const spring = { type: "spring", stiffness: 380, damping: 34 };

export default function StorefrontLayout({
  children,
  storeSettings,
  userId,
  pageTitle,
}) {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [cartOpen, setCartOpen] = useState(false);
  const [newsletterState, setNewsletterState] = useState("idle");
  const [newsletterEmail, setNewsletterEmail] = useState("");

  const { items: cartItems, count: cartCount, update: updateCartQuantity, subtotal } =
    useCart(userId);
  const wishlist = useWishlist(userId);

  const primaryColor = storeSettings?.primary_color || "#3B82F6";
  const secondaryColor = storeSettings?.secondary_color || "#1E40AF";
  const accentColor = storeSettings?.accent_color || "#F59E0B";
  const backgroundColor = storeSettings?.background_color || "#FFFFFF";
  const backgroundType = storeSettings?.background_type || "color";
  const backgroundGradient = storeSettings?.background_gradient;
  const backgroundImageUrl = assetUrl(storeSettings?.background_image_url);
  const textColor = storeSettings?.text_color || "#1F2937";
  const textSecondaryColor = storeSettings?.text_secondary_color || "#6B7280";
  const borderColor = storeSettings?.border_color || "#E5E7EB";
  const headerBackgroundColor =
    storeSettings?.header_background_color || backgroundColor;
  const footerBackgroundColor =
    storeSettings?.footer_background_color || secondaryColor;
  const cardBackgroundColor = storeSettings?.card_background_color || "#FFFFFF";
  const cardTextColor = storeSettings?.card_text_color || textColor;
  const buttonTextColor = storeSettings?.button_text_color || "#FFFFFF";
  const content = storeSettings?.content_overrides || {};
  const fontFamily =
    storeSettings?.font_family || "Inter, system-ui, sans-serif";
  const headingFontFamily =
    storeSettings?.heading_font_family || "Inter, system-ui, sans-serif";
  const borderRadius = storeSettings?.border_radius || "0.75rem";

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

  // Close overlays on navigation
  useEffect(() => {
    const close = () => {
      setMobileMenuOpen(false);
      setSearchOpen(false);
      setCartOpen(false);
    };
    router.events.on("routeChangeStart", close);
    return () => router.events.off("routeChangeStart", close);
  }, [router.events]);

  // Background values are always applied with longhand properties (`background`
  // shorthand next to `backgroundColor` makes React wipe the color again and
  // triggers a "conflicting property" warning during rerenders).
  const hasBackgroundGradient =
    backgroundType === "gradient" && Boolean(backgroundGradient);
  const hasBackgroundImage =
    backgroundType === "image" && Boolean(backgroundImageUrl);
  const resolvedBackgroundImage = hasBackgroundGradient
    ? backgroundGradient
    : hasBackgroundImage
      ? `url(${backgroundImageUrl})`
      : undefined;
  const backgroundStyles = {
    backgroundColor:
      backgroundType === "color" ? backgroundColor : "transparent",
    backgroundImage: resolvedBackgroundImage,
    backgroundSize: hasBackgroundImage ? "cover" : undefined,
    backgroundPosition: hasBackgroundImage ? "center" : undefined,
    backgroundAttachment: hasBackgroundImage ? "fixed" : undefined,
  };

  // Apply theme styles
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--store-primary", primaryColor);
    root.style.setProperty("--store-secondary", secondaryColor);
    root.style.setProperty("--store-accent", accentColor);
    root.style.setProperty("--store-background", backgroundColor);
    root.style.setProperty("--store-text", textColor);
    root.style.setProperty("--store-text-secondary", textSecondaryColor);
    root.style.setProperty("--store-border", borderColor);
    root.style.setProperty("--store-font", fontFamily);
    root.style.setProperty("--store-heading-font", headingFontFamily);
    root.style.setProperty("--store-radius", borderRadius);

    document.body.style.fontFamily = fontFamily;
    document.body.style.color = textColor;
    document.body.style.backgroundColor =
      backgroundType === "color" ? backgroundColor : "transparent";
    document.body.style.backgroundImage =
      backgroundType === "gradient" && backgroundGradient
        ? backgroundGradient
        : backgroundType === "image" && backgroundImageUrl
          ? `url(${backgroundImageUrl})`
          : "none";
    document.body.style.backgroundSize =
      backgroundType === "image" && backgroundImageUrl ? "cover" : "";
    document.body.style.backgroundPosition =
      backgroundType === "image" && backgroundImageUrl ? "center" : "";
    document.body.style.backgroundAttachment =
      backgroundType === "image" && backgroundImageUrl ? "fixed" : "";
  }, [
    primaryColor,
    secondaryColor,
    accentColor,
    backgroundColor,
    backgroundType,
    backgroundGradient,
    backgroundImageUrl,
    textColor,
    textSecondaryColor,
    borderColor,
    fontFamily,
    headingFontFamily,
    borderRadius,
  ]);

  // router.pathname is a route pattern (/storefront/[userId]/products), so the
  // active state is computed from asPath instead.
  const currentPath = (router.asPath || "").split("?")[0];
  const isActive = (href) =>
    currentPath === href || currentPath.startsWith(`${href}/`);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(
        `/storefront/${userId}/products?search=${encodeURIComponent(searchQuery.trim())}`,
      );
      setSearchOpen(false);
      setSearchQuery("");
    }
  };

  const subscribeNewsletter = async (e) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) return;
    setNewsletterState("loading");
    try {
      await axios.post(`${API_URL}/storefront/${userId}/newsletter`, {
        email: newsletterEmail.trim(),
      });
      setNewsletterState("done");
      setNewsletterEmail("");
    } catch (err) {
      setNewsletterState("error");
      toast.error(err.response?.data?.error || "Subscription failed");
    }
  };

  const navLinks = [
    {
      href: `/storefront/${userId}`,
      label: content.nav_home || "Home",
      show: storeSettings?.show_home_page !== false,
    },
    {
      href: `/storefront/${userId}/products`,
      label: content.nav_products || "Products",
      show: storeSettings?.show_products_page !== false,
    },
    {
      href: `/storefront/${userId}/categories`,
      label: content.nav_categories || "Categories",
      show: storeSettings?.show_categories_page !== false,
    },
    {
      href: `/storefront/${userId}/about`,
      label: content.nav_about || "About",
      show: storeSettings?.show_about_page !== false,
    },
    {
      href: `/storefront/${userId}/contact`,
      label: content.nav_contact || "Contact",
      show: storeSettings?.show_contact_page !== false,
    },
  ].filter((link) => link.show);

  const iconButtonStyle = { color: textSecondaryColor };

  return (
    <>
      <Head>
        <title>
          {pageTitle
            ? `${pageTitle} - ${storeSettings?.store_name || "Store"}`
            : storeSettings?.store_name || "Store"}
        </title>
        <meta
          name="description"
          content={
            storeSettings?.seo_description ||
            storeSettings?.description ||
            "Welcome to our store"
          }
        />
        <meta name="theme-color" content={primaryColor} />
        {storeSettings?.favicon_url && (
          <link rel="icon" href={assetUrl(storeSettings.favicon_url)} />
        )}
        {storeSettings?.og_image_url && (
          <>
            <meta
              property="og:image"
              content={assetUrl(storeSettings.og_image_url)}
            />
            <meta
              property="og:title"
              content={
                storeSettings?.seo_title || storeSettings?.store_name || "Store"
              }
            />
            <meta
              property="og:description"
              content={
                storeSettings?.seo_description ||
                storeSettings?.description ||
                "Welcome to our store"
              }
            />
          </>
        )}
        <style>{`
          :root {
            --store-primary: ${primaryColor};
            --store-secondary: ${secondaryColor};
            --store-accent: ${accentColor};
            --store-background: ${backgroundColor};
            --store-text: ${textColor};
            --store-text-secondary: ${textSecondaryColor};
            --store-border: ${borderColor};
            --store-font: ${fontFamily};
            --store-heading-font: ${headingFontFamily};
            --store-radius: ${borderRadius};
          }
          * { font-family: var(--store-font) !important; }
          h1, h2, h3, h4, h5, h6 { font-family: var(--store-heading-font) !important; }
          .store-container { max-width: 80rem; margin: 0 auto; padding: 0 1.5rem; }
          .btn-primary { background: var(--store-primary); color: ${buttonTextColor}; padding: 0.75rem 1.5rem; border-radius: var(--store-radius); font-weight: 600; transition: all 0.2s; display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem; }
          .btn-primary:hover { opacity: 0.9; transform: translateY(-1px); }
          .btn-primary:disabled { opacity: 0.55; cursor: not-allowed; transform: none; }
          .btn-secondary { background: var(--store-secondary); color: ${buttonTextColor}; padding: 0.75rem 1.5rem; border-radius: var(--store-radius); font-weight: 600; transition: all 0.2s; display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem; }
          .btn-secondary:hover { opacity: 0.9; }
          .btn-accent { background: var(--store-accent); color: ${buttonTextColor}; padding: 0.75rem 1.5rem; border-radius: var(--store-radius); font-weight: 600; transition: all 0.2s; }
          .btn-accent:hover { opacity: 0.9; }
          .btn-outline { border: 2px solid var(--store-primary); color: var(--store-primary); padding: 0.75rem 1.5rem; border-radius: var(--store-radius); font-weight: 600; transition: all 0.2s; background: transparent; display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem; }
          .btn-outline:hover { background: var(--store-primary); color: white; }
          .input-field { width: 100%; padding: 0.75rem 1rem; border: 1px solid var(--store-border); border-radius: var(--store-radius); background: white; color: var(--store-text); transition: all 0.2s; }
          .input-field:focus { outline: none; border-color: var(--store-primary); box-shadow: 0 0 0 3px ${primaryColor + "33"}; }
          .card { background: ${cardBackgroundColor}; color: ${cardTextColor}; border: 1px solid var(--store-border); border-radius: var(--store-radius); transition: box-shadow 0.3s, transform 0.3s; }
          .card:hover { box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1); }
          .section-title { font-size: 1.875rem; font-weight: 700; color: var(--store-text); margin-bottom: 0.5rem; }
          .section-subtitle { color: var(--store-text-secondary); font-size: 1.125rem; }
          .badge { display: inline-block; padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; }
          .badge-primary { background: var(--store-primary); color: white; }
          .badge-accent { background: var(--store-accent); color: white; }
        `}</style>
      </Head>

      <Toaster
        position="top-center"
        toastOptions={{
          duration: 2400,
          style: {
            background: textColor,
            color: "#FFFFFF",
            borderRadius: borderRadius,
            fontSize: "14px",
          },
        }}
      />

      <div className="min-h-screen flex flex-col" style={backgroundStyles}>
        {/* Header */}
        <header
          className="sticky top-0 z-50"
          style={{
            backgroundColor: headerBackgroundColor,
            backdropFilter: "blur(8px)",
            borderBottom: `1px solid ${borderColor}`,
          }}
        >
          {/* Top Bar */}
          {(storeSettings?.contact_email || storeSettings?.contact_phone) && (
            <div
              className="py-2 text-[13.5px] font-medium antialiased tracking-[0.01em]"
              style={{ backgroundColor: secondaryColor, color: "white" }}
            >
              <div className="store-container flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-4">
                  {storeSettings?.contact_email && (
                    <a
                      href={`mailto:${storeSettings.contact_email}`}
                      className="flex items-center gap-1 hover:opacity-80 transition-opacity"
                    >
                      <Mail size={12} /> {storeSettings.contact_email}
                    </a>
                  )}
                  {storeSettings?.contact_phone && (
                    <a
                      href={`tel:${storeSettings.contact_phone}`}
                      className="flex items-center gap-1 hover:opacity-80 transition-opacity"
                    >
                      <Phone size={12} /> {storeSettings.contact_phone}
                    </a>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  {storeSettings?.facebook_url && (
                    <a
                      href={storeSettings.facebook_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:opacity-80 transition-opacity"
                    >
                      <Facebook size={16} />
                    </a>
                  )}
                  {storeSettings?.instagram_url && (
                    <a
                      href={storeSettings.instagram_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:opacity-80 transition-opacity"
                    >
                      <Instagram size={16} />
                    </a>
                  )}
                  {storeSettings?.twitter_url && (
                    <a
                      href={storeSettings.twitter_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:opacity-80 transition-opacity"
                    >
                      <Twitter size={16} />
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Main Header */}
          <div className="store-container">
            <div className="flex items-center justify-between h-16 md:h-20 gap-4">
              {/* Logo */}
              <Link
                href={`/storefront/${userId}`}
                className="flex items-center gap-3 flex-shrink-0"
              >
                {storeSettings?.logo_url ? (
                  <img
                    src={assetUrl(storeSettings.logo_url)}
                    alt={storeSettings.store_name || "Logo"}
                    className="h-10 w-auto"
                  />
                ) : (
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
                    style={{ backgroundColor: primaryColor }}
                  >
                    <ShoppingBag size={20} />
                  </div>
                )}
                <span
                  className="hidden sm:block font-extrabold text-[22px] antialiased tracking-[-0.01em]"
                  style={{ color: textColor, fontFamily: headingFontFamily }}
                >
                  {storeSettings?.store_name || "Store"}
                </span>
              </Link>

              {/* Desktop Navigation */}
              <nav className="hidden md:flex items-center gap-8">
                {navLinks.map((link) => {
                  const active = isActive(link.href);
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="text-[16px] font-semibold antialiased tracking-[0.01em] transition-colors relative py-2"
                      style={{
                        color: active ? primaryColor : textSecondaryColor,
                      }}
                    >
                      <span
                        className="transition-colors hover:opacity-80"
                        onMouseEnter={(e) => {
                          if (!active) e.currentTarget.style.color = primaryColor;
                        }}
                        onMouseLeave={(e) => {
                          if (!active)
                            e.currentTarget.style.color = textSecondaryColor;
                        }}
                      >
                        {link.label}
                      </span>
                      {active && (
                        <motion.span
                          layoutId="nav-underline"
                          className="absolute -bottom-0.5 left-0 right-0 h-0.5 rounded-full"
                          style={{ backgroundColor: primaryColor }}
                        />
                      )}
                    </Link>
                  );
                })}
              </nav>

              {/* Actions */}
              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  onClick={() => setSearchOpen(!searchOpen)}
                  aria-label="Search"
                  className="p-2 rounded-lg hover:bg-black/5 transition-colors"
                  style={iconButtonStyle}
                >
                  <Search size={20} />
                </button>

                <Link
                  href={`/storefront/${userId}/wishlist`}
                  aria-label="Wishlist"
                  className="p-2 rounded-lg hover:bg-black/5 transition-colors relative"
                  style={iconButtonStyle}
                >
                  <Heart size={20} />
                  {wishlist.count > 0 && (
                    <span
                      className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-[10px] flex items-center justify-center font-bold text-white"
                      style={{ backgroundColor: accentColor }}
                    >
                      {wishlist.count > 99 ? "99+" : wishlist.count}
                    </span>
                  )}
                </Link>

                <button
                  onClick={() => setCartOpen(true)}
                  aria-label="Open cart"
                  className="relative p-2 rounded-lg hover:bg-black/5 transition-colors"
                  style={iconButtonStyle}
                >
                  <ShoppingBag size={20} />
                  {cartCount > 0 && (
                    <motion.span
                      key={cartCount}
                      initial={{ scale: 0.5 }}
                      animate={{ scale: 1 }}
                      transition={spring}
                      className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-[10px] flex items-center justify-center font-bold text-white"
                      style={{ backgroundColor: accentColor }}
                    >
                      {cartCount > 99 ? "99+" : cartCount}
                    </motion.span>
                  )}
                </button>

                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  aria-label="Menu"
                  className="md:hidden p-2 rounded-lg hover:bg-black/5 transition-colors"
                  style={{ color: textColor }}
                >
                  {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <AnimatePresence>
            {searchOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.22 }}
                className="store-container overflow-hidden"
              >
                <form onSubmit={handleSearch} className="flex gap-2 py-4">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search products..."
                    className="input-field flex-1"
                    autoFocus
                  />
                  <button type="submit" className="btn-primary px-5">
                    Search
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </header>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="md:hidden fixed inset-0 z-40 bg-white flex flex-col"
            >
              <div
                className="p-4 border-b flex items-center justify-between"
                style={{ borderColor: borderColor }}
              >
                <span
                  className="font-bold text-lg"
                  style={{ color: textColor, fontFamily: headingFontFamily }}
                >
                  {storeSettings?.store_name || "Store"}
                </span>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  aria-label="Close menu"
                  style={{ color: textSecondaryColor }}
                >
                  <X size={24} />
                </button>
              </div>
              <nav className="p-4 space-y-2 flex-1 overflow-y-auto">
                {navLinks.map((link, i) => {
                  const active = isActive(link.href);
                  return (
                    <motion.div
                      key={link.href}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.04 * i }}
                    >
                      <Link
                        href={link.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className="block py-3 px-4 rounded-lg text-[16px] font-semibold antialiased transition-colors"
                        style={{
                          backgroundColor: active ? primaryColor : "transparent",
                          color: active ? "white" : textColor,
                        }}
                      >
                        {link.label}
                      </Link>
                    </motion.div>
                  );
                })}

                {/* Quick categories */}
                {storeSettings?.show_categories_page !== false && (
                  <div
                    className="pt-4 border-t"
                    style={{ borderColor: borderColor }}
                  >
                    <h3
                      className="px-4 pb-2 font-semibold text-[14px] uppercase tracking-wide antialiased"
                      style={{ color: textSecondaryColor }}
                    >
                      Categories
                    </h3>
                    <div className="space-y-1">
                      {[
                        {
                          label: "All Products",
                          href: `/storefront/${userId}/products`,
                        },
                        {
                          label: "New Arrivals",
                          href: `/storefront/${userId}/products?sort=newest`,
                        },
                        {
                          label: "Best Sellers",
                          href: `/storefront/${userId}/products?sort=popular`,
                        },
                        {
                          label: "On Sale",
                          href: `/storefront/${userId}/products?sale=true`,
                        },
                      ].map((cat) => (
                        <Link
                          key={cat.href}
                          href={cat.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className="block py-2 px-4 rounded-lg text-[15px] font-medium antialiased transition-colors hover:bg-black/5"
                          style={{ color: textColor }}
                        >
                          {cat.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Cart / Wishlist */}
                <div
                  className="pt-4 border-t"
                  style={{ borderColor: borderColor }}
                >
                  <Link
                    href={`/storefront/${userId}/wishlist`}
                    onClick={() => setMobileMenuOpen(false)}
                    className="block py-3 px-4 rounded-lg font-medium transition-colors hover:bg-black/5 relative"
                    style={{ color: textColor }}
                  >
                    <Heart size={20} className="inline mr-2" /> Wishlist
                    {wishlist.count > 0 && (
                      <span
                        className="absolute right-4 w-5 h-5 rounded-full text-[10px] flex items-center justify-center font-bold text-white"
                        style={{ backgroundColor: accentColor }}
                      >
                        {wishlist.count}
                      </span>
                    )}
                  </Link>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setCartOpen(true);
                    }}
                    className="w-full text-left py-3 px-4 rounded-lg font-medium transition-colors hover:bg-black/5 relative"
                    style={{ color: textColor }}
                  >
                    <ShoppingBag size={20} className="inline mr-2" /> Cart
                    {cartCount > 0 && (
                      <span
                        className="absolute right-4 w-5 h-5 rounded-full text-[10px] flex items-center justify-center font-bold text-white"
                        style={{ backgroundColor: accentColor }}
                      >
                        {cartCount > 99 ? "99+" : cartCount}
                      </span>
                    )}
                  </button>
                </div>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile Search Overlay */}
        {searchOpen && mobileMenuOpen === false && (
          <div
            className="md:hidden fixed inset-0 z-30 bg-black/50 animate-fade-in"
            onClick={() => setSearchOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPath}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Footer */}
        <footer
          style={{
            backgroundColor: footerBackgroundColor,
            color: buttonTextColor,
            borderTop: `1px solid ${borderColor}`,
          }}
        >
          <div className="store-container py-12 md:py-16">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
              {/* Brand */}
              <div className="lg:col-span-1">
                <Link
                  href={`/storefront/${userId}`}
                  className="flex items-center gap-3 mb-4"
                >
                  {storeSettings?.logo_url ? (
                    <img
                      src={assetUrl(storeSettings.logo_url)}
                      alt={storeSettings.store_name || "Logo"}
                      className="h-10 w-auto"
                    />
                  ) : (
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: primaryColor }}
                    >
                      <ShoppingBag size={20} className="text-white" />
                    </div>
                  )}
                  <span
                    className="font-bold text-xl"
                    style={{ fontFamily: headingFontFamily }}
                  >
                    {storeSettings?.store_name || "Store"}
                  </span>
                </Link>
                <p
                  className="text-gray-300 mb-4"
                  style={{ fontFamily: fontFamily }}
                >
                  {storeSettings?.description ||
                    storeSettings?.tagline ||
                    "Quality products at great prices. Shop with confidence."}
                </p>
                {storeSettings?.show_footer_social && (
                  <div className="flex gap-4">
                    {storeSettings?.facebook_url && (
                      <a
                        href={storeSettings.facebook_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-white transition-colors"
                      >
                        <Facebook size={20} />
                      </a>
                    )}
                    {storeSettings?.instagram_url && (
                      <a
                        href={storeSettings.instagram_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-white transition-colors"
                      >
                        <Instagram size={20} />
                      </a>
                    )}
                    {storeSettings?.twitter_url && (
                      <a
                        href={storeSettings.twitter_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-white transition-colors"
                      >
                        <Twitter size={20} />
                      </a>
                    )}
                  </div>
                )}
              </div>

              {/* Quick Links */}
              <div>
                <h4
                  className="font-semibold mb-4"
                  style={{ fontFamily: headingFontFamily }}
                >
                  Quick Links
                </h4>
                <ul className="space-y-2">
                  {navLinks.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="text-gray-300 hover:text-white transition-colors"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                  <li>
                    <Link
                      href={`/storefront/${userId}/wishlist`}
                      className="text-gray-300 hover:text-white transition-colors"
                    >
                      Wishlist
                    </Link>
                  </li>
                  <li>
                    <Link
                      href={`/storefront/${userId}/cart`}
                      className="text-gray-300 hover:text-white transition-colors"
                    >
                      Cart
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Contact Info */}
              <div>
                <h4
                  className="font-semibold mb-4"
                  style={{ fontFamily: headingFontFamily }}
                >
                  Contact Us
                </h4>
                <ul className="space-y-2 text-gray-300">
                  {storeSettings?.address && (
                    <li className="flex items-start gap-2">
                      <MapPin size={16} className="mt-0.5 flex-shrink-0" />
                      <span>
                        {storeSettings.address}
                        {storeSettings.city ? `, ${storeSettings.city}` : ""}
                        {storeSettings.country ? `, ${storeSettings.country}` : ""}
                      </span>
                    </li>
                  )}
                  {storeSettings?.contact_email && (
                    <li className="flex items-center gap-2">
                      <Mail size={16} className="flex-shrink-0" />
                      <a
                        href={`mailto:${storeSettings.contact_email}`}
                        className="hover:text-white transition-colors"
                      >
                        {storeSettings.contact_email}
                      </a>
                    </li>
                  )}
                  {storeSettings?.contact_phone && (
                    <li className="flex items-center gap-2">
                      <Phone size={16} className="flex-shrink-0" />
                      <a
                        href={`tel:${storeSettings.contact_phone}`}
                        className="hover:text-white transition-colors"
                      >
                        {storeSettings.contact_phone}
                      </a>
                    </li>
                  )}
                </ul>
              </div>

              {/* Newsletter */}
              {storeSettings?.show_footer_newsletter &&
                storeSettings?.show_newsletter !== false && (
                  <div>
                    <h4
                      className="font-semibold mb-4"
                      style={{ fontFamily: headingFontFamily }}
                    >
                      {storeSettings?.newsletter_title ||
                        "Subscribe to our newsletter"}
                    </h4>
                    <p className="text-gray-300 text-sm mb-4">
                      {storeSettings?.newsletter_subtitle ||
                        "Get updates on new products and special offers."}
                    </p>
                    {newsletterState === "done" ? (
                      <p className="text-sm font-medium text-green-300">
                        Thanks! You are subscribed.
                      </p>
                    ) : (
                      <form className="flex gap-2" onSubmit={subscribeNewsletter}>
                        <input
                          type="email"
                          required
                          value={newsletterEmail}
                          onChange={(e) => setNewsletterEmail(e.target.value)}
                          placeholder="Your email"
                          className="input-field flex-1"
                          style={{
                            backgroundColor: "rgba(255,255,255,0.1)",
                            borderColor: "rgba(255,255,255,0.2)",
                            color: "white",
                          }}
                        />
                        <button
                          type="submit"
                          className="btn-primary"
                          disabled={newsletterState === "loading"}
                        >
                          {newsletterState === "loading" ? "..." : "Subscribe"}
                        </button>
                      </form>
                    )}
                  </div>
                )}
            </div>

            {/* Copyright */}
            <div
              className="border-t pt-8 text-center"
              style={{ borderColor: "rgba(255,255,255,0.1)" }}
            >
              <p className="text-gray-400 text-sm">
                {storeSettings?.footer_copyright ||
                  `© ${new Date().getFullYear()} ${storeSettings?.store_name || "Store"}. All rights reserved.`}
              </p>
              {storeSettings?.footer_text && (
                <p className="text-gray-500 text-xs mt-2">
                  {storeSettings.footer_text}
                </p>
              )}
            </div>
          </div>
        </footer>
      </div>

      {/* Cart Sidebar */}
      <AnimatePresence>
        {cartOpen && (
          <div className="fixed inset-0 z-[60] flex">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50"
              onClick={() => setCartOpen(false)}
            />
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={spring}
              className="relative w-full max-w-md bg-white flex flex-col h-full shadow-2xl ml-auto"
              style={{ borderRadius: `${borderRadius} 0 0 ${borderRadius}` }}
            >
              <div
                className="p-4 border-b flex items-center justify-between"
                style={{ borderColor: borderColor }}
              >
                <h3
                  className="font-semibold text-lg"
                  style={{ color: textColor, fontFamily: headingFontFamily }}
                >
                  Shopping Cart ({cartCount})
                </h3>
                <button
                  onClick={() => setCartOpen(false)}
                  aria-label="Close cart"
                  className="p-1 rounded hover:bg-black/5"
                  style={{ color: textSecondaryColor }}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                {cartItems.length === 0 ? (
                  <div className="text-center py-12">
                    <ShoppingBag
                      size={48}
                      className="mx-auto mb-4 text-gray-300"
                    />
                    <p style={{ color: textSecondaryColor }}>
                      Your cart is empty
                    </p>
                    <Link
                      href={`/storefront/${userId}/products`}
                      onClick={() => setCartOpen(false)}
                      className="btn-primary inline-flex mt-4"
                    >
                      Continue Shopping
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <AnimatePresence initial={false}>
                      {cartItems.map((item) => (
                        <motion.div
                          key={item.id}
                          layout
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="flex gap-3 p-3 rounded-lg overflow-hidden"
                          style={{
                            backgroundColor: "#F9FAFB",
                            border: `1px solid ${borderColor}`,
                          }}
                        >
                          {item.image_url ? (
                            <img
                              src={assetUrl(item.image_url)}
                              alt={item.name}
                              className="w-16 h-16 object-cover rounded"
                              style={{ borderRadius: borderRadius }}
                            />
                          ) : (
                            <div
                              className="w-16 h-16 rounded flex items-center justify-center"
                              style={{
                                backgroundColor: "#EEF0F2",
                                borderRadius: borderRadius,
                                color: textSecondaryColor,
                              }}
                            >
                              <ShoppingBag size={20} />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h4
                              className="font-medium truncate"
                              style={{ color: textColor }}
                            >
                              {item.name}
                            </h4>
                            <p
                              className="text-sm font-semibold"
                              style={{ color: primaryColor }}
                            >
                              {money(item.price)}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <button
                                onClick={() =>
                                  updateCartQuantity(item.id, item.quantity - 1)
                                }
                                aria-label="Decrease quantity"
                                className="w-8 h-8 rounded border flex items-center justify-center hover:bg-white"
                                style={{
                                  borderColor: borderColor,
                                  color: textSecondaryColor,
                                }}
                              >
                                −
                              </button>
                              <span
                                className="w-8 text-center text-sm font-medium"
                                style={{ color: textColor }}
                              >
                                {item.quantity}
                              </span>
                              <button
                                onClick={() =>
                                  updateCartQuantity(item.id, item.quantity + 1)
                                }
                                aria-label="Increase quantity"
                                className="w-8 h-8 rounded border flex items-center justify-center hover:bg-white"
                                style={{
                                  borderColor: borderColor,
                                  color: textSecondaryColor,
                                }}
                              >
                                +
                              </button>
                              <button
                                onClick={() => updateCartQuantity(item.id, 0)}
                                aria-label="Remove item"
                                className="ml-auto p-1 text-red-400 hover:text-red-600"
                              >
                                <X size={16} />
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </div>

              {cartItems.length > 0 && (
                <div
                  className="p-4 border-t space-y-3"
                  style={{ borderColor: borderColor }}
                >
                  <div className="flex justify-between text-sm">
                    <span style={{ color: textSecondaryColor }}>Subtotal</span>
                    <span className="font-semibold" style={{ color: textColor }}>
                      {money(subtotal)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span style={{ color: textSecondaryColor }}>Shipping</span>
                    <span
                      className="font-semibold"
                      style={{ color: textSecondaryColor }}
                    >
                      Calculated at checkout
                    </span>
                  </div>
                  <div
                    className="flex justify-between text-lg font-bold pt-2"
                    style={{ borderTop: `1px solid ${borderColor}` }}
                  >
                    <span style={{ color: textColor }}>Total</span>
                    <span style={{ color: primaryColor }}>{money(subtotal)}</span>
                  </div>
                  <button
                    className="btn-primary w-full py-3"
                    onClick={() => router.push(`/storefront/${userId}/cart`)}
                  >
                    Proceed to Checkout
                  </button>
                  <button
                    className="btn-outline w-full py-3"
                    onClick={() => router.push(`/storefront/${userId}/cart`)}
                  >
                    View Cart
                  </button>
                </div>
              )}
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-slide-down { animation: slideDown 0.2s ease-out; }
        .animate-fade-in { animation: fadeIn 0.2s ease-out; }
      `}</style>
    </>
  );
}
