import { Injectable } from '@angular/core';
import { Client, Message } from '@stomp/stompjs';

// Browser polyfill for sockjs-client
if (typeof (window as any) !== 'undefined' && !(window as any).global) {
  (window as any).global = window;
}

// @ts-ignore
import SockJS from 'sockjs-client';
import { Subject, Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface RealtimeUpdate {
  module: string;
  action: string;
  description: string;
  timestamp: string;
}

@Injectable({ providedIn: 'root' })
export class WebSocketService {
  private client?: Client;
  private updatesSubject = new Subject<RealtimeUpdate>();
  public updates$: Observable<RealtimeUpdate> = this.updatesSubject.asObservable();

  constructor() {
    this.initWebSocket();
  }

  private initWebSocket() {
    try {
      const wsUrl = `${environment.apiUrl.replace('/api', '')}/ws-erp`;
      this.client = new Client({
        webSocketFactory: () => new (SockJS as any)(wsUrl),
        reconnectDelay: 10000,
        heartbeatIncoming: 20000,
        heartbeatOutgoing: 20000,
        debug: (str) => {
          // Silent in production
        }
      });

      this.client.onConnect = () => {
        this.client?.subscribe('/topic/updates', (message: Message) => {
          if (message.body) {
            try {
              const parsed: RealtimeUpdate = JSON.parse(message.body);
              this.updatesSubject.next(parsed);
            } catch (e) {
              console.warn('Failed to parse realtime message', e);
            }
          }
        });
      };

      this.client.onStompError = (frame) => {
        // Fallback gracefully without breaking UI
      };

      this.client.activate();
    } catch (e) {
      console.warn('WebSocket init deferred', e);
    }
  }

  disconnect() {
    if (this.client) {
      this.client.deactivate();
    }
  }
}
