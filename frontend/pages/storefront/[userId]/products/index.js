import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import axios from 'axios';
import { Filter, Grid, List, ChevronLeft, ChevronRight, ShoppingBag, X } from 'lucide-react';
import StorefrontLayout from '../../../../components/storefront/StorefrontLayout';
import ProductCard from '../../../../components/storefront/ProductCard';

export default function StorefrontProductsPage() {
  const router = useRouter();
  const { userId } = router.query;
  const { category, search, sort, page = '1', view = 'grid' } = router.query;
  
  const [storeSettings, setStoreSettings] = useState(null);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(category || '');
  const [searchQuery, setSearchQuery] = useState(search || '');
  const [sortBy, setSortBy] = useState(sort || 'newest');
  const [viewMode, setViewMode] = useState(view);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
  const validUserId = userId && !isNaN(parseInt(userId)) ? parseInt(userId) : null;
  const currentPage = parseInt(page) || 1;

  useEffect(() => {
    if (validUserId && router.isReady) {
      fetchStoreSettings();
      fetchCategories();
      fetchProducts();
    }
  }, [validUserId, router.isReady, currentPage, selectedCategory, searchQuery, sortBy]);

  const fetchStoreSettings = async () => {
    try {
      const res = await axios.get(`${API_URL}/store-settings/public/${validUserId}`);
      setStoreSettings(res.data);
    } catch (err) {
      console.error('Error fetching store settings:', err);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await axios.get(`${API_URL}/storefront/${validUserId}/categories`);
      setCategories(res.data.categories || []);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('limit', '12');
      params.append('offset', ((currentPage - 1) * 12).toString());
      
      if (selectedCategory) params.append('category', selectedCategory);
      if (searchQuery) params.append('search', searchQuery);
      
      // Add sort parameter
      if (sortBy) params.append('sort', sortBy);

      const res = await axios.get(`${API_URL}/storefront/${validUserId}?${params.toString()}`);
      setProducts(res.data.products || []);
      
      // Calculate pagination from total
      const total = res.data.total || res.data.products?.length || 0;
      setPagination(prev => ({
        ...prev,
        page: currentPage,
        totalPages: Math.ceil(total / 12),
        total
      }));
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    router.push(`/storefront/${userId}/products?search=${encodeURIComponent(searchQuery)}&page=1`, undefined, { shallow: true });
  };

  const handleCategoryChange = (cat) => {
    setSelectedCategory(cat);
    router.push(`/storefront/${userId}/products?category=${encodeURIComponent(cat)}&page=1`, undefined, { shallow: true });
  };

  const handleSortChange = (sort) => {
    setSortBy(sort);
    router.push(`/storefront/${userId}/products?${new URLSearchParams({ ...router.query, sort, page: '1' })}`, undefined, { shallow: true });
  };

  const handlePageChange = (newPage) => {
    router.push(`/storefront/${userId}/products?${new URLSearchParams({ ...router.query, page: newPage.toString() })}`, undefined, { shallow: true });
  };

  const clearFilters = () => {
    setSelectedCategory('');
    setSearchQuery('');
    router.push(`/storefront/${userId}/products`, undefined, { shallow: true });
  };

  const hasActiveFilters = selectedCategory || searchQuery;

  const sortOptions = [
    { value: 'newest', label: 'Newest' },
    { value: 'price_asc', label: 'Price: Low to High' },
    { value: 'price_desc', label: 'Price: High to Low' },
    { value: 'popular', label: 'Most Popular' },
    { value: 'name_asc', label: 'Name: A-Z' },
    { value: 'name_desc', label: 'Name: Z-A' },
  ];

  if (loading && products.length === 0) {
    return (
      <StorefrontLayout storeSettings={storeSettings} userId={validUserId} pageTitle="Products">
        <div className="store-container py-16">
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-72 bg-gray-200 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </StorefrontLayout>
    );
  }

  if (error) {
    return (
      <StorefrontLayout storeSettings={storeSettings} userId={validUserId} pageTitle="Products">
        <div className="store-container py-16 text-center">
          <ShoppingBag size={48} className="mx-auto mb-4 text-gray-300" />
          <p className="text-red-500">{error}</p>
          <button onClick={fetchProducts} className="btn-primary mt-4">Retry</button>
        </div>
      </StorefrontLayout>
    );
  }

  const primaryColor = storeSettings?.primary_color || '#3B82F6';
  const textColor = storeSettings?.text_color || '#1F2937';
  const textSecondaryColor = storeSettings?.text_secondary_color || '#6B7280';
  const borderColor = storeSettings?.border_color || '#E5E7EB';
  const containerWidth = storeSettings?.container_width || 'max-w-7xl';
  const productsLayout = storeSettings?.products_layout || 'grid';
  const showFilters = storeSettings?.show_product_filters !== false;
  const showSort = storeSettings?.show_product_sort !== false;
  const cardStyle = storeSettings?.product_card_style || 'standard';
  const content = storeSettings?.content_overrides || {};

  return (
    <StorefrontLayout 
      storeSettings={storeSettings} 
      userId={validUserId} 
      pageTitle="Products"
    >
      <section className="py-8 border-b" style={{ borderColor: borderColor }}>
        <div className={`${containerWidth} mx-auto px-4 sm:px-6 lg:px-8`}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold" style={{ color: textColor, fontFamily: storeSettings?.heading_font_family }}>{content.products_title || 'Products'}</h1>
              <p className="text-sm mt-1" style={{ color: textSecondaryColor }}>
                {pagination.total} product{pagination.total !== 1 ? 's' : ''} found
              </p>
            </div>
            
            {hasActiveFilters && (
              <button onClick={clearFilters} className="text-sm font-medium flex items-center gap-1" style={{ color: primaryColor }}>
                <X size={14} /> Clear filters
              </button>
            )}
          </div>

          {/* Search & Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <form onSubmit={handleSearch} className="flex-1 relative">
              <Filter size={20} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: textSecondaryColor }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="input-field pl-12 pr-4"
                style={{ borderColor: borderColor }}
              />
            </form>

            {showFilters && (
              <div className="flex items-center gap-2">
                <select
                  value={selectedCategory}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="input-field min-w-[180px] py-2"
                  style={{ borderColor: borderColor }}
                >
                  <option value="">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat.category || cat} value={cat.category || cat}>
                      {cat.category || cat} ({cat.count || 0})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {showSort && (
              <select
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value)}
                className="input-field min-w-[180px] py-2"
                style={{ borderColor: borderColor }}
              >
                {sortOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            )}

            <div className="flex items-center gap-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? `bg-[${primaryColor}] text-white` : 'text-gray-500 hover:bg-gray-100'}`}
              >
                <Grid size={20} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? `bg-[${primaryColor}] text-white` : 'text-gray-500 hover:bg-gray-100'}`}
              >
                <List size={20} />
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="py-8">
        <div className={`${containerWidth} mx-auto px-4 sm:px-6 lg:px-8`}>
          {products.length === 0 ? (
            <div className="text-center py-16">
              <ShoppingBag size={48} className="mx-auto mb-4 text-gray-300" />
              <h3 className="text-xl font-semibold mb-2" style={{ color: textColor }}>No products found</h3>
              <p className="mb-4" style={{ color: textSecondaryColor }}>
                {hasActiveFilters ? 'Try adjusting your filters or search terms' : 'No products available at the moment'}
              </p>
              {hasActiveFilters && (
                <button onClick={clearFilters} className="btn-primary">Clear All Filters</button>
              )}
            </div>
          ) : (
            <>
              {/* Products Grid/List */}
              <div className={`grid gap-6 ${viewMode === 'list' ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'}`}>
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    userId={validUserId}
                    primaryColor={primaryColor}
                    accentColor={storeSettings?.accent_color || '#F59E0B'}
                    cardBackgroundColor={storeSettings?.card_background_color}
                    cardTextColor={storeSettings?.card_text_color || textColor}
                    borderColor={borderColor}
                    layout={viewMode}
                    cardStyle={cardStyle}
                  />
                ))}
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-10">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg border transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ borderColor: borderColor, color: textColor }}
                  >
                    <ChevronLeft size={20} />
                  </button>
                  
                  {[...Array(Math.min(pagination.totalPages, 5))].map((_, i) => {
                    let pageNum;
                    if (pagination.totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= pagination.totalPages - 2) {
                      pageNum = pagination.totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                          currentPage === pageNum
                            ? `bg-[${primaryColor}] text-white`
                            : `hover:bg-gray-100`
                        }`}
                        style={{ color: currentPage === pageNum ? 'white' : textColor }}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === pagination.totalPages}
                    className="p-2 rounded-lg border transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ borderColor: borderColor, color: textColor }}
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </StorefrontLayout>
  );
}