import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import axios from "axios";
import {
  ShoppingCart,
  ChevronRight,
  Star,
  Truck,
  Shield,
  RotateCcw,
  Share2,
  Heart,
  Minus,
  Plus,
  Package,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import StorefrontLayout from "../../../../components/storefront/StorefrontLayout";
import { assetUrl } from "../../../../lib/assetUrl";
import { useCart, useWishlist } from "../../../../lib/cart";
import { money, money2, hasPromotion, priceOf, discountPercent } from "../../../../lib/money";

const TAB_IDS = ["description", "details", "shipping", "reviews"];

function Stars({ value = 0, size = 16, interactive = false, onChange }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= Math.round(Number(value));
        const star = (
          <Star
            size={size}
            fill={filled ? "#F59E0B" : "none"}
            stroke={filled ? "#F59E0B" : "#D1D5DB"}
          />
        );
        if (!interactive) return <span key={n}>{star}</span>;
        return (
          <button
            key={n}
            type="button"
            aria-label={`${n} star${n > 1 ? "s" : ""}`}
            onClick={() => onChange(n)}
            className="transition-transform hover:scale-110"
          >
            {star}
          </button>
        );
      })}
    </span>
  );
}

export default function ProductDetailPage() {
  const router = useRouter();
  const { userId, productId } = router.query;

  const [storeSettings, setStoreSettings] = useState(null);
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentImage, setCurrentImage] = useState(0);
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState("description");
  const [reviews, setReviews] = useState([]);
  const [reviewsLoaded, setReviewsLoaded] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    customer_name: "",
    rating: 5,
    comment: "",
  });
  const [submittingReview, setSubmittingReview] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
  const validUserId = userId && !isNaN(parseInt(userId)) ? parseInt(userId) : null;
  const validProductId =
    productId && !isNaN(parseInt(productId)) ? parseInt(productId) : null;

  // Cart/wishlist hooks are bound to the resolved route id
  const cartStore = useCart(validUserId);
  const wishlistStore = useWishlist(validUserId);

  useEffect(() => {
    if (validUserId && validProductId && router.isReady) {
      fetchProduct();
      fetchStoreSettings();
      setActiveTab("description");
    }
  }, [validUserId, validProductId, router.isReady]);

  const fetchStoreSettings = async () => {
    try {
      const res = await axios.get(`${API_URL}/store-settings/public/${validUserId}`);
      setStoreSettings(res.data);
    } catch (err) {
      console.error("Error fetching store settings:", err);
    }
  };

  const fetchProduct = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(
        `${API_URL}/storefront/${validUserId}/products/${validProductId}`,
      );
      setProduct(response.data);
      setCurrentImage(0);
      setSelectedQuantity(1);
    } catch (err) {
      setError("Product not found");
      console.error("Error fetching product:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = useCallback(async () => {
    if (!validUserId || !validProductId) return;
    try {
      const res = await axios.get(
        `${API_URL}/storefront/${validUserId}/reviews?product_id=${validProductId}`,
      );
      setReviews(res.data.reviews || []);
    } catch (err) {
      console.error("Error fetching reviews:", err);
    } finally {
      setReviewsLoaded(true);
    }
  }, [validUserId, validProductId]);

  useEffect(() => {
    if (activeTab === "reviews" && !reviewsLoaded) fetchReviews();
  }, [activeTab, reviewsLoaded, fetchReviews]);

  const handleAddToCart = () => {
    if (!product) return;
    cartStore.add(product, selectedQuantity);
    toast.success(
      selectedQuantity > 1
        ? `${selectedQuantity} × ${product.name} added to cart`
        : `${product.name} added to cart`,
    );
  };

  const handleWishlist = () => {
    if (!product) return;
    const wasIn = wishlistStore.has(product.id);
    wishlistStore.toggle(product);
    toast.success(
      wasIn ? "Removed from wishlist" : "Saved to wishlist",
    );
  };

  const handleShare = async () => {
    if (!product) return;
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: product.description || product.name,
          url,
        });
      } catch (err) {
        /* dismissed */
      }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        toast.success("Link copied");
      } catch (err) {
        toast.error("Could not copy link");
      }
    }
  };

  const submitReview = async (e) => {
    e.preventDefault();
    if (!reviewForm.customer_name.trim()) {
      toast.error("Please enter your name");
      return;
    }
    setSubmittingReview(true);
    try {
      const res = await axios.post(
        `${API_URL}/storefront/${validUserId}/reviews`,
        {
          product_id: validProductId,
          customer_name: reviewForm.customer_name.trim(),
          rating: reviewForm.rating,
          comment: reviewForm.comment.trim(),
        },
      );
      setReviews((prev) => [
        {
          ...res.data.review,
          product_name: product.name,
        },
        ...prev,
      ]);
      setReviewForm({ customer_name: reviewForm.customer_name, rating: 5, comment: "" });
      toast.success("Thanks for your review!");
      setProduct((prev) => {
        if (!prev) return prev;
        const prevCount = Number(prev.review_count) || 0;
        const prevSum = (Number(prev.avg_rating) || 0) * prevCount;
        const nextCount = prevCount + 1;
        return {
          ...prev,
          review_count: nextCount,
          avg_rating:
            Math.round(((prevSum + res.data.review.rating) / nextCount) * 10) / 10,
        };
      });
    } catch (err) {
      toast.error(err.response?.data?.error || "Could not submit review");
    } finally {
      setSubmittingReview(false);
    }
  };

  const content = storeSettings?.content_overrides || {};
  const primaryColor = storeSettings?.primary_color || "#3B82F6";
  const accentColor = storeSettings?.accent_color || "#F59E0B";
  const textColor = storeSettings?.text_color || "#1F2937";
  const textSecondaryColor = storeSettings?.text_secondary_color || "#6B7280";
  const containerWidth = storeSettings?.container_width || "max-w-7xl";
  const borderRadius = storeSettings?.border_radius || "0.75rem";
  const borderColor = storeSettings?.border_color || "#E5E7EB";
  const enableReviews = storeSettings?.enable_reviews !== false;
  const freeShippingThreshold = Number(content.free_shipping_threshold ?? 500);
  const shippingFee = Number(content.shipping_fee ?? 30);
  const relatedTitle = storeSettings?.related_products_title || "You May Also Like";

  if (loading) {
    return (
      <StorefrontLayout
        storeSettings={storeSettings}
        userId={validUserId}
        pageTitle="Loading..."
      >
        <div className="store-container py-16">
          <div className="grid lg:grid-cols-2 gap-8 animate-pulse">
            <div className="aspect-square bg-gray-200 rounded-2xl"></div>
            <div className="space-y-4">
              <div className="h-8 bg-gray-200 rounded w-1/3"></div>
              <div className="h-12 bg-gray-200 rounded w-2/3"></div>
              <div className="h-24 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </StorefrontLayout>
    );
  }

  if (error || !product) {
    return (
      <StorefrontLayout
        storeSettings={storeSettings}
        userId={validUserId}
        pageTitle="Not Found"
      >
        <div className="store-container py-16 text-center">
          <ShoppingCart size={48} className="mx-auto mb-4 text-gray-300" />
          <h1
            className="text-2xl font-bold mb-2"
            style={{ color: storeSettings?.text_color || "#1F2937" }}
          >
            Product Not Found
          </h1>
          <p
            className="mb-4"
            style={{ color: storeSettings?.text_secondary_color || "#6B7280" }}
          >
            The product you are looking for does not exist or has been removed.
          </p>
          <Link href={`/storefront/${validUserId}/products`} className="btn-primary">
            Browse Products
          </Link>
        </div>
      </StorefrontLayout>
    );
  }

  const images = product.image_url ? [assetUrl(product.image_url)] : [];
  const inStock = Number(product.stock) > 0;
  const lowStock = inStock && Number(product.stock) <= 10;
  const promo = hasPromotion(product);
  const effectivePrice = priceOf(product);
  const saved = wishlistStore.has(product.id);
  const relatedProducts = (product.related || []).slice(0, 4);
  const avgRating = Number(product.avg_rating) || 0;
  const reviewCount = Number(product.review_count) || 0;

  const tabs = [
    { id: "description", label: "Description" },
    { id: "details", label: "Details" },
    { id: "shipping", label: "Shipping & Returns" },
    ...(enableReviews
      ? [{ id: "reviews", label: `Reviews${reviewCount ? ` (${reviewCount})` : ""}` }]
      : []),
  ];

  return (
    <StorefrontLayout
      storeSettings={storeSettings}
      userId={validUserId}
      pageTitle={product.name}
    >
      <section className="py-8">
        <div className={`${containerWidth} mx-auto px-4 sm:px-6 lg:px-8`}>
          {/* Breadcrumb */}
          <nav
            className="flex items-center gap-2 mb-6 text-sm"
            style={{ color: textSecondaryColor }}
          >
            <Link href={`/storefront/${validUserId}`} className="hover:underline">
              Home
            </Link>
            <ChevronRight size={16} />
            <Link
              href={`/storefront/${validUserId}/products`}
              className="hover:underline"
            >
              Products
            </Link>
            {product.category && (
              <>
                <ChevronRight size={16} />
                <Link
                  href={`/storefront/${validUserId}/products?category=${encodeURIComponent(product.category)}`}
                  className="hover:underline"
                >
                  {product.category}
                </Link>
              </>
            )}
            <ChevronRight size={16} />
            <span className="truncate max-w-[220px]" style={{ color: textColor }}>
              {product.name}
            </span>
          </nav>

          <div className="grid lg:grid-cols-2 gap-8 mb-12">
            {/* Product Gallery */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.35 }}
              className="space-y-4"
            >
              <div
                className="relative aspect-square rounded-2xl overflow-hidden group"
                style={{
                  borderRadius: borderRadius,
                  backgroundColor: "rgba(0,0,0,0.02)",
                }}
              >
                <AnimatePresence mode="wait">
                  <motion.img
                    key={currentImage}
                    src={images[currentImage]}
                    alt={product.name}
                    initial={{ opacity: 0, scale: 1.02 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    style={{ display: images.length ? "block" : "none" }}
                  />
                </AnimatePresence>
                {!images.length && (
                  <div
                    className="w-full h-full flex items-center justify-center"
                    style={{ color: textSecondaryColor }}
                  >
                    <Package size={64} />
                  </div>
                )}

                <div className="absolute top-4 left-4 flex flex-col gap-2">
                  {product.featured && (
                    <span className="badge badge-accent px-3 py-1">Featured</span>
                  )}
                  {promo && (
                    <span
                      className="badge px-3 py-1"
                      style={{ backgroundColor: accentColor, color: "#FFFFFF" }}
                    >
                      −{discountPercent(product)}%
                    </span>
                  )}
                  {!inStock && (
                    <span
                      className="badge px-3 py-1"
                      style={{ backgroundColor: "#EF4444", color: "white" }}
                    >
                      Out of Stock
                    </span>
                  )}
                  {lowStock && (
                    <span
                      className="badge px-3 py-1"
                      style={{ backgroundColor: "#F59E0B", color: "white" }}
                    >
                      Only {product.stock} Left
                    </span>
                  )}
                </div>
              </div>

              {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {images.map((img, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImage(index)}
                      className="flex-shrink-0 w-20 h-20 overflow-hidden transition-all"
                      style={{
                        borderRadius: borderRadius,
                        border: `2px solid ${currentImage === index ? primaryColor : "transparent"}`,
                      }}
                    >
                      <img
                        src={img}
                        alt={`${product.name} ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Product Info */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.35 }}
              className="space-y-6"
            >
              <div>
                {product.category && (
                  <Link
                    href={`/storefront/${validUserId}/products?category=${encodeURIComponent(product.category)}`}
                    className="text-sm font-medium px-3 py-1 rounded-full inline-block"
                    style={{
                      backgroundColor: primaryColor + "15",
                      color: primaryColor,
                    }}
                  >
                    {product.category}
                  </Link>
                )}
                <h1
                  className="text-3xl md:text-4xl font-bold mt-2 mb-3"
                  style={{
                    color: textColor,
                    fontFamily: storeSettings?.heading_font_family,
                  }}
                >
                  {product.name}
                </h1>

                {enableReviews && reviewCount > 0 && (
                  <div className="flex items-center gap-2 mb-3">
                    <Stars value={avgRating} size={16} />
                    <span className="text-sm font-medium" style={{ color: textColor }}>
                      {avgRating.toFixed(1)}
                    </span>
                    <button
                      className="text-sm underline"
                      style={{ color: textSecondaryColor }}
                      onClick={() => setActiveTab("reviews")}
                    >
                      {reviewCount} review{reviewCount !== 1 ? "s" : ""}
                    </button>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-4 mb-4">
                  <div className="text-3xl font-bold" style={{ color: accentColor }}>
                    {promo && (
                      <span className="text-lg line-through opacity-50 mr-2" style={{ color: textColor }}>
                        {money(product.price)}
                      </span>
                    )}
                    {money(effectivePrice)}
                  </div>
                  <div
                    className="flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium"
                    style={{
                      backgroundColor: inStock
                        ? lowStock
                          ? "#FEF3C7"
                          : "#DCFCE7"
                        : "#FEE2E2",
                      color: inStock ? (lowStock ? "#92400E" : "#166534") : "#991B1B",
                    }}
                  >
                    {inStock
                      ? lowStock
                        ? `Only ${product.stock} left in stock`
                        : `${product.stock} in stock`
                      : "Out of stock"}
                  </div>
                </div>

                {Array.isArray(product.seo_keywords) &&
                  product.seo_keywords.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {product.seo_keywords.slice(0, 5).map((keyword, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 text-sm rounded-full border"
                          style={{
                            backgroundColor: primaryColor + "10",
                            borderColor: primaryColor + "33",
                            color: primaryColor,
                          }}
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>
                  )}
              </div>

              {product.description && (
                <p style={{ color: textSecondaryColor, lineHeight: 1.7 }}>
                  {product.description}
                </p>
              )}

              {/* Quantity & Add to Cart */}
              <div
                className="flex flex-col sm:flex-row gap-4 p-6 rounded-xl"
                style={{ backgroundColor: "rgba(0,0,0,0.02)", borderRadius: borderRadius }}
              >
                <div className="flex items-center gap-4">
                  <label
                    className="text-sm font-medium"
                    style={{ color: textColor }}
                    htmlFor="qty"
                  >
                    Quantity
                  </label>
                  <div
                    className="flex items-center gap-2 border rounded-lg"
                    style={{ borderColor: borderColor }}
                  >
                    <button
                      onClick={() => setSelectedQuantity(Math.max(1, selectedQuantity - 1))}
                      aria-label="Decrease quantity"
                      className="p-3 hover:bg-black/5 rounded-l-lg"
                      style={{ color: textSecondaryColor }}
                    >
                      <Minus size={18} />
                    </button>
                    <input
                      id="qty"
                      type="number"
                      value={selectedQuantity}
                      onChange={(e) =>
                        setSelectedQuantity(
                          Math.max(1, Math.min(Number(product.stock) || 1, parseInt(e.target.value, 10) || 1)),
                        )
                      }
                      min="1"
                      max={product.stock}
                      className="w-16 text-center border-x font-medium"
                      style={{
                        borderColor: borderColor,
                        color: textColor,
                        backgroundColor: "transparent",
                      }}
                    />
                    <button
                      onClick={() =>
                        setSelectedQuantity(
                          Math.min(Number(product.stock) || 1, selectedQuantity + 1),
                        )
                      }
                      aria-label="Increase quantity"
                      className="p-3 hover:bg-black/5 rounded-r-lg"
                      style={{ color: textSecondaryColor }}
                    >
                      <Plus size={18} />
                    </button>
                  </div>
                </div>

                <div className="flex-1 flex gap-3">
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={handleAddToCart}
                    disabled={!inStock}
                    className="btn-primary flex-1 py-4"
                  >
                    <ShoppingCart size={20} />
                    {inStock ? "Add to Cart" : "Out of Stock"}
                  </motion.button>
                  <button
                    onClick={handleShare}
                    aria-label="Share"
                    className="btn-outline p-4"
                    style={{ borderColor: borderColor, color: textColor }}
                  >
                    <Share2 size={20} />
                  </button>
                  <button
                    onClick={handleWishlist}
                    aria-label={saved ? "Remove from wishlist" : "Add to wishlist"}
                    className="btn-outline p-4"
                    style={{
                      borderColor: saved ? primaryColor : borderColor,
                      color: saved ? primaryColor : textColor,
                      backgroundColor: saved ? primaryColor + "10" : "transparent",
                    }}
                  >
                    <Heart size={20} fill={saved ? primaryColor : "none"} />
                  </button>
                </div>
              </div>

              {/* Trust Badges */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div
                  className="flex items-center gap-3 p-4 rounded-xl"
                  style={{ backgroundColor: "rgba(0,0,0,0.02)", borderRadius: borderRadius }}
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: primaryColor + "15", color: primaryColor }}
                  >
                    <Truck size={20} />
                  </div>
                  <div>
                    <p className="font-medium text-sm" style={{ color: textColor }}>
                      {freeShippingThreshold > 0 ? "Free Shipping" : "Fast Shipping"}
                    </p>
                    <p className="text-xs" style={{ color: textSecondaryColor }}>
                      {freeShippingThreshold > 0
                        ? `On orders over ${money(freeShippingThreshold)}`
                        : shippingFee > 0
                          ? `Flat ${money(shippingFee)} delivery`
                          : "Delivery calculated at checkout"}
                    </p>
                  </div>
                </div>
                <div
                  className="flex items-center gap-3 p-4 rounded-xl"
                  style={{ backgroundColor: "rgba(0,0,0,0.02)", borderRadius: borderRadius }}
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: primaryColor + "15", color: primaryColor }}
                  >
                    <Shield size={20} />
                  </div>
                  <div>
                    <p className="font-medium text-sm" style={{ color: textColor }}>
                      Secure Payment
                    </p>
                    <p className="text-xs" style={{ color: textSecondaryColor }}>
                      Cash on delivery and more
                    </p>
                  </div>
                </div>
                <div
                  className="flex items-center gap-3 p-4 rounded-xl"
                  style={{ backgroundColor: "rgba(0,0,0,0.02)", borderRadius: borderRadius }}
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: primaryColor + "15", color: primaryColor }}
                  >
                    <RotateCcw size={20} />
                  </div>
                  <div>
                    <p className="font-medium text-sm" style={{ color: textColor }}>
                      Easy Returns
                    </p>
                    <p className="text-xs" style={{ color: textSecondaryColor }}>
                      30-day policy
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Tabs */}
          {storeSettings?.show_product_tabs !== false && (
            <div
              className="card overflow-hidden"
              style={{ borderRadius: borderRadius, borderColor: borderColor }}
            >
              <div
                className="border-b flex gap-1 p-1 overflow-x-auto"
                style={{ borderColor: borderColor }}
              >
                {tabs.map((tab) => {
                  const active = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className="flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
                      style={{
                        backgroundColor: active ? primaryColor : "transparent",
                        color: active ? "#FFFFFF" : textSecondaryColor,
                      }}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              <div className="p-6 min-h-[220px]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.2 }}
                    style={{ fontFamily: storeSettings?.font_family }}
                  >
                    {activeTab === "description" && (
                      <div>
                        <h3
                          className="text-lg font-semibold mb-4"
                          style={{ color: textColor }}
                        >
                          Product Description
                        </h3>
                        <div
                          className="prose max-w-none whitespace-pre-wrap"
                          style={{ color: textSecondaryColor, lineHeight: 1.8 }}
                        >
                          {product.description || "No description available."}
                        </div>
                      </div>
                    )}

                    {activeTab === "details" && (
                      <div>
                        <h3
                          className="text-lg font-semibold mb-4"
                          style={{ color: textColor }}
                        >
                          Product Details
                        </h3>
                        <dl className="grid grid-cols-2 gap-4">
                          {[
                            { label: "Category", value: product.category || "N/A" },
                            { label: "Availability", value: inStock ? "In stock" : "Out of stock" },
                            { label: "In stock", value: `${product.stock} units` },
                            { label: "Sold", value: `${Number(product.sold) || 0}` },
                            {
                              label: "Added",
                              value: product.created_at
                                ? new Date(product.created_at).toLocaleDateString()
                                : "N/A",
                            },
                            { label: "Reference", value: `#${product.id}` },
                          ].map((row) => (
                            <div key={row.label}>
                              <dt className="text-sm" style={{ color: textSecondaryColor }}>
                                {row.label}
                              </dt>
                              <dd className="font-medium" style={{ color: textColor }}>
                                {row.value}
                              </dd>
                            </div>
                          ))}
                        </dl>
                      </div>
                    )}

                    {activeTab === "shipping" && (
                      <div>
                        <h3
                          className="text-lg font-semibold mb-4"
                          style={{ color: textColor }}
                        >
                          Shipping & Returns
                        </h3>
                        <div className="space-y-4">
                          <div
                            className="flex items-start gap-3 p-4 rounded-xl"
                            style={{
                              backgroundColor: "rgba(0,0,0,0.02)",
                              borderRadius: borderRadius,
                            }}
                          >
                            <div
                              className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                              style={{
                                backgroundColor: primaryColor + "15",
                                color: primaryColor,
                              }}
                            >
                              <Truck size={20} />
                            </div>
                            <div>
                              <h4 className="font-medium mb-1" style={{ color: textColor }}>
                                Shipping Information
                              </h4>
                              <p className="text-sm" style={{ color: textSecondaryColor }}>
                                {content.shipping_policy ||
                                  `Orders are prepared and shipped within 24 to 48 hours. ${
                                    freeShippingThreshold > 0
                                      ? `Free shipping on orders over ${money(freeShippingThreshold)}. `
                                      : ""
                                  }${shippingFee > 0 ? `Standard delivery costs ${money(shippingFee)}.` : "Delivery fees are confirmed with you by phone."}`}
                              </p>
                            </div>
                          </div>
                          <div
                            className="flex items-start gap-3 p-4 rounded-xl"
                            style={{
                              backgroundColor: "rgba(0,0,0,0.02)",
                              borderRadius: borderRadius,
                            }}
                          >
                            <div
                              className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                              style={{
                                backgroundColor: primaryColor + "15",
                                color: primaryColor,
                              }}
                            >
                              <RotateCcw size={20} />
                            </div>
                            <div>
                              <h4 className="font-medium mb-1" style={{ color: textColor }}>
                                Return Policy
                              </h4>
                              <p className="text-sm" style={{ color: textSecondaryColor }}>
                                {content.return_policy ||
                                  "You have 30 days to return an item in its original condition. Refunds are issued once the return is received and inspected."}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTab === "reviews" && enableReviews && (
                      <div>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
                          <div className="text-center">
                            <p
                              className="text-4xl font-bold"
                              style={{ color: textColor }}
                            >
                              {reviewCount
                                ? avgRating.toFixed(1)
                                : reviews.length
                                  ? (
                                      reviews.reduce((s, r) => s + r.rating, 0) /
                                      reviews.length
                                    ).toFixed(1)
                                  : "—"}
                            </p>
                            <Stars
                              value={
                                reviewCount
                                  ? avgRating
                                  : reviews.reduce((s, r) => s + r.rating, 0) /
                                    (reviews.length || 1)
                              }
                              size={16}
                            />
                            <p className="text-sm mt-1" style={{ color: textSecondaryColor }}>
                              {reviewCount || reviews.length} review
                              {(reviewCount || reviews.length) !== 1 ? "s" : ""}
                            </p>
                          </div>

                          <div className="flex-1">
                            <form onSubmit={submitReview} className="space-y-2">
                              <div className="flex flex-wrap items-center gap-3">
                                <input
                                  type="text"
                                  required
                                  value={reviewForm.customer_name}
                                  onChange={(e) =>
                                    setReviewForm({
                                      ...reviewForm,
                                      customer_name: e.target.value,
                                    })
                                  }
                                  placeholder="Your name"
                                  className="input-field py-2 text-sm flex-1 min-w-[160px]"
                                  style={{ borderColor: borderColor }}
                                />
                                <select
                                  value={reviewForm.rating}
                                  onChange={(e) =>
                                    setReviewForm({
                                      ...reviewForm,
                                      rating: Number(e.target.value),
                                    })
                                  }
                                  className="input-field py-2 text-sm w-auto"
                                  style={{ borderColor: borderColor }}
                                  aria-label="Rating"
                                >
                                  {[5, 4, 3, 2, 1].map((n) => (
                                    <option key={n} value={n}>
                                      {n} star{n > 1 ? "s" : ""}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  value={reviewForm.comment}
                                  onChange={(e) =>
                                    setReviewForm({
                                      ...reviewForm,
                                      comment: e.target.value,
                                    })
                                  }
                                  placeholder="Share your experience (optional)"
                                  className="input-field py-2 text-sm flex-1"
                                  style={{ borderColor: borderColor }}
                                />
                                <button
                                  type="submit"
                                  disabled={submittingReview}
                                  className="btn-primary px-5 py-2 text-sm"
                                >
                                  {submittingReview ? "Sending..." : "Post"}
                                </button>
                              </div>
                            </form>
                          </div>
                        </div>

                        {reviews.length === 0 ? (
                          <p
                            className="text-center py-8"
                            style={{ color: textSecondaryColor }}
                          >
                            No reviews yet. Be the first to review this product!
                          </p>
                        ) : (
                          <div className="space-y-4">
                            {reviews.map((review) => (
                              <div
                                key={review.id}
                                className="p-4 rounded-xl"
                                style={{
                                  backgroundColor: "rgba(0,0,0,0.02)",
                                  borderRadius: borderRadius,
                                }}
                              >
                                <div className="flex items-center justify-between gap-2 mb-2">
                                  <span
                                    className="font-medium text-sm"
                                    style={{ color: textColor }}
                                  >
                                    {review.customer_name}
                                  </span>
                                  <span
                                    className="text-xs"
                                    style={{ color: textSecondaryColor }}
                                  >
                                    {review.date
                                      ? new Date(review.date).toLocaleDateString()
                                      : ""}
                                  </span>
                                </div>
                                <Stars value={review.rating} size={14} />
                                {review.comment && (
                                  <p
                                    className="text-sm mt-2"
                                    style={{ color: textSecondaryColor, lineHeight: 1.7 }}
                                  >
                                    {review.comment}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Related Products */}
      {storeSettings?.show_related_products !== false && relatedProducts.length > 0 && (
        <section className="py-16" style={{ backgroundColor: "rgba(0,0,0,0.02)" }}>
          <div className={`${containerWidth} mx-auto px-4 sm:px-6 lg:px-8`}>
            <h2
              className="text-3xl font-bold mb-8"
              style={{
                color: textColor,
                fontFamily: storeSettings?.heading_font_family,
              }}
            >
              {relatedTitle}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((relatedProduct, i) => (
                <motion.div
                  key={relatedProduct.id}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.3, delay: i * 0.06 }}
                  className="card group cursor-pointer"
                  style={{ borderRadius: borderRadius, borderColor: borderColor }}
                  onClick={() =>
                    router.push(`/storefront/${validUserId}/product/${relatedProduct.id}`)
                  }
                >
                  <div className="aspect-square relative overflow-hidden">
                    {relatedProduct.image_url ? (
                      <img
                        src={assetUrl(relatedProduct.image_url)}
                        alt={relatedProduct.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div
                        className="w-full h-full flex items-center justify-center"
                        style={{ color: textSecondaryColor }}
                      >
                        <ShoppingCart size={32} />
                      </div>
                    )}
                    {relatedProduct.featured && (
                      <span className="absolute top-2 left-2 badge badge-accent">
                        Featured
                      </span>
                    )}
                  </div>
                  <div className="p-4">
                    <p
                      className="text-sm font-medium truncate"
                      style={{ color: textColor }}
                    >
                      {relatedProduct.name}
                    </p>
                    <p className="font-bold mt-1" style={{ color: accentColor }}>
                      {money(priceOf(relatedProduct))}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}
    </StorefrontLayout>
  );
}
