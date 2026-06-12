import { Route } from '@angular/router';

export const appRoutes: Route[] = [
  {
    path: '',
    loadComponent: () => import('./chat/chat').then(m => m.Chat),
  },
  {
    path: 'login',
    loadComponent: () => import('./login/login').then(m => m.Login),
  }
];
