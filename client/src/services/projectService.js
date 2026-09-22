import axios from 'axios';

// Helper to determine if we are in local frontend mock testing mode
const isMockMode = () => {
  return localStorage.getItem('clientflow-token') === 'mock-jwt-token-for-local-testing';
};

// Seed initial mock projects if not present
const getMockProjects = () => {
  const stored = localStorage.getItem('clientflow-mock-projects');
  if (stored) return JSON.parse(stored);

  const initial = [
    {
      id: 201,
      clientId: 101,
      client: {
        id: 101,
        name: 'John Doe',
        company: 'Acme Corporation',
        email: 'billing@acme.com',
      },
      title: 'E-Commerce Website Redesign',
      budget: 120000,
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'In Progress',
      createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      invoices: [{ id: 1, amount: 60000, status: 'Paid' }]
    },
    {
      id: 202,
      clientId: 102,
      client: {
        id: 102,
        name: 'Bruce Wayne',
        company: 'Wayne Enterprises',
        email: 'finance@waynecorp.com',
      },
      title: 'Mobile App Security Audit',
      budget: 250000,
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'Planning',
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      invoices: []
    },
    {
      id: 203,
      clientId: 103,
      client: {
        id: 103,
        name: 'Pepper Potts',
        company: 'Stark Industries',
        email: 'pepper@stark.com',
      },
      title: 'Brand Identity & Guidelines',
      budget: 85000,
      dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'Completed',
      createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      invoices: [{ id: 2, amount: 85000, status: 'Paid' }]
    }
  ];

  localStorage.setItem('clientflow-mock-projects', JSON.stringify(initial));
  return initial;
};

const saveMockProjects = (projects) => {
  localStorage.setItem('clientflow-mock-projects', JSON.stringify(projects));
};

export const getProjects = async (params = {}) => {
  if (isMockMode()) {
    let list = getMockProjects();

    // Filter by status
    if (params.status && params.status !== 'All') {
      list = list.filter(p => p.status.toLowerCase() === params.status.toLowerCase());
    }

    // Filter by clientId
    if (params.clientId) {
      list = list.filter(p => p.clientId === parseInt(params.clientId, 10));
    }

    // Filter search query
    if (params.q) {
      const q = params.q.toLowerCase().trim();
      list = list.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.client?.name?.toLowerCase().includes(q) ||
        p.client?.company?.toLowerCase().includes(q)
      );
    }

    return list;
  }

  const response = await axios.get('/api/projects', { params });
  return response.data;
};

export const getProjectById = async (id) => {
  if (isMockMode()) {
    const list = getMockProjects();
    const project = list.find(p => p.id === parseInt(id, 10));
    if (!project) throw new Error('Project not found.');
    return project;
  }

  const response = await axios.get(`/api/projects/${id}`);
  return response.data;
};

export const createProject = async (projectData) => {
  if (isMockMode()) {
    const list = getMockProjects();

    const newProject = {
      id: Date.now(),
      clientId: parseInt(projectData.clientId, 10),
      client: projectData.client || { name: 'Assigned Client', company: 'Client Corp' },
      title: projectData.title.trim(),
      budget: parseFloat(projectData.budget),
      dueDate: new Date(projectData.dueDate).toISOString(),
      status: projectData.status || 'Planning',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      invoices: []
    };

    list.unshift(newProject);
    saveMockProjects(list);
    return newProject;
  }

  const response = await axios.post('/api/projects', projectData);
  return response.data;
};

export const updateProject = async (id, projectData) => {
  if (isMockMode()) {
    const list = getMockProjects();
    const index = list.findIndex(p => p.id === parseInt(id, 10));
    if (index === -1) throw new Error('Project not found.');

    const updatedProject = {
      ...list[index],
      ...projectData,
      clientId: parseInt(projectData.clientId, 10),
      budget: parseFloat(projectData.budget),
      dueDate: new Date(projectData.dueDate).toISOString(),
      updatedAt: new Date().toISOString()
    };

    list[index] = updatedProject;
    saveMockProjects(list);
    return updatedProject;
  }

  const response = await axios.put(`/api/projects/${id}`, projectData);
  return response.data;
};

export const deleteProject = async (id) => {
  if (isMockMode()) {
    let list = getMockProjects();
    const exists = list.some(p => p.id === parseInt(id, 10));
    if (!exists) throw new Error('Project not found.');

    list = list.filter(p => p.id !== parseInt(id, 10));
    saveMockProjects(list);
    return { message: 'Project deleted successfully.' };
  }

  const response = await axios.delete(`/api/projects/${id}`);
  return response.data;
};
