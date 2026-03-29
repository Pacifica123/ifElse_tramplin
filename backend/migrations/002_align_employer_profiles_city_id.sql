-- 002_align_employer_profiles_city_id.sql

alter table employer_profiles
    add column if not exists city_id bigint null;

-- старое поле city_name оставляем временно ради мягкого перехода.
-- удалить его можно позже отдельной cleanup-миграцией,
-- когда появится нормальная cities-таблица и остальной каталог.
