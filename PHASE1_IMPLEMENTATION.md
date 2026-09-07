# Phase 1: Production Foundation - Implementation Guide

This document describes the production-grade foundation implemented for the Smart Business Assistant platform.

## Overview

Phase 1 transforms the prototype into a production-ready SaaS platform with multi-organization support, enhanced security, and scalable architecture.

## Completed Features

### 1. Organizations and Multi-Tenancy

**Database Schema Changes:**
- `organizations` table - Stores organization details, subscription info, settings
- `organization_members` table - Manages user memberships with roles
- `branches` table - Supports multiple locations per organization
- `invitations` table - Team invitation system with tokens

**Key Features:**
- Users can belong to multiple organizations
- Role-based access control per organization
- Organization-scoped data isolation
- Branch/location management
- Team invitation workflow

**API Endpoints:**
- `GET /api/organizations` - List user's organizations
- `POST /api/organizations` - Create new organization
- `GET /api/organizations/:id` - Get organization details
- `PUT /api/organizations/:id` - Update organization
- `DELETE /api/organizations/:id` - Delete organization (owner only)
- `GET /api/organizations/:id/members` - List members
- `PUT /api/organizations/:id/members/:memberId` - Update member role
- `DELETE /api/organizations/:id/members/:memberId` - Remove member
- `POST /api/organizations/:id/leave` - Leave organization
- `GET /api/organizations/:id/branches` - List branches
- `POST /api/organizations/:id/branches` - Create branch
- `PUT /api/organizations/:id/branches/:branchId` - Update branch
- `DELETE /api/organizations/:id/branches/:branchId` - Delete branch

### 2. Role-Based Permissions

**Roles:**
- `owner` - Full access, can delete organization
- `admin` - Full access except deletion
- `manager` - Manage products, sales, team
- `employee` - View and create sales/products
- `accountant` - View financial data, export reports
- `viewer` - Read-only access

**Permission Matrix:**
```javascript
{
  products: { view: [...], create: ['owner','admin','manager'], ... },
  sales: { view: [...], create: ['owner','admin','manager','employee'], ... },
  analytics: { view: [...], export: [...], advanced: ['owner','admin','manager'] },
  team: { view: ['owner','admin','manager'], invite: ['owner','admin'], ... },
  settings: { view: ['owner','admin'], update: ['owner','admin'], billing: ['owner'] },
  branches: { view: [...], create: ['owner','admin'], ... },
  integrations: { view: ['owner','admin'], connect: ['owner','admin'], ... }
}
```

**Middleware:**
- `requirePermission(resource, action)` - Check specific permission
- `requireOwnerOrAdmin` - Require owner or admin role
- `requireOwner` - Require owner role only

### 3. Enhanced Authentication

**JWT Improvements:**
- Organization context in JWT tokens
- Refresh token mechanism with rotation
- Token revocation support
- Logout from all devices

**New Auth Endpoints:**
- `POST /api/auth/switch-organization` - Switch active organization
- `POST /api/auth/refresh-token` - Refresh access token
- `POST /api/auth/revoke-token` - Revoke specific refresh token
- `POST /api/auth/revoke-all-tokens` - Logout from all devices
- `POST /api/auth/request-password-reset` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token
- `POST /api/auth/request-email-verification` - Request email verification
- `POST /api/auth/verify-email` - Verify email with token

**Security Enhancements:**
- JWT_SECRET required in production (no fallback)
- Token expiration: 24 hours (access), 30 days (refresh)
- Automatic token rotation on refresh
- Password reset tokens: 1 hour expiration
- Email verification tokens: 24 hour expiration

### 4. Audit Logging

**Features:**
- Automatic logging of all CRUD operations
- Tracks user, organization, action, entity
- Stores old/new values for updates
- IP address and user agent tracking
- Queryable audit log API

**Audit Log Fields:**
- `organization_id` - Organization context
- `user_id` - User who performed action
- `action` - create, update, delete, etc.
- `entity_type` - product, sale, organization, etc.
- `entity_id` - ID of affected entity
- `old_values` - JSON of previous state
- `new_values` - JSON of new state
- `ip_address` - Request IP
- `user_agent` - Browser/client info
- `metadata` - Additional context

**Middleware:**
- `auditLog(entityType)` - Auto-log CRUD operations
- `logAction(action, entityType, options)` - Manual logging
- `getAuditLogs(organizationId, filters)` - Query logs

### 5. Team Invitations

**Features:**
- Email-based team invitations
- Secure token-based acceptance
- Role assignment on invitation
- Expiration (7 days)
- Invitation status tracking
- Cancel pending invitations

**Invitation Endpoints:**
- `POST /api/invitations` - Send invitation
- `GET /api/invitations/:token` - Get invitation details (public)
- `POST /api/invitations/:token/accept` - Accept invitation
- `POST /api/invitations/:token/decline` - Decline invitation
- `GET /api/organizations/:id/invitations` - List pending invitations
- `DELETE /api/invitations/:id` - Cancel invitation

**Workflow:**
1. Owner/admin sends invitation with email and role
2. Secure token generated and stored
3. Email sent with acceptance link (TODO: integrate email service)
4. User clicks link, views invitation details
5. User accepts/declines invitation
6. On accept: user added to organization with specified role

### 6. Rate Limiting

**Implementation:**
- Express-rate-limit middleware
- Multiple limiters for different endpoint types
- Redis-backed (optional, falls back gracefully)

**Limiters:**
- `defaultLimiter` - 100 requests per 15 minutes
- `authLimiter` - 5 requests per 15 minutes (auth endpoints)
- `strictLimiter` - 3 requests per hour (sensitive operations)
- `apiLimiter` - 30 requests per minute (public API)

**Configuration:**
```env
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 7. Redis Integration

**Features:**
- Caching layer for performance
- Session management
- Rate limiting backend
- Background job queue

**Cache Functions:**
- `cache.get(key)` - Get cached value
- `cache.set(key, value, ttl)` - Set with expiration
- `cache.delete(key)` - Delete specific key
- `cache.deletePattern(pattern)` - Delete matching keys
- `cache.flush()` - Clear all cache

**Session Functions:**
- `session.set(sessionId, data, ttl)` - Store session
- `session.get(sessionId)` - Retrieve session
- `session.delete(sessionId)` - Delete session
- `session.deleteAllUserSessions(userId)` - Delete all user sessions

**Configuration:**
```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
```

### 8. Background Job Queue

**Implementation:**
- BullMQ for job queue management
- Redis-backed job storage
- Multiple worker types
- Job retry with exponential backoff

**Queue Types:**
- `email` - Email sending jobs
- `reports` - Report generation jobs
- `imports` - Data import jobs
- `ai-analysis` - AI analysis jobs
- `notifications` - Notification jobs

**Job Functions:**
- `jobs.sendEmail(data)` - Queue email
- `jobs.generateReport(data)` - Queue report generation
- `jobs.importData(data)` - Queue data import
- `jobs.runAIAnalysis(data)` - Queue AI analysis
- `jobs.sendNotification(data)` - Queue notification
- `jobs.scheduleJob(queue, job, data, options)` - Schedule delayed job

**Worker Configuration:**
- Email: 5 concurrent jobs
- Reports: 2 concurrent jobs
- Imports: 3 concurrent jobs
- AI Analysis: 2 concurrent jobs
- Notifications: 10 concurrent jobs

### 9. Secure Secret Management

**Changes:**
- JWT_SECRET required in production
- Clear warning if not set in development
- No fallback secrets in production
- Environment variable validation

**Validation:**
```javascript
if (!JWT_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('JWT_SECRET environment variable is required in production');
}
```

### 10. Database Migration System

**New Structure:**
- `backend/db/migrations/` - Migration files
- `001_organizations.sql` - Organizations schema
- Migration runner in `migrate.js`
- Automatic execution on server start

**Migration Features:**
- Incremental migration files
- Backward compatibility with existing data
- Automatic organization creation for existing users
- Data backfill for organization_id columns

## Database Schema Changes

### New Tables

**organizations:**
```sql
- id, name, slug, industry, size
- logo_url, settings (JSONB)
- subscription_plan, subscription_status
- trial_ends_at, created_at, updated_at
```

**organization_members:**
```sql
- id, organization_id, user_id
- role (owner, admin, manager, employee, accountant, viewer)
- status (pending, active, inactive, removed)
- invited_by, invited_at, joined_at
- permissions (JSONB), created_at, updated_at
```

**branches:**
```sql
- id, organization_id, name, code
- address, city, country, phone, email
- is_main, is_active, settings (JSONB)
- created_at, updated_at
```

**invitations:**
```sql
- id, organization_id, email, role
- invited_by, token, expires_at
- accepted_at, declined_at, status
- created_at
```

**audit_logs:**
```sql
- id, organization_id, user_id
- action, entity_type, entity_id
- old_values (JSONB), new_values (JSONB)
- ip_address, user_agent, metadata (JSONB)
- created_at
```

**refresh_tokens:**
```sql
- id, user_id, organization_id
- token, expires_at, created_at
- revoked_at, is_revoked
```

**password_reset_tokens:**
```sql
- id, user_id, token, expires_at
- used_at, created_at
```

**email_verification_tokens:**
```sql
- id, user_id, email, token
- expires_at, verified_at, created_at
```

### Modified Tables

All business tables now include:
- `organization_id` - Links to organization
- `branch_id` - Links to branch (products, sales)

Affected tables:
- products
- sales
- reviews
- anomalies
- recommendations
- predictions_cache
- monthly_targets
- notifications

## Environment Variables

### Required for Production
```env
JWT_SECRET=your_secure_random_string_min_32_chars
DB_HOST=your_db_host
DB_PORT=5432
DB_NAME=smart_business_assistant
DB_USER=your_db_user
DB_PASSWORD=your_secure_password
```

### Optional for Development
```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
```

### Email Configuration (Future)
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
EMAIL_FROM=noreply@smartbusiness.com
```

### Rate Limiting
```env
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## Docker Compose Updates

**New Services:**
- `redis` - Redis for caching and job queue

**Updated Dependencies:**
- Backend now depends on Redis health check
- Redis volume for persistence

**Volumes:**
- `redis_data` - Redis persistence

## Installation & Setup

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env with your configuration
```

### 3. Start Services
```bash
docker-compose up -d
```

### 4. Run Migrations
```bash
cd backend
npm run init-db
```

### 5. Start Backend
```bash
npm run dev
```

## Migration Guide for Existing Data

The migration system automatically:
1. Creates organizations for existing users
2. Adds users as owners of their organizations
3. Backfills organization_id for existing data
4. Preserves all existing data

No manual data migration required.

## API Usage Examples

### Create Organization
```bash
POST /api/organizations
{
  "name": "My Business",
  "industry": "Retail",
  "size": "11-50"
}
```

### Switch Organization
```bash
POST /api/auth/switch-organization
{
  "organizationId": 1
}
```

### Invite Team Member
```bash
POST /api/invitations
{
  "email": "team@example.com",
  "role": "manager",
  "organizationId": 1
}
```

### Accept Invitation
```bash
POST /api/invitations/:token/accept
```

### Refresh Token
```bash
POST /api/auth/refresh-token
{
  "refreshToken": "your_refresh_token"
}
```

## Security Best Practices

1. **Always set JWT_SECRET in production**
2. **Use strong, random secrets (min 32 characters)**
3. **Enable rate limiting in production**
4. **Use Redis for production deployments**
5. **Regularly rotate refresh tokens**
6. **Monitor audit logs for suspicious activity**
7. **Implement email service for invitations**
8. **Use HTTPS in production**
9. **Set appropriate CORS origins**
10. **Regular security audits**

## Next Steps (Phase 2)

1. **Email Integration**
   - Integrate SendGrid/Mailgun for emails
   - Email templates for invitations
   - Email notifications for alerts

2. **Business Integrations**
   - Shopify integration
   - WooCommerce integration
   - Stripe integration
   - Google Sheets integration

3. **AI Copilot**
   - Natural language query interface
   - SQL generation from natural language
   - Tool/function calling for AI
   - Report generation

4. **Advanced Analytics**
   - Profit and margin analysis
   - Customer lifetime value
   - Cohort analysis
   - Inventory forecasting

5. **Testing**
   - Backend unit tests (Jest)
   - Frontend tests (React Testing Library)
   - Integration tests
   - E2E tests (Playwright)

## Troubleshooting

### Migration Issues
If migration fails:
1. Check PostgreSQL connection
2. Verify database exists
3. Check migration file syntax
4. Review logs in `backend/db/migrate.js`

### Redis Connection Issues
Redis is optional for development:
- System will work without Redis
- Caching will be disabled
- Rate limiting falls back to in-memory
- Background jobs won't process

### JWT Secret Issues
If you see JWT_SECRET error:
1. Set `JWT_SECRET` in `.env`
2. Generate secure random string: `openssl rand -base64 32`
3. Restart server

## Performance Considerations

1. **Indexing**: All foreign keys and frequently queried fields are indexed
2. **Caching**: Use Redis cache for frequently accessed data
3. **Rate Limiting**: Prevents abuse and protects resources
4. **Background Jobs**: Long-running tasks don't block HTTP requests
5. **Connection Pooling**: PostgreSQL connection pooling configured

## Monitoring Recommendations

1. **Monitor audit logs** for security events
2. **Track job queue** health and backlog
3. **Monitor Redis** memory usage
4. **Track rate limit** violations
5. **Monitor database** query performance
6. **Set up alerts** for failed jobs
7. **Track organization** growth metrics

## Support & Documentation

For questions or issues:
1. Review this documentation
2. Check API endpoint responses
3. Review database schema in `backend/db/migrations/`
4. Check middleware implementations in `backend/middleware/`
5. Review queue implementation in `backend/lib/queue.js`

---

**Phase 1 Status: ✅ Complete**

The platform now has a production-grade foundation with multi-tenancy, enhanced security, and scalable architecture ready for business integrations and AI features.
