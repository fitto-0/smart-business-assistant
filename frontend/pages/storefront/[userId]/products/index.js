import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import {
  Filter,
  Grid,
  List,
  ChevronLeft,
  ChevronRight,
  ShoppingBag,
  X,
  Tag,
} from "lucide-react";
import { motion } from "framer-motion";
import StorefrontLayout from "../../../../components/storefront/StorefrontLayout";
import ProductCard from "../../../../components/storefront/ProductCard";

const sortOptions = [
  { value: "newest", label: "Newest" },
  { value: "popular", label: "Most Popular" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "name_asc", label: "Name: A-Z" },
  { value: "name_desc", label: "Name: Z-A" },
];

export default function StorefrontProductsPage() {
  const router = useRouter();
  const { userId } = router.query;

  const [storeSettings, setStoreSettings] = useState(null);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [total, setTotal] = useState(0);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [perPage, setPerPage] = useState(12);
  const [viewMode, setViewMode] = useState("grid");

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
  const validUserId = userId && !isNaN(parseInt(userId)) ? parseInt(userId) : null;

  const category = router.query.category || "";
  const search = router.query.search || "";
  const sort = router.query.sort || "newest";
  const page = parseInt(router.query.page, 10) || 1;
  const sale = router.query.sale === "true";
  const view = router.query.view === "list" ? "list" : "grid";

  // URL is the source of truth (shareable links, back button)
  useEffect(() => {
    setSelectedCategory(category);
    setSearchQuery(search);
    setSortBy(sort);
    setViewMode(view);
  }, [category, search, sort, view]);

  useEffect(() => {
    if (validUserId && router.isReady) {
      fetchSettings();
      fetchCategories();
    }
  }, [validUserId, router.isReady]);

  useEffect(() => {
    if (validUserId && router.isReady) {
      fetchProducts();
    }
  }, [validUserId, router.isReady, page, category, search, sort, sale, perPage]);

  const fetchSettings = async () => {
    try {
      const res = await axios.get(
        `${API_URL}/store-settings/public/${validUserId}`,
      );
      setStoreSettings(res.data);
      const configured = parseInt(res.data?.products_per_page, 10);
      if (Number.isFinite(configured) && configured > 0) {
        setPerPage(configured);
      }
    } catch (err) {
      console.error("Error fetching store settings:", err);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await axios.get(
        `${API_URL}/storefront/${validUserId}/categories`,
      );
      setCategories(res.data.categories || []);
    } catch (err) {
      console.error("Error fetching categories:", err);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      params.append("limit", String(perPage));
      params.append("offset", ((page - 1) * perPage).toString());
      if (category) params.append("category", category);
      if (search) params.append("search", search);
      if (sort) params.append("sort", sort);
      if (sale) params.append("sale", "true");

      const res = await axios.get(
        `${API_URL}/storefront/${validUserId}?${params.toString()}`,
      );
      setProducts(res.data.products || []);
      setTotal(res.data.total || 0);
      setCategories((prev) =>
        prev.length ? prev : res.data.categories || [],
      );
    } catch (err) {
      console.error("Error fetching products:", err);
      setError("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  const navigate = (overrides) => {
    const next = {
      category: category || "",
      search: search || "",
      sort,
      sale: sale ? "true" : "",
      page: "1",
      view,
      ...overrides,
    };
    const query = Object.fromEntries(
      Object.entries(next).filter(([, v]) => v !== "" && v != null),
    );
    router.push(
      { pathname: `/storefront/${userId}/products`, query },
      undefined,
      { shallow: true },
    );
  };

  const handleSearch = (e) => {
    e.preventDefault();
    navigate({ search: searchQuery.trim(), page: "1" });
    setFiltersOpen(false);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("");
    router.push(`/storefront/${userId}/products`, undefined, { shallow: true });
  };

  const hasActiveFilters = Boolean(category || search || sale);
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const primaryColor = storeSettings?.primary_color || "#3B82F6";
  const textColor = storeSettings?.text_color || "#1F2937";
  const textSecondaryColor = storeSettings?.text_secondary_color || "#6B7280";
  const borderColor = storeSettings?.border_color || "#E5E7EB";
  const containerWidth = storeSettings?.container_width || "max-w-7xl";
  const cardStyle = storeSettings?.product_card_style || "standard";
  const content = storeSettings?.content_overrides || {};
  const showFilters = storeSettings?.show_product_filters !== false;
  const showSort = storeSettings?.show_product_sort !== false;

  const header = (
    <section className="py-8 border-b" style={{ borderColor: borderColor }}>
      <div className={`${containerWidth} mx-auto px-4 sm:px-6 lg:px-8`}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1
              className="text-3xl font-bold"
              style={{
                color: textColor,
                fontFamily: storeSettings?.heading_font_family,
              }}
            >
              {sale ? content.sale_title || "On Sale" : content.products_title || "Products"}
            </h1>
            <p className="text-sm mt-1" style={{ color: textSecondaryColor }}>
              {total} product{total !== 1 ? "s" : ""} found
            </p>
          </div>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-sm font-medium flex items-center gap-1"
              style={{ color: primaryColor }}
            >
              <X size={14} /> Clear filters
            </button>
          )}
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <form onSubmit={handleSearch} className="flex-1 relative">
            <Filter
              size={20}
              className="absolute left-4 top-1/2 -translate-y-1/2"
              style={{ color: textSecondaryColor }}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products..."
              className="input-field pl-12 pr-4"
              style={{ borderColor: borderColor }}
            />
          </form>

          {showFilters && categories.length > 0 && (
            <select
              value={category}
              onChange={(e) => navigate({ category: e.target.value })}
              className="input-field min-w-[180px] py-2"
              style={{ borderColor: borderColor }}
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option
                  key={cat.category || cat}
                  value={cat.category || cat}
                >
                  {cat.category || cat} ({cat.count || cat.product_count || 0})
                </option>
              ))}
            </select>
          )}

          {showSort && (
            <select
              value={sortBy}
              onChange={(e) => navigate({ sort: e.target.value })}
              className="input-field min-w-[180px] py-2"
              style={{ borderColor: borderColor }}
            >
              {sortOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          )}

          <div className="flex items-center gap-1">
            <button
              onClick={() => navigate({ view: "grid" })}
              aria-label="Grid view"
              className="p-2 rounded-lg transition-colors"
              style={{
                backgroundColor: viewMode === "grid" ? primaryColor : "transparent",
                color: viewMode === "grid" ? "#FFFFFF" : textSecondaryColor,
              }}
            >
              <Grid size={20} />
            </button>
            <button
              onClick={() => navigate({ view: "list" })}
              aria-label="List view"
              className="p-2 rounded-lg transition-colors"
              style={{
                backgroundColor: viewMode === "list" ? primaryColor : "transparent",
                color: viewMode === "list" ? "#FFFFFF" : textSecondaryColor,
              }}
            >
              <List size={20} />
            </button>
          </div>
        </div>

        {sale && (
          <div className="mt-4">
            <span
              className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full"
              style={{ backgroundColor: primaryColor + "15", color: primaryColor }}
            >
              <Tag size={12} /> Sale items only
            </span>
          </div>
        )}
      </div>
    </section>
  );

  const loadingSkeleton = (
    <div className="store-container py-16">
      <div className="animate-pulse space-y-8">
        <div className="h-8 bg-gray-200 rounded w-1/4"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-72 bg-gray-200 rounded-xl"></div>
          ))}
        </div>
      </div>
    </div>
  );

  if (error && products.length === 0) {
    return (
      <StorefrontLayout
        storeSettings={storeSettings}
        userId={validUserId}
        pageTitle="Products"
      >
        <div className="store-container py-16 text-center">
          <ShoppingBag size={48} className="mx-auto mb-4 text-gray-300" />
          <p className="text-red-500">{error}</p>
          <button onClick={fetchProducts} className="btn-primary mt-4">
            Retry
          </button>
        </div>
      </StorefrontLayout>
    );
  }

  return (
    <StorefrontLayout
      storeSettings={storeSettings}
      userId={validUserId}
      pageTitle="Products"
    >
      {header}

      <section className="py-8 min-h-[50vh]">
        <div className={`${containerWidth} mx-auto px-4 sm:px-6 lg:px-8`}>
          {loading && products.length === 0 ? (
            loadingSkeleton
          ) : products.length === 0 ? (
            <div className="text-center py-16">
              <ShoppingBag size={48} className="mx-auto mb-4 text-gray-300" />
              <h3
                className="text-xl font-semibold mb-2"
                style={{ color: textColor }}
              >
                No products found
              </h3>
              <p className="mb-4" style={{ color: textSecondaryColor }}>
                {hasActiveFilters
                  ? "Try adjusting your filters or search terms"
                  : "No products available at the moment"}
              </p>
              {hasActiveFilters && (
                <button onClick={clearFilters} className="btn-primary">
                  Clear All Filters
                </button>
              )}
            </div>
          ) : (
            <>
              <motion.div
                className={`grid gap-6 ${
                  viewMode === "list"
                    ? "grid-cols-1"
                    : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                }`}
                initial="hidden"
                animate="show"
                variants={{
                  hidden: {},
                  show: { transition: { staggerChildren: 0.05 } },
                }}
                key={`${category}-${sort}-${page}`}
              >
                {products.map((product) => (
                  <motion.div
                    key={product.id}
                    variants={{
                      hidden: { opacity: 0, y: 16 },
                      show: {
                        opacity: 1,
                        y: 0,
                        transition: { duration: 0.3, ease: "easeOut" },
                      },
                    }}
                  >
                    <ProductCard
                      product={product}
                      userId={validUserId}
                      primaryColor={primaryColor}
                      accentColor={storeSettings?.accent_color || "#F59E0B"}
                      cardBackgroundColor={storeSettings?.card_background_color}
                      cardTextColor={storeSettings?.card_text_color || textColor}
                      borderColor={borderColor}
                      layout={viewMode}
                      cardStyle={cardStyle}
                    />
                  </motion.div>
                ))}
              </motion.div>

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-10">
                  <button
                    onClick={() => navigate({ page: String(page - 1) })}
                    disabled={page === 1}
                    className="p-2 rounded-lg border transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ borderColor: borderColor, color: textColor }}
                    aria-label="Previous page"
                  >
                    <ChevronLeft size={20} />
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((pageNum) => {
                      if (totalPages <= 7) return true;
                      if (page <= 4) return pageNum <= 5 || pageNum === totalPages;
                      if (page >= totalPages - 3)
                        return pageNum >= totalPages - 4 || pageNum === 1;
                      return (
                        Math.abs(pageNum - page) <= 1 ||
                        pageNum === 1 ||
                        pageNum === totalPages
                      );
                    })
                    .map((pageNum, i, arr) => (
                      <span key={pageNum} className="flex items-center gap-2">
                        {i > 0 && pageNum - arr[i - 1] > 1 && (
                          <span style={{ color: textSecondaryColor }}>…</span>
                        )}
                        <button
                          onClick={() => navigate({ page: String(pageNum) })}
                          className="w-10 h-10 rounded-lg font-medium transition-colors"
                          style={{
                            backgroundColor:
                              page === pageNum ? primaryColor : "transparent",
                            color: page === pageNum ? "#FFFFFF" : textColor,
                            border: `1px solid ${borderColor}`,
                          }}
                        >
                          {pageNum}
                        </button>
                      </span>
                    ))}

                  <button
                    onClick={() => navigate({ page: String(page + 1) })}
                    disabled={page >= totalPages}
                    className="p-2 rounded-lg border transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ borderColor: borderColor, color: textColor }}
                    aria-label="Next page"
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
