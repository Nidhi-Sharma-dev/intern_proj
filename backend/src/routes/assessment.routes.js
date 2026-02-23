const express = require("express");
const router = express.Router();

const {
  submitPSS14,
  getPSS14Questions,
  getLatestPSS14,
  getStressAnalytics,
} = require("../controllers/assessment.controller");

const { protect } = require("../middleware/authMiddleware");

// All routes require authentication
router.use(protect);

router.get("/questions", getPSS14Questions);
router.get("/latest", getLatestPSS14);
router.post("/submit", submitPSS14);

// 🔥 NEW ROUTE
router.get("/analytics", getStressAnalytics);

module.exports = router;
