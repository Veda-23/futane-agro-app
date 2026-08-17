import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InvoicesComponent } from './invoices.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ApiService } from '../../../api.service';
import { NotificationService } from '../../../services/notification.service';
import { of } from 'rxjs';

describe('InvoicesComponent', () => {
  let component: InvoicesComponent;
  let fixture: ComponentFixture<InvoicesComponent>;
  let mockApiService: jasmine.SpyObj<ApiService>;

  beforeEach(async () => {
    mockApiService = jasmine.createSpyObj('ApiService', ['getInvoices', 'createInvoice', 'deleteInvoice', 'createAuditLog']);
    mockApiService.getInvoices.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [InvoicesComponent, HttpClientTestingModule],
      providers: [
        { provide: ApiService, useValue: mockApiService },
        NotificationService
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(InvoicesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
