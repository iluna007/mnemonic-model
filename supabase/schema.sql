-- Ejecuta este script en el SQL Editor de tu proyecto Supabase
-- (Dashboard > SQL Editor > New query)

-- Tabla de modelos subidos (cada archivo .3dm)
create table if not exists public.models (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  storage_path text not null unique,
  created_at timestamptz default now()
);

-- Tabla de comentarios (puntos en el modelo con texto)
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  model_id uuid not null references public.models(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  position jsonb not null default '{"x":0,"y":0,"z":0}',
  body text not null,
  created_at timestamptz default now()
);

-- Perfiles opcionales (nombre para mostrar; auth.users ya tiene email/avatar)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  updated_at timestamptz default now()
);

-- RLS
alter table public.models enable row level security;
alter table public.comments enable row level security;
alter table public.profiles enable row level security;

-- Models: usuario ve sus propios modelos; cualquiera puede leer uno por id (para ver + comentar)
create policy "Users can insert own models"
  on public.models for insert with check (auth.uid() = user_id);
create policy "Users can read own models"
  on public.models for select using (auth.uid() = user_id);
create policy "Anyone can read a model by id (for viewing shared model)"
  on public.models for select using (true);
create policy "Users can delete own models"
  on public.models for delete using (auth.uid() = user_id);

-- Comments: cualquiera puede leer comentarios de un modelo; solo usuarios autenticados insertan
create policy "Anyone can read comments for a model"
  on public.comments for select using (true);
create policy "Authenticated users can insert comments"
  on public.comments for insert with check (auth.uid() = user_id);
create policy "Users can delete own comments"
  on public.comments for delete using (auth.uid() = user_id);

-- Profiles: leer todos; cada uno actualiza el suyo
create policy "Profiles are viewable by everyone"
  on public.profiles for select using (true);
create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);
create policy "Users can insert own profile"
  on public.profiles for insert with check (auth.uid() = id);

-- Storage: crear bucket "models" en Dashboard > Storage > New bucket (Private).
-- Luego en Storage > Policies > New policy (o SQL):

-- Permitir a usuarios autenticados subir en bucket "models" (path: user_id/xxx.3dm)
-- create policy "Upload models"
--   on storage.objects for insert to authenticated
--   with check (bucket_id = 'models');

-- Permitir a usuarios autenticados leer cualquier archivo del bucket (para signed URL)
-- create policy "Read models"
--   on storage.objects for select to authenticated
--   using (bucket_id = 'models');
