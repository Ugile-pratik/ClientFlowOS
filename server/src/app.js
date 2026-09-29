const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./routes/authRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const clientRoutes = require('./routes/client.routes');
const projectRoutes = require('./routes/project.routes');
const path = require('path');
const invoiceRoutes = require('./routes/invoice.routes');
const profileRoutes = require('./routes/profile.routes');

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Serve static uploaded files (QR images)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API healthcheck endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'ClientFlow API is running.' });
});

// Auth Routes
app.use('/api/auth', authRoutes);

// Dashboard Routes
app.use('/api/dashboard', dashboardRoutes);

// Client Routes
app.use('/api/clients', clientRoutes);

// Project Routes
app.use('/api/projects', projectRoutes);

// Invoice Routes
app.use('/api/invoices', invoiceRoutes);

// Profile Routes
app.use('/api/profile', profileRoutes);

module.exports = app;
