import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { Subject, takeUntil } from 'rxjs';
import { ReservaService, ReservaRequest, DisponibilidadResponse } from '../../../core/services/reserva.service';

@Component({
  selector: 'app-crear-reserva',
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
    MatDatepickerModule,
    MatNativeDateModule,
    MatSelectModule,
    MatChipsModule
  ],
  templateUrl: './crear-reserva.html',
  styleUrl: './crear-reserva.css'
})
export class CrearReserva implements OnInit, OnDestroy {
  form: FormGroup;
  submitting = false;
  verificandoDisponibilidad = false;
  disponibilidad: DisponibilidadResponse | null = null;
  horariosDisponibles: string[] = [];
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private reservaService: ReservaService,
    private snack: MatSnackBar,
    private router: Router
  ) {
    // Generar horarios de 11:00 a 22:00 cada hora
    this.horariosDisponibles = [];
    for (let h = 11; h <= 22; h++) {
      this.horariosDisponibles.push(`${h.toString().padStart(2, '0')}:00`);
    }

    this.form = this.fb.group({
      fechaReserva: ['', [Validators.required]],
      horaReserva: ['', [Validators.required]],
      cantidadPersonas: [1, [Validators.required, Validators.min(1), Validators.max(20)]],
      nombreCliente: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(60)]],
      apellidoCliente: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(60)]],
      correoCliente: ['', [Validators.required, Validators.email]],
      telefonoCliente: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(20)]]
    });
  }

  ngOnInit(): void {
    // Establecer fecha mínima como hoy
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    // Escuchar cambios en fecha, hora y cantidad para verificar disponibilidad
    this.form.get('fechaReserva')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.verificarDisponibilidadSiCompleto();
    });

    this.form.get('horaReserva')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.verificarDisponibilidadSiCompleto();
    });

    this.form.get('cantidadPersonas')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.verificarDisponibilidadSiCompleto();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get fechaReserva() { return this.form.get('fechaReserva'); }
  get horaReserva() { return this.form.get('horaReserva'); }
  get cantidadPersonas() { return this.form.get('cantidadPersonas'); }
  get nombreCliente() { return this.form.get('nombreCliente'); }
  get apellidoCliente() { return this.form.get('apellidoCliente'); }
  get correoCliente() { return this.form.get('correoCliente'); }
  get telefonoCliente() { return this.form.get('telefonoCliente'); }

  verificarDisponibilidadSiCompleto(): void {
    const fecha = this.form.value.fechaReserva;
    const hora = this.form.value.horaReserva;
    const cantidad = this.form.value.cantidadPersonas;

    if (!fecha || !hora || !cantidad) {
      this.disponibilidad = null;
      return;
    }

    this.verificarDisponibilidad();
  }

  verificarDisponibilidad(): void {
    const fecha = this.form.value.fechaReserva;
    const hora = this.form.value.horaReserva;
    const cantidad = this.form.value.cantidadPersonas;

    if (!fecha || !hora || !cantidad) {
      return;
    }

    this.verificandoDisponibilidad = true;
    const fechaFormateada = fecha instanceof Date 
      ? `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`
      : fecha;

    this.reservaService.verificarDisponibilidad(fechaFormateada, hora, cantidad).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        this.verificandoDisponibilidad = false;
        if ((res as any)?.error) {
          this.disponibilidad = { disponible: false, mensaje: 'Error al verificar disponibilidad' };
        } else {
          this.disponibilidad = res as DisponibilidadResponse;
        }
      },
      error: () => {
        this.verificandoDisponibilidad = false;
        this.disponibilidad = { disponible: false, mensaje: 'Error de conexión' };
      }
    });
  }

  onSubmit(): void {
    console.log('onSubmit llamado', { 
      formValid: this.form.valid, 
      formValue: this.form.value,
      disponibilidad: this.disponibilidad 
    });

    if (this.form.invalid) {
      console.log('Formulario inválido:', this.form.errors);
      this.form.markAllAsTouched();
      this.snack.open('Por favor completa todos los campos correctamente', 'Cerrar', { duration: 3000 });
      return;
    }

    // Verificar disponibilidad si no se ha verificado o si no está disponible
    if (!this.disponibilidad || this.disponibilidad.disponible === false) {
      console.log('Verificando disponibilidad antes de crear...');
      
      const fecha = this.form.value.fechaReserva;
      const hora = this.form.value.horaReserva;
      const cantidad = this.form.value.cantidadPersonas;

      if (!fecha || !hora || !cantidad) {
        this.snack.open('Por favor completa fecha, hora y cantidad de personas', 'Cerrar', { duration: 3000 });
        return;
      }

      const fechaFormateada = fecha instanceof Date 
        ? `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`
        : fecha;

      // Verificar disponibilidad de forma síncrona antes de crear
      this.verificandoDisponibilidad = true;
      this.reservaService.verificarDisponibilidad(fechaFormateada, hora, cantidad).pipe(takeUntil(this.destroy$)).subscribe({
        next: (res) => {
          this.verificandoDisponibilidad = false;
          if ((res as any)?.error) {
            this.disponibilidad = { disponible: false, mensaje: 'Error al verificar disponibilidad' };
            this.snack.open('Error al verificar disponibilidad. Intenta nuevamente.', 'Cerrar', { duration: 3000 });
          } else {
            this.disponibilidad = res as DisponibilidadResponse;
            if (this.disponibilidad.disponible) {
              // Si hay disponibilidad, crear la reserva
              this.crearReserva();
            } else {
              this.snack.open(this.disponibilidad.mensaje || 'No hay disponibilidad para la fecha y hora seleccionadas. Por favor elige otra opción.', 'Cerrar', { duration: 4000 });
            }
          }
        },
        error: () => {
          this.verificandoDisponibilidad = false;
          this.disponibilidad = { disponible: false, mensaje: 'Error de conexión' };
          this.snack.open('Error al verificar disponibilidad. Intenta nuevamente.', 'Cerrar', { duration: 3000 });
        }
      });
      return;
    }

    // Si ya hay disponibilidad verificada, crear directamente
    this.crearReserva();
  }

  private crearReserva(): void {
    console.log('crearReserva llamado');
    this.submitting = true;

    const fecha = this.form.value.fechaReserva;
    const fechaFormateada = fecha instanceof Date 
      ? `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`
      : fecha;

    const reserva: ReservaRequest = {
      fechaReserva: fechaFormateada,
      horaReserva: this.form.value.horaReserva,
      cantidadPersonas: Number(this.form.value.cantidadPersonas),
      nombreCliente: this.form.value.nombreCliente.trim(),
      apellidoCliente: this.form.value.apellidoCliente.trim(),
      correoCliente: this.form.value.correoCliente.trim(),
      telefonoCliente: this.form.value.telefonoCliente.trim()
    };

    console.log('Enviando reserva:', reserva);

    this.reservaService.crearPublica(reserva).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        console.log('Respuesta del servicio:', res);
        this.submitting = false;
        if ((res as any)?.error) {
          const error = (res as any).error;
          console.error('Error en la respuesta:', error);
          let mensaje = 'Error al crear la reserva';
          
          if (error?.errorBody?.message) {
            mensaje = error.errorBody.message;
          } else if (error?.errorBody?.detail) {
            mensaje = error.errorBody.detail;
          } else if (error?.message) {
            mensaje = error.message;
          }
          
          this.snack.open(mensaje, 'Cerrar', { duration: 5000 });
        } else {
          console.log('Reserva creada exitosamente');
          const correo = reserva.correoCliente;
          this.snack.open('¡Reserva creada exitosamente! Te enviaremos un correo de confirmación.', 'Cerrar', { duration: 5000 });
          // Redirigir a mis reservas con el correo como parámetro
          setTimeout(() => {
            this.router.navigate(['/mis-reservas'], { queryParams: { correo } });
          }, 2000);
        }
      },
      error: (err) => {
        console.error('Error al crear reserva:', err);
        this.submitting = false;
        let mensaje = 'Error de conexión. Intenta nuevamente.';
        if (err?.error?.message) {
          mensaje = err.error.message;
        } else if (err?.message) {
          mensaje = err.message;
        }
        console.error('Detalles del error:', err);
        this.snack.open(mensaje, 'Cerrar', { duration: 5000 });
      }
    });
  }

  fechaMinima(): Date {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    return hoy;
  }

  fechaMaxima(): Date {
    const max = new Date();
    max.setDate(max.getDate() + 30); // Máximo 30 días adelante
    return max;
  }
}

