import { Injectable, Injector } from '@angular/core';
import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError, OperatorFunction } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private injector: Injector, private router: Router) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const auth = this.getAuthService();
    const token = auth ? auth.userToken() : null;

    if (req.headers.has('Authorization') || req.url.endsWith('/auth/login')) {
      return next.handle(req).pipe(this.handleErrors());
    }

    const cloned = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;
    return next.handle(cloned).pipe(this.handleErrors());
  }

  private getAuthService(): AuthService | null {
    try {
      return this.injector.get(AuthService);
    } catch {
      return null;
    }
  }

  private handleErrors(): OperatorFunction<HttpEvent<any>, HttpEvent<any>> {
    return catchError((err: unknown) => {
      if (err instanceof HttpErrorResponse && err.status === 401) {
        const auth = this.getAuthService();
        if (auth) auth.logout();
        this.router.navigate(['/login']);
      }
      return throwError(() => err) as Observable<HttpEvent<any>>;
    });
  }
}
