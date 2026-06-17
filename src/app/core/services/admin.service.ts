import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from '../models/user.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private http = inject(HttpClient);
  private api = environment.apiUrl;

  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.api}/users`);
  }

  updateUserRole(userId: number, newRole: number): Observable<{ user: User }> {
    return this.http.put<{ user: User }>(`${this.api}/users/${userId}/role`, { newRole });
  }

  adminCreateUser(email: string, username: string, password: string, role: number): Observable<{ user: User }> {
    return this.http.post<{ user: User }>(`${this.api}/users/admin-create`, { email, username, password, role });
  }

  adminResetPassword(userId: number, newPassword: string): Observable<{ user: { id: number } }> {
    return this.http.put<{ user: { id: number } }>(`${this.api}/users/${userId}/password`, { newPassword });
  }

  deleteUser(userId: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.api}/users/${userId}`);
  }
}
