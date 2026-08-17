import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DispatchComponent } from './dispatch.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ApiService } from '../../../api.service';
import { NotificationService } from '../../../services/notification.service';
import { of, throwError } from 'rxjs';

describe('DispatchComponent', () => {
  let component: DispatchComponent;
  let fixture: ComponentFixture<DispatchComponent>;
  let mockApiService: jasmine.SpyObj<ApiService>;
  let mockNotificationService: jasmine.SpyObj<NotificationService>;

  const mockDispatches = [
    { id: '1', dispatchDate: '2026-08-01', vehicleNumber: 'MH-12-1234', driverName: 'Ramesh', dispatchStatus: 'Pending', sale: { party: { partyName: 'ABC' } } }
  ];

  beforeEach(async () => {
    mockApiService = jasmine.createSpyObj('ApiService', ['getSales', 'getDispatches', 'createDispatch', 'deleteDispatch', 'createAuditLog']);
    mockNotificationService = jasmine.createSpyObj('NotificationService', ['success', 'error', 'warning', 'info', 'confirmAction']);

    mockApiService.getSales.and.returnValue(of([]));
    mockApiService.getDispatches.and.returnValue(of(mockDispatches));

    await TestBed.configureTestingModule({
      imports: [DispatchComponent, HttpClientTestingModule],
      providers: [
        { provide: ApiService, useValue: mockApiService },
        { provide: NotificationService, useValue: mockNotificationService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DispatchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should load dispatches on init', () => {
    expect(component.dispatchesList.length).toBe(1);
    expect(component.isLoading).toBeFalse();
  });

  it('should validate form before saving', () => {
    component.dispatchForm = { id: '', dispatchDate: '', vehicleNumber: '', driverName: '', deliveryAddress: '', dispatchStatus: 'Pending' };
    component.saveDispatch();
    expect(mockNotificationService.warning).toHaveBeenCalled();
  });

  it('should handle API load error', () => {
    mockApiService.getDispatches.and.returnValue(throwError(() => new Error('Error loading')));
    component.loadData();
    expect(component.hasError).toBeTrue();
  });
});
