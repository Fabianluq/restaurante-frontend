import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiClientService } from './api-client.service';
import { ClienteRequest, ClienteResponse } from '../models/cliente.models';

@Injectable({ providedIn: 'root' })
export class ClienteService {
  constructor(private api: ApiClientService) {}

  listar(): Observable<ClienteResponse[] | { error: any }> {
    return this.api.get<ClienteResponse[]>('/clientes');
  }

  crear(payload: ClienteRequest): Observable<ClienteResponse | { error: any }> {
    return this.api.post<ClienteResponse>('/clientes', payload);
  }

  actualizar(id: number, payload: ClienteRequest): Observable<ClienteResponse | { error: any }> {
    return this.api.put<ClienteResponse>(`/clientes/${id}`, payload);
  }

  eliminar(id: number): Observable<{ ok: true } | { error: any }> {
    return this.api.delete(`/clientes/${id}`).pipe(
      map((res: any) => {
        if (res && res.error === 'Empty response') return { ok: true } as const;
        if (res && res.error) return res;
        return { ok: true } as const;
      })
    );
  }

  buscarPorId(id: number): Observable<ClienteResponse | { error: any }> {
    return this.api.get<ClienteResponse>(`/clientes/${id}`);
  }
}

