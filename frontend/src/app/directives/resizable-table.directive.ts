import { Directive, ElementRef, Renderer2, OnInit, AfterViewInit, OnDestroy, Input } from '@angular/core';

@Directive({
  selector: '[appResizableTable]',
  standalone: true
})
export class ResizableTableDirective implements OnInit, AfterViewInit, OnDestroy {
  @Input() tableId: string = 'futane_table';

  private startX: number = 0;
  private startWidth: number = 0;
  private currentTh: HTMLElement | null = null;
  private isResizing: boolean = false;
  private unlistenMouseMove: (() => void) | null = null;
  private unlistenMouseUp: (() => void) | null = null;
  private mutationObserver: MutationObserver | null = null;

  constructor(private el: ElementRef, private renderer: Renderer2) {}

  ngOnInit() {
    setTimeout(() => this.setupResizableHeaders(), 150);
  }

  ngAfterViewInit() {
    setTimeout(() => this.setupResizableHeaders(), 300);
  }

  ngOnDestroy() {
    if (this.unlistenMouseMove) this.unlistenMouseMove();
    if (this.unlistenMouseUp) this.unlistenMouseUp();
  }

  private setupResizableHeaders() {
    const table = this.el.nativeElement as HTMLTableElement;
    if (!table) return;

    // Load saved widths from localStorage
    const savedWidths = this.getSavedWidths();

    const headers = table.querySelectorAll('th');
    headers.forEach((th: HTMLElement, index: number) => {
      // Always re-apply saved width (even if handle already exists) so widths
      // survive DOM re-renders triggered by sort / filter / pagination.
      if (savedWidths[index]) {
        this.renderer.setStyle(th, 'width', `${savedWidths[index]}px`);
        this.renderer.setStyle(th, 'minWidth', `${savedWidths[index]}px`);
      }

      // Avoid adding multiple handles — but width restore above still runs
      if (th.querySelector('.column-resizer-handle')) return;

      this.renderer.setStyle(th, 'position', 'relative');

      const resizer = this.renderer.createElement('div');
      this.renderer.addClass(resizer, 'column-resizer-handle');
      this.renderer.setStyle(resizer, 'position', 'absolute');
      this.renderer.setStyle(resizer, 'right', '0');
      this.renderer.setStyle(resizer, 'top', '0');
      this.renderer.setStyle(resizer, 'bottom', '0');
      this.renderer.setStyle(resizer, 'width', '8px');
      this.renderer.setStyle(resizer, 'cursor', 'col-resize');
      this.renderer.setStyle(resizer, 'user-select', 'none');
      this.renderer.setStyle(resizer, 'z-index', '20');

      this.renderer.listen(resizer, 'mousedown', (event: MouseEvent) => {
        event.preventDefault();
        event.stopPropagation();
        this.onResizeStart(event, th, index);
      });

      this.renderer.appendChild(th, resizer);
    });
  }

  private onResizeStart(event: MouseEvent, th: HTMLElement, colIndex: number) {
    this.isResizing = true;
    this.currentTh = th;
    this.startX = event.pageX;
    this.startWidth = th.offsetWidth;

    this.renderer.addClass(document.body, 'resizing-column-active');

    this.unlistenMouseMove = this.renderer.listen('document', 'mousemove', (e: MouseEvent) => {
      if (!this.isResizing || !this.currentTh) return;
      const diff = e.pageX - this.startX;
      const newWidth = Math.max(60, this.startWidth + diff);
      this.renderer.setStyle(this.currentTh, 'width', `${newWidth}px`);
      this.renderer.setStyle(this.currentTh, 'min-width', `${newWidth}px`);
    });

    this.unlistenMouseUp = this.renderer.listen('document', 'mouseup', () => {
      if (this.isResizing && this.currentTh) {
        this.isResizing = false;
        this.saveColumnWidth(colIndex, this.currentTh.offsetWidth);
        this.renderer.removeClass(document.body, 'resizing-column-active');
        if (this.unlistenMouseMove) {
          this.unlistenMouseMove();
          this.unlistenMouseMove = null;
        }
        if (this.unlistenMouseUp) {
          this.unlistenMouseUp();
          this.unlistenMouseUp = null;
        }
      }
    });
  }

  private getSavedWidths(): { [key: number]: number } {
    try {
      const data = localStorage.getItem(`cols_width_${this.tableId}`);
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  }

  private saveColumnWidth(index: number, width: number) {
    try {
      const widths = this.getSavedWidths();
      widths[index] = width;
      localStorage.setItem(`cols_width_${this.tableId}`, JSON.stringify(widths));
    } catch (e) {
      console.warn('Failed to save column width', e);
    }
  }
}
