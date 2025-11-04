import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { Subject, takeUntil } from 'rxjs';
import { MesaService } from '../../../core/services/mesa.service';
import { MesaResponse } from '../../../core/models/mesa.models';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-mesas-mesero',
  imports: [CommonModule, MatCardModule, MatIconModule, MatProgressSpinnerModule, MatSnackBarModule, MatButtonModule, MatChipsModule],
  templateUrl: './mesas-mesero.html',
  styleUrl: './mesas-mesero.css'
})
export class MesasMesero implements OnInit, OnDestroy {
  loading = false;
  error: string | null = null;
  mesas: MesaResponse[] = [];
  private destroy$ = new Subject<void>();

  constructor(
    private mesaService: MesaService,
    private auth: AuthService,
    private router: Router,
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
    this.mesaService.listar().pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        this.loading = false;
        if ((res as any)?.error) {
          this.error = 'Error al cargar mesas';
          this.snack.open(this.error, 'Cerrar', { duration: 4000 });
        } else {
          this.mesas = res as MesaResponse[];
        }
      },
      error: () => {
        this.loading = false;
        this.error = 'Error de conexión';
        this.snack.open(this.error, 'Cerrar', { duration: 4000 });
      }
    });
  }

  ocuparMesa(mesa: MesaResponse): void {
    const user = this.auth.userData();
    if (!user || !user.id) {
      this.snack.open('No se pudo obtener información del empleado', 'Cerrar', { duration: 3000 });
      return;
    }

    this.mesaService.ocuparMesa(mesa.id, user.id).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        if ((res as any)?.error) {
          this.snack.open('Error al ocupar la mesa', 'Cerrar', { duration: 3000 });
        } else {
          this.snack.open('Mesa ocupada exitosamente', 'Cerrar', { duration: 2000 });
          this.cargar();
        }
      },
      error: () => this.snack.open('Error de conexión', 'Cerrar', { duration: 3000 })
    });
  }

  crearPedido(mesa: MesaResponse): void {
    this.router.navigate(['/mesero/pedidos/crear'], { queryParams: { mesaId: mesa.id } });
  }

  getEstadoColor(estado?: string): string {
    const e = (estado || '').toLowerCase();
    if (e.includes('disponible') || e.includes('libre')) return 'primary';
    if (e.includes('ocupada')) return 'warn';
    if (e.includes('reservada')) return 'accent';
    return '';
  }

  puedeCrearPedido(mesa: MesaResponse): boolean {
    const estado = (mesa.estado || '').toLowerCase();
    return estado.includes('ocupada') || estado.includes('disponible');
  }
}

