const Assessment = require("../models/Assessment.model");
const { sendSuccess, sendError } = require("../utils/responseHandler");
const pss14Questions = require("../config/pss14_data");

/**
 * @desc    Submit PSS-14 Assessment and calculate score
 * @route   POST /api/v1/assessments/submit
 */
const submitPSS14 = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { responses } = req.body;

    if (!responses || responses.length !== 14) {
      return sendError(res, "Assessment requires exactly 14 responses", 400);
    }

    // Reverse scoring indices
    const reverseIndices = [3, 4, 5, 6, 8, 9, 12];

    let totalScore = 0;

    responses.forEach((score, index) => {
      if (reverseIndices.includes(index)) {
        totalScore += 4 - score;
      } else {
        totalScore += score;
      }
    });

    // Severity classification
    let severity = "low";
    if (totalScore >= 20 && totalScore <= 37) severity = "moderate";
    else if (totalScore >= 38) severity = "high";

    const assessment = await Assessment.create({
      userId,
      type: "PSS-14",
      responses,
      totalScore,
      severity,
    });

    sendSuccess(res, assessment, "PSS-14 Assessment completed successfully");
  } catch (error) {
    console.error("PSS-14 Error:", error);
    sendError(res, "Failed to process assessment", 500);
  }
};

/**
 * @desc    Get PSS-14 Questions
 * @route   GET /api/v1/assessments/questions
 */
const getPSS14Questions = async (req, res) => {
  try {
    const data = {
      title: "Perceived Stress Scale (PSS-14)",
      instructions:
        "The questions ask about your feelings during THE LAST MONTH.",
      options: [
        { label: "Never", value: 0 },
        { label: "Almost Never", value: 1 },
        { label: "Sometimes", value: 2 },
        { label: "Fairly Often", value: 3 },
        { label: "Very Often", value: 4 },
      ],
      questions: pss14Questions,
    };

    sendSuccess(res, data, "Questions retrieved successfully");
  } catch (error) {
    sendError(res, "Failed to fetch questionnaire", 500);
  }
};

/**
 * @desc    Get latest assessment
 * @route   GET /api/v1/assessments/latest
 */
const getLatestPSS14 = async (req, res) => {
  try {
    const assessment = await Assessment.findLatestByUserId(
      req.user.userId,
      "PSS-14",
    );

    sendSuccess(res, assessment || {}, "Latest assessment retrieved");
  } catch (error) {
    sendError(res, "Failed to fetch assessment", 500);
  }
};

/**
 * 🔥 NEW FEATURE
 * @desc    Get stress analytics and trend
 * @route   GET /api/v1/assessments/analytics
 */
/**
 * @desc    Get stress analytics, trend, improvement %, and graph data
 * @route   GET /api/v1/assessments/analytics
 */
const getStressAnalytics = async (req, res) => {
  try {
    const userId = req.user.userId;

    const assessments = await Assessment.findAllByUserId(userId, "PSS-14");

    if (!assessments.length) {
      return sendSuccess(res, {}, "No assessment history found");
    }

    const scores = assessments.map((a) => a.total_score);
    const timestamps = assessments.map((a) => a.assessed_at);

    const average = scores.reduce((a, b) => a + b, 0) / scores.length;

    const max = Math.max(...scores);
    const min = Math.min(...scores);

    const latestScore = scores[scores.length - 1];
    const previousScore = scores.length >= 2 ? scores[scores.length - 2] : null;

    let trend = "stable";
    let improvementPercentage = 0;

    if (previousScore !== null) {
      if (latestScore > previousScore) trend = "increasing stress";
      else if (latestScore < previousScore) trend = "improving";

      improvementPercentage = (
        ((previousScore - latestScore) / previousScore) *
        100
      ).toFixed(2);
    }

    // Risk escalation detection (3 consecutive high scores)
    const lastThree = scores.slice(-3);
    const highCount = lastThree.filter((score) => score >= 38).length;

    const riskFlag =
      highCount === 3
        ? "High Risk: Consecutive elevated stress levels detected"
        : "Normal Monitoring";

    // Clinical recommendation mapping
    let recommendation = "Maintain regular tracking.";
    if (latestScore >= 38) {
      recommendation =
        "Strongly consider consulting a mental health professional.";
    } else if (latestScore >= 20) {
      recommendation =
        "Incorporate stress-reducing practices like mindfulness and exercise.";
    }

    sendSuccess(
      res,
      {
        summary: {
          totalAssessments: scores.length,
          currentScore: latestScore,
          averageScore: average.toFixed(2),
          highestScore: max,
          lowestScore: min,
          trend,
          improvementPercentage,
          riskFlag,
        },
        graphData: {
          labels: timestamps,
          values: scores,
        },
        recommendation,
      },
      "Advanced stress analytics generated successfully",
    );
  } catch (error) {
    console.error("Analytics error:", error);
    sendError(res, "Failed to generate stress analytics", 500);
  }
};
