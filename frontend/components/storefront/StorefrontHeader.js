import { ShoppingBag, Mail, Phone, MapPin } from 'lucide-react';
import { useState, useEffect } from 'react';
import axios from 'axios';

export default function StorefrontHeader({ userId }) {
  const [storeInfo, setStoreInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  useEffect(() => {
    fetchStoreInfo();
  }, [userId]);

  const fetchStoreInfo = async () => {
    try {
      // In a real implementation, you'd have a store info endpoint
      // For now, we'll use a placeholder
      setStoreInfo({
        name: 'Store',
        description: 'Welcome to our store',
      });
    } catch (err) {
      console.error('Error fetching store info:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <header className="bg-white border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <ShoppingBag className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {storeInfo?.name || 'Store'}
              </h1>
              <p className="text-sm text-gray-600">
                {storeInfo?.description || 'Browse our products'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
              <ShoppingBag className="h-4 w-4" />
              <span className="hidden sm:inline">Contact</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
