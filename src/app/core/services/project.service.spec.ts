import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ProjectService } from './project.service';
import { environment } from '../../../environments/environment';

describe('ProjectService', () => {
  let service: ProjectService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ProjectService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('should be created', () => expect(service).toBeTruthy());

  it('getMyProjects sends GET /projects with onlyUserProjects=true', () => {
    service.getMyProjects().subscribe();
    const req = http.expectOne(r =>
      r.url === `${environment.apiUrl}/projects` &&
      r.params.get('onlyUserProjects') === 'true'
    );
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('getProjects sends GET /projects without filter', () => {
    service.getProjects().subscribe();
    const req = http.expectOne(r =>
      r.url === `${environment.apiUrl}/projects` &&
      !r.params.has('onlyUserProjects')
    );
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });
});
