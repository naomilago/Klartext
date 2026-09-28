const API_BASE = "http://127.0.0.1:8010";

async function request(path, options) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Erro na requisição: ${response.status}`);
  }
  return response.json();
}

export function listChats() {
  return request("/api/sessions/chats");
}

export function createChat() {
  return request("/api/chats", { method: "POST" });
}

export function getChat(id) {
  return request(`/api/chats/${id}`);
}

export function deleteChat(id) {
  return request(`/api/chats/${id}`, { method: "DELETE" });
}

export function deleteAllChats() {
  return request("/api/sessions/chats", { method: "DELETE" });
}

export async function sendMessage(id, content, onChunk) {
  const response = await fetch(`${API_BASE}/api/chats/${id}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  });
  if (!response.ok || !response.body) {
    const text = await response.text();
    throw new Error(text || "Falha ao enviar mensagem");
  }
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let full = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    full += chunk;
    onChunk(chunk);
  }
  return full;
}

export function listExercises() {
  return request("/api/sessions/exercises");
}

export function createExercise() {
  return request("/api/exercises", { method: "POST" });
}

export function getExercise(id) {
  return request(`/api/exercises/${id}`);
}

export function deleteExercise(id) {
  return request(`/api/exercises/${id}`, { method: "DELETE" });
}

export function deleteAllExercises() {
  return request("/api/sessions/exercises", { method: "DELETE" });
}

export function answerExercise(id, answer) {
  return request(`/api/exercises/${id}/answer`, {
    method: "POST",
    body: JSON.stringify({ answer }),
  });
}
