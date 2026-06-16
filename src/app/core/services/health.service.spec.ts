import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { HealthService } from './health.service';

const API = '/api';

describe('HealthService', () => {
  let service: HealthService;
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(HealthService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => { http.verify(); localStorage.clear(); });

  it('should be created', () => expect(service).toBeTruthy());

  it('getHealth sends GET /health', () => {
    service.getHealth().subscribe(r => expect(r).toEqual({ status: 'ok' }));
    const req = http.expectOne(`${API}/health`);
    expect(req.request.method).toBe('GET');
    req.flush({ status: 'ok' });
  });
});
