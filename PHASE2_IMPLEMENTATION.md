# Phase 2 Implementation - Integrations & Advanced Analytics

## Overview
Phase 2 extends the Smart Business Assistant with third-party integrations, AI-powered natural language querying, and advanced analytics features. This phase focuses on connecting the platform with popular e-commerce platforms, payment processors, productivity tools, and adding sophisticated business intelligence capabilities.

## Completed Features

### 1. Email Service Integration
**File:** `backend/lib/email.js`

- **Nodemailer Integration**: Full email service using Nodemailer with SMTP support
- **Email Templates**:
  - Team invitations with accept/decline links
  - Password reset with expiry handling
  - Email verification
  - Welcome emails for new organizations
  - Notification emails
- **Test Mode**: Graceful fallback when email service not configured
- **Environment Variables**:
  - `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`
  - `SMTP_USER`, `SMTP_PASS`
  - `EMAIL_FROM`

**Integration Points:**
- `backend/routes/invitations.js` - Invitation emails
- `backend/routes/auth.js` - Password reset and email verification

### 2. Shopify Integration
**Files:** `backend/lib/shopify.js`, `backend/routes/integrations.js`

- **API Client**: Full Shopify Admin API client using axios
- **Features**:
  - Connection testing
  - Product sync (fetch and sync to local database)
  - Order sync (fetch and sync to local database)
  - Customer sync
  - Webhook management (create, delete, list)
- **Database Schema Updates**:
  - `integrations` table for storing Shopify credentials
  - `products.shopify_product_id`, `products.shopify_variant_id`
  - `sales.shopify_order_id`, `sales.shopify_order_number`
  - `sales.customer_email`, `sales.customer_name`

**API Endpoints:**
- `POST /api/integrations/shopify/connect` - Connect Shopify store
- `POST /api/integrations/shopify/sync/products` - Sync products
- `POST /api/integrations/shopify/sync/orders` - Sync orders

### 3. WooCommerce Integration
**Files:** `backend/lib/woocommerce.js`, `backend/routes/integrations.js`

- **API Client**: Full WooCommerce REST API client with OAuth
- **Features**:
  - Connection testing
  - Product sync (fetch and sync to local database)
  - Order sync (fetch and sync to local database)
  - Customer sync
  - Webhook management
- **Database Schema Updates**:
  - `products.woo_product_id`
  - `sales.woo_order_id`, `sales.woo_order_number`

**API Endpoints:**
- `POST /api/integrations/woocommerce/connect` - Connect WooCommerce store
- `POST /api/integrations/woocommerce/sync/products` - Sync products

### 4. Stripe Payment Integration
**Files:** `backend/lib/stripe.js`, `backend/routes/integrations.js`

- **Stripe SDK**: Full Stripe API integration
- **Features**:
  - Customer management (create, update, retrieve)
  - Payment intents (create, retrieve)
  - Subscription management (create, cancel, update)
  - Product and price management
  - Checkout sessions (one-time and subscription)
  - Webhook handling
- **Database Schema Updates**:
  - `integrations` table for Stripe credentials

**API Endpoints:**
- `POST /api/integrations/stripe/connect` - Connect Stripe account
- `POST /api/integrations/stripe/create-customer` - Create Stripe customer
- `POST /api/integrations/stripe/create-payment-intent` - Create payment intent

**Environment Variables:**
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

### 5. Google Sheets Integration
**Files:** `backend/lib/googleSheets.js`, `backend/routes/integrations.js`

- **Google APIs**: Google Sheets API integration with OAuth2
- **Features**:
  - OAuth2 authentication flow
  - Token management (access and refresh tokens)
  - Sheet creation
  - Data export (append, update, read)
  - Sheet sharing
  - Product export to Google Sheets
  - Sales export to Google Sheets
- **Database Schema Updates**:
  - `integrations` table for Google OAuth tokens

**API Endpoints:**
- `GET /api/integrations/google-sheets/auth-url` - Get OAuth authorization URL
- `POST /api/integrations/google-sheets/connect` - Complete OAuth flow
- `POST /api/integrations/google-sheets/export/products` - Export products
- `POST /api/integrations/google-sheets/export/sales` - Export sales with date filtering

**Environment Variables:**
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URI`

### 6. AI Copilot - Natural Language Query Interface
**File:** `backend/routes/ai-copilot.js`

- **Natural Language Processing**: Interface to AI service for SQL generation
- **Features**:
  - Natural language to SQL conversion
  - Query execution with results
  - Action determination and execution
  - AI suggestions based on data context
  - Query history tracking
  - Audit logging for all AI interactions
- **Available Actions**:
  - Create product
  - Update product
  - Create sale
  - Generate reports

**API Endpoints:**
- `POST /api/ai-copilot/query` - Natural language query
- `POST /api/ai-copilot/action` - Execute AI-determined action
- `POST /api/ai-copilot/suggest` - Get AI suggestions
- `GET /api/ai-copilot/history` - Query history

### 7. Advanced Analytics Features
**File:** `backend/routes/analysis.js`

#### 7.1 Profit and Margin Analysis
**Endpoint:** `GET /api/analysis/profit-margin`

- **Overall Metrics**: Total sales, revenue, cost, profit, margin percentage
- **By Product**: Profit breakdown per product with margin calculations
- **By Month**: Monthly profit trends
- **Filters**: Date range, product-specific analysis
- **Database Schema**: Added `products.cost` column for cost tracking

#### 7.2 Customer Lifetime Value (LTV) Analysis
**Endpoint:** `GET /api/analysis/customer-ltv`

- **Metrics**: Total customers, average LTV, average order value, orders per customer
- **By Customer**: Individual customer spending patterns, purchase history
- **Customer Segments**: High/Medium/Low value customer segmentation
- **Filters**: Date range analysis

#### 7.3 Cohort Analysis
**Endpoint:** `GET /api/analysis/cohort`

- **Cohort Definition**: Customers grouped by first purchase month
- **Retention Matrix**: Customer retention over time by cohort
- **Percentage Tracking**: Retention percentages for each cohort month

#### 7.4 Inventory Forecasting
**Endpoint:** `GET /api/analysis/inventory-forecast`

- **Sales Rate Calculation**: Daily sales rate based on 90-day history
- **Stock Status**: Categories (out_of_stock, critical, low, warning, healthy)
- **Days Until Stockout**: Forecast based on sales rate
- **Recommended Orders**: Suggested reorder quantities
- **Summary Statistics**: Overview of inventory health

## Database Schema Changes

### New Tables
- **`integrations`**: Stores third-party integration credentials
  - Fields: organization_id, user_id, type, shop_url, access_token, refresh_token, api_key, api_secret, branch_id, status, settings, last_sync_at, sync_frequency
  - Supported types: shopify, woocommerce, stripe, google_sheets

### Existing Tables - New Columns
- **`products`**:
  - `shopify_product_id` (BIGINT)
  - `shopify_variant_id` (BIGINT)
  - `woo_product_id` (BIGINT)
  - `cost` (DECIMAL(10,2)) - For profit calculations

- **`sales`**:
  - `shopify_order_id` (BIGINT)
  - `shopify_order_number` (INTEGER)
  - `woo_order_id` (BIGINT)
  - `woo_order_number` (INTEGER)
  - `customer_email` (VARCHAR(150))
  - `customer_name` (VARCHAR(200))

### New Indexes
- `idx_integrations_org` on integrations(organization_id)
- `idx_integrations_type` on integrations(type)
- `idx_integrations_status` on integrations(status)
- `idx_products_shopify` on products(shopify_product_id)
- `idx_products_woo` on products(woo_product_id)
- `idx_sales_shopify` on sales(shopify_order_id)
- `idx_sales_woo` on sales(woo_order_id)

### New Triggers
- `update_integrations_updated_at` - Auto-update timestamp on integrations table

## Environment Variables

### Email Service
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
EMAIL_FROM=noreply@smartbusiness.com
```

### Stripe
```env
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

### Google OAuth
```env
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:5000/api/integrations/google-sheets/callback
```

## Dependencies Added

### Backend (package.json)
- `nodemailer@^6.9.7` - Email service
- `stripe@^14.10.0` - Payment processing
- `googleapis@^128.0.0` - Google Sheets API

## API Routes Summary

### Integrations
- `/api/integrations` - List all integrations
- `/api/integrations/:id` - Delete integration
- `/api/integrations/shopify/connect` - Connect Shopify
- `/api/integrations/shopify/sync/products` - Sync Shopify products
- `/api/integrations/shopify/sync/orders` - Sync Shopify orders
- `/api/integrations/woocommerce/connect` - Connect WooCommerce
- `/api/integrations/woocommerce/sync/products` - Sync WooCommerce products
- `/api/integrations/stripe/connect` - Connect Stripe
- `/api/integrations/stripe/create-customer` - Create Stripe customer
- `/api/integrations/stripe/create-payment-intent` - Create payment intent
- `/api/integrations/google-sheets/auth-url` - Get Google auth URL
- `/api/integrations/google-sheets/connect` - Connect Google Sheets
- `/api/integrations/google-sheets/export/products` - Export products
- `/api/integrations/google-sheets/export/sales` - Export sales

### AI Copilot
- `/api/ai-copilot/query` - Natural language query
- `/api/ai-copilot/action` - Execute AI action
- `/api/ai-copilot/suggest` - Get AI suggestions
- `/api/ai-copilot/history` - Query history

### Analytics (New)
- `/api/analysis/profit-margin` - Profit and margin analysis
- `/api/analysis/customer-ltv` - Customer lifetime value
- `/api/analysis/cohort` - Cohort analysis
- `/api/analysis/inventory-forecast` - Inventory forecasting

## Security Considerations

### Integration Credentials
- All integration credentials stored securely in database
- Access tokens and refresh tokens encrypted at rest (application-level encryption recommended)
- OAuth2 flow for Google Sheets with proper token refresh
- API keys validated before use

### Audit Logging
- All integration actions logged to audit_logs table
- AI queries and actions tracked with user context
- Export operations logged with data counts

### Permission Checks
- All integration endpoints require `integrations:connect` permission
- Organization-level isolation enforced
- User-level scoping for analytics

## Testing Recommendations

### Integration Testing
1. Test Shopify connection with test store
2. Verify product sync with sample data
3. Test order sync with historical orders
4. Validate WooCommerce OAuth flow
5. Test Stripe payment intent creation
6. Verify Google Sheets export functionality

### Analytics Testing
1. Test profit margin calculations with known cost/revenue data
2. Verify customer LTV calculations
3. Test cohort analysis with sample customer data
4. Validate inventory forecasting with sales history
5. Test date range filtering on all endpoints

### AI Copilot Testing
1. Test natural language queries with various phrasing
2. Verify SQL generation accuracy
3. Test action execution with different intents
4. Validate audit logging for AI interactions

## Migration Instructions

1. **Run Database Migration**:
   ```bash
   cd backend
   node db/migrate.js
   ```

2. **Install New Dependencies**:
   ```bash
   cd backend
   npm install
   ```

3. **Configure Environment Variables**:
   - Copy `.env.example` to `.env`
   - Configure email service (optional for development)
   - Configure Stripe (optional for development)
   - Configure Google OAuth (optional for development)

4. **Restart Backend Server**:
   ```bash
   npm run dev
   ```

## Troubleshooting

### Email Service Not Working
- Verify SMTP credentials are correct
- Check firewall allows SMTP port (587)
- Enable "Less Secure Apps" for Gmail if using SMTP
- Check logs for connection errors

### Shopify/WooCommerce Sync Fails
- Verify API credentials are valid
- Check store URL format (include https://)
- Ensure API permissions are granted
- Check rate limits (Shopify: 40 calls/min, WooCommerce: varies)

### Stripe Integration Issues
- Verify API key is valid (test vs production)
- Check webhook secret matches Stripe dashboard
- Ensure customer exists before creating payment intent

### Google Sheets OAuth Fails
- Verify OAuth consent screen is configured
- Check redirect URI matches exactly
- Ensure API is enabled in Google Cloud Console
- Verify client ID and secret are correct

### Analytics Queries Slow
- Add indexes on frequently queried columns
- Consider materialized views for complex aggregations
- Optimize cohort analysis query for large datasets
- Cache inventory forecast results

## Future Enhancements

### Planned Features
- Real-time webhook processing for Shopify/WooCommerce
- Automated sync scheduling
- More AI-powered insights and predictions
- Advanced inventory optimization algorithms
- Multi-currency support for payments
- Additional export formats (Excel, PDF)
- Custom report builder

### Integration Roadmap
- QuickBooks integration
- Xero integration
- Facebook Shop integration
- Amazon Marketplace integration
- Zapier integration
- Custom webhook support

## Documentation

- **API Documentation**: Update Swagger/OpenAPI docs with new endpoints
- **Integration Guides**: Create step-by-step guides for each integration
- **Analytics Guide**: Document metrics and their business implications
- **AI Copilot Guide**: Examples of natural language queries

## Support

For issues or questions:
1. Check troubleshooting section above
2. Review audit logs for integration errors
3. Verify environment variables are set correctly
4. Check database migration was successful
5. Review logs for specific error messages
