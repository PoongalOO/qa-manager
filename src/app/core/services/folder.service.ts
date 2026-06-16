import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Folder } from '../models/folder.model';

@Injectable({ providedIn: 'root' })
export class FolderService {
  private http = inject(HttpClient);
  private api = environment.apiUrl;

  getFolders(projectId: number): Observable<Folder[]> {
    return this.http.get<Folder[]>(`${this.api}/folders`, { params: { projectId: String(projectId) } });
  }

  createFolder(projectId: number, name: string, detail: string, parentFolderId: number | null): Observable<Folder> {
    return this.http.post<Folder>(`${this.api}/folders`, { name, detail, parentFolderId }, { params: { projectId: String(projectId) } });
  }

  updateFolder(folderId: number, name: string, detail: string, projectId: number, parentFolderId: number | null): Observable<Folder> {
    return this.http.put<Folder>(`${this.api}/folders/${folderId}`, { name, detail, projectId, parentFolderId });
  }

  deleteFolder(folderId: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/folders/${folderId}`);
  }
}
