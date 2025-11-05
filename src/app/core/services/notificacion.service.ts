import { Injectable } from '@angular/core';
import { Observable, interval, Subject, BehaviorSubject, of } from 'rxjs';
import { takeUntil, switchMap, catchError, tap, map } from 'rxjs/operators';
import { ReservaService, ReservaResponse } from './reserva.service';
import { PedidoService, PedidoResponse } from './pedido.service';
import { MatSnackBar } from '@angular/material/snack-bar';

export interface NotificacionCambio {
  tipo: 'reserva' | 'pedido' | 'mesa';
  accion: 'creada' | 'actualizada' | 'cancelada' | 'confirmada' | 'completada';
  id: number;
  mensaje: string;
  timestamp: Date;
}

@Injectable({ providedIn: 'root' })
export class NotificacionService {
  private notificaciones$ = new Subject<NotificacionCambio>();
  private pollingActivo$ = new BehaviorSubject<boolean>(false);
  private destroy$ = new Subject<void>();
  
  // Cache para comparar cambios
  private cacheReservas: Map<string, ReservaResponse[]> = new Map();
  private cachePedidos: Map<number, PedidoResponse[]> = new Map();

  constructor(
    private reservaService: ReservaService,
    private pedidoService: PedidoService,
    private snack: MatSnackBar
  ) {}

  /**
   * Inicia el polling automático para detectar cambios
   * @param intervaloMs Intervalo en milisegundos (default: 10 segundos)
   */
  iniciarPolling(intervaloMs: number = 10000): void {
    if (this.pollingActivo$.value) {
      return; // Ya está activo
    }

    this.pollingActivo$.next(true);

    interval(intervaloMs)
      .pipe(
        takeUntil(this.destroy$),
        switchMap(() => {
          // Aquí puedes agregar lógica para verificar cambios
          // Por ahora retornamos un observable vacío
          return new Observable<never>();
        }),
        catchError(err => {
          console.error('Error en polling:', err);
          return [];
        })
      )
      .subscribe();
  }

  /**
   * Detiene el polling automático
   */
  detenerPolling(): void {
    this.pollingActivo$.next(false);
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Observa cambios en reservas para un correo específico
   */
  observarReservas(correo: string): Observable<ReservaResponse[]> {
    return interval(10000).pipe(
      switchMap(() => 
        this.reservaService.listarPorCorreo(correo).pipe(
          map((res) => {
            if ((res as any)?.error) {
              return [] as ReservaResponse[];
            }
            return res as ReservaResponse[];
          }),
          catchError(() => of([] as ReservaResponse[]))
        )
      ),
      tap(reservas => {
        if (!Array.isArray(reservas)) return;
        
        const reservasArray = reservas as ReservaResponse[];
        const cacheKey = correo;
        const reservasAnteriores = this.cacheReservas.get(cacheKey) || [];
        
        // Comparar cambios
        const cambios = this.detectarCambiosReservas(reservasAnteriores, reservasArray);
        
        cambios.forEach(cambio => {
          this.notificaciones$.next(cambio);
          this.mostrarNotificacion(cambio);
        });
        
        this.cacheReservas.set(cacheKey, reservasArray);
      })
    );
  }

  /**
   * Detecta cambios entre dos arrays de reservas
   */
  private detectarCambiosReservas(
    anteriores: ReservaResponse[],
    actuales: ReservaResponse[]
  ): NotificacionCambio[] {
    const cambios: NotificacionCambio[] = [];
    const mapAnteriores = new Map(anteriores.map(r => [r.id, r]));
    
    actuales.forEach(reserva => {
      if (!reserva.id) return;
      
      const anterior = mapAnteriores.get(reserva.id);
      
      if (!anterior) {
        // Nueva reserva
        cambios.push({
          tipo: 'reserva',
          accion: 'creada',
          id: reserva.id,
          mensaje: `Nueva reserva creada para ${reserva.fechaReserva}`,
          timestamp: new Date()
        });
      } else {
        // Verificar cambio de estado
        const estadoAnterior = anterior.estadoReserva || anterior.estado || '';
        const estadoActual = reserva.estadoReserva || reserva.estado || '';
        
        if (estadoAnterior !== estadoActual) {
          let accion: 'actualizada' | 'cancelada' | 'confirmada' | 'completada' = 'actualizada';
          
          if (estadoActual.toLowerCase().includes('cancelada')) {
            accion = 'cancelada';
          } else if (estadoActual.toLowerCase().includes('confirmada')) {
            accion = 'confirmada';
          } else if (estadoActual.toLowerCase().includes('completada')) {
            accion = 'completada';
          }
          
          cambios.push({
            tipo: 'reserva',
            accion,
            id: reserva.id,
            mensaje: `Reserva ${accion}: Estado cambió de "${estadoAnterior}" a "${estadoActual}"`,
            timestamp: new Date()
          });
        }
      }
    });
    
    return cambios;
  }

  /**
   * Muestra una notificación visual al usuario
   */
  private mostrarNotificacion(cambio: NotificacionCambio): void {
    const iconos = {
      creada: 'add_circle',
      actualizada: 'update',
      cancelada: 'cancel',
      confirmada: 'check_circle',
      completada: 'done_all'
    };
    
    const icono = iconos[cambio.accion] || 'info';
    
    this.snack.open(cambio.mensaje, 'Cerrar', {
      duration: 5000,
      panelClass: ['notificacion-cambio']
    });
  }

  /**
   * Observable para suscribirse a notificaciones
   */
  getNotificaciones(): Observable<NotificacionCambio> {
    return this.notificaciones$.asObservable();
  }

  /**
   * Verifica si el polling está activo
   */
  estaPollingActivo(): boolean {
    return this.pollingActivo$.value;
  }
}

