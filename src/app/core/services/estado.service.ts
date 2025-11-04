import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
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
    return this.api.get<ApiResponse>('/estados/pedidos').pipe(
      map((res: any) => {
        if ((res as any)?.error) return res;
        const apiRes = res as ApiResponse;
        return apiRes.datos || [];
      })
    );
  }

  listarEstadosMesas(): Observable<EstadoResponse[] | { error: any }> {
    return this.api.get<ApiResponse>('/estados/mesas').pipe(
      map((res: any) => {
        if ((res as any)?.error) return res;
        const apiRes = res as ApiResponse;
        return apiRes.datos || [];
      })
    );
  }

  listarEstadosProductos(): Observable<EstadoResponse[] | { error: any }> {
    return this.api.get<ApiResponse>('/estados/productos').pipe(
      map((res: any) => {
        if ((res as any)?.error) return res;
        const apiRes = res as ApiResponse;
        return apiRes.datos || [];
      })
    );
  }
}

