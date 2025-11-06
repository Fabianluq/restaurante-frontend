import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { Subject, takeUntil } from 'rxjs';
import { PedidoService, PedidoResponse } from '../../../core/services/pedido.service';
import { EstadoService, EstadoResponse } from '../../../core/services/estado.service';
import { AuthService } from '../../../core/services/auth.service';
import { PedidoDetalleComponent } from '../../pedidos/pedido-detalle/pedido-detalle.component';

@Component({
  selector: 'app-mis-pedidos',
  imports: [CommonModule, RouterModule, MatCardModule, MatIconModule, MatTableModule, MatProgressSpinnerModule, MatSnackBarModule, MatButtonModule, MatChipsModule, MatDialogModule],
  templateUrl: './mis-pedidos.html',
  styleUrl: './mis-pedidos.css'
})
export class MisPedidos implements OnInit, OnDestroy {
  loading = false;
  error: string | null = null;
  pedidos: PedidoResponse[] = [];
  misPedidos: PedidoResponse[] = [];
  estados: EstadoResponse[] = [];
  displayedColumns: string[] = ['id', 'mesa', 'cliente', 'total', 'estado', 'hora', 'acciones'];
  private destroy$ = new Subject<void>();

  constructor(
    private pedidoService: PedidoService,
    private estadoService: EstadoService,
    private auth: AuthService,
    private snack: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.cargarEstados();
    this.cargar();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  cargarEstados(): void {
    this.estadoService.listarEstadosPedidos().pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        if ((res as any)?.error) return;
        this.estados = res as EstadoResponse[];
      }
    });
  }

  cargar(): void {
    this.loading = true;
    this.error = null;
    const user = this.auth.userData();
    
    // Usar el endpoint específico que valida en el backend que MESERO solo vea sus pedidos
    if (!user || !user.id) {
      this.loading = false;
      this.error = 'Usuario no autenticado';
      this.snack.open(this.error, 'Cerrar', { duration: 4000 });
      return;
    }
    
    this.pedidoService.listarPorEmpleado(user.id).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        this.loading = false;
        if ((res as any)?.error) {
          const errorMsg = (res as any).error?.message || 'Error al cargar pedidos';
          this.error = errorMsg;
          this.snack.open(errorMsg, 'Cerrar', { duration: 4000 });
        } else {
          this.misPedidos = res as PedidoResponse[];
          this.pedidos = this.misPedidos; // Mantener compatibilidad
        }
      },
      error: (err) => {
        this.loading = false;
        this.error = 'Error de conexión';
        console.error('Error al cargar pedidos:', err);
        this.snack.open(this.error, 'Cerrar', { duration: 4000 });
      }
    });
  }

  verDetalle(pedido: PedidoResponse): void {
    this.dialog.open(PedidoDetalleComponent, {
      width: '600px',
      data: pedido
    });
  }

  marcarEntregado(pedido: PedidoResponse): void {
    // Buscar estado "Entregado" exacto
    const estado = this.estados.find(e => 
      e.descripcion.trim().toLowerCase() === 'entregado' ||
      e.descripcion.toLowerCase().includes('entregado')
    );
    
    if (!estado) {
      this.snack.open(`Estado "Entregado" no encontrado. Estados disponibles: ${this.estados.map(e => e.descripcion).join(', ')}`, 'Cerrar', { duration: 5000 });
      console.error('Estados disponibles:', this.estados);
      return;
    }

    console.log('Marcando pedido como entregado:', { pedidoId: pedido.id, estadoId: estado.id, estadoDescripcion: estado.descripcion, estadoActual: pedido.estado });

    this.pedidoService.cambiarEstado(pedido.id, estado.id).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        console.log('Respuesta del servicio cambiarEstado:', res);
        if ((res as any)?.error) {
          const error = (res as any).error;
          console.error('Error al cambiar estado:', error);
          
          let errorMsg = 'Error al cambiar estado';
          // Intentar extraer el mensaje de error de diferentes lugares
          if (error?.message) {
            errorMsg = error.message;
          } else if (error?.errorBody?.message) {
            errorMsg = error.errorBody.message;
          } else if (error?.errorBody?.detail) {
            errorMsg = error.errorBody.detail;
          } else if (error?.mensaje) {
            errorMsg = error.mensaje;
          } else if (typeof error === 'string') {
            errorMsg = error;
          }
          
          this.snack.open(errorMsg, 'Cerrar', { duration: 5000 });
        } else {
          this.snack.open(`Pedido marcado como "${estado.descripcion}"`, 'Cerrar', { duration: 2000 });
          this.cargar();
        }
      },
      error: (err) => {
        console.error('Error HTTP al cambiar estado:', err);
        let errorMsg = 'Error de conexión';
        
        // Intentar extraer el mensaje del error HTTP
        if (err?.error?.mensaje) {
          errorMsg = err.error.mensaje;
        } else if (err?.error?.message) {
          errorMsg = err.error.message;
        } else if (err?.error?.errorBody?.message) {
          errorMsg = err.error.errorBody.message;
        } else if (err?.error?.errorBody?.detail) {
          errorMsg = err.error.errorBody.detail;
        } else if (err?.message) {
          errorMsg = err.message;
        }
        
        this.snack.open(errorMsg, 'Cerrar', { duration: 5000 });
      }
    });
  }

  getTotal(p: PedidoResponse): number {
    if (p.total !== undefined && p.total > 0) return p.total;
    if (p.detalles && p.detalles.length > 0) {
      return p.detalles.reduce((sum, d) => sum + (d.totalDetalle || 0), 0);
    }
    return 0;
  }

  getEstadoColor(estado?: string): string {
    if (!estado) return '';
    const e = estado.trim().toLowerCase();
    if (e === 'pendiente') return 'warn';
    if (e === 'en preparación' || e === 'en preparacion' || e.includes('preparación') || e.includes('preparacion')) return 'primary';
    if (e === 'listo') return 'accent';
    if (e === 'entregado') return 'primary';
    if (e === 'pagado') return 'accent';
    if (e === 'cancelado') return 'warn';
    return '';
  }

  puedeMarcarEntregado(pedido: PedidoResponse): boolean {
    if (!pedido.estado) return false;
    const estado = pedido.estado.trim().toLowerCase();
    // Solo puede marcar como entregado si está "Listo" (no "En preparación" ni ya "Entregado")
    return estado === 'listo' && 
           !estado.includes('entregado') && 
           !estado.includes('preparación') &&
           !estado.includes('preparacion');
  }

  estaEntregado(pedido: PedidoResponse): boolean {
    if (!pedido.estado) return false;
    const estado = pedido.estado.trim().toLowerCase();
    return estado === 'entregado' || estado.includes('entregado');
  }
}

