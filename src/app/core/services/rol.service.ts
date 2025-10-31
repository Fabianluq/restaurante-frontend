import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiClientService } from './api-client.service';
import { Rol } from '../models/empleado.models';

export interface RolRequest {
  nombre: string;
  descripcion?: string;
}

@Injectable({ providedIn: 'root' })
export class RolService {
  constructor(private api: ApiClientService) {}

  listar(): Observable<Rol[] | { error: any }> {
    return this.api.get<Rol[]>('/roles');
  }

  crear(payload: RolRequest): Observable<Rol | { error: any }> {
    return this.api.post<Rol>('/roles', payload);
  }

  actualizar(id: number, payload: RolRequest): Observable<Rol | { error: any }> {
    return this.api.put<Rol>(`/roles/${id}`, payload);
  }

  eliminar(id: number): Observable<{ ok: true } | { error: any }> {
    return this.api.delete(`/roles/${id}`).pipe(
      map((res: any) => {
        if (res && res.error === 'Empty response') return { ok: true } as const;
        if (res && res.error) return res;
        return { ok: true } as const;
      })
    );
  }

  // El backend no expone GET /roles/{id}, resolvemos via listado
  buscarPorId(id: number): Observable<Rol | { error: any }> {
    return this.listar().pipe(
      map((res) => {
        if ((res as any)?.error) return res as any;
        const roles = res as Rol[];
        const found = roles.find(r => r.id === id);
        return found ?? { error: { message: 'Rol no encontrado' } } as any;
      })
    );
  }
}


