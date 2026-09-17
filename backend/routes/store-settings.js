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
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files are allowed"), false);
    }
    cb(null, true);
  },
});

router.get("/", auth, async (req, res) => {
  try {
    const result = await query("SELECT * FROM store_settings WHERE user_id = $1", [req.user.id]);
    if (result.rowCount === 0) {
      return res.json({ store_name: "", logo_url: null, primary_color: "#3B82F6", secondary_color: "#1E40AF", accent_color: "#F59E0B", description: "", tagline: "", contact_email: "", contact_phone: "", address: "", city: "", country: "", custom_domain: "", domain_verified: false, facebook_url: "", instagram_url: "", twitter_url: "", whatsapp_number: "" });
    }
    return res.json(result.rows[0]);
  } catch (err) { console.error("Error GET /store-settings:", err); return res.status(500).json({ error: "Server error" }); }
});

router.put("/", auth, async (req, res) => {
  try {
    const { store_name, logo_url, primary_color, secondary_color, accent_color, description, tagline, contact_email, contact_phone, address, city, country, custom_domain, facebook_url, instagram_url, twitter_url, whatsapp_number } = req.body;
    const result = await query(
      "INSERT INTO store_settings (user_id,store_name,logo_url,primary_color,secondary_color,accent_color,description,tagline,contact_email,contact_phone,address,city,country,custom_domain,facebook_url,instagram_url,twitter_url,whatsapp_number,updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,NOW()) ON CONFLICT (user_id) DO UPDATE SET store_name=EXCLUDED.store_name,logo_url=EXCLUDED.logo_url,primary_color=EXCLUDED.primary_color,secondary_color=EXCLUDED.secondary_color,accent_color=EXCLUDED.accent_color,description=EXCLUDED.description,tagline=EXCLUDED.tagline,contact_email=EXCLUDED.contact_email,contact_phone=EXCLUDED.contact_phone,address=EXCLUDED.address,city=EXCLUDED.city,country=EXCLUDED.country,custom_domain=EXCLUDED.custom_domain,facebook_url=EXCLUDED.facebook_url,instagram_url=EXCLUDED.instagram_url,twitter_url=EXCLUDED.twitter_url,whatsapp_number=EXCLUDED.whatsapp_number,updated_at=NOW() RETURNING *",
      [req.user.id, store_name||null, logo_url||null, primary_color||"#3B82F6", secondary_color||"#1E40AF", accent_color||"#F59E0B", description||null, tagline||null, contact_email||null, contact_phone||null, address||null, city||null, country||null, custom_domain||null, facebook_url||null, instagram_url||null, twitter_url||null, whatsapp_number||null]
    );
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
    const result = await query("SELECT store_name,logo_url,primary_color,secondary_color,accent_color,description,tagline,contact_email,contact_phone,address,city,country,facebook_url,instagram_url,twitter_url,whatsapp_number FROM store_settings WHERE user_id=$1", [parseInt(req.params.userId)]);
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
