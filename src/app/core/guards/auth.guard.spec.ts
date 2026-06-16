import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { authGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';

describe('authGuard', () => {
  let auth: AuthService;
  let router: Router;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: '**', component: class {} as any, canActivate: [authGuard] }]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    auth = TestBed.inject(AuthService);
    router = TestBed.inject(Router);
  });

  afterEach(() => localStorage.clear());

  it('redirects to /auth/signin when not signed in', () => {
    const result = TestBed.runInInjectionContext(() => authGuard({} as any, {} as any));
    expect((result as any).toString()).toContain('signin');
  });

  it('allows navigation when signed in', () => {
    auth['_token'].set({
      access_token: 'tok',
      expires_at: Date.now() + 3_600_000,
      user: { id: 1, email: 'a@a.com', username: 'a', role: 0, avatarPath: null, locale: null, createdAt: '', updatedAt: '' },
    });
    const result = TestBed.runInInjectionContext(() => authGuard({} as any, {} as any));
    expect(result).toBeTrue();
  });
});
