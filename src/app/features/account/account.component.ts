import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslatePipe } from '@ngx-translate/core';
import { AuthService } from '../../core/services/auth.service';
import { ProjectService } from '../../core/services/project.service';
import { RunService } from '../../core/services/run.service';
import { UserAvatarComponent } from '../../shared/components/user-avatar/user-avatar.component';
import { Project } from '../../core/models/project.model';
import { Run } from '../../core/models/run.model';

@Component({
  selector: 'app-account',
  standalone: true,
  imports: [
    RouterLink, MatButtonModule, MatIconModule,
    MatProgressSpinnerModule, UserAvatarComponent,
    TranslatePipe,
  ],
  template: `
    <div class="account-container anim-page">
      <div class="profile-card card-surface">
        <div class="profile-row">
          <app-user-avatar
            [username]="currentUser()?.username"
            [avatarPath]="currentUser()?.avatarPath"
            [size]="48"
          />
          <div class="user-details">
            <strong class="username">{{ currentUser()?.username }}</strong>
            <span class="email">{{ currentUser()?.email }}</span>
          </div>
          <a mat-stroked-button routerLink="/account/settings">
            <mat-icon>settings</mat-icon>
            {{ 'Auth.profile_settings' | translate }}
          </a>
        </div>
      </div>

      <h3 class="section-title">{{ 'Auth.your_projects' | translate }}</h3>

      @if (loading) {
        <mat-spinner diameter="32" />
      } @else if (projects.length === 0) {
        <span class="empty-text">{{ 'Auth.not_own_any_projects' | translate }}&nbsp;</span>
        <a mat-stroked-button routerLink="/projects">
          {{ 'Auth.find_projects' | translate }}
          <mat-icon>arrow_forward</mat-icon>
        </a>
      } @else {
        @for (p of projects; track p.id; let i = $index) {
          <div class="item-card card-surface anim-stagger" [style.animation-delay.ms]="i * 50">
            <div class="item-header">
              <a [routerLink]="['/projects', p.id, 'home']" class="item-link">{{ p.name }}</a>
              <span class="item-subtitle">{{ p.detail }}</span>
            </div>
            <div class="item-body">
              <span class="chip" [class.chip-public]="p.isPublic" [class.chip-private]="!p.isPublic">
                {{ p.isPublic ? ('Auth.public' | translate) : ('Auth.private' | translate) }}
              </span>
            </div>
          </div>
        }
      }

      <h3 class="section-title mt-section">{{ 'Auth.test_campaigns' | translate }}</h3>

      @if (!loading && runs.length === 0) {
        <span class="empty-text">{{ 'Auth.no_test_campaigns' | translate }}</span>
      }
      @for (run of runs; track run.id; let i = $index) {
        <div class="item-card card-surface anim-stagger" [style.animation-delay.ms]="i * 50">
          <div class="item-header">
            <a [routerLink]="['/projects', run.projectId, 'runs', run.id]" class="item-link">
              {{ run.name }}
              @if (run.caseCount !== undefined) {
                <span class="count">({{ run.caseCount }})</span>
              }
            </a>
            @if (run.Project?.name) {
              <span class="item-subtitle">{{ run.Project?.name }}</span>
            }
          </div>
          @if (run.description) {
            <p class="run-desc">{{ run.description }}</p>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .account-container { padding: 24px 16px; }
    .profile-card { margin-bottom: 24px; padding: 20px; }
    .profile-row { display: flex; align-items: center; gap: 16px; }
    .user-details { display: flex; flex-direction: column; flex: 1; }
    .username { font-size: 1.1rem; }
    .email { color: var(--text-secondary); font-size: 0.9rem; }
    .section-title { font-weight: 700; font-size: 1.1rem; margin: 0 0 12px; letter-spacing: -0.01em; }
    .mt-section { margin-top: 32px; }
    .item-card { margin-bottom: 10px; padding: 16px 20px; }
    .item-header { display: flex; flex-direction: column; gap: 2px; }
    .item-subtitle { color: var(--text-secondary); font-size: 0.85rem; }
    .item-body { margin-top: 8px; }
    .item-link { color: var(--text-primary); text-decoration: none; font-weight: 600; transition: color var(--transition-fast); }
    .item-link:hover { color: var(--brand-green-dark); }
    .count { color: var(--text-secondary); font-weight: normal; margin-left: 4px; font-size: 0.9rem; }
    .empty-text { color: var(--text-secondary); }
    .run-desc { font-size: 0.85rem; color: var(--text-secondary); margin: 8px 0 0; }
    .chip { display: inline-block; padding: 2px 10px; border-radius: 12px; font-size: 12px; font-weight: 600; }
  `],
})
export class AccountComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly projectSvc = inject(ProjectService);
  private readonly runSvc = inject(RunService);

  readonly currentUser = this.auth.currentUser;

  projects: Project[] = [];
  runs: Run[] = [];
  loading = true;

  ngOnInit(): void {
    forkJoin({
      projects: this.projectSvc.getMyProjects(),
      runs: this.runSvc.getMyRuns(),
    }).subscribe({
      next: ({ projects, runs }) => {
        this.projects = projects;
        this.runs = runs;
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }
}
