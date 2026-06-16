import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { ProjectHomeComponent } from './project-home.component';
import { ProjectService } from '../../../../core/services/project.service';
import { ProjectWithStats } from '../../../../core/models/project.model';
import { provideTranslateService } from '@ngx-translate/core';

const mockProject: ProjectWithStats = {
  id: 1, name: 'My Project', detail: 'desc', isPublic: true, userId: 1,
  createdAt: '', updatedAt: '',
  Folders: [
    { id: 1, name: 'F1', projectId: 1, Cases: [{ id: 1, type: 0, priority: 0 }] },
    { id: 2, name: 'F2', projectId: 1, Cases: [] },
  ],
  Runs: [{ id: 1, name: 'Run 1', RunCases: [{ id: 1, status: 0 }] }],
};

describe('ProjectHomeComponent', () => {
  let component: ProjectHomeComponent;
  let fixture: ComponentFixture<ProjectHomeComponent>;
  let projectSvc: jasmine.SpyObj<ProjectService>;
  let http: HttpTestingController;

  beforeEach(async () => {
    localStorage.clear();
    projectSvc = jasmine.createSpyObj('ProjectService', ['getProjectHome']);
    projectSvc.getProjectHome.and.returnValue(of(mockProject));

    await TestBed.configureTestingModule({
      imports: [ProjectHomeComponent, NoopAnimationsModule],
      providers: [
        ...provideTranslateService({ fallbackLang: 'fr' }),
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ProjectService, useValue: projectSvc },
      ],
    }).compileComponents();

    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(ProjectHomeComponent);
    component = fixture.componentInstance;
    component.projectId = '1';
    fixture.detectChanges();
  });

  afterEach(() => { http.verify(); localStorage.clear(); });

  it('should create', () => expect(component).toBeTruthy());

  it('calls getProjectHome with projectId', () => {
    expect(projectSvc.getProjectHome).toHaveBeenCalledWith(1);
  });

  it('sets loading false after load', () => expect(component.loading).toBeFalse());

  it('computes folderCount correctly', () => expect(component.folderCount).toBe(2));

  it('computes caseCount correctly', () => expect(component.caseCount).toBe(1));

  it('computes runCount correctly', () => expect(component.runCount).toBe(1));

  it('sets loading false on error', () => {
    projectSvc.getProjectHome.and.returnValue(throwError(() => new Error('fail')));
    component.ngOnInit();
    expect(component.loading).toBeFalse();
  });

  it('priorityData maps case priorities correctly', () => {
    const data = component.priorityData;
    expect(data.length).toBe(4);
    expect(data[0].label).toBe('Critique');
    expect(data[0].value).toBe(1); // 1 case with priority=0
    expect(data[1].value).toBe(0); // no cases with priority=1
  });

  it('typeData maps case types correctly', () => {
    const data = component.typeData;
    expect(data[0].label).toBe('Autre');
    expect(data[0].value).toBe(1); // 1 case with type=0
    expect(data[1].value).toBe(0); // no cases with type=1
  });

  it('runProgressData calculates percentages per run', () => {
    const data = component.runProgressData;
    expect(data.length).toBe(1);
    expect(data[0].name).toBe('Run 1');
    expect(data[0].total).toBe(1);
    expect(data[0].segments[0].percent).toBe(100); // status=0 → 100%
    expect(data[0].segments[1].percent).toBe(0);   // status=1 → 0%
  });

  it('priorityData returns zeros when project is null', () => {
    component.project = null;
    expect(component.priorityData.every(d => d.value === 0)).toBeTrue();
  });

  it('runProgressData returns empty array when project is null', () => {
    component.project = null;
    expect(component.runProgressData).toEqual([]);
  });
});
