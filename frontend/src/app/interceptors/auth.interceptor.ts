import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = sessionStorage.getItem('jwtToken') || localStorage.getItem('jwtToken') || localStorage.getItem('erp_token');

  const headers: { [key: string]: string } = {
    'bypass-tunnel-reminder': 'true'
  };

  if (token && !req.url.includes('/users/login')) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const authReq = req.clone({
    setHeaders: headers
  });

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !req.url.includes('/users/login')) {
        localStorage.removeItem('jwtToken');
        localStorage.removeItem('erp_token');
        localStorage.removeItem('user');
        sessionStorage.clear();
        document.cookie = "erp_session_cookie=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        window.location.reload();
      }
      return throwError(() => error);
    })
  );
};
