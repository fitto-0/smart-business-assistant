import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import axios from "axios";
import { Heart, ShoppingCart, Trash2, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import StorefrontLayout from "../../../../components/storefront/StorefrontLayout";
import ProductCard from "../../../../components/storefront/ProductCard";
import { useWishlist, useCart } from "../../../../lib/cart";
import { money } from "../../../../lib/money";

export default function StorefrontWishlistPage() {
  const router = useRouter();
  const { userId } = router.query;

  const [storeSettings, setStoreSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
  const validUserId = userId && !isNaN(parseInt(userId)) ? parseInt(userId) : null;

  const wishlist = useWishlist(validUserId);
  const cart = useCart(validUserId);

  useEffect(() => {
    if (validUserId && router.isReady) {
      fetchSettings();
    }
  }, [validUserId, router.isReady]);

  const fetchSettings = async () => {
    try {
      const res = await axios.get(`${API_URL}/store-settings/public/${validUserId}`);
      setStoreSettings(res.data);
    } catch (err) {
      console.error("Error fetching store settings:", err);
    } finally {
      setLoading(false);
    }
  };

  const textColor = storeSettings?.text_color || "#1F2937";
  const textSecondaryColor = storeSettings?.text_secondary_color || "#6B7280";
  const primaryColor = storeSettings?.primary_color || "#3B82F6";
  const accentColor = storeSettings?.accent_color || "#F59E0B";
  const containerWidth = storeSettings?.container_width || "max-w-7xl";
  const borderColor = storeSettings?.border_color || "#E5E7EB";
  const cardStyle = storeSettings?.product_card_style || "standard";

  const moveToCart = (item) => {
    cart.add(item, 1);
    wishlist.remove(item.id);
    toast.success(`${item.name} moved to cart`);
  };

  const moveAllToCart = () => {
    wishlist.items.forEach((item) => cart.add(item, 1));
    const count = wishlist.count;
    wishlist.items.forEach((item) => wishlist.remove(item.id));
    toast.success(`${count} item${count !== 1 ? "s" : ""} moved to cart`);
  };

  if (loading) {
    return (
      <StorefrontLayout storeSettings={null} userId={validUserId} pageTitle="Wishlist">
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

  if (wishlist.items.length === 0) {
    return (
      <StorefrontLayout
        storeSettings={storeSettings}
        userId={validUserId}
        pageTitle="Wishlist"
      >
        <section className="py-16 md:py-24">
          <div className={`${containerWidth} mx-auto px-4 sm:px-6 lg:px-8 text-center`}>
            <div
              className="w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center"
              style={{ backgroundColor: primaryColor + "15", color: primaryColor }}
            >
              <Heart size={48} />
            </div>
            <h1
              className="text-3xl font-bold mb-4"
              style={{ color: textColor, fontFamily: storeSettings?.heading_font_family }}
            >
              Your Wishlist is Empty
            </h1>
            <p className="text-lg mb-8 max-w-md mx-auto" style={{ color: textSecondaryColor }}>
              Tap the heart on any product to save it here for later.
            </p>
            <Link
              href={`/storefront/${validUserId}/products`}
              className="btn-primary inline-flex items-center gap-2 px-8 py-3"
            >
              <ArrowLeft size={20} /> Browse Products
            </Link>
          </div>
        </section>
      </StorefrontLayout>
    );
  }

  return (
    <StorefrontLayout
      storeSettings={storeSettings}
      userId={validUserId}
      pageTitle="Wishlist"
    >
      <section className="py-8 border-b" style={{ borderColor: borderColor }}>
        <div className={`${containerWidth} mx-auto px-4 sm:px-6 lg:px-8`}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1
                className="text-3xl font-bold"
                style={{ color: textColor, fontFamily: storeSettings?.heading_font_family }}
              >
                My Wishlist ({wishlist.count})
              </h1>
              <p className="text-sm mt-1" style={{ color: textSecondaryColor }}>
                Saved on this device
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={moveAllToCart} className="btn-primary py-3 px-5">
                <ShoppingCart size={18} /> Move all to cart
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="py-8">
        <div className={`${containerWidth} mx-auto px-4 sm:px-6 lg:px-8`}>
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            initial="hidden"
            animate="show"
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.05 } } }}
          >
            <AnimatePresence>
              {wishlist.items.map((item) => (
                <motion.div
                  key={item.id}
                  variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  layout
                  className="relative"
                >
                  <button
                    onClick={() => {
                      wishlist.remove(item.id);
                      toast.success("Removed from wishlist");
                    }}
                    aria-label="Remove from wishlist"
                    className="absolute -top-2 -right-2 z-10 w-9 h-9 rounded-full flex items-center justify-center shadow-md transition-colors"
                    style={{ backgroundColor: "#FFFFFF", color: "#EF4444", border: `1px solid ${borderColor}` }}
                  >
                    <Trash2 size={16} />
                  </button>
                  <ProductCard
                    product={item}
                    userId={validUserId}
                    primaryColor={primaryColor}
                    accentColor={accentColor}
                    cardBackgroundColor={storeSettings?.card_background_color}
                    cardTextColor={storeSettings?.card_text_color || textColor}
                    borderColor={borderColor}
                    cardStyle={cardStyle}
                  />
                  <button
                    onClick={() => moveToCart(item)}
                    className="btn-outline w-full mt-2 py-2 text-sm"
                  >
                    <ShoppingCart size={15} /> Move to cart · {money(item.price)}
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        </div>
      </section>
    </StorefrontLayout>
  );
}
