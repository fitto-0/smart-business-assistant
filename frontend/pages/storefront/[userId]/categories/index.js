import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import axios from 'axios';
import { ChevronRight, ShoppingBag } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import StorefrontLayout from '../../../../components/storefront/StorefrontLayout';
import CategoryCard from '../../../../components/storefront/CategoryCard';

export default function StorefrontCategoriesPage() {
  const router = useRouter();
  const { userId } = router.query;
  
  const [storeSettings, setStoreSettings] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
  const validUserId = userId && !isNaN(parseInt(userId)) ? parseInt(userId) : null;

  useEffect(() => {
    if (validUserId && router.isReady) {
      fetchData();
    }
  }, [validUserId, router.isReady]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [settingsRes, categoriesRes] = await Promise.all([
        axios.get(`${API_URL}/store-settings/public/${validUserId}`),
        axios.get(`${API_URL}/storefront/${validUserId}/categories`),
      ]);
      setStoreSettings(settingsRes.data);
      setCategories(categoriesRes.data.categories || []);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <StorefrontLayout storeSettings={null} userId={validUserId} pageTitle="Categories">
        <div className="store-container py-16">
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-40 bg-gray-200 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </StorefrontLayout>
    );
  }

  if (error) {
    return (
      <StorefrontLayout storeSettings={storeSettings} userId={validUserId} pageTitle="Categories">
        <div className="store-container py-16 text-center">
          <ShoppingBag size={48} className="mx-auto mb-4 text-gray-300" />
          <p className="text-red-500">{error}</p>
        </div>
      </StorefrontLayout>
    );
  }

  const textColor = storeSettings?.text_color || '#1F2937';
  const textSecondaryColor = storeSettings?.text_secondary_color || '#6B7280';
  const primaryColor = storeSettings?.primary_color || '#3B82F6';
  const containerWidth = storeSettings?.container_width || 'max-w-7xl';

  return (
    <StorefrontLayout 
      storeSettings={storeSettings} 
      userId={validUserId} 
      pageTitle="Categories"
    >
      <section className="py-16">
        <div className={`${containerWidth} mx-auto px-4 sm:px-6 lg:px-8`}>
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-4" style={{ color: textColor, fontFamily: storeSettings?.heading_font_family }}>
              Shop by Category
            </h1>
            <p className="text-lg max-w-2xl mx-auto" style={{ color: textSecondaryColor }}>
              Explore our wide range of product categories and find exactly what you're looking for.
            </p>
          </motion.div>

          {categories.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingBag size={48} className="mx-auto mb-4 text-gray-300" />
              <h3 className="text-xl font-semibold mb-2" style={{ color: textColor }}>No categories yet</h3>
              <p style={{ color: textSecondaryColor }}>Products will appear here once added.</p>
            </div>
          ) : (
            <motion.div
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
              initial="hidden"
              animate="show"
              variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }}
            >
              {categories.map((category) => (
                <motion.div
                  key={category.category || category}
                  variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
                >
                  <CategoryCard
                    category={category}
                    userId={validUserId}
                    primaryColor={primaryColor}
                  />
                </motion.div>
              ))}
            </motion.div>
          )}

          <div className="text-center mt-12 space-y-4">
            <p style={{ color: textSecondaryColor }}>
              {categories.length} categor{categories.length === 1 ? 'y' : 'ies'} available
            </p>
            <Link
              href={`/storefront/${validUserId}/products`}
              className="btn-outline inline-flex items-center gap-2"
            >
              View all products <ChevronRight size={16} />
            </Link>
          </div>
        </div>
      </section>
    </StorefrontLayout>
  );
}