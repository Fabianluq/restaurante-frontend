import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiClientService } from './api-client.service';

export interface PagoRequest {
  pedidoId: number;
  monto: number;
  metodoPago: string;
  observaciones?: string;
}

export interface PagoResponse {
  id: number;
  pedidoId: number;
  monto: number;
  metodoPago: string;
  fechaPago: string;
  observaciones?: string;
  numeroMesa?: string;
  nombreCliente?: string;
}

export interface FacturaResponse {
  pedidoId: number;
  numeroMesa: string;
  mesero: string;
  fechaPedido: string;
  horaPedido: string;
  items: FacturaItemResponse[];
  subtotal: number;
  impuestos: number;
  propina: number;
  total: number;
}

export interface FacturaItemResponse {
  detalleId: number;
  producto: string;
  cantidad: number;
  precioUnitario: number;
  total: number;
}

interface ApiResponse {
  mensaje?: string;
  estado?: string;
  datos?: PagoResponse[];
  codigo?: number;
}

interface ApiResponseSingle {
  mensaje?: string;
  estado?: string;
  datos?: PagoResponse;
  codigo?: number;
}

interface ApiResponseFactura {
  mensaje?: string;
  estado?: string;
  datos?: FacturaResponse;
  codigo?: number;
}

@Injectable({ providedIn: 'root' })
export class PagoService {
  constructor(private api: ApiClientService) {}

  crear(pago: PagoRequest): Observable<PagoResponse | { error: any }> {
    return this.api.post<ApiResponseSingle>('/pagos', pago).pipe(
      map((res: any) => {
        if ((res as any)?.error) return res;
        const apiRes = res as ApiResponseSingle;
        return apiRes.datos || { error: { message: 'Error al procesar pago' } } as any;
      })
    );
  }

  listar(): Observable<PagoResponse[] | { error: any }> {
    return this.api.get<ApiResponse>('/pagos').pipe(
      map((res: any) => {
        if ((res as any)?.error) return res;
        const apiRes = res as ApiResponse;
        return apiRes.datos || [];
      })
    );
  }

  buscarPorId(id: number): Observable<PagoResponse | { error: any }> {
    return this.api.get<ApiResponseSingle>(`/pagos/${id}`).pipe(
      map((res: any) => {
        if ((res as any)?.error) return res;
        const apiRes = res as ApiResponseSingle;
        return apiRes.datos || { error: { message: 'Pago no encontrado' } } as any;
      })
    );
  }

  obtenerFactura(pedidoId: number): Observable<FacturaResponse | { error: any }> {
    return this.api.get<ApiResponseFactura>(`/facturas/${pedidoId}`).pipe(
      map((res: any) => {
        if ((res as any)?.error) return res;
        const apiRes = res as ApiResponseFactura;
        return apiRes.datos || { error: { message: 'Factura no encontrada' } } as any;
      })
    );
  }

  generarFactura(pedidoId: number): Observable<FacturaResponse | { error: any }> {
    // Alias para mantener compatibilidad
    return this.obtenerFactura(pedidoId);
  }
}

