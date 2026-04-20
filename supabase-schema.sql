-- ============================================================
-- EventHive: Schema de usuarios, roles e invitaciones
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- ============================================================

-- Tabla: profiles
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique,
  full_name text,
  avatar_url text,
  role text not null default 'organizer' check (role in ('organizer', 'admin')),
  created_at timestamp with time zone default timezone('utc', now()) not null
);

-- Tabla: invitations
create table invitations (
  id uuid default gen_random_uuid() primary key,
  email text not null,
  role text not null default 'organizer' check (role in ('organizer')),
  invited_by uuid references profiles(id) on delete cascade not null,
  token uuid default gen_random_uuid() unique not null,
  used boolean default false,
  expires_at timestamp with time zone default (timezone('utc', now()) + interval '7 days'),
  created_at timestamp with time zone default timezone('utc', now()) not null
);

-- ============================================================
-- Trigger: crea perfil al registrarse
-- - Primer usuario => admin
-- - Con invitación válida => organizer
-- - Sin invitación => bloquea el registro (se maneja en el cliente)
-- ============================================================
create or replace function public.handle_new_user()
returns trigger as $$
declare
  user_count int;
  invite_role text;
begin
  select count(*) into user_count from public.profiles;

  select role into invite_role
  from public.invitations
  where email = new.email
    and used = false
    and expires_at > now()
  limit 1;

  insert into public.profiles (id, full_name, avatar_url, role)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    case
      when user_count = 0 then 'admin'
      when invite_role is not null then invite_role
      else 'organizer'
    end
  );

  -- Marcar invitación como usada
  update public.invitations
  set used = true
  where email = new.email and used = false;

  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- Row Level Security
-- ============================================================

alter table profiles enable row level security;
alter table invitations enable row level security;

-- profiles: todos pueden ver, cada quien edita el suyo (sin cambiar role)
create policy "Perfiles visibles para todos"
  on profiles for select using (true);

create policy "Usuario edita su perfil"
  on profiles for update
  using (auth.uid() = id)
  with check (role = (select role from profiles where id = auth.uid()));

-- invitations: solo admin
create policy "Admin ve invitaciones"
  on invitations for select
  using ((select role from profiles where id = auth.uid()) = 'admin');

create policy "Admin crea invitaciones"
  on invitations for insert
  with check ((select role from profiles where id = auth.uid()) = 'admin');

create policy "Admin elimina invitaciones"
  on invitations for delete
  using ((select role from profiles where id = auth.uid()) = 'admin');

-- ============================================================
-- Organizaciones multi-empresa
-- ============================================================

create table organizations (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  logo_url text,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamp with time zone default timezone('utc', now()) not null
);

create table organization_members (
  id uuid default gen_random_uuid() primary key,
  organization_id uuid references organizations(id) on delete cascade not null,
  profile_id uuid references profiles(id) on delete cascade not null,
  role text not null default 'member' check (role in ('owner', 'member')),
  created_at timestamp with time zone default timezone('utc', now()) not null,
  unique(organization_id, profile_id)
);

alter table organizations enable row level security;
alter table organization_members enable row level security;

-- Cualquier usuario autenticado puede ver orgs
create policy "Orgs visibles para autenticados" on organizations for select
  using (auth.uid() is not null);

-- Solo el owner de la org puede editarla
create policy "Owner edita su org" on organizations for update
  using (
    exists (
      select 1 from organization_members
      where organization_id = id
        and profile_id = auth.uid()
        and role = 'owner'
    )
  );

-- Cualquier organizer/admin puede crear una org
create policy "Organizer crea org" on organizations for insert
  with check (auth.uid() is not null);

-- organization_members: visible para miembros de la org
create policy "Miembros ven su org" on organization_members for select
  using (profile_id = auth.uid() or
    exists (
      select 1 from organization_members om
      where om.organization_id = organization_id and om.profile_id = auth.uid()
    )
  );

-- Owner puede agregar/quitar miembros
create policy "Owner gestiona miembros" on organization_members for insert
  with check (
    exists (
      select 1 from organization_members
      where organization_id = organization_members.organization_id
        and profile_id = auth.uid()
        and role = 'owner'
    ) or profile_id = auth.uid() -- permite que el creador se agregue como owner
  );

create policy "Owner elimina miembros" on organization_members for delete
  using (
    profile_id = auth.uid() or
    exists (
      select 1 from organization_members om
      where om.organization_id = organization_id
        and om.profile_id = auth.uid()
        and om.role = 'owner'
    )
  );

-- ============================================================
-- Clientes por organización
-- ============================================================

create table clients (
  id uuid default gen_random_uuid() primary key,
  organization_id uuid references organizations(id) on delete cascade not null,
  name text not null,
  email text,
  phone text,
  address text,
  notes text,
  created_at timestamp with time zone default timezone('utc', now()) not null
);

alter table clients enable row level security;

-- Miembros de la org pueden ver sus clientes
create policy "Miembros ven clientes de su org" on clients for select
  using (
    exists (
      select 1 from organization_members
      where organization_id = clients.organization_id
        and profile_id = auth.uid()
    )
  );

-- Miembros de la org pueden crear clientes
create policy "Miembros crean clientes" on clients for insert
  with check (
    exists (
      select 1 from organization_members
      where organization_id = clients.organization_id
        and profile_id = auth.uid()
    )
  );

-- Miembros de la org pueden editar clientes
create policy "Miembros editan clientes" on clients for update
  using (
    exists (
      select 1 from organization_members
      where organization_id = clients.organization_id
        and profile_id = auth.uid()
    )
  );

-- Solo owners pueden eliminar clientes
create policy "Owner elimina clientes" on clients for delete
  using (
    exists (
      select 1 from organization_members
      where organization_id = clients.organization_id
        and profile_id = auth.uid()
        and role = 'owner'
    )
  );
