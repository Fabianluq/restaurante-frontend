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
import { ProductoService } from '../../../core/services/producto.service';
import { ProductoRequest, ProductoResponse } from '../../../core/models/producto.models';
import { NavigationService } from '../../../core/services/navigation.service';

@Component({
  selector: 'app-producto-form',
  imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatCardModule, MatSnackBarModule],
  templateUrl: './producto-form.html',
  styleUrl: './producto-form.css'
})
export class ProductoForm implements OnInit, OnDestroy {
  form!: FormGroup;
  isEdit = false; id: number | null = null; saving = false;
  private destroy$ = new Subject<void>();

  constructor(private fb: FormBuilder, private productoService: ProductoService, private route: ActivatedRoute, private nav: NavigationService, private snack: MatSnackBar) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      descripcion: [''],
      precio: [0, [Validators.required, Validators.min(0)]]
    });
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(p => {
      if (p['id']) { this.isEdit = true; this.id = +p['id']; this.cargar(this.id); }
    });
  }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  private cargar(id: number): void {
    this.productoService.buscarPorId(id).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        if ((res as any)?.error) this.snack.open('No se pudo cargar el producto', 'Cerrar', { duration: 3000 });
        else {
          const p = res as ProductoResponse;
          this.form.patchValue({ nombre: p.nombre, descripcion: p.descripcion || '', precio: p.precio });
        }
      },
      error: () => this.snack.open('Error de conexión', 'Cerrar', { duration: 3000 })
    });
  }

  submit(): void {
    if (this.form.invalid) return;
    this.saving = true;
    const payload: ProductoRequest = this.form.value as ProductoRequest;
    const req = this.isEdit && this.id ? this.productoService.actualizar(this.id, payload) : this.productoService.crear(payload);
    req.pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        this.saving = false;
        if ((res as any)?.error) this.snack.open('Error al guardar', 'Cerrar', { duration: 3000 });
        else { this.snack.open(this.isEdit ? 'Producto actualizado' : 'Producto creado', 'Cerrar', { duration: 2000 }); this.nav.goBackOr(['/productos']); }
      },
      error: () => { this.saving = false; this.snack.open('Error de conexión', 'Cerrar', { duration: 3000 }); }
    });
  }

  cancel(): void { this.nav.goBackOr(['/productos']); }
}


