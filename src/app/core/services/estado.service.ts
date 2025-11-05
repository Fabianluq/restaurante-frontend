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
    // Intentar diferentes endpoints posibles
    return this.api.get<ApiResponse>('/estados?tipo=pedidos').pipe(
      catchError(() => {
        // Si falla, intentar endpoint alternativo
        return this.api.get<ApiResponse>('/estados').pipe(
          catchError(() => {
            // Si también falla, devolver estados por defecto
            console.warn('[EstadoService] No se pudieron cargar estados, usando valores por defecto');
            return of([]);
          })
        );
      }),
      map((res: any) => {
        if ((res as any)?.error) {
          // Si hay error, devolver estados por defecto
          return this.getEstadosPorDefecto();
        }
        const apiRes = res as ApiResponse;
        if (apiRes.datos && apiRes.datos.length > 0) {
          return apiRes.datos;
        }
        // Si no hay datos, filtrar solo estados de pedidos o devolver por defecto
        if (Array.isArray(res) && res.length > 0) {
          return res.filter((e: EstadoResponse) => 
            e.descripcion && (
              e.descripcion.toUpperCase().includes('PENDIENTE') ||
              e.descripcion.toUpperCase().includes('PREPARACION') ||
              e.descripcion.toUpperCase().includes('LISTO') ||
              e.descripcion.toUpperCase().includes('ENTREGADO') ||
              e.descripcion.toUpperCase().includes('PAGADO')
            )
          );
        }
        return this.getEstadosPorDefecto();
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
    return this.api.get<ApiResponse>('/estados?tipo=mesas').pipe(
      catchError(() => this.api.get<ApiResponse>('/estados')),
      map((res: any) => {
        if ((res as any)?.error) return res;
        const apiRes = res as ApiResponse;
        return apiRes.datos || [];
      })
    );
  }

  listarEstadosProductos(): Observable<EstadoResponse[] | { error: any }> {
    return this.api.get<ApiResponse>('/estados?tipo=productos').pipe(
      catchError(() => this.api.get<ApiResponse>('/estados')),
      map((res: any) => {
        if ((res as any)?.error) return res;
        const apiRes = res as ApiResponse;
        return apiRes.datos || [];
      })
    );
  }
}

