import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Tag } from '../models/project.model';

@Injectable({ providedIn: 'root' })
export class TagService {
  private readonly api = environment.apiUrl;
  private readonly http = inject(HttpClient);

  getTags(projectId: number): Observable<Tag[]> {
    return this.http.get<Tag[]>(`${this.api}/tags`, {
      params: { projectId: String(projectId) },
    });
  }

  createTag(projectId: number, name: string): Observable<Tag> {
    return this.http.post<Tag>(`${this.api}/tags`, { name }, {
      params: { projectId: String(projectId) },
    });
  }

  updateTag(tagId: number, projectId: number, name: string): Observable<Tag> {
    return this.http.put<Tag>(`${this.api}/tags/${tagId}`, { name }, {
      params: { projectId: String(projectId) },
    });
  }

  deleteTag(tagId: number, projectId: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/tags/${tagId}`, {
      params: { projectId: String(projectId) },
    });
  }
}
