import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DriversComponent } from './drivers.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ApiService } from '../../../api.service';
import { NotificationService } from '../../../services/notification.service';
import { of } from 'rxjs';

describe('DriversComponent', () => {
  let component: DriversComponent;
  let fixture: ComponentFixture<DriversComponent>;
  let mockApiService: jasmine.SpyObj<ApiService>;

  beforeEach(async () => {
    mockApiService = jasmine.createSpyObj('ApiService', ['getDrivers', 'getTransports', 'createDriver', 'deleteDriver', 'createAuditLog']);
    mockApiService.getDrivers.and.returnValue(of([]));
    mockApiService.getTransports.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [DriversComponent, HttpClientTestingModule],
      providers: [
        { provide: ApiService, useValue: mockApiService },
        NotificationService
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DriversComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
