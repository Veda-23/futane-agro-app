import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';

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
