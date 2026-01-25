const Persona = require('../models/Persona.model');
const { sendSuccess, sendError } = require('../utils/responseHandler');

const setupPersona = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { category, agents } = req.body;

    if (!category || !Array.isArray(agents)) {
      return sendError(res, 'Category and an array of agents are required', 400);
    }

    const persona = await Persona.upsert(userId, category, agents);
    sendSuccess(res, persona, `${category} pillar updated successfully`);
  } catch (error) {
    console.error('Setup persona error:', error);
    sendError(res, 'Failed to save pillar configuration', 500);
  }
};

const getMyPersonas = async (req, res) => {
  try {
    const userId = req.user.userId;
    const personas = await Persona.findByUserId(userId);
    sendSuccess(res, personas, 'User personas retrieved successfully');
  } catch (error) {
    console.error('Get personas error:', error);
    sendError(res, 'Failed to retrieve personas', 500);
  }
};

module.exports = {
  setupPersona,
  getMyPersonas
};