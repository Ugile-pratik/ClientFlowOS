const projectService = require('../services/project.service');

const createProject = async (req, res) => {
  const userId = req.user.id;
  try {
    const project = await projectService.createProject(userId, req.body);
    res.status(201).json(project);
  } catch (error) {
    console.error('Create Project Error:', error);
    const status = error.status || 500;
    res.status(status).json({ error: error.message || 'Internal server error.' });
  }
};

const getProjects = async (req, res) => {
  const userId = req.user.id;
  const { status, clientId, q } = req.query;
  try {
    const projects = await projectService.getProjects(userId, { status, clientId, q });
    res.status(200).json(projects);
  } catch (error) {
    console.error('Get Projects Error:', error);
    const status = error.status || 500;
    res.status(status).json({ error: error.message || 'Internal server error.' });
  }
};

const getProjectById = async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  try {
    const project = await projectService.getProjectById(userId, id);
    res.status(200).json(project);
  } catch (error) {
    console.error('Get Project by ID Error:', error);
    const status = error.status || 500;
    res.status(status).json({ error: error.message || 'Internal server error.' });
  }
};

const updateProject = async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  try {
    const project = await projectService.updateProject(userId, id, req.body);
    res.status(200).json(project);
  } catch (error) {
    console.error('Update Project Error:', error);
    const status = error.status || 500;
    res.status(status).json({ error: error.message || 'Internal server error.' });
  }
};

const deleteProject = async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  try {
    const result = await projectService.deleteProject(userId, id);
    res.status(200).json(result);
  } catch (error) {
    console.error('Delete Project Error:', error);
    const status = error.status || 500;
    res.status(status).json({ error: error.message || 'Internal server error.' });
  }
};

module.exports = {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
};
