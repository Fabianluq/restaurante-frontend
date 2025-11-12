import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef, MatDialog } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject, takeUntil } from 'rxjs';
import { PedidoResponse, DetallePedido, PedidoService, DetallePedidoRequest } from '../../../core/services/pedido.service';
import { ProductoService } from '../../../core/services/producto.service';
import { ProductoResponse } from '../../../core/models/producto.models';

@Component({
  selector: 'app-pedido-detalle',
  imports: [CommonModule, MatDialogModule, MatCardModule, MatIconModule, MatChipsModule, MatButtonModule, MatSnackBarModule, MatProgressSpinnerModule],
  templateUrl: './pedido-detalle.component.html',
  styleUrl: './pedido-detalle.component.css'
})
export class PedidoDetalleComponent implements OnInit, OnDestroy {
  productos: ProductoResponse[] = [];
  productosPorCategoria: { categoria: string; productos: ProductoResponse[] }[] = [];
  loading = false;
  agregandoProducto = false;
  mostrarAgregarProducto = false;
  private destroy$ = new Subject<void>();

  constructor(
    public dialogRef: MatDialogRef<PedidoDetalleComponent>,
    @Inject(MAT_DIALOG_DATA) public pedido: PedidoResponse,
    private pedidoService: PedidoService,
    private productoService: ProductoService,
    private snack: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.cargarProductos();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  cargarProductos(): void {
    this.loading = true;
    this.productoService.listar().pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        this.loading = false;
        if (!(res as any)?.error) {
          this.productos = res as ProductoResponse[];
          this.organizarProductosPorCategoria();
        }
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  organizarProductosPorCategoria(): void {
    const categoriasMap = new Map<string, ProductoResponse[]>();
    this.productos.forEach(producto => {
      const categoria = producto.categoria || 'Sin categoría';
      if (!categoriasMap.has(categoria)) {
        categoriasMap.set(categoria, []);
      }
      categoriasMap.get(categoria)!.push(producto);
    });
    this.productosPorCategoria = Array.from(categoriasMap.entries()).map(([categoria, productos]) => ({
      categoria,
      productos
    }));
  }

  puedeAgregarProductos(): boolean {
    const estado = (this.pedido.estado || '').toLowerCase();
    return !estado.includes('cancelado') && !estado.includes('pagado');
  }

  agregarProductoAlPedido(producto: ProductoResponse): void {
    if (!this.puedeAgregarProductos()) {
      this.snack.open('No se pueden agregar productos a pedidos cancelados o pagados', 'Cerrar', { duration: 3000 });
      return;
    }

    this.agregandoProducto = true;
    const detalle: DetallePedidoRequest = {
      productoId: producto.id,
      cantidad: 1
    };

    this.pedidoService.agregarDetalle(this.pedido.id, detalle).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        this.agregandoProducto = false;
        if ((res as any)?.error) {
          const errorMsg = (res as any).error?.message || 'Error al agregar producto';
          this.snack.open(errorMsg, 'Cerrar', { duration: 4000 });
        } else {
          this.snack.open(`Producto "${producto.nombre}" agregado al pedido`, 'Cerrar', { duration: 3000 });
          // Recargar el pedido para actualizar los detalles
          this.pedidoService.buscarPorId(this.pedido.id).pipe(takeUntil(this.destroy$)).subscribe({
            next: (pedidoRes) => {
              if (!(pedidoRes as any)?.error) {
                this.pedido = pedidoRes as PedidoResponse;
              }
            }
          });
        }
      },
      error: (err) => {
        this.agregandoProducto = false;
        const errorMsg = err?.error?.message || 'Error de conexión';
        this.snack.open(errorMsg, 'Cerrar', { duration: 4000 });
      }
    });
  }

  getTotal(): number {
    return this.pedido.total || (this.pedido.detalles?.reduce((sum, d) => sum + d.totalDetalle, 0) || 0);
  }

  cerrar(): void {
    this.dialogRef.close();
  }

  getEstadoColor(estado?: string): string {
    const e = (estado || '').toLowerCase();
    if (e.includes('listo') || e.includes('completado')) return 'primary';
    if (e.includes('pendiente')) return 'warn';
    if (e.includes('preparacion')) return 'accent';
    return '';
  }
}

