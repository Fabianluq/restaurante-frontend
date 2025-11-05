import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiClientService } from './api-client.service';

export interface SolicitarRecuperacionRequest {
  correo: string;
}

export interface SolicitarRecuperacionResponse {
  mensaje?: string;
  exito?: boolean;
}

export interface ResetearPasswordRequest {
  token: string;
  nuevaContrasenia: string;
}

export interface ResetearPasswordResponse {
  mensaje?: string;
  exito?: boolean;
}

export interface CambiarPasswordRequest {
  contraseniaActual: string;
  nuevaContrasenia: string;
}

export interface CambiarPasswordResponse {
  mensaje?: string;
  exito?: boolean;
}

interface ApiResponse {
  mensaje?: string;
  estado?: string;
  datos?: any;
  codigo?: number;
}

@Injectable({ providedIn: 'root' })
export class PasswordService {
  constructor(private api: ApiClientService) {}

  /**
   * Solicitar recuperación de contraseña por correo
   */
  solicitarRecuperacion(correo: string): Observable<SolicitarRecuperacionResponse | { error: any }> {
    const payload: SolicitarRecuperacionRequest = { correo };
    return this.api.post<ApiResponse>('/auth/recuperar-contrasenia', payload, { skipAuth: true }).pipe(
      map((res: any) => {
        if ((res as any)?.error) return res;
        const apiRes = res as ApiResponse;
        return {
          mensaje: apiRes.mensaje || 'Se ha enviado un correo con instrucciones para recuperar tu contraseña',
          exito: true
        };
      })
    );
  }

  /**
   * Resetear contraseña con token recibido por correo
   */
  resetearPassword(token: string, nuevaContrasenia: string): Observable<ResetearPasswordResponse | { error: any }> {
    const payload: ResetearPasswordRequest = { token, nuevaContrasenia };
    return this.api.post<ApiResponse>('/auth/resetear-contrasenia', payload, { skipAuth: true }).pipe(
      map((res: any) => {
        if ((res as any)?.error) return res;
        const apiRes = res as ApiResponse;
        return {
          mensaje: apiRes.mensaje || 'Contraseña restablecida exitosamente',
          exito: true
        };
      })
    );
  }

  /**
   * Cambiar contraseña cuando el usuario está autenticado
   */
  cambiarPassword(contraseniaActual: string, nuevaContrasenia: string): Observable<CambiarPasswordResponse | { error: any }> {
    const payload: CambiarPasswordRequest = { contraseniaActual, nuevaContrasenia };
    
    return this.api.put<ApiResponse>('/auth/cambiar-contrasenia', payload).pipe(
      map((res: any) => {
        // Si hay error, devolverlo directamente
        if ((res as any)?.error) {
          return res;
        }
        
        // Si la respuesta es null o vacía, el backend probablemente devolvió 200 OK sin body
        // Esto es común cuando la operación es exitosa pero no hay respuesta
        if (res === null || res === undefined) {
          return {
            mensaje: 'Contraseña cambiada exitosamente',
            exito: true
          };
        }
        
        // Si es un objeto ApiResponse con estructura { estado, datos, mensaje }
        const apiRes = res as ApiResponse;
        if (apiRes && (apiRes.mensaje || apiRes.estado === 'OK')) {
          return {
            mensaje: apiRes.mensaje || 'Contraseña cambiada exitosamente',
            exito: true
          };
        }
        
        // Si es un objeto simple con mensaje
        if (res && typeof res === 'object' && 'mensaje' in res) {
          return {
            mensaje: (res as any).mensaje || 'Contraseña cambiada exitosamente',
            exito: true
          };
        }
        
        // Por defecto, asumir éxito si no hay error
        return {
          mensaje: 'Contraseña cambiada exitosamente',
          exito: true
        };
      })
    );
  }
}
