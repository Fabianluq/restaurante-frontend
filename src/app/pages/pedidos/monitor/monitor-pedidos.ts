import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { Subject, takeUntil } from 'rxjs';
import { PedidoService, PedidoResponse } from '../../../core/services/pedido.service';
import { PedidoDetalleComponent } from '../pedido-detalle/pedido-detalle.component';

@Component({
  selector: 'app-monitor-pedidos',
  imports: [CommonModule, MatCardModule, MatIconModule, MatTableModule, MatProgressSpinnerModule, MatSnackBarModule, MatDialogModule, MatButtonModule],
  templateUrl: './monitor-pedidos.html',
  styleUrl: './monitor-pedidos.css'
})
export class MonitorPedidos implements OnInit, OnDestroy {
  loading = false;
  error: string | null = null;
  pedidos: PedidoResponse[] = [];
  displayedColumns: string[] = ['id','empleado','estado','total','hora','acciones'];
  private destroy$ = new Subject<void>();

  // KPIs
  total = 0;
  enCurso = 0;
  completados = 0;

  constructor(private pedidoService: PedidoService, private snack: MatSnackBar, private dialog: MatDialog) {}

  ngOnInit(): void { this.cargar(); }
  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  private calcularKPIs(): void {
    this.total = this.pedidos.length;
    const estadoLower = (e?: string) => (e || '').toLowerCase();
    this.enCurso = this.pedidos.filter(p => ['pendiente','en preparacion','en_preparacion','listo'].includes(estadoLower(p.estado))).length;
    this.completados = this.pedidos.filter(p => ['entregado','pagado','completado'].includes(estadoLower(p.estado))).length;
  }

  cargar(): void {
    this.loading = true; this.error = null;
    this.pedidoService.listar().pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        this.loading = false;
        if ((res as any)?.error) {
          this.error = 'Error al cargar pedidos';
          this.snack.open(this.error, 'Cerrar', { duration: 4000 });
        } else {
          this.pedidos = (res as PedidoResponse[]);
          this.calcularKPIs();
        }
      },
      error: () => { this.loading = false; this.error = 'Error de conexión'; this.snack.open(this.error, 'Cerrar', { duration: 4000 }); }
    });
  }

  verDetalle(pedido: PedidoResponse): void {
    this.dialog.open(PedidoDetalleComponent, {
      width: '600px',
      data: pedido
    });
  }

  getTotal(p: PedidoResponse): number {
    if (p.total !== undefined && p.total > 0) return p.total;
    if (p.detalles && p.detalles.length > 0) {
      return p.detalles.reduce((sum, d) => sum + (d.totalDetalle || 0), 0);
    }
    return 0;
  }
}


