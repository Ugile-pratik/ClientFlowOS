import axios from 'axios';

// Helper to determine if we are in local frontend mock testing mode
const isMockMode = () => {
  return localStorage.getItem('clientflow-token') === 'mock-jwt-token-for-local-testing';
};

// Seed initial mock data if not present
const getMockClients = () => {
  const stored = localStorage.getItem('clientflow-mock-clients');
  if (stored) return JSON.parse(stored);
  
  const initial = [
    {
      id: 101,
      company: 'Acme Corporation',
      name: 'John Doe',
      email: 'billing@acme.com',
      phone: '+91 98765 43210',
      address: '123 Tech Park, Sector 4',
      city: 'Mumbai',
      state: 'Maharashtra',
      country: 'India',
      postalCode: '400001',
      gstNumber: '27AAAAA1111A1Z1',
      notes: 'Prefers communications via email. Payment schedule is net-30.',
      status: 'Active',
      tags: ['Corporate', 'High Value'],
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 102,
      company: 'Wayne Enterprises',
      name: 'Bruce Wayne',
      email: 'finance@waynecorp.com',
      phone: '+1 555-0199',
      address: '1007 Mountain Drive',
      city: 'Gotham',
      state: 'New Jersey',
      country: 'USA',
      postalCode: '07001',
      gstNumber: '',
      notes: 'Requires advance invoicing for any work.',
      status: 'Active',
      tags: ['Corporate', 'International', 'Priority'],
      createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 103,
      company: 'Stark Industries',
      name: 'Pepper Potts',
      email: 'pepper@stark.com',
      phone: '+1 555-0100',
      address: '10880 Wilshire Blvd',
      city: 'Los Angeles',
      state: 'California',
      country: 'USA',
      postalCode: '90024',
      gstNumber: '',
      notes: 'Quick approvals. High priority projects.',
      status: 'Lead',
      tags: ['Startup', 'Priority'],
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];
  localStorage.setItem('clientflow-mock-clients', JSON.stringify(initial));
  return initial;
};

const saveMockClients = (clients) => {
  localStorage.setItem('clientflow-mock-clients', JSON.stringify(clients));
};

// API Services
export const getClients = async (params = {}) => {
  if (isMockMode()) {
    let list = getMockClients();
    
    // Filter status
    if (params.status) {
      list = list.filter(c => c.status.toLowerCase() === params.status.toLowerCase());
    }
    
    // Filter keyword search
    if (params.q) {
      const q = params.q.toLowerCase().trim();
      list = list.filter(c => 
        c.name.toLowerCase().includes(q) || 
        c.company.toLowerCase().includes(q) || 
        c.email.toLowerCase().includes(q)
      );
    }
    
    return list;
  }
  
  const response = await axios.get('/api/clients', { params });
  return response.data;
};

export const getClientById = async (id) => {
  if (isMockMode()) {
    const list = getMockClients();
    const client = list.find(c => c.id === parseInt(id, 10));
    if (!client) throw new Error('Client not found.');
    return client;
  }
  
  const response = await axios.get(`/api/clients/${id}`);
  return response.data;
};

export const createClient = async (clientData) => {
  if (isMockMode()) {
    const list = getMockClients();
    
    // Check email uniqueness
    const emailExists = list.some(c => c.email.toLowerCase() === clientData.email.trim().toLowerCase());
    if (emailExists) {
      throw new Error('A client with this email address already exists.');
    }
    
    const newClient = {
      id: Date.now(),
      ...clientData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    list.unshift(newClient);
    saveMockClients(list);
    return newClient;
  }
  
  const response = await axios.post('/api/clients', clientData);
  return response.data;
};

export const updateClient = async (id, clientData) => {
  if (isMockMode()) {
    const list = getMockClients();
    const index = list.findIndex(c => c.id === parseInt(id, 10));
    if (index === -1) throw new Error('Client not found.');
    
    // Check email uniqueness if email changed
    const emailChanged = list[index].email.toLowerCase() !== clientData.email.trim().toLowerCase();
    if (emailChanged) {
      const emailExists = list.some(c => c.email.toLowerCase() === clientData.email.trim().toLowerCase() && c.id !== parseInt(id, 10));
      if (emailExists) {
        throw new Error('A client with this email address already exists.');
      }
    }
    
    const updatedClient = {
      ...list[index],
      ...clientData,
      updatedAt: new Date().toISOString()
    };
    list[index] = updatedClient;
    saveMockClients(list);
    return updatedClient;
  }
  
  const response = await axios.put(`/api/clients/${id}`, clientData);
  return response.data;
};

export const deleteClient = async (id) => {
  if (isMockMode()) {
    let list = getMockClients();
    const exists = list.some(c => c.id === parseInt(id, 10));
    if (!exists) throw new Error('Client not found.');
    
    list = list.filter(c => c.id !== parseInt(id, 10));
    saveMockClients(list);
    return { message: 'Client deleted successfully.' };
  }
  
  const response = await axios.delete(`/api/clients/${id}`);
  return response.data;
};

export const searchClients = async (q) => {
  if (isMockMode()) {
    return await getClients({ q });
  }
  
  const response = await axios.get('/api/clients/search', { params: { q } });
  return response.data;
};
