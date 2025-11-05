import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { MatTableDataSource } from '@angular/material/table';
import { ClienteResponse } from '../../../core/models/cliente.models';
import { ClienteService } from '../../../core/services/cliente.service';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../../shared/confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-lista-clientes',
  imports: [CommonModule, MatTableModule, MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule, MatPaginatorModule, MatSortModule, MatSnackBarModule, MatProgressSpinnerModule, MatDialogModule],
  templateUrl: './lista-clientes.html',
  styleUrl: './lista-clientes.css'
})
export class ListaClientes implements OnInit, OnDestroy {
  displayedColumns: string[] = ['id', 'nombre', 'apellido', 'correo', 'telefono', 'acciones'];
  clientes = new MatTableDataSource<ClienteResponse>([]);
  loading = false;
  error: string | null = null;
  filterValue = '';
  private destroy$ = new Subject<void>();

  @ViewChild(MatPaginator) paginator?: MatPaginator;
  @ViewChild(MatSort) sort?: MatSort;

  constructor(private clienteService: ClienteService, private router: Router, private snack: MatSnackBar, private dialog: MatDialog) {}

  ngOnInit(): void { this.cargar(); }
  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  cargar(): void {
    this.loading = true; this.error = null;
    this.clienteService.listar().pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        this.loading = false;
        if ((res as any)?.error) {
          this.error = 'Error al cargar clientes';
          this.snack.open(this.error, 'Cerrar', { duration: 4000 });
        } else {
          this.clientes.data = res as ClienteResponse[];
          if (this.paginator) this.clientes.paginator = this.paginator;
          if (this.sort) this.clientes.sort = this.sort;
        }
      },
      error: () => { this.loading = false; this.error = 'Error de conexión'; this.snack.open(this.error, 'Cerrar', { duration: 4000 }); }
    });
  }

  crear() { this.router.navigate(['/clientes/crear']); }
  editar(c: ClienteResponse) { this.router.navigate(['/clientes/editar', c.id]); }
  
  eliminar(c: ClienteResponse) {
    const dialogData: ConfirmDialogData = {
      message: `¿Eliminar cliente "${c.nombre} ${c.apellido || ''}"?`,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      type: 'delete'
    };

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: dialogData,
      width: '400px'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.clienteService.eliminar(c.id).pipe(takeUntil(this.destroy$)).subscribe({
          next: (res) => {
            if ((res as any)?.error) this.snack.open('No se pudo eliminar el cliente', 'Cerrar', { duration: 3000 });
            else { this.snack.open('Cliente eliminado', 'Cerrar', { duration: 2000 }); this.cargar(); }
          },
          error: () => this.snack.open('Error de conexión', 'Cerrar', { duration: 3000 })
        });
      }
    });
  }

  applyFilter(value: string): void {
    this.filterValue = value;
    this.clientes.filter = value.trim().toLowerCase();
  }
}

