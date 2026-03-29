// ============================================================
// Database Row Types
// ============================================================

export type UserRole = 'user' | 'admin';
export type PaperStatus = 'processing' | 'ready' | 'failed';
export type ResourceType = 'paper' | 'note';

export interface DbUser {
  id: string; // matches auth.users.id
  full_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface DbSubject {
  id: string;
  branch: string;
  semester: number;
  name: string;
  code: string | null;
  created_at: string;
}

export interface DbPaper {
  id: string;
  subject_id: string;
  uploaded_by: string;
  title: string;
  description: string | null;
  storage_path: string;
  size_bytes: number;
  status: PaperStatus;
  created_at: string;
  updated_at: string;
}

export interface DbNote {
  id: string;
  subject_id: string;
  uploaded_by: string;
  title: string;
  description: string | null;
  storage_path: string;
  size_bytes: number;
  status: PaperStatus;
  created_at: string;
  updated_at: string;
}

export interface DbAnalysis {
  id: string;
  paper_id: string;
  content: Record<string, unknown>; // JSONB
  model_used: string;
  created_at: string;
  updated_at: string;
}

export interface DbBookmark {
  id: string;
  user_id: string;
  resource_type: ResourceType;
  resource_id: string;
  created_at: string;
}

export interface DbRating {
  id: string;
  user_id: string;
  resource_type: ResourceType;
  resource_id: string;
  score: number; // 1–5
  created_at: string;
}

// ============================================================
// Joined / Extended types (with relations resolved)
// ============================================================

export interface PaperWithSubject extends DbPaper {
  subjects: Pick<DbSubject, 'branch' | 'semester' | 'name' | 'code'>;
}

export interface PaperWithUploader extends DbPaper {
  users: Pick<DbUser, 'full_name' | 'avatar_url'>;
}
