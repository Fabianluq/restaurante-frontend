import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { RolService, RolRequest } from '../../../core/services/rol.service';
import { NavigationService } from '../../../core/services/navigation.service';

@Component({
  selector: 'app-rol-form',
  imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatCardModule, MatSnackBarModule],
  templateUrl: './rol-form.html',
  styleUrl: './rol-form.css'
})
export class RolForm implements OnInit, OnDestroy {
  form!: FormGroup;
  isEdit = false;
  id: number | null = null;
  saving = false;
  private destroy$ = new Subject<void>();

  constructor(private fb: FormBuilder, private rolService: RolService, private route: ActivatedRoute, private router: Router, private nav: NavigationService, private snack: MatSnackBar) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      descripcion: ['']
    });
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(p => {
      if (p['id']) {
        this.isEdit = true;
        this.id = +p['id'];
        // cargar rol y poblar formulario
        this.rolService.buscarPorId(this.id)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (res) => {
              if ((res as any)?.error) {
                this.snack.open('No se pudo cargar el rol', 'Cerrar', { duration: 3000 });
              } else {
                const rol = res as { nombre: string; descripcion?: string };
                this.form.patchValue({ nombre: rol.nombre, descripcion: rol.descripcion || '' });
              }
            },
            error: () => this.snack.open('Error de conexión', 'Cerrar', { duration: 3000 })
          });
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  submit(): void {
    if (this.form.invalid) return;
    this.saving = true;
    const payload: RolRequest = this.form.value as RolRequest;
    const req = this.isEdit && this.id ? this.rolService.actualizar(this.id, payload) : this.rolService.crear(payload);
    req.pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        this.saving = false;
        if ((res as any)?.error) {
          this.snack.open('Error al guardar el rol', 'Cerrar', { duration: 4000 });
        } else {
          this.snack.open(this.isEdit ? 'Rol actualizado' : 'Rol creado', 'Cerrar', { duration: 2500 });
          this.nav.goBackOr(['/roles']);
        }
      },
      error: () => {
        this.saving = false;
        this.snack.open('Error de conexión', 'Cerrar', { duration: 4000 });
      }
    });
  }

  cancel(): void { this.nav.goBackOr(['/roles']); }
}


