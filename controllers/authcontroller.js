const db = require("../utils/db.js");
const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");

// helper to convert db.query into promise
const query = (sql, values) =>
  new Promise((resolve, reject) => {
    db.query(sql, values, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });


// ─────────────────────────────
// REGISTER
// ─────────────────────────────
const register = async (req, res) => {
  const { fullName, businessName, businessType, email, password } = req.body;

  if (!fullName || !businessName || !businessType || !email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters" });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: "Invalid email format" });
  }

  try {
    const existing = await query(
      "SELECT id FROM user WHERE email = ?",
      [email]
    );

    if (existing.length > 0) {
      return res.status(409).json({ message: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const token = uuidv4();

    const result = await query(
      `INSERT INTO user 
      (full_name, business_name, business_type, email, password, token)
      VALUES (?, ?, ?, ?, ?, ?)`,
      [fullName, businessName, businessType, email, hashedPassword, token]
    );

    return res.status(201).json({
      message: "Account created successfully",
      user: {
        id: result.insertId,
        fullName,
        businessName,
        businessType,
        email,
        token,
      },
    });

  } catch (err) {
    console.error("REGISTER ERROR:", err);
    return res.status(500).json({
      message: err.sqlMessage || "Server error",
    });
  }
};


// ─────────────────────────────
// LOGIN (FIX FOR YOUR ERROR)
// ─────────────────────────────
const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password required" });
  }

  try {
    const users = await query(
      "SELECT * FROM user WHERE email = ?",
      [email]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = users[0];

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid password" });
    }

    return res.status(200).json({
  success: true,
  data: {
    token: user.token,
    user: {
      id: user.id,
      fullName: user.full_name,
      email: user.email,
      businessName: user.business_name,
      businessType: user.business_type,
    }
  }
});

  } catch (err) {
    console.error("LOGIN ERROR:", err);
    return res.status(500).json({
      message: err.sqlMessage || "Server error",
    });
  }
};


// ─────────────────────────────
// EXPORTS
// ─────────────────────────────
module.exports = {
  register,
  login
};