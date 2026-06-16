import { Component, OnInit, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { TranslatePipe } from '@ngx-translate/core';
import { HealthService } from '../../core/services/health.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-health',
  standalone: true,
  imports: [MatCardModule, MatProgressSpinnerModule, MatChipsModule, TranslatePipe],
  template: `
    <div class="health-container">
      <h2>{{ 'Health.health_check' | translate }}</h2>
      <mat-card>
        <mat-card-content>
          <table class="health-table">
            <tr>
              <td class="label">{{ 'Health.version' | translate }}</td>
              <td>1.0.0</td>
            </tr>
            <tr>
              <td class="label">{{ 'Health.api' | translate }}</td>
              <td>{{ apiUrl }}</td>
            </tr>
            <tr>
              <td class="label">{{ 'Health.status' | translate }}</td>
              <td>
                @if (loading) {
                  <mat-spinner diameter="20" />
                } @else {
                  <mat-chip [class]="status === 'ok' ? 'chip-ok' : 'chip-err'">
                    {{ status }}
                  </mat-chip>
                }
              </td>
            </tr>
          </table>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .health-container { padding: 24px; }
    h2 { font-size: 1.3rem; font-weight: 600; margin-bottom: 16px; }
    .health-table { width: 100%; border-collapse: collapse; }
    .health-table tr td { padding: 12px 8px; border-bottom: 1px solid #eee; }
    .label { font-weight: 600; width: 120px; color: #555; }
    .chip-ok { background: #e8f5e9 !important; color: #2e7d32 !important; }
    .chip-err { background: #ffebee !important; color: #c62828 !important; }
  `],
})
export class HealthComponent implements OnInit {
  private healthSvc = inject(HealthService);

  readonly apiUrl = environment.apiUrl;
  status = '';
  loading = true;
  error = false;

  ngOnInit(): void {
    this.healthSvc.getHealth().subscribe({
      next: (res) => { this.status = res.status; this.loading = false; },
      error: () => { this.status = 'error'; this.loading = false; this.error = true; },
    });
  }
}
