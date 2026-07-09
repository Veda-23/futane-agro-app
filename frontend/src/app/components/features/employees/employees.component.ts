import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '../../../translate.service';
import { ApiService } from '../../../api.service';
import { DataTableComponent } from '../../data-table/data-table.component';

@Component({
  selector: 'app-employees',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe, DataTableComponent],
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

  constructor(private apiService: ApiService) {}

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
      alert("Please fill required fields");
      return;
    }
    this.apiService.createEmployee(this.employeeForm).subscribe(() => {
      this.loadData();
      this.logAudit("Registered employee: " + this.employeeForm.empName);
      this.employeeForm = { empName: '', empContact: '', salary: 0, address: '', designation: '', joiningDate: '', aadhaarNo: '', bankAccount: '', photoPath: '', aadhaarCardPath: '', bankPassbookPath: '' };
    });
  }

  deleteEmployee(id: string) {
    if (!this.canDelete()) {
      alert("Permission denied");
      return;
    }
    this.apiService.deleteEmployee(id).subscribe(() => {
      this.loadData();
      this.logAudit("Deleted employee ID: " + id);
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

