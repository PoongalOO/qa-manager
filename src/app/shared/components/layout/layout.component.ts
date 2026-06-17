import { Component, computed, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { AuthService } from '../../../core/services/auth.service';
import { LanguageService, SUPPORTED_LANGS } from '../../../core/services/language.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    CommonModule, RouterOutlet, RouterLink, RouterLinkActive,
    MatToolbarModule, MatSidenavModule, MatListModule,
    MatIconModule, MatButtonModule, MatMenuModule, MatDividerModule,
    TranslatePipe,
  ],
  template: `
    <mat-sidenav-container class="sidenav-container">
      <mat-sidenav mode="side" opened class="sidenav">
        <div class="brand">
          <a routerLink="/" class="brand-link">QA Manager</a>
        </div>
        <mat-nav-list>
          <a mat-list-item routerLink="/account" routerLinkActive="active-link">
            <mat-icon matListItemIcon>person</mat-icon>
            <span matListItemTitle>{{ 'Header.account' | translate }}</span>
          </a>
          <a mat-list-item routerLink="/projects" routerLinkActive="active-link">
            <mat-icon matListItemIcon>folder_open</mat-icon>
            <span matListItemTitle>{{ 'Header.projects' | translate }}</span>
          </a>
          @if (isAdmin()) {
            <mat-divider></mat-divider>
            <a mat-list-item routerLink="/admin" routerLinkActive="active-link">
              <mat-icon matListItemIcon>admin_panel_settings</mat-icon>
              <span matListItemTitle>{{ 'Header.admin' | translate }}</span>
            </a>
          }
          <mat-divider></mat-divider>
          <a mat-list-item routerLink="/health" routerLinkActive="active-link">
            <mat-icon matListItemIcon>monitor_heart</mat-icon>
            <span matListItemTitle>{{ 'Header.health' | translate }}</span>
          </a>
        </mat-nav-list>
      </mat-sidenav>

      <mat-sidenav-content>
        <mat-toolbar color="primary" class="toolbar">
          <span class="toolbar-spacer"></span>
          <button mat-icon-button [matMenuTriggerFor]="userMenu">
            <mat-icon>account_circle</mat-icon>
          </button>
          <mat-menu #userMenu="matMenu">
            <div class="user-info">
              <strong>{{ username() }}</strong>
              <small>{{ email() }}</small>
            </div>
            <mat-divider></mat-divider>
            <button mat-menu-item routerLink="/account/settings">
              <mat-icon>settings</mat-icon>
              {{ 'Header.profile_settings' | translate }}
            </button>
            <button mat-menu-item [matMenuTriggerFor]="langMenu">
              <mat-icon>translate</mat-icon>
              {{ 'Header.languages' | translate }}
            </button>
            <button mat-menu-item (click)="signOut()">
              <mat-icon>logout</mat-icon>
              {{ 'Header.signout' | translate }}
            </button>
          </mat-menu>
          <mat-menu #langMenu="matMenu">
            @for (lang of supportedLangs; track lang) {
              <button mat-menu-item (click)="setLang(lang)"
                      [class.active-lang]="currentLang() === lang">
                {{ lang }}
              </button>
            }
          </mat-menu>
        </mat-toolbar>

        <main class="main-content">
          <router-outlet></router-outlet>
        </main>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: [`
    .sidenav-container { height: 100vh; }
    .sidenav { width: 220px; background: #1e1e2e; color: #cdd6f4; }
    .brand { padding: 16px; border-bottom: 1px solid #45475a; }
    .brand-link { color: #cba6f7; font-size: 18px; font-weight: 700; text-decoration: none; }
    .toolbar { position: sticky; top: 0; z-index: 100; }
    .toolbar-spacer { flex: 1; }
    .main-content { padding: 24px; min-height: calc(100vh - 64px); }
    .active-link { background: rgba(203,166,247,.15) !important; }
    .active-lang { font-weight: 700; }
    .user-info { padding: 8px 16px; display: flex; flex-direction: column; }
    .user-info small { color: #888; font-size: 12px; }
    mat-nav-list a { color: #cdd6f4; }
    mat-nav-list mat-icon { color: #89b4fa; }
    mat-nav-list .mdc-list-item__primary-text { color: #cdd6f4; }
  `],
})
export class LayoutComponent {
  private readonly authSvc = inject(AuthService);
  private readonly router = inject(Router);
  private readonly langSvc = inject(LanguageService);

  readonly isAdmin = this.authSvc.isAdmin;
  readonly username = computed(() => this.authSvc.currentUser()?.username ?? '');
  readonly email = computed(() => this.authSvc.currentUser()?.email ?? '');
  readonly supportedLangs = [...SUPPORTED_LANGS];

  currentLang(): string {
    return this.langSvc.currentLang();
  }

  setLang(lang: string): void {
    this.langSvc.setLanguage(lang as any);
  }

  signOut(): void {
    this.authSvc.signOut();
    this.router.navigate(['/auth/signin']);
  }
}
