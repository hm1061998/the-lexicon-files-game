---
schema_version: 1
updated_at: 2026-10-01T15:39:00+07:00
phase: phase-11e
status: complete
result_commit: cb18871
active_spec: docs/ai/2026-10-01-player-playtest-feedback.md
active_plan: none
---

## Metadata

- Phase11E/12 đã được người dùng chấp nhận; nợPhase11 đã đóng. Gói bounded viewport/focus sau playtest được duyệt và đã sửa trong cb18871. Báo cáo docs/ai/2026-10-01-viewport-focus-verification.md.
- Origin/dev ở9cff732; báo cáo playtest0ebdaec, memory497cb85 và fix cb18871 hiện local, chưa push. Không tự push việc mới.

## Current Phase

- Phase11E/12 complete theo acceptance trước. Gói viewport/focus complete; không tự mở phase hoặc cải thiện khác.

## Active Goal

- Không có việc đang chạy; chờ yêu cầu tiếp theo. TabPeople/onboarding chưa được duyệt triển khai.

## Current Status

- Viewport fixed/clip không cuộn theo focus; notebook/evidence border-box và max-height vừa viewport; Settings dài cuộn nội bộ. Notices learning/settings recovery đặt trong viewport, không theo sau canvas trong flow.
- Native Tab/Shift+Tab đưa control vào panel nhìn thấy, Enter đóng evidence; không dùng preventScroll hàng loạt hoặc reset scroll bằng timer.
- Playtest hai persona AI bản9cff732: chuột1/5evidence, ba nhánhAnna; keyboard0/5 và lỗi cuộn86px. Đây không phải dữ liệu người dùng thật, chưa đánh giá fullcase/portal/audio. Lỗi viewport đã sửa riêng; People vẫn render empty vô điều kiện, cần thiết kế mapping dữ kiện đã khám phá.

## Completed

- Phase0A–12 theo mức người dùng chốt. Debtclosure bb109fe/a5c1822/e4f5780; acceptance cổng đồng/nhạc Mystical Piano. Báo cáo docs/ai/2026-10-01-phase-11-debt-closure-verification.md và các báo cáoPhase12.
- Playtest report/ảnh: docs/ai/2026-10-01-player-playtest-feedback.md và docs/ai/playtests/2026-10-01/.
- Viewport fix cb18871:4CSS, browser regression và báo cáo. REDroot86, notebookbottom748>720, evidencetop−8; GREEN các trường hợp này. Review độc lập không Critical/Important source, Important oracle evidence đã tăng native keyboard traversal và đạt GREEN.

## In Progress

- Không có.

## Active Decisions

- Native inline trên dev; npm + Nx; không dependency/backend mới, không tự push hoặc mở gói People/onboarding.
- Nhạc mystical-piano-loop.ogg và cổng đồng/ánh vàng nhẹ đã accepted. Click xa đi tới, click lại tương tác; chuột/phím song song. Translation selector chỉ Settings.
- Node22 verification dùng .superpowers/runtime/node-v22.23.3-win-x64 prepend PATH, npm10.9.9, NX_DAEMON=false. OfficialZIP đã kiểmSHA256; không dùng npm-shim cũ hardcodeNode24, không đổi Node hệ thống.
- Giữ hai debug.log untracked; git add đường dẫn cụ thể. Git cần -c safe.directory=F:/work/the-lexicon-files-game.
- Resize lệch18px trước đây không tái hiện; regression camera ổn định1.5s, chưa chứng minh mọi timing đang resize/follow.
- Viewport/focus verification Chromium Windows. File regression mới budget90s cho chuỗi đa-panel dài47.8s; assertion scroll0/focus trong panel không nới. Không chạy lại full E2E toàn repo trong gói này.
- Các MinorPhase12 ngoài phạm vi giữ theo docs/superpowers/specs/2026-10-01-phase-12-verification.md; bundle advisory>500kB giữ nguyên.

## Blockers

- Không có trong gói viewport/focus đã duyệt.

## Next Actions

1. Khi người dùng yêu cầu: thiết kế tabPeople từ NPC/lời khai/dữ kiện đã khám phá trước triển khai.
2. Các đề xuất còn lại: cue mục tiêu/hướng dẫn chuột, feedback click bị chặn, copy toggleminimap; chưa tự triển khai. Chơi lại tiếp cận bàn compact sau fix trước kết luận collider/pathfinding lỗi.
3. Chỉ push khi người dùng yêu cầu; báo cáo phân tích phải được xác nhận trước push theo protocol.

## Verification

- Node22: npm run lint/test/build/typecheck/format pass; Nx lint/test7projects (6cache, frontend chạy), frontend499/76files; các package không đổi dùng cache. Build25.39kBCSS/1946.25kBJS, gzip5.41/474.44. Không backend nên không dotnet.
- Nhóm E2E rộng36/38(5.6m) trước chỉnh recovery và oracle; journey đến caseclosed/reload, navigation/cổng/dialogue/viewport pass. Hai failure đã xử lý; chạy lại toàn bộ nhóm ảnh hưởng viewport-focus/learning/settings8/8(2.4m) trên source cuối. Không cộng hai lượt thành fullsuite.
- Recovery notice ngoài viewport được CSS đưa vào viewport; native focus evidence360px/Settings240px đạt. Test thứ nhất chạm budget30s trước đây, sau90s đạt với assertion nguyên trạng. Format/memory/diff check trước commit handoff.

## Latest Handoff

- Result cb18871 đã commit trước memory. Báo cáo đầy đủ output/limitations/review: docs/ai/2026-10-01-viewport-focus-verification.md. Scratch logs .superpowers/verification/viewport-focus/ ignored; không push.

## Required Reading

- AGENTS.md, apps/game-web/AGENTS.md, docs/ai/README.md, report playtest và viewport verification ở trên; docs01–03/art06/ARCHITECTURE nếu mở cải thiện khác. Navspec và debtclosure/Phase12 report để giữ quyết định đã chốt.
