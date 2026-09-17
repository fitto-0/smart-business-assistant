import { useState, useEffect } from 'react';
import Link from 'next/link';
import Head from 'next/head';
import { ShoppingBag, Menu, X, Search, User, Heart, Facebook, Instagram, Twitter, Mail, Phone, MapPin, ArrowRight, ChevronDown, Sun, Moon } from 'lucide-react';
import { useRouter } from 'next/router';

export default function StorefrontLayout({ children, storeSettings, userId, pageTitle }) {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [cartOpen, setCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState([]);

  const primaryColor = storeSettings?.primary_color || '#3B82F6';
  const secondaryColor = storeSettings?.secondary_color || '#1E40AF';
  const accentColor = storeSettings?.accent_color || '#F59E0B';
  const backgroundColor = storeSettings?.background_color || '#FFFFFF';
  const backgroundType = storeSettings?.background_type || 'color';
  const backgroundGradient = storeSettings?.background_gradient;
  const backgroundImageUrl = storeSettings?.background_image_url;
  const textColor = storeSettings?.text_color || '#1F2937';
  const textSecondaryColor = storeSettings?.text_secondary_color || '#6B7280';
  const borderColor = storeSettings?.border_color || '#E5E7EB';
  const fontFamily = storeSettings?.font_family || 'Inter, system-ui, sans-serif';
  const headingFontFamily = storeSettings?.heading_font_family || 'Inter, system-ui, sans-serif';
  const borderRadius = storeSettings?.border_radius || '0.75rem';
  const containerWidth = storeSettings?.container_width || 'max-w-7xl';

  // Apply theme styles
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--store-primary', primaryColor);
    root.style.setProperty('--store-secondary', secondaryColor);
    root.style.setProperty('--store-accent', accentColor);
    root.style.setProperty('--store-background', backgroundColor);
    root.style.setProperty('--store-text', textColor);
    root.style.setProperty('--store-text-secondary', textSecondaryColor);
    root.style.setProperty('--store-border', borderColor);
    root.style.setProperty('--store-font', fontFamily);
    root.style.setProperty('--store-heading-font', headingFontFamily);
    root.style.setProperty('--store-radius', borderRadius);
    
    document.body.style.fontFamily = fontFamily;
    document.body.style.color = textColor;
    document.body.style.backgroundColor = backgroundType === 'color' ? backgroundColor : 'transparent';
    
    if (backgroundType === 'gradient' && backgroundGradient) {
      document.body.style.background = backgroundGradient;
    } else if (backgroundType === 'image' && backgroundImageUrl) {
      document.body.style.backgroundImage = `url(${backgroundImageUrl})`;
      document.body.style.backgroundSize = 'cover';
      document.body.style.backgroundPosition = 'center';
      document.body.style.backgroundAttachment = 'fixed';
    }
  }, [primaryColor, secondaryColor, accentColor, backgroundColor, backgroundType, backgroundGradient, backgroundImageUrl, textColor, textSecondaryColor, borderColor, fontFamily, headingFontFamily, borderRadius]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/storefront/${userId}/products?search=${encodeURIComponent(searchQuery)}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  const addToCart = (product) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    setCartOpen(true);
  };

  const updateCartQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      setCartItems(prev => prev.filter(item => item.id !== productId));
    } else {
      setCartItems(prev => prev.map(item => item.id === productId ? { ...item, quantity } : item));
    }
  };

  const cartTotal = cartItems.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0);
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const navLinks = [
    { href: `/storefront/${userId}`, label: 'Home', show: storeSettings?.show_home_page !== false },
    { href: `/storefront/${userId}/products`, label: 'Products', show: storeSettings?.show_products_page !== false },
    { href: `/storefront/${userId}/categories`, label: 'Categories', show: storeSettings?.show_categories_page !== false },
    { href: `/storefront/${userId}/about`, label: 'About', show: storeSettings?.show_about_page !== false },
    { href: `/storefront/${userId}/contact`, label: 'Contact', show: storeSettings?.show_contact_page !== false },
  ].filter(link => link.show);

  return (
    <>
      <Head>
        <title>{pageTitle ? `${pageTitle} - ${storeSettings?.store_name || 'Store'}` : storeSettings?.store_name || 'Store'}</title>
        <meta name="description" content={storeSettings?.seo_description || storeSettings?.description || 'Welcome to our store'} />
        <meta name="theme-color" content={primaryColor} />
        {storeSettings?.favicon_url && <link rel="icon" href={storeSettings.favicon_url} />}
        {storeSettings?.og_image_url && (
          <>
            <meta property="og:image" content={storeSettings.og_image_url} />
            <meta property="og:title" content={storeSettings?.seo_title || storeSettings?.store_name || 'Store'} />
            <meta property="og:description" content={storeSettings?.seo_description || storeSettings?.description || 'Welcome to our store'} />
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
          .btn-primary { background: var(--store-primary); color: white; padding: 0.75rem 1.5rem; border-radius: var(--store-radius); font-weight: 600; transition: all 0.2s; }
          .btn-primary:hover { opacity: 0.9; transform: translateY(-1px); }
          .btn-secondary { background: var(--store-secondary); color: white; padding: 0.75rem 1.5rem; border-radius: var(--store-radius); font-weight: 600; transition: all 0.2s; }
          .btn-secondary:hover { opacity: 0.9; }
          .btn-accent { background: var(--store-accent); color: white; padding: 0.75rem 1.5rem; border-radius: var(--store-radius); font-weight: 600; transition: all 0.2s; }
          .btn-accent:hover { opacity: 0.9; }
          .btn-outline { border: 2px solid var(--store-primary); color: var(--store-primary); padding: 0.75rem 1.5rem; border-radius: var(--store-radius); font-weight: 600; transition: all 0.2s; background: transparent; }
          .btn-outline:hover { background: var(--store-primary); color: white; }
          .input-field { width: 100%; padding: 0.75rem 1rem; border: 1px solid var(--store-border); border-radius: var(--store-radius); background: white; color: var(--store-text); transition: all 0.2s; }
          .input-field:focus { outline: none; border-color: var(--store-primary); box-shadow: 0 0 0 3px ${primaryColor + '33'}; }
          .card { background: white; border: 1px solid var(--store-border); border-radius: var(--store-radius); transition: all 0.3s; }
          .card:hover { box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1); }
          .section-title { font-size: 1.875rem; font-weight: 700; color: var(--store-text); margin-bottom: 0.5rem; }
          .section-subtitle { color: var(--store-text-secondary); font-size: 1.125rem; }
          .badge { display: inline-block; padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; }
          .badge-primary { background: var(--store-primary); color: white; }
          .badge-accent { background: var(--store-accent); color: white; }
        `}</style>
      </Head>

      <div className="min-h-screen flex flex-col" style={{ 
        backgroundColor: backgroundType === 'color' ? backgroundColor : 'transparent',
        background: backgroundType === 'gradient' && backgroundGradient ? backgroundGradient : undefined,
        backgroundImage: backgroundType === 'image' && backgroundImageUrl ? `url(${backgroundImageUrl})` : undefined,
        backgroundSize: backgroundType === 'image' ? 'cover' : undefined,
        backgroundPosition: backgroundType === 'image' ? 'center' : undefined,
        backgroundAttachment: backgroundType === 'image' ? 'fixed' : undefined,
      }}>
        {/* Header */}
        <header className="sticky top-0 z-50" style={{ backgroundColor: backgroundType === 'color' ? backgroundColor : 'rgba(255,255,255,0.95)', backdropFilter: 'blur(8px)', borderBottom: `1px solid ${borderColor}` }}>
          {/* Top Bar */}
          {(storeSettings?.contact_email || storeSettings?.contact_phone) && (
            <div className="py-2 text-xs" style={{ backgroundColor: secondaryColor, color: 'white' }}>
              <div className="store-container flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-4">
                  {storeSettings?.contact_email && (
                    <a href={`mailto:${storeSettings.contact_email}`} className="flex items-center gap-1 hover:opacity-80 transition-opacity">
                      <Mail size={12} /> {storeSettings.contact_email}
                    </a>
                  )}
                  {storeSettings?.contact_phone && (
                    <a href={`tel:${storeSettings.contact_phone}`} className="flex items-center gap-1 hover:opacity-80 transition-opacity">
                      <Phone size={12} /> {storeSettings.contact_phone}
                    </a>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  {storeSettings?.facebook_url && <a href={storeSettings.facebook_url} target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity"><Facebook size={16} /></a>}
                  {storeSettings?.instagram_url && <a href={storeSettings.instagram_url} target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity"><Instagram size={16} /></a>}
                  {storeSettings?.twitter_url && <a href={storeSettings.twitter_url} target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity"><Twitter size={16} /></a>}
                </div>
              </div>
            </div>
          )}

          {/* Main Header */}
          <div className="store-container">
            <div className="flex items-center justify-between h-16 md:h-20 gap-4">
              {/* Logo */}
              <Link href={`/storefront/${userId}`} className="flex items-center gap-3 flex-shrink-0">
                {storeSettings?.logo_url ? (
                  <img src={storeSettings.logo_url} alt={storeSettings.store_name || 'Logo'} className="h-10 w-auto" />
                ) : (
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white" style={{ backgroundColor: primaryColor }}>
                    <ShoppingBag size={20} />
                  </div>
                )}
                <span className="hidden sm:block font-bold text-xl" style={{ color: textColor, fontFamily: headingFontFamily }}>
                  {storeSettings?.store_name || 'Store'}
                </span>
              </Link>

              {/* Desktop Navigation */}
              <nav className="hidden md:flex items-center gap-8">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`text-sm font-medium transition-colors relative py-2 ${
                      router.pathname === link.href || router.pathname.startsWith(link.href + '/')
                        ? `text-[${primaryColor}]`
                        : `text-[${textSecondaryColor}] hover:text-[${primaryColor}]`
                    }`}
                  >
                    {link.label}
                    {router.pathname === link.href || router.pathname.startsWith(link.href + '/') && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full" style={{ backgroundColor: primaryColor }} />
                    )}
                  </Link>
                ))}
              </nav>

              {/* Actions */}
              <div className="flex items-center gap-3">
                {/* Search */}
                <button
                  onClick={() => setSearchOpen(!searchOpen)}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-[${textSecondaryColor}] hover:text-[${primaryColor}]"
                  style={{ color: textSecondaryColor }}
                >
                  <Search size={20} />
                </button>

                {/* Wishlist */}
                <Link href={`/storefront/${userId}/wishlist`} className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-[${textSecondaryColor}] hover:text-[${primaryColor}] relative">
                  <Heart size={20} />
                </Link>

                {/* Cart */}
                <button
                  onClick={() => setCartOpen(!cartOpen)}
                  className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors text-[${textSecondaryColor}] hover:text-[${primaryColor}]"
                >
                  <ShoppingBag size={20} />
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-xs flex items-center justify-center font-bold text-white" style={{ backgroundColor: accentColor }}>
                      {cartCount > 99 ? '99+' : cartCount}
                    </span>
                  )}
                </button>

                {/* Account */}
                <Link href={`/storefront/${userId}/account`} className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-[${textSecondaryColor}] hover:text-[${primaryColor}]">
                  <User size={20} />
                </Link>

                {/* Mobile Menu Button */}
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors text-[${textColor}]"
                  style={{ color: textColor }}
                >
                  {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
              </div>
            </div>
          </div>

          {/* Search Bar (Mobile/Expanded) */}
          {searchOpen && (
            <div className="store-container pb-4 md:hidden animate-slide-down">
              <form onSubmit={handleSearch} className="flex gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products..."
                  className="input-field flex-1"
                  autoFocus
                />
                <button type="submit" className="btn-primary px-4">Search</button>
              </form>
            </div>
          )}
        </header>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-40 bg-white animate-slide-in">
            <div className="p-4 border-b" style={{ borderColor: borderColor }}>
              <button onClick={() => setMobileMenuOpen(false)} className="text-[${textSecondaryColor}] hover:text-[${primaryColor}]">
                <X size={24} />
              </button>
            </div>
            <nav className="p-4 space-y-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block py-3 px-4 rounded-lg font-medium transition-colors ${
                    router.pathname === link.href || router.pathname.startsWith(link.href + '/')
                      ? `bg-[${primaryColor}] text-white`
                      : `text-[${textColor}] hover:bg-gray-100`
                  }`}
                  style={{ color: router.pathname === link.href ? 'white' : textColor }}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        )}

        {/* Mobile Search Overlay */}
        {searchOpen && (
          <div className="md:hidden fixed inset-0 z-30 bg-black/50 animate-fade-in" onClick={() => setSearchOpen(false)} />
        )}

        {/* Main Content */}
        <main className="flex-1">
          {children}
        </main>

        {/* Footer */}
        <footer style={{ backgroundColor: secondaryColor, color: 'white', borderTop: `1px solid ${borderColor}` }}>
          <div className="store-container py-12 md:py-16">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
              {/* Brand */}
              <div className="lg:col-span-1">
                <Link href={`/storefront/${userId}`} className="flex items-center gap-3 mb-4">
                  {storeSettings?.logo_url ? (
                    <img src={storeSettings.logo_url} alt={storeSettings.store_name || 'Logo'} className="h-10 w-auto" />
                  ) : (
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: primaryColor }}>
                      <ShoppingBag size={20} className="text-white" />
                    </div>
                  )}
                  <span className="font-bold text-xl" style={{ fontFamily: headingFontFamily }}>
                    {storeSettings?.store_name || 'Store'}
                  </span>
                </Link>
                <p className="text-gray-300 mb-4" style={{ fontFamily: fontFamily }}>
                  {storeSettings?.description || storeSettings?.tagline || 'Quality products at great prices. Shop with confidence.'}
                </p>
                {storeSettings?.show_footer_social && (
                  <div className="flex gap-4">
                    {storeSettings?.facebook_url && <a href={storeSettings.facebook_url} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors"><Facebook size={20} /></a>}
                    {storeSettings?.instagram_url && <a href={storeSettings.instagram_url} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors"><Instagram size={20} /></a>}
                    {storeSettings?.twitter_url && <a href={storeSettings.twitter_url} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors"><Twitter size={20} /></a>}
                  </div>
                )}
              </div>

              {/* Quick Links */}
              <div>
                <h4 className="font-semibold mb-4" style={{ fontFamily: headingFontFamily }}>Quick Links</h4>
                <ul className="space-y-2">
                  {navLinks.map((link) => (
                    <li key={link.href}>
                      <Link href={link.href} className="text-gray-300 hover:text-white transition-colors">{link.label}</Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Contact Info */}
              <div>
                <h4 className="font-semibold mb-4" style={{ fontFamily: headingFontFamily }}>Contact Us</h4>
                <ul className="space-y-2 text-gray-300">
                  {storeSettings?.address && (
                    <li className="flex items-start gap-2">
                      <MapPin size={16} className="mt-0.5 flex-shrink-0" />
                      <span>{storeSettings.address}, {storeSettings.city}, {storeSettings.country}</span>
                    </li>
                  )}
                  {storeSettings?.contact_email && (
                    <li className="flex items-center gap-2">
                      <Mail size={16} className="flex-shrink-0" />
                      <a href={`mailto:${storeSettings.contact_email}`} className="hover:text-white transition-colors">{storeSettings.contact_email}</a>
                    </li>
                  )}
                  {storeSettings?.contact_phone && (
                    <li className="flex items-center gap-2">
                      <Phone size={16} className="flex-shrink-0" />
                      <a href={`tel:${storeSettings.contact_phone}`} className="hover:text-white transition-colors">{storeSettings.contact_phone}</a>
                    </li>
                  )}
                </ul>
              </div>

              {/* Newsletter */}
              {storeSettings?.show_footer_newsletter && storeSettings?.show_newsletter && (
                <div>
                  <h4 className="font-semibold mb-4" style={{ fontFamily: headingFontFamily }}>
                    {storeSettings?.newsletter_title || 'Subscribe to our newsletter'}
                  </h4>
                  <p className="text-gray-300 text-sm mb-4">{storeSettings?.newsletter_subtitle || 'Get updates on new products and special offers.'}</p>
                  <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); alert('Newsletter signup coming soon!'); }}>
                    <input type="email" placeholder="Your email" className="input-field flex-1" style={{ backgroundColor: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.2)', color: 'white' }} />
                    <button type="submit" className="btn-primary">Subscribe</button>
                  </form>
                </div>
              )}
            </div>

            {/* Copyright */}
            <div className="border-t pt-8 text-center" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
              <p className="text-gray-400 text-sm">
                {storeSettings?.footer_copyright || `© ${new Date().getFullYear()} ${storeSettings?.store_name || 'Store'}. All rights reserved.`}
              </p>
              {storeSettings?.footer_text && (
                <p className="text-gray-500 text-xs mt-2">{storeSettings.footer_text}</p>
              )}
            </div>
          </div>
        </footer>
      </div>

      {/* Cart Sidebar */}
      {cartOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/50" onClick={() => setCartOpen(false)} />
          <div className="relative w-full max-w-md bg-white flex flex-col h-full shadow-2xl animate-slide-in-right" style={{ borderRadius: borderRadius }}>
            <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: borderColor }}>
              <h3 className="font-semibold text-lg" style={{ color: textColor, fontFamily: headingFontFamily }}>Shopping Cart ({cartCount})</h3>
              <button onClick={() => setCartOpen(false)} className="p-1 rounded hover:bg-gray-100 text-[${textSecondaryColor}]"><X size={20} /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              {cartItems.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingBag size={48} className="mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-500">Your cart is empty</p>
                  <Link href={`/storefront/${userId}/products`} onClick={() => setCartOpen(false)} className="btn-primary inline-block mt-4">Continue Shopping</Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex gap-3 p-3 rounded-lg" style={{ backgroundColor: '#F9FAFB', border: `1px solid ${borderColor}` }}>
                      {item.image_url && (
                        <img src={item.image_url} alt={item.name} className="w-16 h-16 object-cover rounded" style={{ borderRadius: borderRadius }} />
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate" style={{ color: textColor }}>{item.name}</h4>
                        <p className="text-sm font-semibold" style={{ color: primaryColor }}>{parseFloat(item.price).toFixed(2)} DA</p>
                        <div className="flex items-center gap-2 mt-2">
                          <button onClick={() => updateCartQuantity(item.id, item.quantity - 1)} className="w-8 h-8 rounded border flex items-center justify-center text-[${textSecondaryColor}] hover:bg-white" style={{ borderColor: borderColor }}>-</button>
                          <span className="w-10 text-center text-sm font-medium" style={{ color: textColor }}>{item.quantity}</span>
                          <button onClick={() => updateCartQuantity(item.id, item.quantity + 1)} className="w-8 h-8 rounded border flex items-center justify-center text-[${textSecondaryColor}] hover:bg-white" style={{ borderColor: borderColor }}>+</button>
                          <button onClick={() => updateCartQuantity(item.id, 0)} className="ml-auto p-1 text-red-400 hover:text-red-600"><X size={16} /></button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {cartItems.length > 0 && (
              <div className="p-4 border-t space-y-4" style={{ borderColor: borderColor }}>
                <div className="flex justify-between text-sm">
                  <span style={{ color: textSecondaryColor }}>Subtotal</span>
                  <span className="font-semibold" style={{ color: textColor }}>{cartTotal.toFixed(2)} DA</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span style={{ color: textSecondaryColor }}>Shipping</span>
                  <span className="font-semibold" style={{ color: textColor }}>Calculated at checkout</span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2" style={{ borderTop: `1px solid ${borderColor}` }}>
                  <span style={{ color: textColor }}>Total</span>
                  <span style={{ color: primaryColor }}>{cartTotal.toFixed(2)} DA</span>
                </div>
                <button className="btn-primary w-full py-3" onClick={() => { router.push(`/storefront/${userId}/cart`); setCartOpen(false); }}>
                  Proceed to Checkout
                </button>
                <button className="btn-outline w-full py-3" onClick={() => { router.push(`/storefront/${userId}/cart`); setCartOpen(false); }}>
                  View Cart
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(100%); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(100%); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-slide-down { animation: slideDown 0.2s ease-out; }
        .animate-slide-in { animation: slideIn 0.3s ease-out; }
        .animate-slide-in-right { animation: slideInRight 0.3s ease-out; }
        .animate-fade-in { animation: fadeIn 0.2s ease-out; }
      `}</style>
    </>
  );
}