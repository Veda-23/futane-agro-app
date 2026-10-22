import { Directive, ElementRef, HostListener } from '@angular/core';

/**
 * Auto-Select Input Text Directive (`appAutoSelect`).
 *
 * Automatically highlights/selects all text inside an `<input>` or `<textarea>` element upon receiving focus,
 * allowing factory operators to rapidly overwrite numeric rates, weights, and counts without manual backspacing.
 */
@Directive({
  selector: '[appAutoSelect]',
  standalone: true
})
export class AutoSelectDirective {

  constructor(private el: ElementRef) { }

  @HostListener('focus', ['$event'])
  onFocus(event: FocusEvent) {
    const target = this.el.nativeElement;
    // Delay selection slightly to ensure browser focus lifecycle completes
    setTimeout(() => {
      if (target && typeof target.select === 'function') {
        target.select();
      }
    }, 10);
  }
}
