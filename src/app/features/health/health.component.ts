import { Component, OnInit, inject } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslatePipe } from '@ngx-translate/core';
import { HealthService } from '../../core/services/health.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-health',
  standalone: true,
  imports: [MatProgressSpinnerModule, TranslatePipe],
  template: `
    <div class="health-container anim-page">
      <h2>{{ 'Health.health_check' | translate }}</h2>
      <div class="card-surface health-card">
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
                <span class="status-chip" [class.chip-ok]="status === 'ok'" [class.chip-err]="status !== 'ok'">
                  {{ status }}
                </span>
              }
            </td>
          </tr>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .health-container { padding: 24px; }
    h2 { font-size: 1.4rem; font-weight: 700; margin-bottom: 20px; letter-spacing: -0.01em; }
    .health-card { padding: 8px 20px; }
    .health-table { width: 100%; border-collapse: collapse; }
    .health-table tr td { padding: 12px 8px; border-bottom: 1px solid var(--border); }
    .health-table tr:last-child td { border-bottom: none; }
    .label { font-weight: 600; width: 120px; color: var(--text-secondary); }
    .status-chip { display: inline-block; padding: 2px 10px; border-radius: 12px; font-size: 12px; font-weight: 600; }
    .chip-ok { background: var(--brand-green-light); color: var(--brand-green-dark); }
    .chip-err { background: #ffebee; color: #c62828; }
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
