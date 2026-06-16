import { Injectable, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

export const SUPPORTED_LANGS = ['de', 'en', 'fr', 'ja', 'pt-BR', 'zh-CN'] as const;
export type Lang = typeof SUPPORTED_LANGS[number];
const STORAGE_KEY = 'qa_lang';
const DEFAULT_LANG: Lang = 'fr';

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private readonly translate = inject(TranslateService);

  init(): void {
    const saved = localStorage.getItem(STORAGE_KEY) as Lang | null;
    const lang = this.isSupported(saved) ? saved : DEFAULT_LANG;
    this.translate.use(lang);
  }

  initFromLocale(locale: string | null | undefined): void {
    if (!locale) return;
    const lang = this.isSupported(locale) ? (locale as Lang) : DEFAULT_LANG;
    this.setLanguage(lang);
  }

  setLanguage(lang: Lang): void {
    localStorage.setItem(STORAGE_KEY, lang);
    this.translate.use(lang);
  }

  currentLang(): string {
    return this.translate.currentLang() ?? this.translate.fallbackLang() ?? DEFAULT_LANG;
  }

  private isSupported(lang: string | null | undefined): lang is Lang {
    return !!lang && (SUPPORTED_LANGS as readonly string[]).includes(lang);
  }
}
