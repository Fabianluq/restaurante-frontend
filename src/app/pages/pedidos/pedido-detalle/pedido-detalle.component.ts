import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonModule } from '@angular/material/button';
import { PedidoResponse, DetallePedido } from '../../../core/services/pedido.service';

@Component({
  selector: 'app-pedido-detalle',
  imports: [CommonModule, MatDialogModule, MatCardModule, MatIconModule, MatChipsModule, MatButtonModule],
  templateUrl: './pedido-detalle.component.html',
  styleUrl: './pedido-detalle.component.css'
})
export class PedidoDetalleComponent {
  constructor(
    public dialogRef: MatDialogRef<PedidoDetalleComponent>,
    @Inject(MAT_DIALOG_DATA) public pedido: PedidoResponse
  ) {}

  getTotal(): number {
    return this.pedido.total || (this.pedido.detalles?.reduce((sum, d) => sum + d.totalDetalle, 0) || 0);
  }

  cerrar(): void {
    this.dialogRef.close();
  }

  getEstadoColor(estado?: string): string {
    const e = (estado || '').toLowerCase();
    if (e.includes('listo') || e.includes('completado')) return 'primary';
    if (e.includes('pendiente')) return 'warn';
    if (e.includes('preparacion')) return 'accent';
    return '';
  }
}

