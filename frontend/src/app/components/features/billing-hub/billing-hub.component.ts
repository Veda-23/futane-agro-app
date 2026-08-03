import { Component, OnInit, Input, HostListener } from '@angular/core';
import { AutoSelectDirective } from '../../../directives/auto-select.directive';
import { FormStateDirective } from '../../../directives/form-state.directive';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '../../../translate.service';
import { ApiService } from '../../../api.service';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-billing-hub',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe, DecimalPipe, AutoSelectDirective, FormStateDirective],
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

  activeBillType = 'tax_invoice';
  selectedBillRecordId = '';
  selectedBillRecord: any = null;
  showBillModal = false;

  constructor(private apiService: ApiService) {}

  ngOnInit() {}

  onBillTypeChange() {
    this.selectedBillRecordId = '';
    this.selectedBillRecord = null;
    this.showBillModal = false;
    const list = this.getBillSourceList();
    if (list && list.length > 0) {
      const id = this.getRecordId(list[0]);
      if (id) { this.selectedBillRecordId = String(id); this.onBillRecordChange(); }
    }
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
    this.showBillModal = false; // reset modal when record changes
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

  // ── WhatsApp ─────────────────────────────────────────────────────────────────
  shareOnWhatsApp() {
    if (!this.selectedBillRecord) return;
    const docType = this.activeBillType.replace(/_/g, ' ').toUpperCase();
    const id = this.getRecordId(this.selectedBillRecord);
    let amount = 0, recipientName = 'Customer', rawPhone = '';

    switch (this.activeBillType) {
      case 'tax_invoice': case 'proforma':
        amount = this.selectedBillRecord.totalAmount;
        recipientName = this.selectedBillRecord.party?.partyName || 'Customer';
        rawPhone = this.selectedBillRecord.party?.partyContact || '';
        break;
      case 'delivery_challan':
        amount = this.selectedBillRecord.sale?.quantity || 0;
        recipientName = this.selectedBillRecord.sale?.party?.partyName || 'Customer';
        rawPhone = this.selectedBillRecord.sale?.party?.partyContact || '';
        break;
      case 'payment_receipt':
        amount = this.selectedBillRecord.amountReceived;
        recipientName = this.selectedBillRecord.party?.partyName || 'Customer';
        rawPhone = this.selectedBillRecord.party?.partyContact || '';
        break;
      case 'purchase_invoice':
        amount = this.selectedBillRecord.amount;
        recipientName = this.selectedBillRecord.vendor?.vendorName || 'Vendor';
        rawPhone = this.selectedBillRecord.vendor?.mobile || '';
        break;
      case 'transport_receipt':
        amount = this.selectedBillRecord.rent;
        recipientName = this.selectedBillRecord.driver?.driverName || 'Driver';
        rawPhone = this.selectedBillRecord.driver?.mobile || '';
        break;
      case 'salary_slip':
        amount = this.selectedBillRecord.salaryAmount;
        recipientName = this.selectedBillRecord.employee?.empName || 'Employee';
        rawPhone = this.selectedBillRecord.employee?.empContact || '';
        break;
    }

    // Phone validation
    const digits = rawPhone.replace(/\D/g, '');
    let fullPhone = '';
    if (digits.length === 10) fullPhone = '91' + digits;
    else if (digits.length === 12 && digits.startsWith('91')) fullPhone = digits;
    else if (digits.length > 0) fullPhone = digits;
    else {
      Swal.fire({ icon: 'warning', title: 'No Phone Number', text: `No valid phone found for ${recipientName}.` });
      return;
    }

    const date = this.selectedBillRecord.date || this.selectedBillRecord.paymentDate || this.selectedBillRecord.dispatchDate || 'N/A';
    const msg = `Hello ${recipientName},\n\nWe are sharing the details for *${docType}* (Ref ID: ${id}) from *Futane Agro Industries Pvt. Ltd.*\n\n*Amount:* ₹${amount}\n*Date:* ${date}\n\nThank you for doing business with us!`;
    window.open(`https://wa.me/${fullPhone}?text=${encodeURIComponent(msg)}`, '_blank');
    this.logAudit(`Shared ${docType} ID ${id} via WhatsApp`);

    setTimeout(() => {
      Swal.fire({
        icon: 'info', title: 'WhatsApp Opened',
        html: `<p style="font-size:13px;">WhatsApp opened with pre-filled message.</p>
               <p style="font-size:12px;color:#94a3b8;margin-top:8px;">
                 💡 <strong>Tip:</strong> To share the PDF, download it and attach in WhatsApp chat.
               </p>`,
        confirmButtonText: 'Download PDF too', showCancelButton: true, cancelButtonText: 'OK, Done'
      }).then((r: any) => { if (r.isConfirmed) this.downloadBillingHubPDF(); });
    }, 800);
  }

  // ── Download PDF ──────────────────────────────────────────────────────────────
  downloadBillingHubPDF() {
    if (!this.selectedBillRecord) return;
    const element = document.getElementById('printable-billing-card');
    if (!element) { Swal.fire({ icon: 'error', title: 'Error', text: 'Could not find billing card element.' }); return; }

    const docType = this.activeBillType.replace(/_/g, ' ').toUpperCase();
    const id = this.getRecordId(this.selectedBillRecord);
    this.logAudit(`Downloaded PDF for ${docType} ID ${id}`);

    // Temporarily force white BG for clean render
    const origBg = element.style.background;
    element.style.setProperty('background', '#ffffff', 'important');
    element.style.setProperty('color', '#1f2937', 'important');

    Swal.fire({ title: 'Generating PDF…', didOpen: () => Swal.showLoading(), allowOutsideClick: false });

    html2canvas(element, { scale: 2, useCORS: true, backgroundColor: '#ffffff', logging: false })
      .then(canvas => {
        element.style.background = origBg;
        element.style.removeProperty('color');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgW = 210, pageH = 297;
        const imgH = (canvas.height * imgW) / canvas.width;
        let leftH = imgH, pos = 0;
        const img = canvas.toDataURL('image/png');
        pdf.addImage(img, 'PNG', 0, pos, imgW, imgH);
        leftH -= pageH;
        while (leftH >= 0) { pos = leftH - imgH; pdf.addPage(); pdf.addImage(img, 'PNG', 0, pos, imgW, imgH); leftH -= pageH; }
        pdf.save(`${this.activeBillType}_${id}.pdf`);
        Swal.close();
        Swal.fire({ icon: 'success', title: 'PDF Downloaded!', timer: 1500, showConfirmButton: false });
      })
      .catch(() => {
        element.style.background = origBg;
        Swal.close();
        Swal.fire({ icon: 'error', title: 'PDF Error', text: 'Could not generate PDF. Please try again.' });
      });
  }

  // ── Print ─────────────────────────────────────────────────────────────────────
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

  // ── Calculation Helpers ───────────────────────────────────────────────────────
  numberToWords(num: number): string {
    if (num == null) return '';
    num = Math.round(num);
    if (num === 0) return 'Zero';
    const a = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten',
      'Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
    const b = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
    const t = (n: number): string => {
      let s = '';
      if (n > 99) { s += a[Math.floor(n/100)] + ' Hundred '; n %= 100; }
      if (n > 19) s += b[Math.floor(n/10)] + ' ' + a[n%10];
      else if (n > 0) s += a[n];
      return s.trim();
    };
    let res = '', rem = num;
    if (rem >= 10000000) { res += t(Math.floor(rem/10000000)) + ' Crore '; rem %= 10000000; }
    if (rem >= 100000)   { res += t(Math.floor(rem/100000))   + ' Lakh ';  rem %= 100000;   }
    if (rem >= 1000)     { res += t(Math.floor(rem/1000))     + ' Thousand '; rem %= 1000;  }
    if (rem > 0)         { res += t(rem); }
    return res.trim() + ' Rupees Only';
  }

  getCGST(amount: number): number { return amount * 0.09; }
  getSGST(amount: number): number { return amount * 0.09; }
  getIGST(amount: number): number { return amount * 0.18; }
  getGrandTotal(amount: number): number { return amount * 1.18; }
}
