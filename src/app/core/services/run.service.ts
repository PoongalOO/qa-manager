import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Run, RunStatusCount, RunCase, CaseWithRunCase } from '../models/run.model';

export interface RunFilters {
  search?: string;
  status?: number[];
  tag?: number[];
}

@Injectable({ providedIn: 'root' })
export class RunService {
  private readonly api = environment.apiUrl;
  private readonly http = inject(HttpClient);

  getMyRuns(): Observable<Run[]> {
    return this.http.get<Run[]>(`${this.api}/runs/my`);
  }

  getRuns(projectId: number): Observable<Run[]> {
    return this.http.get<Run[]>(`${this.api}/runs`, { params: { projectId: String(projectId) } });
  }

  getRun(runId: number): Observable<{ run: Run; statusCounts: RunStatusCount[] }> {
    return this.http.get<{ run: Run; statusCounts: RunStatusCount[] }>(`${this.api}/runs/${runId}`);
  }

  createRun(projectId: number, name: string, description: string): Observable<Run> {
    return this.http.post<Run>(
      `${this.api}/runs`,
      { name, description, configurations: 0, state: 0 },
      { params: { projectId: String(projectId) } },
    );
  }

  updateRun(runId: number, data: Partial<Run>): Observable<Run> {
    return this.http.put<Run>(`${this.api}/runs/${runId}`, data);
  }

  deleteRun(runId: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/runs/${runId}`);
  }

  getProjectCases(projectId: number, runId: number, filters: RunFilters = {}, viewUserId?: number): Observable<CaseWithRunCase[]> {
    let params = new HttpParams()
      .set('projectId', String(projectId))
      .set('runId', String(runId));
    if (filters.search) params = params.set('search', filters.search);
    if (filters.status?.length) params = params.set('status', filters.status.join(','));
    if (filters.tag?.length) params = params.set('tag', filters.tag.join(','));
    if (viewUserId !== undefined) params = params.set('viewUserId', String(viewUserId));
    return this.http.get<CaseWithRunCase[]>(`${this.api}/cases/byproject`, { params });
  }

  updateRunCases(runId: number, runCases: RunCase[]): Observable<RunCase[]> {
    return this.http.post<RunCase[]>(
      `${this.api}/runcases/update`,
      runCases,
      { params: { runId: String(runId) } },
    );
  }

  updateUserResults(runId: number, results: { runCaseId: number; status: number }[]): Observable<unknown> {
    return this.http.post<unknown>(
      `${this.api}/runcases/myresults`,
      results,
      { params: { runId: String(runId) } },
    );
  }
}
