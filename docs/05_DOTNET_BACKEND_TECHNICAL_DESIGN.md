# The Lexicon Files — .NET Backend Technical Design

## 1. Technology

```text
.NET 10
ASP.NET Core
Entity Framework Core
PostgreSQL
Npgsql
OpenAPI
xUnit
Testcontainers
Serilog
OpenTelemetry
```

Optional later:

```text
Redis
SignalR
Object Storage
Background jobs
```

## 2. Architectural Style

Use a **Modular Monolith**.

```text
API
 ↓
Application
 ↓
Domain

Infrastructure implements Application/Domain ports.
```

Do not use microservices for the MVP.

## 3. Projects

```text
LexiconFiles.Api
LexiconFiles.Application
LexiconFiles.Domain
LexiconFiles.Infrastructure
LexiconFiles.Tests
```

### Domain

Pure business model.

No dependency on:

- ASP.NET Core
- EF Core
- PostgreSQL
- HTTP

### Application

Contains:

- use cases
- commands/queries
- DTOs
- interfaces
- authorization decisions
- orchestration

### Infrastructure

Contains:

- EF Core
- PostgreSQL
- authentication implementation
- repositories where useful
- external services

### API

Contains:

- endpoint mapping
- middleware
- OpenAPI
- authentication wiring
- Problem Details
- health checks

## 4. MVP Philosophy

The first playable case is **local-first**.

The backend must not be required for:

- rendering;
- movement;
- dialogue runtime;
- evidence discovery;
- vocabulary interaction;
- contradiction logic;
- local save.

The backend becomes useful for:

- user accounts;
- cloud saves;
- cross-device sync;
- achievements;
- analytics;
- downloadable case catalog;
- future social/realtime features.

## 5. Persistence

Use:

```text
PostgreSQL + Npgsql.EntityFrameworkCore.PostgreSQL
```

Use EF Core migrations.

Never use `EnsureCreated()` for production schema management.

Use `DateTimeOffset` or UTC timestamps.

## 6. Suggested Entities

```text
User
GameSave
LanguageProfile
Achievement
UserCaseProgress
```

Auth tables can be provided by ASP.NET Core Identity.

Authored game content remains file/version controlled initially.

## 7. Save Synchronization

Client save includes:

```text
saveId
schemaVersion
revision
updatedAt
gameState
learningProfile
```

Cloud update should support optimistic concurrency.

Example:

```text
client revision = 7
server revision = 7
→ accept update → revision 8

client revision = 7
server revision = 8
→ HTTP 409 conflict
```

Never silently overwrite a newer cloud save.

## 8. API Versioning

Base route:

```text
/api/v1
```

Potential endpoints:

```text
POST /api/v1/auth/login
POST /api/v1/auth/refresh
POST /api/v1/auth/logout

GET  /api/v1/me

GET  /api/v1/game-saves
GET  /api/v1/game-saves/{id}
PUT  /api/v1/game-saves/{id}

GET  /api/v1/language-profile
PUT  /api/v1/language-profile
```

## 9. Authentication

Not required for offline vertical slice.

When enabled:

```text
ASP.NET Core Identity
JWT access token
Refresh token rotation
Revocation
```

Do not implement custom password hashing.

## 10. Error Responses

Use ASP.NET Core Problem Details.

Status examples:

```text
400 validation error
401 unauthenticated
403 forbidden
404 missing resource
409 save conflict
422 domain/business validation where appropriate
500 unexpected error
```

## 11. Validation

Simple request validation:

```text
DataAnnotations
```

Complex validation:

```text
FluentValidation
```

Business invariants stay in Domain/Application.

## 12. Security

Minimum:

- HTTPS production;
- explicit CORS origins;
- rate limiting for auth/public mutation endpoints;
- secure headers;
- no stack traces in production;
- secrets via environment/secret store;
- parameterized DB access through EF Core;
- refresh token rotation;
- authorization policies.

## 13. Observability

Use:

```text
Serilog
OpenTelemetry
Health Checks
```

Include correlation/request ID.

Health endpoints:

```text
/health/live
/health/ready
```

Readiness can check PostgreSQL once DB becomes required.

## 14. Testing

Use xUnit.

Recommended layers:

```text
Domain unit tests
Application unit tests
API integration tests
PostgreSQL integration tests
```

Use Testcontainers for PostgreSQL integration behavior.

Avoid relying on EF Core InMemory provider for relational correctness.

## 15. Deployment

Recommended container layout:

```text
game-web
api
postgres
```

Production can be:

```text
CDN/static host → React/Phaser
        ↓
ASP.NET Core API
        ↓
PostgreSQL
```

Reverse proxy optional:

```text
Nginx / cloud ingress
```

## 16. Future Realtime

If future multiplayer/co-op or live presence is added:

```text
ASP.NET Core SignalR
```

Do not add SignalR to the MVP merely because it is available.

## 17. Future Caching

Redis only when there is a measured need for:

- distributed cache;
- rate-limit storage;
- sessions;
- realtime scale-out;
- locks.

No Redis dependency for the first vertical slice.

## 18. Codex Rules for Backend

1. Target .NET 10.
2. Enable nullable reference types.
3. Treat warnings seriously.
4. Keep controllers/endpoints thin.
5. Business logic belongs outside API layer.
6. Domain must not reference Infrastructure.
7. Add migration for every schema change.
8. Add tests for every important use case.
9. Do not introduce microservices.
10. Do not make API availability a requirement for offline gameplay.
