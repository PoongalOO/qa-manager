import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Case, CaseListItem, CaseStep, Attachment, ExportCase } from '../models/case.model';

export interface CaseFilters {
  search?: string;
  priority?: number | null;
  type?: number | null;
  tag?: number | null;
}

@Injectable({ providedIn: 'root' })
export class CaseService {
  private http = inject(HttpClient);
  private api = environment.apiUrl;

  getCases(folderId: number, filters: CaseFilters = {}): Observable<CaseListItem[]> {
    let params = new HttpParams().set('folderId', String(folderId));
    if (filters.search) params = params.set('search', filters.search);
    if (filters.priority != null) params = params.set('priority', String(filters.priority));
    if (filters.type != null) params = params.set('type', String(filters.type));
    if (filters.tag != null) params = params.set('tag', String(filters.tag));
    return this.http.get<CaseListItem[]>(`${this.api}/cases`, { params });
  }

  getCase(caseId: number): Observable<Case> {
    return this.http.get<Case>(`${this.api}/cases/${caseId}`);
  }

  getCasesByProject(projectId: number): Observable<CaseListItem[]> {
    return this.http.get<CaseListItem[]>(`${this.api}/cases/indexByProjectId`, {
      params: { projectId: String(projectId) },
    });
  }

  downloadCasesData(caseIds: number[]): Observable<ExportCase[]> {
    return this.http.post<ExportCase[]>(`${this.api}/cases/download`, { caseIds });
  }

  createCase(folderId: number, data: { title: string; description?: string }): Observable<Case> {
    return this.http.post<Case>(`${this.api}/cases`, data, { params: { folderId: String(folderId) } });
  }

  updateCase(caseId: number, data: Partial<Case>): Observable<Case> {
    return this.http.put<Case>(`${this.api}/cases/${caseId}`, data);
  }

  bulkDeleteCases(caseIds: number[]): Observable<void> {
    return this.http.post<void>(`${this.api}/cases/bulkdelete`, { caseIds });
  }

  moveCases(projectId: number, caseIds: number[], targetFolderId: number): Observable<void> {
    return this.http.put<void>(
      `${this.api}/cases/move`,
      { caseIds, targetFolderId },
      { params: { projectId: String(projectId) } },
    );
  }

  updateSteps(caseId: number, steps: CaseStep[]): Observable<CaseStep[]> {
    return this.http.post<CaseStep[]>(`${this.api}/steps/update`, steps, { params: { caseId: String(caseId) } });
  }

  updateCaseTags(caseId: number, tagIds: number[]): Observable<void> {
    return this.http.post<void>(`${this.api}/casetags/update`, { tagIds }, { params: { caseId: String(caseId) } });
  }

  uploadAttachments(caseId: number, files: File[]): Observable<Attachment[]> {
    const formData = new FormData();
    files.forEach(f => formData.append('files', f));
    return this.http.post<Attachment[]>(`${this.api}/attachments`, formData, { params: { parentCaseId: String(caseId) } });
  }

  deleteAttachment(attachmentId: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/attachments/${attachmentId}`);
  }

  getAttachmentDownloadUrl(attachmentId: number): string {
    return `${this.api}/attachments/download/${attachmentId}`;
  }
}
