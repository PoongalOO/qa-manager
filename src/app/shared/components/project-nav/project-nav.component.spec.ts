import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ProjectNavComponent } from './project-nav.component';
import { AuthService } from '../../../core/services/auth.service';
import { ROLE_ADMIN, ROLE_USER } from '../../../core/models/user.model';
import { provideTranslateService } from '@ngx-translate/core';

describe('ProjectNavComponent', () => {
  let component: ProjectNavComponent;
  let fixture: ComponentFixture<ProjectNavComponent>;
  let auth: AuthService;
  let http: HttpTestingController;

  const adminToken = {
    access_token: 'tok', expires_at: Date.now() + 3_600_000,
    user: { id: 1, email: 'a@a.com', username: 'admin', role: ROLE_ADMIN, avatarPath: null, locale: null, createdAt: '', updatedAt: '' },
  };

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [ProjectNavComponent, NoopAnimationsModule],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    auth = TestBed.inject(AuthService);
    auth['_token'].set(adminToken);

    http = TestBed.inject(HttpTestingController);
    http.match(r => r.url.includes('/me/roles')).forEach(r => r.flush([]));

    fixture = TestBed.createComponent(ProjectNavComponent);
    component = fixture.componentInstance;
    component.projectId = '1';
    fixture.detectChanges();
  });

  afterEach(() => { http.verify(); localStorage.clear(); });

  it('should create', () => expect(component).toBeTruthy());

  it('projectId input is set', () => {
    expect(component.projectId).toBe('1');
  });

  it('shows all 5 links for admin', () => {
    const links = fixture.nativeElement.querySelectorAll('nav a');
    expect(links.length).toBe(5);
  });

  it('shows only 2 links for regular user without project roles', () => {
    auth['_token'].set({
      ...adminToken,
      user: { ...adminToken.user, role: ROLE_USER },
    });
    fixture.detectChanges();
    const links = fixture.nativeElement.querySelectorAll('nav a');
    expect(links.length).toBe(2);
  });

  it('auth.canCreateProject returns true for admin', () => {
    expect(component.auth.canCreateProject()).toBeTrue();
  });

  it('auth.canManageMembers returns true for admin', () => {
    expect(component.auth.canManageMembers(1)).toBeTrue();
  });
});
