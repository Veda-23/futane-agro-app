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
    { label: '✏️ Edit', action: 'edit', class: 'btn btn-sm btn-secondary' },
    { label: '🗑️ Delete', action: 'delete', class: 'btn btn-sm btn-danger' }
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

    if (!this.validateBankDetails(this.employeeForm.bankAccount)) {
      return;
    }

    const editId = (this.employeeForm as any).id;
    if (editId) {
      this.apiService.updateEmployee(editId, this.employeeForm).subscribe({
        next: () => {
          this.loadData();
          this.notificationService.success('Updated', 'Employee updated successfully');
          this.logAudit('Updated employee: ' + this.employeeForm.empName);
          this.employeeForm = { empName: '', empContact: '', salary: 0, address: '', designation: '', joiningDate: '', aadhaarNo: '', bankAccount: '', photoPath: '', aadhaarCardPath: '', bankPassbookPath: '' };
        },
        error: (err) => this.notificationService.error('Error', 'Failed to update employee: ' + (err.error?.message || err.message))
      });
    } else {
      if (this.isDuplicateEmployee()) {
        return;
      }
      this.apiService.createEmployee(this.employeeForm).subscribe({
        next: (res) => {
          this.loadData();
          this.notificationService.success('Success', 'Employee saved successfully');
          this.logAudit("Registered employee: " + this.employeeForm.empName);
          this.employeeForm = { empName: '', empContact: '', salary: 0, address: '', designation: '', joiningDate: '', aadhaarNo: '', bankAccount: '', photoPath: '', aadhaarCardPath: '', bankPassbookPath: '' };
        },
        error: (err) => this.notificationService.error('Error', "Failed to save employee: " + (err.error?.message || err.message))
      });
    }
  }

  editEmployee(emp: any) {
    this.employeeForm = { ...emp };
    this.notificationService.info('Edit Mode', `Loaded employee ${emp.empName} for editing.`);
    const formEl = document.querySelector('.form-card');
    if (formEl) formEl.scrollIntoView({ behavior: 'smooth' });
  }

  deleteEmployee(id: string) {
    if (!this.canDelete()) {
      this.notificationService.warning('Permission Denied', "You don't have permission to delete.");
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

  batchDeleteEmployees(ids: string[]) {
    if (!this.canDelete()) {
      this.notificationService.warning('Permission Denied', "You don't have permission to delete.");
      return;
    }
    this.notificationService.confirmAction('Confirm Bulk Delete', `Delete ${ids.length} selected employees?`, 'Yes, Delete All').then(confirmed => {
      if (confirmed) {
        ids.forEach(id => {
          this.apiService.deleteEmployee(id).subscribe({
            next: () => {
              this.employees = this.employees.filter(x => String(x.id) !== id);
            }
          });
        });
        this.notificationService.success('Batch Complete', `${ids.length} employees deleted`);
      }
    });
  }

  handleEmployeeAction(event: any) {
    if (event.action === 'delete') this.deleteEmployee(event.item.id);
    if (event.action === 'edit') this.editEmployee(event.item);
  }

  logAudit(action: string) {
    if (this.loggedInUser) {
      this.apiService.createAuditLog({
        username: this.loggedInUser.username,
        action: action
      }).subscribe();
    }
  }

  validateBankDetails(bankAccount: string): boolean {
    if (!bankAccount) return true; // optional during initial draft, but if provided validate
    const clean = bankAccount.trim();
    if (clean.length < 9) {
      this.notificationService.error(
        'Invalid Bank Details',
        'Bank account details must be at least 9 characters. Format: "IFSC / AccountNo" or Account Number.'
      );
      return false;
    }
    return true;
  }

  isDuplicateEmployee(): boolean {
    const name = this.employeeForm.empName?.trim().toLowerCase();
    const aadhaar = this.employeeForm.aadhaarNo?.trim();
    const dupe = (this.employees || []).find(e =>
      (name && e.empName?.toLowerCase() === name) ||
      (aadhaar && e.aadhaarNo && e.aadhaarNo === aadhaar)
    );
    if (dupe) {
      this.notificationService.error(
        'Duplicate Detected',
        `Employee "${dupe.empName}" already exists with matching name or Aadhaar.`
      );
      return true;
    }
    return false;
  }
}
