import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ApiService } from './api.service';
import { NotificationService } from './services/notification.service';
import { WebSocketService } from './services/websocket.service';
import { of, EMPTY } from 'rxjs';

describe('AppComponent — Auth Flow', () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;
  let mockApi: jasmine.SpyObj<ApiService>;
  let mockWs: any;

  beforeEach(async () => {
    mockWs = {
      updates$: EMPTY
    };

    mockApi = jasmine.createSpyObj('ApiService', [
      'login', 'verifyOtp', 'getParties', 'getSales', 'getEmployees',
      'getPpd', 'getInventory', 'getSettings', 'getAuditLogs', 'getSalaries',
      'getTransports', 'getPayments', 'getExpenses', 'getMachines', 'getMachineBreakdowns',
      'getDispatches', 'getVendors', 'getRawMaterials', 'getBankTransactions', 'getUsers',
      'getInvoices', 'getStats', 'getCharts', 'getSystemHealth', 'getDrivers'
    ]);
    mockApi.getSettings.and.returnValue(of([]));
    mockApi.getParties.and.returnValue(of([]));
    mockApi.getSales.and.returnValue(of([]));
    mockApi.getEmployees.and.returnValue(of([]));
    mockApi.getPpd.and.returnValue(of([]));
    mockApi.getInventory.and.returnValue(of([]));
    mockApi.getAuditLogs.and.returnValue(of([]));
    mockApi.getSalaries.and.returnValue(of([]));
    mockApi.getTransports.and.returnValue(of([]));
    mockApi.getPayments.and.returnValue(of([]));
    mockApi.getExpenses.and.returnValue(of([]));
    mockApi.getMachines.and.returnValue(of([]));
    mockApi.getMachineBreakdowns.and.returnValue(of([]));
    mockApi.getDispatches.and.returnValue(of([]));
    mockApi.getVendors.and.returnValue(of([]));
    mockApi.getRawMaterials.and.returnValue(of([]));
    mockApi.getBankTransactions.and.returnValue(of([]));
    mockApi.getUsers.and.returnValue(of([]));
    mockApi.getInvoices.and.returnValue(of([]));
    mockApi.getStats.and.returnValue(of({}));
    mockApi.getCharts.and.returnValue(of({}));
    mockApi.getSystemHealth.and.returnValue(of({ status: 'UP' }));
    mockApi.getDrivers.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [AppComponent, HttpClientTestingModule],
      providers: [
        { provide: ApiService, useValue: mockApi },
        { provide: WebSocketService, useValue: mockWs },
        NotificationService
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
    localStorage.clear();
  });

  it('should start unauthenticated when no token is present', () => {
    fixture.detectChanges();
    expect(component.isAuthenticated).toBeFalse();
  });

  it('should NOT show dashboard tab when not authenticated', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const dashEl = compiled.querySelector('app-dashboard');
    expect(dashEl).toBeNull();
  });

  it('isTokenExpired should return true for an expired token', () => {
    const payload = { exp: Math.floor(Date.now() / 1000) - 3600 };
    const fakeToken = `header.${btoa(JSON.stringify(payload))}.signature`;
    expect((component as any).isTokenExpired(fakeToken)).toBeTrue();
  });

  it('isTokenExpired should return false for a valid token', () => {
    const payload = { exp: Math.floor(Date.now() / 1000) + 3600 };
    const fakeToken = `header.${btoa(JSON.stringify(payload))}.signature`;
    expect((component as any).isTokenExpired(fakeToken)).toBeFalse();
  });
});
