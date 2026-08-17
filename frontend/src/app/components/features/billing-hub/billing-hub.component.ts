import { Component, OnInit, Input, HostListener } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '../../../translate.service';
import { ApiService } from '../../../api.service';
import { AutoSelectDirective } from '../../../directives/auto-select.directive';
import { FormStateDirective } from '../../../directives/form-state.directive';
import { InrPipe } from '../../../pipes/inr-currency.pipe';
import { IndianDatePipe } from '../../../pipes/indian-date.pipe';
import { QrCodeComponent } from '../../shared/qr-code/qr-code.component';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-billing-hub',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe, DecimalPipe, AutoSelectDirective, FormStateDirective, InrPipe, IndianDatePipe, QrCodeComponent],
  templateUrl: './billing-hub.component.html',
  styleUrls: ['./billing-hub.component.css']
})
export class BillingHubComponent implements OnInit {
  @Input() currentLang: string = 'en';
  @Input() activeTab: string = 'billinghub';
  @Input() loggedInUser: any = null;
  @Input() salesList: any[] = [];
  @Input() dispatchesList: any[] = [];
  @Input() paymentsList: any[] = [];
  @Input() rawMaterialsList: any[] = [];
  @Input() transportsList: any[] = [];
  @Input() salariesList: any[] = [];
  @Input() settingsList: any[] = [];

  activeBillType = 'tax_invoice';
  selectedBillRecordId = '';
  selectedBillRecord: any = null;
  showBillModal = false;
  showPreviewCard = false;
  currentDocumentNumber = '';
  today = new Date();

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    if (!this.settingsList || this.settingsList.length === 0) {
      this.apiService.getSettings().subscribe(res => {
        if (res) this.settingsList = res;
      });
    }
  }

  get companyInfo(): any {
    return {
      name: this.getSettingVal('company_name') || 'Futane Agro Industries Pvt. Ltd.',
      address: this.getSettingVal('company_address') || 'Village Futane, Tal. Rahuri, Dist. Ahmednagar, Maharashtra - 413706',
      phone: this.getSettingVal('company_phone') || '+91-XXXXXXXXXX',
      email: this.getSettingVal('company_email') || 'info@futaneagro.com',
      gstin: this.getSettingVal('company_gstin') || '27XXXXX000X1ZX',
      pan: this.getSettingVal('company_pan') || 'XXXXX0000X',
      fssai: this.getSettingVal('company_fssai') || 'XXXXXXXXXXXXXXXXXX'
    };
  }

  get gstRate(): number {
    const val = parseFloat(this.getSettingVal('gst_rate_percentage') || '18');
    return isNaN(val) ? 0.18 : val / 100;
  }

  getSettingVal(key: string): string {
    return this.settingsList?.find((s: any) => s.key === key || s.settingKey === key)?.value
      || this.settingsList?.find((s: any) => s.key === key || s.settingKey === key)?.settingValue
      || '';
  }

  onBillTypeChange() {
    this.selectedBillRecordId = '';
    this.selectedBillRecord = null;
    this.showBillModal = false;
    this.showPreviewCard = false;
    this.currentDocumentNumber = '';
  }

  getBillSourceList(): any[] {
    switch (this.activeBillType) {
      case 'tax_invoice': case 'proforma': return this.salesList;
      case 'delivery_challan': return this.dispatchesList;
      case 'payment_receipt': return this.paymentsList;
      case 'purchase_invoice': return this.rawMaterialsList;
      case 'transport_receipt': return this.transportsList;
      case 'salary_slip': return this.salariesList;
      default: return [];
    }
  }

  getRecordId(item: any): any {
    if (!item) return null;
    if (item.paymentId !== undefined) return item.paymentId;
    if (item.rawMaterialId !== undefined) return item.rawMaterialId;
    if (item.id !== undefined) return item.id;
    return null;
  }

  onBillRecordChange() {
    const list = this.getBillSourceList();
    const id = this.selectedBillRecordId;
    this.selectedBillRecord = list.find(item => String(this.getRecordId(item)) === String(id)) || null;
    this.showBillModal = false;
    this.showPreviewCard = !!this.selectedBillRecord;
    if (this.selectedBillRecord) {
      this.currentDocumentNumber = this.generateDocumentNumber(this.activeBillType);
    }
  }

  // Auto-Generated Document Serial Numbers (F-02)
  generateDocumentNumber(type: string): string {
    const prefix: { [key: string]: string } = {
      tax_invoice: 'INV',
      proforma: 'PRO',
      delivery_challan: 'DC',
      payment_receipt: 'REC',
      purchase_invoice: 'PI',
      transport_receipt: 'TR',
      salary_slip: 'SAL'
    };
    const p = prefix[type] || 'DOC';
    const year = new Date().getFullYear().toString().slice(-2);
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const recId = this.selectedBillRecord ? String(this.getRecordId(this.selectedBillRecord)).padStart(4, '0') : String(Math.floor(Math.random() * 9000) + 1000);
    return `FA-${p}-${year}${month}-${recId}`;
  }

  getDocumentTitle(type: string): string {
    const titles: { [key: string]: string } = {
      tax_invoice: 'Tax Invoice',
      proforma: 'Proforma Invoice',
      delivery_challan: 'Delivery Challan',
      payment_receipt: 'Payment Receipt',
      purchase_invoice: 'Purchase Bill / Inward Slip',
      transport_receipt: 'Transport & Freight Receipt',
      salary_slip: 'Employee Salary Slip'
    };
    return titles[type] || 'Commercial Document';
  }

  // GST Calculation Breakdown (F-03)
  getGSTBreakdown(saleRecord: any): any {
    const baseAmount = saleRecord?.totalAmount || (saleRecord?.quantity * saleRecord?.rate) || 0;
    const gstRate = 0.18; // 18% GST standard
    const isInterState = saleRecord?.party?.state && saleRecord?.party?.state.toLowerCase() !== 'maharashtra';

    const gstAmount = baseAmount * gstRate;
    return {
      baseAmount,
      cgst: isInterState ? 0 : gstAmount / 2,
      sgst: isInterState ? 0 : gstAmount / 2,
      igst: isInterState ? gstAmount : 0,
      totalGst: gstAmount,
      grandTotal: baseAmount + gstAmount,
      isInterState
    };
  }

  // Dynamic NPCI Bharat UPI QR String Generator (V-01)
  getUpiQrString(party: any, amount: number, invoiceNo: string): string {
    const upiId = this.getSettingVal('company_upi_id') || 'futaneagro@okhdfcbank';
    const payeeName = encodeURIComponent(this.getSettingVal('company_name') || 'Futane Agro Industries');
    const note = encodeURIComponent(`Inv_${invoiceNo || 'BILL'}`);
    const safeAmount = (amount && !isNaN(amount)) ? Number(amount).toFixed(2) : '0.00';
    return `upi://pay?pa=${upiId}&pn=${payeeName}&am=${safeAmount}&tn=${note}&cu=INR`;
  }

  // Amount In Words Converter (F-04)
  amountToWords(amount: number | null | undefined): string {
    if (!amount || isNaN(amount)) return 'Zero Rupees Only';
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
      'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
      'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    const numToWords = (n: number): string => {
      if (n === 0) return '';
      if (n < 20) return ones[n] + ' ';
      if (n < 100) return tens[Math.floor(n / 10)] + ' ' + ones[n % 10] + ' ';
      if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred ' + numToWords(n % 100);
      if (n < 100000) return numToWords(Math.floor(n / 1000)) + 'Thousand ' + numToWords(n % 1000);
      if (n < 10000000) return numToWords(Math.floor(n / 100000)) + 'Lakh ' + numToWords(n % 100000);
      return numToWords(Math.floor(n / 10000000)) + 'Crore ' + numToWords(n % 10000000);
    };

    const rupees = Math.floor(amount);
    const paise = Math.round((amount - rupees) * 100);
    let result = 'Rupees ' + numToWords(rupees).trim();
    if (paise > 0) {
      result += ' and ' + numToWords(paise).trim() + ' Paise';
    }
    return result + ' Only';
  }

  openBillModal() { this.showBillModal = true; }
  closeBillModal() { this.showBillModal = false; }

  closeBillModalOnBackdrop(event: MouseEvent) {
    if ((event.target as HTMLElement).style.position === 'fixed' ||
        (event.target as HTMLElement).getAttribute('style')?.includes('position:fixed')) {
      this.closeBillModal();
    }
  }

  @HostListener('document:keydown.escape')
  onEscapeKey() { if (this.showBillModal) this.closeBillModal(); }

  // WhatsApp Sharing with pre-filled message (F-06)
  shareOnWhatsApp() {
    if (!this.selectedBillRecord) return;
    const rec = this.selectedBillRecord;
    let msg = '';
    let rawPhone = '';

    if (this.activeBillType === 'tax_invoice' || this.activeBillType === 'proforma') {
      const gst = this.getGSTBreakdown(rec);
      rawPhone = rec.party?.partyContact || rec.party?.contact || '';
      msg = `🧾 *${this.activeBillType === 'tax_invoice' ? 'TAX INVOICE' : 'PROFORMA INVOICE'}*\n`
          + `*Futane Agro Industries Pvt. Ltd.*\n\n`
          + `Doc No: *${this.currentDocumentNumber}*\n`
          + `Customer: *${rec.party?.partyName || 'Customer'}*\n`
          + `Date: ${rec.date || new Date().toISOString().split('T')[0]}\n`
          + `Item: ${rec.crateType} (${rec.crateMaterial || 'Plastic'})\n`
          + `Quantity: ${rec.quantity} crates\n`
          + `Rate: ₹${Number(rec.rate).toLocaleString('en-IN')}/crate\n`
          + `Sub-Total: ₹${Number(gst.baseAmount).toLocaleString('en-IN')}\n`
          + `GST (18%): ₹${Number(gst.totalGst).toLocaleString('en-IN')}\n`
          + `*Grand Total: ₹${Number(gst.grandTotal).toLocaleString('en-IN')}*\n\n`
          + `Please arrange payment at your earliest convenience.\n`
          + `— Futane Agro Industries`;
    } else if (this.activeBillType === 'payment_receipt') {
      rawPhone = rec.party?.partyContact || rec.party?.contact || '';
      msg = `✅ *PAYMENT RECEIPT*\n`
          + `*Futane Agro Industries Pvt. Ltd.*\n\n`
          + `Receipt No: *${this.currentDocumentNumber}*\n`
          + `Customer: *${rec.party?.partyName || 'Customer'}*\n`
          + `Amount Received: *₹${Number(rec.amountReceived).toLocaleString('en-IN')}*\n`
          + `Payment Mode: ${rec.paymentMode || 'Cash'}\n`
          + `Date: ${rec.paymentDate}\n\n`
          + `Thank you for your payment! 🙏\n— Futane Agro Industries`;
    } else if (this.activeBillType === 'delivery_challan') {
      rawPhone = rec.sale?.party?.partyContact || rec.sale?.party?.contact || '';
      msg = `🚚 *DELIVERY CHALLAN*\n`
          + `*Futane Agro Industries Pvt. Ltd.*\n\n`
          + `Challan No: *${this.currentDocumentNumber}*\n`
          + `Customer: *${rec.sale?.party?.partyName || 'Customer'}*\n`
          + `Vehicle: *${rec.vehicleNumber || 'N/A'}*\n`
          + `Driver: ${rec.driverName || 'N/A'}\n`
          + `Quantity: ${rec.sale?.quantity || 0} crates (${rec.sale?.crateType || ''})\n`
          + `Date: ${rec.dispatchDate}\n\n`
          + `— Futane Agro Industries`;
    } else if (this.activeBillType === 'salary_slip') {
      rawPhone = rec.employee?.empContact || '';
      msg = `💼 *SALARY SLIP - ${rec.month}/${rec.year}*\n`
          + `*Futane Agro Industries Pvt. Ltd.*\n\n`
          + `Employee: *${rec.employee?.empName}*\n`
          + `Designation: ${rec.employee?.designation}\n`
          + `Gross Pay: ₹${Number(rec.salaryAmount).toLocaleString('en-IN')}\n`
          + `PF Deduction (12%): ₹${Number(rec.salaryAmount * 0.12).toLocaleString('en-IN')}\n`
          + `*Net Salary: ₹${Number(rec.salaryAmount * 0.88).toLocaleString('en-IN')}*\n\n`
          + `— Futane Agro HR`;
    } else {
      msg = `📄 Document ${this.currentDocumentNumber} from *Futane Agro Industries Pvt. Ltd.*`;
    }

    const digits = rawPhone.replace(/\D/g, '');
    let fullPhone = '';
    if (digits.length === 10) fullPhone = '91' + digits;
    else if (digits.length === 12 && digits.startsWith('91')) fullPhone = digits;
    else if (digits.length > 0) fullPhone = digits;

    const url = fullPhone
      ? `https://wa.me/${fullPhone}?text=${encodeURIComponent(msg)}`
      : `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
    this.logAudit(`Shared ${this.activeBillType} ID ${this.currentDocumentNumber} via WhatsApp`);
  }

  // Download PDF
  downloadBillingHubPDF() {
    if (!this.selectedBillRecord) return;
    const element = document.getElementById('printable-billing-card');
    if (!element) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'Could not find billing card element.' });
      return;
    }

    const id = this.currentDocumentNumber || this.getRecordId(this.selectedBillRecord);
    this.logAudit(`Downloaded PDF for ${this.activeBillType} ID ${id}`);

    Swal.fire({ title: 'Generating PDF…', didOpen: () => Swal.showLoading(), allowOutsideClick: false });

    html2canvas(element, { scale: 2, useCORS: true, backgroundColor: '#ffffff', logging: false })
      .then(canvas => {
        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgW = 210, pageH = 297;
        const imgH = (canvas.height * imgW) / canvas.width;
        let leftH = imgH, pos = 0;
        const img = canvas.toDataURL('image/png');
        pdf.addImage(img, 'PNG', 0, pos, imgW, imgH);
        leftH -= pageH;
        while (leftH >= 0) {
          pos = leftH - imgH;
          pdf.addPage();
          pdf.addImage(img, 'PNG', 0, pos, imgW, imgH);
          leftH -= pageH;
        }
        pdf.save(`${this.activeBillType}_${id}.pdf`);
        Swal.close();
        Swal.fire({ icon: 'success', title: 'PDF Downloaded!', timer: 1500, showConfirmButton: false });
      })
      .catch(() => {
        Swal.close();
        Swal.fire({ icon: 'error', title: 'PDF Error', text: 'Could not generate PDF. Please try again.' });
      });
  }

  printBillingDocument() {
    if (!this.selectedBillRecord) return;
    const element = document.getElementById('printable-billing-card');
    if (!element) return;
    const printWin = window.open('', '_blank', 'width=900,height=1200');
    if (!printWin) {
      Swal.fire({ icon: 'warning', title: 'Popup Blocked', text: 'Please allow popups for this site to print.' });
      return;
    }
    const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"],style'))
      .map((el: any) => el.outerHTML).join('');
    printWin.document.write(`<!DOCTYPE html><html><head><title>Print</title>${styles}
      <style>
        body { background:#fff !important; color:#000 !important; padding:20px; margin:0; }
        .no-print { display:none !important; }
        .bill-watermark { opacity:.06 !important; }
        .billing-a4-card { box-shadow:none !important; border:none !important; background:#fff !important; }
      </style></head><body>${element.outerHTML}</body></html>`);
    printWin.document.close();
    setTimeout(() => { printWin.focus(); printWin.print(); }, 600);
  }

  logAudit(action: string) {
    this.apiService.createAuditLog({ username: this.loggedInUser?.username || 'System', action }).subscribe();
  }
}
