import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { UserService } from './user.service';
import { environment } from '../../../environments/environment';

describe('UserService', () => {
  let service: UserService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(UserService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('should be created', () => expect(service).toBeTruthy());

  it('updateUsername sends PUT /users/username with correct body', () => {
    service.updateUsername('newuser').subscribe();
    const req = http.expectOne(`${environment.apiUrl}/users/username`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ username: 'newuser' });
    req.flush({ user: { username: 'newuser' } });
  });

  it('updatePassword sends PUT /users/password with correct body', () => {
    service.updatePassword('oldpass', 'newpass123').subscribe();
    const req = http.expectOne(`${environment.apiUrl}/users/password`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ currentPassword: 'oldpass', newPassword: 'newpass123' });
    req.flush({ message: 'Password updated successfully' });
  });

  it('updateLocale sends PUT /users/locale with correct body', () => {
    service.updateLocale('fr').subscribe();
    const req = http.expectOne(`${environment.apiUrl}/users/locale`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ locale: 'fr' });
    req.flush({ user: { locale: 'fr' } });
  });

  it('uploadAvatar sends POST /users/avatar with FormData', () => {
    const file = new File(['content'], 'avatar.png', { type: 'image/png' });
    service.uploadAvatar(file).subscribe();
    const req = http.expectOne(`${environment.apiUrl}/users/avatar`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body instanceof FormData).toBeTrue();
    req.flush({ user: { avatarPath: '/uploads/avatars/avatar.png' } });
  });

  it('deleteAvatar sends DELETE /users/avatar', () => {
    service.deleteAvatar().subscribe();
    const req = http.expectOne(`${environment.apiUrl}/users/avatar`);
    expect(req.request.method).toBe('DELETE');
    req.flush({ user: { avatarPath: null } });
  });
});
