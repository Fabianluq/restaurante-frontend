// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { ListaEmpleados } from './pages/empleados/lista-empleados/lista-empleados';
import { EmpleadoForm } from './pages/empleados/empleado-form/empleado-form';
import { ListaRoles } from './pages/roles/lista-roles/lista-roles';
import { RolForm } from './pages/roles/rol-form/rol-form';
import { MonitorPedidos } from './pages/pedidos/monitor/monitor-pedidos';
import { ListaProductos } from './pages/productos/lista-productos/lista-productos';
import { ProductoForm } from './pages/productos/producto-form/producto-form';
import { ListaClientes } from './pages/clientes/lista-clientes/lista-clientes';
import { ClienteForm } from './pages/clientes/cliente-form/cliente-form';
import { ListaMesas } from './pages/mesas/lista-mesas/lista-mesas';
import { MesaForm } from './pages/mesas/mesa-form/mesa-form';
import { MenuComponent } from './pages/menu/menu.component';
import { VistaCocina } from './pages/pedidos/vista-cocina/vista-cocina';
import { MesasMesero } from './pages/mesero/mesas-mesero/mesas-mesero';
import { CrearPedido } from './pages/mesero/crear-pedido/crear-pedido';
import { MisPedidos } from './pages/mesero/mis-pedidos/mis-pedidos';
import { PagosCajero } from './pages/cajero/pagos-cajero/pagos-cajero';
import { PerfilComponent } from './pages/perfil/perfil.component';
import { ReportesComponent } from './pages/reportes/reportes';
import { NoAuthGuard } from './core/guards/no-auth.guard';
import { AuthGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  // ========================================
  // RUTA PÚBLICA
  // ========================================
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [NoAuthGuard]
  },
  
  // ========================================
  // RUTAS COMPARTIDAS (Todos los roles autenticados)
  // ========================================
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'menu',
    component: MenuComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'perfil',
    component: PerfilComponent,
    canActivate: [AuthGuard]
  },
  
  // ========================================
  // ROL: ADMIN - Control Total del Sistema
  // ========================================
  // Gestión de Empleados
  {
    path: 'empleados',
    component: ListaEmpleados,
    canActivate: [AuthGuard],
    data: { roles: ['ADMIN'] }
  },
  {
    path: 'empleados/crear',
    component: EmpleadoForm,
    canActivate: [AuthGuard],
    data: { roles: ['ADMIN'] }
  },
  {
    path: 'empleados/editar/:id',
    component: EmpleadoForm,
    canActivate: [AuthGuard],
    data: { roles: ['ADMIN'] }
  },
  
  // Gestión de Roles
  {
    path: 'roles',
    component: ListaRoles,
    canActivate: [AuthGuard],
    data: { roles: ['ADMIN'] }
  },
  {
    path: 'roles/crear',
    component: RolForm,
    canActivate: [AuthGuard],
    data: { roles: ['ADMIN'] }
  },
  {
    path: 'roles/editar/:id',
    component: RolForm,
    canActivate: [AuthGuard],
    data: { roles: ['ADMIN'] }
  },
  
  // Gestión de Productos
  {
    path: 'productos',
    component: ListaProductos,
    canActivate: [AuthGuard],
    data: { roles: ['ADMIN'] }
  },
  {
    path: 'productos/crear',
    component: ProductoForm,
    canActivate: [AuthGuard],
    data: { roles: ['ADMIN'] }
  },
  {
    path: 'productos/editar/:id',
    component: ProductoForm,
    canActivate: [AuthGuard],
    data: { roles: ['ADMIN'] }
  },
  
  // Gestión de Clientes
  {
    path: 'clientes',
    component: ListaClientes,
    canActivate: [AuthGuard],
    data: { roles: ['ADMIN'] }
  },
  {
    path: 'clientes/crear',
    component: ClienteForm,
    canActivate: [AuthGuard],
    data: { roles: ['ADMIN'] }
  },
  {
    path: 'clientes/editar/:id',
    component: ClienteForm,
    canActivate: [AuthGuard],
    data: { roles: ['ADMIN'] }
  },
  
  // Gestión de Mesas
  {
    path: 'mesas',
    component: ListaMesas,
    canActivate: [AuthGuard],
    data: { roles: ['ADMIN'] }
  },
  {
    path: 'mesas/crear',
    component: MesaForm,
    canActivate: [AuthGuard],
    data: { roles: ['ADMIN'] }
  },
  {
    path: 'mesas/editar/:id',
    component: MesaForm,
    canActivate: [AuthGuard],
    data: { roles: ['ADMIN'] }
  },
  
  // Monitor de Pedidos (vista completa para admin)
  {
    path: 'pedidos/monitor',
    component: MonitorPedidos,
    canActivate: [AuthGuard],
    data: { roles: ['ADMIN'] }
  },
  
  // Reportes y Estadísticas
  {
    path: 'reportes',
    component: ReportesComponent,
    canActivate: [AuthGuard],
    data: { roles: ['ADMIN'] }
  },
  
  // ========================================
  // ROL: COCINERO - Gestión de Cocina
  // ========================================
  {
    path: 'cocina',
    component: VistaCocina,
    canActivate: [AuthGuard],
    data: { roles: ['COCINERO'] }
  },
  
  // ========================================
  // ROL: MESERO - Gestión de Pedidos y Atención
  // ========================================
  {
    path: 'mesero/mesas',
    component: MesasMesero,
    canActivate: [AuthGuard],
    data: { roles: ['MESERO'] }
  },
  {
    path: 'mesero/pedidos',
    component: MisPedidos,
    canActivate: [AuthGuard],
    data: { roles: ['MESERO'] }
  },
  {
    path: 'mesero/pedidos/crear',
    component: CrearPedido,
    canActivate: [AuthGuard],
    data: { roles: ['MESERO'] }
  },
  
  // ========================================
  // ROL: CAJERO - Procesamiento de Pagos
  // ========================================
  {
    path: 'cajero/pagos',
    component: PagosCajero,
    canActivate: [AuthGuard],
    data: { roles: ['CAJERO'] }
  },
  
  // ========================================
  // RUTAS POR DEFECTO
  // ========================================
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'dashboard'
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];
