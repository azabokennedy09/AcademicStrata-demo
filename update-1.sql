-- Run this ONCE in Supabase > SQL Editor if you already ran setup.sql before.
-- It lets the site read the editable page text.
drop policy if exists "read content" on public.docs;
create policy "read content" on public.docs for select using (
  collection in ('resources','posts','pagetext') or public.is_admin() or (collection = 'submissions' and uid = auth.uid()));
