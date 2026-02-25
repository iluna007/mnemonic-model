-- RESET: borra tablas y trigger para empezar de cero.
-- Ejecuta en Supabase → SQL Editor → New query. Luego ejecuta schema.sql de nuevo.

-- 1. Quitar trigger y función
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

-- 2. Borrar tablas (orden: primero la que tiene FK a las otras; las políticas se borran solas)
drop table if exists public.comments;
drop table if exists public.models;
drop table if exists public.profiles;

-- Hecho. Vuelve a ejecutar supabase/schema.sql para recrear todo.
