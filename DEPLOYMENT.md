# 🚀 Guía de Despliegue - Configuración de Rutas SPA

## ⚠️ Problema: Error 404 al recargar la página

Cuando recargas una página en una ruta como `/mesero/pedidos/crear`, el servidor busca un archivo físico en esa ruta, pero como es una SPA (Single Page Application), todas las rutas deben redirigir a `index.html` para que Angular Router maneje el routing del lado del cliente.

## ✅ Solución Automática

El archivo `.htaccess` ya está configurado en `public/.htaccess` y se copia automáticamente al build. **Solo necesitas asegurarte de que tu servidor esté configurado correctamente.**

## 📋 Pasos para Despliegue

### 1. Hacer Build de Producción

```bash
npm run build
# o
ng build --configuration production
```

Esto creará los archivos en `dist/restaurante-frontend/browser/`

### 2. Verificar que `.htaccess` esté en el build

Después del build, verifica que el archivo `.htaccess` esté en:
```
dist/restaurante-frontend/browser/.htaccess
```

Si no está, cópialo manualmente:
```bash
cp public/.htaccess dist/restaurante-frontend/browser/.htaccess
```

### 3. Configurar el Servidor

#### Opción A: Apache (Más común)

1. **Sube los archivos** de `dist/restaurante-frontend/browser/` a tu servidor

2. **Asegúrate de que mod_rewrite esté habilitado:**
   ```bash
   sudo a2enmod rewrite
   sudo systemctl restart apache2
   ```

3. **Configura el VirtualHost** para permitir `.htaccess`:
   ```apache
   <VirtualHost *:80>
       ServerName tu-dominio.com
       DocumentRoot /var/www/restaurante-frontend/browser
       
       <Directory /var/www/restaurante-frontend/browser>
           Options Indexes FollowSymLinks
           AllowOverride All
           Require all granted
       </Directory>
   </VirtualHost>
   ```

4. **Reinicia Apache:**
   ```bash
   sudo systemctl restart apache2
   ```

#### Opción B: Nginx

1. **Copia el archivo `nginx.conf`** y edítalo con tus datos:
   ```bash
   sudo cp nginx.conf /etc/nginx/sites-available/restaurante-frontend
   sudo nano /etc/nginx/sites-available/restaurante-frontend
   ```

2. **Edita las rutas:**
   - Cambia `server_name tu-dominio.com` → Tu dominio real
   - Cambia `root /var/www/...` → La ruta real donde está tu build

3. **Crea el symlink:**
   ```bash
   sudo ln -s /etc/nginx/sites-available/restaurante-frontend /etc/nginx/sites-enabled/
   ```

4. **Prueba y recarga:**
   ```bash
   sudo nginx -t
   sudo systemctl reload nginx
   ```

#### Opción C: Node.js/Express (Servidor propio)

Crea un archivo `server.js` en la raíz del proyecto:

```javascript
const express = require('express');
const path = require('path');
const app = express();

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, 'dist/restaurante-frontend/browser')));

// Todas las rutas redirigen a index.html (SPA routing)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist/restaurante-frontend/browser/index.html'));
});

const port = process.env.PORT || 4200;
app.listen(port, () => {
  console.log(`Servidor corriendo en puerto ${port}`);
});
```

Luego ejecuta:
```bash
node server.js
```

## 🔍 Verificación

Después de configurar:

1. Navega a una ruta como: `http://tu-dominio.com/mesero/pedidos/crear`
2. Recarga la página (F5 o Ctrl+R)
3. **No debería aparecer error 404** ✅

## 🐛 Troubleshooting

### Error 404 persiste:

1. **Verifica que `.htaccess` esté en el build:**
   ```bash
   ls -la dist/restaurante-frontend/browser/.htaccess
   ```

2. **Verifica permisos:**
   ```bash
   chmod 644 dist/restaurante-frontend/browser/.htaccess
   ```

3. **Revisa los logs del servidor:**
   - Apache: `sudo tail -f /var/log/apache2/error.log`
   - Nginx: `sudo tail -f /var/log/nginx/error.log`

4. **Verifica que mod_rewrite esté habilitado (Apache):**
   ```bash
   apache2ctl -M | grep rewrite
   ```

### El servidor no recarga:

- Reinicia el servidor: `sudo systemctl restart apache2` o `sudo systemctl restart nginx`
- Verifica la configuración: `sudo nginx -t` o `sudo apache2ctl configtest`

## 📝 Notas Importantes

- **Después de cada build**, verifica que `.htaccess` esté en la carpeta `browser`
- La configuración de Nginx debe apuntar a la carpeta `browser` dentro de `dist/restaurante-frontend`
- Si cambias de servidor, actualiza la configuración correspondiente
- El archivo `.htaccess` en `public/` se copia automáticamente al build gracias a la configuración en `angular.json`

