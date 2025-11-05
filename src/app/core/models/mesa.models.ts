export interface MesaResponse {
  id: number;
  numero: number;
  capacidad: number;
  estado: string;
  estadoId?: number;
}

export interface MesaRequest {
  id?: number;
  numero: number;
  capacidad: number;
  estadoId: number;
}

