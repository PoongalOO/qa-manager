export interface Project {
  id: number;
  name: string;
  detail: string;
  isPublic: boolean;
  userId: number;
  createdAt: string;
  updatedAt: string;
}

export interface Member {
  id: number;
  userId: number;
  projectId: number;
  role: number;
  createdAt: string;
  updatedAt: string;
  User: { id: number; username: string; email: string; avatarPath: string | null };
}

export interface CaseBasic {
  id: number;
  type: number;
  priority: number;
}

export interface FolderWithCases {
  id: number;
  name: string;
  projectId: number;
  Cases: CaseBasic[];
}

export interface RunCaseBasic {
  id: number;
  status: number;
}

export interface RunWithCases {
  id: number;
  name: string;
  RunCases: RunCaseBasic[];
}

export interface ProjectWithStats extends Project {
  Folders: FolderWithCases[];
  Runs: RunWithCases[];
}

export interface Tag {
  id: number;
  name: string;
  projectId: number;
}
