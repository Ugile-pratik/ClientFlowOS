const prisma = require('../config/db');

/**
 * Create a new project for a client owned by the logged-in user
 */
const createProject = async (userId, projectData) => {
  const clientId = parseInt(projectData.clientId, 10);
  if (isNaN(clientId)) {
    const error = new Error('Invalid client ID.');
    error.status = 400;
    throw error;
  }

  // Verify client belongs to logged-in user
  const client = await prisma.client.findFirst({
    where: {
      id: clientId,
      userId,
    },
  });

  if (!client) {
    const error = new Error('Client not found or access denied.');
    error.status = 404;
    throw error;
  }

  return await prisma.project.create({
    data: {
      clientId,
      title: projectData.title.trim(),
      budget: parseFloat(projectData.budget),
      dueDate: new Date(projectData.dueDate),
      status: projectData.status || 'Planning',
    },
    include: {
      client: {
        select: {
          id: true,
          name: true,
          company: true,
          email: true,
        },
      },
    },
  });
};

/**
 * Fetch projects for the logged-in user with filters and search query
 */
const getProjects = async (userId, filters = {}) => {
  const where = {
    client: {
      userId,
    },
  };

  if (filters.status && filters.status !== 'All') {
    where.status = filters.status;
  }

  if (filters.clientId) {
    const parsedClientId = parseInt(filters.clientId, 10);
    if (!isNaN(parsedClientId)) {
      where.clientId = parsedClientId;
    }
  }

  if (filters.q) {
    const query = filters.q.trim();
    where.OR = [
      { title: { contains: query } },
      { client: { name: { contains: query } } },
      { client: { company: { contains: query } } },
    ];
  }

  return await prisma.project.findMany({
    where,
    include: {
      client: {
        select: {
          id: true,
          name: true,
          company: true,
          email: true,
        },
      },
      invoices: {
        select: {
          id: true,
          amount: true,
          status: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
};

/**
 * Fetch single project by ID for logged-in user
 */
const getProjectById = async (userId, projectId) => {
  const id = parseInt(projectId, 10);
  if (isNaN(id)) {
    const error = new Error('Invalid project ID.');
    error.status = 400;
    throw error;
  }

  const project = await prisma.project.findFirst({
    where: {
      id,
      client: {
        userId,
      },
    },
    include: {
      client: true,
      invoices: true,
    },
  });

  if (!project) {
    const error = new Error('Project not found or access denied.');
    error.status = 404;
    throw error;
  }

  return project;
};

/**
 * Update project details
 */
const updateProject = async (userId, projectId, projectData) => {
  const id = parseInt(projectId, 10);
  if (isNaN(id)) {
    const error = new Error('Invalid project ID.');
    error.status = 400;
    throw error;
  }

  // Check ownership
  const existingProject = await prisma.project.findFirst({
    where: {
      id,
      client: {
        userId,
      },
    },
  });

  if (!existingProject) {
    const error = new Error('Project not found or access denied.');
    error.status = 404;
    throw error;
  }

  const clientId = parseInt(projectData.clientId, 10);
  if (clientId !== existingProject.clientId) {
    const client = await prisma.client.findFirst({
      where: { id: clientId, userId },
    });
    if (!client) {
      const error = new Error('Client not found or access denied.');
      error.status = 404;
      throw error;
    }
  }

  return await prisma.project.update({
    where: { id },
    data: {
      clientId,
      title: projectData.title.trim(),
      budget: parseFloat(projectData.budget),
      dueDate: new Date(projectData.dueDate),
      status: projectData.status,
    },
    include: {
      client: {
        select: {
          id: true,
          name: true,
          company: true,
          email: true,
        },
      },
      invoices: true,
    },
  });
};

/**
 * Delete project by ID
 */
const deleteProject = async (userId, projectId) => {
  const id = parseInt(projectId, 10);
  if (isNaN(id)) {
    const error = new Error('Invalid project ID.');
    error.status = 400;
    throw error;
  }

  const project = await prisma.project.findFirst({
    where: {
      id,
      client: {
        userId,
      },
    },
  });

  if (!project) {
    const error = new Error('Project not found or access denied.');
    error.status = 404;
    throw error;
  }

  await prisma.project.delete({
    where: { id },
  });

  return { message: 'Project deleted successfully.' };
};

module.exports = {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
};
