import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import * as QRCode from 'qrcode';

export interface QrDialogData {
  title: string;
  url: string;
  mesaNumero?: number;
  capacidad?: number;
}

@Component({
  selector: 'app-qr-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule
  ],
  templateUrl: './qr-dialog.html',
  styleUrl: './qr-dialog.css'
})
export class QrDialogComponent implements OnInit {
  qrImageUrl: string | null = null;
  loading = true;

  constructor(
    public dialogRef: MatDialogRef<QrDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: QrDialogData
  ) {}

  ngOnInit(): void {
    this.generarQR();
  }

  async generarQR(): Promise<void> {
    try {
      this.qrImageUrl = await QRCode.toDataURL(this.data.url, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      this.loading = false;
    } catch (err) {
      console.error('Error al generar QR:', err);
      this.loading = false;
    }
  }

  copiarURL(): void {
    navigator.clipboard.writeText(this.data.url).then(() => {
      // Mostrar mensaje de éxito (podrías usar un snackbar aquí)
      alert('URL copiada al portapapeles');
    }).catch(err => {
      console.error('Error al copiar URL:', err);
    });
  }

  descargarQR(): void {
    if (!this.qrImageUrl) return;
    
    const link = document.createElement('a');
    link.download = `qr-mesa-${this.data.mesaNumero || 'reserva'}.png`;
    link.href = this.qrImageUrl;
    link.click();
  }

  cerrar(): void {
    this.dialogRef.close();
  }
}

