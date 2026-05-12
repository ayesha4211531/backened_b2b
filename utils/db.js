const mysql = require("mysql2");

const db = mysql.createConnection({
  host: "localhost",
  user: "root",       // XAMPP default
  password: "",       // XAMPP mein password empty hota hai
  database: "b2b", // apna database naam
});

db.connect((err) => {
  if (err) {
    console.error("Database connection failed:", err.message);
    process.exit(1);
  }
  console.log("Connected to MySQL (XAMPP)");
});

module.exports = db;