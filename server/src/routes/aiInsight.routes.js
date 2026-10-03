const express = require('express');
const router = express.Router();
const aiInsightController = require('../controllers/aiInsight.controller');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/', aiInsightController.getAiInsights);

module.exports = router;
