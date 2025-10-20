import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { ApiClientService } from '../../core/services/api-client.service';
import { EmpleadoResponse } from '../../core/models/empleado.models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
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
    const res = await this.api.requestAndSet<EmpleadoResponse[]>('/empleados', { method: 'GET' });
    this.loadingEmpleados = false;

    if ((res as any)?.error) {
      console.warn('[Dashboard] error cargando empleados:', (res as any).error);
      return;
    }

    this.empleados = res as EmpleadoResponse[];
  }

  goToAdd() {
    void this.router.navigate(['/empleados/add']);
  }
}
