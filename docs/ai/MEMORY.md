---
schema_version: 1
updated_at: 2026-10-02T08:08:13+07:00
phase: phase-11e
status: in_progress
result_commit: ad5e89b3898956d68864c66445c50e213be85a35
active_spec: docs/superpowers/specs/2026-10-02-investigation-no-scroll-design.md
active_plan: none
---

## Metadata

- Repo D:/Works/the-lexicon-files-game, branch dev, npm + Nx; implementation Native inline theo lựa chọn đã duyệt.
- Gói hiện tại: notebook UI và bảng suy luận riêng, cùng logic điều tra hiện có. Người dùng đã duyệt spec và plan trực tiếp.

## Current Phase

- Gói UI notebook/deduction trước đã hoàn tất. Đang thiết kế bổ sung trải nghiệm game không cuộn cho cả hai giao diện; chưa sửa code.

## Active Goal

- Yêu cầu mới: sổ tay và bảng suy luận không có scroll; nội dung dài chia trang, hiệu ứng tự nhiên, có thể dùng thư viện phù hợp. Đinh ghim, vòng kim loại ở gáy và góc/khung sổ dùng artwork SVG chân thật theo ảnh, thay mô phỏng CSS/HTML hiện tại. Giữ logic điều tra hiện có và phong cách diegetic.

## Current Status

- Gói trước hoàn thành cả 7 task: sổ tay bốn tab đọc lại (J), bảng suy luận riêng (B), selectors/content labels, modal routing, HUD/audio, keyboard/focus, responsive và regression.
- Code/report/plan/ảnh ở result_commit phía trên; memory commit riêng kế tiếp theo README.md. Gói UI này chưa push.
- Báo cáo đầy đủ file, tests, lệnh/output, RED/GREEN, review, rulings và hạn chế: docs/ai/2026-10-01-notebook-deduction-verification.md. Ảnh và raw output: docs/ai/playtests/2026-10-01-notebook-deduction/.

## Completed

- Phase0A–12 theo acceptance trước; debtclosure bb109fe/a5c1822/e4f5780, nhạc Mystical Piano/cổng đồng đã accepted; báo cáo tương ứng trong docs/ai.
- Viewport cb18871, report docs/ai/2026-10-01-viewport-focus-verification.md; giữ fixed/clip và regression.
- People 5 task: result19d3450, report docs/ai/2026-10-01-notebook-people-verification.md; metadata/legacy/learning và focus đã kiểm chứng.
- Notebook + deduction: 5e28158 → 56c1f73 → 20b6eb9 → fb2f71f → 992acfe → f0eb261 → 8c734b5; plan checkbox hoàn tất và một review độc lập.

## In Progress

- Người dùng nói “duyệt spec” khi chỉ có hướng thiết kế trong chat. Đã chốt hướng và viết spec bổ sung ngày02/10, self-review và commit ad5e89b; bản viết chưa tồn tại trước approval nên cần người dùng xem duyệt file theo brainstorming. Chưa viết plan/cài dependency/sửa code.
- Spec mới thay quy tắc scroll cũ; no-scroll, phân trang theo không gian thực tế, board4mặt, SVG vật thể, khảo sát StPageFlip với gate learning/focus. Gói UI cũ vẫn hoàn tất, report8c734b5 là baseline.

## Active Decisions

- Native inline trên dev; một phase một lần; scope notebook + board riêng dùng engine hiện có. Không tự mở phase nội dung hoặc backend kế tiếp.
- Không đổi case rules/transcript flags/save version; text/ID trong game-content. Spec bổ sung02/10 chờ duyệt, cho khảo sát dependency page-flip sau duyệt plan; chưa cài. Spec01/10 giữ hợp đồng baseline ngoài các quy tắc được thay.
- People selector giữ metadata positive own-tree node/choice writer; condition hiện tại không ẩn lịch sử. Save David cũ thiếu khóa answer3 không được đoán lời khai.
- Notebook timeline chỉ events đã đặt đúng; board dùng game-core cho timeline/contradiction/accusation. Quan hệ chỉ nguồn authored đã khám phá, có danh sách chữ; không free drag/link.
- Vocabulary context dialogue:tree:node:text và evidence gốc; Settings sở hữu mode. Chỉ selected detail mount annotations; reveal reset khi đổi từ/mode, không tự đánh dấu mastery.
- J/B loại trừ hai modal; Esc/popover và native Tab/Shift+Tab, trap/restore focus, summary trong focusables. Correct accusation đóng cả hai; một canvas; một paper cue cho atomic switch.
- Art lấy sprite/evidence repo, crop portrait4/5 và top-60% đã alpha-bound test cả ba đầu; fallback chỉ hiện nếu thiếu/lỗi ảnh. Không bịa metadata/IPA/audio/personal notes theo ảnh.
- Node22.23.3/npm10.9.9 riêng tại .superpowers/runtime/node-v22.23.3-win-x64; đặt Path trước và NX_DAEMON=false. Dùng node .../node_modules/npm/bin/npx-cli.js nx khi wrapper npx.cmd không hoạt động; không đổi Node hệ thống.
- Giữ apps/game-web/debug.log untracked; git add đường dẫn cụ thể. Skill Bash helpers thiếu basename/dirname dùng Python/PowerShell tương đương; mọi ruling/cost trong report.
- Authorization push People cũ chỉ cho b8e7fd8 → e08ea5f; không áp dụng gói UI mới. Không tự push/merge theo approval cũ.

## Blockers

- Không có blocker kỹ thuật. Chưa cài dependency hoặc sửa code trong yêu cầu mới. Commit gói cũ vẫn local.

## Next Actions

1. Người dùng xem duyệt docs/superpowers/specs/2026-10-02-investigation-no-scroll-design.md.
2. Sau duyệt spec: dùng writing-plans tạo plan tiếng Việt, giữ Native inline dev. Chưa có active plan cho yêu cầu mới.
3. Sau duyệt plan: triển khai phân trang/SVG/effect adapter và regression, cập nhật memory. Không dùng authorization push People cũ.

## Verification

- Spec mới: self-review scope/consistency/ambiguity và placeholder; git diff --check pass. memory:check PASS sau cập nhật. Không có code change nên không chạy lại lint/test/build; các kết quả dưới thuộc baseline cũ.
- Node22: npm run format/lint/test/build/typecheck/memory:check exit0. Frontend536/83file chạy mới, content187/16file đã kiểm chứng và cache ở lượt cuối; npm test thành công7projects. Build CSS34.20kB/gzip7.12, JS1964.44kB/gzip478.89; advisory>500kB và NO_COLOR/FORCE_COLOR có sẵn. Không apps/api change nên không dotnet.
- Nhóm8file E2E cuối38/38(11.0m), một worker: notebook-deduction/notebook-people/timeline/journey/viewport-focus/learning/settings/dialogue. Thêm native keyboard pair/submit sai→đúng trong timeline test, rerun1/1(45.2s), giữ engine/save/reload assertions.
- Bốn tab + board tại1280×720,760×600,390×844:15ảnh đã xem, no horizontal overflow, target44×44, focus/trap/restore, source relations và word reveal. Alpha-bound portrait1/1, fallback2/2, scroll coordinates2/2.
- Một final reviewer gpt-6-astra: không Critical/Important mới về logic/leak/legacy. Close36.30×44 được re-grade Important theo spec và sửa RED→GREEN44×44. Không Minor mới deferred, không re-review. Self-QA sửa hover contrast, summary focus và artwork/scroll bằng RED→GREEN.
- Chỉ Chromium Windows và nhóm liên quan; không tuyên bố full E2E toàn repo. Không đổi art asset thành portrait mới; sprite độ phân giải thấp giữ theo spec.

## Latest Handoff

- Resultad5e89b là spec bổ sung, chưa triển khai. Memory commit riêng kế tiếp; không push. Gói UI trước result8c734b5 đã verified.
- Đã yêu cầu xem bản spec viết mới; đừng coi approval hướng chat là duyệt file chưa tồn tại. Không làm lại các task plan01/10 đã hoàn tất. debug.log vẫn untracked.

## Required Reading

1. AGENTS.md và apps/game-web/AGENTS.md.
2. docs/ai/README.md, docs/ai/MEMORY.md và reconcile Git.
3. docs/superpowers/specs/2026-10-02-investigation-no-scroll-design.md và spec baseline01/10.
4. docs/superpowers/plans/2026-10-01-notebook-deduction-ui.md và docs/ai/2026-10-01-notebook-deduction-verification.md.
5. docs/architecture/ARCHITECTURE.md và docs/art/06_PHASER_CHARACTER_SCENE_ASSET_MODEL_SPEC.md; product/learning/case docs theo root AGENTS.
