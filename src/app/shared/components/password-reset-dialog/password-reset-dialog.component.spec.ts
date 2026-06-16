import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { PasswordResetDialogComponent } from './password-reset-dialog.component';

describe('PasswordResetDialogComponent', () => {
  let component: PasswordResetDialogComponent;
  let fixture: ComponentFixture<PasswordResetDialogComponent>;
  let dialogRef: jasmine.SpyObj<MatDialogRef<PasswordResetDialogComponent>>;

  beforeEach(async () => {
    dialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);

    await TestBed.configureTestingModule({
      imports: [PasswordResetDialogComponent, NoopAnimationsModule],
      providers: [
        { provide: MatDialogRef, useValue: dialogRef },
        { provide: MAT_DIALOG_DATA, useValue: { username: 'testuser' } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PasswordResetDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => expect(component).toBeTruthy());

  it('exposes data username', () => {
    expect(component.data.username).toBe('testuser');
  });

  it('form is invalid when empty', () => {
    expect(component.form.valid).toBeFalse();
  });

  it('form is invalid when password is too short', () => {
    component.form.patchValue({ newPassword: 'short', confirmPassword: 'short' });
    expect(component.form.get('newPassword')?.hasError('minlength')).toBeTrue();
  });

  it('form has passwordMismatch error when passwords differ', () => {
    component.form.patchValue({ newPassword: 'password123', confirmPassword: 'different' });
    expect(component.form.hasError('passwordMismatch')).toBeTrue();
  });

  it('form is valid with matching passwords of sufficient length', () => {
    component.form.patchValue({ newPassword: 'password123', confirmPassword: 'password123' });
    expect(component.form.valid).toBeTrue();
  });

  it('onSubmit closes dialog with newPassword when form is valid', () => {
    component.form.patchValue({ newPassword: 'password123', confirmPassword: 'password123' });
    component.onSubmit();
    expect(dialogRef.close).toHaveBeenCalledWith({ newPassword: 'password123' });
  });

  it('onSubmit does not close dialog when form is invalid', () => {
    component.onSubmit();
    expect(dialogRef.close).not.toHaveBeenCalled();
  });

  it('onCancel closes dialog with null', () => {
    component.onCancel();
    expect(dialogRef.close).toHaveBeenCalledWith(null);
  });
});
