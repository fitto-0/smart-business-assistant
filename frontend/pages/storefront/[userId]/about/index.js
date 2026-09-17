import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import axios from 'axios';
import { Truck, Shield, RotateCcw, Star, Users, Award, Heart, Sparkles } from 'lucide-react';
import StorefrontLayout from '../../../../components/storefront/StorefrontLayout';

export default function StorefrontAboutPage() {
  const router = useRouter();
  const { userId } = router.query;
  
  const [storeSettings, setStoreSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
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
      console.error('Error fetching store settings:', err);
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

  const textColor = storeSettings?.text_color || '#1F2937';
  const textSecondaryColor = storeSettings?.text_secondary_color || '#6B7280';
  const primaryColor = storeSettings?.primary_color || '#3B82F6';
  const secondaryColor = storeSettings?.secondary_color || '#1E40AF';
  const accentColor = storeSettings?.accent_color || '#F59E0B';
  const containerWidth = storeSettings?.container_width || 'max-w-7xl';
  const borderRadius = storeSettings?.border_radius || '0.75rem';

  const values = [
    { icon: Sparkles, title: 'Quality First', description: 'We source only the finest materials and products for our customers.' },
    { icon: Heart, title: 'Customer Care', description: 'Your satisfaction is our top priority. We\'re here to help.' },
    { icon: Award, title: 'Trusted Brand', description: 'Thousands of happy customers trust us for their shopping needs.' },
    { icon: Users, title: 'Community Focus', description: 'We believe in giving back and supporting local communities.' },
  ];

  const features = [
    { icon: Truck, title: 'Free Shipping', description: 'On orders over $50. Fast delivery to your doorstep.' },
    { icon: Shield, title: 'Secure Payment', description: '100% secure checkout with encrypted transactions.' },
    { icon: RotateCcw, title: 'Easy Returns', description: '30-day hassle-free return policy on all items.' },
    { icon: Star, title: 'Quality Guarantee', description: 'Every product meets our high standards of excellence.' },
  ];

  const team = [
    { name: 'Alex Johnson', role: 'Founder & CEO', bio: 'Visionary leader with 15+ years in retail.' },
    { name: 'Sarah Chen', role: 'Head of Products', bio: 'Curates the finest selection for our store.' },
    { name: 'Mike Rodriguez', role: 'Customer Success', bio: 'Ensures every customer has a great experience.' },
    { name: 'Emily Davis', role: 'Operations Manager', bio: 'Keeps everything running smoothly behind the scenes.' },
  ];

  return (
    <StorefrontLayout 
      storeSettings={storeSettings} 
      userId={validUserId} 
      pageTitle="About Us"
    >
      {/* Hero Section */}
      <section className="py-16 md:py-24" style={{ backgroundColor: 'rgba(0,0,0,0.02)' }}>
        <div className={`${containerWidth} mx-auto px-4 sm:px-6 lg:px-8 text-center`}>
          <h1 className="text-4xl md:text-5xl font-bold mb-6" style={{ color: textColor, fontFamily: storeSettings?.heading_font_family }}>
            About {storeSettings?.store_name || 'Our Store'}
          </h1>
          <p className="text-xl max-w-3xl mx-auto" style={{ color: textSecondaryColor }}>
            {storeSettings?.description || 'We are passionate about bringing you the best products at the best prices. Our journey started with a simple idea: make quality shopping accessible to everyone.'}
          </p>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-16">
        <div className={`${containerWidth} mx-auto px-4 sm:px-6 lg:px-8`}>
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6" style={{ color: textColor, fontFamily: storeSettings?.heading_font_family }}>
                Our Mission
              </h2>
              <p className="text-lg mb-4" style={{ color: textSecondaryColor }}>
                To provide exceptional products and outstanding customer service while making a positive impact in our community and the world.
              </p>
              <p className="mb-4" style={{ color: textSecondaryColor }}>
                We believe that shopping should be an enjoyable experience, not a chore. That's why we carefully curate every product in our store, ensuring it meets our high standards for quality, value, and style.
              </p>
              <p style={{ color: textSecondaryColor }}>
                Our commitment to excellence drives everything we do - from the products we select to the way we treat our customers.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {values.map((value, index) => (
                <div key={index} className="p-6 rounded-2xl" style={{ backgroundColor: 'rgba(0,0,0,0.02)', borderRadius: borderRadius }}>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: primaryColor + '15', color: primaryColor }}>
                    <value.icon size={24} />
                  </div>
                  <h3 className="font-semibold mb-2" style={{ color: textColor }}>{value.title}</h3>
                  <p className="text-sm" style={{ color: textSecondaryColor }}>{value.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16" style={{ backgroundColor: 'rgba(0,0,0,0.02)' }}>
        <div className={`${containerWidth} mx-auto px-4 sm:px-6 lg:px-8`}>
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4" style={{ color: textColor, fontFamily: storeSettings?.heading_font_family }}>
              Why Choose Us
            </h2>
            <p className="text-lg max-w-2xl mx-auto" style={{ color: textSecondaryColor }}>
              We go above and beyond to make your shopping experience exceptional
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div key={index} className="p-6 rounded-2xl card" style={{ borderRadius: borderRadius }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: primaryColor + '15', color: primaryColor }}>
                  <feature.icon size={24} />
                </div>
                <h3 className="font-semibold mb-2" style={{ color: textColor }}>{feature.title}</h3>
                <p className="text-sm" style={{ color: textSecondaryColor }}>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-16">
        <div className={`${containerWidth} mx-auto px-4 sm:px-6 lg:px-8`}>
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4" style={{ color: textColor, fontFamily: storeSettings?.heading_font_family }}>
              Meet Our Team
            </h2>
            <p className="text-lg max-w-2xl mx-auto" style={{ color: textSecondaryColor }}>
              The passionate people behind our brand
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {team.map((member, index) => (
              <div key={index} className="text-center">
                <div className="w-32 h-32 mx-auto mb-4 rounded-full bg-gradient-to-br from-[var(--store-primary)] to-[var(--store-secondary)] flex items-center justify-center text-white text-3xl font-bold">
                  {member.name.split(' ').map(n => n[0]).join('')}
                </div>
                <h3 className="font-semibold" style={{ color: textColor }}>{member.name}</h3>
                <p className="text-sm mb-2" style={{ color: primaryColor }}>{member.role}</p>
                <p className="text-sm" style={{ color: textSecondaryColor }}>{member.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16" style={{ backgroundColor: secondaryColor }}>
        <div className={`${containerWidth} mx-auto px-4 sm:px-6 lg:px-8 text-center`}>
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white" style={{ fontFamily: storeSettings?.heading_font_family }}>
            Ready to Experience the Difference?
          </h2>
          <p className="text-white/80 mb-8 max-w-2xl mx-auto">
            Join thousands of satisfied customers and discover why we're the preferred choice for quality products.
          </p>
          <a href={`/storefront/${userId}/products`} className="btn-accent inline-flex items-center gap-2 text-lg px-8 py-4">
            Shop Now <Sparkles size={20} />
          </a>
        </div>
      </section>
    </StorefrontLayout>
  );
}