export interface LoginRequest {
  correo: string;
  contrasenia: string;
}

export interface LoginResponse {
  token?: string;
  user?: any;
  rol?: string;
  error?: string;
}