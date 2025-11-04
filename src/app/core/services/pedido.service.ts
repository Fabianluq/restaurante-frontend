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
  mesaNumero?: number; // Alias
  detalles?: DetallePedido[];
  total?: number; // Calculado
}

interface ApiResponse {
  mensaje?: string;
  estado?: string;
  datos?: PedidoResponse[];
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
    return this.api.get<ApiResponse>(`/pedidos/${id}`).pipe(
      map((res: any) => {
        if ((res as any)?.error) return res;
        const apiRes = res as ApiResponse;
        if (apiRes.datos && Array.isArray(apiRes.datos) && apiRes.datos.length > 0) {
          const p = apiRes.datos[0];
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
}


