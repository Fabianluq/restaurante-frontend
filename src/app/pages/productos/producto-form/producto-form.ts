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
import { ProductoService } from '../../../core/services/producto.service';
import { ProductoRequest, ProductoResponse } from '../../../core/models/producto.models';
import { CategoriaService, CategoriaResponse } from '../../../core/services/categoria.service';
import { EstadoService, EstadoResponse } from '../../../core/services/estado.service';
import { NavigationService } from '../../../core/services/navigation.service';

@Component({
  selector: 'app-producto-form',
  imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatCardModule, MatSelectModule, MatSnackBarModule],
  templateUrl: './producto-form.html',
  styleUrl: './producto-form.css'
})
export class ProductoForm implements OnInit, OnDestroy {
  form!: FormGroup;
  isEdit = false; 
  id: number | null = null; 
  saving = false;
  categorias: CategoriaResponse[] = [];
  estados: EstadoResponse[] = [];
  loading = false;
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder, 
    private productoService: ProductoService,
    private categoriaService: CategoriaService,
    private estadoService: EstadoService,
    private route: ActivatedRoute, 
    private nav: NavigationService, 
    private snack: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      descripcion: [''],
      precio: [0, [Validators.required, Validators.min(0)]],
      categoriaId: ['', Validators.required],
      estadoId: ['', Validators.required]
    });
    
    this.cargarCategorias();
    this.cargarEstados();
    
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(p => {
      if (p['id']) { 
        this.isEdit = true; 
        this.id = +p['id']; 
        this.cargar(this.id); 
      }
    });
  }
  
  cargarCategorias(): void {
    this.categoriaService.listar().pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        if (!(res as any)?.error) {
          this.categorias = res as CategoriaResponse[];
        }
      }
    });
  }
  
  cargarEstados(): void {
    this.estadoService.listarEstadosProductos().pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        if (!(res as any)?.error) {
          this.estados = res as EstadoResponse[];
        }
      }
    });
  }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  private cargar(id: number): void {
    this.loading = true;
    this.productoService.buscarPorId(id).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        this.loading = false;
        if ((res as any)?.error) {
          this.snack.open('No se pudo cargar el producto', 'Cerrar', { duration: 3000 });
        } else {
          const p = res as ProductoResponse;
          // Convertir categoriaId y estadoId de string a number si es necesario
          const categoriaId = p.categoriaId ? (typeof p.categoriaId === 'string' ? parseInt(p.categoriaId) : p.categoriaId) : null;
          const estadoId = p.estadoId ? (typeof p.estadoId === 'string' ? parseInt(p.estadoId) : p.estadoId) : null;
          
          this.form.patchValue({ 
            nombre: p.nombre, 
            descripcion: p.descripcion || '', 
            precio: p.precio,
            categoriaId: categoriaId || '',
            estadoId: estadoId || ''
          });
        }
      },
      error: () => {
        this.loading = false;
        this.snack.open('Error de conexión', 'Cerrar', { duration: 3000 });
      }
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.snack.open('Por favor complete todos los campos requeridos', 'Cerrar', { duration: 3000 });
      return;
    }
    this.saving = true;
    const formValue = this.form.value;
    const payload: ProductoRequest = {
      nombre: formValue.nombre,
      descripcion: formValue.descripcion || undefined,
      precio: Number(formValue.precio),
      categoriaId: Number(formValue.categoriaId),
      estadoId: Number(formValue.estadoId)
    };
    
    const req = this.isEdit && this.id 
      ? this.productoService.actualizar(this.id, payload) 
      : this.productoService.crear(payload);
      
    req.pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        this.saving = false;
        if ((res as any)?.error) {
          const error = (res as any).error;
          let mensaje = 'Error al guardar el producto';
          if (error?.errorBody?.message) mensaje = error.errorBody.message;
          else if (error?.message) mensaje = error.message;
          this.snack.open(mensaje, 'Cerrar', { duration: 4000 });
        } else { 
          this.snack.open(this.isEdit ? 'Producto actualizado' : 'Producto creado', 'Cerrar', { duration: 2000 }); 
          this.nav.goBackOr(['/productos']); 
        }
      },
      error: () => { 
        this.saving = false; 
        this.snack.open('Error de conexión', 'Cerrar', { duration: 3000 }); 
      }
    });
  }

  cancel(): void { this.nav.goBackOr(['/productos']); }
}


