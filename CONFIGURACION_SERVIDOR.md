# 🔧 Configuración del Servidor para Angular SPA

Este documento explica cómo configurar el servidor para que el Angular SPA funcione correctamente sin errores 404 al recargar la página.

## 📋 Problema

Cuando recargas una página en una ruta como `/mis-reservas`, el servidor busca un archivo físico en esa ruta, pero como es una SPA (Single Page Application), todas las rutas deben redirigir a `index.html` para que Angular Router maneje el routing del lado del cliente.

## 🚀 Soluciones

### Opción 1: Nginx (Recomendado)

Si estás usando Nginx, sigue estos pasos:

1. **Copia el archivo `nginx.conf` a tu servidor:**
   ```bash
   sudo cp nginx.conf /etc/nginx/sites-available/restaurante-frontend
   ```

2. **Edita el archivo con tus datos:**
   ```bash
   sudo nano /etc/nginx/sites-available/restaurante-frontend
   ```
   
   Cambia:
   - `server_name tu-dominio.com` → Tu dominio real
   - `root /var/www/restaurante-frontend/dist/restaurante-frontend/browser` → La ruta real donde está tu build

3. **Crea el symlink:**
   ```bash
   sudo ln -s /etc/nginx/sites-available/restaurante-frontend /etc/nginx/sites-enabled/
   ```

4. **Prueba la configuración:**
   ```bash
   sudo nginx -t
   ```

5. **Recarga Nginx:**
   ```bash
   sudo systemctl reload nginx
   ```

### Opción 2: Apache

Si estás usando Apache:

1. **Copia el archivo `.htaccess` a la carpeta de tu build:**
   ```bash
   cp .htaccess dist/restaurante-frontend/browser/
   ```

2. **Asegúrate de que mod_rewrite esté habilitado:**
   ```bash
   sudo a2enmod rewrite
   sudo systemctl restart apache2
   ```

3. **Configura el VirtualHost para permitir .htaccess:**
   ```apache
   <VirtualHost *:80>
       ServerName tu-dominio.com
       DocumentRoot /var/www/restaurante-frontend/dist/restaurante-frontend/browser
       
       <Directory /var/www/restaurante-frontend/dist/restaurante-frontend/browser>
           Options Indexes FollowSymLinks
           AllowOverride All
           Require all granted
       </Directory>
   </VirtualHost>
   ```

### Opción 3: Servidor de Desarrollo (ng serve)

Si estás usando `ng serve` en desarrollo, esto ya está configurado automáticamente. Solo funciona para desarrollo local.

### Opción 4: Node.js/Express

Si estás usando Node.js con Express:

```javascript
const express = require('express');
const path = require('path');
const app = express();

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, 'dist/restaurante-frontend/browser')));

// Todas las rutas redirigen a index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist/restaurante-frontend/browser/index.html'));
});

const port = process.env.PORT || 4200;
app.listen(port, () => {
  console.log(`Servidor corriendo en puerto ${port}`);
});
```

## ✅ Verificación

Después de configurar, prueba:

1. Navega a una ruta como: `http://tu-dominio.com/mis-reservas`
2. Recarga la página (F5 o Ctrl+R)
3. **No debería aparecer error 404**

## 📝 Notas Importantes

- **Después de hacer build**, asegúrate de copiar el `.htaccess` o actualizar la configuración de Nginx
- La configuración de Nginx debe apuntar a la carpeta `browser` dentro de `dist/restaurante-frontend`
- Si cambias de servidor, actualiza la configuración correspondiente

## 🔍 Troubleshooting

### Error 404 persiste:
- Verifica que el archivo `index.html` existe en la ruta especificada
- Verifica los permisos de archivos
- Revisa los logs del servidor: `sudo tail -f /var/log/nginx/error.log`

### El servidor no recarga:
- Reinicia el servidor: `sudo systemctl restart nginx` o `sudo systemctl restart apache2`
- Verifica que la configuración es válida: `sudo nginx -t`

