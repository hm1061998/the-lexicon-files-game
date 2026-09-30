# Phase 11E — Implementation plan hoàn thiện cảnh, HUD và âm thanh

> **Dành cho agent thực thi:** REQUIRED SUB-SKILL: dùng `executing-plans` theo cách Native đã chọn; triển khai từng task với các bước checkbox. Không hỏi lại execution method.

**Goal:** Xử lý đủ 10 feedback về cảnh Office/Archive, viewport, tương tác, minimap/HUD và SFX/voice tiếng Anh tạo sẵn.

**Architecture:** Giữ scene JSON → Phaser, typed event bus → Zustand/React và content → Howler. Phaser sở hữu vị trí/chuyển động; bridge đọc case state để cung cấp eligibility, presentation audio owner quản lý playback. Không chuyển case/learning logic vào scene hoặc thêm state gameplay thứ hai.

**Tech Stack:** Windows, TypeScript strict, React, Phaser, Zustand, Howler hiện có, Zod, npm + Nx, Vitest/Playwright; Python dev-only cho geometry/WAV/Kokoro.

**Spec:** [Spec đã duyệt](../specs/2026-09-30-phase-11e-feedback-polish-design.md).

**Trạng thái:** Người dùng đã duyệt plan bằng “duyệt plan” ngày 2026-09-30 và hỏi so sánh subagent/Native. Khuyến nghị giữ Native đã chọn, với một reviewer độc lập cuối; chưa triển khai feedback. Checkout `dev` hiện tại, chỉ commit local.

## Ràng buộc chung

- Một plan tích hợp như spec đã chọn; từng task có deliverable/gate riêng. Không Phase 12 hoặc scene Hành lang thứ ba.
- Giữ scene/interactable/evidence/dialogue/objective IDs, luật điều tra/học/save/backend và nội dung câu thoại gốc. Case content chỉ trong `packages/game-content`.
- Projection 2:1, tile 128×64, camera môi trường 30°, WASD theo màn hình; giữ character/evidence art. Collision/interaction độc lập visual.
- Npm + Nx; không dependency JS mới, không model/TTS/API runtime. Python packages/model cache chỉ ở môi trường dev cục bộ được ignore.
- Art06 là nguồn palette/typography; đỏ chỉ cho clue/evidence/objective/contradiction/selected node/map marker. Không âm phạt sai, nhạc nền hoặc reward fanfare.
- Movement publish: projected world pixels, ngưỡng 2 px, throttle 100 ms; payload giữ `coordinateSpace`, minimap project một lần.
- Compact: width <960px **hoặc** height <640px; HUD mặc định thu, launcher ≥44px. Manual toggle giữ qua scene/resize, không lưu vào gameplay save.
- Voice đủ 3 dialogue trees/15 NPC nodes, gồm nhánh điều kiện; không đọc lựa chọn player/UI tiếng Việt. Một voice cùng lúc, playback không khóa quyền chọn tiếp.
- Shortcut bỏ qua input/textarea/contenteditable và input lock. Listener/tween/texture/Howl cleanup khi shutdown/unmount.
- Không sửa runtime khi browser gate chạy. Không add/xóa `Claude outputs/`, debug logs, model/cache hoặc toàn bộ working tree.
- Đọc root/app AGENTS, memory, art06/architecture/spec trước thực thi. Result commit trước, memory commit riêng sau; không push/merge.

## Trọng tâm review

1. Viewport đổi tỷ lệ và modal dài: không scroll page nhưng vẫn đọc/đóng modal được — Task 1, `feedback-viewport.spec.ts`.
2. Bước ngắn và transition/reload: dot cập nhật đúng đơn vị, không hai lần projection hoặc tọa độ scene cũ — Task 2, `playerMoved.test.ts`, `feedback-minimap.spec.ts`.
3. Cue bị điều kiện giấu hoặc prompt sát letterbox/HUD: không lộ evidence và không che target/player — Tasks 6–7, `anchorScreen.test.ts`, `worldCueSource.test.ts`.
4. Node đổi nhanh/close/pause khi clip đang load: callback cũ không phát lại hoặc chồng voice — Task 10, `presentationAudio.test.ts`.
5. Audio thiếu/chặn autoplay và listening đang phát: text/tiến độ vẫn hoạt động, volume/duck đúng, không retry loop — Tasks 8–10, validator và audio lifecycle tests.

## Bản đồ file và kiểm tra

Các đường dẫn dưới đây tính từ repo root; “tạo” chỉ áp dụng file mới. Không refactor toàn bộ `GameCanvas`/`WorldScene`.

| Nhóm        | File sửa/tạo chính                                                                                                                                                                             | Kiểm tra                                                                                                                |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Shell       | sửa `apps/game-web/src/main.tsx`, `game/GameCanvas.tsx`; tạo `game/gameShell.css`                                                                                                              | tạo `apps/game-web/e2e/feedback-viewport.spec.ts`                                                                       |
| Movement    | sửa `game/systems/playerMoved.ts`, `game/scenes/WorldScene.ts`                                                                                                                                 | sửa `playerMoved.test.ts`; tạo `e2e/feedback-minimap.spec.ts`                                                           |
| Nhãn        | sửa shared-types `scene.ts`; content schema `scene.ts`, hai scene JSON; sửa `game/entities/createRoomLabel.ts`; tạo `game/systems/labelPlane.ts`                                               | schema `scene.test.ts`; tạo `labelPlane.test.ts`; `scene-layout.spec.ts`                                                |
| Cửa         | sửa hai scene JSON; geometry validation nếu fixture phát hiện thiếu gate                                                                                                                       | `sceneGeometry.test.ts`, `world.spec.ts`                                                                                |
| Ghế         | sửa `tools/art-codegen/props.py`, `build_environment.py`, hai scene JSON, generated props/model manifest/provenance                                                                            | tạo `tools/art-codegen/test_chair_directions.py`                                                                        |
| HUD/prompt  | sửa `state/gameStore.ts`, HUD components/CSS, `anchorScreen.ts`, shared-types `events.ts`, `case.ts`, content schema `ui.ts`, `ui/vi.json`; tạo `hud/initialHudVisibility.ts`                  | store/anchor/minimap tests; tạo `ObjectivePanel.test.tsx`, `initialHudVisibility.test.ts`, `InteractionPrompt.test.tsx` |
| Cue         | sửa shared-types/content scene contract; tạo `bridge/worldCueSource.ts`, `game/entities/WorldCueLayer.ts`; sửa `GameCanvas.tsx`, `WorldScene.ts`                                               | tạo `worldCueSource.test.ts`, `WorldCueLayer.test.ts`                                                                   |
| Audio asset | tạo shared-types `audio.ts`, content schema `audio.ts`; sửa `dialogue.ts`, `case-engine.ts`, `index.ts`, schemas dialogue/caseDefinition, case JSON/dialogues JSON; tạo `tools/audio-codegen/` | schema tests; tạo `tools/audio-codegen/test_audio_assets.py`, `validate_assets.py`                                      |
| Audio owner | tạo `audio/presentationAudio.ts`, `AudioPresentationProvider.tsx`, `usePresentationAudio.ts`; sửa bridge/store/WorldScene/GameCanvas và shared-types events                                    | tạo `presentationAudio.test.ts`, `footstepCadence.test.ts`; bridge/store tests                                          |
| Voice       | sửa `DialogueLayer.tsx`, `DialogueView.tsx`, `dialogue.css`, `audio/useAudioPlayback.ts`, `evidence/EvidenceModal.tsx`; tạo `audio/DialogueVoiceControls.tsx`                                  | DialogueView/EvidenceModal tests; tạo `DialogueVoiceControls.test.tsx`, `e2e/feedback-audio.spec.ts`                    |

Với app paths trong bảng, prefix `apps/game-web/src/`; với schema/tests prefix `packages/game-content/src/schema/`. Hai scene JSON chính xác: `packages/game-content/cases/case-001/scenes/main_office.json` và `archive.json`. UI strings: `packages/game-content/ui/vi.json`. Generated props: `apps/game-web/public/assets/props/dimetric/`; model manifest: `packages/game-content/cases/case-001/environment-models.json`; provenance: `assets/PROVENANCE.md`. Shared types dùng prefix `packages/shared-types/src/`; case/dialogue content: `packages/game-content/cases/case-001/case.json`, `dialogues.json`.

## Lệnh và môi trường thực thi

Kiểm shim/venv tồn tại trước khi dùng; không suy từ memory. Các lệnh npm/Nx chạy từ repo root, thêm PATH shim nếu npm hệ thống không dùng được:

```powershell
$env:PATH=(Resolve-Path '.superpowers/runtime/npm-shim').Path+';'+$env:PATH
$env:NX_DAEMON='false'
```

Focused Vitest: `npx nx run @lexicon/game-web:test -- <src/path.test.ts>` hoặc `@lexicon/game-content:test`. Browser: `npm run test:e2e -- <e2e/path.spec.ts> --workers=1 --reporter=line`; wrapper sở hữu Vite 5174, dừng server dev cũ của phiên trước trước khi chạy. Xác nhận argument forwarding khi gate đầu tiên chạy; không âm thầm chạy toàn suite ở bước RED.

Python art: `.venv-art-codegen/Scripts/python.exe -m unittest discover -s tools/art-codegen -p 'test_*.py'`. Audio dùng `.venv-audio-codegen/Scripts/python.exe`, tạo dev env tại Task 8. Mỗi commit chỉ stage danh sách file thuộc task và test liên quan; cập nhật memory riêng nếu tiến độ/decision thay đổi.

## Task 1: Shell đúng viewport và nền canvas

**Files:** nhóm Shell; sửa CSS modal hiện có chỉ khi kiểm tra cho thấy cần overflow nội bộ.

**Interfaces:** tiêu thụ `PALETTE.inkBlack` và `--lexicon-ink` hiện có; sản xuất shell CSS width 100%, height 100vh rồi 100dvh, root/body margin 0, nền cùng canvas. Canvas vẫn FIT 16:9.

- [ ] Viết `feedback-viewport.spec.ts`: tại 760×600, 1024×768, 1280×720, 1920×1080 assert `scrollWidth <= innerWidth`, `scrollHeight <= innerHeight`, shell bounds bằng viewport; body/root/computed background trùng canvas. Resize giữa các kích thước; mở notebook/evidence dài assert nội bộ scroll và close/focus dùng được.
- [ ] Chạy focused E2E, lưu RED: baseline vượt viewport 8px và có nền trong suốt; nếu modal đã pass giữ assertion regression.
- [ ] Thêm/import `gameShell.css`, thay inline 100vw/100vh trong `GameCanvas.tsx` bằng class; dùng token hiện có, không đổi camera. Chỉnh flex/min-height/overflow nội bộ modal bị cắt nếu cần.
- [ ] Chạy lại focused E2E và `scene-layout.spec.ts`, mong đợi PASS; chụp letterbox ở 760×600.
- [ ] Commit `fix(game-web): fit game shell to viewport` với đúng file Task 1.

## Task 2: Minimap theo bước di chuyển ngắn

**Files:** nhóm Movement; giữ `hud/Minimap.tsx` projection hiện hữu trừ khi test chứng minh lỗi khác.

**Interfaces:** giữ `shouldEmitPlayerMoved(prev: {x:number;y:number}|null, next: {x:number;y:number}, dtMs:number): boolean`; cả hai point phải là projected pixels. `player:moved` giữ payload logical/screen hiện hữu.

- [ ] Thêm test “logical small move crosses two projected pixels”: project `(10,9)` và `(10.2578125,8.7421875)`, assert true ở 100ms, false ở 99ms. Giữ tests first publish/under 2px/at 2px; thêm scene reset first publish. E2E mới nhấn mỗi hướng 150ms, assert dot đổi trước 500ms trong khi displacement <2 logical units; stop/obstacle không drift, transition/reload không giữ dot cũ.
- [ ] Chạy Vitest focused và `feedback-minimap.spec.ts`, chứng minh short-move E2E RED ở baseline.
- [ ] Trong `WorldScene.publishPlayerPosition(deltaMs)`, giữ riêng last published projected point để so threshold; emit logical payload nguyên vẹn, reset sample/throttle theo lifecycle/teleport. Không dùng CSS canvas pixels làm ngưỡng, không lưu player position thứ hai trong store.
- [ ] Chạy tests cùng `Minimap.test.tsx` PASS; gate E2E kiểm dot mapping bằng projector một lần.
- [ ] Commit `fix(game-web): publish minimap movement in projected pixels`.

## Task 3: Nhãn nằm trên mặt tường và sàn

**Files:** nhóm Nhãn; content loader/schema case giữ khả năng đọc label legacy.

**Interfaces:** thêm optional `mount: {kind:'floor'} | {kind:'wall';wallId:string;elevationPx:number}` vào label logic; label legacy không có mount vẫn đọc được. Tạo `resolveLabelPlane(label: SceneLabelDefinition, definition: SceneDefinition): LabelPlane`, với `LabelPlane` export trong `labelPlane.ts`: anchor `{x,y}`, hai basis `{x,y}`, depth. Wall axis lấy từ `walls[wallId]`, không duplicate axis field.

- [ ] Test schema từ chối wallId thiếu, anchor không trên wall segment hoặc trong opening, elevation không hữu hạn; floor hợp lệ. `labelPlane.test.ts` assert floor basis song song `(64,32)`/`(-64,32)`, wall baseline theo wall axis và vertical basis hướng lên; anchor giữ đúng projection/elevation; label không tạo collision.
- [ ] Chạy content/app focused tests RED khi chưa có mount/resolver.
- [ ] Implement contract/schema và resolver; `createRoomLabel` dùng affine texture trên quad/container theo basis, depth theo vị trí/elevation, không LABEL_DEPTH toàn cục cho mounted labels. Gắn nhãn phòng vào đoạn tường nhìn thấy, hành lang vào sàn theo JSON; giữ text/ID. Texture key riêng scene instance và destroy texture/container khi shutdown.
- [ ] Chạy focused tests và layout E2E PASS; kiểm screenshot hai scene, baseline chữ cùng tường/sàn, không che đồ vật. Test cleanup texture/object khi restart scene.
- [ ] Commit `feat(world): mount room labels on walls and floor`.

## Task 4: Cửa đối ứng và arrival an toàn

**Files:** nhóm Cửa; `packages/game-content/src/geometry/sceneGeometry.test.ts`, `apps/game-web/e2e/world.spec.ts`.

**Interfaces:** giữ `hallway_door ↔ PLACEHOLDER_archive_door`, transition/spawn IDs. Office exit u=0/v=5 và `from_archive=(0.9,5)`; Archive return ở outer wall u=15.75/v=5 và `from_office=(14.85,5)`. Opening v=4..6; visual/interaction floor anchor theo cùng cửa.

- [ ] Viết fixture/content assertions cho hai phía đối ứng, exact spawn coordinates, clearance/body không đụng expanded walls/props và route reachable. E2E đi WASD/E hai chiều, assert scene ready và exact logical arrival trước khi gửi input tiếp; thêm đứng yên sau arrival không tự chuyển lại. Không teleport để chứng minh đường đi.
- [ ] Chạy focused content/world E2E RED với Archive cửa cùng cạnh Office.
- [ ] Dời Archive opening/frame/door interaction/spawn sang cạnh đối diện; lấp opening cũ theo wall contract. Dời prop cản route tối thiểu nếu validator chỉ ra; giữ mọi ID/khu chức năng. Cập nhật placement và cue anchor metadata sau Task 7.
- [ ] Chạy content geometry/registered validation và world E2E PASS; review screenshot cả hai đầu cửa. Giữ gate IDs global unique, overlap chỉ endpoint vuông góc.
- [ ] Commit `fix(content): pair office and archive doors`.

## Task 5: Ghế hướng về bàn

**Files:** nhóm Ghế; generated PNG/model metadata từ builder, không chỉnh PNG bằng code rotate ở runtime.

**Interfaces:** tạo `office_chair_direction(direction: Literal['ne','nw','se','sw']) -> Scene` trong `props.py`; `sw=0`, `ne=pi`, `nw=pi/2`, `se=-pi/2` geometry rotation. Giữ asset/texture alias cũ; variants có key/URL riêng, không một key nhiều URL.

- [ ] `test_chair_directions.py` assert facing vector từng variant và dot với vector từ ghế tới bàn >0 cho placements; pivot/footprint hợp lệ. Với 6 ghế meeting table, assert hướng vào table; nếu baseline đã đúng chỉ giữ regression.
- [ ] Chạy Python focused RED vì variants chưa tồn tại; không ép meeting builder đúng phải fail.
- [ ] Implement variants/export catalog, render camera 30° bằng `build_environment.py` vào outputs hiện hữu; chọn đúng variant trong hai scene JSON, metadata/provenance cập nhật cùng. Không angle flat sprite hoặc xoay collider vì visual.
- [ ] Chạy Python suite/content validation PASS; ảnh ghế/board hai scene chứng minh mặt ngồi vào bàn, collision/route không đổi ngoài Task 4.
- [ ] Commit `feat(art): render chairs facing their desks`.

## Task 6: HUD thu gọn và prompt nhỏ tránh cảnh

**Files:** nhóm HUD/prompt; WorldScene phát thêm bounds vào anchor event, không React gọi Phaser internals.

**Interfaces:** `getInitialHudVisibility(width:number,height:number): {minimapVisible:boolean;objectiveVisible:boolean}` trong `initialHudVisibility.ts`. `createGameStore` nhận optional `initialHudVisibility` giá trị trên; tính một lần khi mount, default rộng nếu không có viewport. Store thêm `objectiveVisible`, `toggleObjective():void`; dùng lại `minimapVisible/toggleMinimap`, không thêm state collapsed song song. Anchor payload có optional `avoidRects: readonly {x:number;y:number;width:number;height:number}[]` cùng hệ CSS px canvas-relative.

- [ ] Tests ngưỡng 959/960 và 639/640; store toggle không đổi case/save, giữ qua scene transition, input lock no-op. Component tests launcher vẫn hiện khi thu, aria-expanded/focus, mở đủ objective/map; M bỏ qua typing. Anchor tests tránh target/player/HUD, không đủ chỗ trả null; E2E compact/letterbox/resize không che modal hoặc remount canvas.
- [ ] Chạy focused tests RED cho launcher/objective toggle và avoidance rectangles mới.
- [ ] Implement default một lần từ GameCanvas; objective/map mỗi loại một nút ≥44px, rộng mở/compact thu; resize không ghi đè lựa chọn. Bổ sung UI strings qua shared-types/schema/vi.json cho thu/mở mục tiêu. Bỏ CSS hide minimap khiến mất launcher.
- [ ] Implement prompt một hàng keycap E/nền giấy nhẹ; desktop `placeBubble` tránh `avoidRects` đã chuyển sang HUD coords cùng canvas offset. Compact hoặc không có chỗ dùng bottom safe zone; lock/transition clear prompt. Không đổi interaction radius/priority.
- [ ] Chạy store/anchor/HUD tests, `hud.spec.ts` và viewport E2E PASS; ảnh prompt sát cạnh/letterbox và HUD compact. Commit `feat(hud): collapse panels and compact interaction prompt`.

## Task 7: Cue evidence và cửa nhìn thấy từ xa

**Files:** nhóm Cue; shared-types scene/schema scene, hai JSON, `bridge/connectCaseEngine.ts` nếu cần sync lifecycle.

**Interfaces:** asset thêm optional `cue: {kind:'evidence';evidenceId:string;visibleWhen?:Condition} | {kind:'door';visibleWhen?:Condition}`; anchor từ visual asset đã resolved, door từ frame/floor entry. `WorldCueSource` có `visibleIds(sceneId:string): ReadonlySet<string>`; `createWorldCueSource(store:GameStore,definition:CaseDefinition):WorldCueSource` đọc state hiện tại, dùng `evaluateCondition` ở bridge. `WorldCueLayer` instance scene có `sync(visibleIds,nearestId,reducedMotion):void`, `destroy():void`.

- [ ] Test cue chỉ evidence có ID hợp lệ/door có transition, điều kiện false không hiện, reveal sau effect đúng; decorations không marker. Layer tests nearest cue không nhân đôi outline, reducedMotion không float, destroy dừng tween/xóa objects. Content tests dangling evidence/invalid door refs bị từ chối.
- [ ] Chạy focused tests RED cho source/layer/schema mới.
- [ ] Implement source injection từ GameCanvas → WorldScene; scene không tự evaluate case conditions. Gắn metadata evidence/doors trong JSON, sync eligible cues trước/trong radius; diamond nhỏ đúng palette, không che art/nhân vật, nearest dùng outline/prompt hiện hữu.
- [ ] Chạy tests/layout/world E2E PASS; thêm assertion screenshot-visible cues trước radius, condition-hidden cues không tồn tại, shutdown/restart không duplicate listeners/objects.
- [ ] Commit `feat(world): mark visible evidence and scene exits`.

## Task 8: Content audio và đủ asset tạo sẵn

**Files:** nhóm Audio asset; tạo `tools/audio-codegen/generate_dialogue.py`, `generate_sfx.py`, `requirements.txt`, `README.md`; `.gitignore`/`.prettierignore` ignore `.venv-audio-codegen/`. WAV/provenance dưới `apps/game-web/public/audio/case-001/`.

**Interfaces:** shared-types `DialogueAudio={url:string;textSha256:string}`, node `audio?:DialogueAudio`; `CaseAudioDefinition={sfx:Readonly<Record<AudioCue,readonly string[]>>}`, root case `audio?:CaseAudioDefinition`. `AudioCue='footstep'|'paper'|'ui'|'evidence'|'door'|'dialogue'`; shared-types/audio.ts export, index.ts re-export. URLs chỉ local `/audio/`, không `..`/external. Python `validate_assets(repo_root:Path)->list[str]` đọc content + WAV/provenance, trả lỗi rõ tree/node/file; không Node/fs trong runtime packages.

- [ ] Schema tests audio optional legacy, unsafe URL reject, cue footstep <2 variants reject; Node content validation kiểm all NPC nodes khi case khai báo audio. Python fixtures missing WAV/text hash lệch/duplicate clip sai speaker/truncated provenance phải fail; assert actual coverage 15/15 sau generation.
- [ ] Chạy schema và Python fixture tests RED khi contract/tool chưa có. Số nodes lấy từ content, không hardcode text vào generator; validator so cả tree/node identity.
- [ ] Implement DTO/schema và gate coverage. Khôi phục Kokoro dev-only tại `.venv-audio-codegen`, pin resolved packages/model/voice revisions và SHA-256 trong provenance; không sửa deps JS hoặc commit cache. Voice map: Anna `af_heart`, Leo `am_michael`, David `am_fenrir`, American English `lang_code='a'`, speed 1.0, WAV mono PCM16 24kHz; nguồn [Kokoro voices upstream](https://huggingface.co/hexgrad/Kokoro-82M/blob/main/VOICES.md).
- [ ] Generator đọc 15 node texts nguyên gốc, xuất clip tên từ speaker/tree/node; provenance lưu text, SHA-256 UTF-8, generator/model/voice revision/hash, WAV checksum/format/duration. Thêm audio refs vào `dialogues.json`, SFX map vào `case.json`. Sinh SFX original WAV với 2 footstep variants, paper/UI/evidence/door/dialogue nhẹ; không thay Phase 7 listening WAV.
- [ ] Chạy fixture tests, `validate_assets.py` và content validation PASS (15/15, hashes/format khớp). Nghe một clip dài và conditional node mỗi NPC, chọn gain không clipping; xuất samples để human audition cuối. Nếu chưa generation được, ghi blocker thực tế, không clip demo/metadata giả.
- [ ] Commit `feat(content): add prerecorded dialogue and sound assets`.

## Task 9: Audio owner, bước chân và thao tác thành công

**Files:** nhóm Audio owner; tạo `game/systems/footstepCadence.ts`; giữ audioController/listening API cũ.

**Interfaces:** typed bus event `audio:cue={cue:AudioCue}`. `createPresentationAudio(definition:CaseDefinition):PresentationAudio` trong `presentationAudio.ts`; owner có `playCue(cue:AudioCue):void`, `setListeningActive(active:boolean):void`, `stopVoice():void`, `dispose():void`; voice API bổ sung Task 10. Provider một instance per game root, `usePresentationAudio():PresentationAudio`. `advanceFootstep(state:{distancePx:number},actualDistancePx:number,locked:boolean):{state:{distancePx:number};emit:boolean}`: stride 42 projected pixels, locked reset; một cue/frame, discard backlog để không burst sau stall.

- [ ] Test 30/60/120 FPS cùng distance cho cùng số footsteps; wall zero displacement, pause/modal/dialogue/transition không cue, lock reset không burst. Owner mock Howler test master gain áp dụng, chọn xen kẽ 2 steps, volume cue ≤0.35, footsteps base 0.18/duck 0.06; listening active duck, dispose unload all. Store/bridge tests một cue/action thành công và rejected action không cue.
- [ ] Chạy focused tests RED cho owner/cadence/action event.
- [ ] Implement owner per root bằng Howler reuse, master volume qua `useMasterVolume` hiện có, không gọi global Howler.volume thêm owner. WorldScene tính actual displacement sau collision rồi cadence→bus, không dựa keydown; cleanup cadence khi lock/reset/shutdown.
- [ ] Emit cues ở boundary thành công: notebook/close paper, evidence open, pause/settings/HUD toggles ui, dialogue choice dialogue, transition door. Chủ sở hữu action duy nhất emit, không React rerender/hover/gõ input; direct store actions và bus route không double cue. Provider subscribe bus, unsubscribe/dispose khi unmount.
- [ ] Chạy focused bridge/store/audio tests PASS; audio-asset validator PASS; browser assert cue count khi đâm wall/đi tự do/toggle, game/learning state chỉ đổi theo action cũ.
- [ ] Commit `feat(audio): play footsteps and successful action cues`.

## Task 10: Voice theo node, replay và lifecycle

**Files:** nhóm Voice; cập nhật shared-types/UI strings/schema/vi.json cho replay voice, unavailable/blocked trạng thái ngắn.

**Interfaces:** owner thêm `playVoice(key:string,url:string):void`, `replayVoice():void`, `subscribeVoice(listener:(state:VoiceState)=>void):()=>void`; `VoiceState={status:'idle'|'loading'|'playing'|'ended'|'blocked'|'error';key:string|null}`. Key=session/tree/node, session generation riêng chống callback cũ. `useAudioPlayback` thêm optional `onPlayingChange:(playing:boolean)=>void`, dùng EvidenceModal báo owner listening active; không đổi listening telemetry/controls.

- [ ] Mock lifecycle tests đổi A→B khi A load chưa xong, close/scene/pause/unmount, late onload/playerror/end: A không play/restart, chỉ một voice; replay đúng current key. Fail/blocked vẫn text/choices, không loop; mute/master volume, listening duck/release và detach callback. Component test thao tác tiếp khi clip chưa hết không bị chặn.
- [ ] Chạy focused tests RED cho owner voice API/controls/lifecycle mới; giữ listening/evidence tests cũ làm regression.
- [ ] Implement generation guard, dừng/unload voice cũ trước clip mới; autoplay chỉ node trong session mở từ user interaction. DialogueLayer đọc node.audio từ content, controls subscribe owner, replay label/icon gọn; error/blocked có replay, không flow quiz hoặc popup cản điều tra. Pause dừng, resume không tự phát clip cũ; replay chủ động được.
- [ ] Wire `onPlayingChange` với listening owner, false khi pause/end/error/dispose; giảm footstep khi voice hoặc listening chơi, master gain tất cả. Không phải chờ clip kết thúc để chọn/đóng, không restart theo unrelated store render.
- [ ] Chạy audio/DialogueView/EvidenceModal tests và `feedback-audio.spec.ts` PASS: entry/conditional nodes, replay, nhanh đổi node, close, scene, mute, fake network 404, blocked playback. Browser test lifecycle dùng observable owner state qua test harness hiện hữu, không khẳng định nghe tốt chỉ từ screenshot/mock.
- [ ] Commit `feat(dialogue): play full English node voice with replay`.

## Task 11: Gate tổng thể, review và bàn giao nghiệm thu

**Files:** tạo `docs/ai/2026-09-30-phase-11e-feedback-polish-verification.md`, `...-final-review.md`; update plan checkbox/spec status theo bằng chứng; memory commit riêng cuối.

**Interfaces:** tiêu thụ deliverables Tasks 1–10; sản xuất ledger command/output, ảnh hai scene + compact/prompt, audio samples ba NPC/SFX, danh sách giới hạn còn lại. Human visual/audio acceptance riêng với technical gates.

- [ ] Chạy `npm run lint`, `npm run test`, `npm run build`, `npm run typecheck`, `npm run format:check`, `npm run memory:check`; chạy registered content validation trong test suite, Python art/audio suite và audio asset validator. Dán output/exit code vào verification, không dùng baseline để ghi pass mới; backend không đổi không báo dotnet đã chạy.
- [ ] Chạy full `npm run test:e2e -- --workers=1 --reporter=line`; repeat world/HUD/layout/feedback-minimap/audio suites 3 lần với một worker. Nếu fail dùng systematic-debugging, tái hiện/root cause rồi rerun nhóm bị ảnh hưởng; không tăng timeout để che lỗi. Lưu log/ảnh local trong `.superpowers/`.
- [ ] Native final review một reviewer mới theo `executing-plans`/`requesting-code-review`, sau khi các gates pass; sửa findings cần thiết và chạy lại tests liên quan. Không triển khai task bằng subagent hoặc mở thread mới. Review artifact lưu repo, không kết luận sạch khi reviewer còn chạy.
- [ ] Tạo screenshot Office/Archive ở 1280×720, compact 760×600, label floor/wall/prompt close-up; gửi mẫu WAV ít nhất một câu trọn vẹn mỗi NPC và hai steps/SFX. Xin human nghiệm thu visual/voice; technical-pass không thay cho audition. Backlog modal/header/breathing và Phase 12 vẫn tách rõ.
- [ ] Commit verification/review/plan status trước, cập nhật `docs/ai/MEMORY.md` với result commit rồi `npm run memory:check`, commit memory riêng. Chỉ đánh dấu task technical complete theo gate thực; Phase 11E chưa complete nếu backlog hoặc human acceptance còn thiếu.

## Tự review plan trước bàn giao

- Coverage: feedback 3–4 → Task 1; 9 → Task 2; 1 → Task 3; 2 → Task 4; 7 → Task 5; 8/10 → Task 6; 6 → Task 7; 5 → Tasks 8–10; nghiệm thu toàn bộ → Task 11.
- Contract: mount/cue/voice metadata optional cho compatibility; event tọa độ canvas CSS vs movement world pixels riêng; một HUD state/field, một owner audio/root, một voice/session generation.
- Các rủi ro trong Review Focus có test gắn task; TDD RED cần chứng minh logic thay đổi, không ép baseline hợp lệ fail. Không full function bodies, không checklist không có oracle.
- Những quyết định implementation mới (voice map, stride/gain, exact Archive spawn) cụ thể để review; không đổi product/learning rule. Mọi giá trị visual/audio cần kiểm ảnh/nghe, được điều chỉnh trong phạm vi spec khi nghiệm thu.
- Người dùng đã review và duyệt plan; gate written plan review đã đạt. Native được giữ nguyên; review độc lập cuối theo `executing-plans`.
