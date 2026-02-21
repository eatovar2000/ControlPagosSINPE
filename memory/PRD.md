# Suma — PRD (Product Requirements Document)

## Problem Statement
App de gestion de movimientos financieros para pequenos emprendedores en Costa Rica (SINPE). Un solo codebase para PWA Web + iOS + Android.

## Architecture
- **Frontend**: Expo SDK 53 (React Native) + React Native Web + Expo Router (file-based tabs)
- **Backend**: FastAPI (Python 3.12) + SQLAlchemy 2.0 async + asyncpg
- **Database**: PostgreSQL 15 (DB: suma, user: postgres)
- **Migrations**: Alembic (initial_schema migration applied)
- **Design System**: "Suma" — Deep Jungle Green (#1B4D3E) + Terracotta (#E07A5F), Warm Sand (#F4F1DE) bg

## User Personas
1. **Maria** — Duena de pulperia, ingresos/gastos diarios, celular
2. **Carlos** — Vendedor en ferias, clasificar por evento, multiples responsables

## Core Requirements (Static)
- Bandeja de movimientos pendientes
- Registro de ingresos/gastos en CRC
- Clasificacion por unidad de negocio (sucursal/marca/evento)
- Responsable opcional por movimiento
- Etiquetas libres
- Estados: pendiente, clasificado, cerrado
- KPIs: balance, ingresos, gastos, pendientes
- Auth federada: Google Sign-In + SMS OTP (Firebase Auth) — PLANNED
- PWA instalable, iOS app, Android app — SINGLE CODEBASE (Expo)

## What's Been Implemented

### 2026-01-28 — Skeleton MVP (Expo + PostgreSQL)
- [x] Expo SDK 53 + React Native Web frontend (single codebase)
- [x] Expo Router with file-based tab navigation (3 tabs)
- [x] FastAPI backend con SQLAlchemy async + asyncpg
- [x] PostgreSQL 15 como fuente de verdad
- [x] Alembic migrations (initial_schema)
- [x] 13 API endpoints: health, CRUD movements, business-units, tags, kpis/summary, seed
- [x] 3 screens: Pendientes (lista), Registrar (formulario skeleton), KPIs (dashboard)
- [x] Seed data: 5 movimientos, 2 unidades, 3 tags
- [x] Testing: Backend 100%, Frontend 90%

## Tech Stack Details
| Component | Technology | File |
|-----------|-----------|------|
| Entry point | expo-router/entry | app.json |
| Tab Layout | Expo Router Tabs | app/(tabs)/_layout.js |
| Pendientes | React Native ScrollView | app/(tabs)/index.js |
| Registrar | React Native TextInput/Pressable | app/(tabs)/registrar.js |
| KPIs | React Native View/Text | app/(tabs)/kpis.js |
| Theme | StyleSheet + colors | lib/theme.js |
| DB models | SQLAlchemy ORM | backend/models.py |
| DB engine | asyncpg + AsyncSession | backend/database.py |
| API | FastAPI APIRouter | backend/server.py |
| Migrations | Alembic | backend/migrations/ |

## Prioritized Backlog

### P0 — Modulo Auth
- Firebase Auth (Google Sign-In + SMS OTP)
- User model en PostgreSQL
- Proteccion de rutas

### P0 — Modulo Movimientos (funcional)
- Formulario Registrar conectado al backend
- Editar/eliminar movimiento
- Cambiar estado workflow

### P1 — Modulo Unidades/RBAC
- Selector de unidad en formulario
- CRUD unidades
- Responsable por movimiento

### P1 — Modulo Etiquetas
- Selector de etiquetas
- Filtrar por etiqueta

### P1 — KPIs Avanzados
- Filtro periodo/unidad
- Graficos

### P2 — PWA Completa
- Service Worker, push notifications, install prompt

### P2 — Polish
- Dark mode, export CSV, onboarding

## Next Tasks (Modular Forks)
1. Auth (Firebase)
2. Movimientos (formulario funcional)
3. Unidades/RBAC
4. Pendientes/Claim (workflow estados)
5. KPIs (graficos + filtros)
