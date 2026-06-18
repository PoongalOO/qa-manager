import { Component, Input, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { forkJoin } from 'rxjs';
import { TranslatePipe } from '@ngx-translate/core';
import { AuthService } from '../../../../core/services/auth.service';
import { ProjectService } from '../../../../core/services/project.service';
import { TagService } from '../../../../core/services/tag.service';
import { UserService } from '../../../../core/services/user.service';
import { ProjectNavComponent } from '../../../../shared/components/project-nav/project-nav.component';
import { UserAvatarComponent } from '../../../../shared/components/user-avatar/user-avatar.component';
import { ProjectDialogComponent, ProjectDialogResult } from '../../../../shared/components/project-dialog/project-dialog.component';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { Project, Tag } from '../../../../core/models/project.model';
import { User } from '../../../../core/models/user.model';

@Component({
  selector: 'app-project-settings',
  standalone: true,
  imports: [
    FormsModule, MatButtonModule, MatIconModule, MatTableModule,
    MatChipsModule, MatInputModule, MatFormFieldModule, MatProgressSpinnerModule,
    ProjectNavComponent, UserAvatarComponent, TranslatePipe,
  ],
  template: `
    <div class="page-container anim-page">
      <app-project-nav [projectId]="projectId" />

      @if (loading) {
        <mat-spinner diameter="40" />
      } @else if (project) {
        <div class="page-header">
          <h2 class="page-title">{{ 'Settings.project_settings' | translate }}</h2>
          <div class="header-actions">
            <button mat-stroked-button class="danger-btn"
              [disabled]="!auth.canCreateProject()"
              (click)="onDeleteProject()">
              <mat-icon>delete</mat-icon> {{ 'Settings.delete' | translate }}
            </button>
            <button mat-flat-button color="primary" [disabled]="!auth.canCreateProject()" (click)="onEditProject()">
              <mat-icon>edit</mat-icon> {{ 'Settings.edit' | translate }}
            </button>
          </div>
        </div>

        <div class="info-card card-surface">
            <table class="info-table">
              <tr>
                <td class="label">{{ 'Settings.name' | translate }}</td>
                <td>{{ project.name }}</td>
              </tr>
              <tr>
                <td class="label">{{ 'Settings.detail' | translate }}</td>
                <td>{{ project.detail || '—' }}</td>
              </tr>
              <tr>
                <td class="label">{{ 'Settings.owner' | translate }}</td>
                <td>
                  @if (owner) {
                    <div class="owner-cell">
                      <app-user-avatar [username]="owner.username" [avatarPath]="owner.avatarPath" [size]="24" />
                      {{ owner.username }}
                    </div>
                  }
                </td>
              </tr>
              <tr>
                <td class="label">{{ 'Settings.visibility' | translate }}</td>
                <td>{{ project.isPublic ? ('Settings.public' | translate) : ('Settings.private' | translate) }}</td>
              </tr>
            </table>
        </div>

        <div class="section-header">
          <h3 class="section-title">{{ 'Settings.tags' | translate }}</h3>
        </div>

        <div class="tags-area">
          @for (tag of tags; track tag.id) {
            <mat-chip [removable]="auth.isProjectDeveloper(+projectId)"
              (removed)="onDeleteTag(tag)">
              {{ tag.name }}
              @if (auth.isProjectDeveloper(+projectId)) {
                <button matChipRemove><mat-icon>cancel</mat-icon></button>
              }
            </mat-chip>
          }
        </div>

        @if (auth.isProjectDeveloper(+projectId)) {
          <div class="add-tag-row">
            <mat-form-field appearance="outline" class="tag-input">
              <mat-label>{{ 'Settings.new_tag' | translate }}</mat-label>
              <input matInput [(ngModel)]="newTagName" (keydown.enter)="onAddTag()" maxlength="20" />
            </mat-form-field>
            <button mat-flat-button color="primary" [disabled]="newTagName.trim().length < 3" (click)="onAddTag()">
              <mat-icon>add</mat-icon> {{ 'Settings.add_tag' | translate }}
            </button>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .page-container { padding: 16px; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    .page-title { font-size: 1.4rem; font-weight: 700; margin: 0; letter-spacing: -0.01em; }
    .header-actions { display: flex; gap: 8px; }
    .danger-btn { color: #d32f2f; border-color: #d32f2f; }
    .info-card { margin-bottom: 24px; padding: 8px 20px; }
    .info-table { width: 100%; border-collapse: collapse; }
    .info-table tr td { padding: 12px 8px; border-bottom: 1px solid var(--border); }
    .info-table tr:last-child td { border-bottom: none; }
    .label { font-weight: 600; width: 140px; color: var(--text-secondary); }
    .owner-cell { display: flex; align-items: center; gap: 8px; }
    .section-header { margin-bottom: 12px; }
    .section-title { font-size: 1.1rem; font-weight: 700; margin: 0; }
    .tags-area { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px; min-height: 36px; }
    .add-tag-row { display: flex; align-items: center; gap: 12px; }
    .tag-input { max-width: 280px; }
  `],
})
export class ProjectSettingsComponent implements OnInit {
  @Input() projectId!: string;

  readonly auth = inject(AuthService);
  private readonly projectSvc = inject(ProjectService);
  private readonly tagSvc = inject(TagService);
  private readonly userSvc = inject(UserService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);

  project: Project | null = null;
  owner: User | null = null;
  tags: Tag[] = [];
  loading = true;
  newTagName = '';

  ngOnInit(): void {
    forkJoin({
      project: this.projectSvc.getProjectInfo(Number(this.projectId)),
      tags: this.tagSvc.getTags(Number(this.projectId)),
    }).subscribe({
      next: ({ project, tags }) => {
        this.project = project;
        this.tags = tags;
        this.loading = false;
        this.userSvc.findUser(project.userId).subscribe({ next: user => { this.owner = user; } });
      },
      error: () => { this.loading = false; },
    });
  }

  onEditProject(): void {
    const ref = this.dialog.open(ProjectDialogComponent, { data: { project: this.project } });
    ref.afterClosed().subscribe((result: ProjectDialogResult | undefined) => {
      if (!result || !this.project) return;
      this.projectSvc.updateProject(this.project.id, result.name, result.detail, result.isPublic).subscribe({
        next: updated => { this.project = updated; this.snackBar.open('Projet mis à jour', 'OK', { duration: 2000 }); },
        error: () => this.snackBar.open('Erreur lors de la mise à jour', 'OK', { duration: 3000 }),
      });
    });
  }

  onDeleteProject(): void {
    const ref = this.dialog.open(ConfirmDialogComponent, { data: { message: 'Supprimer définitivement ce projet ?' } });
    ref.afterClosed().subscribe((confirmed: boolean | undefined) => {
      if (!confirmed || !this.project) return;
      this.projectSvc.deleteProject(this.project.id).subscribe({
        next: () => this.router.navigate(['/projects']),
        error: () => this.snackBar.open('Erreur lors de la suppression', 'OK', { duration: 3000 }),
      });
    });
  }

  onAddTag(): void {
    const name = this.newTagName.trim();
    if (name.length < 3) return;
    this.tagSvc.createTag(Number(this.projectId), name).subscribe({
      next: tag => { this.tags = [...this.tags, tag]; this.newTagName = ''; this.snackBar.open('Tag ajouté', 'OK', { duration: 2000 }); },
      error: () => this.snackBar.open('Erreur lors de la création du tag', 'OK', { duration: 3000 }),
    });
  }

  onDeleteTag(tag: Tag): void {
    this.tagSvc.deleteTag(tag.id, Number(this.projectId)).subscribe({
      next: () => { this.tags = this.tags.filter(t => t.id !== tag.id); this.snackBar.open('Tag supprimé', 'OK', { duration: 2000 }); },
      error: () => this.snackBar.open('Erreur lors de la suppression', 'OK', { duration: 3000 }),
    });
  }
}
