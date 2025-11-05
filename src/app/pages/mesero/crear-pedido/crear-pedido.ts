import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { Subject, takeUntil } from 'rxjs';
import { PedidoService, PedidoRequest, DetallePedidoRequest } from '../../../core/services/pedido.service';
import { ClienteService } from '../../../core/services/cliente.service';
import { ClienteResponse } from '../../../core/models/cliente.models';
import { ProductoService } from '../../../core/services/producto.service';
import { ProductoResponse } from '../../../core/models/producto.models';
import { MesaService } from '../../../core/services/mesa.service';
import { MesaResponse } from '../../../core/models/mesa.models';
import { AuthService } from '../../../core/services/auth.service';
import { NavigationService } from '../../../core/services/navigation.service';

@Component({
  selector: 'app-crear-pedido',
  imports: [CommonModule, ReactiveFormsModule, MatCardModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule, MatSnackBarModule, MatChipsModule],
  templateUrl: './crear-pedido.html',
  styleUrl: './crear-pedido.css'
})
export class CrearPedido implements OnInit, OnDestroy {
  form: FormGroup;
  loading = false;
  submitting = false;
  clientes: ClienteResponse[] = [];
  productos: ProductoResponse[] = [];
  productosPorCategoria: { categoria: string; productos: ProductoResponse[] }[] = [];
  mesaSeleccionada: MesaResponse | null = null;
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private pedidoService: PedidoService,
    private clienteService: ClienteService,
    private productoService: ProductoService,
    private mesaService: MesaService,
    private auth: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private snack: MatSnackBar,
    private navigation: NavigationService
  ) {
    this.form = this.fb.group({
      mesaId: ['', Validators.required],
      clienteId: [''],
      observaciones: [''],
      detalles: this.fb.array([], Validators.minLength(1))
    });
  }

  ngOnInit(): void {
    const mesaId = this.route.snapshot.queryParams['mesaId'];
    if (mesaId) {
      this.form.patchValue({ mesaId: Number(mesaId) });
      this.cargarMesa(Number(mesaId));
    }
    this.cargarClientes();
    this.cargarProductos();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  cargarMesa(id: number): void {
    this.mesaService.buscarPorId(id).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        if (!(res as any)?.error) {
          this.mesaSeleccionada = res as MesaResponse;
        }
      }
    });
  }

  cargarClientes(): void {
    // Los MESEROs necesitan ver clientes para crear pedidos
    // Si hay error 403, simplemente no mostrar clientes (opcional en el formulario)
    this.clienteService.listar().pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        if (!(res as any)?.error) {
          this.clientes = res as ClienteResponse[];
        } else {
          const error = (res as any).error;
          // Si es 403, solo mostrar advertencia pero no bloquear la aplicación
          if (error?.status === 403) {
            console.warn('[CrearPedido] No se tienen permisos para ver clientes. El campo será opcional.');
            this.clientes = [];
          }
        }
      },
      error: () => {
        // Silenciar errores, el campo de cliente es opcional
        this.clientes = [];
      }
    });
  }

  cargarProductos(): void {
    this.loading = true;
    this.productoService.listar().pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        this.loading = false;
        if (!(res as any)?.error) {
          this.productos = res as ProductoResponse[];
          this.organizarPorCategoria();
        }
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  organizarPorCategoria(): void {
    const grupos: { [key: string]: ProductoResponse[] } = {};
    this.productos.forEach(p => {
      const cat = p.categoriaId || p.categoria || 'Sin categoría';
      if (!grupos[cat]) grupos[cat] = [];
      grupos[cat].push(p);
    });
    this.productosPorCategoria = Object.keys(grupos).map(cat => ({
      categoria: cat,
      productos: grupos[cat]
    }));
  }

  get detalles(): FormArray {
    return this.form.get('detalles') as FormArray;
  }

  agregarProducto(producto: ProductoResponse): void {
    const existe = this.detalles.controls.find(c => c.get('productoId')?.value === producto.id);
    if (existe) {
      const cantidad = existe.get('cantidad')?.value || 0;
      existe.patchValue({ cantidad: cantidad + 1 });
    } else {
      this.detalles.push(this.fb.group({
        productoId: [producto.id, Validators.required],
        cantidad: [1, [Validators.required, Validators.min(1)]],
        observaciones: ['']
      }));
    }
  }

  eliminarDetalle(index: number): void {
    this.detalles.removeAt(index);
  }

  actualizarCantidad(index: number, cantidad: number): void {
    const control = this.detalles.at(index);
    control.patchValue({ cantidad: Math.max(1, cantidad) });
  }

  getProductoPorId(id: number): ProductoResponse | undefined {
    return this.productos.find(p => p.id === id);
  }

  getTotal(): number {
    return this.detalles.controls.reduce((sum, control) => {
      const productoId = control.get('productoId')?.value;
      const cantidad = control.get('cantidad')?.value || 0;
      const producto = this.getProductoPorId(productoId);
      return sum + (producto ? producto.precio * cantidad : 0);
    }, 0);
  }

  onSubmit(): void {
    if (this.form.invalid || this.detalles.length === 0) {
      this.snack.open('Complete todos los campos y agregue al menos un producto', 'Cerrar', { duration: 3000 });
      return;
    }

    this.submitting = true;
    const user = this.auth.userData();
    if (!user || !user.id) {
      this.snack.open('Error: No se encontró información del empleado', 'Cerrar', { duration: 3000 });
      this.submitting = false;
      return;
    }

    const formValue = this.form.value;
    const pedido: PedidoRequest = {
      mesaId: formValue.mesaId,
      empleadoId: user.id,
      clienteId: formValue.clienteId || undefined,
      observaciones: formValue.observaciones || undefined,
      detalles: this.detalles.controls.map(c => ({
        productoId: c.get('productoId')?.value,
        cantidad: c.get('cantidad')?.value,
        observaciones: c.get('observaciones')?.value || undefined
      }))
    };

    this.pedidoService.crear(pedido).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        this.submitting = false;
        if ((res as any)?.error) {
          this.snack.open('Error al crear el pedido', 'Cerrar', { duration: 3000 });
        } else {
          this.snack.open('Pedido creado exitosamente', 'Cerrar', { duration: 2000 });
          this.navigation.goBackOr(['/mesero/pedidos']);
        }
      },
      error: () => {
        this.submitting = false;
        this.snack.open('Error de conexión', 'Cerrar', { duration: 3000 });
      }
    });
  }

  cancelar(): void {
    this.navigation.goBackOr(['/mesero/mesas']);
  }
}

