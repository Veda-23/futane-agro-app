import { Routes } from '@angular/router';

/**
 * <h1>Client Application Route Definitions</h1>
 * <p>
 * Defines Angular client routes. The application uses a single-page reactive tab orchestrator
 * managed inside {@code AppComponent} with fallback wildcards.
 * </p>
 */
export const routes: Routes = [
  { path: '', pathMatch: 'full', children: [] },
  { path: '**', redirectTo: '' }
];
