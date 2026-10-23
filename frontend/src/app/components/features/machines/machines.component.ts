import { Component, OnInit, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin, of, catchError } from 'rxjs';
import { ApiService } from '../../../api.service';
import { NotificationService } from '../../../services/notification.service';
import { TranslatePipe } from '../../../translate.service';
import { AutoSelectDirective } from '../../../directives/auto-select.directive';
import { ResizableTableDirective } from '../../../directives/resizable-table.directive';
import { IndianDatePipe } from '../../../pipes/indian-date.pipe';
import { EmptyStateComponent } from '../../shared/empty-state/empty-state.component';

/**
 * Plant Injection Moulding Machinery & Mechanical Breakdown Sentinel.
 *
 * Capabilities:
 * - Plant Equipment Registry: Tracks high-tonnage injection moulding machines, rated crate output/hour,
 *   machine codes, manufacturers, and live operating statuses (Running, Idle, Maintenance).
 * - Breakdown & Downtime Logging: Records mechanical stoppages, root cause descriptions, technician assignments,
 *   resolution timestamps, and total cumulative downtime hours.
 * - Subtabs: Plant Machinery Roster, Breakdown & Maintenance Logs.
 * - Keyboard accessibility: Listens to global Escape to gracefully dismiss modal edit drawers.
 */
@Component({
  selector: 'app-machines',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslatePipe,
    AutoSelectDirective,
    ResizableTableDirective,
    IndianDatePipe,
    EmptyStateComponent
  ],
  templateUrl: './machines.component.html',
  styleUrls: ['./machines.component.css']
})
export class MachinesComponent implements OnInit {
  @Input() currentLang: string = 'en';
  @Input() activeTab: string = 'machines';
  @Input() loggedInUser: any = null;
  @Output() onNavigateTab = new EventEmitter<string>();

  @HostListener('document:keydown.escape', ['$event'])
  onEscapeKeyDown(event: KeyboardEvent): void {
    if (this.isMachineFormOpen) {
      this.cancelEditMachine();
    } else if (this.isBreakdownFormOpen) {
      this.cancelEditBreakdown();
    }
  }

  machinesList: any[] = [];
  machineBreakdownsList: any[] = [];
  isLoading = false;
  hasError = false;

  // Sub-view toggle: 'machines' or 'breakdowns'
  activeSubTab: 'machines' | 'breakdowns' = 'machines';

  // Form toggles
  isMachineFormOpen = false;
  isBreakdownFormOpen = false;

  // Machine Form
  machineForm: {
    id: any;
    machineName: string;
    machineCode: string;
    manufacturer: string;
    capacityPerHour: number;
    installedDate: string;
    status: string;
  } = {
    id: null,
    machineName: '',
    machineCode: '',
    manufacturer: 'Windsor Machines Ltd.',
    capacityPerHour: 450,
    installedDate: '',
    status: 'Running'
  };

  // Breakdown Form
  breakdownForm: {
    id: any;
    machineId: any;
    breakdownDate: string;
    description: string;
    resolvedBy: string;
    downtimeHours: number;
    resolvedDate: string;
    _editId?: any;
  } = {
    id: null,
    machineId: '',
    breakdownDate: '',
    description: '',
    resolvedBy: 'Rajesh Patil (Sr. Maintenance Eng.)',
    downtimeHours: 0,
    resolvedDate: ''
  };

  editingMachineId: any = null;
  editingBreakdownId: any = null;

  // Search & Filters
  searchQuery = '';
  statusFilter = 'ALL';

  // Table Configuration & Pagination
  tableDensity: 'compact' | 'comfortable' | 'spacious' = 'comfortable';
  currentPage = 1;
  pageSize = 10;
  pageSizeOptions = [10, 25, 50, 100];
  sortField = 'id';
  sortAsc = false;
  selectedRowIds = new Set<any>();

  // Column Visibility
  showColDropdown: { [key: string]: boolean } = {
    machines: false,
    breakdowns: false
  };
  columnsVisibility: { [table: string]: { [col: string]: boolean } } = {
    machines: {},
    breakdowns: {}
  };

  defaultMachineCols = ['Code', 'Name', 'Capacity', 'Installed', 'Status', 'Service Health', 'Actions'];
  defaultBreakdownCols = ['Machine', 'Date', 'Description', 'Downtime', 'Resolved', 'Actions'];

  showExportMenu = false;
  Math = Math;

  constructor(
    private apiService: ApiService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    try {
      localStorage.removeItem('cols_width_machines_registry_table');
      localStorage.removeItem('cols_width_machines_breakdowns_table');
    } catch (e) {
      // ignore
    }
    this.initColumns();
    this.loadData();
  }

  private initColumns(): void {
    this.columnsVisibility['machines'] = {};
    this.defaultMachineCols.forEach(col => this.columnsVisibility['machines'][col] = true);

    this.columnsVisibility['breakdowns'] = {};
    this.defaultBreakdownCols.forEach(col => this.columnsVisibility['breakdowns'][col] = true);
  }

  loadData(): void {
    if (this.machinesList.length === 0) {
      this.isLoading = true;
    }
    this.hasError = false;

    forkJoin({
      machines: this.apiService.getMachines(false).pipe(catchError(() => of([]))),
      breakdowns: this.apiService.getMachineBreakdowns().pipe(catchError(() => of([])))
    }).subscribe({
      next: ({ machines, breakdowns }) => {
        this.machinesList = Array.isArray(machines) ? machines : [];
        this.machineBreakdownsList = Array.isArray(breakdowns) ? breakdowns : [];
        this.isLoading = false;
        this.selectedRowIds.clear();
      },
      error: (err) => {
        console.error('Failed to load machine data:', err);
        this.hasError = true;
        this.isLoading = false;
        this.notificationService.error('Load Error', 'Unable to retrieve factory machinery records.');
      }
    });
  }

  // --- Telemetry & KPI Computations ---
  get totalMachinesCount(): number {
    return this.machinesList.length;
  }

  get runningMachinesCount(): number {
    return this.machinesList.filter(m => (m.status || '').toLowerCase() === 'running').length;
  }

  get maintenanceMachinesCount(): number {
    return this.machinesList.filter(m => {
      const s = (m.status || '').toLowerCase();
      return s === 'under maintenance' || s === 'breakdown' || s === 'idle';
    }).length;
  }

  get idleMachinesCount(): number {
    return this.machinesList.filter(m => (m.status || '').toLowerCase() === 'idle').length;
  }

  get breakdownMachinesCount(): number {
    return this.machinesList.filter(m => (m.status || '').toLowerCase() === 'breakdown').length;
  }

  get fleetCapacityPerHour(): number {
    return this.machinesList
      .filter(m => (m.status || '').toLowerCase() === 'running')
      .reduce((sum, m) => sum + (Number(m.capacityPerHour) || 0), 0);
  }

  get fleetUtilizationRate(): number {
    if (!this.machinesList.length) return 0;
    return Math.round((this.runningMachinesCount / this.machinesList.length) * 100);
  }

  get totalDowntimeHours(): number {
    return (this.machineBreakdownsList || []).reduce((sum, b) => sum + (Number(b.downtimeHours) || 0), 0);
  }

  get totalFilteredCapacity(): number {
    return (this.filteredMachines || []).reduce((sum, m) => sum + (Number(m.capacityPerHour) || 0), 0);
  }

  get totalFilteredDowntimeHours(): number {
    return (this.filteredBreakdowns || []).reduce((sum, b) => sum + (Number(b.downtimeHours) || 0), 0);
  }

  getMachineStatus(machine: any): { label: string; color: string; badgeClass: string } {
    const breakdowns = (this.machineBreakdownsList || []).filter(b => 
      (b.machine?.id === machine.id || b.machineId === machine.id)
    );
    if (breakdowns.length === 0) {
      return { label: 'Optimal / No Logs', color: 'var(--color-success)', badgeClass: 'badge-soft-success' };
    }
    const dates = breakdowns
      .map(b => new Date(b.breakdownDate || b.date || 0).getTime())
      .filter(t => !isNaN(t) && t > 0);
    if (dates.length === 0) {
      return { label: 'Optimal / Verified', color: 'var(--color-success)', badgeClass: 'badge-soft-success' };
    }
    const lastDate = new Date(Math.max(...dates));
    const daysSince = Math.floor((Date.now() - lastDate.getTime()) / 86400000);
    if (daysSince > 30) {
      return { label: `Attention Due (${daysSince}d)`, color: 'var(--color-danger)', badgeClass: 'badge-soft-danger' };
    }
    return { label: `Serviced (${daysSince}d ago)`, color: 'var(--color-info)', badgeClass: 'badge-soft-info' };
  }

  get machineDueCount(): number {
    return this.machinesList.filter(m => {
      const status = this.getMachineStatus(m);
      return status.label.includes('Attention Due');
    }).length;
  }

  // --- Filtering & Sorting ---
  get filteredMachines(): any[] {
    let list = [...this.machinesList];

    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase().trim();
      list = list.filter(m => 
        (m.machineName || '').toLowerCase().includes(q) ||
        (m.machineCode || '').toLowerCase().includes(q) ||
        (m.id && String(m.id).includes(q))
      );
    }

    if (this.statusFilter !== 'ALL') {
      list = list.filter(m => (m.status || '').toLowerCase() === this.statusFilter.toLowerCase());
    }

    return list.sort((a, b) => {
      const valA = this.resolveField(a, this.sortField);
      const valB = this.resolveField(b, this.sortField);
      if (valA < valB) return this.sortAsc ? -1 : 1;
      if (valA > valB) return this.sortAsc ? 1 : -1;
      return 0;
    });
  }

  get filteredBreakdowns(): any[] {
    let list = [...this.machineBreakdownsList];

    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase().trim();
      list = list.filter(b => 
        (b.machine?.machineName || '').toLowerCase().includes(q) ||
        (b.description || '').toLowerCase().includes(q) ||
        (b.breakdownDate || '').includes(q)
      );
    }

    return list.sort((a, b) => {
      const valA = this.resolveField(a, this.sortField);
      const valB = this.resolveField(b, this.sortField);
      if (valA < valB) return this.sortAsc ? -1 : 1;
      if (valA > valB) return this.sortAsc ? 1 : -1;
      return 0;
    });
  }

  get paginatedMachines(): any[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredMachines.slice(start, start + this.pageSize);
  }

  get paginatedBreakdowns(): any[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredBreakdowns.slice(start, start + this.pageSize);
  }

  get totalFilteredCount(): number {
    return this.activeSubTab === 'machines' ? this.filteredMachines.length : this.filteredBreakdowns.length;
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.totalFilteredCount / this.pageSize));
  }

  private resolveField(obj: any, path: string): any {
    if (!obj || !path) return '';
    return path.split('.').reduce((o, p) => (o && o[p] != null ? o[p] : ''), obj);
  }

  setSort(field: string): void {
    if (this.sortField === field) {
      this.sortAsc = !this.sortAsc;
    } else {
      this.sortField = field;
      this.sortAsc = true;
    }
  }

  setPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  setStatusFilter(status: string): void {
    this.statusFilter = status;
    this.currentPage = 1;
  }

  switchSubTab(tab: 'machines' | 'breakdowns'): void {
    this.activeSubTab = tab;
    this.currentPage = 1;
    this.selectedRowIds.clear();
    this.sortField = tab === 'machines' ? 'id' : 'breakdownDate';
    this.sortAsc = false;
  }



  // --- Permissions ---
  isViewer(): boolean {
    return this.loggedInUser && this.loggedInUser.role === 'VIEWER';
  }

  canDelete(): boolean {
    return this.loggedInUser && (this.loggedInUser.role === 'SUPER_ADMIN' || this.loggedInUser.role === 'ADMIN');
  }

  // --- CRUD: Machines ---
  saveMachine(): void {
    if (this.isViewer()) {
      this.notificationService.warning('Permission Denied', 'Viewer role cannot perform modifications.');
      return;
    }

    if (!this.machineForm.machineName?.trim()) {
      this.notificationService.warning('Validation Error', 'Please enter a valid machine name.');
      return;
    }

    if (!this.machineForm.machineCode?.trim()) {
      this.notificationService.warning('Validation Error', 'Machine code is mandatory.');
      return;
    }

    const payload = {
      machineName: this.machineForm.machineName.trim(),
      machineCode: this.machineForm.machineCode.trim().toUpperCase(),
      manufacturer: this.machineForm.manufacturer ? this.machineForm.manufacturer.trim() : 'Windsor Machines Ltd.',
      capacityPerHour: Number(this.machineForm.capacityPerHour) || 0,
      installedDate: this.machineForm.installedDate || new Date().toISOString().split('T')[0],
      status: this.machineForm.status || 'Running'
    };

    if (this.editingMachineId) {
      this.apiService.updateMachine(this.editingMachineId, payload).subscribe({
        next: () => {
          this.notificationService.success('Machine Updated', `Equipment "${payload.machineName}" was successfully updated.`);
          this.logAudit(`Updated machine: ${payload.machineName}`);
          this.cancelEditMachine();
          this.loadData();
        },
        error: (err) => {
          console.error(err);
          this.notificationService.error('Update Failed', err.error?.message || 'Could not update machine asset.');
        }
      });
    } else {
      this.apiService.createMachine(payload).subscribe({
        next: (created) => {
          this.notificationService.success('Machine Registered', `New unit "${payload.machineName}" added to plant fleet.`);
          this.logAudit(`Created machine: ${payload.machineName}`);
          this.resetMachineForm();
          this.loadData();
        },
        error: (err) => {
          console.error(err);
          this.notificationService.error('Creation Failed', err.error?.message || 'Could not register machine.');
        }
      });
    }
  }

  // --- Form & Drawer Controls ---
  toggleMachineForm(): void {
    if (this.isMachineFormOpen) {
      this.cancelEditMachine();
    } else {
      this.resetMachineForm();
      this.isMachineFormOpen = true;
    }
  }

  toggleBreakdownForm(): void {
    if (this.isBreakdownFormOpen) {
      this.cancelEditBreakdown();
    } else {
      this.resetBreakdownForm();
      this.isBreakdownFormOpen = true;
    }
  }

  editMachine(m: any): void {
    if (this.isViewer()) {
      this.notificationService.warning('Permission Denied', 'Viewer role cannot edit machines.');
      return;
    }
    this.editingMachineId = m.id;
    this.machineForm = { ...m };
    if (this.machineForm.installedDate) {
      this.machineForm.installedDate = new Date(this.machineForm.installedDate).toISOString().split('T')[0];
    }
    this.isMachineFormOpen = true;
  }

  cancelEditMachine(): void {
    this.resetMachineForm();
  }

  resetMachineForm(): void {
    this.editingMachineId = null;
    this.isMachineFormOpen = false;
    this.machineForm = {
      id: null,
      machineName: '',
      machineCode: '',
      manufacturer: 'Windsor Machines Ltd.',
      capacityPerHour: 450,
      installedDate: '',
      status: 'Running'
    };
  }

  editBreakdown(b: any): void {
    if (this.isViewer()) {
      this.notificationService.warning('Permission Denied', 'Viewer role cannot edit breakdown records.');
      return;
    }
    this.editingBreakdownId = b.id || b.breakdownId;
    this.breakdownForm = { ...b };
    if (this.breakdownForm.breakdownDate) {
      this.breakdownForm.breakdownDate = new Date(this.breakdownForm.breakdownDate).toISOString().split('T')[0];
    }
    if (this.breakdownForm.resolvedDate) {
      this.breakdownForm.resolvedDate = new Date(this.breakdownForm.resolvedDate).toISOString().split('T')[0];
    }
    // Handle nested machine object
    if (b.machine && b.machine.id) {
      this.breakdownForm.machineId = b.machine.id;
    }
    this.isBreakdownFormOpen = true;
  }

  cancelEditBreakdown(): void {
    this.resetBreakdownForm();
  }

  resetBreakdownForm(): void {
    this.editingBreakdownId = null;
    this.isBreakdownFormOpen = false;
    this.breakdownForm = {
      id: null,
      machineId: '',
      breakdownDate: '',
      description: '',
      resolvedBy: 'Rajesh Patil (Sr. Maintenance Eng.)',
      downtimeHours: 0,
      resolvedDate: ''
    };
  }

  deleteMachine(id: any): void {
    if (!this.canDelete()) {
      this.notificationService.warning('Permission Denied', 'Admin privileges required to remove factory assets.');
      return;
    }

    this.notificationService.confirmAction(
      'Decommission Machine',
      'Are you sure you want to permanently delete this equipment record from the plant fleet?',
      'Yes, Decommission'
    ).then((confirmed) => {
      if (confirmed) {
        this.apiService.deleteMachine(String(id)).subscribe({
          next: () => {
            this.notificationService.success('Machine Removed', 'Equipment record has been removed.');
            this.logAudit(`Deleted machine ID: ${id}`);
            if (this.editingMachineId === id) {
              this.cancelEditMachine();
            }
            this.loadData();
          },
          error: (err) => {
            this.notificationService.error('Delete Failed', err.error?.message || 'Unable to delete machine.');
          }
        });
      }
    });
  }

  // --- CRUD: Breakdowns ---
  saveBreakdown(): void {
    if (this.isViewer()) {
      this.notificationService.warning('Permission Denied', 'Viewer role cannot log maintenance incidents.');
      return;
    }

    if (!this.breakdownForm.machineId) {
      this.notificationService.warning('Validation Error', 'Please select a valid factory machine.');
      return;
    }

    if (!this.breakdownForm.breakdownDate) {
      this.notificationService.warning('Validation Error', 'Breakdown incident date is required.');
      return;
    }

    if (!this.breakdownForm.description?.trim()) {
      this.notificationService.warning('Validation Error', 'Please describe the breakdown or fault.');
      return;
    }

    const machineObj = this.machinesList.find(m => String(m.id) === String(this.breakdownForm.machineId));
    const payload = {
      machine: machineObj,
      machineId: this.breakdownForm.machineId,
      breakdownDate: this.breakdownForm.breakdownDate,
      description: this.breakdownForm.description.trim(),
      downtimeHours: Number(this.breakdownForm.downtimeHours) || 0,
      resolvedDate: this.breakdownForm.resolvedDate || null
    };

    if (this.editingBreakdownId) {
      this.apiService.updateMachineBreakdown(this.editingBreakdownId, payload).subscribe({
        next: () => {
          this.notificationService.success('Breakdown Log Updated', 'Service resolution record updated.');
          this.logAudit(`Updated breakdown record ID: ${this.editingBreakdownId}`);
          this.cancelEditBreakdown();
          this.loadData();
        },
        error: (err) => {
          this.notificationService.error('Update Failed', err.error?.message || 'Could not update breakdown record.');
        }
      });
    } else {
      this.apiService.createMachineBreakdown(payload).subscribe({
        next: () => {
          this.notificationService.success('Breakdown Logged', 'Maintenance entry recorded successfully.');
          this.logAudit(`Logged breakdown for ${machineObj?.machineName || 'Machine'}`);
          this.resetBreakdownForm();
          this.loadData();
        },
        error: (err) => {
          this.notificationService.error('Save Failed', err.error?.message || 'Could not log breakdown incident.');
        }
      });
    }
  }



  deleteBreakdown(id: any): void {
    if (!this.canDelete()) {
      this.notificationService.warning('Permission Denied', 'Admin privileges required to remove breakdown logs.');
      return;
    }

    this.notificationService.confirmAction(
      'Delete Breakdown Log',
      'Are you sure you want to permanently remove this maintenance record?',
      'Yes, Delete'
    ).then((confirmed) => {
      if (confirmed) {
        this.apiService.deleteMachineBreakdown(String(id)).subscribe({
          next: () => {
            this.notificationService.success('Record Deleted', 'Maintenance log removed.');
            this.logAudit(`Deleted breakdown record ID: ${id}`);
            if (this.editingBreakdownId === id) {
              this.cancelEditBreakdown();
            }
            this.loadData();
          },
          error: (err) => {
            this.notificationService.error('Delete Failed', err.error?.message || 'Unable to delete breakdown record.');
          }
        });
      }
    });
  }

  // --- Row Selection & Bulk Actions ---
  toggleSelectAll(checked: boolean): void {
    if (checked) {
      const activeList = this.activeSubTab === 'machines' ? this.filteredMachines : this.filteredBreakdowns;
      activeList.forEach(item => this.selectedRowIds.add(item.id || item.breakdownId));
    } else {
      this.selectedRowIds.clear();
    }
  }

  toggleSelectRow(id: any, checked: boolean): void {
    if (checked) {
      this.selectedRowIds.add(id);
    } else {
      this.selectedRowIds.delete(id);
    }
  }

  isRowSelected(id: any): boolean {
    return this.selectedRowIds.has(id);
  }

  get isAllSelected(): boolean {
    const list = this.activeSubTab === 'machines' ? this.filteredMachines : this.filteredBreakdowns;
    return list.length > 0 && list.every(item => this.selectedRowIds.has(item.id || item.breakdownId));
  }

  clearSelection(): void {
    this.selectedRowIds.clear();
  }

  // --- Export Actions ---
  toggleExportMenu(): void {
    this.showExportMenu = !this.showExportMenu;
  }

  exportData(format: 'csv' | 'excel'): void {
    this.showExportMenu = false;
    const isMachines = this.activeSubTab === 'machines';
    const filename = isMachines
      ? `futane_machines_fleet_${new Date().toISOString().slice(0, 10)}.csv`
      : `futane_breakdowns_ledger_${new Date().toISOString().slice(0, 10)}.csv`;

    let data: any[] = [];
    if (this.selectedRowIds.size > 0) {
      const source = isMachines ? this.machinesList : this.machineBreakdownsList;
      data = source.filter(item => this.selectedRowIds.has(item.id || item.breakdownId));
    } else {
      data = isMachines ? this.filteredMachines : this.filteredBreakdowns;
    }

    if (data.length === 0) {
      this.notificationService.warning('Export Empty', 'No records found to export.');
      return;
    }

    let csvContent = '';
    if (isMachines) {
      csvContent = 'Machine Code,Machine Name,Capacity (crates/hr),Installed Date,Status,Service Health\n';
      data.forEach(m => {
        const health = this.getMachineStatus(m).label;
        csvContent += `"${m.machineCode || ''}","${m.machineName || ''}",${m.capacityPerHour || 0},"${m.installedDate || ''}","${m.status || ''}","${health}"\n`;
      });
    } else {
      csvContent = 'Machine Name,Breakdown Date,Fault Description,Downtime Hours,Resolved Date\n';
      data.forEach(b => {
        const mName = b.machine?.machineName || 'N/A';
        csvContent += `"${mName}","${b.breakdownDate || ''}","${(b.description || '').replace(/"/g, '""')}",${b.downtimeHours || 0},"${b.resolvedDate || 'Pending'}"\n`;
      });
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    this.notificationService.success('Export Successful', `Exported ${data.length} records to ${filename}`);
  }

  // --- Column Visibility ---
  toggleColDropdown(table: string): void {
    this.showColDropdown[table] = !this.showColDropdown[table];
  }

  getTableColumns(table: string): string[] {
    return table === 'machines' ? this.defaultMachineCols : this.defaultBreakdownCols;
  }

  getVisibleColCount(table: string): number {
    return this.getTableColumns(table).filter(col => this.isColumnVisible(table, col)).length;
  }

  isColumnVisible(table: string, col: string): boolean {
    return this.columnsVisibility[table]?.[col] !== false;
  }

  toggleColumn(table: string, col: string): void {
    if (this.columnsVisibility[table]) {
      this.columnsVisibility[table][col] = !this.columnsVisibility[table][col];
    }
  }

  resetColumns(table: string): void {
    const cols = this.getTableColumns(table);
    cols.forEach(col => this.columnsVisibility[table][col] = true);
  }

  setDensity(density: 'compact' | 'comfortable' | 'spacious'): void {
    this.tableDensity = density;
  }

  private logAudit(action: string): void {
    if (this.loggedInUser) {
      this.apiService.createAuditLog({
        username: this.loggedInUser.username,
        action: `[Machines] ${action}`
      }).subscribe();
    }
  }

  trackById(index: number, item: any): any {
    return item?.id ?? item?.breakdownId ?? index;
  }
}
