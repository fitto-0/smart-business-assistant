require("dotenv").config();

const { query } = require("./pool");

const migrate = async () => {
  await query(`
    ALTER TABLE users
      ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS two_factor_secret VARCHAR(255)
  `);

  console.log("Database migrations applied");
};

migrate().catch((error) => {
  console.error("Database migration failed:", error.message);
  process.exitCode = 1;
});