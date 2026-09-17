import { useRouter } from 'next/router';
import { Heart, Share2, ShoppingCart, Plus } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ProductCard({ product, userId, primaryColor = '#3B82F6', accentColor = '#F59E0B', cardBackgroundColor = '#FFFFFF', cardTextColor = '#1F2937', borderColor = '#E5E7EB', layout = 'grid', cardStyle = 'standard' }) {
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

  const handleAddToCart = (e) => {
    e.stopPropagation();
    const saved = localStorage.getItem(`cart_${userId}`);
    const cart = saved ? JSON.parse(saved) : [];
    
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      existing.quantity += 1;
    } else {
      cart.push({ ...product, quantity: 1 });
    }
    
    localStorage.setItem(`cart_${userId}`, JSON.stringify(cart));
    alert(`${product.name} added to cart!`);
  };

  const handleFavorite = (e) => {
    e.stopPropagation();
  };

  const inStock = product.stock > 0;
  const lowStock = product.stock > 0 && product.stock <= 10;

  const isListView = layout === 'list';

  if (isListView) {
    return (
      <motion.div
        whileHover={{ x: 4 }}
        className="card flex gap-4 p-4 cursor-pointer transition-all"
        onClick={handleClick}
        style={{ borderColor: primaryColor + '33', backgroundColor: cardBackgroundColor, color: cardTextColor }}
      >
        <div className="relative w-32 h-32 flex-shrink-0 rounded-lg overflow-hidden" style={{ borderRadius: '0.5rem' }}>
          {product.image_url ? (
            <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center" style={{ color: '#9CA3AF' }}>
              <ShoppingCart size={32} />
            </div>
          )}
          {product.featured && (
            <span className="absolute top-2 left-2 badge badge-accent px-2 py-1 text-xs">Featured</span>
          )}
        </div>
        <div className="flex-1 min-w-0 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-medium px-2 py-0.5 rounded" style={{ backgroundColor: primaryColor + '15', color: primaryColor }}>
                {product.category}
              </span>
              {product.featured && <span className="text-xs font-medium px-2 py-0.5 rounded badge badge-accent">Featured</span>}
            </div>
            <h3 className="font-semibold truncate mb-1" style={{ color: cardTextColor }}>{product.name}</h3>
            <p className="text-sm line-clamp-2" style={{ color: cardTextColor, opacity: 0.72 }}>{product.description || 'No description available.'}</p>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-4 pt-4 border-t" style={{ borderColor }}>
            <div className="flex items-center gap-3">
              <div className="text-lg font-bold" style={{ color: accentColor }}>
                {parseFloat(product.price).toFixed(2)} DA
              </div>
              <div className={`text-xs font-medium px-2 py-1 rounded-full ${inStock ? (lowStock ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800') : 'bg-red-100 text-red-800'}`}>
                {inStock ? (lowStock ? `Only ${product.stock} left` : `${product.stock} in stock`) : 'Out of stock'}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handleAddToCart} disabled={!inStock} className="btn-primary flex-1 sm:w-auto py-2 px-4 text-sm">
                <Plus size={16} /> Add to Cart
              </button>
              <button onClick={handleShare} className="p-2 rounded-lg border hover:bg-gray-100 transition-colors" style={{ borderColor: '#E5E7EB', color: '#6B7280' }}>
                <Share2 size={18} />
              </button>
              <button onClick={handleFavorite} className="p-2 rounded-lg border hover:bg-gray-100 transition-colors" style={{ borderColor: '#E5E7EB', color: '#6B7280' }}>
                <Heart size={18} />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // Grid view
  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="card cursor-pointer overflow-hidden transition-all"
      onClick={handleClick}
      style={{ borderColor: primaryColor + '33', backgroundColor: cardBackgroundColor, color: cardTextColor }}
    >
      {/* Product Image */}
      <div className="relative aspect-square" style={{ backgroundColor: 'rgba(0,0,0,0.02)' }}>
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ color: '#9CA3AF' }}>
            <ShoppingCart className="h-16 w-16" />
          </div>
        )}
        
        {product.featured && (
          <span className="absolute top-2 left-2 badge badge-accent px-2 py-1 text-xs">Featured</span>
        )}
        {!inStock && (
          <span className="absolute top-2 left-2 badge px-2 py-1 text-xs" style={{ backgroundColor: '#EF4444', color: 'white' }}>Out of Stock</span>
        )}
        {lowStock && (
          <span className="absolute top-2 left-2 badge px-2 py-1 text-xs" style={{ backgroundColor: '#F59E0B', color: 'white' }}>Only {product.stock} Left</span>
        )}
        
        <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handleFavorite}
            className="p-2 rounded-full transition-colors"
            style={{ backgroundColor: 'rgba(255,255,255,0.9)', color: '#6B7280' }}
          >
            <Heart size={18} />
          </button>
          <button
            onClick={handleShare}
            className="p-2 rounded-full transition-colors"
            style={{ backgroundColor: 'rgba(255,255,255,0.9)', color: '#6B7280' }}
          >
            <Share2 size={18} />
          </button>
        </div>
      </div>

      {/* Product Info */}
      <div className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-medium px-2 py-0.5 rounded" style={{ backgroundColor: primaryColor + '15', color: primaryColor }}>
            {product.category}
          </span>
          {product.featured && <span className="text-xs font-medium px-2 py-0.5 rounded badge badge-accent">Featured</span>}
        </div>
        <h3 className="font-semibold mb-2 line-clamp-2" style={{ color: cardTextColor }}>
          {product.name}
        </h3>
        
        {cardStyle === 'detailed' && product.description && (
          <p className="text-sm mb-3 line-clamp-2" style={{ color: cardTextColor, opacity: 0.72 }}>{product.description}</p>
        )}
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="text-lg font-bold" style={{ color: accentColor }}>
              {parseFloat(product.price).toFixed(2)} DA
            </div>
            <div className={`text-xs font-medium px-2 py-1 rounded-full ${inStock ? (lowStock ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800') : 'bg-red-100 text-red-800'}`}>
              {inStock ? (lowStock ? `Only ${product.stock} left` : `${product.stock} in stock`) : 'Out of stock'}
            </div>
          </div>
          
          {cardStyle !== 'minimal' && (
            <button
              onClick={handleAddToCart}
              disabled={!inStock}
              className="btn-primary py-2 px-3 text-sm flex items-center gap-1"
              style={{ fontSize: '0.875rem' }}
            >
              <Plus size={14} /> Add
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}