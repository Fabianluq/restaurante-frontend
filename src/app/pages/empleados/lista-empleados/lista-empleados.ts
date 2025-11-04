import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { EmpleadoService } from '../../../core/services/empleado.service';
import { EmpleadoResponse } from '../../../core/models/empleado.models';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../../shared/confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-lista-empleados',
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  templateUrl: './lista-empleados.html',
  styleUrl: './lista-empleados.css'
})
export class ListaEmpleados implements OnInit, OnDestroy {
  empleados = new MatTableDataSource<EmpleadoResponse>([]);
  displayedColumns: string[] = ['id', 'nombre', 'apellido', 'correo', 'telefono', 'rol', 'acciones'];
  loading = false;
  error: string | null = null;
  private destroy$ = new Subject<void>();
  filterValue = '';

  // Paginator & Sort
  @ViewChild(MatPaginator) paginator?: MatPaginator;
  @ViewChild(MatSort) sort?: MatSort;

  constructor(
    private empleadoService: EmpleadoService,
    private dialog: MatDialog,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.cargarEmpleados();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  cargarEmpleados(): void {
    this.loading = true;
    this.error = null;

    this.empleadoService.listarEmpleados()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.loading = false;
          if ('error' in response) {
            this.error = response.error?.message || 'Error al cargar empleados';
            console.error('Error al cargar empleados:', response.error);
            this.snackBar.open(this.error!, 'Cerrar', { duration: 5000 });
          } else {
            this.empleados.data = response;
            if (this.paginator) this.empleados.paginator = this.paginator;
            if (this.sort) this.empleados.sort = this.sort;
          }
        },
        error: (err) => {
          this.loading = false;
          this.error = 'Error de conexión con el servidor';
          console.error('Error de conexión:', err);
          this.snackBar.open(this.error, 'Cerrar', { duration: 5000 });
        }
      });
  }

  editarEmpleado(empleado: EmpleadoResponse): void {
    this.router.navigate(['/empleados/editar', empleado.id]);
  }

  eliminarEmpleado(empleado: EmpleadoResponse): void {
    const dialogData: ConfirmDialogData = {
      message: `¿Estás seguro de eliminar a ${empleado.nombre} ${empleado.apellido}?`,
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
        this.empleadoService.eliminarEmpleado(empleado.id)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (response) => {
              if ('error' in response) {
                const errorMsg = response.error?.message || 'Error al eliminar empleado';
                console.error('Error al eliminar empleado:', response.error);
                this.snackBar.open(errorMsg, 'Cerrar', { duration: 5000 });
              } else {
                this.snackBar.open('Empleado eliminado exitosamente', 'Cerrar', { duration: 3000 });
                this.cargarEmpleados();
              }
            },
            error: (err) => {
              console.error('Error de conexión:', err);
              this.snackBar.open('Error de conexión con el servidor', 'Cerrar', { duration: 5000 });
            }
          });
      }
    });
  }

  crearEmpleado(): void {
    this.router.navigate(['/empleados/crear']);
  }

  applyFilter(value: string): void {
    this.filterValue = value;
    this.empleados.filter = value.trim().toLowerCase();
  }
}
