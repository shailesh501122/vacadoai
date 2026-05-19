import { api } from './client';

export const authApi = {
  register: (d: { email: string; password: string; name: string }) =>
    api.post('/auth/register', d).then((r) => r.data),
  login: (d: { email: string; password: string }) =>
    api.post('/auth/login', d).then((r) => r.data),
  google: (credential: string) =>
    api.post('/auth/google/callback', { credential }).then((r) => r.data),
  me: () => api.get('/auth/me').then((r) => r.data),
  logout: () => api.post('/auth/logout').then((r) => r.data),
};

export const shortsApi = {
  list: (params?: Record<string, unknown>) =>
    api.get('/shorts', { params }).then((r) => r.data),
  get: (id: string) => api.get(`/shorts/${id}`).then((r) => r.data),
  generate: (d: Record<string, unknown>) =>
    api.post('/shorts/generate', d).then((r) => r.data),
  remove: (id: string) => api.delete(`/shorts/${id}`).then((r) => r.data),
  publish: (id: string) => api.post(`/shorts/${id}/publish`).then((r) => r.data),
  schedule: (id: string, scheduledAt: string) =>
    api.post(`/shorts/${id}/schedule`, { scheduledAt }).then((r) => r.data),
};



export const subsApi = {
  me: () => api.get('/subscriptions/me').then((r) => r.data),
  checkout: (plan: string) =>
    api.post('/subscriptions/checkout', { plan }).then((r) => r.data),
  portal: () => api.post('/subscriptions/portal').then((r) => r.data),
};

export const analyticsApi = {
  overview: () => api.get('/analytics/overview').then((r) => r.data),
  performance: () => api.get('/analytics/performance').then((r) => r.data),
  languages: () => api.get('/analytics/languages').then((r) => r.data),
};

export const apiKeysApi = {
  list: () => api.get('/api-keys').then((r) => r.data),
  create: (name: string) =>
    api.post('/api-keys', { name }).then((r) => r.data),
  revoke: (id: string) => api.delete(`/api-keys/${id}`).then((r) => r.data),
};
