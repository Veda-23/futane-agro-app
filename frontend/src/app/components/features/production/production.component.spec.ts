import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProductionComponent } from './production.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ApiService } from '../../../api.service';
import { NotificationService } from '../../../services/notification.service';
import { of, throwError } from 'rxjs';

describe('ProductionComponent', () => {
  let component: ProductionComponent;
  let fixture: ComponentFixture<ProductionComponent>;
  let mockApiService: jasmine.SpyObj<ApiService>;
  let mockNotificationService: jasmine.SpyObj<NotificationService>;

  const mockPpdData = [
    { id: '1', date: '2026-08-01', crateType: 'Standard', totalProduction: 100, successful: 90, rejected: 10, shift: 'Morning Shift' },
    { id: '2', date: '2026-08-02', crateType: 'Premium', totalProduction: 80, successful: 75, rejected: 5, shift: 'Afternoon Shift' }
  ];

  beforeEach(async () => {
    mockApiService = jasmine.createSpyObj('ApiService', ['getPpd', 'getPpm', 'createPpd', 'deletePpd']);
    mockNotificationService = jasmine.createSpyObj('NotificationService', [
      'success', 'error', 'warning', 'info', 'showSaveSuccess', 'showDeleteSuccess', 'showDeleteConfirm', 'showValidationError'
    ]);

    mockApiService.getPpd.and.returnValue(of(mockPpdData));
    mockApiService.getPpm.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [ProductionComponent, HttpClientTestingModule],
      providers: [
        { provide: ApiService, useValue: mockApiService },
        { provide: NotificationService, useValue: mockNotificationService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ProductionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // ── Initialization ─────────────────────────────────────────
  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should call getPpd and getPpm on init', () => {
    expect(mockApiService.getPpd).toHaveBeenCalled();
    expect(mockApiService.getPpm).toHaveBeenCalled();
  });

  it('should load ppdList with 2 records', () => {
    expect(component.ppdList.length).toBe(2);
  });

  // ── Auto-calculation ────────────────────────────────────────
  it('should auto-calculate totalProduction when successful + rejected change', () => {
    component.ppdForm.successful = 75;
    component.ppdForm.rejected = 15;
    component.recalculateTotal();
    expect(component.ppdForm.totalProduction).toBe(90);
  });

  it('should set totalProduction to 0 when both inputs are empty', () => {
    component.ppdForm.successful = 0;
    component.ppdForm.rejected = 0;
    component.recalculateTotal();
    expect(component.ppdForm.totalProduction).toBe(0);
  });

  // ── Efficiency Calculation ──────────────────────────────────
  it('should compute correct efficiency percentage and color', () => {
    expect(component.getEfficiencyPct(90, 100)).toBe(90);
    expect(component.getEfficiencyColor(90, 100)).toBe('var(--accent-success, #10b981)');
    expect(component.getEfficiencyPct(75, 100)).toBe(75);
    expect(component.getEfficiencyColor(75, 100)).toBe('var(--accent-warning, #f59e0b)');
    expect(component.getEfficiencyPct(50, 100)).toBe(50);
    expect(component.getEfficiencyColor(50, 100)).toBe('var(--accent-error, #ef4444)');
  });

  // ── isViewer() ──────────────────────────────────────────────
  it('should return true for VIEWER role', () => {
    component.loggedInUser = { role: 'VIEWER' };
    expect(component.isViewer()).toBeTrue();
  });

  it('should return false for ADMIN role', () => {
    component.loggedInUser = { role: 'ADMIN' };
    expect(component.isViewer()).toBeFalse();
  });

  // ── API error handling ──────────────────────────────────────
  it('should set hasError to true when API fails', () => {
    mockApiService.getPpd.and.returnValue(throwError(() => new Error('Network error')));
    component.loadData();
    expect(component.hasError).toBeTrue();
    expect(component.isLoading).toBeFalse();
  });
});
