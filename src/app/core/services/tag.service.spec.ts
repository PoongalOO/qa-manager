import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TagService } from './tag.service';
import { environment } from '../../../environments/environment';

describe('TagService', () => {
  let service: TagService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(TagService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('should be created', () => expect(service).toBeTruthy());

  it('getTags sends GET /tags?projectId=1', () => {
    service.getTags(1).subscribe();
    const req = http.expectOne(r =>
      r.url === `${environment.apiUrl}/tags` && r.params.get('projectId') === '1'
    );
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('createTag sends POST /tags?projectId=1 with name in body', () => {
    service.createTag(1, 'regression').subscribe();
    const req = http.expectOne(r =>
      r.url === `${environment.apiUrl}/tags` && r.params.get('projectId') === '1'
    );
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ name: 'regression' });
    req.flush({ id: 1, name: 'regression', projectId: 1 });
  });

  it('deleteTag sends DELETE /tags/:id?projectId=1', () => {
    service.deleteTag(5, 1).subscribe();
    const req = http.expectOne(r =>
      r.url === `${environment.apiUrl}/tags/5` && r.params.get('projectId') === '1'
    );
    expect(req.request.method).toBe('DELETE');
    req.flush(null, { status: 204, statusText: 'No Content' });
  });

  it('updateTag sends PUT /tags/:id with name in body', () => {
    service.updateTag(5, 1, 'smoke').subscribe();
    const req = http.expectOne(r =>
      r.url === `${environment.apiUrl}/tags/5` && r.params.get('projectId') === '1'
    );
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ name: 'smoke' });
    req.flush({ id: 5, name: 'smoke', projectId: 1 });
  });
});
