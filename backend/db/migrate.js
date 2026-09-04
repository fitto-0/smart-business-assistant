require("dotenv").config();

const { query } = require("./pool");

const migrate = async () => {
  await query(`
    DO $$
    DECLARE
      demo_id INTEGER;
      dedicated_admin_id INTEGER;
    BEGIN
      SELECT id INTO demo_id FROM users WHERE email = 'demo@smartbusiness.com';
      SELECT id INTO dedicated_admin_id FROM users WHERE email = 'admin@smartbusiness.com';

      IF demo_id IS NOT NULL AND demo_id <> 1 AND dedicated_admin_id = 1 THEN
        UPDATE products SET user_id = demo_id WHERE user_id = 1;
        UPDATE sales SET user_id = demo_id WHERE user_id = 1;
        UPDATE monthly_targets SET user_id = demo_id WHERE user_id = 1;
        UPDATE reviews SET user_id = demo_id WHERE user_id = 1;
        UPDATE anomalies SET user_id = demo_id WHERE user_id = 1;
        UPDATE recommendations SET user_id = demo_id WHERE user_id = 1;
        IF to_regclass('predictions_cache') IS NOT NULL THEN
          UPDATE predictions_cache SET user_id = demo_id WHERE user_id = 1;
        END IF;
        IF to_regclass('notifications') IS NOT NULL THEN
          UPDATE notifications SET user_id = demo_id WHERE user_id = 1;
        END IF;
        IF to_regclass('login_log') IS NOT NULL THEN
          UPDATE login_log SET user_id = demo_id WHERE user_id = 1;
        END IF;
        IF to_regclass('categories') IS NOT NULL THEN
          UPDATE categories SET user_id = demo_id WHERE user_id = 1;
        END IF;
      END IF;
    END $$
  `);

  await query(`
    ALTER TABLE users
      ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS two_factor_secret VARCHAR(255)
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS system_settings (
      id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
      platform_name VARCHAR(150) NOT NULL DEFAULT 'Smart Business Assistant',
      support_email VARCHAR(150) NOT NULL DEFAULT 'support@smartbusiness.com',
      default_language VARCHAR(5) NOT NULL DEFAULT 'en' CHECK (default_language IN ('en', 'fr', 'ar')),
      maintenance_mode BOOLEAN NOT NULL DEFAULT false,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await query(`INSERT INTO system_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING`);

  await query(`
    UPDATE users SET role = 'user', updated_at = NOW()
    WHERE email = 'demo@smartbusiness.com'
  `);

  await query(`
    UPDATE users SET role = 'user', updated_at = NOW()
    WHERE role = 'admin' AND email <> 'admin@smartbusiness.com'
  `);

  await query(`
    INSERT INTO users (name, email, password_hash, company, role)
    VALUES ('Platform Admin', 'admin@smartbusiness.com',
      '$2a$10$pkdmXPXhmR3uhhR4NFBF1ez1/TuWxQIo/IAdDGbN1gVkToyvJoAli',
      'Smart Business Assistant', 'admin')
    ON CONFLICT (email) DO UPDATE SET role = 'admin', updated_at = NOW()
  `);

  await query(`
    ALTER TABLE products
      DROP CONSTRAINT IF EXISTS products_category_check
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS categories (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name VARCHAR(80) NOT NULL,
      color VARCHAR(7) NOT NULL DEFAULT '#2E6B72',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(user_id, name)
    )
  `);

  await query(`
    INSERT INTO categories (user_id, name)
    SELECT DISTINCT user_id, category
    FROM products
    WHERE category IS NOT NULL
    ON CONFLICT (user_id, name) DO NOTHING
  `);

  await query(`
    WITH ranked AS (
      SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY name) AS position
      FROM categories
    )
    UPDATE categories c
    SET color = (ARRAY[
      '#E8913C', '#2E6B72', '#6366F1', '#EF4444',
      '#10B981', '#D946EF', '#F59E0B', '#06B6D4'
    ])[((ranked.position - 1) % 8) + 1]
    FROM ranked
    WHERE c.id = ranked.id
  `);

  console.log("Database migrations applied");
};

migrate().catch((error) => {
  console.error("Database migration failed:", error.message);
  process.exitCode = 1;
});
