# Phase 11E — checkpoint redesign static world (2026-09-30)

## Checkpoint ban đầu

Người dùng duyệt plan và chọn Native. Người dùng yêu cầu lưu memory, push `dev` và tiếp tục sau. Đây là checkpoint `in_progress`, chưa phải kết quả hoàn tất hoặc nghiệm thu hình ảnh.

- Tasks 1–5 đã thực thi: baseline/repro; schema footprint/wall segments; expansion/geometry gate; runtime/minimap; art module và 15 sprite nội thất/bảng dimetric 30°.
- Tasks 6–7 đang thực hiện: Office/Archive đã migrate JSON, giữ ID gameplay, sàn/module/cửa mới và footprint; E2E traversal đã mở lại. Chưa hoàn thành toàn bộ hồi quy sau chỉnh sửa cuối.
- Task 8 mới lưu handoff. Hợp đồng art06/architecture, cleanup, final review, phase gates và duyệt screenshot còn thiếu.
- Tasks 3–6 của plan cha `controls-visual-ux` vẫn chờ. Không bắt đầu phase khác.

## Bằng chứng đã chạy

```text
node node_modules/vitest/vitest.mjs run
Test Files  87 passed (87)
Tests       678 passed (678)
Duration    15.10s

node node_modules/typescript/bin/tsc -b
exit 0

.venv-art-codegen/Scripts/python.exe -m unittest discover -s tools/art-codegen -p test_world_modules.py
Ran 6 tests in 1.685s
OK
```

- Full Python trước khi thêm hai bảng: 41/41; sau thêm bảng chỉ chạy nhóm module 6/6. Cần chạy lại full.
- Scene-layout từng đạt 18/20: Office → Archive bằng WASD đạt; hai lỗi còn lại là proximity dùng elevation và race khi đợi runtime mới. Đã sửa, chưa có toàn bộ lượt xanh cuối cùng.
- World/HUD/layout lượt gần nhất hoàn tất: 65/76, còn fixture tọa độ cũ, key bar expectation cũ và HMR. Đã cập nhật fixture, cần chạy lại.
- Lượt full E2E 96 test bị dừng theo yêu cầu người dùng. Có 7 lỗi dialogue do fixture dùng x/y không còn tồn tại trong JSON logic. Helper và các fixture dialogue/learning/listening/settings/timeline đã đổi sang điểm sàn lấy từ content; chưa chạy lại hoàn tất.
- `eslint .`: 377 lỗi, phần lớn do quét cả skill/runtime ngoài phạm vi task. Scoped lint chỉ còn unused fixture và đã sửa; kết quả rerun ở checkpoint ghi trong memory.
- `npm`/`npx` vắng trong PATH. Không tuyên bố pass npm/Nx entrypoint. Build và toàn bộ phase gates cuối chưa chạy. Backend không đổi.

## Quyết định khi thực hiện

1. Dùng checkout `dev` hiện tại và runner Node trực tiếp; không tạo worktree mới.
2. Tường dày vào trong phòng từ line để line=0 không tạo collider ngoài bounds.
3. Wall modules được phép giao nhau tại góc; prop không giao solid. Cần review độ chặt điều kiện wall-wall.
4. Reachability dùng radius pixel thực với margin 20%; tabletop evidence không dùng ngưỡng 0.6 logic chung.
5. Lưu wallSpan cho occlusion, tránh làm mờ từng module của toàn bộ back wall.
6. Dùng pivot/footprint từ geometry thay tiêu chí alpha hàng cuối 90% không phù hợp hình thoi.
7. Migrate hai phòng đồng thời do texture key dùng chung phải trỏ cùng URL.
8. Tách interaction floor projection khỏi marker elevation; geometry gate chạy cả khi load case.
9. Dời spawn Office default (8,4.8), Archive default (8.5,5); giữ ID.
10. Giữ art/builders cũ vì assets_config.json còn tham chiếu; chưa xóa.

## Tiếp tục

1. Đọc memory, plan, Git; dùng `.venv-art-codegen` hiện có, không tạo lại venv.
2. Chạy dev server từ `apps/game-web` trên 5174; chạy Playwright từ cùng thư mục để screenshot dùng đường dẫn đúng. Kiểm tra server đang nghe đúng port.
3. Hoàn thành Task 6/7: full E2E + scene-layout/world/HUD repeat 2; sửa lỗi thực tế theo TDD. Không dùng teleport cho test traversal.
4. Task 8: hợp đồng art06/architecture, cleanup có kiểm tra tham chiếu, lint/test/build/format/Python/memory gates, một final reviewer theo skill Native, cập nhật plan và memory.
5. Chụp lại Office + Archive 1280×720, xin người dùng duyệt hình ảnh trước khi đánh dấu Task 2 cha/Phase 11E hoàn tất.

Ledger và ảnh cũ: `.superpowers/sdd/2026-09-30-phase-11e-office-archive-static-world-redesign/` (ignored, chỉ có ở máy này). Không chạy lại scratch `migrate.mjs`: các vị trí đã chỉnh tiếp và script không idempotent.

## Phiên tiếp tục — 2026-09-30

Người dùng yêu cầu đọc memory và tiếp tục. Git `dev` ở `3b758e1`, đồng bộ `origin/dev`; checkpoint code `9db54e6` đúng như memory. Không sửa thư mục untracked `Claude outputs/`. Venv/ledger của phiên trước không còn nên đã khôi phục công cụ và ledger từ Git.

### Thay đổi

- Runtime `WorldScene.ts`: Map quản lý tween xoay theo sprite, bỏ entry khi complete/cleanup. Tween bị destroy trước đây có `targets=null`, gây crash khi phỏng vấn liên tiếp; test ba cuộc phỏng vấn đã được quan sát fail rồi pass.
- Fixtures `hud.spec.ts`, `timeline.spec.ts`, `sceneTestData.ts`: dùng hành lang trống và chờ movement thật cho minimap; reload lấy spawn của scene đã lưu thay pixel bố cục cũ. Không đổi test traversal WASD/E thành teleport.
- Fixture `world.spec.ts`: hai test NPC giữ E đến khi dialog xuất hiện rồi thả trong finally. Lượt repeat cũ 151/152 fail ở dialog; diagnostic keydown/keyup cùng frame tái hiện không có interaction vì Phaser xóa `JustDown` khi keyup. Giữ phím qua frame mở hội thoại; targeted repeat 4/4 pass, không thêm retry.
- `sceneGeometry.ts`: reject ID trùng trên assets khai báo + expanded modules; giới hạn overlap exemption ở mối nối endpoint vuông góc. Test ở `sceneGeometry.test.ts`, `scene.test.ts`, `caseDefinition.test.ts` thêm 7 trường hợp (5 RED, 2 trường hợp hợp lệ).
- Hợp đồng art06/architecture, provenance và plan cha cập nhật footprint/collision/interaction/visual, wall segments/openings, camera 30° và trạng thái Task 2 bị thay thế.
- Formatting các file checkpoint; script format/check dùng glob loại generated pytest/venv cache trước expansion để tránh EPERM của sandbox. Không thêm dependency JS.
- Giữ PNG/builders legacy sau kiểm tham chiếu: `tools/art-codegen/assets_config.json` vẫn dùng chúng. Source geometry/art được giữ nguyên ngoài các sửa đã nêu.

### Review cuối

Reviewer độc lập đã đọc diff `8a13afa..3b758e1` + working diff. Hai Important được xử lý bằng TDD; không có Critical. Chi tiết, Minor hoãn và quyết định giới hạn scope ở [báo cáo review](2026-09-30-phase-11e-static-world-final-review.md).

### File thay đổi trong phiên tiếp tục

- Runtime: `apps/game-web/src/game/scenes/WorldScene.ts`.
- Geometry và regressions: `packages/game-content/src/geometry/sceneGeometry.ts`, `sceneGeometry.test.ts`, `packages/game-content/src/schema/scene.test.ts`, `caseDefinition.test.ts`.
- Fixtures E2E: `apps/game-web/e2e/hud.spec.ts`, `sceneTestData.ts`, `timeline.spec.ts`, `world.spec.ts`.
- Formatting checkpoint: `apps/game-web/src/game/systems/occlusion.test.ts`, `sceneAssetResolver.test.ts`, `sceneAssetResolver.ts`, `apps/game-web/src/hud/minimapModel.ts`, `packages/game-content/src/geometry/wallSegments.test.ts`.
- Công cụ: `.gitignore`, `.prettierignore`, `package.json`; không đổi dependency hoặc lockfile.
- Hợp đồng/provenance: `docs/art/06_PHASER_CHARACTER_SCENE_ASSET_MODEL_SPEC.md`, `docs/architecture/ARCHITECTURE.md`, `assets/PROVENANCE.md`.
- Trạng thái và bằng chứng: hai plan Phase 11E `controls-visual-ux`/`office-archive-static-world-redesign`, báo cáo verification này và `docs/ai/2026-09-30-phase-11e-static-world-final-review.md`.
- Handoff: `docs/ai/MEMORY.md` được cập nhật trong commit riêng sau result commit, theo protocol.

### Bằng chứng mới

Môi trường thực tế dùng Node 24.19.0, npm 10.9.7 sẵn có với PATH shim cục bộ; Nx daemon tắt trong các gate. Python venv dùng bundled Python 3.12, numpy/Pillow sẵn có và scipy 1.18.1 trong venv. Không khai báo npm/Nx pass dựa trên runner thay thế.

```text
npm run lint
NX Successfully ran target lint for 7 projects

npm run test
Vitest: 87 files, 685 tests passed
ai-memory: 30 tests passed
NX Successfully ran target test for 7 projects

npm run build
NX Successfully ran target build for project @lexicon/game-web
vite: 188 modules transformed; built in 8.17s

npm run format:check
All matched files use Prettier code style!

.venv-art-codegen/Scripts/python.exe -m unittest discover -s tools/art-codegen
Ran 41 tests in 32.551s
OK

node node_modules/playwright/cli.js test --reporter=line
96 passed (8.5m)

node ../../node_modules/playwright/cli.js test e2e/world.spec.ts e2e/hud.spec.ts e2e/scene-layout.spec.ts --repeat-each=2 --reporter=line
152 passed (6.9m)

node ../../node_modules/playwright/cli.js test e2e/dialogue.spec.ts e2e/learning.spec.ts e2e/listening.spec.ts e2e/settings.spec.ts e2e/timeline.spec.ts e2e/boot.spec.ts --reporter=line
20 passed (3.4m)
```

- Full E2E 96/96 ở sau sửa tween/fixtures, trước sửa validation từ review. Lượt baseline đầu 90/96; lỗi boot/learning/listening timeout không tái hiện trong lượt đầy đủ xanh. Một lượt targeted bị HMR detach do format runtime khi đang chạy; đã giữ source ổn định trong lượt cuối.
- Sau review: game-content 158/158, gồm `validateRegisteredContent`, scene/case loader regressions. Repeat scene-layout/world/HUD đã pass 152/152; traversal vẫn dùng WASD/E thật, không teleport. Sáu suite còn lại 20/20 pass. Hai lệnh sau review phủ toàn bộ 96 E2E hiện tại, trong đó 76 test chạy hai lần.
- Các gate npm lint/test/build/format:check đã chạy lại sau sửa khai báo Map và fixture NPC, đều pass; Nx dùng cache hợp lệ cho 5/7 lint/test tasks, chạy mới hai task còn lại. Scoped ESLint `apps/game-web/e2e` pass; `git diff --check` pass.
- Build sau review từng phát hiện TS2345 do Map key suy luận template literal quá hẹp. Đã thêm kiểu Map rõ ràng, chạy lại npm/Nx build và pass. Vite vẫn cảnh báo chunk lớn hơn 500 kB (bundle Phaser); không thay đổi chiến lược chunk trong redesign.
- `memory:check` trước cập nhật memory pass; chạy lại sau handoff. `git diff --check` pass ở thời điểm cập nhật này.
- Backend không đổi.

### Nghiệm thu

Ảnh mới 1280×720 ở `.superpowers/sdd/2026-09-30-phase-11e-office-archive-static-world-redesign/{office,archive}-1280x720.png`. Người dùng chưa duyệt. Phase 11E/Task 2 cha vẫn `in_progress`; Tasks 3–6 cha và Phase 12 chưa bắt đầu.
