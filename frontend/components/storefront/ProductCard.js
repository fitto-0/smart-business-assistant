import { useRouter } from "next/router";
import { Heart, Share2, ShoppingCart, Plus, Star } from "lucide-react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { assetUrl } from "../../lib/assetUrl";
import { useCart, useWishlist } from "../../lib/cart";
import { money, hasPromotion, priceOf } from "../../lib/money";

function Rating({ value, count }) {
  if (!count) return null;
  const rating = Number(value) || 0;
  return (
    <span
      className="inline-flex items-center gap-1 text-[11px] font-medium"
      style={{ color: "#6B7280" }}
      aria-label={`${rating} out of 5 from ${count} reviews`}
    >
      <Star size={12} fill="#F59E0B" stroke="#F59E0B" />
      {rating.toFixed(1)}
      <span className="opacity-60">({count})</span>
    </span>
  );
}

export default function ProductCard({
  product,
  userId,
  primaryColor = "#3B82F6",
  accentColor = "#F59E0B",
  cardBackgroundColor = "#FFFFFF",
  cardTextColor = "#1F2937",
  borderColor = "#E5E7EB",
  layout = "grid",
  cardStyle = "standard",
}) {
  const router = useRouter();
  const { add } = useCart(userId);
  const wishlist = useWishlist(userId);

  const handleClick = () => {
    router.push(`/storefront/${userId}/product/${product.id}`);
  };

  const handleShare = async (e) => {
    e.stopPropagation();
    const url =
      typeof window !== "undefined"
        ? `${window.location.origin}/storefront/${userId}/product/${product.id}`
        : "";
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: product.description || product.name,
          url,
        });
      } catch (err) {
        /* user dismissed */
      }
    } else if (url) {
      try {
        await navigator.clipboard.writeText(url);
        toast.success("Link copied");
      } catch (err) {
        toast.error("Could not copy link");
      }
    }
  };

  const handleAddToCart = (e) => {
    e.stopPropagation();
    if (!inStock) return;
    add(product, 1);
    toast.success(`${product.name} added to cart`);
  };

  const handleFavorite = (e) => {
    e.stopPropagation();
    const wasIn = wishlist.has(product.id);
    wishlist.toggle(product);
    toast.success(
      wasIn ? `Removed ${product.name} from wishlist` : `Saved ${product.name} to wishlist`,
    );
  };

  const inStock = Number(product.stock) > 0;
  const lowStock = inStock && Number(product.stock) <= 10;
  const promo = hasPromotion(product);
  const effectivePrice = priceOf(product);
  const saved = wishlist.has(product.id);

  const isListView = layout === "list";

  const badge = inStock ? (
    <span
      className="text-xs font-medium px-2 py-1 rounded-full"
      style={{
        backgroundColor: lowStock ? "#FEF3C7" : "#DCFCE7",
        color: lowStock ? "#92400E" : "#166534",
      }}
    >
      {lowStock ? `Only ${product.stock} left` : `${product.stock} in stock`}
    </span>
  ) : (
    <span
      className="text-xs font-medium px-2 py-1 rounded-full"
      style={{ backgroundColor: "#FEE2E2", color: "#991B1B" }}
    >
      Out of stock
    </span>
  );

  const priceBlock = (
    <div className="flex items-baseline gap-2" style={{ color: accentColor }}>
      {promo && (
        <span className="text-sm line-through opacity-50" style={{ color: cardTextColor }}>
          {money(product.price)}
        </span>
      )}
      <span className="text-lg font-bold">{money(effectivePrice)}</span>
      {promo && (
        <span
          className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded"
          style={{ backgroundColor: accentColor + "22", color: accentColor }}
        >
          Sale
        </span>
      )}
    </div>
  );

  const heartButton = (
    <button
      onClick={handleFavorite}
      aria-label={saved ? "Remove from wishlist" : "Add to wishlist"}
      className="p-2 rounded-full transition-colors"
      style={{
        backgroundColor: saved ? primaryColor : "rgba(255,255,255,0.9)",
        color: saved ? "#FFFFFF" : "#6B7280",
      }}
    >
      <Heart size={16} fill={saved ? "#FFFFFF" : "none"} />
    </button>
  );

  if (isListView) {
    return (
      <motion.div
        whileHover={{ x: 4 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        className="card flex gap-4 p-4 cursor-pointer"
        onClick={handleClick}
        style={{
          borderColor: primaryColor + "33",
          backgroundColor: cardBackgroundColor,
          color: cardTextColor,
        }}
      >
        <div
          className="relative w-32 h-32 flex-shrink-0 overflow-hidden"
          style={{ borderRadius: "0.5rem", backgroundColor: "rgba(0,0,0,0.03)" }}
        >
          {product.image_url ? (
            <img
              src={assetUrl(product.image_url)}
              alt={product.name}
              className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center"
              style={{ color: "#9CA3AF" }}
            >
              <ShoppingCart size={32} />
            </div>
          )}
          {product.featured && (
            <span className="absolute top-2 left-2 badge badge-accent px-2 py-1 text-xs">
              Featured
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span
                className="text-xs font-medium px-2 py-0.5 rounded"
                style={{ backgroundColor: primaryColor + "15", color: primaryColor }}
              >
                {product.category}
              </span>
              <Rating value={product.avg_rating} count={product.review_count} />
            </div>
            <h3 className="font-semibold truncate mb-1" style={{ color: cardTextColor }}>
              {product.name}
            </h3>
            <p className="text-sm line-clamp-2" style={{ color: cardTextColor, opacity: 0.72 }}>
              {product.description || "No description available."}
            </p>
          </div>
          <div
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-4 pt-4 border-t"
            style={{ borderColor }}
          >
            <div className="flex items-center gap-3">
              {priceBlock}
              {badge}
            </div>
            <div className="flex items-center gap-2">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleAddToCart}
                disabled={!inStock}
                className="btn-primary flex-1 sm:w-auto py-2 px-4 text-sm"
              >
                <Plus size={16} /> Add to Cart
              </motion.button>
              <button
                onClick={handleShare}
                aria-label="Share"
                className="p-2 rounded-lg border hover:bg-gray-100 transition-colors"
                style={{ borderColor: "#E5E7EB", color: "#6B7280" }}
              >
                <Share2 size={18} />
              </button>
              {heartButton}
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // Grid view
  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ type: "spring", stiffness: 350, damping: 28 }}
      className="group card cursor-pointer overflow-hidden"
      onClick={handleClick}
      style={{
        borderColor: primaryColor + "33",
        backgroundColor: cardBackgroundColor,
        color: cardTextColor,
      }}
    >
      {/* Product Image */}
      <div className="relative aspect-square" style={{ backgroundColor: "rgba(0,0,0,0.02)" }}>
        {product.image_url ? (
          <img
            src={assetUrl(product.image_url)}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ color: "#9CA3AF" }}
          >
            <ShoppingCart className="h-16 w-16" />
          </div>
        )}

        {product.featured && (
          <span className="absolute top-2 left-2 badge badge-accent px-2 py-1 text-xs">
            Featured
          </span>
        )}
        {!inStock && (
          <span
            className="absolute top-2 left-2 badge px-2 py-1 text-xs"
            style={{ backgroundColor: "#EF4444", color: "white" }}
          >
            Out of Stock
          </span>
        )}
        {inStock && lowStock && (
          <span
            className="absolute top-2 left-2 badge px-2 py-1 text-xs"
            style={{ backgroundColor: "#F59E0B", color: "white" }}
          >
            Only {product.stock} Left
          </span>
        )}

        <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          {heartButton}
          <button
            onClick={handleShare}
            aria-label="Share"
            className="p-2 rounded-full transition-colors"
            style={{ backgroundColor: "rgba(255,255,255,0.9)", color: "#6B7280" }}
          >
            <Share2 size={16} />
          </button>
        </div>
      </div>

      {/* Product Info */}
      <div className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <span
            className="text-xs font-medium px-2 py-0.5 rounded"
            style={{ backgroundColor: primaryColor + "15", color: primaryColor }}
          >
            {product.category}
          </span>
          <Rating value={product.avg_rating} count={product.review_count} />
        </div>
        <h3
          className="font-semibold mb-2 line-clamp-2 transition-colors"
          style={{ color: cardTextColor }}
        >
          {product.name}
        </h3>

        {cardStyle === "detailed" && product.description && (
          <p className="text-sm mb-3 line-clamp-2" style={{ color: cardTextColor, opacity: 0.72 }}>
            {product.description}
          </p>
        )}

        <div className="flex items-end justify-between gap-2">
          <div className="min-w-0">
            {priceBlock}
            <div className="mt-2">{badge}</div>
          </div>

          {cardStyle !== "minimal" && (
            <motion.button
              whileTap={{ scale: 0.94 }}
              onClick={handleAddToCart}
              disabled={!inStock}
              className="btn-primary py-2 px-3 text-sm flex items-center gap-1 shrink-0"
            >
              <Plus size={14} /> Add
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
