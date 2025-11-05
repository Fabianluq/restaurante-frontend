import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
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
  selector: 'app-resetear-contrasenia',
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
  templateUrl: './resetear-contrasenia.html',
  styleUrl: './resetear-contrasenia.css'
})
export class ResetearContraseniaComponent implements OnInit, OnDestroy {
  form: FormGroup;
  loading = false;
  token: string | null = null;
  contraseniaRestablecida = false;
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private passwordService: PasswordService,
    private router: Router,
    private route: ActivatedRoute,
    private snack: MatSnackBar
  ) {
    this.form = this.fb.group({
      nuevaContrasenia: ['', [Validators.required, Validators.minLength(6)]],
      confirmarContrasenia: ['', Validators.required]
    }, { validators: this.passwordsMatch });
  }

  ngOnInit(): void {
    // Obtener token de la URL (query param o route param)
    this.token = this.route.snapshot.queryParams['token'] || this.route.snapshot.params['token'];
    if (!this.token) {
      this.snack.open('Token de recuperación no válido', 'Cerrar', { duration: 4000 });
      setTimeout(() => this.router.navigate(['/login']), 2000);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  passwordsMatch(group: FormGroup): { [key: string]: boolean } | null {
    const nueva = group.get('nuevaContrasenia')?.value;
    const confirmar = group.get('confirmarContrasenia')?.value;
    return nueva && confirmar && nueva === confirmar ? null : { mismatch: true };
  }

  onSubmit(): void {
    if (this.form.invalid || !this.token) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    const nuevaContrasenia = this.form.value.nuevaContrasenia;

    this.passwordService.resetearPassword(this.token, nuevaContrasenia).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        this.loading = false;
        if ((res as any)?.error) {
          const error = (res as any).error;
          let mensaje = 'Error al restablecer la contraseña';
          if (error?.message) {
            mensaje = error.message;
          } else if (error?.errorBody?.message) {
            mensaje = error.errorBody.message;
          }
          this.snack.open(mensaje, 'Cerrar', { duration: 4000 });
        } else {
          this.contraseniaRestablecida = true;
          this.snack.open('Contraseña restablecida exitosamente', 'Cerrar', { duration: 3000 });
          setTimeout(() => this.router.navigate(['/login']), 2000);
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