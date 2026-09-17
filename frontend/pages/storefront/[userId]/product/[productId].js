import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import axios from 'axios';
import { ArrowLeft, Heart, Share2, ShoppingCart, Mail, Phone, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';
import ProductCard from '../../../../components/storefront/ProductCard';

export default function ProductDetailPage() {
  const router = useRouter();
  const { userId, productId } = router.query;
  
  const [product, setProduct] = useState(null);
  const [recommendedProducts, setRecommendedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [storeSettings, setStoreSettings] = useState(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    if (userId && productId) {
      fetchProduct();
      fetchRecommendedProducts();
      fetchStoreSettings();
    }
  }, [userId, productId]);

  const fetchStoreSettings = async () => {
    try {
      const response = await axios.get(`${API_URL}/store-settings/public/${userId}`);
      setStoreSettings(response.data);
    } catch (err) {
      console.error('Error fetching store settings:', err);
    }
  };

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${API_URL}/storefront/${userId}/products/${productId}`
      );
      setProduct(response.data);
    } catch (err) {
      setError('Product not found');
      console.error('Error fetching product:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecommendedProducts = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/storefront/${userId}?limit=4`
      );
      setRecommendedProducts(
        response.data.products.filter(p => p.id !== parseInt(productId)).slice(0, 4)
      );
    } catch (err) {
      console.error('Error fetching recommendations:', err);
    }
  };

  const handleShare = async () => {
    if (navigator.share && product) {
      try {
        await navigator.share({
          title: product.name,
          text: product.description,
          url: window.location.href,
        });
      } catch (err) {
        console.error('Share failed:', err);
      }
    }
  };

  const handleContact = () => {
    // TODO: Implement contact functionality
    alert('Contact functionality coming soon!');
  };

  // Apply store theme colors
  useEffect(() => {
    if (storeSettings) {
      const root = document.documentElement;
      root.style.setProperty('--store-primary', storeSettings.primary_color || '#3B82F6');
      root.style.setProperty('--store-secondary', storeSettings.secondary_color || '#1E40AF');
      root.style.setProperty('--store-accent', storeSettings.accent_color || '#F59E0B');
    }
  }, [storeSettings]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ground">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber"></div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ground">
        <div className="text-red-400 text-center p-4">{error || 'Product not found'}</div>
      </div>
    );
  }

  const primaryColor = storeSettings?.primary_color || '#3B82F6';
  const secondaryColor = storeSettings?.secondary_color || '#1E40AF';
  const accentColor = storeSettings?.accent_color || '#F59E0B';

  return (
    <>
      <Head>
        <title>{product.name} - {storeSettings?.store_name || 'Storefront'}</title>
        <meta name="description" content={product.description} />
        <meta name="theme-color" content={primaryColor} />
      </Head>

      <div className="min-h-screen bg-ground" style={{ '--store-primary': primaryColor, '--store-secondary': secondaryColor, '--store-accent': accentColor }}>
        {/* Header */}
        <header className="bg-ground-secondary border-b hairline sticky top-0 z-50" style={{ borderColor: secondaryColor }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-ink-secondary hover:text-amber transition"
            >
              <ArrowLeft className="h-5 w-5" />
              Back to Store
            </button>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            {/* Product Image */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-ground-secondary border hairline rounded-xl shadow-sm overflow-hidden"
              style={{ borderColor: secondaryColor }}
            >
              <div className="aspect-square bg-ground">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted">
                    <ShoppingCart className="h-32 w-32" />
                  </div>
                )}
              </div>
            </motion.div>

            {/* Product Info */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div>
                <div className="text-sm text-muted mb-2">{product.category}</div>
                <h1 className="text-3xl font-bold text-ink mb-4">
                  {product.name}
                </h1>
                <div className="flex items-center gap-4">
                  <div className="text-3xl font-bold" style={{ color: accentColor }}>
                    {parseFloat(product.price).toFixed(2)} DA
                  </div>
                  <div className={`text-sm font-medium px-3 py-1 rounded-full ${
                    product.stock > 10 ? 'bg-teal/10 text-teal' : 
                    product.stock > 0 ? 'bg-amber/10 text-amber' : 'bg-red-400/10 text-red-400'
                  }`}>
                    {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleContact}
                  disabled={product.stock === 0}
                  className="flex-1 flex items-center justify-center gap-2 text-white py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  style={{ backgroundColor: primaryColor }}
                >
                  <Mail className="h-5 w-5" />
                  Contact Seller
                </button>
                <button
                  onClick={handleShare}
                  className="p-3 border hairline rounded-lg hover:bg-ground/50 transition"
                  style={{ borderColor: secondaryColor }}
                >
                  <Share2 className="h-5 w-5 text-ink-secondary hover:text-amber transition-colors" />
                </button>
                <button className="p-3 border hairline rounded-lg hover:bg-ground/50 transition" style={{ borderColor: secondaryColor }}>
                  <Heart className="h-5 w-5 text-ink-secondary hover:text-red-400 transition-colors" />
                </button>
              </div>

              <div className="prose prose-invert max-w-none">
                <h3 className="text-lg font-semibold mb-2 text-ink">Description</h3>
                <p className="text-ink-secondary leading-relaxed">
                  {product.description || 'No description available.'}
                </p>
              </div>

              {product.seo_keywords && product.seo_keywords.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-muted mb-2">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {product.seo_keywords.map((keyword, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 text-sm rounded-full border hairline"
                        style={{ backgroundColor: primaryColor + '20', borderColor: primaryColor, color: primaryColor }}
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </div>

          {/* Recommended Products */}
          {recommendedProducts.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-ink mb-6" style={{ color: primaryColor }}>
                You might also like
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {recommendedProducts.map((recommendedProduct) => (
                  <ProductCard
                    key={recommendedProduct.id}
                    product={recommendedProduct}
                    userId={userId}
                    primaryColor={primaryColor}
                    accentColor={accentColor}
                  />
                ))}
              </div>
            </div>
          )}
        </main>

        <footer className="bg-ground-secondary border-t hairline py-8 mt-12" style={{ borderColor: secondaryColor }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <p className="text-sm text-muted">
              © 2026 {storeSettings?.store_name || 'Store'}. All rights reserved.
            </p>
          </div>
        </footer>
      </div>
    </>
  );
}