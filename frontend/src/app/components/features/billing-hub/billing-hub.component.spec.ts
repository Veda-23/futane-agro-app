import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BillingHubComponent } from './billing-hub.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ApiService } from '../../../api.service';
import { NotificationService } from '../../../services/notification.service';
import { of } from 'rxjs';

describe('BillingHubComponent', () => {
  let component: BillingHubComponent;
  let fixture: ComponentFixture<BillingHubComponent>;
  let mockApiService: jasmine.SpyObj<ApiService>;

  beforeEach(async () => {
    mockApiService = jasmine.createSpyObj('ApiService', ['getSales', 'getDispatches', 'getPayments', 'getRawMaterials', 'getTransports', 'getSalaries', 'createAuditLog', 'getSettings']);
    mockApiService.getSales.and.returnValue(of([]));
    mockApiService.getDispatches.and.returnValue(of([]));
    mockApiService.getPayments.and.returnValue(of([]));
    mockApiService.getRawMaterials.and.returnValue(of([]));
    mockApiService.getTransports.and.returnValue(of([]));
    mockApiService.getSalaries.and.returnValue(of([]));
    mockApiService.getSettings.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [BillingHubComponent, HttpClientTestingModule],
      providers: [
        { provide: ApiService, useValue: mockApiService },
        NotificationService
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(BillingHubComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('amountToWords should convert numbers to words', () => {
    expect(component.amountToWords(1500)).toContain('One Thousand Five Hundred');
  });

  it('generateDocumentNumber should format serial correctly', () => {
    const docNo = component.generateDocumentNumber('tax_invoice');
    expect(docNo).toContain('FA-INV-');
  });
});
