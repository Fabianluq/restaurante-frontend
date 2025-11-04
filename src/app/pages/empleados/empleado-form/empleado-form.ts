import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router } from '@angular/router';
import { NavigationService } from '../../../core/services/navigation.service';
import { EmpleadoService } from '../../../core/services/empleado.service';
import { EmpleadoRequest, EmpleadoResponse, Rol } from '../../../core/models/empleado.models';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-empleado-form',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatIconModule
  ],
  templateUrl: './empleado-form.html',
  styleUrl: './empleado-form.css'
})
export class EmpleadoForm implements OnInit, OnDestroy {
  empleadoForm: FormGroup;
  isEditMode = false;
  empleadoId: number | null = null;
  loading = false;
  saving = false;
  hidePassword = true;

  roles: Rol[] = [];
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private empleadoService: EmpleadoService,
    private router: Router,
    private nav: NavigationService,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar
  ) {
    this.empleadoForm = this.fb.group({
      nombre: ['', [Validators.required]],
      apellido: ['', [Validators.required]],
      correo: ['', [Validators.required, Validators.email]],
      telefono: ['', [Validators.minLength(10), Validators.maxLength(12), Validators.pattern(/^\+?\d{10,12}$/)]],
      contrasenia: ['', [Validators.required, Validators.minLength(6)]],
      rolId: ['', [Validators.required]]
    });
  }

  ngOnInit(): void {
    this.cargarRoles();

    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      if (params['id']) {
        this.isEditMode = true;
        this.empleadoId = +params['id'];
        this.cargarEmpleado(this.empleadoId);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  cargarEmpleado(id: number): void {
    this.loading = true;
    this.empleadoService.buscarPorId(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.loading = false;
          if ('error' in response) {
            const errorMsg = response.error?.message || 'Error al cargar empleado';
            console.error('Error al cargar empleado:', response.error);
            this.snackBar.open(errorMsg, 'Cerrar', { duration: 5000 });
          } else {
            this.empleadoForm.patchValue({
              nombre: response.nombre,
              apellido: response.apellido,
              correo: response.correo,
              telefono: response.telefono,
              rolId: this.getRolIdByNombre(response.rol)
            });
            // Remover validación de contraseña en modo edición
            this.empleadoForm.get('contrasenia')?.clearValidators();
            this.empleadoForm.get('contrasenia')?.updateValueAndValidity();
          }
        },
        error: (err) => {
          this.loading = false;
          console.error('Error de conexión:', err);
          this.snackBar.open('Error de conexión con el servidor', 'Cerrar', { duration: 5000 });
        }
      });
  }

  private getRolIdByNombre(rolNombre: string): number {
    const rol = this.roles.find((r: Rol) => r.nombre === rolNombre);
    return rol ? rol.id : 0;
  }

  private cargarRoles(): void {
    this.empleadoService.listarRoles()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if ('error' in response) {
            console.error('Error al cargar roles:', response.error);
            this.snackBar.open('Error al cargar roles', 'Cerrar', { duration: 5000 });
          } else {
            this.roles = response;
          }
        },
        error: (err) => {
          console.error('Error de conexión:', err);
          this.snackBar.open('Error de conexión con el servidor', 'Cerrar', { duration: 5000 });
        }
      });
  }

  onSubmit(): void {
    if (this.empleadoForm.valid) {
      this.saving = true;
      const empleadoData: EmpleadoRequest = {
        ...this.empleadoForm.value,
        telefono: this.empleadoForm.value.telefono || ''
      };

      const request = this.isEditMode && this.empleadoId
        ? this.empleadoService.actualizarEmpleado(this.empleadoId, empleadoData)
        : this.empleadoService.crearEmpleado(empleadoData);

      request.pipe(takeUntil(this.destroy$)).subscribe({
        next: (response) => {
          this.saving = false;
          if ('error' in response) {
            const errorMsg = response.error?.message || 'Error al guardar empleado';
            console.error('Error al guardar empleado:', response.error);
            this.snackBar.open(errorMsg, 'Cerrar', { duration: 5000 });
          } else {
            const successMsg = this.isEditMode ? 'Empleado actualizado exitosamente' : 'Empleado creado exitosamente';
            this.snackBar.open(successMsg, 'Cerrar', { duration: 3000 });
            this.nav.goBackOr(['/dashboard']);
          }
        },
        error: (err) => {
          this.saving = false;
          console.error('Error de conexión:', err);
          this.snackBar.open('Error de conexión con el servidor', 'Cerrar', { duration: 5000 });
        }
      });
    } else {
      this.snackBar.open('Por favor complete todos los campos requeridos', 'Cerrar', { duration: 3000 });
    }
  }

  onCancel(): void {
    this.nav.goBackOr(['/dashboard']);
  }
}
