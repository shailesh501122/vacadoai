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
  uploadClip: (file: File, onProgress?: (pct: number) => void) => {
    const fd = new FormData();
    fd.append('clip', file);
    return api
      .post('/shorts/upload-clip', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => {
          if (onProgress && e.total) onProgress(Math.round((e.loaded * 100) / e.total));
        },
      })
      .then((r) => r.data as { url: string; sizeBytes: number; originalName: string });
  },
  remove: (id: string) => api.delete(`/shorts/${id}`).then((r) => r.data),
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

export const adminApi = {
  getSettings: () => api.get('/admin/settings').then((r) => r.data),
  updateSettings: (patch: Record<string, string>) =>
    api.put('/admin/settings', patch).then((r) => r.data),
};
