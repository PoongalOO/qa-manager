export interface User {
  id: number;
  email: string;
  username: string;
  role: number;
  avatarPath: string | null;
  locale: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuthToken {
  access_token: string;
  expires_at: number;
  user: User;
}

export interface ProjectRole {
  projectId: number;
  role: number;
  isOwner: boolean;
}

// Global role indices
export const ROLE_ADMIN = 0;
export const ROLE_USER = 1;
export const ROLE_QA_MANAGER = 2;

// Project member role indices
export const MEMBER_ROLE_MANAGER = 0;
export const MEMBER_ROLE_DEVELOPER = 1;
export const MEMBER_ROLE_REPORTER = 2;
