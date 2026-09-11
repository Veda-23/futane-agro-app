import { Directive, ElementRef, HostListener, Input, Renderer2 } from '@angular/core';

@Directive({
  selector: '[appTilt3d]',
  standalone: true
})
export class Tilt3dDirective {
  @Input() maxTilt: number = 10;
  @Input() perspective: number = 1000;
  @Input() scale: number = 1.02;

  private isHovered = false;

  constructor(private el: ElementRef, private renderer: Renderer2) {
    this.renderer.setStyle(this.el.nativeElement, 'transition', 'transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.25s ease');
    this.renderer.setStyle(this.el.nativeElement, 'transform-style', 'preserve-3d');
  }

  @HostListener('mouseenter')
  onMouseEnter() {
    this.isHovered = true;
  }

  @HostListener('mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    if (!this.isHovered) return;
    const rect = this.el.nativeElement.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const rotateX = ((y - centerY) / centerY) * -this.maxTilt;
    const rotateY = ((x - centerX) / centerX) * this.maxTilt;

    this.renderer.setStyle(
      this.el.nativeElement,
      'transform',
      `perspective(${this.perspective}px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale3d(${this.scale}, ${this.scale}, ${this.scale})`
    );
  }

  @HostListener('mouseleave')
  onMouseLeave() {
    this.isHovered = false;
    this.renderer.setStyle(
      this.el.nativeElement,
      'transform',
      `perspective(${this.perspective}px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`
    );
  }
}
