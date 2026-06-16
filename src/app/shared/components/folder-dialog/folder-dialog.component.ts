import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { Folder } from '../../../core/models/folder.model';

export interface FolderDialogData {
  folder?: Folder | null;
  parentFolderId?: number | null;
}

export interface FolderDialogResult {
  name: string;
  detail: string;
  parentFolderId: number | null;
}

@Component({
  selector: 'app-folder-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>{{ data.folder ? 'Modifier le dossier' : 'Nouveau dossier' }}</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="dialog-form">
        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Nom du dossier</mat-label>
          <input matInput formControlName="name" />
          @if (form.get('name')?.hasError('required')) {
            <mat-error>Le nom est requis</mat-error>
          }
        </mat-form-field>
        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Description</mat-label>
          <textarea matInput formControlName="detail" rows="3"></textarea>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Annuler</button>
      <button mat-flat-button color="primary" (click)="onSave()">
        {{ data.folder ? 'Modifier' : 'Créer' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`.dialog-form { display: flex; flex-direction: column; gap: 8px; min-width: 320px; padding-top: 8px; }`],
})
export class FolderDialogComponent {
  data = inject<FolderDialogData>(MAT_DIALOG_DATA);
  private dialogRef = inject(MatDialogRef<FolderDialogComponent>);
  private fb = inject(FormBuilder);

  form = this.fb.group({
    name: [this.data.folder?.name ?? '', Validators.required],
    detail: [this.data.folder?.detail ?? ''],
  });

  onSave(): void {
    if (this.form.invalid) return;
    const { name, detail } = this.form.value;
    this.dialogRef.close({ name: name!, detail: detail ?? '', parentFolderId: this.data.parentFolderId ?? null } as FolderDialogResult);
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
