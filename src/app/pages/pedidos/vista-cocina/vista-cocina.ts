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
    // Usar endpoint específico para cocina según OpenAPI
    this.pedidoService.listarParaCocina().pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        this.loading = false;
        if ((res as any)?.error) {
          // Si falla el endpoint específico, intentar con el general
          this.pedidoService.listar().pipe(takeUntil(this.destroy$)).subscribe({
            next: (res2) => {
              if ((res2 as any)?.error) {
                this.error = 'Error al cargar pedidos';
                this.snack.open(this.error, 'Cerrar', { duration: 4000 });
              } else {
                // Cargar TODOS los pedidos, el filtrado se hace en getPedidosFiltrados()
                this.pedidos = res2 as PedidoResponse[];
                console.log('Pedidos cargados:', this.pedidos.map(p => ({ id: p.id, estado: p.estado })));
              }
            }
          });
        } else {
          // Cargar TODOS los pedidos, el filtrado se hace en getPedidosFiltrados()
          this.pedidos = res as PedidoResponse[];
          console.log('Pedidos cargados:', this.pedidos.map(p => ({ id: p.id, estado: p.estado })));
        }
      },
      error: () => {
        // Si falla, intentar con el endpoint general
        this.pedidoService.listar().pipe(takeUntil(this.destroy$)).subscribe({
          next: (res) => {
            this.loading = false;
            if ((res as any)?.error) {
              this.error = 'Error al cargar pedidos';
              this.snack.open(this.error, 'Cerrar', { duration: 4000 });
            } else {
              // Cargar TODOS los pedidos, el filtrado se hace en getPedidosFiltrados()
              this.pedidos = res as PedidoResponse[];
              console.log('Pedidos cargados:', this.pedidos.map(p => ({ id: p.id, estado: p.estado })));
            }
          },
          error: () => {
            this.loading = false;
            this.error = 'Error de conexión';
            this.snack.open(this.error, 'Cerrar', { duration: 4000 });
          }
        });
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
    // Mapeo de estados buscados a descripciones exactas del backend
    const mapEstados: { [key: string]: string[] } = {
      'EN_PREPARACION': ['En preparación', 'En preparacion', 'preparación', 'preparacion'],
      'LISTO': ['Listo'],
      'ENTREGADO': ['Entregado']
    };
    
    // Buscar estado por descripción exacta o variaciones
    const buscarDescripciones = mapEstados[nuevoEstado.toUpperCase()] || [nuevoEstado];
    const estado = this.estados.find(e => {
      const desc = e.descripcion.trim();
      return buscarDescripciones.some(buscar => 
        desc.toLowerCase() === buscar.toLowerCase() ||
        desc.toLowerCase().includes(buscar.toLowerCase()) ||
        buscar.toLowerCase().includes(desc.toLowerCase())
      );
    });
    
    if (!estado) {
      this.snack.open(`Estado "${nuevoEstado}" no encontrado. Estados disponibles: ${this.estados.map(e => e.descripcion).join(', ')}`, 'Cerrar', { duration: 5000 });
      console.error('Estados disponibles:', this.estados);
      console.error('Buscando estado:', nuevoEstado);
      return;
    }

    this.pedidoService.cambiarEstado(pedido.id, estado.id).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        if ((res as any)?.error) {
          const errorMsg = (res as any).error?.message || 'Error al cambiar estado';
          this.snack.open(errorMsg, 'Cerrar', { duration: 3000 });
          console.error('Error al cambiar estado:', res);
        } else {
          this.snack.open(`Pedido marcado como "${estado.descripcion}"`, 'Cerrar', { duration: 2000 });
          this.cargar();
        }
      },
      error: (err) => {
        console.error('Error al cambiar estado:', err);
        this.snack.open('Error de conexión', 'Cerrar', { duration: 3000 });
      }
    });
  }

  getPedidosFiltrados(): PedidoResponse[] {
    if (this.filtroEstado === 'TODOS') return this.pedidos;
    
    const filtro = this.filtroEstado.toUpperCase().trim();
    const filtrados = this.pedidos.filter(p => {
      if (filtro === 'PENDIENTE') {
        return this.esPendiente(p.estado);
      }
      
      if (filtro === 'EN_PREPARACION') {
        return this.esEnPreparacion(p.estado);
      }
      
      if (filtro === 'LISTO') {
        return this.esListo(p.estado);
      }
      
      // Fallback: comparación por nombre exacto
      const estadoPedido = (p.estado || '').trim().toLowerCase();
      const filtroLower = filtro.toLowerCase();
      return estadoPedido === filtroLower || estadoPedido.includes(filtroLower);
    });
    
    return filtrados;
  }

  getProductosResumen(detalles?: DetallePedido[]): string {
    if (!detalles || detalles.length === 0) return '-';
    return detalles.map(d => `${d.cantidad}x ${d.nombreProducto}`).join(', ');
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

  esPendiente(estado?: string): boolean {
    if (!estado) return false;
    const e = estado.trim();
    // Comparación exacta o insensible a mayúsculas/minúsculas
    return e.toLowerCase() === 'pendiente';
  }

  esEnPreparacion(estado?: string): boolean {
    if (!estado) return false;
    const e = estado.trim();
    // Comparación exacta: "En preparación"
    return e.toLowerCase() === 'en preparación' || 
           e.toLowerCase() === 'en preparacion' ||
           e.toLowerCase().includes('preparación') ||
           e.toLowerCase().includes('preparacion');
  }

  esListo(estado?: string): boolean {
    if (!estado) return false;
    const e = estado.trim();
    // Comparación exacta: "Listo" (sin espacios extra, sin "Entregado", sin "Preparación")
    const estadoLower = e.toLowerCase();
    return estadoLower === 'listo' && 
           !estadoLower.includes('entregado') && 
           !estadoLower.includes('preparación') &&
           !estadoLower.includes('preparacion');
  }
}

