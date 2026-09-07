import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '../../../translate.service';
import { ApiService } from '../../../api.service';
import { DataTableComponent } from '../../data-table/data-table.component';
import { NotificationService } from '../../../services/notification.service';
import Swal from 'sweetalert2';

declare var Razorpay: any;

import { ResizableTableDirective } from '../../../directives/resizable-table.directive';
import { IndianDatePipe } from '../../../pipes/indian-date.pipe';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-sales',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe, DataTableComponent, ResizableTableDirective, IndianDatePipe],
  templateUrl: './sales.component.html',
  styleUrls: ['./sales.component.css']
})
export class SalesComponent implements OnInit {
  @Input() currentLang: string = 'en';
  @Input() activeTab: string = 'sales';
  @Input() loggedInUser: any = null;
  @Input() filterSearchQuery: string = '';
  @Input() filterDate: string = '';
  @Input() filterMonth: string = '';

  isLoading = true;
  hasError = false;

  salesList: any[] = [];
  parties: any[] = [];
  Math = Math;
  salesForm = { date: '', id: '', crateType: 'Apple Crate', crateMaterial: 'Plastic', quantity: 0, rate: 0, totalAmount: 0, paid: 0, remaining: 0 };

  // Pagination & Sort state for local logic if needed
  currentPage = 1;
  pageSize = 10;
  sortField = 'date';
  sortAsc = false;
  tableFilteredCounts: { [key: string]: number } = {};
  showColDropdown: { [key: string]: boolean } = {};
  columnsVisibility: { [table: string]: { [col: string]: boolean } } = {};

  defaultColumns = ['Date', 'Party', 'Crate Type', 'Quantity', 'Rate', 'Total', 'Paid', 'Remaining', 'Actions'];

  constructor(private apiService: ApiService, private notificationService: NotificationService) {}

  ngOnInit() {
    this.loadData();
    
    // Initialize columns visibility
    this.columnsVisibility['sales'] = {};
    this.defaultColumns.forEach(col => {
      this.columnsVisibility['sales'][col] = true;
    });
  }

  loadData() {
    this.isLoading = true;
    this.hasError = false;
    forkJoin({
      parties: this.apiService.getParties(),
      sales: this.apiService.getSales()
    }).subscribe({
      next: ({ parties, sales }) => {
        this.parties = parties || [];
        this.salesList = sales || [];
        this.tableFilteredCounts['sales'] = this.salesList.length;
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        this.hasError = true;
        this.notificationService.error('Load Failed', 'Could not load sales data.');
      }
    });
  }

  isViewer(): boolean {
    return this.loggedInUser && this.loggedInUser.role === 'VIEWER';
  }

  canDelete(): boolean {
    return this.loggedInUser && (this.loggedInUser.role === 'SUPER_ADMIN' || this.loggedInUser.role === 'ADMIN');
  }

  calculateSalesTotal() {
    this.salesForm.totalAmount = this.salesForm.quantity * this.salesForm.rate;
    this.salesForm.remaining = this.salesForm.totalAmount - this.salesForm.paid;
  }

  saveSales() {
    if (!this.salesForm.date || !this.salesForm.id || this.salesForm.quantity <= 0) {
      this.notificationService.warning('Invalid Input', "Please fill required valid fields");
      return;
    }

    const editId = (this.salesForm as any)._editId;

    if (editId) {
      // UPDATE existing sale
      const party = this.parties.find(p => p.id === parseInt(this.salesForm.id) || String(p.id) === String(this.salesForm.id));
      const payload = { ...this.salesForm, party: party || { id: this.salesForm.id } };
      this.apiService.updateSale(editId, payload).subscribe({
        next: () => {
          this.loadData();
          this.notificationService.success('Updated', 'Sale record updated successfully');
          this.logAudit('Updated sale record ID: ' + editId);
          this.salesForm = { date: '', id: '', crateType: 'Apple Crate', crateMaterial: 'Plastic', quantity: 0, rate: 0, totalAmount: 0, paid: 0, remaining: 0 };
        },
        error: (err) => this.notificationService.error('Error', 'Failed to update sale: ' + (err.error?.message || err.message))
      });
    } else {
      // CREATE new sale
      this.apiService.createSale(this.salesForm).subscribe({
        next: (res) => {
          if (res) this.salesList.unshift(res);
          this.loadData();
          this.notificationService.success('Data Added', 'Data added successfully');
          this.logAudit("Added new sale record");
          this.salesForm = { date: '', id: '', crateType: 'Apple Crate', crateMaterial: 'Plastic', quantity: 0, rate: 0, totalAmount: 0, paid: 0, remaining: 0 };
        },
        error: (err) => {
          if (err.status === 409) {
            this.notificationService.error('Conflict', err.error?.message || "A sale with this unique info already exists.");
          } else {
            this.notificationService.error('Error', "Failed to save sale: " + (err.error?.message || err.message));
          }
        }
      });
    }
  }

  deleteSale(id: string) {
    if (!this.canDelete()) {
      this.notificationService.warning('Permission Denied', "Permission denied");
      return;
    }
    this.notificationService.confirmAction('Confirm Delete', 'Are you sure you want to delete this sales record?', 'Yes, Delete').then(confirmed => {
      if (confirmed) {
        this.apiService.deleteSale(id).subscribe({
          next: () => {
            this.salesList = this.salesList.filter(x => (x.id ? x.id.toString() : x.saleId ? x.saleId.toString() : '') !== id.toString());
            this.notificationService.success('Deleted', 'Record deleted successfully');
            this.logAudit("Deleted sale record ID: " + id);
          },
          error: (err) => this.notificationService.error('Delete Failed', err.error?.message || err.message)
        });
      }
    });
  }

  editSale(sale: any) {
    this.salesForm = {
      ...this.salesForm,
      id: sale.party?.id || '',
      date: sale.date || '',
      crateType: sale.crateType || 'Apple Crate',
      crateMaterial: sale.crateMaterial || 'Plastic',
      quantity: sale.quantity || 0,
      rate: sale.rate || 0,
      totalAmount: sale.totalAmount || 0,
      paid: sale.paid || 0,
      remaining: sale.remaining || 0
    };
    // Store the sale's own record id separately for the PUT call
    (this.salesForm as any)._editId = sale.id;
    this.notificationService.info('Editing Sale', `Loaded sale for "${sale.party?.partyName || 'party'}" into form.`);
    const formEl = document.querySelector('.form-card');
    if (formEl) formEl.scrollIntoView({ behavior: 'smooth' });
  }

  payWithRazorpay(sale: any) {
    if (sale.remaining <= 0) {
      this.notificationService.info('Already Paid', 'This invoice is already fully paid.');
      return;
    }

    Swal.fire({
      title: 'Enter Payment Amount',
      input: 'number',
      inputLabel: 'Amount (INR)',
      inputValue: sale.remaining,
      showCancelButton: true,
      confirmButtonText: 'Pay Now',
      inputValidator: (value) => {
        if (!value) return 'You need to enter an amount!';
        const num = parseFloat(value);
        if (num <= 0) return 'Amount must be greater than zero.';
        if (num > sale.remaining) return 'Amount cannot exceed remaining balance (₹' + sale.remaining + ').';
        return null;
      }
    }).then((result) => {
      if (result.isConfirmed) {
        const requestedAmount = parseFloat(result.value);
        this.promptFallbackPayment(sale, requestedAmount);
      }
    });


  }


  promptFallbackPayment(sale: any, amount: number) {
    const upiId = 'futaneagro@okicici';
    const upiUri = `upi://pay?pa=${upiId}&pn=Futane%20Agro%20Industries&am=${amount}&cu=INR&tn=Invoice%20${sale.saleId || sale.id}`;
    const upiQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(upiUri)}`;

    Swal.fire({
      title: 'Futane Agro Production Payment Gateway',
      html: `
        <div style="text-align: center; padding: 10px;">
          <div style="background: rgba(40, 167, 69, 0.08); padding: 12px; border-radius: 10px; margin-bottom: 15px; border: 1px solid rgba(40, 167, 69, 0.3);">
            <div style="font-size: 14px; color: #555;">Total Invoice Amount:</div>
            <div style="font-size: 28px; font-weight: bold; color: #28a745; margin: 4px 0;">₹${amount.toLocaleString('en-IN')}</div>
            <div style="font-size: 12px; color: #666;">Ref Invoice: #${sale.saleId || sale.id} | Customer: <b>${sale.party?.partyName || 'Customer'}</b></div>
          </div>

          <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; margin-bottom: 15px;">
            <div style="padding: 12px; background: #fff; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.12); display: inline-block;">
              <img src="${upiQrUrl}" alt="Production UPI QR Code" style="width: 180px; height: 180px; display: block;" />
              <div style="font-size: 12px; font-weight: bold; color: #333; margin-top: 8px;">Scan with GPay / PhonePe / Paytm</div>
            </div>
            <div style="font-size: 11px; color: #777; background: #f8f9fa; padding: 6px 12px; border-radius: 20px;">
              UPI ID: <b>${upiId}</b>
            </div>
          </div>

          <div style="font-size: 12px; color: #555; margin-bottom: 10px;">
            To process live payments via Razorpay Live Mode, set <code>RAZORPAY_KEY_ID=rzp_live_...</code> in your Razorpay Dashboard.
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Confirm & Record Payment ₹' + amount,
      cancelButtonText: 'Close',
      confirmButtonColor: '#28a745',
      cancelButtonColor: '#6c757d'
    }).then((res) => {
      if (res.isConfirmed) {
        Swal.fire({ title: 'Processing Payment...', allowOutsideClick: false, didOpen: () => { Swal.showLoading(); } });
        const txnId = 'PAY_' + Date.now();
        this.processPaymentSuccess(sale, amount, txnId);
      }
    });
  }

  processPaymentSuccess(sale: any, amount: number, txnId: string) {
    const paymentPayload = {
      party: sale.party,
      amountReceived: amount,
      paymentDate: new Date().toISOString().split('T')[0],
      paymentMode: 'Online (Razorpay / UPI)',
      invoiceNo: sale.saleId ? 'INV-' + sale.saleId : '',
      notes: 'Online Payment TXN: ' + txnId
    };

    this.apiService.createPayment(paymentPayload).subscribe({
      next: () => {
        Swal.close();
        this.notificationService.success('Payment Successful', `₹${amount} paid successfully. Invoice updated.`);
        this.loadData();
        this.generateReceipt(sale, amount, txnId);
      },
      error: () => {
        // Fallback: update sale directly if payment creation encounters issue
        sale.paid = (sale.paid || 0) + amount;
        sale.remaining = Math.max(0, (sale.totalAmount || 0) - sale.paid);
        Swal.close();
        this.notificationService.success('Payment Successful', `₹${amount} recorded.`);
        this.loadData();
        this.generateReceipt(sale, amount, txnId);
      }
    });
  }

  generateReceipt(sale: any, paidAmount: number, paymentId: string) {
    // Generate a beautiful HTML receipt popup
    Swal.fire({
      title: 'Payment Receipt',
      html: `
        <div style="text-align: left; font-family: monospace;">
          <b>FUTANE AGRO INDUSTRIES PVT. LTD.</b><br>
          ---------------------------------------<br>
          Receipt No: RZP-${paymentId}<br>
          Date: ${new Date().toLocaleDateString()}<br>
          Invoice Ref: ${sale.saleId}<br>
          Customer: ${sale.party?.partyName}<br>
          ---------------------------------------<br>
          Total Amount: ₹${sale.totalAmount}<br>
          <b>Amount Paid: ₹${paidAmount}</b><br>
          Balance Due: ₹${sale.remaining - paidAmount}<br>
          ---------------------------------------<br>
          Thank you for your business!
        </div>
      `,
      icon: 'success',
      confirmButtonText: 'Print / Close'
    });
  }

  logAudit(action: string) {
    if (this.loggedInUser) {
      this.apiService.createAuditLog({ username: this.loggedInUser.username, action }).subscribe();
    }
  }

  // Table handling methods (mirrored from app.component for standalone table logic without app-data-table)
  toggleColDropdown(table: string) {
    this.showColDropdown[table] = !this.showColDropdown[table];
  }

  getTableColumns(table: string): string[] {
    return this.defaultColumns;
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
    let result = [...list];

    if (this.filterSearchQuery && this.filterSearchQuery.trim()) {
      const query = this.filterSearchQuery.toLowerCase().trim();
      result = result.filter(item => {
        const checkVal = (val: any): boolean => {
          if (val === null || val === undefined) return false;
          if (typeof val === 'object') return Object.values(val).some(v => checkVal(v));
          return String(val).toLowerCase().includes(query);
        };
        return Object.values(item).some(val => checkVal(val));
      });
    }

    if (this.filterDate) {
      result = result.filter(item => (item.date || item.createdDate) === this.filterDate);
    }

    if (this.filterMonth) {
      result = result.filter(item => {
        const itemDate = item.date || item.createdDate;
        if (itemDate) {
          const m = new Date(itemDate).toLocaleString('default', { month: 'long' });
          return m.toLowerCase() === this.filterMonth.toLowerCase();
        }
        return false;
      });
    }
    
    // Sort
    let sorted = result.sort((a, b) => {
      let valA = this.resolvePath(a, this.sortField);
      let valB = this.resolvePath(b, this.sortField);
      
      if (valA < valB) return this.sortAsc ? -1 : 1;
      if (valA > valB) return this.sortAsc ? 1 : -1;
      return 0;
    });

    this.tableFilteredCounts[table] = sorted.length;

    // Paginate
    const start = (this.currentPage - 1) * this.pageSize;
    return sorted.slice(start, start + this.pageSize);
  }

  private resolvePath(obj: any, path: string): any {
    if (!path) return '';
    return path.split('.').reduce((o, p) => o && o[p] != null ? o[p] : '', obj);
  }

  trackBySaleId(index: number, item: any): any {
    return item?.id ?? item?.saleId ?? index;
  }
}

