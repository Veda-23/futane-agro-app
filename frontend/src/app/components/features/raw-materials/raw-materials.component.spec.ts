import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RawMaterialsComponent } from './raw-materials.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ApiService } from '../../../api.service';
import { NotificationService } from '../../../services/notification.service';
import { of } from 'rxjs';

describe('RawMaterialsComponent', () => {
  let component: RawMaterialsComponent;
  let fixture: ComponentFixture<RawMaterialsComponent>;
  let mockApiService: jasmine.SpyObj<ApiService>;
  let mockNotificationService: jasmine.SpyObj<NotificationService>;

  beforeEach(async () => {
    mockApiService = jasmine.createSpyObj('ApiService', ['getVendors', 'getRawMaterials', 'createRawMaterial', 'deleteRawMaterial', 'createAuditLog']);
    mockNotificationService = jasmine.createSpyObj('NotificationService', ['success', 'error', 'warning', 'info', 'confirmAction']);

    mockApiService.getVendors.and.returnValue(of([{ id: 1, vendorName: 'Polymer Corp' }]));
    mockApiService.getRawMaterials.and.returnValue(of([{ id: 1, materialName: 'HDPE Granules', weight: 100, rate: 50, amount: 5000 }]));

    await TestBed.configureTestingModule({
      imports: [RawMaterialsComponent, HttpClientTestingModule],
      providers: [
        { provide: ApiService, useValue: mockApiService },
        { provide: NotificationService, useValue: mockNotificationService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(RawMaterialsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('computedAmount should multiply weight by rate', () => {
    component.rawMaterialsForm.weight = 100;
    component.rawMaterialsForm.rate = 50;
    expect(component.computedAmount).toBe(5000);
  });
});
