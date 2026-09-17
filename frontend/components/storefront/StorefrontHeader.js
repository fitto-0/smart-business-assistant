import { ShoppingBag, Mail, Phone, MapPin, ExternalLink, Instagram, Facebook, Twitter, MessageCircle } from 'lucide-react';
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
      const response = await axios.get(`${API_URL}/api/store-settings/public/${userId}`);
      setStoreInfo(response.data);
    } catch (err) {
      console.error('Error fetching store info:', err);
      setStoreInfo({});
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-ground border-b hairline">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="animate-pulse">
            <div className="h-8 bg-ground-secondary rounded w-1/4 mb-2"></div>
            <div className="h-4 bg-ground-secondary rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  const primaryColor = storeInfo?.primary_color || '#3B82F6';
  const secondaryColor = storeInfo?.secondary_color || '#1E40AF';
  const accentColor = storeInfo?.accent_color || '#F59E0B';

  return (
    <header className="bg-ground border-b hairline sticky top-0 z-50" style={{ borderColor: secondaryColor }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {storeInfo?.logo_url ? (
              <img
                src={`${API_URL}${storeInfo.logo_url}`}
                alt={storeInfo?.store_name || 'Store Logo'}
                className="w-12 h-12 rounded-xl object-cover shadow-lg"
              />
            ) : (
              <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg" style={{ backgroundColor: primaryColor }}>
                <ShoppingBag className="h-7 w-7 text-white" />
              </div>
            )}
            <div>
              <h1 className="text-xl font-bold text-ink" style={{ color: storeInfo?.primary_color || '#EDE7DC' }}>
                {storeInfo?.store_name || 'Store'}
              </h1>
              <p className="text-sm text-ink-secondary">
                {storeInfo?.tagline || storeInfo?.description || 'Welcome to our store'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-6">
              {storeInfo?.contact_phone && (
                <a href={`tel:${storeInfo.contact_phone}`} className="flex items-center gap-1 text-sm text-ink-secondary hover:text-amber transition-colors">
                  <Phone size={16} />
                  <span>{storeInfo.contact_phone}</span>
                </a>
              )}
              {storeInfo?.contact_email && (
                <a href={`mailto:${storeInfo.contact_email}`} className="flex items-center gap-1 text-sm text-ink-secondary hover:text-amber transition-colors">
                  <Mail size={16} />
                  <span>{storeInfo.contact_email}</span>
                </a>
              )}
              {storeInfo?.address && (
                <span className="flex items-center gap-1 text-sm text-ink-secondary">
                  <MapPin size={16} />
                  <span>{storeInfo.address}, {storeInfo.city}, {storeInfo.country}</span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {storeInfo?.facebook_url && (
                <a href={storeInfo.facebook_url} target="_blank" rel="noopener noreferrer" className="p-2 bg-ground-secondary border hairline rounded-lg hover:bg-amber/10 transition-colors text-ink-secondary hover:text-amber" aria-label="Facebook">
                  <Facebook size={18} />
                </a>
              )}
              {storeInfo?.instagram_url && (
                <a href={storeInfo.instagram_url} target="_blank" rel="noopener noreferrer" className="p-2 bg-ground-secondary border hairline rounded-lg hover:bg-amber/10 transition-colors text-ink-secondary hover:text-amber" aria-label="Instagram">
                  <Instagram size={18} />
                </a>
              )}
              {storeInfo?.twitter_url && (
                <a href={storeInfo.twitter_url} target="_blank" rel="noopener noreferrer" className="p-2 bg-ground-secondary border hairline rounded-lg hover:bg-amber/10 transition-colors text-ink-secondary hover:text-amber" aria-label="Twitter">
                  <Twitter size={18} />
                </a>
              )}
              {storeInfo?.whatsapp_number && (
                <a href={`https://wa.me/${storeInfo.whatsapp_number.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="p-2 bg-ground-secondary border hairline rounded-lg hover:bg-amber/10 transition-colors text-ink-secondary hover:text-amber" aria-label="WhatsApp">
                  <MessageCircle size={18} />
                </a>
              )}
            </div>

            <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-white font-medium transition-colors shadow-lg" style={{ backgroundColor: accentColor }}>
              <ShoppingBag className="h-4 w-4" />
              <span className="hidden sm:inline">{storeInfo?.store_name ? 'Contact' : 'Contact Us'}</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}