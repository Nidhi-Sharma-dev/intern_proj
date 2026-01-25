const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getCurrentUser,
  changePassword,
  logout
} = require('../controllers/auth.controller');
const {
  registerValidation,
  loginValidation,
  validate
} = require('../middleware/validationMiddleware');
const { protect } = require('../middleware/authMiddleware');
const { body } = require('express-validator');

/**
 * @route   POST /api/v1/auth/register
 * @desc    Register new user
 * @access  Public
 */
router.post('/register', registerValidation, validate, register);

/**
 * @route   POST /api/v1/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', loginValidation, validate, login);

/**
 * @route   GET /api/v1/auth/me
 * @desc    Get current user
 * @access  Private
 */
router.get('/me', protect, getCurrentUser);

/**
 * @route   POST /api/v1/auth/change-password
 * @desc    Change password
 * @access  Private
 */
router.post(
  '/change-password',
  protect,
  [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword')
      .isLength({ min: 8 })
      .withMessage('New password must be at least 8 characters long')
      .matches(/[A-Z]/)
      .withMessage('New password must contain at least one uppercase letter')
      .matches(/[a-z]/)
      .withMessage('New password must contain at least one lowercase letter')
      .matches(/[0-9]/)
      .withMessage('New password must contain at least one number'),
    body('confirmNewPassword')
      .custom((value, { req }) => value === req.body.newPassword)
      .withMessage('Passwords do not match'),
    validate
  ],
  changePassword
);

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post('/logout', protect, logout);

module.exports = router;