import { Component, Input, OnInit, inject, ViewChild } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { DatePipe } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { TranslatePipe } from '@ngx-translate/core';
import { RunService } from '../../../core/services/run.service';
import { AuthService } from '../../../core/services/auth.service';
import { Run, RUN_STATES } from '../../../core/models/run.model';
import { ProjectNavComponent } from '../../../shared/components/project-nav/project-nav.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { RunDialogComponent, RunDialogResult } from '../../../shared/components/run-dialog/run-dialog.component';

@Component({
  selector: 'app-runs-list',
  standalone: true,
  imports: [
    RouterModule, DatePipe, MatTableModule, MatButtonModule, MatIconModule,
    MatProgressSpinnerModule, MatSortModule, ProjectNavComponent, TranslatePipe,
  ],
  template: `
    <div class="page-container">
      <app-project-nav [projectId]="projectId" />

      <div class="page-header">
        <h2 class="page-title">{{ 'Runs.run_list' | translate }}</h2>
        @if (canManage) {
          <button mat-flat-button color="primary" (click)="openCreateDialog()">
            <mat-icon>add</mat-icon>
            {{ 'Runs.new_run' | translate }}
          </button>
        }
      </div>

      @if (loading) {
        <mat-spinner diameter="40" />
      } @else {
        <table mat-table [dataSource]="dataSource" matSort class="runs-table mat-elevation-z1">
          <ng-container matColumnDef="id">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>{{ 'Runs.id' | translate }}</th>
            <td mat-cell *matCellDef="let row">{{ row.id }}</td>
          </ng-container>

          <ng-container matColumnDef="name">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>{{ 'Runs.name' | translate }}</th>
            <td mat-cell *matCellDef="let row">
              <a [routerLink]="['/projects', projectId, 'runs', row.id]" class="run-link">{{ row.name }}</a>
            </td>
          </ng-container>

          <ng-container matColumnDef="state">
            <th mat-header-cell *matHeaderCellDef>{{ 'Runs.state' | translate }}</th>
            <td mat-cell *matCellDef="let row">
              <span class="state-badge">{{ getStateLabel(row.state) }}</span>
            </td>
          </ng-container>

          <ng-container matColumnDef="caseCount">
            <th mat-header-cell *matHeaderCellDef>{{ 'Runs.cases' | translate }}</th>
            <td mat-cell *matCellDef="let row">{{ row.caseCount ?? 0 }}</td>
          </ng-container>

          <ng-container matColumnDef="updatedAt">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>{{ 'Runs.last_update' | translate }}</th>
            <td mat-cell *matCellDef="let row">{{ row.updatedAt | date: 'dd/MM/yyyy' }}</td>
          </ng-container>

          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef></th>
            <td mat-cell *matCellDef="let row">
              @if (canManage) {
                <button mat-icon-button (click)="openEditDialog(row)" title="Modifier">
                  <mat-icon>edit</mat-icon>
                </button>
                <button mat-icon-button color="warn" (click)="onDeleteClick(row)" title="Supprimer">
                  <mat-icon>delete</mat-icon>
                </button>
              }
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>

          <tr class="mat-row" *matNoDataRow>
            <td class="mat-cell" [attr.colspan]="displayedColumns.length" style="text-align:center;padding:24px">
              {{ 'Runs.no_runs_found' | translate }}
            </td>
          </tr>
        </table>
      }
    </div>
  `,
  styles: [`
    .page-container { padding: 16px; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin: 16px 0; }
    .page-title { margin: 0; font-size: 20px; font-weight: 600; }
    .runs-table { width: 100%; }
    .run-link { color: #6750a4; text-decoration: none; }
    .run-link:hover { text-decoration: underline; }
    .state-badge { padding: 2px 10px; border-radius: 12px; background: #e8def8; color: #21005d; font-size: 12px; }
  `],
})
export class RunsListComponent implements OnInit {
  @Input() projectId!: string;
  @ViewChild(MatSort) sort!: MatSort;

  private runSvc = inject(RunService);
  private auth = inject(AuthService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  loading = true;
  dataSource = new MatTableDataSource<Run>();
  displayedColumns = ['id', 'name', 'state', 'caseCount', 'updatedAt', 'actions'];

  get canManage(): boolean {
    return this.auth.canManageRuns(parseInt(this.projectId, 10));
  }

  ngOnInit(): void { this.loadRuns(); }

  loadRuns(): void {
    this.loading = true;
    this.runSvc.getRuns(parseInt(this.projectId, 10)).subscribe({
      next: (runs) => {
        this.dataSource.data = runs;
        if (this.sort) this.dataSource.sort = this.sort;
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }

  getStateLabel(state: number): string { return RUN_STATES[state] ?? String(state); }

  openCreateDialog(): void {
    const dialogRef = this.dialog.open(RunDialogComponent, { width: '440px', data: { run: null } });
    dialogRef.afterClosed().subscribe((result: RunDialogResult | undefined) => {
      if (!result) return;
      const pid = parseInt(this.projectId, 10);
      this.runSvc.createRun(pid, result.name, result.description).subscribe({
        next: () => { this.snackBar.open('Campagne créée', 'OK', { duration: 2000 }); this.loadRuns(); },
        error: () => { this.snackBar.open('Erreur lors de la création', 'Fermer', { duration: 3000 }); },
      });
    });
  }

  openEditDialog(run: Run): void {
    const dialogRef = this.dialog.open(RunDialogComponent, { width: '440px', data: { run } });
    dialogRef.afterClosed().subscribe((result: RunDialogResult | undefined) => {
      if (!result) return;
      this.runSvc.updateRun(run.id, { name: result.name, description: result.description }).subscribe({
        next: () => { this.snackBar.open('Campagne modifiée', 'OK', { duration: 2000 }); this.loadRuns(); },
        error: () => { this.snackBar.open('Erreur lors de la modification', 'Fermer', { duration: 3000 }); },
      });
    });
  }

  onDeleteClick(run: Run): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Supprimer la campagne', message: `Voulez-vous vraiment supprimer "${run.name}" ?`, confirmLabel: 'Supprimer', cancelLabel: 'Annuler' },
    });
    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (!confirmed) return;
      this.runSvc.deleteRun(run.id).subscribe({
        next: () => { this.snackBar.open('Campagne supprimée', 'OK', { duration: 2000 }); this.loadRuns(); },
        error: () => { this.snackBar.open('Erreur lors de la suppression', 'Fermer', { duration: 3000 }); },
      });
    });
  }
}
