export function clearChatSession() {
  sessionKeys.forEach(k => localStorage.removeItem(k));
}
export const sessionKeys = [
  'chat.username',
  'chat.model_id',
  'chat.role_id',
  'chat.apiKey',
  'chat.started', // ← entscheidend für die Gates
];
