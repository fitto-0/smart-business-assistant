import { useRouter } from 'next/router';
import { Heart, Share2, ShoppingCart } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ProductCard({ product, userId }) {
  const router = useRouter();

  const handleClick = () => {
    router.push(`/storefront/${userId}/product/${product.id}`);
  };

  const handleShare = async (e) => {
    e.stopPropagation();
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: product.description,
          url: window.location.href,
        });
      } catch (err) {
        console.error('Share failed:', err);
      }
    }
  };

  const handleFavorite = (e) => {
    e.stopPropagation();
    // TODO: Implement favorite functionality
  };

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-shadow cursor-pointer overflow-hidden"
      onClick={handleClick}
    >
      {/* Product Image */}
      <div className="relative aspect-square bg-gray-100">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <ShoppingCart className="h-16 w-16" />
          </div>
        )}
        
        {product.featured && (
          <div className="absolute top-2 left-2 bg-yellow-400 text-yellow-900 text-xs font-semibold px-2 py-1 rounded">
            Featured
          </div>
        )}
        
        <div className="absolute top-2 right-2 flex gap-2">
          <button
            onClick={handleFavorite}
            className="p-2 bg-white/90 rounded-full hover:bg-white transition"
          >
            <Heart className="h-4 w-4 text-gray-600" />
          </button>
          <button
            onClick={handleShare}
            className="p-2 bg-white/90 rounded-full hover:bg-white transition"
          >
            <Share2 className="h-4 w-4 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Product Info */}
      <div className="p-4">
        <div className="text-xs text-gray-500 mb-1">{product.category}</div>
        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
          {product.name}
        </h3>
        
        <div className="flex items-center justify-between">
          <div className="text-lg font-bold text-blue-600">
            ${parseFloat(product.price).toFixed(2)}
          </div>
          
          <div className={`text-xs font-medium ${
            product.stock > 10 ? 'text-green-600' : 
            product.stock > 0 ? 'text-yellow-600' : 'text-red-600'
          }`}>
            {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
