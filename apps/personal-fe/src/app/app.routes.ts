import { Route } from '@angular/router';

export const appRoutes: Route[] = [{
  path: 'login',
  loadComponent: () => import('./login/login').then(m => m.Login),
}];
