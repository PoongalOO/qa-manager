import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { Run } from '../../../core/models/run.model';

export interface RunDialogData {
  run?: Run | null;
}

export interface RunDialogResult {
  name: string;
  description: string;
}

@Component({
  selector: 'app-run-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>{{ data.run ? 'Modifier la campagne' : 'Nouvelle campagne' }}</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="dialog-form">
        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Nom de la campagne</mat-label>
          <input matInput formControlName="name" />
          @if (form.get('name')?.hasError('required')) {
            <mat-error>Le nom est requis</mat-error>
          }
        </mat-form-field>
        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Description</mat-label>
          <textarea matInput formControlName="description" rows="3"></textarea>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Annuler</button>
      <button mat-flat-button color="primary" (click)="onSave()">
        {{ data.run ? 'Modifier' : 'Créer' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`.dialog-form { display: flex; flex-direction: column; gap: 8px; min-width: 360px; padding-top: 8px; }`],
})
export class RunDialogComponent {
  data = inject<RunDialogData>(MAT_DIALOG_DATA);
  private dialogRef = inject(MatDialogRef<RunDialogComponent>);
  private fb = inject(FormBuilder);

  form = this.fb.group({
    name: [this.data.run?.name ?? '', Validators.required],
    description: [this.data.run?.description ?? ''],
  });

  onSave(): void {
    if (this.form.invalid) return;
    const { name, description } = this.form.value;
    this.dialogRef.close({ name: name!, description: description ?? '' } as RunDialogResult);
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
