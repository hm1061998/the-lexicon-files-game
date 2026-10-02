# Kiểm chứng sổ tay và bảng suy luận riêng

Ngày kiểm tra: 02/10/2026 (Asia/Saigon). Plan/spec mang ngày 01/10 theo lúc được duyệt.

## Phạm vi và kết quả

Triển khai inline trên `dev` theo plan người dùng đã duyệt. Sổ tay chỉ có Nhân vật/Chứng cứ/Từ vựng/Dòng thời gian; danh sách trái, chi tiết được chọn bên phải, nền giấy và gáy vòng. Bảng suy luận riêng có hồ sơ/mục tiêu, thẻ nguồn, dây quan hệ authored, xếp thời gian, chọn hai dữ kiện, mâu thuẫn và kết luận dùng reducer hiện có. J/B chuyển hai modal nguyên tử, Esc đóng lớp hiện tại, native Tab giữ focus và trả về canvas. Đã hoàn thành 7 task; frontend 536 test/83 file, content 187 test/16 file; nhóm 8 file E2E 38/38 (11 phút), lint/build/typecheck pass.

Không sửa backend, case rules, flags transcript, save version, engine hoặc dependency. Không bịa tuổi/quốc tịch/IPA/audio/personal notes hay quan hệ/tội phạm từ ảnh. Ảnh tham chiếu dùng để định hướng bố cục; nhân vật/chứng cứ dùng tài sản sẵn trong repo.

## File và commit

- `5e28158`: labels UiStrings, Zod schema, vi.json và validation tests.
- `56c1f73`: selectors điều tra, artwork resolver, vocabulary source resolver và tests.
- `20b6eb9`: modal routing store, B/Esc, shared focus lifecycle và tests.
- `fb2f71f`: notebook frame, bốn reading pages, single selected detail, artwork/statements và browser fixture.
- `992acfe`: DeductionBoard, timeline/contradiction workspaces, SVG connections, layout và render tests.
- `f0eb261`: GameCanvas layer, HUD B, paper cue và integration tests.
- Task7: nhóm E2E đổi sang B cho suy luận; giữ save/progress/legacy, snapshot ba viewport, formatter, sửa hover/focus/scroll/portrait và report này.

## Test thêm và RED/GREEN

- Labels bắt buộc: RED thiếu labels → GREEN12/12.
- Selector disclosure/provenance/legacy: RED module chưa có → GREEN5/5.
- Modal guard/atomic transition/B/input/modifier/Esc: RED action chưa có → GREEN58/58.
- Notebook: RED5fail/21pass → GREEN26/26; browser RED width460 → GREEN1/1.
- Board: RED module chưa có → GREEN11/11; browser RED chưa mount layer.
- HUD/audio/store: RED thiếu B/cue → GREEN43/43; integration browser2/2.
- Scroll cable coordinates: RED1fail/1pass → GREEN2/2 (bù scrollTop/Left).
- Visual/focus browser: RED hover background205/186/151, summary Tab unreachable, close width36.296875 → GREEN7/7 tại ba viewport. Đo44 × 44, màu tab đúng116/48/38, no horizontal overflow, native focus, atomic transitions, word reveal và popover Esc.
- Artwork: RED fallback lộ chữ dưới ảnh trong suốt → GREEN2/2; portrait ratio RED height130 trước sửa4/5. Alpha-bound browser RED đầu David vượt khung → GREEN1/1 sau điều chỉnh crop-60%; lượt cả nhóm cuối38/38 đã xác nhận cùng screenshot mới.

Lượt nhóm browser đầu:27pass/3fail/2skip. Duplicate `Meeting Minutes` ở list/detail và selector vocabulary cũ đã sửa bằng role/scope đúng. Journey bị HMR do formatter chạy cùng lúc, canvas đang detach/recreate; lượt cuối giữ source ổn định và chạy lại cả nhóm. Một lần fixture mới thiếu tham số withVocabulary và regex -g chứa dấu pipe lỗi qua npm shell; đã sửa trước RED chính thức, không tính là bằng chứng RED sản phẩm.

Lượt cả nhóm tiếp theo:35pass/2fail. Hai test focus chọn David nhưng content không có vocabularySpans trong lời khai David; trả về Anna (có spans authored), giữ assertion phải mở popover bằng keyboard. Không sửa production để bịa annotation.

## Review độc lập

Một reviewer độc lập (gpt-6-astra) đọc toàn gói từ base1ce13cc và working diff. Không Critical/Important mới về logic, leak, original contexts, save legacy hay canvas lifecycle. Minor: Close chỉ36.30 × 44. Tác giả re-grade Important vì vi phạm yêu cầu44 × 44 ở spec§3; sửa một pass với browser RED→GREEN. Không re-review; không Minor mới deferred. Reviewer không chạy browser runner chung, nên kết quả browser do tác giả xác nhận.

## Rulings và chi phí nếu sai

1. Dùng Python/PowerShell briefs/ledger thay Bash helpers thiếu basename/dirname; giữ protocol. Chi phí nếu sai: bookkeeping tiến độ.
2. Giữ thứ tự evidence authored (Phone Recording trước Meeting Minutes), sửa test oracle. Chi phí nếu sai: kỳ vọng mục ban đầu.
3. Escape apostrophe authored trong assertion HTML như React. Chi phí nếu sai: oracle văn bản, không đổi nội dung.
4. Re-grade nút đóng44 × 44 thành Important để đáp ứng spec accessibility. Chi phí nếu sai: hit target rộng thêm7.7px.

## Visual QA và hạn chế

Ảnh bốn tab + board tại1280×720, 760×600, 390×844 nằm trong `docs/ai/playtests/2026-10-01-notebook-deduction/`. Xem ảnh thực tế, không chỉ snapshot: đã sửa hover contrast, crop mặt và chữ fallback; viewport hẹp xếp dọc và cuộn trong modal. Text quan hệ nguồn đọc được bằng details/summary; SVG không nhận pointer events, không phải graph tự do. Bản ghi timeline không lộ giờ của event chưa xếp.

Chỉ Chromium Windows và nhóm 8 file liên quan; không tuyên bố full E2E toàn repo. Art hiện tại là sprite có độ phân giải thấp; không thay bằng portrait mới từ ảnh mẫu. Build còn advisory chunk>500kB và NO_COLOR/FORCE_COLOR warning có sẵn. Không apps/api change nên không dotnet. Chưa push scope UI này.

## Lệnh và output DoD

Runtime: Node 22.23.3/npm 10.9.9 tại `.superpowers/runtime/node-v22.23.3-win-x64`; đặt Path trước và NX_DAEMON=false. Các test Nx dùng `node .../node_modules/npm/bin/npx-cli.js nx run ...` vì wrapper npx.cmd đã được xác nhận không chạy đúng trong môi trường này. Chỉ npm + Nx, không dependency mới.


### npm run lint (exit0)

```text
(node:26668) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
(Use `node --trace-warnings ...` to show where the warning was created)

> nx run @lexicon/game-web:lint

(node:24352) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
(Use `node --trace-warnings ...` to show where the warning was created)
(node:18016) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
(Use `node --trace-warnings ...` to show where the warning was created)

> @lexicon/game-web@0.0.0 lint
> eslint src

(node:27772) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
(Use `node --trace-warnings ...` to show where the warning was created)



 NX   Successfully ran target lint for 7 projects

Nx read the output from the cache instead of running the command for 6 out of 7 tasks.

```

### npm run test (exit0)

```text
 ✓ src/investigation/InvestigationArtwork.test.tsx (2 tests) 32ms
 ✓ src/hud/initialHudVisibility.test.ts (3 tests) 7ms
 ✓ src/vocabulary/TranslationModeControl.test.tsx (1 test) 33ms
 ✓ src/game/systems/gameInputGate.test.ts (2 tests) 5ms
 ✓ src/game/systems/facingToward.test.ts (6 tests) 6ms
 ✓ src/game/sceneFade.test.ts (1 test) 5ms
 ✓ src/game/systems/markerMotion.test.ts (4 tests) 4ms
(node:9708) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
(Use `node --trace-warnings ...` to show where the warning was created)

 Test Files  83 passed (83)
      Tests  536 passed (536)
   Start at  06:53:57
   Duration  16.64s (transform 19.31s, setup 0ms, collect 58.24s, tests 26.41s, environment 55ms, prepare 27.35s)




 NX   Successfully ran target test for 7 projects

Nx read the output from the cache instead of running the command for 6 out of 7 tasks.

```

### npm run build (exit0)

```text
(node:17328) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
(Use `node --trace-warnings ...` to show where the warning was created)
vite v5.4.21 building for production...
transforming...
✓ 226 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                     0.40 kB │ gzip:   0.27 kB

(!) Some chunks are larger than 500 kB after minification. Consider:
- Using dynamic import() to code-split the application
- Use build.rollupOptions.output.manualChunks to improve chunking: https://rollupjs.org/configuration-options/#output-manualchunks
- Adjust chunk size limit for this warning via build.chunkSizeWarningLimit.
dist/assets/index-C5xdYk6i.css     34.20 kB │ gzip:   7.12 kB
dist/assets/index-DwSeKfci.js   1,964.44 kB │ gzip: 478.89 kB
✓ built in 13.94s



 NX   Successfully ran target build for project @lexicon/game-web


```

### npm run typecheck (exit0)

```text

> the-lexicon-files@0.0.0 typecheck
> tsc -b

```

### Browser cuối (exit0)

```text
(Use `node --trace-warnings ...` to show where the warning was created)
  ok  1 e2e\dialogue.spec.ts:116:1 › three interviews complete the objective and survive reload with one canvas (27.2s)
  ok  2 e2e\dialogue.spec.ts:155:3 › David conditional branch with contradiction flag undefined (7.0s)
  ok  3 e2e\dialogue.spec.ts:155:3 › David conditional branch with contradiction flag false (6.8s)
  ok  4 e2e\dialogue.spec.ts:155:3 › David conditional branch with contradiction flag true (8.5s)
  ok  5 e2e\dialogue.spec.ts:202:1 › legacy Phase 4 save migrates without losing evidence or objective progress (4.4s)
  ok  6 e2e\dialogue.spec.ts:229:1 › dialogue traps focus, blocks gameplay, restores focus and fits desktop viewports (7.6s)
  ok  7 e2e\dialogue.spec.ts:275:1 › closing an unread branch and reloading does not complete an interview (5.7s)
  ok  8 e2e\dialogue.spec.ts:287:1 › physical double clicks cannot skip responses or select the next question (11.6s)
  ok  9 e2e\journey.spec.ts:24:3 › Case #001 journey › start case (1.5s)
  ok 10 e2e\journey.spec.ts:30:3 › Case #001 journey › collect evidence (1.5s)
  ok 11 e2e\journey.spec.ts:45:3 › Case #001 journey › find security log (4.1s)
  ok 12 e2e\journey.spec.ts:75:3 › Case #001 journey › talk to NPC (2.6s)
  ok 13 e2e\journey.spec.ts:86:3 › Case #001 journey › find contradiction (12.2s)
  ok 14 e2e\journey.spec.ts:127:3 › Case #001 journey › accuse David (10.4s)
  ok 15 e2e\journey.spec.ts:160:3 › Case #001 journey › complete case (2.3s)
  ok 16 e2e\journey.spec.ts:171:3 › Case #001 journey › reload preserves the save (1.9s)
  ok 17 e2e\learning.spec.ts:75:1 › visible dialogue records only annotated contexts and persists mode/progress (23.3s)
  ok 18 e2e\learning.spec.ts:138:1 › confirmed learning reset preserves case evidence and keeps one canvas (6.9s)
  ok 19 e2e\notebook-deduction.spec.ts:6:1 › notebook selects one dossier and one evidence without changing case progress (8.5s)
  ok 20 e2e\notebook-deduction.spec.ts:37:1 › board is separate and supports atomic switching with native keyboard focus (5.8s)
  ok 21 e2e\notebook-deduction.spec.ts:77:3 › notebook and board fit with keyboard traversal 1280 (39.1s)
  ok 22 e2e\notebook-deduction.spec.ts:77:3 › notebook and board fit with keyboard traversal 760 (38.3s)
  ok 23 e2e\notebook-deduction.spec.ts:77:3 › notebook and board fit with keyboard traversal 390 (38.4s)
  ok 24 e2e\notebook-deduction.spec.ts:165:1 › notebook reveal is scoped to the chosen word and board popover Escape stays on board (8.8s)
  ok 25 e2e\notebook-deduction.spec.ts:200:1 › source relations remain reachable in native Tab order with no discovered facts (4.7s)
  ok 26 e2e\notebook-deduction.spec.ts:216:1 › portrait artwork keeps every character head inside its frame (4.8s)
  ok 27 e2e\notebook-people.spec.ts:135:1 › records partial interview and survives reload (20.6s)
  ok 28 e2e\notebook-people.spec.ts:173:1 › keeps branch history and legacy progress (15.8s)
  ok 29 e2e\notebook-people.spec.ts:240:1 › reuses vocabulary context without encounter inflation (27.8s)
  ok 30 e2e\notebook-people.spec.ts:340:3 › keeps focus and four tabs visible 1280 (55.3s)
  ok 31 e2e\notebook-people.spec.ts:340:3 › keeps focus and four tabs visible 760 (54.3s)
  ok 32 e2e\settings.spec.ts:85:1 › settings and progress survive reload (15.7s)
  ok 33 e2e\settings.spec.ts:171:1 › legacy learning V1 translation mode is preserved (2.8s)
  ok 34 e2e\settings.spec.ts:213:1 › corrupt settings recover to defaults (3.4s)
  ok 35 e2e\timeline.spec.ts:5:1 › Archive, timeline, contradiction, conclusion and case report survive reload (45.3s)
  ok 36 e2e\viewport-focus.spec.ts:41:3 › keyboard vocabulary then notebook keeps viewport stable 760 (29.2s)
  ok 37 e2e\viewport-focus.spec.ts:41:3 › keyboard vocabulary then notebook keeps viewport stable 1280 (28.9s)
  ok 38 e2e\viewport-focus.spec.ts:91:1 › compact evidence scrolls internally and returns to a visible close control (1.1m)
  38 passed (11.0m)



 NX   Successfully ran target test:e2e for project @lexicon/game-web


```

Output đầy đủ: [lint](playtests/2026-10-01-notebook-deduction/output/lint.txt), [unit](playtests/2026-10-01-notebook-deduction/output/test.txt), [build](playtests/2026-10-01-notebook-deduction/output/build.txt), [typecheck](playtests/2026-10-01-notebook-deduction/output/typecheck.txt), [E2E](playtests/2026-10-01-notebook-deduction/output/e2e.txt).

Visual QA cuối: đã mở xem 15 ảnh bốn tab/board ở cả ba viewport, và xem lại các ảnh có portrait sau crop fix. Nút đóng44 × 44; tab selected giữ đỏ khi hover; text/focus/scroll đọc được; ba đầu nhân vật nằm trong khung theo alpha-bound test. Không Critical/Important hoặc Minor mới deferred còn lại.

### Format và memory

`npm run format` exit0; `npm run memory:check` exit0 trước bàn giao. Memory được commit riêng kế tiếp, trỏ result_commit vào commit code/report này; validator chạy lại sau khi cập nhật.

### Đối chiếu bằng bàn phím

Sau lượt38/38, tăng coverage test timeline bằng focus+Enter cho chọn cặp dữ kiện và submit sai→đúng (chỉ đổi thao tác trong test, không đổi production). Rerun riêng timeline giữ toàn bộ assertions engine/save/reload:1/1 pass(45.2s). Output: [keyboard](playtests/2026-10-01-notebook-deduction/output/keyboard.txt).
