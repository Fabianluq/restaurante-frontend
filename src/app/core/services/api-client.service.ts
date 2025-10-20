import { Injectable, Injector, signal } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { RequestParams } from '../models/api.models';
import { AuthService } from './auth.service'; 

@Injectable({ providedIn: 'root' })
export class ApiClientService {
  private baseUrl = 'http://149.130.170.156:8081';

  private responseSignal = signal<any | null>(null);
  private statusSignal = signal<'idle' | 'loading' | 'success' | 'error'>('idle');

  constructor(private http: HttpClient, private injector: Injector) {}

  private getAuthService(): AuthService | null {
    try {
      return this.injector.get(AuthService);
    } catch {
      return null;
    }
  }

  private getAuthToken(skipAuth?: boolean): string | null {
    if (skipAuth) return null;
    const auth = this.getAuthService();
    return auth ? auth.userToken() : null;
  }

  private logRequest(method: string, url: string, body?: any, headers?: HttpHeaders, params?: HttpParams) {
    console.groupCollapsed(`[API] ${method} ${url}`);
    const headerList = headers ? headers.keys().map(k => `${k}: ${headers.get(k)}`) : [];
    console.log('Headers:', headerList.length ? headerList : '(none)');
    if (params) console.log('Params:', params.toString());
    if (body !== undefined) console.log('Body:', body);
    console.groupEnd();
  }

  private formatError(err: HttpErrorResponse) {
    const formatted = {
      status: err.status,
      statusText: err.statusText,
      message: err.message,
      url: err.url,
      errorBody: err.error
    };
    console.error('[API][ERROR]', formatted);
    return { error: formatted };
  }

  private normalizeBackend<T>(raw: any): T | { error: any } {
    if (raw == null) return { error: 'Empty response' };

    // Si tu backend envuelve la respuesta con { estado, datos } adaptalo aquí
    if (raw.estado !== undefined && raw.datos !== undefined) {
      return raw.datos as T;
    }

    // Respuestas directas: token, rol, error, etc.
    if (raw.token || raw.error || raw.rol || raw.id) return raw as T;

    // Por defecto devolver raw (asumimos que ya es el DTO)
    return raw as T;
  }

  requestObservable<T = any>(
    path: string,
    options?: RequestParams
  ): Observable<T | { error: any }> {
    const url = `${this.baseUrl}${path}`;

    let headers = new HttpHeaders(options?.headers || {});
    if (options?.body && !headers.has('Content-Type')) {
      headers = headers.set('Content-Type', 'application/json');
    }

    // añadir Authorization de forma perezosa para evitar dependencia circular
    const token = this.getAuthToken(options?.skipAuth);
    if (token && !headers.has('Authorization')) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    let params = new HttpParams();
    if (options?.params) {
      Object.keys(options.params).forEach(k => {
        const v = options.params![k];
        if (v !== undefined && v !== null) {
          params = params.set(k, String(v));
        }
      });
    }

    const httpOptions: { headers?: HttpHeaders; params?: HttpParams } = { headers, params };
    const method = (options?.method || 'GET').toUpperCase();

    this.logRequest(method, url, options?.body, headers, params);

    switch (method) {
      case 'GET':
        return this.http.get<T>(url, httpOptions).pipe(
          map(res => this.normalizeBackend<T>(res)),
          catchError((err: HttpErrorResponse) => of(this.formatError(err)))
        );
      case 'POST':
        return this.http.post<T>(url, options?.body, { ...httpOptions, responseType: 'json' as const }).pipe(
          map(res => this.normalizeBackend<T>(res)),
          catchError((err: HttpErrorResponse) => of(this.formatError(err)))
        );
      case 'PUT':
        return this.http.put<T>(url, options?.body, { ...httpOptions, responseType: 'json' as const }).pipe(
          map(res => this.normalizeBackend<T>(res)),
          catchError((err: HttpErrorResponse) => of(this.formatError(err)))
        );
      case 'PATCH':
        return this.http.patch<T>(url, options?.body, { ...httpOptions, responseType: 'json' as const }).pipe(
          map(res => this.normalizeBackend<T>(res)),
          catchError((err: HttpErrorResponse) => of(this.formatError(err)))
        );
      case 'DELETE':
        return this.http.delete<T>(url, httpOptions).pipe(
          map(res => this.normalizeBackend<T>(res)),
          catchError((err: HttpErrorResponse) => of(this.formatError(err)))
        );
      default:
        const unsupported = { error: `Unsupported method ${method}` };
        console.warn('[API] Unsupported method', method, url);
        return of(unsupported);
    }
  }

  async requestAndSet<T = any>(path: string, options?: RequestParams): Promise<T | { error: any }> {
    this.statusSignal.set('loading');

    return new Promise(resolve => {
      this.requestObservable<T>(path, options).subscribe(result => {
        if ((result as any)?.error) {
          this.responseSignal.set(result);
          this.statusSignal.set('error');
          resolve(result);
        } else {
          this.responseSignal.set(result);
          this.statusSignal.set('success');
          resolve(result as T);
        }
      });
    });
  }

  get<T = any>(path: string, opts?: Partial<RequestParams>) {
    return this.requestObservable<T>(path, { method: 'GET', ...opts });
  }
  post<T = any>(path: string, body: any, opts?: Partial<RequestParams>) {
    return this.requestObservable<T>(path, { method: 'POST', body, ...opts });
  }
  put<T = any>(path: string, body: any, opts?: Partial<RequestParams>) {
    return this.requestObservable<T>(path, { method: 'PUT', body, ...opts });
  }
  delete<T = any>(path: string, opts?: Partial<RequestParams>) {
    return this.requestObservable<T>(path, { method: 'DELETE', ...opts });
  }

  get status() {
    return this.statusSignal.asReadonly();
  }
  get value() {
    return this.responseSignal.asReadonly();
  }
}
