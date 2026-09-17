const router = require("express").Router();
const auth = require("../middleware/auth");
const pool = require("../config/db");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const query = (text, params) => pool.query(text, params);

const uploadDir = path.join(__dirname, "..", "..", "uploads", "logos");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `logo-${req.user.id}-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files are allowed"), false);
    }
    cb(null, true);
  },
});

const ALL_FIELDS = [
  // Branding
  "store_name", "logo_url", "primary_color", "secondary_color", "accent_color",
  // Extended Colors
  "background_color", "background_type", "background_gradient", "background_image_url",
  "text_color", "text_secondary_color", "border_color",
  // Typography
  "font_family", "heading_font_family", "font_size_base",
  // Layout
  "layout_style", "container_width", "border_radius", "spacing_scale",
  // Store Info
  "description", "tagline", "contact_email", "contact_phone", "address", "city", "country",
  // Domain
  "custom_domain", "domain_verified",
  // Social / Links
  "facebook_url", "instagram_url", "twitter_url", "whatsapp_number", "tiktok_url", "youtube_url", "linkedin_url",
  // SEO
  "seo_title", "seo_description", "seo_keywords", "og_image_url",
  // Page Visibility
  "show_home_page", "show_products_page", "show_categories_page", "show_about_page",
  "show_contact_page", "show_cart_page", "show_account_page",
  // Home Page
  "hero_title", "hero_subtitle", "hero_button_text", "hero_button_link", "hero_image_url", "hero_layout",
  "show_featured_products", "featured_products_title", "show_categories_section", "categories_section_title",
  "show_testimonials", "show_newsletter", "newsletter_title", "newsletter_subtitle",
  // Product Page
  "products_layout", "products_per_page", "show_product_filters", "show_product_sort",
  "product_card_style", "show_quick_view",
  // Product Detail
  "product_gallery_layout", "show_related_products", "related_products_title",
  "show_product_tabs", "enable_reviews",
  // Contact Page
  "contact_form_enabled", "contact_map_embed", "contact_info_title", "contact_info_subtitle",
  // Footer
  "footer_text", "footer_copyright", "show_footer_social", "show_footer_newsletter",
  // Advanced
  "custom_css", "custom_js", "favicon_url"
];

const DEFAULTS = {
  primary_color: "#3B82F6",
  secondary_color: "#1E40AF",
  accent_color: "#F59E0B",
  background_color: "#FFFFFF",
  background_type: "color",
  background_gradient: null,
  background_image_url: null,
  text_color: "#1F2937",
  text_secondary_color: "#6B7280",
  border_color: "#E5E7EB",
  font_family: "Inter, system-ui, sans-serif",
  heading_font_family: "Inter, system-ui, sans-serif",
  font_size_base: "16px",
  layout_style: "modern",
  container_width: "max-w-7xl",
  border_radius: "0.75rem",
  spacing_scale: "1",
  hero_layout: "centered",
  featured_products_title: "Featured Products",
  categories_section_title: "Shop by Category",
  newsletter_title: "Subscribe to our newsletter",
  products_layout: "grid",
  products_per_page: 12,
  product_card_style: "standard",
  product_gallery_layout: "thumbnails",
  related_products_title: "You may also like",
  contact_info_title: "Get in Touch",
};

router.get("/", auth, async (req, res) => {
  try {
    const result = await query("SELECT * FROM store_settings WHERE user_id = $1", [req.user.id]);
    if (result.rowCount === 0) {
      return res.json({ ...DEFAULTS, store_name: "", logo_url: null, description: "", tagline: "", contact_email: "", contact_phone: "", address: "", city: "", country: "", custom_domain: "", domain_verified: false, facebook_url: "", instagram_url: "", twitter_url: "", whatsapp_number: "", tiktok_url: "", youtube_url: "", linkedin_url: "", seo_title: "", seo_description: "", seo_keywords: "", og_image_url: null, show_home_page: true, show_products_page: true, show_categories_page: true, show_about_page: true, show_contact_page: true, show_cart_page: true, show_account_page: false, hero_title: "", hero_subtitle: "", hero_button_text: "", hero_button_link: "", hero_image_url: "", show_featured_products: true, show_categories_section: true, show_testimonials: false, show_newsletter: true, newsletter_subtitle: "", show_product_filters: true, show_product_sort: true, show_quick_view: false, show_related_products: true, show_product_tabs: true, enable_reviews: true, contact_form_enabled: true, contact_map_embed: "", contact_info_subtitle: "", footer_text: "", footer_copyright: "", show_footer_social: true, show_footer_newsletter: false, custom_css: "", custom_js: "", favicon_url: null });
    }
    return res.json(result.rows[0]);
  } catch (err) { console.error("Error GET /store-settings:", err); return res.status(500).json({ error: "Server error" }); }
});

router.put("/", auth, async (req, res) => {
  try {
    const values = [req.user.id];
    const setClauses = [];
    const insertCols = ["user_id"];
    const insertVals = ["$1"];
    let paramIndex = 2;

    for (const field of ALL_FIELDS) {
      if (req.body[field] !== undefined) {
        const val = req.body[field] === "" ? null : req.body[field];
        values.push(val);
        insertCols.push(field);
        insertVals.push(`$${paramIndex}`);
        setClauses.push(`${field} = EXCLUDED.${field}`);
        paramIndex++;
      }
    }

    values.push(new Date());
    insertCols.push("updated_at");
    insertVals.push(`$${paramIndex}`);
    setClauses.push("updated_at = EXCLUDED.updated_at");

    const sql = `
      INSERT INTO store_settings (${insertCols.join(",")})
      VALUES (${insertVals.join(",")})
      ON CONFLICT (user_id) DO UPDATE SET
        ${setClauses.join(",\n        ")}
      RETURNING *
    `;

    const result = await query(sql, values);
    return res.json({ success: true, settings: result.rows[0] });
  } catch (err) { console.error("Error PUT /store-settings:", err); return res.status(500).json({ error: "Server error" }); }
});

router.get("/analytics", auth, async (req, res) => {
  try {
    const uid = req.user.id;
    const [p, r, c, t] = await Promise.all([
      query("SELECT COUNT(*) AS total, SUM(CASE WHEN storefront_enabled=true THEN 1 ELSE 0 END) AS visible, SUM(CASE WHEN featured=true THEN 1 ELSE 0 END) AS featured FROM products WHERE user_id=$1 AND deleted_at IS NULL", [uid]),
      query("SELECT COUNT(*) AS total_reviews, COALESCE(AVG(r.rating),0)::DECIMAL(3,1) AS avg_rating FROM reviews r JOIN products p ON p.id=r.product_id WHERE p.user_id=$1", [uid]),
      query("SELECT category, COUNT(*) AS count FROM products WHERE user_id=$1 AND deleted_at IS NULL AND storefront_enabled=true GROUP BY category ORDER BY count DESC", [uid]),
      query("SELECT name,revenue,sold FROM products WHERE user_id=$1 AND deleted_at IS NULL AND storefront_enabled=true ORDER BY revenue DESC NULLS LAST LIMIT 5", [uid]),
    ]);
    return res.json({ products: p.rows[0], reviews: r.rows[0], categories: c.rows, top_products: t.rows });
  } catch (err) { console.error("Error GET /store-settings/analytics:", err); return res.status(500).json({ error: "Server error" }); }
});

router.get("/public/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const parsedUserId = parseInt(userId);
    
    if (isNaN(parsedUserId)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }
    
    const result = await query("SELECT * FROM store_settings WHERE user_id=$1", [parsedUserId]);
    return res.json(result.rowCount > 0 ? result.rows[0] : {});
  } catch (err) { console.error("Error GET /store-settings/public:", err); return res.status(500).json({ error: "Server error" }); }
});

router.post("/logo", auth, upload.single("logo"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    const logoUrl = `/uploads/logos/${req.file.filename}`;
    const result = await query(
      "INSERT INTO store_settings (user_id, logo_url, updated_at) VALUES ($1, $2, NOW()) ON CONFLICT (user_id) DO UPDATE SET logo_url = EXCLUDED.logo_url, updated_at = NOW() RETURNING logo_url",
      [req.user.id, logoUrl]
    );
    return res.json({ success: true, logo_url: result.rows[0].logo_url });
  } catch (err) {
    console.error("Error POST /store-settings/logo:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

router.post("/background-image", auth, upload.single("background"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    const imageUrl = `/uploads/logos/${req.file.filename}`;
    const result = await query(
      "INSERT INTO store_settings (user_id, background_image_url, background_type, updated_at) VALUES ($1, $2, 'image', NOW()) ON CONFLICT (user_id) DO UPDATE SET background_image_url = EXCLUDED.background_image_url, background_type = 'image', updated_at = NOW() RETURNING background_image_url",
      [req.user.id, imageUrl]
    );
    return res.json({ success: true, background_image_url: result.rows[0].background_image_url });
  } catch (err) {
    console.error("Error POST /store-settings/background-image:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

router.post("/favicon", auth, upload.single("favicon"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    const faviconUrl = `/uploads/logos/${req.file.filename}`;
    const result = await query(
      "INSERT INTO store_settings (user_id, favicon_url, updated_at) VALUES ($1, $2, NOW()) ON CONFLICT (user_id) DO UPDATE SET favicon_url = EXCLUDED.favicon_url, updated_at = NOW() RETURNING favicon_url",
      [req.user.id, faviconUrl]
    );
    return res.json({ success: true, favicon_url: result.rows[0].favicon_url });
  } catch (err) {
    console.error("Error POST /store-settings/favicon:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

router.put("/verify-domain", auth, async (req, res) => {
  try {
    const { domain } = req.body;
    if (!domain) {
      return res.status(400).json({ error: "Domain is required" });
    }
    const result = await query(
      "UPDATE store_settings SET custom_domain = $1, domain_verified = true, updated_at = NOW() WHERE user_id = $2 RETURNING *",
      [domain, req.user.id]
    );
    return res.json({ success: true, settings: result.rows[0] });
  } catch (err) {
    console.error("Error PUT /store-settings/verify-domain:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;