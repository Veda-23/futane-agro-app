import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '../../../translate.service';
import { ApiService } from '../../../api.service';

@Component({
  selector: 'app-machines',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  templateUrl: './machines.component.html',
  styleUrls: ['./machines.component.css']
})
export class MachinesComponent implements OnInit {
  @Input() currentLang: string = 'en';
  @Input() activeTab: string = 'machines';
  @Input() loggedInUser: any = null;

  machinesList: any[] = [];
  machineBreakdownsList: any[] = [];

  machineForm = { machineName: '', machineCode: '', installedDate: '', status: 'Running', capacityPerHour: 0 };
  breakdownForm = { machineId: '', breakdownDate: '', description: '', resolvedDate: '', downtimeHours: 0 };

  Math = Math;

  // Pagination & Sort state
  currentPage = 1;
  pageSize = 10;
  sortField = 'machineId';
  sortAsc = false;
  tableFilteredCounts: { [key: string]: number } = {};
  showColDropdown: { [key: string]: boolean } = {};
  columnsVisibility: { [table: string]: { [col: string]: boolean } } = {};

  defaultMachineCols = ['Code', 'Name', 'Capacity', 'Installed', 'Status', 'Actions'];
  defaultBreakdownCols = ['Machine', 'Date', 'Description', 'Downtime', 'Resolved', 'Actions'];

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.loadData();
    this.columnsVisibility['machines'] = {};
    this.defaultMachineCols.forEach(col => this.columnsVisibility['machines'][col] = true);
    
    this.columnsVisibility['breakdowns'] = {};
    this.defaultBreakdownCols.forEach(col => this.columnsVisibility['breakdowns'][col] = true);
  }

  loadData() {
    this.apiService.getMachines().subscribe((res: any[]) => {
      this.machinesList = res;
      this.tableFilteredCounts['machines'] = this.machinesList.length;
    });
    this.apiService.getMachineBreakdowns().subscribe((res: any[]) => {
      this.machineBreakdownsList = res;
      this.tableFilteredCounts['breakdowns'] = this.machineBreakdownsList.length;
    });
  }

  isViewer() {
    return this.loggedInUser && this.loggedInUser.role === 'VIEWER';
  }

  canDelete() {
    return this.loggedInUser && this.loggedInUser.role === 'ADMIN';
  }

  validateForm(type: string): boolean {
    if (type === 'machine') {
      const f = this.machineForm;
      if (!f.machineName || !f.machineCode || f.capacityPerHour <= 0 || !f.installedDate) {
        alert('Please fill out all required machine fields correctly.');
        return false;
      }
    } else if (type === 'breakdown') {
      const f = this.breakdownForm;
      if (!f.machineId || !f.breakdownDate || !f.description || f.downtimeHours <= 0) {
        alert('Please fill out all required breakdown fields correctly.');
        return false;
      }
    }
    return true;
  }

  saveMachine() {
    if (!this.validateForm('machine')) return;
    this.apiService.createMachine(this.machineForm).subscribe(() => {
      this.loadData();
      this.logAudit('Added machine: ' + this.machineForm.machineName);
      this.machineForm = { machineName: '', machineCode: '', installedDate: '', status: 'Running', capacityPerHour: 0 };
    });
  }

  deleteMachine(id: number) {
    this.apiService.deleteMachine(id).subscribe(() => {
      this.loadData();
      this.logAudit('Deleted machine ID: ' + id);
    });
  }

  saveBreakdown() {
    if (!this.validateForm('breakdown')) return;
    const machine = this.machinesList.find((m: any) => m.machineId === parseInt(this.breakdownForm.machineId));
    if (!machine) return;
    const payload = { ...this.breakdownForm, machine };
    this.apiService.createMachineBreakdown(payload).subscribe(() => {
      this.loadData();
      this.logAudit('Logged breakdown for machine: ' + machine.machineName);
      this.breakdownForm = { machineId: '', breakdownDate: '', description: '', resolvedDate: '', downtimeHours: 0 };
    });
  }

  deleteBreakdown(id: number) {
    this.apiService.deleteMachineBreakdown(id).subscribe(() => {
      this.loadData();
      this.logAudit('Deleted breakdown log ID: ' + id);
    });
  }

  logAudit(action: string) {
    if (this.loggedInUser) {
      this.apiService.createAuditLog({ username: this.loggedInUser.username, action }).subscribe();
    }
  }

  // Table handling methods
  toggleColDropdown(table: string) {
    this.showColDropdown[table] = !this.showColDropdown[table];
  }

  getTableColumns(table: string): string[] {
    return table === 'machines' ? this.defaultMachineCols : this.defaultBreakdownCols;
  }

  isColumnVisible(table: string, col: string): boolean {
    return this.columnsVisibility[table] ? this.columnsVisibility[table][col] : true;
  }

  toggleColumn(table: string, col: string) {
    if (this.columnsVisibility[table]) {
      this.columnsVisibility[table][col] = !this.columnsVisibility[table][col];
    }
  }

  setSort(field: string) {
    if (this.sortField === field) {
      this.sortAsc = !this.sortAsc;
    } else {
      this.sortField = field;
      this.sortAsc = true;
    }
  }

  getProcessedList(list: any[], table: string): any[] {
    if (!list) return [];
    
    let sorted = [...list].sort((a, b) => {
      let valA = this.resolvePath(a, this.sortField);
      let valB = this.resolvePath(b, this.sortField);
      
      if (valA < valB) return this.sortAsc ? -1 : 1;
      if (valA > valB) return this.sortAsc ? 1 : -1;
      return 0;
    });

    this.tableFilteredCounts[table] = sorted.length;
    const start = (this.currentPage - 1) * this.pageSize;
    return sorted.slice(start, start + this.pageSize);
  }

  private resolvePath(obj: any, path: string): any {
    if (!path) return '';
    return path.split('.').reduce((o, p) => o && o[p] != null ? o[p] : '', obj);
  }
}
