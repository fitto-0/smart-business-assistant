import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import axios from "axios";
import {
  ArrowRight,
  Star,
  Truck,
  Shield,
  RotateCcw,
  Package,
  Heart,
  Clock,
} from "lucide-react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import StorefrontLayout from "../../components/storefront/StorefrontLayout";
import ProductCard from "../../components/storefront/ProductCard";
import CategoryCard from "../../components/storefront/CategoryCard";
import { assetUrl } from "../../lib/assetUrl";
import { money } from "../../lib/money";

const ICONS = { truck: Truck, shield: Shield, rotate: RotateCcw, star: Star, package: Package, heart: Heart, clock: Clock };

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } },
};

function HeroButton({ href, label, className, primaryColor, buttonTextColor }) {
  const isInternal = !href || href.startsWith("/");
  const style = { backgroundColor: primaryColor, color: buttonTextColor };
  if (isInternal) {
    return (
      <Link href={href || "#"} className={className} style={style}>
        {label} <ArrowRight size={20} />
      </Link>
    );
  }
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      style={style}
    >
      {label} <ArrowRight size={20} />
    </a>
  );
}

export default function StorefrontHomePage() {
  const router = useRouter();
  const { userId } = router.query;

  const [storeSettings, setStoreSettings] = useState(null);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterState, setNewsletterState] = useState("idle");

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
  const validUserId = userId && !isNaN(parseInt(userId)) ? parseInt(userId) : null;

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
      const [settingsRes, productsRes, categoriesRes, reviewsRes] =
        await Promise.all([
          axios.get(`${API_URL}/store-settings/public/${validUserId}`),
          axios.get(`${API_URL}/storefront/${validUserId}?featured=true&limit=8`),
          axios.get(`${API_URL}/storefront/${validUserId}/categories`),
          axios
            .get(`${API_URL}/storefront/${validUserId}/reviews?limit=6`)
            .catch(() => ({ data: { reviews: [] } })),
        ]);
      setStoreSettings(settingsRes.data);
      setCategories(categoriesRes.data.categories || []);
      setReviews(reviewsRes.data.reviews || []);

      let featured = productsRes.data.products || [];
      if (featured.length === 0) {
        const latest = await axios.get(
          `${API_URL}/storefront/${validUserId}?limit=8&sort=newest`,
        );
        featured = latest.data.products || [];
      }
      setFeaturedProducts(featured);
    } catch (err) {
      console.error("Error fetching storefront data:", err);
      setError("Failed to load store");
    } finally {
      setLoading(false);
    }
  };

  const subscribe = async (e) => {
    e.preventDefault();
    setNewsletterState("loading");
    try {
      await axios.post(`${API_URL}/storefront/${validUserId}/newsletter`, {
        email: newsletterEmail.trim(),
      });
      setNewsletterState("done");
      setNewsletterEmail("");
    } catch (err) {
      setNewsletterState("error");
      toast.error(err.response?.data?.error || "Subscription failed");
    }
  };

  if (loading) {
    return (
      <StorefrontLayout storeSettings={null} userId={validUserId} pageTitle="Loading...">
        <div className="store-container py-16 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[var(--store-primary)] border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading store...</p>
        </div>
      </StorefrontLayout>
    );
  }

  if (error || !storeSettings) {
    return (
      <StorefrontLayout storeSettings={null} userId={validUserId} pageTitle="Error">
        <div className="store-container py-16 text-center">
          <p className="text-red-500">{error || "Store not found"}</p>
        </div>
      </StorefrontLayout>
    );
  }

  const primaryColor = storeSettings.primary_color || "#3B82F6";
  const secondaryColor = storeSettings.secondary_color || "#1E40AF";
  const accentColor = storeSettings.accent_color || "#F59E0B";
  const textColor = storeSettings.text_color || "#1F2937";
  const textSecondaryColor = storeSettings.text_secondary_color || "#6B7280";
  const buttonTextColor = storeSettings.button_text_color || "#FFFFFF";
  const backgroundType = storeSettings.background_type || "color";
  const backgroundGradient = storeSettings.background_gradient;
  const backgroundImageUrl = storeSettings.background_image_url;
  const heroLayout = storeSettings.hero_layout || "centered";
  const containerWidth = storeSettings.container_width || "max-w-7xl";
  const content = storeSettings.content_overrides || {};

  const hasBackgroundGradient = backgroundType === "gradient" && Boolean(backgroundGradient);
  const hasBackgroundImage = backgroundType === "image" && Boolean(backgroundImageUrl);
  const heroBackgroundStyles = {
    backgroundColor: backgroundType === "color" ? "transparent" : undefined,
    backgroundImage: hasBackgroundGradient
      ? backgroundGradient
      : hasBackgroundImage
        ? `url(${assetUrl(backgroundImageUrl)})`
        : undefined,
    backgroundSize: hasBackgroundImage ? "cover" : undefined,
    backgroundPosition: hasBackgroundImage ? "center" : undefined,
  };

  const freeShippingThreshold = Number(content.free_shipping_threshold ?? 500);
  const shippingFee = Number(content.shipping_fee ?? 30);

  const defaultFeatures = [
    {
      icon: "truck",
      title: "Fast Delivery",
      description:
        freeShippingThreshold > 0
          ? `Free shipping over ${money(freeShippingThreshold)}`
          : shippingFee > 0
            ? `Delivery from ${money(shippingFee)}`
            : "Delivery nationwide",
    },
    {
      icon: "shield",
      title: "Secure Payment",
      description: "Pay on delivery, by card or transfer",
    },
    {
      icon: "rotate",
      title: "Easy Returns",
      description: "30-day return policy",
    },
    {
      icon: "star",
      title: "Quality Guaranteed",
      description: "Carefully selected products",
    },
  ];
  const features = Array.isArray(content.features) && content.features.length
    ? content.features.slice(0, 4)
    : defaultFeatures;

  const testimonials =
    Array.isArray(content.testimonials) && content.testimonials.length > 0
      ? content.testimonials
      : reviews.slice(0, 3).map((r) => ({
          name: r.customer_name,
          role: "Verified Buyer",
          content: r.comment,
          rating: r.rating,
        }));

  const heroTitle = storeSettings.hero_title || content.hero_title || "Welcome to Our Store";
  const heroSubtitle =
    storeSettings.hero_subtitle ||
    content.hero_subtitle ||
    "Discover our products at great prices. Quality you can trust.";
  const heroButtonLabel =
    storeSettings.hero_button_text || content.hero_button_text || "Shop Now";
  const heroButtonLink =
    storeSettings.hero_button_link || content.hero_button_link || "";

  const heroButtonClass =
    "btn-primary inline-flex items-center gap-2 text-lg px-8 py-4";

  const sectionHeader = (title, subtitle) => (
    <>
      <h2 className="section-title" style={{ fontFamily: storeSettings.heading_font_family }}>
        {title}
      </h2>
      {subtitle && (
        <p className="section-subtitle mt-2" style={{ fontFamily: storeSettings.font_family }}>
          {subtitle}
        </p>
      )}
    </>
  );

  return (
    <StorefrontLayout
      storeSettings={storeSettings}
      userId={validUserId}
      pageTitle={storeSettings.store_name}
    >
      {/* Hero Section */}
      <section className="relative py-16 md:py-24 lg:py-32" style={heroBackgroundStyles}>
        <div className={`${containerWidth} mx-auto px-4 sm:px-6 lg:px-8 relative`}>
          {heroLayout === "split" ? (
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <h1
                  className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight"
                  style={{ color: textColor, fontFamily: storeSettings.heading_font_family }}
                >
                  {heroTitle}
                </h1>
                <p className="text-lg md:text-xl mb-8 max-w-xl" style={{ color: textSecondaryColor }}>
                  {heroSubtitle}
                </p>
                <HeroButton
                  href={heroButtonLink}
                  label={heroButtonLabel}
                  className={heroButtonClass}
                  primaryColor={primaryColor}
                  buttonTextColor={buttonTextColor}
                />
              </motion.div>
              <motion.div
                className="relative"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                {storeSettings.hero_image_url && (
                  <img
                    src={assetUrl(storeSettings.hero_image_url)}
                    alt={storeSettings.store_name}
                    className="rounded-2xl shadow-2xl w-full"
                    style={{ borderRadius: storeSettings.border_radius }}
                  />
                )}
              </motion.div>
            </div>
          ) : heroLayout === "fullwidth" ? (
            <motion.div
              className="relative rounded-2xl overflow-hidden"
              style={{ borderRadius: storeSettings.border_radius }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              {storeSettings.hero_image_url && (
                <img
                  src={assetUrl(storeSettings.hero_image_url)}
                  alt={storeSettings.store_name}
                  className="w-full h-[500px] object-cover"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent flex items-center">
                <div className={`${containerWidth} mx-auto px-4 sm:px-6 lg:px-8`}>
                  <h1
                    className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight text-white"
                    style={{ fontFamily: storeSettings.heading_font_family }}
                  >
                    {heroTitle}
                  </h1>
                  <p
                    className="text-lg md:text-xl mb-8 max-w-xl text-white/90"
                    style={{ fontFamily: storeSettings.font_family }}
                  >
                    {heroSubtitle}
                  </p>
                  <HeroButton
                    href={heroButtonLink}
                    label={heroButtonLabel}
                    className={heroButtonClass}
                    primaryColor={primaryColor}
                    buttonTextColor={buttonTextColor}
                  />
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              className="text-center max-w-4xl mx-auto"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1
                className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight"
                style={{ color: textColor, fontFamily: storeSettings.heading_font_family }}
              >
                {heroTitle}
              </h1>
              <p className="text-lg md:text-xl mb-8" style={{ color: textSecondaryColor }}>
                {heroSubtitle}
              </p>
              <HeroButton
                href={heroButtonLink}
                label={heroButtonLabel}
                className={heroButtonClass}
                primaryColor={primaryColor}
                buttonTextColor={buttonTextColor}
              />
              {storeSettings.hero_image_url && (
                <div
                  className="mt-12 rounded-2xl overflow-hidden shadow-2xl"
                  style={{ borderRadius: storeSettings.border_radius }}
                >
                  <img
                    src={assetUrl(storeSettings.hero_image_url)}
                    alt={storeSettings.store_name}
                    className="w-full"
                  />
                </div>
              )}
            </motion.div>
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
          <motion.div
            className="grid grid-cols-2 md:grid-cols-4 gap-6"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-60px" }}
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}
          >
            {features.map((feature, index) => {
              const Icon = ICONS[feature.icon] || Star;
              return (
                <motion.div
                  key={index}
                  variants={fadeUp}
                  className="flex items-center gap-4 p-4 rounded-xl"
                  style={{ borderRadius: storeSettings.border_radius }}
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: primaryColor + "15", color: primaryColor }}
                  >
                    <Icon size={24} />
                  </div>
                  <div>
                    <h3
                      className="font-semibold"
                      style={{ color: textColor, fontFamily: storeSettings.heading_font_family }}
                    >
                      {feature.title}
                    </h3>
                    <p className="text-sm" style={{ color: textSecondaryColor }}>
                      {feature.description}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* Featured Products */}
      {storeSettings.show_featured_products !== false && featuredProducts.length > 0 && (
        <section className="py-16">
          <div className={`${containerWidth} mx-auto px-4 sm:px-6 lg:px-8`}>
            <div className="flex items-center justify-between mb-8">
              <div>
                {sectionHeader(
                  content.featured_products_title ||
                    storeSettings.featured_products_title ||
                    "Featured Products",
                  content.featured_products_subtitle || "Handpicked selections just for you",
                )}
              </div>
              <Link href={`/storefront/${validUserId}/products`} className="btn-outline hidden sm:inline-flex">
                {content.view_all || "View All"} <ArrowRight size={16} />
              </Link>
            </div>

            <motion.div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-60px" }}
              variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07 } } }}
            >
              {featuredProducts.map((product) => (
                <motion.div key={product.id} variants={fadeUp}>
                  <ProductCard
                    product={product}
                    userId={validUserId}
                    primaryColor={primaryColor}
                    accentColor={accentColor}
                    cardBackgroundColor={storeSettings.card_background_color}
                    cardTextColor={storeSettings.card_text_color || textColor}
                    borderColor={storeSettings.border_color}
                  />
                </motion.div>
              ))}
            </motion.div>

            <div className="text-center mt-8 sm:hidden">
              <Link
                href={`/storefront/${validUserId}/products`}
                className="btn-primary inline-flex items-center gap-2"
              >
                {content.view_all_products || "View All Products"} <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Categories Section */}
      {storeSettings.show_categories_section !== false && categories.length > 0 && (
        <section className="py-16" style={{ backgroundColor: "rgba(0,0,0,0.02)" }}>
          <div className={`${containerWidth} mx-auto px-4 sm:px-6 lg:px-8`}>
            <div className="text-center mb-12">
              {sectionHeader(
                content.categories_title ||
                  storeSettings.categories_section_title ||
                  "Shop by Category",
                content.categories_subtitle || "Explore our product categories",
              )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {categories.slice(0, 10).map((category) => (
                <CategoryCard
                  key={category.category || category}
                  category={typeof category === "string" ? category : category.category}
                  count={category.count || category.product_count}
                  userId={validUserId}
                  primaryColor={primaryColor}
                />
              ))}
            </div>

            <div className="text-center mt-8">
              <Link
                href={`/storefront/${validUserId}/categories`}
                className="btn-outline inline-flex items-center gap-2"
              >
                View All Categories <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Testimonials */}
      {storeSettings.show_testimonials && testimonials.length > 0 && (
        <section className="py-16">
          <div className={`${containerWidth} mx-auto px-4 sm:px-6 lg:px-8`}>
            <div className="text-center mb-12">
              {sectionHeader(
                content.testimonials_title || "What Our Customers Say",
                content.testimonials_subtitle || "Real reviews from real customers",
              )}
            </div>

            <motion.div
              className="grid md:grid-cols-3 gap-6"
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-60px" }}
              variants={{ hidden: {}, show: { transition: { staggerChildren: 0.1 } } }}
            >
              {testimonials.map((testimonial, index) => (
                <motion.div
                  key={index}
                  variants={fadeUp}
                  className="card p-6 text-center"
                  style={{ borderRadius: storeSettings.border_radius }}
                >
                  <div className="flex items-center justify-center gap-1 mb-4">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star
                        key={n}
                        size={18}
                        fill={n <= Number(testimonial.rating || 5) ? "#F59E0B" : "none"}
                        stroke={n <= Number(testimonial.rating || 5) ? "#F59E0B" : "#D1D5DB"}
                      />
                    ))}
                  </div>
                  <p
                    className="mb-6"
                    style={{ color: textSecondaryColor, fontFamily: storeSettings.font_family }}
                  >
                    &ldquo;{testimonial.content}&rdquo;
                  </p>
                  <div>
                    <p className="font-semibold" style={{ color: textColor }}>
                      {testimonial.name}
                    </p>
                    <p className="text-sm" style={{ color: textSecondaryColor }}>
                      {testimonial.role || "Verified Buyer"}
                    </p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>
      )}

      {/* Newsletter */}
      {storeSettings.show_newsletter && (
        <section className="py-16" style={{ backgroundColor: secondaryColor }}>
          <div className={`${containerWidth} mx-auto px-4 sm:px-6 lg:px-8 text-center`}>
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
            {newsletterState === "done" ? (
              <p className="text-lg font-medium text-white">
                Thanks! You are subscribed to the newsletter.
              </p>
            ) : (
              <form className="max-w-md mx-auto flex gap-2" onSubmit={subscribe}>
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="input-field flex-1"
                  style={{
                    backgroundColor: "rgba(255,255,255,0.1)",
                    borderColor: "rgba(255,255,255,0.2)",
                    color: "white",
                  }}
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  required
                />
                <button
                  type="submit"
                  className="btn-accent px-6"
                  disabled={newsletterState === "loading"}
                >
                  {newsletterState === "loading" ? "..." : "Subscribe"}
                </button>
              </form>
            )}
          </div>
        </section>
      )}
    </StorefrontLayout>
  );
}
