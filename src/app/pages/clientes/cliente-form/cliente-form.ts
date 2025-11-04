import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { ClienteService } from '../../../core/services/cliente.service';
import { ClienteRequest, ClienteResponse } from '../../../core/models/cliente.models';
import { NavigationService } from '../../../core/services/navigation.service';

@Component({
  selector: 'app-cliente-form',
  imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatCardModule, MatSnackBarModule],
  templateUrl: './cliente-form.html',
  styleUrl: './cliente-form.css'
})
export class ClienteForm implements OnInit, OnDestroy {
  form!: FormGroup;
  isEdit = false;
  id: number | null = null;
  saving = false;
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private clienteService: ClienteService,
    private route: ActivatedRoute,
    private nav: NavigationService,
    private snack: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      apellido: [''],
      correo: ['', [Validators.required, Validators.email]],
      telefono: ['', [Validators.minLength(10), Validators.maxLength(12), Validators.pattern(/^\+?\d{10,12}$/)]],
      direccion: ['']
    });

    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(p => {
      if (p['id']) {
        this.isEdit = true;
        this.id = +p['id'];
        this.cargar(this.id);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private cargar(id: number): void {
    this.clienteService.buscarPorId(id).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        if ((res as any)?.error) {
          this.snack.open('No se pudo cargar el cliente', 'Cerrar', { duration: 3000 });
        } else {
          const c = res as ClienteResponse;
          this.form.patchValue({
            nombre: c.nombre,
            apellido: c.apellido || '',
            correo: c.correo,
            telefono: c.telefono || '',
            direccion: c.direccion || ''
          });
        }
      },
      error: () => this.snack.open('Error de conexión', 'Cerrar', { duration: 3000 })
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.snack.open('Por favor complete todos los campos requeridos', 'Cerrar', { duration: 3000 });
      return;
    }
    this.saving = true;
    const payload: ClienteRequest = this.form.value as ClienteRequest;
    const req = this.isEdit && this.id
      ? this.clienteService.actualizar(this.id, payload)
      : this.clienteService.crear(payload);

    req.pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        this.saving = false;
        if ((res as any)?.error) {
          this.snack.open('Error al guardar el cliente', 'Cerrar', { duration: 3000 });
        } else {
          this.snack.open(this.isEdit ? 'Cliente actualizado' : 'Cliente creado', 'Cerrar', { duration: 2000 });
          this.nav.goBackOr(['/clientes']);
        }
      },
      error: () => {
        this.saving = false;
        this.snack.open('Error de conexión', 'Cerrar', { duration: 3000 });
      }
    });
  }

  cancel(): void {
    this.nav.goBackOr(['/clientes']);
  }
}

