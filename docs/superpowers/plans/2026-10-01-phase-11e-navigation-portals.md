# Phase 11E — Implementation Plan cho camera, điều khiển và cổng đồng

> **For agentic workers:** REQUIRED SUB-SKILL: dùng `executing-plans` để thực thi từng task theo phương thức Native đã chọn. Các bước dùng checkbox; người dùng review plan trước khi coding.

**Goal:** Triển khai phạm vi navigation/portal đã duyệt để chơi bằng chuột hoặc bàn phím, thấy rõ nhân vật và chuyển Office/Archive qua cổng đồng.

**Architecture:** Route tạm thời, hit testing và hiệu ứng thuộc Phaser presentation; thuật toán tìm đường là TS thuần trong game-web. React dùng store và typed bus hiện có; content sở hữu geometry, prompt và transition. Không tạo nguồn vị trí thứ hai.

**Tech Stack:** TypeScript strict, Phaser, React, Zustand, Vitest, Playwright, Python asset codegen; npm + Nx.

**Spec:** `docs/superpowers/specs/2026-10-01-phase-11e-navigation-portals-design.md` (người dùng duyệt ngày 2026-10-01).

**Trạng thái thực thi:** Người dùng duyệt plan và Native inline ngày 2026-10-01. Task 1–7 đã triển khai; Task 8 còn regression E2E, xác nhận các sửa review và kiểm tra cuối. Người dùng yêu cầu dừng, commit và lưu memory. Chi tiết snapshot: `docs/ai/2026-10-01-phase-11e-navigation-portals-handoff.md`. Các checkbox bên dưới là checklist gốc; dùng handoff/Git để đối chiếu tiến độ thực tế, không suy ra phase đã complete.

## Global Constraints

- Chỉ Phase 11E; không backend, dependency mới, scene thứ ba hoặc thay luật điều tra/học/save.
- Native inline trên `dev` đã chọn; giữ hai file debug.log không sửa/không stage, không push trong lượt lập plan.
- Zoom 1.8× desktop, 1.6× compact; compact dưới 960px rộng hoặc dưới 640px cao; fit margin 0.005.
- Player minimap 8–10 CSS px, nền mực/viền giấy; palette art/06, đỏ chỉ dùng đúng guardrail.
- Body logical 0.36×0.36; di chuyển qua collision hiện có, tốc độ theo màn hình không đổi.
- Click xa → đi → dừng → click lần nữa; không tự tương tác, không overlap teleport, không lưu route.
- Translation selector chỉ Settings; tooltip chỉ click; controls chuột tối thiểu 44px và dùng được ở compact.
- IDs `hallway_door` và `PLACEHOLDER_archive_door`, destination/spawn hai chiều giữ contract; metadata mới optional.
- Cổng dimetric 2:1, đồng cũ/ánh vàng nhẹ; reduced motion tĩnh; không neon/bloom/flash.
- Tài liệu tiếng Việt, npm + Nx, E2E một worker; đọc rule/memory và reconcile Git trước thực thi.

## Review Focus

1. CSS canvas letterbox + camera scroll/zoom + resize: click phải chọn đúng điểm sàn (Task 6).
2. Corridor vừa đủ body và hai blockers chạm góc: route hợp lệ qua passage, không cắt góc (Task 5).
3. Double click và pointer event cuối sau khi mở modal: chỉ một interaction, không skip node/move (Task 6).
4. Arrow đang giữ khi mở/đóng Settings, focus select/input: không hành động trễ hoặc phá native controls (Task 4).
5. Player trùng marker lúc spawn/transition, map compact: dấu player nằm trên và đủ CSS size (Task 2).

## Cách chạy kiểm thử theo task

Unit frontend: `npx nx run @lexicon/game-web:test -- <file>`; content: `npx nx run @lexicon/game-content:test`. Mỗi bước RED phải fail vì assertion hành vi mới, không vì cấu hình/missing import ngoài phạm vi task. Bước GREEN phải exit 0 và toàn bộ test được chỉ định pass. Khi môi trường hiện tại cần shim: prepend `.superpowers/runtime/npm-shim` vào PATH và đặt `NX_DAEMON=false`; không thay package manager.

## Task 1: Zoom sâu và clamp camera

**Files:** sửa `apps/game-web/src/game/systems/cameraFollow.ts`, `cameraFollow.test.ts`; sửa `apps/game-web/e2e/feedback-camera.spec.ts`.

**Interfaces:** giữ `cameraFollowConfig(viewport: ViewportSize, cameraSize: ViewportSize, sceneBounds: ViewportSize): CameraFollowConfig`; WorldScene tiếp tục consume config đó.

- [ ] RED: `prefers_deeper_zoom_at_breakpoints` assert zoom 1.8 ở 1280×720, 1.6 ở 760×600 và ở 959×720/1280×639; `fit_margin_covers_large_viewport` assert zoom ≥ fit + 0.005 khi fit lớn hơn preferred.
- [ ] Chạy unit file cameraFollow theo lệnh trên; xác nhận fail do mốc zoom cũ.
- [ ] Đổi preferred zoom trong helper, giữ follow/dead-zone và fit policy; không đổi logical geometry/tốc độ.
- [ ] GREEN unit; E2E bốn rìa Office/Archive trước/sau resize assert viewport không lộ ngoài bounds và player trong canvas.
- [ ] Commit các file task: `feat: deepen world camera zoom`.

## Task 2: Marker minimap đúng đơn vị và kích thước hiển thị

**Files:** sửa `apps/game-web/src/hud/minimapModel.ts`, `Minimap.tsx`, `minimap.css`, `minimapModel.test.ts`, `Minimap.test.tsx`; sửa `apps/game-web/e2e/feedback-minimap.spec.ts`.

**Interfaces:** giữ `buildMinimapModel(scene: SceneDefinition, playerPosition: { x: number; y: number; coordinateSpace?: 'screen' | 'logical' } | null): MinimapModel`. Render player/target bằng overlay HTML 9px trong cùng container SVG; vị trí lấy projected model → phần trăm viewBox. Bỏ radius logical khỏi phần render, cập nhật model test tương ứng; không thêm position state.

- [ ] RED: `projects_logical_player_without_camera_offset` so sánh player với `projectScenePoint`; `player_is_last_and_distinct_from_target` assert player overlay cuối lớp markers và có chú giải. E2E `player_has_visible_css_size` assert bounding box width/height trong [8,10] ở hai viewport, kể cả khi cx/cy trùng marker.
- [ ] Chạy unit và `npm run test:e2e -- feedback-minimap.spec.ts --workers=1`; xác nhận fail từ radius hiện tại.
- [ ] Render overlay HTML diameter 9px độc lập viewBox scale; nền mực/viền giấy, sửa marker sizing. Đặt overlay trong đúng drawable box của SVG (không gồm padding/letterbox), pointer-events none; không thêm position state.
- [ ] GREEN unit/E2E; assert tọa độ đổi sau arrow/mouse movement, null/scene mới không hiển thị tọa độ scene cũ, panel click không phát world command (Task 6 kiểm tích hợp).
- [ ] Commit: `fix: make minimap player and targets visible`.

## Task 3: Settings-only translation và controls HUD bằng chuột

**Files:** sửa `apps/game-web/src/dialogue/DialogueView.tsx`, `DialogueLayer.tsx`, `notebook/NotebookPanel.tsx`, `evidence/EvidenceModal.tsx`, `vocabulary/VocabularyText.tsx`; sửa `hud/Hud.tsx`, `KeyHints.tsx`, `InteractionPrompt.tsx` và CSS cùng thư mục. Sửa test component tương ứng và `apps/game-web/e2e/feedback-ui-controls.spec.ts`, `settings.spec.ts`. Strings mới: `packages/game-content/ui/vi.json`, `packages/game-content/src/schema/ui.ts`, `packages/shared-types/src/case.ts` nếu contract cần mở rộng.

**Interfaces:** giữ translation settings store/useTranslationMode và `PauseMenu`; controls gọi existing notebook/map/pause store actions. `InteractionPrompt` emit `interaction:triggered` payload `{ interactableId: string }` qua bus đã truyền từ owner, chỉ khi nearby hợp lệ và input không khóa; bridge vẫn kiểm eligibility.

- [ ] RED: component `reader_has_no_translation_selector` assert selector vắng trong dialogue/notebook/evidence/listening, nội dung dịch đúng mode; `hud_controls_are_clickable_when_compact` assert accessible buttons Settings/notebook/map; prompt lock không emit.
- [ ] Chạy các component test sửa; fail do selector hiện tại/controls chỉ là spans.
- [ ] Bỏ callbacks selector ở readers, giữ rendering và click tooltip. Dùng button 44px/focus visible, không ẩn toàn bộ controls compact; strings từ content, không tạo bus/global singleton.
- [ ] GREEN unit và hai E2E file: chọn mode trong Settings → resume → reload giữ mode/progress; mouse mở/đóng notebook/map/pause; Settings là selector duy nhất.
- [ ] Commit: `feat: keep translation settings in pause menu and add mouse HUD controls`.

## Task 4: Arrow/WASD và quyền nhận input

**Files:** sửa `apps/game-web/src/game/systems/input.ts`, `input.test.ts`, `isoInput.test.ts`, `apps/game-web/src/game/scenes/WorldScene.ts`; tạo `apps/game-web/e2e/feedback-navigation.spec.ts`.

**Interfaces:** tạo `mergeMovementKeys(wasd: MovementKeys, arrows: MovementKeys): MovementKeys` trong input.ts; consume `resolveIsoInput`, `screenSpeedVector` hiện có. Task này chuẩn hóa input/lock; Task 6 nối keyboard direction và input mất quyền với NavigationController.cancel() của Task 5.

- [ ] RED: `paired_keys_do_not_double_speed` assert W+Up bằng W; `opposites_cancel` assert W+Down → zero; diagonal projected magnitude bằng cardinal sau screenSpeedVector; typing → zero.
- [ ] Chạy input/isoInput tests; xác nhận fail trước merge helper.
- [ ] Merge mỗi hướng bằng OR, register arrows không global capture. Chỉ preventDefault khi gameplay thực sự sở hữu input, không trên form controls; xử lý lock/blur bằng reset press state để không thực thi trễ. Cleanup keys/listeners.
- [ ] GREEN unit; E2E arrows/WASD cùng thời lượng displacement tương đương, Settings select/input arrow giữ native behavior, không move; giữ key lúc lock rồi resume không phát E/route interaction.
- [ ] Commit: `feat: support arrow movement alongside WASD`.

## Task 5: A* và route controller tạm thời

**Files:** tạo `apps/game-web/src/game/systems/navigation.ts`, `navigation.test.ts`, `navigationController.ts`, `navigationController.test.ts`; consume `logicalCollision.ts`, `isometricProjection.ts`, `isoInput.ts`.

**Interfaces:** navigation.ts export `NavigationGoal = { kind: 'point'; point: LogicalPoint } | { kind: 'interaction'; anchor: LogicalPoint; radiusPx: number }`, `NavigationWorld = { bounds: LogicalRect; solids: readonly LogicalRect[]; body: LogicalRect; projection: IsoProjection }`, `NavigationResult = { status: 'found'; points: readonly LogicalPoint[] } | { status: 'unreachable' | 'invalid' | 'limit' }`; `findNavigationPath(start: LogicalPoint, goal: NavigationGoal, world: NavigationWorld): NavigationResult`.

navigationController.ts export `createNavigationController(): NavigationController`; interface có `replace(points: readonly LogicalPoint[]): void`, `cancel(): void`, `direction(position: LogicalPoint, deltaMs: number): LogicalPoint | null`, `observeMovement(before: LogicalPoint, after: LogicalPoint, deltaMs: number): void`, `isActive(): boolean`. Controller trả hướng logical, không tự ghi player/bus/store và không có callback interaction.

- [ ] RED navigation: `routes_around_desk` assert mọi segment moveWithCollisions tới đúng endpoint; `preserves_body_clearance_in_corridor` corridor width 0.96 đi được; `does_not_cut_blocked_corner` diagonal giữa blockers không được dùng; invalid ngoài bounds và fully enclosed trả fail hữu hạn.
- [ ] RED goal/controller: `approach_is_reachable_and_within_projected_radius` endpoint projected distance ≤80px, body không overlap solids; `arrival_does_not_interact` controller inactive ở đích, không bus; replace bỏ route cũ/cancel → direction null; `stuck_route_stops` movement zero liên tục 500ms → inactive.
- [ ] Chạy hai unit files; xác nhận thiếu API/assertion mới fail.
- [ ] Implement A* grid logical bước 0.125, body clearance bằng resolver; diagonal kiểm swept segment và hai cạnh kề. Giới hạn 50.000 expanded nodes, không smoothing trong bản đầu. Nối start/goal với grid chỉ qua segment đã kiểm collision; goal interaction dùng radius theo projection, không tâm furniture. Point invalid không snap xuyên blocker. Controller dùng epsilon projected 2px, stuck 500ms; không pathfind mỗi frame.
- [ ] GREEN units với fixtures synthetic và geometry thật hai scene; assert query count không tăng khi controller update, đoạn cuối tới point reachable trong 2px. Điều chỉnh grid chỉ khi geometry regression chứng minh passage hợp lệ bị mất, ghi quyết định trong verification.
- [ ] Commit: `feat: add collision-aware world navigation`.

## Task 6: World pointer picking và tích hợp click hai bước

**Files:** tạo `apps/game-web/src/game/systems/worldPointer.ts`, `worldPointer.test.ts`; sửa `WorldScene.ts`, `navigationController.test.ts`, `apps/game-web/e2e/feedback-navigation.spec.ts`; dùng `bridge/interactionEligibility.ts`, `connectCaseEngine.ts` giữ owner hiện có.

**Interfaces:** export `PointerTarget = { interactableId: string; visualBounds: { x: number; y: number; width: number; height: number }; depth: number; anchor: LogicalPoint; radiusPx: number }`, `PointerOccluder = { bounds: PointerTarget['visualBounds']; depth: number; opaque: boolean }`; `pickWorldTarget(point: ScreenPoint, targets: readonly PointerTarget[], occluders: readonly PointerOccluder[]): PointerTarget | null`. `pointerToLogical(worldPoint: ScreenPoint, projection: IsoProjection): LogicalPoint` consume Phaser pointer world coordinates cập nhật qua camera, không tự cộng scroll lần hai.

- [ ] RED: target chồng chọn depth cao nhất/tie ID ổn định; opaque occluder phía trên phủ điểm click không chọn target, wall alpha 0.45 không coi opaque. `pointer_world_coordinates_inverse_project` assert roundtrip ≤epsilon.
- [ ] RED E2E: click xa NPC → chưa dialogue; tới endpoint → vẫn chưa dialogue; click lần nữa → dialogue. Click xa cổng → scene chưa đổi; double click gần NPC → một interaction/node đầu. Click sàn sau canvas resize/letterbox đến logical target trong tolerance2px projected.
- [ ] Chạy unit/E2E; fail do chưa có pointer navigation.
- [ ] Integrate primary pointerdown, chặn HUD/modal qua DOM ownership/input lock, double-click suppression theo click detail/lifecycle; không register pointer callback ở React để gọi Phaser. Far target tạo interaction goal, near target emit bus hiện có rồi cancel route. Floor inverse project + validation; click mới replace. Unreachable dùng indicator mực tạm tại điểm click, cleanup timeout/graphics, không thêm thông báo hardcode.
- [ ] Trong update dùng controller direction → screenSpeedVector → collision resolver → cùng animation/footsteps/publish pipeline keyboard. observeMovement phát hiện stuck. Cancel khi keyboard/modal/pause/transition/blur/shutdown; không resume route. Không đổi learning/transition eligibility.
- [ ] GREEN unit/E2E: desk detour, evidence click, keyboard interrupt, target replacement, HUD/map clicks không move, modal pointer cuối không skip, resize/follow đúng đích; kiểm cleanup bằng scene restart không duplicate handlers.
- [ ] Commit: `feat: enable click navigation and explicit second-click interaction`.

## Task 7: Cổng đồng, authored geometry và lifecycle

**Files:** sửa `packages/game-content/cases/case-001/scenes/main_office.json`, `archive.json`, `environment-models.json`, `packages/game-content/ui/vi.json`; sửa `tools/art-codegen/build_environment.py`, `world_modules.py`, `test_world_modules.py`; tạo `apps/game-web/src/game/systems/portalPresentation.ts`, `portalPresentation.test.ts`; sửa WorldScene, content geometry tests và `assets/PROVENANCE.md`. Thêm generated portal texture dưới `apps/game-web/public/assets/` theo registry pipeline hiện có. Nếu metadata mới cần: sửa `packages/shared-types/src/scene.ts`, `packages/game-content/src/schema/scene.ts`, `scene.test.ts`.

**Interfaces:** metadata optional `portal?: { style: 'aged-brass'; radius: number }` trên presentation asset, radius logical; renderer generic consume asset metadata thay vì Case ID. `createPortalPresentation(scene: Phaser.Scene, position: ScreenPoint, reducedMotion: boolean): { setReducedMotion(value: boolean): void; destroy(): void }` sở hữu graphics/tween/particles; static texture vẫn hoạt động khi không có effect.

- [ ] RED content: public IDs/destination/spawns hai chiều không đổi, portal visual footprint trong bounds, spawn body clear, reachable tới anchor ≤80px; old content không portal metadata vẫn parse. Tests prompt destination lấy content, không còn “Ra hành lang” cho Archive.
- [ ] RED asset/effect: render podium ellipse2:1/palette đúng; reducedMotion không tween/particle active; destroy cleanup hết object/timer/tween, scene restart không nhân đôi effect.
- [ ] Chạy content tests, portalPresentation unit và Python `python -m unittest discover -s tools/art-codegen -p test_world_modules.py`; fail từ geometry/presentation mới.
- [ ] Author hai pad vào sàn trong bounds với clear approach, điều chỉnh spawn nếu cần; không collider pad. Dùng aged brass ink/grain texture codegen, vòng đồng tâm và soft gold effect tiết chế; palette art/06, static reduced motion. Registry/provenance ghi generated asset, không dùng JPEG làm sprite. Giữ transition owner và trigger E/near click; overlap/arrival không trigger.
- [ ] GREEN content/Python/frontend; E2E mouse-only cổng hai chiều giữ progress, map reset đúng spawn, reduced motion screenshot và texture cleanup qua transition lặp.
- [ ] Commit: `feat: present paired scene transitions as brass portals`.

## Task 8: Nghiệm thu tích hợp và review toàn thay đổi

**Files:** hoàn thiện `apps/game-web/e2e/feedback-navigation.spec.ts`, `feedback-camera.spec.ts`, `feedback-minimap.spec.ts`, `feedback-ui-controls.spec.ts`; tạo `docs/ai/2026-10-01-phase-11e-navigation-portals-verification.md`; cập nhật checkbox plan và memory theo protocol.

**Interfaces:** kiểm qua DOM/canvas/store test hooks hiện có; không thêm API gameplay chỉ để test. Các contract Task1–7 là đầu vào nghiệm thu.

- [ ] Chạy regressions Task1–7 và full E2E một worker: `npm run test:e2e -- --workers=1`; không chỉnh runtime khi suite đang chạy. Mouse-only đi quanh blocker → NPC → evidence → notebook → Settings → hai cổng; keyboard xen kẽ và input lock không hồi route.
- [ ] Chụp Office/Archive 1280×720, 760×600, gần cổng/scene edges, dialogue/notebook không selector, reduced motion. Assert player minimap CSS diameter [8,10], controls44px, không horizontal overflow; lưu artifacts vào thư mục ignored `.superpowers/sdd/2026-10-01-phase-11e-navigation-portals/`.
- [ ] Chạy `npm run lint`, `npm run test`, `npm run build`, `npm run typecheck`, `npm run format:check`, `npm run memory:check`; chạy asset validators và Python art tests theo lệnh pipeline hiện hành sau regenerate. Dán output thật vào verification; không tuyên bố pass nếu chưa chạy. Không dotnet vì không backend change.
- [ ] Dùng `requesting-code-review` theo Native đã chọn để một reviewer độc lập review toàn diff/spec; sửa Critical/Important trước nghiệm thu, rerun checks bị ảnh hưởng. Không coi review cũ là review scope mới.
- [ ] Commit implementation verification trước; update/commit memory riêng với result_commit trỏ commit kết quả. Báo file thay đổi, test thêm, output, hạn chế; xin người dùng nghiệm thu screenshot và nhạc hiện tại trước đóng Phase11E. Không tự bắt đầu Phase12/push.

## Self-review plan

- Camera/minimap/Settings/keys/mouse/pathfinding/portal và acceptance spec đều có task sở hữu và test tương ứng.
- Review Focus 1/3 thuộc Task6, 2 thuộc Task5, 4 thuộc Task4, 5 thuộc Task2; không bỏ kiểm CSS kích thước thật.
- Controller chỉ trả logical direction; pointer helper nhận world coordinates; một movement owner và một transition owner. API Task5 được Task4/6 dùng đúng tên, không tạo callback auto-interaction.
- Task1–7 đều có RED/GREEN/commit; Task8 chỉ tích hợp/review, không triển khai feature mới. Không đưa function bodies vào plan.
- Tiếp theo: người dùng review plan; sau đó thực thi Native với `executing-plans`, không hỏi lại execution method.

