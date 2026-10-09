import { Injectable, NgZone, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class IdleTimerService implements OnDestroy {
  private readonly IDLE_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes
  private lastActivity = Date.now();

  /** Emits when the user has been idle for IDLE_TIMEOUT_MS */
  readonly idle$ = new Subject<void>();
  /** Countdown value in mm:ss string, updated every second */
  readonly countdown$ = new Subject<string>();

  private countdownInterval: any;

  constructor(private zone: NgZone) {}

  start() {
    this.zone.runOutsideAngular(() => {
      const events = ['mousemove', 'click', 'keypress', 'scroll', 'touchstart'];
      events.forEach(e => window.addEventListener(e, () => this.reset(), { passive: true }));
    });
    this.startCountdown();
  }

  reset() {
    this.lastActivity = Date.now();
  }

  private startCountdown() {
    this.zone.runOutsideAngular(() => {
      this.countdownInterval = setInterval(() => {
        const elapsed = Date.now() - this.lastActivity;
        const remaining = Math.max(0, this.IDLE_TIMEOUT_MS - elapsed);
        const mins = Math.floor(remaining / 60000);
        const secs = Math.floor((remaining % 60000) / 1000);
        const label = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
        this.zone.run(() => this.countdown$.next(label));
        if (remaining === 0) {
          this.zone.run(() => this.idle$.next());
          clearInterval(this.countdownInterval);
        }
      }, 1000);
    });
  }

  stop() {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  }

  ngOnDestroy() {
    this.stop();
  }
}
