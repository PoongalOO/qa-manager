import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { SettingsComponent } from './settings.component';
import { UserService } from '../../../core/services/user.service';
import { User } from '../../../core/models/user.model';
import { provideTranslateService } from '@ngx-translate/core';

const mockUser: User = {
  id: 1, email: 'test@test.com', username: 'testuser',
  role: 0, avatarPath: null, locale: 'fr', createdAt: '', updatedAt: '',
};

describe('SettingsComponent', () => {
  let component: SettingsComponent;
  let fixture: ComponentFixture<SettingsComponent>;
  let userSvc: jasmine.SpyObj<UserService>;
  let http: HttpTestingController;

  beforeEach(async () => {
    localStorage.clear();
    userSvc = jasmine.createSpyObj('UserService', [
      'updateUsername', 'updatePassword', 'updateLocale', 'uploadAvatar', 'deleteAvatar',
    ]);

    await TestBed.configureTestingModule({
      imports: [SettingsComponent, NoopAnimationsModule],
      providers: [
        ...provideTranslateService({ fallbackLang: 'fr' }),
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: UserService, useValue: userSvc },
      ],
    }).compileComponents();

    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(SettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    http.verify();
    localStorage.clear();
  });

  it('should create', () => expect(component).toBeTruthy());

  it('username form starts invalid when empty', () => {
    expect(component.usernameForm.invalid).toBeTrue();
  });

  it('username form is valid when filled', () => {
    component.usernameForm.setValue({ username: 'newname' });
    expect(component.usernameForm.valid).toBeTrue();
  });

  it('password form requires at least 8 chars for new password', () => {
    component.passwordForm.setValue({
      currentPassword: 'old', newPassword: 'short', confirmPassword: 'short',
    });
    expect(component.passwordForm.get('newPassword')?.hasError('minlength')).toBeTrue();
  });

  it('password form detects mismatch', () => {
    component.passwordForm.setValue({
      currentPassword: 'old', newPassword: 'password1', confirmPassword: 'password2',
    });
    expect(component.passwordForm.hasError('passwordMismatch')).toBeTrue();
  });

  it('password form is valid when all correct and passwords match', () => {
    component.passwordForm.setValue({
      currentPassword: 'oldpass', newPassword: 'password1', confirmPassword: 'password1',
    });
    expect(component.passwordForm.valid).toBeTrue();
  });

  it('does not call updateUsername when form invalid', () => {
    component.onUpdateUsername();
    expect(userSvc.updateUsername).not.toHaveBeenCalled();
  });

  it('calls updateUsername on valid submit', () => {
    userSvc.updateUsername.and.returnValue(of({ user: mockUser }));
    component.usernameForm.setValue({ username: 'newname' });
    component.onUpdateUsername();
    expect(userSvc.updateUsername).toHaveBeenCalledWith('newname');
  });

  it('sets updatingUsername false on success', () => {
    userSvc.updateUsername.and.returnValue(of({ user: mockUser }));
    component.usernameForm.setValue({ username: 'newname' });
    component.onUpdateUsername();
    expect(component.updatingUsername).toBeFalse();
  });

  it('sets updatingUsername false on error', () => {
    userSvc.updateUsername.and.returnValue(throwError(() => new Error('fail')));
    component.usernameForm.setValue({ username: 'newname' });
    component.onUpdateUsername();
    expect(component.updatingUsername).toBeFalse();
  });

  it('calls updatePassword on valid submit', () => {
    userSvc.updatePassword.and.returnValue(of({ message: 'ok' }));
    component.passwordForm.setValue({
      currentPassword: 'oldpass', newPassword: 'password1', confirmPassword: 'password1',
    });
    component.onUpdatePassword();
    expect(userSvc.updatePassword).toHaveBeenCalledWith('oldpass', 'password1');
  });

  it('sets updatingPassword false on error', () => {
    userSvc.updatePassword.and.returnValue(throwError(() => ({ status: 401 })));
    component.passwordForm.setValue({
      currentPassword: 'old', newPassword: 'password1', confirmPassword: 'password1',
    });
    component.onUpdatePassword();
    expect(component.updatingPassword).toBeFalse();
  });

  it('calls updateLocale on submit', () => {
    userSvc.updateLocale.and.returnValue(of({ user: { ...mockUser, locale: 'fr' } }));
    component.localeForm.setValue({ locale: 'fr' });
    component.onUpdateLocale();
    expect(userSvc.updateLocale).toHaveBeenCalledWith('fr');
  });

  it('sets updatingLocale false on error', () => {
    userSvc.updateLocale.and.returnValue(throwError(() => new Error('fail')));
    component.localeForm.setValue({ locale: 'de' });
    component.onUpdateLocale();
    expect(component.updatingLocale).toBeFalse();
  });
});
