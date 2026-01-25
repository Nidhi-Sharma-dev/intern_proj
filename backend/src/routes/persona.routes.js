const express = require('express');
const router = express.Router();
const { setupPersona, getMyPersonas } = require('../controllers/persona.controller');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', getMyPersonas);
router.post('/setup', setupPersona);

module.exports = router;