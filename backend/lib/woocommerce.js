/**
 * WooCommerce Integration Service
 * Handles WooCommerce API connections, product sync, order sync, etc.
 */

const axios = require('axios');
const crypto = require('crypto');

/**
 * Create WooCommerce API client
 */
const createClient = (storeUrl, consumerKey, consumerSecret) => {
  const baseUrl = `${storeUrl}/wp-json/wc/v3`;
  
  const client = axios.create({
    baseURL: baseUrl,
    auth: {
      username: consumerKey,
      password: consumerSecret,
    },
    headers: {
      'Content-Type': 'application/json',
    },
  });

  return client;
};

/**
 * Test WooCommerce connection
 */
const testConnection = async (storeUrl, consumerKey, consumerSecret) => {
  try {
    const client = createClient(storeUrl, consumerKey, consumerSecret);
    const response = await client.get('/system_status');
    return { success: true, store: response.data };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data?.message || error.message 
    };
  }
};

/**
 * Fetch products from WooCommerce
 */
const fetchProducts = async (storeUrl, consumerKey, consumerSecret, options = {}) => {
  try {
    const client = createClient(storeUrl, consumerKey, consumerSecret);
    const params = {
      per_page: options.perPage || 100,
      page: options.page || 1,
      after: options.after,
      before: options.before,
    };
    
    const response = await client.get('/products', { params });
    return { success: true, products: response.data };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data?.message || error.message 
    };
  }
};

/**
 * Fetch orders from WooCommerce
 */
const fetchOrders = async (storeUrl, consumerKey, consumerSecret, options = {}) => {
  try {
    const client = createClient(storeUrl, consumerKey, consumerSecret);
    const params = {
      per_page: options.perPage || 100,
      page: options.page || 1,
      after: options.after,
      before: options.before,
      status: options.status || 'any',
    };
    
    const response = await client.get('/orders', { params });
    return { success: true, orders: response.data };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data?.message || error.message 
    };
  }
};

/**
 * Fetch customers from WooCommerce
 */
const fetchCustomers = async (storeUrl, consumerKey, consumerSecret, options = {}) => {
  try {
    const client = createClient(storeUrl, consumerKey, consumerSecret);
    const params = {
      per_page: options.perPage || 100,
      page: options.page || 1,
      after: options.after,
      before: options.before,
    };
    
    const response = await client.get('/customers', { params });
    return { success: true, customers: response.data };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data?.message || error.message 
    };
  }
};

/**
 * Create webhook in WooCommerce
 */
const createWebhook = async (storeUrl, consumerKey, consumerSecret, topic, deliveryUrl) => {
  try {
    const client = createClient(storeUrl, consumerKey, consumerSecret);
    const response = await client.post('/webhooks', {
      topic,
      delivery_url: deliveryUrl,
      secret: crypto.randomBytes(16).toString('hex'),
    });
    return { success: true, webhook: response.data };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data?.message || error.message 
    };
  }
};

/**
 * Delete webhook from WooCommerce
 */
const deleteWebhook = async (storeUrl, consumerKey, consumerSecret, webhookId) => {
  try {
    const client = createClient(storeUrl, consumerKey, consumerSecret);
    await client.delete(`/webhooks/${webhookId}`);
    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data?.message || error.message 
    };
  }
};

/**
 * List webhooks in WooCommerce
 */
const listWebhooks = async (storeUrl, consumerKey, consumerSecret) => {
  try {
    const client = createClient(storeUrl, consumerKey, consumerSecret);
    const response = await client.get('/webhooks');
    return { success: true, webhooks: response.data };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data?.message || error.message 
    };
  }
};

/**
 * Sync WooCommerce product to local database
 */
const syncProduct = async (wooProduct, organizationId, branchId) => {
  const { query } = require('../db/pool');
  
  try {
    // Check if product already exists
    const existing = await query(
      `SELECT id FROM products 
       WHERE woo_product_id = $1 AND organization_id = $2`,
      [wooProduct.id, organizationId]
    );

    const productData = {
      name: wooProduct.name,
      description: wooProduct.description || wooProduct.short_description,
      price: wooProduct.regular_price || wooProduct.price || 0,
      stock: wooProduct.stock_quantity || wooProduct.manage_stock ? wooProduct.stock_quantity : 0,
      category: wooProduct.categories?.[0]?.name || 'Uncategorized',
      woo_product_id: wooProduct.id,
      image_url: wooProduct.images?.[0]?.src,
      organization_id: organizationId,
      branch_id: branchId,
      user_id: null, // System sync
    };

    if (existing.rowCount > 0) {
      // Update existing product
      await query(
        `UPDATE products 
         SET name = $1, description = $2, price = $3, stock = $4, 
             category = $5, image_url = $6, updated_at = NOW()
         WHERE id = $7`,
        [
          productData.name,
          productData.description,
          productData.price,
          productData.stock,
          productData.category,
          productData.image_url,
          existing.rows[0].id,
        ]
      );
      return { success: true, action: 'updated', id: existing.rows[0].id };
    } else {
      // Insert new product
      const result = await query(
        `INSERT INTO products 
         (name, description, price, stock, category, woo_product_id, 
          image_url, organization_id, branch_id, user_id, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
         RETURNING id`,
        [
          productData.name,
          productData.description,
          productData.price,
          productData.stock,
          productData.category,
          productData.woo_product_id,
          productData.image_url,
          productData.organization_id,
          productData.branch_id,
          productData.user_id,
        ]
      );
      return { success: true, action: 'created', id: result.rows[0].id };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Sync WooCommerce order to local database
 */
const syncOrder = async (wooOrder, organizationId, branchId) => {
  const { query } = require('../db/pool');
  
  try {
    // Check if order already exists
    const existing = await query(
      `SELECT id FROM sales 
       WHERE woo_order_id = $1 AND organization_id = $2`,
      [wooOrder.id, organizationId]
    );

    const orderData = {
      quantity: wooOrder.line_items.reduce((sum, item) => sum + item.quantity, 0),
      total_amount: parseFloat(wooOrder.total),
      sale_date: wooOrder.date_created,
      woo_order_id: wooOrder.id,
      woo_order_number: wooOrder.order_number,
      customer_email: wooOrder.billing?.email,
      customer_name: wooOrder.billing?.first_name 
        ? `${wooOrder.billing.first_name} ${wooOrder.billing.last_name || ''}`.trim()
        : wooOrder.billing?.company || 'Unknown',
      organization_id: organizationId,
      branch_id: branchId,
      user_id: null, // System sync
    };

    if (existing.rowCount > 0) {
      // Update existing order
      await query(
        `UPDATE sales 
         SET quantity = $1, total_amount = $2, sale_date = $3, 
             customer_email = $4, customer_name = $5, updated_at = NOW()
         WHERE id = $6`,
        [
          orderData.quantity,
          orderData.total_amount,
          orderData.sale_date,
          orderData.customer_email,
          orderData.customer_name,
          existing.rows[0].id,
        ]
      );
      return { success: true, action: 'updated', id: existing.rows[0].id };
    } else {
      // Insert new order
      const result = await query(
        `INSERT INTO sales 
         (quantity, total_amount, sale_date, woo_order_id, woo_order_number,
          customer_email, customer_name, organization_id, branch_id, user_id, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
         RETURNING id`,
        [
          orderData.quantity,
          orderData.total_amount,
          orderData.sale_date,
          orderData.woo_order_id,
          orderData.woo_order_number,
          orderData.customer_email,
          orderData.customer_name,
          orderData.organization_id,
          orderData.branch_id,
          orderData.user_id,
        ]
      );
      return { success: true, action: 'created', id: result.rows[0].id };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
};

module.exports = {
  createClient,
  testConnection,
  fetchProducts,
  fetchOrders,
  fetchCustomers,
  createWebhook,
  deleteWebhook,
  listWebhooks,
  syncProduct,
  syncOrder,
};
