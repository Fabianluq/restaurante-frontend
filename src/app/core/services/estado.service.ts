import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { ApiClientService } from './api-client.service';

export interface EstadoResponse {
  id: number;
  descripcion: string;
}

interface ApiResponse {
  mensaje?: string;
  estado?: string;
  datos?: EstadoResponse[];
  codigo?: number;
}

@Injectable({ providedIn: 'root' })
export class EstadoService {
  constructor(private api: ApiClientService) {}

  listarEstadosPedidos(): Observable<EstadoResponse[] | { error: any }> {
    // Según OpenAPI: GET /estados/pedidos
    return this.api.get<EstadoResponse[]>('/estados/pedidos').pipe(
      catchError(() => {
        // Si falla, devolver estados por defecto
        return of(this.getEstadosPorDefecto());
      }),
      map((res: any) => {
        if ((res as any)?.error) {
          return this.getEstadosPorDefecto();
        }
        // Si viene como array directo
        return Array.isArray(res) && res.length > 0 ? res : this.getEstadosPorDefecto();
      })
    );
  }

  private getEstadosPorDefecto(): EstadoResponse[] {
    return [
      { id: 1, descripcion: 'Pendiente' },
      { id: 2, descripcion: 'En Preparación' },
      { id: 3, descripcion: 'Listo' },
      { id: 4, descripcion: 'Entregado' },
      { id: 5, descripcion: 'Pagado' }
    ];
  }

  listarEstadosMesas(): Observable<EstadoResponse[] | { error: any }> {
    // Según OpenAPI: GET /estadoMesa
    return this.api.get<EstadoResponse[]>('/estadoMesa').pipe(
      catchError(() => of([])),
      map((res: any) => {
        if ((res as any)?.error) return res;
        return Array.isArray(res) ? res : [];
      })
    );
  }

  listarEstadosProductos(): Observable<EstadoResponse[] | { error: any }> {
    // Según OpenAPI: GET /estadoProducto
    return this.api.get<EstadoResponse[]>('/estadoProducto').pipe(
      catchError(() => of([])),
      map((res: any) => {
        if ((res as any)?.error) return res;
        return Array.isArray(res) ? res : [];
      })
    );
  }
}

