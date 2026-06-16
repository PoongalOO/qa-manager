import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class HealthService {
  private http = inject(HttpClient);
  private api = environment.apiUrl;

  getHealth(): Observable<{ status: string }> {
    return this.http.get<{ status: string }>(`${this.api}/health`);
  }
}
