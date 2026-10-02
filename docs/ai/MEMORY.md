---
schema_version: 1
updated_at: 2026-10-03T09:30:00+07:00
phase: ui-shell
status: awaiting-approval
result_commit: 3896c87
active_spec: docs/superpowers/specs/2026-10-02-ui-shell-design.md
active_plan: docs/superpowers/plans/2026-10-02-ui-shell.md
---

## Metadata

- Repo D:/Works/the-lexicon-files-game, branch dev, npm + Nx; implementation Native inline theo lựa chọn đã duyệt.
- Gói mới: investigation no-scroll + SVG artwork. Người dùng đã duyệt spec và plan ngày02/10, chọn làm cả sổ tay và bảng suy luận theo logic hiện có; triển khai Native inline trên dev.

## Current Phase

- UI shell (PR-02 phần 3: vỏ ngoài game): Task 0–7 xong trên `dev`, chưa push. Chờ người dùng duyệt ảnh trước/sau (`docs/ai/playtests/2026-10-02-ui-shell/`) rồi mới đánh dấu hoàn tất. Phần 1+2 (foundation + HUD) và PR-03 Case #002 đã xong và đã push.

## Active Goal

- Người dùng duyệt ảnh shell; không tự mở phase mới.

## Current Status

- Shell: mặt bàn `DeskBackdrop`, bìa hồ sơ `FolderCover`/`FolderTabs`, `ModalSheet` cho các bước phụ/tạm dừng/briefing/tổng kết; con dấu đỏ duy nhất là CASE CLOSED. Commit cuối `3896c87`; báo cáo `docs/ai/2026-10-02-ui-shell-verification.md`. E2E đầy đủ: 220 pass, 17 đỏ đều thuộc danh sách đỏ có sẵn; sau review có sửa 3 Important và chạy lại 93 test liên quan, xanh. Unit: game-web 694, content 277, core 59, ui 49. FPS 12,8 trước và sau.
- Review độc lập: không Critical; 3 Important đã sửa RED→GREEN (nút thẻ định nghĩa phạm vi, motion-off phủ mọi tilt, bìa không bị cắt ở 844×390). Minor chưa sửa (ledger): `aria-modal` trong SupportPicker, `ModalSheet` thiếu tên khi không có heading, `NewCaseConfirm` thiếu `aria-describedby` và Stamp trung tính, thiếu fallback forced-colors cho tab/thẻ, `aria-labelledby` section đầu của tổng kết.

## Completed

- Phase0A–12 theo acceptance trước; debtclosure bb109fe/a5c1822/e4f5780, nhạc Mystical Piano/cổng đồng đã accepted; báo cáo tương ứng trong docs/ai.
- Viewport cb18871, report docs/ai/2026-10-01-viewport-focus-verification.md; giữ fixed/clip và regression.
- People 5 task: result19d3450, report docs/ai/2026-10-01-notebook-people-verification.md; metadata/legacy/learning và focus đã kiểm chứng.
- Notebook + deduction: 5e28158 → 56c1f73 → 20b6eb9 → fb2f71f → 992acfe → f0eb261 → 8c734b5; plan checkbox hoàn tất và một review độc lập.

## In Progress

- Không có việc dở kỹ thuật. Nợ: 17 E2E đỏ có sẵn (danh sách trong báo cáo verification), 1 pytest đỏ có sẵn (`test_chair_directions`), minor review đã ghi ledger (aria-label phím compact, validator cổng chỉ kiểm tâm, v.v.).

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

1. Chờ người dùng duyệt ảnh shell; sau đó mới đánh dấu phase hoàn tất. Chưa push `dev`.
2. Phần 4–5 UI (hội thoại, bằng chứng, sổ tay) chỉ khi người dùng yêu cầu; PR-04 sau khi duyệt PR-03.
3. Nợ: 17 E2E đỏ có sẵn, 1 pytest đỏ có sẵn, minor shell ở trên.
