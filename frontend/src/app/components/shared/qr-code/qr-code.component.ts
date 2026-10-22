import { Component, Input, OnChanges, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as QRCode from 'qrcode';

/**
 * Dynamic HTML5 Canvas QR Code Generator (`app-qr-code`).
 *
 * Uses the `qrcode` library to render vector QR codes onto an HTML5 canvas.
 * Used across the ERP for:
 * - Generating UPI payment QR codes (`upi://pay?pa=...`) for instant invoice settlement.
 * - Generating Dispatch gate-pass verification barcodes for loading dock scanners.
 */
@Component({
  selector: 'app-qr-code',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="qr-container" style="display:inline-block; text-align:center;">
      <canvas #qrCanvas></canvas>
      <div *ngIf="label" style="font-size:11px; font-weight:600; margin-top:4px; color:var(--text-secondary, #64748b);">
        {{ label }}
      </div>
    </div>
  `
})
export class QrCodeComponent implements OnChanges, AfterViewInit {
  @Input() value: string = '';
  @Input() label: string = '';
  @Input() size: number = 120;

  @ViewChild('qrCanvas') qrCanvas?: ElementRef<HTMLCanvasElement>;

  ngAfterViewInit() {
    this.generateQr();
  }

  ngOnChanges() {
    this.generateQr();
  }

  generateQr() {
    if (!this.value || !this.qrCanvas?.nativeElement) return;
    try {
      QRCode.toCanvas(this.qrCanvas.nativeElement, this.value, {
        width: this.size,
        margin: 1,
        color: {
          dark: '#1e293b',
          light: '#ffffff'
        }
      }, (error) => {
        if (error) console.error('QR Generation failed:', error);
      });
    } catch (e) {
      console.warn('QR Code generation deferred', e);
    }
  }
}
