---
schema_version: 1
updated_at: 2026-10-02T09:04:42+07:00
phase: phase-11e
status: in_progress
result_commit: 13ea769
active_spec: docs/superpowers/specs/2026-10-02-investigation-no-scroll-design.md
active_plan: docs/superpowers/plans/2026-10-02-investigation-no-scroll.md
---

## Metadata

- Repo D:/Works/the-lexicon-files-game, branch dev, npm + Nx; implementation Native inline theo lựa chọn đã duyệt.
- Gói mới: investigation no-scroll + SVG artwork. Người dùng đã duyệt spec và plan ngày02/10, chọn làm cả sổ tay và bảng suy luận theo logic hiện có; triển khai Native inline trên dev.

## Current Phase

- Đang triển khai cải tiến UI notebook và bảng suy luận không cuộn, chia trang và có hiệu ứng lật giấy.

## Active Goal

- Yêu cầu mới: sổ tay và bảng suy luận không có scroll; nội dung dài chia trang, hiệu ứng tự nhiên, có thể dùng thư viện phù hợp. Đinh ghim, vòng kim loại ở gáy và góc/khung sổ dùng artwork SVG chân thật theo ảnh, thay mô phỏng CSS/HTML hiện tại. Giữ logic điều tra hiện có và phong cách diegetic.

## Current Status

- Spec và plan02/10 đã được duyệt. Task1–5 hoàn tất; Task6 có phần triển khai được commit nhưng còn kiểm thử browser cũ và acceptance; Task7–8 chưa làm.
- Result commit code gần nhất13ea769. Baseline UI cũ result8c734b5 vẫn hoàn tất và verified; không làm lại plan01/10.
- Report baseline: docs/ai/2026-10-01-notebook-deduction-verification.md; ảnh/raw output trong docs/ai/playtests/2026-10-01-notebook-deduction/. Gói mới chưa triển khai/push.

## Completed

- Phase0A–12 theo acceptance trước; debtclosure bb109fe/a5c1822/e4f5780, nhạc Mystical Piano/cổng đồng đã accepted; báo cáo tương ứng trong docs/ai.
- Viewport cb18871, report docs/ai/2026-10-01-viewport-focus-verification.md; giữ fixed/clip và regression.
- People 5 task: result19d3450, report docs/ai/2026-10-01-notebook-people-verification.md; metadata/legacy/learning và focus đã kiểm chứng.
- Notebook + deduction: 5e28158 → 56c1f73 → 20b6eb9 → fb2f71f → 992acfe → f0eb261 → 8c734b5; plan checkbox hoàn tất và một review độc lập.

## In Progress

- Plan8task: contracts/text fragments → measured pagination → SVG artwork → page-turn adapter/library gate → notebook → board4faces → popover/focus/audio → browser acceptance/review/handoff. Task1–5 xong; Task6 đang dở; Task7–8 còn lại.
- Scope theo spec02/10:5viewport, nội dung dài không mất, giữ UI selections, learning chỉ visible pages, engine/discovery/save giữ nguyên.

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
- Authorization push People cũ chỉ cho b8e7fd8 → e08ea5f; không áp dụng gói UI mới. Không tự push/merge theo approval cũ.

## Blockers

- Không có blocker kỹ thuật. Task6 chưa có regression run cho timeline.spec; board browser acceptance rộng và Task7–8 còn pending. Chưa push gói UI này.

## Next Actions

1. Hoàn thiện Task6: chạy/sửa `timeline.spec.ts` browser regression, bảo toàn assertion engine.
2. Thực hiện Task7: popover, focus/input/audio và tích hợp điều khiển trang.
3. Thực hiện Task8: 5 viewport, fixture dài, luồng đầy đủ, kiểm tra/review cuối và handoff.
4. Cập nhật plan/verification/memory với kết quả thực tế; gói UI này chưa được cho phép push.

## Verification

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

- Commit code mới nhất13ea769 chứa phần Task6 hiện có. Tiếp tục Task6 từ timeline browser regression; sau đó Task7 và Task8. Plan đã duyệt, không hỏi lại approval hay cách thực thi.
- `apps/game-web/debug.log` vẫn untracked, giữ nguyên và không đưa vào commit. Không push theo authorization cũ dành cho People.

## Required Reading

1. AGENTS.md và apps/game-web/AGENTS.md.
2. docs/ai/README.md, docs/ai/MEMORY.md và reconcile Git.
3. docs/superpowers/specs/2026-10-02-investigation-no-scroll-design.md và spec baseline01/10.
4. docs/superpowers/plans/2026-10-02-investigation-no-scroll.md; plan01/10/report01/10 chỉ là baseline đã hoàn tất.
5. docs/architecture/ARCHITECTURE.md và docs/art/06_PHASER_CHARACTER_SCENE_ASSET_MODEL_SPEC.md; product/learning/case docs theo root AGENTS.
