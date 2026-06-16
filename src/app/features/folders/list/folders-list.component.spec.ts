import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { FoldersListComponent } from './folders-list.component';
import { FolderService } from '../../../core/services/folder.service';
import { CaseService } from '../../../core/services/case.service';
import { TagService } from '../../../core/services/tag.service';
import { AuthService } from '../../../core/services/auth.service';
import { Folder } from '../../../core/models/folder.model';
import { CaseListItem } from '../../../core/models/case.model';
import { Tag } from '../../../core/models/project.model';
import { ROLE_ADMIN } from '../../../core/models/user.model';
import { provideTranslateService } from '@ngx-translate/core';

const mockFolder: Folder = {
  id: 1, name: 'Tests', detail: null, projectId: 1,
  parentFolderId: null, createdAt: '', updatedAt: '',
};

const mockCase: CaseListItem = {
  id: 1, title: 'Login test', state: 0, priority: 2, type: 4,
  automationStatus: 0, folderId: 1, createdAt: '', updatedAt: '',
};

const mockTag: Tag = { id: 1, name: 'regression', projectId: 1 };

describe('FoldersListComponent', () => {
  let component: FoldersListComponent;
  let fixture: ComponentFixture<FoldersListComponent>;
  let folderSvc: jasmine.SpyObj<FolderService>;
  let caseSvc: jasmine.SpyObj<CaseService>;
  let tagSvc: jasmine.SpyObj<TagService>;
  let auth: AuthService;
  let http: HttpTestingController;

  beforeEach(async () => {
    localStorage.clear();
    folderSvc = jasmine.createSpyObj('FolderService', ['getFolders', 'createFolder', 'updateFolder', 'deleteFolder']);
    caseSvc = jasmine.createSpyObj('CaseService', ['getCases', 'createCase', 'bulkDeleteCases', 'moveCases', 'updateSteps', 'updateCaseTags', 'deleteAttachment', 'getAttachmentDownloadUrl']);
    tagSvc = jasmine.createSpyObj('TagService', ['getTags']);

    folderSvc.getFolders.and.returnValue(of([mockFolder]));
    caseSvc.getCases.and.returnValue(of([mockCase]));
    tagSvc.getTags.and.returnValue(of([mockTag]));

    await TestBed.configureTestingModule({
      imports: [FoldersListComponent, NoopAnimationsModule],
      providers: [
        ...provideTranslateService({ fallbackLang: 'fr' }),
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: FolderService, useValue: folderSvc },
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

    fixture = TestBed.createComponent(FoldersListComponent);
    component = fixture.componentInstance;
    component.projectId = '1';
    component.folderId = '1';
    fixture.detectChanges();
  });

  afterEach(() => { http.verify(); localStorage.clear(); });

  it('should create', () => expect(component).toBeTruthy());

  it('loads folders on init', () => {
    expect(folderSvc.getFolders).toHaveBeenCalledWith(1);
  });

  it('loads tags on init', () => {
    expect(tagSvc.getTags).toHaveBeenCalledWith(1);
  });

  it('loads cases when folderId is set', () => {
    expect(caseSvc.getCases).toHaveBeenCalledWith(1, jasmine.anything());
  });

  it('sets loading false after folders load', () => {
    expect(component.loading).toBeFalse();
  });

  it('populates folders', () => {
    expect(component.folders).toEqual([mockFolder]);
  });

  it('populates projectTags', () => {
    expect(component.projectTags).toEqual([mockTag]);
  });

  it('populates cases', () => {
    expect(component.cases).toEqual([mockCase]);
  });

  it('sets selectedFolderId from folderId input', () => {
    expect(component.selectedFolderId).toBe(1);
  });

  it('getPriorityLabel returns correct label', () => {
    expect(component.getPriorityLabel(0)).toBe('Critique');
    expect(component.getPriorityLabel(2)).toBe('Moyenne');
    expect(component.getPriorityLabel(3)).toBe('Basse');
  });

  it('getTypeLabel returns correct label', () => {
    expect(component.getTypeLabel(0)).toBe('Autre');
    expect(component.getTypeLabel(4)).toBe('Fonctionnel');
  });

  it('toggleSelect adds caseId to selectedCaseIds', () => {
    component.toggleSelect(1);
    expect(component.selectedCaseIds.has(1)).toBeTrue();
  });

  it('toggleSelect removes caseId if already selected', () => {
    component.selectedCaseIds.add(1);
    component.toggleSelect(1);
    expect(component.selectedCaseIds.has(1)).toBeFalse();
  });

  it('toggleSelectAll selects all cases', () => {
    component.toggleSelectAll(true);
    expect(component.selectedCaseIds.size).toBe(1);
    expect(component.selectedCaseIds.has(1)).toBeTrue();
  });

  it('toggleSelectAll deselects all cases', () => {
    component.selectedCaseIds.add(1);
    component.toggleSelectAll(false);
    expect(component.selectedCaseIds.size).toBe(0);
  });

  it('allSelected is true when all cases selected', () => {
    component.toggleSelectAll(true);
    expect(component.allSelected).toBeTrue();
  });

  it('someSelected is true when at least one case selected', () => {
    component.toggleSelect(1);
    expect(component.someSelected).toBeTrue();
  });

  it('canEdit is true for admin', () => {
    expect(component.canEdit).toBeTrue();
  });

  it('sets loading false on folder load error', () => {
    folderSvc.getFolders.and.returnValue(throwError(() => new Error('fail')));
    tagSvc.getTags.and.returnValue(throwError(() => new Error('fail')));
    component.loadFolders();
    expect(component.loading).toBeFalse();
  });

  it('loadCases sets loadingCases false after cases load', () => {
    component.loadCases();
    expect(component.loadingCases).toBeFalse();
  });

  it('loadCases sets loadingCases false on error', () => {
    caseSvc.getCases.and.returnValue(throwError(() => new Error('fail')));
    component.loadCases();
    expect(component.loadingCases).toBeFalse();
  });

  it('onCaseDragStart sets draggedCaseIds with selected cases', () => {
    component.selectedCaseIds.add(1);
    const event = { dataTransfer: { setData: jasmine.createSpy() } } as unknown as DragEvent;
    component.onCaseDragStart(event, 1);
    expect(component.draggedCaseIds).toEqual([1]);
  });

  it('onCaseDragStart uses single caseId when not in selection', () => {
    const event = { dataTransfer: { setData: jasmine.createSpy() } } as unknown as DragEvent;
    component.onCaseDragStart(event, 5);
    expect(component.draggedCaseIds).toEqual([5]);
  });
});
