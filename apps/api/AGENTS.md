# AGENTS.md — apps/api

Áp dụng thêm cho backend. Rule gốc: `/AGENTS.md`. Thiết kế: `docs/05_DOTNET_BACKEND_TECHNICAL_DESIGN.md`.

## Boundaries
- `Api → Infrastructure → Application → Domain`. Domain không reference EF Core / ASP.NET / Npgsql / HTTP.
- Endpoint mỏng (Minimal API trong `Api/Endpoints`), business logic trong Application/Domain.
- Application tổ chức theo feature folder (`GameSaves/`, `LanguageProfiles/`, `Users/`). MediatR không bắt buộc.
- Authored case content **không** lưu DB.

## Conventions
- Route base `/api/v1`. Lỗi trả ProblemDetails (RFC 9457): 400/401/403/404/409/422/500; không lộ stack trace ở production.
- Timestamps `DateTimeOffset` UTC. Save có `schemaVersion` + `revision`; lệch revision → 409, không overwrite save mới hơn.
- Mỗi thay đổi schema = một EF migration commit trong `Infrastructure/Persistence/Migrations`. Không `EnsureCreated()`.
- CORS origin explicit; không `AllowAnyOrigin` + credentials.
- Health: `/health/live`, `/health/ready`. Logging có cấu trúc + correlation id.
- Auth (khi cần): ASP.NET Core Identity + JWT + refresh token rotate/revoke/hash. Không tự viết password hashing.
- Secrets qua environment/secret store, không commit vào `appsettings*.json`.

## Test
- xUnit trong `LexiconFiles.Tests/{Domain,Application,Api,Persistence}`.
- Persistence test dùng Testcontainers PostgreSQL; không dùng EF InMemory thay cho relational behavior.

## Scope
- Vertical slice: chỉ scaffold, OpenAPI, health. Không SignalR, Redis, microservices.
