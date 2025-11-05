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
import { PedidoService, PedidoResponse, DetallePedido } from '../../../core/services/pedido.service';
import { EstadoService, EstadoResponse } from '../../../core/services/estado.service';
import { PedidoDetalleComponent } from '../pedido-detalle/pedido-detalle.component';

@Component({
  selector: 'app-vista-cocina',
  imports: [CommonModule, MatCardModule, MatIconModule, MatTableModule, MatProgressSpinnerModule, MatSnackBarModule, MatButtonModule, MatChipsModule, MatDialogModule],
  templateUrl: './vista-cocina.html',
  styleUrl: './vista-cocina.css'
})
export class VistaCocina implements OnInit, OnDestroy {
  loading = false;
  error: string | null = null;
  pedidos: PedidoResponse[] = [];
  estados: EstadoResponse[] = [];
  displayedColumns: string[] = ['id', 'mesa', 'hora', 'productos', 'estado', 'acciones'];
  filtroEstado = 'TODOS'; // TODOS, PENDIENTE, EN_PREPARACION, LISTO
  private destroy$ = new Subject<void>();

  constructor(
    private pedidoService: PedidoService,
    private estadoService: EstadoService,
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
    this.pedidoService.listar().pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        this.loading = false;
        if ((res as any)?.error) {
          this.error = 'Error al cargar pedidos';
          this.snack.open(this.error, 'Cerrar', { duration: 4000 });
        } else {
          this.pedidos = (res as PedidoResponse[]).filter(p => 
            this.filtroEstado === 'TODOS' || 
            p.estado?.toUpperCase() === this.filtroEstado
          );
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

  cambiarEstado(pedido: PedidoResponse, nuevoEstado: string): void {
    // Buscar estado por descripción (case-insensitive, permite variaciones)
    const estado = this.estados.find(e => {
      const desc = e.descripcion.toUpperCase();
      const buscar = nuevoEstado.toUpperCase();
      return desc === buscar || 
             desc.includes(buscar) || 
             buscar.includes(desc) ||
             (buscar === 'EN_PREPARACION' && (desc.includes('PREPARACION') || desc.includes('PREPARACIÓN')));
    });
    
    if (!estado) {
      this.snack.open(`Estado "${nuevoEstado}" no encontrado`, 'Cerrar', { duration: 3000 });
      return;
    }

    this.pedidoService.cambiarEstado(pedido.id, estado.id).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        if ((res as any)?.error) {
          this.snack.open('Error al cambiar estado', 'Cerrar', { duration: 3000 });
        } else {
          this.snack.open('Estado actualizado', 'Cerrar', { duration: 2000 });
          this.cargar();
        }
      },
      error: () => this.snack.open('Error de conexión', 'Cerrar', { duration: 3000 })
    });
  }

  getPedidosFiltrados(): PedidoResponse[] {
    if (this.filtroEstado === 'TODOS') return this.pedidos;
    return this.pedidos.filter(p => 
      p.estado?.toUpperCase() === this.filtroEstado
    );
  }

  getProductosResumen(detalles?: DetallePedido[]): string {
    if (!detalles || detalles.length === 0) return '-';
    return detalles.map(d => `${d.cantidad}x ${d.nombreProducto}`).join(', ');
  }

  getEstadoColor(estado?: string): string {
    const e = (estado || '').toUpperCase();
    if (e.includes('PENDIENTE')) return 'warn';
    if (e.includes('PREPARACION') || e.includes('PREPARACIÓN')) return 'primary';
    if (e.includes('LISTO')) return 'accent';
    return '';
  }
}

