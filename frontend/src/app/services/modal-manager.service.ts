import { Injectable, NgZone } from '@angular/core';

/**
 * Universal Modal, Drawer & Overlay Focus Manager.
 * <p>
 * Implements accessible, automated modal interaction management across the application:
 * <ul>
 *   <li><b>MutationObserver DOM Sentinel:</b> Watches {@code document.body} outside Angular's zone for modal/drawer
 *       DOM insertions and class modifications, debounced using {@code requestAnimationFrame}.</li>
 *   <li><b>Body Scroll Locking:</b> Appends {@code .modal-open} to {@code document.body} when fixed overlays
 *       are open to prevent background scrolling.</li>
 *   <li><b>Autofocus & Selection:</b> Automatically scrolls in-page dialogs to center and focuses/selects
 *       the first editable {@code input}, {@code select}, or {@code textarea}.</li>
 *   <li><b>Keyboard Dismissal:</b> Hooks the global {@code Escape} keydown event outside Angular's zone
 *       to simulate clicking the active modal's close button.</li>
 * </ul>
 */
@Injectable({
  providedIn: 'root'
})
export class ModalManagerService {
  private observer: MutationObserver | null = null;
  private activeModalEl: HTMLElement | null = null;
  private focusTimeoutId: any = null;

  constructor(private ngZone: NgZone) {}

  private rafId: number | null = null;

  private scheduleCheckForOpenModals(): void {
    if (this.rafId !== null) return;
    this.rafId = requestAnimationFrame(() => {
      this.rafId = null;
      this.checkForOpenModals();
    });
  }

  /**
   * Initializes the universal modal manager across all tabs.
   * Auto-centers modals, locks background scrolling, focuses first interactive field,
   * and handles smooth navigation into view.
   */
  init(): void {
    if (typeof document === 'undefined') return;

    this.ngZone.runOutsideAngular(() => {
      // 1. Observe DOM for modal/drawer insertions and visibility changes
      this.observer = new MutationObserver(() => {
        this.scheduleCheckForOpenModals();
      });

      this.observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class', 'style', 'hidden']
      });

      // 2. Global ESC key listener to dismiss open modals/drawers
      window.addEventListener('keydown', (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          this.handleEscapeKey();
        }
      });
    });

    // Run initial scan
    this.scheduleCheckForOpenModals();
  }

  /**
   * Scans document for currently active modals, pop-cards, drawers or form dialogs.
   */
  private checkForOpenModals(): void {
    const modalSelectors = [
      '.modal-backdrop',
      '.modal-backdrop-custom',
      '.cf-modal-backdrop',
      '.cf-modal-dialog',
      '.modal-dialog-custom',
      '.sec-modal-backdrop',
      '.restore-modal-backdrop',
      '.invoice-modal-overlay',
      '.party-modal-overlay',
      '.payments-modal-overlay',
      '.drawer-backdrop',
      '.invoice-drawer-backdrop',
      '.erp-drawer-overlay',
      '.dossier-modal-backdrop',
      '.waybill-modal-backdrop',
      '.voucher-modal-backdrop',
      '.party-modal-dialog',
      '.payments-modal-dialog',
      '.erp-drawer.open',
      '.sales-drawer',
      '.party-drawer.drawer-open',
      '.slide-drawer',
      '.drawer-panel',
      '.sales-form-card'
    ];

    const openModal = document.querySelector(modalSelectors.join(',')) as HTMLElement;

    if (openModal) {
      // Only lock body scroll if it's a fixed modal/drawer overlay (not in-page sales card)
      const isOverlay = !openModal.classList.contains('sales-form-card');
      if (isOverlay) {
        document.body.classList.add('modal-open');
      }

      if (openModal !== this.activeModalEl) {
        this.activeModalEl = openModal;
        this.navigateAndFocus(openModal);
      }
    } else {
      document.body.classList.remove('modal-open');
      this.activeModalEl = null;
    }
  }

  /**
   * Smoothly navigates the user directly to the opened card and focuses the first input.
   */
  public navigateAndFocus(container: HTMLElement): void {
    clearTimeout(this.focusTimeoutId);

    this.focusTimeoutId = setTimeout(() => {
      // If it's an in-page card (like sales form card), scroll it smoothly into viewport center
      if (container.classList.contains('sales-form-card') || container.classList.contains('party-form-container')) {
        container.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }

      // Find the first interactive input/select/textarea
      const focusable = container.querySelector(
        'input:not([type="hidden"]):not([disabled]):not([readonly]), select:not([disabled]), textarea:not([disabled])'
      ) as HTMLElement;

      if (focusable) {
        try {
          focusable.focus({ preventScroll: false });
          if ((focusable as HTMLInputElement).select && typeof (focusable as HTMLInputElement).select === 'function') {
            // Select text if it's a standard text/number field for fast replacement
            const type = (focusable as HTMLInputElement).type;
            if (['text', 'number', 'email', 'tel'].includes(type)) {
              (focusable as HTMLInputElement).select();
            }
          }
        } catch (_) {}
      }
    }, 60);
  }

  /**
   * Close active modal when Escape key is pressed
   */
  private handleEscapeKey(): void {
    if (!this.activeModalEl) return;

    // Find close button
    const closeBtn = (this.activeModalEl.querySelector(
      '.btn-panel-close, .btn-close-modal, .btn-drawer-close, .btn-close-form, .modal-close-btn, .btn-close-dossier, [aria-label="Close"], button[title*="Close"]'
    ) || document.querySelector('.btn-panel-close, .btn-close-modal, .btn-drawer-close, .btn-close-form, .modal-close-btn, .btn-close-dossier')) as HTMLElement;

    if (closeBtn && typeof closeBtn.click === 'function') {
      closeBtn.click();
    }
  }

  destroy(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    document.body.classList.remove('modal-open');
  }
}
