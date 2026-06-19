import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, FormsModule, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { TranslatePipe } from '@ngx-translate/core';
import { CaseService } from '../../../core/services/case.service';
import { TagService } from '../../../core/services/tag.service';
import { AuthService } from '../../../core/services/auth.service';
import { Case, CaseStep, Attachment, PRIORITIES, TEST_TYPES, AUTOMATION_STATUSES, TEMPLATES, CASE_STATES } from '../../../core/models/case.model';
import { Tag } from '../../../core/models/project.model';
import { ProjectNavComponent } from '../../../shared/components/project-nav/project-nav.component';
import { CanDeactivateComponent } from '../../../core/guards/unsaved-changes.guard';

@Component({
  selector: 'app-case-detail',
  standalone: true,
  imports: [
    CommonModule, RouterModule, ReactiveFormsModule, FormsModule,
    MatCardModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatChipsModule, MatProgressSpinnerModule, MatTooltipModule, MatDividerModule, TranslatePipe,
    ProjectNavComponent,
  ],
  template: `
    <div class="page-container anim-page">
      <app-project-nav [projectId]="projectId" />

      @if (loading) {
        <mat-spinner diameter="40" />
      } @else if (testCase) {
        <div class="case-content">
          <!-- Breadcrumb / back link -->
          <div class="breadcrumb">
            <a [routerLink]="['/projects', projectId, 'folders', folderId, 'cases']" class="back-link">
              <mat-icon>arrow_back</mat-icon>
              {{ 'Cases.back_to_cases' | translate }}
            </a>
          </div>

          <!-- Header -->
          <div class="case-header">
            <h2 class="case-id">Cas #{{ testCase.id }}</h2>
            <div class="header-actions">
              <button mat-flat-button color="primary" (click)="onSave()"
                      [disabled]="saving || form.invalid">
                @if (!saving) { <mat-icon>save</mat-icon> }
                <span>{{ saving ? ('Cases.saving' | translate) : ('Cases.save' | translate) }}</span>
              </button>
            </div>
          </div>

          <!-- Basic info card -->
          <mat-card class="section-card">
            <mat-card-header><mat-card-title>Informations de base</mat-card-title></mat-card-header>
            <mat-card-content>
              <form [formGroup]="form" (ngSubmit)="onSave()">
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Titre</mat-label>
                  <input matInput formControlName="title" (input)="markDirty()" />
                  @if (form.get('title')?.hasError('required')) {
                    <mat-error>Le titre est requis</mat-error>
                  }
                </mat-form-field>

                <div class="fields-row">
                  <mat-form-field appearance="outline">
                    <mat-label>État</mat-label>
                    <mat-select formControlName="state" (selectionChange)="markDirty()">
                      @for (s of caseStates; track s; let i = $index) {
                        <mat-option [value]="i">{{ s }}</mat-option>
                      }
                    </mat-select>
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>Priorité</mat-label>
                    <mat-select formControlName="priority" (selectionChange)="markDirty()">
                      @for (p of priorities; track p; let i = $index) {
                        <mat-option [value]="i">{{ p }}</mat-option>
                      }
                    </mat-select>
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>Type</mat-label>
                    <mat-select formControlName="type" (selectionChange)="markDirty()">
                      @for (t of testTypes; track t; let i = $index) {
                        <mat-option [value]="i">{{ t }}</mat-option>
                      }
                    </mat-select>
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>Automatisation</mat-label>
                    <mat-select formControlName="automationStatus" (selectionChange)="markDirty()">
                      @for (a of automationStatuses; track a; let i = $index) {
                        <mat-option [value]="i">{{ a }}</mat-option>
                      }
                    </mat-select>
                  </mat-form-field>
                </div>

                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Description</mat-label>
                  <textarea matInput formControlName="description" rows="3" (input)="markDirty()"></textarea>
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Modèle</mat-label>
                  <mat-select formControlName="template" (selectionChange)="markDirty()">
                    <mat-option [value]="0">Texte</mat-option>
                    <mat-option [value]="1">Étapes</mat-option>
                  </mat-select>
                </mat-form-field>

                @if (form.get('template')?.value === 0) {
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Préconditions</mat-label>
                    <textarea matInput formControlName="preConditions" rows="3" (input)="markDirty()"></textarea>
                  </mat-form-field>
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Résultats attendus</mat-label>
                    <textarea matInput formControlName="expectedResults" rows="3" (input)="markDirty()"></textarea>
                  </mat-form-field>
                }
              </form>
            </mat-card-content>
          </mat-card>

          <!-- Steps card (template = 1) -->
          @if (form.get('template')?.value === 1) {
            <mat-card class="section-card">
              <mat-card-header><mat-card-title>Étapes</mat-card-title></mat-card-header>
              <mat-card-content>
                @for (step of visibleSteps; track step.id; let i = $index) {
                  <div class="step-row">
                    <div class="step-number">{{ step.caseSteps.stepNo }}</div>
                    <mat-form-field appearance="outline" class="step-field">
                      <mat-label>Détails de l'étape</mat-label>
                      <textarea matInput [(ngModel)]="step.step" (input)="onStepChange(step)" rows="2"></textarea>
                    </mat-form-field>
                    <mat-form-field appearance="outline" class="step-field">
                      <mat-label>Résultat attendu</mat-label>
                      <textarea matInput [(ngModel)]="step.result" (input)="onStepChange(step)" rows="2"></textarea>
                    </mat-form-field>
                    <div class="step-actions">
                      <button mat-icon-button (click)="deleteStep(step.id)" matTooltip="Supprimer l'étape" [disabled]="!canEdit">
                        <mat-icon>delete</mat-icon>
                      </button>
                      <button mat-icon-button (click)="addStep(step.caseSteps.stepNo + 1)" matTooltip="Insérer une étape après" [disabled]="!canEdit">
                        <mat-icon>add</mat-icon>
                      </button>
                    </div>
                  </div>
                }
                @if (canEdit) {
                  <button mat-stroked-button (click)="addStep(visibleSteps.length + 1)" class="add-step-btn">
                    <mat-icon>add</mat-icon>
                    Nouvelle étape
                  </button>
                }
              </mat-card-content>
            </mat-card>
          }

          <!-- Tags card -->
          <mat-card class="section-card">
            <mat-card-header><mat-card-title>Tags</mat-card-title></mat-card-header>
            <mat-card-content>
              @if (projectTags.length === 0) {
                <p class="empty-text">Aucun tag disponible pour ce projet</p>
              } @else {
                <div class="tags-container">
                  @for (tag of projectTags; track tag.id) {
                    <mat-chip-option [selected]="isTagSelected(tag.id)"
                                    (click)="toggleTag(tag.id)"
                                    [disabled]="!canEdit || selectedTagIds.length >= 5 && !isTagSelected(tag.id)">
                      {{ tag.name }}
                    </mat-chip-option>
                  }
                </div>
                @if (selectedTagIds.length >= 5) {
                  <p class="warn-text">Maximum 5 tags</p>
                }
              }
            </mat-card-content>
          </mat-card>

          <!-- Attachments card -->
          @if (attachments.length > 0 || canEdit) {
            <mat-card class="section-card">
              <mat-card-header><mat-card-title>Pièces jointes</mat-card-title></mat-card-header>
              <mat-card-content>
                @for (att of attachments; track att.id) {
                  <div class="attachment-row">
                    <mat-icon>attach_file</mat-icon>
                    <span class="att-title">{{ att.title }}</span>
                    <a [href]="getDownloadUrl(att.id)" target="_blank" mat-icon-button matTooltip="Télécharger">
                      <mat-icon>download</mat-icon>
                    </a>
                    @if (canEdit) {
                      <button mat-icon-button (click)="deleteAttachment(att.id)" matTooltip="Supprimer">
                        <mat-icon color="warn">delete</mat-icon>
                      </button>
                    }
                  </div>
                }
                @if (canEdit) {
                  <div class="upload-zone" (click)="fileInput.click()" (dragover)="$event.preventDefault()" (drop)="onFileDrop($event)">
                    <mat-icon>cloud_upload</mat-icon>
                    <span>Cliquez ou déposez des fichiers ici</span>
                    <input #fileInput type="file" multiple style="display:none" (change)="onFileSelect($event)" />
                  </div>
                }
              </mat-card-content>
            </mat-card>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .page-container { padding: 16px; }
    .case-content { width: 100%; }
    .breadcrumb { margin-bottom: 12px; }
    .back-link { display: flex; align-items: center; gap: 4px; color: var(--text-secondary); text-decoration: none; font-size: 14px; transition: color var(--transition-fast); }
    .back-link:hover { color: var(--brand-green-dark); }
    .back-link mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .case-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
    .case-id { margin: 0; font-size: 1.3rem; font-weight: 700; letter-spacing: -0.01em; }
    .section-card { margin-bottom: 16px; border-radius: var(--radius-md) !important; box-shadow: var(--shadow-sm) !important; }
    .full-width { width: 100%; }
    .fields-row { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 8px; }
    .fields-row mat-form-field { flex: 1; min-width: 160px; }
    .step-row { display: flex; align-items: flex-start; gap: 8px; margin-bottom: 8px; }
    .step-number { width: 28px; height: 28px; border-radius: 50%; background: var(--brand-green); color: white; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; flex-shrink: 0; margin-top: 16px; }
    .step-field { flex: 1; }
    .step-actions { display: flex; flex-direction: column; margin-top: 8px; }
    .add-step-btn { margin-top: 8px; }
    .tags-container { display: flex; flex-wrap: wrap; gap: 8px; }
    .empty-text { color: var(--text-secondary); font-size: 13px; }
    .warn-text { color: #ca6702; font-size: 12px; margin-top: 4px; }
    .attachment-row { display: flex; align-items: center; gap: 8px; padding: 4px 0; border-bottom: 1px solid var(--border); }
    .att-title { flex: 1; font-size: 13px; }
    .upload-zone { border: 2px dashed var(--border); border-radius: var(--radius-sm); padding: 24px; text-align: center; cursor: pointer; margin-top: 12px; display: flex; flex-direction: column; align-items: center; gap: 8px; color: var(--text-secondary); transition: border-color var(--transition-fast), color var(--transition-fast); }
    .upload-zone:hover { border-color: var(--brand-green); color: var(--brand-green-dark); }
  `],
})
export class CaseDetailComponent implements OnInit, CanDeactivateComponent {
  @Input() projectId!: string;
  @Input() folderId!: string;
  @Input() caseId!: string;

  private caseSvc = inject(CaseService);
  private tagSvc = inject(TagService);
  private auth = inject(AuthService);
  private snackBar = inject(MatSnackBar);
  private fb = inject(FormBuilder);

  loading = true;
  saving = false;
  isDirty = false;
  idCounter = 0;

  testCase: Case | null = null;
  steps: CaseStep[] = [];
  projectTags: Tag[] = [];
  selectedTagIds: number[] = [];
  attachments: Attachment[] = [];

  priorities = PRIORITIES;
  testTypes = TEST_TYPES;
  automationStatuses = AUTOMATION_STATUSES;
  caseStates = CASE_STATES;

  form = this.fb.group({
    title: ['', Validators.required],
    state: [0],
    priority: [2],
    type: [0],
    automationStatus: [0],
    description: [''],
    template: [0],
    preConditions: [''],
    expectedResults: [''],
  });

  get canEdit(): boolean {
    const pid = parseInt(this.projectId, 10);
    return this.auth.isProjectManager(pid) || this.auth.isProjectDeveloper(pid);
  }

  get visibleSteps(): CaseStep[] {
    return this.steps
      .filter(s => s.editState !== 'deleted')
      .sort((a, b) => a.caseSteps.stepNo - b.caseSteps.stepNo);
  }

  ngOnInit(): void {
    const cid = parseInt(this.caseId, 10);
    const pid = parseInt(this.projectId, 10);
    forkJoin([
      this.caseSvc.getCase(cid),
      this.tagSvc.getTags(pid),
    ]).subscribe({
      next: ([tc, tags]) => {
        this.testCase = tc;
        this.projectTags = tags;
        this.steps = (tc.steps ?? []).map(s => ({ ...s, editState: 'notChanged' as const }));
        this.selectedTagIds = (tc.tags ?? []).map(t => t.id);
        this.attachments = tc.attachments ?? [];
        this.form.patchValue({
          title: tc.title,
          state: tc.state,
          priority: tc.priority,
          type: tc.type,
          automationStatus: tc.automationStatus,
          description: tc.description ?? '',
          template: tc.template,
          preConditions: tc.preConditions ?? '',
          expectedResults: tc.expectedResults ?? '',
        });
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }

  markDirty(): void { this.isDirty = true; }

  canDeactivate(): boolean { return !this.isDirty; }

  addStep(atStepNo: number): void {
    this.isDirty = true;
    this.idCounter -= 1;
    const newStep: CaseStep = {
      id: this.idCounter,
      step: '',
      result: '',
      caseSteps: { stepNo: atStepNo },
      editState: 'new',
    };
    this.steps = this.steps.map(s => {
      if (s.caseSteps.stepNo >= atStepNo && s.editState !== 'new') {
        return { ...s, editState: 'changed' as const, caseSteps: { stepNo: s.caseSteps.stepNo + 1 } };
      }
      if (s.caseSteps.stepNo >= atStepNo && s.editState === 'new') {
        return { ...s, caseSteps: { stepNo: s.caseSteps.stepNo + 1 } };
      }
      return s;
    });
    this.steps = [...this.steps, newStep];
  }

  deleteStep(stepId: number): void {
    this.isDirty = true;
    const target = this.steps.find(s => s.id === stepId);
    if (!target) return;
    const deletedNo = target.caseSteps.stepNo;
    this.steps = this.steps.map(s => {
      if (s.id === stepId) return { ...s, editState: 'deleted' as const };
      if (s.caseSteps.stepNo > deletedNo) {
        return { ...s, editState: s.editState === 'notChanged' ? 'changed' as const : s.editState, caseSteps: { stepNo: s.caseSteps.stepNo - 1 } };
      }
      return s;
    });
  }

  onStepChange(step: CaseStep): void {
    this.isDirty = true;
    this.steps = this.steps.map(s => {
      if (s.id === step.id && s.editState === 'notChanged') return { ...s, editState: 'changed' as const };
      return s;
    });
  }

  isTagSelected(tagId: number): boolean {
    return this.selectedTagIds.includes(tagId);
  }

  toggleTag(tagId: number): void {
    if (!this.canEdit) return;
    this.isDirty = true;
    if (this.isTagSelected(tagId)) {
      this.selectedTagIds = this.selectedTagIds.filter(id => id !== tagId);
    } else {
      if (this.selectedTagIds.length >= 5) return;
      this.selectedTagIds = [...this.selectedTagIds, tagId];
    }
  }

  getDownloadUrl(attachmentId: number): string {
    return this.caseSvc.getAttachmentDownloadUrl(attachmentId);
  }

  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) this.uploadFiles(Array.from(input.files));
  }

  onFileDrop(event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer?.files) this.uploadFiles(Array.from(event.dataTransfer.files));
  }

  uploadFiles(files: File[]): void {
    if (files.length === 0 || !this.testCase) return;
    this.caseSvc.uploadAttachments(this.testCase.id, files).subscribe({
      next: (atts) => {
        this.attachments = [...this.attachments, ...atts];
        this.snackBar.open('Fichiers ajoutés', 'OK', { duration: 2000 });
      },
      error: () => { this.snackBar.open('Erreur lors du chargement', 'Fermer', { duration: 3000 }); },
    });
  }

  deleteAttachment(attachmentId: number): void {
    this.caseSvc.deleteAttachment(attachmentId).subscribe({
      next: () => {
        this.attachments = this.attachments.filter(a => a.id !== attachmentId);
        this.snackBar.open('Fichier supprimé', 'OK', { duration: 2000 });
      },
      error: () => { this.snackBar.open('Erreur lors de la suppression', 'Fermer', { duration: 3000 }); },
    });
  }

  onSave(): void {
    if (this.form.invalid || !this.testCase) return;
    this.saving = true;
    const cid = this.testCase.id;
    const { title, state, priority, type, automationStatus, description, template, preConditions, expectedResults } = this.form.value;

    const saves = [
      this.caseSvc.updateCase(cid, { title: title!, state: state!, priority: priority!, type: type!, automationStatus: automationStatus!, description: description || null, template: template!, preConditions: preConditions || null, expectedResults: expectedResults || null }),
      this.caseSvc.updateSteps(cid, this.steps),
      this.caseSvc.updateCaseTags(cid, this.selectedTagIds),
    ];

    forkJoin(saves).subscribe({
      next: ([updatedCase]) => {
        this.testCase = updatedCase as Case;
        this.steps = (this.steps.filter(s => s.editState !== 'deleted')).map(s => ({ ...s, editState: 'notChanged' as const }));
        this.isDirty = false;
        this.saving = false;
        this.snackBar.open('Cas mis à jour', 'OK', { duration: 2000 });
      },
      error: () => {
        this.saving = false;
        this.snackBar.open('Erreur lors de la mise à jour', 'Fermer', { duration: 3000 });
      },
    });
  }
}
