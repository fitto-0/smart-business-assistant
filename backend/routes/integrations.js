const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const { query } = require("../db/pool");
const auth = require("../middleware/auth");
const { requirePermission } = require("../middleware/permissions");
const { createAuditLog } = require("../middleware/audit");
const shopify = require("../lib/shopify");
const woocommerce = require("../lib/woocommerce");
const stripe = require("../lib/stripe");
const googleSheets = require("../lib/googleSheets");

/**
 * POST /api/integrations/shopify/connect
 * Connect Shopify store to organization
 */
router.post(
  "/shopify/connect",
  auth,
  requirePermission('integrations', 'connect'),
  [
    body("shopUrl").isString().trim(),
    body("accessToken").isString().trim(),
    body("branchId").optional().isInt(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { shopUrl, accessToken, branchId } = req.body;
      const organizationId = req.organizationId;
      const userId = req.user.id;

      // Test connection
      const testResult = await shopify.testConnection(shopUrl, accessToken);
      
      if (!testResult.success) {
        return res.status(400).json({
          error: "Failed to connect to Shopify",
          details: testResult.error,
        });
      }

      // Check if integration already exists
      const existing = await query(
        `SELECT id FROM integrations 
         WHERE organization_id = $1 AND type = 'shopify' AND shop_url = $2`,
        [organizationId, shopUrl]
      );

      if (existing.rowCount > 0) {
        // Update existing integration
        await query(
          `UPDATE integrations 
           SET access_token = $2, branch_id = $3, status = 'active', 
               shop_name = $4, updated_at = NOW()
           WHERE id = $5`,
          [organizationId, accessToken, branchId, testResult.shop.name, existing.rows[0].id]
        );

        // Log audit
        await createAuditLog({
          organizationId,
          userId,
          action: 'update',
          entityType: 'integration',
          entityId: existing.rows[0].id,
          oldValues: { shopUrl },
          newValues: { shopUrl, shopName: testResult.shop.name },
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
        });

        return res.json({
          message: "Shopify integration updated",
          integration: {
            id: existing.rows[0].id,
            shopUrl,
            shopName: testResult.shop.name,
            status: 'active',
          },
        });
      }

      // Create new integration
      const result = await query(
        `INSERT INTO integrations (organization_id, user_id, type, shop_url, access_token, 
                                   branch_id, shop_name, status, settings, created_at, updated_at)
         VALUES ($1, $2, 'shopify', $3, $4, $5, $6, 'active', '{}', NOW(), NOW())
         RETURNING id`,
        [organizationId, userId, shopUrl, accessToken, branchId, testResult.shop.name]
      );

      // Log audit
      await createAuditLog({
        organizationId,
        userId,
        action: 'create',
        entityType: 'integration',
        entityId: result.rows[0].id,
        newValues: { shopUrl, shopName: testResult.shop.name, type: 'shopify' },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      return res.status(201).json({
        message: "Shopify integration created",
        integration: {
          id: result.rows[0].id,
          shopUrl,
          shopName: testResult.shop.name,
          status: 'active',
        },
      });
    } catch (err) {
      console.error("Error connecting Shopify:", err);
      return res.status(500).json({ error: "Error connecting Shopify" });
    }
  }
);

/**
 * POST /api/integrations/woocommerce/connect
 * Connect WooCommerce store to organization
 */
router.post(
  "/woocommerce/connect",
  auth,
  requirePermission('integrations', 'connect'),
  [
    body("storeUrl").isString().trim(),
    body("consumerKey").isString().trim(),
    body("consumerSecret").isString().trim(),
    body("branchId").optional().isInt(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { storeUrl, consumerKey, consumerSecret, branchId } = req.body;
      const organizationId = req.organizationId;
      const userId = req.user.id;

      // Test connection
      const testResult = await woocommerce.testConnection(storeUrl, consumerKey, consumerSecret);
      
      if (!testResult.success) {
        return res.status(400).json({
          error: "Failed to connect to WooCommerce",
          details: testResult.error,
        });
      }

      // Check if integration already exists
      const existing = await query(
        `SELECT id FROM integrations 
         WHERE organization_id = $1 AND type = 'woocommerce' AND shop_url = $2`,
        [organizationId, storeUrl]
      );

      if (existing.rowCount > 0) {
        // Update existing integration
        await query(
          `UPDATE integrations 
           SET api_key = $2, api_secret = $3, branch_id = $4, status = 'active', 
               shop_name = $5, updated_at = NOW()
           WHERE id = $6`,
          [organizationId, consumerKey, consumerSecret, branchId, 'WooCommerce Store', existing.rows[0].id]
        );

        // Log audit
        await createAuditLog({
          organizationId,
          userId,
          action: 'update',
          entityType: 'integration',
          entityId: existing.rows[0].id,
          oldValues: { storeUrl },
          newValues: { storeUrl, type: 'woocommerce' },
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
        });

        return res.json({
          message: "WooCommerce integration updated",
          integration: {
            id: existing.rows[0].id,
            storeUrl,
            status: 'active',
          },
        });
      }

      // Create new integration
      const result = await query(
        `INSERT INTO integrations (organization_id, user_id, type, shop_url, api_key, api_secret,
                                   branch_id, shop_name, status, settings, created_at, updated_at)
         VALUES ($1, $2, 'woocommerce', $3, $4, $5, $6, $7, 'active', '{}', NOW(), NOW())
         RETURNING id`,
        [organizationId, userId, storeUrl, consumerKey, consumerSecret, branchId, 'WooCommerce Store']
      );

      // Log audit
      await createAuditLog({
        organizationId,
        userId,
        action: 'create',
        entityType: 'integration',
        entityId: result.rows[0].id,
        newValues: { storeUrl, type: 'woocommerce' },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      return res.status(201).json({
        message: "WooCommerce integration created",
        integration: {
          id: result.rows[0].id,
          storeUrl,
          status: 'active',
        },
      });
    } catch (err) {
      console.error("Error connecting WooCommerce:", err);
      return res.status(500).json({ error: "Error connecting WooCommerce" });
    }
  }
);

/**
 * POST /api/integrations/stripe/connect
 * Connect Stripe account to organization
 */
router.post(
  "/stripe/connect",
  auth,
  requirePermission('integrations', 'connect'),
  [
    body("stripeCustomerId").optional().isString(),
    body("stripeAccountId").optional().isString(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { stripeCustomerId, stripeAccountId } = req.body;
      const organizationId = req.organizationId;
      const userId = req.user.id;

      // Check if integration already exists
      const existing = await query(
        `SELECT id FROM integrations 
         WHERE organization_id = $1 AND type = 'stripe'`,
        [organizationId]
      );

      if (existing.rowCount > 0) {
        // Update existing integration
        await query(
          `UPDATE integrations 
           SET api_key = $2, api_secret = $3, status = 'active', 
               shop_name = 'Stripe', updated_at = NOW()
           WHERE id = $4`,
          [organizationId, stripeCustomerId, stripeAccountId, existing.rows[0].id]
        );

        // Log audit
        await createAuditLog({
          organizationId,
          userId,
          action: 'update',
          entityType: 'integration',
          entityId: existing.rows[0].id,
          newValues: { type: 'stripe' },
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
        });

        return res.json({
          message: "Stripe integration updated",
          integration: {
            id: existing.rows[0].id,
            status: 'active',
          },
        });
      }

      // Create new integration
      const result = await query(
        `INSERT INTO integrations (organization_id, user_id, type, api_key, api_secret,
                                   shop_name, status, settings, created_at, updated_at)
         VALUES ($1, $2, 'stripe', $3, $4, $5, 'active', '{}', NOW(), NOW())
         RETURNING id`,
        [organizationId, userId, stripeCustomerId, stripeAccountId, 'Stripe']
      );

      // Log audit
      await createAuditLog({
        organizationId,
        userId,
        action: 'create',
        entityType: 'integration',
        entityId: result.rows[0].id,
        newValues: { type: 'stripe' },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      return res.status(201).json({
        message: "Stripe integration created",
        integration: {
          id: result.rows[0].id,
          status: 'active',
        },
      });
    } catch (err) {
      console.error("Error connecting Stripe:", err);
      return res.status(500).json({ error: "Error connecting Stripe" });
    }
  }
);

/**
 * POST /api/integrations/stripe/create-customer
 * Create Stripe customer
 */
router.post(
  "/stripe/create-customer",
  auth,
  requirePermission('integrations', 'connect'),
  [
    body("email").isEmail(),
    body("name").isString().trim(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, name } = req.body;
      const organizationId = req.organizationId;

      const result = await stripe.createCustomer(email, name, {
        organization_id: organizationId,
      });

      if (!result.success) {
        return res.status(500).json({ error: result.error });
      }

      return res.json({
        customer: result.customer,
      });
    } catch (err) {
      console.error("Error creating Stripe customer:", err);
      return res.status(500).json({ error: "Error creating customer" });
    }
  }
);

/**
 * POST /api/integrations/stripe/create-payment-intent
 * Create payment intent
 */
router.post(
  "/stripe/create-payment-intent",
  auth,
  requirePermission('integrations', 'connect'),
  [
    body("amount").isNumeric(),
    body("currency").isString(),
    body("customerId").isString(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { amount, currency, customerId } = req.body;
      const organizationId = req.organizationId;

      const result = await stripe.createPaymentIntent(amount, currency, customerId, {
        organization_id: organizationId,
      });

      if (!result.success) {
        return res.status(500).json({ error: result.error });
      }

      return res.json({
        paymentIntent: result.paymentIntent,
      });
    } catch (err) {
      console.error("Error creating payment intent:", err);
      return res.status(500).json({ error: "Error creating payment intent" });
    }
  }
);

/**
 * GET /api/integrations/google-sheets/auth-url
 * Get Google OAuth authorization URL
 */
router.get(
  "/google-sheets/auth-url",
  auth,
  requirePermission('integrations', 'connect'),
  async (req, res) => {
    try {
      const authUrl = googleSheets.getAuthUrl();
      return res.json({ authUrl });
    } catch (err) {
      console.error("Error getting auth URL:", err);
      return res.status(500).json({ error: "Error getting auth URL" });
    }
  }
);

/**
 * POST /api/integrations/google-sheets/connect
 * Connect Google Sheets account
 */
router.post(
  "/google-sheets/connect",
  auth,
  requirePermission('integrations', 'connect'),
  [
    body("code").isString(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { code } = req.body;
      const organizationId = req.organizationId;
      const userId = req.user.id;

      // Exchange code for tokens
      const tokensResult = await googleSheets.getTokens(code);
      
      if (!tokensResult.success) {
        return res.status(400).json({ error: tokensResult.error });
      }

      // Check if integration already exists
      const existing = await query(
        `SELECT id FROM integrations 
         WHERE organization_id = $1 AND type = 'google_sheets'`,
        [organizationId]
      );

      if (existing.rowCount > 0) {
        // Update existing integration
        await query(
          `UPDATE integrations 
           SET access_token = $2, refresh_token = $3, status = 'active', 
               shop_name = 'Google Sheets', updated_at = NOW()
           WHERE id = $4`,
          [organizationId, tokensResult.tokens.access_token, tokensResult.tokens.refresh_token, existing.rows[0].id]
        );

        // Log audit
        await createAuditLog({
          organizationId,
          userId,
          action: 'update',
          entityType: 'integration',
          entityId: existing.rows[0].id,
          newValues: { type: 'google_sheets' },
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
        });

        return res.json({
          message: "Google Sheets integration updated",
          integration: {
            id: existing.rows[0].id,
            status: 'active',
          },
        });
      }

      // Create new integration
      const result = await query(
        `INSERT INTO integrations (organization_id, user_id, type, access_token, refresh_token,
                                   shop_name, status, settings, created_at, updated_at)
         VALUES ($1, $2, 'google_sheets', $3, $4, $5, 'active', '{}', NOW(), NOW())
         RETURNING id`,
        [organizationId, userId, tokensResult.tokens.access_token, tokensResult.tokens.refresh_token, 'Google Sheets']
      );

      // Log audit
      await createAuditLog({
        organizationId,
        userId,
        action: 'create',
        entityType: 'integration',
        entityId: result.rows[0].id,
        newValues: { type: 'google_sheets' },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      return res.status(201).json({
        message: "Google Sheets integration created",
        integration: {
          id: result.rows[0].id,
          status: 'active',
        },
      });
    } catch (err) {
      console.error("Error connecting Google Sheets:", err);
      return res.status(500).json({ error: "Error connecting Google Sheets" });
    }
  }
);

/**
 * POST /api/integrations/google-sheets/export/products
 * Export products to Google Sheets
 */
router.post(
  "/google-sheets/export/products",
  auth,
  requirePermission('integrations', 'connect'),
  async (req, res) => {
    try {
      const { spreadsheetId, sheetName } = req.body;
      const organizationId = req.organizationId;
      const userId = req.user.id;

      // Get integration
      const integration = await query(
        `SELECT * FROM integrations 
         WHERE organization_id = $1 AND type = 'google_sheets' AND status = 'active'`,
        [organizationId]
      );

      if (integration.rowCount === 0) {
        return res.status(404).json({ error: "Google Sheets integration not found" });
      }

      const { access_token, refresh_token } = integration.rows[0];
      const tokens = { access_token, refresh_token };

      // Fetch products
      const products = await query(
        `SELECT id, name, description, price, stock, category, created_at 
         FROM products 
         WHERE organization_id = $1`,
        [organizationId]
      );

      // Export to Google Sheets
      const exportResult = await googleSheets.exportProducts(
        spreadsheetId,
        sheetName || 'Products',
        products.rows,
        tokens
      );

      if (!exportResult.success) {
        return res.status(500).json({ error: exportResult.error });
      }

      // Log audit
      await createAuditLog({
        organizationId,
        userId,
        action: 'export',
        entityType: 'integration',
        entityId: integration.rows[0].id,
        newValues: {
          exportType: 'products',
          rowsExported: exportResult.rowsExported,
        },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      return res.json({
        message: "Products exported successfully",
        rowsExported: exportResult.rowsExported,
      });
    } catch (err) {
      console.error("Error exporting products:", err);
      return res.status(500).json({ error: "Error exporting products" });
    }
  }
);

/**
 * POST /api/integrations/google-sheets/export/sales
 * Export sales to Google Sheets
 */
router.post(
  "/google-sheets/export/sales",
  auth,
  requirePermission('integrations', 'connect'),
  async (req, res) => {
    try {
      const { spreadsheetId, sheetName, startDate, endDate } = req.body;
      const organizationId = req.organizationId;
      const userId = req.user.id;

      // Get integration
      const integration = await query(
        `SELECT * FROM integrations 
         WHERE organization_id = $1 AND type = 'google_sheets' AND status = 'active'`,
        [organizationId]
      );

      if (integration.rowCount === 0) {
        return res.status(404).json({ error: "Google Sheets integration not found" });
      }

      const { access_token, refresh_token } = integration.rows[0];
      const tokens = { access_token, refresh_token };

      // Fetch sales
      let queryStr = `
        SELECT id, quantity, total_amount, sale_date, customer_email, customer_name, created_at 
        FROM sales 
        WHERE organization_id = $1
      `;
      const queryParams = [organizationId];

      if (startDate) {
        queryStr += ` AND sale_date >= $${queryParams.length + 1}`;
        queryParams.push(startDate);
      }

      if (endDate) {
        queryStr += ` AND sale_date <= $${queryParams.length + 1}`;
        queryParams.push(endDate);
      }

      const sales = await query(queryStr, queryParams);

      // Export to Google Sheets
      const exportResult = await googleSheets.exportSales(
        spreadsheetId,
        sheetName || 'Sales',
        sales.rows,
        tokens
      );

      if (!exportResult.success) {
        return res.status(500).json({ error: exportResult.error });
      }

      // Log audit
      await createAuditLog({
        organizationId,
        userId,
        action: 'export',
        entityType: 'integration',
        entityId: integration.rows[0].id,
        newValues: {
          exportType: 'sales',
          rowsExported: exportResult.rowsExported,
        },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      return res.json({
        message: "Sales exported successfully",
        rowsExported: exportResult.rowsExported,
      });
    } catch (err) {
      console.error("Error exporting sales:", err);
      return res.status(500).json({ error: "Error exporting sales" });
    }
  }
);

/**
 * POST /api/integrations/shopify/sync/products
 * Sync products from Shopify
 */
router.post(
  "/shopify/sync/products",
  auth,
  requirePermission('integrations', 'connect'),
  async (req, res) => {
    try {
      const { integrationId, limit } = req.body;
      const organizationId = req.organizationId;
      const userId = req.user.id;

      // Get integration details
      const integration = await query(
        `SELECT * FROM integrations 
         WHERE id = $1 AND organization_id = $2 AND type = 'shopify' AND status = 'active'`,
        [integrationId, organizationId]
      );

      if (integration.rowCount === 0) {
        return res.status(404).json({ error: "Shopify integration not found" });
      }

      const { shop_url, access_token, branch_id } = integration.rows[0];

      // Fetch products from Shopify
      const productsResult = await shopify.fetchProducts(shop_url, access_token, { limit });

      if (!productsResult.success) {
        return res.status(500).json({
          error: "Failed to fetch products from Shopify",
          details: productsResult.error,
        });
      }

      // Sync products to database
      const syncResults = {
        created: 0,
        updated: 0,
        failed: 0,
      };

      for (const product of productsResult.products) {
        const syncResult = await shopify.syncProduct(product, organizationId, branch_id);
        if (syncResult.success) {
          if (syncResult.action === 'created') syncResults.created++;
          else syncResults.updated++;
        } else {
          syncResults.failed++;
        }
      }

      // Log audit
      await createAuditLog({
        organizationId,
        userId,
        action: 'sync',
        entityType: 'integration',
        entityId: integrationId,
        newValues: { syncType: 'products', ...syncResults },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      return res.json({
        message: "Product sync completed",
        results: syncResults,
      });
    } catch (err) {
      console.error("Error syncing products:", err);
      return res.status(500).json({ error: "Error syncing products" });
    }
  }
);

/**
 * POST /api/integrations/woocommerce/sync/products
 * Sync products from WooCommerce
 */
router.post(
  "/woocommerce/sync/products",
  auth,
  requirePermission('integrations', 'connect'),
  async (req, res) => {
    try {
      const { integrationId, perPage, page } = req.body;
      const organizationId = req.organizationId;
      const userId = req.user.id;

      // Get integration details
      const integration = await query(
        `SELECT * FROM integrations 
         WHERE id = $1 AND organization_id = $2 AND type = 'woocommerce' AND status = 'active'`,
        [integrationId, organizationId]
      );

      if (integration.rowCount === 0) {
        return res.status(404).json({ error: "WooCommerce integration not found" });
      }

      const { shop_url, api_key, api_secret, branch_id } = integration.rows[0];

      // Fetch products from WooCommerce
      const productsResult = await woocommerce.fetchProducts(shop_url, api_key, api_secret, {
        perPage,
        page,
      });

      if (!productsResult.success) {
        return res.status(500).json({
          error: "Failed to fetch products from WooCommerce",
          details: productsResult.error,
        });
      }

      // Sync products to database
      const syncResults = {
        created: 0,
        updated: 0,
        failed: 0,
      };

      for (const product of productsResult.products) {
        const syncResult = await woocommerce.syncProduct(product, organizationId, branch_id);
        if (syncResult.success) {
          if (syncResult.action === 'created') syncResults.created++;
          else syncResults.updated++;
        } else {
          syncResults.failed++;
        }
      }

      // Log audit
      await createAuditLog({
        organizationId,
        userId,
        action: 'sync',
        entityType: 'integration',
        entityId: integrationId,
        newValues: { syncType: 'products', ...syncResults },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      return res.json({
        message: "Product sync completed",
        results: syncResults,
      });
    } catch (err) {
      console.error("Error syncing WooCommerce products:", err);
      return res.status(500).json({ error: "Error syncing products" });
    }
  }
);

/**
 * POST /api/integrations/shopify/sync/orders
 * Sync orders from Shopify
 */
router.post(
  "/shopify/sync/orders",
  auth,
  requirePermission('integrations', 'connect'),
  async (req, res) => {
    try {
      const { integrationId, limit, createdAtMin, createdAtMax } = req.body;
      const organizationId = req.organizationId;
      const userId = req.user.id;

      // Get integration details
      const integration = await query(
        `SELECT * FROM integrations 
         WHERE id = $1 AND organization_id = $2 AND type = 'shopify' AND status = 'active'`,
        [integrationId, organizationId]
      );

      if (integration.rowCount === 0) {
        return res.status(404).json({ error: "Shopify integration not found" });
      }

      const { shop_url, access_token, branch_id } = integration.rows[0];

      // Fetch orders from Shopify
      const ordersResult = await shopify.fetchOrders(shop_url, access_token, {
        limit,
        createdAtMin,
        createdAtMax,
      });

      if (!ordersResult.success) {
        return res.status(500).json({
          error: "Failed to fetch orders from Shopify",
          details: ordersResult.error,
        });
      }

      // Sync orders to database
      const syncResults = {
        created: 0,
        updated: 0,
        failed: 0,
      };

      for (const order of ordersResult.orders) {
        const syncResult = await shopify.syncOrder(order, organizationId, branch_id);
        if (syncResult.success) {
          if (syncResult.action === 'created') syncResults.created++;
          else syncResults.updated++;
        } else {
          syncResults.failed++;
        }
      }

      // Log audit
      await createAuditLog({
        organizationId,
        userId,
        action: 'sync',
        entityType: 'integration',
        entityId: integrationId,
        newValues: { syncType: 'orders', ...syncResults },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      return res.json({
        message: "Order sync completed",
        results: syncResults,
      });
    } catch (err) {
      console.error("Error syncing orders:", err);
      return res.status(500).json({ error: "Error syncing orders" });
    }
  }
);

/**
 * GET /api/integrations
 * List all integrations for organization
 */
router.get(
  "/",
  auth,
  requirePermission('integrations', 'view'),
  async (req, res) => {
    try {
      const organizationId = req.organizationId;

      const result = await query(
        `SELECT id, type, shop_url, shop_name, status, branch_id, created_at, updated_at
         FROM integrations
         WHERE organization_id = $1
         ORDER BY created_at DESC`,
        [organizationId]
      );

      return res.json({
        integrations: result.rows,
      });
    } catch (err) {
      console.error("Error fetching integrations:", err);
      return res.status(500).json({ error: "Error fetching integrations" });
    }
  }
);

/**
 * DELETE /api/integrations/:id
 * Disconnect integration
 */
router.delete(
  "/:id",
  auth,
  requirePermission('integrations', 'connect'),
  async (req, res) => {
    try {
      const integrationId = parseInt(req.params.id);
      const organizationId = req.organizationId;
      const userId = req.user.id;

      // Get integration
      const integration = await query(
        `SELECT * FROM integrations 
         WHERE id = $1 AND organization_id = $2`,
        [integrationId, organizationId]
      );

      if (integration.rowCount === 0) {
        return res.status(404).json({ error: "Integration not found" });
      }

      // Delete integration
      await query(
        `DELETE FROM integrations WHERE id = $1`,
        [integrationId]
      );

      // Log audit
      await createAuditLog({
        organizationId,
        userId,
        action: 'delete',
        entityType: 'integration',
        entityId: integrationId,
        oldValues: { type: integration.rows[0].type, shopUrl: integration.rows[0].shop_url },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      return res.json({
        message: "Integration disconnected",
      });
    } catch (err) {
      console.error("Error disconnecting integration:", err);
      return res.status(500).json({ error: "Error disconnecting integration" });
    }
  }
);

module.exports = router;
