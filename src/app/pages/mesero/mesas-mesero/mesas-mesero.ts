import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { Subject, takeUntil, forkJoin } from 'rxjs';
import { MesaService } from '../../../core/services/mesa.service';
import { MesaResponse } from '../../../core/models/mesa.models';
import { AuthService } from '../../../core/services/auth.service';
import { PedidoService, PedidoResponse } from '../../../core/services/pedido.service';

@Component({
  selector: 'app-mesas-mesero',
  imports: [CommonModule, MatCardModule, MatIconModule, MatProgressSpinnerModule, MatSnackBarModule, MatButtonModule, MatChipsModule],
  templateUrl: './mesas-mesero.html',
  styleUrl: './mesas-mesero.css'
})
export class MesasMesero implements OnInit, OnDestroy {
  loading = false;
  error: string | null = null;
  mesas: MesaResponse[] = [];
  pedidosActivos: PedidoResponse[] = [];
  mesasConPedidosActivos: Set<number> = new Set();
  private destroy$ = new Subject<void>();

  constructor(
    private mesaService: MesaService,
    private pedidoService: PedidoService,
    private auth: AuthService,
    private router: Router,
    private snack: MatSnackBar
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
    
    // Cargar mesas y pedidos en paralelo
    forkJoin({
      mesas: this.mesaService.listar(),
      pedidos: this.pedidoService.listar()
    }).pipe(takeUntil(this.destroy$)).subscribe({
      next: (resultados) => {
        this.loading = false;
        
        // Procesar mesas
        if ((resultados.mesas as any)?.error) {
          this.error = 'Error al cargar mesas';
          this.snack.open(this.error, 'Cerrar', { duration: 4000 });
          return;
        }
        this.mesas = Array.isArray(resultados.mesas) ? resultados.mesas : [];
        
        // Procesar pedidos activos
        if (!(resultados.pedidos as any)?.error) {
          const todosLosPedidos = Array.isArray(resultados.pedidos) ? resultados.pedidos : [];
          // Filtrar pedidos activos: Pendiente, En Preparación, Listo, Entregado
          // Excluir: Pagado, Cancelado
          this.pedidosActivos = todosLosPedidos.filter((p: PedidoResponse) => {
            const estado = (p.estado || '').toLowerCase();
            return estado !== 'pagado' && 
                   estado !== 'cancelado' && 
                   estado !== 'pago' &&
                   estado !== 'cancelar';
          });
          
          // Mapear mesas con pedidos activos
          this.mesasConPedidosActivos.clear();
          this.pedidosActivos.forEach((p: PedidoResponse) => {
            if (p.mesaNumero) {
              const mesa = this.mesas.find(m => m.numero === p.mesaNumero);
              if (mesa) {
                this.mesasConPedidosActivos.add(mesa.id);
              }
            }
          });
          
          console.log('[MesasMesero] Pedidos activos:', this.pedidosActivos.length);
          console.log('[MesasMesero] Mesas con pedidos activos:', Array.from(this.mesasConPedidosActivos));
        }
      },
      error: () => {
        this.loading = false;
        this.error = 'Error de conexión';
        this.snack.open(this.error, 'Cerrar', { duration: 4000 });
      }
    });
  }

  ocuparMesa(mesa: MesaResponse): void {
    const user = this.auth.userData();
    if (!user || !user.id) {
      this.snack.open('No se pudo obtener información del empleado', 'Cerrar', { duration: 3000 });
      return;
    }

    // Verificar que el usuario sea MESERO
    if (!this.auth.hasRole('MESERO')) {
      const rolActual = user.rol || this.auth.userRole() || 'desconocido';
      this.snack.open(`Solo los meseros pueden ocupar mesas. Tu rol actual es: ${rolActual}`, 'Cerrar', { duration: 4000 });
      return;
    }

    // Log para debugging
    console.log('[MesasMesero] Ocupando mesa:', {
      mesaId: mesa.id,
      empleadoId: user.id,
      rol: user.rol || this.auth.userRole(),
      token: this.auth.userToken() ? 'presente' : 'ausente'
    });

    this.mesaService.ocuparMesa(mesa.id, user.id).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        if ((res as any)?.error) {
          const error = (res as any).error;
          let mensaje = 'Error al ocupar la mesa';
          
          // Mensajes específicos según el tipo de error
          if (error?.status === 403) {
            mensaje = 'No tienes permisos para ocupar mesas. Verifica tu rol de usuario.';
          } else if (error?.status === 404) {
            mensaje = 'La mesa no fue encontrada';
          } else if (error?.errorBody?.message) {
            mensaje = error.errorBody.message;
          } else if (error?.message) {
            mensaje = error.message;
          }
          
          this.snack.open(mensaje, 'Cerrar', { duration: 4000 });
        } else {
          this.snack.open('Mesa ocupada exitosamente', 'Cerrar', { duration: 2000 });
          this.cargar();
        }
      },
      error: (err) => {
        // Manejar errores HTTP directamente
        let mensaje = 'Error de conexión';
        if (err?.status === 403) {
          mensaje = 'No tienes permisos para ocupar mesas. Contacta al administrador.';
        } else if (err?.status === 404) {
          mensaje = 'La mesa no fue encontrada';
        }
        this.snack.open(mensaje, 'Cerrar', { duration: 4000 });
      }
    });
  }

  crearPedido(mesa: MesaResponse): void {
    // Verificar si la mesa tiene pedido activo
    if (this.tienePedidoActivo(mesa)) {
      const pedido = this.getPedidoActivo(mesa);
      const estadoPedido = pedido?.estado || 'activo';
      this.snack.open(
        `La Mesa ${mesa.numero} ya tiene un pedido ${estadoPedido}. Completa o cancela el pedido actual antes de crear uno nuevo.`,
        'Cerrar',
        { duration: 5000 }
      );
      return;
    }
    
    this.router.navigate(['/mesero/pedidos/crear'], { queryParams: { mesaId: mesa.id } });
  }

  tienePedidoActivo(mesa: MesaResponse): boolean {
    return this.mesasConPedidosActivos.has(mesa.id);
  }

  getPedidoActivo(mesa: MesaResponse): PedidoResponse | undefined {
    return this.pedidosActivos.find((p: PedidoResponse) => p.mesaNumero === mesa.numero);
  }

  getEstadoColor(estado?: string): string {
    const e = (estado || '').toLowerCase();
    if (e.includes('disponible') || e.includes('libre')) return 'primary';
    if (e.includes('ocupada')) return 'warn';
    if (e.includes('reservada')) return 'accent';
    return '';
  }

  puedeCrearPedido(mesa: MesaResponse): boolean {
    // No puede crear pedido si ya tiene uno activo
    if (this.tienePedidoActivo(mesa)) {
      return false;
    }
    
    const estado = (mesa.estado || '').toLowerCase();
    return estado.includes('ocupada') || estado.includes('disponible');
  }

  getEstadoVisual(mesa: MesaResponse): string {
    if (this.tienePedidoActivo(mesa)) {
      const pedido = this.getPedidoActivo(mesa);
      return `Con pedido ${pedido?.estado || 'activo'}`;
    }
    return mesa.estado || 'Desconocido';
  }
}

