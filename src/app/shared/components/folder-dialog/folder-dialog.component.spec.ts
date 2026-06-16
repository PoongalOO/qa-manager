import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { FolderDialogComponent } from './folder-dialog.component';
import { Folder } from '../../../core/models/folder.model';

const mockFolder: Folder = {
  id: 1, name: 'Tests', detail: 'My tests', projectId: 1,
  parentFolderId: null, createdAt: '', updatedAt: '',
};

describe('FolderDialogComponent', () => {
  let component: FolderDialogComponent;
  let fixture: ComponentFixture<FolderDialogComponent>;
  let dialogRef: jasmine.SpyObj<MatDialogRef<FolderDialogComponent>>;

  function createComponent(folder: Folder | null = null, parentFolderId: number | null = null): void {
    dialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [FolderDialogComponent, NoopAnimationsModule],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: { folder, parentFolderId } },
        { provide: MatDialogRef, useValue: dialogRef },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(FolderDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it('should create (new mode)', () => {
    createComponent();
    expect(component).toBeTruthy();
  });

  it('shows "Nouveau dossier" title when no folder passed', () => {
    createComponent();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Nouveau dossier');
  });

  it('shows "Modifier le dossier" title when folder passed', () => {
    createComponent(mockFolder);
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Modifier le dossier');
  });

  it('form is invalid when name is empty', () => {
    createComponent();
    expect(component.form.invalid).toBeTrue();
  });

  it('form is valid when name is filled', () => {
    createComponent();
    component.form.setValue({ name: 'Sprint 1', detail: '' });
    expect(component.form.valid).toBeTrue();
  });

  it('pre-fills name and detail when editing a folder', () => {
    createComponent(mockFolder);
    expect(component.form.get('name')?.value).toBe('Tests');
    expect(component.form.get('detail')?.value).toBe('My tests');
  });

  it('onSave closes dialog with form value when valid', () => {
    createComponent();
    component.form.setValue({ name: 'Sprint 1', detail: 'desc' });
    component.onSave();
    expect(dialogRef.close).toHaveBeenCalledWith({ name: 'Sprint 1', detail: 'desc', parentFolderId: null });
  });

  it('onSave passes parentFolderId from data', () => {
    createComponent(null, 5);
    component.form.setValue({ name: 'Sub', detail: '' });
    component.onSave();
    expect(dialogRef.close).toHaveBeenCalledWith({ name: 'Sub', detail: '', parentFolderId: 5 });
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
