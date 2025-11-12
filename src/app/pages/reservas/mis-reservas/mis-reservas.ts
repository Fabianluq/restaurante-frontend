import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { Subject, takeUntil, interval, startWith, switchMap } from 'rxjs';
import { ReservaService, ReservaResponse } from '../../../core/services/reserva.service';
import { ConfirmDialogComponent } from '../../../shared/confirm-dialog/confirm-dialog';
import { NotificacionService } from '../../../core/services/notificacion.service';

@Component({
  selector: 'app-mis-reservas',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTableModule,
    MatChipsModule,
    MatDialogModule
  ],
  templateUrl: './mis-reservas.html',
  styleUrl: './mis-reservas.css'
})
export class MisReservas implements OnInit, OnDestroy {
  form: FormGroup;
  reservas: ReservaResponse[] = [];
  loading = false;
  error: string | null = null;
  mostrarReservas = false;
  displayedColumns: string[] = ['fecha', 'hora', 'personas', 'mesa', 'estado', 'acciones'];
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private reservaService: ReservaService,
    private snack: MatSnackBar,
    private dialog: MatDialog,
    private notificacionService: NotificacionService
  ) {
    this.form = this.fb.group({
      correo: ['', [Validators.required, Validators.email]]
    });
  }

  ngOnInit(): void {
    // Intentar obtener el correo de los query params si existe
    const urlParams = new URLSearchParams(window.location.search);
    const correoParam = urlParams.get('correo');
    if (correoParam) {
      this.form.patchValue({ correo: correoParam });
      this.buscarReservas();
    }

    // Suscribirse a notificaciones de cambios
    this.notificacionService.getNotificaciones()
      .pipe(takeUntil(this.destroy$))
      .subscribe(notificacion => {
        // Las notificaciones ya se muestran automáticamente
        // Solo recargamos si es relevante
        if (notificacion.tipo === 'reserva' && this.mostrarReservas) {
          this.buscarReservas();
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get correo() { return this.form.get('correo'); }

  buscarReservas(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.snack.open('Por favor ingresa un correo electrónico válido', 'Cerrar', { duration: 3000 });
      return;
    }

    this.loading = true;
    this.error = null;
    const correo = this.form.value.correo.trim();

    this.reservaService.listarPorCorreo(correo).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        this.loading = false;
        if ((res as any)?.error) {
          const error = (res as any).error;
          let mensaje = 'Error al cargar las reservas';
          
          if (error?.errorBody?.message) {
            mensaje = error.errorBody.message;
          } else if (error?.errorBody?.detail) {
            mensaje = error.errorBody.detail;
          } else if (error?.message) {
            mensaje = error.message;
          }
          
          this.error = mensaje;
          this.reservas = [];
          this.mostrarReservas = false;
        } else {
          this.reservas = res as ReservaResponse[];
          this.mostrarReservas = true;
          if (this.reservas.length === 0) {
            this.snack.open('No se encontraron reservas para este correo', 'Cerrar', { duration: 3000 });
          } else {
            // Iniciar polling automático para actualizar en tiempo real
            this.iniciarPollingReservas(correo);
          }
        }
      },
      error: (err) => {
        this.loading = false;
        this.error = 'Error de conexión. Intenta nuevamente.';
        this.reservas = [];
        this.mostrarReservas = false;
        this.snack.open(this.error, 'Cerrar', { duration: 4000 });
      }
    });
  }

  iniciarPollingReservas(correo: string): void {
    // Polling cada 10 segundos para actualizar reservas
    interval(10000)
      .pipe(
        startWith(0),
        takeUntil(this.destroy$),
        switchMap(() => this.reservaService.listarPorCorreo(correo))
      )
      .subscribe({
        next: (res) => {
          if ((res as any)?.error) return;
          
          const nuevasReservas = res as ReservaResponse[];
          const reservasAnteriores = [...this.reservas];
          
          // Comparar cambios
          const hayCambios = this.detectarCambios(reservasAnteriores, nuevasReservas);
          
          if (hayCambios) {
            this.reservas = nuevasReservas;
            
            // Detectar qué cambió y mostrar notificación
            nuevasReservas.forEach(reserva => {
              const anterior = reservasAnteriores.find(r => r.id === reserva.id);
              if (anterior) {
                const estadoAnterior = anterior.estadoReserva || anterior.estado || '';
                const estadoActual = reserva.estadoReserva || reserva.estado || '';
                
                if (estadoAnterior !== estadoActual) {
                  let mensaje = '';
                  if (estadoActual.toLowerCase().includes('confirmada')) {
                    mensaje = `✅ Tu reserva del ${this.formatearFecha(reserva.fechaReserva)} ha sido confirmada`;
                  } else if (estadoActual.toLowerCase().includes('cancelada')) {
                    mensaje = `❌ Tu reserva del ${this.formatearFecha(reserva.fechaReserva)} ha sido cancelada`;
                  } else {
                    mensaje = `📝 Tu reserva del ${this.formatearFecha(reserva.fechaReserva)} ha cambiado de estado`;
                  }
                  
                  this.snack.open(mensaje, 'Cerrar', { 
                    duration: 5000,
                    panelClass: ['notificacion-cambio']
                  });
                }
              }
            });
          }
        },
        error: () => {
          // Silenciar errores de polling para no molestar al usuario
        }
      });
  }

  detectarCambios(anteriores: ReservaResponse[], actuales: ReservaResponse[]): boolean {
    if (anteriores.length !== actuales.length) return true;
    
    return anteriores.some(ant => {
      const act = actuales.find(a => a.id === ant.id);
      if (!act) return true;
      
      const estadoAnt = ant.estadoReserva || ant.estado || '';
      const estadoAct = act.estadoReserva || act.estado || '';
      
      return estadoAnt !== estadoAct;
    });
  }

  cancelarReserva(reserva: ReservaResponse): void {
    if (!reserva.id || !this.correo?.value) return;

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Cancelar Reserva',
        message: `¿Estás seguro de que deseas cancelar la reserva del ${this.formatearFecha(reserva.fechaReserva)} a las ${reserva.horaReserva}?`,
        icon: 'warning',
        confirmText: 'Sí, cancelar',
        cancelText: 'No'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loading = true;
        this.reservaService.cancelarPublica(reserva.id!, this.correo!.value).pipe(takeUntil(this.destroy$)).subscribe({
          next: (res) => {
            this.loading = false;
            if ((res as any)?.error) {
              const error = (res as any).error;
              let mensaje = 'Error al cancelar la reserva';
              
              if (error?.errorBody?.message) {
                mensaje = error.errorBody.message;
              } else if (error?.errorBody?.detail) {
                mensaje = error.errorBody.detail;
              } else if (error?.message) {
                mensaje = error.message;
              }
              
              this.snack.open(mensaje, 'Cerrar', { duration: 5000 });
            } else {
              // PUT exitoso - puede tener datos de la reserva o solo { success: true }
              const hasSuccess = (res as any)?.success === true;
              const hasData = (res as any)?.id !== undefined;
              
              if (hasSuccess || hasData) {
                this.snack.open('✅ Reserva cancelada exitosamente. Se enviará una notificación a tu correo.', 'Cerrar', { duration: 5000 });
                this.buscarReservas(); // Recargar la lista
              } else {
                // Respuesta inesperada pero no es error
                console.warn('Respuesta inesperada al cancelar reserva:', res);
                this.snack.open('✅ Reserva cancelada exitosamente. Se enviará una notificación a tu correo.', 'Cerrar', { duration: 5000 });
                this.buscarReservas();
              }
            }
          },
          error: (err) => {
            this.loading = false;
            this.snack.open('Error de conexión. Intenta nuevamente.', 'Cerrar', { duration: 4000 });
          }
        });
      }
    });
  }

  confirmarReserva(reserva: ReservaResponse): void {
    console.log('confirmarReserva llamado', { reserva, correo: this.correo?.value });
    
    if (!reserva.id || !this.correo?.value) {
      console.error('Faltan datos: reserva.id =', reserva.id, 'correo =', this.correo?.value);
      this.snack.open('Error: Faltan datos para confirmar la reserva', 'Cerrar', { duration: 3000 });
      return;
    }

    console.log('Abriendo diálogo de confirmación...');
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Confirmar Reserva',
        message: `¿Confirmas tu reserva del ${this.formatearFecha(reserva.fechaReserva)} a las ${reserva.horaReserva}?`,
        icon: 'check_circle',
        confirmText: 'Sí, confirmar',
        cancelText: 'No'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('Diálogo cerrado, resultado:', result);
      if (result) {
        console.log('Usuario confirmó, llamando al servicio...');
        this.loading = true;
        this.reservaService.confirmarPublica(reserva.id!, this.correo!.value).pipe(takeUntil(this.destroy$)).subscribe({
          next: (res) => {
            console.log('Respuesta del servicio:', res);
            this.loading = false;
            if ((res as any)?.error) {
              const error = (res as any).error;
              console.error('Error en la respuesta:', error);
              let mensaje = 'Error al confirmar la reserva';
              
              if (error?.errorBody?.message) {
                mensaje = error.errorBody.message;
              } else if (error?.errorBody?.detail) {
                mensaje = error.errorBody.detail;
              } else if (error?.message) {
                mensaje = error.message;
              }
              
              this.snack.open(mensaje, 'Cerrar', { duration: 5000 });
            } else {
              // PUT exitoso - puede tener datos de la reserva o solo { success: true }
              const hasSuccess = (res as any)?.success === true;
              const hasData = (res as any)?.id !== undefined;
              
              if (hasSuccess || hasData) {
                console.log('Reserva confirmada exitosamente');
                this.snack.open('✅ Reserva confirmada exitosamente. Se enviará una notificación de confirmación a tu correo.', 'Cerrar', { duration: 5000 });
                this.buscarReservas(); // Recargar la lista
              } else {
                // Respuesta inesperada pero no es error
                console.warn('Respuesta inesperada al confirmar reserva:', res);
                this.snack.open('✅ Reserva confirmada exitosamente. Se enviará una notificación de confirmación a tu correo.', 'Cerrar', { duration: 5000 });
                this.buscarReservas();
              }
            }
          },
          error: (err) => {
            console.error('Error al confirmar reserva:', err);
            this.loading = false;
            let mensajeError = 'Error de conexión. Intenta nuevamente.';
            if (err?.error?.message) {
              mensajeError = err.error.message;
            } else if (err?.message) {
              mensajeError = err.message;
            }
            this.snack.open(mensajeError, 'Cerrar', { duration: 4000 });
          }
        });
      } else {
        console.log('Usuario canceló la confirmación');
      }
    });
  }

  formatearFecha(fecha: string): string {
    if (!fecha) return '';
    const date = new Date(fecha);
    return date.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  getEstadoColor(estado: string | undefined): string {
    if (!estado) return 'primary';
    const estadoLower = estado.toLowerCase();
    if (estadoLower.includes('pendiente')) return 'warn';
    if (estadoLower.includes('confirmada')) return 'primary';
    if (estadoLower.includes('cancelada')) return '';
    if (estadoLower.includes('completada')) return 'accent';
    return 'primary';
  }

  puedeCancelar(reserva: ReservaResponse): boolean {
    const estado = reserva.estadoReserva || reserva.estado || '';
    const estadoLower = estado.toLowerCase();
    const puedeCancelar = !estadoLower.includes('cancelada') && !estadoLower.includes('completada');
    console.log('puedeCancelar:', { estado, estadoLower, puedeCancelar });
    return puedeCancelar;
  }

  puedeConfirmar(reserva: ReservaResponse): boolean {
    const estado = reserva.estadoReserva || reserva.estado || '';
    const estadoLower = estado.toLowerCase();
    // Permitir confirmar si está pendiente, nueva, o cualquier estado que no sea confirmada/cancelada/completada
    const puedeConfirmar = estadoLower.includes('pendiente') || 
                          estadoLower.includes('nueva') || 
                          (!estadoLower.includes('confirmada') && 
                           !estadoLower.includes('cancelada') && 
                           !estadoLower.includes('completada') &&
                           estado !== '');
    console.log('puedeConfirmar:', { estado, estadoLower, puedeConfirmar, reservaId: reserva.id });
    return puedeConfirmar;
  }
}

