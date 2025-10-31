-- Polityki RLS dla tabel domenowych (szkic; dostosuj w Supabase)
-- Załóżmy, że w każdej tabeli istnieje kolumna restaurant_id albo powiązanie do restaurant_id
-- W Supabase wykorzystaj auth.uid() + profil użytkownika z rolą.

-- Przykład (pseudo-SQL; dopasuj do struktur w Supabase):
-- enable row level security on table ...
-- create policy "employee can select own resources" on ... for select using (...);
-- create policy "employee can crud own availability/timeentry" on ... for insert with check (...);

-- Uwaga: finalne warunki należy zaimplementować zgodnie z mappingiem auth.users -> AppUser (app_users).
