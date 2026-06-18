import { Component, Input, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-project-nav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, MatButtonModule, MatIconModule],
  template: `
    <nav class="project-nav">
      <a mat-button [routerLink]="['/projects', projectId, 'home']" routerLinkActive="active-nav">
        <mat-icon>bar_chart</mat-icon> Accueil
      </a>
      @if (auth.canCreateProject()) {
        <a mat-button [routerLink]="['/projects', projectId, 'folders']" routerLinkActive="active-nav">
          <mat-icon>folder</mat-icon> Cas de tests
        </a>
      }
      <a mat-button [routerLink]="['/projects', projectId, 'runs']" routerLinkActive="active-nav">
        <mat-icon>science</mat-icon> Campagnes
      </a>
      @if (auth.canManageMembers(+projectId)) {
        <a mat-button [routerLink]="['/projects', projectId, 'members']" routerLinkActive="active-nav">
          <mat-icon>group</mat-icon> Membres
        </a>
      }
      @if (auth.canCreateProject()) {
        <a mat-button [routerLink]="['/projects', projectId, 'settings']" routerLinkActive="active-nav">
          <mat-icon>settings</mat-icon> Paramètres
        </a>
      }
    </nav>
  `,
  styles: [`
    .project-nav {
      display: flex; gap: 4px; margin-bottom: 20px;
      border-bottom: 1px solid var(--border); padding-bottom: 4px; flex-wrap: wrap;
    }
    .project-nav a { color: var(--text-secondary); transition: color var(--transition-fast), background var(--transition-fast); border-radius: var(--radius-sm); }
    .project-nav a:hover { color: var(--text-primary); background: var(--surface-muted); }
    .active-nav { color: var(--brand-green-dark) !important; background: var(--brand-green-light) !important; }
  `],
})
export class ProjectNavComponent {
  @Input() projectId!: string;
  readonly auth = inject(AuthService);
}
