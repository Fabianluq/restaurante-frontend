import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiClientService } from './api-client.service';
import { EmpleadoRequest, EmpleadoResponse, Rol } from '../models/empleado.models';

@Injectable({
  providedIn: 'root'
})
export class EmpleadoService {

  constructor(private apiClient: ApiClientService) { }

  // Crear empleado
  crearEmpleado(empleado: EmpleadoRequest): Observable<EmpleadoResponse | { error: any }> {
    return this.apiClient.post<EmpleadoResponse>('/empleados', empleado);
  }

  // Listar empleados
  listarEmpleados(): Observable<EmpleadoResponse[] | { error: any }> {
    return this.apiClient.get<EmpleadoResponse[]>('/empleados');
  }

  // Buscar por ID
  buscarPorId(id: number): Observable<EmpleadoResponse | { error: any }> {
    return this.apiClient.get<EmpleadoResponse>(`/empleados/${id}`);
  }

  // Buscar por nombre
  buscarPorNombre(nombre: string): Observable<EmpleadoResponse[] | { error: any }> {
    return this.apiClient.get<EmpleadoResponse[]>(`/empleados/buscar/nombre`, { params: { nombre } });
  }

  // Buscar por correo
  buscarPorCorreo(correo: string): Observable<EmpleadoResponse | { error: any }> {
    return this.apiClient.get<EmpleadoResponse>(`/empleados/buscar/correo`, { params: { correo } });
  }

  // Listar por rol
  listarPorRol(rolId: number): Observable<EmpleadoResponse[] | { error: any }> {
    return this.apiClient.get<EmpleadoResponse[]>(`/empleados/rol/${rolId}`);
  }

  // Actualizar empleado
  actualizarEmpleado(id: number, empleado: EmpleadoRequest): Observable<EmpleadoResponse | { error: any }> {
    return this.apiClient.put<EmpleadoResponse>(`/empleados/${id}`, empleado);
  }

  // Eliminar empleado
  eliminarEmpleado(id: number): Observable<{ ok: true } | { error: any }> {
    return this.apiClient.delete(`/empleados/${id}`).pipe(
      map((res: any) => {
        if (res && res.error === 'Empty response') {
          return { ok: true } as const;
        }
        if (res && res.error) {
          return res;
        }
        return { ok: true } as const;
      })
    );
  }

  // Listar roles
  listarRoles(): Observable<Rol[] | { error: any }> {
    return this.apiClient.get<Rol[]>('/roles');
  }
}