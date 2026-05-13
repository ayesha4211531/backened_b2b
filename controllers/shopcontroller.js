// controllers/shopcontroller.js
const db = require("../utils/db");

const query = (sql, values) =>
  new Promise((resolve, reject) => {
    db.query(sql, values, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });

// ─────────────────────────────────────────────
// POST /api/shop/create
// CreateShopScreen ke liye
// ─────────────────────────────────────────────
const createShop = async (req, res) => {
  const { cnic, shopName, ownerName, phone, address, description, categories } = req.body;
  const userId = req.user.id;

  if (!shopName || !ownerName || !cnic) {
    return res.status(400).json({ success: false, message: "shopName, ownerName, cnic required" });
  }
  if (!categories || !Array.isArray(categories) || categories.length === 0) {
    return res.status(400).json({ success: false, message: "At least one product required" });
  }

  try {
    // Shop insert
    const shopResult = await query(
      `INSERT INTO shops (user_id, shop_name, owner_name, phone, address, description, cnic, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [userId, shopName, ownerName, phone || "", address || "", description || "", cnic]
    );

    const shopId = shopResult.insertId;

    // Products insert
    const insertedProducts = [];
    for (const item of categories) {
      const pResult = await query(
        "INSERT INTO products (shop_id, name, category, price, stock) VALUES (?, ?, ?, ?, ?)",
        [shopId, item.name || "", item.category || "Clothes", item.price || 0, item.stock || 0]
      );
      insertedProducts.push({
        id: pResult.insertId,
        name: item.name,
        category: item.category,
        price: item.price || 0,
        stock: item.stock || 0,
      });
    }

    return res.status(201).json({
      success: true,
      message: "Shop sent for approval",
      shop: { id: shopId, shopName, ownerName, cnic, status: "pending" },
      products: insertedProducts,
    });
  } catch (err) {
    console.error("createShop error:", err);
    return res.status(500).json({ success: false, message: err.sqlMessage || "Server error" });
  }
};

// ─────────────────────────────────────────────
// POST /api/shop/add-service
// ShopServiceScreen ke liye
// User ki apni shop mein services add hogi
// ─────────────────────────────────────────────
const addService = async (req, res) => {
  const { services } = req.body;
  const userId = req.user.id;

  if (!services || !Array.isArray(services) || services.length === 0) {
    return res.status(400).json({ success: false, message: "At least one service required" });
  }

  try {
    // Pehle user ki shop dhundo
    const shops = await query("SELECT * FROM shops WHERE user_id = ?", [userId]);

    if (shops.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Pehle shop create karein",
      });
    }

    const shopId = shops[0].id;

    // Services insert karo
    const insertedServices = [];
    for (const service of services) {
      if (!service.name) continue;
      const sResult = await query(
        "INSERT INTO products (shop_id, name, category, price, stock) VALUES (?, ?, ?, ?, ?)",
        [shopId, service.name, service.category || "Clothes", service.price || 0, service.stock || 0]
      );
      insertedServices.push({
        id: sResult.insertId,
        shop_id: shopId,
        name: service.name,
        category: service.category,
        price: service.price || 0,
        stock: service.stock || 0,
      });
    }

    return res.status(201).json({
      success: true,
      message: "Services added successfully",
      products: insertedServices,
    });
  } catch (err) {
    console.error("addService error:", err);
    return res.status(500).json({ success: false, message: err.sqlMessage || "Server error" });
  }
};

// ─────────────────────────────────────────────
// GET /api/shop/my-shop
// ─────────────────────────────────────────────
const getMyShop = async (req, res) => {
  const userId = req.user.id;

  try {
    const shops = await query("SELECT * FROM shops WHERE user_id = ?", [userId]);

    if (shops.length === 0) {
      return res.status(404).json({ success: false, message: "No shop found" });
    }

    const shop = shops[0];
    const products = await query("SELECT * FROM products WHERE shop_id = ?", [shop.id]);

    return res.status(200).json({ success: true, shop, products });
  } catch (err) {
    console.error("getMyShop error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { createShop, addService, getMyShop };