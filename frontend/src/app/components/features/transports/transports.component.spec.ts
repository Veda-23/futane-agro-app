import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TransportsComponent } from './transports.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ApiService } from '../../../api.service';
import { NotificationService } from '../../../services/notification.service';
import { of } from 'rxjs';

describe('TransportsComponent', () => {
  let component: TransportsComponent;
  let fixture: ComponentFixture<TransportsComponent>;
  let mockApiService: jasmine.SpyObj<ApiService>;

  beforeEach(async () => {
    mockApiService = jasmine.createSpyObj('ApiService', ['getDrivers', 'getTransports', 'createTransport', 'deleteTransport', 'createAuditLog']);
    mockApiService.getDrivers.and.returnValue(of([]));
    mockApiService.getTransports.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [TransportsComponent, HttpClientTestingModule],
      providers: [
        { provide: ApiService, useValue: mockApiService },
        NotificationService
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TransportsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
