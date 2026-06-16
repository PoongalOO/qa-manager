import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Comment } from '../models/comment.model';

@Injectable({ providedIn: 'root' })
export class CommentService {
  private readonly api = environment.apiUrl;
  private readonly http = inject(HttpClient);

  getComments(commentableType: string, commentableId: number, viewUserId?: number): Observable<Comment[]> {
    const params: Record<string, string> = { commentableType, commentableId: String(commentableId) };
    if (viewUserId !== undefined) params['viewUserId'] = String(viewUserId);
    return this.http.get<Comment[]>(`${this.api}/comments`, { params });
  }

  addComment(commentableType: string, commentableId: number, content: string): Observable<Comment> {
    return this.http.post<Comment>(`${this.api}/comments`, { content }, {
      params: { commentableType, commentableId: String(commentableId) },
    });
  }

  deleteComment(commentId: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/comments/${commentId}`);
  }
}
