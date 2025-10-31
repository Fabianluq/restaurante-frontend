import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClientService } from './api-client.service';
import { ProductoRequest, ProductoResponse } from '../models/producto.models';

@Injectable({ providedIn: 'root' })
export class ProductoService {
  constructor(private api: ApiClientService) {}

  listar(): Observable<ProductoResponse[] | { error: any }> {
    return this.api.get<ProductoResponse[]>('/productos');
  }

  crear(payload: ProductoRequest): Observable<ProductoResponse | { error: any }> {
    return this.api.post<ProductoResponse>('/productos', payload);
  }

  actualizar(id: number, payload: ProductoRequest): Observable<ProductoResponse | { error: any }> {
    return this.api.put<ProductoResponse>(`/productos/${id}`, payload);
  }

  eliminar(id: number) {
    return this.api.delete(`/productos/${id}`);
  }

  buscarPorId(id: number): Observable<ProductoResponse | { error: any }> {
    return this.api.get<ProductoResponse>(`/productos/${id}`);
  }
}


