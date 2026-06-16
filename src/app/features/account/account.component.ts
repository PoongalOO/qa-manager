import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
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
    RouterLink, MatCardModule, MatButtonModule, MatIconModule,
    MatChipsModule, MatProgressSpinnerModule, UserAvatarComponent,
    TranslatePipe,
  ],
  template: `
    <div class="account-container">
      <mat-card class="profile-card">
        <mat-card-content>
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
        </mat-card-content>
      </mat-card>

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
        @for (p of projects; track p.id) {
          <mat-card class="item-card">
            <mat-card-header>
              <mat-card-title>
                <a [routerLink]="['/projects', p.id, 'home']" class="item-link">{{ p.name }}</a>
              </mat-card-title>
              <mat-card-subtitle>{{ p.detail }}</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <mat-chip>{{ p.isPublic ? ('Auth.public' | translate) : ('Auth.private' | translate) }}</mat-chip>
            </mat-card-content>
          </mat-card>
        }
      }

      <h3 class="section-title mt-section">{{ 'Auth.test_campaigns' | translate }}</h3>

      @if (!loading && runs.length === 0) {
        <span class="empty-text">{{ 'Auth.no_test_campaigns' | translate }}</span>
      }
      @for (run of runs; track run.id) {
        <mat-card class="item-card">
          <mat-card-header>
            <mat-card-title>
              <a [routerLink]="['/projects', run.projectId, 'runs', run.id]" class="item-link">
                {{ run.name }}
                @if (run.caseCount !== undefined) {
                  <span class="count">({{ run.caseCount }})</span>
                }
              </a>
            </mat-card-title>
            @if (run.Project?.name) {
              <mat-card-subtitle>{{ run.Project?.name }}</mat-card-subtitle>
            }
          </mat-card-header>
          @if (run.description) {
            <mat-card-content>
              <p class="run-desc">{{ run.description }}</p>
            </mat-card-content>
          }
        </mat-card>
      }
    </div>
  `,
  styles: [`
    .account-container { padding: 24px 16px; }
    .profile-card { margin-bottom: 24px; }
    .profile-row { display: flex; align-items: center; gap: 16px; }
    .user-details { display: flex; flex-direction: column; flex: 1; }
    .username { font-size: 1.1rem; }
    .email { color: #666; font-size: 0.9rem; }
    .section-title { font-weight: 600; font-size: 1.05rem; margin: 0 0 12px; }
    .mt-section { margin-top: 32px; }
    .item-card { margin-bottom: 8px; }
    .item-link { color: inherit; text-decoration: none; font-weight: 500; }
    .item-link:hover { text-decoration: underline; }
    .count { color: #999; font-weight: normal; margin-left: 4px; font-size: 0.9rem; }
    .empty-text { color: #888; }
    .run-desc { font-size: 0.85rem; color: #666; margin: 0; }
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
