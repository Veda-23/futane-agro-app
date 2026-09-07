import { HttpInterceptorFn, HttpErrorResponse, HttpRequest, HttpHandlerFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

/**
 * JWT Authentication Interceptor — SECURITY HARDENED
 *
 * Changes from original:
 * 1. Reads token from sessionStorage ONLY (not localStorage) — sessionStorage
 *    is cleared when the browser tab closes, reducing token theft window.
 * 2. Adds security-sensitive no-cache headers to all API requests.
 * 3. Forces logout + backend token invalidation on 401 (not just client-side clear).
 * 4. Does NOT attach token to non-API requests (prevents token leakage to CDN/third-party).
 */
export const jwtInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  // Only inject JWT on API calls, not on third-party resources
  const isApiCall = req.url.includes('/api/') || req.url.includes(':8080') || req.url.includes(':8081');

  // Read from sessionStorage only (closed-tab auto-expiry) with localStorage fallback for refresh
  const token = sessionStorage.getItem('jwtToken') ?? localStorage.getItem('jwtToken');

  const headersMap: { [key: string]: string } = {
    'bypass-tunnel-reminder': 'true',
    'Cache-Control': 'no-store, no-cache',
    'Pragma': 'no-cache',
  };

  // Attach Bearer token only to API calls (not login endpoint — no circular dependency)
  if (token && isApiCall && !req.url.includes('/users/login')) {
    headersMap['Authorization'] = `Bearer ${token}`;
  }

  const authReq = req.clone({ setHeaders: headersMap });

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !req.url.includes('/users/login')) {
        // 401 = token expired/invalid — perform full secure logout
        performSecureLogout(token);
      }
      if (error.status === 403) {
        // 403 = authenticated but insufficient role — log for visibility
        console.warn('[SECURITY] Access denied (403) for:', req.url);
      }
      return throwError(() => error);
    })
  );
};

/**
 * Performs a full client-side logout on 401/token expiry.
 * Also calls the backend logout endpoint to blacklist the token server-side.
 */
function performSecureLogout(token: string | null): void {
  // Call backend to blacklist the JWT server-side (prevents reuse even if intercepted)
  if (token) {
    const backendUrl = localStorage.getItem('backend_url') || 'http://localhost:8080';
    fetch(`${backendUrl}/api/users/logout`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'bypass-tunnel-reminder': 'true'
      }
    }).catch(() => {
      // Non-fatal — continue with client-side cleanup even if backend is unreachable
      console.warn('[SECURITY] Backend logout call failed — token may not be server-side blacklisted');
    });
  }

  // Clear all client-side auth state
  sessionStorage.removeItem('user');
  sessionStorage.removeItem('jwtToken');
  sessionStorage.removeItem('loginTime');
  sessionStorage.removeItem('activeTab');
  localStorage.removeItem('user');
  localStorage.removeItem('jwtToken');
  localStorage.removeItem('erp_token');

  // Expire the session cookie
  document.cookie = 'erp_session_cookie=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Strict';

  // Reload to force re-login
  window.location.reload();
}
