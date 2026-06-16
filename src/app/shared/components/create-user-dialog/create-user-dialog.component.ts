import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatRadioModule } from '@angular/material/radio';

export interface CreateUserResult {
  email: string;
  username: string;
  password: string;
  role: number;
}

export const ROLE_OPTIONS = [
  { value: 0, label: 'Administrateur' },
  { value: 1, label: 'Utilisateur' },
  { value: 2, label: 'QA Manager' },
];

function passwordMatchValidator(ctrl: AbstractControl): ValidationErrors | null {
  const pw = ctrl.get('password')?.value;
  const confirm = ctrl.get('confirmPassword')?.value;
  return pw === confirm ? null : { passwordMismatch: true };
}

@Component({
  selector: 'app-create-user-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatDialogModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatRadioModule,
  ],
  template: `
    <h2 mat-dialog-title>Créer un compte</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="dialog-form">
        <mat-form-field appearance="outline">
          <mat-label>Email</mat-label>
          <input matInput formControlName="email" type="email" autocomplete="off" />
          @if (form.get('email')?.hasError('required') && form.get('email')?.touched) {
            <mat-error>Email requis</mat-error>
          }
          @if (form.get('email')?.hasError('email') && form.get('email')?.touched) {
            <mat-error>Email invalide</mat-error>
          }
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Nom d'utilisateur</mat-label>
          <input matInput formControlName="username" autocomplete="off" />
          @if (form.get('username')?.hasError('required') && form.get('username')?.touched) {
            <mat-error>Nom requis</mat-error>
          }
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Mot de passe</mat-label>
          <input matInput formControlName="password" type="password" autocomplete="new-password" />
          @if (form.get('password')?.hasError('minlength') && form.get('password')?.touched) {
            <mat-error>Minimum 8 caractères</mat-error>
          }
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Confirmer le mot de passe</mat-label>
          <input matInput formControlName="confirmPassword" type="password" autocomplete="new-password" />
          @if (form.hasError('passwordMismatch') && form.get('confirmPassword')?.touched) {
            <mat-error>Les mots de passe ne correspondent pas</mat-error>
          }
        </mat-form-field>
        <mat-radio-group formControlName="role" class="role-group">
          @for (opt of roleOptions; track opt.value) {
            <mat-radio-button [value]="opt.value">{{ opt.label }}</mat-radio-button>
          }
        </mat-radio-group>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Annuler</button>
      <button mat-flat-button color="primary" (click)="onSubmit()" [disabled]="form.invalid">Créer</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-form { display: flex; flex-direction: column; gap: 8px; padding-top: 8px; min-width: 360px; }
    .role-group { display: flex; flex-direction: row; gap: 16px; flex-wrap: wrap; margin-top: 4px; }
  `],
})
export class CreateUserDialogComponent {
  private dialogRef = inject(MatDialogRef<CreateUserDialogComponent>);
  private fb = inject(FormBuilder);

  readonly roleOptions = ROLE_OPTIONS;

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    username: ['', Validators.required],
    password: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', Validators.required],
    role: [1, Validators.required],
  }, { validators: passwordMatchValidator });

  onCancel(): void {
    this.dialogRef.close(null);
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    const { email, username, password, role } = this.form.value;
    this.dialogRef.close({ email, username, password, role } as CreateUserResult);
  }
}
