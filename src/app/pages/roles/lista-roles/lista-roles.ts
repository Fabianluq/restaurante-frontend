import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { Rol } from '../../../core/models/empleado.models';
import { RolService } from '../../../core/services/rol.service';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../../shared/confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-lista-roles',
  imports: [CommonModule, MatTableModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule, MatSnackBarModule, MatDialogModule],
  templateUrl: './lista-roles.html',
  styleUrl: './lista-roles.css'
})
export class ListaRoles implements OnInit, OnDestroy {
  displayedColumns: string[] = ['id', 'nombre', 'descripcion', 'acciones'];
  roles: Rol[] = [];
  loading = false;
  error: string | null = null;
  private destroy$ = new Subject<void>();

  constructor(private rolService: RolService, private router: Router, private snackBar: MatSnackBar, private dialog: MatDialog) {}

  ngOnInit(): void {
    this.cargarRoles();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  cargarRoles(): void {
    this.loading = true;
    this.error = null;
    this.rolService.listar().pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        this.loading = false;
        if ('error' in (res as any)) {
          this.error = 'Error al cargar roles';
          this.snackBar.open(this.error, 'Cerrar', { duration: 4000 });
        } else {
          this.roles = res as Rol[];
        }
      },
      error: () => {
        this.loading = false;
        this.error = 'Error de conexión con el servidor';
        this.snackBar.open(this.error, 'Cerrar', { duration: 4000 });
      }
    });
  }

  crearRol() { this.router.navigate(['/roles/crear']); }
  editarRol(rol: Rol) { this.router.navigate(['/roles/editar', rol.id]); }

  eliminarRol(rol: Rol) {
    const dialogData: ConfirmDialogData = {
      message: `¿Eliminar rol "${rol.nombre}"?`,
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
        this.rolService.eliminar(rol.id).pipe(takeUntil(this.destroy$)).subscribe({
          next: (res) => {
            if ((res as any)?.error) {
              this.snackBar.open('No se pudo eliminar el rol', 'Cerrar', { duration: 4000 });
            } else {
              this.snackBar.open('Rol eliminado', 'Cerrar', { duration: 2000 });
              this.cargarRoles();
            }
          },
          error: () => this.snackBar.open('Error de conexión', 'Cerrar', { duration: 4000 })
        });
      }
    });
  }
}


