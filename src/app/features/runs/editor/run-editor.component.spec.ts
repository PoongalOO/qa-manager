import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { RunEditorComponent } from './run-editor.component';
import { RunService } from '../../../core/services/run.service';
import { FolderService } from '../../../core/services/folder.service';
import { CaseService } from '../../../core/services/case.service';
import { CommentService } from '../../../core/services/comment.service';
import { AuthService } from '../../../core/services/auth.service';
import { Run, CaseWithRunCase, RUN_CASE_STATUSES } from '../../../core/models/run.model';
import { Case } from '../../../core/models/case.model';
import { Comment } from '../../../core/models/comment.model';
import { Folder } from '../../../core/models/folder.model';
import { ROLE_ADMIN } from '../../../core/models/user.model';
import { provideTranslateService } from '@ngx-translate/core';

const mockRun: Run = {
  id: 1, name: 'Sprint 1', description: 'desc', configurations: 0,
  state: 0, projectId: 1, createdAt: '', updatedAt: '',
};

const mockFolder: Folder = {
  id: 1, name: 'Tests', detail: null, projectId: 1,
  parentFolderId: null, createdAt: '', updatedAt: '',
};

const mockCaseNotIncluded: CaseWithRunCase = {
  id: 1, title: 'Login', priority: 2, type: 4, state: 0, folderId: 1, RunCases: [],
};

const mockCaseIncluded: CaseWithRunCase = {
  id: 2, title: 'Logout', priority: 1, type: 0, state: 0, folderId: 1,
  RunCases: [{ id: 10, runId: 1, caseId: 2, status: 0, editState: 'notChanged' }],
};

const mockComment: Comment = {
  id: 1, commentableType: 'RunCase', commentableId: 10, userId: 1,
  content: 'Test comment', createdAt: '2026-06-15T10:00:00Z', updatedAt: '2026-06-15T10:00:00Z',
  User: { id: 1, username: 'admin', email: 'a@a.com' },
};

describe('RunEditorComponent', () => {
  let component: RunEditorComponent;
  let fixture: ComponentFixture<RunEditorComponent>;
  let runSvc: jasmine.SpyObj<RunService>;
  let folderSvc: jasmine.SpyObj<FolderService>;
  let caseSvc: jasmine.SpyObj<CaseService>;
  let commentSvc: jasmine.SpyObj<CommentService>;
  let auth: AuthService;
  let http: HttpTestingController;

  beforeEach(async () => {
    localStorage.clear();
    runSvc = jasmine.createSpyObj('RunService', ['getRun', 'updateRun', 'updateRunCases', 'updateUserResults', 'getProjectCases', 'getRuns', 'getMyRuns']);
    folderSvc = jasmine.createSpyObj('FolderService', ['getFolders', 'createFolder', 'updateFolder', 'deleteFolder']);
    caseSvc = jasmine.createSpyObj('CaseService', ['getCase', 'getCases', 'createCase', 'updateCase', 'deleteCase']);
    commentSvc = jasmine.createSpyObj('CommentService', ['getComments', 'addComment', 'deleteComment']);

    runSvc.getRun.and.returnValue(of({ run: mockRun, statusCounts: [{ status: 0, count: '2' }] }));
    folderSvc.getFolders.and.returnValue(of([mockFolder]));
    runSvc.getProjectCases.and.returnValue(of([mockCaseNotIncluded, mockCaseIncluded]));
    commentSvc.getComments.and.returnValue(of([]));
    commentSvc.addComment.and.returnValue(of(mockComment));
    commentSvc.deleteComment.and.returnValue(of(undefined));

    await TestBed.configureTestingModule({
      imports: [RunEditorComponent, NoopAnimationsModule],
      providers: [
        ...provideTranslateService({ fallbackLang: 'fr' }),
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: RunService, useValue: runSvc },
        { provide: FolderService, useValue: folderSvc },
        { provide: CaseService, useValue: caseSvc },
        { provide: CommentService, useValue: commentSvc },
      ],
    }).compileComponents();

    auth = TestBed.inject(AuthService);
    auth['_token'].set({
      access_token: 'tok', expires_at: Date.now() + 3_600_000,
      user: { id: 1, email: 'a@a.com', username: 'admin', role: ROLE_ADMIN, avatarPath: null, locale: null, createdAt: '', updatedAt: '' },
    });

    http = TestBed.inject(HttpTestingController);
    http.match(r => r.url.includes('/me/roles')).forEach(r => r.flush([]));

    fixture = TestBed.createComponent(RunEditorComponent);
    component = fixture.componentInstance;
    component.projectId = '1';
    component.runId = '1';
    fixture.detectChanges();
  });

  afterEach(() => { http.verify(); localStorage.clear(); });

  it('should create', () => expect(component).toBeTruthy());

  it('loads run on init', () => {
    expect(runSvc.getRun).toHaveBeenCalledWith(1);
  });

  it('loads folders on init', () => {
    expect(folderSvc.getFolders).toHaveBeenCalledWith(1);
  });

  it('loads project cases on init', () => {
    expect(runSvc.getProjectCases).toHaveBeenCalledWith(1, 1);
  });

  it('sets loading false after data loads', () => {
    expect(component.loading).toBeFalse();
  });

  it('populates run', () => {
    expect(component.run).toEqual(mockRun);
  });

  it('populates allCases', () => {
    expect(component.allCases.length).toBe(2);
  });

  it('sets form name from run', () => {
    expect(component.form.get('name')?.value).toBe('Sprint 1');
  });

  it('sets loading false on error', () => {
    runSvc.getRun.and.returnValue(throwError(() => new Error('fail')));
    component.loadData();
    expect(component.loading).toBeFalse();
  });

  it('canManage is true for admin', () => {
    expect(component.canManage).toBeTrue();
  });

  it('canReport is true for admin', () => {
    expect(component.canReport).toBeTrue();
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
    component.markDirty();
    expect(component.isDirty).toBeTrue();
  });

  it('isIncluded returns true when RunCases is not empty and not deleted', () => {
    expect(component.isIncluded(mockCaseIncluded)).toBeTrue();
  });

  it('isIncluded returns false when RunCases is empty', () => {
    expect(component.isIncluded(mockCaseNotIncluded)).toBeFalse();
  });

  it('isIncluded returns false when RunCases editState is deleted', () => {
    const c: CaseWithRunCase = { ...mockCaseIncluded, RunCases: [{ ...mockCaseIncluded.RunCases[0], editState: 'deleted' }] };
    expect(component.isIncluded(c)).toBeFalse();
  });

  it('getRunCaseStatus returns status from current user RunCaseResult', () => {
    const c: CaseWithRunCase = {
      ...mockCaseIncluded,
      RunCases: [{ id: 10, runId: 1, caseId: 2, status: 0, editState: 'notChanged',
        RunCaseResults: [{ id: 1, runCaseId: 10, userId: 1, status: 3 }] }],
    };
    expect(component.getRunCaseStatus(c)).toBe(3);
  });

  it('getRunCaseStatus returns 0 when no RunCaseResult for current user', () => {
    const c: CaseWithRunCase = { ...mockCaseIncluded, RunCases: [{ id: 10, runId: 1, caseId: 2, status: 0, editState: 'notChanged', RunCaseResults: [] }] };
    expect(component.getRunCaseStatus(c)).toBe(0);
  });

  it('changeStatus upserts RunCaseResult and tracks change', () => {
    const c: CaseWithRunCase = { ...mockCaseIncluded, RunCases: [{ id: 10, runId: 1, caseId: 2, status: 0, editState: 'notChanged', RunCaseResults: [] }] };
    component.changeStatus(c, 2);
    const result = c.RunCases[0].RunCaseResults?.find(r => r.userId === 1);
    expect(result?.status).toBe(2);
    expect(component.userResultChanges.get(10)).toBe(2);
    expect(component.isDirty).toBeTrue();
  });

  it('changeStatus does nothing for non-included cases', () => {
    component.changeStatus(mockCaseNotIncluded, 2);
    expect(component.isDirty).toBeFalse();
  });

  it('selectFolder shows only included cases for the folder', () => {
    component.allCases = [mockCaseNotIncluded, mockCaseIncluded];
    component.selectFolder({ id: 1 });
    expect(component.filteredCases.length).toBe(1);
    expect(component.filteredCases[0].id).toBe(mockCaseIncluded.id);
  });

  it('totalIncluded counts included cases', () => {
    component.allCases = [mockCaseNotIncluded, mockCaseIncluded];
    expect(component.totalIncluded).toBe(1);
  });

  it('getPriorityLabel returns correct label', () => {
    expect(component.getPriorityLabel(0)).toBe('Critique');
    expect(component.getPriorityLabel(3)).toBe('Basse');
  });

  it('onSave calls updateRun and updateRunCases for manager', () => {
    runSvc.updateRun.and.returnValue(of(mockRun));
    runSvc.updateRunCases.and.returnValue(of([]));
    component.onSave();
    expect(runSvc.updateRun).toHaveBeenCalledWith(1, jasmine.anything());
    expect(runSvc.updateRunCases).toHaveBeenCalledWith(1, jasmine.anything());
  });

  it('onSave calls updateUserResults when there are result changes', () => {
    runSvc.updateRun.and.returnValue(of(mockRun));
    runSvc.updateRunCases.and.returnValue(of([]));
    runSvc.updateUserResults.and.returnValue(of([]));
    component.userResultChanges.set(10, 2);
    component.onSave();
    expect(runSvc.updateUserResults).toHaveBeenCalledWith(1, [{ runCaseId: 10, status: 2 }]);
  });

  it('onSave sets isDirty to false on success', () => {
    runSvc.updateRun.and.returnValue(of(mockRun));
    runSvc.updateRunCases.and.returnValue(of([]));
    component.isDirty = true;
    component.onSave();
    expect(component.isDirty).toBeFalse();
  });

  it('onSave clears userResultChanges on success', () => {
    runSvc.updateRun.and.returnValue(of(mockRun));
    runSvc.updateRunCases.and.returnValue(of([]));
    runSvc.updateUserResults.and.returnValue(of([]));
    component.userResultChanges.set(10, 1);
    component.onSave();
    expect(component.userResultChanges.size).toBe(0);
  });

  it('getFolderIncludedCount returns count of included cases per folder', () => {
    component.allCases = [mockCaseNotIncluded, mockCaseIncluded];
    expect(component.getFolderIncludedCount(1)).toBe(1);
  });

  it('getPriorityColor returns correct hex for known index', () => {
    expect(component.getPriorityColor(0)).toBe('#bb3e03');
    expect(component.getPriorityColor(3)).toBe('#94d2bd');
  });

  it('getPriorityColor returns fallback for unknown index', () => {
    expect(component.getPriorityColor(99)).toBe('#ccc');
  });

  it('openCaseDetail sets selectedCaseId and loads case', () => {
    const mockCase: Case = {
      id: 5, title: 'Test', state: 0, priority: 0, type: 0, automationStatus: 0,
      description: 'desc', template: 0, preConditions: null, expectedResults: null, folderId: 1,
    };
    caseSvc.getCase.and.returnValue(of(mockCase));
    component.openCaseDetail(5);
    expect(component.selectedCaseId).toBe(5);
    expect(component.selectedCaseDetail).toEqual(mockCase);
    expect(component.caseDetailLoading).toBeFalse();
  });

  it('openCaseDetail toggles closed when same case is clicked again', () => {
    component.selectedCaseId = 5;
    component.openCaseDetail(5);
    expect(component.selectedCaseId).toBeNull();
    expect(component.selectedCaseDetail).toBeNull();
  });

  it('sortedDetailSteps returns empty array when no case selected', () => {
    component.selectedCaseDetail = null;
    expect(component.sortedDetailSteps).toEqual([]);
  });

  // Comments tab tests
  it('selectedRunCaseId returns null when no case selected', () => {
    component.selectedCaseId = null;
    expect(component.selectedRunCaseId).toBeNull();
  });

  it('selectedRunCaseId returns null when selected case is not included', () => {
    component.selectedCaseId = 1;
    component.allCases = [mockCaseNotIncluded, mockCaseIncluded];
    expect(component.selectedRunCaseId).toBeNull();
  });

  it('selectedRunCaseId returns RunCase id when case is included', () => {
    component.selectedCaseId = 2;
    component.allCases = [mockCaseNotIncluded, mockCaseIncluded];
    expect(component.selectedRunCaseId).toBe(10);
  });

  it('setDetailTab switches active tab', () => {
    component.setDetailTab('comments');
    expect(component.activeDetailTab).toBe('comments');
  });

  it('setDetailTab to comments loads comments for included case', () => {
    component.selectedCaseId = 2;
    component.allCases = [mockCaseNotIncluded, mockCaseIncluded];
    commentSvc.getComments.and.returnValue(of([mockComment]));
    component.setDetailTab('comments');
    expect(commentSvc.getComments).toHaveBeenCalledWith('RunCase', 10, 1); // passes effectiveViewUserId
    expect(component.comments).toEqual([mockComment]);
    expect(component.commentsLoading).toBeFalse();
  });

  it('setDetailTab to comments does nothing if case not included', () => {
    component.selectedCaseId = 1;
    component.allCases = [mockCaseNotIncluded, mockCaseIncluded];
    component.setDetailTab('comments');
    expect(commentSvc.getComments).not.toHaveBeenCalled();
  });

  it('setDetailTab to comments skips fetch when already loaded for same runCase', () => {
    component.selectedCaseId = 2;
    component.allCases = [mockCaseNotIncluded, mockCaseIncluded];
    component.commentsLoadedForId = 10;
    component.setDetailTab('comments');
    expect(commentSvc.getComments).not.toHaveBeenCalled();
  });

  it('submitComment calls addComment and appends to list', () => {
    component.selectedCaseId = 2;
    component.allCases = [mockCaseNotIncluded, { ...mockCaseIncluded,
      RunCases: [{ id: 10, runId: 1, caseId: 2, status: 0, editState: 'notChanged', commentCount: 0 }] }];
    component.commentText = 'My remark';
    commentSvc.addComment.and.returnValue(of(mockComment));
    component.submitComment();
    expect(commentSvc.addComment).toHaveBeenCalledWith('RunCase', 10, 'My remark');
    expect(component.comments).toContain(mockComment);
    expect(component.commentText).toBe('');
    expect(component.commentSubmitting).toBeFalse();
  });

  it('submitComment increments commentCount on the case', () => {
    component.selectedCaseId = 2;
    component.allCases = [mockCaseNotIncluded, { ...mockCaseIncluded,
      RunCases: [{ id: 10, runId: 1, caseId: 2, status: 0, editState: 'notChanged', commentCount: 1 }] }];
    component.commentText = 'new comment';
    commentSvc.addComment.and.returnValue(of(mockComment));
    component.submitComment();
    expect(component.allCases[1].RunCases[0].commentCount).toBe(2);
  });

  it('submitComment does nothing when commentText is empty', () => {
    component.selectedCaseId = 2;
    component.allCases = [mockCaseNotIncluded, mockCaseIncluded];
    component.commentText = '   ';
    component.submitComment();
    expect(commentSvc.addComment).not.toHaveBeenCalled();
  });

  it('deleteComment removes comment from list', () => {
    component.selectedCaseId = 2;
    component.allCases = [mockCaseNotIncluded, { ...mockCaseIncluded,
      RunCases: [{ id: 10, runId: 1, caseId: 2, status: 0, editState: 'notChanged', commentCount: 1 }] }];
    component.comments = [mockComment];
    commentSvc.deleteComment.and.returnValue(of(undefined));
    component.deleteComment(1);
    expect(component.comments.length).toBe(0);
  });

  it('deleteComment decrements commentCount on the case', () => {
    component.selectedCaseId = 2;
    component.allCases = [mockCaseNotIncluded, { ...mockCaseIncluded,
      RunCases: [{ id: 10, runId: 1, caseId: 2, status: 0, editState: 'notChanged', commentCount: 3 }] }];
    component.comments = [mockComment];
    commentSvc.deleteComment.and.returnValue(of(undefined));
    component.deleteComment(1);
    expect(component.allCases[1].RunCases[0].commentCount).toBe(2);
  });

  it('currentUserId returns current user id', () => {
    expect(component.currentUserId).toBe(1);
  });

  // Status counts from RunCaseResults
  it('getMyStatusCount counts current user results by status', () => {
    component.allCases = [
      { ...mockCaseIncluded, RunCases: [{ id: 10, runId: 1, caseId: 2, status: 0, editState: 'notChanged',
          RunCaseResults: [{ id: 1, runCaseId: 10, userId: 1, status: 1 }] }] },
    ];
    expect(component.getMyStatusCount(1)).toBe(1); // 1 "Passé"
    expect(component.getMyStatusCount(0)).toBe(0); // 0 "Non testé"
  });

  it('getMyStatusCount counts untouched included cases as Non testé', () => {
    component.allCases = [
      { ...mockCaseIncluded, RunCases: [{ id: 10, runId: 1, caseId: 2, status: 0, editState: 'notChanged',
          RunCaseResults: [] }] },
    ];
    expect(component.getMyStatusCount(0)).toBe(1); // 1 untouched = "Non testé"
  });

  // testerStats for managers
  it('testerStats returns empty array when no RunCaseResults', () => {
    component.allCases = [
      { ...mockCaseIncluded, RunCases: [{ id: 10, runId: 1, caseId: 2, status: 0, editState: 'notChanged', RunCaseResults: [] }] },
    ];
    expect(component.testerStats.length).toBe(0);
  });

  it('testerStats aggregates per-user results', () => {
    component.allCases = [
      { ...mockCaseIncluded, RunCases: [{ id: 10, runId: 1, caseId: 2, status: 0, editState: 'notChanged',
          RunCaseResults: [
            { id: 1, runCaseId: 10, userId: 1, status: 1, User: { id: 1, username: 'alice' } },
            { id: 2, runCaseId: 10, userId: 2, status: 2, User: { id: 2, username: 'bob' } },
          ] }] },
    ];
    const stats = component.testerStats;
    expect(stats.length).toBe(2);
    const alice = stats.find(s => s.username === 'alice')!;
    expect(alice.counts[1]).toBe(1); // 1 "Passé"
    expect(alice.total).toBe(1);
    const bob = stats.find(s => s.username === 'bob')!;
    expect(bob.counts[2]).toBe(1); // 1 "Échoué"
  });

  // Config mode
  it('toggleConfigMode enters config mode and shows all cases in folder', () => {
    component.allCases = [mockCaseNotIncluded, mockCaseIncluded];
    component.selectFolder({ id: 1 }); // only included shown normally
    expect(component.filteredCases.length).toBe(1);
    component.toggleConfigMode();
    expect(component.configMode).toBeTrue();
    expect(component.filteredCases.length).toBe(2); // all cases shown
  });

  it('toggleConfigMode exits config mode and filters back to included only', () => {
    component.allCases = [mockCaseNotIncluded, mockCaseIncluded];
    component.toggleConfigMode(); // enter
    component.toggleConfigMode(); // exit
    expect(component.configMode).toBeFalse();
    expect(component.filteredCases.length).toBe(1);
  });

  it('displayedColumns returns config columns in config mode', () => {
    component.configMode = true;
    expect(component.displayedColumns).toContain('select');
    expect(component.displayedColumns).not.toContain('status');
  });

  it('displayedColumns returns exec columns in normal mode', () => {
    component.configMode = false;
    expect(component.displayedColumns).toContain('status');
    expect(component.displayedColumns).not.toContain('select');
  });

  it('toggleInclusion adds new RunCase for non-included case', () => {
    const c = { ...mockCaseNotIncluded };
    component.toggleInclusion(c);
    expect(c.RunCases.length).toBe(1);
    expect(c.RunCases[0].editState).toBe('new');
    expect(component.isDirty).toBeTrue();
  });

  it('toggleInclusion marks included case as deleted', () => {
    const c: CaseWithRunCase = { ...mockCaseIncluded,
      RunCases: [{ id: 10, runId: 1, caseId: 2, status: 0, editState: 'notChanged' }] };
    component.toggleInclusion(c);
    expect(c.RunCases[0].editState).toBe('deleted');
  });

  it('toggleInclusion restores deleted case', () => {
    const c: CaseWithRunCase = { ...mockCaseIncluded,
      RunCases: [{ id: 10, runId: 1, caseId: 2, status: 0, editState: 'deleted' }] };
    component.toggleInclusion(c);
    expect(c.RunCases[0].editState).toBe('notChanged');
  });

  it('toggleInclusion cancels unsaved new inclusion', () => {
    const c: CaseWithRunCase = { ...mockCaseNotIncluded,
      RunCases: [{ id: 0, runId: 1, caseId: 1, status: 0, editState: 'new' }] };
    component.toggleInclusion(c);
    expect(c.RunCases.length).toBe(0);
  });

  // Tester view selection
  it('selectTesterView sets viewTesterUserId and username', () => {
    component.selectTesterView(42, 'alice');
    expect(component.viewTesterUserId).toBe(42);
    expect(component.viewTesterUsername).toBe('alice');
  });

  it('selectTesterView toggles off when same tester selected again', () => {
    component.selectTesterView(42, 'alice');
    component.selectTesterView(42, 'alice');
    expect(component.viewTesterUserId).toBeNull();
  });

  it('selectTesterView resets comments so they reload with new viewUserId', () => {
    component.commentsLoadedForId = 10;
    component.comments = [mockComment];
    component.selectTesterView(42, 'alice');
    expect(component.commentsLoadedForId).toBeNull();
    expect(component.comments.length).toBe(0);
  });

  it('clearTesterView resets to current user view', () => {
    component.viewTesterUserId = 42;
    component.viewTesterUsername = 'alice';
    component.clearTesterView();
    expect(component.viewTesterUserId).toBeNull();
    expect(component.viewTesterUsername).toBeNull();
  });

  it('clearTesterView resets comments so they reload with own viewUserId', () => {
    component.viewTesterUserId = 42;
    component.commentsLoadedForId = 10;
    component.comments = [mockComment];
    component.clearTesterView();
    expect(component.commentsLoadedForId).toBeNull();
    expect(component.comments.length).toBe(0);
  });

  it('isViewingOtherTester is false when viewTesterUserId is null', () => {
    component.viewTesterUserId = null;
    expect(component.isViewingOtherTester).toBeFalse();
  });

  it('isViewingOtherTester is false when viewing own results', () => {
    component.viewTesterUserId = 1; // currentUserId = 1
    expect(component.isViewingOtherTester).toBeFalse();
  });

  it('isViewingOtherTester is true when viewing another tester', () => {
    component.viewTesterUserId = 99;
    expect(component.isViewingOtherTester).toBeTrue();
  });

  it('effectiveViewUserId falls back to currentUserId when no tester selected', () => {
    component.viewTesterUserId = null;
    expect(component.effectiveViewUserId).toBe(1);
  });

  it('getRunCaseStatus returns selected tester result when viewing another tester', () => {
    component.viewTesterUserId = 99;
    const c: CaseWithRunCase = {
      ...mockCaseIncluded,
      RunCases: [{ id: 10, runId: 1, caseId: 2, status: 0, editState: 'notChanged',
        RunCaseResults: [
          { id: 1, runCaseId: 10, userId: 1, status: 1 },
          { id: 2, runCaseId: 10, userId: 99, status: 3 },
        ] }],
    };
    expect(component.getRunCaseStatus(c)).toBe(3); // tester 99's result
  });

  it('getMyStatusCount counts for effective view user', () => {
    component.viewTesterUserId = 99;
    component.allCases = [
      { ...mockCaseIncluded, RunCases: [{ id: 10, runId: 1, caseId: 2, status: 0, editState: 'notChanged',
          RunCaseResults: [{ id: 2, runCaseId: 10, userId: 99, status: 2 }] }] },
    ];
    expect(component.getMyStatusCount(2)).toBe(1);
    expect(component.getMyStatusCount(1)).toBe(0);
  });

  it('testerStats adds untouched cases to Non testé count', () => {
    const extra: CaseWithRunCase = { id: 99, title: 'Extra', priority: 0, type: 0, state: 0, folderId: 1,
      RunCases: [{ id: 20, runId: 1, caseId: 99, status: 0, editState: 'notChanged', RunCaseResults: [] }] };
    component.allCases = [
      { ...mockCaseIncluded, RunCases: [{ id: 10, runId: 1, caseId: 2, status: 0, editState: 'notChanged',
          RunCaseResults: [{ id: 1, runCaseId: 10, userId: 1, status: 1, User: { id: 1, username: 'alice' } }] }] },
      extra,
    ];
    const stats = component.testerStats;
    const alice = stats.find(s => s.username === 'alice')!;
    // total = 2 included, alice touched 1 => Non testé += 1 (untouched extra case)
    expect(alice.counts[0]).toBe(1);
    expect(alice.counts[1]).toBe(1);
    expect(alice.total).toBe(2);
  });
});
