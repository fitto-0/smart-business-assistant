import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import axios from 'axios';
import { ArrowLeft, Heart, Share2, ShoppingCart, Mail, Phone, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';
import ProductCard from '../../../../components/storefront/ProductCard';

export default function ProductDetailPage() {
  const router = useRouter();
  const { userId, productId } = router.query;
  
  const [product, setProduct] = useState(null);
  const [recommendedProducts, setRecommendedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    if (userId && productId) {
      fetchProduct();
      fetchRecommendedProducts();
    }
  }, [userId, productId]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${API_URL}/storefront/${userId}/products/${productId}`
      );
      setProduct(response.data);
    } catch (err) {
      setError('Product not found');
      console.error('Error fetching product:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecommendedProducts = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/storefront/${userId}?limit=4`
      );
      setRecommendedProducts(
        response.data.products.filter(p => p.id !== parseInt(productId)).slice(0, 4)
      );
    } catch (err) {
      console.error('Error fetching recommendations:', err);
    }
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
        console.error('Share failed:', err);
      }
    }
  };

  const handleContact = () => {
    // TODO: Implement contact functionality
    alert('Contact functionality coming soon!');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-600">{error || 'Product not found'}</div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>{product.name} - Storefront</title>
        <meta name="description" content={product.description} />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition"
            >
              <ArrowLeft className="h-5 w-5" />
              Back to Store
            </button>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            {/* Product Image */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-xl shadow-sm overflow-hidden"
            >
              <div className="aspect-square bg-gray-100">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <ShoppingCart className="h-32 w-32" />
                  </div>
                )}
              </div>
            </motion.div>

            {/* Product Info */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div>
                <div className="text-sm text-gray-500 mb-2">{product.category}</div>
                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                  {product.name}
                </h1>
                <div className="flex items-center gap-4">
                  <div className="text-3xl font-bold text-blue-600">
                    ${parseFloat(product.price).toFixed(2)}
                  </div>
                  <div className={`text-sm font-medium px-3 py-1 rounded-full ${
                    product.stock > 10 ? 'bg-green-100 text-green-700' : 
                    product.stock > 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleContact}
                  disabled={product.stock === 0}
                  className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  <Mail className="h-5 w-5" />
                  Contact Seller
                </button>
                <button
                  onClick={handleShare}
                  className="p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  <Share2 className="h-5 w-5 text-gray-600" />
                </button>
                <button className="p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition">
                  <Heart className="h-5 w-5 text-gray-600" />
                </button>
              </div>

              <div className="prose prose-gray">
                <h3 className="text-lg font-semibold mb-2">Description</h3>
                <p className="text-gray-600 leading-relaxed">
                  {product.description || 'No description available.'}
                </p>
              </div>

              {product.seo_keywords && product.seo_keywords.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 mb-2">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {product.seo_keywords.map((keyword, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </div>

          {/* Recommended Products */}
          {recommendedProducts.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                You might also like
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {recommendedProducts.map((recommendedProduct) => (
                  <ProductCard
                    key={recommendedProduct.id}
                    product={recommendedProduct}
                    userId={userId}
                  />
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
