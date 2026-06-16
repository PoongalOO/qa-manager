import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';
import { adminGuard } from './core/guards/admin.guard';
import { unsavedChangesGuard } from './core/guards/unsaved-changes.guard';
import { LayoutComponent } from './shared/components/layout/layout.component';

export const routes: Routes = [
  { path: '', redirectTo: '/account', pathMatch: 'full' },

  {
    path: 'auth',
    canActivate: [guestGuard],
    children: [
      {
        path: 'signin',
        loadComponent: () =>
          import('./features/auth/signin/signin.component').then(m => m.SigninComponent),
      },
      {
        path: 'signup',
        loadComponent: () =>
          import('./features/auth/signup/signup.component').then(m => m.SignupComponent),
      },
      { path: '', redirectTo: 'signin', pathMatch: 'full' },
    ],
  },

  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'account',
        loadComponent: () =>
          import('./features/account/account.component').then(m => m.AccountComponent),
      },
      {
        path: 'account/settings',
        loadComponent: () =>
          import('./features/account/settings/settings.component').then(m => m.SettingsComponent),
      },
      {
        path: 'projects',
        loadComponent: () =>
          import('./features/projects/list/projects-list.component').then(m => m.ProjectsListComponent),
      },
      {
        path: 'projects/:projectId/home',
        loadComponent: () =>
          import('./features/projects/detail/home/project-home.component').then(m => m.ProjectHomeComponent),
      },
      {
        path: 'projects/:projectId/folders',
        loadComponent: () =>
          import('./features/folders/list/folders-list.component').then(m => m.FoldersListComponent),
      },
      {
        path: 'projects/:projectId/folders/:folderId/cases',
        loadComponent: () =>
          import('./features/folders/list/folders-list.component').then(m => m.FoldersListComponent),
      },
      {
        path: 'projects/:projectId/folders/:folderId/cases/:caseId',
        canDeactivate: [unsavedChangesGuard],
        loadComponent: () =>
          import('./features/folders/case-detail/case-detail.component').then(m => m.CaseDetailComponent),
      },
      {
        path: 'projects/:projectId/runs',
        loadComponent: () =>
          import('./features/runs/list/runs-list.component').then(m => m.RunsListComponent),
      },
      {
        path: 'projects/:projectId/runs/:runId',
        canDeactivate: [unsavedChangesGuard],
        loadComponent: () =>
          import('./features/runs/editor/run-editor.component').then(m => m.RunEditorComponent),
      },
      {
        path: 'projects/:projectId/members',
        loadComponent: () =>
          import('./features/projects/detail/members/members.component').then(m => m.MembersComponent),
      },
      {
        path: 'projects/:projectId/settings',
        loadComponent: () =>
          import('./features/projects/detail/settings/project-settings.component').then(m => m.ProjectSettingsComponent),
      },
      {
        path: 'admin',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./features/admin/admin.component').then(m => m.AdminComponent),
      },
      {
        path: 'health',
        loadComponent: () =>
          import('./features/health/health.component').then(m => m.HealthComponent),
      },
    ],
  },

  { path: '**', redirectTo: '/account' },
];
