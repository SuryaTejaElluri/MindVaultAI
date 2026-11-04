import { ChatResponse, ChatSession, DocumentItem } from './types';

export const getApiBaseUrl = (): string => {
  return localStorage.getItem('rag_api_url') || import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
};

export const setApiBaseUrl = (url: string): void => {
  localStorage.setItem('rag_api_url', url.trim().replace(/\/+$/, ''));
};

const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem('rag_token');
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

export async function checkHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/health`);
    return res.ok;
  } catch {
    return false;
  }
}

// --- Documents API ---

export async function fetchDocuments(): Promise<DocumentItem[]> {
  const res = await fetch(`${getApiBaseUrl()}/documents`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'Failed to fetch documents');
  }
  return res.json();
}

export async function fetchDocument(documentId: string): Promise<DocumentItem> {
  const res = await fetch(`${getApiBaseUrl()}/documents/${documentId}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'Failed to fetch document status');
  }
  return res.json();
}

export async function uploadDocument(file: File, background?: boolean): Promise<any> {
  const formData = new FormData();
  formData.append('file', file);

  const url = new URL(`${getApiBaseUrl()}/documents`);
  if (background !== undefined) {
    url.searchParams.set('background', String(background));
  }

  const res = await fetch(url.toString(), {
    method: 'POST',
    headers: getAuthHeaders(),
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'Upload failed');
  }
  return res.json();
}

export async function renameDocument(documentId: string, newFilename: string): Promise<any> {
  const res = await fetch(`${getApiBaseUrl()}/documents/${documentId}`, {
    method: 'PATCH',
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ filename: newFilename }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'Rename failed');
  }
  return res.json();
}

export async function deleteDocument(documentId: string): Promise<any> {
  const res = await fetch(`${getApiBaseUrl()}/documents/${documentId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'Delete failed');
  }
  return res.json();
}

// --- Chat & History API ---

export async function sendChatMessage(
  question: string,
  topK: number = 5,
  sessionId?: string,
): Promise<ChatResponse> {
  const res = await fetch(`${getApiBaseUrl()}/chat`, {
    method: 'POST',
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      question,
      top_k: topK,
      session_id: sessionId || null,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'Chat request failed');
  }
  return res.json();
}

export async function fetchChatSessions(): Promise<ChatSession[]> {
  const res = await fetch(`${getApiBaseUrl()}/chat/sessions`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'Failed to fetch sessions');
  }
  return res.json();
}

export async function createChatSession(title: string = 'New Chat'): Promise<ChatSession> {
  const res = await fetch(`${getApiBaseUrl()}/chat/sessions`, {
    method: 'POST',
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ title }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'Failed to create chat session');
  }
  return res.json();
}

export async function fetchChatSession(sessionId: string): Promise<ChatSession> {
  const res = await fetch(`${getApiBaseUrl()}/chat/sessions/${sessionId}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'Failed to fetch session details');
  }
  return res.json();
}

export async function deleteChatSession(sessionId: string): Promise<any> {
  const res = await fetch(`${getApiBaseUrl()}/chat/sessions/${sessionId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'Failed to delete session');
  }
  return res.json();
}

// --- Email Authentication API ---

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: {
    id: string;
    email: string;
    created_at?: string | null;
  };
}

export async function loginUser(email: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`${getApiBaseUrl()}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'Login failed. Please check your credentials.');
  }
  return res.json();
}

export async function registerUser(email: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`${getApiBaseUrl()}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'Registration failed.');
  }
  return res.json();
}


