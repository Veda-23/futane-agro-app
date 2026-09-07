import { Injectable } from '@angular/core';
import Swal from 'sweetalert2';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {

  constructor() {}

  /**
   * Enterprise Standard Top-Right Toast for Instant User Feedback
   * Glassmorphic, non-intrusive, positioned gracefully at top-right below the header.
   */
  private showToast(icon: 'success' | 'info' | 'warning' | 'error', title: string, text: string = '') {
    const isDark = document.body.classList.contains('dark-theme');
    const iconHtmlMap = {
      success: '<i class="bi bi-check-circle-fill"></i>',
      error: '<i class="bi bi-x-circle-fill"></i>',
      warning: '<i class="bi bi-exclamation-triangle-fill"></i>',
      info: '<i class="bi bi-info-circle-fill"></i>'
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
      iconHtml: iconHtmlMap[icon] || iconHtmlMap.info,
      html: htmlContent,
      showConfirmButton: false,
      showCloseButton: true,
      timer: 4000,
      timerProgressBar: true,
      background: isDark ? 'rgba(15, 23, 42, 0.96)' : 'rgba(255, 255, 255, 0.98)',
      color: isDark ? '#f8fafc' : '#0f172a',
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
   * Backward-compatible & Enterprise Standard Methods
   */
  success(title: string, text: string = '') {
    this.showToast('success', title, text);
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

  showSuccess(message: string = 'Operation completed successfully.') {
    this.success('Success', message);
  }

  showInfo(message: string = '') {
    this.info('Information', message);
  }

  showSaveSuccess(message: string = 'Record added successfully.') {
    this.success('Saved Successfully', message);
  }

  showUpdateSuccess(message: string = 'Record updated successfully.') {
    this.success('Updated Successfully', message);
  }

  async showDeleteConfirm(title: string = 'Delete Record?', text: string = 'This action cannot be undone.'): Promise<boolean> {
    return this.confirmAction(title, text, 'Yes, Delete');
  }

  showDeleteSuccess(message: string = 'Record deleted successfully.') {
    this.success('Deleted', message);
  }

  showValidationError(message: string, focusElementId?: string) {
    const isDark = document.body.classList.contains('dark-theme');
    Swal.fire({
      icon: 'warning',
      title: 'Validation Error',
      text: message,
      confirmButtonColor: '#f59e0b',
      confirmButtonText: 'Fix Issue',
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

    if (status === 400) { title = 'Bad Request'; }
    else if (status === 401) { title = 'Unauthorized'; message = 'Session expired. Please log in again.'; }
    else if (status === 403) { title = 'Access Denied'; message = 'You do not have permission to perform this action.'; }
    else if (status === 404) { title = 'Not Found'; message = 'The requested resource was not found.'; }
    else if (status === 409) { title = 'Conflict'; message = 'A duplicate record already exists.'; }
    else if (status === 422) { title = 'Validation Failed'; }
    else if (status >= 500) { title = 'Server Error'; message = 'Server is currently unavailable. Please try again later.'; }

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
      title: 'Session Expired',
      text: 'Your session has expired due to inactivity. Please log in again.',
      confirmButtonText: 'Login Again',
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
    this.info(`${type} Started`, 'Generating document, please wait...');
  }

  showExportSuccess(type: string = 'Export') {
    this.success(`${type} Completed`, 'File generated and downloaded successfully.');
  }

  showExportFailed(type: string = 'Export', errorMsg: string = '') {
    this.error(`${type} Failed`, errorMsg || 'Could not complete export request.');
  }

  showNoRecordsFound(message: string = 'No Records Found') {
    this.info('No Data', message);
  }

  showDataRefreshed(moduleName: string = 'Data', count?: number) {
    const text = count !== undefined ? `${count} records synchronized.` : 'Latest records refreshed from server.';
    this.success(`${moduleName} Refreshed`, text);
  }
}
