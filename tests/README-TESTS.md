# API Integration Tests

## Testy pokrycia dla API Endpoints

### Utworzone pliki testowe:

1. **test-api-time-entries-summary.spec.ts** ✅
   - Endpoint: `GET /api/time-entries/summary`
   - 8 test cases
   - Pokrycie: kalkulacja godzin, breakdown tygodniowy, walidacja

2. **test-api-shifts-calendar.spec.ts** ✅ 
   - Endpoint: `GET /api/shifts`
   - 11 test cases
   - Pokrycie: formatowanie dat, statystyki, statusy, walidacja

3. **test-api-user-settings.spec.ts** ✅
   - Endpoints: 
     - `PUT /api/users/me/password`
     - `GET /api/users/me/preferences`  
     - `PUT /api/users/me/preferences`
   - 13 test cases
   - Pokrycie: zmiana hasła, preferencje, merge, walidacja, auth

**Łącznie: 32 testy integracyjne dla nowych API endpoints**

## Uruchamianie testów

### Wymagania:
- Działający serwer Next.js (port 3000)
- Poprawnie skonfigurowane zmienne środowiskowe (.env.local):
  - `DATABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`

### Kroki:

1. **Uruchom serwer dev:**
   ```bash
   pnpm dev
   ```

2. **W osobnym terminalu uruchom testy:**

   **Wszystkie testy:**
   ```bash
   pnpm test
   ```

   **Tylko Summary API:**
   ```bash
   pnpm test tests/test-api-time-entries-summary.spec.ts
   ```

   **Tylko Shifts Calendar API:**
   ```bash
   pnpm test tests/test-api-shifts-calendar.spec.ts
   ```

   **Tylko Settings API:**
   ```bash
   pnpm test tests/test-api-user-settings.spec.ts
   ```

## Pokrycie testami

| Endpoint | Metoda | Status | Testy |
|----------|--------|--------|-------|
| `/api/time-entries/summary` | GET | ✅ | 8 |
| `/api/shifts` | GET | ✅ | 11 |
| `/api/users/me/password` | PUT | ✅ | 5 |
| `/api/users/me/preferences` | GET | ✅ | 3 |
| `/api/users/me/preferences` | PUT | ✅ | 5 |
| **TOTAL** | | | **32** |

## Scenariusze testowe

### test-api-time-entries-summary.spec.ts
- ✅ Powinien zwrócić podsumowanie miesięczne
- ✅ Powinien poprawnie obliczyć łączne godziny
- ✅ Powinien wygenerować breakdown tygodniowy
- ✅ Powinien zwrócić ostatnie wpisy
- ✅ Powinien obsłużyć adjustmentMinutes
- ✅ Powinien wymagać membershipId
- ✅ Powinien walidować istnienie membershipId
- ✅ Powinien użyć bieżącego miesiąca jako domyślnego

### test-api-shifts-calendar.spec.ts
- ✅ Powinien zwrócić zmiany dla danego miesiąca
- ✅ Powinien poprawnie formatować czasy zmian
- ✅ Powinien obliczyć zaplanowane godziny
- ✅ Powinien filtrować według statusu
- ✅ Powinien zwrócić pustą tablicę dla miesiąca bez zmian
- ✅ Powinien użyć bieżącego miesiąca jako domyślnego
- ✅ Powinien wymagać membershipId
- ✅ Powinien walidować istnienie membershipId
- ✅ Powinien zawierać informacje o roli
- ✅ Powinien sortować zmiany według daty rosnąco
- ✅ Powinien zwrócić poprawne statystyki

### test-api-user-settings.spec.ts

**PUT /api/users/me/password:**
- ✅ Powinien zmienić hasło pomyślnie
- ✅ Powinien odrzucić niepoprawne obecne hasło
- ✅ Powinien odrzucić hasło krótsze niż 8 znaków
- ✅ Powinien wymagać autentykacji
- ✅ Powinien walidować brakujące pola

**GET /api/users/me/preferences:**
- ✅ Powinien zwrócić domyślne preferencje dla nowego użytkownika
- ✅ Powinien zwrócić zapisane preferencje
- ✅ Powinien wymagać autentykacji

**PUT /api/users/me/preferences:**
- ✅ Powinien zaktualizować wszystkie preferencje
- ✅ Powinien częściowo zaktualizować preferencje (merge)
- ✅ Powinien zaktualizować locale gdy zmienia się język
- ✅ Powinien wymagać autentykacji
- ✅ Powinien walidować wartości preferencji

## Uwagi

- Testy używają rzeczywistej bazy danych (nie mock)
- Dane testowe są automatycznie czyszczone w `afterAll()`
- Każdy test tworzy izolowane dane testowe
- Testy wymagają `SUPABASE_SERVICE_ROLE_KEY` dla tworzenia użytkowników testowych
