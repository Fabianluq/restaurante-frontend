import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatTableDataSource } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { ProductoResponse } from '../../../core/models/producto.models';
import { ProductoService } from '../../../core/services/producto.service';

@Component({
  selector: 'app-lista-productos',
  imports: [CommonModule, MatTableModule, MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule, MatSnackBarModule, MatProgressSpinnerModule],
  templateUrl: './lista-productos.html',
  styleUrl: './lista-productos.css'
})
export class ListaProductos implements OnInit, OnDestroy {
  displayedColumns: string[] = ['id','nombre','categoria','precio','acciones'];
  productos = new MatTableDataSource<ProductoResponse>([]);
  loading = false; error: string | null = null; filterValue = '';
  private destroy$ = new Subject<void>();

  constructor(private productoService: ProductoService, private router: Router, private snack: MatSnackBar) {}

  ngOnInit(): void { this.cargar(); }
  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  cargar(): void {
    this.loading = true; this.error = null;
    this.productoService.listar().pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        this.loading = false;
        if ((res as any)?.error) { this.error = 'Error al cargar productos'; this.snack.open(this.error, 'Cerrar', { duration: 4000 }); }
        else { this.productos.data = res as ProductoResponse[]; }
      },
      error: () => { this.loading = false; this.error = 'Error de conexión'; this.snack.open(this.error, 'Cerrar', { duration: 4000 }); }
    });
  }

  crear() { this.router.navigate(['/productos/crear']); }
  editar(p: ProductoResponse) { this.router.navigate(['/productos/editar', p.id]); }
  eliminar(p: ProductoResponse) {
    if (!confirm(`¿Eliminar producto "${p.nombre}"?`)) return;
    this.productoService.eliminar(p.id).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        if ((res as any)?.error && (res as any).error !== 'Empty response') this.snack.open('No se pudo eliminar', 'Cerrar', { duration: 3000 });
        else { this.snack.open('Producto eliminado', 'Cerrar', { duration: 2000 }); this.cargar(); }
      },
      error: () => this.snack.open('Error de conexión', 'Cerrar', { duration: 3000 })
    });
  }

  applyFilter(value: string): void {
    this.filterValue = value;
    this.productos.filter = value.trim().toLowerCase();
  }
}


