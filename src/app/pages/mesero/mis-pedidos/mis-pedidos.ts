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
    
    this.pedidoService.listar().pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        this.loading = false;
        if ((res as any)?.error) {
          this.error = 'Error al cargar pedidos';
          this.snack.open(this.error, 'Cerrar', { duration: 4000 });
        } else {
          this.pedidos = res as PedidoResponse[];
          // Filtrar solo los pedidos del mesero actual
          if (user && user.id) {
            this.misPedidos = this.pedidos.filter(p => 
              p.empleadoNombre?.includes(user.nombre) || 
              String(p.empleado)?.includes(user.nombre) ||
              (p as any).empleadoId === user.id
            );
          } else {
            this.misPedidos = this.pedidos;
          }
        }
      },
      error: () => {
        this.loading = false;
        this.error = 'Error de conexión';
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
    const estado = this.estados.find(e => 
      e.descripcion.toUpperCase().includes('ENTREGADO')
    );
    if (!estado) {
      this.snack.open('Estado "Entregado" no encontrado', 'Cerrar', { duration: 3000 });
      return;
    }

    this.pedidoService.cambiarEstado(pedido.id, estado.id).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        if ((res as any)?.error) {
          this.snack.open('Error al cambiar estado', 'Cerrar', { duration: 3000 });
        } else {
          this.snack.open('Pedido marcado como entregado', 'Cerrar', { duration: 2000 });
          this.cargar();
        }
      },
      error: () => this.snack.open('Error de conexión', 'Cerrar', { duration: 3000 })
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
    const e = (estado || '').toUpperCase();
    if (e.includes('LISTO')) return 'accent';
    if (e.includes('ENTREGADO')) return 'primary';
    return '';
  }

  puedeMarcarEntregado(pedido: PedidoResponse): boolean {
    const estado = (pedido.estado || '').toUpperCase();
    return estado.includes('LISTO') || estado.includes('PREPARADO');
  }
}

