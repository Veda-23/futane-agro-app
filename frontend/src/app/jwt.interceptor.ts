import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

export const jwtInterceptor: HttpInterceptorFn = (req: HttpRequest<any>, next: HttpHandlerFn) => {
  const token = sessionStorage.getItem('jwtToken');
  
  const headers: { [key: string]: string } = {
    'bypass-tunnel-reminder': 'true'
  };

  if (token && !req.url.includes('/users/login')) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const cloned = req.clone({
    setHeaders: headers
  });

  return next(cloned).pipe(
    catchError((error: HttpErrorResponse) => {
      // 401 Unauthorized indicates token is invalid or expired
      if (error.status === 401 && !req.url.includes('/users/login')) {
        console.warn('Session expired or unauthorized. Logging out.');
        sessionStorage.clear();
        localStorage.removeItem('user');
        localStorage.removeItem('jwtToken');
        document.cookie = "erp_session_cookie=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        
        // Reload to force back to login screen
        window.location.reload();
      }
      return throwError(() => error);
    })
  );
};
