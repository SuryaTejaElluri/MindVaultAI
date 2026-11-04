export interface User {
  sub: string;
  email?: string;
  name?: string;
  picture?: string;
}

export interface DocumentItem {
  id: string;
  filename: string;
  content_hash: string;
  file_size: number;
  chunk_count: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error_message?: string | null;
  ingested_at: string;
  updated_at?: string;
}

export interface SourceCitation {
  document_id?: string;
  filename: string;
  page?: number | null;
  distance?: number;
  preview?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: SourceCitation[];
  created_at?: string;
  grounded?: boolean;
}

export interface ChatSession {
  id: string;
  title: string;
  created_at?: string;
  updated_at?: string;
  messages?: ChatMessage[];
}

export interface ChatResponse {
  answer: string;
  sources: SourceCitation[];
  session_id: string;
  grounded: boolean;
}

