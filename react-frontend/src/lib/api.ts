// src/lib/api.ts
import axios from 'axios';
import type { PresetsResponse, SelectionRequest, SelectionResponse } from '../types/Presets';

// Rule:
// - DEV:   hit FastAPI directly (localhost:8080)
// - PROD:  go through nginx proxy (/api)
const API_BASE = import.meta.env.DEV ? 'http://localhost:8000' : '/api';

export const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
});

// --- Calls ---
export function postAudio(formData: FormData) {
  return api.post<ArrayBuffer>('/post-audio', formData, {
    responseType: 'arraybuffer',
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 30000,
  });
}

export function resetDialog() {
  return api.get('/reset-conversation');
}

export function getPresets() {
  return api.get<PresetsResponse>('/presets');
}

export function setPreset(selection: SelectionRequest) {
  return api.post<SelectionResponse>('/presets', selection, {});
}
