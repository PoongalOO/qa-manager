import { Component, Input, OnInit, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { TranslatePipe } from '@ngx-translate/core';
import { ProjectService } from '../../../../core/services/project.service';
import { ProjectNavComponent } from '../../../../shared/components/project-nav/project-nav.component';
import { DonutChartComponent, ChartSegment } from '../../../../shared/components/donut-chart/donut-chart.component';
import { ProjectWithStats } from '../../../../core/models/project.model';
import { PRIORITIES, PRIORITY_COLORS, TEST_TYPES } from '../../../../core/models/case.model';
import { RUN_CASE_STATUSES, RUN_CASE_STATUS_COLORS } from '../../../../core/models/run.model';

const CATEGORICAL_PALETTE = ['#fba91e', '#6ea56c', '#3ac6e1', '#feda2f', '#f15f47', '#244470', '#9c80bb', '#f595a6'];
const TYPE_COLORS = Array.from({ length: 13 }, (_, i) => CATEGORICAL_PALETTE[i % CATEGORICAL_PALETTE.length]);

@Component({
  selector: 'app-project-home',
  standalone: true,
  imports: [
    MatCardModule, MatChipsModule, MatIconModule,
    MatProgressSpinnerModule, MatDividerModule,
    ProjectNavComponent, DonutChartComponent, TranslatePipe,
  ],
  template: `
    <div class="page-container">
      <app-project-nav [projectId]="projectId" />

      @if (loading) {
        <mat-spinner diameter="40" />
      } @else if (project) {
        <h1 class="project-title">{{ project.name }}</h1>

        <div class="stats-row">
          <mat-chip>
            <mat-icon>folder</mat-icon>
            {{ folderCount }} {{ 'Home.folders' | translate }}
          </mat-chip>
          <mat-chip>
            <mat-icon>assignment</mat-icon>
            {{ caseCount }} {{ 'Home.test_cases' | translate }}
          </mat-chip>
          <mat-chip>
            <mat-icon>science</mat-icon>
            {{ runCount }} {{ 'Home.test_runs' | translate }}
          </mat-chip>
        </div>

        @if (project.detail) {
          <mat-card class="detail-card">
            <mat-card-content>{{ project.detail }}</mat-card-content>
          </mat-card>
        }

        @if (caseCount > 0) {
          <mat-divider class="divider" />
          <h3 class="section-title">{{ 'Home.test_classification' | translate }}</h3>
          <div class="charts-row">
            <app-donut-chart [segments]="priorityData" [title]="'Home.by_priority' | translate" />
            <app-donut-chart [segments]="typeData" [title]="'Home.by_type' | translate" />
          </div>
        }

        @if (runCount > 0) {
          <mat-divider class="divider" />
          <h3 class="section-title">{{ 'Home.progress' | translate }}</h3>
          @for (run of runProgressData; track run.name) {
            <div class="run-block">
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
    .project-title { font-size: 1.6rem; font-weight: 700; margin-bottom: 16px; }
    .stats-row { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 16px; }
    .stats-row mat-chip { display: flex; align-items: center; gap: 4px; }
    .detail-card { background: #f5f5f5; margin-bottom: 16px; }
    .divider { margin: 24px 0; }
    .section-title { font-size: 1.1rem; font-weight: 600; margin-bottom: 16px; }
    .charts-row { display: flex; gap: 32px; flex-wrap: wrap; margin-bottom: 8px; }
    .run-block { margin-bottom: 16px; }
    .run-header { display: flex; justify-content: space-between; margin-bottom: 6px; }
    .run-name { font-weight: 500; }
    .run-case-count { color: #888; font-size: 0.9rem; }
    .progress-bar { display: flex; height: 16px; border-radius: 8px; overflow: hidden; background: #eee; }
    .progress-segment { height: 100%; transition: width 0.3s; }
    .progress-legend { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 6px; font-size: 0.8rem; }
    .pl-item { display: flex; align-items: center; gap: 4px; }
    .pl-dot { width: 8px; height: 8px; border-radius: 50%; }
  `],
})
export class ProjectHomeComponent implements OnInit {
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
      run.RunCases.forEach(rc => counts[rc.status]++);
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

  ngOnInit(): void {
    this.projectSvc.getProjectHome(Number(this.projectId)).subscribe({
      next: project => { this.project = project; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }
}
