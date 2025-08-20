// src/lib/api.ts
import axios from 'axios';

// Read at build-time (Vite)
const API_BASE = import.meta.env.VITE_API_BASE ?? '/api';

//  centralize axios config
export const api = axios.create({
  baseURL: API_BASE,
});

export function postAudio(formData: FormData) {
  return api.post('/post-audio', formData, {
    responseType: 'arraybuffer',
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 30000,
  });
}
