import { Component, ViewChild, AfterViewInit, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { TranslatePipe } from '@ngx-translate/core';
import { AdminService } from '../../core/services/admin.service';
import { AuthService } from '../../core/services/auth.service';
import { User } from '../../core/models/user.model';
import { CreateUserDialogComponent, CreateUserResult } from '../../shared/components/create-user-dialog/create-user-dialog.component';
import { PasswordResetDialogComponent, PasswordResetDialogData, PasswordResetResult } from '../../shared/components/password-reset-dialog/password-reset-dialog.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';

const ROLE_LABELS = ['Administrateur', 'Utilisateur', 'QA Manager'];

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [
    CommonModule, MatTableModule, MatSortModule, MatButtonModule,
    MatIconModule, MatSelectModule,
    MatProgressSpinnerModule, MatSnackBarModule, MatDialogModule,
    TranslatePipe,
  ],
  template: `
    <div class="admin-container anim-page">
      <div class="header-row">
        <h2>{{ 'Admin.user_management' | translate }}</h2>
        <button mat-flat-button color="primary" (click)="openCreateDialog()">
          <mat-icon>person_add</mat-icon>
          {{ 'Admin.create_account' | translate }}
        </button>
      </div>

      @if (loading) {
        <mat-spinner diameter="40" />
      } @else {
        <div class="card-surface">
          <table mat-table [dataSource]="dataSource" matSort class="users-table">
            <ng-container matColumnDef="id">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>{{ 'Admin.id' | translate }}</th>
              <td mat-cell *matCellDef="let u">{{ u.id }}</td>
            </ng-container>

            <ng-container matColumnDef="email">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>{{ 'Admin.email' | translate }}</th>
              <td mat-cell *matCellDef="let u">{{ u.email }}</td>
            </ng-container>

            <ng-container matColumnDef="username">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>{{ 'Admin.username' | translate }}</th>
              <td mat-cell *matCellDef="let u">{{ u.username }}</td>
            </ng-container>

            <ng-container matColumnDef="role">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>{{ 'Admin.role' | translate }}</th>
              <td mat-cell *matCellDef="let u">
                <mat-select [value]="u.role" [disabled]="isMyself(u)"
                  (selectionChange)="onRoleChange(u, $event.value)" class="role-select">
                  @for (opt of roleOptions; track opt.value) {
                    <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
                  }
                </mat-select>
              </td>
            </ng-container>

            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let u">
                @if (!isMyself(u)) {
                  <button mat-icon-button (click)="openResetDialog(u)"
                    [title]="'Admin.reset_password' | translate">
                    <mat-icon>lock_reset</mat-icon>
                  </button>
                  <button mat-icon-button (click)="openDeleteDialog(u)"
                    [title]="'Admin.delete_account' | translate">
                    <mat-icon>delete</mat-icon>
                  </button>
                }
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
          </table>
        </div>
      }
    </div>
  `,
  styles: [`
    .admin-container { padding: 24px; }
    .header-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    h2 { margin: 0; font-size: 1.4rem; font-weight: 700; letter-spacing: -0.01em; }
    .users-table { width: 100%; }
    .users-table tr.mat-mdc-row:hover { background: var(--surface-muted); }
    .role-select { min-width: 140px; }
  `],
})
export class AdminComponent implements OnInit, AfterViewInit {
  @ViewChild(MatSort) sort!: MatSort;

  private adminSvc = inject(AdminService);
  private auth = inject(AuthService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  readonly roleOptions = ROLE_LABELS.map((label, value) => ({ value, label }));
  displayedColumns = ['id', 'email', 'username', 'role', 'actions'];
  dataSource = new MatTableDataSource<User>();
  loading = true;

  ngOnInit(): void { this.loadUsers(); }
  ngAfterViewInit(): void { this.dataSource.sort = this.sort; }

  loadUsers(): void {
    this.loading = true;
    this.adminSvc.getUsers().subscribe({
      next: (users) => { this.dataSource.data = users; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }

  isMyself(user: User): boolean {
    return this.auth.currentUser()?.id === user.id;
  }

  onRoleChange(user: User, newRole: number): void {
    this.adminSvc.updateUserRole(user.id, newRole).subscribe({
      next: () => { user.role = newRole; this.snackBar.open('Rôle mis à jour', 'OK', { duration: 3000 }); },
      error: () => { this.snackBar.open('Erreur : au moins un administrateur requis', 'OK', { duration: 4000 }); this.loadUsers(); },
    });
  }

  openCreateDialog(): void {
    const ref = this.dialog.open(CreateUserDialogComponent);
    ref.afterClosed().subscribe((result: CreateUserResult | null) => {
      if (!result) return;
      this.adminSvc.adminCreateUser(result.email, result.username, result.password, result.role).subscribe({
        next: ({ user }) => { this.dataSource.data = [...this.dataSource.data, user]; this.snackBar.open('Compte créé', 'OK', { duration: 3000 }); },
        error: () => { this.snackBar.open('Erreur lors de la création du compte', 'OK', { duration: 4000 }); },
      });
    });
  }

  openResetDialog(user: User): void {
    const ref = this.dialog.open(PasswordResetDialogComponent, {
      data: { username: user.username } as PasswordResetDialogData,
    });
    ref.afterClosed().subscribe((result: PasswordResetResult | null) => {
      if (!result) return;
      this.adminSvc.adminResetPassword(user.id, result.newPassword).subscribe({
        next: () => { this.snackBar.open('Mot de passe réinitialisé', 'OK', { duration: 3000 }); },
        error: () => { this.snackBar.open('Erreur lors de la réinitialisation', 'OK', { duration: 4000 }); },
      });
    });
  }

  openDeleteDialog(user: User): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: { message: `Supprimer le compte de ${user.username} ?` },
    });
    ref.afterClosed().subscribe((confirmed: boolean | undefined) => {
      if (!confirmed) return;
      this.adminSvc.deleteUser(user.id).subscribe({
        next: () => {
          this.dataSource.data = this.dataSource.data.filter(u => u.id !== user.id);
          this.snackBar.open('Compte supprimé', 'OK', { duration: 3000 });
        },
        error: (err) => {
          const message = err?.status === 409
            ? 'Erreur : au moins un administrateur requis'
            : 'Erreur lors de la suppression du compte';
          this.snackBar.open(message, 'OK', { duration: 4000 });
        },
      });
    });
  }

  getRoleLabel(role: number): string {
    return ROLE_LABELS[role] ?? String(role);
  }
}
