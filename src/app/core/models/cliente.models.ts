export interface ClienteResponse {
  id: number;
  nombre: string;
  apellido?: string;
  correo: string;
  telefono?: string;
  direccion?: string;
}

export interface ClienteRequest {
  nombre: string;
  apellido?: string;
  correo: string;
  telefono?: string;
  direccion?: string;
}

