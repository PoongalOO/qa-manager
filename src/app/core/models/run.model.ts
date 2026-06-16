export interface Run {
  id: number;
  name: string;
  description: string;
  configurations: number;
  state: number;
  projectId: number;
  caseCount?: number;
  createdAt: string;
  updatedAt: string;
  Project?: { name: string };
}

export interface RunStatusCount {
  status: number;
  count: string;
}

export interface RunCaseResult {
  id: number;
  runCaseId: number;
  userId: number;
  status: number;
  createdAt?: string;
  updatedAt?: string;
  User?: { id: number; username: string };
}

export interface RunCase {
  id: number;
  runId: number;
  caseId: number;
  status: number;
  editState: 'notChanged' | 'changed' | 'new' | 'deleted';
  RunCaseResults?: RunCaseResult[];
  commentCount?: number;
}

export interface CaseWithRunCase {
  id: number;
  title: string;
  priority: number;
  type: number;
  state: number;
  folderId: number;
  Tags?: { id: number; name: string }[];
  RunCases: RunCase[];
}

export const RUN_STATES = ['Nouveau', 'En cours', 'En révision', 'Rejeté', 'Terminé', 'Clôturé'];

export const RUN_CASE_STATUSES = ['Non testé', 'Passé', 'Échoué', 'À retester', 'Ignoré'];

export const RUN_CASE_STATUS_COLORS = ['#3ac6e1', '#6ea56c', '#f15f47', '#fba91e', '#805aab'];
