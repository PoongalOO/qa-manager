import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly api = environment.apiUrl;
  private readonly http = inject(HttpClient);

  updateUsername(username: string): Observable<{ user: User }> {
    return this.http.put<{ user: User }>(`${this.api}/users/username`, { username });
  }

  updatePassword(currentPassword: string, newPassword: string): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.api}/users/password`, { currentPassword, newPassword });
  }

  updateLocale(locale: string): Observable<{ user: User }> {
    return this.http.put<{ user: User }>(`${this.api}/users/locale`, { locale });
  }

  uploadAvatar(file: File): Observable<{ user: User }> {
    const formData = new FormData();
    formData.append('avatar', file);
    return this.http.post<{ user: User }>(`${this.api}/users/avatar`, formData);
  }

  deleteAvatar(): Observable<{ user: User }> {
    return this.http.delete<{ user: User }>(`${this.api}/users/avatar`);
  }

  findUser(userId: number): Observable<User> {
    return this.http.get<User>(`${this.api}/users/find/${userId}`);
  }
}
