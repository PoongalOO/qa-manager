import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Router } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { SigninComponent } from './signin.component';
import { AuthService } from '../../../core/services/auth.service';
import { of, throwError } from 'rxjs';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { provideTranslateService } from '@ngx-translate/core';

describe('SigninComponent', () => {
  let component: SigninComponent;
  let fixture: ComponentFixture<SigninComponent>;
  let authSpy: jasmine.SpyObj<AuthService>;
  let router: Router;
  let snackBar: MatSnackBar;

  beforeEach(async () => {
    authSpy = jasmine.createSpyObj('AuthService', ['signIn']);

    await TestBed.configureTestingModule({
      imports: [SigninComponent, NoopAnimationsModule],
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

    fixture = TestBed.createComponent(SigninComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => expect(component).toBeTruthy());

  it('form is invalid when empty', () => expect(component.form.invalid).toBeTrue());

  it('form is valid with correct values', () => {
    component.form.setValue({ email: 'test@test.com', password: 'password' });
    expect(component.form.valid).toBeTrue();
  });

  it('does not call signIn when form is invalid', () => {
    component.onSubmit();
    expect(authSpy.signIn).not.toHaveBeenCalled();
  });

  it('calls signIn and navigates on success', () => {
    authSpy.signIn.and.returnValue(of({} as any));
    component.form.setValue({ email: 'test@test.com', password: 'password' });
    component.onSubmit();
    expect(authSpy.signIn).toHaveBeenCalledWith('test@test.com', 'password');
    expect(router.navigate).toHaveBeenCalledWith(['/account']);
  });

  it('resets loading and does not navigate on auth error', fakeAsync(() => {
    component.form.setValue({ email: 'test@test.com', password: 'wrong' });
    fixture.detectChanges();
    authSpy.signIn.and.returnValue(throwError(() => ({ status: 401 })));
    component.onSubmit();
    tick();
    expect(component.loading).toBeFalse();
    expect(router.navigate).not.toHaveBeenCalled();
  }));
});
