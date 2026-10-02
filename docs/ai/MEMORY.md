---
schema_version: 1
updated_at: 2026-10-03T00:30:00+07:00
phase: case-002
status: in_progress
result_commit: 0ed6649
active_spec: docs/superpowers/specs/2026-10-02-case-002-design.md
active_plan: docs/superpowers/plans/2026-10-02-case-002.md
---

## Metadata

- Repo D:/Works/the-lexicon-files-game, branch dev, npm + Nx; implementation Native inline theo lựa chọn đã duyệt.
- Gói mới: investigation no-scroll + SVG artwork. Người dùng đã duyệt spec và plan ngày02/10, chọn làm cả sổ tay và bảng suy luận theo logic hiện có; triển khai Native inline trên dev.

## Current Phase

- PR-03 Case #002 "The Wrong Delivery": spec đã duyệt (`3140dc0`), plan 9 task đã viết (`0ed6649`), chờ người dùng duyệt plan và chọn cách thực thi; chưa có code. PR-01 (onboarding) còn nợ kiểm chứng, không mở rộng.

## Active Goal

- Duyệt plan Case #002, chọn subagent-driven/Native (khuyến nghị subagent-driven), rồi thực thi theo thứ tự Task 1→9. Mục tiêu chính: bằng chứng tính tổng quát của engine, báo cáo `docs/ai/2026-10-02-case-002-engine-generality.md`.

## Current Status

- Spec/plan commit cục bộ, chưa push (chờ người dùng). Plan phát hiện sớm F-1 (learning record kiểm tra theo catalogue một case → có thể backup+reset), F-2 (context id không gắn caseId), F-3 (khai báo `audio` ép voice cho mọi node NPC), F-4 (`DEFAULT_START`/`GameCanvas` một case). Onboarding: code xong, `onboarding.spec.ts` 8/8; full E2E 17 fail (~9 có sẵn ở baseline `08e115f`), báo cáo `docs/ai/2026-10-02-intro-onboarding-verification.md`.

## Completed

- Phase0A–12 theo acceptance trước; debtclosure bb109fe/a5c1822/e4f5780, nhạc Mystical Piano/cổng đồng đã accepted; báo cáo tương ứng trong docs/ai.
- Viewport cb18871, report docs/ai/2026-10-01-viewport-focus-verification.md; giữ fixed/clip và regression.
- People 5 task: result19d3450, report docs/ai/2026-10-01-notebook-people-verification.md; metadata/legacy/learning và focus đã kiểm chứng.
- Notebook + deduction: 5e28158 → 56c1f73 → 20b6eb9 → fb2f71f → 992acfe → f0eb261 → 8c734b5; plan checkbox hoàn tất và một review độc lập.

## In Progress

- Chờ xác nhận plan: (1) Case #002 không `audio` (không nhạc/voice), lệch spec §6.8; (2) sáu evidence. Nợ onboarding: phân loại fail E2E (`feedback-navigation(-review)`, `feedback-audio`) và review độc lập, gộp vào Task 8–9 nếu người dùng đồng ý.

## Active Decisions

- Native inline trên dev; một phase một lần; scope notebook + board riêng dùng engine hiện có. Không tự mở phase nội dung hoặc backend kế tiếp.
- Không đổi case rules/transcript flags/save version; text/ID trong game-content. Spec/plan02/10 đã duyệt. Page-flip2.0.7 bị loại sau Chromium cleanup probe; dùng SVG/CSS fallback, dependency đã gỡ. Spec01/10 giữ hợp đồng baseline ngoài các quy tắc được thay.
- People selector giữ metadata positive own-tree node/choice writer; condition hiện tại không ẩn lịch sử. Save David cũ thiếu khóa answer3 không được đoán lời khai.
- Notebook timeline chỉ events đã đặt đúng; board dùng game-core cho timeline/contradiction/accusation. Quan hệ chỉ nguồn authored đã khám phá, có danh sách chữ; không free drag/link.
- Vocabulary context dialogue:tree:node:text và evidence gốc; Settings sở hữu mode. Chỉ selected detail mount annotations; reveal reset khi đổi từ/mode, không tự đánh dấu mastery.
- J/B loại trừ hai modal; Esc/popover và native Tab/Shift+Tab, trap/restore focus, summary trong focusables. Correct accusation đóng cả hai; một canvas; một paper cue cho atomic switch.
- Art lấy sprite/evidence repo, crop portrait4/5 và top-60% đã alpha-bound test cả ba đầu; fallback chỉ hiện nếu thiếu/lỗi ảnh. Không bịa metadata/IPA/audio/personal notes theo ảnh.
- Node22.23.3/npm10.9.9 riêng tại .superpowers/runtime/node-v22.23.3-win-x64; đặt Path trước và NX_DAEMON=false. Dùng node .../node_modules/npm/bin/npx-cli.js nx khi wrapper npx.cmd không hoạt động; không đổi Node hệ thống.
- Giữ apps/game-web/debug.log untracked; git add đường dẫn cụ thể. Skill Bash helpers thiếu basename/dirname dùng Python/PowerShell tương đương; mọi ruling/cost trong report.
- Case #002 (PR-03): content-first, sửa engine chỉ khi vỡ (ngoài `difficulty`, `startSceneId`, bộ chọn case không khoá); art tái dùng, ảnh evidence sinh bằng code. Không tự push/merge; approval push cũ không áp dụng.

## Blockers

- Không có blocker kỹ thuật. Môi trường E2E hiện là Chromium Linux trong sandbox, không phải Windows.

## Next Actions

1. Người dùng duyệt plan Case #002 và chọn cách thực thi; xác nhận quyết định âm thanh.
2. Thực thi Task 1→9 (`docs/superpowers/plans/2026-10-02-case-002.md`), ghi mọi thay đổi engine vào báo cáo trước khi commit.
3. Task 9: DoD đầy đủ, một review độc lập, cập nhật `PR-03` ở product doc và memory.
4. PR-02: tạm dừng polish notebook/board; PR-04 chỉ sau khi có báo cáo PR-03.

## Verification

- Gói 02/10 (`d357cbf`): lint 7 project, test (game-web 547, content 188), build, typecheck, prettier, memory:check PASS; nhóm E2E 61 passed (21,1 phút). Chi tiết: report 2026-10-02-investigation-pagination.
- Task6 partial: deduction/conclusion unit subset28/28 pass; `npm run typecheck` exit0; `investigation-pagination.spec.ts`2/2 pass, gồm ghép fact qua đổi mặt và no-scroll. Timeline browser regression và full acceptance chưa chạy.
- Task5: reading/session unit66/66 pass; typecheck exit0; notebook browser regression tại760×600 pass. Task8 sẽ xác nhận mọi 5 viewport.
- Page-flip gate: package2.0.7 MIT, nhưng Chromium probe còn12 RAF sau destroy/200ms; loại dependency và dùng SVG/CSS fallback.
- Các verification nền trước đó vẫn ghi bên dưới để tham chiếu; không hàm ý lượt triển khai hiện tại đã chạy toàn bộ lint/test/build.
- Node22: npm run format/lint/test/build/typecheck/memory:check exit0. Frontend536/83file chạy mới, content187/16file đã kiểm chứng và cache ở lượt cuối; npm test thành công7projects. Build CSS34.20kB/gzip7.12, JS1964.44kB/gzip478.89; advisory>500kB và NO_COLOR/FORCE_COLOR có sẵn. Không apps/api change nên không dotnet.
- Nhóm8file E2E cuối38/38(11.0m), một worker: notebook-deduction/notebook-people/timeline/journey/viewport-focus/learning/settings/dialogue. Thêm native keyboard pair/submit sai→đúng trong timeline test, rerun1/1(45.2s), giữ engine/save/reload assertions.
- Bốn tab + board tại1280×720,760×600,390×844:15ảnh đã xem, no horizontal overflow, target44×44, focus/trap/restore, source relations và word reveal. Alpha-bound portrait1/1, fallback2/2, scroll coordinates2/2.
- Một final reviewer gpt-6-astra: không Critical/Important mới về logic/leak/legacy. Close36.30×44 được re-grade Important theo spec và sửa RED→GREEN44×44. Không Minor mới deferred, không re-review. Self-QA sửa hover contrast, summary focus và artwork/scroll bằng RED→GREEN.
- Chỉ Chromium Windows và nhóm liên quan; không tuyên bố full E2E toàn repo. Không đổi art asset thành portrait mới; sprite độ phân giải thấp giữ theo spec.

## Latest Handoff

- Case #002: dùng lại Anna/David/Leo, sự thật Leo đổi nhãn 14→41 Bridge Street; 3 scene (`main_office`, `mail_room`, `reception`), 6 evidence text, 2 contradiction, không listening, không audio. Bảng định danh nằm đầu plan. Onboarding: state máy title ở `game/GameCanvas.tsx` (`title/titleModel.ts`); Task 7 thêm stage `cases`. Mount Windows có CRLF còn HEAD là LF: `sed -i 's/$//'` trước `git add`.

## Required Reading

1. AGENTS.md và apps/game-web/AGENTS.md.
2. docs/ai/README.md, docs/ai/MEMORY.md và reconcile Git.
3. docs/superpowers/specs/2026-10-02-investigation-no-scroll-design.md và spec baseline01/10.
4. docs/superpowers/plans/2026-10-02-investigation-no-scroll.md; plan01/10/report01/10 chỉ là baseline đã hoàn tất.
5. docs/architecture/ARCHITECTURE.md và docs/art/06_PHASER_CHARACTER_SCENE_ASSET_MODEL_SPEC.md; product/learning/case docs theo root AGENTS.
