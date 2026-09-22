const express = require('express');
const {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
} = require('../controllers/project.controller');
const { validateProject } = require('../validations/project.validation');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Apply authentication middleware to all project routes
router.use(authMiddleware);

// Standard Project Routes
router.get('/', getProjects);
router.post('/', validateProject, createProject);
router.get('/:id', getProjectById);
router.put('/:id', validateProject, updateProject);
router.delete('/:id', deleteProject);

module.exports = router;
