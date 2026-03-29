# Smoke API

Быстрый прогон ручек без `cargo test`.

## Команды
- `python backend/scripts/smoke_api/run_smoke.py --mode stub`
- `python backend/scripts/smoke_api/run_smoke.py --mode auth`
- `python backend/scripts/smoke_api/run_smoke.py --mode auth --role employer`

## Что проверяет
- `/health`
- `/api/v1/health`
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `GET /api/v1/me`