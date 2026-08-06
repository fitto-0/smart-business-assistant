/**
 * INIT DATABASE - crée la base + schema + seed
 * Usage : node db/init.js   (ou  npm run init-db)
 *
 * AUTONOME : lit directement le .env (comme config/db.js).
 * Ne dépend PAS de l'objet Pool exporté par config/db.js.
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const DB_NAME = process.env.DB_NAME || 'smart_businessassistant';

// Configuration de connexion (identique aux valeurs de config/db.js)
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
};

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('  Smart Business Assistant - DB Init');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// 1) Créer la base si absente
async function createDatabase() {
  const admin = new Client({ ...dbConfig, database: 'postgres' });
  try {
    await admin.connect();
    const res = await admin.query('SELECT 1 FROM pg_database WHERE datname = $1', [DB_NAME]);
    if (res.rowCount === 0) {
      await admin.query(`CREATE DATABASE ${DB_NAME}`);
      console.log(`  Base "${DB_NAME}" creee`);
    } else {
      console.log(`  La base "${DB_NAME}" existe deja`);
    }
  } catch (err) {
    console.error('  Connexion PostgreSQL impossible :', err.message);
    console.error('  Verifiez DB_HOST / DB_PORT / DB_USER / DB_PASSWORD dans .env');
    throw err;
  } finally {
    await admin.end();
  }
}

// 2) Executer un fichier SQL
async function runSQL(file) {
  const client = new Client({ ...dbConfig, database: DB_NAME });
  try {
    await client.connect();
    const sql = fs.readFileSync(path.join(__dirname, file), 'utf-8');
    console.log(`  Execution de ${file}...`);
    await client.query(sql);
    console.log(`  ${file} OK`);
  } catch (err) {
    console.error(`  Erreur dans ${file} :`, err.message);
    throw err;
  } finally {
    await client.end();
  }
}

// 3) Verifier
async function verify() {
  const client = new Client({ ...dbConfig, database: DB_NAME });
  try {
    await client.connect();
    const tables = ['users', 'products', 'sales', 'monthly_targets', 'reviews', 'anomalies', 'recommendations'];
    console.log('\n  Contenu :');
    for (const t of tables) {
      const r = await client.query(`SELECT COUNT(*)::int AS c FROM ${t}`);
      console.log(`     ${t.padEnd(18)} : ${r.rows[0].c} ligne(s)`);
    }
  } finally {
    await client.end();
  }
}

(async () => {
  try {
    await createDatabase();
    await runSQL('schema.sql');
    await runSQL('seed.sql');
    await verify();
    console.log('\n  Base de donnees prete !');
    console.log('  Compte demo : demo@smartbusiness.com / demo123');
    process.exit(0);
  } catch (e) {
    console.error('\n  Echec de l initialisation');
    process.exit(1);
  }
})();