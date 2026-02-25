# Mnemonic Model es un Visor 3D de modelos Rhino (.3dm) con comentarios colaborativos

Aplicación web construida con **React + Vite + Three.js** para visualizar modelos 3D de Rhino (`.3dm`) directamente en el navegador, con:

- Carga de modelos vía **drag & drop** y subida opcional a la nube.
- Navegación 3D con **OrbitControls** (rotación, zoom, pan).
- Sistema de **usuarios** (email/contraseña y Google Auth) sobre **Supabase Auth**.
- **Galería pública** de modelos subidos.
- Sistema de **comentarios espaciales**: cada comentario es un punto en el modelo, con panel tipo chat a la derecha.

En producción, la app se despliega en `https://mnemonicmodel.netlify.app/`.

---

## Características principales

- **Visor 3D de archivos Rhino (.3dm)**  
  - Carga local mediante drag & drop.  
  - Visualización mediante `three.js` y `Rhino3dmLoader`.  
  - Normalización de escala y orientación (Rhino Z-up → Three.js Y-up).
  - Controles de cámara: rotación, zoom y pan (OrbitControls).

- **Capas del modelo**  
  - Lectura de metadatos de capas de Rhino.  
  - Panel lateral izquierdo para **activar/desactivar** cada capa.

- **Autenticación de usuarios (Supabase Auth)**  
  - Registro con **email + contraseña + nickname**.  
  - Inicio de sesión con **Google OAuth** (si está configurado).  
  - Cada usuario tiene un **perfil** (`profiles`) con `display_name` (nickname).

- **Modelos en la nube (Supabase Storage)**  
  - Subida opcional de modelos `.3dm` al bucket `models`.  
  - Asociación de cada modelo a su **usuario propietario**.  
  - **Galería pública** (`/gallery`) con todos los modelos disponibles.  
  - **Mis modelos** (`/models`) para ver solo los modelos propios.

- **Comentarios espaciales en el modelo**  
  - Modo “**Añadir comentario**”:  
    1. Activar el modo.  
    2. Clic en el modelo 3D para fijar la posición.  
    3. Escribir el comentario en el modal.
  - Cada comentario se guarda con:
    - `model_id` (modelo al que pertenece),
    - `user_id` (autor),
    - `position` 3D (`x`, `y`, `z`),
    - texto, fecha y hora.
  - Los comentarios aparecen como **esferas de color** en el modelo.
  - Panel de la derecha tipo **chat**, mostrando:
    - **nickname** del autor (no se muestra el correo),
    - fecha y hora,
    - texto del comentario.

- **Colores por usuario**  
  - Cada usuario tiene un color asignado de forma determinista a partir de su `user_id`.  
  - Ese color se usa tanto para el **marcador 3D** como para el **punto de color** en la lista de comentarios.

- **Límites y consideraciones**  
  - En el plan gratuito de Supabase, cada archivo `.3dm` tiene un límite de **50 MB**.  
  - La UI muestra el tamaño del archivo seleccionado y avisa si supera el límite antes de intentar subirlo.

---

## Stack tecnológico

- **Frontend**
  - `React` + `Vite`
  - `react-router-dom`: enrutamiento (visor, galería, login, etc.).
  - `@react-three/fiber` y `@react-three/drei`: integración de Three.js con React.
  - `three` y `three-stdlib`: motor 3D y `Rhino3dmLoader`.

- **Backend as a Service**
  - **Supabase**
    - Auth (email/password + Google OAuth).
    - Base de datos PostgreSQL (tablas `models`, `comments`, `profiles`).
    - Storage para archivos `.3dm`.
    - RLS (Row Level Security) para aislar datos por usuario cuando corresponde.

---

## Estructura de datos (resumen)

- `public.models`
  - `id` (uuid, PK)
  - `user_id` (uuid, FK → `auth.users.id`)
  - `name` (nombre del archivo)
  - `storage_path` (ruta en el bucket de Storage)
  - `created_at`

- `public.comments`
  - `id` (uuid, PK)
  - `model_id` (uuid, FK → `models.id`)
  - `user_id` (uuid, FK → `auth.users.id`)
  - `position` (jsonb `{ x, y, z }`)
  - `body` (texto)
  - `created_at`

- `public.profiles`
  - `id` (uuid, PK, FK → `auth.users.id`)
  - `display_name` (nickname visible en la UI)
  - `avatar_url` (opcional)
  - `updated_at`

Un trigger (`handle_new_user`) rellena automáticamente `profiles` al crear usuarios en Supabase, usando `display_name` del registro o el nombre de Google/email.

---

## Desarrollo local

Requisitos:

- Node.js 18+ recomendado.
- Proyecto Supabase configurado (ver apartado siguiente).

Instalación y arranque:

```bash
npm install
npm run dev
```

La app arrancará en `http://localhost:5173/`.

---

## Configuración de Supabase y Auth

La configuración detallada (tablas, RLS, Storage y Auth/Google) está documentada en:

- `supabase/schema.sql` – definición de tablas, políticas y trigger.  
- `supabase/reset.sql` – script para **borrar** tablas y trigger (reset) si necesitas empezar de cero.  
- `SUPABASE_SETUP.md` – guía paso a paso:
  - creación de proyecto Supabase,
  - variables de entorno (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`),
  - configuración de Storage (bucket `models`),
  - límites de tamaño de archivo,
  - configuración de Google OAuth (Google Cloud + Supabase Auth).

> **Importante:** después de modificar `.env`, hay que reiniciar el servidor de desarrollo para que Vite lea las nuevas variables.

---

## Flujo de uso

1. **Visor local (sin login)**  
   - Ir al `/` (inicio).  
   - Arrastrar un `.3dm` a la zona de carga para visualizarlo localmente.  
   - Navegar la escena con ratón (rotar, hacer zoom, pan).

2. **Subir modelo (requiere login)**  
   - Registrarse o iniciar sesión (email+password o Google).  
   - Cargar un `.3dm` localmente.  
   - Pulsar **“Subir modelo”** para guardarlo en Supabase y generar una entrada en la galería.

3. **Galería pública**  
   - Ir a `/gallery`.  
   - Seleccionar cualquier modelo para abrirlo en `/view/:modelId`.

4. **Comentarios espaciales**  
   - En `/view/:modelId`, activar **“Añadir comentario”**.  
   - Clic en el modelo 3D para fijar el punto.  
   - Escribir el texto en el modal y guardar.  
   - Ver los comentarios como puntos de color en el modelo y como mensajes en el panel derecho.

---

## Despliegue

La app está preparada para ser desplegada en servicios estáticos como **Netlify**, **Vercel** o similares:

- Build command: `npm run build`
- Directorio de publicación: `dist`

Asegúrate de configurar las variables de entorno de Vite en el proveedor de hosting (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) para que el Auth y la carga de modelos funcionen en producción.

