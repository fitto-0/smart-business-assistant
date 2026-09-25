import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import axios from "axios";
import {
  Mail,
  Phone,
  MapPin,
  Send,
  CheckCircle,
  AlertCircle,
  Loader2,
  Facebook,
  Instagram,
  Twitter,
  MessageCircle,
  ChevronRight,
} from "lucide-react";
import StorefrontLayout from "../../../../components/storefront/StorefrontLayout";
import { money } from "../../../../lib/money";

const SUBJECT_LABELS = {
  general: "General Inquiry",
  order: "Order Support",
  product: "Product Question",
  returns: "Returns & Exchanges",
  wholesale: "Wholesale Inquiry",
  other: "Other",
};

export default function StorefrontContactPage() {
  const router = useRouter();
  const { userId } = router.query;

  const [storeSettings, setStoreSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [formStatus, setFormStatus] = useState({ type: "", message: "" });
  const [submitting, setSubmitting] = useState(false);

  const API_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
  const validUserId =
    userId && !isNaN(parseInt(userId)) ? parseInt(userId) : null;

  useEffect(() => {
    if (validUserId && router.isReady) {
      fetchStoreSettings();
    }
  }, [validUserId, router.isReady]);

  const fetchStoreSettings = async () => {
    try {
      const res = await axios.get(
        `${API_URL}/store-settings/public/${validUserId}`,
      );
      setStoreSettings(res.data);
    } catch (err) {
      console.error("Error fetching store settings:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormStatus({ type: "", message: "" });

    try {
      const res = await axios.post(
        `${API_URL}/storefront/${validUserId}/contact`,
        {
          name: formData.name,
          email: formData.email,
          subject:
            SUBJECT_LABELS[formData.subject] || formData.subject || "New message",
          message: formData.message,
        },
      );
      setFormStatus({
        type: "success",
        message:
          res.data?.message ||
          "Thank you for your message! We will get back to you shortly.",
      });
      setFormData({ name: "", email: "", subject: "", message: "" });
    } catch (err) {
      setFormStatus({
        type: "error",
        message:
          err.response?.data?.error ||
          "Failed to send message. Please try again later.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <StorefrontLayout
        storeSettings={null}
        userId={validUserId}
        pageTitle="Contact"
      >
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

  const textColor = storeSettings?.text_color || "#1F2937";
  const textSecondaryColor = storeSettings?.text_secondary_color || "#6B7280";
  const primaryColor = storeSettings?.primary_color || "#3B82F6";
  const secondaryColor = storeSettings?.secondary_color || "#1E40AF";
  const accentColor = storeSettings?.accent_color || "#F59E0B";
  const containerWidth = storeSettings?.container_width || "max-w-7xl";
  const borderRadius = storeSettings?.border_radius || "0.75rem";
  const borderColor = storeSettings?.border_color || "#E5E7EB";
  const content = storeSettings?.content_overrides || {};

  const freeShippingThreshold = Number(content.free_shipping_threshold ?? 500);
  const shippingFee = Number(content.shipping_fee ?? 30);
  const contactFormEnabled = storeSettings?.contact_form_enabled !== false;

  const PAYMENT_LABELS = {
    "espèces": "cash on delivery",
    carte: "credit or debit card",
    virement: "bank transfer",
    "chèque": "cheque",
    autre: "other arrangements",
  };
  const enabledPayments = (
    Array.isArray(content.payment_methods) && content.payment_methods.length
      ? content.payment_methods
      : ["espèces", "carte", "virement", "chèque", "autre"]
  )
    .map((m) => PAYMENT_LABELS[m])
    .filter(Boolean);

  const defaultFaqs = [
    {
      q: "What are your shipping options?",
      a:
        freeShippingThreshold > 0
          ? `Orders are prepared and shipped quickly. Standard delivery costs ${money(shippingFee)} and is free on orders over ${money(freeShippingThreshold)}.`
          : `Orders are prepared and shipped quickly. Delivery costs ${money(shippingFee)} and the exact fee is confirmed with you by phone.`,
    },
    {
      q: "What payment methods do you accept?",
      a: `You can pay with: ${enabledPayments.join(", ")}.`,
    },
    {
      q: "What is your return policy?",
      a:
        content.return_policy ||
        "You have 30 days to return an item in its original condition. Refunds are issued once the return is received and inspected.",
    },
    {
      q: "How can I track my order?",
      a: "After placing an order you receive an order number. Use it with your phone number to ask us for a status update at any time.",
    },
    {
      q: "How can I reach you?",
      a: [
        storeSettings?.contact_phone ? `by phone at ${storeSettings.contact_phone}` : null,
        storeSettings?.contact_email ? `by email at ${storeSettings.contact_email}` : null,
      ]
        .filter(Boolean)
        .join(" or ") || "Use the contact form on this page.",
    },
  ];
  const faqs =
    Array.isArray(content.faq) && content.faq.length > 0 ? content.faq : defaultFaqs;

  const contactInfo = [
    storeSettings?.contact_email && {
      icon: Mail,
      title: "Email Us",
      value: storeSettings.contact_email,
      href: `mailto:${storeSettings.contact_email}`,
    },
    storeSettings?.contact_phone && {
      icon: Phone,
      title: "Call Us",
      value: storeSettings.contact_phone,
      href: `tel:${storeSettings.contact_phone}`,
    },
    (storeSettings?.address || storeSettings?.city) && {
      icon: MapPin,
      title: "Visit Us",
      value: [storeSettings?.address, storeSettings?.city, storeSettings?.country]
        .filter(Boolean)
        .join(", "),
      href: null,
    },
  ].filter(Boolean);

  const socialLinks = [
    { icon: Facebook, url: storeSettings?.facebook_url, label: "Facebook" },
    { icon: Instagram, url: storeSettings?.instagram_url, label: "Instagram" },
    { icon: Twitter, url: storeSettings?.twitter_url, label: "Twitter" },
    {
      icon: MessageCircle,
      url: storeSettings?.whatsapp_number
        ? `https://wa.me/${storeSettings.whatsapp_number.replace(/\D/g, "")}`
        : null,
      label: "WhatsApp",
    },
  ].filter((item) => item.url);

  return (
    <StorefrontLayout
      storeSettings={storeSettings}
      userId={validUserId}
      pageTitle="Contact Us"
    >
      <section
        className="py-16 md:py-24"
        style={{ backgroundColor: "rgba(0,0,0,0.02)" }}
      >
        <div
          className={`${containerWidth} mx-auto px-4 sm:px-6 lg:px-8 text-center`}
        >
          <h1
            className="text-4xl md:text-5xl font-bold mb-6"
            style={{
              color: textColor,
              fontFamily: storeSettings?.heading_font_family,
            }}
          >
            {content.contact_title ||
              storeSettings?.contact_info_title ||
              "Get in Touch"}
          </h1>
          <p
            className="text-xl max-w-3xl mx-auto"
            style={{ color: textSecondaryColor }}
          >
            {storeSettings?.contact_info_subtitle ||
              "Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible."}
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className={`${containerWidth} mx-auto px-4 sm:px-6 lg:px-8`}>
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Contact Info */}
            <div className={contactFormEnabled ? "lg:col-span-1" : "lg:col-span-3"}>
              <div
                className="p-6 rounded-2xl"
                style={{
                  backgroundColor: "rgba(0,0,0,0.02)",
                  borderRadius: borderRadius,
                }}
              >
                <h2
                  className="text-xl font-bold mb-6"
                  style={{
                    color: textColor,
                    fontFamily: storeSettings?.heading_font_family,
                  }}
                >
                  {content.contact_title || "Contact Information"}
                </h2>

                <div className="space-y-6">
                  {contactInfo.map((item, index) => (
                    <a
                      key={index}
                      href={item.href}
                      className="flex items-start gap-4 p-4 rounded-xl hover:bg-white/50 transition-colors"
                      style={{ borderRadius: borderRadius }}
                    >
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{
                          backgroundColor: primaryColor + "15",
                          color: primaryColor,
                        }}
                      >
                        <item.icon size={20} />
                      </div>
                      <div>
                        <h3
                          className="font-medium mb-1"
                          style={{ color: textColor }}
                        >
                          {item.title}
                        </h3>
                        <p
                          className="text-sm"
                          style={{ color: textSecondaryColor }}
                        >
                          {item.value}
                        </p>
                      </div>
                    </a>
                  ))}

                  {socialLinks.length > 0 && (
                    <div
                      className="pt-6 border-t"
                      style={{ borderColor: borderColor }}
                    >
                      <h3
                        className="font-medium mb-4"
                        style={{ color: textColor }}
                      >
                        Follow Us
                      </h3>
                      <div className="flex gap-3">
                        {socialLinks.map((social, index) => (
                          <a
                            key={index}
                            href={social.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-10 h-10 rounded-lg flex items-center justify-center transition-colors"
                            style={{
                              backgroundColor: "rgba(0,0,0,0.05)",
                              color: textSecondaryColor,
                            }}
                          >
                            <social.icon size={20} />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {storeSettings?.contact_map_embed && (
                    <div
                      className="pt-6 border-t"
                      style={{ borderColor: borderColor }}
                    >
                      <h3
                        className="font-medium mb-4"
                        style={{ color: textColor }}
                      >
                        Find Us
                      </h3>
                      <div
                        className="rounded-xl overflow-hidden"
                        style={{ borderRadius: borderRadius }}
                      >
                        <iframe
                          src={storeSettings.contact_map_embed}
                          width="100%"
                          height={200}
                          style={{ border: 0 }}
                          allowFullScreen=""
                          loading="lazy"
                        ></iframe>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Contact Form */}
            {contactFormEnabled && (
            <div className="lg:col-span-2">
              <div
                className="card p-6 md:p-8"
                style={{ borderRadius: borderRadius, borderColor: borderColor }}
              >
                <h2
                  className="text-2xl font-bold mb-6"
                  style={{
                    color: textColor,
                    fontFamily: storeSettings?.heading_font_family,
                  }}
                >
                  Send us a Message
                </h2>

                {formStatus.type === "success" && (
                  <div
                    className="mb-6 p-4 rounded-xl flex items-center gap-3"
                    style={{
                      backgroundColor: "#D1FAE5",
                      borderColor: "#10B981",
                      borderRadius: borderRadius,
                    }}
                  >
                    <CheckCircle size={20} className="text-green-600" />
                    <p className="text-green-800">{formStatus.message}</p>
                  </div>
                )}

                {formStatus.type === "error" && (
                  <div
                    className="mb-6 p-4 rounded-xl flex items-center gap-3"
                    style={{
                      backgroundColor: "#FEE2E2",
                      borderColor: "#EF4444",
                      borderRadius: borderRadius,
                    }}
                  >
                    <AlertCircle size={20} className="text-red-600" />
                    <p className="text-red-800">{formStatus.message}</p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label
                        htmlFor="name"
                        className="block text-sm font-medium mb-2"
                        style={{ color: textColor }}
                      >
                        Your Name *
                      </label>
                      <input
                        type="text"
                        id="name"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        className="input-field"
                        placeholder="John Doe"
                        required
                        style={{ borderColor: borderColor }}
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="email"
                        className="block text-sm font-medium mb-2"
                        style={{ color: textColor }}
                      >
                        Email Address *
                      </label>
                      <input
                        type="email"
                        id="email"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        className="input-field"
                        placeholder="john@example.com"
                        required
                        style={{ borderColor: borderColor }}
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="subject"
                      className="block text-sm font-medium mb-2"
                      style={{ color: textColor }}
                    >
                      Subject *
                    </label>
                    <select
                      id="subject"
                      value={formData.subject}
                      onChange={(e) =>
                        setFormData({ ...formData, subject: e.target.value })
                      }
                      className="input-field"
                      required
                      style={{ borderColor: borderColor }}
                    >
                      <option value="">Select a subject</option>
                      <option value="general">General Inquiry</option>
                      <option value="order">Order Support</option>
                      <option value="product">Product Question</option>
                      <option value="returns">Returns & Exchanges</option>
                      <option value="wholesale">Wholesale Inquiry</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="message"
                      className="block text-sm font-medium mb-2"
                      style={{ color: textColor }}
                    >
                      Message *
                    </label>
                    <textarea
                      id="message"
                      value={formData.message}
                      onChange={(e) =>
                        setFormData({ ...formData, message: e.target.value })
                      }
                      rows={5}
                      className="input-field resize-none"
                      placeholder="How can we help you?"
                      required
                      style={{ borderColor: borderColor }}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-primary w-full sm:w-auto py-3 px-8"
                  >
                    {submitting ? (
                      <>
                        <Loader2 size={20} className="animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send size={20} />
                        Send Message
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
            )}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section
        className="py-16"
        style={{ backgroundColor: "rgba(0,0,0,0.02)" }}
      >
        <div className={`${containerWidth} mx-auto px-4 sm:px-6 lg:px-8`}>
          <div className="text-center mb-12">
            <h2
              className="text-3xl font-bold mb-4"
              style={{
                color: textColor,
                fontFamily: storeSettings?.heading_font_family,
              }}
            >
              Frequently Asked Questions
            </h2>
            <p
              className="text-lg max-w-2xl mx-auto"
              style={{ color: textSecondaryColor }}
            >
              Quick answers to common questions
            </p>
          </div>

          <div className="max-w-3xl mx-auto space-y-4">
            {faqs.map((faq, index) => (
              <details
                key={index}
                className="group card p-6"
                style={{ borderRadius: borderRadius, borderColor: borderColor }}
              >
                <summary
                  className="flex items-center justify-between cursor-pointer font-medium"
                  style={{ color: textColor }}
                >
                  {faq.q}
                  <ChevronRight
                    size={20}
                    className="transition-transform group-open:rotate-90"
                    style={{ color: primaryColor }}
                  />
                </summary>
                <p className="mt-4" style={{ color: textSecondaryColor }}>
                  {faq.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </StorefrontLayout>
  );
}
