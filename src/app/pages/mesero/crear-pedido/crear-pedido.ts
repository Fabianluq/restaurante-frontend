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
import { Subject, takeUntil, forkJoin, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { PedidoService, PedidoRequest, PedidoResponse, DetallePedidoRequest } from '../../../core/services/pedido.service';
import { ClienteService } from '../../../core/services/cliente.service';
import { ClienteResponse } from '../../../core/models/cliente.models';
import { ProductoService } from '../../../core/services/producto.service';
import { ProductoResponse } from '../../../core/models/producto.models';
import { MesaService } from '../../../core/services/mesa.service';
import { MesaResponse } from '../../../core/models/mesa.models';
import { EstadoService } from '../../../core/services/estado.service';
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
  mesas: MesaResponse[] = [];
  mesasDisponibles: MesaResponse[] = [];
  mesaSeleccionada: MesaResponse | null = null;
  estadoInicialId: number | null = null;
  pedidosActivos: PedidoResponse[] = [];
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private pedidoService: PedidoService,
    private clienteService: ClienteService,
    private productoService: ProductoService,
    private mesaService: MesaService,
    private estadoService: EstadoService,
    private auth: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private snack: MatSnackBar,
    private navigation: NavigationService
  ) {
    this.form = this.fb.group({
      mesaId: [null, Validators.required],
      clienteId: [''],
      nombreCliente: [''],
      apellidoCliente: [''],
      correoCliente: [''],
      telefonoCliente: [''],
      detalles: this.fb.array([], Validators.minLength(1))
    });
  }

  ngOnInit(): void {
    this.cargarEstadoInicial();
    // Cargar mesas y pedidos en paralelo, luego filtrar
    this.cargarMesasYPedidos();
    const mesaId = this.route.snapshot.queryParams['mesaId'];
    if (mesaId) {
      const mesaIdNum = Number(mesaId);
      this.form.patchValue({ mesaId: mesaIdNum });
      this.cargarMesa(mesaIdNum);
    }
    this.cargarClientes();
    this.cargarProductos();
  }
  
  cargarEstadoInicial(): void {
    // Buscar el estado "Pendiente" o usar el primero disponible
    this.estadoService.listarEstadosPedidos().pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        if (!(res as any)?.error) {
          const estados = Array.isArray(res) ? res : [];
          console.log('[CrearPedido] Estados disponibles:', estados);
          const pendiente = estados.find((e: any) => 
            e.descripcion?.toUpperCase().includes('PENDIENTE')
          );
          this.estadoInicialId = pendiente?.id || estados[0]?.id || null;
          console.log('[CrearPedido] Estado inicial seleccionado:', this.estadoInicialId);
          if (!this.estadoInicialId) {
            console.warn('[CrearPedido] No se encontró un estado inicial válido');
          }
        } else {
          console.error('[CrearPedido] Error al cargar estados:', res);
        }
      },
      error: (err) => {
        console.error('[CrearPedido] Error al cargar estados:', err);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  cargarMesasYPedidos(): void {
    // Cargar mesas y pedidos en paralelo usando forkJoin
    forkJoin({
      mesas: this.mesaService.listar(),
      pedidos: this.pedidoService.listar()
    }).pipe(takeUntil(this.destroy$)).subscribe({
      next: (resultados) => {
        // Procesar mesas
        if (!(resultados.mesas as any)?.error) {
          const todasLasMesas = Array.isArray(resultados.mesas) ? resultados.mesas : [];
          // Filtrar solo las mesas que NO están ocupadas según su estado
          this.mesas = todasLasMesas.filter((mesa: MesaResponse) => {
            const estado = (mesa.estado || '').toLowerCase();
            return !estado.includes('ocupada');
          });
          console.log('[CrearPedido] Mesas cargadas (no ocupadas por estado):', this.mesas.length, 'de', todasLasMesas.length);
        }

        // Procesar pedidos activos
        if (!(resultados.pedidos as any)?.error) {
          const todosLosPedidos = Array.isArray(resultados.pedidos) ? resultados.pedidos : [];
          // Filtrar pedidos activos: Pendiente, En Preparación, Listo, Entregado
          // Excluir: Pagado, Cancelado
          this.pedidosActivos = todosLosPedidos.filter((p: PedidoResponse) => {
            const estado = (p.estado || '').toLowerCase();
            return estado !== 'pagado' && 
                   estado !== 'cancelado' && 
                   estado !== 'pago' &&
                   estado !== 'cancelar';
          });
          console.log('[CrearPedido] Pedidos activos:', this.pedidosActivos.length);
        }

        // Ahora que tenemos ambas listas, filtrar mesas disponibles
        this.filtrarMesasDisponibles();
      },
      error: (err) => {
        console.error('[CrearPedido] Error al cargar mesas/pedidos:', err);
        // Si falla, intentar cargar solo mesas
        this.cargarMesas();
      }
    });
  }

  cargarMesas(): void {
    // Método de respaldo si forkJoin falla
    this.mesaService.listar().pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        if (!(res as any)?.error) {
          const todasLasMesas = Array.isArray(res) ? res : [];
          this.mesas = todasLasMesas.filter((mesa: MesaResponse) => {
            const estado = (mesa.estado || '').toLowerCase();
            return !estado.includes('ocupada');
          });
          // Sin pedidos activos, todas las mesas no ocupadas están disponibles
          this.mesasDisponibles = this.mesas;
        }
      }
    });
  }

  filtrarMesasDisponibles(): void {
    if (this.mesas.length === 0) {
      this.mesasDisponibles = [];
      return;
    }

    // Extraer mesaIds de pedidos activos que tienen mesaNumero
    const mesasConPedidosActivos = new Set<number>();
    this.pedidosActivos.forEach((p: PedidoResponse) => {
      if (p.mesaNumero) {
        // Buscar la mesa por numero (mesaNumero es el número de la mesa, no el ID)
        const mesa = this.mesas.find(m => m.numero === p.mesaNumero);
        if (mesa) {
          mesasConPedidosActivos.add(mesa.id);
          console.log(`[CrearPedido] Mesa ${mesa.numero} (ID: ${mesa.id}) tiene pedido activo ID: ${p.id}, estado: ${p.estado}`);
        } else {
          console.warn(`[CrearPedido] No se encontró mesa con número ${p.mesaNumero} para pedido ${p.id}`);
        }
      }
    });

    // Filtrar mesas: excluir las que tienen pedidos activos
    this.mesasDisponibles = this.mesas.filter(mesa => {
      const tienePedidoActivo = mesasConPedidosActivos.has(mesa.id);
      if (tienePedidoActivo) {
        console.log(`[CrearPedido] Excluyendo mesa ${mesa.numero} (ID: ${mesa.id}) - tiene pedido activo`);
      }
      return !tienePedidoActivo;
    });

    console.log('[CrearPedido] Resumen de filtrado:');
    console.log('  - Total mesas (no ocupadas por estado):', this.mesas.length);
    console.log('  - Mesas con pedidos activos:', mesasConPedidosActivos.size);
    console.log('  - Mesas disponibles (sin pedidos activos):', this.mesasDisponibles.length);
    console.log('  - Mesas disponibles:', this.mesasDisponibles.map(m => `Mesa ${m.numero} (ID: ${m.id})`));
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

  onMesaChange(mesaId: number | null): void {
    if (mesaId) {
      const mesa = this.mesasDisponibles.find(m => m.id === mesaId) || this.mesas.find(m => m.id === mesaId);
      this.mesaSeleccionada = mesa || null;
    } else {
      this.mesaSeleccionada = null;
    }
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
    if (!this.estadoInicialId) {
      this.snack.open('Error: No se pudo cargar el estado inicial del pedido', 'Cerrar', { duration: 3000 });
      return;
    }
    
    const formValue = this.form.value;
    // Convertir mesaId a número solo si tiene valor, sino undefined
    const mesaId = formValue.mesaId && formValue.mesaId !== null && formValue.mesaId !== '' 
      ? Number(formValue.mesaId) 
      : undefined;
    
    // Validación: debe tener mesa seleccionada
    if (!mesaId || mesaId === null) {
      this.snack.open('Debe seleccionar una mesa', 'Cerrar', { duration: 3000 });
      return;
    }
    
    if (this.detalles.length === 0) {
      this.snack.open('Debe agregar al menos un producto', 'Cerrar', { duration: 3000 });
      return;
    }

    this.submitting = true;
    
    // Si hay clienteId, usar datos del cliente seleccionado, sino usar datos del formulario
    let nombreCliente: string | undefined;
    let apellidoCliente: string | undefined;
    let correoCliente: string | undefined;
    let telefonoCliente: string | undefined;
    
    if (formValue.clienteId) {
      const cliente = this.clientes.find(c => c.id === formValue.clienteId);
      if (cliente) {
        nombreCliente = cliente.nombre;
        apellidoCliente = cliente.apellido;
        correoCliente = cliente.correo;
        telefonoCliente = cliente.telefono;
      }
    } else {
      nombreCliente = formValue.nombreCliente || undefined;
      apellidoCliente = formValue.apellidoCliente || undefined;
      correoCliente = formValue.correoCliente || undefined;
      telefonoCliente = formValue.telefonoCliente || undefined;
    }

    // El backend requiere paraLlevar como boolean siempre
    // Si hay mesa seleccionada, paraLlevar = false
    // Si no hay mesa, paraLlevar = true (aunque no debería pasar por validación)
    const paraLlevar = !mesaId || mesaId === null;
    
    // Solo incluir campos de cliente si tienen valor (no enviar strings vacíos)
    // IMPORTANTE: Según el backend, los campos de cliente tienen validaciones @Size y @Email
    // Si se envían, deben cumplir esas validaciones
    const pedido: PedidoRequest = {
      estadoId: this.estadoInicialId!,
      mesaId: mesaId,
      paraLlevar: paraLlevar
    };

    // Agregar campos de cliente solo si tienen valor válido
    // El backend valida: nombre/apellido min 1 max 60, correo formato email, telefono min 6 max 20
    if (nombreCliente && nombreCliente.trim().length >= 1 && nombreCliente.trim().length <= 60) {
      pedido.nombreCliente = nombreCliente.trim();
    }
    if (apellidoCliente && apellidoCliente.trim().length >= 1 && apellidoCliente.trim().length <= 60) {
      pedido.apellidoCliente = apellidoCliente.trim();
    }
    if (correoCliente && correoCliente.trim()) {
      // Validar formato email básico
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (emailRegex.test(correoCliente.trim())) {
        pedido.correoCliente = correoCliente.trim();
      }
    }
    if (telefonoCliente && telefonoCliente.trim().length >= 6 && telefonoCliente.trim().length <= 20) {
      pedido.telefonoCliente = telefonoCliente.trim();
    }

    console.log('[CrearPedido] Enviando pedido:', JSON.stringify(pedido, null, 2));

    // Crear el pedido primero
    this.pedidoService.crear(pedido).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        if ((res as any)?.error) {
          this.submitting = false;
          const error = (res as any).error;
          console.error('[CrearPedido] Error al crear pedido:', error);
          
          let mensaje = 'Error al crear el pedido';
          if (error?.errorBody?.message) {
            mensaje = error.errorBody.message;
          } else if (error?.errorBody?.detail) {
            mensaje = error.errorBody.detail;
          } else if (error?.errorBody?.title) {
            mensaje = error.errorBody.title;
          } else if (error?.message) {
            mensaje = error.message;
          } else if (error?.status === 400) {
            mensaje = 'Datos inválidos. Verifica que todos los campos sean correctos.';
          }
          
          // Si el error es que la mesa ya tiene un pedido activo, recargar mesas disponibles
          if (mensaje.includes('ya tiene un pedido activo') || mensaje.includes('pedido activo')) {
            console.warn('[CrearPedido] Mesa tiene pedido activo, recargando mesas disponibles...');
            this.cargarMesasYPedidos();
          }
          
          this.snack.open(mensaje, 'Cerrar', { duration: 5000 });
        } else {
          const pedidoCreado = res as PedidoResponse;
          console.log('[CrearPedido] Pedido creado exitosamente:', pedidoCreado);
          // Agregar los detalles del pedido
          this.agregarDetallesPedido(pedidoCreado.id);
        }
      },
      error: (err) => {
        this.submitting = false;
        console.error('[CrearPedido] Error HTTP:', err);
        let mensaje = 'Error de conexión';
        if (err?.error?.message) mensaje = err.error.message;
        else if (err?.error?.detail) mensaje = err.error.detail;
        this.snack.open(mensaje, 'Cerrar', { duration: 5000 });
      }
    });
  }
  
  agregarDetallesPedido(pedidoId: number): void {
    // Mapear todos los detalles según DetallePedidoRequest (solo productoId y cantidad)
    const detalles = this.detalles.controls.map((c, index) => {
      const productoId = c.get('productoId')?.value;
      const cantidad = c.get('cantidad')?.value;
      
      const detalle: DetallePedidoRequest = {
        productoId: Number(productoId),
        cantidad: Number(cantidad)
      };
      
      console.log(`[CrearPedido] Detalle ${index + 1}:`, detalle);
      return detalle;
    });
    
    console.log(`[CrearPedido] Agregando ${detalles.length} detalles al pedido ${pedidoId}`);
    
    if (detalles.length === 0) {
      console.warn('[CrearPedido] No hay detalles para agregar');
      this.submitting = false;
      this.snack.open('Pedido creado pero no se agregaron productos', 'Cerrar', { duration: 3000 });
      this.navigation.goBackOr(['/mesero/pedidos']);
      return;
    }
    
    // Validar que todos los detalles tengan productoId y cantidad válidos
    const detallesValidos = detalles.filter((d, index) => {
      const valido = d.productoId && Number.isInteger(d.productoId) && 
                     d.cantidad && Number.isInteger(d.cantidad) && 
                     d.cantidad > 0;
      if (!valido) {
        console.error(`[CrearPedido] Detalle ${index + 1} inválido:`, d);
      }
      return valido;
    });
    
    if (detallesValidos.length !== detalles.length) {
      console.error(`[CrearPedido] Solo ${detallesValidos.length} de ${detalles.length} detalles son válidos`);
      this.submitting = false;
      this.snack.open(`Error: ${detalles.length - detallesValidos.length} productos tienen datos inválidos`, 'Cerrar', { duration: 4000 });
      return;
    }
    
    // Agregar cada detalle usando el endpoint correcto
    // IMPORTANTE: Usar catchError para asegurar que forkJoin siempre complete
    const requests = detallesValidos.map((detalle, index) => 
      this.pedidoService.agregarDetalle(pedidoId, detalle).pipe(
        map((res: any) => {
          // Verificar si la respuesta tiene error
          if (res && (res as any).error) {
            console.error(`[CrearPedido] Detalle ${index + 1} tiene error en respuesta:`, res);
            return { success: false, index, detalle, error: (res as any).error };
          }
          console.log(`[CrearPedido] Detalle ${index + 1} agregado exitosamente:`, res);
          return { success: true, index, detalle, res };
        }),
        catchError((err: any) => {
          console.error(`[CrearPedido] Error HTTP al agregar detalle ${index + 1}:`, err);
          // Extraer información del error
          const errorInfo = err?.error || err?.errorBody || err;
          return of({ success: false, index, detalle, error: errorInfo });
        })
      )
    );
    
    // Ejecutar todas las peticiones en paralelo
    // forkJoin completará cuando todas las peticiones terminen (exitosas o fallidas)
    forkJoin(requests).pipe(takeUntil(this.destroy$)).subscribe({
      next: (resultados) => {
        console.log(`[CrearPedido] Todas las peticiones completadas. Total: ${resultados.length}`);
        
        const exitosos = resultados.filter((r: any) => r.success === true);
        const fallidos = resultados.filter((r: any) => r.success === false);
        
        console.log(`[CrearPedido] Resultados: ${exitosos.length} exitosos, ${fallidos.length} fallidos`);
        
        if (fallidos.length > 0) {
          console.error('[CrearPedido] Detalles fallidos:', fallidos.map((f: any) => ({
            index: f.index,
            productoId: f.detalle.productoId,
            cantidad: f.detalle.cantidad,
            error: f.error
          })));
        }
        
        if (exitosos.length === 0) {
          // Ningún producto se agregó
          this.submitting = false;
          this.snack.open(
            'Error: No se pudo agregar ningún producto al pedido',
            'Cerrar',
            { duration: 5000 }
          );
        } else if (fallidos.length > 0) {
          // Algunos productos se agregaron, otros no
          this.submitting = false;
          this.snack.open(
            `Pedido creado. ${exitosos.length} productos agregados, ${fallidos.length} fallaron`,
            'Cerrar',
            { duration: 5000 }
          );
          // Aún así redirigir porque el pedido fue creado
          setTimeout(() => {
            this.navigation.goBackOr(['/mesero/pedidos']);
          }, 2000);
        } else {
          // Todos los productos se agregaron exitosamente
          this.submitting = false;
          this.snack.open(`Pedido creado exitosamente con ${exitosos.length} productos`, 'Cerrar', { duration: 2000 });
          this.navigation.goBackOr(['/mesero/pedidos']);
        }
      },
      error: (err) => {
        // Este error solo ocurriría si forkJoin mismo falla (muy raro)
        console.error('[CrearPedido] Error crítico en forkJoin:', err);
        this.submitting = false;
        this.snack.open('Error crítico al agregar los productos al pedido', 'Cerrar', { duration: 5000 });
      }
    });
  }

  cancelar(): void {
    this.navigation.goBackOr(['/mesero/mesas']);
  }
}

