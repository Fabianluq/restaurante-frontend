import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiClientService } from './api-client.service';

export interface CategoriaResponse {
  id: number;
  nombre: string;
  descripcion?: string;
}

interface ApiResponse {
  mensaje?: string;
  estado?: string;
  datos?: CategoriaResponse[];
  codigo?: number;
}

@Injectable({ providedIn: 'root' })
export class CategoriaService {
  constructor(private api: ApiClientService) {}

  listar(): Observable<CategoriaResponse[] | { error: any }> {
    return this.api.get<ApiResponse | CategoriaResponse[]>('/categorias').pipe(
      map((res: any) => {
        if ((res as any)?.error) return res;
        // Si viene envuelto en ApiResponse
        if (res.estado && res.datos) {
          return res.datos;
        }
        // Si viene como array directo
        return Array.isArray(res) ? res : [];
      })
    );
  }
}
