import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VendorsComponent } from './vendors.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ApiService } from '../../../api.service';
import { NotificationService } from '../../../services/notification.service';
import { of } from 'rxjs';

describe('VendorsComponent', () => {
  let component: VendorsComponent;
  let fixture: ComponentFixture<VendorsComponent>;
  let mockApiService: jasmine.SpyObj<ApiService>;

  beforeEach(async () => {
    mockApiService = jasmine.createSpyObj('ApiService', ['getVendors', 'getRawMaterials', 'createVendor', 'deleteVendor', 'createAuditLog']);
    mockApiService.getVendors.and.returnValue(of([]));
    mockApiService.getRawMaterials.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [VendorsComponent, HttpClientTestingModule],
      providers: [
        { provide: ApiService, useValue: mockApiService },
        NotificationService
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(VendorsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
