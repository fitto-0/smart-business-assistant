import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import axios from "axios";
import {
  Truck,
  Shield,
  RotateCcw,
  Star,
  Users,
  Award,
  Heart,
  Sparkles,
} from "lucide-react";
import { motion } from "framer-motion";
import StorefrontLayout from "../../../../components/storefront/StorefrontLayout";
import { money } from "../../../../lib/money";

const VALUE_ICONS = [Sparkles, Heart, Award, Users];
const ICONS = { truck: Truck, shield: Shield, rotate: RotateCcw, star: Star };

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } },
};

export default function StorefrontAboutPage() {
  const router = useRouter();
  const { userId } = router.query;

  const [storeSettings, setStoreSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
  const validUserId = userId && !isNaN(parseInt(userId)) ? parseInt(userId) : null;

  useEffect(() => {
    if (validUserId && router.isReady) {
      fetchStoreSettings();
    }
  }, [validUserId, router.isReady]);

  const fetchStoreSettings = async () => {
    try {
      const res = await axios.get(`${API_URL}/store-settings/public/${validUserId}`);
      setStoreSettings(res.data);
    } catch (err) {
      console.error("Error fetching store settings:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <StorefrontLayout storeSettings={null} userId={validUserId} pageTitle="About">
        <div className="store-container py-16">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mx-auto mb-8"></div>
            <div className="h-6 bg-gray-200 rounded w-1/2 mx-auto mb-4"></div>
            <div className="h-6 bg-gray-200 rounded w-3/4 mx-auto"></div>
          </div>
        </div>
      </StorefrontLayout>
    );
  }

  const textColor = storeSettings?.text_color || "#1F2937";
  const textSecondaryColor = storeSettings?.text_secondary_color || "#6B7280";
  const primaryColor = storeSettings?.primary_color || "#3B82F6";
  const secondaryColor = storeSettings?.secondary_color || "#1E40AF";
  const containerWidth = storeSettings?.container_width || "max-w-7xl";
  const borderRadius = storeSettings?.border_radius || "0.75rem";
  const content = storeSettings?.content_overrides || {};

  const freeShippingThreshold = Number(content.free_shipping_threshold ?? 500);
  const shippingFee = Number(content.shipping_fee ?? 30);

  const defaultValues = [
    { icon: "sparkles", title: "Quality First", description: "We source only the finest products for our customers." },
    { icon: "heart", title: "Customer Care", description: "Your satisfaction is our top priority. We are here to help." },
    { icon: "award", title: "Trusted Brand", description: "Customers trust us for reliable products and service." },
    { icon: "users", title: "Community Focus", description: "We believe in supporting the communities we serve." },
  ];
  const values = Array.isArray(content.values) && content.values.length
    ? content.values
    : defaultValues;

  const defaultFeatures = [
    {
      icon: "truck",
      title: freeShippingThreshold > 0 ? "Free Shipping" : "Fast Delivery",
      description:
        freeShippingThreshold > 0
          ? `On orders over ${money(freeShippingThreshold)}. Fast delivery to your doorstep.`
          : shippingFee > 0
            ? `Delivery from ${money(shippingFee)} to your doorstep.`
            : "Delivery fees are confirmed with you by phone.",
    },
    { icon: "shield", title: "Secure Payment", description: "Cash on delivery, card or bank transfer." },
    { icon: "rotate", title: "Easy Returns", description: "30-day hassle-free return policy on all items." },
    { icon: "star", title: "Quality Guarantee", description: "Every product meets our standards of excellence." },
  ];
  const features =
    Array.isArray(content.features) && content.features.length
      ? content.features.slice(0, 4)
      : defaultFeatures;

  const team = Array.isArray(content.team) ? content.team : [];

  return (
    <StorefrontLayout
      storeSettings={storeSettings}
      userId={validUserId}
      pageTitle={content.about_title || "About Us"}
    >
      {/* Hero Section */}
      <section className="py-16 md:py-24" style={{ backgroundColor: "rgba(0,0,0,0.02)" }}>
        <div className={`${containerWidth} mx-auto px-4 sm:px-6 lg:px-8 text-center`}>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-bold mb-6"
            style={{ color: textColor, fontFamily: storeSettings?.heading_font_family }}
          >
            {content.about_title || "About"} {storeSettings?.store_name || "Our Store"}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="text-xl max-w-3xl mx-auto"
            style={{ color: textSecondaryColor }}
          >
            {storeSettings?.description ||
              content.about_intro ||
              "We are passionate about bringing you the best products at fair prices. Our journey started with a simple idea: make quality shopping accessible to everyone."}
          </motion.p>
        </div>
      </section>

      {/* Mission & Values */}
      <section className="py-16">
        <div className={`${containerWidth} mx-auto px-4 sm:px-6 lg:px-8`}>
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2
                className="text-3xl font-bold mb-6"
                style={{ color: textColor, fontFamily: storeSettings?.heading_font_family }}
              >
                {content.mission_title || "Our Mission"}
              </h2>
              {(content.mission_text
                ? String(content.mission_text).split("\n").filter(Boolean)
                : [
                    "To provide exceptional products and outstanding customer service while making a positive impact in our community.",
                    "We believe that shopping should be an enjoyable experience, not a chore. That is why we carefully curate every product in our store, ensuring it meets our standards for quality, value, and style.",
                    "Our commitment to excellence drives everything we do, from the products we select to the way we treat our customers.",
                  ]
              ).map((paragraph, i) => (
                <p key={i} className="text-lg mb-4" style={{ color: textSecondaryColor }}>
                  {paragraph}
                </p>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-4">
              {values.map((value, index) => {
                const Icon = VALUE_ICONS[index % VALUE_ICONS.length];
                return (
                  <div
                    key={index}
                    className="p-6 rounded-2xl"
                    style={{ backgroundColor: "rgba(0,0,0,0.02)", borderRadius: borderRadius }}
                  >
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                      style={{ backgroundColor: primaryColor + "15", color: primaryColor }}
                    >
                      <Icon size={24} />
                    </div>
                    <h3 className="font-semibold mb-2" style={{ color: textColor }}>
                      {value.title}
                    </h3>
                    <p className="text-sm" style={{ color: textSecondaryColor }}>
                      {value.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16" style={{ backgroundColor: "rgba(0,0,0,0.02)" }}>
        <div className={`${containerWidth} mx-auto px-4 sm:px-6 lg:px-8`}>
          <div className="text-center mb-12">
            <h2
              className="text-3xl font-bold mb-4"
              style={{ color: textColor, fontFamily: storeSettings?.heading_font_family }}
            >
              {content.why_title || "Why Choose Us"}
            </h2>
            <p className="text-lg max-w-2xl mx-auto" style={{ color: textSecondaryColor }}>
              {content.why_subtitle || "We go above and beyond to make your shopping experience exceptional"}
            </p>
          </div>

          <motion.div
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
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
                  className="p-6 rounded-2xl card"
                  style={{ borderRadius: borderRadius }}
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                    style={{ backgroundColor: primaryColor + "15", color: primaryColor }}
                  >
                    <Icon size={24} />
                  </div>
                  <h3 className="font-semibold mb-2" style={{ color: textColor }}>
                    {feature.title}
                  </h3>
                  <p className="text-sm" style={{ color: textSecondaryColor }}>
                    {feature.description}
                  </p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* Team (only when the merchant added one) */}
      {team.length > 0 && (
        <section className="py-16">
          <div className={`${containerWidth} mx-auto px-4 sm:px-6 lg:px-8`}>
            <div className="text-center mb-12">
              <h2
                className="text-3xl font-bold mb-4"
                style={{ color: textColor, fontFamily: storeSettings?.heading_font_family }}
              >
                {content.team_title || "Meet Our Team"}
              </h2>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {team.map((member, index) => (
                <div key={index} className="text-center">
                  <div
                    className="w-32 h-32 mx-auto mb-4 rounded-full flex items-center justify-center text-white text-3xl font-bold"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {String(member.name || "")
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>
                  <h3 className="font-semibold" style={{ color: textColor }}>
                    {member.name}
                  </h3>
                  <p className="text-sm mb-2" style={{ color: primaryColor }}>
                    {member.role}
                  </p>
                  {member.bio && (
                    <p className="text-sm" style={{ color: textSecondaryColor }}>
                      {member.bio}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-16" style={{ backgroundColor: secondaryColor }}>
        <div className={`${containerWidth} mx-auto px-4 sm:px-6 lg:px-8 text-center`}>
          <h2
            className="text-3xl md:text-4xl font-bold mb-4 text-white"
            style={{ fontFamily: storeSettings?.heading_font_family }}
          >
            {content.cta_title || "Ready to Experience the Difference?"}
          </h2>
          <p className="text-white/80 mb-8 max-w-2xl mx-auto">
            {content.cta_subtitle || "Discover why our customers choose us for quality products."}
          </p>
          <Link
            href={`/storefront/${validUserId}/products`}
            className="btn-accent inline-flex items-center gap-2 text-lg px-8 py-4"
          >
            Shop Now <Sparkles size={20} />
          </Link>
        </div>
      </section>
    </StorefrontLayout>
  );
}
