import { Injectable } from '@angular/core';
import { Observable, firstValueFrom } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiClientService } from './api-client.service';
import { PagoService, PagoResponse } from './pago.service';
import { PedidoService, PedidoResponse } from './pedido.service';

export interface ReporteVentas {
  ventasTotales: number;
  ventasHoy: number;
  pedidosTotales: number;
  pedidosHoy: number;
  promedioPorPedido: number;
  ventasPorDia: { fecha: string; total: number }[];
  ventasPorMes: { mes: string; total: number }[];
  productosMasVendidos: { producto: string; cantidad: number; total: number }[];
}

@Injectable({ providedIn: 'root' })
export class ReporteService {
  constructor(
    private api: ApiClientService,
    private pagoService: PagoService,
    private pedidoService: PedidoService
  ) {}

  // Método simplificado que obtiene datos directamente
  async obtenerDatosReporte(): Promise<ReporteVentas> {
    try {
      const pagosPromise = firstValueFrom(this.pagoService.listar());
      const pedidosPromise = firstValueFrom(this.pedidoService.listar());
      
      const [pagosRes, pedidosRes] = await Promise.all([pagosPromise, pedidosPromise]);

      const pagos = (pagosRes as any)?.error ? [] : (pagosRes as PagoResponse[]);
      const pedidos = (pedidosRes as any)?.error ? [] : (pedidosRes as PedidoResponse[]);

      return this.calcularReporte(pagos, pedidos);
    } catch (error) {
      console.error('Error obteniendo datos de reporte:', error);
      return this.getReporteVacio();
    }
  }

  private calcularReporte(pagos: PagoResponse[], pedidos: PedidoResponse[]): ReporteVentas {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    // Calcular ventas desde pagos (si existen) o desde pedidos (si no hay pagos)
    let ventasTotales = pagos.reduce((sum, p) => sum + (p.monto || 0), 0);
    
    // Si no hay pagos, calcular ventas desde pedidos
    if (ventasTotales === 0 && pedidos.length > 0) {
      ventasTotales = pedidos.reduce((sum, p) => {
        const totalPedido = p.total || (p.detalles?.reduce((s, d) => s + (d.totalDetalle || 0), 0) || 0);
        return sum + totalPedido;
      }, 0);
    }
    
    // Ventas de hoy desde pagos
    let ventasHoy = pagos
      .filter(p => {
        const fechaPago = new Date(p.fechaPago);
        fechaPago.setHours(0, 0, 0, 0);
        return fechaPago.getTime() === hoy.getTime();
      })
      .reduce((sum, p) => sum + (p.monto || 0), 0);

    // Si no hay ventas de hoy desde pagos, calcular desde pedidos
    if (ventasHoy === 0) {
      ventasHoy = pedidos
        .filter(p => {
          const fechaPedido = new Date(p.fechaPedido);
          fechaPedido.setHours(0, 0, 0, 0);
          return fechaPedido.getTime() === hoy.getTime();
        })
        .reduce((sum, p) => {
          const totalPedido = p.total || (p.detalles?.reduce((s, d) => s + (d.totalDetalle || 0), 0) || 0);
          return sum + totalPedido;
        }, 0);
    }

    // Pedidos totales
    const pedidosTotales = pedidos.length;
    
    // Pedidos de hoy
    const pedidosHoy = pedidos.filter(p => {
      const fechaPedido = new Date(p.fechaPedido);
      fechaPedido.setHours(0, 0, 0, 0);
      return fechaPedido.getTime() === hoy.getTime();
    }).length;

    // Promedio por pedido
    const promedioPorPedido = pedidosTotales > 0 ? ventasTotales / pedidosTotales : 0;

    // Ventas por día (últimos 7 días) - usar pagos si existen, sino pedidos
    const ventasPorDia = pagos.length > 0 
      ? this.calcularVentasPorDia(pagos, 7)
      : this.calcularVentasPorDiaDesdePedidos(pedidos, 7);
    
    // Ventas por mes (últimos 6 meses) - usar pagos si existen, sino pedidos
    const ventasPorMes = pagos.length > 0
      ? this.calcularVentasPorMes(pagos, 6)
      : this.calcularVentasPorMesDesdePedidos(pedidos, 6);

    // Productos más vendidos
    const productosMasVendidos = this.calcularProductosMasVendidos(pedidos);

    return {
      ventasTotales,
      ventasHoy,
      pedidosTotales,
      pedidosHoy,
      promedioPorPedido,
      ventasPorDia,
      ventasPorMes,
      productosMasVendidos
    };
  }

  private calcularVentasPorDia(pagos: PagoResponse[], dias: number): { fecha: string; total: number }[] {
    const resultado: { [key: string]: number } = {};
    const hoy = new Date();

    for (let i = dias - 1; i >= 0; i--) {
      const fecha = new Date(hoy);
      fecha.setDate(fecha.getDate() - i);
      fecha.setHours(0, 0, 0, 0);
      const key = fecha.toISOString().split('T')[0];
      resultado[key] = 0;
    }

    pagos.forEach(p => {
      const fechaPago = new Date(p.fechaPago);
      fechaPago.setHours(0, 0, 0, 0);
      const key = fechaPago.toISOString().split('T')[0];
      if (resultado[key] !== undefined) {
        resultado[key] += p.monto || 0;
      }
    });

    return Object.keys(resultado).map(fecha => ({
      fecha: new Date(fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }),
      total: resultado[fecha]
    }));
  }

  private calcularVentasPorMes(pagos: PagoResponse[], meses: number): { mes: string; total: number }[] {
    const resultado: { [key: string]: number } = {};
    const hoy = new Date();

    for (let i = meses - 1; i >= 0; i--) {
      const fecha = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
      const key = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
      resultado[key] = 0;
    }

    pagos.forEach(p => {
      const fechaPago = new Date(p.fechaPago);
      const key = `${fechaPago.getFullYear()}-${String(fechaPago.getMonth() + 1).padStart(2, '0')}`;
      if (resultado[key] !== undefined) {
        resultado[key] += p.monto || 0;
      }
    });

    return Object.keys(resultado).map(key => {
      const [year, month] = key.split('-');
      const fecha = new Date(parseInt(year), parseInt(month) - 1, 1);
      return {
        mes: fecha.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' }),
        total: resultado[key]
      };
    });
  }

  private calcularProductosMasVendidos(pedidos: PedidoResponse[]): { producto: string; cantidad: number; total: number }[] {
    const productos: { [key: string]: { cantidad: number; total: number } } = {};

    pedidos.forEach(p => {
      p.detalles?.forEach(d => {
        const nombre = d.nombreProducto || 'Producto desconocido';
        if (!productos[nombre]) {
          productos[nombre] = { cantidad: 0, total: 0 };
        }
        productos[nombre].cantidad += d.cantidad || 0;
        productos[nombre].total += d.totalDetalle || 0;
      });
    });

    return Object.keys(productos)
      .map(producto => ({
        producto,
        cantidad: productos[producto].cantidad,
        total: productos[producto].total
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }

  private calcularVentasPorDiaDesdePedidos(pedidos: PedidoResponse[], dias: number): { fecha: string; total: number }[] {
    const resultado: { [key: string]: number } = {};
    const hoy = new Date();

    for (let i = dias - 1; i >= 0; i--) {
      const fecha = new Date(hoy);
      fecha.setDate(fecha.getDate() - i);
      fecha.setHours(0, 0, 0, 0);
      const key = fecha.toISOString().split('T')[0];
      resultado[key] = 0;
    }

    pedidos.forEach(p => {
      const fechaPedido = new Date(p.fechaPedido);
      fechaPedido.setHours(0, 0, 0, 0);
      const key = fechaPedido.toISOString().split('T')[0];
      if (resultado[key] !== undefined) {
        const totalPedido = p.total || (p.detalles?.reduce((s, d) => s + (d.totalDetalle || 0), 0) || 0);
        resultado[key] += totalPedido;
      }
    });

    return Object.keys(resultado).map(fecha => ({
      fecha: new Date(fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }),
      total: resultado[fecha]
    }));
  }

  private calcularVentasPorMesDesdePedidos(pedidos: PedidoResponse[], meses: number): { mes: string; total: number }[] {
    const resultado: { [key: string]: number } = {};
    const hoy = new Date();

    for (let i = meses - 1; i >= 0; i--) {
      const fecha = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
      const key = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
      resultado[key] = 0;
    }

    pedidos.forEach(p => {
      const fechaPedido = new Date(p.fechaPedido);
      const key = `${fechaPedido.getFullYear()}-${String(fechaPedido.getMonth() + 1).padStart(2, '0')}`;
      if (resultado[key] !== undefined) {
        const totalPedido = p.total || (p.detalles?.reduce((s, d) => s + (d.totalDetalle || 0), 0) || 0);
        resultado[key] += totalPedido;
      }
    });

    return Object.keys(resultado).map(key => {
      const [year, month] = key.split('-');
      const fecha = new Date(parseInt(year), parseInt(month) - 1, 1);
      return {
        mes: fecha.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' }),
        total: resultado[key]
      };
    });
  }

  private getReporteVacio(): ReporteVentas {
    return {
      ventasTotales: 0,
      ventasHoy: 0,
      pedidosTotales: 0,
      pedidosHoy: 0,
      promedioPorPedido: 0,
      ventasPorDia: [],
      ventasPorMes: [],
      productosMasVendidos: []
    };
  }
}

