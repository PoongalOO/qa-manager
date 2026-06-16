import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AdminService } from './admin.service';
import { User } from '../models/user.model';

const API = '/api';

const mockUser: User = {
  id: 1, email: 'admin@test.com', username: 'admin', role: 0,
  avatarPath: null, locale: null, createdAt: '', updatedAt: '',
};

describe('AdminService', () => {
  let service: AdminService;
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(AdminService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => { http.verify(); localStorage.clear(); });

  it('should be created', () => expect(service).toBeTruthy());

  it('getUsers sends GET /users', () => {
    service.getUsers().subscribe(r => expect(r).toEqual([mockUser]));
    const req = http.expectOne(`${API}/users`);
    expect(req.request.method).toBe('GET');
    req.flush([mockUser]);
  });

  it('updateUserRole sends PUT /users/1/role with newRole', () => {
    service.updateUserRole(1, 2).subscribe();
    const req = http.expectOne(`${API}/users/1/role`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ newRole: 2 });
    req.flush({ user: mockUser });
  });

  it('adminCreateUser sends POST /users/admin-create', () => {
    service.adminCreateUser('a@b.com', 'user1', 'password123', 1).subscribe();
    const req = http.expectOne(`${API}/users/admin-create`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ email: 'a@b.com', username: 'user1', password: 'password123', role: 1 });
    req.flush({ user: mockUser });
  });

  it('adminResetPassword sends PUT /users/1/password with newPassword', () => {
    service.adminResetPassword(1, 'newPass123').subscribe();
    const req = http.expectOne(`${API}/users/1/password`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ newPassword: 'newPass123' });
    req.flush({ user: { id: 1 } });
  });
});
