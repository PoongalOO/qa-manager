import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ProjectDialogComponent } from './project-dialog.component';
import { Project } from '../../../core/models/project.model';

const mockProject: Project = {
  id: 1, name: 'Test Project', detail: 'desc', isPublic: true, userId: 1, createdAt: '', updatedAt: '',
};

describe('ProjectDialogComponent', () => {
  let component: ProjectDialogComponent;
  let fixture: ComponentFixture<ProjectDialogComponent>;
  let dialogRef: jasmine.SpyObj<MatDialogRef<ProjectDialogComponent>>;

  function createComponent(project: Project | null = null): void {
    dialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);
    TestBed.configureTestingModule({
      imports: [ProjectDialogComponent, NoopAnimationsModule],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: { project } },
        { provide: MatDialogRef, useValue: dialogRef },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(ProjectDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it('should create', async () => {
    await createComponent();
    expect(component).toBeTruthy();
  });

  it('form is invalid when name is empty', async () => {
    await createComponent();
    expect(component.form.get('name')?.hasError('required')).toBeTrue();
  });

  it('form is valid when name is filled', async () => {
    await createComponent();
    component.form.setValue({ name: 'My Project', detail: '', isPublic: false });
    expect(component.form.valid).toBeTrue();
  });

  it('pre-fills form when editing a project', async () => {
    await createComponent(mockProject);
    expect(component.form.get('name')?.value).toBe('Test Project');
    expect(component.form.get('isPublic')?.value).toBeTrue();
  });

  it('onSave closes dialog with form value when valid', async () => {
    await createComponent();
    component.form.setValue({ name: 'New Project', detail: 'details', isPublic: false });
    component.onSave();
    expect(dialogRef.close).toHaveBeenCalledWith({ name: 'New Project', detail: 'details', isPublic: false });
  });

  it('onCancel closes dialog without value', async () => {
    await createComponent();
    component.onCancel();
    expect(dialogRef.close).toHaveBeenCalledWith();
  });

  it('onSave does not close if form invalid', async () => {
    await createComponent();
    component.onSave();
    expect(dialogRef.close).not.toHaveBeenCalled();
  });
});
