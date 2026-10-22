import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';

/**
 * Enterprise Dark / Light Theme Switching Service.
 * <p>
 * Controls application visual aesthetics across the DOM:
 * <ul>
 *   <li><b>Environment-Isolated Storage:</b> Stores user preferences in isolated keys ({@code erp_dark_mode_prod} vs {@code erp_dark_mode_uat})
 *       to prevent theme collisions between testing and production staging instances.</li>
 *   <li><b>CSS Body Class Binding:</b> Dynamically toggles {@code .dark-theme} on {@code document.body},
 *       activating global CSS custom property variables for dark surfaces ({@code #0b1120}), card backgrounds, and neon borders.</li>
 *   <li><b>Reactive State:</b> Exposes {@link #isDark$} BehaviorSubject observable and synchronous {@link #isDark} boolean.</li>
 * </ul>
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly storageKey = environment.production && !(environment as any).uat
    ? 'erp_dark_mode_prod'
    : 'erp_dark_mode_uat';

  private _isDark$ = new BehaviorSubject<boolean>(false);
  isDark$ = this._isDark$.asObservable();

  constructor() {
    // Remove old shared key (migration)
    localStorage.removeItem('erp_dark_mode');
    // Restore saved preference
    const saved = localStorage.getItem(this.storageKey);
    if (saved === 'true') {
      this.setDark(true, false);
    }
  }

  toggle() {
    this.setDark(!this._isDark$.value);
  }

  setDark(value: boolean, save = true) {
    this._isDark$.next(value);
    if (value) {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
    if (save) {
      localStorage.setItem(this.storageKey, value ? 'true' : 'false');
    }
  }

  get isDark(): boolean {
    return this._isDark$.value;
  }
}
