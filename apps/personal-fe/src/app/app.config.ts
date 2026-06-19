import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import {provideHttpClient, withInterceptors} from "@angular/common/http";
import {provideMarkdown} from "ngx-markdown";
import { appRoutes } from './app.routes';
import {environment} from "../environments/environment";

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(appRoutes),
    provideMarkdown(),
    provideHttpClient(
      withInterceptors([
        (req, next) => {
          if (req.url.startsWith('/')) {
            const apiReq = req.clone({
              url: `${environment.apiUrl}${req.url}`
            });
            return next(apiReq);
          }
          return next(req);
        }
      ])
    )
  ],
};
