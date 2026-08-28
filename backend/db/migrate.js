require("dotenv").config();

const { query } = require("./pool");

const migrate = async () => {
  await query(`
    ALTER TABLE users
      ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS two_factor_secret VARCHAR(255)
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
