import { Injectable } from '@angular/core';
import Swal from 'sweetalert2';

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
  private showToast(
    icon: 'success' | 'info' | 'warning' | 'error',
    title: string,
    text: string = '',
    customIconHtml?: string
  ) {
    const iconHtmlMap = {
      success: '<i class="bi bi-check-lg"></i>',
      error: '<i class="bi bi-x-lg"></i>',
      warning: '<i class="bi bi-exclamation-lg"></i>',
      info: '<i class="bi bi-info-lg"></i>'
    };

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
      iconHtml: customIconHtml || iconHtmlMap[icon] || iconHtmlMap.info,
      html: htmlContent,
      showConfirmButton: false,
      showCloseButton: true,
      timer: 4000,
      timerProgressBar: true,
      customClass: {
        container: 'futane-toast-container-top',
        popup: `futane-toast-popup futane-toast-${icon}`,
        htmlContainer: 'futane-toast-html-container',
        timerProgressBar: `futane-toast-progress futane-toast-progress-${icon}`,
        closeButton: 'futane-toast-close',
        icon: `futane-toast-icon-wrapper futane-toast-icon-${icon}`
      },
      showClass: {
        popup: 'swal2-toast-show'
      },
      hideClass: {
        popup: 'swal2-toast-hide'
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

  showInfo(message: string = '') {
    this.info('Information', message);
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
