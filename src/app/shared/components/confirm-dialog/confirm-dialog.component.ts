import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

export interface ConfirmDialogData {
  title?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>{{ data.title ?? 'Confirmation' }}</h2>
    <mat-dialog-content>
      <p>{{ data.message ?? 'Êtes-vous sûr ?' }}</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="cancel()">{{ data.cancelLabel ?? 'Annuler' }}</button>
      <button mat-flat-button class="danger-btn" (click)="confirm()">
        {{ data.confirmLabel ?? 'Supprimer' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`.danger-btn { color: #fff; background: #d32f2f; }`],
})
export class ConfirmDialogComponent {
  readonly data = inject<ConfirmDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<ConfirmDialogComponent>);

  confirm(): void { this.dialogRef.close(true); }
  cancel(): void { this.dialogRef.close(false); }
}
