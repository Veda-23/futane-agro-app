import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SalesComponent } from './sales.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ApiService } from '../../../api.service';
import { NotificationService } from '../../../services/notification.service';
import { of } from 'rxjs';

describe('SalesComponent', () => {
  let component: SalesComponent;
  let fixture: ComponentFixture<SalesComponent>;
  let mockApiService: jasmine.SpyObj<ApiService>;
  let mockNotificationService: jasmine.SpyObj<NotificationService>;

  beforeEach(async () => {
    mockApiService = jasmine.createSpyObj('ApiService', ['getParties', 'getSales', 'createSale', 'deleteSale', 'createAuditLog']);
    mockNotificationService = jasmine.createSpyObj('NotificationService', ['success', 'error', 'warning', 'info', 'confirmAction']);

    mockApiService.getParties.and.returnValue(of([{ id: 1, partyName: 'Agro Crates' }]));
    mockApiService.getSales.and.returnValue(of([{ id: '1', date: '2026-08-01', totalAmount: 1000, quantity: 10, rate: 100, paid: 800, remaining: 200 }]));

    await TestBed.configureTestingModule({
      imports: [SalesComponent, HttpClientTestingModule],
      providers: [
        { provide: ApiService, useValue: mockApiService },
        { provide: NotificationService, useValue: mockNotificationService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SalesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('calculateSalesTotal should calculate totalAmount and remaining correctly', () => {
    component.salesForm.quantity = 20;
    component.salesForm.rate = 50;
    component.salesForm.paid = 400;
    component.calculateSalesTotal();
    expect(component.salesForm.totalAmount).toBe(1000);
    expect(component.salesForm.remaining).toBe(600);
  });
});
