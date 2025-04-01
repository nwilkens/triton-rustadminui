import axios from 'axios';

// Create a base API client
const apiClient = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to add auth token to all requests
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor to handle common responses like 401
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Redirect to login on auth error
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Authentication
export const login = async (username: string, password: string) => {
  const response = await apiClient.post('/auth', { username, password });
  localStorage.setItem('token', response.data.token);
  localStorage.setItem('user', JSON.stringify(response.data.user));
  return response.data;
};

export const logout = async () => {
  await apiClient.delete('/auth');
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

export const getCurrentUser = async () => {
  return apiClient.get('/auth');
};

// VMs
export const getVMs = async () => {
  return apiClient.get('/vms');
};

export const getVM = async (id: string) => {
  return apiClient.get(`/vms/${id}`);
};

export const getVMsByServer = async (serverUuid: string) => {
  return apiClient.get(`/vms?server_uuid=${serverUuid}`);
};

export const getVMSnapshots = async (id: string) => {
  // This will be implemented in the backend later
  return Promise.resolve({ data: [] }); 
};

export const getVMJobs = async (id: string) => {
  return apiClient.get(`/vms/${id}/jobs`);
};

export const getVMFirewallRules = async (id: string) => {
  // This will be implemented in the backend later
  return Promise.resolve({ data: [] });
};

export const createVM = async (vmData: any) => {
  return apiClient.post('/vms', vmData);
};

export const updateVM = async (id: string, vmData: any) => {
  return apiClient.put(`/vms/${id}`, vmData);
};

export const deleteVM = async (id: string) => {
  return apiClient.delete(`/vms/${id}`);
};

export const vmAction = async (id: string, action: string, params?: any) => {
  return apiClient.post(`/vms/${id}`, { action, params });
};

// Servers
export const getServers = async () => {
  return apiClient.get('/servers');
};

export const getServer = async (id: string) => {
  return apiClient.get(`/servers/${id}`);
};

// Users
export const getUsers = async () => {
  return apiClient.get('/users');
};

// Networks
export const getNetworks = async () => {
  return apiClient.get('/networks');
};

// Images
export const getImages = async () => {
  return apiClient.get('/images');
};

export const getImage = async (id: string) => {
  return apiClient.get(`/images/${id}`);
};

// Packages
export const getPackages = async () => {
  return apiClient.get('/packages');
};

// Dashboard
export const getDashboardStats = async () => {
  return apiClient.get('/dashboard');
};

// Jobs
export const getJobs = async (params?: any) => {
  return apiClient.get('/jobs', { params });
};

export const getJob = async (id: string) => {
  return apiClient.get(`/jobs/${id}`);
};

export const getJobOutput = async (id: string) => {
  return apiClient.get(`/jobs/${id}/output`);
};