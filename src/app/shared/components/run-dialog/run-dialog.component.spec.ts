import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RunDialogComponent } from './run-dialog.component';
import { Run } from '../../../core/models/run.model';

const mockRun: Run = {
  id: 1, name: 'Sprint 1', description: 'desc', configurations: 0,
  state: 0, projectId: 1, createdAt: '', updatedAt: '',
};

describe('RunDialogComponent', () => {
  let component: RunDialogComponent;
  let fixture: ComponentFixture<RunDialogComponent>;
  let dialogRef: jasmine.SpyObj<MatDialogRef<RunDialogComponent>>;

  function createComponent(run: Run | null = null): void {
    dialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [RunDialogComponent, NoopAnimationsModule],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: { run } },
        { provide: MatDialogRef, useValue: dialogRef },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(RunDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it('should create (create mode)', () => {
    createComponent();
    expect(component).toBeTruthy();
  });

  it('shows "Nouvelle campagne" title in create mode', () => {
    createComponent();
    expect(fixture.nativeElement.textContent).toContain('Nouvelle campagne');
  });

  it('shows "Modifier la campagne" title in edit mode', () => {
    createComponent(mockRun);
    expect(fixture.nativeElement.textContent).toContain('Modifier la campagne');
  });

  it('form is invalid when name is empty', () => {
    createComponent();
    expect(component.form.invalid).toBeTrue();
  });

  it('form is valid when name is filled', () => {
    createComponent();
    component.form.setValue({ name: 'Sprint 1', description: '' });
    expect(component.form.valid).toBeTrue();
  });

  it('pre-fills name and description when editing', () => {
    createComponent(mockRun);
    expect(component.form.get('name')?.value).toBe('Sprint 1');
    expect(component.form.get('description')?.value).toBe('desc');
  });

  it('onSave closes dialog with result when valid', () => {
    createComponent();
    component.form.setValue({ name: 'Sprint 2', description: 'sprint 2' });
    component.onSave();
    expect(dialogRef.close).toHaveBeenCalledWith({ name: 'Sprint 2', description: 'sprint 2' });
  });

  it('onSave does not close when form invalid', () => {
    createComponent();
    component.onSave();
    expect(dialogRef.close).not.toHaveBeenCalled();
  });

  it('onCancel closes dialog without value', () => {
    createComponent();
    component.onCancel();
    expect(dialogRef.close).toHaveBeenCalledWith();
  });
});
