import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { ProjectsListComponent } from './projects-list.component';
import { ProjectService } from '../../../core/services/project.service';
import { Project } from '../../../core/models/project.model';
import { provideTranslateService } from '@ngx-translate/core';

const mockProject: Project = {
  id: 1, name: 'Test', detail: '', isPublic: true, userId: 1, createdAt: '', updatedAt: '2024-01-01',
};

describe('ProjectsListComponent', () => {
  let component: ProjectsListComponent;
  let fixture: ComponentFixture<ProjectsListComponent>;
  let projectSvc: jasmine.SpyObj<ProjectService>;
  let http: HttpTestingController;

  beforeEach(async () => {
    localStorage.clear();
    projectSvc = jasmine.createSpyObj('ProjectService', ['getProjects', 'createProject']);
    projectSvc.getProjects.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [ProjectsListComponent, NoopAnimationsModule],
      providers: [
        ...provideTranslateService({ fallbackLang: 'fr' }),
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ProjectService, useValue: projectSvc },
      ],
    }).compileComponents();

    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(ProjectsListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => { http.verify(); localStorage.clear(); });

  it('should create', () => expect(component).toBeTruthy());

  it('loads projects on init', () => expect(projectSvc.getProjects).toHaveBeenCalled());

  it('sets loading false after data loads', () => expect(component.loading).toBeFalse());

  it('populates data source with projects', () => {
    projectSvc.getProjects.and.returnValue(of([mockProject]));
    component.ngOnInit();
    expect(component.dataSource.data).toEqual([mockProject]);
  });

  it('sets loading false on error', () => {
    projectSvc.getProjects.and.returnValue(throwError(() => new Error('fail')));
    component.ngOnInit();
    expect(component.loading).toBeFalse();
  });
});
