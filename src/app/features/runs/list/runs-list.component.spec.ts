import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { RunsListComponent } from './runs-list.component';
import { RunService } from '../../../core/services/run.service';
import { AuthService } from '../../../core/services/auth.service';
import { Run } from '../../../core/models/run.model';
import { ROLE_ADMIN } from '../../../core/models/user.model';
import { provideTranslateService } from '@ngx-translate/core';

const mockRun: Run = {
  id: 1, name: 'Sprint 1', description: 'desc', configurations: 0,
  state: 0, projectId: 1, caseCount: 3, createdAt: '', updatedAt: '2024-01-01',
};

describe('RunsListComponent', () => {
  let component: RunsListComponent;
  let fixture: ComponentFixture<RunsListComponent>;
  let runSvc: jasmine.SpyObj<RunService>;
  let auth: AuthService;
  let http: HttpTestingController;

  beforeEach(async () => {
    localStorage.clear();
    runSvc = jasmine.createSpyObj('RunService', ['getRuns', 'createRun', 'updateRun', 'deleteRun', 'getMyRuns']);
    runSvc.getRuns.and.returnValue(of([mockRun]));

    await TestBed.configureTestingModule({
      imports: [RunsListComponent, NoopAnimationsModule],
      providers: [
        ...provideTranslateService({ fallbackLang: 'fr' }),
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: RunService, useValue: runSvc },
      ],
    }).compileComponents();

    auth = TestBed.inject(AuthService);
    auth['_token'].set({
      access_token: 'tok', expires_at: Date.now() + 3_600_000,
      user: { id: 1, email: 'a@a.com', username: 'admin', role: ROLE_ADMIN, avatarPath: null, locale: null, createdAt: '', updatedAt: '' },
    });

    http = TestBed.inject(HttpTestingController);
    http.match(r => r.url.includes('/me/roles')).forEach(r => r.flush([]));

    fixture = TestBed.createComponent(RunsListComponent);
    component = fixture.componentInstance;
    component.projectId = '1';
    fixture.detectChanges();
  });

  afterEach(() => { http.verify(); localStorage.clear(); });

  it('should create', () => expect(component).toBeTruthy());

  it('loads runs on init', () => {
    expect(runSvc.getRuns).toHaveBeenCalledWith(1);
  });

  it('sets loading false after runs load', () => {
    expect(component.loading).toBeFalse();
  });

  it('populates dataSource with runs', () => {
    expect(component.dataSource.data).toEqual([mockRun]);
  });

  it('sets loading false on error', () => {
    runSvc.getRuns.and.returnValue(throwError(() => new Error('fail')));
    component.loadRuns();
    expect(component.loading).toBeFalse();
  });

  it('canManage is true for admin', () => {
    expect(component.canManage).toBeTrue();
  });

  it('getStateLabel returns correct label', () => {
    expect(component.getStateLabel(0)).toBe('Nouveau');
    expect(component.getStateLabel(1)).toBe('En cours');
    expect(component.getStateLabel(4)).toBe('Terminé');
  });
});
