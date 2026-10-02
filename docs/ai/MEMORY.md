---
schema_version: 1
updated_at: 2026-10-02T17:45:00+07:00
phase: case-002
status: in_progress
result_commit: 4ffcd3b
active_spec: docs/superpowers/specs/2026-10-02-case-002-design.md
active_plan: docs/superpowers/plans/2026-10-02-case-002.md
---

## Metadata

- Repo D:/Works/the-lexicon-files-game, branch dev, npm + Nx; implementation Native inline theo lựa chọn đã duyệt.
- Gói mới: investigation no-scroll + SVG artwork. Người dùng đã duyệt spec và plan ngày02/10, chọn làm cả sổ tay và bảng suy luận theo logic hiện có; triển khai Native inline trên dev.

## Current Phase

- PR-03 Case #002 "The Wrong Delivery": triển khai xong Task 1–9, plan hoàn tất; đã push `dev` lên origin (d734b57) theo yêu cầu người dùng. PR-01 (onboarding) còn nợ kiểm chứng, không mở rộng.

## Active Goal

- Người dùng xem báo cáo `docs/ai/2026-10-02-case-002-engine-generality.md` (F-1…F-7, review độc lập) rồi chọn việc tiếp theo (PR-04 chỉ sau khi duyệt PR-03).

## Current Status

- Commit: picker/boot `0981ade`, fix deduction `be59dc1`, E2E `27b7da1`, fix reconcile + docs `4ffcd3b`. Engine phải sửa: F-1/F-2 (từ vựng toàn cục `loadAllVocabulary`), F-4 (`DEFAULT_START`, boot theo case), F-6 (một nút so sánh), F-7 (reconcile trong `submitContradiction`). Case #002 không `audio` (F-3, đã duyệt).

## Completed

- Phase0A–12 theo acceptance trước; debtclosure bb109fe/a5c1822/e4f5780, nhạc Mystical Piano/cổng đồng đã accepted; báo cáo tương ứng trong docs/ai.
- Viewport cb18871, report docs/ai/2026-10-01-viewport-focus-verification.md; giữ fixed/clip và regression.
- People 5 task: result19d3450, report docs/ai/2026-10-01-notebook-people-verification.md; metadata/legacy/learning và focus đã kiểm chứng.
- Notebook + deduction: 5e28158 → 56c1f73 → 20b6eb9 → fb2f71f → 992acfe → f0eb261 → 8c734b5; plan checkbox hoàn tất và một review độc lập.

## In Progress

- Không có việc dở. Nợ có sẵn: `learning.spec.ts` và `notebook-people.spec.ts › reuses vocabulary context` đỏ do từ vựng bản tin (đã xác nhận đỏ ở `5de9eaf`), cùng nhóm `feedback-*` từ trước; chưa chạy full E2E.

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
- Case #002 (PR-03): content-first, sửa engine chỉ khi vỡ; ảnh evidence sinh bằng `tools/art-codegen/build_case002_evidence.py` (cần Pillow). Không tự push/merge. Git lock `.git/index.lock` mồ côi có thể xuất hiện trên mount Windows: kiểm tra không có tiến trình git rồi xóa.

## Blockers

- Không có blocker kỹ thuật. Môi trường E2E hiện là Chromium Linux trong sandbox, không phải Windows.

## Next Actions

1. Người dùng duyệt PR-03 và chọn việc tiếp theo (đã push `dev`).
2. Đề xuất cho PR-04: reconcile objective sau `addEvidence`, namespace context id theo case, audio-codegen theo case, cờ `*_question_done` không phụ thuộc nút Continue.
3. Tùy chọn: sửa nợ E2E (learning/notebook-people) bằng cập nhật kỳ vọng từ vựng bản tin.
4. PR-02 vẫn tạm dừng.

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

- Case #002 dùng lại Anna/Leo/David, sự thật Leo đổi nhãn 14→41 Bridge Street; 3 scene, 6 evidence, 2 contradiction, không listening/audio. Màn chọn case nằm trong `GameCanvas` (`selectedCaseId === null`), `CaseFlow` remount theo case. E2E: `case-002.spec.ts` 13 test + journey/onboarding #001 xanh; helper `chooseCase`, `saved(page, caseId)`. Mount Windows CRLF vs HEAD LF: dùng Python giữ newline khi sửa.

## Required Reading

1. AGENTS.md và apps/game-web/AGENTS.md.
2. docs/ai/README.md, docs/ai/MEMORY.md và reconcile Git.
3. docs/superpowers/specs/2026-10-02-investigation-no-scroll-design.md và spec baseline01/10.
4. docs/superpowers/plans/2026-10-02-investigation-no-scroll.md; plan01/10/report01/10 chỉ là baseline đã hoàn tất.
5. docs/architecture/ARCHITECTURE.md và docs/art/06_PHASER_CHARACTER_SCENE_ASSET_MODEL_SPEC.md; product/learning/case docs theo root AGENTS.
