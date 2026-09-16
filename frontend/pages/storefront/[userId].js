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

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    if (userId) {
      fetchStorefrontData();
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      fetchProducts();
    }
  }, [userId, selectedCategory, showFeatured]);

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

  if (loading && products.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Storefront - Smart Business Assistant</title>
        <meta name="description" content="Browse our products" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        <StorefrontHeader userId={userId} />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="mb-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-blue-600 text-white px-4 py-1.5 rounded-md hover:bg-blue-700 transition"
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
            />
            
            <button
              onClick={() => setShowFeatured(!showFeatured)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                showFeatured ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border'
              }`}
            >
              <Heart className={`h-4 w-4 ${showFeatured ? 'fill-current' : ''}`} />
              Featured Only
            </button>
          </div>

          {/* Products Grid */}
          {products.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingBag className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No products found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  userId={userId}
                />
              ))}
            </div>
          )}
        </main>
      </div>
    </>
  );
}
