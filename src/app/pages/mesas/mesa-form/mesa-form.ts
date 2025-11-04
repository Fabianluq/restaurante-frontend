import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { MesaService } from '../../../core/services/mesa.service';
import { MesaRequest, MesaResponse } from '../../../core/models/mesa.models';
import { NavigationService } from '../../../core/services/navigation.service';

@Component({
  selector: 'app-mesa-form',
  imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatCardModule, MatSelectModule, MatSnackBarModule],
  templateUrl: './mesa-form.html',
  styleUrl: './mesa-form.css'
})
export class MesaForm implements OnInit, OnDestroy {
  form!: FormGroup;
  isEdit = false;
  id: number | null = null;
  saving = false;
  estados = ['DISPONIBLE', 'OCUPADA', 'RESERVADA', 'MANTENIMIENTO'];
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private mesaService: MesaService,
    private route: ActivatedRoute,
    private nav: NavigationService,
    private snack: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      numero: ['', [Validators.required]],
      capacidad: [2, [Validators.required, Validators.min(1)]],
      estado: ['DISPONIBLE', [Validators.required]],
      ubicacion: ['']
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
    this.mesaService.buscarPorId(id).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        if ((res as any)?.error) {
          this.snack.open('No se pudo cargar la mesa', 'Cerrar', { duration: 3000 });
        } else {
          const m = res as MesaResponse;
          this.form.patchValue({
            numero: m.numero,
            capacidad: m.capacidad,
            estado: m.estado || 'DISPONIBLE',
            ubicacion: m.ubicacion || ''
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
    const payload: MesaRequest = this.form.value as MesaRequest;
    const req = this.isEdit && this.id
      ? this.mesaService.actualizar(this.id, payload)
      : this.mesaService.crear(payload);

    req.pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        this.saving = false;
        if ((res as any)?.error) {
          this.snack.open('Error al guardar la mesa', 'Cerrar', { duration: 3000 });
        } else {
          this.snack.open(this.isEdit ? 'Mesa actualizada' : 'Mesa creada', 'Cerrar', { duration: 2000 });
          this.nav.goBackOr(['/mesas']);
        }
      },
      error: () => {
        this.saving = false;
        this.snack.open('Error de conexión', 'Cerrar', { duration: 3000 });
      }
    });
  }

  cancel(): void {
    this.nav.goBackOr(['/mesas']);
  }
}

