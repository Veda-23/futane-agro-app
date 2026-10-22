import { Component, Output, EventEmitter, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BrowserMultiFormatReader, IScannerControls } from '@zxing/browser';

/**
 * Hardware Camera Optical QR & Barcode Scanner Modal (`app-qr-scanner-modal`).
 *
 * Uses `@zxing/browser` (`BrowserMultiFormatReader`) to stream live device video and
 * decode crate QR labels and dispatch barcodes in real-time, emitting the decoded string
 * over `scanned` to instantly auto-populate gate-pass manifests.
 */
@Component({
  selector: 'app-qr-scanner-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-backdrop" style="position:fixed; inset:0; background:rgba(15,23,42,0.7); z-index:1100; display:flex; align-items:center; justify-content:center;">
      <div class="glass-panel" style="padding:24px; width:90%; max-width:420px; border-radius:16px; text-align:center; background:var(--card-bg, #ffffff); box-shadow:0 20px 25px -5px rgba(0,0,0,0.3);">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px;">
          <h3 style="margin:0; font-size:16px; font-weight:700; display:flex; align-items:center; gap:8px;"><i class="bi bi-qr-code-scan" style="color:#d97706; font-size:18px;"></i> Scan Dispatch Crate / Batch QR</h3>
          <button style="background:none; border:none; font-size:18px; cursor:pointer; color:var(--text-secondary, #64748b);" (click)="closeScanner()"><i class="bi bi-x-lg"></i></button>
        </div>
        <div style="position:relative; width:100%; height:260px; background:#0f172a; border-radius:12px; overflow:hidden; border:2px solid #d97706;">
          <video #videoPreview style="width:100%; height:100%; object-fit:cover;"></video>
          <div style="position:absolute; inset:20px; border:2px dashed rgba(255,255,255,0.6); border-radius:8px; pointer-events:none;"></div>
        </div>
        <p style="font-size:12px; color:var(--text-secondary, #64748b); margin-top:12px; margin-bottom:16px;">
          Point your device camera at the crate QR code to auto-populate dispatch details.
        </p>
        <button class="btn btn-secondary" style="width:100%;" (click)="closeScanner()">Cancel Scanner</button>
      </div>
    </div>
  `
})
export class QrScannerModalComponent implements OnInit, OnDestroy {
  @Output() scanned = new EventEmitter<string>();
  @Output() close = new EventEmitter<void>();

  @ViewChild('videoPreview', { static: true }) videoPreview!: ElementRef<HTMLVideoElement>;
  private codeReader = new BrowserMultiFormatReader();
  private controls?: IScannerControls;

  ngOnInit() {
    this.startScanner();
  }

  async startScanner() {
    try {
      this.controls = await this.codeReader.decodeFromVideoDevice(undefined, this.videoPreview.nativeElement, (result, err) => {
        if (result) {
          this.scanned.emit(result.getText());
          this.closeScanner();
        }
      });
    } catch (e) {
      console.warn('Camera access unavailable or deferred', e);
    }
  }

  closeScanner() {
    if (this.controls) {
      try {
        this.controls.stop();
      } catch (e) {}
    }
    this.close.emit();
  }

  ngOnDestroy() {
    if (this.controls) {
      try {
        this.controls.stop();
      } catch (e) {}
    }
  }
}
