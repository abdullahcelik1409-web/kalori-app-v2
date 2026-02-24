-- BU KODU SUPABASE SQL EDITOR'E YAPISTIRIN VE 'RUN' BUTONUNA BASIN.
-- Geliştirme ortamı olduğu için bekleyen TÜM kullanıcıları onaylar.

UPDATE auth.users
SET email_confirmed_at = now()
WHERE email_confirmed_at IS NULL;
