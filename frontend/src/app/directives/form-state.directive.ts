import { Directive, Input, OnInit, OnDestroy, HostListener } from '@angular/core';
import { FormGroupDirective } from '@angular/forms';
import { Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { NotificationService } from '../services/notification.service';

/**
 * Reactive Form Auto-Save & Recovery Directive (`appFormState`).
 *
 * Capabilities:
 * - Debounces form value changes (1000ms) and saves drafts to `sessionStorage` under `form_state_${formName}`.
 * - Automatically restores unsaved draft values upon component recreation if an operator accidentally navigates away.
 * - Automatically purges cached draft upon valid form submission (`@HostListener('submit')`).
 */
@Directive({
  selector: '[appFormState]',
  standalone: true
})
export class FormStateDirective implements OnInit, OnDestroy {
  @Input('appFormState') formName!: string;
  private valueChangesSub!: Subscription;
  private isSubmitted = false;

  constructor(
    private formGroupDirective: FormGroupDirective,
    private notificationService: NotificationService
  ) {}

  ngOnInit() {
    if (!this.formName) {
      console.warn('appFormState requires a unique form name');
      return;
    }

    const savedState = sessionStorage.getItem(`form_state_${this.formName}`);
    if (savedState) {
      try {
        const parsedState = JSON.parse(savedState);
        // Only patch if we have a valid object and the form exists
        if (parsedState && this.formGroupDirective.form) {
          // Use setTimeout to ensure form is fully initialized
          setTimeout(() => {
            this.formGroupDirective.form.patchValue(parsedState, { emitEvent: false });
            this.notificationService.info('Restored', 'Unsaved changes were restored.');
          });
        }
      } catch (e) {
        console.error('Failed to parse saved form state', e);
      }
    }

    // Auto-save form values on change
    this.valueChangesSub = this.formGroupDirective.form.valueChanges
      .pipe(debounceTime(1000))
      .subscribe(values => {
        sessionStorage.setItem(`form_state_${this.formName}`, JSON.stringify(values));
      });
  }

  @HostListener('submit')
  onSubmit() {
    this.isSubmitted = true;
    this.clearState();
  }

  ngOnDestroy() {
    if (this.valueChangesSub) {
      this.valueChangesSub.unsubscribe();
    }
    // If the component is destroyed without submitting, the state remains in sessionStorage
    // It will be restored when they come back.
  }

  public clearState() {
    sessionStorage.removeItem(`form_state_${this.formName}`);
  }
}
