# Suma — PRD (Product Requirements Document)

## Problem Statement
App de gestion de movimientos financieros para pequenos emprendedores en Costa Rica que cobran por SINPE. Funcionalidad core: bandeja de movimientos (ingreso/gasto), clasificacion por unidad de negocio, responsable opcional, etiquetas, estados, KPIs simples.

## Architecture
- **Frontend**: React 19 + Tailwind CSS + shadcn/ui + react-router-dom (PWA-ready)
- **Backend**: FastAPI (Python) REST API versionada (v1)
- **Database**: MongoDB (via Motor async driver)
- **Design System**: "Suma" — Manrope + IBM Plex Sans, Deep Jungle Green (#1B4D3E) + Terracotta (#E07A5F), Warm Sand (#F4F1DE) background

## User Personas
1. **Maria** — Duena de pulperia, maneja ingresos/gastos diarios, no tech-savvy, usa celular
2. **Carlos** — Vendedor en ferias, necesita clasificar por evento, multiples responsables

## Core Requirements (Static)
- Bandeja de movimientos pendientes
- Registro de ingresos/gastos
- Clasificacion por unidad de negocio (sucursal/marca/evento)
- Responsable opcional por movimiento
- Etiquetas libres
- Estados: pendiente, clasificado, cerrado
- KPIs: balance, ingresos, gastos, conteo pendientes
- Autenticacion federada (Google + SMS OTP via Firebase Auth) — PLANNED
- PWA instalable
- Moneda: CRC (Colones costarricenses)

## What's Been Implemented
### 2026-01-28 — Skeleton MVP (Fase 0)
- [x] Backend API completa: health, CRUD movements, business-units, tags, kpis/summary, seed
- [x] Frontend shell con bottom navigation (3 tabs: Pendientes, Registrar, KPIs)
- [x] Pagina Pendientes: lista de movimientos pendientes con datos reales
- [x] Pagina Registrar: formulario skeleton (tipo, monto, descripcion, campos placeholder)
- [x] Pagina KPIs: dashboard con balance, ingresos, gastos, pendientes
- [x] Design system Suma aplicado (colores, tipografia, spacing)
- [x] PWA manifest configurado
- [x] Seed data: 5 movimientos, 2 unidades, 3 tags
- [x] Testing: Backend 100%, Frontend 95%

## Prioritized Backlog

### P0 — Modulo Auth (Siguiente)
- Firebase Auth (Google Sign-In + SMS OTP)
- Registro/login flow
- Proteccion de rutas
- User model en DB

### P0 — Modulo Movimientos (Funcional)
- Formulario Registrar conectado al backend (crear movimiento real)
- Editar movimiento
- Eliminar movimiento
- Cambiar estado (pendiente -> clasificado -> cerrado)

### P1 — Modulo Unidades/RBAC
- Selector de unidad de negocio en formulario
- CRUD de unidades
- Responsable por movimiento

### P1 — Modulo Etiquetas
- Selector de etiquetas en formulario
- Crear etiquetas inline
- Filtrar por etiqueta

### P1 — Modulo KPIs Avanzado
- Filtro por periodo (semana/mes/anio)
- Filtro por unidad de negocio
- Graficos con Recharts

### P2 — PWA Completa
- Service Worker para cache offline
- Push notifications
- Install prompt

### P2 — Polish
- Dark mode
- Export CSV
- Onboarding flow

## Next Tasks (Modular Forks)
1. **Auth** → Firebase Auth integration
2. **Movimientos** → Formulario funcional, CRUD completo
3. **Unidades/RBAC** → Clasificacion real
4. **Pendientes/Claim** → Workflow de estados
5. **KPIs** → Graficos y filtros
