# Gastro Schedules — Next.js 14 + Supabase

Szkielet projektu zgodny z wymaganiami z `prompt_prod.txt`:

- Next.js 14 (App Router) + TypeScript + Tailwind + shadcn/ui
- Supabase (Auth: SMS OTP + magic link e-mail), PostgreSQL, RLS
- Prisma + migracje i seed
- PWA (widoki pracownika), offline cache kluczowych ekranów
- RBAC: super_admin, manager, employee
- Testy: Vitest (unit) + Playwright (E2E)

## Szybki start

1. **Instalacja**

   ```bash
   pnpm i
   ```

2. **Konfiguracja `.env`**  
   Skopiuj `.env.example` do `.env.local` i uzupełnij wartości (Supabase, Resend).

3. **Prisma**

   ```bash
   pnpm prisma:generate
   pnpm prisma:migrate
   pnpm prisma:seed
   ```

4. **Dev**

   ```bash
   pnpm dev
   ```

5. **Testy**
   ```bash
   pnpm test
   pnpm test:e2e
   ```

## ⚙️ Konfiguracja środowiska

### Wymagane zmienne środowiskowe (.env.local)

```env
# Database
DATABASE_URL="postgresql://..."

# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Email (opcjonalne dla ETAP 10)
RESEND_API_KEY="re_..."
```

### Konfiguracja CRON w Supabase

Projekt wymaga **3 zadań CRON** do automatycznego generowania raportów:

#### 1. Raport dzienny (codziennie o 00:05)

```sql
-- Supabase Dashboard → Database → Cron Jobs → Create new job
SELECT cron.schedule(
  'daily-reports-generation',
  '5 0 * * *',  -- Every day at 00:05
  $$
  SELECT net.http_post(
    url := 'https://your-app.vercel.app/api/reports/daily/generate',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_CRON_SECRET"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);
```

#### 2. Raport tygodniowy (w poniedziałki o 00:10)

```sql
SELECT cron.schedule(
  'weekly-reports-generation',
  '10 0 * * 1',  -- Every Monday at 00:10
  $$
  SELECT net.http_post(
    url := 'https://your-app.vercel.app/api/reports/weekly/generate',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_CRON_SECRET"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);
```

#### 3. Raport miesięczny (1. dzień miesiąca o 00:15)

```sql
SELECT cron.schedule(
  'monthly-reports-generation',
  '15 0 1 * *',  -- First day of month at 00:15
  $$
  SELECT net.http_post(
    url := 'https://your-app.vercel.app/api/reports/monthly/generate',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_CRON_SECRET"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);
```

**Uwagi:**
- Zainstaluj rozszerzenie `pg_cron` w Supabase: `CREATE EXTENSION pg_cron;`
- Zainstaluj rozszerzenie `pg_net` dla HTTP: `CREATE EXTENSION pg_net;`
- Ustaw `YOUR_CRON_SECRET` w zmiennych środowiskowych i w nagłówkach CRON
- Sprawdź logi CRON: `SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;`

### Retencja plików eksportowanych (3 lata)

Pliki eksportowane (raporty XLSX/CSV) są przechowywane w **Supabase Storage** w buckecie `exports/` przez **3 lata**.

#### Jak działa automatyczne usuwanie?

Zadanie CRON uruchamiane **codziennie o 02:00** usuwa pliki starsze niż 3 lata:

```sql
SELECT cron.schedule(
  'cleanup-old-exports',
  '0 2 * * *',  -- Every day at 02:00
  $$
  SELECT net.http_post(
    url := 'https://your-app.vercel.app/api/storage/cleanup',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_CRON_SECRET"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);
```

**Endpoint `/api/storage/cleanup`** (do implementacji w ETAP 13+):
- Listuje wszystkie pliki w buckecie `exports/`
- Sprawdza datę utworzenia (metadata lub nazwa pliku)
- Usuwa pliki starsze niż `3 lata` (1096 dni)
- Loguje operacje do `AuditLog`

#### Struktura plików w Storage

```
exports/
├── rest-podgrusza/
│   ├── daily-2025-01-15.xlsx
│   ├── daily-2025-01-16.xlsx
│   ├── weekly-2025-W03.xlsx
│   └── monthly-2025-01.xlsx
└── rest-altro-id/
    └── daily-2025-01-15.xlsx
```

**Każdy plik ma metadata:**
- `restaurantId`: ID restauracji
- `reportType`: `daily` | `weekly` | `monthly`
- `generatedAt`: timestamp utworzenia
- `format`: `xlsx` | `csv`

#### Signed URLs (7 dni ważności)

Pobieranie plików odbywa się przez **signed URLs** ważne **7 dni**:

```typescript
// lib/storage.ts
export async function getSignedUrl(filePath: string) {
  const { data, error } = await supabase.storage
    .from('exports')
    .createSignedUrl(filePath, 604800) // 7 days = 604800 seconds
  
  return { url: data?.signedUrl || '', error }
}
```

Po wygaśnięciu URL użytkownik musi wygenerować nowy link (endpoint `/api/reports/[id]/download`).

## 👥 Konta testowe

Po uruchomieniu seedu będą dostępne następujące konta:

### Manager (Restauracja "Pod Gruszą")

- 📧 Email: `manager@gmail.pl`
- 🔑 Hasło: `password`
- 🏢 Restauracja: "Pod Gruszą"
- ✅ Uprawnienia: zarządzanie grafikami, zespołem, zatwierdzanie czasu pracy

### Pracownik 1 - Anna Kowalska

- 📧 Email: `employee1@gmail.pl`
- 🔑 Hasło: `password`
- 👔 Stanowisko: Kelnerka
- 📅 Grafik: Dzisiaj 9:00-17:00

### Pracownik 2 - Jan Nowak

- 📧 Email: `employee2@gmail.pl`
- 🔑 Hasło: `password`
- 👔 Stanowisko: Kucharz
- 📅 Grafik: Dzisiaj 10:00-18:00

**Jak testować:**

1. Wejdź na `/login`
2. Wybierz rolę (Manager/Pracownik)
3. Zaloguj się emailem i hasłem z powyższej listy
4. Lub pomiń logowanie i wejdź bezpośrednio:
   - Pracownik: `/dashboard`
   - Manager: `/manager/dashboard`

## Struktura

- `app/(public)` — logowanie i zaproszenia
- `app/(employee)` — PWA: dashboard, kalendarz, dostępność, podsumowanie, ustawienia
- `app/(manager)` — kalendarze, przydziały, czas, zespół, raporty, ustawienia
- `app/admin` — panel super-admina
- `prisma/schema.prisma` — modele danych
- `supabase/policies.sql` — polityki RLS
- `tests/` — unit + e2e (scenariusze)

> Uwaga: To jest **produkcyjny szkielet** z gotowymi punktami zaczepienia. W kodzie są czytelne komentarze przy RLS/RBAC/walidacjach.
