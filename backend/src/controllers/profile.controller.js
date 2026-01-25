const Profile = require('../models/Profile.model');
const { sendSuccess, sendError } = require('../utils/responseHandler');

const updateProfile = async (req, res) => {
  try {
    const userId = req.user.userId; // Provided by protect middleware
    const profile = await Profile.upsert(userId, req.body);

    sendSuccess(res, profile, 'Profile updated successfully');
  } catch (error) {
    console.error('Update profile error:', error);
    sendError(res, 'Failed to update profile information', 500);
  }
};

const getMyProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const profile = await Profile.findByUserId(userId);
    
    if (!profile) {
      return sendSuccess(res, {}, 'No profile found, please create one', 200);
    }

    sendSuccess(res, profile, 'Profile retrieved successfully');
  } catch (error) {
    console.error('Get profile error:', error);
    sendError(res, 'Failed to retrieve profile', 500);
  }
};

module.exports = {
  updateProfile,
  getMyProfile
};