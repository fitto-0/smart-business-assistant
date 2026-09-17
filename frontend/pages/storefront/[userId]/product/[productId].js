import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Head from "next/head";
import axios from "axios";
import {
  ArrowLeft,
  Heart,
  Share2,
  ShoppingCart,
  Mail,
  Phone,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Star,
  Truck,
  Shield,
  RotateCcw,
  CheckCircle,
  X,
  Minus,
  Plus,
} from "lucide-react";
import { motion } from "framer-motion";
import StorefrontLayout from "../../../../components/storefront/StorefrontLayout";

export default function ProductDetailPage() {
  const router = useRouter();
  const { userId, productId } = router.query;

  const [storeSettings, setStoreSettings] = useState(null);
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentImage, setCurrentImage] = useState(0);
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [showQuickView, setShowQuickView] = useState(false);

  const API_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
  const validUserId =
    userId && !isNaN(parseInt(userId)) ? parseInt(userId) : null;
  const validProductId =
    productId && !isNaN(parseInt(productId)) ? parseInt(productId) : null;

  useEffect(() => {
    if (validUserId && validProductId && router.isReady) {
      fetchProduct();
      fetchRelatedProducts();
      fetchStoreSettings();
    }
  }, [validUserId, validProductId, router.isReady]);

  const fetchStoreSettings = async () => {
    try {
      const res = await axios.get(
        `${API_URL}/store-settings/public/${validUserId}`,
      );
      setStoreSettings(res.data);
    } catch (err) {
      console.error("Error fetching store settings:", err);
    }
  };

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${API_URL}/storefront/${validUserId}/products/${validProductId}`,
      );
      setProduct(response.data);
      setCurrentImage(0);
    } catch (err) {
      setError("Product not found");
      console.error("Error fetching product:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatedProducts = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/storefront/${validUserId}?limit=4`,
      );
      setRelatedProducts(
        response.data.products
          .filter((p) => p.id !== validProductId)
          .slice(0, 4),
      );
    } catch (err) {
      console.error("Error fetching recommendations:", err);
    }
  };

  const handleAddToCart = () => {
    if (!product) return;

    // Get existing cart
    const saved = localStorage.getItem(`cart_${validUserId}`);
    const cart = saved ? JSON.parse(saved) : [];

    const existing = cart.find((item) => item.id === product.id);
    if (existing) {
      existing.quantity += selectedQuantity;
    } else {
      cart.push({ ...product, quantity: selectedQuantity });
    }

    localStorage.setItem(`cart_${validUserId}`, JSON.stringify(cart));

    // Show notification
    alert(`${product.name} added to cart!`);
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
        console.error("Share failed:", err);
      }
    }
  };

  if (loading) {
    return (
      <StorefrontLayout
        storeSettings={storeSettings}
        userId={validUserId}
        pageTitle="Loading..."
      >
        <div className="store-container py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[var(--store-primary)] border-t-transparent mx-auto"></div>
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
            The product you're looking for doesn't exist or has been removed.
          </p>
          <a href={`/storefront/${userId}/products`} className="btn-primary">
            Browse Products
          </a>
        </div>
      </StorefrontLayout>
    );
  }

  const primaryColor = storeSettings?.primary_color || "#3B82F6";
  const secondaryColor = storeSettings?.secondary_color || "#1E40AF";
  const accentColor = storeSettings?.accent_color || "#F59E0B";
  const textColor = storeSettings?.text_color || "#1F2937";
  const textSecondaryColor = storeSettings?.text_secondary_color || "#6B7280";
  const backgroundColor = storeSettings?.background_color || "#FFFFFF";
  const containerWidth = storeSettings?.container_width || "max-w-7xl";
  const borderRadius = storeSettings?.border_radius || "0.75rem";
  const borderColor = storeSettings?.border_color || "#E5E7EB";
  const galleryLayout = storeSettings?.product_gallery_layout || "thumbnails";

  const images = product.image_url ? [product.image_url] : [];
  const inStock = product.stock > 0;
  const lowStock = product.stock > 0 && product.stock <= 10;

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
            <Link
              href={`/storefront/${userId}`}
              className="hover:text-[var(--store-primary)] transition-colors"
            >
              Home
            </Link>
            <ChevronRight size={16} />
            <Link
              href={`/storefront/${userId}/products`}
              className="hover:text-[var(--store-primary)] transition-colors"
            >
              Products
            </Link>
            <ChevronRight size={16} />
            <span
              className="truncate max-w-[200px]"
              style={{ color: textColor }}
            >
              {product.name}
            </span>
          </nav>

          <div className="grid lg:grid-cols-2 gap-8 mb-12">
            {/* Product Gallery */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              {/* Main Image */}
              <div
                className="relative aspect-square rounded-2xl overflow-hidden"
                style={{
                  borderRadius: borderRadius,
                  backgroundColor: "rgba(0,0,0,0.02)",
                }}
              >
                {images.length > 0 ? (
                  <img
                    src={images[currentImage]}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center"
                    style={{ color: textSecondaryColor }}
                  >
                    <ShoppingCart size={64} />
                  </div>
                )}

                {/* Badges */}
                <div className="absolute top-4 left-4 flex flex-col gap-2">
                  {product.featured && (
                    <span className="badge badge-accent px-3 py-1">
                      Featured
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

                {/* Navigation Arrows */}
                {images.length > 1 && (
                  <>
                    <button
                      onClick={() =>
                        setCurrentImage(
                          (prev) => (prev - 1 + images.length) % images.length,
                        )
                      }
                      className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center transition-colors"
                      style={{
                        backgroundColor: "rgba(255,255,255,0.9)",
                        color: textColor,
                      }}
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <button
                      onClick={() =>
                        setCurrentImage((prev) => (prev + 1) % images.length)
                      }
                      className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center transition-colors"
                      style={{
                        backgroundColor: "rgba(255,255,255,0.9)",
                        color: textColor,
                      }}
                    >
                      <ChevronRight size={20} />
                    </button>
                  </>
                )}
              </div>

              {/* Thumbnails */}
              {images.length > 1 && galleryLayout === "thumbnails" && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {images.map((img, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImage(index)}
                      className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                        currentImage === index
                          ? `border-[${primaryColor}]`
                          : `border-transparent hover:border-[${primaryColor}]`
                      }`}
                      style={{ borderRadius: borderRadius }}
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
              className="space-y-6"
            >
              <div>
                <span
                  className="text-sm font-medium px-3 py-1 rounded-full"
                  style={{
                    backgroundColor: primaryColor + "15",
                    color: primaryColor,
                  }}
                >
                  {product.category}
                </span>
                <h1
                  className="text-3xl md:text-4xl font-bold mt-2 mb-4"
                  style={{
                    color: textColor,
                    fontFamily: storeSettings?.heading_font_family,
                  }}
                >
                  {product.name}
                </h1>

                <div className="flex items-center gap-4 mb-4">
                  <div
                    className="text-3xl font-bold"
                    style={{ color: accentColor }}
                  >
                    {parseFloat(product.price).toFixed(2)} DA
                  </div>
                  <div
                    className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                      inStock
                        ? lowStock
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {inStock
                      ? lowStock
                        ? `Only ${product.stock} left in stock`
                        : `${product.stock} in stock`
                      : "Out of stock"}
                  </div>
                </div>

                {product.seo_keywords && product.seo_keywords.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {product.seo_keywords.slice(0, 5).map((keyword, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 text-sm rounded-full border"
                        style={{
                          backgroundColor: primaryColor + "15",
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

              {/* Quantity & Add to Cart */}
              <div
                className="flex flex-col sm:flex-row gap-4 p-6 rounded-xl"
                style={{
                  backgroundColor: "rgba(0,0,0,0.02)",
                  borderRadius: borderRadius,
                }}
              >
                <div className="flex items-center gap-4">
                  <label
                    className="text-sm font-medium"
                    style={{ color: textColor }}
                  >
                    Quantity:
                  </label>
                  <div
                    className="flex items-center gap-2 border rounded-lg"
                    style={{ borderColor: borderColor }}
                  >
                    <button
                      onClick={() =>
                        setSelectedQuantity(Math.max(1, selectedQuantity - 1))
                      }
                      className="p-3 text-[var(--store-text-secondary)] hover:bg-gray-100 rounded-l-lg"
                      style={{ color: textSecondaryColor }}
                    >
                      <Minus size={20} />
                    </button>
                    <input
                      type="number"
                      value={selectedQuantity}
                      onChange={(e) =>
                        setSelectedQuantity(
                          Math.max(1, parseInt(e.target.value) || 1),
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
                          Math.min(product.stock, selectedQuantity + 1),
                        )
                      }
                      className="p-3 text-[var(--store-text-secondary)] hover:bg-gray-100 rounded-r-lg"
                      style={{ color: textSecondaryColor }}
                    >
                      <Plus size={20} />
                    </button>
                  </div>
                </div>

                <div className="flex-1 flex gap-3">
                  <button
                    onClick={handleAddToCart}
                    disabled={!inStock}
                    className="btn-primary flex-1 flex items-center justify-center gap-2 py-4"
                  >
                    <ShoppingCart size={20} />
                    {inStock ? "Add to Cart" : "Out of Stock"}
                  </button>
                  <button
                    onClick={handleShare}
                    className="btn-outline p-4"
                    style={{ borderColor: borderColor, color: textColor }}
                  >
                    <Share2 size={20} />
                  </button>
                  <button
                    className="btn-outline p-4"
                    style={{ borderColor: borderColor, color: textColor }}
                  >
                    <Heart size={20} />
                  </button>
                </div>
              </div>

              {/* Trust Badges */}
              <div className="grid grid-cols-3 gap-4">
                <div
                  className="flex items-center gap-3 p-4 rounded-xl"
                  style={{
                    backgroundColor: "rgba(0,0,0,0.02)",
                    borderRadius: borderRadius,
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{
                      backgroundColor: primaryColor + "15",
                      color: primaryColor,
                    }}
                  >
                    <Truck size={20} />
                  </div>
                  <div>
                    <p
                      className="font-medium text-sm"
                      style={{ color: textColor }}
                    >
                      Free Shipping
                    </p>
                    <p
                      className="text-xs"
                      style={{ color: textSecondaryColor }}
                    >
                      On orders over $50
                    </p>
                  </div>
                </div>
                <div
                  className="flex items-center gap-3 p-4 rounded-xl"
                  style={{
                    backgroundColor: "rgba(0,0,0,0.02)",
                    borderRadius: borderRadius,
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{
                      backgroundColor: primaryColor + "15",
                      color: primaryColor,
                    }}
                  >
                    <Shield size={20} />
                  </div>
                  <div>
                    <p
                      className="font-medium text-sm"
                      style={{ color: textColor }}
                    >
                      Secure Payment
                    </p>
                    <p
                      className="text-xs"
                      style={{ color: textSecondaryColor }}
                    >
                      100% protected
                    </p>
                  </div>
                </div>
                <div
                  className="flex items-center gap-3 p-4 rounded-xl"
                  style={{
                    backgroundColor: "rgba(0,0,0,0.02)",
                    borderRadius: borderRadius,
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{
                      backgroundColor: primaryColor + "15",
                      color: primaryColor,
                    }}
                  >
                    <RotateCcw size={20} />
                  </div>
                  <div>
                    <p
                      className="font-medium text-sm"
                      style={{ color: textColor }}
                    >
                      Easy Returns
                    </p>
                    <p
                      className="text-xs"
                      style={{ color: textSecondaryColor }}
                    >
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
              className="card"
              style={{ borderRadius: borderRadius, borderColor: borderColor }}
            >
              <div
                className="border-b flex gap-1 p-1"
                style={{ borderColor: borderColor }}
              >
                {[
                  { id: "description", label: "Description", icon: null },
                  { id: "details", label: "Details", icon: null },
                  { id: "shipping", label: "Shipping & Returns", icon: null },
                  { id: "reviews", label: "Reviews", icon: null },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-colors ${
                      tab.id === "description"
                        ? `bg-[${primaryColor}] text-white`
                        : `text-[${textSecondaryColor}] hover:text-[${textColor}] hover:bg-gray-100`
                    }`}
                    style={{
                      color:
                        tab.id === "description" ? "white" : textSecondaryColor,
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="p-6">
                <div
                  id="description"
                  style={{ fontFamily: storeSettings?.font_family }}
                >
                  <h3
                    className="text-lg font-semibold mb-4"
                    style={{ color: textColor }}
                  >
                    Product Description
                  </h3>
                  <div
                    className="prose max-w-none"
                    style={{ color: textSecondaryColor, lineHeight: 1.8 }}
                  >
                    {product.description || "No description available."}
                  </div>

                  {product.ai_enhanced_description && (
                    <div
                      className="mt-6 p-4 rounded-xl border-l-4"
                      style={{
                        backgroundColor: primaryColor + "10",
                        borderColor: primaryColor,
                        borderRadius: borderRadius,
                      }}
                    >
                      <p
                        className="text-sm font-medium mb-2"
                        style={{ color: primaryColor }}
                      >
                        AI Enhanced Description
                      </p>
                      <p style={{ color: textSecondaryColor }}>
                        {product.ai_enhanced_description}
                      </p>
                    </div>
                  )}
                </div>

                <div
                  id="details"
                  className="hidden"
                  style={{ fontFamily: storeSettings?.font_family }}
                >
                  <h3
                    className="text-lg font-semibold mb-4"
                    style={{ color: textColor }}
                  >
                    Product Details
                  </h3>
                  <dl className="grid grid-cols-2 gap-4">
                    <div>
                      <dt
                        className="text-sm"
                        style={{ color: textSecondaryColor }}
                      >
                        Category
                      </dt>
                      <dd className="font-medium" style={{ color: textColor }}>
                        {product.category}
                      </dd>
                    </div>
                    <div>
                      <dt
                        className="text-sm"
                        style={{ color: textSecondaryColor }}
                      >
                        Stock
                      </dt>
                      <dd className="font-medium" style={{ color: textColor }}>
                        {product.stock} units
                      </dd>
                    </div>
                    <div>
                      <dt
                        className="text-sm"
                        style={{ color: textSecondaryColor }}
                      >
                        SKU
                      </dt>
                      <dd
                        className="font-medium font-mono text-sm"
                        style={{ color: textColor }}
                      >
                        {product.sku || "N/A"}
                      </dd>
                    </div>
                    <div>
                      <dt
                        className="text-sm"
                        style={{ color: textSecondaryColor }}
                      >
                        Weight
                      </dt>
                      <dd className="font-medium" style={{ color: textColor }}>
                        {product.weight || "N/A"}
                      </dd>
                    </div>
                    <div>
                      <dt
                        className="text-sm"
                        style={{ color: textSecondaryColor }}
                      >
                        Dimensions
                      </dt>
                      <dd className="font-medium" style={{ color: textColor }}>
                        {product.dimensions || "N/A"}
                      </dd>
                    </div>
                    <div>
                      <dt
                        className="text-sm"
                        style={{ color: textSecondaryColor }}
                      >
                        Added
                      </dt>
                      <dd className="font-medium" style={{ color: textColor }}>
                        {product.created_at
                          ? new Date(product.created_at).toLocaleDateString()
                          : "N/A"}
                      </dd>
                    </div>
                  </dl>
                </div>

                <div
                  id="shipping"
                  className="hidden"
                  style={{ fontFamily: storeSettings?.font_family }}
                >
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
                        <h4
                          className="font-medium mb-1"
                          style={{ color: textColor }}
                        >
                          Shipping Information
                        </h4>
                        <p
                          className="text-sm"
                          style={{ color: textSecondaryColor }}
                        >
                          Standard shipping takes 5-7 business days. Express
                          shipping (2-3 days) is available at checkout. Free
                          shipping on orders over $50.
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
                        <h4
                          className="font-medium mb-1"
                          style={{ color: textColor }}
                        >
                          Return Policy
                        </h4>
                        <p
                          className="text-sm"
                          style={{ color: textSecondaryColor }}
                        >
                          We offer a 30-day return policy. Items must be in
                          original condition with tags attached. Refunds are
                          processed within 5-10 business days after we receive
                          the return.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  id="reviews"
                  className="hidden"
                  style={{ fontFamily: storeSettings?.font_family }}
                >
                  <h3
                    className="text-lg font-semibold mb-4"
                    style={{ color: textColor }}
                  >
                    Customer Reviews
                  </h3>
                  <p
                    className="text-center py-12"
                    style={{ color: textSecondaryColor }}
                  >
                    No reviews yet. Be the first to review this product!
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Related Products */}
      {storeSettings?.show_related_products !== false &&
        relatedProducts.length > 0 && (
          <section
            className="py-16"
            style={{ backgroundColor: "rgba(0,0,0,0.02)" }}
          >
            <div className={`${containerWidth} mx-auto px-4 sm:px-6 lg:px-8`}>
              <h2
                className="text-3xl font-bold mb-8"
                style={{
                  color: textColor,
                  fontFamily: storeSettings?.heading_font_family,
                }}
              >
                {storeSettings?.related_products_title || "You May Also Like"}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {relatedProducts.map((relatedProduct) => (
                  <div
                    key={relatedProduct.id}
                    className="card group"
                    style={{
                      borderRadius: borderRadius,
                      borderColor: borderColor,
                    }}
                  >
                    <Link
                      href={`/storefront/${userId}/product/${relatedProduct.id}`}
                    >
                      <div className="aspect-square relative overflow-hidden">
                        {relatedProduct.image_url ? (
                          <img
                            src={relatedProduct.image_url}
                            alt={relatedProduct.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
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
                        <p
                          className="font-bold mt-1"
                          style={{ color: accentColor }}
                        >
                          {parseFloat(relatedProduct.price).toFixed(2)} DA
                        </p>
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
    </StorefrontLayout>
  );
}
