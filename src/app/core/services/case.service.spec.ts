import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { CaseService } from './case.service';
import { Case, CaseListItem, CaseStep } from '../models/case.model';

const API = '/api';

const mockCase: Case = {
  id: 1, title: 'Login test', state: 0, priority: 2, type: 4,
  automationStatus: 0, description: null, template: 0,
  preConditions: null, expectedResults: null, folderId: 1,
};

const mockListItem: CaseListItem = {
  id: 1, title: 'Login test', state: 0, priority: 2, type: 4,
  automationStatus: 0, folderId: 1, createdAt: '', updatedAt: '',
};

describe('CaseService', () => {
  let service: CaseService;
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(CaseService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => { http.verify(); localStorage.clear(); });

  it('should be created', () => expect(service).toBeTruthy());

  it('getCases sends GET /cases?folderId=1', () => {
    service.getCases(1).subscribe(r => expect(r).toEqual([mockListItem]));
    const req = http.expectOne(`${API}/cases?folderId=1`);
    expect(req.request.method).toBe('GET');
    req.flush([mockListItem]);
  });

  it('getCases with search filter adds search param', () => {
    service.getCases(1, { search: 'login' }).subscribe();
    const req = http.expectOne(`${API}/cases?folderId=1&search=login`);
    req.flush([]);
  });

  it('getCases with priority filter adds priority param', () => {
    service.getCases(1, { priority: 2 }).subscribe();
    const req = http.expectOne(`${API}/cases?folderId=1&priority=2`);
    req.flush([]);
  });

  it('getCases with type filter adds type param', () => {
    service.getCases(1, { type: 4 }).subscribe();
    const req = http.expectOne(`${API}/cases?folderId=1&type=4`);
    req.flush([]);
  });

  it('getCases with tag filter adds tag param', () => {
    service.getCases(1, { tag: 3 }).subscribe();
    const req = http.expectOne(`${API}/cases?folderId=1&tag=3`);
    req.flush([]);
  });

  it('getCase sends GET /cases/1', () => {
    service.getCase(1).subscribe(r => expect(r).toEqual(mockCase));
    const req = http.expectOne(`${API}/cases/1`);
    expect(req.request.method).toBe('GET');
    req.flush(mockCase);
  });

  it('createCase sends POST /cases?folderId=1', () => {
    service.createCase(1, { title: 'New case' }).subscribe(r => expect(r).toEqual(mockCase));
    const req = http.expectOne(`${API}/cases?folderId=1`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ title: 'New case' });
    req.flush(mockCase);
  });

  it('updateCase sends PUT /cases/1', () => {
    service.updateCase(1, { title: 'Updated' }).subscribe();
    const req = http.expectOne(`${API}/cases/1`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ title: 'Updated' });
    req.flush(mockCase);
  });

  it('bulkDeleteCases sends POST /cases/bulkdelete', () => {
    service.bulkDeleteCases([1, 2]).subscribe();
    const req = http.expectOne(`${API}/cases/bulkdelete`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ caseIds: [1, 2] });
    req.flush(null);
  });

  it('moveCases sends PUT /cases/move?projectId=1', () => {
    service.moveCases(1, [1, 2], 3).subscribe();
    const req = http.expectOne(`${API}/cases/move?projectId=1`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ caseIds: [1, 2], targetFolderId: 3 });
    req.flush(null);
  });

  it('updateSteps sends POST /steps/update?caseId=1', () => {
    const steps: CaseStep[] = [{ id: 1, step: 'Click', result: 'Success', caseSteps: { stepNo: 1 }, editState: 'changed' }];
    service.updateSteps(1, steps).subscribe();
    const req = http.expectOne(`${API}/steps/update?caseId=1`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(steps);
    req.flush(steps);
  });

  it('updateCaseTags sends POST /casetags/update?caseId=1', () => {
    service.updateCaseTags(1, [2, 3]).subscribe();
    const req = http.expectOne(`${API}/casetags/update?caseId=1`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ tagIds: [2, 3] });
    req.flush(null);
  });

  it('deleteAttachment sends DELETE /attachments/5', () => {
    service.deleteAttachment(5).subscribe();
    const req = http.expectOne(`${API}/attachments/5`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  it('getAttachmentDownloadUrl returns correct URL', () => {
    expect(service.getAttachmentDownloadUrl(7)).toBe(`${API}/attachments/download/7`);
  });
});
