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
import { NoAuthGuard } from './core/guards/no-auth.guard';
import { AuthGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [NoAuthGuard]
  },
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
  {
    path: 'pedidos/monitor',
    component: MonitorPedidos,
    canActivate: [AuthGuard],
    data: { roles: ['ADMIN'] }
  },
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
  {
    path: 'menu',
    component: MenuComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [AuthGuard]
  },
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
