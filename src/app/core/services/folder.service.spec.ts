import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { FolderService } from './folder.service';
import { Folder } from '../models/folder.model';

const API = '/api';

const mockFolder: Folder = {
  id: 1, name: 'Tests', detail: null, projectId: 1,
  parentFolderId: null, createdAt: '', updatedAt: '',
};

describe('FolderService', () => {
  let service: FolderService;
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(FolderService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => { http.verify(); localStorage.clear(); });

  it('should be created', () => expect(service).toBeTruthy());

  it('getFolders sends GET /folders?projectId=1', () => {
    service.getFolders(1).subscribe(r => expect(r).toEqual([mockFolder]));
    const req = http.expectOne(`${API}/folders?projectId=1`);
    expect(req.request.method).toBe('GET');
    req.flush([mockFolder]);
  });

  it('createFolder sends POST /folders?projectId=1', () => {
    service.createFolder(1, 'Tests', 'detail', null).subscribe(r => expect(r).toEqual(mockFolder));
    const req = http.expectOne(`${API}/folders?projectId=1`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ name: 'Tests', detail: 'detail', parentFolderId: null });
    req.flush(mockFolder);
  });

  it('createFolder with parentFolderId sends correct body', () => {
    service.createFolder(1, 'Sub', '', 2).subscribe();
    const req = http.expectOne(`${API}/folders?projectId=1`);
    expect(req.request.body.parentFolderId).toBe(2);
    req.flush(mockFolder);
  });

  it('updateFolder sends PUT /folders/1', () => {
    service.updateFolder(1, 'Tests Updated', 'new detail', 1, null).subscribe(r => expect(r).toEqual(mockFolder));
    const req = http.expectOne(`${API}/folders/1`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ name: 'Tests Updated', detail: 'new detail', projectId: 1, parentFolderId: null });
    req.flush(mockFolder);
  });

  it('deleteFolder sends DELETE /folders/1', () => {
    service.deleteFolder(1).subscribe();
    const req = http.expectOne(`${API}/folders/1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});
