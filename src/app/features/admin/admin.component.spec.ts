import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { AdminComponent } from './admin.component';
import { AdminService } from '../../core/services/admin.service';
import { AuthService } from '../../core/services/auth.service';
import { User, ROLE_ADMIN } from '../../core/models/user.model';
import { provideTranslateService } from '@ngx-translate/core';

const mockAdmin: User = {
  id: 1, email: 'admin@test.com', username: 'admin', role: 0,
  avatarPath: null, locale: null, createdAt: '', updatedAt: '',
};
const mockUser2: User = {
  id: 2, email: 'user@test.com', username: 'user2', role: 1,
  avatarPath: null, locale: null, createdAt: '', updatedAt: '',
};

describe('AdminComponent', () => {
  let component: AdminComponent;
  let fixture: ComponentFixture<AdminComponent>;
  let adminSvc: jasmine.SpyObj<AdminService>;
  let auth: AuthService;
  let http: HttpTestingController;

  beforeEach(async () => {
    localStorage.clear();
    adminSvc = jasmine.createSpyObj('AdminService', [
      'getUsers', 'updateUserRole', 'adminCreateUser', 'adminResetPassword',
    ]);
    adminSvc.getUsers.and.returnValue(of([mockAdmin, mockUser2]));

    await TestBed.configureTestingModule({
      imports: [AdminComponent, NoopAnimationsModule],
      providers: [
        ...provideTranslateService({ fallbackLang: 'fr' }),
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AdminService, useValue: adminSvc },
      ],
    }).compileComponents();

    auth = TestBed.inject(AuthService);
    auth['_token'].set({
      access_token: 'tok', expires_at: Date.now() + 3_600_000,
      user: { id: 1, email: 'admin@test.com', username: 'admin', role: ROLE_ADMIN, avatarPath: null, locale: null, createdAt: '', updatedAt: '' },
    });

    http = TestBed.inject(HttpTestingController);
    http.match(r => r.url.includes('/me/roles')).forEach(r => r.flush([]));

    fixture = TestBed.createComponent(AdminComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => { http.verify(); localStorage.clear(); });

  it('should create', () => expect(component).toBeTruthy());

  it('loads users on init', () => {
    expect(adminSvc.getUsers).toHaveBeenCalled();
  });

  it('populates dataSource with users', () => {
    expect(component.dataSource.data.length).toBe(2);
  });

  it('sets loading to false after users load', () => {
    expect(component.loading).toBeFalse();
  });

  it('sets loading to false on error', () => {
    adminSvc.getUsers.and.returnValue(throwError(() => new Error('fail')));
    component.loadUsers();
    expect(component.loading).toBeFalse();
  });

  it('isMyself returns true for current user', () => {
    expect(component.isMyself(mockAdmin)).toBeTrue();
  });

  it('isMyself returns false for other user', () => {
    expect(component.isMyself(mockUser2)).toBeFalse();
  });

  it('onRoleChange calls updateUserRole with correct args', () => {
    adminSvc.updateUserRole.and.returnValue(of({ user: { ...mockUser2, role: 2 } }));
    component.onRoleChange(mockUser2, 2);
    expect(adminSvc.updateUserRole).toHaveBeenCalledWith(2, 2);
  });

  it('onRoleChange updates user role property on success', () => {
    adminSvc.updateUserRole.and.returnValue(of({ user: { ...mockUser2, role: 2 } }));
    component.onRoleChange(mockUser2, 2);
    expect(mockUser2.role).toBe(2);
    mockUser2.role = 1;
  });

  it('onRoleChange reloads users on error', () => {
    adminSvc.updateUserRole.and.returnValue(throwError(() => new Error('at least one admin')));
    adminSvc.getUsers.and.returnValue(of([mockAdmin, mockUser2]));
    component.onRoleChange(mockUser2, 0);
    expect(adminSvc.getUsers).toHaveBeenCalledTimes(2);
  });

  it('getRoleLabel returns correct labels', () => {
    expect(component.getRoleLabel(0)).toBe('Administrateur');
    expect(component.getRoleLabel(1)).toBe('Utilisateur');
    expect(component.getRoleLabel(2)).toBe('QA Manager');
  });

  it('roleOptions has three entries', () => {
    expect(component.roleOptions.length).toBe(3);
    expect(component.roleOptions[0]).toEqual({ value: 0, label: 'Administrateur' });
  });

  it('displayedColumns includes expected columns', () => {
    expect(component.displayedColumns).toContain('email');
    expect(component.displayedColumns).toContain('role');
    expect(component.displayedColumns).toContain('actions');
  });
});
