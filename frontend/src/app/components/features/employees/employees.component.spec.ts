import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EmployeesComponent } from './employees.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ApiService } from '../../../api.service';
import { NotificationService } from '../../../services/notification.service';
import { of } from 'rxjs';

describe('EmployeesComponent', () => {
  let component: EmployeesComponent;
  let fixture: ComponentFixture<EmployeesComponent>;
  let mockApiService: jasmine.SpyObj<ApiService>;
  let mockNotificationService: jasmine.SpyObj<NotificationService>;

  const mockEmployees = [
    { id: '1', empId: 101, empName: 'Ramesh Patil', empContact: '9876543210', designation: 'Machine Operator', salary: 18000, joiningDate: '2023-01-15', aadhaarNo: '234567890123', bankAccount: '123456789012', address: 'Plot 4, MIDC' },
    { id: '2', empId: 102, empName: 'Suresh Shinde', empContact: '9876543211', designation: 'Quality Inspector', salary: 22000, joiningDate: '2023-03-20', aadhaarNo: '', bankAccount: '987654321098', address: 'Wai, Satara' },
    { id: '3', empId: 103, empName: 'Anil Deshmukh', empContact: '9876543212', designation: 'Warehouse Lead', salary: 20000, joiningDate: '2023-05-10', aadhaarNo: '345678901234', bankAccount: '', address: 'Shirwal' }
  ];

  beforeEach(async () => {
    mockApiService = jasmine.createSpyObj('ApiService', [
      'getEmployees',
      'createEmployee',
      'updateEmployee',
      'deleteEmployee',
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

    await TestBed.configureTestingModule({
      imports: [EmployeesComponent, HttpClientTestingModule],
      providers: [
        { provide: ApiService, useValue: mockApiService },
        { provide: NotificationService, useValue: mockNotificationService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(EmployeesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should load employee list and calculate telemetry KPIs', () => {
    expect(component.employees.length).toBe(3);
    expect(component.tableFilteredCounts['employees']).toBe(3);
    expect(component.totalEmployees).toBe(3);
    expect(component.totalMonthlyPayroll).toBe(60000); // 18k + 22k + 20k
    expect(component.averageSalary).toBe(20000);
    expect(component.distinctRolesCount).toBe(3);
  });

  it('should filter correctly by role subtabs', () => {
    component.setSubtabRole('Operator');
    expect(component.filteredEmployees.length).toBe(1);
    expect(component.filteredEmployees[0].empName).toBe('Ramesh Patil');

    component.setSubtabRole('Quality');
    expect(component.filteredEmployees.length).toBe(1);
    expect(component.filteredEmployees[0].empName).toBe('Suresh Shinde');

    component.setSubtabRole('ALL');
    expect(component.filteredEmployees.length).toBe(3);
  });

  it('should filter by search query', () => {
    component.filterSearchQuery = 'Suresh';
    expect(component.filteredEmployees.length).toBe(1);
    expect(component.filteredEmployees[0].empName).toBe('Suresh Shinde');

    component.filterSearchQuery = 'MIDC';
    expect(component.filteredEmployees.length).toBe(1);
    expect(component.filteredEmployees[0].empName).toBe('Ramesh Patil');

    component.filterSearchQuery = '';
    expect(component.filteredEmployees.length).toBe(3);
  });

  it('should filter by compliance credentials', () => {
    component.filterCompliance = 'VERIFIED'; // Both Aadhaar and Bank
    expect(component.filteredEmployees.length).toBe(1);
    expect(component.filteredEmployees[0].empName).toBe('Ramesh Patil');

    component.filterCompliance = 'PENDING_AADHAAR';
    expect(component.filteredEmployees.length).toBe(1);
    expect(component.filteredEmployees[0].empName).toBe('Suresh Shinde');

    component.filterCompliance = 'PENDING_BANK';
    expect(component.filteredEmployees.length).toBe(1);
    expect(component.filteredEmployees[0].empName).toBe('Anil Deshmukh');

    component.filterCompliance = 'ALL';
    expect(component.filteredEmployees.length).toBe(3);
  });

  it('should detect duplicate employee names', () => {
    component.employeeForm.empName = 'Ramesh Patil';
    expect(component.isDuplicateEmployee()).toBeTrue();
  });

  it('should validate bank account format', () => {
    component.employeeForm.bankAccount = '123'; // too short
    expect(component.validateBankDetails(component.employeeForm.bankAccount)).toBeFalse();
    component.employeeForm.bankAccount = '123456789012'; // valid
    expect(component.validateBankDetails(component.employeeForm.bankAccount)).toBeTrue();
  });

  it('should handle Add / Edit drawer workflows', () => {
    component.openAddDrawer();
    expect(component.isFormOpen).toBeTrue();
    expect(component.isEditing()).toBeFalse();

    component.closeDrawer();
    expect(component.isFormOpen).toBeFalse();

    component.openEditDrawer(mockEmployees[0]);
    expect(component.isFormOpen).toBeTrue();
    expect(component.isEditing()).toBeTrue();
    expect(component.employeeForm.empName).toBe('Ramesh Patil');

    component.closeDrawer();
    expect(component.isFormOpen).toBeFalse();
    expect(component.isEditing()).toBeFalse();
  });

  it('should handle View Details drawer workflows', () => {
    component.openDetails(mockEmployees[0]);
    expect(component.isDetailsOpen).toBeTrue();
    expect(component.selectedEmployee).toEqual(mockEmployees[0]);

    component.closeDetails();
    expect(component.isDetailsOpen).toBeFalse();
    expect(component.selectedEmployee).toBeNull();
  });

  it('should evaluate role-based permissions accurately', () => {
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
