# ⚡ Nexum — High-Concurrency Financial Ledger Core API

[![Python 3.12](https://img.shields.io/badge/Python-3.12-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg)](https://fastapi.tiangolo.com)
[![PostgreSQL 16](https://img.shields.io/badge/PostgreSQL-16-336791.svg)](https://www.postgresql.org/)
[![Redis 7](https://img.shields.io/badge/Redis-7-DC382D.svg)](https://redis.io/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED.svg)](https://www.docker.com/)
[![ACID Compliant](https://img.shields.io/badge/Transactions-ACID-success.svg)]()
[![Live Demo](https://img.shields.io/badge/Live_Demo-Online-success.svg)](https://excel-well-rough-stadium.trycloudflare.com)

> **Demo Pública Activa**: [https://excel-well-rough-stadium.trycloudflare.com](https://excel-well-rough-stadium.trycloudflare.com)  
> **Swagger API Docs**: [https://excel-well-rough-stadium.trycloudflare.com/docs](https://excel-well-rough-stadium.trycloudflare.com/docs)

> **Nexum** es un motor contable de libro mayor de doble partida (*Double-Entry Bookkeeping*) diseñado para entornos fintech de misión crítica y alta concurrencia. Garantiza consistencia matemática absoluta, cero balance negativo mediante restricciones CHECK a nivel de hardware/kernel de PostgreSQL, prevención determinista de *deadlocks* cruzados y protección contra doble gasto mediante idempotencia distribuida en Redis.

---

## 🏛️ Arquitectura del Sistema

```
                        [ Cliente / Gateway HTTP ]
                                    │
                         X-Idempotency-Key Header
                                    ▼
                ┌───────────────────────────────────────┐
                │          FastAPI Application          │
                │        (Workers Asíncronos)           │
                └───────────────────┬───────────────────┘
                                    │
             ┌──────────────────────┴──────────────────────┐
             ▼                                             ▼
   ┌───────────────────┐                         ┌───────────────────┐
   │    Redis Cache    │                         │   PostgreSQL 16   │
   │  (Idempotencia)   │                         │  (ACID Engine)    │
   │                   │                         │                   │
   │ 1. SET NX (Lock)  │                         │ 3. SELECT FOR     │
   │ 2. Cache Response │                         │    UPDATE (Sorted)│
   │ 3. TTL 24h        │                         │ 4. CHECK (bal>=0) │
   │                   │                         │ 5. Double-Entry   │
   └───────────────────┘                         └───────────────────┘
```

---

## 🛡️ Principios de Ingeniería y Resiliencia

### 1. Sistema de Doble Partida (Double-Entry Ledger)
Cada movimiento de fondos genera exactamente dos asientos contables inmutables dentro de una única transacción atómica:
- **DEBIT**: Salida de fondos en la cuenta de origen (`balance_after = balance - amount`).
- **CREDIT**: Entrada de fondos en la cuenta de destino (`balance_after = balance + amount`).
El endpoint `/api/v1/reconciliation/{account_id}` audita en tiempo real que:
$$\text{Balance Actual} = \sum \text{Créditos} - \sum \text{Débitos}$$
Cualquier discrepancia $\neq 0$ activa alertas inmediatas de auditoría.

### 2. Prevención Determinista de Deadlocks (Anti-Deadlock Lock Ordering)
En transferencias cruzadas concurrentes (ej. A transfiere a B mientras B transfiere a A), el bloqueo pesimista ingenuo causa bloqueos mutuos (*Deadlocks*):
- Proceso 1: Bloquea A $\to$ Intenta bloquear B.
- Proceso 2: Bloquea B $\to$ Intenta bloquear A.
**Solución en Nexum:** Los UUIDs de ambas cuentas son ordenados lexicográficamente antes de ejecutar `SELECT ... FOR UPDATE`:
```python
first_id, second_id = (id_a, id_b) if id_a < id_b else (id_b, id_a)
```
Ambos procesos siempre compiten por el mismo recurso inicial, eliminando la posibilidad de dependencias circulares.

### 3. Blindaje Anti-Doble Gasto (Check Constraint + SELECT FOR UPDATE)
- **Bloqueo Pesimista en Fila**: Ninguna lectura sucia ni actualizaciones concurrentes superpuestas.
- **Restricción a Nivel de Base de Datos**: `CHECK (balance >= 0.0000)` en la tabla `accounts`. Incluso si la capa de aplicación fallara, el motor relacional rechaza a nivel de almacenamiento cualquier intento de saldo negativo.

### 4. Idempotencia Distribuida con Redis
- Cada petición requiere la cabecera HTTP `X-Idempotency-Key`.
- Usa operaciones atómicas `SET NX EX` en Redis. Si una petición con la misma clave llega por un reintento de red, la API retorna la respuesta original idéntica sin volver a debitar fondos.

---

## 🚀 Despliegue Rápido con Docker Compose

### Prerrequisitos
- Docker Engine y Docker Compose instalados.

### 1. Clonar y Configurar
```bash
git clone https://github.com/loa464/nexum.git
cd nexum
cp .env.example .env
```

### 2. Iniciar Servicios
```bash
docker compose up --build -d
```

### 3. Verificar Estado de Salud
```bash
curl http://localhost:8000/api/v1/health
```
Respuesta esperada:
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "services": {
    "database": "healthy",
    "redis": "healthy"
  }
}
```

Acceso a la documentación interactiva Swagger:
👉 **[http://localhost:8000/docs](http://localhost:8000/docs)**

---

## 🧪 Pruebas de Estrés y Concurrencia (Pytest)

Ejecutar la suite completa de pruebas unitarias y de estrés con 50 peticiones simultáneas:
```bash
pytest -v -s
```

Resultados garantizados en `test_high_concurrency_double_spending_protection`:
- Cuenta con \$1,000 demandada por 50 peticiones concurrentes de \$25 (\$1,250 en total).
- 40 transacciones exitosas (HTTP 201).
- 10 transacciones rechazadas (HTTP 400 `INSUFFICIENT_FUNDS`).
- Balance final: **EXACTAMENTE \$0.0000** (Cero balance negativo).
- Discrepancia en libro mayor: **\$0.0000**.

---

## 📡 Guía de la API (cURL)

### 1. Crear Cuenta
```bash
curl -X POST http://localhost:8000/api/v1/accounts \
  -H "Content-Type: application/json" \
  -d '{
    "owner_name": "Jahn Loa",
    "initial_balance": 1500.0000,
    "currency": "USD"
  }'
```

### 2. Ejecutar Transferencia con Idempotencia
```bash
curl -X POST http://localhost:8000/api/v1/transfers \
  -H "Content-Type: application/json" \
  -H "X-Idempotency-Key: a1b2c3d4-e5f6-7890-abcd-ef1234567890" \
  -d '{
    "source_account_id": "<UUID_ORIGEN>",
    "target_account_id": "<UUID_DESTINO>",
    "amount": 250.0000,
    "currency": "USD"
  }'
```

### 3. Auditoría y Conciliación Contable
```bash
curl http://localhost:8000/api/v1/reconciliation/<UUID_CUENTA>
```

---

## 👤 Autor
**Jahn Pahol Loa Rojas**  
Backend & AI Engineer  
- GitHub: [@loa464](https://github.com/loa464)
