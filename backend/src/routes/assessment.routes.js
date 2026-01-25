const express = require('express');
const router = express.Router();
const { 
  submitPSS14, 
  getPSS14Questions, 
  getLatestPSS14 
} = require('../controllers/assessment.controller');
const { protect } = require('../middleware/authMiddleware');

// Ensure all assessment actions require a valid login
router.use(protect);

/**
 * @route   GET /api/v1/assessments/questions
 * @desc    Fetch the PSS-14 questions and scoring options for the frontend
 */
router.get('/questions', getPSS14Questions);

/**
 * @route   GET /api/v1/assessments/latest
 * @desc    Get the most recent stress assessment for the logged-in user
 */
router.get('/latest', getLatestPSS14);

/**
 * @route   POST /api/v1/assessments/submit
 * @desc    Submit 14 answers, calculate the PSS score, and save to DB
 */
router.post('/submit', submitPSS14);

module.exports = router;