import { Injectable, NgZone, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';

/**
 * Client-Side Inactivity Watchdog & Auto-Logout Countdown Service.
 * <p>
 * Guards application security by monitoring user interaction across the browser window:
 * <ul>
 *   <li><b>Passive Event Listeners:</b> Listens to {@code mousemove}, {@code click}, {@code keypress}, {@code scroll},
 *       and {@code touchstart} events with {@code { passive: true }}.</li>
 *   <li><b>NgZone Performance Shield:</b> Event registration and 1-second interval timers run strictly outside
 *       Angular's zone ({@link NgZone#runOutsideAngular}) to prevent constant change detection cycles.</li>
 *   <li><b>Session Timeout:</b> Triggers {@link #idle$} after 10 minutes (600,000 ms) of total inactivity,
 *       emitting a formatted {@code mm:ss} countdown string via {@link #countdown$} for display in warning dialogs.</li>
 * </ul>
 */
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
