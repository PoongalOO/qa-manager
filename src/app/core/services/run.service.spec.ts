import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { RunService } from './run.service';
import { Run, RunCase, CaseWithRunCase } from '../models/run.model';

const API = '/api';

const mockRun: Run = {
  id: 1, name: 'Sprint 1', description: 'desc', configurations: 0,
  state: 0, projectId: 1, createdAt: '', updatedAt: '',
};

const mockCase: CaseWithRunCase = {
  id: 1, title: 'Login', priority: 2, type: 4, state: 0, folderId: 1, RunCases: [],
};

describe('RunService', () => {
  let service: RunService;
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(RunService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => { http.verify(); localStorage.clear(); });

  it('should be created', () => expect(service).toBeTruthy());

  it('getMyRuns sends GET /runs/my', () => {
    service.getMyRuns().subscribe();
    const req = http.expectOne(`${API}/runs/my`);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('getRuns sends GET /runs?projectId=1', () => {
    service.getRuns(1).subscribe(r => expect(r).toEqual([mockRun]));
    const req = http.expectOne(`${API}/runs?projectId=1`);
    expect(req.request.method).toBe('GET');
    req.flush([mockRun]);
  });

  it('getRun sends GET /runs/1', () => {
    service.getRun(1).subscribe(r => expect(r.run).toEqual(mockRun));
    const req = http.expectOne(`${API}/runs/1`);
    expect(req.request.method).toBe('GET');
    req.flush({ run: mockRun, statusCounts: [] });
  });

  it('createRun sends POST /runs?projectId=1', () => {
    service.createRun(1, 'Sprint 1', 'desc').subscribe(r => expect(r).toEqual(mockRun));
    const req = http.expectOne(`${API}/runs?projectId=1`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ name: 'Sprint 1', description: 'desc', configurations: 0, state: 0 });
    req.flush(mockRun);
  });

  it('updateRun sends PUT /runs/1', () => {
    service.updateRun(1, { name: 'Updated' }).subscribe();
    const req = http.expectOne(`${API}/runs/1`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ name: 'Updated' });
    req.flush(mockRun);
  });

  it('deleteRun sends DELETE /runs/1', () => {
    service.deleteRun(1).subscribe();
    const req = http.expectOne(`${API}/runs/1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  it('getProjectCases sends GET /cases/byproject?projectId=1&runId=1', () => {
    service.getProjectCases(1, 1).subscribe(r => expect(r).toEqual([mockCase]));
    const req = http.expectOne(`${API}/cases/byproject?projectId=1&runId=1`);
    expect(req.request.method).toBe('GET');
    req.flush([mockCase]);
  });

  it('getProjectCases with search filter adds search param', () => {
    service.getProjectCases(1, 1, { search: 'login' }).subscribe();
    const req = http.expectOne(`${API}/cases/byproject?projectId=1&runId=1&search=login`);
    req.flush([]);
  });

  it('getProjectCases with status filter adds status param', () => {
    service.getProjectCases(1, 1, { status: [0, 2] }).subscribe();
    const req = http.expectOne(`${API}/cases/byproject?projectId=1&runId=1&status=0,2`);
    req.flush([]);
  });

  it('getProjectCases with tag filter adds tag param', () => {
    service.getProjectCases(1, 1, { tag: [3] }).subscribe();
    const req = http.expectOne(`${API}/cases/byproject?projectId=1&runId=1&tag=3`);
    req.flush([]);
  });

  it('getProjectCases with viewUserId adds viewUserId param', () => {
    service.getProjectCases(1, 1, {}, 42).subscribe();
    const req = http.expectOne(`${API}/cases/byproject?projectId=1&runId=1&viewUserId=42`);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('updateRunCases sends POST /runcases/update?runId=1', () => {
    const rc: RunCase[] = [{ id: 1, runId: 1, caseId: 1, status: 1, editState: 'changed' }];
    service.updateRunCases(1, rc).subscribe();
    const req = http.expectOne(`${API}/runcases/update?runId=1`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(rc);
    req.flush(rc);
  });

  it('updateUserResults sends POST /runcases/myresults?runId=1', () => {
    const results = [{ runCaseId: 10, status: 2 }];
    service.updateUserResults(1, results).subscribe();
    const req = http.expectOne(`${API}/runcases/myresults?runId=1`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(results);
    req.flush([]);
  });
});
