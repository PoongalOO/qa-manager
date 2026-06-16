import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { LayoutComponent } from './layout.component';
import { AuthService } from '../../../core/services/auth.service';
import { ROLE_ADMIN, ROLE_USER } from '../../../core/models/user.model';
import { provideTranslateService } from '@ngx-translate/core';

describe('LayoutComponent', () => {
  let component: LayoutComponent;
  let fixture: ComponentFixture<LayoutComponent>;
  let auth: AuthService;
  let http: HttpTestingController;

  const adminToken = {
    access_token: 'tok', expires_at: Date.now() + 3_600_000,
    user: { id: 1, email: 'admin@test.com', username: 'admin', role: ROLE_ADMIN, avatarPath: null, locale: null, createdAt: '', updatedAt: '' },
  };

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [LayoutComponent, NoopAnimationsModule],
      providers: [
        ...provideTranslateService({ fallbackLang: 'fr' }),
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    auth = TestBed.inject(AuthService);
    auth['_token'].set(adminToken);

    http = TestBed.inject(HttpTestingController);
    http.match(r => r.url.includes('/me/roles')).forEach(r => r.flush([]));

    fixture = TestBed.createComponent(LayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => { http.verify(); localStorage.clear(); });

  it('should create', () => expect(component).toBeTruthy());

  it('isAdmin is true when user role is admin', () => {
    expect(component.isAdmin()).toBeTrue();
  });

  it('isAdmin is false when user role is not admin', () => {
    auth['_token'].set({ ...adminToken, user: { ...adminToken.user, role: ROLE_USER } });
    expect(component.isAdmin()).toBeFalse();
  });

  it('username computed signal returns current user username', () => {
    expect(component.username()).toBe('admin');
  });

  it('email computed signal returns current user email', () => {
    expect(component.email()).toBe('admin@test.com');
  });

  it('signOut calls authSvc.signOut and navigates to /auth/signin', () => {
    const signOutSpy = spyOn(auth, 'signOut');
    const navigateSpy = spyOn(TestBed.inject(Router), 'navigate');
    component.signOut();
    expect(signOutSpy).toHaveBeenCalled();
    expect(navigateSpy).toHaveBeenCalledWith(['/auth/signin']);
  });
});
