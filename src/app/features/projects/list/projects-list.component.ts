import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { DatePipe, SlicePipe } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { AuthService } from '../../../core/services/auth.service';
import { ProjectService } from '../../../core/services/project.service';
import { ProjectDialogComponent, ProjectDialogResult } from '../../../shared/components/project-dialog/project-dialog.component';
import { Project } from '../../../core/models/project.model';

@Component({
  selector: 'app-projects-list',
  standalone: true,
  imports: [
    RouterLink, MatTableModule, MatSortModule, MatButtonModule,
    MatIconModule, MatChipsModule, MatProgressSpinnerModule, DatePipe, SlicePipe,
    TranslatePipe,
  ],
  template: `
    <div class="page-container anim-page">
      <div class="page-header">
        <h2 class="page-title">{{ 'Projects.project_list' | translate }}</h2>
        @if (auth.canCreateProject()) {
          <button mat-flat-button color="primary" (click)="openCreateDialog()">
            <mat-icon>add</mat-icon> {{ 'Projects.new_project' | translate }}
          </button>
        }
      </div>

      @if (loading) {
        <mat-spinner diameter="40" />
      } @else {
        <table mat-table [dataSource]="dataSource" matSort class="projects-table card-surface">
          <ng-container matColumnDef="id">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>{{ 'Projects.id' | translate }}</th>
            <td mat-cell *matCellDef="let p">{{ p.id }}</td>
          </ng-container>

          <ng-container matColumnDef="isPublic">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>{{ 'Projects.publicity' | translate }}</th>
            <td mat-cell *matCellDef="let p">
              <mat-chip [class]="p.isPublic ? 'chip-public' : 'chip-private'">
                {{ p.isPublic ? ('Projects.public' | translate) : ('Projects.private' | translate) }}
              </mat-chip>
            </td>
          </ng-container>

          <ng-container matColumnDef="name">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>{{ 'Projects.name' | translate }}</th>
            <td mat-cell *matCellDef="let p">
              <a [routerLink]="['/projects', p.id, 'home']" class="project-link">{{ p.name }}</a>
              @if (p.detail) {
                <div class="project-detail">{{ p.detail | slice:0:50 }}{{ p.detail.length > 50 ? '…' : '' }}</div>
              }
            </td>
          </ng-container>

          <ng-container matColumnDef="updatedAt">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>{{ 'Projects.last_update' | translate }}</th>
            <td mat-cell *matCellDef="let p">{{ p.updatedAt | date:'yyyy/MM/dd HH:mm' }}</td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="columns"></tr>
          <tr mat-row *matRowDef="let row; columns: columns;"></tr>
          <tr class="mat-row" *matNoDataRow>
            <td class="mat-cell no-data" [attr.colspan]="columns.length">
              {{ 'Projects.no_projects_found' | translate }}
            </td>
          </tr>
        </table>
      }
    </div>
  `,
  styles: [`
    .page-container { padding: 16px; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    .page-title { font-size: 1.4rem; font-weight: 700; margin: 0; letter-spacing: -0.01em; }
    .projects-table { width: 100%; overflow: hidden; }
    .projects-table tr.mat-mdc-row:hover { background: var(--surface-muted); }
    .project-link { color: var(--text-primary); text-decoration: none; font-weight: 600; transition: color var(--transition-fast); }
    .project-link:hover { color: var(--brand-green-dark); }
    .project-detail { font-size: 0.8rem; color: var(--text-secondary); }
    .chip-public { background: var(--brand-green-light) !important; color: var(--brand-green-dark) !important; }
    .chip-private { background: var(--surface-muted) !important; color: var(--text-secondary) !important; }
    .no-data { text-align: center; padding: 24px; color: var(--text-secondary); }
  `],
})
export class ProjectsListComponent implements OnInit {
  @ViewChild(MatSort) sort!: MatSort;

  readonly auth = inject(AuthService);
  private readonly projectSvc = inject(ProjectService);
  private readonly dialog = inject(MatDialog);

  readonly columns = ['id', 'isPublic', 'name', 'updatedAt'];
  dataSource = new MatTableDataSource<Project>([]);
  loading = true;

  ngOnInit(): void {
    this.projectSvc.getProjects().subscribe({
      next: projects => {
        this.dataSource.data = projects;
        this.dataSource.sort = this.sort;
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }

  openCreateDialog(): void {
    const ref = this.dialog.open(ProjectDialogComponent, { data: { project: null } });
    ref.afterClosed().subscribe((result: ProjectDialogResult | undefined) => {
      if (!result) return;
      this.projectSvc.createProject(result.name, result.detail, result.isPublic).subscribe({
        next: project => {
          this.dataSource.data = [...this.dataSource.data, project];
          this.auth.refreshProjectRoles();
        },
      });
    });
  }
}
