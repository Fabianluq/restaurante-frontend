export interface ProductoResponse {
  id: number;
  nombre: string;
  descripcion?: string;
  precio: number;
  categoriaId?: string;
  categoria?: string; // Alias para compatibilidad
  estadoId?: string;
  estado?: string; // Alias para compatibilidad
}

export interface ProductoRequest {
  nombre: string;
  descripcion?: string;
  precio: number;
  categoriaId: number;
  estadoId: number;
}


