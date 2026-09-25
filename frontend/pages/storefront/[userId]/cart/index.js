import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import axios from "axios";
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowLeft,
  CreditCard,
  Shield,
  Truck,
  CheckCircle,
  Loader2,
  Banknote,
  Landmark,
  FileText,
  Package,
} from "lucide-react";
import toast from "react-hot-toast";
import StorefrontLayout from "../../../../components/storefront/StorefrontLayout";
import { assetUrl } from "../../../../lib/assetUrl";
import { useCart } from "../../../../lib/cart";
import { money, money2 } from "../../../../lib/money";

const PAYMENT_METHODS = [
  {
    value: "espèces",
    label: "Cash on delivery",
    hint: "Pay when your order arrives",
    icon: Banknote,
  },
  {
    value: "carte",
    label: "Credit / Debit card",
    hint: "We contact you to complete the payment",
    icon: CreditCard,
  },
  {
    value: "virement",
    label: "Bank transfer",
    hint: "Transfer details sent after ordering",
    icon: Landmark,
  },
  {
    value: "chèque",
    label: "Cheque",
    hint: "Cheque payable on delivery",
    icon: FileText,
  },
  {
    value: "autre",
    label: "Other",
    hint: "Arrange payment with the store",
    icon: Package,
  },
];

export default function StorefrontCartPage() {
  const router = useRouter();
  const { userId } = router.query;

  const [storeSettings, setStoreSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [order, setOrder] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("espèces");
  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
    city: "",
  });
  const [formErrors, setFormErrors] = useState({});

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
  const validUserId = userId && !isNaN(parseInt(userId)) ? parseInt(userId) : null;

  const cart = useCart(validUserId);
  const cartItems = cart.items;

  useEffect(() => {
    if (validUserId && router.isReady) {
      fetchStoreSettings();
    }
  }, [validUserId, router.isReady]);

  const fetchStoreSettings = async () => {
    try {
      const res = await axios.get(`${API_URL}/store-settings/public/${validUserId}`);
      setStoreSettings(res.data);
      const methods = res.data?.content_overrides?.payment_methods;
      if (Array.isArray(methods) && methods.length > 0) {
        setPaymentMethod((current) =>
          methods.includes(current) ? current : methods[0],
        );
      }
    } catch (err) {
      console.error("Error fetching store settings:", err);
    } finally {
      setLoading(false);
    }
  };

  const content = storeSettings?.content_overrides || {};
  const enabledMethods = Array.isArray(content.payment_methods)
    ? content.payment_methods.filter((m) =>
        PAYMENT_METHODS.some((p) => p.value === m),
      )
    : PAYMENT_METHODS.map((m) => m.value);
  const methods = PAYMENT_METHODS.filter((m) => enabledMethods.includes(m.value));

  const shippingFee = Number(content.shipping_fee ?? 30);
  const freeShippingThreshold = Number(content.free_shipping_threshold ?? 500);
  const taxRate = Number(content.tax_rate ?? 0);

  const subtotal = cartItems.reduce(
    (sum, item) => sum + Number(item.price) * (item.quantity || 0),
    0,
  );
  const shipping =
    shippingFee > 0 &&
    (freeShippingThreshold <= 0 || subtotal < freeShippingThreshold)
      ? shippingFee
      : 0;
  const tax = taxRate > 0 ? (subtotal * taxRate) / 100 : 0;
  const total = subtotal + shipping + tax;

  const outOfStockItems = cartItems.filter(
    (item) => Number.isFinite(Number(item.stock)) && item.quantity > Number(item.stock),
  );

  const validate = () => {
    const errors = {};
    if (!form.name.trim()) errors.name = "Full name is required";
    if (!form.phone.trim()) errors.phone = "Phone number is required";
    if (!form.address.trim()) errors.address = "Address is required";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const placeOrder = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    if (cartItems.length === 0) return;

    setPlacing(true);
    try {
      const res = await axios.post(
        `${API_URL}/storefront/${validUserId}/checkout`,
        {
          items: cartItems.map((item) => ({
            product_id: item.id,
            quantity: item.quantity,
          })),
          customer: {
            name: form.name.trim(),
            phone: form.phone.trim(),
            address: form.address.trim(),
            city: form.city.trim(),
          },
          payment_method: paymentMethod,
        },
      );
      setOrder(res.data);
      cart.clear();
      setCheckoutOpen(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      const data = err.response?.data;
      toast.error(data?.error || "Could not place your order");
      if (data?.available !== undefined && data?.product_id) {
        cart.update(data.product_id, data.available);
      }
    } finally {
      setPlacing(false);
    }
  };

  const textColor = storeSettings?.text_color || "#1F2937";
  const textSecondaryColor = storeSettings?.text_secondary_color || "#6B7280";
  const primaryColor = storeSettings?.primary_color || "#3B82F6";
  const accentColor = storeSettings?.accent_color || "#F59E0B";
  const containerWidth = storeSettings?.container_width || "max-w-7xl";
  const borderRadius = storeSettings?.border_radius || "0.75rem";
  const borderColor = storeSettings?.border_color || "#E5E7EB";

  /* ---------------------- order confirmation ---------------------- */
  if (order) {
    return (
      <StorefrontLayout
        storeSettings={storeSettings}
        userId={validUserId}
        pageTitle="Order Confirmed"
      >
        <section className="py-16 md:py-24">
          <div
            className={`${containerWidth} mx-auto px-4 sm:px-6 lg:px-8 max-w-2xl text-center`}
          >
            <div
              className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center"
              style={{ backgroundColor: "#DCFCE7", color: "#166534" }}
            >
              <CheckCircle size={40} />
            </div>
            <h1
              className="text-3xl font-bold mb-3"
              style={{ color: textColor, fontFamily: storeSettings?.heading_font_family }}
            >
              Thank you for your order
            </h1>
            <p className="mb-6" style={{ color: textSecondaryColor }}>
              {order.message}
            </p>

            <div
              className="card p-6 text-left mb-8"
              style={{ borderRadius: borderRadius, borderColor: borderColor }}
            >
              <div className="flex justify-between mb-2">
                <span style={{ color: textSecondaryColor }}>Order number</span>
                <span className="font-semibold" style={{ color: textColor }}>
                  {order.order_ref}
                </span>
              </div>
              <div className="flex justify-between mb-2">
                <span style={{ color: textSecondaryColor }}>Payment method</span>
                <span className="font-semibold" style={{ color: textColor }}>
                  {methods.find((m) => m.value === order.payment_method)?.label ||
                    order.payment_method}
                </span>
              </div>
              <div className="flex justify-between mb-2">
                <span style={{ color: textSecondaryColor }}>Items</span>
                <span className="font-semibold" style={{ color: textColor }}>
                  {order.items.reduce((sum, i) => sum + i.quantity, 0)}
                </span>
              </div>
              <div
                className="flex justify-between pt-3 mt-3 border-t"
                style={{ borderColor: borderColor }}
              >
                <span className="font-bold" style={{ color: textColor }}>
                  Total
                </span>
                <span className="font-bold" style={{ color: primaryColor }}>
                  {money2(order.total)}
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href={`/storefront/${validUserId}/products`} className="btn-primary px-8 py-3">
                Continue Shopping
              </Link>
              <button
                onClick={() => setOrder(null)}
                className="btn-outline px-8 py-3"
              >
                View Cart
              </button>
            </div>
          </div>
        </section>
      </StorefrontLayout>
    );
  }

  if (loading) {
    return (
      <StorefrontLayout storeSettings={null} userId={validUserId} pageTitle="Cart">
        <div className="store-container py-16">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mx-auto mb-8"></div>
            <div className="h-64 bg-gray-200 rounded-xl"></div>
          </div>
        </div>
      </StorefrontLayout>
    );
  }

  if (cartItems.length === 0) {
    return (
      <StorefrontLayout
        storeSettings={storeSettings}
        userId={validUserId}
        pageTitle="Shopping Cart"
      >
        <section className="py-16 md:py-24">
          <div className={`${containerWidth} mx-auto px-4 sm:px-6 lg:px-8 text-center`}>
            <div
              className="w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center"
              style={{ backgroundColor: primaryColor + "15", color: primaryColor }}
            >
              <ShoppingBag size={48} />
            </div>
            <h1
              className="text-3xl font-bold mb-4"
              style={{ color: textColor, fontFamily: storeSettings?.heading_font_family }}
            >
              Your Cart is Empty
            </h1>
            <p className="text-lg mb-8 max-w-md mx-auto" style={{ color: textSecondaryColor }}>
              Looks like you have not added any products yet. Start shopping to
              fill your cart.
            </p>
            <Link
              href={`/storefront/${validUserId}/products`}
              className="btn-primary inline-flex items-center gap-2 px-8 py-3"
            >
              <ArrowLeft size={20} />
              Continue Shopping
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
      pageTitle="Shopping Cart"
    >
      <section className="py-8 border-b" style={{ borderColor: borderColor }}>
        <div className={`${containerWidth} mx-auto px-4 sm:px-6 lg:px-8`}>
          <h1
            className="text-3xl font-bold"
            style={{ color: textColor, fontFamily: storeSettings?.heading_font_family }}
          >
            Shopping Cart ({cartItems.length} item
            {cartItems.length !== 1 ? "s" : ""})
          </h1>
        </div>
      </section>

      <section className="py-8">
        <div className={`${containerWidth} mx-auto px-4 sm:px-6 lg:px-8`}>
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {outOfStockItems.length > 0 && (
                <div
                  className="p-4 rounded-lg text-sm"
                  style={{ backgroundColor: "#FEF3C7", color: "#92400E" }}
                >
                  Some items exceed the available stock. Quantities have been
                  adjusted to what is in stock.
                </div>
              )}

              {cartItems.map((item) => {
                const maxQty = Number.isFinite(Number(item.stock))
                  ? Number(item.stock)
                  : Infinity;
                return (
                  <div
                    key={item.id}
                    className="card p-4 flex gap-4"
                    style={{ borderRadius: borderRadius, borderColor: borderColor }}
                  >
                    {item.image_url ? (
                      <img
                        src={assetUrl(item.image_url)}
                        alt={item.name}
                        className="w-20 h-20 object-cover flex-shrink-0"
                        style={{ borderRadius: borderRadius }}
                      />
                    ) : (
                      <div
                        className="w-20 h-20 flex items-center justify-center flex-shrink-0"
                        style={{
                          borderRadius: borderRadius,
                          backgroundColor: "#F3F4F6",
                          color: textSecondaryColor,
                        }}
                      >
                        <ShoppingBag size={24} />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate" style={{ color: textColor }}>
                        <Link
                          href={`/storefront/${validUserId}/product/${item.id}`}
                          className="hover:underline"
                        >
                          {item.name}
                        </Link>
                      </h3>
                      {item.category && (
                        <p className="text-sm mt-1" style={{ color: textSecondaryColor }}>
                          {item.category}
                        </p>
                      )}
                      <p className="font-bold mt-2" style={{ color: primaryColor }}>
                        {money(item.price)}
                      </p>
                      {item.original_price && (
                        <p
                          className="text-sm line-through"
                          style={{ color: textSecondaryColor }}
                        >
                          {money(item.original_price)}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-3">
                      <div
                        className="flex items-center gap-2 border rounded-lg"
                        style={{ borderColor: borderColor }}
                      >
                        <button
                          onClick={() => cart.update(item.id, item.quantity - 1)}
                          aria-label="Decrease quantity"
                          className="p-2 hover:bg-black/5 rounded-l-lg"
                          style={{ color: textSecondaryColor }}
                        >
                          <Minus size={16} />
                        </button>
                        <span className="w-10 text-center font-medium" style={{ color: textColor }}>
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => cart.update(item.id, item.quantity + 1)}
                          disabled={item.quantity >= maxQty}
                          aria-label="Increase quantity"
                          className="p-2 hover:bg-black/5 rounded-r-lg disabled:opacity-40"
                          style={{ color: textSecondaryColor }}
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                      <p className="font-semibold" style={{ color: textColor }}>
                        {money2(Number(item.price) * item.quantity)}
                      </p>
                      <button
                        onClick={() => cart.remove(item.id)}
                        className="text-red-500 hover:text-red-700 text-sm font-medium flex items-center gap-1"
                      >
                        <Trash2 size={16} /> Remove
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Order Summary */}
            <div
              className="card p-6 sticky top-24"
              style={{
                borderRadius: borderRadius,
                borderColor: borderColor,
                height: "fit-content",
              }}
            >
              <h2
                className="text-xl font-bold mb-6"
                style={{ color: textColor, fontFamily: storeSettings?.heading_font_family }}
              >
                Order Summary
              </h2>

              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-sm">
                  <span style={{ color: textSecondaryColor }}>
                    Subtotal ({cartItems.length} items)
                  </span>
                  <span style={{ color: textColor }}>{money2(subtotal)}</span>
                </div>

                <div className="flex justify-between text-sm">
                  <span style={{ color: textSecondaryColor }}>Shipping</span>
                  <span
                    className="font-semibold"
                    style={{ color: shipping === 0 ? "#166534" : textColor }}
                  >
                    {shipping === 0 ? "Free" : money2(shipping)}
                  </span>
                </div>

                {taxRate > 0 && (
                  <div className="flex justify-between text-sm">
                    <span style={{ color: textSecondaryColor }}>
                      Tax ({taxRate}%)
                    </span>
                    <span style={{ color: textColor }}>{money2(tax)}</span>
                  </div>
                )}

                <div
                  className="border-t pt-4"
                  style={{ borderColor: borderColor }}
                >
                  <div className="flex justify-between text-lg font-bold">
                    <span style={{ color: textColor }}>Total</span>
                    <span style={{ color: primaryColor }}>{money2(total)}</span>
                  </div>
                </div>
              </div>

              {/* Payment method */}
              <div className="mb-6">
                <p className="text-sm font-medium mb-2" style={{ color: textColor }}>
                  Payment method
                </p>
                <div className="space-y-2">
                  {methods.map((method) => {
                    const Icon = method.icon;
                    const active = paymentMethod === method.value;
                    return (
                      <label
                        key={method.value}
                        className="flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors"
                        style={{
                          border: `1px solid ${active ? primaryColor : borderColor}`,
                          backgroundColor: active ? primaryColor + "0D" : "transparent",
                        }}
                      >
                        <input
                          type="radio"
                          name="payment_method"
                          value={method.value}
                          checked={active}
                          onChange={() => setPaymentMethod(method.value)}
                          className="mt-1"
                          style={{ accentColor: primaryColor }}
                        />
                        <span className="flex-1 min-w-0">
                          <span
                            className="flex items-center gap-2 text-sm font-semibold"
                            style={{ color: textColor }}
                          >
                            <Icon size={15} /> {method.label}
                          </span>
                          <span className="block text-xs" style={{ color: textSecondaryColor }}>
                            {method.hint}
                          </span>
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {!checkoutOpen ? (
                <>
                  <button
                    onClick={() => setCheckoutOpen(true)}
                    className="btn-primary w-full py-4 mb-4"
                  >
                    <CreditCard size={20} /> Proceed to Checkout
                  </button>

                  <div
                    className="flex flex-wrap items-center justify-center gap-4 text-xs"
                    style={{ color: textSecondaryColor }}
                  >
                    <span className="flex items-center gap-1">
                      <Shield size={14} /> Secure Checkout
                    </span>
                    <span className="flex items-center gap-1">
                      <Truck size={14} />
                      {freeShippingThreshold > 0
                        ? `Free shipping over ${money(freeShippingThreshold)}`
                        : "Shipping calculated above"}
                    </span>
                  </div>
                </>
              ) : (
                <form onSubmit={placeOrder} className="space-y-3">
                  <p className="text-sm font-semibold" style={{ color: textColor }}>
                    Delivery details
                  </p>
                  {[
                    { key: "name", label: "Full name", type: "text", placeholder: "Amine El Amrani" },
                    { key: "phone", label: "Phone", type: "tel", placeholder: "+212 6 00 00 00 00" },
                    { key: "address", label: "Address", type: "text", placeholder: "12 Rue Al Massira" },
                    { key: "city", label: "City", type: "text", placeholder: "Casablanca" },
                  ].map((field) => (
                    <div key={field.key}>
                      <label
                        className="block text-xs font-medium mb-1"
                        style={{ color: textSecondaryColor }}
                      >
                        {field.label}
                        {field.key !== "city" ? " *" : ""}
                      </label>
                      <input
                        type={field.type}
                        value={form[field.key]}
                        onChange={(e) =>
                          setForm({ ...form, [field.key]: e.target.value })
                        }
                        placeholder={field.placeholder}
                        className="input-field py-2 text-sm"
                        style={{
                          borderColor: formErrors[field.key] ? "#EF4444" : borderColor,
                        }}
                      />
                      {formErrors[field.key] && (
                        <p className="text-xs mt-1 text-red-500">
                          {formErrors[field.key]}
                        </p>
                      )}
                    </div>
                  ))}

                  <button
                    type="submit"
                    disabled={placing}
                    className="btn-primary w-full py-4"
                  >
                    {placing ? (
                      <>
                        <Loader2 size={20} className="animate-spin" />
                        Placing order...
                      </>
                    ) : (
                      <>
                        <CheckCircle size={18} />
                        Place order · {money2(total)}
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setCheckoutOpen(false)}
                    className="btn-outline w-full py-3"
                    disabled={placing}
                  >
                    Back
                  </button>
                </form>
              )}

              <Link
                href={`/storefront/${validUserId}/products`}
                className="btn-outline w-full py-3 mt-4"
              >
                <ArrowLeft size={16} /> Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </section>
    </StorefrontLayout>
  );
}
