import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { SignupComponent } from './signup.component';
import { AuthService } from '../../../core/services/auth.service';
import { of, throwError } from 'rxjs';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { provideTranslateService } from '@ngx-translate/core';

describe('SignupComponent', () => {
  let component: SignupComponent;
  let fixture: ComponentFixture<SignupComponent>;
  let authSpy: jasmine.SpyObj<AuthService>;
  let router: Router;
  let snackBar: MatSnackBar;

  beforeEach(async () => {
    authSpy = jasmine.createSpyObj('AuthService', ['signUp']);

    await TestBed.configureTestingModule({
      imports: [SignupComponent, NoopAnimationsModule],
      providers: [
        ...provideTranslateService({ fallbackLang: 'fr' }),
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: authSpy },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    spyOn(router, 'navigate');
    snackBar = TestBed.inject(MatSnackBar);
    spyOn(snackBar, 'open');

    fixture = TestBed.createComponent(SignupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => expect(component).toBeTruthy());

  it('form invalid when empty', () => expect(component.form.invalid).toBeTrue());

  it('password mismatch is invalid', () => {
    component.form.setValue({ email: 'a@a.com', username: 'u', password: 'password1', confirmPassword: 'password2' });
    expect(component.form.invalid).toBeTrue();
  });

  it('valid when all fields correct and passwords match', () => {
    component.form.setValue({ email: 'a@a.com', username: 'u', password: 'password1', confirmPassword: 'password1' });
    expect(component.form.valid).toBeTrue();
  });

  it('calls signUp on valid submit', () => {
    authSpy.signUp.and.returnValue(of({} as any));
    component.form.setValue({ email: 'a@a.com', username: 'u', password: 'password1', confirmPassword: 'password1' });
    component.onSubmit();
    expect(authSpy.signUp).toHaveBeenCalledWith('a@a.com', 'u', 'password1');
    expect(router.navigate).toHaveBeenCalledWith(['/account']);
  });

  it('resets loading and does not navigate on error', fakeAsync(() => {
    component.form.setValue({ email: 'a@a.com', username: 'u', password: 'password1', confirmPassword: 'password1' });
    fixture.detectChanges();
    authSpy.signUp.and.returnValue(throwError(() => ({ status: 409 })));
    component.onSubmit();
    tick();
    expect(component.loading).toBeFalse();
    expect(router.navigate).not.toHaveBeenCalled();
  }));
});
