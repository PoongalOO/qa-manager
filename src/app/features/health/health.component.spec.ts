import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { HealthComponent } from './health.component';
import { HealthService } from '../../core/services/health.service';
import { provideTranslateService } from '@ngx-translate/core';

describe('HealthComponent', () => {
  let component: HealthComponent;
  let fixture: ComponentFixture<HealthComponent>;
  let healthSvc: jasmine.SpyObj<HealthService>;

  beforeEach(async () => {
    healthSvc = jasmine.createSpyObj('HealthService', ['getHealth']);
    healthSvc.getHealth.and.returnValue(of({ status: 'ok' }));

    await TestBed.configureTestingModule({
      imports: [HealthComponent, NoopAnimationsModule],
      providers: [
        ...provideTranslateService({ fallbackLang: 'fr' }),
        { provide: HealthService, useValue: healthSvc },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HealthComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => expect(component).toBeTruthy());

  it('calls getHealth on init', () => {
    expect(healthSvc.getHealth).toHaveBeenCalled();
  });

  it('sets status from response', () => {
    expect(component.status).toBe('ok');
  });

  it('sets loading to false after load', () => {
    expect(component.loading).toBeFalse();
  });

  it('error is false on success', () => {
    expect(component.error).toBeFalse();
  });

  it('sets error status and flags on HTTP error', () => {
    healthSvc.getHealth.and.returnValue(throwError(() => new Error('fail')));
    component.ngOnInit();
    expect(component.status).toBe('error');
    expect(component.loading).toBeFalse();
    expect(component.error).toBeTrue();
  });

  it('exposes apiUrl from environment', () => {
    expect(component.apiUrl).toBe('/api');
  });
});
