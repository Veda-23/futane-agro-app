import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { routes } from './app.routes';
import { jwtInterceptor } from './jwt.interceptor';

/**
 * <h1>Application Configuration Root</h1>
 * <p>
 * Configures the Angular application dependency injection providers.
 * Injects client routing and HTTP client with {@link jwtInterceptor} for bearer token attachment.
 * </p>
 */
export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([jwtInterceptor]))
  ]
};
