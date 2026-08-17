import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface AppNotification {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
  actionRoute?: string;
}

@Injectable({ providedIn: 'root' })
export class AppNotificationService {
  private _notifications$ = new BehaviorSubject<AppNotification[]>([]);
  public notifications$: Observable<AppNotification[]> = this._notifications$.asObservable();

  get unreadCount(): number {
    return this._notifications$.value.filter(n => !n.isRead).length;
  }

  push(type: AppNotification['type'], title: string, message: string, actionRoute?: string) {
    // Avoid duplicate notifications with identical title and message in the list
    const current = this._notifications$.value;
    if (current.some(n => n.title === title && n.message === message)) {
      return;
    }

    const notification: AppNotification = {
      id: Date.now().toString() + '-' + Math.random().toString(36).substr(2, 4),
      type,
      title,
      message,
      timestamp: new Date(),
      isRead: false,
      actionRoute
    };
    this._notifications$.next([notification, ...current].slice(0, 50));
  }

  markAllRead() {
    const updated = this._notifications$.value.map(n => ({ ...n, isRead: true }));
    this._notifications$.next(updated);
  }

  markRead(id: string) {
    const updated = this._notifications$.value.map(n =>
      n.id === id ? { ...n, isRead: true } : n
    );
    this._notifications$.next(updated);
  }

  remove(id: string) {
    this._notifications$.next(this._notifications$.value.filter(n => n.id !== id));
  }

  clearAll() {
    this._notifications$.next([]);
  }
}
