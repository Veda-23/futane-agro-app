import { Injectable } from '@angular/core';
import Swal from 'sweetalert2';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {

  constructor() {}

  /**
   * Backward-compatible & Enterprise Standard Methods
   */
  success(title: string, text: string = '') {
    Swal.fire({
      icon: 'success',
      title: title,
      text: text,
      timer: 2000,
      showConfirmButton: false,
      timerProgressBar: true
    });
  }

  error(title: string, text: string = '') {
    Swal.fire({
      icon: 'error',
      title: title,
      text: text,
      confirmButtonColor: '#d33',
      confirmButtonText: 'OK'
    });
  }

  warning(title: string, text: string = '') {
    Swal.fire({
      icon: 'warning',
      title: title,
      text: text,
      confirmButtonColor: '#f39c12',
      confirmButtonText: 'OK'
    });
  }

  info(title: string, text: string = '') {
    Swal.fire({
      icon: 'info',
      title: title,
      text: text,
      timer: 2000,
      showConfirmButton: false,
      timerProgressBar: true
    });
  }

  confirmAction(title: string, text: string, confirmBtnText: string = 'Yes, Delete'): Promise<boolean> {
    return Swal.fire({
      title: title,
      text: text,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6e7881',
      confirmButtonText: confirmBtnText,
      cancelButtonText: 'Cancel'
    }).then(res => res.isConfirmed);
  }

  /**
   * Specialized Enterprise Methods
   */
  showSaveSuccess(message: string = 'Record added successfully.') {
    this.success('Success', message);
  }

  showUpdateSuccess(message: string = 'Record updated successfully.') {
    this.success('Success', message);
  }

  async showDeleteConfirm(title: string = 'Delete Record?', text: string = 'This action cannot be undone.'): Promise<boolean> {
    return this.confirmAction(title, text, 'Yes, Delete');
  }

  showDeleteSuccess(message: string = 'Record deleted successfully.') {
    this.success('Deleted!', message);
  }

  showValidationError(message: string, focusElementId?: string) {
    Swal.fire({
      icon: 'warning',
      title: 'Validation Error',
      text: message,
      confirmButtonColor: '#f39c12',
      confirmButtonText: 'Fix Issue'
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
    Swal.fire({
      title: title,
      text: message,
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });
  }

  hideLoading() {
    Swal.close();
  }

  showSessionExpired(onLogin: () => void) {
    Swal.fire({
      icon: 'warning',
      title: 'Session Expired',
      text: 'Your session has expired due to inactivity. Please log in again.',
      confirmButtonText: 'Login Again',
      confirmButtonColor: '#3085d6',
      allowOutsideClick: false
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
}
