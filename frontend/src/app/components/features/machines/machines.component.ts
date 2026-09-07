import { Component, OnInit, Input } from '@angular/core';
import { AutoSelectDirective } from '../../../directives/auto-select.directive';
import { FormStateDirective } from '../../../directives/form-state.directive';
import { NotificationService } from '../../../services/notification.service';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '../../../translate.service';
import { ApiService } from '../../../api.service';

import { ResizableTableDirective } from '../../../directives/resizable-table.directive';
import { IndianDatePipe } from '../../../pipes/indian-date.pipe';

@Component({
  selector: 'app-machines',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe, AutoSelectDirective, FormStateDirective, ResizableTableDirective, IndianDatePipe],
  templateUrl: './machines.component.html',
  styleUrls: ['./machines.component.css']
})
export class MachinesComponent implements OnInit {
  @Input() currentLang: string = 'en';
  @Input() activeTab: string = 'machines';
  @Input() loggedInUser: any = null;

  machinesList: any[] = [];
  machineBreakdownsList: any[] = [];

  machineForm: any = { machineName: '', machineCode: '', installedDate: '', status: 'Running', capacityPerHour: 0 };
  breakdownForm: any = { id: '', breakdownDate: '', description: '', resolvedDate: '', downtimeHours: 0 };

  Math = Math;

  currentPage = 1;
  pageSize = 10;
  sortField = 'id';
  sortAsc = false;
  tableFilteredCounts: { [key: string]: number } = {};
  showColDropdown: { [key: string]: boolean } = {};
  columnsVisibility: { [table: string]: { [col: string]: boolean } } = {};

  defaultMachineCols = ['Code', 'Name', 'Capacity', 'Installed', 'Status', 'Actions'];
  defaultBreakdownCols = ['Machine', 'Date', 'Description', 'Downtime', 'Resolved', 'Actions'];

  constructor(private apiService: ApiService, private notificationService: NotificationService) {}

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

  getMachineStatus(machine: any): { label: string; color: string } {
    const breakdowns = (this.machineBreakdownsList || []).filter(b => (b.machine?.id === machine.id || b.machineId === machine.id));
    if (breakdowns.length === 0) return { label: 'No Service Log', color: 'var(--accent-warning, #f59e0b)' };
    const dates = breakdowns.map(b => new Date(b.breakdownDate || b.date || 0).getTime()).filter(t => !isNaN(t) && t > 0);
    if (dates.length === 0) return { label: 'No Service Log', color: 'var(--accent-warning, #f59e0b)' };
    const lastDate = new Date(Math.max(...dates));
    const daysSince = Math.floor((Date.now() - lastDate.getTime()) / 86400000);
    if (daysSince > 30) return { label: `Due (${daysSince}d)`, color: 'var(--accent-error, #ef4444)' };
    return { label: `OK (${daysSince}d ago)`, color: 'var(--accent-success, #10b981)' };
  }

  get machineDueCount(): number {
    return (this.machinesList || []).filter(m => {
      const status = this.getMachineStatus(m);
      return status.label.includes('Due') || status.label.includes('No Service');
    }).length;
  }

  isViewer(): boolean {
    return this.loggedInUser && this.loggedInUser.role === 'VIEWER';
  }

  canDelete(): boolean {
    return this.loggedInUser && (this.loggedInUser.role === 'SUPER_ADMIN' || this.loggedInUser.role === 'ADMIN');
  }

  validateForm(type: string): boolean {
    if (type === 'machine') {
      if (!this.machineForm.machineName || !this.machineForm.machineCode || !this.machineForm.installedDate) {
        this.notificationService.warning('Invalid Input', 'Please fill out all required machine fields.');
        return false;
      }
    } else if (type === 'breakdown') {
      const f = this.breakdownForm;
      if (!f.id || !f.breakdownDate || !f.description || f.downtimeHours <= 0) {
        this.notificationService.warning('Invalid Input', 'Please fill out all required breakdown fields correctly.');
        return false;
      }
    }
    return true;
  }

  saveMachine() {
    if (!this.validateForm('machine')) return;
    const editId = this.machineForm.id;
    if (editId) {
      this.apiService.updateMachine(editId, this.machineForm).subscribe({
        next: () => {
          this.loadData();
          this.notificationService.success('Updated', 'Machine updated successfully');
          this.logAudit('Updated machine: ' + this.machineForm.machineName);
          this.machineForm = { machineName: '', machineCode: '', installedDate: '', status: 'Running', capacityPerHour: 0 };
        },
        error: (err) => this.notificationService.error('Error', 'Failed to update machine: ' + (err.error?.message || err.message))
      });
    } else {
      this.apiService.createMachine(this.machineForm).subscribe({
        next: (res) => {
          if (res) this.machinesList.unshift(res);
          this.loadData();
          this.notificationService.success('Data Added', 'Machine added successfully');
          this.logAudit('Added machine: ' + this.machineForm.machineName);
          this.machineForm = { machineName: '', machineCode: '', installedDate: '', status: 'Running', capacityPerHour: 0 };
        },
        error: (err) => this.notificationService.error('Error', "Failed to add machine: " + (err.error?.message || err.message))
      });
    }
  }

  deleteMachine(id: string) {
    if (!this.canDelete()) {
      this.notificationService.warning('Permission Denied', "Permission denied");
      return;
    }
    this.notificationService.confirmAction('Confirm Delete', 'Are you sure you want to delete this machine?', 'Yes, Delete').then(confirmed => {
      if (confirmed) {
        this.apiService.deleteMachine(id).subscribe({
          next: () => {
            this.machinesList = this.machinesList.filter(x => (x.id ? x.id.toString() : '') !== id.toString());
            this.notificationService.success('Deleted', 'Machine deleted successfully');
            this.logAudit('Deleted machine ID: ' + id);
          },
          error: (err) => this.notificationService.error('Delete Failed', err.error?.message || err.message)
        });
      }
    });
  }

  editMachine(machine: any) {
    this.machineForm = {
      id: machine.id,
      machineName: machine.machineName || '',
      machineCode: machine.machineCode || '',
      installedDate: machine.installedDate || '',
      status: machine.status || 'Running',
      capacityPerHour: machine.capacityPerHour || 0
    };
    this.notificationService.info('Editing Machine', `Loaded "${machine.machineName}" into form.`);
    const formEl = document.querySelector('.form-card');
    if (formEl) formEl.scrollIntoView({ behavior: 'smooth' });
  }

  saveBreakdown() {
    if (!this.validateForm('breakdown')) return;
    const machine = this.machinesList.find((m: any) => m.id === parseInt(this.breakdownForm.id));
    if (!machine) return;
    const editId = (this.breakdownForm as any)._editId;
    const payload = { ...this.breakdownForm, machine };
    if (editId) {
      this.apiService.updateMachineBreakdown(editId, payload).subscribe({
        next: () => {
          this.loadData();
          this.notificationService.success('Updated', 'Breakdown log updated successfully');
          this.logAudit('Updated breakdown for machine: ' + machine.machineName);
          this.breakdownForm = { id: '', breakdownDate: '', description: '', resolvedDate: '', downtimeHours: 0 };
        },
        error: (err) => this.notificationService.error('Error', 'Failed to update breakdown: ' + (err.error?.message || err.message))
      });
    } else {
      this.apiService.createMachineBreakdown(payload).subscribe({
        next: (res) => {
          if (res) this.machineBreakdownsList.unshift(res);
          this.loadData();
          this.notificationService.success('Data Added', 'Machine breakdown record added successfully');
          this.logAudit('Logged breakdown for machine: ' + machine.machineName);
          this.breakdownForm = { id: '', breakdownDate: '', description: '', resolvedDate: '', downtimeHours: 0 };
        },
        error: (err) => this.notificationService.error('Error', "Failed to log breakdown: " + (err.error?.message || err.message))
      });
    }
  }

  deleteBreakdown(id: string) {
    if (!this.canDelete()) {
      this.notificationService.warning('Permission Denied', "Permission denied");
      return;
    }
    this.notificationService.confirmAction('Confirm Delete', 'Are you sure you want to delete this breakdown log?', 'Yes, Delete').then(confirmed => {
      if (confirmed) {
        this.apiService.deleteMachineBreakdown(id).subscribe({
          next: () => {
            this.machineBreakdownsList = this.machineBreakdownsList.filter(x => (x.breakdownId ? x.breakdownId.toString() : x.id ? x.id.toString() : '') !== id.toString());
            this.notificationService.success('Deleted', 'Breakdown log deleted successfully');
            this.logAudit('Deleted breakdown log ID: ' + id);
          },
          error: (err) => this.notificationService.error('Delete Failed', err.error?.message || err.message)
        });
      }
    });
  }

  editBreakdown(bd: any) {
    this.breakdownForm = {
      id: bd.machine?.id || bd.machineId || '',
      breakdownDate: bd.breakdownDate || '',
      description: bd.description || '',
      resolvedDate: bd.resolvedDate || '',
      downtimeHours: bd.downtimeHours || 0
    };
    (this.breakdownForm as any)._editId = bd.id;
    this.notificationService.info('Editing Breakdown', `Loaded breakdown log for editing.`);
    const formEl = document.querySelectorAll('.form-card');
    if (formEl.length > 1) formEl[1].scrollIntoView({ behavior: 'smooth' });
  }

  batchDeleteMachines(ids: string[]) {
    if (!this.canDelete()) {
      this.notificationService.warning('Permission Denied', "Permission denied");
      return;
    }
    this.notificationService.confirmAction('Confirm Delete', `Delete ${ids.length} machines?`, 'Yes, Delete All').then(confirmed => {
      if (confirmed) {
        ids.forEach(id => {
          this.apiService.deleteMachine(id).subscribe({
            next: () => { this.machinesList = this.machinesList.filter(x => String(x.id) !== id); }
          });
        });
        this.notificationService.success('Batch Complete', `${ids.length} machines deleted`);
      }
    });
  }

  logAudit(action: string) {
    if (this.loggedInUser) {
      this.apiService.createAuditLog({ username: this.loggedInUser.username, action }).subscribe();
    }
  }

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

  trackById(index: number, item: any): any {
    return item?.id ?? item?.machineId ?? item?.breakdownId ?? index;
  }
}
