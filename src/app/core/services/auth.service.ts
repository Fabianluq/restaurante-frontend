import { Injectable, signal } from '@angular/core';
import { ApiClientService } from './api-client.service';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: any;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  public userToken = signal<string | null>(null); 
  public userData = signal<any | null>(null);     

  constructor(private api: ApiClientService) {}

  login(payload: LoginRequest) {
    this.api.request('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    return this.api.apiResource.value; 
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
