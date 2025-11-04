import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiClientService } from './api-client.service';

export interface DetallePedido {
  id: number;
  nombreProducto: string;
  cantidad: number;
  precioUnitario: number;
  totalDetalle: number;
  pedidoId: number;
  estadoDetalle: string;
}

export interface PedidoResponse {
  id: number;
  fechaPedido: string;
  horaPedido: string;
  estado: string;
  empleadoNombre?: string;
  empleado?: string; // Alias
  clienteNombre?: string;
  mesaNumero?: number;
  numeroMesa?: string; // Alias formateado
  detalles?: DetallePedido[];
  total?: number; // Calculado
}

export interface PedidoRequest {
  clienteId?: number;
  mesaId: number;
  empleadoId: number;
  detalles: DetallePedidoRequest[];
  observaciones?: string;
}

export interface DetallePedidoRequest {
  productoId: number;
  cantidad: number;
  observaciones?: string;
}

interface ApiResponse {
  mensaje?: string;
  estado?: string;
  datos?: PedidoResponse[];
  codigo?: number;
}

interface ApiResponseSingle {
  mensaje?: string;
  estado?: string;
  datos?: PedidoResponse;
  codigo?: number;
}

@Injectable({ providedIn: 'root' })
export class PedidoService {
  constructor(private api: ApiClientService) {}

  listar(): Observable<PedidoResponse[] | { error: any }> {
    return this.api.get<ApiResponse>('/pedidos').pipe(
      map((res: any) => {
        if ((res as any)?.error) return res;
        const apiRes = res as ApiResponse;
        if (apiRes.datos) {
          // Calcular total y mapear campos
          return apiRes.datos.map(p => ({
            ...p,
            empleado: p.empleadoNombre || p.empleado,
            numeroMesa: p.mesaNumero ? `Mesa ${p.mesaNumero}` : undefined,
            total: p.detalles?.reduce((sum, d) => sum + d.totalDetalle, 0) || 0
          }));
        }
        return res as PedidoResponse[];
      })
    );
  }

  buscarPorId(id: number): Observable<PedidoResponse | { error: any }> {
    return this.api.get<ApiResponseSingle>(`/pedidos/${id}`).pipe(
      map((res: any) => {
        if ((res as any)?.error) return res;
        const apiRes = res as ApiResponseSingle;
        if (apiRes.datos) {
          const p = apiRes.datos;
          return {
            ...p,
            empleado: p.empleadoNombre || p.empleado,
            numeroMesa: p.mesaNumero ? `Mesa ${p.mesaNumero}` : undefined,
            total: p.detalles?.reduce((sum, d) => sum + d.totalDetalle, 0) || 0
          };
        }
        return { error: { message: 'Pedido no encontrado' } } as any;
      })
    );
  }

  crear(pedido: PedidoRequest): Observable<PedidoResponse | { error: any }> {
    return this.api.post<ApiResponseSingle>('/pedidos', pedido).pipe(
      map((res: any) => {
        if ((res as any)?.error) return res;
        const apiRes = res as ApiResponseSingle;
        if (apiRes.datos) {
          const p = apiRes.datos;
          return {
            ...p,
            empleado: p.empleadoNombre || p.empleado,
            numeroMesa: p.mesaNumero ? `Mesa ${p.mesaNumero}` : undefined,
            total: p.detalles?.reduce((sum, d) => sum + d.totalDetalle, 0) || 0
          };
        }
        return { error: { message: 'Error al crear pedido' } } as any;
      })
    );
  }

  actualizar(id: number, pedido: PedidoRequest): Observable<PedidoResponse | { error: any }> {
    return this.api.put<ApiResponseSingle>(`/pedidos/${id}`, pedido).pipe(
      map((res: any) => {
        if ((res as any)?.error) return res;
        const apiRes = res as ApiResponseSingle;
        if (apiRes.datos) {
          const p = apiRes.datos;
          return {
            ...p,
            empleado: p.empleadoNombre || p.empleado,
            numeroMesa: p.mesaNumero ? `Mesa ${p.mesaNumero}` : undefined,
            total: p.detalles?.reduce((sum, d) => sum + d.totalDetalle, 0) || 0
          };
        }
        return { error: { message: 'Error al actualizar pedido' } } as any;
      })
    );
  }

  cambiarEstado(id: number, idEstado: number): Observable<PedidoResponse | { error: any }> {
    return this.api.put<ApiResponseSingle>(`/pedidos/${id}/estado/${idEstado}`, {}).pipe(
      map((res: any) => {
        if ((res as any)?.error) return res;
        const apiRes = res as ApiResponseSingle;
        if (apiRes.datos) {
          const p = apiRes.datos;
          return {
            ...p,
            empleado: p.empleadoNombre || p.empleado,
            numeroMesa: p.mesaNumero ? `Mesa ${p.mesaNumero}` : undefined,
            total: p.detalles?.reduce((sum, d) => sum + d.totalDetalle, 0) || 0
          };
        }
        return { error: { message: 'Error al cambiar estado' } } as any;
      })
    );
  }

  eliminar(id: number): Observable<{ ok: true } | { error: any }> {
    return this.api.delete(`/pedidos/${id}`).pipe(
      map((res: any) => {
        if (res && res.error === 'Empty response') return { ok: true } as const;
        if (res && res.error) return res;
        return { ok: true } as const;
      })
    );
  }
}
