# 🚀 GASTRO APP - PLAN IMPLEMENTACJI NOWYCH FEATURE'ÓW

**Data utworzenia:** 7 listopada 2025  
**Wersja:** 1.0  
**Status:** Zaplanowane - gotowe do rozpoczęcia implementacji

---

## 📋 PODSUMOWANIE WYMAGAŃ

### Kluczowe Decyzje:
1. ✅ **Routing Employee:** Zmiana z `/dashboard` → `/employee/dashboard`
2. ✅ **Multi-Restaurant:** Employee i Manager mogą pracować w wielu restauracjach (wybór po zalogowaniu)
3. ✅ **Działy/Grafiki:** Restauracja ma wiele działów (Kuchnia, Kelnerzy, Bar), pracownik przypisany przez `roleTag`
4. ✅ **Time Tracking:** Timer start/stop na dashboardzie, live tracking dla managera
5. ✅ **Availability:** Jeden slot czasowy dziennie, manager widzi i tworzy shifts
6. ✅ **Reports:** PDF, Supabase Storage, przechowywanie 2 lata
7. ✅ **Admin:** Pełne uprawnienia + impersonation (logowanie jako inny użytkownik)
8. ✅ **Notifications:** Email + Push (gdzie możliwe)
9. ✅ **Manager Routing:** `/manager/[restaurantId]/...`
10. ✅ **Token System:** Employee i Manager używają tokenów do dołączania do restauracji

---

## 🎯 ETAPY IMPLEMENTACJI

---

## **ETAP 1: REFACTORING ROUTINGU** 
**Priorytet:** 🔴 WYSOKI (fundamenty)  
**Szacowany czas:** 3-4 godziny  
**Status:** ⏳ Do wykonania

### Zadania:

#### 1.1 Employee Routing Refactor
- [ ] Przenieś `app/(employee)/*` → `app/employee/*`
- [ ] Zaktualizuj routing:
  - `/dashboard` → `/employee/dashboard`
  - `/availability` → `/employee/availability`
  - `/calendar` → `/employee/calendar`
  - `/summary` → `/employee/summary`
  - `/settings` → `/employee/settings`
- [ ] Usuń `/dashboard-v2` (nie używane)
- [ ] Zaktualizuj wszystkie linki w komponentach (Sidebar, navigation)
- [ ] Zaktualizuj middleware.ts (public paths, redirects)
- [ ] Zaktualizuj `lib/redirect-by-role.ts`

#### 1.2 Manager Routing Refactor
- [ ] Przenieś `app/manager/*` → struktura z `[restaurantId]`:
  - `/manager` → Lista restauracji (wybór)
  - `/manager/[restaurantId]/dashboard`
  - `/manager/[restaurantId]/team`
  - `/manager/[restaurantId]/schedules`
  - `/manager/[restaurantId]/time`
  - `/manager/[restaurantId]/reports`
  - `/manager/[restaurantId]/settings`
- [ ] Usuń `app/(manager)/restaurant/[restaurantId]/*` (duplikacja)
- [ ] Zaktualizuj navigation components
- [ ] Zaktualizuj API calls (dodaj `restaurantId` param)

#### 1.3 Root Page Update
- [ ] `/` → Przekierowanie na `/login` (dla niezalogowanych)
- [ ] Dla zalogowanych:
  - Employee z 1 restauracją → `/employee/dashboard`
  - Employee z >1 restauracją → `/employee/select-restaurant`
  - Manager → `/manager` (wybór restauracji)
  - Owner → `/owner/dashboard`
  - Admin → `/admin`

**Pliki do modyfikacji:**
```
app/page.tsx
app/employee/**/*
app/manager/**/*
components/navigation/Sidebar.tsx
components/navigation/MobileBottomNav.tsx
lib/redirect-by-role.ts
middleware.ts
```

**Testy:**
- [ ] Sprawdź wszystkie ścieżki routing
- [ ] Sprawdź redirects dla każdej roli
- [ ] Sprawdź navigation links

---

## **ETAP 2: SYSTEM TOKENÓW (INVITE/JOIN)**
**Priorytet:** 🔴 WYSOKI (kluczowa funkcjonalność)  
**Szacowany czas:** 5-6 godzin  
**Status:** ⏳ Do wykonania

### Zadania:

#### 2.1 Database Schema Update
```prisma
model Restaurant {
  // ... existing fields
  inviteToken      String   @unique @default(cuid())
  tokenGeneratedAt DateTime @default(now())
  tokenGeneratedBy String?  // userId managera/ownera
}

model InviteLog {
  id            String   @id @default(cuid())
  restaurantId  String
  userId        String
  token         String
  usedAt        DateTime @default(now())
  invitedBy     String?  // userId który wygenerował token
  
  restaurant    Restaurant @relation(fields: [restaurantId], references: [id])
  user          AppUser    @relation(fields: [userId], references: [id])
}
```

- [ ] Dodaj `inviteToken` i `tokenGeneratedAt` do `Restaurant`
- [ ] Utwórz model `InviteLog` dla audytu
- [ ] Uruchom migration: `pnpm prisma migrate dev --name add_invite_tokens`
- [ ] Zaktualizuj seed.ts (generuj tokeny dla restauracji)

#### 2.2 API Endpoints dla Manager/Owner

**Generate/Regenerate Token:**
- [ ] `POST /api/restaurants/[restaurantId]/token/regenerate`
  - Generuje nowy token (8-12 znaków, czytelny)
  - Zapisuje `tokenGeneratedAt` i `tokenGeneratedBy`
  - Zwraca nowy token

**Get Current Token:**
- [ ] `GET /api/restaurants/[restaurantId]/token`
  - Zwraca aktualny token (tylko dla manager/owner)
  - Zwraca datę wygenerowania

#### 2.3 API Endpoints dla Employee

**Join Restaurant:**
- [ ] `POST /api/employee/join-restaurant`
  - Body: `{ token: string }`
  - Sprawdza czy token istnieje
  - Tworzy Membership (role: employee, status: pending)
  - Tworzy InviteLog
  - Wysyła notification do managera
  - Zwraca restaurantId

**List Available Restaurants:**
- [ ] `GET /api/employee/restaurants`
  - Zwraca restauracje gdzie user ma membership
  - Include: restaurant name, role, status

#### 2.4 UI dla Manager/Owner

**Token Management Panel:**
- [ ] `/manager/[restaurantId]/settings` → Sekcja "Zaproszenia"
  - Wyświetla aktualny token (duża czcionka, kopiowanie)
  - Przycisk "Wygeneruj nowy token"
  - Potwierdzenie przed regeneracją
  - Data ostatniego wygenerowania
  - Lista ostatnich użyć tokenu (InviteLog)

- [ ] `/owner/companies` → Dodaj kolumnę "Token" dla każdej restauracji
  - Szybkie kopiowanie
  - Regeneracja inline

#### 2.5 UI dla Employee

**Join Restaurant Page:**
- [ ] `/employee/join-restaurant` - Nowa strona
  - Input dla tokenu (uppercase, max 12 znaków)
  - Przycisk "Dołącz do restauracji"
  - Walidacja tokenu (live feedback)
  - Success: Przekierowanie na `/employee/select-restaurant`

**Settings - Add Company:**
- [ ] `/employee/settings` → Przycisk "Dodaj firmę"
  - Redirect do `/employee/join-restaurant`

**Restaurant Selection:**
- [ ] `/employee/select-restaurant` - Nowa strona
  - Lista restauracji (kafelki)
  - Dla każdej: nazwa, status (active/pending), dział
  - Kliknięcie → Wybór restauracji → `/employee/dashboard`
  - Zapisz wybór w localStorage/session

**Pliki do utworzenia:**
```
app/api/restaurants/[restaurantId]/token/regenerate/route.ts
app/api/restaurants/[restaurantId]/token/route.ts
app/api/employee/join-restaurant/route.ts
app/api/employee/restaurants/route.ts
app/employee/join-restaurant/page.tsx
app/employee/select-restaurant/page.tsx
components/employee/JoinRestaurantForm.tsx
components/manager/TokenManagementPanel.tsx
```

**Testy:**
- [ ] Test generowania tokenu
- [ ] Test dołączania przez token
- [ ] Test regeneracji tokenu (stary nie działa)
- [ ] Test dla employee z wieloma restauracjami

---

## **ETAP 3: DZIAŁY/GRAFIKI (DEPARTMENTS)**
**Priorytet:** 🟠 ŚREDNI  
**Szacowany czas:** 4-5 godzin  
**Status:** ⏳ Do wykonania

### Zadania:

#### 3.1 Database Schema Update
```prisma
model Department {
  id            String   @id @default(cuid())
  restaurantId  String
  name          String   // "Kuchnia", "Kelnerzy", "Bar"
  description   String?
  color         String?  // Hex color dla UI
  isActive      Boolean  @default(true)
  createdAt     DateTime @default(now())
  
  restaurant    Restaurant   @relation(fields: [restaurantId], references: [id], onDelete: Cascade)
  memberships   Membership[]
  shifts        Shift[]
  
  @@unique([restaurantId, name])
}

// Update Membership
model Membership {
  // ... existing fields
  departmentId  String?
  department    Department? @relation(fields: [departmentId], references: [id])
}

// Update Shift
model Shift {
  // ... existing fields
  departmentId  String?
  department    Department? @relation(fields: [departmentId], references: [id])
}
```

- [ ] Dodaj model `Department`
- [ ] Dodaj `departmentId` do `Membership`
- [ ] Dodaj `departmentId` do `Shift`
- [ ] Migration: `pnpm prisma migrate dev --name add_departments`
- [ ] Zaktualizuj seed.ts (utwórz przykładowe działy)

#### 3.2 API Endpoints - Departments

- [ ] `GET /api/restaurants/[restaurantId]/departments`
- [ ] `POST /api/restaurants/[restaurantId]/departments`
- [ ] `PUT /api/restaurants/[restaurantId]/departments/[id]`
- [ ] `DELETE /api/restaurants/[restaurantId]/departments/[id]`

#### 3.3 UI dla Manager - Department Management

- [ ] `/manager/[restaurantId]/settings` → Sekcja "Działy"
  - Lista działów (nazwa, liczba pracowników, aktywny/nieaktywny)
  - Dodawanie działu (modal)
  - Edycja działu (inline lub modal)
  - Usuwanie działu (z potwierdzeniem)
  - Color picker dla koloru działu

#### 3.4 UI dla Manager - Team per Department

- [ ] `/manager/[restaurantId]/team` → Zakładki działów
  - Zakładka dla każdego działu
  - Lista pracowników w dziale
  - Przypisywanie pracownika do działu (dropdown)
  - Statystyki działu (liczba pracowników, godziny)

#### 3.5 Update Existing Features

- [ ] Schedules - filtrowanie po dziale
- [ ] Time tracking - grupowanie po dziale
- [ ] Reports - sekcje per dział

**Pliki do utworzenia/modyfikacji:**
```
app/api/restaurants/[restaurantId]/departments/route.ts
app/api/restaurants/[restaurantId]/departments/[id]/route.ts
components/manager/DepartmentManager.tsx
components/manager/TeamByDepartment.tsx
prisma/schema.prisma
```

---

## **ETAP 4: TIME TRACKING Z TIMEREM**
**Priorytet:** 🔴 WYSOKI (core functionality)  
**Szacowany czas:** 6-7 godzin  
**Status:** ⏳ Do wykonania

### Zadania:

#### 4.1 Database Schema Update
```prisma
model TimeEntry {
  // ... existing fields
  isActive      Boolean  @default(false)  // Czy timer aktywnie liczy
  pausedAt      DateTime?                 // Dla pauzy
  pauseDuration Int      @default(0)      // Suma pauz w minutach
}
```

- [ ] Dodaj `isActive`, `pausedAt`, `pauseDuration` do `TimeEntry`
- [ ] Migration

#### 4.2 API Endpoints - Time Tracking

**Employee Timer:**
- [ ] `POST /api/employee/time/start` - Rozpocznij zmianę
  - Sprawdza czy ma dzisiaj przypisany shift
  - Tworzy TimeEntry (clockIn = now, isActive = true)
  - Zwraca timeEntryId

- [ ] `POST /api/employee/time/stop` - Zakończ zmianę
  - Body: `{ timeEntryId: string }`
  - Ustawia clockOut = now, isActive = false
  - Oblicza totalMinutes

- [ ] `POST /api/employee/time/pause` - Pauza (opcjonalne)
- [ ] `POST /api/employee/time/resume` - Wznów (opcjonalne)

- [ ] `GET /api/employee/time/active` - Pobierz aktywny timer
  - Zwraca timeEntry jeśli isActive = true
  - Null jeśli brak aktywnego

**Manager Live Tracking:**
- [ ] `GET /api/manager/time/live?restaurantId=...`
  - Zwraca wszystkie aktywne TimeEntry w restauracji
  - Include: user, department, clockIn, duration

- [ ] `POST /api/manager/time/[timeEntryId]/stop` - Manager kończy zmianę
  - Body: `{ clockOut: DateTime, adjustmentMinutes?: number }`
  - Walidacja: clockOut > clockIn

#### 4.3 UI dla Employee

**Dashboard - Today's Shift Card:**
```tsx
┌─────────────────────────────────────────────┐
│ 📅 Dzisiejsza zmiana: Kuchnia               │
│ 🕐 Planowane: 10:00 - 18:00                 │
│                                             │
│ ⏱️ [Rozpocznij zmianę]                      │
│                                             │
│ (lub gdy aktywna:)                          │
│ 🟢 Trwa: 3h 24min                           │
│ Rozpoczęto: 10:00                           │
│ [Zakończ zmianę]  [Pauza]                   │
└─────────────────────────────────────────────┘
```

- [ ] `/employee/dashboard` → Component: `TodaysShiftCard`
  - Sprawdza GET /api/employee/shifts/today
  - Pokazuje aktywny timer (live countdown)
  - Przyciski Start/Stop/Pause
  - useInterval dla live update (co 1s)

#### 4.4 UI dla Manager

**Live Time Tracking Panel:**
- [ ] `/manager/[restaurantId]/time` → "Aktywne zmiany"
  - Lista pracowników obecnie na zmianie
  - Live timers (aktualizacja co 5s)
  - Przycisk "Zakończ zmianę" dla każdego
  - Modal do edycji godzin przed zakończeniem

**Pending Approvals:**
- [ ] Istniejący widok (już zrobione w poprzednich sesjach)
- [ ] Dodaj filtr po dziale
- [ ] Grupowanie po dniu

**Pliki do utworzenia:**
```
app/api/employee/time/start/route.ts
app/api/employee/time/stop/route.ts
app/api/employee/time/active/route.ts
app/api/employee/shifts/today/route.ts
app/api/manager/time/live/route.ts
app/api/manager/time/[timeEntryId]/stop/route.ts
components/employee/TodaysShiftCard.tsx
components/manager/LiveTimeTracker.tsx
hooks/useActiveTimer.ts
```

**Testy:**
- [ ] Test start/stop timera
- [ ] Test live tracking dla managera
- [ ] Test edycji godzin przez managera

---

## **ETAP 5: AVAILABILITY SYSTEM (DYSPOZYCYJNOŚĆ)**
**Priorytet:** 🟠 ŚREDNI  
**Szacowany czas:** 5-6 godzin  
**Status:** ⏳ Do wykonania

### Zadania:

#### 5.1 Database Schema - zachowaj istniejący
```prisma
model Availability {
  id           String   @id @default(cuid())
  membershipId String
  date         DateTime @db.Date
  timeSlot     TimeSlot
  isAvailable  Boolean
  
  membership   Membership @relation(...)
  @@unique([membershipId, date, timeSlot])
}
```

- ✅ Schema już istnieje - no changes needed
- [ ] Zmień logikę: Jeden slot = cały dzień z `startTime` i `endTime`

**Nowa struktura:**
```prisma
model AvailabilitySlot {
  id           String    @id @default(cuid())
  membershipId String
  date         DateTime  @db.Date
  startTime    String    // "08:00"
  endTime      String    // "16:00"
  createdAt    DateTime  @default(now())
  
  membership   Membership @relation(...)
  
  @@unique([membershipId, date])
}
```

- [ ] Utwórz nowy model `AvailabilitySlot`
- [ ] Migration

#### 5.2 API Endpoints - Availability

- [ ] `GET /api/employee/availability?week=2025-W45`
  - Zwraca dyspozycyjność na dany tydzień
  - Format: Array of { date, startTime, endTime }

- [ ] `POST /api/employee/availability`
  - Body: `{ date, startTime, endTime }`
  - Walidacja: endTime > startTime
  - Upsert (jeśli już istnieje, nadpisz)

- [ ] `DELETE /api/employee/availability/[id]`

#### 5.3 UI dla Employee

**Availability Calendar:**
- [ ] `/employee/availability` → Weekly view
  - 7 dni (PN-ND)
  - Dla każdego dnia:
    - Input "Od" (time picker: 00:00 - 23:59)
    - Input "Do" (time picker)
    - Walidacja: Do > Od
    - Checkbox "Cały dzień" (preset 00:00-23:59)
  - Przyciski: "← Poprzedni tydzień" | "Następny tydzień →"
  - Przycisk "Zapisz zmiany" (batch update)

**Component structure:**
```tsx
<AvailabilityCalendar>
  <WeekNavigator />
  {weekDays.map(day => (
    <AvailabilityDayCard
      date={day}
      startTime={...}
      endTime={...}
      onChange={...}
    />
  ))}
  <SaveButton />
</AvailabilityCalendar>
```

#### 5.4 UI dla Manager - Schedule Builder

- [ ] `/manager/[restaurantId]/schedules` → Rozszerz istniejący widok
  - Dodaj zakładkę "Dyspozycyjność pracowników"
  - Weekly view z wszystkimi pracownikami
  - Dla każdego dnia pokazuj kto jest dostępny
  - Drag & drop do przypisywania shifts (opcjonalne - ETAP 8)

**Pliki do utworzenia:**
```
app/api/employee/availability/route.ts
app/api/employee/availability/[id]/route.ts
components/employee/AvailabilityCalendar.tsx
components/employee/AvailabilityDayCard.tsx
components/employee/WeekNavigator.tsx
components/manager/AvailabilityOverview.tsx
```

---

## **ETAP 6: REPORTS SYSTEM (PDF + STORAGE)**
**Priorytet:** 🟡 NISKI (można później)  
**Szacowany czas:** 6-8 godzin  
**Status:** ⏳ Do wykonania

### Zadania:

#### 6.1 Database Schema
```prisma
model Report {
  id            String   @id @default(cuid())
  restaurantId  String
  type          String   // "daily", "weekly", "monthly"
  startDate     DateTime @db.Date
  endDate       DateTime @db.Date
  departmentId  String?  // Opcjonalnie per dział
  generatedBy   String   // userId managera
  fileUrl       String?  // Supabase Storage URL
  fileName      String
  data          Json     // Surowe dane raportu
  expiresAt     DateTime // +2 lata
  createdAt     DateTime @default(now())
  
  restaurant    Restaurant  @relation(...)
  department    Department? @relation(...)
  generatedByUser AppUser   @relation(...)
}
```

- [ ] Dodaj model `Report`
- [ ] Migration

#### 6.2 Supabase Storage Setup

- [ ] Utwórz bucket `reports` w Supabase Storage
- [ ] Konfiguracja RLS (Row Level Security):
  - Tylko manager/owner może upload
  - Tylko manager/owner/admin może download
- [ ] Dodaj helper: `lib/storage.ts`

#### 6.3 PDF Generation

**Biblioteka:** `jsPDF` + `jspdf-autotable`

- [ ] Install: `pnpm add jspdf jspdf-autotable`
- [ ] Utwórz `lib/pdf-generator.ts`:
  - `generateDailyReport(data)`
  - `generateMonthlyReport(data)`
  - Styles: Logo, header, tabele, footer

#### 6.4 API Endpoints - Reports

- [ ] `POST /api/manager/reports/generate`
  - Body: `{ restaurantId, type, startDate, endDate, departmentId? }`
  - Pobiera dane z bazy (TimeEntry, Shifts)
  - Generuje PDF (jsPDF)
  - Upload do Supabase Storage
  - Tworzy rekord w tabeli Report
  - Zwraca downloadUrl

- [ ] `GET /api/manager/reports?restaurantId=...`
  - Lista wszystkich raportów dla restauracji
  - Filtrowanie: type, dateRange, department

- [ ] `GET /api/manager/reports/[id]/download`
  - Redirect do Supabase Storage URL (signed URL, 1h expire)

- [ ] Cron Job (opcjonalnie): Auto-delete po 2 latach

#### 6.5 UI dla Manager

**Reports Page:**
- [ ] `/manager/[restaurantId]/reports`
  - Formularz generowania:
    - Typ raportu (Daily/Weekly/Monthly)
    - Zakres dat (date range picker)
    - Dział (opcjonalnie)
    - [Generuj raport]
  - Lista istniejących raportów:
    - Tabela: Data | Typ | Dział | Rozmiar | [Download] [Usuń]
    - Filtrowanie i sortowanie
    - Pagination

**Dashboard Widget:**
- [ ] `/manager/[restaurantId]/dashboard` → "Ostatnie raporty"
  - 5 najnowszych
  - Quick download

**Pliki do utworzenia:**
```
app/api/manager/reports/generate/route.ts
app/api/manager/reports/route.ts
app/api/manager/reports/[id]/download/route.ts
lib/pdf-generator.ts
lib/storage.ts
components/manager/ReportGenerator.tsx
components/manager/ReportsList.tsx
```

---

## **ETAP 7: ADMIN PANEL (FULL ACCESS + IMPERSONATION)**
**Priorytet:** 🟡 NISKI  
**Szacowany czas:** 5-6 godzin  
**Status:** ⏳ Do wykonania

### Zadania:

#### 7.1 Database Schema - Audit Log
```prisma
model AdminAction {
  id            String   @id @default(cuid())
  adminUserId   String
  action        String   // "IMPERSONATE", "EDIT_USER", "DELETE_RESTAURANT"
  targetType    String   // "User", "Restaurant", "Department"
  targetId      String
  details       Json?
  ipAddress     String?
  userAgent     String?
  createdAt     DateTime @default(now())
  
  admin         AppUser  @relation(...)
}
```

- [ ] Dodaj model `AdminAction`
- [ ] Migration

#### 7.2 Admin Routes Structure

```
/admin
/admin/owners                           → Lista ownerów
/admin/owners/[ownerId]                 → Profil ownera
/admin/owners/[ownerId]/restaurants     → Restauracje ownera
/admin/restaurants                      → Wszystkie restauracje
/admin/restaurants/[id]                 → Szczegóły + edycja
/admin/restaurants/[id]/departments     → Działy restauracji
/admin/restaurants/[id]/employees       → Pracownicy
/admin/restaurants/[id]/schedules       → Grafiki
/admin/users                            → Wszyscy użytkownicy
/admin/users/[id]                       → Edycja użytkownika
/admin/audit                            → Logi audytowe
```

#### 7.3 API Endpoints - Admin

**Owners Management:**
- [ ] `GET /api/admin/owners`
- [ ] `GET /api/admin/owners/[id]`
- [ ] `GET /api/admin/owners/[id]/restaurants`

**Users Management:**
- [ ] `GET /api/admin/users`
- [ ] `PUT /api/admin/users/[id]` - Edycja danych
- [ ] `DELETE /api/admin/users/[id]` - Soft delete
- [ ] `POST /api/admin/users/[id]/block` - Blokowanie

**Restaurants Management:**
- [ ] `GET /api/admin/restaurants`
- [ ] `PUT /api/admin/restaurants/[id]`
- [ ] `DELETE /api/admin/restaurants/[id]`

**Impersonation:**
- [ ] `POST /api/admin/impersonate`
  - Body: `{ targetUserId }`
  - Tworzy temporary session dla target usera
  - Zapisuje AdminAction (audit log)
  - Zwraca redirect URL dla target role
  - Session flag: `isImpersonating: true`

- [ ] `POST /api/admin/stop-impersonation`
  - Kończy impersonation
  - Przywraca admin session
  - Redirect na `/admin`

#### 7.4 UI - Admin Panel

**Owners List:**
- [ ] `/admin/owners`
  - Tabela ownerów
  - Kolumny: Nazwa, Email, Liczba restauracji, [Akcje]
  - Akcje: Zobacz szczegóły | Zaloguj się jako | Edytuj

**Owner Details:**
- [ ] `/admin/owners/[ownerId]`
  - Profil ownera
  - Lista restauracji
  - Przycisk "Zaloguj się jako ten owner"

**Restaurants Management:**
- [ ] `/admin/restaurants`
  - Wszystkie restauracje w systemie
  - Filtrowanie po ownerze, statusie
  - Edycja inline lub modal

**Users Management:**
- [ ] `/admin/users`
  - Wszystkie użytkownicy
  - Filtrowanie po roli
  - Blokowanie/Odblokowanie
  - Edycja danych

**Impersonation Banner:**
```tsx
{isImpersonating && (
  <div className="bg-red-600 text-white p-2 text-center">
    🔴 ZALOGOWANY JAKO: {targetUser.name} ({targetUser.email})
    <button onClick={stopImpersonation}>Zakończ</button>
  </div>
)}
```

**Pliki do utworzenia:**
```
app/admin/owners/page.tsx
app/admin/owners/[ownerId]/page.tsx
app/admin/owners/[ownerId]/restaurants/page.tsx
app/admin/restaurants/[id]/page.tsx
app/admin/users/[id]/page.tsx
app/api/admin/impersonate/route.ts
app/api/admin/stop-impersonation/route.ts
components/admin/ImpersonationBanner.tsx
components/admin/OwnersTable.tsx
components/admin/UsersTable.tsx
```

---

## **ETAP 8: NOTIFICATIONS (EMAIL + PUSH)**
**Priorytet:** 🟡 NISKI (nice to have)  
**Szacowany czas:** 4-5 godzin  
**Status:** ⏳ Do wykonania

### Zadania:

#### 8.1 Email Setup

**Wybór providera:** SendGrid lub Resend

- [ ] Konfiguracja SendGrid API key
- [ ] Dodaj do `.env`:
  ```
  SENDGRID_API_KEY=...
  FROM_EMAIL=support@gastroapp.pl
  ```
- [ ] Install: `pnpm add @sendgrid/mail`

#### 8.2 Email Templates

**Utwórz templates:**
- [ ] `emails/shift-approved.tsx` (React Email)
- [ ] `emails/shift-rejected.tsx`
- [ ] `emails/shift-reminder.tsx` (24h before)
- [ ] `emails/time-entry-approved.tsx`
- [ ] `emails/joined-restaurant.tsx`

#### 8.3 Notification System

```prisma
model Notification {
  id        String   @id @default(cuid())
  userId    String
  type      String   // "SHIFT_APPROVED", "TIME_APPROVED", etc.
  title     String
  message   String
  read      Boolean  @default(false)
  data      Json?    // Metadata
  createdAt DateTime @default(now())
  
  user      AppUser  @relation(...)
}
```

- [ ] Dodaj model `Notification`
- [ ] Migration

#### 8.4 API Endpoints - Notifications

- [ ] `GET /api/notifications` - Pobierz powiadomienia (paginated)
- [ ] `PUT /api/notifications/[id]/read` - Oznacz jako przeczytane
- [ ] `PUT /api/notifications/mark-all-read`

**Send Notification Helper:**
```typescript
// lib/notifications.ts
export async function sendNotification({
  userId,
  type,
  title,
  message,
  email?: boolean,
  push?: boolean,
}) {
  // 1. Save to database
  await prisma.notification.create({...})
  
  // 2. Send email (if enabled)
  if (email) await sendEmail(...)
  
  // 3. Send push (if enabled - future)
  if (push) await sendPush(...)
}
```

#### 8.5 Notification Triggers

**Dodaj wywołania `sendNotification()` w:**
- [ ] `/api/manager/time/[id]/approve` → Employee notification
- [ ] `/api/manager/shifts/[id]/approve` → Employee notification
- [ ] `/api/employee/join-restaurant` → Manager notification
- [ ] Timer przed zmianą (cron job) → Employee reminder

#### 8.6 UI - Notifications

**Notification Bell:**
- [ ] Component: `<NotificationBell />`
  - Badge z liczbą nieprzeczytanych
  - Dropdown z listą (10 najnowszych)
  - Mark as read onclick
  - Link "Zobacz wszystkie" → `/notifications`

**Notifications Page:**
- [ ] `/employee/notifications` (każda rola)
  - Lista wszystkich powiadomień
  - Filtrowanie: Przeczytane/Nieprzeczytane
  - Pagination

**Pliki do utworzenia:**
```
lib/notifications.ts
lib/email.ts
emails/shift-approved.tsx (React Email)
components/NotificationBell.tsx
app/employee/notifications/page.tsx
app/api/notifications/route.ts
```

---

## **ETAP 9: FORGOT PASSWORD**
**Priorytet:** 🔴 WYSOKI (bezpieczeństwo)  
**Szacowany czas:** 2-3 godziny  
**Status:** ⏳ Do wykonania

### Zadania:

#### 9.1 Login Page Update

- [ ] `/login` → Dodaj link "Zapomniałeś hasła?"
  - Redirect na `/forgot-password`

#### 9.2 Forgot Password Page

- [ ] `/forgot-password` - Nowa strona
  - Input: Email
  - Przycisk "Wyślij link resetujący"
  - Użyj Supabase: `supabase.auth.resetPasswordForEmail()`
  - Success message: "Sprawdź email!"

#### 9.3 Reset Password Page

- [ ] `/reset-password` - Supabase callback
  - Form: Nowe hasło + Potwierdź hasło
  - Walidacja hasła (min 8 znaków)
  - Użyj: `supabase.auth.updateUser({ password })`
  - Redirect na `/login` po success

**Email Template:**
- [ ] Supabase wysyła automatycznie
- [ ] Customize w Supabase Dashboard > Authentication > Email Templates
- [ ] From: support@gastroapp.pl

**Pliki do utworzenia:**
```
app/forgot-password/page.tsx
app/reset-password/page.tsx
```

---

## **ETAP 10: SCHEDULE BUILDER (ADVANCED)**
**Priorytet:** 🟢 OPCJONALNY (future)  
**Szacowany czas:** 8-10 godzin  
**Status:** 🔮 Przyszłość

### Funkcjonalności (do przemyślenia później):

- [ ] Drag & drop interface dla shifts
- [ ] Auto-assignment based on availability
- [ ] Conflict detection (overlapping shifts)
- [ ] Copy schedule week-to-week
- [ ] Templates (powtarzalne grafiki)
- [ ] Bulk operations (zaznacz wiele → assign)

**Biblioteki:**
- `@dnd-kit/core` (drag & drop)
- `react-big-calendar` (calendar view)

---

## 📊 PODSUMOWANIE PRIORYTETÓW

| Etap | Nazwa | Priorytet | Czas | Zależności |
|------|-------|-----------|------|------------|
| 1 | Refactoring Routingu | 🔴 WYSOKI | 3-4h | - |
| 2 | System Tokenów | 🔴 WYSOKI | 5-6h | Etap 1 |
| 9 | Forgot Password | 🔴 WYSOKI | 2-3h | - |
| 4 | Time Tracking z Timerem | 🔴 WYSOKI | 6-7h | Etap 1 |
| 3 | Działy/Grafiki | 🟠 ŚREDNI | 4-5h | Etap 1 |
| 5 | Availability System | 🟠 ŚREDNI | 5-6h | Etap 3 |
| 6 | Reports (PDF) | 🟡 NISKI | 6-8h | Etap 3 |
| 7 | Admin Panel | 🟡 NISKI | 5-6h | Etap 1, 2 |
| 8 | Notifications | 🟡 NISKI | 4-5h | Etap 4, 5 |
| 10 | Schedule Builder | 🟢 FUTURE | 8-10h | Wszystkie |

**Całkowity szacowany czas:** ~48-56 godzin (6-7 dni roboczych)

---

## 🎯 ZALECANA KOLEJNOŚĆ IMPLEMENTACJI

### FAZA 1 - FUNDAMENTY (Tydzień 1)
1. ✅ Etap 9: Forgot Password (2-3h) - szybkie, niezależne
2. ✅ Etap 1: Refactoring Routingu (3-4h) - musi być pierwsze
3. ✅ Etap 2: System Tokenów (5-6h) - core functionality

**Checkpoint:** Przetestuj logowanie, routing, dołączanie do restauracji

### FAZA 2 - CORE FEATURES (Tydzień 2)
4. ✅ Etap 3: Działy/Grafiki (4-5h)
5. ✅ Etap 4: Time Tracking z Timerem (6-7h)
6. ✅ Etap 5: Availability System (5-6h)

**Checkpoint:** Przetestuj kompletny flow: Dyspo → Schedule → Time tracking

### FAZA 3 - NICE TO HAVE (Tydzień 3)
7. ✅ Etap 6: Reports (6-8h)
8. ✅ Etap 7: Admin Panel (5-6h)
9. ✅ Etap 8: Notifications (4-5h)

**Checkpoint:** Przetestuj wszystko, bugfix, polish

### FAZA 4 - PRZYSZŁOŚĆ (Later)
10. ⏳ Etap 10: Schedule Builder (advanced features)

---

## 📝 CHECKLIST PRZED KAŻDYM ETAPEM

- [ ] Przeczytaj wymagania
- [ ] Sprawdź zależności (czy poprzednie etapy ukończone)
- [ ] Utwórz branch: `git checkout -b feature/etap-X-nazwa`
- [ ] Update TODO list w projekcie

## 📝 CHECKLIST PO KAŻDYM ETAPIE

- [ ] Uruchom testy: `pnpm test`
- [ ] Manual testing (każda funkcjonalność)
- [ ] Commit changes: opisowy message
- [ ] Update DEVELOPMENT_LOG.md
- [ ] Merge do main
- [ ] Tag release: `git tag -a v1.X.0 -m "Etap X complete"`

---

## 🚀 GOTOWY DO STARTU?

Możemy zaczynać od **ETAPU 9 (Forgot Password)** - jest najprostszy i niezależny, szybki win!

Potem przechodzimy do **ETAPU 1 (Refactoring Routingu)** - fundamenty.

**Którym etapem chcesz zacząć?** Napisz numer (1-10) lub "zacznij od początku" 🎯
