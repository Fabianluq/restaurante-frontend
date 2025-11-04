import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatToolbarModule } from '@angular/material/toolbar';
import { AuthService } from '../../core/services/auth.service';
import { ApiClientService } from '../../core/services/api-client.service';
import { EmpleadoResponse } from '../../core/models/empleado.models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule, MatCardModule, MatToolbarModule, RouterModule],
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent implements OnInit {
  public empleados: EmpleadoResponse[] = [];
  public loadingEmpleados = false;

  constructor(
    public auth: AuthService,
    private api: ApiClientService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // opcional: cargar lista de empleados para la vista
    void this.loadEmpleados();
  }

  logout() {
    this.auth.logout();
    void this.router.navigate(['/login']);
  }

  async loadEmpleados() {
    this.loadingEmpleados = true;
    try {
      const res = await this.api.requestAndSet<EmpleadoResponse[]>('/empleados', { method: 'GET' });

      if ((res as any)?.error) {
        console.warn('[Dashboard] error cargando empleados:', (res as any).error);
        this.empleados = [];
        return;
      }

      this.empleados = res as EmpleadoResponse[];
    } catch (error) {
      console.error('[Dashboard] error de conexión:', error);
      this.empleados = [];
    } finally {
      this.loadingEmpleados = false;
    }
  }

  goToAdd() {
    void this.router.navigate(['/empleados/add']);
  }

  goToProfile() {
    void this.router.navigate(['/perfil']);
  }
}
