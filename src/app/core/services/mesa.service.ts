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

  ocuparMesa(mesaId: number, empleadoId: number): Observable<string | { error: any }> {
    // Según OpenAPI: PUT /empleados/mesas/{id}/ocupar?empleadoId={empleadoId}
    const url = `/empleados/mesas/${mesaId}/ocupar?empleadoId=${empleadoId}`;
    
    console.log('[MesaService] Ocupando mesa:', { mesaId, empleadoId, url });
    
    return this.api.put<string>(url, {}).pipe(
      map((res: any) => {
        if ((res as any)?.error) {
          const error = (res as any).error;
          console.error('[MesaService] Error al ocupar mesa:', error);
          
          // Si hay un error 403, mejorar el mensaje
          if (error?.status === 403) {
            return {
              error: {
                ...error,
                message: 'No tienes permisos para ocupar mesas. El backend está rechazando la petición. Verifica la configuración de seguridad del backend o contacta al administrador.'
              }
            };
          }
          return res;
        }
        console.log('[MesaService] Mesa ocupada exitosamente');
        return res || 'Mesa ocupada exitosamente';
      })
    );
  }
}

