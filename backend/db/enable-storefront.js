require("dotenv").config();
const { query } = require("./pool");

async function enableStorefront() {
  try {
    console.log("Enabling storefront for all existing products...");
    
    // Enable storefront for all existing products
    await query(`
      UPDATE products 
      SET 
        storefront_enabled = true,
        storefront_order = id,
        featured = false
      WHERE storefront_enabled IS NULL OR storefront_enabled = false
    `);
    
    console.log("✓ Storefront enabled for all products");
    
    // Verify the update
    const result = await query(`
      SELECT 
        user_id,
        COUNT(*) as total_products,
        COUNT(*) FILTER (WHERE storefront_enabled = true) as enabled_products
      FROM products
      GROUP BY user_id
      ORDER BY user_id
    `);
    
    console.log("\nStorefront status by user:");
    console.table(result.rows);
    
    console.log("\n✓ Storefront is now enabled for all users with their actual data!");
    console.log("Each user can access their storefront at: /storefront/{userId}");
    
  } catch (error) {
    console.error("Error enabling storefront:", error);
    process.exit(1);
  }
}

enableStorefront();
