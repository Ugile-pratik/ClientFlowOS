const clientService = require('../services/client.service');

const createClient = async (req, res) => {
  const userId = req.user.id;
  try {
    const client = await clientService.createClient(userId, req.body);
    res.status(201).json(client);
  } catch (error) {
    console.error('Create Client Error:', error);
    const status = error.status || 500;
    res.status(status).json({ error: error.message || 'Internal server error.' });
  }
};

const getClients = async (req, res) => {
  const userId = req.user.id;
  const { status, q } = req.query;
  try {
    const clients = await clientService.getClients(userId, { status, q });
    res.status(200).json(clients);
  } catch (error) {
    console.error('Get Clients Error:', error);
    const status = error.status || 500;
    res.status(status).json({ error: error.message || 'Internal server error.' });
  }
};

const getClientById = async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  try {
    const client = await clientService.getClientById(userId, id);
    res.status(200).json(client);
  } catch (error) {
    console.error('Get Client by ID Error:', error);
    const status = error.status || 500;
    res.status(status).json({ error: error.message || 'Internal server error.' });
  }
};

const updateClient = async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  try {
    const client = await clientService.updateClient(userId, id, req.body);
    res.status(200).json(client);
  } catch (error) {
    console.error('Update Client Error:', error);
    const status = error.status || 500;
    res.status(status).json({ error: error.message || 'Internal server error.' });
  }
};

const deleteClient = async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  try {
    const result = await clientService.deleteClient(userId, id);
    res.status(200).json(result);
  } catch (error) {
    console.error('Delete Client Error:', error);
    const status = error.status || 500;
    res.status(status).json({ error: error.message || 'Internal server error.' });
  }
};

const searchClients = async (req, res) => {
  const userId = req.user.id;
  const { q } = req.query;
  try {
    const clients = await clientService.searchClients(userId, q);
    res.status(200).json(clients);
  } catch (error) {
    console.error('Search Clients Error:', error);
    const status = error.status || 500;
    res.status(status).json({ error: error.message || 'Internal server error.' });
  }
};

module.exports = {
  createClient,
  getClients,
  getClientById,
  updateClient,
  deleteClient,
  searchClients,
};
