import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

export const authAPI = {
  getGoogleAuthUrl: () => api.get('/auth/google'),
  getZoomAuthUrl: () => api.get('/auth/zoom'),
  getMe: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
};

export const meetingsAPI = {
  getAll: () => api.get('/meetings'),
  getUpcoming: () => api.get('/meetings/upcoming'),
  getById: (id) => api.get(`/meetings/${id}`),
  create: (data) => api.post('/meetings', data),
  delete: (id) => api.delete(`/meetings/${id}`),
};

export const uploadAPI = {
  uploadRecording: (formData) =>
    api.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 300000,
    }),
};

export const momAPI = {
  getAll: () => api.get('/mom'),
  getByMeeting: (meetingId) => api.get(`/mom/${meetingId}`),
  generate: (meetingId) => api.post(`/mom/generate/${meetingId}`),
  update: (momId, data) => api.put(`/mom/${momId}`, data),
  updateActionItem: (momId, itemId, data) =>
    api.patch(`/mom/action-item/${momId}/${itemId}`, data),
  updateSpeakers: (meetingId, speakerMap) =>
    api.put(`/mom/speakers/${meetingId}`, { speakerMap }),
  emailMOM: (meetingId, recipients) =>
    api.post(`/mom/email/${meetingId}`, { recipients }),
};

export default api;
