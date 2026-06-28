import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SessionService {
  private logoutTimer: any;
  private warningTimer: any;
  private readonly SESSION_TIMEOUT = 30 * 60 * 1000; // 30 mins
  private readonly WARNING_TIME = 25 * 60 * 1000; // 25 mins

  public onWarning = new Subject<void>();
  public onLogout = new Subject<void>();

  constructor() {
    this.startSession();
  }

  public startSession() {
    this.clearSession();
    this.warningTimer = setTimeout(() => {
      this.onWarning.next();
    }, this.WARNING_TIME);

    this.logoutTimer = setTimeout(() => {
      this.handleAutoLogout();
    }, this.SESSION_TIMEOUT);
  }

  public clearSession() {
    if (this.logoutTimer) {
      clearTimeout(this.logoutTimer);
    }
    if (this.warningTimer) {
      clearTimeout(this.warningTimer);
    }
  }

  public resetTimer() {
    this.startSession();
  }

  private handleAutoLogout() {
    this.onLogout.next();
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
}
