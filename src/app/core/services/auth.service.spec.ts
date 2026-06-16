import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AuthService } from './auth.service';
import { ROLE_ADMIN, ROLE_QA_MANAGER, ROLE_USER } from '../models/user.model';

const makeToken = (role: number) => ({
  access_token: 'test-token',
  expires_at: Date.now() + 3_600_000,
  user: { id: 1, email: 'test@test.com', username: 'test', role, avatarPath: null, locale: null, createdAt: '', updatedAt: '' },
});

describe('AuthService', () => {
  let service: AuthService;
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
    // flush the roles call triggered by constructor if any
    http.match(r => r.url.includes('/me/roles')).forEach(r => r.flush([]));
  });

  afterEach(() => { http.verify(); localStorage.clear(); });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('isSignedIn() is false initially', () => {
    expect(service.isSignedIn()).toBeFalse();
  });

  it('isAdmin() is false initially', () => {
    expect(service.isAdmin()).toBeFalse();
  });

  describe('signIn()', () => {
    it('sets token and user on success', () => {
      const token = makeToken(ROLE_ADMIN);
      service.signIn('admin@test.com', 'password').subscribe();
      const req = http.expectOne(r => r.url.includes('/users/signin'));
      req.flush(token);
      http.match(r => r.url.includes('/me/roles')).forEach(r => r.flush([]));

      expect(service.isSignedIn()).toBeTrue();
      expect(service.currentUser()?.email).toBe('test@test.com');
    });
  });

  describe('role checks', () => {
    it('isAdmin() true for admin role', () => {
      service['_token'].set(makeToken(ROLE_ADMIN));
      expect(service.isAdmin()).toBeTrue();
    });

    it('isQaManager() true for qa-manager role', () => {
      service['_token'].set(makeToken(ROLE_QA_MANAGER));
      expect(service.isQaManager()).toBeTrue();
    });

    it('isAdmin() false for regular user', () => {
      service['_token'].set(makeToken(ROLE_USER));
      expect(service.isAdmin()).toBeFalse();
    });

    it('canCreateProject() true for admin', () => {
      service['_token'].set(makeToken(ROLE_ADMIN));
      expect(service.canCreateProject()).toBeTrue();
    });

    it('canCreateProject() true for qa-manager', () => {
      service['_token'].set(makeToken(ROLE_QA_MANAGER));
      expect(service.canCreateProject()).toBeTrue();
    });

    it('canCreateProject() false for regular user', () => {
      service['_token'].set(makeToken(ROLE_USER));
      expect(service.canCreateProject()).toBeFalse();
    });
  });

  describe('isProjectManager()', () => {
    it('returns true for admin regardless of project roles', () => {
      service['_token'].set(makeToken(ROLE_ADMIN));
      expect(service.isProjectManager(42)).toBeTrue();
    });

    it('returns true for qa-manager regardless of project roles', () => {
      service['_token'].set(makeToken(ROLE_QA_MANAGER));
      expect(service.isProjectManager(42)).toBeTrue();
    });

    it('returns true when user has manager role on that project', () => {
      service['_token'].set(makeToken(ROLE_USER));
      service['_projectRoles'].set([{ projectId: 1, role: 0, isOwner: false }]);
      expect(service.isProjectManager(1)).toBeTrue();
    });

    it('returns false when user has reporter role on that project', () => {
      service['_token'].set(makeToken(ROLE_USER));
      service['_projectRoles'].set([{ projectId: 1, role: 2, isOwner: false }]);
      expect(service.isProjectManager(1)).toBeFalse();
    });
  });

  describe('signOut()', () => {
    it('clears token and removes from storage', () => {
      service['_token'].set(makeToken(ROLE_ADMIN));
      service.signOut();
      expect(service.isSignedIn()).toBeFalse();
      expect(localStorage.getItem('qa-manager-auth-token')).toBeNull();
    });
  });
});
