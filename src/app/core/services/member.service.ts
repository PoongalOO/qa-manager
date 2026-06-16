import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Member } from '../models/project.model';
import { User } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class MemberService {
  private readonly api = environment.apiUrl;
  private readonly http = inject(HttpClient);

  getMembers(projectId: number): Observable<Member[]> {
    return this.http.get<Member[]>(`${this.api}/members`, {
      params: { projectId: String(projectId) },
    });
  }

  addMember(userId: number, projectId: number): Observable<Member> {
    return this.http.post<Member>(`${this.api}/members`, null, {
      params: { userId: String(userId), projectId: String(projectId) },
    });
  }

  updateMemberRole(userId: number, projectId: number, role: number): Observable<Member> {
    return this.http.put<Member>(`${this.api}/members`, null, {
      params: { userId: String(userId), projectId: String(projectId), role: String(role) },
    });
  }

  deleteMember(userId: number, projectId: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/members`, {
      params: { userId: String(userId), projectId: String(projectId) },
    });
  }

  searchUsers(projectId: number, search?: string): Observable<User[]> {
    const params: Record<string, string> = { projectId: String(projectId) };
    if (search?.trim()) params['search'] = search.trim();
    return this.http.get<User[]>(`${this.api}/users/search`, { params });
  }
}
