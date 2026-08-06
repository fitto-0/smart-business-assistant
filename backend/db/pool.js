/**
 * Pool de connexion PostgreSQL
 * Gestion centralisée de la connexion à la base de données
 */
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'smart_businessassistant',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  max: 20,                    // Nombre max de connexions
  idleTimeoutMillis: 30000,   // Timeout inactif
  connectionTimeoutMillis: 5000,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

// Event handlers
pool.on('connect', () => console.log('✅ Nouvelle connexion PostgreSQL établie'));
pool.on('error', (err) => console.error('❌ Erreur inattendue PostgreSQL:', err));

/**
 * Exécute une requête SQL avec paramètres
 */
const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    if (process.env.NODE_ENV !== 'production') {
      console.log(`🔍 SQL [${duration}ms] : ${text.substring(0, 80)}${text.length > 80 ? '...' : ''}`);
    }
    return res;
  } catch (err) {
    console.error('❌ Erreur SQL:', err.message);
    throw err;
  }
};

/**
 * Test de connexion à la base de données
 */
const testConnection = async () => {
  try {
    const result = await pool.query('SELECT NOW() as current_time, version() as pg_version');
    return {
      success: true,
      currentTime: result.rows[0].current_time,
      version: result.rows[0].pg_version.split(' ').slice(0, 2).join(' '),
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

/**
 * Transaction avec gestion automatique du rollback
 */
const transaction = async (callback) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
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