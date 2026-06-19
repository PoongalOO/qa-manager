export interface CaseStep {
  id: number;
  step: string;
  result: string;
  caseSteps: { stepNo: number };
  editState?: 'notChanged' | 'changed' | 'new' | 'deleted';
}

export interface Attachment {
  id: number;
  title: string;
  filename: string;
  createdAt: string;
  updatedAt: string;
}

export interface Case {
  id: number;
  title: string;
  state: number;
  priority: number;
  type: number;
  automationStatus: number;
  description: string | null;
  template: number;
  preConditions: string | null;
  expectedResults: string | null;
  folderId: number;
  createdAt?: string;
  updatedAt?: string;
  steps?: CaseStep[];
  attachments?: Attachment[];
  tags?: { id: number; name: string }[];
}

export interface CaseListItem {
  id: number;
  title: string;
  state: number;
  priority: number;
  type: number;
  automationStatus: number;
  folderId: number;
  createdAt: string;
  updatedAt: string;
  tags?: { id: number; name: string }[];
}

export interface ExportCaseStep {
  id: number;
  step: string | null;
  result: string | null;
  stepNo: number;
}

export interface ExportCase {
  id: number;
  title: string;
  state: number;
  priority: number;
  type: number;
  automationStatus: number;
  description: string | null;
  template: number;
  preConditions: string | null;
  expectedResults: string | null;
  folderId: number;
  tags?: { id: number; name: string }[];
  steps?: ExportCaseStep[];
}

export const PRIORITIES = ['Critique', 'Haute', 'Moyenne', 'Basse'];
export const PRIORITY_COLORS = ['#bb3e03', '#ca6702', '#ee9b00', '#94d2bd'];
export const TEST_TYPES = [
  'Autre', 'Sécurité', 'Performance', 'Accessibilité', 'Fonctionnel',
  'Acceptation', 'Utilisabilité', 'Fumée/Sanité', 'Compatibilité',
  'Destructif', 'Régression', 'Automatisé', 'Manuel',
];
export const AUTOMATION_STATUSES = ['Automatisé', 'Non requis', 'Non automatisable', 'Obsolète'];
export const TEMPLATES = ['Texte', 'Étapes'];
export const CASE_STATES = ['Non testé', 'Passé', 'Échoué', 'À retester', 'Ignoré'];
