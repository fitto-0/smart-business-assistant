import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Head from "next/head";
import axios from "axios";
import {
  ShoppingBag,
  ArrowRight,
  Star,
  Truck,
  Shield,
  RotateCcw,
  Heart,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import StorefrontLayout from "../../components/storefront/StorefrontLayout";
import ProductCard from "../../components/storefront/ProductCard";
import CategoryCard from "../../components/storefront/CategoryCard";

export default function StorefrontHomePage() {
  const router = useRouter();
  const { userId } = router.query;

  const [storeSettings, setStoreSettings] = useState(null);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  const API_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

  const validUserId =
    userId && !isNaN(parseInt(userId)) ? parseInt(userId) : null;

  useEffect(() => {
    if (!router.isReady) return;

    if (validUserId) {
      fetchAllData();
    } else {
      setError("Invalid storefront URL");
      setLoading(false);
    }
  }, [validUserId, router.isReady]);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [settingsRes, productsRes, categoriesRes] = await Promise.all([
        axios.get(`${API_URL}/store-settings/public/${validUserId}`),
        axios.get(`${API_URL}/storefront/${validUserId}?featured=true&limit=8`),
        axios.get(`${API_URL}/storefront/${validUserId}/categories`),
      ]);
      setStoreSettings(settingsRes.data);
      setFeaturedProducts(productsRes.data.products || []);
      setCategories(categoriesRes.data.categories || []);
    } catch (err) {
      console.error("Error fetching storefront data:", err);
      setError("Failed to load store");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <StorefrontLayout
        storeSettings={null}
        userId={validUserId}
        pageTitle="Loading..."
      >
        <div className="store-container py-16 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[var(--store-primary)] border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading store...</p>
        </div>
      </StorefrontLayout>
    );
  }

  if (error || !storeSettings) {
    return (
      <StorefrontLayout
        storeSettings={null}
        userId={validUserId}
        pageTitle="Error"
      >
        <div className="store-container py-16 text-center">
          <p className="text-red-500">{error || "Store not found"}</p>
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
  const backgroundType = storeSettings?.background_type || "color";
  const backgroundGradient = storeSettings?.background_gradient;
  const backgroundImageUrl = storeSettings?.background_image_url;
  const heroLayout = storeSettings?.hero_layout || "centered";
  const containerWidth = storeSettings?.container_width || "max-w-7xl";
  const content = storeSettings?.content_overrides || {};

  const features = [
    { icon: Truck, title: "Free Shipping", description: "On orders over $50" },
    {
      icon: Shield,
      title: "Secure Payment",
      description: "100% secure checkout",
    },
    {
      icon: RotateCcw,
      title: "Easy Returns",
      description: "30-day return policy",
    },
    {
      icon: Star,
      title: "Top Quality",
      description: "Premium products guaranteed",
    },
  ];

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Verified Buyer",
      content:
        "Amazing quality and fast shipping! Will definitely order again.",
      rating: 5,
    },
    {
      name: "Michael Chen",
      role: "Verified Buyer",
      content: "Best customer service I've experienced. Highly recommended!",
      rating: 5,
    },
    {
      name: "Emily Davis",
      role: "Verified Buyer",
      content: "Products exceeded my expectations. Great value for money.",
      rating: 5,
    },
  ];

  const nextSlide = () =>
    setCurrentSlide((prev) => (prev + 1) % (featuredProducts.length || 1));
  const prevSlide = () =>
    setCurrentSlide(
      (prev) =>
        (prev - 1 + (featuredProducts.length || 1)) %
        (featuredProducts.length || 1),
    );

  return (
    <StorefrontLayout
      storeSettings={storeSettings}
      userId={validUserId}
      pageTitle={storeSettings.store_name}
    >
      {/* Hero Section */}
      <section
        className="relative py-16 md:py-24 lg:py-32"
        style={{
          backgroundColor:
            backgroundType === "color" ? "transparent" : undefined,
          background:
            backgroundType === "gradient" && backgroundGradient
              ? backgroundGradient
              : undefined,
          backgroundImage:
            backgroundType === "image" && backgroundImageUrl
              ? `url(${backgroundImageUrl})`
              : undefined,
          backgroundSize: backgroundType === "image" ? "cover" : undefined,
          backgroundPosition: backgroundType === "image" ? "center" : undefined,
        }}
      >
        <div
          className={`${containerWidth} mx-auto px-4 sm:px-6 lg:px-8 relative`}
        >
          {heroLayout === "split" ? (
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h1
                  className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight"
                  style={{
                    color: textColor,
                    fontFamily: storeSettings.heading_font_family,
                  }}
                >
                  {storeSettings.hero_title || "Welcome to Our Store"}
                </h1>
                <p
                  className="text-lg md:text-xl mb-8 max-w-xl"
                  style={{ color: textSecondaryColor }}
                >
                  {storeSettings.hero_subtitle ||
                    "Discover amazing products at unbeatable prices. Quality you can trust."}
                </p>
                {storeSettings.hero_button_text && (
                  <a
                    href={
                      storeSettings.hero_button_link ||
                      `/storefront/${userId}/products`
                    }
                    className="btn-primary inline-flex items-center gap-2 text-lg px-8 py-4"
                  >
                    {storeSettings.hero_button_text}
                    <ArrowRight size={20} />
                  </a>
                )}
              </div>
              <div className="relative">
                {storeSettings.hero_image_url && (
                  <img
                    src={storeSettings.hero_image_url}
                    alt={storeSettings.store_name}
                    className="rounded-2xl shadow-2xl w-full"
                    style={{ borderRadius: storeSettings.border_radius }}
                  />
                )}
              </div>
            </div>
          ) : heroLayout === "fullwidth" ? (
            <div
              className="relative rounded-2xl overflow-hidden"
              style={{ borderRadius: storeSettings.border_radius }}
            >
              {storeSettings.hero_image_url && (
                <img
                  src={storeSettings.hero_image_url}
                  alt={storeSettings.store_name}
                  className="w-full h-[500px] object-cover"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent flex items-center">
                <div
                  className={`${containerWidth} mx-auto px-4 sm:px-6 lg:px-8`}
                >
                  <h1
                    className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight text-white"
                    style={{ fontFamily: storeSettings.heading_font_family }}
                  >
                    {storeSettings.hero_title || "Welcome to Our Store"}
                  </h1>
                  <p
                    className="text-lg md:text-xl mb-8 max-w-xl text-white/90"
                    style={{ fontFamily: storeSettings.font_family }}
                  >
                    {storeSettings.hero_subtitle ||
                      "Discover amazing products at unbeatable prices. Quality you can trust."}
                  </p>
                  {storeSettings.hero_button_text && (
                    <a
                      href={
                        storeSettings.hero_button_link ||
                        `/storefront/${userId}/products`
                      }
                      className="btn-primary inline-flex items-center gap-2 text-lg px-8 py-4"
                    >
                      {storeSettings.hero_button_text}
                      <ArrowRight size={20} />
                    </a>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center max-w-4xl mx-auto">
              <h1
                className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight"
                style={{
                  color: textColor,
                  fontFamily: storeSettings.heading_font_family,
                }}
              >
                {storeSettings.hero_title || "Welcome to Our Store"}
              </h1>
              <p
                className="text-lg md:text-xl mb-8"
                style={{ color: textSecondaryColor }}
              >
                {storeSettings.hero_subtitle ||
                  "Discover amazing products at unbeatable prices. Quality you can trust."}
              </p>
              {storeSettings.hero_button_text && (
                <a
                  href={
                    storeSettings.hero_button_link ||
                    `/storefront/${userId}/products`
                  }
                  className="btn-primary inline-flex items-center gap-2 text-lg px-8 py-4"
                >
                  {storeSettings.hero_button_text}
                  <ArrowRight size={20} />
                </a>
              )}
              {storeSettings.hero_image_url && (
                <div
                  className="mt-12 rounded-2xl overflow-hidden shadow-2xl"
                  style={{ borderRadius: storeSettings.border_radius }}
                >
                  <img
                    src={storeSettings.hero_image_url}
                    alt={storeSettings.store_name}
                    className="w-full"
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Features Bar */}
      <section
        className="py-8 border-y"
        style={{
          borderColor: storeSettings.border_color,
          backgroundColor: "rgba(0,0,0,0.02)",
        }}
      >
        <div className={`${containerWidth} mx-auto px-4 sm:px-6 lg:px-8`}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="flex items-center gap-4 p-4 rounded-xl hover:bg-white/50 transition-colors"
                style={{ borderRadius: storeSettings.border_radius }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{
                    backgroundColor: primaryColor + "15",
                    color: primaryColor,
                  }}
                >
                  <feature.icon size={24} />
                </div>
                <div>
                  <h3
                    className="font-semibold"
                    style={{
                      color: textColor,
                      fontFamily: storeSettings.heading_font_family,
                    }}
                  >
                    {feature.title}
                  </h3>
                  <p className="text-sm" style={{ color: textSecondaryColor }}>
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      {storeSettings.show_featured_products !== false &&
        featuredProducts.length > 0 && (
          <section className="py-16">
            <div className={`${containerWidth} mx-auto px-4 sm:px-6 lg:px-8`}>
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2
                    className="section-title"
                    style={{ fontFamily: storeSettings.heading_font_family }}
                  >
                    {content.featured_products_title || storeSettings.featured_products_title ||
                      "Featured Products"}
                  </h2>
                  <p
                    className="section-subtitle"
                    style={{ fontFamily: storeSettings.font_family }}
                  >
                    Handpicked selections just for you
                  </p>
                </div>
                <Link
                  href={`/storefront/${userId}/products`}
                  className="btn-outline hidden sm:inline-flex"
                >
                  {content.view_all || "View All"} <ArrowRight size={16} />
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {featuredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    userId={validUserId}
                    primaryColor={primaryColor}
                    accentColor={accentColor}
                    cardBackgroundColor={storeSettings.card_background_color}
                    cardTextColor={storeSettings.card_text_color || textColor}
                    borderColor={storeSettings.border_color}
                  />
                ))}
              </div>

              <div className="text-center mt-8 sm:hidden">
                <Link
                  href={`/storefront/${userId}/products`}
                  className="btn-primary inline-flex items-center gap-2"
                >
                  {content.view_all_products || "View All Products"} <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </section>
        )}

      {/* Categories Section */}
      {storeSettings.show_categories_section !== false &&
        categories.length > 0 && (
          <section
            className="py-16"
            style={{ backgroundColor: "rgba(0,0,0,0.02)" }}
          >
            <div className={`${containerWidth} mx-auto px-4 sm:px-6 lg:px-8`}>
              <div className="text-center mb-12">
                <h2
                  className="section-title"
                  style={{ fontFamily: storeSettings.heading_font_family }}
                >
                  {content.categories_title || storeSettings.categories_section_title || "Shop by Category"}
                </h2>
                <p
                  className="section-subtitle mt-2"
                  style={{ fontFamily: storeSettings.font_family }}
                >
                  Explore our product categories
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {categories.slice(0, 10).map((category) => (
                  <CategoryCard
                    key={category.category || category}
                    category={
                      typeof category === "string"
                        ? category
                        : category.category
                    }
                    count={category.count}
                    userId={validUserId}
                    primaryColor={primaryColor}
                  />
                ))}
              </div>

              <div className="text-center mt-8">
                <Link
                  href={`/storefront/${userId}/categories`}
                  className="btn-outline inline-flex items-center gap-2"
                >
                  View All Categories <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </section>
        )}

      {/* Testimonials */}
      {storeSettings.show_testimonials && (
        <section className="py-16">
          <div className={`${containerWidth} mx-auto px-4 sm:px-6 lg:px-8`}>
            <div className="text-center mb-12">
              <h2
                className="section-title"
                style={{ fontFamily: storeSettings.heading_font_family }}
              >
                What Our Customers Say
              </h2>
              <p
                className="section-subtitle mt-2"
                style={{ fontFamily: storeSettings.font_family }}
              >
                Real reviews from real customers
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {testimonials.map((testimonial, index) => (
                <div
                  key={index}
                  className="card p-6 text-center"
                  style={{ borderRadius: storeSettings.border_radius }}
                >
                  <div className="flex items-center justify-center gap-1 mb-4 text-yellow-400">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star
                        key={i}
                        size={20}
                        fill
                        className="text-yellow-400"
                      />
                    ))}
                  </div>
                  <p
                    className="mb-6"
                    style={{
                      color: textSecondaryColor,
                      fontFamily: storeSettings.font_family,
                    }}
                  >
                    "{testimonial.content}"
                  </p>
                  <div>
                    <p className="font-semibold" style={{ color: textColor }}>
                      {testimonial.name}
                    </p>
                    <p
                      className="text-sm"
                      style={{ color: textSecondaryColor }}
                    >
                      {testimonial.role}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Newsletter */}
      {storeSettings.show_newsletter && (
        <section className="py-16" style={{ backgroundColor: secondaryColor }}>
          <div
            className={`${containerWidth} mx-auto px-4 sm:px-6 lg:px-8 text-center`}
          >
            <h2
              className="text-3xl md:text-4xl font-bold mb-4 text-white"
              style={{ fontFamily: storeSettings.heading_font_family }}
            >
              {storeSettings.newsletter_title || "Subscribe to our newsletter"}
            </h2>
            <p
              className="text-white/80 mb-8 max-w-2xl mx-auto"
              style={{ fontFamily: storeSettings.font_family }}
            >
              {storeSettings.newsletter_subtitle ||
                "Get updates on new products, special offers, and more."}
            </p>
            <form
              className="max-w-md mx-auto flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                alert("Thanks for subscribing!");
              }}
            >
              <input
                type="email"
                placeholder="Enter your email"
                className="input-field flex-1"
                style={{
                  backgroundColor: "rgba(255,255,255,0.1)",
                  borderColor: "rgba(255,255,255,0.2)",
                  color: "white",
                }}
                required
              />
              <button type="submit" className="btn-accent px-6">
                Subscribe
              </button>
            </form>
          </div>
        </section>
      )}
    </StorefrontLayout>
  );
}
