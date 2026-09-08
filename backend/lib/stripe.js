/**
 * Stripe Integration Service
 * Handles Stripe API connections, payment processing, subscription management
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

/**
 * Create Stripe customer
 */
const createCustomer = async (email, name, metadata = {}) => {
  try {
    const customer = await stripe.customers.create({
      email,
      name,
      metadata,
    });
    return { success: true, customer };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Create payment intent
 */
const createPaymentIntent = async (amount, currency, customerId, metadata = {}) => {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Stripe uses cents
      currency: currency.toLowerCase(),
      customer: customerId,
      metadata,
    });
    return { success: true, paymentIntent };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Get payment intent
 */
const getPaymentIntent = async (paymentIntentId) => {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    return { success: true, paymentIntent };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Create subscription
 */
const createSubscription = async (customerId, priceId, metadata = {}) => {
  try {
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      metadata,
    });
    return { success: true, subscription };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Cancel subscription
 */
const cancelSubscription = async (subscriptionId) => {
  try {
    const subscription = await stripe.subscriptions.cancel(subscriptionId);
    return { success: true, subscription };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Get subscription
 */
const getSubscription = async (subscriptionId) => {
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    return { success: true, subscription };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Update subscription
 */
const updateSubscription = async (subscriptionId, items) => {
  try {
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      items,
    });
    return { success: true, subscription };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Create product
 */
const createProduct = async (name, description, metadata = {}) => {
  try {
    const product = await stripe.products.create({
      name,
      description,
      metadata,
    });
    return { success: true, product };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Create price
 */
const createPrice = async (productId, amount, currency, recurring = null) => {
  try {
    const priceData = {
      product: productId,
      unit_amount: Math.round(amount * 100),
      currency: currency.toLowerCase(),
    };

    if (recurring) {
      priceData.recurring = {
        interval: recurring.interval, // 'day', 'week', 'month', 'year'
        interval_count: recurring.intervalCount || 1,
      };
    }

    const price = await stripe.prices.create(priceData);
    return { success: true, price };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * List prices for a product
 */
const listPrices = async (productId) => {
  try {
    const prices = await stripe.prices.list({
      product: productId,
      active: true,
    });
    return { success: true, prices: prices.data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Handle webhook event
 */
const handleWebhook = async (payload, signature, webhookSecret) => {
  try {
    const event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    return { success: true, event };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Get customer by ID
 */
const getCustomer = async (customerId) => {
  try {
    const customer = await stripe.customers.retrieve(customerId);
    return { success: true, customer };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Update customer
 */
const updateCustomer = async (customerId, updates) => {
  try {
    const customer = await stripe.customers.update(customerId, updates);
    return { success: true, customer };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Create checkout session for one-time payment
 */
const createCheckoutSession = async (customerId, priceId, successUrl, cancelUrl, metadata = {}) => {
  try {
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata,
    });
    return { success: true, session };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Create checkout session for subscription
 */
const createSubscriptionCheckoutSession = async (customerId, priceId, successUrl, cancelUrl, metadata = {}) => {
  try {
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata,
    });
    return { success: true, session };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Get checkout session
 */
const getCheckoutSession = async (sessionId) => {
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    return { success: true, session };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

module.exports = {
  createCustomer,
  createPaymentIntent,
  getPaymentIntent,
  createSubscription,
  cancelSubscription,
  getSubscription,
  updateSubscription,
  createProduct,
  createPrice,
  listPrices,
  handleWebhook,
  getCustomer,
  updateCustomer,
  createCheckoutSession,
  createSubscriptionCheckoutSession,
  getCheckoutSession,
};
