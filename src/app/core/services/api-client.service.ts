import { Injectable, signal } from '@angular/core';
import { fromFetch } from 'rxjs/fetch';
import { switchMap, catchError, of } from 'rxjs';
import { rxResource, RxResourceOptions } from '@angular/core/rxjs-interop';

export interface RequestParams {
  url: string;
  options?: RequestInit;
}

@Injectable({ providedIn: 'root' })
export class ApiClientService {
  private baseUrl = 'http://localhost:8080/api';

  private requestSignal = signal<RequestParams | null>(null);

  public apiResource = rxResource<any, RequestParams>({
    params: this.requestSignal,
    stream: ({ params }) => {
      if (!params || !params.url) return of({ error: 'No URL provided' });

      console.log('🚀 Fetching URL:', params.url, params.options);

      return fromFetch(params.url, params.options).pipe(
        switchMap(async res => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return await res.json();
        }),
        catchError(err => {
          console.error('❌ Fetch error:', err);
          return of({ error: err.message });
        })
      );
    }
  } as RxResourceOptions<any, RequestParams>);

  request(path: string, options?: RequestInit) {
    const url = `${this.baseUrl}${path}`;
    const params: RequestParams = { url, options };
    console.log('ApiClientService.request ->', { url, options });
    this.requestSignal.set(params);
   
    try {
      this.apiResource.reload(); 
    } catch (e) {
    
      console.warn('apiResource.reload() no disponible o falló:', e);
    }
  }

  get status() {
    return this.apiResource.status; 
  }

  get value() {
    return this.apiResource.value;
  }
}
