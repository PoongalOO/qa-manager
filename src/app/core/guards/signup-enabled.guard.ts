import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SIGNUP_ENABLED } from '../config/feature-flags';

export const signupEnabledGuard: CanActivateFn = () => {
  if (SIGNUP_ENABLED) return true;
  const router = inject(Router);
  return router.createUrlTree(['/auth/signin']);
};
