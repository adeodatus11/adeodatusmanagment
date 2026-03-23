# AMS – Activity Management System

Kompleksowy system do zarządzania projektami, zadaniami, kontaktami i dziennikiem aktywności. Zbudowany z myślą o użytkownikach potrzebujących pełnej kontroli nad swoimi działaniami w nowoczesnym, ciemnym interfejsie.

## Główne Funkcje

- **Dashboard**: Podsumowanie KPI, zadania po terminie, aktywne projekty.
- **Obszary działalności**: Kategoryzacja projektów (np. WIN4SMEs, COVE, Szkoła).
- **Projekty i Zadania**: Zarządzanie terminami, priorytetami i postępem.
- **Log Działań**: Historia decyzji, spotkań i ustaleń.
- **CRM (Kontakty)**: Zarządzanie osobami powiązanymi z zadaniami.
- **Dokumentacja**: Przechowywanie linków i ścieżek do ważnych plików.
- **Raporty**: Wizualizacja postępów i statystyki.

## Technologie

- **Framework**: [Next.js 15+](https://nextjs.org/) (App Router, TypeScript)
- **Baza Danych**: SQLite + [Prisma 7](https://www.prisma.io/) (z wykorzystaniem Driver Adapters)
- **Stylizacja**: Tailwind CSS + Custom Design System (Vanilla CSS)
- **Ikony**: Lucide React / Radix UI Primitives

## Instalacja i uruchomienie

1. Sklonuj repozytorium:
   ```bash
   git clone <url-repozytorium>
   cd ams
   ```

2. Zainstaluj zależności:
   ```bash
   npm install
   ```

3. Skonfiguruj bazę danych:
   ```bash
   npx prisma generate
   ```

4. Uruchom serwer deweloperski:
   ```bash
   npm run dev
   ```

Aplikacja będzie dostępna pod adresem `http://localhost:3000`.

## GitHub i Mobile

Projekt został dostosowany do publikacji na GitHub oraz do wygodnej pracy na urządzeniach mobilnych (smartfonach).
