import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
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

function passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
  const pw = control.get('password');
  const confirm = control.get('confirmPassword');
  if (pw && confirm && pw.value !== confirm.value) {
    confirm.setErrors({ passwordMismatch: true });
    return { passwordMismatch: true };
  }
  return null;
}

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterLink,
    MatCardModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatProgressSpinnerModule, MatSnackBarModule,
    TranslatePipe,
  ],
  template: `
    <div class="auth-container">
      <mat-card class="auth-card anim-page">
        <img src="assets/img/logo-qa-ft.png" alt="QA Manager" class="auth-logo">
        <mat-card-header>
          <mat-card-subtitle class="auth-subtitle">{{ 'Auth.signup_subtitle' | translate }}</mat-card-subtitle>
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
              <mat-label>{{ 'Auth.username' | translate }}</mat-label>
              <input matInput formControlName="username" autocomplete="username">
              <mat-error *ngIf="form.get('username')?.hasError('required')">{{ 'Auth.username_empty' | translate }}</mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>{{ 'Auth.password' | translate }}</mat-label>
              <input matInput type="password" formControlName="password" autocomplete="new-password">
              <mat-error *ngIf="form.get('password')?.hasError('required')">{{ 'Auth.password_required' | translate }}</mat-error>
              <mat-error *ngIf="form.get('password')?.hasError('minlength')">{{ 'Auth.invalid_password' | translate }}</mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>{{ 'Auth.confirm_password' | translate }}</mat-label>
              <input matInput type="password" formControlName="confirmPassword" autocomplete="new-password">
              <mat-error *ngIf="form.get('confirmPassword')?.hasError('passwordMismatch')">{{ 'Auth.password_not_match' | translate }}</mat-error>
            </mat-form-field>

            <button mat-raised-button color="primary" type="submit"
              class="full-width" [disabled]="loading">
              @if (loading) {
                <mat-spinner diameter="20" style="display:inline-block"></mat-spinner>
              } @else {
                {{ 'Auth.signup' | translate }}
              }
            </button>
          </form>
        </mat-card-content>

        <mat-card-actions>
          <span class="auth-link">{{ 'Auth.or_signin' | translate }}
            <a routerLink="/auth/signin">{{ 'Auth.signin' | translate }}</a>
          </span>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [`
    .auth-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      padding: 16px;
      background: linear-gradient(135deg, var(--surface-muted) 0%, #ffffff 60%, var(--brand-green-light) 100%);
    }
    .auth-card {
      width: 100%;
      max-width: 400px;
      padding: 8px 8px 4px;
      border-radius: var(--radius-lg) !important;
      box-shadow: var(--shadow-lg) !important;
    }
    .auth-logo { display: block; height: 64px; margin: 12px auto 0; }
    .auth-subtitle { text-align: center; }
    .full-width { width: 100%; margin-bottom: 12px; }
    .auth-link { font-size: 14px; padding: 8px 16px; }
  `],
})
export class SignupComponent {
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
      username: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
    }, { validators: passwordMatchValidator });
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    this.loading = true;
    const { email, username, password } = this.form.value;

    this.auth.signUp(email, username, password).subscribe({
      next: () => this.router.navigate(['/account']),
      error: (err) => {
        const key = err.status === 409 ? 'Auth.email_already_exist' : 'Auth.signup_error';
        this.translate.get(key).subscribe(msg => {
          this.snackBar.open(msg, 'OK', { duration: 4000 });
        });
        this.loading = false;
      },
    });
  }
}
