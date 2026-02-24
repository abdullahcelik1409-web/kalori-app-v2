-- Guncellenmis ve daha guvenli trigger kodu.
-- Bu kod hata vermez, eger trigger zaten varsa onarmaya calisir.

-- 1. Temizlik (Varsa eskiyi kaldir)
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

-- 2. Fonksiyon (Idempotent: Cakisirsa hata verme, devam et)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, target_calories, target_water_ml, target_protein, target_carbs, target_fat, preferences)
  values (new.id, new.email, 2000, 2000, 150, 200, 65, '{}')
  on conflict (id) do nothing; -- Eger profil zaten varsa hata verme, sessizce gec
  return new;
end;
$$ language plpgsql security definer;

-- 3. Trigger Olustur
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 4. Kontrol (İsteğe Bağlı)
-- Veritabanindaki yetim (profil tablosunda karsiligi olmayan) kullanicilar icin profil olustur
insert into public.profiles (id, email, target_calories, preferences)
select id, email, 2000, '{}'
from auth.users
where id not in (select id from public.profiles)
on conflict (id) do nothing;
