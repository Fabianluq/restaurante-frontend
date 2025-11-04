export interface EmpleadoResponse {
  id: number;
  nombre: string;
  apellido: string;
  correo: string;
  telefono?: string;
  rol: string;
}

export interface EmpleadoRequest {
  nombre: string;
  apellido: string;
  correo: string;
  telefono?: string;
  contrasenia: string;
  rolId: number;
}

export interface Rol {
  id: number;
  nombre: string;
  descripcion?: string;
}
