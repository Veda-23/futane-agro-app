import { Injectable, ElementRef } from '@angular/core';
import { FormGroup, AbstractControl } from '@angular/forms';
import { NotificationService } from './notification.service';

@Injectable({
  providedIn: 'root'
})
export class FormValidationService {

  constructor(private notification: NotificationService) { }

  /**
   * Validates a form group, marks all fields as touched to trigger UI error states,
   * focuses the first invalid element, and shows an error notification if invalid.
   * @param form The FormGroup to validate
   * @param el The ElementRef of the component (to find the DOM elements)
   * @param customErrorMsg Optional custom error message
   * @returns true if valid, false if invalid
   */
  validateForm(form: FormGroup, el: ElementRef, customErrorMsg?: string): boolean {
    if (form.valid) {
      return true;
    }

    // Mark all as touched to trigger red borders and inline messages
    this.markAllAsTouched(form);

    // Show animated error popup
    this.notification.error(
      'Validation Error', 
      customErrorMsg || 'Please correct the highlighted fields before submitting.'
    );

    // Focus the first invalid field
    this.focusFirstInvalidField(form, el);

    return false;
  }

  private markAllAsTouched(control: AbstractControl) {
    if (control.hasOwnProperty('controls')) {
      const group = control as FormGroup;
      Object.keys(group.controls).forEach(key => {
        this.markAllAsTouched(group.controls[key]);
      });
    }
    control.markAsTouched({ onlySelf: true });
    control.markAsDirty({ onlySelf: true });
  }

  private focusFirstInvalidField(form: FormGroup, el: ElementRef) {
    // Small timeout to allow Angular to render the .ng-invalid classes
    setTimeout(() => {
      const invalidElements = el.nativeElement.querySelectorAll('.ng-invalid');
      if (invalidElements && invalidElements.length > 0) {
        // Find the first input, select, or textarea that is invalid
        for (let i = 0; i < invalidElements.length; i++) {
          const elem = invalidElements[i];
          if (elem.tagName === 'INPUT' || elem.tagName === 'SELECT' || elem.tagName === 'TEXTAREA' || elem.tagName === 'MAT-SELECT') {
            elem.focus();
            break;
          }
        }
      }
    }, 100);
  }
}
