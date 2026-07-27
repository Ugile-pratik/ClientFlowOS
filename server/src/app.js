const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./routes/authRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// API healthcheck endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'ClientFlow API is running.' });
});

// Auth Routes
app.use('/api/auth', authRoutes);

// Dashboard Routes
app.use('/api/dashboard', dashboardRoutes);

module.exports = app;
