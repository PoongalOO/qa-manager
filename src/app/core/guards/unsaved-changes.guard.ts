import { CanDeactivateFn } from '@angular/router';

export interface CanDeactivateComponent {
  canDeactivate(): boolean;
}

export const unsavedChangesGuard: CanDeactivateFn<CanDeactivateComponent> = (component) => {
  if (component.canDeactivate()) return true;
  return window.confirm('Vous avez des modifications non enregistrées. Voulez-vous quitter la page ?');
};
