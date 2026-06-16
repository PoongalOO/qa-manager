import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { MemberService } from './member.service';
import { environment } from '../../../environments/environment';

describe('MemberService', () => {
  let service: MemberService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(MemberService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('should be created', () => expect(service).toBeTruthy());

  it('getMembers sends GET /members?projectId=1', () => {
    service.getMembers(1).subscribe();
    const req = http.expectOne(r =>
      r.url === `${environment.apiUrl}/members` && r.params.get('projectId') === '1'
    );
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('addMember sends POST /members with userId and projectId params', () => {
    service.addMember(42, 1).subscribe();
    const req = http.expectOne(r =>
      r.url === `${environment.apiUrl}/members` &&
      r.params.get('userId') === '42' && r.params.get('projectId') === '1'
    );
    expect(req.request.method).toBe('POST');
    req.flush({ id: 1, userId: 42, projectId: 1, role: 2 });
  });

  it('updateMemberRole sends PUT /members with correct params', () => {
    service.updateMemberRole(42, 1, 1).subscribe();
    const req = http.expectOne(r =>
      r.url === `${environment.apiUrl}/members` &&
      r.params.get('userId') === '42' && r.params.get('role') === '1'
    );
    expect(req.request.method).toBe('PUT');
    req.flush({ id: 1, userId: 42, projectId: 1, role: 1 });
  });

  it('deleteMember sends DELETE /members with correct params', () => {
    service.deleteMember(42, 1).subscribe();
    const req = http.expectOne(r =>
      r.url === `${environment.apiUrl}/members` &&
      r.params.get('userId') === '42' && r.params.get('projectId') === '1'
    );
    expect(req.request.method).toBe('DELETE');
    req.flush(null, { status: 204, statusText: 'No Content' });
  });

  it('searchUsers sends GET /users/search with projectId', () => {
    service.searchUsers(1).subscribe();
    const req = http.expectOne(r =>
      r.url === `${environment.apiUrl}/users/search` && r.params.get('projectId') === '1'
    );
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('searchUsers includes search param when provided', () => {
    service.searchUsers(1, 'alice').subscribe();
    const req = http.expectOne(r =>
      r.url === `${environment.apiUrl}/users/search` && r.params.get('search') === 'alice'
    );
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });
});
