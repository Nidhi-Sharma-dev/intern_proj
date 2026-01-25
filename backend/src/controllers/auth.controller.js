const User = require('../models/User.model');
const { hashPassword, comparePassword } = require('../utils/passwordManager');
const { generateToken } = require('../utils/tokenManager');
const { sendSuccess, sendError } = require('../utils/responseHandler');

/**
 * @route   POST /api/v1/auth/register
 * @desc    Register a new user
 * @access  Public
 */
const register = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return sendError(res, 'Email already registered', 409);
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const newUser = await User.create({
      email,
      passwordHash
    });

    // Generate JWT token
    const token = generateToken(newUser.id, newUser.email);

    // Return user data (excluding password)
    sendSuccess(
      res,
      {
        user: {
          id: newUser.id,
          uuid: newUser.uuid,
          email: newUser.email,
          isVerified: newUser.is_verified,
          createdAt: newUser.created_at
        },
        token
      },
      'User registered successfully',
      201
    );
  } catch (error) {
    console.error('Register error:', error);
    sendError(res, 'Registration failed. Please try again.', 500);
  }
};

/**
 * @route   POST /api/v1/auth/login
 * @desc    Login user
 * @access  Public
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findByEmail(email);
    if (!user) {
      return sendError(res, 'Invalid email or password', 401);
    }

    // Check if account is active
    if (!user.is_active) {
      return sendError(res, 'Account has been deactivated. Please contact support.', 403);
    }

    // Compare password
    const isPasswordValid = await comparePassword(password, user.password_hash);
    if (!isPasswordValid) {
      return sendError(res, 'Invalid email or password', 401);
    }

    // Update last login
    await User.updateLastLogin(user.id);

    // Generate JWT token
    const token = generateToken(user.id, user.email);

    // Get user stats
    const stats = await User.getStats(user.id);

    // Return user data
    sendSuccess(
      res,
      {
        user: {
          id: user.id,
          uuid: user.uuid,
          email: user.email,
          isVerified: user.is_verified,
          lastLogin: user.last_login,
          stats
        },
        token
      },
      'Login successful',
      200
    );
  } catch (error) {
    console.error('Login error:', error);
    sendError(res, 'Login failed. Please try again.', 500);
  }
};

/**
 * @route   GET /api/v1/auth/me
 * @desc    Get current logged-in user
 * @access  Private (requires token)
 */
const getCurrentUser = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get user details
    const user = await User.findById(userId);
    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    // Get user stats
    const stats = await User.getStats(userId);

    sendSuccess(
      res,
      {
        user: {
          id: user.id,
          uuid: user.uuid,
          email: user.email,
          isVerified: user.is_verified,
          isActive: user.is_active,
          createdAt: user.created_at,
          lastLogin: user.last_login,
          stats
        }
      },
      'User retrieved successfully'
    );
  } catch (error) {
    console.error('Get current user error:', error);
    sendError(res, 'Failed to retrieve user information', 500);
  }
};

/**
 * @route   POST /api/v1/auth/change-password
 * @desc    Change user password
 * @access  Private
 */
const changePassword = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { currentPassword, newPassword } = req.body;

    // Get user with password
    const user = await User.findById(userId);
    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    // Get full user data including password hash
    const userWithPassword = await User.findByEmail(user.email);

    // Verify current password
    const isPasswordValid = await comparePassword(currentPassword, userWithPassword.password_hash);
    if (!isPasswordValid) {
      return sendError(res, 'Current password is incorrect', 401);
    }

    // Hash new password
    const newPasswordHash = await hashPassword(newPassword);

    // Update password
    await User.updatePassword(userId, newPasswordHash);

    sendSuccess(res, {}, 'Password changed successfully');
  } catch (error) {
    console.error('Change password error:', error);
    sendError(res, 'Failed to change password', 500);
  }
};

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Logout user (client-side token removal)
 * @access  Private
 */
const logout = async (req, res) => {
  // In JWT authentication, logout is primarily handled client-side by removing the token
  // This endpoint is here for consistency and can be used for logging or cleanup
  
  sendSuccess(res, {}, 'Logout successful');
};

module.exports = {
  register,
  login,
  getCurrentUser,
  changePassword,
  logout
};