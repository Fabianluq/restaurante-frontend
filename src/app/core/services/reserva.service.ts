import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiClientService } from './api-client.service';

export interface ReservaRequest {
  fechaReserva: string; // YYYY-MM-DD
  horaReserva: string; // HH:mm
  cantidadPersonas: number;
  nombreCliente: string;
  apellidoCliente: string;
  correoCliente: string;
  telefonoCliente: string;
}

export interface DisponibilidadResponse {
  disponible: boolean;
  mensaje: string;
  mesaNumero?: number;
  capacidadMesa?: number;
}

export interface ReservaResponse {
  id?: number;
  mensaje?: string;
  fechaReserva: string;
  horaReserva: string;
  cantidadPersonas: number;
  clienteNombre?: string;
  correoCliente?: string;
  telefonoCliente?: string;
  estadoReserva?: string;
  estado?: string; // Alias para compatibilidad
  mesaNumero?: number;
  clienteId?: number;
}

interface ApiResponse {
  mensaje?: string;
  estado?: string;
  datos?: ReservaResponse[];
  codigo?: number;
}

interface ApiResponseSingle {
  mensaje?: string;
  estado?: string;
  datos?: ReservaResponse;
  codigo?: number;
}

@Injectable({ providedIn: 'root' })
export class ReservaService {
  constructor(private api: ApiClientService) {}

  // Crear reserva pública (sin autenticación)
  crearPublica(reserva: ReservaRequest): Observable<ReservaResponse | { error: any }> {
    // Usar skipAuth para que no requiera token
    // El endpoint será POST /reservas/publica (se creará en el backend)
    return this.api.post<ApiResponseSingle>('/reservas/publica', reserva, { skipAuth: true } as any).pipe(
      map((res: any) => {
        if ((res as any)?.error) return res;
        // El backend puede devolver directamente o envuelto
        if (res.id || res.fechaReserva) return res as ReservaResponse;
        const apiRes = res as ApiResponseSingle;
        return apiRes.datos || { error: { message: 'Error al crear reserva' } } as any;
      })
    );
  }

  // Métodos para usuarios autenticados (ADMIN, MESERO)
  crear(reserva: ReservaRequest): Observable<ReservaResponse | { error: any }> {
    return this.api.post<ApiResponseSingle>('/reservas', reserva).pipe(
      map((res: any) => {
        if ((res as any)?.error) return res;
        // El backend puede devolver directamente o envuelto
        if (res.id) return res as ReservaResponse;
        const apiRes = res as ApiResponseSingle;
        return apiRes.datos || { error: { message: 'Error al crear reserva' } } as any;
      })
    );
  }

  listar(): Observable<ReservaResponse[] | { error: any }> {
    return this.api.get<ReservaResponse[]>('/reservas').pipe(
      map((res: any) => {
        if ((res as any)?.error) return res;
        // El backend puede devolver directamente como array o envuelto
        if (Array.isArray(res)) return res;
        const apiRes = res as ApiResponse;
        return apiRes.datos || [];
      })
    );
  }

  buscarPorId(id: number): Observable<ReservaResponse | { error: any }> {
    return this.api.get<ReservaResponse>(`/reservas/${id}`).pipe(
      map((res: any) => {
        if ((res as any)?.error) return res;
        if (res.id) return res as ReservaResponse;
        return { error: { message: 'Reserva no encontrada' } } as any;
      })
    );
  }

  actualizar(id: number, reserva: ReservaRequest): Observable<ReservaResponse | { error: any }> {
    return this.api.put<ReservaResponse>(`/reservas/${id}`, reserva).pipe(
      map((res: any) => {
        if ((res as any)?.error) return res;
        if (res.id) return res as ReservaResponse;
        return { error: { message: 'Error al actualizar reserva' } } as any;
      })
    );
  }

  cancelar(id: number): Observable<ReservaResponse | { error: any }> {
    return this.api.put<ReservaResponse>(`/reservas/${id}/cancelar`, {}).pipe(
      map((res: any) => {
        if ((res as any)?.error) return res;
        if (res.id) return res as ReservaResponse;
        return { error: { message: 'Error al cancelar reserva' } } as any;
      })
    );
  }

  eliminar(id: number): Observable<{ ok: true } | { error: any }> {
    return this.api.delete(`/reservas/${id}`).pipe(
      map((res: any) => {
        if (res && res.error === 'Empty response') return { ok: true } as const;
        if (res && res.error) return res;
        return { ok: true } as const;
      })
    );
  }

  // ========================================
  // MÉTODOS PÚBLICOS (Clientes sin autenticación)
  // ========================================

  // Listar reservas por correo electrónico
  listarPorCorreo(correo: string): Observable<ReservaResponse[] | { error: any }> {
    return this.api.get<ReservaResponse[]>(`/reservas/publica/cliente?correo=${encodeURIComponent(correo)}`, { skipAuth: true } as any).pipe(
      map((res: any) => {
        if ((res as any)?.error) return res;
        if (Array.isArray(res)) return res;
        const apiRes = res as ApiResponse;
        return apiRes.datos || [];
      })
    );
  }

  // Buscar reserva por ID y correo
  buscarPorIdYCorreo(id: number, correo: string): Observable<ReservaResponse | { error: any }> {
    return this.api.get<ReservaResponse>(`/reservas/publica/${id}?correo=${encodeURIComponent(correo)}`, { skipAuth: true } as any).pipe(
      map((res: any) => {
        if ((res as any)?.error) return res;
        if (res.id) return res as ReservaResponse;
        return { error: { message: 'Reserva no encontrada' } } as any;
      })
    );
  }

  // Cancelar reserva pública
  cancelarPublica(id: number, correo: string): Observable<ReservaResponse | { error: any }> {
    return this.api.put<ReservaResponse>(`/reservas/publica/${id}/cancelar?correo=${encodeURIComponent(correo)}`, {}, { skipAuth: true } as any).pipe(
      map((res: any) => {
        if ((res as any)?.error) return res;
        if (res.id) return res as ReservaResponse;
        return { error: { message: 'Error al cancelar reserva' } } as any;
      })
    );
  }

  // Confirmar reserva pública
  confirmarPublica(id: number, correo: string): Observable<ReservaResponse | { error: any }> {
    return this.api.put<ReservaResponse>(`/reservas/publica/${id}/confirmar?correo=${encodeURIComponent(correo)}`, {}, { skipAuth: true } as any).pipe(
      map((res: any) => {
        if ((res as any)?.error) return res;
        if (res.id) return res as ReservaResponse;
        return { error: { message: 'Error al confirmar reserva' } } as any;
      })
    );
  }

  // Verificar disponibilidad antes de crear reserva
  verificarDisponibilidad(fecha: string, hora: string, cantidadPersonas: number, mesaId?: number): Observable<DisponibilidadResponse | { error: any }> {
    let url = `/reservas/publica/disponibilidad?fecha=${fecha}&hora=${hora}&cantidadPersonas=${cantidadPersonas}`;
    if (mesaId) {
      url += `&mesaId=${mesaId}`;
    }
    return this.api.get<DisponibilidadResponse>(url, { skipAuth: true } as any).pipe(
      map((res: any) => {
        if ((res as any)?.error) return res;
        return res as DisponibilidadResponse;
      })
    );
  }
}

