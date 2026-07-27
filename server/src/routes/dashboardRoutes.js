const express = require('express');
const { getDashboardData, seedDashboardData } = require('../controllers/dashboardController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Get dashboard statistics and charts
router.get('/', authMiddleware, getDashboardData);

// Seed dashboard test data
router.post('/seed', authMiddleware, seedDashboardData);

module.exports = router;
