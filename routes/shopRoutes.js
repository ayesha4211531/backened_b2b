const express = require("express");
const router = express.Router();
const { createShop, addService, getMyShop } = require("../controllers/shopcontroller");
const authMiddleware = require("../middleware/auth");

router.post("/create", authMiddleware, createShop);
router.post("/add-service", authMiddleware, addService);
router.get("/my-shop", authMiddleware, getMyShop);

module.exports = router;