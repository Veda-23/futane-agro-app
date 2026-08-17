import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InventoryComponent } from './inventory.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ApiService } from '../../../api.service';
import { of } from 'rxjs';

describe('InventoryComponent', () => {
  let component: InventoryComponent;
  let fixture: ComponentFixture<InventoryComponent>;
  let mockApiService: jasmine.SpyObj<ApiService>;

  const mockInventory = [
    { id: 1, crateType: 'Apple Crate', materialType: 'Plastic', openingStock: 50, producedStock: 100, soldStock: 20, currentStock: 130 }
  ];

  beforeEach(async () => {
    mockApiService = jasmine.createSpyObj('ApiService', ['getInventory']);
    mockApiService.getInventory.and.returnValue(of(mockInventory));

    await TestBed.configureTestingModule({
      imports: [InventoryComponent, HttpClientTestingModule],
      providers: [
        { provide: ApiService, useValue: mockApiService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(InventoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should load inventory list', () => {
    expect(component.inventoryList.length).toBe(1);
    expect(component.tableFilteredCounts['inventory']).toBe(1);
  });
});
