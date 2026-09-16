import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import axios from "axios";
import {
  ShoppingBag,
  Eye,
  Settings,
  Upload,
  Sparkles,
  ExternalLink,
  ToggleLeft,
  ToggleRight,
  Save,
  RefreshCw,
} from "lucide-react";
import toast from "react-hot-toast";
import { getToken, getUser } from "../../lib/auth";

export default function StorefrontManagement() {
  const router = useRouter();

  const [storefrontEnabled, setStorefrontEnabled] = useState(true);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("products");

  const API_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const token = getToken();
      const response = await axios.get(`${API_URL}/products`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProducts(response.data.products || []);
    } catch (err) {
      toast.error("Failed to load products");
      console.error("Error fetching products:", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleStorefrontEnabled = async (productId, currentStatus) => {
    try {
      const token = getToken();
      await axios.put(
        `${API_URL}/products/${productId}`,
        { storefront_enabled: !currentStatus },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      setProducts(
        products.map((p) =>
          p.id === productId ? { ...p, storefront_enabled: !currentStatus } : p,
        ),
      );
      toast.success("Product updated");
    } catch (err) {
      toast.error("Failed to update product");
      console.error("Error updating product:", err);
    }
  };

  const toggleFeatured = async (productId, currentStatus) => {
    try {
      const token = getToken();
      await axios.put(
        `${API_URL}/products/${productId}`,
        { featured: !currentStatus },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      setProducts(
        products.map((p) =>
          p.id === productId ? { ...p, featured: !currentStatus } : p,
        ),
      );
      toast.success("Product updated");
    } catch (err) {
      toast.error("Failed to update product");
      console.error("Error updating product:", err);
    }
  };

  const enhanceWithAI = async (productId) => {
    try {
      const token = getToken();
      await axios.post(
        `${API_URL}/ai-copilot/enhance-product`,
        { productId },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      toast.success("Product enhanced with AI");
      fetchProducts();
    } catch (err) {
      toast.error("Failed to enhance product");
      console.error("Error enhancing product:", err);
    }
  };

  const batchEnhanceWithAI = async () => {
    try {
      const productIds = products.map((p) => p.id);
      const token = getToken();

      await axios.post(
        `${API_URL}/ai-copilot/batch-enhance`,
        { productIds },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      toast.success("Products enhanced with AI");
      fetchProducts();
    } catch (err) {
      toast.error("Failed to enhance products");
      console.error("Error batch enhancing:", err);
    }
  };

  const previewStorefront = () => {
    // Use current user ID for preview
    const userId = localStorage.getItem("userId");
    if (userId) {
      window.open(`/storefront/${userId}`, "_blank");
    } else {
      toast.error("User ID not found");
    }
  };

  return (
    <>
      <Head>
        <title>Storefront Management - Dashboard</title>
      </Head>

      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Storefront Management
                </h1>
                <p className="text-gray-600 mt-1">
                  Configure and manage your online storefront
                </p>
              </div>
              <button
                onClick={previewStorefront}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                <ExternalLink className="h-4 w-4" />
                Preview Storefront
              </button>
            </div>

            {/* Storefront Toggle */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <ShoppingBag className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      Storefront Status
                    </h3>
                    <p className="text-sm text-gray-600">
                      {storefrontEnabled
                        ? "Your storefront is live and accessible to customers"
                        : "Your storefront is currently disabled"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setStorefrontEnabled(!storefrontEnabled)}
                  className="relative"
                >
                  {storefrontEnabled ? (
                    <ToggleRight className="h-8 w-8 text-blue-600" />
                  ) : (
                    <ToggleLeft className="h-8 w-8 text-gray-400" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-xl shadow-sm mb-6">
            <div className="border-b">
              <nav className="flex gap-4 px-6">
                <button
                  onClick={() => setActiveTab("products")}
                  className={`py-4 px-2 border-b-2 font-medium transition ${
                    activeTab === "products"
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Products
                </button>
                <button
                  onClick={() => setActiveTab("settings")}
                  className={`py-4 px-2 border-b-2 font-medium transition ${
                    activeTab === "settings"
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Settings
                </button>
              </nav>
            </div>
          </div>

          {/* Products Tab */}
          {activeTab === "products" && (
            <div className="space-y-6">
              {/* Actions */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={batchEnhanceWithAI}
                    className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition"
                  >
                    <Sparkles className="h-4 w-4" />
                    Enhance All with AI
                  </button>
                </div>
                <div className="text-sm text-gray-600">
                  {products.filter((p) => p.storefront_enabled).length} of{" "}
                  {products.length} products visible
                </div>
              </div>

              {/* Products List */}
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                </div>
              ) : products.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl shadow-sm">
                  <ShoppingBag className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">No products yet</p>
                  <button
                    onClick={() => router.push("/products")}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                  >
                    Add Products
                  </button>
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Product
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Price
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Stock
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Visible
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Featured
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {products.map((product) => (
                        <tr key={product.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div>
                              <div className="font-medium text-gray-900">
                                {product.name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {product.category}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-gray-900">
                            ${parseFloat(product.price).toFixed(2)}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`px-2 py-1 text-xs font-medium rounded-full ${
                                product.stock > 10
                                  ? "bg-green-100 text-green-700"
                                  : product.stock > 0
                                    ? "bg-yellow-100 text-yellow-700"
                                    : "bg-red-100 text-red-700"
                              }`}
                            >
                              {product.stock}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() =>
                                toggleStorefrontEnabled(
                                  product.id,
                                  product.storefront_enabled,
                                )
                              }
                            >
                              {product.storefront_enabled ? (
                                <ToggleRight className="h-6 w-6 text-blue-600" />
                              ) : (
                                <ToggleLeft className="h-6 w-6 text-gray-400" />
                              )}
                            </button>
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() =>
                                toggleFeatured(product.id, product.featured)
                              }
                            >
                              {product.featured ? (
                                <Sparkles className="h-5 w-5 text-yellow-500 fill-current" />
                              ) : (
                                <Sparkles className="h-5 w-5 text-gray-400" />
                              )}
                            </button>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => enhanceWithAI(product.id)}
                                className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition"
                                title="Enhance with AI"
                              >
                                <Sparkles className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() =>
                                  router.push(`/dashboard/products`)
                                }
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                title="Edit"
                              >
                                <Settings className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === "settings" && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Storefront Settings
              </h3>
              <p className="text-gray-600">
                Additional storefront settings will be available soon,
                including:
              </p>
              <ul className="mt-4 space-y-2 text-gray-600">
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  Custom branding (logo, colors)
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  Store description and contact info
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  Custom domain configuration
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  Analytics and insights
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
