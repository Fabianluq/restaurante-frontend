import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
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
    MatInputModule,
    MatSnackBarModule
  ],
  templateUrl: './qr-dialog.html',
  styleUrl: './qr-dialog.css'
})
export class QrDialogComponent implements OnInit {
  qrImageUrl: string | null = null;
  loading = true;

  constructor(
    public dialogRef: MatDialogRef<QrDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: QrDialogData,
    private snack: MatSnackBar
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
    // Verificar si el Clipboard API está disponible
    if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(this.data.url).then(() => {
        this.snack.open('URL copiada al portapapeles', 'Cerrar', { duration: 3000 });
      }).catch(() => {
        // Fallback si falla el clipboard API
        this.copiarURLFallback();
      });
    } else {
      // Usar método alternativo si clipboard no está disponible
      this.copiarURLFallback();
    }
  }

  private copiarURLFallback(): void {
    try {
      // Crear un elemento input temporal
      const input = document.createElement('input');
      input.style.position = 'fixed';
      input.style.left = '-999999px';
      input.value = this.data.url;
      document.body.appendChild(input);
      input.select();
      input.setSelectionRange(0, 99999); // Para móviles
      
      // Intentar copiar usando el método antiguo
      const successful = document.execCommand('copy');
      document.body.removeChild(input);
      
      if (successful) {
        this.snack.open('URL copiada al portapapeles', 'Cerrar', { duration: 3000 });
      } else {
        // Si falla, mostrar la URL para que el usuario la copie manualmente
        this.snack.open(`URL: ${this.data.url}`, 'Cerrar', { duration: 5000 });
      }
    } catch (err) {
      console.error('Error al copiar URL:', err);
      // Mostrar la URL para que el usuario la copie manualmente
      this.snack.open(`URL: ${this.data.url}`, 'Cerrar', { duration: 5000 });
    }
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

