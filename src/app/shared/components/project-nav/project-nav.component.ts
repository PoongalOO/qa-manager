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
      display: flex; gap: 2px; margin-bottom: 16px;
      border-bottom: 1px solid rgba(0,0,0,.12); padding-bottom: 4px; flex-wrap: wrap;
    }
    .active-nav { color: #7c4dff !important; background: rgba(124,77,255,.08) !important; border-radius: 4px; }
  `],
})
export class ProjectNavComponent {
  @Input() projectId!: string;
  readonly auth = inject(AuthService);
}
