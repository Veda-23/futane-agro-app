import { Component, OnInit, Input, ElementRef } from '@angular/core';
import { AutoSelectDirective } from '../../../directives/auto-select.directive';
import { FormStateDirective } from '../../../directives/form-state.directive';
import { FormValidationService } from '../../../services/form-validation.service';
import { NotificationService } from '../../../services/notification.service';

import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '../../../translate.service';
import { ApiService } from '../../../api.service';

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

  constructor(private apiService: ApiService) {}

  ngOnInit() {}

  onBillTypeChange() {
    this.selectedBillRecordId = '';
    this.selectedBillRecord = null;
    
    const list = this.getBillSourceList();
    if (list && list.length > 0) {
      const firstItem = list[0];
      const id = this.getRecordId(firstItem);
      if (id) {
        this.selectedBillRecordId = String(id);
        this.onBillRecordChange();
      }
    }
  }

  getBillSourceList(): any[] {
    switch(this.activeBillType) {
      case 'tax_invoice':
      case 'proforma':
        return this.salesList;
      case 'delivery_challan':
        return this.dispatchesList;
      case 'payment_receipt':
        return this.paymentsList;
      case 'purchase_invoice':
        return this.rawMaterialsList;
      case 'transport_receipt':
        return this.transportsList;
      case 'salary_slip':
        return this.salariesList;
      default:
        return [];
    }
  }

  getRecordId(item: any): any {
    if (!item) return null;
    if (item.id !== undefined) return item.id;
    if (item.id !== undefined) return item.id;
    if (item.paymentId !== undefined) return item.paymentId;
    if (item.rawMaterialId !== undefined) return item.rawMaterialId;
    if (item.id !== undefined) return item.id;
    if (item.id !== undefined) return item.id;
    return null;
  }

  onBillRecordChange() {
    const list = this.getBillSourceList();
    const id = this.selectedBillRecordId;
    this.selectedBillRecord = list.find(item => String(this.getRecordId(item)) === String(id)) || null;
  }

  shareOnWhatsApp() {
    if (!this.selectedBillRecord) return;
    const docType = this.activeBillType.replace('_', ' ').toUpperCase();
    const id = this.getRecordId(this.selectedBillRecord);
    let amount = 0;
    let recipientName = 'Customer';

    switch(this.activeBillType) {
      case 'tax_invoice':
      case 'proforma':
        amount = this.selectedBillRecord.totalAmount;
        recipientName = this.selectedBillRecord.party.partyName;
        break;
      case 'delivery_challan':
        amount = this.selectedBillRecord.sale.quantity;
        recipientName = this.selectedBillRecord.sale.party.partyName;
        break;
      case 'payment_receipt':
        amount = this.selectedBillRecord.amountReceived;
        recipientName = this.selectedBillRecord.party.partyName;
        break;
      case 'purchase_invoice':
        amount = this.selectedBillRecord.amount;
        recipientName = this.selectedBillRecord.vendor.vendorName;
        break;
      case 'transport_receipt':
        amount = this.selectedBillRecord.rent;
        recipientName = this.selectedBillRecord.driver.driverName;
        break;
      case 'salary_slip':
        amount = this.selectedBillRecord.salaryAmount;
        recipientName = this.selectedBillRecord.employee.empName;
        break;
    }

    const message = `Hello ${recipientName},\n\nWe are sharing the details for *${docType}* (Ref ID: ${id}) from *Futane Agro Industries Pvt. Ltd.*\n\n*Amount/Qty:* ₹${amount}\n*Date:* ${this.selectedBillRecord.date || this.selectedBillRecord.paymentDate || this.selectedBillRecord.dispatchDate || 'N/A'}\n\nThank you for doing business with us!`;
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    this.logAudit(`Shared ${docType} ID ${id} via WhatsApp`);
  }

  logAudit(action: string) {
    this.apiService.createAuditLog({
      username: this.loggedInUser?.username || 'System',
      action: action
    }).subscribe();
  }

  numberToWords(num: number): string {
    if (num === null || num === undefined) return '';
    num = Math.round(num);
    if (num === 0) return 'Zero';

    const a = [
      '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
      'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
    ];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    const translate = (n: number): string => {
      let str = '';
      if (n > 99) {
        str += a[Math.floor(n / 100)] + ' Hundred ';
        n %= 100;
      }
      if (n > 19) {
        str += b[Math.floor(n / 10)] + ' ' + a[n % 10];
      } else if (n > 0) {
        str += a[n];
      }
      return str.trim();
    };

    let result = '';
    let rem = num;

    if (rem >= 10000000) {
      const cr = Math.floor(rem / 10000000);
      result += translate(cr) + ' Crore ';
      rem %= 10000000;
    }

    if (rem >= 100000) {
      const lk = Math.floor(rem / 100000);
      result += translate(lk) + ' Lakh ';
      rem %= 100000;
    }

    if (rem >= 1000) {
      const th = Math.floor(rem / 1000);
      result += translate(th) + ' Thousand ';
      rem %= 1000;
    }

    if (rem > 0) {
      result += translate(rem);
    }

    return result.trim() + ' Rupees Only';
  }

  getCGST(amount: number): number { return amount * 0.09; }
  getSGST(amount: number): number { return amount * 0.09; }
  getIGST(amount: number): number { return amount * 0.18; }
  getGrandTotal(amount: number): number { return amount * 1.18; }
}

