import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AuthToken, User, ProjectRole,
  ROLE_ADMIN, ROLE_QA_MANAGER,
  MEMBER_ROLE_MANAGER, MEMBER_ROLE_DEVELOPER, MEMBER_ROLE_REPORTER,
} from '../models/user.model';

const STORAGE_KEY = 'qa-manager-auth-token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = environment.apiUrl;

  private _token = signal<AuthToken | null>(null);
  private _projectRoles = signal<ProjectRole[]>([]);

  readonly token = this._token.asReadonly();
  readonly isSignedIn = computed(() => {
    const t = this._token();
    return !!t?.access_token && t.expires_at > Date.now();
  });
  readonly currentUser = computed(() => this._token()?.user ?? null);
  readonly isAdmin = computed(() => this._token()?.user?.role === ROLE_ADMIN);
  readonly isQaManager = computed(() => this._token()?.user?.role === ROLE_QA_MANAGER);

  constructor(private http: HttpClient) {
    this.restoreFromStorage();
  }

  signIn(email: string, password: string): Observable<AuthToken> {
    return this.http.post<AuthToken>(`${this.api}/users/signin`, { email, password }).pipe(
      tap(token => this.setToken(token))
    );
  }

  signUp(email: string, username: string, password: string): Observable<AuthToken> {
    return this.http.post<AuthToken>(`${this.api}/users/signup`, { email, username, password }).pipe(
      tap(token => this.setToken(token))
    );
  }

  signOut(): void {
    this._token.set(null);
    this._projectRoles.set([]);
    localStorage.removeItem(STORAGE_KEY);
  }

  setToken(token: AuthToken): void {
    this._token.set(token);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(token));
    this.refreshProjectRoles();
  }

  refreshProjectRoles(): void {
    const t = this._token();
    if (!t?.access_token) return;
    this.http.get<ProjectRole[]>(`${this.api}/users/me/roles`, {
      headers: { Authorization: `Bearer ${t.access_token}` },
    }).subscribe({
      next: roles => this._projectRoles.set(roles),
      error: () => {},
    });
  }

  getAccessToken(): string {
    return this._token()?.access_token ?? '';
  }

  updateCurrentUser(partial: Partial<User>): void {
    const current = this._token();
    if (!current) return;
    const updated: AuthToken = { ...current, user: { ...current.user, ...partial } };
    this._token.set(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }

  isProjectManager(projectId: number): boolean {
    if (this.isAdmin() || this.isQaManager()) return true;
    const role = this._projectRoles().find(r => r.projectId === projectId);
    if (!role) return false;
    return role.isOwner || role.role === MEMBER_ROLE_MANAGER;
  }

  isProjectDeveloper(projectId: number): boolean {
    if (this.isAdmin() || this.isQaManager()) return true;
    const role = this._projectRoles().find(r => r.projectId === projectId);
    if (!role) return false;
    return role.isOwner || role.role === MEMBER_ROLE_MANAGER || role.role === MEMBER_ROLE_DEVELOPER;
  }

  isProjectReporter(projectId: number): boolean {
    if (this.isAdmin() || this.isQaManager()) return true;
    const role = this._projectRoles().find(r => r.projectId === projectId);
    if (!role) return false;
    return role.isOwner ||
      role.role === MEMBER_ROLE_MANAGER ||
      role.role === MEMBER_ROLE_DEVELOPER ||
      role.role === MEMBER_ROLE_REPORTER;
  }

  canEditRun(projectId: number): boolean {
    return this.isAdmin() || this.isQaManager() || this.isProjectManager(projectId);
  }

  canManageRuns(projectId: number): boolean {
    return this.isAdmin() || this.isQaManager() || this.isProjectManager(projectId);
  }

  canManageMembers(projectId: number): boolean {
    return this.isAdmin() || this.isQaManager() || this.isProjectManager(projectId);
  }

  canCreateProject(): boolean {
    return this.isAdmin() || this.isQaManager();
  }

  private restoreFromStorage(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const token: AuthToken = JSON.parse(raw);
        if (token.expires_at > Date.now()) {
          this._token.set(token);
          this.refreshProjectRoles();
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }
}
