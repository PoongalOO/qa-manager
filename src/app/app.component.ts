import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LanguageService } from './core/services/language.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `<router-outlet></router-outlet>`,
  styles: [`:host { display: block; height: 100%; }`],
})
export class AppComponent implements OnInit {
  private readonly langSvc = inject(LanguageService);

  ngOnInit(): void {
    this.langSvc.init();
  }
}
