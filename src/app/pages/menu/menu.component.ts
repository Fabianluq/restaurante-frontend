import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { Subject, takeUntil } from 'rxjs';
import { ProductoService } from '../../core/services/producto.service';
import { ProductoResponse } from '../../core/models/producto.models';

interface ProductosPorCategoria {
  categoria: string;
  productos: ProductoResponse[];
}

@Component({
  selector: 'app-menu',
  imports: [CommonModule, MatCardModule, MatProgressSpinnerModule, MatSnackBarModule],
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.css'
})
export class MenuComponent implements OnInit, OnDestroy {
  loading = false;
  error: string | null = null;
  productosPorCategoria: ProductosPorCategoria[] = [];
  private destroy$ = new Subject<void>();

  constructor(private productoService: ProductoService, private snack: MatSnackBar) {}

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
    this.productoService.listar().pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        this.loading = false;
        if ((res as any)?.error) {
          this.error = 'Error al cargar el menú';
          this.snack.open(this.error, 'Cerrar', { duration: 4000 });
        } else {
          const productos = res as ProductoResponse[];
          this.organizarPorCategoria(productos);
        }
      },
      error: () => {
        this.loading = false;
        this.error = 'Error de conexión';
        this.snack.open(this.error, 'Cerrar', { duration: 4000 });
      }
    });
  }

  private organizarPorCategoria(productos: ProductoResponse[]): void {
    const categoriasMap = new Map<string, ProductoResponse[]>();
    
    productos.forEach(p => {
      const cat = p.categoriaId || p.categoria || 'Sin categoría';
      if (!categoriasMap.has(cat)) {
        categoriasMap.set(cat, []);
      }
      categoriasMap.get(cat)!.push(p);
    });

    this.productosPorCategoria = Array.from(categoriasMap.entries()).map(([categoria, productos]) => ({
      categoria,
      productos
    }));
  }
}

