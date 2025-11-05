# 📤 CAMBIOS PARA SUBIR AL BACKEND

## ✅ Solo necesitas cambiar 2 archivos

---

## 1️⃣ **ReservaController.java**

**Ubicación**: `src/main/java/com/example/restaurApp/controllers/ReservaController.java`

**Agregar este método ANTES del método `crearReserva()` existente** (después de la línea 38):

```java
// Endpoint público para que los clientes puedan reservar sin autenticación
@PostMapping("/publica")
public ResponseEntity<ReservaResponse> crearReservaPublica(@Valid @RequestBody ReservaRequest request) {
    Reserva nuevaReserva = reservaService.crearReserva(request);
    return ResponseEntity.status(201).body(ReservaMapper.toResponse(nuevaReserva));
}
```

**Ubicación exacta**: Entre la línea 38 (cierre del constructor) y la línea 40 (método `crearReserva` existente).

---

## 2️⃣ **SecurityConfig.java**

**Ubicación**: `src/main/java/com/example/restaurApp/security/SecurityConfig.java`

**Agregar estas líneas DESPUÉS de la línea 66** (después de `.requestMatchers("/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html").permitAll()`):

```java
// Reservas públicas (clientes sin autenticación)
.requestMatchers(HttpMethod.POST, "/reservas/publica").permitAll()

// Menú público (clientes pueden ver productos sin autenticación)
.requestMatchers(HttpMethod.GET, "/productos").permitAll()
.requestMatchers(HttpMethod.GET, "/productos/{id}").permitAll()
.requestMatchers(HttpMethod.GET, "/categorias").permitAll()
```

**Ubicación exacta**: Después de la línea que tiene `.requestMatchers("/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html").permitAll()` y ANTES de la sección "ENDPOINTS COMPARTIDOS".

---

## 📋 **VERIFICACIÓN**

Después de hacer los cambios, verifica que:

1. ✅ El método `crearReservaPublica()` esté ANTES de `crearReserva()`
2. ✅ Los `permitAll()` estén en la sección de "ENDPOINTS PÚBLICOS"
3. ✅ No haya errores de compilación al hacer `mvn clean install`

---

## 🚀 **COMANDOS PARA PROBAR**

```bash
# Compilar
mvn clean install

# Ejecutar
mvn spring-boot:run
```

---

## ✅ **LISTO**

Con estos 2 cambios, los clientes podrán:
- ✅ Ver el menú sin login
- ✅ Reservar mesas sin login
- ✅ Acceder a la página de inicio pública

**¡Solo esos 2 archivos y listo!** 🎉

