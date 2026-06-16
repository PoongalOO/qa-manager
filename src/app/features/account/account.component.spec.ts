import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { AccountComponent } from './account.component';
import { ProjectService } from '../../core/services/project.service';
import { RunService } from '../../core/services/run.service';
import { Project } from '../../core/models/project.model';
import { Run } from '../../core/models/run.model';
import { provideTranslateService } from '@ngx-translate/core';

const mockProject: Project = {
  id: 1, name: 'Test Project', detail: 'desc',
  isPublic: true, userId: 1, createdAt: '', updatedAt: '',
};
const mockRun: Run = {
  id: 1, name: 'Run 1', description: '', configurations: 0,
  state: 0, projectId: 1, createdAt: '', updatedAt: '',
};

describe('AccountComponent', () => {
  let component: AccountComponent;
  let fixture: ComponentFixture<AccountComponent>;
  let projectSvc: jasmine.SpyObj<ProjectService>;
  let runSvc: jasmine.SpyObj<RunService>;
  let http: HttpTestingController;

  beforeEach(async () => {
    localStorage.clear();
    projectSvc = jasmine.createSpyObj('ProjectService', ['getMyProjects']);
    runSvc = jasmine.createSpyObj('RunService', ['getMyRuns']);
    projectSvc.getMyProjects.and.returnValue(of([]));
    runSvc.getMyRuns.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [AccountComponent, NoopAnimationsModule],
      providers: [
        ...provideTranslateService({ fallbackLang: 'fr' }),
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ProjectService, useValue: projectSvc },
        { provide: RunService, useValue: runSvc },
      ],
    }).compileComponents();

    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(AccountComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    http.verify();
    localStorage.clear();
  });

  it('should create', () => expect(component).toBeTruthy());

  it('calls getMyProjects on init', () => expect(projectSvc.getMyProjects).toHaveBeenCalled());

  it('calls getMyRuns on init', () => expect(runSvc.getMyRuns).toHaveBeenCalled());

  it('sets loading to false after data loads', () => expect(component.loading).toBeFalse());

  it('starts with empty projects list', () => expect(component.projects).toEqual([]));

  it('starts with empty runs list', () => expect(component.runs).toEqual([]));

  it('populates projects from service', () => {
    projectSvc.getMyProjects.and.returnValue(of([mockProject]));
    component.ngOnInit();
    expect(component.projects).toEqual([mockProject]);
  });

  it('populates runs from service', () => {
    runSvc.getMyRuns.and.returnValue(of([mockRun]));
    component.ngOnInit();
    expect(component.runs).toEqual([mockRun]);
  });

  it('sets loading to false on error', () => {
    projectSvc.getMyProjects.and.returnValue(throwError(() => new Error('network error')));
    component.ngOnInit();
    expect(component.loading).toBeFalse();
  });
});
