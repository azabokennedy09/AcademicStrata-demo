-- Academic Strata: security hardening (update 3).
-- Run ONCE in Supabase > SQL Editor, AFTER setup.sql and update-1/2 (it is safe to run again).
-- What it does:
--   1. Stops anyone from changing a role through the API (only the SQL editor can).
--   2. Limits size and speed of public forms (contact, subscribe) and member orders / uploads.
--   3. Forces uploads into the member's own folder with a safe file name.
--   4. Stops a member from pointing a submission at someone else's file.
--   5. Stops an uploader from swapping a file after the admin approved it.
--   6. Caps how many files one member can store.

-- ---------------------------------------------------------------------------
-- 1. Profiles: nobody can change a role or insert/delete profiles through the API.
--    Admins can still grant or remove premium. Make admins with the SQL editor.
-- ---------------------------------------------------------------------------
revoke insert, delete on public.profiles from anon, authenticated;
revoke update on public.profiles from anon, authenticated;
grant update (premium) on public.profiles to authenticated;

-- ---------------------------------------------------------------------------
-- 2. Rate-limit log (hashed visitor address, kept 24 hours, no API access).
-- ---------------------------------------------------------------------------
create table if not exists public.rate_events (
  key text not null,
  at timestamptz not null default now()
);
create index if not exists rate_events_key_at_idx on public.rate_events (key, at);
alter table public.rate_events enable row level security;
revoke all on public.rate_events from anon, authenticated;

-- Visitor address as seen behind Cloudflare/Supabase. Falls back to 'unknown'.
create or replace function public.client_ip() returns text
language sql stable set search_path = public as
$$
  select coalesce(
    h->>'cf-connecting-ip',
    h->>'x-real-ip',
    nullif(btrim(split_part(coalesce(h->>'x-forwarded-for', ''), ',', 1)), ''),
    'unknown')
  from (select nullif(current_setting('request.headers', true), '')::json as h) s
$$;

create or replace function public.hit_limit(k text, max_hits int, win interval) returns void
language plpgsql security definer set search_path = public as
$$
declare n int;
begin
  delete from public.rate_events where at < now() - interval '1 day';
  select count(*) into n from public.rate_events where key = k and at > now() - win;
  if n >= max_hits then
    raise exception 'Too many requests. Please try again later.' using errcode = 'P0001';
  end if;
  insert into public.rate_events (key) values (k);
end $$;
revoke all on function public.hit_limit(text, int, interval) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 3. Guard for the public / member-writable collections.
-- ---------------------------------------------------------------------------
create or replace function public.guard_docs() returns trigger
language plpgsql security definer set search_path = public as
$$
declare
  d jsonb := new.data;
  me uuid := auth.uid();
  ip text := public.client_ip();
  ipkey text := 'ip:' || encode(sha256(convert_to(public.client_ip() || ':academicstrata', 'utf8')), 'hex');
  mail text;
begin
  if new.collection not in ('messages', 'subscribers', 'orders', 'submissions') then
    return new;
  end if;
  if public.is_admin() then
    return new;
  end if;

  if jsonb_typeof(d) <> 'object' then raise exception 'Invalid data.'; end if;
  if octet_length(d::text) > 8000 then raise exception 'That is too large.'; end if;

  -- the owner column can never be chosen by the client
  new.uid := me;
  new.id := gen_random_uuid()::text;
  new.created_at := now();

  if new.collection = 'messages' then
    if jsonb_typeof(d->'name') <> 'string' or jsonb_typeof(d->'email') <> 'string' or jsonb_typeof(d->'message') <> 'string' then
      raise exception 'Invalid message.';
    end if;
    if char_length(d->>'name') not between 1 and 120
       or char_length(d->>'email') not between 3 and 254
       or (d->>'email') !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'
       or char_length(d->>'message') not between 1 and 4000 then
      raise exception 'Invalid message.';
    end if;
    new.data := jsonb_build_object('name', d->>'name', 'email', d->>'email', 'message', d->>'message');
    perform public.hit_limit('msg:' || case when ip = 'unknown' then 'all' else ipkey end, case when ip = 'unknown' then 60 else 5 end, interval '1 hour');

  elsif new.collection = 'subscribers' then
    if jsonb_typeof(d->'email') <> 'string' then raise exception 'Invalid email.'; end if;
    if char_length(d->>'email') not between 3 and 254
       or (d->>'email') !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'
       or char_length(coalesce(d->>'name', '')) > 120 then
      raise exception 'Invalid email.';
    end if;
    new.data := jsonb_build_object('name', coalesce(d->>'name', ''), 'email', d->>'email');
    perform public.hit_limit('sub:' || case when ip = 'unknown' then 'all' else ipkey end, case when ip = 'unknown' then 60 else 5 end, interval '1 hour');

  elsif new.collection = 'orders' then
    if me is null then raise exception 'Please sign in.'; end if;
    select lower(email) into mail from auth.users where id = me;
    if d->>'userId' is distinct from me::text
       or lower(coalesce(d->>'email', '')) is distinct from mail
       or coalesce(d->>'status', '') <> 'pending'
       or not exists (select 1 from public.docs r where r.id = d->>'resourceId' and r.collection = 'resources') then
      raise exception 'Invalid order.';
    end if;
    new.data := jsonb_build_object(
      'resourceId', d->>'resourceId',
      'title', left(coalesce(d->>'title', ''), 200),
      'email', d->>'email', 'userId', me::text, 'status', 'pending',
      'createdAt', coalesce(d->'createdAt', to_jsonb((extract(epoch from now()) * 1000)::bigint)));
    perform public.hit_limit('ord:' || me::text, 20, interval '1 day');

  elsif new.collection = 'submissions' then
    if me is null then raise exception 'Please sign in.'; end if;
    -- the file must be one this member uploaded to their own folder
    if coalesce(d->>'assetId', '') !~ ('^' || me::text || '/[0-9a-f-]{36}\.(pdf|docx)$')
       or char_length(coalesce(d->>'title', '')) not between 1 and 200
       or char_length(coalesce(d->>'description', '')) > 2000 then
      raise exception 'Invalid submission.';
    end if;
    new.data := jsonb_build_object(
      'title', d->>'title',
      'subject', left(coalesce(d->>'subject', ''), 100),
      'category', left(coalesce(d->>'category', ''), 100),
      'description', coalesce(d->>'description', ''),
      'premium', false, 'verified', false, 'url', '',
      'assetId', d->>'assetId',
      'size', case when jsonb_typeof(d->'size') = 'number' then d->'size' else '0'::jsonb end,
      'createdAt', coalesce(d->'createdAt', to_jsonb((extract(epoch from now()) * 1000)::bigint)));
    perform public.hit_limit('sub-up:' || me::text, 20, interval '1 day');
  end if;
  return new;
end $$;
revoke all on function public.guard_docs() from public, anon, authenticated;

drop trigger if exists guard_docs_trg on public.docs;
create trigger guard_docs_trg before insert on public.docs
  for each row execute function public.guard_docs();

-- Submission policy: the file must sit in the member's own folder (second lock).
drop policy if exists "members submit files" on public.docs;
create policy "members submit files" on public.docs for insert with check (
  collection = 'submissions' and auth.uid() is not null and uid = auth.uid()
  and (data->>'assetId') like (auth.uid()::text || '/%'));

-- ---------------------------------------------------------------------------
-- 4. Storage: safe names, per-member file cap, no deleting approved files.
-- ---------------------------------------------------------------------------
-- Counting a member's files inside the upload policy itself would make the policy
-- refer to its own table (Postgres rejects that), so a small helper function does it.
create or replace function public.own_file_count() returns int
language sql stable security definer set search_path = public, storage as
$$ select count(*)::int from storage.objects
   where bucket_id = 'files' and (storage.foldername(name))[1] = auth.uid()::text $$;
revoke all on function public.own_file_count() from public, anon;
grant execute on function public.own_file_count() to authenticated;

drop policy if exists "members upload own folder" on storage.objects;
create policy "members upload own folder" on storage.objects for insert to authenticated
  with check (
    bucket_id = 'files'
    and (storage.foldername(name))[1] = auth.uid()::text
    and (name ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.(pdf|docx)$' or public.is_admin())
    and (public.is_admin() or public.own_file_count() < 25));

drop policy if exists "delete own or admin files" on storage.objects;
create policy "delete own or admin files" on storage.objects for delete using (
  bucket_id = 'files' and (
    public.is_admin()
    or ((storage.foldername(name))[1] = auth.uid()::text
        and not exists (select 1 from public.docs d
                        where d.collection = 'resources' and d.data->>'assetId' = name))));
