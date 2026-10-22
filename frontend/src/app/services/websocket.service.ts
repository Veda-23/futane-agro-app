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

/**
 * Realtime Event Notification Payload distributed over STOMP WebSockets.
 */
export interface RealtimeUpdate {
  /** Target ERP functional module (e.g., 'INVENTORY', 'SALES', 'PRODUCTION') */
  module: string;
  /** Action verb (e.g., 'CREATE', 'UPDATE', 'DISPATCH') */
  action: string;
  /** Human-readable event description */
  description: string;
  /** ISO-8601 creation timestamp */
  timestamp: string;
}

/**
 * WebSocket Real-Time Client Service.
 * <p>
 * Manages bidirectional STOMP over SockJS socket connections to the Spring Boot message broker:
 * <ul>
 *   <li>Establishes connection to endpoint {@code /ws-erp} with automatic fallback transport.</li>
 *   <li>Configures 20-second incoming/outgoing keepalive heartbeats and 10-second auto-reconnection delay.</li>
 *   <li>Subscribes to broadcast destination {@code /topic/updates} to stream telemetry updates.</li>
 *   <li>Exposes an RxJS Observable {@link #updates$} consumed by UI toast dispatchers and table auto-refreshers.</li>
 * </ul>
 */
@Injectable({ providedIn: 'root' })
export class WebSocketService {
  private client?: Client;
  private updatesSubject = new Subject<RealtimeUpdate>();
  /** Observable stream of realtime domain events broadcast from the backend */
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
