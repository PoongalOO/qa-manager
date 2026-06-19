import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { CaseDetailComponent } from './case-detail.component';
import { CaseService } from '../../../core/services/case.service';
import { TagService } from '../../../core/services/tag.service';
import { AuthService } from '../../../core/services/auth.service';
import { Case, CaseStep } from '../../../core/models/case.model';
import { Tag } from '../../../core/models/project.model';
import { ROLE_ADMIN } from '../../../core/models/user.model';
import { provideTranslateService } from '@ngx-translate/core';

const mockStep: CaseStep = {
  id: 10, step: 'Open browser', result: 'Browser opens',
  caseSteps: { stepNo: 1 }, editState: 'notChanged',
};

const mockCase: Case = {
  id: 1, title: 'Login test', state: 0, priority: 2, type: 4,
  automationStatus: 0, description: 'Test login', template: 1,
  preConditions: null, expectedResults: null, folderId: 1,
  steps: [mockStep],
  tags: [{ id: 2, name: 'regression' }],
  attachments: [],
};

const mockTag: Tag = { id: 2, name: 'regression', projectId: 1 };

describe('CaseDetailComponent', () => {
  let component: CaseDetailComponent;
  let fixture: ComponentFixture<CaseDetailComponent>;
  let caseSvc: jasmine.SpyObj<CaseService>;
  let tagSvc: jasmine.SpyObj<TagService>;
  let auth: AuthService;
  let http: HttpTestingController;

  beforeEach(async () => {
    localStorage.clear();
    caseSvc = jasmine.createSpyObj('CaseService', [
      'getCase', 'updateCase', 'updateSteps', 'updateCaseTags',
      'uploadAttachments', 'deleteAttachment', 'getAttachmentDownloadUrl',
    ]);
    tagSvc = jasmine.createSpyObj('TagService', ['getTags']);

    caseSvc.getCase.and.returnValue(of(mockCase));
    tagSvc.getTags.and.returnValue(of([mockTag]));
    caseSvc.getAttachmentDownloadUrl.and.callFake((id: number) => `/api/attachments/download/${id}`);

    await TestBed.configureTestingModule({
      imports: [CaseDetailComponent, NoopAnimationsModule],
      providers: [
        ...provideTranslateService({ fallbackLang: 'fr' }),
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: CaseService, useValue: caseSvc },
        { provide: TagService, useValue: tagSvc },
      ],
    }).compileComponents();

    auth = TestBed.inject(AuthService);
    auth['_token'].set({
      access_token: 'tok', expires_at: Date.now() + 3_600_000,
      user: { id: 1, email: 'a@a.com', username: 'admin', role: ROLE_ADMIN, avatarPath: null, locale: null, createdAt: '', updatedAt: '' },
    });

    http = TestBed.inject(HttpTestingController);
    http.match(r => r.url.includes('/me/roles')).forEach(r => r.flush([]));

    fixture = TestBed.createComponent(CaseDetailComponent);
    component = fixture.componentInstance;
    component.projectId = '1';
    component.folderId = '1';
    component.caseId = '1';
    fixture.detectChanges();
  });

  afterEach(() => { http.verify(); localStorage.clear(); });

  it('should create', () => expect(component).toBeTruthy());

  it('loads case on init', () => {
    expect(caseSvc.getCase).toHaveBeenCalledWith(1);
  });

  it('loads project tags on init', () => {
    expect(tagSvc.getTags).toHaveBeenCalledWith(1);
  });

  it('sets loading false after data loads', () => {
    expect(component.loading).toBeFalse();
  });

  it('populates testCase after load', () => {
    expect(component.testCase).toEqual(mockCase);
  });

  it('populates form title from testCase', () => {
    expect(component.form.get('title')?.value).toBe('Login test');
  });

  it('populates form priority from testCase', () => {
    expect(component.form.get('priority')?.value).toBe(2);
  });

  it('populates form template from testCase', () => {
    expect(component.form.get('template')?.value).toBe(1);
  });

  it('populates steps from testCase', () => {
    expect(component.steps.length).toBe(1);
    expect(component.steps[0].step).toBe('Open browser');
    expect(component.steps[0].editState).toBe('notChanged');
  });

  it('populates selectedTagIds from testCase tags', () => {
    expect(component.selectedTagIds).toEqual([2]);
  });

  it('visibleSteps filters out deleted steps', () => {
    component.steps = [
      { id: 1, step: 'a', result: 'b', caseSteps: { stepNo: 1 }, editState: 'notChanged' },
      { id: 2, step: 'c', result: 'd', caseSteps: { stepNo: 2 }, editState: 'deleted' },
    ];
    expect(component.visibleSteps.length).toBe(1);
  });

  it('visibleSteps sorts by stepNo', () => {
    component.steps = [
      { id: 2, step: 'b', result: '', caseSteps: { stepNo: 2 }, editState: 'notChanged' },
      { id: 1, step: 'a', result: '', caseSteps: { stepNo: 1 }, editState: 'notChanged' },
    ];
    expect(component.visibleSteps[0].caseSteps.stepNo).toBe(1);
    expect(component.visibleSteps[1].caseSteps.stepNo).toBe(2);
  });

  it('canDeactivate returns true when not dirty', () => {
    component.isDirty = false;
    expect(component.canDeactivate()).toBeTrue();
  });

  it('canDeactivate returns false when dirty', () => {
    component.isDirty = true;
    expect(component.canDeactivate()).toBeFalse();
  });

  it('markDirty sets isDirty to true', () => {
    component.isDirty = false;
    component.markDirty();
    expect(component.isDirty).toBeTrue();
  });

  it('addStep inserts a new step at correct position', () => {
    component.steps = [
      { id: 10, step: 'a', result: '', caseSteps: { stepNo: 1 }, editState: 'notChanged' },
    ];
    component.addStep(2);
    const newStep = component.steps.find(s => s.editState === 'new');
    expect(newStep).toBeTruthy();
    expect(newStep!.caseSteps.stepNo).toBe(2);
    expect(component.isDirty).toBeTrue();
  });

  it('addStep increments existing steps at or above insertion point', () => {
    component.steps = [
      { id: 10, step: 'a', result: '', caseSteps: { stepNo: 1 }, editState: 'notChanged' },
      { id: 11, step: 'b', result: '', caseSteps: { stepNo: 2 }, editState: 'notChanged' },
    ];
    component.addStep(2);
    const existing = component.steps.find(s => s.id === 11);
    expect(existing!.caseSteps.stepNo).toBe(3);
  });

  it('deleteStep marks step as deleted', () => {
    component.steps = [{ id: 10, step: 'a', result: '', caseSteps: { stepNo: 1 }, editState: 'notChanged' }];
    component.deleteStep(10);
    expect(component.steps[0].editState).toBe('deleted');
    expect(component.isDirty).toBeTrue();
  });

  it('deleteStep renumbers subsequent steps', () => {
    component.steps = [
      { id: 10, step: 'a', result: '', caseSteps: { stepNo: 1 }, editState: 'notChanged' },
      { id: 11, step: 'b', result: '', caseSteps: { stepNo: 2 }, editState: 'notChanged' },
    ];
    component.deleteStep(10);
    const step2 = component.steps.find(s => s.id === 11);
    expect(step2!.caseSteps.stepNo).toBe(1);
  });

  it('isTagSelected returns true for selected tag', () => {
    component.selectedTagIds = [2, 3];
    expect(component.isTagSelected(2)).toBeTrue();
    expect(component.isTagSelected(5)).toBeFalse();
  });

  it('toggleTag adds unselected tag', () => {
    component.selectedTagIds = [];
    component.toggleTag(2);
    expect(component.selectedTagIds).toContain(2);
    expect(component.isDirty).toBeTrue();
  });

  it('toggleTag removes selected tag', () => {
    component.selectedTagIds = [2];
    component.toggleTag(2);
    expect(component.selectedTagIds).not.toContain(2);
  });

  it('toggleTag respects 5-tag limit', () => {
    component.selectedTagIds = [1, 2, 3, 4, 5];
    component.toggleTag(6);
    expect(component.selectedTagIds.length).toBe(5);
  });

  it('getDownloadUrl returns correct URL', () => {
    expect(component.getDownloadUrl(7)).toBe('/api/attachments/download/7');
  });

  it('sets loading false on error', () => {
    caseSvc.getCase.and.returnValue(throwError(() => new Error('fail')));
    component.ngOnInit();
    expect(component.loading).toBeFalse();
  });

  it('canEdit is true for admin', () => {
    expect(component.canEdit).toBeTrue();
  });

  it('projectTags populated after init', () => {
    expect(component.projectTags).toEqual([mockTag]);
  });

  it('onSave calls updateCase, updateSteps, updateCaseTags', () => {
    caseSvc.updateCase.and.returnValue(of(mockCase));
    caseSvc.updateSteps.and.returnValue(of([]));
    caseSvc.updateCaseTags.and.returnValue(of(undefined));
    component.onSave();
    expect(caseSvc.updateCase).toHaveBeenCalledWith(1, jasmine.anything());
    expect(caseSvc.updateSteps).toHaveBeenCalledWith(1, jasmine.anything());
    expect(caseSvc.updateCaseTags).toHaveBeenCalledWith(1, jasmine.anything());
  });

  it('onSave sets isDirty to false on success', () => {
    caseSvc.updateCase.and.returnValue(of(mockCase));
    caseSvc.updateSteps.and.returnValue(of([]));
    caseSvc.updateCaseTags.and.returnValue(of(undefined));
    component.isDirty = true;
    component.onSave();
    expect(component.isDirty).toBeFalse();
  });

  it('onSave does not call updateCase when form invalid', () => {
    component.form.get('title')?.setValue('');
    component.onSave();
    expect(caseSvc.updateCase).not.toHaveBeenCalled();
  });
});
