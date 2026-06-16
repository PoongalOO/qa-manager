import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialogRef } from '@angular/material/dialog';
import { CreateUserDialogComponent } from './create-user-dialog.component';

describe('CreateUserDialogComponent', () => {
  let component: CreateUserDialogComponent;
  let fixture: ComponentFixture<CreateUserDialogComponent>;
  let dialogRef: jasmine.SpyObj<MatDialogRef<CreateUserDialogComponent>>;

  beforeEach(async () => {
    dialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);

    await TestBed.configureTestingModule({
      imports: [CreateUserDialogComponent, NoopAnimationsModule],
      providers: [{ provide: MatDialogRef, useValue: dialogRef }],
    }).compileComponents();

    fixture = TestBed.createComponent(CreateUserDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => expect(component).toBeTruthy());

  it('form is invalid when empty', () => {
    expect(component.form.valid).toBeFalse();
  });

  it('form is invalid with invalid email', () => {
    component.form.patchValue({ email: 'notanemail', username: 'user', password: 'password123', confirmPassword: 'password123', role: 1 });
    expect(component.form.get('email')?.hasError('email')).toBeTrue();
  });

  it('form is invalid when password is too short', () => {
    component.form.patchValue({ email: 'a@b.com', username: 'user', password: 'short', confirmPassword: 'short', role: 1 });
    expect(component.form.get('password')?.hasError('minlength')).toBeTrue();
  });

  it('form has passwordMismatch error when passwords differ', () => {
    component.form.patchValue({ email: 'a@b.com', username: 'user', password: 'password123', confirmPassword: 'different', role: 1 });
    expect(component.form.hasError('passwordMismatch')).toBeTrue();
  });

  it('form is valid with correct data', () => {
    component.form.patchValue({ email: 'a@b.com', username: 'testuser', password: 'password123', confirmPassword: 'password123', role: 1 });
    expect(component.form.valid).toBeTrue();
  });

  it('onSubmit closes dialog with result when form is valid', () => {
    component.form.patchValue({ email: 'a@b.com', username: 'testuser', password: 'password123', confirmPassword: 'password123', role: 0 });
    component.onSubmit();
    expect(dialogRef.close).toHaveBeenCalledWith({ email: 'a@b.com', username: 'testuser', password: 'password123', role: 0 });
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
