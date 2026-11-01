-- Run this ONCE in Supabase > SQL Editor. It adds paid premium guides ($1 each, per item).
drop policy if exists "read content" on public.docs;
create policy "read content" on public.docs for select using (
  collection in ('resources','posts','pagetext') or public.is_admin()
  or (collection in ('submissions','orders') and uid = auth.uid())
  or (collection = 'entitlements' and data->>'userId' = auth.uid()::text));

drop policy if exists "members place orders" on public.docs;
create policy "members place orders" on public.docs for insert with check (collection = 'orders' and auth.uid() is not null and uid = auth.uid());

drop policy if exists "read allowed files" on storage.objects;
create policy "read allowed files" on storage.objects for select using (
  bucket_id = 'files' and (
    public.is_admin()
    or (storage.foldername(name))[1] = auth.uid()::text
    or exists (select 1 from public.docs d where d.collection = 'resources' and d.data->>'assetId' = name
               and (coalesce((d.data->>'premium')::boolean, false) = false
                    or public.has_premium()
                    or exists (select 1 from public.docs e where e.collection = 'entitlements'
                               and e.data->>'resourceId' = d.id and e.data->>'userId' = auth.uid()::text)))));
