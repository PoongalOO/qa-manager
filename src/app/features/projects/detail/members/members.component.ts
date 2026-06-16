import { Component, Input, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { AuthService } from '../../../../core/services/auth.service';
import { MemberService } from '../../../../core/services/member.service';
import { ProjectNavComponent } from '../../../../shared/components/project-nav/project-nav.component';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { AddMemberDialogComponent } from './add-member-dialog.component';
import { UserAvatarComponent } from '../../../../shared/components/user-avatar/user-avatar.component';
import { Member } from '../../../../core/models/project.model';
import { User } from '../../../../core/models/user.model';

const ROLE_LABELS = ['Manager', 'Développeur', 'Reporter'];

@Component({
  selector: 'app-members',
  standalone: true,
  imports: [
    FormsModule, MatTableModule, MatButtonModule, MatIconModule,
    MatSelectModule, MatFormFieldModule, MatProgressSpinnerModule,
    ProjectNavComponent, UserAvatarComponent, TranslatePipe,
  ],
  template: `
    <div class="page-container">
      <app-project-nav [projectId]="projectId" />

      <div class="page-header">
        <h2 class="page-title">{{ 'Members.member_management' | translate }}</h2>
        @if (canManage) {
          <button mat-flat-button (click)="openAddDialog()">
            <mat-icon>person_add</mat-icon> {{ 'Members.add_member' | translate }}
          </button>
        }
      </div>

      @if (loading) {
        <mat-spinner diameter="40" />
      } @else {
        <table mat-table [dataSource]="members" class="members-table">
          <ng-container matColumnDef="user">
            <th mat-header-cell *matHeaderCellDef>{{ 'Members.username' | translate }}</th>
            <td mat-cell *matCellDef="let m">
              <div class="user-cell">
                <app-user-avatar [username]="m.User.username" [avatarPath]="m.User.avatarPath" [size]="32" />
                <div class="user-info">
                  <span class="username">{{ m.User.username }}</span>
                  <span class="email">{{ m.User.email }}</span>
                </div>
              </div>
            </td>
          </ng-container>

          <ng-container matColumnDef="role">
            <th mat-header-cell *matHeaderCellDef>{{ 'Members.role' | translate }}</th>
            <td mat-cell *matCellDef="let m">
              @if (canManage) {
                <mat-select [(ngModel)]="m.role" (ngModelChange)="onRoleChange(m)" class="role-select">
                  <mat-option [value]="0">{{ 'Members.manager' | translate }}</mat-option>
                  <mat-option [value]="1">{{ 'Members.developer' | translate }}</mat-option>
                  <mat-option [value]="2">{{ 'Members.reporter' | translate }}</mat-option>
                </mat-select>
              } @else {
                {{ roleLabel(m.role) }}
              }
            </td>
          </ng-container>

          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef></th>
            <td mat-cell *matCellDef="let m">
              @if (canManage) {
                <button mat-icon-button (click)="onDeleteClick(m)" title="Supprimer">
                  <mat-icon>delete</mat-icon>
                </button>
              }
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="columns"></tr>
          <tr mat-row *matRowDef="let row; columns: columns;"></tr>
        </table>
        @if (members.length === 0) {
          <p class="empty">{{ 'Members.no_members_found' | translate }}</p>
        }
      }
    </div>
  `,
  styles: [`
    .page-container { padding: 16px; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    .page-title { font-size: 1.3rem; font-weight: 600; margin: 0; }
    .members-table { width: 100%; }
    .user-cell { display: flex; align-items: center; gap: 10px; }
    .user-info { display: flex; flex-direction: column; }
    .email { font-size: 0.8rem; color: #666; }
    .role-select { min-width: 130px; }
    .empty { color: #888; text-align: center; padding: 24px; }
  `],
})
export class MembersComponent implements OnInit {
  @Input() projectId!: string;

  private readonly auth = inject(AuthService);
  private readonly memberSvc = inject(MemberService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);

  members: Member[] = [];
  loading = true;

  get canManage(): boolean { return this.auth.canManageMembers(Number(this.projectId)); }

  readonly columns = ['user', 'role', 'actions'];

  roleLabel(role: number): string { return ROLE_LABELS[role] ?? 'Inconnu'; }

  ngOnInit(): void {
    if (!this.canManage) {
      this.router.navigate(['/projects', this.projectId, 'home']);
      return;
    }
    this.loadMembers();
  }

  loadMembers(): void {
    this.memberSvc.getMembers(Number(this.projectId)).subscribe({
      next: members => { this.members = members; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }

  onRoleChange(member: Member): void {
    this.memberSvc.updateMemberRole(member.User.id, Number(this.projectId), member.role).subscribe({
      next: () => this.snackBar.open('Rôle mis à jour', 'OK', { duration: 2000 }),
      error: () => this.snackBar.open('Erreur lors de la mise à jour', 'OK', { duration: 3000 }),
    });
  }

  openAddDialog(): void {
    const ref = this.dialog.open(AddMemberDialogComponent, {
      data: { projectId: Number(this.projectId) },
    });
    ref.afterClosed().subscribe((user: User | undefined) => {
      if (!user) return;
      this.memberSvc.addMember(user.id, Number(this.projectId)).subscribe({
        next: member => {
          member.User = user as any;
          this.members = [...this.members, member];
          this.snackBar.open('Membre ajouté', 'OK', { duration: 2000 });
        },
        error: () => this.snackBar.open("Erreur lors de l'ajout", 'OK', { duration: 3000 }),
      });
    });
  }

  onDeleteClick(member: Member): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: { message: `Supprimer ${member.User.username} du projet ?` },
    });
    ref.afterClosed().subscribe((confirmed: boolean | undefined) => {
      if (!confirmed) return;
      this.memberSvc.deleteMember(member.User.id, Number(this.projectId)).subscribe({
        next: () => {
          this.members = this.members.filter(m => m.User.id !== member.User.id);
          this.snackBar.open('Membre supprimé', 'OK', { duration: 2000 });
        },
        error: () => this.snackBar.open('Erreur lors de la suppression', 'OK', { duration: 3000 }),
      });
    });
  }
}
