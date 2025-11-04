import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatTableDataSource } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { MesaResponse } from '../../../core/models/mesa.models';
import { MesaService } from '../../../core/services/mesa.service';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../../shared/confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-lista-mesas',
  imports: [CommonModule, MatTableModule, MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule, MatPaginatorModule, MatSortModule, MatSnackBarModule, MatProgressSpinnerModule, MatChipsModule, MatDialogModule],
  templateUrl: './lista-mesas.html',
  styleUrl: './lista-mesas.css'
})
export class ListaMesas implements OnInit, OnDestroy {
  displayedColumns: string[] = ['numero', 'capacidad', 'estado', 'acciones'];
  mesas = new MatTableDataSource<MesaResponse>([]);
  loading = false;
  error: string | null = null;
  filterValue = '';
  private destroy$ = new Subject<void>();

  @ViewChild(MatPaginator) paginator?: MatPaginator;
  @ViewChild(MatSort) sort?: MatSort;

  constructor(private mesaService: MesaService, private router: Router, private snack: MatSnackBar, private dialog: MatDialog) {}

  ngOnInit(): void { this.cargar(); }
  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  cargar(): void {
    this.loading = true; this.error = null;
    this.mesaService.listar().pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        this.loading = false;
        if ((res as any)?.error) {
          this.error = 'Error al cargar mesas';
          this.snack.open(this.error, 'Cerrar', { duration: 4000 });
        } else {
          this.mesas.data = res as MesaResponse[];
          if (this.paginator) this.mesas.paginator = this.paginator;
          if (this.sort) this.mesas.sort = this.sort;
        }
      },
      error: () => { this.loading = false; this.error = 'Error de conexión'; this.snack.open(this.error, 'Cerrar', { duration: 4000 }); }
    });
  }

  crear() { this.router.navigate(['/mesas/crear']); }
  editar(m: MesaResponse) { this.router.navigate(['/mesas/editar', m.id]); }
  
  eliminar(m: MesaResponse) {
    const dialogData: ConfirmDialogData = {
      message: `¿Eliminar mesa "${m.numero}"?`,
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
        this.mesaService.eliminar(m.id).pipe(takeUntil(this.destroy$)).subscribe({
          next: (res) => {
            if ((res as any)?.error) this.snack.open('No se pudo eliminar la mesa', 'Cerrar', { duration: 3000 });
            else { this.snack.open('Mesa eliminada', 'Cerrar', { duration: 2000 }); this.cargar(); }
          },
          error: () => this.snack.open('Error de conexión', 'Cerrar', { duration: 3000 })
        });
      }
    });
  }

  applyFilter(value: string): void {
    this.filterValue = value;
    this.mesas.filter = value.trim().toLowerCase();
  }

  getEstadoColor(estado?: string): string {
    const e = (estado || '').toLowerCase();
    if (e.includes('disponible') || e.includes('libre')) return 'primary';
    if (e.includes('ocupada')) return 'warn';
    if (e.includes('reservada')) return 'accent';
    return '';
  }
}

