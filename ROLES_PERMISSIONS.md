# RestaurApp - Permisos por Rol

## 📋 Resumen de Roles y Permisos

### 🔴 ADMIN - Control Total del Sistema
**Acceso completo a todas las funcionalidades de gestión**

**Rutas Frontend:**
- `/dashboard` - Dashboard principal
- `/empleados` - Gestión de empleados (CRUD)
- `/roles` - Gestión de roles (CRUD)
- `/pedidos/monitor` - Monitor de pedidos
- `/productos` - Gestión de productos (CRUD)
- `/clientes` - Gestión de clientes (CRUD)
- `/mesas` - Gestión de mesas (CRUD)
- `/menu` - Ver menú
- `/cajero/pagos` - Ver pagos (para reportes)

**Funcionalidades:**
- ✅ Crear, editar, eliminar empleados
- ✅ Crear, editar, eliminar roles
- ✅ Crear, editar, eliminar productos
- ✅ Crear, editar, eliminar categorías
- ✅ Crear, editar, eliminar clientes
- ✅ Crear, editar, eliminar mesas
- ✅ Ver todos los pedidos
- ✅ Eliminar pedidos y reservas
- ✅ Ver todos los pagos

---

### 🍳 COCINERO - Gestión de Cocina
**Enfoque en preparación de pedidos**

**Rutas Frontend:**
- `/dashboard` - Dashboard
- `/cocina` - Vista de cocina (pedidos pendientes/en preparación)
- `/menu` - Ver menú

**Funcionalidades:**
- ✅ Ver pedidos (todos los estados)
- ✅ Cambiar estado: Pendiente → En Preparación → Listo
- ✅ Ver detalles de pedidos
- ✅ Ver menú de productos

**No puede:**
- ❌ Crear pedidos
- ❌ Eliminar pedidos
- ❌ Gestionar empleados, productos, mesas, etc.

---

### 🍽️ MESERO - Atención al Cliente
**Enfoque en creación de pedidos y atención de mesas**

**Rutas Frontend:**
- `/dashboard` - Dashboard
- `/mesero/mesas` - Vista de mesas (ocupar y crear pedidos)
- `/mesero/pedidos/crear` - Crear nuevo pedido
- `/mesero/pedidos` - Mis pedidos (pedidos asignados)
- `/menu` - Ver menú

**Funcionalidades:**
- ✅ Ver mesas disponibles/ocupadas
- ✅ Ocupar mesas
- ✅ Crear nuevos pedidos
- ✅ Ver sus propios pedidos
- ✅ Cambiar estado: Marcar como "Entregado"
- ✅ Ver detalles de pedidos
- ✅ Gestionar reservas (crear, ver, actualizar)

**No puede:**
- ❌ Eliminar pedidos
- ❌ Gestionar empleados, productos, mesas, etc.
- ❌ Procesar pagos

---

### 💰 CAJERO - Procesamiento de Pagos
**Enfoque en cobros y facturación**

**Rutas Frontend:**
- `/dashboard` - Dashboard
- `/cajero/pagos` - Pagos pendientes (pedidos listos para cobrar)
- `/menu` - Ver menú

**Funcionalidades:**
- ✅ Ver pedidos listos para cobrar
- ✅ Procesar pagos (crear pago)
- ✅ Ver facturas
- ✅ Imprimir facturas
- ✅ Ver historial de pagos

**No puede:**
- ❌ Crear pedidos
- ❌ Cambiar estado de pedidos
- ❌ Gestionar empleados, productos, mesas, etc.
- ❌ Eliminar pedidos

---

## 🔐 Flujo de Trabajo por Rol

### Flujo COCINERO:
1. Ver pedidos pendientes en `/cocina`
2. Iniciar preparación: Cambiar estado a "En Preparación"
3. Marcar como "Listo" cuando termine
4. El pedido queda disponible para el mesero entregar

### Flujo MESERO:
1. Ver mesas en `/mesero/mesas`
2. Ocupar una mesa disponible
3. Crear pedido desde la mesa ocupada
4. Ver sus pedidos en `/mesero/pedidos`
5. Marcar como "Entregado" cuando lo entregue al cliente
6. El pedido queda disponible para el cajero cobrar

### Flujo CAJERO:
1. Ver pedidos listos para cobrar en `/cajero/pagos`
2. Seleccionar pedido y procesar pago
3. Generar y mostrar factura
4. Opción de imprimir factura

---

## 📝 Notas Importantes

- **Todos los roles** pueden ver el menú (`/menu`)
- **Todos los roles** pueden ver su propio perfil (GET `/empleados/{id}`)
- **Todos los roles** pueden ver estados (GET `/estados/**`)
- **Todos los roles** pueden ver pedidos (GET `/pedidos/**`) - cada uno para su trabajo
- Solo **ADMIN** puede eliminar pedidos y reservas
- Solo **ADMIN** puede gestionar CRUD completo de productos, categorías, clientes, mesas, empleados

