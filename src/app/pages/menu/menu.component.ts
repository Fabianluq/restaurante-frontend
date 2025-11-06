import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Subject, takeUntil, forkJoin } from 'rxjs';
import { ProductoService } from '../../core/services/producto.service';
import { CategoriaService, CategoriaResponse } from '../../core/services/categoria.service';
import { ProductoResponse } from '../../core/models/producto.models';

interface ProductosPorCategoria {
  categoriaId: number;
  categoriaNombre: string;
  productos: ProductoResponse[];
}

@Component({
  selector: 'app-menu',
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule
  ],
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.css'
})
export class MenuComponent implements OnInit, OnDestroy {
  loading = false;
  error: string | null = null;
  productosPorCategoria: ProductosPorCategoria[] = [];
  categorias: CategoriaResponse[] = [];
  private _categoriaSeleccionada: string = 'all';

  get categoriaSeleccionada(): string {
    return this._categoriaSeleccionada;
  }

  set categoriaSeleccionada(value: string) {
    this._categoriaSeleccionada = value || 'all';
    this.aplicarFiltros();
  }
  busqueda = '';
  productosFiltrados: ProductosPorCategoria[] = [];
  private destroy$ = new Subject<void>();

  constructor(
    private productoService: ProductoService,
    private categoriaService: CategoriaService,
    private snack: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.cargar();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  cargar(): void {
    this.loading = true;
    this.error = null;

    // Cargar productos y categorías en paralelo
    forkJoin({
      productos: this.productoService.listar(),
      categorias: this.categoriaService.listar()
    }).pipe(takeUntil(this.destroy$)).subscribe({
      next: (result) => {
        this.loading = false;
        
        // Manejar errores
        if ((result.productos as any)?.error) {
          this.error = 'Error al cargar el menú';
          this.snack.open(this.error, 'Cerrar', { duration: 4000 });
          return;
        }

        if ((result.categorias as any)?.error) {
          // Si falla cargar categorías, continuar con productos
          console.warn('No se pudieron cargar las categorías');
        } else {
          this.categorias = result.categorias as CategoriaResponse[];
        }

        const productos = result.productos as ProductoResponse[];
        // Filtrar solo productos disponibles
        const productosDisponibles = productos.filter(p => {
          const estado = (p.estado || p.estadoId || '').toString().toLowerCase();
          return !estado.includes('no disponible') && !estado.includes('agotado');
        });

        this.organizarPorCategoria(productosDisponibles);
        this.aplicarFiltros();
      },
      error: () => {
        this.loading = false;
        this.error = 'Error de conexión';
        this.snack.open(this.error, 'Cerrar', { duration: 4000 });
      }
    });
  }

  private organizarPorCategoria(productos: ProductoResponse[]): void {
    const categoriasMap = new Map<number, ProductosPorCategoria>();
    
    productos.forEach(p => {
      // Intentar obtener el ID de categoría
      let categoriaId: number;
      let categoriaNombre: string;

      if (typeof p.categoriaId === 'number') {
        categoriaId = p.categoriaId;
        const categoria = this.categorias.find(c => c.id === categoriaId);
        categoriaNombre = categoria?.nombre || p.categoria || 'Sin categoría';
      } else if (typeof p.categoriaId === 'string') {
        // Si viene como string, buscar por nombre
        const categoria = this.categorias.find(c => c.nombre === p.categoriaId);
        if (categoria) {
          categoriaId = categoria.id;
          categoriaNombre = categoria.nombre;
        } else {
          categoriaId = 0;
          categoriaNombre = p.categoriaId || 'Sin categoría';
        }
      } else {
        // Usar nombre de categoría como fallback
        categoriaId = 0;
        categoriaNombre = p.categoria || 'Sin categoría';
      }

      if (!categoriasMap.has(categoriaId)) {
        categoriasMap.set(categoriaId, {
          categoriaId,
          categoriaNombre,
          productos: []
        });
      }
      categoriasMap.get(categoriaId)!.productos.push(p);
    });

    // Ordenar por nombre de categoría
    this.productosPorCategoria = Array.from(categoriasMap.values()).sort((a, b) => 
      a.categoriaNombre.localeCompare(b.categoriaNombre)
    );
  }

  seleccionarCategoria(categoria: string | null): void {
    this.categoriaSeleccionada = categoria || 'all';
  }

  onCategoriaChange(event: any): void {
    // El evento change de mat-chip-listbox tiene un objeto con la propiedad 'value'
    const value = event?.value || event || this.categoriaSeleccionada;
    this.categoriaSeleccionada = value || 'all';
  }

  onBusquedaChange(value: string): void {
    this.busqueda = value.toLowerCase().trim();
    this.aplicarFiltros();
  }

  aplicarFiltros(): void {
    let filtrados = [...this.productosPorCategoria];

    // Filtrar por categoría
    if (this.categoriaSeleccionada && this.categoriaSeleccionada !== 'all') {
      filtrados = filtrados.filter(grupo => 
        grupo.categoriaNombre.toLowerCase() === this.categoriaSeleccionada!.toLowerCase()
      );
    }

    // Filtrar por búsqueda
    if (this.busqueda) {
      filtrados = filtrados.map(grupo => ({
        ...grupo,
        productos: grupo.productos.filter(p => 
          p.nombre.toLowerCase().includes(this.busqueda) ||
          (p.descripcion && p.descripcion.toLowerCase().includes(this.busqueda))
        )
      })).filter(grupo => grupo.productos.length > 0);
    }

    this.productosFiltrados = filtrados;
  }

  getEstadoColor(estado: string | undefined): string {
    if (!estado) return 'primary';
    const estadoLower = estado.toLowerCase();
    if (estadoLower.includes('disponible')) return 'primary';
    if (estadoLower.includes('agotado') || estadoLower.includes('no disponible')) return 'warn';
    return 'accent';
  }

  compartirMenu(): void {
    const url = window.location.href;
    
    if (navigator.share) {
      // Si el navegador soporta Web Share API
      navigator.share({
        title: 'Menú de RestaurApp',
        text: 'Consulta nuestro menú digital',
        url: url
      }).catch(() => {
        // Si el usuario cancela, copiar al portapapeles
        this.copiarURL(url);
      });
    } else {
      // Fallback: copiar URL al portapapeles
      this.copiarURL(url);
    }
  }

  private copiarURL(url: string): void {
    // Verificar si el Clipboard API está disponible
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(() => {
        this.snack.open('URL del menú copiada al portapapeles', 'Cerrar', { duration: 3000 });
      }).catch(() => {
        // Fallback si falla el clipboard API
        this.copiarURLFallback(url);
      });
    } else {
      // Usar método alternativo si clipboard no está disponible
      this.copiarURLFallback(url);
    }
  }

  private copiarURLFallback(url: string): void {
    try {
      // Crear un elemento input temporal
      const input = document.createElement('input');
      input.style.position = 'fixed';
      input.style.left = '-999999px';
      input.value = url;
      document.body.appendChild(input);
      input.select();
      input.setSelectionRange(0, 99999); // Para móviles
      
      // Intentar copiar usando el método antiguo
      const successful = document.execCommand('copy');
      document.body.removeChild(input);
      
      if (successful) {
        this.snack.open('URL del menú copiada al portapapeles', 'Cerrar', { duration: 3000 });
      } else {
        // Si falla, mostrar la URL para que el usuario la copie manualmente
        this.snack.open(`URL: ${url}`, 'Cerrar', { duration: 5000 });
      }
    } catch (err) {
      console.error('Error al copiar URL:', err);
      // Mostrar la URL para que el usuario la copie manualmente
      this.snack.open(`URL: ${url}`, 'Cerrar', { duration: 5000 });
    }
  }
}

