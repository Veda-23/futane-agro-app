import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataImportService, ImportPreviewResponse, RowError } from '../../../services/data-import.service';
import { UniversalExportService } from '../../../services/universal-export.service';
import { NotificationService } from '../../../services/notification.service';

/**
 * Universal Bulk CSV Spreadsheet Onboarding & Dry-Run Validation Component.
 *
 * Capabilities:
 * - Multi-Module Bulk Ingestion: Supports 8 core ERP domains (Parties, Raw Materials, Production, Inventory, Vendors, Employees, Machines, Expenses).
 * - Pre-Flight Dry-Run Preview: Submits uploaded files to backend `DataImportService.previewImport()` for regex validation,
 *   duplicate entity identification, and sanitization without modifying the database.
 * - Conflict Resolution: Provides operator choice between `UPDATE` (in-place entity mutation) and `SKIP` (preserve existing records).
 * - Sample Template Downloads: Delivers pre-formatted, RFC 4180-compliant `.csv` templates pre-populated with realistic records.
 */
@Component({
  selector: 'app-universal-importer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './universal-importer.component.html',
  styleUrls: ['./universal-importer.component.css']
})
export class UniversalImporterComponent implements OnInit {

  @Input() module: string = 'parties';
  @Input() title: string = 'Bulk CSV Importer';
  @Input() description: string = 'Upload standard CSV spreadsheet (.csv) to bulk import and update records.';
  @Input() buttonText: string = 'Import CSV';
  @Input() showModuleSelector: boolean = false;
  @Output() onImportSuccess = new EventEmitter<any>();

  availableModules = [
    { key: 'parties', label: 'Parties & Customers', icon: 'bi-people', desc: 'Bulk import customer contact directory and GST numbers' },
    { key: 'raw-materials', label: 'Raw Materials', icon: 'bi-box-seam', desc: 'Bulk import polymer resin purchases, weights and rates' },
    { key: 'production', label: 'Daily Production', icon: 'bi-buildings', desc: 'Bulk import machine shift tallies, crate counts and outputs' },
    { key: 'inventory', label: 'Finished Inventory', icon: 'bi-clipboard-check', desc: 'Bulk import finished crate stock tallies' },
    { key: 'vendors', label: 'Vendors', icon: 'bi-shop', desc: 'Bulk import raw material suppliers and vendors' },
    { key: 'employees', label: 'Employees & Staff', icon: 'bi-person-badge', desc: 'Bulk import employee registry, designations and salaries' },
    { key: 'machines', label: 'Factory Machines', icon: 'bi-gear', desc: 'Bulk import machine master list and capacities' },
    { key: 'expenses', label: 'Expense Ledger', icon: 'bi-cash-coin', desc: 'Bulk import factory operational expenses' }
  ];

  selectedFile: File | null = null;
  isDragging: boolean = false;
  isLoading: boolean = false;
  isExecuting: boolean = false;

  showPreviewModal: boolean = false;
  previewData: ImportPreviewResponse | null = null;
  duplicateStrategy: 'UPDATE' | 'SKIP' = 'UPDATE';
  previewTab: 'valid' | 'invalid' = 'valid';

  constructor(
    private importService: DataImportService,
    private exportService: UniversalExportService,
    private notify: NotificationService
  ) {}

  ngOnInit() {
    this.syncModuleDetails();
  }

  onModuleChange(newModule: string) {
    this.module = newModule;
    this.syncModuleDetails();
  }

  private syncModuleDetails() {
    const found = this.availableModules.find(m => m.key === this.module);
    if (found) {
      this.title = `Bulk Import ${found.label}`;
      this.description = `Upload CSV file (.csv) to ${found.desc.toLowerCase()}`;
    }
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.handleFile(file);
    }
    // Reset file input value to allow re-selecting same file
    event.target.value = '';
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
    if (event.dataTransfer && event.dataTransfer.files.length > 0) {
      this.handleFile(event.dataTransfer.files[0]);
    }
  }

  handleFile(file: File) {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext !== 'csv') {
      this.notify.error(
        'Invalid File Format',
        'Only standard CSV (.csv) files are supported. Excel (.xlsx / .xls) and other file types are not allowed.'
      );
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      this.notify.error('File Too Large', 'Maximum allowed CSV file size is 10MB.');
      return;
    }
    this.selectedFile = file;
    this.startDryRunPreview();
  }

  startDryRunPreview() {
    if (!this.selectedFile) return;
    this.isLoading = true;
    this.importService.previewImport(this.selectedFile, this.module).subscribe({
      next: (preview: ImportPreviewResponse) => {
        this.isLoading = false;
        this.previewData = preview;
        this.previewTab = preview.invalidRows > 0 ? 'invalid' : 'valid';
        this.showPreviewModal = true;
      },
      error: (err: any) => {
        this.isLoading = false;
        const msg = err.error?.error || err.message || 'Failed to parse and validate CSV file.';
        this.notify.error('Validation Failed', msg);
      }
    });
  }

  confirmImport() {
    if (!this.previewData || !this.previewData.previewRows || this.previewData.previewRows.length === 0) {
      this.notify.error('No Valid Rows', 'There are no valid rows to import.');
      return;
    }

    this.isExecuting = true;
    this.importService.confirmImport({
      module: this.module,
      duplicateStrategy: this.duplicateStrategy,
      rows: this.previewData.previewRows
    }).subscribe({
      next: (res) => {
        this.isExecuting = false;
        this.showPreviewModal = false;
        this.selectedFile = null;
        this.notify.success('Import Successful', res.message || 'Records imported successfully.');
        this.onImportSuccess.emit(res);
      },
      error: (err) => {
        this.isExecuting = false;
        const msg = err.error?.error || err.message || 'Import execution failed.';
        this.notify.error('Import Error', msg);
      }
    });
  }

  // Pre-formatted standard templates for immediate client-side fallback
  private readonly moduleTemplates: { [key: string]: { headers: string[]; sampleRow: string[] } } = {
    'parties': {
      headers: ['Party Name', 'GST Number', 'Email', 'Party Contact', 'Address', 'State'],
      sampleRow: ['Maharashtra Agro Traders', '27AAAAA0000A1Z5', 'contact@mahaagro.com', '9822012345', 'MIDC Industrial Area, Pune', 'Maharashtra']
    },
    'raw-materials': {
      headers: ['Date', 'Material Name', 'Vendor Name', 'Weight (kg)', 'Rate (Rs)'],
      sampleRow: ['2026-08-20', 'HDPE Granules Grade 50', 'Reliance Polymers Ltd', '500.0', '125.50']
    },
    'production': {
      headers: ['Date', 'Crate Type', 'Shift', 'Total Production', 'Successful', 'Rejected'],
      sampleRow: ['2026-08-20', 'Apple Crate', 'Morning Shift', '1200', '1180', '20']
    },
    'inventory': {
      headers: ['Crate Type', 'Material Type', 'Opening Stock', 'Produced Stock', 'Sold Stock', 'Current Stock'],
      sampleRow: ['Apple Crate', 'Virgin HDPE', '500', '1200', '800', '900']
    },
    'vendors': {
      headers: ['Vendor Name', 'GST Number', 'Mobile', 'Address'],
      sampleRow: ['Reliance Polymers Ltd', '27BBBBA0000B1Z6', '9890123456', 'Turbhe, Navi Mumbai']
    },
    'employees': {
      headers: ['Employee Name', 'Contact', 'Designation', 'Aadhaar No', 'Bank Account', 'Salary (Rs)', 'Joining Date', 'Address'],
      sampleRow: ['Ramesh Patil', '9850123456', 'Molding Operator', '234567890123', 'SBIN0001234 / 30129847120', '22000', '2024-01-15', 'Nashik Road, Nashik']
    },
    'machines': {
      headers: ['Machine Name', 'Manufacturer', 'Status'],
      sampleRow: ['Molding Unit Alpha', 'Windsor Machines', 'Running']
    },
    'expenses': {
      headers: ['Date', 'Category', 'Amount', 'Description'],
      sampleRow: ['2026-08-20', 'Electricity', '45000', 'Monthly Factory Power Bill']
    }
  };

  downloadTemplate() {
    this.importService.downloadTemplate(this.module).subscribe({
      next: (blob: Blob) => {
        this.triggerFileDownload(blob, `${this.module}_sample_template.csv`);
        this.notify.success('Template Downloaded', `Sample ${this.module} CSV template downloaded.`);
      },
      error: () => {
        // Instant client-side CSV template fallback
        try {
          const tpl = this.moduleTemplates[this.module] || {
            headers: ['Code', 'Name', 'Description', 'Value'],
            sampleRow: ['EX-01', 'Sample Record', 'Standard Description', '100']
          };
          const escapeCsv = (val: string) => {
            if (val && (val.includes(',') || val.includes('"') || val.includes('\n'))) {
              return `"${val.replace(/"/g, '""')}"`;
            }
            return val || '';
          };
          const csvContent = '\uFEFF' + tpl.headers.map(escapeCsv).join(',') + '\n' + tpl.sampleRow.map(escapeCsv).join(',') + '\n';
          const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
          this.triggerFileDownload(blob, `${this.module}_sample_template.csv`);
          this.notify.success('Template Downloaded', `Sample ${this.module} CSV template downloaded.`);
        } catch (e) {
          this.notify.error('Download Failed', 'Could not generate sample CSV template.');
        }
      }
    });
  }

  private triggerFileDownload(blob: Blob, filename: string) {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }

  downloadErrorReport() {
    if (!this.previewData || !this.previewData.errors || this.previewData.errors.length === 0) return;
    this.exportService.exportToCsv(this.previewData.errors, `${this.module}_import_error_report`, [
      { key: 'rowNumber', label: 'Row #' },
      { key: 'column', label: 'Column' },
      { key: 'rawValue', label: 'Invalid Value' },
      { key: 'errorMessage', label: 'Error' },
      { key: 'suggestedFix', label: 'Suggested Fix' }
    ]);
  }

  closeModal() {
    this.showPreviewModal = false;
    this.selectedFile = null;
  }
}
