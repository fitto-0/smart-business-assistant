import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import {
  ShoppingBag,
  Eye,
  Settings,
  Sparkles,
  ExternalLink,
  ToggleLeft,
  ToggleRight,
  Save,
  RefreshCw,
  Palette,
  Phone,
  Mail,
  MapPin,
  Globe,
  BarChart3,
  Star,
  Package,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Copy,
  MessageCircle,
  Image,
  Link,
  Upload,
  Trash2,
  Zap,
  Shield,
  Type,
} from "lucide-react";
import toast from "react-hot-toast";
import { apiGet, apiPost, apiPut } from "../../lib/api";
import { getUser } from "../../lib/auth";
import { useLanguage } from "../../lib/LanguageContext";
import Layout from "../../components/Layout";

const DEFAULT_COLORS = {
  primary: "#3B82F6",
  secondary: "#1E40AF",
  accent: "#1C352D",
};

const API_ORIGIN = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"
).replace(/\/api\/?$/, "");

const getAssetUrl = (url) => {
  if (!url) return "";
  return url.startsWith("http") ? url : `${API_ORIGIN}${url}`;
};

export default function StorefrontCustomize() {
  const router = useRouter();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("branding");
  const [storeSettings, setStoreSettings] = useState({
    store_name: "",
    logo_url: null,
    primary_color: DEFAULT_COLORS.primary,
    secondary_color: DEFAULT_COLORS.secondary,
    accent_color: DEFAULT_COLORS.accent,
    background_color: "#FFFFFF",
    background_type: "color",
    background_gradient: "",
    text_color: "#1F2937",
    text_secondary_color: "#6B7280",
    border_color: "#E5E7EB",
    header_background_color: "#FFFFFF",
    footer_background_color: "#1E40AF",
    card_background_color: "#FFFFFF",
    card_text_color: "#1F2937",
    button_text_color: "#FFFFFF",
    font_family: "Inter, system-ui, sans-serif",
    heading_font_family: "Inter, system-ui, sans-serif",
    font_size_base: "16px",
    container_width: "max-w-7xl",
    border_radius: "0.75rem",
    content_overrides: {},
    description: "",
    tagline: "",
    contact_email: "",
    contact_phone: "",
    address: "",
    city: "",
    country: "",
    custom_domain: "",
    domain_verified: false,
    facebook_url: "",
    instagram_url: "",
    twitter_url: "",
    whatsapp_number: "",
    storefront_enabled: true,
  });
  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [logoPreview, setLogoPreview] = useState(null);
  const storefrontUserId = storeSettings.user_id || getUser()?.id;

  useEffect(() => {
    loadStoreSettings();
    loadAnalytics();
  }, []);

  const loadStoreSettings = async () => {
    try {
      const data = await apiGet("/store-settings");
      setStoreSettings((prev) => ({ ...prev, ...data }));
    } catch (err) {
      console.error("Failed to load store settings:", err);
      toast.error(t("storefront.loadError") || "Failed to load store settings");
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async () => {
    setAnalyticsLoading(true);
    try {
      const data = await apiGet("/store-settings/analytics");
      setAnalytics(data);
    } catch (err) {
      console.error("Failed to load analytics:", err);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setStoreSettings((prev) => ({ ...prev, [field]: value }));
  };

  const handleContentChange = (field, value) => {
    setStoreSettings((prev) => ({
      ...prev,
      content_overrides: { ...(prev.content_overrides || {}), [field]: value },
    }));
  };

  const PAYMENT_OPTIONS = [
    ["espèces", "Cash on delivery"],
    ["carte", "Credit / debit card"],
    ["virement", "Bank transfer"],
    ["chèque", "Cheque"],
    ["autre", "Other"],
  ];

  const contentList = (field) => {
    const value = (storeSettings.content_overrides || {})[field];
    return Array.isArray(value) ? value : [];
  };

  const updateContentItem = (field, index, key, value) => {
    const list = contentList(field).map((item, i) =>
      i === index ? { ...item, [key]: value } : item,
    );
    handleContentChange(field, list);
  };

  const addContentItem = (field, template) => {
    handleContentChange(field, [...contentList(field), template]);
  };

  const removeContentItem = (field, index) => {
    handleContentChange(
      field,
      contentList(field).filter((_, i) => i !== index),
    );
  };

  const enabledPayments = Array.isArray(
    (storeSettings.content_overrides || {}).payment_methods,
  )
    ? storeSettings.content_overrides.payment_methods
    : PAYMENT_OPTIONS.map(([value]) => value);

  const togglePaymentMethod = (value) => {
    if (enabledPayments.includes(value) && enabledPayments.length === 1) {
      toast.error("Keep at least one payment method enabled");
      return;
    }
    handleContentChange(
      "payment_methods",
      enabledPayments.includes(value)
        ? enabledPayments.filter((m) => m !== value)
        : [...enabledPayments, value],
    );
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error(
        t("storefront.invalidImageType") || "Please select an image file",
      );
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error(
        t("storefront.imageTooLarge") || "Image size must be less than 2MB",
      );
      return;
    }

    try {
      const formData = new FormData();
      formData.append("logo", file);

      const data = await apiPost("/store-settings/logo", formData);

      setStoreSettings((prev) => ({ ...prev, logo_url: data.logo_url }));
      setLogoPreview(getAssetUrl(data.logo_url));
      toast.success(
        t("storefront.logoUploaded") || "Logo uploaded successfully",
      );
    } catch (err) {
      toast.error(
        err.message ||
          t("storefront.logoUploadFailed") ||
          "Failed to upload logo",
      );
    }
  };

  const handleRemoveLogo = async () => {
    try {
      await apiPut("/store-settings", { logo_url: "" });
      setStoreSettings((prev) => ({ ...prev, logo_url: null }));
      setLogoPreview(null);
      toast.success(t("storefront.logoRemoved") || "Logo removed");
    } catch (err) {
      toast.error(
        err.message || t("storefront.logoRemoveFailed") || "Failed to remove logo",
      );
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiPut("/store-settings", storeSettings);
      toast.success(
        t("storefront.saved") || "Store settings saved successfully",
      );
    } catch (err) {
      toast.error(
        err.message || t("storefront.saveError") || "Failed to save settings",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDomainVerify = async () => {
    if (!storeSettings.custom_domain) {
      toast.error(
        t("storefront.enterDomainFirst") || "Please enter a domain first",
      );
      return;
    }

    toast.loading(t("storefront.verifyingDomain") || "Verifying domain...", {
      id: "domain-verify",
    });
    try {
      await apiPut("/store-settings/verify-domain", {
        domain: storeSettings.custom_domain,
      });
      setStoreSettings((prev) => ({ ...prev, domain_verified: true }));
      toast.success(
        t("storefront.domainVerified") || "Domain verified successfully!",
        { id: "domain-verify" },
      );
    } catch (err) {
      toast.error(
        err.message ||
          t("storefront.domainVerifyFailed") ||
          "Domain verification failed",
        { id: "domain-verify" },
      );
    }
  };

  const handleDomainRemove = async () => {
    if (!storeSettings.custom_domain) return;
    if (!confirm(t("storefront.domain.removeConfirm") || "Remove this custom domain? Your store will fall back to the default URL.")) return;
    try {
      const { apiDelete } = await import("../../lib/api");
      await apiDelete("/store-settings/domain");
      setStoreSettings((prev) => ({ ...prev, custom_domain: "", domain_verified: false }));
      toast.success(t("storefront.domain.removed") || "Custom domain removed");
    } catch (err) {
      toast.error(err.message || "Failed to remove domain");
    }
  };

  const tabs = [
    {
      id: "branding",
      label: t("storefront.tabs.branding") || "Branding",
      icon: Palette,
    },
    {
      id: "info",
      label: t("storefront.tabs.info") || "Store Info",
      icon: Settings,
    },
    {
      id: "design",
      label: "Design",
      icon: Palette,
    },
    {
      id: "content",
      label: "Content",
      icon: Type,
    },
    {
      id: "domain",
      label: t("storefront.tabs.domain") || "Domain",
      icon: Globe,
    },
    {
      id: "social",
      label: t("storefront.tabs.social") || "Social",
      icon: MessageCircle,
    },
    {
      id: "analytics",
      label: t("storefront.tabs.analytics") || "Analytics",
      icon: BarChart3,
    },
    {
      id: "preview",
      label: t("storefront.tabs.preview") || "Preview",
      icon: Eye,
    },
  ];

  if (loading) {
    return (
      <Layout title={t("storefront.title") || "Customize Your Store"}>
        <div className="bg-ground-secondary border hairline rounded-xl text-center py-16 portal-text">
          {t("storefront.loading") || "Loading store settings..."}
        </div>
      </Layout>
    );
  }

  const renderBrandingTab = () => (
    <div className="space-y-6">
      <div className="bg-ground-secondary border hairline rounded-xl p-4 sm:p-6">
        <h3 className="portal-heading text-lg mb-6 flex items-center gap-2">
          <Palette size={20} className="text-amber" />
          {t("storefront.sections.visualIdentity") || "Visual Identity"}
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <label className="block portal-label mb-3">
              {t("storefront.fields.logo") || "Store Logo"}
            </label>
            <div className="space-y-3 max-w-xs w-full mx-auto lg:mx-0">
              <div className="relative">
                <div
                  className="w-full aspect-square max-h-64 bg-ground border-2 border-dashed hairline rounded-xl flex items-center justify-center cursor-pointer hover:border-amber/50 transition-colors overflow-hidden p-2 text-center"
                  onClick={() =>
                    document.getElementById("logo-upload")?.click()
                  }
                >
                  {storeSettings.logo_url || logoPreview ? (
                    <img
                      src={getAssetUrl(storeSettings.logo_url || logoPreview)}
                      alt="Logo preview"
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-muted">
                      <Upload size={32} />
                      <span className="portal-label">
                        {t("storefront.clickToUpload") ||
                          "Click to upload logo"}
                      </span>
                      <p className="text-xs">
                        {t("storefront.maxSize") || "Max 2MB, PNG/JPG"}
                      </p>
                    </div>
                  )}
                  <input
                    id="logo-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                </div>
                {storeSettings.logo_url && (
                  <button
                    onClick={handleRemoveLogo}
                    className="absolute top-2 right-2 w-8 h-8 bg-red-500/90 text-white rounded-full flex items-center justify-center hover:bg-red-500 transition-colors shadow-lg"
                    title={t("storefront.removeLogo") || "Remove logo"}
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6 min-w-0">
            <div>
              <label className="block portal-label mb-3">
                {t("storefront.fields.storeName") || "Store Name"}
              </label>
              <input
                type="text"
                value={storeSettings.store_name}
                onChange={(e) => handleChange("store_name", e.target.value)}
                placeholder={
                  t("storefront.placeholders.storeName") || "My Awesome Store"
                }
                className="w-full bg-ground border hairline rounded-xl px-4 py-3 text-ink placeholder-muted focus:outline-none focus:border-amber transition-colors"
              />
            </div>

            <div>
              <label className="block portal-label mb-3">
                {t("storefront.fields.tagline") || "Tagline"}
              </label>
              <input
                type="text"
                value={storeSettings.tagline}
                onChange={(e) => handleChange("tagline", e.target.value)}
                placeholder={
                  t("storefront.placeholders.tagline") || "Your tagline here"
                }
                className="w-full bg-ground border hairline rounded-xl px-4 py-3 text-ink placeholder-muted focus:outline-none focus:border-amber transition-colors"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              <div className="min-w-0">
                <label className="block portal-label mb-2">
                  {t("storefront.fields.primaryColor") || "Primary Color"}
                </label>
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <input
                    type="color"
                    value={storeSettings.primary_color}
                    onChange={(e) =>
                      handleChange("primary_color", e.target.value)
                    }
                    className="w-11 h-11 sm:w-12 sm:h-12 rounded-lg border hairline cursor-pointer p-1 shrink-0"
                    title={t("storefront.fields.primaryColor")}
                  />
                  <input
                    type="text"
                    value={storeSettings.primary_color}
                    onChange={(e) =>
                      handleChange("primary_color", e.target.value)
                    }
                    className="flex-1 min-w-0 bg-ground border hairline rounded-xl px-3 sm:px-4 py-3 text-ink uppercase font-mono text-sm focus:outline-none focus:border-amber transition-colors"
                  />
                </div>
              </div>
              <div className="min-w-0">
                <label className="block portal-label mb-2">
                  {t("storefront.fields.secondaryColor") || "Secondary Color"}
                </label>
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <input
                    type="color"
                    value={storeSettings.secondary_color}
                    onChange={(e) =>
                      handleChange("secondary_color", e.target.value)
                    }
                    className="w-11 h-11 sm:w-12 sm:h-12 rounded-lg border hairline cursor-pointer p-1 shrink-0"
                    title={t("storefront.fields.secondaryColor")}
                  />
                  <input
                    type="text"
                    value={storeSettings.secondary_color}
                    onChange={(e) =>
                      handleChange("secondary_color", e.target.value)
                    }
                    className="flex-1 min-w-0 bg-ground border hairline rounded-xl px-3 sm:px-4 py-3 text-ink uppercase font-mono text-sm focus:outline-none focus:border-amber transition-colors"
                  />
                </div>
              </div>
              <div className="min-w-0 sm:col-span-2 xl:col-span-1">
                <label className="block portal-label mb-2">
                  {t("storefront.fields.accentColor") || "Accent Color"}
                </label>
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <input
                    type="color"
                    value={storeSettings.accent_color}
                    onChange={(e) =>
                      handleChange("accent_color", e.target.value)
                    }
                    className="w-11 h-11 sm:w-12 sm:h-12 rounded-lg border hairline cursor-pointer p-1 shrink-0"
                    title={t("storefront.fields.accentColor")}
                  />
                  <input
                    type="text"
                    value={storeSettings.accent_color}
                    onChange={(e) =>
                      handleChange("accent_color", e.target.value)
                    }
                    className="flex-1 min-w-0 bg-ground border hairline rounded-xl px-3 sm:px-4 py-3 text-ink uppercase font-mono text-sm focus:outline-none focus:border-amber transition-colors"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-ground-secondary border hairline rounded-xl p-4 sm:p-6">
        <h3 className="portal-heading text-lg mb-6 flex items-center gap-2">
          <Zap size={20} className="text-amber" />
          {t("storefront.sections.colorPreview") || "Color Preview"}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div
            className="p-4 sm:p-6 rounded-xl flex flex-col items-center justify-center min-w-0 break-all"
            style={{ backgroundColor: storeSettings.primary_color }}
          >
            <span className="text-white font-semibold text-lg">Primary</span>
            <span className="text-white/80 text-sm font-mono break-all">
              {storeSettings.primary_color}
            </span>
          </div>
          <div
            className="p-4 sm:p-6 rounded-xl flex flex-col items-center justify-center min-w-0 break-all"
            style={{ backgroundColor: storeSettings.secondary_color }}
          >
            <span className="text-white font-semibold text-lg">Secondary</span>
            <span className="text-white/80 text-sm font-mono break-all">
              {storeSettings.secondary_color}
            </span>
          </div>
          <div
            className="p-4 sm:p-6 rounded-xl flex flex-col items-center justify-center min-w-0 break-all"
            style={{ backgroundColor: storeSettings.accent_color }}
          >
            <span className="text-white font-semibold text-lg">Accent</span>
            <span className="text-white/80 text-sm font-mono break-all">
              {storeSettings.accent_color}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderInfoTab = () => (
    <div className="space-y-6">
      <div className="bg-ground-secondary border hairline rounded-xl p-4 sm:p-6">
        <h3 className="portal-heading text-lg mb-6 flex items-center gap-2">
          <Settings size={20} className="text-amber" />
          {t("storefront.sections.storeDetails") || "Store Details"}
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block portal-label mb-2">
              {t("storefront.fields.description") || "Description"}
            </label>
            <textarea
              value={storeSettings.description}
              onChange={(e) => handleChange("description", e.target.value)}
              rows={4}
              placeholder={
                t("storefront.placeholders.description") ||
                "Describe your store..."
              }
              className="w-full bg-ground border hairline rounded-xl px-4 py-3 text-ink placeholder-muted focus:outline-none focus:border-amber transition-colors resize-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block portal-label mb-2">
                {t("storefront.fields.contactEmail") || "Contact Email"}
              </label>
              <div className="relative">
                <Mail
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
                />
                <input
                  type="email"
                  value={storeSettings.contact_email}
                  onChange={(e) =>
                    handleChange("contact_email", e.target.value)
                  }
                  placeholder={
                    t("storefront.placeholders.email") || "contact@store.com"
                  }
                  className="w-full bg-ground border hairline rounded-xl px-4 py-3 pl-10 text-ink placeholder-muted focus:outline-none focus:border-amber transition-colors"
                />
              </div>
            </div>
            <div>
              <label className="block portal-label mb-2">
                {t("storefront.fields.contactPhone") || "Contact Phone"}
              </label>
              <div className="relative">
                <Phone
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
                />
                <input
                  type="tel"
                  value={storeSettings.contact_phone}
                  onChange={(e) =>
                    handleChange("contact_phone", e.target.value)
                  }
                  placeholder={
                    t("storefront.placeholders.phone") || "+212 XXX XX XX XX"
                  }
                  className="w-full bg-ground border hairline rounded-xl px-4 py-3 pl-10 text-ink placeholder-muted focus:outline-none focus:border-amber transition-colors"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block portal-label mb-2">
              {t("storefront.fields.address") || "Address"}
            </label>
            <div className="relative">
              <MapPin
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
              />
              <input
                type="text"
                value={storeSettings.address}
                onChange={(e) => handleChange("address", e.target.value)}
                placeholder={
                  t("storefront.placeholders.address") || "123 Main Street"
                }
                className="w-full bg-ground border hairline rounded-xl px-4 py-3 pl-10 text-ink placeholder-muted focus:outline-none focus:border-amber transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block portal-label mb-2">
                {t("storefront.fields.city") || "City"}
              </label>
              <input
                type="text"
                value={storeSettings.city}
                onChange={(e) => handleChange("city", e.target.value)}
                placeholder={t("storefront.placeholders.city") || "Tangier"}
                className="w-full bg-ground border hairline rounded-xl px-4 py-3 text-ink placeholder-muted focus:outline-none focus:border-amber transition-colors"
              />
            </div>
            <div>
              <label className="block portal-label mb-2">
                {t("storefront.fields.country") || "Country"}
              </label>
              <input
                type="text"
                value={storeSettings.country}
                onChange={(e) => handleChange("country", e.target.value)}
                placeholder={t("storefront.placeholders.country") || "Morocco"}
                className="w-full bg-ground border hairline rounded-xl px-4 py-3 text-ink placeholder-muted focus:outline-none focus:border-amber transition-colors"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderDesignTab = () => {
    const colors = [
      ["background_color", "Page background"],
      ["header_background_color", "Header background"],
      ["card_background_color", "Card background"],
      ["primary_color", "Primary buttons"],
      ["secondary_color", "Secondary surfaces"],
      ["accent_color", "Accent"],
      ["text_color", "Main text"],
      ["text_secondary_color", "Muted text"],
      ["card_text_color", "Card text"],
      ["border_color", "Borders"],
      ["button_text_color", "Button text"],
      ["footer_background_color", "Footer background"],
    ];

    return (
      <div className="space-y-6">
        <div className="bg-ground-secondary border hairline rounded-xl p-4 sm:p-6">
          <h3 className="portal-heading text-lg mb-6 flex items-center gap-2">
            <Palette size={20} className="text-amber" /> Storefront surfaces
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {colors.map(([field, label]) => (
              <label key={field} className="block min-w-0">
                <span className="portal-label block mb-2">{label}</span>
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <input
                    type="color"
                    value={storeSettings[field] || "#FFFFFF"}
                    onChange={(e) => handleChange(field, e.target.value)}
                    className="w-11 h-11 rounded-lg border hairline cursor-pointer p-1 shrink-0"
                  />
                  <input
                    value={storeSettings[field] || ""}
                    onChange={(e) => handleChange(field, e.target.value)}
                    className="flex-1 min-w-0 bg-ground border hairline rounded-xl px-3 py-2.5 text-ink uppercase font-mono text-sm"
                    placeholder="#FFFFFF"
                  />
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="bg-ground-secondary border hairline rounded-xl p-4 sm:p-6">
          <h3 className="portal-heading text-lg mb-6">Background and layout</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            <label className="block">
              <span className="portal-label block mb-2">Background type</span>
              <select
                value={storeSettings.background_type || "color"}
                onChange={(e) =>
                  handleChange("background_type", e.target.value)
                }
                className="w-full bg-ground border hairline rounded-xl px-3 py-2.5 text-ink"
              >
                <option value="color">Solid color</option>
                <option value="gradient">Gradient</option>
                <option value="image">Image URL</option>
              </select>
            </label>
            {storeSettings.background_type === "gradient" && (
              <label className="block">
                <span className="portal-label block mb-2">CSS gradient</span>
                <input
                  value={storeSettings.background_gradient || ""}
                  onChange={(e) =>
                    handleChange("background_gradient", e.target.value)
                  }
                  placeholder="linear-gradient(135deg, #1e293b, #2e6b72)"
                  className="w-full bg-ground border hairline rounded-xl px-3 py-2.5 text-ink"
                />
              </label>
            )}
            {storeSettings.background_type === "image" && (
              <label className="block">
                <span className="portal-label block mb-2">
                  Background image URL
                </span>
                <input
                  value={storeSettings.background_image_url || ""}
                  onChange={(e) =>
                    handleChange("background_image_url", e.target.value)
                  }
                  placeholder="https://..."
                  className="w-full bg-ground border hairline rounded-xl px-3 py-2.5 text-ink"
                />
              </label>
            )}
            <label className="block">
              <span className="portal-label block mb-2">Body font</span>
              <input
                value={storeSettings.font_family || ""}
                onChange={(e) => handleChange("font_family", e.target.value)}
                placeholder="Inter, system-ui, sans-serif"
                className="w-full bg-ground border hairline rounded-xl px-3 py-2.5 text-ink"
              />
            </label>
            <label className="block">
              <span className="portal-label block mb-2">Heading font</span>
              <input
                value={storeSettings.heading_font_family || ""}
                onChange={(e) =>
                  handleChange("heading_font_family", e.target.value)
                }
                placeholder="Inter, system-ui, sans-serif"
                className="w-full bg-ground border hairline rounded-xl px-3 py-2.5 text-ink"
              />
            </label>
            <label className="block">
              <span className="portal-label block mb-2">Container width</span>
              <select
                value={storeSettings.container_width || "max-w-7xl"}
                onChange={(e) =>
                  handleChange("container_width", e.target.value)
                }
                className="w-full bg-ground border hairline rounded-xl px-3 py-2.5 text-ink"
              >
                <option value="max-w-7xl">Wide</option>
                <option value="max-w-screen-xl">Extra wide</option>
                <option value="max-w-6xl">Compact</option>
                <option value="full">Full width</option>
              </select>
            </label>
            <label className="block">
              <span className="portal-label block mb-2">Corner radius</span>
              <select
                value={storeSettings.border_radius || "0.75rem"}
                onChange={(e) => handleChange("border_radius", e.target.value)}
                className="w-full bg-ground border hairline rounded-xl px-3 py-2.5 text-ink"
              >
                <option value="0">Square</option>
                <option value="0.375rem">Subtle</option>
                <option value="0.75rem">Rounded</option>
                <option value="1.5rem">Soft</option>
              </select>
            </label>
          </div>
        </div>
      </div>
    );
  };

  const renderContentTab = () => {
    const content = storeSettings.content_overrides || {};
    const fields = [
      ["nav_home", "Home navigation label"],
      ["nav_products", "Products navigation label"],
      ["nav_categories", "Categories navigation label"],
      ["nav_about", "About navigation label"],
      ["nav_contact", "Contact navigation label"],
      ["products_title", "Products page title"],
      ["featured_products_title", "Featured products title"],
      ["categories_title", "Categories section title"],
      ["view_all", "View all button"],
      ["view_all_products", "View all products button"],
      ["about_title", "About page title"],
      ["mission_title", "Mission section title"],
      ["contact_title", "Contact information title"],
      ["newsletter_title", "Newsletter title"],
      ["footer_text", "Footer text"],
    ];

    return (
      <div className="space-y-6">
        <div className="bg-ground-secondary border hairline rounded-xl p-4 sm:p-6">
          <h3 className="portal-heading text-lg mb-2">Storefront copy</h3>
          <p className="portal-label text-muted mb-6">
            Replace the default labels shown across your public store. Leave a
            field blank to use the default.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            {fields.map(([field, label]) => (
              <label key={field} className="block">
                <span className="portal-label block mb-2">{label}</span>
                <input
                  value={content[field] || ""}
                  onChange={(e) => handleContentChange(field, e.target.value)}
                  className="w-full bg-ground border hairline rounded-xl px-3 py-2.5 text-ink"
                />
              </label>
            ))}
          </div>
        </div>

        <div className="bg-ground-secondary border hairline rounded-xl p-4 sm:p-6">
          <h3 className="portal-heading text-lg mb-2">Home page content</h3>
          <div className="space-y-5">
            <label className="block">
              <span className="portal-label block mb-2">Hero title</span>
              <input
                value={storeSettings.hero_title || ""}
                onChange={(e) => handleChange("hero_title", e.target.value)}
                className="w-full bg-ground border hairline rounded-xl px-3 py-2.5 text-ink"
              />
            </label>
            <label className="block">
              <span className="portal-label block mb-2">Hero subtitle</span>
              <textarea
                rows={3}
                value={storeSettings.hero_subtitle || ""}
                onChange={(e) => handleChange("hero_subtitle", e.target.value)}
                className="w-full bg-ground border hairline rounded-xl px-3 py-2.5 text-ink"
              />
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              <label className="block">
                <span className="portal-label block mb-2">
                  Hero button text
                </span>
                <input
                  value={storeSettings.hero_button_text || ""}
                  onChange={(e) =>
                    handleChange("hero_button_text", e.target.value)
                  }
                  className="w-full bg-ground border hairline rounded-xl px-3 py-2.5 text-ink"
                />
              </label>
              <label className="block">
                <span className="portal-label block mb-2">Hero image URL</span>
                <input
                  value={storeSettings.hero_image_url || ""}
                  onChange={(e) =>
                    handleChange("hero_image_url", e.target.value)
                  }
                  className="w-full bg-ground border hairline rounded-xl px-3 py-2.5 text-ink"
                />
              </label>
            </div>
          </div>
        </div>

        <div className="bg-ground-secondary border hairline rounded-xl p-4 sm:p-6">
          <h3 className="portal-heading text-lg mb-2">Checkout and pricing</h3>
          <p className="portal-label text-muted mb-6">
            Prices and fees are shown to customers in Moroccan dirham (MAD).
            These values drive the cart, checkout, and shipping copy across your
            store.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
            <label className="block">
              <span className="portal-label block mb-2">Shipping fee (MAD)</span>
              <input
                type="number"
                min="0"
                value={content.shipping_fee ?? ""}
                placeholder="30"
                onChange={(e) => handleContentChange("shipping_fee", Number(e.target.value))}
                className="w-full bg-ground border hairline rounded-xl px-3 py-2.5 text-ink"
              />
            </label>
            <label className="block">
              <span className="portal-label block mb-2">
                Free shipping over (MAD)
              </span>
              <input
                type="number"
                min="0"
                value={content.free_shipping_threshold ?? ""}
                placeholder="500"
                onChange={(e) =>
                  handleContentChange("free_shipping_threshold", Number(e.target.value))
                }
                className="w-full bg-ground border hairline rounded-xl px-3 py-2.5 text-ink"
              />
            </label>
            <label className="block">
              <span className="portal-label block mb-2">
                Tax rate (%)
              </span>
              <input
                type="number"
                min="0"
                max="100"
                value={content.tax_rate ?? ""}
                placeholder="0"
                onChange={(e) => handleContentChange("tax_rate", Number(e.target.value))}
                className="w-full bg-ground border hairline rounded-xl px-3 py-2.5 text-ink"
              />
            </label>
          </div>

          <div className="mt-5">
            <span className="portal-label block mb-3">
              Payment methods offered at checkout
            </span>
            <div className="flex flex-wrap gap-3">
              {PAYMENT_OPTIONS.map(([value, label]) => (
                <label
                  key={value}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl border hairline cursor-pointer text-sm text-ink"
                >
                  <input
                    type="checkbox"
                    checked={enabledPayments.includes(value)}
                    onChange={() => togglePaymentMethod(value)}
                    className="rounded"
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-x-6 gap-y-3">
            <label className="flex items-center gap-2 text-sm text-ink cursor-pointer">
              <input
                type="checkbox"
                checked={storeSettings.contact_form_enabled !== false}
                onChange={(e) =>
                  handleChange("contact_form_enabled", e.target.checked)
                }
                className="rounded"
              />
              Show the contact form
            </label>
            <label className="flex items-center gap-2 text-sm text-ink cursor-pointer">
              <input
                type="checkbox"
                checked={!!storeSettings.show_testimonials}
                onChange={(e) => handleChange("show_testimonials", e.target.checked)}
                className="rounded"
              />
              Show testimonials on the home page
            </label>
          </div>
        </div>

        <div className="bg-ground-secondary border hairline rounded-xl p-4 sm:p-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h3 className="portal-heading text-lg">Home page highlights</h3>
              <p className="portal-label text-muted">
                Up to four feature cards under the hero.
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                addContentItem("features", { icon: "star", title: "", description: "" })
              }
              className="portal-pill-btn shrink-0"
            >
              Add feature
            </button>
          </div>
          <div className="space-y-4">
            {contentList("features").length === 0 && (
              <p className="portal-label text-muted">
                No custom features yet, your default highlights are shown.
              </p>
            )}
            {contentList("features").map((feature, index) => (
              <div
                key={index}
                className="bg-ground border hairline rounded-xl p-4 grid grid-cols-1 sm:grid-cols-12 gap-3 items-start"
              >
                <label className="block sm:col-span-2">
                  <span className="portal-label block mb-2">Icon</span>
                  <input
                    value={feature.icon || ""}
                    placeholder="truck"
                    onChange={(e) =>
                      updateContentItem("features", index, "icon", e.target.value)
                    }
                    className="w-full bg-ground-secondary border hairline rounded-xl px-3 py-2.5 text-ink"
                  />
                </label>
                <label className="block sm:col-span-4">
                  <span className="portal-label block mb-2">Title</span>
                  <input
                    value={feature.title || ""}
                    onChange={(e) =>
                      updateContentItem("features", index, "title", e.target.value)
                    }
                    className="w-full bg-ground-secondary border hairline rounded-xl px-3 py-2.5 text-ink"
                  />
                </label>
                <label className="block sm:col-span-5">
                  <span className="portal-label block mb-2">Description</span>
                  <input
                    value={feature.description || ""}
                    onChange={(e) =>
                      updateContentItem("features", index, "description", e.target.value)
                    }
                    className="w-full bg-ground-secondary border hairline rounded-xl px-3 py-2.5 text-ink"
                  />
                </label>
                <div className="sm:col-span-1 flex sm:justify-end pt-6">
                  <button
                    type="button"
                    onClick={() => removeContentItem("features", index)}
                    aria-label="Remove feature"
                    className="p-2 rounded-xl border hairline text-red hover:bg-red/10"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-ground-secondary border hairline rounded-xl p-4 sm:p-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h3 className="portal-heading text-lg">Testimonials</h3>
              <p className="portal-label text-muted">
                Optional quotes for the home page. When empty, your latest
                product reviews are used.
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                addContentItem("testimonials", {
                  name: "",
                  role: "",
                  content: "",
                  rating: 5,
                })
              }
              className="portal-pill-btn shrink-0"
            >
              Add testimonial
            </button>
          </div>
          <div className="space-y-4">
            {contentList("testimonials").length === 0 && (
              <p className="portal-label text-muted">No testimonials added yet.</p>
            )}
            {contentList("testimonials").map((testimonial, index) => (
              <div key={index} className="bg-ground border hairline rounded-xl p-4 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <label className="block">
                    <span className="portal-label block mb-2">Name</span>
                    <input
                      value={testimonial.name || ""}
                      onChange={(e) =>
                        updateContentItem("testimonials", index, "name", e.target.value)
                      }
                      className="w-full bg-ground-secondary border hairline rounded-xl px-3 py-2.5 text-ink"
                    />
                  </label>
                  <label className="block">
                    <span className="portal-label block mb-2">Role</span>
                    <input
                      value={testimonial.role || ""}
                      placeholder="Verified Buyer"
                      onChange={(e) =>
                        updateContentItem("testimonials", index, "role", e.target.value)
                      }
                      className="w-full bg-ground-secondary border hairline rounded-xl px-3 py-2.5 text-ink"
                    />
                  </label>
                  <label className="block">
                    <span className="portal-label block mb-2">Rating</span>
                    <select
                      value={Number(testimonial.rating || 5)}
                      onChange={(e) =>
                        updateContentItem(
                          "testimonials",
                          index,
                          "rating",
                          Number(e.target.value),
                        )
                      }
                      className="w-full bg-ground-secondary border hairline rounded-xl px-3 py-2.5 text-ink"
                    >
                      {[5, 4, 3, 2, 1].map((n) => (
                        <option key={n} value={n}>
                          {n} star{n > 1 ? "s" : ""}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <label className="block">
                  <span className="portal-label block mb-2">Quote</span>
                  <textarea
                    rows={2}
                    value={testimonial.content || ""}
                    onChange={(e) =>
                      updateContentItem("testimonials", index, "content", e.target.value)
                    }
                    className="w-full bg-ground-secondary border hairline rounded-xl px-3 py-2.5 text-ink"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => removeContentItem("testimonials", index)}
                  className="flex items-center gap-2 text-sm text-red hover:opacity-80"
                >
                  <Trash2 size={14} /> Remove
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-ground-secondary border hairline rounded-xl p-4 sm:p-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h3 className="portal-heading text-lg">
                Frequently asked questions
              </h3>
              <p className="portal-label text-muted">
                Shown on your contact page. Leave empty to use the default
                questions about shipping, payment, and returns.
              </p>
            </div>
            <button
              type="button"
              onClick={() => addContentItem("faq", { q: "", a: "" })}
              className="portal-pill-btn shrink-0"
            >
              Add question
            </button>
          </div>
          <div className="space-y-4">
            {contentList("faq").length === 0 && (
              <p className="portal-label text-muted">
                Default FAQ is shown to customers.
              </p>
            )}
            {contentList("faq").map((faq, index) => (
              <div key={index} className="bg-ground border hairline rounded-xl p-4 space-y-3">
                <label className="block">
                  <span className="portal-label block mb-2">Question</span>
                  <input
                    value={faq.q || ""}
                    onChange={(e) => updateContentItem("faq", index, "q", e.target.value)}
                    className="w-full bg-ground-secondary border hairline rounded-xl px-3 py-2.5 text-ink"
                  />
                </label>
                <label className="block">
                  <span className="portal-label block mb-2">Answer</span>
                  <textarea
                    rows={2}
                    value={faq.a || ""}
                    onChange={(e) => updateContentItem("faq", index, "a", e.target.value)}
                    className="w-full bg-ground-secondary border hairline rounded-xl px-3 py-2.5 text-ink"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => removeContentItem("faq", index)}
                  className="flex items-center gap-2 text-sm text-red hover:opacity-80"
                >
                  <Trash2 size={14} /> Remove
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-ground-secondary border hairline rounded-xl p-4 sm:p-6">
          <h3 className="portal-heading text-lg mb-4">About page and policies</h3>
          <div className="space-y-5">
            <label className="block">
              <span className="portal-label block mb-2">Mission statement</span>
              <textarea
                rows={3}
                value={content.mission_text || ""}
                onChange={(e) => handleContentChange("mission_text", e.target.value)}
                className="w-full bg-ground border hairline rounded-xl px-3 py-2.5 text-ink"
              />
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              <label className="block">
                <span className="portal-label block mb-2">Shipping policy</span>
                <textarea
                  rows={3}
                  value={content.shipping_policy || ""}
                  placeholder="Standard delivery takes 2 to 4 business days..."
                  onChange={(e) => handleContentChange("shipping_policy", e.target.value)}
                  className="w-full bg-ground border hairline rounded-xl px-3 py-2.5 text-ink"
                />
              </label>
              <label className="block">
                <span className="portal-label block mb-2">Return policy</span>
                <textarea
                  rows={3}
                  value={content.return_policy || ""}
                  placeholder="You have 30 days to return an item..."
                  onChange={(e) => handleContentChange("return_policy", e.target.value)}
                  className="w-full bg-ground border hairline rounded-xl px-3 py-2.5 text-ink"
                />
              </label>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderDomainTab = () => (
    <div className="space-y-6">
      <div className="bg-ground-secondary border hairline rounded-xl p-4 sm:p-6">
        <h3 className="portal-heading text-lg mb-6 flex items-center gap-2">
          <Globe size={20} className="text-amber" />
          {t("storefront.sections.customDomain") || "Custom Domain"}
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block portal-label mb-2">
              {t("storefront.fields.customDomain") || "Custom Domain"}
            </label>
            <div className="relative">
              <Globe
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
              />
              <input
                type="text"
                value={storeSettings.custom_domain}
                onChange={(e) => handleChange("custom_domain", e.target.value)}
                placeholder={
                  t("storefront.placeholders.domain") || "store.example.com"
                }
                className="w-full bg-ground border hairline rounded-xl px-4 py-3 pl-10 text-ink placeholder-muted focus:outline-none focus:border-amber transition-colors"
              />
            </div>
            <p className="portal-label text-muted mt-2">
              {t("storefront.help.domain") ||
                "Configure your custom domain. You'll need to add a CNAME record pointing to your storefront URL."}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-4 bg-ground/50 border hairline rounded-xl">
            <div className="flex-1 min-w-0">
              <p className="portal-label font-semibold text-ink">
                {t("storefront.domain.status") || "Domain Status"}
              </p>
              <p className="portal-label text-muted text-sm">
                {storeSettings.custom_domain
                  ? storeSettings.domain_verified
                    ? t("storefront.domain.verified") || "Verified and active"
                    : t("storefront.domain.pending") || "Pending verification"
                  : t("storefront.domain.notConfigured") || "Not configured"}
              </p>
            </div>
            {storeSettings.custom_domain && !storeSettings.domain_verified && (
              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  onClick={handleDomainVerify}
                  className="portal-pill-btn flex-1 sm:flex-none justify-center shrink-0"
                >
                  <Shield size={16} />{" "}
                  {t("storefront.domain.verify") || "Verify Domain"}
                </button>
                <button
                  onClick={handleDomainRemove}
                  className="px-4 py-2 rounded-xl border hairline bg-surface-2 text-ink-2 hover:text-clay hover:border-clay/30 flex items-center gap-2 font-medium"
                >
                  <Trash2 size={16} /> {t("storefront.domain.remove") || "Remove"}
                </button>
              </div>
            )}
            {storeSettings.domain_verified && (
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-2 text-teal font-medium">
                  <CheckCircle size={16} />{" "}
                  {t("storefront.domain.verifiedBadge") || "Verified"}
                </span>
                <button
                  onClick={handleDomainRemove}
                  className="px-4 py-2 rounded-xl border hairline bg-surface-2 text-ink-2 hover:text-clay hover:border-clay/30 flex items-center gap-2 font-medium"
                >
                  <Trash2 size={16} /> {t("storefront.domain.remove") || "Remove"}
                </button>
              </div>
            )}
          </div>

          {storeSettings.custom_domain && (
            <div className="bg-amber/10 border border-amber/30 rounded-xl p-4">
              <h4 className="portal-label font-semibold text-amber mb-2 flex items-center gap-2">
                <ExternalLink size={16} />{" "}
                {t("storefront.domain.dnsInstructions") || "DNS Configuration"}
              </h4>
              <div className="space-y-2 text-sm portal-label text-ink-secondary">
                <p>
                  {t("storefront.domain.dnsStep1") ||
                    "1. Go to your domain registrar's DNS settings"}
                </p>
                <p>
                  {t("storefront.domain.dnsStep2") || "2. Add a CNAME record:"}
                </p>
                <div className="bg-ground border hairline rounded-lg p-3 font-mono text-amber text-xs sm:text-sm break-all overflow-x-auto">
                  {t("storefront.domain.cnameLabel") || "Name"}:{" "}
                  <strong>@</strong> or <strong>www</strong>
                  <br />
                  {t("storefront.domain.cnameTarget") || "Target"}:{" "}
                  <strong className="break-all">{window.location.hostname}</strong>
                </div>
                <p>
                  {t("storefront.domain.dnsStep3") ||
                    "3. Save changes and click Verify Domain above"}
                </p>
                <p>
                  {t("storefront.domain.dnsStep4") ||
                    "4. DNS propagation may take up to 24-48 hours"}
                </p>
              </div>
            </div>
          )}

          <div className="border-t hairline pt-4">
            <h4 className="portal-label font-semibold mb-3">
              {t("storefront.sections.storefrontUrl") || "Your Storefront URL"}
            </h4>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <span className="bg-ground border hairline rounded-xl px-4 py-3 font-mono text-xs sm:text-sm text-amber w-full sm:flex-1 min-w-0 text-center break-all">
                {storeSettings.custom_domain && storeSettings.domain_verified
                  ? `https://${storeSettings.custom_domain}`
                  : `${window.location.origin}/storefront/${storefrontUserId}`}
              </span>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
                <button
                  className="portal-pill-btn justify-center"
                  onClick={() =>
                    navigator.clipboard.writeText(
                      storeSettings.custom_domain &&
                        storeSettings.domain_verified
                        ? `https://${storeSettings.custom_domain}`
                        : `${window.location.origin}/storefront/${storefrontUserId}`,
                    )
                  }
                >
                  <Copy size={16} /> {t("storefront.copyUrl") || "Copy URL"}
                </button>
                <a
                  href={
                    storeSettings.custom_domain && storeSettings.domain_verified
                      ? `https://${storeSettings.custom_domain}`
                      : `/storefront/${storefrontUserId}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="portal-pill-btn justify-center"
                >
                  <ExternalLink size={16} />{" "}
                  {t("storefront.visitStore") || "Visit Store"}
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSocialTab = () => (
    <div className="space-y-6">
      <div className="bg-ground-secondary border hairline rounded-xl p-4 sm:p-6">
        <h3 className="portal-heading text-lg mb-6 flex items-center gap-2">
          <MessageCircle size={20} className="text-amber" />
          {t("storefront.sections.socialLinks") || "Social Media Links"}
        </h3>

        <div className="space-y-4">
          {[
            {
              field: "facebook_url",
              label: "Facebook",
              //icon: "📘",
              placeholder: "https://facebook.com/yourstore",
            },
            {
              field: "instagram_url",
              label: "Instagram",
              //icon: "📷",
              placeholder: "https://instagram.com/yourstore",
            },
            {
              field: "twitter_url",
              label: "Twitter/X",
              //icon: "🐦",
              placeholder: "https://twitter.com/yourstore",
            },
            {
              field: "whatsapp_number",
              label: "WhatsApp",
              icon: "💬",
              placeholder: "+212 XXX XX XX XX",
            },
          ].map((social) => (
            <div
              key={social.field}
              className="flex items-start sm:items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-ground/50 border hairline rounded-xl min-w-0"
            >
              <span className="text-2xl w-10 sm:w-12 text-center shrink-0 pt-6 sm:pt-0">
                {social.icon}
              </span>
              <div className="flex-1 min-w-0">
                <label className="block portal-label mb-1">
                  {social.label}
                </label>
                <input
                  type="text"
                  value={storeSettings[social.field]}
                  onChange={(e) => handleChange(social.field, e.target.value)}
                  placeholder={social.placeholder}
                  className="w-full bg-ground border hairline rounded-xl px-4 py-2 text-ink placeholder-muted focus:outline-none focus:border-amber transition-colors"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderAnalyticsTab = () => {
    if (analyticsLoading) {
      return (
        <div className="bg-ground-secondary border hairline rounded-xl p-6 sm:p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber mx-auto mb-4"></div>
          <p className="portal-label">
            {t("storefront.loadingAnalytics") || "Loading analytics..."}
          </p>
        </div>
      );
    }

    if (!analytics) {
      return (
        <div className="bg-ground-secondary border hairline rounded-xl p-6 sm:p-8 text-center">
          <p className="portal-label text-muted">
            {t("storefront.noAnalytics") || "No analytics data available yet"}
          </p>
        </div>
      );
    }

    const { products, reviews, categories, top_products } = analytics;

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="bg-ground-secondary border hairline rounded-xl p-4 sm:p-5">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <div className="w-12 h-12 bg-amber/15 rounded-xl flex items-center justify-center shrink-0">
                <Package size={20} className="text-amber" />
              </div>
              <div className="min-w-0">
                <p className="portal-label text-muted">
                  {t("storefront.analytics.totalProducts") || "Total Products"}
                </p>
                <p className="portal-heading text-2xl font-bold text-ink">
                  {products?.total || 0}
                </p>
                <p className="portal-label text-teal text-sm mt-1">
                  {t("storefront.analytics.visible") || "Visible"}:{" "}
                  {products?.visible || 0} |{" "}
                  {t("storefront.analytics.featured") || "Featured"}:{" "}
                  {products?.featured || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-ground-secondary border hairline rounded-xl p-4 sm:p-5">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <div className="w-12 h-12 bg-teal/15 rounded-xl flex items-center justify-center shrink-0">
                <Star size={20} className="text-teal" />
              </div>
              <div className="min-w-0">
                <p className="portal-label text-muted">
                  {t("storefront.analytics.totalReviews") || "Total Reviews"}
                </p>
                <p className="portal-heading text-2xl font-bold text-ink">
                  {reviews?.total_reviews || 0}
                </p>
                <p className="portal-label text-amber text-sm mt-1">
                  {t("storefront.analytics.avgRating") || "Avg Rating"}:{" "}
                  {reviews?.avg_rating || 0}/5
                </p>
              </div>
            </div>
          </div>

          <div className="bg-ground-secondary border hairline rounded-xl p-4 sm:p-5">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <div className="w-12 h-12 bg-purple/15 rounded-xl flex items-center justify-center shrink-0">
                <BarChart3 size={20} className="text-purple-400" />
              </div>
              <div className="min-w-0">
                <p className="portal-label text-muted">
                  {t("storefront.analytics.categories") || "Categories"}
                </p>
                <p className="portal-heading text-2xl font-bold text-ink">
                  {categories?.length || 0}
                </p>
                <p className="portal-label text-muted text-sm mt-1">
                  {t("storefront.analytics.activeCategories") ||
                    "Active categories"}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-ground-secondary border hairline rounded-xl p-4 sm:p-5">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <div className="w-12 h-12 bg-pink/15 rounded-xl flex items-center justify-center shrink-0">
                <TrendingUp size={20} className="text-pink-400" />
              </div>
              <div className="min-w-0">
                <p className="portal-label text-muted">
                  {t("storefront.analytics.topProducts") || "Top Products"}
                </p>
                <p className="portal-heading text-2xl font-bold text-ink">
                  {top_products?.length || 0}
                </p>
                <p className="portal-label text-muted text-sm mt-1">
                  {t("storefront.analytics.bestSellers") || "Best sellers"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {categories && categories.length > 0 && (
          <div className="bg-ground-secondary border hairline rounded-xl p-4 sm:p-5">
            <h3 className="portal-heading text-base mb-4">
              {t("storefront.analytics.productsByCategory") ||
                "Products by Category"}
            </h3>
            <div className="space-y-3">
              {categories.map((cat, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between gap-3 p-3 bg-ground/50 border hairline rounded-lg min-w-0"
                >
                  <span className="portal-label font-medium truncate min-w-0">
                    {cat.category}
                  </span>
                  <span className="portal-heading font-bold text-amber text-sm sm:text-base text-right shrink-0">
                    {cat.count}{" "}
                    {t("storefront.analytics.products") || "products"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {top_products && top_products.length > 0 && (
          <div className="bg-ground-secondary border hairline rounded-xl p-4 sm:p-5">
            <h3 className="portal-heading text-base mb-4">
              {t("storefront.analytics.topProductsList") ||
                "Top Performing Products"}
            </h3>
            <div className="space-y-3">
              {top_products.map((product, i) => (
                <div
                  key={product.id}
                  className="flex items-center gap-3 p-3 bg-ground/50 border hairline rounded-lg min-w-0"
                >
                  <span className="w-8 h-8 bg-amber/15 text-amber rounded-lg flex items-center justify-center font-bold text-sm shrink-0">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="portal-label font-semibold text-ink truncate">
                      {product.name}
                    </p>
                    <p className="portal-label text-muted text-sm">
                      {product.sold} {t("storefront.analytics.sold") || "sold"}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="portal-heading font-bold text-ink text-sm sm:text-base whitespace-nowrap">
                      {product.revenue} MAD
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <button
            onClick={loadAnalytics}
            className="portal-pill-btn justify-center"
          >
            <RefreshCw size={16} />{" "}
            {t("storefront.refreshAnalytics") || "Refresh Analytics"}
          </button>
          <a href="/reports" className="portal-pill-btn justify-center">
            <BarChart3 size={16} />{" "}
            {t("storefront.viewFullReports") || "View Full Reports"}
          </a>
        </div>
      </div>
    );
  };

  const renderPreviewTab = () => (
    <div className="space-y-6">
      <div className="bg-ground-secondary border hairline rounded-xl p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between mb-6">
          <h3 className="portal-heading text-lg flex items-center gap-2">
            <Eye size={20} className="text-amber shrink-0" />
            {t("storefront.sections.livePreview") || "Live Preview"}
          </h3>
          <label className="flex items-center gap-2 cursor-pointer shrink-0">
            <input
              type="checkbox"
              checked={previewMode}
              onChange={(e) => setPreviewMode(e.target.checked)}
              className="w-4 h-4 rounded border-hairline text-amber focus:ring-amber"
            />
            <span className="portal-label">
              {t("storefront.previewMode") || "Preview Mode"}
            </span>
          </label>
        </div>

        <div
          className="bg-ground border-2 rounded-xl overflow-hidden"
          style={{ borderColor: storeSettings.primary_color }}
        >
          <div
            className="p-4 border-b"
            style={{
              borderColor: storeSettings.secondary_color,
              backgroundColor: storeSettings.primary_color,
            }}
          >
            <div className="flex items-center gap-3">
              {storeSettings.logo_url && (
                <img
                  src={getAssetUrl(storeSettings.logo_url)}
                  alt={storeSettings.store_name}
                  className="w-10 h-10 rounded-lg object-cover"
                />
              )}
              <div>
                <h1 className="text-white font-bold text-xl">
                  {storeSettings.store_name ||
                    t("storefront.preview.storeName") ||
                    "Your Store Name"}
                </h1>
                {storeSettings.tagline && (
                  <p className="text-white/80 text-sm">
                    {storeSettings.tagline}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-6 min-w-0">
            {storeSettings.description && (
              <p className="portal-text mb-6 text-ink-secondary break-words">
                {storeSettings.description}
              </p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-6">
              {storeSettings.contact_email && (
                <a
                  href={`mailto:${storeSettings.contact_email}`}
                  className="flex items-center gap-2 p-3 bg-ground-secondary border hairline rounded-lg hover:border-amber/50 transition-colors min-w-0"
                >
                  <Mail size={18} className="text-amber shrink-0" />
                  <span className="portal-label text-ink truncate min-w-0">
                    {storeSettings.contact_email}
                  </span>
                </a>
              )}
              {storeSettings.contact_phone && (
                <a
                  href={`tel:${storeSettings.contact_phone}`}
                  className="flex items-center gap-2 p-3 bg-ground-secondary border hairline rounded-lg hover:border-amber/50 transition-colors min-w-0"
                >
                  <Phone size={18} className="text-amber shrink-0" />
                  <span className="portal-label text-ink truncate min-w-0">
                    {storeSettings.contact_phone}
                  </span>
                </a>
              )}
              {storeSettings.address && (
                <div className="flex items-center gap-2 p-3 bg-ground-secondary border hairline rounded-lg min-w-0 sm:col-span-2 lg:col-span-1">
                  <MapPin size={18} className="text-amber shrink-0" />
                  <span className="portal-label text-ink break-words min-w-0">
                    {storeSettings.address}, {storeSettings.city},{" "}
                    {storeSettings.country}
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 sm:gap-4 pt-4 border-t hairline flex-wrap">
              {storeSettings.facebook_url && (
                <a
                  href={storeSettings.facebook_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-ground-secondary border hairline rounded-lg hover:bg-amber/10 transition-colors"
                >
                  📘
                </a>
              )}
              {storeSettings.instagram_url && (
                <a
                  href={storeSettings.instagram_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-ground-secondary border hairline rounded-lg hover:bg-amber/10 transition-colors"
                >
                  📷
                </a>
              )}
              {storeSettings.twitter_url && (
                <a
                  href={storeSettings.twitter_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-ground-secondary border hairline rounded-lg hover:bg-amber/10 transition-colors"
                >
                  🐦
                </a>
              )}
              {storeSettings.whatsapp_number && (
                <a
                  href={`https://wa.me/${storeSettings.whatsapp_number.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-ground-secondary border hairline rounded-lg hover:bg-amber/10 transition-colors"
                >
                  💬
                </a>
              )}
            </div>
          </div>
        </div>

        <p className="portal-label text-muted text-center mt-4">
          {t("storefront.preview.note") ||
            "This is a preview of how your storefront will appear to customers."}
        </p>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case "branding":
        return renderBrandingTab();
      case "info":
        return renderInfoTab();
      case "design":
        return renderDesignTab();
      case "content":
        return renderContentTab();
      case "domain":
        return renderDomainTab();
      case "social":
        return renderSocialTab();
      case "analytics":
        return renderAnalyticsTab();
      case "preview":
        return renderPreviewTab();
      default:
        return renderBrandingTab();
    }
  };

  return (
    <Layout title={t("storefront.title") || "Customize Your Store"}>
      <Head>
        <title>
          {t("storefront.title") || "Customize Your Store"} - Smart Business
          Assistant
        </title>
      </Head>

      <div className="max-w-6xl mx-auto w-full min-w-0">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h1 className="portal-heading text-xl sm:text-2xl flex items-center gap-2 flex-wrap">
              <ShoppingBag size={28} className="text-amber shrink-0" />
              <span className="break-words">
                {t("storefront.title") || "Customize Your Store"}
              </span>
            </h1>
            <p className="portal-label text-muted mt-1">
              {t("storefront.subtitle") ||
                "Manage your storefront branding, domain, and analytics"}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 shrink-0 w-full sm:w-auto">
            <a
              href={`/storefront/${storefrontUserId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="portal-pill-btn justify-center shrink-0"
              style={{ backgroundColor: "transparent" }}
            >
              <Eye size={16} /> View store
            </a>
            <button
              onClick={handleSave}
              disabled={saving}
              className="portal-pill-btn w-full sm:w-auto justify-center shrink-0"
            >
              {saving ? (
                <>
                  <span className="animate-spin rounded-full h-4 w-4 border-2 border-amber border-t-transparent mr-2"></span>
                  {t("common.saving") || "Saving..."}
                </>
              ) : (
                <>
                  <Save size={16} /> {t("common.save") || "Save Changes"}
                </>
              )}
            </button>
          </div>
        </div>

        <div className="bg-ground-secondary border hairline rounded-xl overflow-hidden">
          <div className="border-b hairline">
            {/* Mobile tab picker */}
            <div className="p-3 sm:hidden">
              <label htmlFor="storefront-tab-select" className="sr-only">
                Select section
              </label>
              <select
                id="storefront-tab-select"
                value={activeTab}
                onChange={(e) => setActiveTab(e.target.value)}
                className="w-full bg-ground border hairline rounded-xl px-3 py-2.5 text-ink text-sm"
              >
                {tabs.map((tab) => (
                  <option key={tab.id} value={tab.id}>
                    {tab.label}
                  </option>
                ))}
              </select>
            </div>
            {/* Desktop / tablet scrollable tabs */}
            <nav
              className="hidden sm:flex gap-1 p-1.5 overflow-x-auto max-w-full"
              role="tablist"
            >
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`portal-nav-link flex items-center gap-2 px-3 lg:px-4 py-3 rounded-lg transition-all duration-200 font-medium whitespace-nowrap shrink-0 ${
                    activeTab === tab.id
                      ? "bg-amber/10 text-amber border hairline"
                      : "text-ink-secondary hover:text-ink hover:bg-ground/50"
                  }`}
                >
                  <tab.icon size={18} className="flex-shrink-0" />
                  <span className="text-sm">{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="p-4 sm:p-6 min-w-0">{renderTabContent()}</div>
        </div>
      </div>
    </Layout>
  );
}
