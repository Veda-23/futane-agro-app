# Master Prompt #10 — Modal UI Polish: Remove Stray Checkbox & Add Top-Right Close ('✕') Button

## Context
When dialog modals (such as the SweetAlert2 **"Session Expired"** modal, confirmation dialogs, or error alerts) appear, an unstyled empty square/checkbox element inadvertently renders above the primary action button. Furthermore, these dialogs lack a standard top-right cross button (`✕`) for clean and accessible dismissal.

This prompt provides the root-cause fix and UI standardization pass across all alerts and modals in the application.

---

## 🎯 Objectives
1. **Completely eliminate the stray square/checkbox** from all SweetAlert2 popups, confirmation alerts, and session expiration dialogs.
2. **Add a sleek, circular close cross button (`✕`)** in the upper-right corner of all dialog modals and SweetAlert popups.
3. **Ensure dark-mode and responsive compatibility** for the top-right close button.

---

## 🛠️ Required Code Changes

### 1. Global CSS / SCSS Isolation (`frontend/src/styles.scss`)

```scss
/* ─── SweetAlert2 Close Button (Top-Right Cross '✕') ─── */
.swal2-close {
  position: absolute !important;
  top: 14px !important;
  right: 14px !important;
  width: 32px !important;
  height: 32px !important;
  font-size: 22px !important;
  font-weight: 400 !important;
  font-family: Arial, sans-serif !important;
  line-height: 30px !important;
  color: var(--text-muted, #94a3b8) !important;
  background: transparent !important;
  border: none !important;
  border-radius: 50% !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1) !important;
  cursor: pointer !important;
  outline: none !important;
  box-shadow: none !important;
  z-index: 10 !important;

  &:hover {
    color: #ef4444 !important;
    background: rgba(239, 68, 68, 0.12) !important;
    transform: rotate(90deg) scale(1.08) !important;
  }
}

body.dark-theme .swal2-close {
  color: #94a3b8 !important;

  &:hover {
    color: #f87171 !important;
    background: rgba(248, 113, 113, 0.2) !important;
  }
}

/* ─── Fully Suppress Stray SweetAlert2 Checkboxes ─── */
.swal2-container .swal2-checkbox,
.swal2-checkbox {
  display: none !important;
  background: transparent !important;
}

.swal2-container .swal2-checkbox[style*="display: flex"],
.swal2-container .swal2-checkbox[style*="display: block"] {
  display: flex !important;
}
```

---

### 2. Angular Notification Service (`frontend/src/app/services/notification.service.ts`)

Enable `showCloseButton: true` on all interactive modal dialogs:

```typescript
showSessionExpired(onLogin: () => void) {
  Swal.fire({
    icon: 'warning',
    title: 'Session Expired',
    text: 'Your session has expired due to inactivity. Please log in again.',
    confirmButtonText: 'Login Again',
    confirmButtonColor: '#d97706',
    showCloseButton: true,
    allowOutsideClick: false
  }).then(() => {
    onLogin();
  });
}

confirmAction(title: string, text: string, confirmBtnText: string = 'Yes, Delete'): Promise<boolean> {
  return Swal.fire({
    title: title,
    text: text,
    icon: 'warning',
    showCancelButton: true,
    showCloseButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#6e7881',
    confirmButtonText: confirmBtnText,
    cancelButtonText: 'Cancel'
  }).then(res => res.isConfirmed);
}

error(title: string, text: string = '') {
  Swal.fire({
    icon: 'error',
    title: title,
    text: text,
    confirmButtonColor: '#ef4444',
    confirmButtonText: 'Dismiss',
    showCloseButton: true
  });
}
```

---

## 🧪 Verification Checklist
- [ ] Open the "Session Expired" dialog (or wait for idle trigger) — verify the stray checkbox above "Login Again" is gone.
- [ ] Verify a circular `✕` close button appears on the top-right corner of the modal.
- [ ] Hover over the `✕` button — confirm smooth transition effect (red hover background and subtle rotation).
- [ ] Click the `✕` button — confirm modal dismisses cleanly.
- [ ] Test in both Light Mode and Dark Mode.
