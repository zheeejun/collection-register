-- Run once in the Supabase SQL Editor. Each account owns one versioned snapshot.
begin;

create table public.libraries (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{"version":1,"books":[],"locations":[]}'::jsonb,
  revision integer not null default 1 check (revision > 0),
  updated_at timestamptz not null default now(),
  constraint library_shape check (
    jsonb_typeof(data) = 'object'
    and data @> '{"version":1}'::jsonb
    and jsonb_typeof(data -> 'books') = 'array'
    and jsonb_typeof(data -> 'locations') = 'array'
    and data ?& array['version', 'books', 'locations']
  )
);

alter table public.libraries enable row level security;
revoke all on public.libraries from anon, authenticated;
grant select on public.libraries to authenticated;
grant insert (user_id, data) on public.libraries to authenticated;
grant update (data) on public.libraries to authenticated;

create policy "Read own library" on public.libraries for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "Create own library" on public.libraries for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "Update own library" on public.libraries for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create function public.advance_library_revision() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.revision := old.revision + 1;
  new.updated_at := now();
  return new;
end;
$$;
revoke all on function public.advance_library_revision() from public;
create trigger advance_library_revision before update on public.libraries
  for each row execute function public.advance_library_revision();

commit;
