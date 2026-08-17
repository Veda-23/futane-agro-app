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
    { id: '1', empName: 'Ramesh Patil', empContact: '9876543210', designation: 'Operator', salary: 15000, aadhaarNo: '123412341234', bankAccount: '123456789012' }
  ];

  beforeEach(async () => {
    mockApiService = jasmine.createSpyObj('ApiService', ['getEmployees', 'createEmployee', 'deleteEmployee', 'createAuditLog']);
    mockNotificationService = jasmine.createSpyObj('NotificationService', ['success', 'error', 'warning', 'info', 'confirmAction']);

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

  it('should load employee list', () => {
    expect(component.employees.length).toBe(1);
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
});
