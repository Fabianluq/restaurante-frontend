import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { AuthService } from '../../core/services/auth.service';
import { EmpleadoService } from '../../core/services/empleado.service';
import { EmpleadoResponse } from '../../core/models/empleado.models';
import { Subject, takeUntil } from 'rxjs';
import { Router } from '@angular/router';
import { NavigationService } from '../../core/services/navigation.service';

@Component({
  selector: 'app-perfil',
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
    MatSnackBarModule,
    MatDividerModule
  ],
  templateUrl: './perfil.component.html',
  styleUrl: './perfil.component.css'
})
export class PerfilComponent implements OnInit, OnDestroy {
  empleado: EmpleadoResponse | null = null;
  loading = false;
  error: string | null = null;
  cambioContraseniaForm: FormGroup;
  mostrarCambioContrasenia = false;
  cambiandoContrasenia = false;
  private destroy$ = new Subject<void>();

  constructor(
    private auth: AuthService,
    private empleadoService: EmpleadoService,
    private fb: FormBuilder,
    private snack: MatSnackBar,
    private router: Router,
    private navigation: NavigationService
  ) {
    this.cambioContraseniaForm = this.fb.group({
      contraseniaActual: ['', Validators.required],
      contraseniaNueva: ['', [Validators.required, Validators.minLength(6)]],
      contraseniaNuevaConfirmar: ['', Validators.required]
    }, { validators: this.passwordsMatch });
  }

  ngOnInit(): void {
    this.cargarPerfil();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  cargarPerfil(): void {
    const user = this.auth.userData();
    if (!user || !user.id) {
      this.error = 'No se encontró información del usuario';
      return;
    }

    this.loading = true;
    this.error = null;

    this.empleadoService.buscarPorId(user.id).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        this.loading = false;
        if ((res as any)?.error) {
          this.error = 'Error al cargar el perfil';
          this.snack.open(this.error, 'Cerrar', { duration: 3000 });
        } else {
          this.empleado = res as EmpleadoResponse;
        }
      },
      error: () => {
        this.loading = false;
        this.error = 'Error de conexión';
        this.snack.open(this.error, 'Cerrar', { duration: 3000 });
      }
    });
  }

  toggleCambioContrasenia(): void {
    this.mostrarCambioContrasenia = !this.mostrarCambioContrasenia;
    if (!this.mostrarCambioContrasenia) {
      this.cambioContraseniaForm.reset();
    }
  }

  cambiarContrasenia(): void {
    if (this.cambioContraseniaForm.invalid) {
      this.cambioContraseniaForm.markAllAsTouched();
      return;
    }

    this.cambiandoContrasenia = true;
    const user = this.auth.userData();
    if (!user || !user.id) {
      this.snack.open('Error: No se encontró información del usuario', 'Cerrar', { duration: 3000 });
      this.cambiandoContrasenia = false;
      return;
    }

    const formValue = this.cambioContraseniaForm.value;
    
    // TODO: Implementar endpoint de cambio de contraseña cuando esté disponible en el backend
    // Por ahora mostramos un mensaje
    this.snack.open('Funcionalidad de cambio de contraseña próximamente disponible', 'Cerrar', { duration: 3000 });
    this.cambiandoContrasenia = false;
    this.mostrarCambioContrasenia = false;
    this.cambioContraseniaForm.reset();
  }

  passwordsMatch(group: FormGroup): { [key: string]: boolean } | null {
    const nueva = group.get('contraseniaNueva')?.value;
    const confirmar = group.get('contraseniaNuevaConfirmar')?.value;
    return nueva && confirmar && nueva === confirmar ? null : { mismatch: true };
  }

  volver(): void {
    this.navigation.goBackOr(['/dashboard']);
  }

  getIniciales(): string {
    if (!this.empleado) return 'U';
    return (this.empleado.nombre[0] || '') + (this.empleado.apellido[0] || '');
  }
}

