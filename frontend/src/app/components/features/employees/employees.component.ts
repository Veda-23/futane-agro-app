import { Component, OnInit, Input } from '@angular/core';
import { AutoSelectDirective } from '../../../directives/auto-select.directive';
import { FormStateDirective } from '../../../directives/form-state.directive';
import { NotificationService } from '../../../services/notification.service';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '../../../translate.service';
import { ApiService } from '../../../api.service';
import { DataTableComponent } from '../../data-table/data-table.component';

@Component({
  selector: 'app-employees',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe, DataTableComponent, AutoSelectDirective, FormStateDirective],
  templateUrl: './employees.component.html',
  styleUrls: ['./employees.component.css']
})
export class EmployeesComponent implements OnInit {
  @Input() currentLang: string = 'en';
  @Input() activeTab: string = 'employees';
  @Input() loggedInUser: any = null;

  employees: any[] = [];
  employeeForm = { empName: '', empContact: '', salary: 0, address: '', designation: '', joiningDate: '', aadhaarNo: '', bankAccount: '', photoPath: '', aadhaarCardPath: '', bankPassbookPath: '' };

  employeeTableColumns = [
    { key: 'empName', label: 'Name' },
    { key: 'empContact', label: 'Contact' },
    { key: 'designation', label: 'Designation' },
    { key: 'salary', label: 'Salary', type: 'currency' },
    { key: 'joiningDate', label: 'Joined', type: 'date' }
  ];
  
  employeeTableActions = [
    { label: 'Delete', action: 'delete', class: 'btn btn-sm btn-danger' }
  ];

  constructor(private apiService: ApiService, private notificationService: NotificationService) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.apiService.getEmployees().subscribe((res: any[]) => this.employees = res);
  }

  isViewer(): boolean {
    return this.loggedInUser && this.loggedInUser.role === 'VIEWER';
  }

  canDelete(): boolean {
    return this.loggedInUser && (this.loggedInUser.role === 'SUPER_ADMIN' || this.loggedInUser.role === 'ADMIN');
  }

  saveEmployee() {
    if (!this.employeeForm.empName || !this.employeeForm.empContact) {
      this.notificationService.warning('Invalid Input', "Please fill required fields");
      return;
    }

    if (this.employeeForm.aadhaarNo && !/^[2-9]{1}[0-9]{11}$/.test(this.employeeForm.aadhaarNo.trim())) {
      this.notificationService.warning('Invalid Aadhaar', 'Aadhaar number must be exactly 12 digits and cannot start with 0 or 1.');
      return;
    }
    this.apiService.createEmployee(this.employeeForm).subscribe({
      next: (res) => {
        if (res) this.employees.unshift(res);
        this.loadData();
        this.notificationService.success('Data Added', 'Employee registered successfully');
        this.logAudit("Registered employee: " + this.employeeForm.empName);
        this.employeeForm = { empName: '', empContact: '', salary: 0, address: '', designation: '', joiningDate: '', aadhaarNo: '', bankAccount: '', photoPath: '', aadhaarCardPath: '', bankPassbookPath: '' };
      },
      error: (err) => this.notificationService.error('Error', "Failed to register employee: " + (err.error?.message || err.message))
    });
  }

  deleteEmployee(id: string) {
    if (!this.canDelete()) {
      this.notificationService.warning('Permission Denied', "Permission denied");
      return;
    }
    this.notificationService.confirmAction('Confirm Delete', 'Are you sure you want to delete this employee?', 'Yes, Delete').then(confirmed => {
      if (confirmed) {
        this.apiService.deleteEmployee(id).subscribe({
          next: () => {
            this.employees = this.employees.filter(x => (x.id ? x.id.toString() : '') !== id.toString());
            this.notificationService.success('Deleted', 'Employee deleted successfully');
            this.logAudit("Deleted employee ID: " + id);
          },
          error: (err) => this.notificationService.error('Delete Failed', err.error?.message || err.message)
        });
      }
    });
  }

  handleEmployeeAction(event: any) {
    if (event.action === 'delete') this.deleteEmployee(event.item.id);
  }

  logAudit(action: string) {
    if (this.loggedInUser) {
      this.apiService.createAuditLog({ username: this.loggedInUser.username, action }).subscribe();
    }
  }
}
