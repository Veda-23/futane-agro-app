import { Directive, ElementRef, HostListener } from '@angular/core';

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
