import { Component, OnInit, ViewChild, ElementRef, inject } from '@angular/core';
import {
  ReactiveFormsModule, FormBuilder, FormGroup,
  Validators, AbstractControl, ValidationErrors,
} from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslatePipe } from '@ngx-translate/core';
import { AuthService } from '../../../core/services/auth.service';
import { UserService } from '../../../core/services/user.service';
import { LanguageService } from '../../../core/services/language.service';
import { UserAvatarComponent } from '../../../shared/components/user-avatar/user-avatar.component';

function passwordMatchValidator(group: AbstractControl): ValidationErrors | null {
  const newPw = group.get('newPassword')?.value;
  const confirm = group.get('confirmPassword')?.value;
  return newPw && confirm && newPw !== confirm ? { passwordMismatch: true } : null;
}

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    ReactiveFormsModule, MatCardModule, MatButtonModule, MatInputModule,
    MatFormFieldModule, MatSelectModule, MatIconModule, MatProgressSpinnerModule,
    UserAvatarComponent, TranslatePipe,
  ],
  template: `
    <div class="settings-container anim-page">
      <h1 class="settings-title">{{ 'Auth.profile_settings' | translate }}</h1>

      <!-- Username -->
      <mat-card class="settings-card">
        <mat-card-header>
          <mat-card-title>{{ 'Auth.change_username' | translate }}</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <form [formGroup]="usernameForm">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>{{ 'Auth.new_username' | translate }}</mat-label>
              <input matInput formControlName="username"
                [placeholder]="currentUser()?.username ?? ''" autocomplete="username" />
              @if (usernameForm.get('username')?.hasError('required') && usernameForm.get('username')?.touched) {
                <mat-error>{{ 'Auth.username_required' | translate }}</mat-error>
              }
            </mat-form-field>
          </form>
        </mat-card-content>
        <mat-card-actions class="card-actions">
          <button mat-flat-button color="primary" [disabled]="usernameForm.invalid || updatingUsername" (click)="onUpdateUsername()">
            {{ 'Auth.update_username' | translate }}
          </button>
        </mat-card-actions>
      </mat-card>

      <!-- Password -->
      <mat-card class="settings-card">
        <mat-card-header>
          <mat-card-title>{{ 'Auth.change_password' | translate }}</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <form [formGroup]="passwordForm">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>{{ 'Auth.current_password' | translate }}</mat-label>
              <input matInput type="password" formControlName="currentPassword" autocomplete="current-password" />
            </mat-form-field>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>{{ 'Auth.new_password' | translate }}</mat-label>
              <input matInput type="password" formControlName="newPassword" autocomplete="new-password" />
              @if (passwordForm.get('newPassword')?.hasError('minlength') && passwordForm.get('newPassword')?.touched) {
                <mat-error>{{ 'Auth.password_min_length' | translate }}</mat-error>
              }
            </mat-form-field>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>{{ 'Auth.confirm_new_password' | translate }}</mat-label>
              <input matInput type="password" formControlName="confirmPassword" autocomplete="new-password" />
              @if (passwordForm.hasError('passwordMismatch') && passwordForm.get('confirmPassword')?.touched) {
                <mat-error>{{ 'Auth.password_not_match' | translate }}</mat-error>
              }
            </mat-form-field>
          </form>
        </mat-card-content>
        <mat-card-actions class="card-actions">
          <button mat-flat-button color="primary" [disabled]="passwordForm.invalid || updatingPassword" (click)="onUpdatePassword()">
            {{ 'Auth.update_password' | translate }}
          </button>
        </mat-card-actions>
      </mat-card>

      <!-- Locale -->
      <mat-card class="settings-card">
        <mat-card-header>
          <mat-card-title>{{ 'Auth.change_locale' | translate }}</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <form [formGroup]="localeForm">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>{{ 'Auth.change_locale' | translate }}</mat-label>
              <mat-select formControlName="locale">
                @for (loc of supportedLocales; track loc.code) {
                  <mat-option [value]="loc.code">{{ loc.name }}</mat-option>
                }
              </mat-select>
            </mat-form-field>
          </form>
        </mat-card-content>
        <mat-card-actions class="card-actions">
          <button mat-flat-button color="primary"
            [disabled]="localeForm.get('locale')?.value === currentUser()?.locale || updatingLocale"
            (click)="onUpdateLocale()">
            {{ 'Auth.update_locale' | translate }}
          </button>
        </mat-card-actions>
      </mat-card>

      <!-- Avatar -->
      <mat-card class="settings-card">
        <mat-card-header>
          <mat-card-title>{{ 'Auth.change_avatar' | translate }}</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <div class="avatar-section">
            <app-user-avatar
              [username]="currentUser()?.username"
              [avatarPath]="currentUser()?.avatarPath"
              [size]="80"
            />
            <p class="avatar-hint">{{ 'Auth.max_file_size_5mb' | translate }}</p>
          </div>
          <input #fileInput type="file" accept="image/*" class="hidden-input" (change)="onFileSelected($event)" />
        </mat-card-content>
        <mat-card-actions class="card-actions">
          @if (currentUser()?.avatarPath) {
            <button mat-stroked-button class="danger-btn" [disabled]="uploadingAvatar" (click)="onDeleteAvatar()">
              {{ 'Auth.remove_avatar' | translate }}
            </button>
          }
          <button mat-flat-button color="primary" [disabled]="uploadingAvatar" (click)="fileInput.click()">
            {{ 'Auth.upload_avatar' | translate }}
          </button>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [`
    .settings-container { padding: 24px 16px; }
    .settings-title { font-size: 1.5rem; font-weight: 700; margin-bottom: 24px; letter-spacing: -0.01em; }
    .settings-card { margin-bottom: 24px; border-radius: var(--radius-md) !important; box-shadow: var(--shadow-sm) !important; }
    .full-width { width: 100%; }
    .card-actions { display: flex; justify-content: flex-end; padding: 8px 16px 16px; gap: 8px; }
    .avatar-section { display: flex; align-items: center; gap: 16px; margin-bottom: 8px; }
    .avatar-hint { color: var(--text-secondary); font-size: 0.85rem; margin: 0; }
    .hidden-input { display: none; }
    .danger-btn { color: #d32f2f; border-color: #d32f2f; }
  `],
})
export class SettingsComponent implements OnInit {
  @ViewChild('fileInput') fileInputRef!: ElementRef<HTMLInputElement>;

  private readonly auth = inject(AuthService);
  private readonly userSvc = inject(UserService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly fb = inject(FormBuilder);
  private readonly langSvc = inject(LanguageService);

  readonly currentUser = this.auth.currentUser;

  readonly supportedLocales = [
    { code: 'de', name: 'Deutsch' },
    { code: 'en', name: 'English' },
    { code: 'fr', name: 'Français' },
    { code: 'ja', name: '日本語' },
    { code: 'pt-BR', name: 'Português (BR)' },
    { code: 'zh-CN', name: '中文 (简体)' },
  ];

  usernameForm!: FormGroup;
  passwordForm!: FormGroup;
  localeForm!: FormGroup;

  updatingUsername = false;
  updatingPassword = false;
  updatingLocale = false;
  uploadingAvatar = false;

  ngOnInit(): void {
    this.usernameForm = this.fb.group({ username: ['', Validators.required] });
    this.passwordForm = this.fb.group(
      {
        currentPassword: ['', Validators.required],
        newPassword: ['', [Validators.required, Validators.minLength(8)]],
        confirmPassword: ['', Validators.required],
      },
      { validators: passwordMatchValidator },
    );
    this.localeForm = this.fb.group({ locale: [this.auth.currentUser()?.locale ?? 'fr'] });
  }

  onUpdateUsername(): void {
    if (this.usernameForm.invalid) return;
    const { username } = this.usernameForm.value;
    this.updatingUsername = true;
    this.userSvc.updateUsername(username).subscribe({
      next: (res) => {
        this.auth.updateCurrentUser({ username: res.user.username });
        this.usernameForm.reset();
        this.snackBar.open("Nom d'utilisateur mis à jour", 'OK', { duration: 3000 });
        this.updatingUsername = false;
      },
      error: () => {
        this.snackBar.open('Erreur lors de la mise à jour', 'OK', { duration: 3000 });
        this.updatingUsername = false;
      },
    });
  }

  onUpdatePassword(): void {
    if (this.passwordForm.invalid) return;
    const { currentPassword, newPassword } = this.passwordForm.value;
    this.updatingPassword = true;
    this.userSvc.updatePassword(currentPassword, newPassword).subscribe({
      next: () => {
        this.passwordForm.reset();
        this.snackBar.open('Mot de passe mis à jour', 'OK', { duration: 3000 });
        this.updatingPassword = false;
      },
      error: (err) => {
        const msg = err.status === 401 ? 'Mot de passe actuel incorrect' : 'Erreur lors de la mise à jour';
        this.snackBar.open(msg, 'OK', { duration: 3000 });
        this.updatingPassword = false;
      },
    });
  }

  onUpdateLocale(): void {
    const { locale } = this.localeForm.value;
    this.updatingLocale = true;
    this.userSvc.updateLocale(locale).subscribe({
      next: (res) => {
        this.auth.updateCurrentUser({ locale: res.user.locale });
        this.langSvc.setLanguage(locale);
        this.snackBar.open('Langue mise à jour', 'OK', { duration: 3000 });
        this.updatingLocale = false;
      },
      error: () => {
        this.snackBar.open('Erreur lors de la mise à jour', 'OK', { duration: 3000 });
        this.updatingLocale = false;
      },
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      this.snackBar.open('Seules les images sont acceptées', 'OK', { duration: 3000 });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      this.snackBar.open('Taille maximale : 5 Mo', 'OK', { duration: 3000 });
      return;
    }
    this.uploadingAvatar = true;
    this.userSvc.uploadAvatar(file).subscribe({
      next: (res) => {
        this.auth.updateCurrentUser(res.user);
        this.snackBar.open('Avatar mis à jour', 'OK', { duration: 3000 });
        this.uploadingAvatar = false;
        input.value = '';
      },
      error: () => {
        this.snackBar.open('Erreur lors du téléchargement', 'OK', { duration: 3000 });
        this.uploadingAvatar = false;
      },
    });
  }

  onDeleteAvatar(): void {
    this.uploadingAvatar = true;
    this.userSvc.deleteAvatar().subscribe({
      next: () => {
        this.auth.updateCurrentUser({ avatarPath: null });
        this.snackBar.open('Avatar supprimé', 'OK', { duration: 3000 });
        this.uploadingAvatar = false;
      },
      error: () => {
        this.snackBar.open('Erreur lors de la suppression', 'OK', { duration: 3000 });
        this.uploadingAvatar = false;
      },
    });
  }
}
