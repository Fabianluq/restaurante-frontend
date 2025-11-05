import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { Subject, takeUntil } from 'rxjs';
import { PedidoResponse } from '../../../core/services/pedido.service';
import { PagoService, PagoRequest } from '../../../core/services/pago.service';
import { FacturaComponent } from '../factura/factura';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-procesar-pago',
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule, MatSnackBarModule],
  templateUrl: './procesar-pago.html',
  styleUrl: './procesar-pago.css'
})
export class ProcesarPagoComponent implements OnInit, OnDestroy {
  form: FormGroup;
  submitting = false;
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private pagoService: PagoService,
    private dialog: MatDialog,
    private snack: MatSnackBar,
    public dialogRef: MatDialogRef<ProcesarPagoComponent>,
    @Inject(MAT_DIALOG_DATA) public pedido: PedidoResponse
  ) {
    const total = this.getTotal();
    this.form = this.fb.group({
      monto: [total, [Validators.required, Validators.min(0.01)]],
      metodoPago: ['EFECTIVO', Validators.required],
      observaciones: ['']
    });
  }

  ngOnInit(): void {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  getTotal(): number {
    if (this.pedido.total !== undefined && this.pedido.total > 0) return this.pedido.total;
    if (this.pedido.detalles && this.pedido.detalles.length > 0) {
      return this.pedido.detalles.reduce((sum, d) => sum + (d.totalDetalle || 0), 0);
    }
    return 0;
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.snack.open('Complete todos los campos requeridos', 'Cerrar', { duration: 3000 });
      return;
    }

    this.submitting = true;
    const formValue = this.form.value;
    const pago: PagoRequest = {
      pedidoId: this.pedido.id,
      monto: formValue.monto,
      metodoPago: formValue.metodoPago,
      observaciones: formValue.observaciones || undefined
    };

    this.pagoService.crear(pago).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        this.submitting = false;
        if ((res as any)?.error) {
          this.snack.open('Error al procesar el pago', 'Cerrar', { duration: 3000 });
        } else {
          this.snack.open('Pago procesado exitosamente', 'Cerrar', { duration: 2000 });
          // Mostrar factura
          this.mostrarFactura(this.pedido.id);
          this.dialogRef.close('success');
        }
      },
      error: () => {
        this.submitting = false;
        this.snack.open('Error de conexión', 'Cerrar', { duration: 3000 });
      }
    });
  }

  mostrarFactura(pedidoId: number): void {
    this.pagoService.generarFactura(pedidoId).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        if (!(res as any)?.error) {
          this.dialog.open(FacturaComponent, {
            width: '600px',
            data: res,
            disableClose: false
          });
        }
      }
    });
  }

  cancelar(): void {
    this.dialogRef.close();
  }
}

