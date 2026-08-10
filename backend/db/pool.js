/**
 * Centralized PostgreSQL connection pool
 */

require("dotenv").config();

const { Pool } = require("pg");

const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME || "smart_businessassistant",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD,

  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,

  ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
});

// New connection
pool.on("connect", () => {
  console.log("✅ PostgreSQL connection established");
});

// Unexpected pool error
pool.on("error", (err) => {
  console.error("❌ Unexpected PostgreSQL pool error:", err);
});

// Execute query
const query = async (text, params = []) => {
  const start = Date.now();

  try {
    const result = await pool.query(text, params);

    const duration = Date.now() - start;

    if (process.env.NODE_ENV !== "production") {
      console.log(
        `SQL [${duration}ms]: ${text.substring(0, 80)}${
          text.length > 80 ? "..." : ""
        }`,
      );
    }

    return result;
  } catch (error) {
    console.error("❌ Database query error:", error.message);
    throw error;
  }
};

// Test database connection
const testConnection = async () => {
  try {
    const result = await pool.query(`
      SELECT
        NOW() AS current_time,
        current_database() AS database,
        current_user AS user
    `);

    return {
      success: true,
      currentTime: result.rows[0].current_time,
      database: result.rows[0].database,
      user: result.rows[0].user,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
};

// Execute multiple queries inside a transaction
const transaction = async (callback) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const result = await callback(client);

    await client.query("COMMIT");

    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  pool,
  query,
  testConnection,
  transaction,
};
