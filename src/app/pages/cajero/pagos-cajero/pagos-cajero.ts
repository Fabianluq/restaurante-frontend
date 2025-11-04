import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
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
import { PagoService } from '../../../core/services/pago.service';
import { PedidoDetalleComponent } from '../../pedidos/pedido-detalle/pedido-detalle.component';
import { ProcesarPagoComponent } from '../procesar-pago/procesar-pago';

@Component({
  selector: 'app-pagos-cajero',
  imports: [CommonModule, MatCardModule, MatIconModule, MatTableModule, MatProgressSpinnerModule, MatSnackBarModule, MatButtonModule, MatChipsModule, MatDialogModule],
  templateUrl: './pagos-cajero.html',
  styleUrl: './pagos-cajero.css'
})
export class PagosCajero implements OnInit, OnDestroy {
  loading = false;
  error: string | null = null;
  pedidos: PedidoResponse[] = [];
  pedidosListos: PedidoResponse[] = [];
  displayedColumns: string[] = ['id', 'mesa', 'cliente', 'total', 'hora', 'acciones'];
  private destroy$ = new Subject<void>();

  constructor(
    private pedidoService: PedidoService,
    private pagoService: PagoService,
    private snack: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.cargar();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  cargar(): void {
    this.loading = true;
    this.error = null;
    this.pedidoService.listar().pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        this.loading = false;
        if ((res as any)?.error) {
          this.error = 'Error al cargar pedidos';
          this.snack.open(this.error, 'Cerrar', { duration: 4000 });
        } else {
          this.pedidos = res as PedidoResponse[];
          // Filtrar solo pedidos listos para cobrar (LISTO, ENTREGADO)
          this.pedidosListos = this.pedidos.filter(p => {
            const estado = (p.estado || '').toUpperCase();
            return estado.includes('LISTO') || 
                   estado.includes('ENTREGADO') || 
                   estado.includes('PREPARADO');
          });
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

  procesarPago(pedido: PedidoResponse): void {
    const dialogRef = this.dialog.open(ProcesarPagoComponent, {
      width: '500px',
      data: pedido
    });

    dialogRef.afterClosed().pipe(takeUntil(this.destroy$)).subscribe(result => {
      if (result === 'success') {
        this.cargar();
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
}

