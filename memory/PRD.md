# Suma — PRD (Product Requirements Document)

## Problem Statement
App de gestión de movimientos financieros para pequeños emprendedores en Costa Rica (SINPE). Un solo codebase para PWA Web + iOS + Android.

## Architecture
- **Frontend**: Expo SDK 53 (React Native) + React Native Web + Expo Router (file-based tabs)
- **Backend**: FastAPI (Python 3.12) + SQLAlchemy 2.0 async + asyncpg
- **Database**: PostgreSQL 15 (DB: suma, user: postgres)
- **Migrations**: Alembic
- **Authentication**: Firebase Auth (Google Sign-In + SMS OTP)
- **Design System**: "Suma" — Deep Jungle Green (#1B4D3E) + Terracotta (#E07A5F), Warm Sand (#F4F1DE) bg

## User Personas
1. **Maria** — Dueña de pulpería, ingresos/gastos diarios, celular
2. **Carlos** — Vendedor en ferias, clasificar por evento, múltiples responsables

## Core Requirements
- Bandeja de movimientos pendientes
- Registro de ingresos/gastos en CRC
- Clasificación por unidad de negocio (sucursal/marca/evento)
- Responsable opcional por movimiento
- Etiquetas libres
- Estados: pendiente, clasificado, cerrado
- KPIs: balance, ingresos, gastos, pendientes
- Auth federada: Google Sign-In + SMS OTP (Firebase Auth)
- PWA instalable, iOS app, Android app — SINGLE CODEBASE (Expo)

## What's Been Implemented

### 2026-02-21 — FASE 8: KPIs con Gráficos Torta
- [x] Backend: GET /api/v1/kpis/summary con filtros `period=today|week|month`
- [x] Respuesta estructurada: `totals` (income_total, expense_total, balance)
- [x] `breakdown_type`: array con Ingresos vs Gastos para gráfico torta
- [x] `breakdown_responsible`: Top 6 responsables + "Otros", null/empty => "Sin responsable"
- [x] Filtrado por fecha según período (hoy, semana desde lunes, mes desde día 1)
- [x] Frontend: Tab KPIs con selector Hoy/Semana/Mes (default Hoy)
- [x] 3 cards: Balance, Ingresos (verde), Gastos (rojo)
- [x] 2 gráficos torta SVG: por tipo y por responsable
- [x] SimplePieChart: implementación SVG custom (sin dependencias externas)
- [x] Testing: 10/10 backend tests passed (100%), código frontend verificado

### 2026-02-21 — FASE 7.1: UX Minimalista
- [x] Selector "Mostrar: Pendientes | Todos" en tab Movimientos
- [x] Default siempre a "Pendientes" al abrir la app (no recuerda selección)
- [x] Vista "Todos" muestra todos los movimientos del usuario con status visible
- [x] Acciones Clasificar/Cerrar/Reabrir funcionan en ambas vistas
- [x] Iconos bottom tabs mejorados: Lista (Pendientes), + (Registrar), Barras (KPIs)
- [x] Testing: 10/10 tests pasaron (100%)

### 2026-02-21 — FASE 7: Pendientes + Claim
- [x] Campo `status` en movements validado: `pending | classified | closed` (Literal type)
- [x] Campo `responsible` opcional (texto libre) editable desde UI
- [x] Tab Pendientes filtra solo `status='pending'`
- [x] Modal para clasificar movimientos desde la lista de pendientes
- [x] Botones "Clasificar" y "Cerrar" cambian status en backend
- [x] Input de responsable en modal
- [x] Mantiene ownership por `user_id`
- [x] Testing: 69/70 tests pasaron (99%)

### 2026-02-21 — Movements Module (Protected)
- [x] Todos los endpoints de movements requieren autenticación
- [x] Movimientos asociados a `user_id` del usuario autenticado
- [x] GET /movements filtra por usuario + status opcional
- [x] POST /movements crea con `status='pending'` por defecto
- [x] PATCH /movements/{id} actualiza status y responsible
- [x] DELETE /movements/{id} solo si es propietario

### 2026-02-21 — Authentication Module (Firebase Auth)
- [x] Firebase Admin SDK configurado en backend
- [x] Modelo `User` en PostgreSQL (firebase_uid, email, phone, role, etc.)
- [x] Middleware de verificación JWT (`firebase_auth.py`)
- [x] Endpoints `/api/v1/auth/register` y `/api/v1/auth/me`
- [x] Pantalla de login con Google Sign-In y SMS OTP
- [x] AuthContext y AuthProvider en frontend
- [x] Protección de rutas (redirect a login si no autenticado)
- [x] Header con información de usuario y botón de logout
- [x] Flujo SMS con código de país Costa Rica (+506)
- [x] reCAPTCHA invisible para Phone Auth

### 2026-02-21 — Infrastructure Fixes
- [x] PostgreSQL 15 instalado y configurado en el entorno
- [x] Migraciones Alembic actualizadas con tabla `users`
- [x] Firebase Service Account configurado via variable de entorno

### Previous — Skeleton MVP (Expo + PostgreSQL)
- [x] Expo SDK 53 + React Native Web frontend
- [x] Expo Router with file-based tab navigation (3 tabs)
- [x] FastAPI backend con SQLAlchemy async + asyncpg
- [x] PostgreSQL como fuente de verdad
- [x] 17+ API endpoints funcionando
- [x] 3 screens: Pendientes, Registrar, KPIs
- [x] Seed data: 5 movimientos, 2 unidades, 3 tags

## Tech Stack
| Component | Technology |
|-----------|-----------|
| Frontend | Expo SDK 53, React Native, React Native Web |
| Backend | FastAPI, SQLAlchemy, Alembic |
| Database | PostgreSQL 15 |
| Auth | Firebase Auth (Google + Phone) |
| Tabs | Expo Router |

## Database Schema
- `users`: id, firebase_uid, email, phone, display_name, photo_url, provider, role, timestamps
- `movements`: id, type, amount, currency, description, responsible, business_unit_id, status, date, tags, timestamps
- `business_units`: id, name, type, created_at
- `tags`: id, name, created_at

## API Endpoints
### Auth (Protected)
- `POST /api/v1/auth/register` - Registrar usuario después de Firebase auth
- `GET /api/v1/auth/me` - Obtener perfil del usuario actual

### Public
- `GET /api/health` - Health check con estado de Firebase
- `POST /api/seed` - Poblar base de datos con datos de ejemplo
- `GET /api/v1/movements` - Listar movimientos
- `POST /api/v1/movements` - Crear movimiento
- `PATCH /api/v1/movements/{id}` - Actualizar movimiento
- `DELETE /api/v1/movements/{id}` - Eliminar movimiento
- `GET /api/v1/business-units` - Listar unidades de negocio
- `POST /api/v1/business-units` - Crear unidad
- `GET /api/v1/tags` - Listar etiquetas
- `POST /api/v1/tags` - Crear etiqueta
- `GET /api/v1/kpis/summary` - Resumen de KPIs

## Prioritized Backlog

### P0 — COMPLETADO ✓
- [x] FASE 7: Pendientes + Claim (status field, UI para clasificar)
- [x] Módulo Movimientos conectado al backend
- [x] Autenticación Firebase completa

### P1 — Siguiente
- Módulo Unidades de Negocio + RBAC básico
- UI para editar/eliminar movimientos (CRUD completo)
- Selector de unidad en formulario de registro

### P2 — Futuro
- SMS login (requiere activar billing en Firebase)
- KPIs avanzados (filtros, gráficos)
- PWA completa (service worker, push notifications)
- Export CSV, dark mode

## Testing Status
- FASE 7.1: 10/10 tests passed (100%)
- FASE 7: 69/70 tests passed (99%)
- Test reports: `/app/test_reports/iteration_6.json`, `/app/test_reports/iteration_5.json`
- Issue conocido: `/api/seed` roto (no afecta funcionalidad principal)

## Environment Variables
### Backend (.env)
- `DATABASE_URL` - PostgreSQL connection string
- `FIREBASE_SERVICE_ACCOUNT_JSON` - Firebase Admin credentials (JSON string)

### Frontend (.env)
- `EXPO_PUBLIC_API_URL` - Backend API URL
- `EXPO_PUBLIC_FIREBASE_*` - Firebase Web config

## Files Reference
- `/app/backend/server.py` - FastAPI app
- `/app/backend/firebase_auth.py` - Firebase token verification
- `/app/backend/models.py` - SQLAlchemy models
- `/app/frontend/app/login.js` - Login screen
- `/app/frontend/lib/AuthContext.js` - Auth state management
- `/app/frontend/lib/firebase.js` - Firebase client SDK
- `/app/frontend/components/AppHeader.js` - User header with logout
