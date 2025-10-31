export interface MesaResponse {
  id: number;
  numero: string;
  capacidad: number;
  estado: string;
  ubicacion?: string;
}

export interface MesaRequest {
  numero: string;
  capacidad: number;
  estado?: string;
  ubicacion?: string;
}

