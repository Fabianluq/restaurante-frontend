import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { ReporteService, ReporteVentas } from '../../core/services/reporte.service';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartType } from 'chart.js';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatCardModule,
    BaseChartDirective
  ],
  templateUrl: './reportes.html',
  styleUrls: ['./reportes.css']
})
export class ReportesComponent implements OnInit {
  loading = false;
  reporte: ReporteVentas | null = null;

  // Gráfico de línea - Ventas por día
  public lineChartType: ChartType = 'line';
  public lineChartData: ChartConfiguration['data'] = {
    datasets: [
      {
        data: [],
        label: 'Ventas',
        backgroundColor: 'rgba(255, 122, 0, 0.1)',
        borderColor: '#FF7A00',
        pointBackgroundColor: '#FF7A00',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: '#FF7A00',
        fill: true,
        tension: 0.4,
        borderWidth: 3,
        pointRadius: 5,
        pointHoverRadius: 7
      }
    ],
    labels: []
  };

  public lineChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        padding: 12,
        titleFont: { size: 14, weight: 'bold' },
        bodyFont: { size: 13 },
        displayColors: true,
        callbacks: {
          label: (context) => {
            const value = context.parsed.y ?? 0;
            return `$${value.toLocaleString('es-ES')}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value) => `$${value.toLocaleString('es-ES')}`,
          font: { size: 12 }
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        },
        border: {
          display: false
        }
      },
      x: {
        grid: {
          display: false
        },
        border: {
          display: false
        },
        ticks: {
          font: { size: 12 }
        }
      }
    }
  };

  // Gráfico de barras - Ventas por mes
  public barChartType: ChartType = 'bar';
  public barChartData: ChartConfiguration['data'] = {
    datasets: [
      {
        data: [],
        label: 'Ventas Mensuales',
        backgroundColor: 'rgba(255, 122, 0, 0.8)',
        borderColor: '#FF7A00',
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false
      }
    ],
    labels: []
  };

  public barChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        padding: 12,
        callbacks: {
          label: (context) => {
            const value = context.parsed.y ?? 0;
            return `$${value.toLocaleString('es-ES')}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value) => `$${value.toLocaleString('es-ES')}`,
          font: { size: 12 }
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        },
        border: {
          display: false
        }
      },
      x: {
        grid: {
          display: false
        },
        border: {
          display: false
        },
        ticks: {
          font: { size: 12 }
        }
      }
    }
  };

  // Gráfico de Doughnut - Productos más vendidos
  public doughnutChartType: ChartType = 'doughnut';
  public doughnutChartData: ChartConfiguration['data'] = {
    datasets: [
      {
        data: [],
        backgroundColor: [
          '#FF7A00',
          '#FF9500',
          '#FFB84D',
          '#FFD699',
          '#FFE6CC',
          '#FFA500',
          '#FF8C00'
        ],
        borderWidth: 0,
        hoverOffset: 10
      }
    ],
    labels: []
  };

  public doughnutChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 15,
          font: { size: 12 },
          usePointStyle: true
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        padding: 12,
        callbacks: {
          label: (context) => {
            const label = context.label || '';
            const value = context.parsed || 0;
            return `${label}: $${value.toLocaleString('es-ES')}`;
          }
        }
      }
    }
  };

  constructor(
    private reporteService: ReporteService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargarReportes();
  }

  async cargarReportes(): Promise<void> {
    this.loading = true;
    try {
      const reporte = await this.reporteService.obtenerDatosReporte();
      this.reporte = reporte;
      this.actualizarGraficos();
    } catch (error) {
      console.error('Error cargando reportes:', error);
    } finally {
      this.loading = false;
    }
  }

  actualizarGraficos(): void {
    if (!this.reporte) return;

    // Gráfico de línea - Ventas por día
    this.lineChartData = {
      ...this.lineChartData,
      labels: this.reporte.ventasPorDia.map(v => v.fecha),
      datasets: [{
        ...this.lineChartData.datasets[0],
        data: this.reporte.ventasPorDia.map(v => v.total)
      }]
    };

    // Gráfico de barras - Ventas por mes
    this.barChartData = {
      ...this.barChartData,
      labels: this.reporte.ventasPorMes.map(v => v.mes),
      datasets: [{
        ...this.barChartData.datasets[0],
        data: this.reporte.ventasPorMes.map(v => v.total)
      }]
    };

    // Gráfico de Doughnut - Productos más vendidos
    this.doughnutChartData = {
      ...this.doughnutChartData,
      labels: this.reporte.productosMasVendidos.map(p => p.producto),
      datasets: [{
        ...this.doughnutChartData.datasets[0],
        data: this.reporte.productosMasVendidos.map(p => p.total)
      }]
    };

    this.cdr.detectChanges();
  }

  formatearMoneda(valor: number): string {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(valor);
  }
}
