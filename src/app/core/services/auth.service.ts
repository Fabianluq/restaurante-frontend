import { Injectable, signal } from '@angular/core';
import { ApiClientService } from './api-client.service';
import { LoginRequest, LoginResponse } from '../models/auth.models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  public userToken = signal<string | null>(null);
  public userData = signal<any | null>(null);

  constructor(private api: ApiClientService) {
    this.loadToken();
  }

  async login(payload: LoginRequest): Promise<LoginResponse> {
    // skipAuth para evitar enviar Authorization en la petición de login
    const res = await this.api.requestAndSet<any>('/auth/login', {
      method: 'POST',
      body: payload,
      skipAuth: true
    });

    // res ahora es normalizado por ApiClientService: debería ser datos: { token, rol } -> normalized to { token, rol }
    if ((res as any)?.error) {
      return { error: (res as any).error?.errorBody ?? (res as any).error ?? 'Login failed' };
    }

    const token = (res as any)?.token ?? null;
    const rol = (res as any)?.rol ?? (res as any)?.role ?? null;

    if (token) {
      this.saveToken(token);
      this.userData.set({ rol });
      return { token, user: this.userData(), rol };
    }

    return { error: 'Respuesta inesperada del servidor' };
  }

  saveToken(token: string) {
    this.userToken.set(token);
    localStorage.setItem('jwt', token);
  }

  loadToken() {
    const token = localStorage.getItem('jwt');
    if (token) this.userToken.set(token);
  }

  logout() {
    this.userToken.set(null);
    this.userData.set(null);
    localStorage.removeItem('jwt');
  }
}
