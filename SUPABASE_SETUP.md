# Configuración de Supabase (login, modelos y comentarios)

Para que funcionen el login, la subida de modelos y los comentarios en 3D, configura un proyecto en [Supabase](https://supabase.com) (plan gratuito) y sigue estos pasos.

## 1. Crear proyecto

1. Entra en [supabase.com](https://supabase.com) y crea un proyecto.
2. En **Settings > API** copia:
   - **Project URL** → `VITE_SUPABASE_URL` en tu `.env`
   - **anon public** key → `VITE_SUPABASE_ANON_KEY` en tu `.env`
3. Crea el archivo `.env` en la raíz del proyecto (junto a `package.json`) con:

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key
```

**Importante:** El archivo debe llamarse `.env` (no `.env.example`) y estar en la raíz del proyecto. Después de crear o modificar `.env`, **reinicia el servidor** (`npm run dev`).

### Si ves "Failed to fetch" al registrar o iniciar sesión

1. **Comprueba el `.env`:** Debe tener exactamente `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` (sin espacios extra). La URL debe ser como `https://xxxxx.supabase.co`.
2. **Reinicia el servidor:** Para que Vite cargue las variables, para el proceso y vuelve a ejecutar `npm run dev`.
3. **Proyecto pausado:** En el dashboard de Supabase, si el proyecto está inactivo un tiempo, se pausa. Entra en el proyecto y pulsa **Restore** si aparece "Project paused".
4. **Conexión:** Comprueba que tienes internet y que ningún firewall bloquea `*.supabase.co`.

## 2. Base de datos

En el **SQL Editor** de Supabase, ejecuta el contenido del archivo `supabase/schema.sql` (tablas `models`, `comments`, `profiles`, políticas RLS).

## 3. Storage (archivos .3dm)

**Límite de tamaño:** En el **plan gratuito** de Supabase el tamaño máximo por archivo es **50 MB**. Si tu .3dm es mayor, reduce la geometría en Rhino o exporta solo las capas necesarias. En planes de pago el límite es mayor (hasta 50 GB con subida resumible).

1. Ve a **Storage** y crea un bucket nuevo:
   - Nombre: `models`
   - **Private** (marcado).
2. En **Storage > Policies** (o en SQL), añade:

   - **INSERT**: usuarios autenticados pueden subir.
   - **SELECT**: usuarios autenticados pueden leer (para generar URLs firmadas).

Ejemplo en la pestaña Policy del bucket:

- Policy name: `Upload models`  
  - Allowed operation: INSERT  
  - Target roles: authenticated  
  - WITH CHECK: `bucket_id = 'models'`

- Policy name: `Read models`  
  - Allowed operation: SELECT  
  - Target roles: authenticated  
  - USING: `bucket_id = 'models'`

## 4. Login con Google (opcional)

1. En [Google Cloud Console](https://console.cloud.google.com/) crea un proyecto (o usa uno existente).
2. **APIs & Services > Credentials > Create Credentials > OAuth client ID**.
   - Application type: **Web application**.
   - Authorized JavaScript origins: `http://localhost:5173` (y tu dominio en producción).
   - Authorized redirect URIs: copia la URL que te indica Supabase en **Authentication > Providers > Google** (algo como `https://tu-proyecto.supabase.co/auth/v1/callback`).
3. Copia **Client ID** y **Client Secret**.
4. En Supabase: **Authentication > Providers > Google** → activa el proveedor y pega Client ID y Client Secret.
5. En **Authentication > URL Configuration** añade en "Redirect URLs" tu URL de producción si la usas.

Tras esto, en la app aparecerá "Continuar con Google" en login y registro.

## 5. Probar en local

1. `npm install` (incluye `@supabase/supabase-js`).
2. `npm run dev`.
3. Regístrate o inicia sesión (email o Google).
4. En el visor, sube un .3dm y pulsa **Subir modelo**.
5. En **Mis modelos** abre el modelo y usa **Añadir comentario** → clic en el modelo → escribe y guarda. Los comentarios se ven como esferas naranjas; al hacer clic se muestra el texto.
