import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiClientService } from './api-client.service';
import { MesaRequest, MesaResponse } from '../models/mesa.models';

@Injectable({ providedIn: 'root' })
export class MesaService {
  constructor(private api: ApiClientService) {}

  listar(): Observable<MesaResponse[] | { error: any }> {
    return this.api.get<MesaResponse[]>('/mesas');
  }

  crear(payload: MesaRequest): Observable<MesaResponse | { error: any }> {
    return this.api.post<MesaResponse>('/mesas', payload);
  }

  actualizar(id: number, payload: MesaRequest): Observable<MesaResponse | { error: any }> {
    return this.api.put<MesaResponse>(`/mesas/${id}`, payload);
  }

  eliminar(id: number): Observable<{ ok: true } | { error: any }> {
    return this.api.delete(`/mesas/${id}`).pipe(
      map((res: any) => {
        if (res && res.error === 'Empty response') return { ok: true } as const;
        if (res && res.error) return res;
        return { ok: true } as const;
      })
    );
  }

  buscarPorId(id: number): Observable<MesaResponse | { error: any }> {
    return this.api.get<MesaResponse>(`/mesas/${id}`);
  }
}

