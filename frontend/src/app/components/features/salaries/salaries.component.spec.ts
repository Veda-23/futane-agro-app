import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SalariesComponent } from './salaries.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ApiService } from '../../../api.service';
import { NotificationService } from '../../../services/notification.service';
import { of } from 'rxjs';

describe('SalariesComponent', () => {
  let component: SalariesComponent;
  let fixture: ComponentFixture<SalariesComponent>;
  let mockApiService: jasmine.SpyObj<ApiService>;
  let mockNotificationService: jasmine.SpyObj<NotificationService>;

  const mockEmployees = [
    { id: 1, empName: 'Ramesh Patil', designation: 'Machine Operator', salary: 25000 },
    { id: 2, empName: 'Suresh More', designation: 'Quality Inspector', salary: 30000 }
  ];

  const mockSalaries = [
    {
      id: 101,
      employee: mockEmployees[0],
      month: 'May',
      year: 2026,
      salaryAmount: 25000,
      status: 'Paid',
      paidDate: '2026-05-31'
    },
    {
      id: 102,
      employee: mockEmployees[1],
      month: 'May',
      year: 2026,
      salaryAmount: 30000,
      status: 'Pending',
      paidDate: null
    }
  ];

  beforeEach(async () => {
    mockApiService = jasmine.createSpyObj('ApiService', [
      'getEmployees',
      'getSalaries',
      'createSalary',
      'updateSalary',
      'deleteSalary',
      'createAuditLog'
    ]);
    mockNotificationService = jasmine.createSpyObj('NotificationService', [
      'success',
      'error',
      'warning',
      'info',
      'confirmAction'
    ]);

    mockApiService.getEmployees.and.returnValue(of(mockEmployees));
    mockApiService.getSalaries.and.returnValue(of(mockSalaries));

    await TestBed.configureTestingModule({
      imports: [SalariesComponent, HttpClientTestingModule],
      providers: [
        { provide: ApiService, useValue: mockApiService },
        { provide: NotificationService, useValue: mockNotificationService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SalariesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should compute financial KPI values accurately', () => {
    expect(component.totalPaidAmount).toBe(25000);
    expect(component.totalPendingAmount).toBe(30000);
    expect(component.paidCount).toBe(1);
    expect(component.pendingCount).toBe(1);
    expect(component.disbursalRate).toBeCloseTo((25000 / 55000) * 100, 1);
  });

  it('should open and close the Add/Edit Voucher drawer', () => {
    expect(component.isFormDrawerOpen).toBeFalse();
    component.openAddDrawer();
    expect(component.isFormDrawerOpen).toBeTrue();
    expect(component.isEditing()).toBeFalse();

    component.closeFormDrawer();
    expect(component.isFormDrawerOpen).toBeFalse();
  });

  it('should open and close the View Salary Voucher modal', () => {
    expect(component.isViewModalOpen).toBeFalse();
    component.openViewModal(mockSalaries[0]);
    expect(component.isViewModalOpen).toBeTrue();
    expect(component.selectedVoucher).toEqual(mockSalaries[0]);

    component.closeViewModal();
    expect(component.isViewModalOpen).toBeFalse();
    expect(component.selectedVoucher).toBeNull();
  });

  it('should filter salaries by status subtabs', () => {
    component.setSubtabStatus('Paid');
    expect(component.filteredSalaries.length).toBe(1);
    expect(component.filteredSalaries[0].status).toBe('Paid');

    component.setSubtabStatus('Pending');
    expect(component.filteredSalaries.length).toBe(1);
    expect(component.filteredSalaries[0].status).toBe('Pending');

    component.setSubtabStatus('ALL');
    expect(component.filteredSalaries.length).toBe(2);
  });

  it('should filter salaries by search query', () => {
    component.filterSearchQuery = 'Ramesh';
    expect(component.filteredSalaries.length).toBe(1);
    expect(component.filteredSalaries[0].employee.empName).toBe('Ramesh Patil');

    component.filterSearchQuery = 'NonExistent';
    expect(component.filteredSalaries.length).toBe(0);

    component.resetFilters();
    expect(component.filteredSalaries.length).toBe(2);
  });

  it('should auto-populate salary amount when an employee is selected in form', () => {
    component.salariesForm.id = '1';
    component.salariesForm.salaryAmount = 0;
    component.onEmployeeSelectChange();
    expect(component.salariesForm.salaryAmount).toBe(25000);
  });

  it('should update page size and reset current page', () => {
    component.currentPage = 3;
    component.onPageSizeChange(25);
    expect(component.pageSize).toBe(25);
    expect(component.currentPage).toBe(1);
  });

  it('should trigger confirmAction on deleteSalary when authorized', () => {
    component.loggedInUser = { role: 'SUPER_ADMIN' };
    mockNotificationService.confirmAction.and.returnValue(Promise.resolve(false));
    component.deleteSalary('101');
    expect(mockNotificationService.confirmAction).toHaveBeenCalledWith(
      'Confirm Voucher Deletion',
      jasmine.stringMatching(/Ramesh Patil/),
      'Delete Voucher'
    );
  });
});
