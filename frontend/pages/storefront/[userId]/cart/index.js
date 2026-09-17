import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import axios from 'axios';
import { ShoppingBag, Trash2, Plus, Minus, ArrowLeft, CreditCard, Shield, Truck, RotateCcw, CheckCircle } from 'lucide-react';
import StorefrontLayout from '../../../../components/storefront/StorefrontLayout';

export default function StorefrontCartPage() {
  const router = useRouter();
  const { userId } = router.query;
  
  const [storeSettings, setStoreSettings] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
  const validUserId = userId && !isNaN(parseInt(userId)) ? parseInt(userId) : null;

  // Load cart from localStorage
  useEffect(() => {
    if (validUserId && router.isReady) {
      fetchStoreSettings();
      loadCart();
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

  const loadCart = () => {
    try {
      const saved = localStorage.getItem(`cart_${validUserId}`);
      if (saved) {
        setCartItems(JSON.parse(saved));
      }
    } catch (err) {
      console.error('Error loading cart:', err);
    }
  };

  const saveCart = (items) => {
    localStorage.setItem(`cart_${validUserId}`, JSON.stringify(items));
    setCartItems(items);
  };

  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      saveCart(cartItems.filter(item => item.id !== productId));
    } else {
      saveCart(cartItems.map(item => item.id === productId ? { ...item, quantity } : item));
    }
  };

  const removeItem = (productId) => {
    saveCart(cartItems.filter(item => item.id !== productId));
  };

  const applyCoupon = () => {
    if (couponCode.toUpperCase() === 'WELCOME10') {
      setDiscount(10);
      alert('Coupon applied! 10% off your order.');
    } else if (couponCode.toUpperCase() === 'SAVE20') {
      setDiscount(20);
      alert('Coupon applied! 20% off your order.');
    } else {
      alert('Invalid coupon code');
    }
  };

  const subtotal = cartItems.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0);
  const discountAmount = subtotal * (discount / 100);
  const shipping = subtotal > 50 ? 0 : 9.99;
  const tax = (subtotal - discountAmount) * 0.08;
  const total = subtotal - discountAmount + shipping + tax;

  if (loading) {
    return (
      <StorefrontLayout storeSettings={null} userId={validUserId} pageTitle="Cart">
        <div className="store-container py-16">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mx-auto mb-8"></div>
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
  const borderColor = storeSettings?.border_color || '#E5E7EB';

  if (cartItems.length === 0) {
    return (
      <StorefrontLayout 
        storeSettings={storeSettings} 
        userId={validUserId} 
        pageTitle="Shopping Cart"
      >
        <section className="py-16 md:py-24">
          <div className={`${containerWidth} mx-auto px-4 sm:px-6 lg:px-8 text-center`}>
            <div className="w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center" style={{ backgroundColor: primaryColor + '15', color: primaryColor }}>
              <ShoppingBag size={48} />
            </div>
            <h1 className="text-3xl font-bold mb-4" style={{ color: textColor, fontFamily: storeSettings?.heading_font_family }}>
              Your Cart is Empty
            </h1>
            <p className="text-lg mb-8 max-w-md mx-auto" style={{ color: textSecondaryColor }}>
              Looks like you haven't added any products yet. Start shopping to fill your cart!
            </p>
            <a href={`/storefront/${userId}/products`} className="btn-primary inline-flex items-center gap-2 px-8 py-3">
              <ArrowLeft size={20} />
              Continue Shopping
            </a>
          </div>
        </section>
      </StorefrontLayout>
    );
  }

  return (
    <StorefrontLayout 
      storeSettings={storeSettings} 
      userId={validUserId} 
      pageTitle="Shopping Cart"
    >
      <section className="py-8 border-b" style={{ borderColor: borderColor }}>
        <div className={`${containerWidth} mx-auto px-4 sm:px-6 lg:px-8`}>
          <h1 className="text-3xl font-bold" style={{ color: textColor, fontFamily: storeSettings?.heading_font_family }}>
            Shopping Cart ({cartItems.length} item{cartItems.length !== 1 ? 's' : ''})
          </h1>
        </div>
      </section>

      <section className="py-8">
        <div className={`${containerWidth} mx-auto px-4 sm:px-6 lg:px-8`}>
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map((item) => (
                <div key={item.id} className="card p-4 flex gap-4" style={{ borderRadius: borderRadius, borderColor: borderColor }}>
                  {item.image_url && (
                    <img 
                      src={item.image_url} 
                      alt={item.name} 
                      className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                      style={{ borderRadius: borderRadius }}
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate" style={{ color: textColor }}>{item.name}</h3>
                    {item.category && <p className="text-sm mt-1" style={{ color: textSecondaryColor }}>{item.category}</p>}
                    <p className="font-bold mt-2" style={{ color: primaryColor }}>{parseFloat(item.price).toFixed(2)} DA</p>
                  </div>
                  <div className="flex flex-col items-end gap-3">
                    <div className="flex items-center gap-2 border rounded-lg" style={{ borderColor: borderColor }}>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="p-2 text-[var(--store-text-secondary)] hover:bg-gray-100 rounded-l-lg"
                        style={{ color: textSecondaryColor }}
                      >
                        <Minus size={16} />
                      </button>
                      <span className="w-10 text-center font-medium" style={{ color: textColor }}>{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="p-2 text-[var(--store-text-secondary)] hover:bg-gray-100 rounded-r-lg"
                        style={{ color: textSecondaryColor }}
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                    <p className="font-semibold" style={{ color: textColor }}>
                      {(parseFloat(item.price) * item.quantity).toFixed(2)} DA
                    </p>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-red-500 hover:text-red-700 text-sm font-medium flex items-center gap-1"
                    >
                      <Trash2 size={16} /> Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="card p-6 sticky top-24" style={{ borderRadius: borderRadius, borderColor: borderColor, height: 'fit-content' }}>
              <h2 className="text-xl font-bold mb-6" style={{ color: textColor, fontFamily: storeSettings?.heading_font_family }}>
                Order Summary
              </h2>

              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-sm">
                  <span style={{ color: textSecondaryColor }}>Subtotal ({cartItems.length} items)</span>
                  <span style={{ color: textColor }}>{subtotal.toFixed(2)} DA</span>
                </div>

                {discount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount ({discount}%)</span>
                    <span>-{discountAmount.toFixed(2)} DA</span>
                  </div>
                )}

                <div className="flex justify-between text-sm">
                  <span style={{ color: textSecondaryColor }}>Shipping</span>
                  <span style={{ color: shipping === 0 ? 'green' : textColor }}>
                    {shipping === 0 ? 'Free' : `${shipping.toFixed(2)} DA`}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span style={{ color: textSecondaryColor }}>Tax (8%)</span>
                  <span style={{ color: textColor }}>{tax.toFixed(2)} DA</span>
                </div>

                <div className="border-t pt-4" style={{ borderColor: borderColor }}>
                  <div className="flex justify-between text-lg font-bold">
                    <span style={{ color: textColor }}>Total</span>
                    <span style={{ color: primaryColor }}>{total.toFixed(2)} DA</span>
                  </div>
                </div>
              </div>

              {/* Coupon */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2" style={{ color: textColor }}>Coupon Code</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder="Enter code"
                    className="input-field flex-1"
                    style={{ borderColor: borderColor }}
                  />
                  <button
                    type="button"
                    onClick={applyCoupon}
                    className="btn-secondary px-4"
                    style={{ whiteSpace: 'nowrap' }}
                  >
                    Apply
                  </button>
                </div>
              </div>

              {/* Checkout Button */}
              <button
                onClick={() => {
                  setCheckoutLoading(true);
                  // In a real app, redirect to checkout
                  setTimeout(() => {
                    alert('Checkout functionality would redirect to payment processor');
                    setCheckoutLoading(false);
                  }, 1000);
                }}
                disabled={checkoutLoading}
                className="btn-primary w-full py-4 mb-4"
              >
                {checkoutLoading ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard size={20} />
                    Proceed to Checkout
                  </>
                )}
              </button>

              {/* Security Badges */}
              <div className="flex flex-wrap items-center justify-center gap-4 text-xs" style={{ color: textSecondaryColor }}>
                <div className="flex items-center gap-1"><Shield size={14} /> Secure Checkout</div>
                <div className="flex items-center gap-1"><Truck size={14} /> Free Shipping $50+</div>
                <div className="flex items-center gap-1"><RotateCcw size={14} /> 30-Day Returns</div>
              </div>

              {/* Continue Shopping */}
              <a href={`/storefront/${userId}/products`} className="btn-outline w-full py-3 mt-4 text-center">
                <ArrowLeft size={16} /> Continue Shopping
              </a>
            </div>
          </div>
        </div>
      </section>
    </StorefrontLayout>
  );
}