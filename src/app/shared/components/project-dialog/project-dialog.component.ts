import { Component, OnInit, inject } from '@angular/core';
import {
  MAT_DIALOG_DATA, MatDialogRef, MatDialogModule,
} from '@angular/material/dialog';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { Project } from '../../../core/models/project.model';

export interface ProjectDialogData {
  project?: Project | null;
}

export interface ProjectDialogResult {
  name: string;
  detail: string;
  isPublic: boolean;
}

@Component({
  selector: 'app-project-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatCheckboxModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ data.project ? 'Modifier le projet' : 'Nouveau projet' }}</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="dialog-form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Nom du projet</mat-label>
          <input matInput formControlName="name" />
          @if (form.get('name')?.hasError('required') && form.get('name')?.touched) {
            <mat-error>Le nom est requis</mat-error>
          }
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Description</mat-label>
          <textarea matInput formControlName="detail" rows="3"></textarea>
        </mat-form-field>
        <mat-checkbox formControlName="isPublic">Projet public</mat-checkbox>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Annuler</button>
      <button mat-flat-button [disabled]="form.invalid" (click)="onSave()">Enregistrer</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-form { display: flex; flex-direction: column; gap: 8px; padding-top: 8px; min-width: 400px; }
    .full-width { width: 100%; }
  `],
})
export class ProjectDialogComponent implements OnInit {
  readonly data = inject<ProjectDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<ProjectDialogComponent>);
  private readonly fb = inject(FormBuilder);

  form!: FormGroup;

  ngOnInit(): void {
    this.form = this.fb.group({
      name: [this.data?.project?.name ?? '', Validators.required],
      detail: [this.data?.project?.detail ?? ''],
      isPublic: [this.data?.project?.isPublic ?? false],
    });
  }

  onSave(): void {
    if (this.form.invalid) return;
    this.dialogRef.close(this.form.value as ProjectDialogResult);
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
