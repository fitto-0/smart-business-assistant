import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import axios from 'axios';
import { Search, Filter, ShoppingBag, Heart, Share2 } from 'lucide-react';
import ProductCard from '../../components/storefront/ProductCard';
import StorefrontHeader from '../../components/storefront/StorefrontHeader';
import CategoryFilter from '../../components/storefront/CategoryFilter';

export default function StorefrontPage() {
  const router = useRouter();
  const { userId } = router.query;
  
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showFeatured, setShowFeatured] = useState(false);
  const [storeSettings, setStoreSettings] = useState(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    if (userId) {
      fetchStorefrontData();
      fetchStoreSettings();
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      fetchProducts();
    }
  }, [userId, selectedCategory, showFeatured]);

  const fetchStoreSettings = async () => {
    try {
      const response = await axios.get(`${API_URL}/store-settings/public/${userId}`);
      setStoreSettings(response.data);
    } catch (err) {
      console.error('Error fetching store settings:', err);
    }
  };

  const fetchStorefrontData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/storefront/${userId}`);
      setCategories(response.data.categories);
      setProducts(response.data.products);
    } catch (err) {
      setError('Failed to load storefront');
      console.error('Error fetching storefront:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      let url = `${API_URL}/storefront/${userId}`;
      const params = new URLSearchParams();
      
      if (selectedCategory) params.append('category', selectedCategory);
      if (showFeatured) params.append('featured', 'true');
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await axios.get(url);
      setProducts(response.data.products);
    } catch (err) {
      setError('Failed to load products');
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      fetchProducts();
      return;
    }

    try {
      setLoading(true);
      let url = `${API_URL}/storefront/${userId}/search?q=${encodeURIComponent(searchQuery)}`;
      if (selectedCategory) url += `&category=${selectedCategory}`;
      
      const response = await axios.get(url);
      setProducts(response.data.products);
    } catch (err) {
      setError('Search failed');
      console.error('Error searching:', err);
    } finally {
      setLoading(false);
    }
  };

  // Apply store theme colors to document
  useEffect(() => {
    if (storeSettings) {
      const root = document.documentElement;
      root.style.setProperty('--store-primary', storeSettings.primary_color || '#3B82F6');
      root.style.setProperty('--store-secondary', storeSettings.secondary_color || '#1E40AF');
      root.style.setProperty('--store-accent', storeSettings.accent_color || '#F59E0B');
    }
  }, [storeSettings]);

  if (loading && products.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ground">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ground">
        <div className="text-red-400 text-center p-4">{error}</div>
      </div>
    );
  }

  const primaryColor = storeSettings?.primary_color || '#3B82F6';
  const secondaryColor = storeSettings?.secondary_color || '#1E40AF';
  const accentColor = storeSettings?.accent_color || '#F59E0B';

  return (
    <>
      <Head>
        <title>{storeSettings?.store_name || 'Storefront'} - Smart Business Assistant</title>
        <meta name="description" content={storeSettings?.description || 'Browse our products'} />
        <meta name="theme-color" content={primaryColor} />
      </Head>

      <div className="min-h-screen bg-ground" style={{ '--store-primary': primaryColor, '--store-secondary': secondaryColor, '--store-accent': accentColor }}>
        <StorefrontHeader userId={userId} />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="mb-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted h-5 w-5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="w-full pl-10 pr-4 py-3 bg-ground border hairline rounded-lg text-ink placeholder-muted focus:ring-2 focus:ring-amber focus:border-transparent outline-none transition-colors"
                style={{ borderColor: secondaryColor }}
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-white px-4 py-1.5 rounded-md hover:opacity-90 transition font-medium text-sm"
                style={{ backgroundColor: accentColor }}
              >
                Search
              </button>
            </div>
          </form>

          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-8 items-center">
            <CategoryFilter
              categories={categories}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              primaryColor={primaryColor}
            />
            
            <button
              onClick={() => setShowFeatured(!showFeatured)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                showFeatured ? 'text-white' : 'text-ink border'
              }`}
              style={{
                backgroundColor: showFeatured ? accentColor : 'transparent',
                borderColor: secondaryColor,
              }}
            >
              <Heart className={`h-4 w-4 ${showFeatured ? 'fill-current' : ''}`} />
              <span className="text-sm">Featured Only</span>
            </button>
          </div>

          {/* Products Grid */}
          {products.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingBag className="h-16 w-16 text-muted mx-auto mb-4" />
              <p className="text-ink-secondary">No products found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  userId={userId}
                  primaryColor={primaryColor}
                  accentColor={accentColor}
                />
              ))}
            </div>
          )}
        </main>

        <footer className="bg-ground-secondary border-t hairline py-8 mt-12" style={{ borderColor: secondaryColor }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="text-center md:text-left">
                <p className="font-semibold text-ink" style={{ color: primaryColor }}>
                  {storeSettings?.store_name || 'Store'}
                </p>
                <p className="text-sm text-ink-secondary mt-1">
                  {storeSettings?.tagline || storeSettings?.description || 'Quality products at great prices'}
                </p>
              </div>
              <div className="flex items-center gap-4">
                {storeSettings?.facebook_url && (
                  <a href={storeSettings.facebook_url} target="_blank" rel="noopener noreferrer" className="text-ink-secondary hover:text-amber transition-colors" aria-label="Facebook">
                    <Facebook size={20} />
                  </a>
                )}
                {storeSettings?.instagram_url && (
                  <a href={storeSettings.instagram_url} target="_blank" rel="noopener noreferrer" className="text-ink-secondary hover:text-amber transition-colors" aria-label="Instagram">
                    <Instagram size={20} />
                  </a>
                )}
                {storeSettings?.twitter_url && (
                  <a href={storeSettings.twitter_url} target="_blank" rel="noopener noreferrer" className="text-ink-secondary hover:text-amber transition-colors" aria-label="Twitter">
                    <Twitter size={20} />
                  </a>
                )}
                {storeSettings?.whatsapp_number && (
                  <a href={`https://wa.me/${storeSettings.whatsapp_number.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-ink-secondary hover:text-amber transition-colors" aria-label="WhatsApp">
                    <MessageCircle size={20} />
                  </a>
                )}
              </div>
              <div className="text-center md:text-right">
                <p className="text-sm text-ink-secondary">
                  {storeSettings?.contact_email && (
                    <a href={`mailto:${storeSettings.contact_email}`} className="hover:text-amber transition-colors">
                      {storeSettings.contact_email}
                    </a>
                  )}
                </p>
                <p className="text-sm text-ink-secondary mt-1">
                  {storeSettings?.contact_phone && (
                    <a href={`tel:${storeSettings.contact_phone}`} className="hover:text-amber transition-colors">
                      {storeSettings.contact_phone}
                    </a>
                  )}
                </p>
              </div>
            </div>
            <div className="border-t mt-8 pt-8 text-center" style={{ borderColor: secondaryColor }}>
              <p className="text-sm text-muted">
                © 2026 {storeSettings?.store_name || 'Store'}. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}