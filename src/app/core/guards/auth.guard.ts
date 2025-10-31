import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(private auth: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot): boolean | UrlTree {
    if (!this.auth.isAuthenticated()) {
      return this.router.parseUrl('/login');
    }

    // Verificar roles requeridos si se especifican en la ruta
    const requiredRoles = route.data['roles'] as string[];
    if (requiredRoles && requiredRoles.length > 0) {
      const hasRole = this.auth.hasAnyRole(...requiredRoles);
      if (!hasRole) {
        console.warn('[AuthGuard] Acceso denegado - roles requeridos:', requiredRoles);
        return this.router.parseUrl('/dashboard');
      }
    }

    return true;
  }
}
