# Guía Técnica de Compilación, Despliegue y Base de Datos
**Proyecto: La Tierrita**

Este documento detalla los comandos exactos y procedimientos utilizados para actualizar, compilar y servir la aplicación en el VPS, así como el manejo de la base de datos autohospedada de Supabase.

---

## 🚀 1. Actualizar y Compilar la Aplicación Web (Frontend)

Cada vez que subas cambios a **GitHub** y quieras verlos reflejados en tu servidor de producción, debes ejecutar la siguiente secuencia en la terminal de tu VPS:

```bash
# 1. Navegar al directorio de la aplicación
cd /var/www/latierrita.app-2

# 2. Descargar los últimos cambios desde tu repositorio de GitHub
git pull origin main

# 3. Limpiar compilaciones anteriores y dependencias viejas para evitar conflictos
rm -rf dist node_modules package-lock.json

# 4. Instalar limpiamente todas las dependencias del proyecto (incluye Supabase SDK)
npm install

# 5. Generar la compilación oficial de producción (creará la carpeta /dist)
npm run build
```

---

## 🔑 2. Manejo de Variables de Entorno (`.env`)

Vite inyecta las variables de entorno en el código del navegador **durante el tiempo de compilación**. Si no están definidas en un archivo `.env` antes de ejecutar `npm run build`, la conexión con la base de datos fallará.

El archivo debe estar ubicado en: `/var/www/latierrita.app-2/.env`

### Configuración del archivo `.env`:
```env
VITE_SUPABASE_URL=https://api.latierrita.tech
VITE_SUPABASE_ANON_KEY=TU_ANON_KEY_DE_SUPABASE
```

*Nota: Para consultar tu `ANON_KEY` real desde el servidor de Supabase, puedes ejecutar:*
```bash
cat /opt/supabase/docker/.env | grep ANON_KEY
```

---

## 🗄️ 3. Actualizar y Administrar la Base de Datos (Supabase)

Tus servicios de Supabase corren de forma aislada dentro de contenedores de Docker en la ruta `/opt/supabase/docker`.

### Reiniciar contenedores de Supabase (Si hay cambios de red o configuración):
Si realizas modificaciones en la configuración del servidor o necesitas reiniciar la base de datos y sus servicios:
```bash
cd /opt/supabase/docker

# Detener los contenedores de Supabase de manera segura
docker compose down

# Iniciar todos los servicios en segundo plano (Background)
docker compose up -d
```

### Comprobar la salud de la base de datos y servicios:
```bash
docker ps
```
*Deberás ver que contenedores como `supabase-db`, `supabase-auth` y `supabase-rest` muestran el estado `Saludable` o `Up`.*

---

## 🌐 4. Mantenimiento del Servidor Web (Nginx)

Nginx es el encargado de recibir el tráfico web en los puertos `80` (HTTP) y `443` (HTTPS/SSL) y servir estáticamente tu carpeta compilada (`/dist`).

### Comandos de control para Nginx:

```bash
# Verificar que la sintaxis de configuración de Nginx no tenga errores
sudo nginx -t

# Reiniciar el servicio para aplicar cualquier cambio de rutas o archivos activos
sudo systemctl restart nginx

# Recargar configuración sin interrumpir conexiones activas (alternativa suave)
sudo systemctl reload nginx
```

### Rutas activas de Nginx en producción:
* **Configuración del sitio:** `/etc/nginx/sites-available/latierrita` (enlazado a `/etc/nginx/sites-enabled/latierrita`)
* **Carpeta Raíz del Servidor (Document Root):** `/var/www/latierrita.app-2/dist`
* **Configuración por defecto eliminada:** `/etc/nginx/sites-enabled/default` (se deshabilitó para evitar que interfiriera con tu dominio real).

---

## 🛠️ Solución de Problemas Comunes (Cheat Sheet)

### "Failed to resolve module specifier..." (Error del navegador)
* **Causa:** El servidor está entregando la carpeta raíz de desarrollo en lugar de `/dist`.
* **Solución:** Comprueba que en tu configuración de Nginx la directiva `root` termine en `/dist` y que hayas ejecutado `sudo rm -f /etc/nginx/sites-enabled/default`.

### "supabaseKey is required" / Variables no definidas
* **Causa:** Compilaste el proyecto con `npm run build` sin haber creado el archivo `.env` o sin que tuviera las claves correctas.
* **Solución:** Revisa el archivo `.env` en la raíz del proyecto y vuelve a correr `npm run build`.

### "Error seeding... violations of Row-Level Security (RLS) [Error 42501]"
* **Causa:** El script de siembra generaba un token JWT con una clave fija que no coincide con el `JWT_SECRET` real de tu servidor Supabase, denegando el permiso de inserción.
* **Solución:** Ejecuta el sembrador inyectando la clave `SERVICE_ROLE_KEY` real de tu servidor. Esta clave tiene permisos de súper administrador y salta las reglas de RLS.
  ```bash
  cd /var/www/latierrita.app-2
  # Leer la clave service_role del .env de Supabase y correr el sembrador
  export SERVICE_ROLE_KEY=$(grep -E "^SERVICE_ROLE_KEY=" /opt/supabase/docker/.env | cut -d'=' -f2 | tr -d '"\r')
  export VITE_SUPABASE_URL=https://api.latierrita.tech
  export VITE_SUPABASE_ANON_KEY=$(grep -E "^ANON_KEY=" /opt/supabase/docker/.env | cut -d'=' -f2 | tr -d '"\r')
  npx tsx run_seed.ts
  ```

### "Could not find the 'comments' / 'reactions' column [Error PGRST204]"
* **Causa:** El esquema de base de datos de tu VPS no cuenta con estas columnas en las tablas `posts` o `stories`, las cuales son requeridas para la siembra y el correcto funcionamiento de la app.
* **Solución:** Ejecuta estas sentencias SQL dentro del contenedor de la base de datos de Supabase para añadir las columnas faltantes y recargar la caché del esquema:
  1. Entra al contenedor de la base de datos en la terminal de tu VPS:
     ```bash
     docker exec -it supabase-db psql -U postgres
     ```
  2. Pega y ejecuta las siguientes consultas SQL:
     ```sql
     -- Añadir columnas requeridas en la tabla 'posts'
     ALTER TABLE posts ADD COLUMN IF NOT EXISTS comments JSONB DEFAULT '[]'::jsonb;
     ALTER TABLE posts ADD COLUMN IF NOT EXISTS ad_cta_text TEXT;

     -- Añadir columnas requeridas en la tabla 'stories'
     ALTER TABLE stories ADD COLUMN IF NOT EXISTS reactions JSONB DEFAULT '[]'::jsonb;

     -- Recargar la caché de PostgREST para que reconozca los cambios inmediatamente
     NOTIFY pgrst, 'reload schema';
     ```
  3. Escribe `\q` y presiona Enter para salir de la consola de PostgreSQL.

