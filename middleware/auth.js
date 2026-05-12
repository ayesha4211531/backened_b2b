const db = require("../utils/db");

const authMiddleware = (req, res, next) => {
  const token = req.headers["authorization"];

  if (!token) {
    return res.status(401).json({ message: "Token missing" });
  }

  const query = "SELECT * FROM users WHERE token = ?";
  db.query(query, [token], (err, results) => {
    if (err) return res.status(500).json({ message: "Server error" });
    if (results.length === 0) {
      return res.status(401).json({ message: "Invalid token" });
    }

    req.user = results[0]; // user info attach
    next();
  });
};

module.exports = authMiddleware;