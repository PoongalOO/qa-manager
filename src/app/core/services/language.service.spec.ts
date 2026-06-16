import { TestBed } from '@angular/core/testing';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { LanguageService, SUPPORTED_LANGS } from './language.service';

describe('LanguageService', () => {
  let service: LanguageService;
  let translateSvc: TranslateService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [...provideTranslateService({ fallbackLang: 'fr' })],
    });
    service = TestBed.inject(LanguageService);
    translateSvc = TestBed.inject(TranslateService);
  });

  afterEach(() => localStorage.clear());

  it('should be created', () => expect(service).toBeTruthy());

  it('SUPPORTED_LANGS includes en and fr', () => {
    expect(SUPPORTED_LANGS).toContain('en');
    expect(SUPPORTED_LANGS).toContain('fr');
  });

  it('init() uses fr when no localStorage entry', () => {
    service.init();
    expect(translateSvc.currentLang()).toBe('fr');
  });

  it('init() uses stored language from localStorage', () => {
    localStorage.setItem('qa_lang', 'en');
    service.init();
    expect(translateSvc.currentLang()).toBe('en');
  });

  it('init() falls back to fr for unsupported stored lang', () => {
    localStorage.setItem('qa_lang', 'xx');
    service.init();
    expect(translateSvc.currentLang()).toBe('fr');
  });

  it('setLanguage() updates currentLang and persists to localStorage', () => {
    service.setLanguage('en');
    expect(translateSvc.currentLang()).toBe('en');
    expect(localStorage.getItem('qa_lang')).toBe('en');
  });

  it('currentLang() reflects the active language', () => {
    service.setLanguage('en');
    expect(service.currentLang()).toBe('en');
  });

  it('initFromLocale() applies valid locale', () => {
    service.initFromLocale('en');
    expect(translateSvc.currentLang()).toBe('en');
  });

  it('initFromLocale() ignores null', () => {
    service.init();
    const before = translateSvc.currentLang();
    service.initFromLocale(null);
    expect(translateSvc.currentLang()).toBe(before);
  });

  it('initFromLocale() falls back to fr for unsupported locale', () => {
    service.initFromLocale('xx');
    expect(translateSvc.currentLang()).toBe('fr');
  });
});
