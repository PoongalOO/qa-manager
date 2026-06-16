import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

export interface PasswordResetDialogData {
  username: string;
}

export interface PasswordResetResult {
  newPassword: string;
}

function passwordMatchValidator(ctrl: AbstractControl): ValidationErrors | null {
  const pw = ctrl.get('newPassword')?.value;
  const confirm = ctrl.get('confirmPassword')?.value;
  return pw === confirm ? null : { passwordMismatch: true };
}

@Component({
  selector: 'app-password-reset-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule,
  ],
  template: `
    <h2 mat-dialog-title>Réinitialiser le mot de passe</h2>
    <mat-dialog-content>
      <p class="subtitle">Utilisateur : <strong>{{ data.username }}</strong></p>
      <form [formGroup]="form" class="dialog-form">
        @if (form.hasError('passwordMismatch') && form.get('confirmPassword')?.touched) {
          <p class="error-msg">Les mots de passe ne correspondent pas</p>
        }
        <mat-form-field appearance="outline">
          <mat-label>Nouveau mot de passe</mat-label>
          <input matInput formControlName="newPassword" type="password" autocomplete="new-password" />
          @if (form.get('newPassword')?.hasError('minlength') && form.get('newPassword')?.touched) {
            <mat-error>Minimum 8 caractères</mat-error>
          }
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Confirmer le mot de passe</mat-label>
          <input matInput formControlName="confirmPassword" type="password" autocomplete="new-password" />
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Annuler</button>
      <button mat-flat-button color="warn" (click)="onSubmit()" [disabled]="form.invalid">Réinitialiser</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-form { display: flex; flex-direction: column; gap: 8px; padding-top: 8px; min-width: 340px; }
    .subtitle { margin: 0 0 8px; color: #555; font-size: 14px; }
    .error-msg { color: #b00020; font-size: 13px; margin: 0; }
  `],
})
export class PasswordResetDialogComponent {
  private dialogRef = inject(MatDialogRef<PasswordResetDialogComponent>);
  readonly data: PasswordResetDialogData = inject(MAT_DIALOG_DATA);
  private fb = inject(FormBuilder);

  form = this.fb.group({
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', Validators.required],
  }, { validators: passwordMatchValidator });

  onCancel(): void {
    this.dialogRef.close(null);
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    this.dialogRef.close({ newPassword: this.form.value.newPassword } as PasswordResetResult);
  }
}
