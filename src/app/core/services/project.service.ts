import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Project, ProjectWithStats } from '../models/project.model';

@Injectable({ providedIn: 'root' })
export class ProjectService {
  private readonly api = environment.apiUrl;
  private readonly http = inject(HttpClient);

  getMyProjects(): Observable<Project[]> {
    return this.http.get<Project[]>(`${this.api}/projects`, {
      params: { onlyUserProjects: 'true' },
    });
  }

  getProjects(): Observable<Project[]> {
    return this.http.get<Project[]>(`${this.api}/projects`);
  }

  getProjectHome(id: number): Observable<ProjectWithStats> {
    return this.http.get<ProjectWithStats>(`${this.api}/home/${id}`);
  }

  getProjectInfo(id: number): Observable<Project> {
    return this.http.get<Project>(`${this.api}/projects/${id}`);
  }

  createProject(name: string, detail: string, isPublic: boolean): Observable<Project> {
    return this.http.post<Project>(`${this.api}/projects`, { name, detail, isPublic });
  }

  updateProject(id: number, name: string, detail: string, isPublic: boolean): Observable<Project> {
    return this.http.put<Project>(`${this.api}/projects/${id}`, { name, detail, isPublic });
  }

  deleteProject(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/projects/${id}`);
  }
}
