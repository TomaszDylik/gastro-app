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
