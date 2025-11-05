import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { AuthService } from '../../core/services/auth.service';
import { ReporteService, ReporteVentas } from '../../core/services/reporte.service';
import { PedidoService } from '../../core/services/pedido.service';
import { Subject, firstValueFrom } from 'rxjs';

interface RecentActivity {
  time: string;
  activity: string;
  details: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatTableModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {
  reporte: ReporteVentas | null = null;
  recentActivities: RecentActivity[] = [];
  displayedColumns: string[] = ['time', 'activity', 'details'];
  private destroy$ = new Subject<void>();

  constructor(
    public auth: AuthService,
    private reporteService: ReporteService,
    private pedidoService: PedidoService,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (this.auth.hasRole('ADMIN')) {
      this.cargarReportes();
      this.cargarActividadesRecientes();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  async cargarReportes(): Promise<void> {
    try {
      this.reporte = await this.reporteService.obtenerDatosReporte();
    } catch (error) {
      console.error('Error cargando reportes:', error);
    }
  }

  async cargarActividadesRecientes(): Promise<void> {
    try {
      const pedidos = await firstValueFrom(this.pedidoService.listar());
      if (Array.isArray(pedidos) && pedidos.length > 0) {
        const ultimosPedidos = pedidos.slice(0, 10).reverse();
        this.recentActivities = ultimosPedidos.map((pedido) => {
          const hora = pedido.horaPedido || new Date().toLocaleTimeString('es-ES', { 
            hour: '2-digit', 
            minute: '2-digit' 
          });
          
          let activity = '';
          let details = '';
          
          if (pedido.estado === 'Pendiente') {
            activity = 'Nuevo Pedido';
            details = `Pedido #${pedido.id} - ${pedido.clienteNombre || 'Cliente'}`;
          } else if (pedido.estado === 'En preparación') {
            activity = 'En Preparación';
            details = `Pedido #${pedido.id} está siendo preparado`;
          } else if (pedido.estado === 'Listo') {
            activity = 'Pedido Listo';
            details = `Pedido #${pedido.id} completado`;
          } else if (pedido.estado === 'Entregado') {
            activity = 'Pedido Entregado';
            details = `Pedido #${pedido.id} - Mesa ${pedido.mesaNumero || 'N/A'}`;
          } else if (pedido.estado === 'Pagado') {
            activity = 'Pago Recibido';
            const total = pedido.total || 0;
            details = `Pedido #${pedido.id} - ${this.formatearMoneda(total)}`;
          } else {
            activity = 'Pedido Actualizado';
            details = `Pedido #${pedido.id} - Estado: ${pedido.estado}`;
          }
          
          return {
            time: this.formatearHora(hora),
            activity: activity,
            details: details
          };
        });
      }
    } catch (error) {
      console.error('Error cargando actividades:', error);
    }
  }

  formatearHora(hora: string): string {
    try {
      const [h, m] = hora.split(':');
      const horas = parseInt(h);
      const minutos = m ? parseInt(m.split(' ')[0]) : 0;
      const periodo = horas >= 12 ? 'PM' : 'AM';
      const horas12 = horas > 12 ? horas - 12 : horas === 0 ? 12 : horas;
      return `${horas12}:${minutos.toString().padStart(2, '0')} ${periodo}`;
    } catch {
      return hora;
    }
  }

  formatearMoneda(valor: number): string {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(valor);
  }
}
