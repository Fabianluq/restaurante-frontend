import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { Subject, takeUntil } from 'rxjs';
import { PasswordService } from '../../../core/services/password.service';

@Component({
  selector: 'app-recuperar-contrasenia',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  templateUrl: './recuperar-contrasenia.html',
  styleUrl: './recuperar-contrasenia.css'
})
export class RecuperarContraseniaComponent implements OnInit, OnDestroy {
  form: FormGroup;
  loading = false;
  correoEnviado = false;
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private passwordService: PasswordService,
    private router: Router,
    private snack: MatSnackBar
  ) {
    this.form = this.fb.group({
      correo: ['', [Validators.required, Validators.email]]
    });
  }

  ngOnInit(): void {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    const correo = this.form.value.correo;

    this.passwordService.solicitarRecuperacion(correo).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        this.loading = false;
        if ((res as any)?.error) {
          const error = (res as any).error;
          let mensaje = 'Error al solicitar recuperación de contraseña';
          if (error?.message) {
            mensaje = error.message;
          } else if (error?.errorBody?.message) {
            mensaje = error.errorBody.message;
          }
          this.snack.open(mensaje, 'Cerrar', { duration: 4000 });
        } else {
          this.correoEnviado = true;
          this.snack.open(
            'Se ha enviado un correo con instrucciones para recuperar tu contraseña',
            'Cerrar',
            { duration: 5000 }
          );
        }
      },
      error: () => {
        this.loading = false;
        this.snack.open('Error de conexión. Intenta nuevamente.', 'Cerrar', { duration: 3000 });
      }
    });
  }

  volverALogin(): void {
    this.router.navigate(['/login']);
  }
}