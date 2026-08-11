const express = require('express');
const {
  createClient,
  getClients,
  getClientById,
  updateClient,
  deleteClient,
  searchClients,
} = require('../controllers/client.controller');
const { validateClient } = require('../validations/client.validation');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Apply authentication middleware to all client routes
router.use(authMiddleware);

// Standard Client Routes
router.get('/', getClients);
router.post('/', validateClient, createClient);

// Search Clients Route (MUST be defined before /:id)
router.get('/search', searchClients);

// Single Client Routes
router.get('/:id', getClientById);
router.put('/:id', validateClient, updateClient);
router.delete('/:id', deleteClient);

module.exports = router;
