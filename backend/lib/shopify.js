/**
 * Shopify Integration Service
 * Handles Shopify API connections, product sync, order sync, etc.
 */

const axios = require('axios');

/**
 * Create Shopify API client
 */
const createClient = (shopUrl, accessToken) => {
  const baseUrl = `https://${shopUrl}/admin/api/2024-01`;
  
  const client = axios.create({
    baseURL: baseUrl,
    headers: {
      'X-Shopify-Access-Token': accessToken,
      'Content-Type': 'application/json',
    },
  });

  return client;
};

/**
 * Test Shopify connection
 */
const testConnection = async (shopUrl, accessToken) => {
  try {
    const client = createClient(shopUrl, accessToken);
    const response = await client.get('/shop.json');
    return { success: true, shop: response.data.shop };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data?.errors || error.message 
    };
  }
};

/**
 * Fetch products from Shopify
 */
const fetchProducts = async (shopUrl, accessToken, options = {}) => {
  try {
    const client = createClient(shopUrl, accessToken);
    const params = {
      limit: options.limit || 250,
      since_id: options.sinceId,
    };
    
    const response = await client.get('/products.json', { params });
    return { success: true, products: response.data.products };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data?.errors || error.message 
    };
  }
};

/**
 * Fetch orders from Shopify
 */
const fetchOrders = async (shopUrl, accessToken, options = {}) => {
  try {
    const client = createClient(shopUrl, accessToken);
    const params = {
      limit: options.limit || 250,
      status: options.status || 'any',
      since_id: options.sinceId,
      created_at_min: options.createdAtMin,
      created_at_max: options.createdAtMax,
    };
    
    const response = await client.get('/orders.json', { params });
    return { success: true, orders: response.data.orders };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data?.errors || error.message 
    };
  }
};

/**
 * Fetch customers from Shopify
 */
const fetchCustomers = async (shopUrl, accessToken, options = {}) => {
  try {
    const client = createClient(shopUrl, accessToken);
    const params = {
      limit: options.limit || 250,
      since_id: options.sinceId,
    };
    
    const response = await client.get('/customers.json', { params });
    return { success: true, customers: response.data.customers };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data?.errors || error.message 
    };
  }
};

/**
 * Create webhook in Shopify
 */
const createWebhook = async (shopUrl, accessToken, topic, address) => {
  try {
    const client = createClient(shopUrl, accessToken);
    const response = await client.post('/webhooks.json', {
      webhook: {
        topic,
        address,
        format: 'json',
      },
    });
    return { success: true, webhook: response.data.webhook };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data?.errors || error.message 
    };
  }
};

/**
 * Delete webhook from Shopify
 */
const deleteWebhook = async (shopUrl, accessToken, webhookId) => {
  try {
    const client = createClient(shopUrl, accessToken);
    await client.delete(`/webhooks/${webhookId}.json`);
    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data?.errors || error.message 
    };
  }
};

/**
 * List webhooks in Shopify
 */
const listWebhooks = async (shopUrl, accessToken) => {
  try {
    const client = createClient(shopUrl, accessToken);
    const response = await client.get('/webhooks.json');
    return { success: true, webhooks: response.data.webhooks };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data?.errors || error.message 
    };
  }
};

/**
 * Sync Shopify product to local database
 */
const syncProduct = async (shopifyProduct, organizationId, branchId) => {
  const { query } = require('../db/pool');
  
  try {
    // Check if product already exists
    const existing = await query(
      `SELECT id FROM products 
       WHERE shopify_product_id = $1 AND organization_id = $2`,
      [shopifyProduct.id, organizationId]
    );

    const productData = {
      name: shopifyProduct.title,
      description: shopifyProduct.body_html,
      price: shopifyProduct.variants[0]?.price || 0,
      stock: shopifyProduct.variants[0]?.inventory_quantity || 0,
      category: shopifyProduct.product_type || 'Uncategorized',
      shopify_product_id: shopifyProduct.id,
      shopify_variant_id: shopifyProduct.variants[0]?.id,
      image_url: shopifyProduct.images[0]?.src,
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
         (name, description, price, stock, category, shopify_product_id, shopify_variant_id, 
          image_url, organization_id, branch_id, user_id, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
         RETURNING id`,
        [
          productData.name,
          productData.description,
          productData.price,
          productData.stock,
          productData.category,
          productData.shopify_product_id,
          productData.shopify_variant_id,
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
 * Sync Shopify order to local database
 */
const syncOrder = async (shopifyOrder, organizationId, branchId) => {
  const { query } = require('../db/pool');
  
  try {
    // Check if order already exists
    const existing = await query(
      `SELECT id FROM sales 
       WHERE shopify_order_id = $1 AND organization_id = $2`,
      [shopifyOrder.id, organizationId]
    );

    const orderData = {
      quantity: shopifyOrder.line_items.reduce((sum, item) => sum + item.quantity, 0),
      total_amount: parseFloat(shopifyOrder.total_price),
      sale_date: shopifyOrder.created_at,
      shopify_order_id: shopifyOrder.id,
      shopify_order_number: shopifyOrder.order_number,
      customer_email: shopifyOrder.customer?.email,
      customer_name: shopifyOrder.customer?.first_name 
        ? `${shopifyOrder.customer.first_name} ${shopifyOrder.customer.last_name || ''}`.trim()
        : shopifyOrder.billing_address?.name || 'Unknown',
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
         (quantity, total_amount, sale_date, shopify_order_id, shopify_order_number,
          customer_email, customer_name, organization_id, branch_id, user_id, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
         RETURNING id`,
        [
          orderData.quantity,
          orderData.total_amount,
          orderData.sale_date,
          orderData.shopify_order_id,
          orderData.shopify_order_number,
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
