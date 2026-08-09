import axios from "axios";

const api = axios.create({
  baseURL: "/api/v1",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("aiops_access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("aiops_access_token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: (email, password) => api.post("/auth/login", { email, password }),
};

export const dashboardApi = {
  overview: () => api.get("/dashboard/overview"),
};

export const serverApi = {
  list: (params) => api.get("/servers", { params }),
  get: (id) => api.get(`/servers/${id}`),
  register: (payload) => api.post("/servers", payload),
};

export const metricApi = {
  getForServer: (serverId, hours = 24) =>
    api.get(`/metrics/servers/${serverId}`, { params: { hours } }),
  getSummary: (serverId, hours = 24) =>
    api.get(`/metrics/servers/${serverId}/summary`, { params: { hours } }),
};

export const logApi = {
  search: (params) => api.get("/logs", { params }),
  levelDistribution: (hours = 24) =>
    api.get("/logs/analytics/level-distribution", { params: { hours } }),
  topErrors: (hours = 24) => api.get("/logs/analytics/top-errors", { params: { hours } }),
};

export const incidentApi = {
  list: (params) => api.get("/incidents", { params }),
  stats: () => api.get("/incidents/stats"),
  monthlyTrends: (months = 6) => api.get("/incidents/trends/monthly", { params: { months } }),
  update: (id, payload) => api.patch(`/incidents/${id}`, payload),
  create: (payload) => api.post("/incidents", payload),
};

export const alertApi = {
  list: (params) => api.get("/alerts", { params }),
};

export default api;
