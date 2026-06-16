import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-signin',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterLink,
    MatCardModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatProgressSpinnerModule, MatSnackBarModule,
    TranslatePipe,
  ],
  template: `
    <div class="auth-container">
      <mat-card class="auth-card">
        <mat-card-header>
          <mat-card-title>QA Manager</mat-card-title>
          <mat-card-subtitle>{{ 'Auth.signin_subtitle' | translate }}</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <form [formGroup]="form" (ngSubmit)="onSubmit()">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>{{ 'Auth.email' | translate }}</mat-label>
              <input matInput type="email" formControlName="email" autocomplete="email">
              <mat-error *ngIf="form.get('email')?.hasError('required')">{{ 'Auth.email_required' | translate }}</mat-error>
              <mat-error *ngIf="form.get('email')?.hasError('email')">{{ 'Auth.invalid_email' | translate }}</mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>{{ 'Auth.password' | translate }}</mat-label>
              <input matInput type="password" formControlName="password" autocomplete="current-password">
              <mat-error *ngIf="form.get('password')?.hasError('required')">{{ 'Auth.password_required' | translate }}</mat-error>
            </mat-form-field>

            <button mat-raised-button color="primary" type="submit"
              class="full-width" [disabled]="loading">
              @if (loading) {
                <mat-spinner diameter="20" style="display:inline-block"></mat-spinner>
              } @else {
                {{ 'Auth.signin' | translate }}
              }
            </button>
          </form>
        </mat-card-content>

        <mat-card-actions>
          <span class="auth-link">{{ 'Auth.or_signup' | translate }}
            <a routerLink="/auth/signup">{{ 'Auth.signup' | translate }}</a>
          </span>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [`
    .auth-container { display: flex; justify-content: center; align-items: center; min-height: 100vh; padding: 16px; }
    .auth-card { width: 100%; max-width: 400px; }
    .full-width { width: 100%; margin-bottom: 12px; }
    .auth-link { font-size: 14px; padding: 8px 16px; }
  `],
})
export class SigninComponent {
  form: FormGroup;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router,
    private snackBar: MatSnackBar,
    private translate: TranslateService,
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    this.loading = true;
    const { email, password } = this.form.value;

    this.auth.signIn(email, password).subscribe({
      next: () => this.router.navigate(['/account']),
      error: () => {
        this.translate.get('Auth.signin_error').subscribe(msg => {
          this.snackBar.open(msg, 'OK', { duration: 4000 });
        });
        this.loading = false;
      },
    });
  }
}
