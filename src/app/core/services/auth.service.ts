import { Injectable, signal } from '@angular/core';
import { ApiClientService } from './api-client.service';
import { LoginRequest, LoginResponse } from '../models/auth.models';
import { EmpleadoResponse } from '../models/empleado.models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  public userToken = signal<string | null>(null);
  public userData = signal<EmpleadoResponse | null>(null);
  public userRole = signal<string | null>(null);
  public userError = signal<string | null>(null);

  constructor(private api: ApiClientService) {
    this.loadToken();
  }

  async login(payload: LoginRequest): Promise<LoginResponse> {
    const res = await this.api.requestAndSet<any>('/auth/login', {
      method: 'POST',
      body: payload,
      skipAuth: true
    });

    if ((res as any)?.error) {
      return { error: (res as any).error?.errorBody ?? (res as any).error ?? 'Login failed' };
    }

    const token = (res as any)?.token ?? null;
    if (!token) return { error: 'Respuesta inesperada del servidor' };

    this.saveToken(token);
    await this.initFromToken(token);
    return { token, user: this.userData(), rol: this.userRole() ?? this.userData()?.rol ?? null };
  }

  saveToken(token: string) {
    this.userToken.set(token);
    localStorage.setItem('jwt', token);
  }

  loadToken() {
    const token = localStorage.getItem('jwt');
    if (token) {
      this.userToken.set(token);
      void this.initFromToken(token);
    }
  }

  logout() {
    this.userToken.set(null);
    this.userData.set(null);
    this.userRole.set(null);
    localStorage.removeItem('jwt');
  }

  isAuthenticated(): boolean {
    const token = this.userToken();
    return token != null && this.isTokenValid(token);
  }

  hasRole(role: string): boolean {
    const r = this.userRole();
    if (r) return r === role.toUpperCase();
    const data = this.userData();
    return !!data && String(data.rol).toUpperCase() === role.toUpperCase();
  }

  hasAnyRole(...roles: string[]): boolean {
    const r = this.userRole();
    if (r) return roles.map(x => x.toUpperCase()).includes(r);
    const data = this.userData();
    if (!data || !data.rol) return false;
    const userRole = String(data.rol).toUpperCase();
    return roles.map(x => x.toUpperCase()).includes(userRole);
  }

  private isTokenValid(token: string): boolean {
    try {
      const payloadRaw = token.split('.')[1];
      if (!payloadRaw) return false;
      const json = atob(payloadRaw.replace(/-/g, '+').replace(/_/g, '/'));
      const payload = JSON.parse(json);
      if (!payload || !payload.exp) return false;
      const nowSec = Math.floor(Date.now() / 1000);
      return payload.exp > nowSec;
    } catch {
      return false;
    }
  }

  private decodePayload(token: string): any | null {
    try {
      const payloadRaw = token.split('.')[1];
      if (!payloadRaw) return null;
      const json = atob(payloadRaw.replace(/-/g, '+').replace(/_/g, '/'));
      return JSON.parse(json);
    } catch {
      return null;
    }
  }

  private async initFromToken(token: string) {
    if (!this.isTokenValid(token)) {
      this.logout();
      return;
    }

    const payload = this.decodePayload(token);
    console.log('[Auth] token payload:', payload);
    if (!payload) {
      this.logout();
      return;
    }

    const rol = payload.rol ?? payload.role ?? null;
    if (rol) this.userRole.set(String(rol).toUpperCase());

    const possibleId =  payload.id  ?? null;
    if (!possibleId) {
      console.warn('[Auth] no se encontró id en token; payload keys:', Object.keys(payload));
      this.logout();
      return;
    }

    const idForPath =
      typeof possibleId === 'string' && /^\d+$/.test(possibleId) ? Number(possibleId) : possibleId;

    await this.fetchCurrentUserById(idForPath);
  }

  private async fetchCurrentUserById(id: string | number): Promise<void> {
  if (!id) {
    this.userError.set('Id de usuario inválido');
    this.userData.set(null);
    return;
  }

  try {
    const res: any = await this.api.requestAndSet<EmpleadoResponse>(`/empleados/${id}`, { method: 'GET' });
    console.log('[Auth] fetch response:', res);

    if ((res as any)?.error) {
      const err = (res as any).error;
      console.warn('[Auth] fetch error:', err);
      this.userData.set(null);
      this.userError.set(
        err?.message ?? (typeof err === 'string' ? err : 'Error al obtener datos del usuario')
      );
      return;
    }

    this.userError.set(null);
    this.userData.set(res as EmpleadoResponse);

    if (!this.userRole() && (res as EmpleadoResponse).rol) {
      this.userRole.set((res as EmpleadoResponse).rol.toUpperCase());
    }

    console.log('[Auth] userData set:', this.userData());
  } catch (e: any) {
    console.error('[Auth] fetch failed', e);
    this.userData.set(null);
    this.userError.set(e?.message ?? 'Error en la petición al servidor');
  }
}
}
