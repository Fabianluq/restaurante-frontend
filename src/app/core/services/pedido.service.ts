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
  estadoId: number;
  mesaId?: number;
  paraLlevar: boolean; // Requerido por el backend
  nombreCliente?: string;
  apellidoCliente?: string;
  correoCliente?: string;
  telefonoCliente?: string;
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

  listarParaCocina(): Observable<PedidoResponse[] | { error: any }> {
    // Según OpenAPI: GET /pedidos/cocina
    return this.api.get<ApiResponse>('/pedidos/cocina').pipe(
      map((res: any) => {
        if ((res as any)?.error) return res;
        const apiRes = res as ApiResponse;
        if (apiRes.datos) {
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
    console.log('[PedidoService] Creando pedido:', JSON.stringify(pedido, null, 2));
    return this.api.post<ApiResponseSingle>('/pedidos', pedido).pipe(
      map((res: any) => {
        console.log('[PedidoService] Respuesta del backend:', res);
        if ((res as any)?.error) {
          console.error('[PedidoService] Error en respuesta:', res);
          return res;
        }
        
        // El backend puede devolver directamente el objeto o envuelto en { estado, datos }
        let pedidoResponse: PedidoResponse;
        
        if (res.estado !== undefined && res.datos !== undefined) {
          // Respuesta envuelta: { estado: "exito", datos: {...} }
          const apiRes = res as ApiResponseSingle;
          if (apiRes.datos) {
            pedidoResponse = apiRes.datos;
          } else {
            console.error('[PedidoService] Respuesta sin datos:', res);
            return { error: { message: 'Error al crear pedido: respuesta sin datos' } } as any;
          }
        } else if (res.id !== undefined) {
          // Respuesta directa: PedidoResponse
          pedidoResponse = res as PedidoResponse;
        } else {
          console.error('[PedidoService] Formato de respuesta desconocido:', res);
          return { error: { message: 'Error al crear pedido: formato de respuesta desconocido' } } as any;
        }
        
        return {
          ...pedidoResponse,
          empleado: pedidoResponse.empleadoNombre || pedidoResponse.empleado,
          numeroMesa: pedidoResponse.mesaNumero ? `Mesa ${pedidoResponse.mesaNumero}` : undefined,
          total: pedidoResponse.detalles?.reduce((sum, d) => sum + d.totalDetalle, 0) || 0
        };
      })
    );
  }

  actualizar(id: number, pedido: PedidoRequest): Observable<PedidoResponse | { error: any }> {
    return this.api.put<ApiResponseSingle>(`/pedidos/${id}`, pedido).pipe(
      map((res: any) => {
        if ((res as any)?.error) return res;
        
        // Si la respuesta está vacía o es un objeto vacío, es un PUT exitoso sin body
        if (!res || Object.keys(res).length === 0) {
          return { success: true } as any;
        }
        
        const apiRes = res as ApiResponseSingle;
        
        // Si el estado es SUCCESS pero no hay datos, es un PUT exitoso
        if (apiRes.estado === 'SUCCESS' || apiRes.estado === 'OK' || apiRes.estado === 'EXITOSO') {
          if (apiRes.datos) {
            const p = apiRes.datos;
            return {
              ...p,
              empleado: p.empleadoNombre || p.empleado,
              numeroMesa: p.mesaNumero ? `Mesa ${p.mesaNumero}` : undefined,
              total: p.detalles?.reduce((sum, d) => sum + d.totalDetalle, 0) || 0
            };
          }
          // PUT exitoso sin datos del pedido - esto es válido
          return { success: true } as any;
        }
        
        // Si hay datos, procesarlos
        if (apiRes.datos) {
          const p = apiRes.datos;
          return {
            ...p,
            empleado: p.empleadoNombre || p.empleado,
            numeroMesa: p.mesaNumero ? `Mesa ${p.mesaNumero}` : undefined,
            total: p.detalles?.reduce((sum, d) => sum + d.totalDetalle, 0) || 0
          };
        }
        
        // Si llegamos aquí sin error explícito, asumir éxito
        return { success: true } as any;
      })
    );
  }

  cambiarEstado(id: number, idEstado: number): Observable<PedidoResponse | { error: any }> {
    return this.api.put<ApiResponseSingle>(`/pedidos/${id}/estado/${idEstado}`, {}).pipe(
      map((res: any) => {
        // Si hay un error explícito, retornarlo
        if ((res as any)?.error) return res;
        
        // Si la respuesta está vacía o es un objeto vacío, es un PUT exitoso sin body
        if (!res || Object.keys(res).length === 0) {
          // PUT exitoso sin datos - esto es válido, no es un error
          // Retornar un objeto que indique éxito pero sin datos del pedido
          return { success: true } as any;
        }
        
        const apiRes = res as ApiResponseSingle;
        
        // Si el estado es SUCCESS pero no hay datos, es un PUT exitoso
        if (apiRes.estado === 'SUCCESS' || apiRes.estado === 'OK' || apiRes.estado === 'EXITOSO') {
          if (apiRes.datos) {
            const p = apiRes.datos;
            return {
              ...p,
              empleado: p.empleadoNombre || p.empleado,
              numeroMesa: p.mesaNumero ? `Mesa ${p.mesaNumero}` : undefined,
              total: p.detalles?.reduce((sum, d) => sum + d.totalDetalle, 0) || 0
            };
          }
          // PUT exitoso sin datos del pedido - esto es válido
          return { success: true } as any;
        }
        
        // Si hay datos, procesarlos
        if (apiRes.datos) {
          const p = apiRes.datos;
          return {
            ...p,
            empleado: p.empleadoNombre || p.empleado,
            numeroMesa: p.mesaNumero ? `Mesa ${p.mesaNumero}` : undefined,
            total: p.detalles?.reduce((sum, d) => sum + d.totalDetalle, 0) || 0
          };
        }
        
        // Si llegamos aquí y no hay error explícito, asumir éxito
        return { success: true } as any;
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

  agregarDetalle(pedidoId: number, detalle: DetallePedidoRequest): Observable<any> {
    // Según OpenAPI: POST /detalles-pedido/{pedidoId}/detalles
    return this.api.post(`/detalles-pedido/${pedidoId}/detalles`, detalle);
  }

  listarPorEmpleado(empleadoId: number): Observable<PedidoResponse[] | { error: any }> {
    // Según OpenAPI: GET /pedidos/empleado/{empleadoId}
    // El backend valida que MESERO solo vea sus propios pedidos
    return this.api.get<ApiResponse>(`/pedidos/empleado/${empleadoId}`).pipe(
      map((res: any) => {
        if ((res as any)?.error) return res;
        const apiRes = res as ApiResponse;
        if (apiRes.datos) {
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
}
