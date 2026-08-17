import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PaymentsComponent } from './payments.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ApiService } from '../../../api.service';
import { NotificationService } from '../../../services/notification.service';
import { of } from 'rxjs';

describe('PaymentsComponent', () => {
  let component: PaymentsComponent;
  let fixture: ComponentFixture<PaymentsComponent>;
  let mockApiService: jasmine.SpyObj<ApiService>;
  let mockNotificationService: jasmine.SpyObj<NotificationService>;

  beforeEach(async () => {
    mockApiService = jasmine.createSpyObj('ApiService', ['getParties', 'getPayments', 'getInvoices', 'getSales', 'createPayment', 'deletePayment', 'createAuditLog']);
    mockNotificationService = jasmine.createSpyObj('NotificationService', ['success', 'error', 'warning', 'info', 'confirmAction']);

    mockApiService.getParties.and.returnValue(of([{ id: 1, partyName: 'ABC Crates' }]));
    mockApiService.getPayments.and.returnValue(of([{ id: 1, amountReceived: 5000, paymentMode: 'UPI' }]));
    mockApiService.getInvoices.and.returnValue(of([]));
    mockApiService.getSales.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [PaymentsComponent, HttpClientTestingModule],
      providers: [
        { provide: ApiService, useValue: mockApiService },
        { provide: NotificationService, useValue: mockNotificationService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PaymentsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should load payments on init', () => {
    expect(component.paymentsList.length).toBe(1);
    expect(component.parties.length).toBe(1);
  });
});
