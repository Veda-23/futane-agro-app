import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InventoryComponent } from './inventory.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ApiService } from '../../../api.service';
import { NotificationService } from '../../../services/notification.service';
import { of } from 'rxjs';

describe('InventoryComponent', () => {
  let component: InventoryComponent;
  let fixture: ComponentFixture<InventoryComponent>;
  let mockApiService: jasmine.SpyObj<ApiService>;
  let mockNotificationService: jasmine.SpyObj<NotificationService>;

  const mockInventory = [
    { id: 1, inventoryId: 101, crateType: '20kg Tomato Vegetable Crate', materialType: 'HDPE Plastic', openingStock: 100, producedStock: 500, soldStock: 200, currentStock: 400, unitPrice: 85, warehouseZone: 'Zone A - Vegetable Crate Staging' },
    { id: 2, inventoryId: 102, crateType: 'Dairy Milk Pouch Crate', materialType: 'PP Copolymer', openingStock: 50, producedStock: 100, soldStock: 120, currentStock: 30, unitPrice: 90, warehouseZone: 'Zone B - Dairy Perforated Bay' },
    { id: 3, inventoryId: 103, crateType: 'Heavy Storage Crate', materialType: 'Recycled Compound', openingStock: 0, producedStock: 0, soldStock: 0, currentStock: 0, unitPrice: 80, warehouseZone: 'Zone C - Heavy Duty Warehouse' }
  ];

  beforeEach(async () => {
    mockApiService = jasmine.createSpyObj('ApiService', [
      'getInventory',
      'getRawMaterials',
      'getPpd',
      'createInventory',
      'updateInventory',
      'deleteInventory'
    ]);
    mockNotificationService = jasmine.createSpyObj('NotificationService', [
      'success',
      'error',
      'warning',
      'info',
      'confirmAction'
    ]);

    mockApiService.getInventory.and.returnValue(of(mockInventory));
    mockApiService.getRawMaterials.and.returnValue(of([]));
    mockApiService.getPpd.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [InventoryComponent, HttpClientTestingModule],
      providers: [
        { provide: ApiService, useValue: mockApiService },
        { provide: NotificationService, useValue: mockNotificationService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(InventoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should load and normalize inventory list', () => {
    expect(component.inventoryList.length).toBe(3);
    expect(component.tableFilteredCounts['inventory']).toBe(3);
    expect(component.totalAvailableStock).toBe(430);
  });

  it('should calculate KPIs correctly based on formula and data', () => {
    // 400*85 + 30*90 + 0*80 = 34000 + 2700 = 36700
    expect(component.totalInventoryValuation).toBe(36700);
    // Low stock (< 200 units): id 2 (30) and id 3 (0) = 2
    expect(component.lowStockCount).toBe(2);
    // Out of stock (=== 0 units): id 3 (0) = 1
    expect(component.outOfStockCount).toBe(1);
    // Capacity utilization: 430 / 50000 = ~1%
    expect(component.warehouseCapacityPct).toBe(1);
  });

  it('should filter correctly by subtabs', () => {
    component.setSubtab('in-stock');
    expect(component.filteredList.length).toBe(2);

    component.setSubtab('low');
    expect(component.filteredList.length).toBe(1); // stock > 0 && stock < 200

    component.setSubtab('vegetable');
    expect(component.filteredList.length).toBe(1);

    component.setSubtab('dairy');
    expect(component.filteredList.length).toBe(2); // 'Dairy' and 'Heavy Storage'

    component.setSubtab('stockout');
    expect(component.filteredList.length).toBe(1);
  });

  it('should filter by search query', () => {
    component.setSubtab('all');
    component.searchQuery = 'Tomato';
    expect(component.filteredList.length).toBe(1);
    expect(component.filteredList[0].crateType).toContain('Tomato');

    component.searchQuery = 'Zone B';
    expect(component.filteredList.length).toBe(1);
    expect(component.filteredList[0].crateType).toContain('Dairy');

    component.searchQuery = '';
    expect(component.filteredList.length).toBe(3);
  });

  it('should handle Add / Edit drawer form workflow', () => {
    component.openAddForm();
    expect(component.isFormOpen).toBeTrue();
    expect(component.isEditing).toBeFalse();

    component.formData.crateType = 'Test Crate';
    component.formData.materialType = 'HDPE Plastic';
    component.formData.openingStock = 50;
    component.formData.producedStock = 100;
    component.formData.soldStock = 30;
    // 50 + 100 - 30 = 120
    expect(component.calculatedAvailable).toBe(120);

    component.closeForm();
    expect(component.isFormOpen).toBeFalse();
  });

  it('should calculate stock adjustment preview accurately', () => {
    const item = component.inventoryList[0]; // stock = 400
    component.openAdjustmentModal(item);
    expect(component.isAdjustmentOpen).toBeTrue();

    // Mode: Add 50 crates -> 450
    component.adjustMode = 'add';
    component.adjustQuantity = 50;
    expect(component.calculatedAdjustedStock).toBe(450);

    // Mode: Deduct 50 crates -> 350
    component.adjustMode = 'deduct';
    component.adjustQuantity = 50;
    expect(component.calculatedAdjustedStock).toBe(350);

    // Mode: Reconcile physical count to 380
    component.adjustMode = 'reconcile';
    component.adjustQuantity = 380;
    expect(component.calculatedAdjustedStock).toBe(380);

    component.closeAdjustmentModal();
    expect(component.isAdjustmentOpen).toBeFalse();
  });

  it('should correctly evaluate role-based permissions', () => {
    component.loggedInUser = { role: 'VIEWER' };
    expect(component.isViewer()).toBeTrue();
    expect(component.canDelete()).toBeFalse();

    component.loggedInUser = { role: 'ADMIN' };
    expect(component.isViewer()).toBeFalse();
    expect(component.canDelete()).toBeTrue();

    component.loggedInUser = { role: 'SUPER_ADMIN' };
    expect(component.canDelete()).toBeTrue();
  });
});
