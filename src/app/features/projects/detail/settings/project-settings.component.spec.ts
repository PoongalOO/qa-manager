import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { ProjectSettingsComponent } from './project-settings.component';
import { ProjectService } from '../../../../core/services/project.service';
import { TagService } from '../../../../core/services/tag.service';
import { UserService } from '../../../../core/services/user.service';
import { Project, Tag } from '../../../../core/models/project.model';
import { User } from '../../../../core/models/user.model';
import { provideTranslateService } from '@ngx-translate/core';

const mockProject: Project = {
  id: 1, name: 'Test', detail: 'desc', isPublic: false, userId: 5, createdAt: '', updatedAt: '',
};
const mockTags: Tag[] = [{ id: 1, name: 'regression', projectId: 1 }];
const mockOwner: User = {
  id: 5, email: 'owner@test.com', username: 'owner', role: 0, avatarPath: null, locale: null, createdAt: '', updatedAt: '',
};

describe('ProjectSettingsComponent', () => {
  let component: ProjectSettingsComponent;
  let fixture: ComponentFixture<ProjectSettingsComponent>;
  let projectSvc: jasmine.SpyObj<ProjectService>;
  let tagSvc: jasmine.SpyObj<TagService>;
  let userSvc: jasmine.SpyObj<UserService>;
  let http: HttpTestingController;

  beforeEach(async () => {
    localStorage.clear();
    projectSvc = jasmine.createSpyObj('ProjectService', [
      'getProjectInfo', 'updateProject', 'deleteProject',
    ]);
    tagSvc = jasmine.createSpyObj('TagService', ['getTags', 'createTag', 'deleteTag']);
    userSvc = jasmine.createSpyObj('UserService', ['findUser']);

    projectSvc.getProjectInfo.and.returnValue(of(mockProject));
    tagSvc.getTags.and.returnValue(of(mockTags));
    userSvc.findUser.and.returnValue(of(mockOwner));

    await TestBed.configureTestingModule({
      imports: [ProjectSettingsComponent, NoopAnimationsModule],
      providers: [
        ...provideTranslateService({ fallbackLang: 'fr' }),
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ProjectService, useValue: projectSvc },
        { provide: TagService, useValue: tagSvc },
        { provide: UserService, useValue: userSvc },
      ],
    }).compileComponents();

    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(ProjectSettingsComponent);
    component = fixture.componentInstance;
    component.projectId = '1';
    fixture.detectChanges();
  });

  afterEach(() => { http.verify(); localStorage.clear(); });

  it('should create', () => expect(component).toBeTruthy());

  it('loads project and tags on init', () => {
    expect(projectSvc.getProjectInfo).toHaveBeenCalledWith(1);
    expect(tagSvc.getTags).toHaveBeenCalledWith(1);
  });

  it('sets loading false after load', () => expect(component.loading).toBeFalse());

  it('populates project data', () => expect(component.project).toEqual(mockProject));

  it('populates tags', () => expect(component.tags).toEqual(mockTags));

  it('loads owner info after project loads', () => {
    expect(userSvc.findUser).toHaveBeenCalledWith(5);
    expect(component.owner).toEqual(mockOwner);
  });

  it('sets loading false on error', () => {
    projectSvc.getProjectInfo.and.returnValue(throwError(() => new Error('fail')));
    component.ngOnInit();
    expect(component.loading).toBeFalse();
  });

  it('onAddTag calls createTag when name is valid', () => {
    tagSvc.createTag.and.returnValue(of({ id: 2, name: 'smoke', projectId: 1 }));
    component.newTagName = 'smoke';
    component.onAddTag();
    expect(tagSvc.createTag).toHaveBeenCalledWith(1, 'smoke');
  });

  it('onAddTag does not call createTag when name too short', () => {
    component.newTagName = 'ab';
    component.onAddTag();
    expect(tagSvc.createTag).not.toHaveBeenCalled();
  });
});
