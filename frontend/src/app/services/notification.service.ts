import { Injectable } from '@angular/core';
import Swal from 'sweetalert2';

/**
 * Enterprise Toast & Dialog Notification Service.
 * <p>
 * Standardizes visual feedback and user alerts across the Futane Agro ERP application using SweetAlert2 (Swal):
 * <ul>
 *   <li><b>Glassmorphic Toasts:</b> Fixed-width (410px) top-end floating toasts with gradient squircle badges,
 *       inline vector SVGs, linear progress timers, and hover-pause behavior.</li>
 *   <li><b>Theme-Aware Modals:</b> Automatically inspects {@code document.body.classList} for {@code dark-theme}
 *       to render dark slate ({@code #0f172a}) or crisp white ({@code #ffffff}) dialog surfaces.</li>
 *   <li><b>HTTP Status Error Mapping:</b> {@link #handleApiError} maps REST status codes (400, 401, 403, 404, 409, 422, 500)
 *       to contextual user-friendly titles and guidance.</li>
 *   <li><b>Accessibility Focus Assist:</b> {@link #showValidationError} automatically scrolls to and focuses
 *       the problematic input element upon dialog dismissal.</li>
 * </ul>
 */
@Injectable({
  providedIn: 'root'
})
export class NotificationService {

  constructor() {}

  /**
   * Enterprise Standard Top-Right Toast for Instant User Feedback
   * Reusable structure matching design spec:
   * - 32x32px circular solid badge with centered white icon
   * - 14px medium title (accent colored) + 13px regular subtitle (secondary gray) with 2px gap
   * - Top-right dismiss button (muted gray, hover state)
   * - 2px linear progress bar matching the accent color
   */
  /**
   * Enterprise Standard Top-Right Toast for Instant User Feedback
   * Ultra-premium Glassmorphic System:
   * - 38x38px squircle badge with gradient fill and ambient aura glow
   * - Inline vector SVGs (zero missing font glyphs)
   * - Status badge pill with live pulse dot
   * - 410px fixed width with responsive mobile adaptation
   * - Interactive: hovering pauses timer and elevates card
   */
  private showToast(
    icon: 'success' | 'info' | 'warning' | 'error',
    title: string,
    text: string = '',
    customIconHtml?: string
  ) {
    const iconSvgMap = {
      success: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`,
      error: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`,
      warning: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="8" x2="12" y2="13"></line><circle cx="12" cy="17" r="1.2" fill="#ffffff"></circle></svg>`,
      info: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="7" r="1.2" fill="#ffffff"></circle><line x1="12" y1="11" x2="12" y2="17"></line></svg>`
    };

    const closeBtnSvg = `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;

    const htmlContent = `
      <div class="futane-toast-body-wrapper">
        <div class="futane-toast-heading">${title}</div>
        ${text ? `<div class="futane-toast-message">${text}</div>` : ''}
      </div>
    `;

    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: icon,
      iconHtml: customIconHtml || iconSvgMap[icon] || iconSvgMap.info,
      html: htmlContent,
      showConfirmButton: false,
      showCloseButton: true,
      closeButtonHtml: closeBtnSvg,
      timer: 3800,
      timerProgressBar: true,
      didOpen: (toast) => {
        toast.onmouseenter = Swal.stopTimer;
        toast.onmouseleave = Swal.resumeTimer;
      },
      customClass: {
        container: 'futane-toast-container-top',
        popup: `futane-toast-popup futane-toast-${icon}`,
        htmlContainer: 'futane-toast-html-container',
        timerProgressBar: `futane-toast-progress futane-toast-progress-${icon}`,
        closeButton: 'futane-toast-close',
        icon: `futane-toast-icon-wrapper futane-toast-icon-${icon}`
      },
      showClass: {
        popup: 'futane-toast-animate-in swal2-show'
      },
      hideClass: {
        popup: 'futane-toast-animate-out swal2-hide'
      }
    });
  }

  /**
   * Executive Telemetry Notification Spec
   * Title: "Executive telemetry refreshed"
   * Subtitle: "Latest records pulled from server just now."
   */
  showExecutiveTelemetryRefreshed() {
    this.success('Executive telemetry refreshed', 'Latest records pulled from server just now.');
  }

  /**
   * Backward-compatible & Enterprise Standard Methods
   */
  success(title: string, text: string = '', customIconHtml?: string) {
    this.showToast('success', title, text, customIconHtml);
  }

  error(title: string, text: string = '') {
    this.showToast('error', title, text);
  }

  warning(title: string, text: string = '') {
    this.showToast('warning', title, text);
  }

  info(title: string, text: string = '') {
    this.showToast('info', title, text);
  }

  confirmAction(title: string, text: string, confirmBtnText: string = 'Yes, Delete'): Promise<boolean> {
    const isDark = document.body.classList.contains('dark-theme');
    return Swal.fire({
      title: title,
      text: text,
      icon: 'warning',
      showCancelButton: true,
      showCloseButton: true,
      background: isDark ? '#0f172a' : '#ffffff',
      color: isDark ? '#f8fafc' : '#0f172a',
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: confirmBtnText,
      cancelButtonText: 'Cancel',
      customClass: {
        popup: 'futane-dialog-popup',
        title: 'futane-dialog-title',
        htmlContainer: 'futane-dialog-text',
        confirmButton: 'futane-dialog-confirm-btn',
        cancelButton: 'futane-dialog-cancel-btn'
      }
    }).then(res => res.isConfirmed);
  }

  showSuccess(message: string = 'Operation completed.') {
    this.success('Action completed', message);
  }

  showInfo(titleOrMessage: string = '', subtitle?: string) {
    if (subtitle !== undefined) {
      this.info(titleOrMessage, subtitle);
    } else {
      this.info('Information', titleOrMessage);
    }
  }

  showSaveSuccess(message: string = 'Record added to database.') {
    this.success('Record saved', message);
  }

  showUpdateSuccess(message: string = 'Changes saved to database.') {
    this.success('Record updated', message);
  }

  async showDeleteConfirm(title: string = 'Delete record?', text: string = 'This action cannot be undone.'): Promise<boolean> {
    return this.confirmAction(title, text, 'Yes, Delete');
  }

  showDeleteSuccess(message: string = 'Record removed from database.') {
    this.success('Record deleted', message);
  }

  showValidationError(message: string, focusElementId?: string) {
    const isDark = document.body.classList.contains('dark-theme');
    Swal.fire({
      icon: 'warning',
      title: 'Validation error',
      text: message,
      confirmButtonColor: '#f59e0b',
      confirmButtonText: 'Fix issue',
      showCloseButton: true,
      background: isDark ? '#0f172a' : '#ffffff',
      color: isDark ? '#f8fafc' : '#0f172a',
      customClass: {
        popup: 'futane-dialog-popup',
        title: 'futane-dialog-title',
        htmlContainer: 'futane-dialog-text',
        confirmButton: 'futane-dialog-confirm-btn'
      }
    }).then(() => {
      if (focusElementId) {
        const el = document.getElementById(focusElementId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.focus();
        }
      }
    });
  }

  showWarning(title: string, message: string = '') {
    this.warning(title, message);
  }

  showError(title: string, message: string = '') {
    this.error(title, message);
  }

  handleApiError(error: any) {
    const status = error?.status;
    let title = 'Error';
    let message = error?.error?.message || error?.message || 'An unexpected error occurred.';

    if (status === 400) { title = 'Bad request'; }
    else if (status === 401) { title = 'Unauthorized'; message = 'Session expired. Please log in again.'; }
    else if (status === 403) { title = 'Access denied'; message = 'You do not have permission to perform this action.'; }
    else if (status === 404) { title = 'Not found'; message = 'The requested resource was not found.'; }
    else if (status === 409) { title = 'Conflict'; message = 'A duplicate record already exists.'; }
    else if (status === 422) { title = 'Validation failed'; }
    else if (status >= 500) { title = 'Server error'; message = 'Server is currently unavailable. Please try again later.'; }

    this.error(title, message);
  }

  showLoading(title: string = 'Processing...', message: string = 'Please wait...') {
    const isDark = document.body.classList.contains('dark-theme');
    Swal.fire({
      title: title,
      text: message,
      allowOutsideClick: false,
      allowEscapeKey: false,
      background: isDark ? '#0f172a' : '#ffffff',
      color: isDark ? '#f8fafc' : '#0f172a',
      customClass: {
        popup: 'futane-dialog-popup',
        title: 'futane-dialog-title',
        htmlContainer: 'futane-dialog-text'
      },
      didOpen: () => {
        Swal.showLoading();
      }
    });
  }

  hideLoading() {
    Swal.close();
  }

  showSessionExpired(onLogin: () => void) {
    const isDark = document.body.classList.contains('dark-theme');
    Swal.fire({
      icon: 'warning',
      title: 'Session expired',
      text: 'Your session has expired due to inactivity. Please log in again.',
      confirmButtonText: 'Login again',
      confirmButtonColor: '#d97706',
      showCloseButton: true,
      allowOutsideClick: false,
      background: isDark ? '#0f172a' : '#ffffff',
      color: isDark ? '#f8fafc' : '#0f172a',
      customClass: {
        popup: 'futane-dialog-popup',
        title: 'futane-dialog-title',
        htmlContainer: 'futane-dialog-text',
        confirmButton: 'futane-dialog-confirm-btn'
      }
    }).then(() => {
      onLogin();
    });
  }

  showExportStart(type: string = 'Export') {
    this.info(`${type} started`, 'Generating document, please wait...');
  }

  showExportSuccess(type: string = 'Export') {
    this.success(`${type} completed`, 'File generated and downloaded to device.');
  }

  showExportFailed(type: string = 'Export', errorMsg: string = '') {
    this.error(`${type} failed`, errorMsg || 'Could not complete export request.');
  }

  showNoRecordsFound(message: string = 'No records found.') {
    this.info('No data', message);
  }

  showDataRefreshed(moduleName: string = 'Data', count?: number) {
    if (!moduleName || moduleName.toLowerCase().includes('telemetry') || moduleName.toLowerCase().includes('executive')) {
      this.showExecutiveTelemetryRefreshed();
      return;
    }
    const text = count !== undefined ? `${count} records synchronized.` : 'Latest records pulled from server just now.';
    this.success(`${moduleName} refreshed`, text);
  }
}
