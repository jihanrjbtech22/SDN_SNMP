import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const apiService = {
  // Device Management
  getDevices: () => api.get('/devices').then(res => res.data),
  getDevice: (id) => api.get(`/devices/${id}`).then(res => res.data),
  addDevice: (deviceData) => api.post('/devices', deviceData).then(res => res.data),
  updateDevice: (id, deviceData) => api.put(`/devices/${id}`, deviceData).then(res => res.data),
  removeDevice: (id) => api.delete(`/devices/${id}`).then(res => res.data),

  // SNMP Operations
  snmpGet: (deviceId, oid) => api.post('/snmp/get', { deviceId, oid }).then(res => res.data),
  snmpSet: (deviceId, oid, value, type) => api.post('/snmp/set', { deviceId, oid, value, type }).then(res => res.data),
  snmpGetNext: (deviceId, oid) => api.post('/snmp/getnext', { deviceId, oid }).then(res => res.data),
  snmpWalk: (deviceId, oid) => api.post('/snmp/walk', { deviceId, oid }).then(res => res.data),

  // Trap Management
  getTraps: () => api.get('/traps').then(res => res.data),
  clearTraps: () => api.delete('/traps').then(res => res.data),

  // MIB Operations
  getMibTree: () => api.get('/mib/tree').then(res => res.data),
  searchOid: (query) => api.get(`/mib/search?q=${encodeURIComponent(query)}`).then(res => res.data),

  // System Status
  getSystemStatus: () => api.get('/status').then(res => res.data),
  getAgentStatus: (deviceId) => api.get(`/agents/${deviceId}/status`).then(res => res.data),
};
