import { Component, Input, OnInit, OnDestroy, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslatePipe } from '@ngx-translate/core';
import { ProjectService } from '../../../../core/services/project.service';
import { ProjectNavComponent } from '../../../../shared/components/project-nav/project-nav.component';
import { DonutChartComponent, ChartSegment } from '../../../../shared/components/donut-chart/donut-chart.component';
import { ProjectWithStats, RunCaseBasic } from '../../../../core/models/project.model';
import { PRIORITIES, PRIORITY_COLORS, TEST_TYPES } from '../../../../core/models/case.model';
import { RUN_CASE_STATUSES, RUN_CASE_STATUS_COLORS } from '../../../../core/models/run.model';

const CATEGORICAL_PALETTE = ['#fba91e', '#6ea56c', '#3ac6e1', '#feda2f', '#f15f47', '#244470', '#9c80bb', '#f595a6'];
const TYPE_COLORS = Array.from({ length: 13 }, (_, i) => CATEGORICAL_PALETTE[i % CATEGORICAL_PALETTE.length]);

// Worst-result-wins, so a case isn't reported as healthy when one tester still flagged it.
const STATUS_SEVERITY_ORDER = [2, 3, 4, 1, 0]; // Échoué, À retester, Ignoré, Passé, Non testé

function effectiveRunCaseStatus(rc: RunCaseBasic): number {
  if (!rc.RunCaseResults?.length) return rc.status;
  const reported = new Set(rc.RunCaseResults.map(r => r.status));
  return STATUS_SEVERITY_ORDER.find(s => reported.has(s)) ?? rc.status;
}

@Component({
  selector: 'app-project-home',
  standalone: true,
  imports: [
    MatIconModule, MatProgressSpinnerModule,
    ProjectNavComponent, DonutChartComponent, TranslatePipe,
  ],
  template: `
    <div class="page-container anim-page">
      <app-project-nav [projectId]="projectId" />

      @if (loading) {
        <mat-spinner diameter="40" />
      } @else if (project) {
        <h1 class="project-title">{{ project.name }}</h1>

        <div class="stats-row">
          <div class="stat-card card-surface anim-stagger" style="animation-delay:0ms">
            <div class="stat-icon stat-icon--folder"><mat-icon>folder</mat-icon></div>
            <div class="stat-body">
              <div class="stat-value">{{ folderCount }}</div>
              <div class="stat-label">{{ 'Home.folders' | translate }}</div>
            </div>
          </div>
          <div class="stat-card card-surface anim-stagger" style="animation-delay:80ms">
            <div class="stat-icon stat-icon--case"><mat-icon>assignment</mat-icon></div>
            <div class="stat-body">
              <div class="stat-value">{{ caseCount }}</div>
              <div class="stat-label">{{ 'Home.test_cases' | translate }}</div>
            </div>
          </div>
          <div class="stat-card card-surface anim-stagger" style="animation-delay:160ms">
            <div class="stat-icon stat-icon--run"><mat-icon>science</mat-icon></div>
            <div class="stat-body">
              <div class="stat-value">{{ runCount }}</div>
              <div class="stat-label">{{ 'Home.test_runs' | translate }}</div>
            </div>
          </div>
        </div>

        @if (project.detail) {
          <div class="detail-card card-surface">{{ project.detail }}</div>
        }

        @if (caseCount > 0) {
          <h3 class="section-title">{{ 'Home.test_classification' | translate }}</h3>
          <div class="charts-row">
            <div class="chart-card card-surface">
              <app-donut-chart [segments]="priorityData" [title]="'Home.by_priority' | translate" />
            </div>
            <div class="chart-card card-surface">
              <app-donut-chart [segments]="typeData" [title]="'Home.by_type' | translate" />
            </div>
          </div>
        }

        @if (runCount > 0) {
          <h3 class="section-title">{{ 'Home.progress' | translate }}</h3>
          @for (run of runProgressData; track run.name; let i = $index) {
            <div class="run-block card-surface anim-stagger" [style.animation-delay.ms]="i * 70">
              <div class="run-header">
                <span class="run-name">{{ run.name }}</span>
                <span class="run-case-count">{{ run.total }} {{ 'Home.test_cases' | translate }}</span>
              </div>
              @if (run.total > 0) {
                <div class="progress-bar">
                  @for (seg of run.segments; track seg.label) {
                    @if (seg.percent > 0) {
                      <div class="progress-segment"
                           [style.background-color]="seg.color"
                           [style.width.%]="seg.percent"
                           [title]="seg.label + ' : ' + seg.percent.toFixed(0) + '%'">
                      </div>
                    }
                  }
                </div>
                <div class="progress-legend">
                  @for (seg of run.segments; track seg.label) {
                    @if (seg.percent > 0) {
                      <span class="pl-item">
                        <span class="pl-dot" [style.background-color]="seg.color"></span>
                        {{ seg.label }} {{ seg.percent.toFixed(0) }}%
                      </span>
                    }
                  }
                </div>
              }
            </div>
          }
        }
      }
    </div>
  `,
  styles: [`
    .page-container { padding: 16px; }
    .project-title { font-size: 1.7rem; font-weight: 700; margin-bottom: 20px; letter-spacing: -0.01em; }
    .stats-row { display: flex; gap: 16px; flex-wrap: wrap; margin-bottom: 24px; }
    .stat-card {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 18px 22px;
      min-width: 180px;
    }
    .stat-icon {
      width: 44px;
      height: 44px;
      border-radius: var(--radius-sm);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .stat-icon--folder { background: #e8edf3; color: var(--brand-navy); }
    .stat-icon--case { background: var(--brand-green-light); color: var(--brand-green-dark); }
    .stat-icon--run { background: #fdf1e3; color: #b9650f; }
    .stat-value { font-size: 1.6rem; font-weight: 700; line-height: 1; }
    .stat-label { color: var(--text-secondary); font-size: 0.85rem; margin-top: 4px; }
    .detail-card { padding: 16px 20px; margin-bottom: 24px; color: var(--text-secondary); }
    .section-title { font-size: 1.1rem; font-weight: 600; margin: 28px 0 16px; }
    .charts-row { display: flex; gap: 20px; flex-wrap: wrap; margin-bottom: 8px; }
    .chart-card { padding: 20px; }
    .run-block { padding: 16px 20px; margin-bottom: 14px; }
    .run-header { display: flex; justify-content: space-between; margin-bottom: 8px; }
    .run-name { font-weight: 600; }
    .run-case-count { color: var(--text-secondary); font-size: 0.9rem; }
    .progress-bar { display: flex; height: 14px; border-radius: 7px; overflow: hidden; background: var(--surface-muted); }
    .progress-segment { height: 100%; transition: width var(--transition-base); }
    .progress-legend { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 8px; font-size: 0.8rem; }
    .pl-item { display: flex; align-items: center; gap: 4px; }
    .pl-dot { width: 8px; height: 8px; border-radius: 50%; }
  `],
})
export class ProjectHomeComponent implements OnInit, OnDestroy {
  @Input() projectId!: string;

  private readonly projectSvc = inject(ProjectService);

  project: ProjectWithStats | null = null;
  loading = true;

  get folderCount(): number { return this.project?.Folders.length ?? 0; }
  get caseCount(): number {
    return this.project?.Folders.reduce((sum, f) => sum + f.Cases.length, 0) ?? 0;
  }
  get runCount(): number { return this.project?.Runs.length ?? 0; }

  get priorityData(): ChartSegment[] {
    const counts = new Array(PRIORITIES.length).fill(0);
    this.project?.Folders.forEach(f => f.Cases.forEach(c => {
      if (c.priority >= 0 && c.priority < PRIORITIES.length) counts[c.priority]++;
    }));
    return PRIORITIES.map((label, i) => ({ label, value: counts[i], color: PRIORITY_COLORS[i] }));
  }

  get typeData(): ChartSegment[] {
    const counts = new Array(TEST_TYPES.length).fill(0);
    this.project?.Folders.forEach(f => f.Cases.forEach(c => {
      if (c.type >= 0 && c.type < TEST_TYPES.length) counts[c.type]++;
    }));
    return TEST_TYPES.map((label, i) => ({ label, value: counts[i], color: TYPE_COLORS[i] }));
  }

  get runProgressData(): Array<{ name: string; total: number; segments: Array<{ label: string; color: string; percent: number }> }> {
    return (this.project?.Runs ?? []).map(run => {
      const total = run.RunCases.length;
      const counts = [0, 0, 0, 0, 0];
      run.RunCases.forEach(rc => counts[effectiveRunCaseStatus(rc)]++);
      return {
        name: run.name,
        total,
        segments: RUN_CASE_STATUSES.map((label, i) => ({
          label,
          color: RUN_CASE_STATUS_COLORS[i],
          percent: total ? (counts[i] / total) * 100 : 0,
        })),
      };
    });
  }

  private readonly onVisibilityChange = (): void => {
    if (document.visibilityState === 'visible') this.loadHome();
  };

  ngOnInit(): void {
    this.loadHome();
    document.addEventListener('visibilitychange', this.onVisibilityChange);
  }

  ngOnDestroy(): void {
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
  }

  private loadHome(): void {
    this.projectSvc.getProjectHome(Number(this.projectId)).subscribe({
      next: project => { this.project = project; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }
}
