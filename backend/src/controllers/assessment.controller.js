const Assessment = require('../models/Assessment.model');
const { sendSuccess, sendError } = require('../utils/responseHandler');
const pss14Questions = require('../config/pss14_data'); 

/**
 * @desc    Submit PSS-14 Assessment and calculate score
 * @route   POST /api/v1/assessments/submit
 */
const submitPSS14 = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { responses } = req.body; 

    if (!responses || responses.length !== 14) {
      return sendError(res, 'Assessment requires exactly 14 responses', 400);
    }

    // Positivity subscale items: 4, 5, 6, 7, 9, 10, 13
    const reverseIndices = [3, 4, 5, 6, 8, 9, 12]; 
    
    let totalScore = 0;
    responses.forEach((score, index) => {
      if (reverseIndices.includes(index)) {
        totalScore += (4 - score); // Reverse scoring: 0=4, 1=3, 2=2, 3=1, 4=0
      } else {
        totalScore += score; // Normal scoring: 0=0, 1=1, 2=2, 3=3, 4=4
      }
    });

    // Scoring Interpretation:
    // 0-19: Low, 20-37: Moderate, 38-56: High
    let severity = 'low';
    if (totalScore >= 20 && totalScore <= 37) severity = 'moderate';
    else if (totalScore >= 38) severity = 'high';

    const assessment = await Assessment.create({
      userId,
      type: 'PSS-14',
      responses,
      totalScore,
      severity
    });

    sendSuccess(res, assessment, 'PSS-14 Assessment completed successfully');
  } catch (error) {
    console.error('PSS-14 Error:', error);
    sendError(res, 'Failed to process assessment', 500);
  }
};

/**
 * @desc    Get the list of questions for the frontend
 * @route   GET /api/v1/assessments/questions
 */
const getPSS14Questions = async (req, res) => {
  try {
    const data = {
      title: "Perceived Stress Scale (PSS-14)",
      instructions: "The questions in this scale ask you about your feelings and thoughts during THE LAST MONTH.",
      options: [
        { label: "Never", value: 0 },
        { label: "Almost Never", value: 1 },
        { label: "Sometimes", value: 2 },
        { label: "Fairly Often", value: 3 },
        { label: "Very Often", value: 4 }
      ],
      questions: pss14Questions
    };
    sendSuccess(res, data, 'Questions retrieved successfully');
  } catch (error) {
    sendError(res, 'Failed to fetch questionnaire', 500);
  }
};

/**
 * @desc    Get the latest assessment for the current user
 * @route   GET /api/v1/assessments/latest
 */
const getLatestPSS14 = async (req, res) => {
  try {
    const assessment = await Assessment.findLatestByUserId(req.user.userId, 'PSS-14');
    sendSuccess(res, assessment || {}, 'Latest assessment retrieved');
  } catch (error) {
    sendError(res, 'Failed to fetch assessment', 500);
  }
};

module.exports = {
  submitPSS14,
  getPSS14Questions,
  getLatestPSS14
};