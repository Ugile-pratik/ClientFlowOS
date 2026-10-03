const aiInsightService = require('../services/aiInsight.service');

const getAiInsights = async (req, res) => {
  const userId = req.user.id;
  try {
    const data = await aiInsightService.getAiInsights(userId);
    res.status(200).json(data);
  } catch (error) {
    console.error('Get AI Insights Error:', error);
    const status = error.status || 500;
    res.status(status).json({ error: error.message || 'Failed to generate AI insights.' });
  }
};

module.exports = {
  getAiInsights,
};
