# Phase 12 — báo cáo verification (2026-10-01)

Spec: `2026-10-01-phase-12-testing-performance-design.md`. Plan: `docs/superpowers/plans/2026-10-01-phase-12-testing-performance.md`. Phạm vi: Testing & Performance; nợ Phase 11 được hoãn theo yêu cầu.

## Tóm tắt

- Coverage v8 cho `game-core` (96.7% dòng / 91.4% nhánh) và `learning-engine` (100% / 96.7%), có ngưỡng 95/90 và 100/95 chạy bằng `npm run test:coverage`. Baseline trước phase: 92.9/90.1 và 98.1/93.2 (`phase-12-coverage-baseline.md`).
- Test mới: `applyEffects.test.ts` (8 test: đường lỗi, rollback, idempotent, không mutate), 5 test cho `learningReducer`. Các module `condition/objective/createCaseState/reconcile` đã có test sẵn nên không nhân đôi.
- E2E hành trình tách thành 8 bước (`journey.spec.ts`) kèm reload giữa chừng; helper chung ở `journeyHelpers.ts`; `interactAt` giữ phím E 120 ms.
- Hiệu năng: `performance.spec.ts` + hook debug `textureCount`/`listenerCount`; kết quả và kết luận trong `phase-12-performance-report.md` (không có leak; tải lạnh ~1.1 s / 13.2 MB; không cần atlas/lazy/nén).
- Sửa lỗi sản phẩm lộ ra: prompt tương tác còn nháy ở vị trí fallback ngay lúc tải lạnh trên màn hình rộng (`InteractionPrompt.tsx`).
- Dependency mới: `@vitest/coverage-v8@2.1.9` (devDependency của hai package).

## Lệnh đã chạy

| Lệnh | Kết quả |
| ---- | ------- |
| `npm run lint` | pass, 7 project |
| `npm run test` | pass: game-web 499, game-content 166, game-core 57, learning-engine 17, ui 18, shared-types 1 |
| `npm run build` | pass |
| `npm run typecheck`, `npm run format:check`, `npm run memory:check` | pass |
| `npm run test:coverage` | pass, đạt ngưỡng |
| Full `npm run test:e2e -- --workers=1` | **133/133 pass** (9.5 phút) trên `40ef0bc` |

Sau full E2E có một commit chỉ chạm test và hook debug (`c9cfafe`: đếm listener rộng hơn, nâng bộ đệm resource timing, reload giữa hành trình); sau đó chỉ chạy lại `performance.spec.ts` + `journey.spec.ts` (10/10 pass), chưa chạy lại full E2E. Lint/test/build/typecheck/format/memory chạy lại sau commit đó đều pass.

## Review cuối

Reviewer độc lập (opus) không có Critical. Ba mục Important (đếm resource bị chặn ở 250, `listenerCount` quá hẹp, thiếu reload giữa hành trình) đã sửa trong `c9cfafe`. Mục "shutdown giữa lúc transition" được giữ ở mức test đơn vị `assetManifest.test.ts`. Minor còn lại: ngưỡng `readyMs < 5000` trên dev server; biên heap mỏng so với đối chứng; E2E chưa được type-check (dùng `DebugApi` hẹp); kiểm tra save sau sai suspect đọc ngay sau thông báo; `window` không có guard `typeof` ở `InteractionPrompt`; fix prompt chỉ dựa vào test lấy mẫu className; ngưỡng coverage không nằm trong `npm run test`.

## Hạn chế còn lại

- Nợ Phase 11 vẫn còn (regression cho 5 lỗi review điều hướng, test resize lệch ~18px thỉnh thoảng, nghiệm thu nhạc/hình/cổng, Node 22).
- Số đo hiệu năng từ một máy Windows và Vite dev server; chưa đo tải lạnh bản production bằng trình duyệt.
- Không đổi backend; không chạy `dotnet`.
