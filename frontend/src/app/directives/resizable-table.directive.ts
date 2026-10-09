import { 
  Directive, 
  ElementRef, 
  Renderer2, 
  OnInit, 
  AfterViewInit, 
  OnDestroy, 
  Input, 
  RendererStyleFlags2,
  NgZone 
} from '@angular/core';

export interface ColumnPreset {
  label: string;
  width: number;
}

@Directive({
  selector: '[appResizableTable]',
  standalone: true
})
export class ResizableTableDirective implements OnInit, AfterViewInit, OnDestroy {
  @Input() tableId: string = 'futane_table';

  private startX: number = 0;
  private startWidth: number = 0;
  private currentTh: HTMLElement | null = null;
  private currentResizer: HTMLElement | null = null;
  private isResizing: boolean = false;
  private unlistenMouseMove: (() => void) | null = null;
  private unlistenMouseUp: (() => void) | null = null;
  private mutationObserver: MutationObserver | null = null;
  private debounceTimer: any = null;
  private scrollContainer: HTMLElement | null = null;

  // Futuristic Live Resizing HUD elements
  private liveHudElement: HTMLElement | null = null;
  private guideBeamElement: HTMLElement | null = null;
  private contextMenuElement: HTMLElement | null = null;
  private autoScrollInterval: any = null;

  constructor(
    private el: ElementRef, 
    private renderer: Renderer2,
    private ngZone: NgZone
  ) {}

  ngOnInit() {
    this.scheduleSetup();
  }

  ngAfterViewInit() {
    if (this.el.nativeElement) {
      this.renderer.setAttribute(this.el.nativeElement, 'data-table-id', this.tableId || 'default_table');
      this.findScrollContainer();
    }
    this.scheduleSetup();
    this.initMutationObserver();
  }

  ngOnDestroy() {
    this.cleanupActiveDrag();
    this.removeContextMenu();
    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
      this.mutationObserver = null;
    }
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    if (this.autoScrollInterval) clearInterval(this.autoScrollInterval);
  }

  private findScrollContainer() {
    let parent = (this.el.nativeElement as HTMLElement).parentElement;
    while (parent) {
      const overflowX = window.getComputedStyle(parent).overflowX;
      if (overflowX === 'auto' || overflowX === 'scroll' || parent.classList.contains('table-container') || parent.classList.contains('table-responsive')) {
        this.scrollContainer = parent;
        break;
      }
      parent = parent.parentElement;
    }
    if (!this.scrollContainer && this.el.nativeElement.parentElement) {
      this.scrollContainer = this.el.nativeElement.parentElement;
    }
  }

  private scheduleSetup() {
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    this.ngZone.runOutsideAngular(() => {
      this.debounceTimer = setTimeout(() => this.setupResizableHeaders(), 150);
    });
  }

  private initMutationObserver() {
    const table = this.el.nativeElement as HTMLTableElement;
    if (!table || typeof MutationObserver === 'undefined') return;

    this.ngZone.runOutsideAngular(() => {
      this.mutationObserver = new MutationObserver((mutations) => {
        let shouldRefresh = false;
        for (const m of mutations) {
          if (m.type === 'childList') {
            shouldRefresh = true;
            break;
          }
        }
        if (shouldRefresh) {
          this.scheduleSetup();
        }
      });

      this.mutationObserver.observe(table, { childList: true, subtree: true });
    });
  }

  private setupResizableHeaders() {
    const table = this.el.nativeElement as HTMLTableElement;
    if (!table) return;

    this.findScrollContainer();

    // Load saved widths from localStorage
    const savedWidths = this.getSavedWidths();
    const hasCustomWidths = Object.keys(savedWidths).length > 0;

    if (hasCustomWidths) {
      this.renderer.setStyle(table, 'width', 'max-content', RendererStyleFlags2.Important);
    } else {
      this.renderer.setStyle(table, 'width', '100%', RendererStyleFlags2.Important);
    }
    this.renderer.setStyle(table, 'min-width', '100%', RendererStyleFlags2.Important);

    if (this.scrollContainer) {
      this.renderer.setStyle(this.scrollContainer, 'overflow-x', 'auto', RendererStyleFlags2.Important);
    }

    const headers = table.querySelectorAll('th');
    headers.forEach((th: HTMLElement, index: number) => {
      // Re-apply saved width so widths survive DOM re-renders
      if (savedWidths[index]) {
        this.renderer.setStyle(th, 'width', `${savedWidths[index]}px`, RendererStyleFlags2.Important);
        this.renderer.setStyle(th, 'min-width', `${savedWidths[index]}px`, RendererStyleFlags2.Important);
      }

      // Checkbox column check
      const isCheckboxCol = th.classList.contains('col-th-checkbox') || 
                            th.classList.contains('th-checkbox') || 
                            th.classList.contains('col-checkbox') ||
                            th.querySelector('input[type="checkbox"]');
      if (isCheckboxCol) {
        return;
      }

      // Avoid duplicate handles
      if (th.querySelector('.column-resizer-handle')) return;

      this.renderer.setStyle(th, 'position', 'relative');

      // 1. Sleek Action Menu Trigger (Mini Dots on Header Hover)
      const actionTrigger = this.renderer.createElement('button');
      this.renderer.addClass(actionTrigger, 'column-header-action-trigger');
      this.renderer.setAttribute(actionTrigger, 'type', 'button');
      this.renderer.setAttribute(actionTrigger, 'title', 'Column Options (Auto-fit, presets, reset)');
      actionTrigger.innerHTML = '<i class="bi bi-three-dots-vertical"></i>';
      this.renderer.listen(actionTrigger, 'click', (e: MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        this.openColumnMenu(e, th, index);
      });
      this.renderer.appendChild(th, actionTrigger);

      // Context menu on right click as well
      this.renderer.listen(th, 'contextmenu', (e: MouseEvent) => {
        e.preventDefault();
        this.openColumnMenu(e, th, index);
      });

      // 2. Futuristic Resizer Handle
      const resizer = this.renderer.createElement('div');
      this.renderer.addClass(resizer, 'column-resizer-handle');
      this.renderer.setAttribute(resizer, 'title', 'Drag to resize • Double-click to auto-fit');

      // Mousedown to initiate drag
      this.renderer.listen(resizer, 'mousedown', (event: MouseEvent) => {
        event.preventDefault();
        event.stopPropagation();
        this.onResizeStart(event, th, resizer, index);
      });

      // Double-click for Smart Auto-Fit
      this.renderer.listen(resizer, 'dblclick', (event: MouseEvent) => {
        event.preventDefault();
        event.stopPropagation();
        this.smartAutoFitColumn(th, index);
      });

      this.renderer.appendChild(th, resizer);
    });
  }

  // =========================================================================
  // SMART AUTO-FIT TO CONTENT CALCULATION
  // =========================================================================
  private smartAutoFitColumn(th: HTMLElement, colIndex: number) {
    const table = this.el.nativeElement as HTMLTableElement;
    if (!table) return;

    // Measure header width
    const thText = th.innerText.trim();
    let maxWidth = Math.max(80, thText.length * 8.5 + 48);

    // Measure table body cell contents in this column
    const rows = table.querySelectorAll('tbody tr');
    let sampleLimit = Math.min(rows.length, 30); // Sample up to 30 rows for instant performance

    for (let r = 0; r < sampleLimit; r++) {
      const cell = rows[r].children[colIndex] as HTMLElement;
      if (cell) {
        const textLen = cell.innerText.trim().length;
        const estimatedCellWidth = textLen * 8.2 + 36;
        if (estimatedCellWidth > maxWidth) {
          maxWidth = estimatedCellWidth;
        }
      }
    }

    // Floor and Ceiling bounds
    const idealWidth = Math.min(650, Math.max(75, Math.round(maxWidth)));

    // Check if column is already around ideal width (toggle reset)
    const currentW = th.offsetWidth;
    if (Math.abs(currentW - idealWidth) < 10) {
      this.resetColumnWidth(th, colIndex);
      this.showFuturisticToast(`Column reset to default auto-layout`, 'info');
      return;
    }

    // Apply auto-fit width
    this.renderer.setStyle(table, 'width', 'max-content', RendererStyleFlags2.Important);
    this.renderer.setStyle(th, 'width', `${idealWidth}px`, RendererStyleFlags2.Important);
    this.renderer.setStyle(th, 'min-width', `${idealWidth}px`, RendererStyleFlags2.Important);
    this.saveColumnWidth(colIndex, idealWidth);

    this.showFuturisticToast(`⚡ Auto-fitted: ${idealWidth}px`, 'success');
  }

  // =========================================================================
  // FUTURISTIC LIVE RESIZING HUD & NEON BEAM
  // =========================================================================
  private onResizeStart(event: MouseEvent, th: HTMLElement, resizer: HTMLElement, colIndex: number) {
    this.isResizing = true;
    this.currentTh = th;
    this.currentResizer = resizer;
    this.startX = event.pageX;
    this.startWidth = th.offsetWidth;

    const table = this.el.nativeElement as HTMLTableElement;
    const colName = th.innerText.trim().replace(/\s+/g, ' ');

    this.renderer.addClass(document.body, 'resizing-column-active');
    this.renderer.addClass(th, 'col-resizing-active');
    this.renderer.addClass(resizer, 'resizing-active');

    if (table) {
      this.renderer.setStyle(table, 'width', 'max-content', RendererStyleFlags2.Important);
    }

    // Create Futuristic Live HUD Tooltip
    this.createLiveHud(event.pageX, event.pageY, colName, this.startWidth);

    // Create Futuristic Full-Height Neon Guide Beam
    this.createGuideBeam(th);

    // Listen to mouse movement and up outside Angular zone for max FPS
    this.ngZone.runOutsideAngular(() => {
      this.unlistenMouseMove = this.renderer.listen('document', 'mousemove', (e: MouseEvent) => {
        if (!this.isResizing || !this.currentTh) return;

        const diff = e.pageX - this.startX;
        const newWidth = Math.max(65, this.startWidth + diff);

        this.renderer.setStyle(this.currentTh, 'width', `${newWidth}px`, RendererStyleFlags2.Important);
        this.renderer.setStyle(this.currentTh, 'min-width', `${newWidth}px`, RendererStyleFlags2.Important);

        // Update Live HUD
        this.updateLiveHud(e.pageX, e.pageY, newWidth, diff);

        // Update Guide Beam position
        this.updateGuideBeam();

        // Handle Container Edge Auto-Scroll
        this.handleEdgeAutoScroll(e.clientX);
      });

      // Listen to mouse up
      this.unlistenMouseUp = this.renderer.listen('document', 'mouseup', () => {
        if (this.isResizing && this.currentTh) {
          const finalWidth = this.currentTh.offsetWidth;
          this.saveColumnWidth(colIndex, finalWidth);
          this.cleanupActiveDrag();
        }
      });
    });
  }

  private createLiveHud(x: number, y: number, colName: string, initialWidth: number) {
    this.removeLiveHud();

    this.liveHudElement = this.renderer.createElement('div');
    this.renderer.addClass(this.liveHudElement, 'cyber-resizer-hud');
    this.liveHudElement!.innerHTML = `
      <div class="hud-header">
        <span class="hud-icon"><i class="bi bi-arrows-expand-vertical"></i></span>
        <span class="hud-col-name">${colName}</span>
      </div>
      <div class="hud-body">
        <span class="hud-current-width">${initialWidth}px</span>
        <span class="hud-delta font-mono">0px</span>
        <span class="hud-status">⚡ LIVE PERSIST</span>
      </div>
    `;

    this.renderer.setStyle(this.liveHudElement, 'position', 'fixed');
    this.renderer.setStyle(this.liveHudElement, 'left', `${x + 16}px`);
    this.renderer.setStyle(this.liveHudElement, 'top', `${Math.max(20, y - 56)}px`);
    this.renderer.setStyle(this.liveHudElement, 'z-index', '99999');
    this.renderer.appendChild(document.body, this.liveHudElement);
  }

  private updateLiveHud(x: number, y: number, currentWidth: number, diff: number) {
    if (!this.liveHudElement) return;

    this.renderer.setStyle(this.liveHudElement, 'left', `${x + 18}px`);
    this.renderer.setStyle(this.liveHudElement, 'top', `${Math.max(20, y - 56)}px`);

    const widthElem = this.liveHudElement.querySelector('.hud-current-width');
    const deltaElem = this.liveHudElement.querySelector('.hud-delta');

    if (widthElem) widthElem.textContent = `${currentWidth}px`;
    if (deltaElem) {
      if (diff > 0) {
        deltaElem.textContent = `+${diff}px`;
        deltaElem.className = 'hud-delta font-mono text-emerald';
      } else if (diff < 0) {
        deltaElem.textContent = `${diff}px`;
        deltaElem.className = 'hud-delta font-mono text-amber';
      } else {
        deltaElem.textContent = `0px`;
        deltaElem.className = 'hud-delta font-mono';
      }
    }
  }

  private removeLiveHud() {
    if (this.liveHudElement) {
      this.liveHudElement.remove();
      this.liveHudElement = null;
    }
  }

  private createGuideBeam(th: HTMLElement) {
    this.removeGuideBeam();

    const table = this.el.nativeElement as HTMLElement;
    const tableRect = table.getBoundingClientRect();
    const thRect = th.getBoundingClientRect();

    this.guideBeamElement = this.renderer.createElement('div');
    this.renderer.addClass(this.guideBeamElement, 'cyber-guide-beam');

    this.renderer.setStyle(this.guideBeamElement, 'position', 'fixed');
    this.renderer.setStyle(this.guideBeamElement, 'top', `${tableRect.top}px`);
    this.renderer.setStyle(this.guideBeamElement, 'left', `${thRect.right}px`);
    this.renderer.setStyle(this.guideBeamElement, 'height', `${tableRect.height}px`);
    this.renderer.setStyle(this.guideBeamElement, 'z-index', '9999');
    this.renderer.appendChild(document.body, this.guideBeamElement);
  }

  private updateGuideBeam() {
    if (!this.guideBeamElement || !this.currentTh) return;
    const thRect = this.currentTh.getBoundingClientRect();
    this.renderer.setStyle(this.guideBeamElement, 'left', `${thRect.right}px`);
  }

  private removeGuideBeam() {
    if (this.guideBeamElement) {
      this.guideBeamElement.remove();
      this.guideBeamElement = null;
    }
  }

  private handleEdgeAutoScroll(clientX: number) {
    if (!this.scrollContainer) return;
    const rect = this.scrollContainer.getBoundingClientRect();
    const threshold = 50;

    if (clientX > rect.right - threshold) {
      // Scroll right
      this.scrollContainer.scrollLeft += 15;
    } else if (clientX < rect.left + threshold) {
      // Scroll left
      this.scrollContainer.scrollLeft -= 15;
    }
  }

  private cleanupActiveDrag() {
    this.isResizing = false;
    this.renderer.removeClass(document.body, 'resizing-column-active');
    if (this.currentTh) this.renderer.removeClass(this.currentTh, 'col-resizing-active');
    if (this.currentResizer) this.renderer.removeClass(this.currentResizer, 'resizing-active');

    this.removeLiveHud();
    this.removeGuideBeam();

    this.currentTh = null;
    this.currentResizer = null;

    if (this.unlistenMouseMove) {
      this.unlistenMouseMove();
      this.unlistenMouseMove = null;
    }
    if (this.unlistenMouseUp) {
      this.unlistenMouseUp();
      this.unlistenMouseUp = null;
    }
  }

  // =========================================================================
  // COLUMN OPTIONS GLASS CONTEXT MENU
  // =========================================================================
  private openColumnMenu(event: MouseEvent, th: HTMLElement, colIndex: number) {
    this.removeContextMenu();

    const colName = th.innerText.trim().replace(/\s+/g, ' ');
    const currentW = th.offsetWidth;

    this.contextMenuElement = this.renderer.createElement('div');
    this.renderer.addClass(this.contextMenuElement, 'cyber-column-menu');

    this.contextMenuElement!.innerHTML = `
      <div class="menu-header">
        <div class="menu-col-title"><i class="bi bi-layout-three-columns me-1"></i> ${colName}</div>
        <div class="menu-col-sub">Current: <strong>${currentW}px</strong></div>
      </div>
      <div class="menu-divider"></div>
      <button type="button" class="menu-item" data-action="autofit">
        <i class="bi bi-magic text-cobalt"></i>
        <span>Auto-Fit to Content</span>
      </button>
      <div class="menu-divider"></div>
      <div class="menu-subheading">PRESET SIZES</div>
      <div class="menu-presets-row">
        <button type="button" class="preset-btn" data-action="preset" data-val="100">Compact (100px)</button>
        <button type="button" class="preset-btn" data-action="preset" data-val="180">Standard (180px)</button>
        <button type="button" class="preset-btn" data-action="preset" data-val="280">Wide (280px)</button>
      </div>
      <div class="menu-divider"></div>
      <button type="button" class="menu-item" data-action="reset">
        <i class="bi bi-arrow-counterclockwise text-amber"></i>
        <span>Reset Column Width</span>
      </button>
      <button type="button" class="menu-item text-danger" data-action="reset-all">
        <i class="bi bi-trash3 text-crimson"></i>
        <span>Reset Entire Table</span>
      </button>
    `;

    // Position menu near cursor
    const x = Math.min(window.innerWidth - 260, Math.max(10, event.clientX - 20));
    const y = Math.min(window.innerHeight - 300, Math.max(10, event.clientY + 10));

    this.renderer.setStyle(this.contextMenuElement, 'position', 'fixed');
    this.renderer.setStyle(this.contextMenuElement, 'left', `${x}px`);
    this.renderer.setStyle(this.contextMenuElement, 'top', `${y}px`);
    this.renderer.setStyle(this.contextMenuElement, 'z-index', '999999');

    // Handle clicks inside menu
    this.contextMenuElement!.addEventListener('click', (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('button');
      if (!target) return;

      const action = target.getAttribute('data-action');
      if (action === 'autofit') {
        this.smartAutoFitColumn(th, colIndex);
      } else if (action === 'preset') {
        const val = parseInt(target.getAttribute('data-val') || '180', 10);
        this.setExplicitWidth(th, colIndex, val);
      } else if (action === 'reset') {
        this.resetColumnWidth(th, colIndex);
        this.showFuturisticToast('Column width restored to default', 'info');
      } else if (action === 'reset-all') {
        this.resetAllColumns();
        this.showFuturisticToast('All table columns reset to factory layout', 'info');
      }
      this.removeContextMenu();
    });

    // Close on outside click
    const closeListener = (docEvent: MouseEvent) => {
      if (this.contextMenuElement && !this.contextMenuElement.contains(docEvent.target as Node)) {
        this.removeContextMenu();
        document.removeEventListener('click', closeListener);
      }
    };
    setTimeout(() => document.addEventListener('click', closeListener), 10);

    this.renderer.appendChild(document.body, this.contextMenuElement);
  }

  private removeContextMenu() {
    if (this.contextMenuElement) {
      this.contextMenuElement.remove();
      this.contextMenuElement = null;
    }
  }

  private setExplicitWidth(th: HTMLElement, index: number, width: number) {
    const table = this.el.nativeElement as HTMLTableElement;
    if (table) {
      this.renderer.setStyle(table, 'width', 'max-content', RendererStyleFlags2.Important);
    }
    this.renderer.setStyle(th, 'width', `${width}px`, RendererStyleFlags2.Important);
    this.renderer.setStyle(th, 'min-width', `${width}px`, RendererStyleFlags2.Important);
    this.saveColumnWidth(index, width);
    this.showFuturisticToast(`Column set to ${width}px`, 'success');
  }

  private resetColumnWidth(th: HTMLElement, index: number) {
    this.renderer.removeStyle(th, 'width', RendererStyleFlags2.Important);
    this.renderer.removeStyle(th, 'min-width', RendererStyleFlags2.Important);
    try {
      const widths = this.getSavedWidths();
      delete widths[index];
      localStorage.setItem(`cols_width_${this.tableId}`, JSON.stringify(widths));
      if (Object.keys(widths).length === 0 && this.el.nativeElement) {
        this.renderer.setStyle(this.el.nativeElement, 'width', '100%', RendererStyleFlags2.Important);
      }
    } catch (e) {
      console.warn('Failed to reset column width', e);
    }
  }

  private resetAllColumns() {
    const table = this.el.nativeElement as HTMLTableElement;
    if (!table) return;

    const headers = table.querySelectorAll('th');
    headers.forEach((th: HTMLElement) => {
      this.renderer.removeStyle(th, 'width', RendererStyleFlags2.Important);
      this.renderer.removeStyle(th, 'min-width', RendererStyleFlags2.Important);
    });

    try {
      localStorage.removeItem(`cols_width_${this.tableId}`);
      this.renderer.setStyle(table, 'width', '100%', RendererStyleFlags2.Important);
    } catch (e) {
      console.warn('Failed to reset all columns', e);
    }
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

  // =========================================================================
  // FUTURISTIC TOAST HUD NOTIFICATION
  // =========================================================================
  private showFuturisticToast(message: string, type: 'success' | 'info' | 'warn' = 'info') {
    const existing = document.querySelector('.cyber-toast-notification');
    if (existing) existing.remove();

    const toast = this.renderer.createElement('div');
    this.renderer.addClass(toast, 'cyber-toast-notification');
    this.renderer.addClass(toast, `type-${type}`);

    const icon = type === 'success' ? 'bi-check2-circle' : (type === 'warn' ? 'bi-exclamation-triangle' : 'bi-info-circle');
    toast.innerHTML = `<i class="bi ${icon} me-2"></i> ${message}`;

    this.renderer.appendChild(document.body, toast);
    setTimeout(() => {
      toast.classList.add('hide');
      setTimeout(() => toast.remove(), 300);
    }, 2200);
  }
}
