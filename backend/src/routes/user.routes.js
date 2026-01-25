const express = require('express');
const router = express.Router();
const { updateProfile, getMyProfile } = require('../controllers/profile.controller');
const { protect } = require('../middleware/authMiddleware');

// All profile routes are private
router.use(protect);

router.get('/me', getMyProfile);
router.post('/update', updateProfile);

module.exports = router;