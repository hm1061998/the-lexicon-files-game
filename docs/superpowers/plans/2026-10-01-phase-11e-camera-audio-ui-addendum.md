# Phase 11E — Bổ sung camera, âm thanh và giao diện Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Dùng `superpowers:executing-plans` để triển khai plan task-by-task theo phương án Native đã được chọn. Theo dõi bằng checkbox (`- [ ]`).

**Goal:** Hoàn thiện phần feedback bổ sung cho Phase 11E bằng camera theo nhân vật, nhãn scene dễ đọc, ambience/footsteps có nguồn hợp lệ và cụm điều khiển dialogue/notebook gọn, dễ dùng.

**Architecture:** Phaser tiếp tục sở hữu camera và nhãn trong world; JSON scene giữ vị trí logical, projection và collision. Mở rộng `PresentationAudio`/Howler đang được `GameCanvas` sở hữu cho music và ducking, còn các lựa chọn UI tiếp tục đi qua React/store hiện có. Không thêm dependency hoặc state gameplay/persistence mới.

**Tech Stack:** TypeScript strict, React, Phaser, Howler, Zod, Vitest, Playwright, npm + Nx; âm thanh lưu local và có provenance.

**Spec:** [Addendum đã duyệt](../specs/2026-10-01-phase-11e-camera-audio-ui-addendum.md).

## Global Constraints

- Giữ hai scene Office/Archive, logical coordinate, projection dimetric 2:1, collision, interaction, minimap và typed event bus.
- Camera ưu tiên zoom khoảng 1.2× desktop/1.1× compact, follow mượt có dead-zone nhỏ; nếu camera view lớn hơn projected world bounds thì tăng tới mức fit tối thiểu cộng margin 0.005 để không lộ mép do rounding; không thêm zoom slider.
- Đặt nhãn trên mặt tường nhìn thấy; phong cách và palette theo `docs/art/06_PHASER_CHARACTER_SCENE_ASSET_MODEL_SPEC.md`.
- Dùng Howler/audio owner hiện có, master volume hiện có và browser gesture đầu tiên để mở playback music; ambience thấp, duck khi voice/listening, pause/mute/dispose đúng lifecycle.
- Audio asset mới phải ghi nguồn, license, tác giả, URL, checksum và attribution; chỉ chọn asset CC0 phù hợp sau khi nghe thử. Không dùng candidate Content ID Registered.
- Giữ cadence bước theo quãng đường; không phát khi đứng yên, bị chặn, trong modal hoặc scene transition.
- Giữ nguyên case/learning/save/backend/dialogue content; không thay wording hay flow. Không thay đổi prompt E đã xử lý trong plan gốc.
- UI dùng paper style hiện có, cỡ chữ tối thiểu 14px, nút ≥44px, focus visible, responsive và điều khiển bàn phím.
- Không thêm dependency; chạy npm + Nx. Không sửa runtime trong khi Playwright gate đang chạy; không stage `apps/game-web/debug.log`.
- Thực thi theo task; theo yêu cầu handoff ngày 2026-10-01, gom các task đã làm vào một implementation commit để người dùng tiếp tục sau. Commit memory riêng theo `docs/ai/README.md`; push branch `dev` theo yêu cầu rõ ràng của người dùng.

## Review Focus

1. Scene nhỏ hơn viewport hoặc nhân vật sát rìa: camera không lộ vùng ngoài world hay làm nhân vật mất khung — Task 1, `feedback-camera.spec.ts`.
2. Compact viewport và thay đổi kích thước: camera vẫn bám đúng player, dot minimap không lệch — Task 1, `feedback-camera.spec.ts` và `feedback-minimap.spec.ts`.
3. Autoplay bị chặn, voice/listening mở khi music đang chạy, mute/pause hoặc unmount: music không chồng tiếng, tự retry vô hạn hay sống sót qua scene/game cleanup — Task 3, `presentationAudio.test.ts` và `connectPresentationAudio.test.ts`.
4. Nguồn asset đổi hoặc thiếu file/checksum: provenance validator từ chối metadata không đầy đủ — Task 3, audio asset validation.
5. Nội dung hội thoại dài, viewport thấp, focus bàn phím hoặc translation mode đổi: controls không tràn/che text, vẫn truy cập và giữ nguyên hành vi học — Task 4, `dialogue.spec.ts`, notebook component tests và compact E2E.

## Bản đồ file

| Khu vực | File dự kiến | Trách nhiệm |
|---|---|---|
| Camera | `apps/game-web/src/game/scenes/WorldScene.ts`, `apps/game-web/src/game/systems/cameraFollow.ts` (tạo nếu tách được), unit tests, `apps/game-web/e2e/feedback-camera.spec.ts` (tạo) | Chọn zoom theo viewport, dead-zone/lerp, clamp bounds; không đổi world coordinate. |
| Nhãn | `packages/game-content/cases/case-001/scenes/main_office.json`, `apps/game-web/src/game/scenes/WorldScene.ts`, `apps/game-web/src/game/entities/createRoomLabel.ts`, `apps/game-web/src/game/entities/createNpcNameplate.ts` (tạo nếu component tách hợp lý), `apps/game-web/e2e/feedback-labels.spec.ts` | Chọn đoạn tường phù hợp cho nhãn Investigation; tạo nameplate NPC cùng style paper dossier. |
| Audio | `packages/shared-types/src/audio.ts`, `packages/game-content/src/schema/audio.ts`, `packages/game-content/cases/case-001/case.json`, `apps/game-web/src/audio/presentationAudio.ts`, `apps/game-web/src/bridge/connectPresentationAudio.ts`, `apps/game-web/src/game/GameCanvas.tsx`, `apps/game-web/public/audio/case-001/**`, `tools/audio-codegen/validate_assets.py` và test liên quan | Thêm một music loop, thay 2 footsteps bằng recording phù hợp, start sau gesture, duck/pause/cleanup. Giữ nguyên các cue và voice đang hoạt động. |
| HUD | `apps/game-web/src/dialogue/DialogueView.tsx`, `DialogueVoiceControls.tsx`, `dialogue.css`, `apps/game-web/src/notebook/NotebookPanel.tsx`, `notebook.css`, component/E2E tests | Nhóm translation/replay/evidence controls dễ quét; bảo đảm desktop, compact và accessibility. |
| Tích hợp | E2E hiện có `feedback-audio.spec.ts`, `feedback-viewport.spec.ts`, `dialogue.spec.ts`; root checks | Chụp visual QA 1280×720 và 760×600; chạy đầy đủ lint/test/build. |

## Tasks

### Task 1: Camera zoom và follow theo player

**Files:**
- Modify: `apps/game-web/src/game/scenes/WorldScene.ts`
- Create if useful: `apps/game-web/src/game/systems/cameraFollow.ts` và unit test tương ứng
- Test: `apps/game-web/e2e/feedback-camera.spec.ts`
- Update: `apps/game-web/e2e/feedback-minimap.spec.ts` nếu cần thêm đồng bộ khi camera di chuyển

**Interfaces:** dùng `projectWorldBounds`, `CameraView`, player sprite và `refreshCanvasSize` hiện có. Không sửa `worldToScreen` hoặc nguồn logical minimap.

- [x] **Step 1: Viết test thất bại** — assert zoom ưu tiên 1.2 desktop/1.1 compact khi bounds cho phép, fit zoom được tăng khi scene ngắn hơn camera view, camera target là player, scroll theo player và vẫn clamp tại bốn rìa scene.
- [x] **Step 2: Chạy test mới** — `npm run test -w @lexicon/game-web -- src/game/systems/cameraFollow.test.ts`; xác nhận fail vì hành vi follow/zoom mới chưa có.
- [x] **Step 3: Cài camera follow** — cấu hình zoom ưu tiên desktop 1.2, compact 1.1; nâng lên nếu cần fit `camera.width/sceneBounds.width` hoặc `camera.height/sceneBounds.height` + 0.005; dead-zone nhỏ theo viewport và lerp ổn định; giữ `setBounds` theo screen-projected `worldBounds`, cập nhật khi resize.
- [x] **Step 4: Chạy unit và E2E liên quan** — test camera và `feedback-minimap.spec.ts`; xác nhận player dot giữ nguyên logical position và không lộ mép world trong hai viewport yêu cầu.
- [x] **Step 5: Chụp ảnh kiểm tra** — thêm ảnh Office desktop/compact vào `.superpowers/sdd/2026-10-01-phase-11e-camera-audio-ui-addendum/` để so sánh framing và các landmark.
- [x] **Step 6: Commit** — gộp vào implementation handoff commit `feat(game): polish camera, audio, and investigation UI` theo yêu cầu gom phần đã làm để handoff.

### Task 2: Nhãn Phòng Điều Tra và nameplate NPC

**Files:**
- Modify: `packages/game-content/cases/case-001/scenes/main_office.json`
- Modify: `apps/game-web/src/game/scenes/WorldScene.ts`, `apps/game-web/src/game/entities/createRoomLabel.ts`
- Create: `apps/game-web/src/game/entities/createNpcNameplate.ts` và unit test nếu việc tách giúp tái sử dụng/đo kích thước chính xác
- Test: `apps/game-web/e2e/feedback-labels.spec.ts`

**Interfaces:** giữ scene label schema và `nameTagPosition`; dùng `LABEL_FONT_FAMILY`/palette từ constants và wall plane resolver hiện có.

- [x] **Step 1: Viết test thất bại** — assert nhãn Investigation có mount vào wall segment nhìn thấy và không giao tường vuông góc; assert nameplate lấy tên từ case content, có nền/viền paper style, vẫn tránh prompt và không che mặt NPC.
- [x] **Step 2: Chạy tests** — chạy scene schema/unit và `feedback-labels.spec.ts`, xác nhận assertion mới fail trước khi sửa.
- [x] **Step 3: Sửa content/visual** — chọn `wallId` và tọa độ trong vùng tường hở theo geometry hiện có; thay text mặc định bằng nameplate paper nhỏ, font theo art/06, contrast rõ, viền mực mảnh và không dùng investigation-red cho tên.
- [x] **Step 4: Chạy unit/E2E** — test label texture cleanup, nameplate positioning và ảnh desktop/compact; xác nhận tag vẫn đọc được ở zoom mới.
- [x] **Step 5: Commit** — gộp vào implementation handoff commit `feat(game): polish camera, audio, and investigation UI`.

### Task 3: Ambience CC0, footsteps thực và lifecycle audio

**Files:**
- Modify audio types/schema trong `packages/shared-types` và `packages/game-content/src/schema/audio.ts`
- Modify: `packages/game-content/cases/case-001/case.json`
- Modify: `apps/game-web/src/audio/presentationAudio.ts`, `apps/game-web/src/bridge/connectPresentationAudio.ts`, `apps/game-web/src/game/GameCanvas.tsx`
- Replace/add local assets trong `apps/game-web/public/audio/case-001/` và cập nhật `provenance.json` cùng validator asset audio đang có
- Test: `apps/game-web/src/audio/presentationAudio.test.ts`, `apps/game-web/src/bridge/connectPresentationAudio.test.ts`, schema/asset validation tests

**Interfaces:** mở rộng `CaseAudioDefinition` trong `packages/shared-types/src/audio.ts` với một music URL local tùy chọn; mở rộng `PresentationAudio` bằng hành vi rõ ràng để khởi động music từ trusted gesture và set pause/listening state. Không thêm bus event, Settings state hoặc API backend.

- [ ] **Step 1: Nghe và kiểm candidate** — tải/thử candidate CC0 từ OGA spec hoặc tìm candidate CC0 khác nếu không hợp; kiểm giấy phép, nghe cả đầu/cuối để loop, nghe footstep để xác nhận nền cứng, tính SHA-256 và ghi metadata. Không tích hợp nếu quyền hoặc chất lượng không xác minh được.
- [x] **Step 2: Viết tests thất bại** — Howler mocks kiểm tra music không bắt đầu trước gesture; bắt đầu một lần sau pointer/keyboard gesture; loop; volume ambience thấp; duck khi voice/listening phát; pause/resume với app pause; tôn trọng master mute/volume; unload khi dispose; missing/failed asset không chặn gameplay. Validator từ chối thiếu provenance/checksum.
- [x] **Step 3: Chạy tests mới** — `npm run test -w @lexicon/game-web -- src/audio/presentationAudio.test.ts` và test schema/validator liên quan; xác nhận fail ở lifecycle/validation cần bổ sung.
- [x] **Step 4: Cài audio owner** — giữ một music Howl; nhận trusted gesture từ `GameCanvas` trong capture phase và gọi owner đồng bộ trong event handler; theo dõi voice/listening/store pause qua bridge; dùng master Howler hiện tại; cleanup listener, callback và Howl khi disconnect/dispose. Thay URLs của hai sample footstep bằng recordings CC0, giữ cadence `advanceFootstep` và số variants tối thiểu hiện tại.
- [x] **Step 5: Chạy test audio/schema** — đảm bảo các bài test cue, voice replay, lỗi voice, listening và scene cleanup hiện tại vẫn pass; validator asset xác minh checksum/format/provenance mới.
- [x] **Step 6: Chạy E2E audio** — kiểm dialogue/listening đang phát, scene transition, pause/resume và thao tác đầu tiên cho autoplay; gameplay tiếp tục hoạt động nếu trình duyệt từ chối music.
- [x] **Step 7: Commit** — gộp vào implementation handoff commit `feat(game): polish camera, audio, and investigation UI`.

### Task 4: Tối ưu controls dialogue và notebook

**Files:**
- Modify: `apps/game-web/src/dialogue/DialogueView.tsx`, `DialogueVoiceControls.tsx`, `dialogue.css`
- Modify: `apps/game-web/src/notebook/NotebookPanel.tsx`, `notebook.css`
- Test: `DialogueView.test.tsx`, `NotebookPanel.test.tsx`, `apps/game-web/e2e/dialogue.spec.ts` và E2E compact liên quan

**Interfaces:** giữ props/callback store hiện có cho `TranslationMode`, replay voice, inspect/review evidence và audio playback; không thêm learning flow hay persistent UI state.

- [x] **Step 1: Viết test thất bại** — kiểm tra nhóm mode dịch có label/selected state rõ, voice replay có playback status/accessibility label, evidence/audio actions cùng nhóm; ở viewport 760×600 và viewport cao thấp, không có overflow ngang, text/choice vẫn đọc được và các nút focus/keyboard dùng được.
- [x] **Step 2: Chạy component/E2E tests** — chạy các test mới và `dialogue.spec.ts`, xác nhận fail vì hierarchy/layout chưa đạt.
- [x] **Step 3: Cập nhật hierarchy và responsive styles** — cụm mode dịch thành segmented group có label; voice/evidence/replay gom theo một toolbar compact; wrap có trật tự trên nhỏ; giới hạn vùng cuộn trong panel; không đổi copy hoặc thứ tự/logic lựa chọn.
- [x] **Step 4: Chạy test UI** — component tests cho mode/status/actions và Playwright cho focus trap, keyboard, 1280×720, 760×600, viewport thấp.
- [x] **Step 5: Chụp ảnh kiểm tra** — thêm ảnh dialogue/notebook desktop và compact vào thư mục `.superpowers/sdd/2026-10-01-phase-11e-camera-audio-ui-addendum/`.
- [x] **Step 6: Commit** — gộp vào implementation handoff commit `feat(game): polish camera, audio, and investigation UI`.

### Task 5: Tích hợp, nghiệm thu và memory handoff

**Files:**
- Update: `apps/game-web/e2e/feedback-camera.spec.ts`, `feedback-labels.spec.ts`, `feedback-audio.spec.ts`, `feedback-viewport.spec.ts` theo regression tìm thấy
- Create: `docs/ai/2026-10-01-phase-11e-camera-audio-ui-addendum-verification.md`
- Update: plan này và `docs/ai/MEMORY.md` theo protocol hiện hành

- [x] **Step 1: Chạy E2E toàn game** — `npm run test:e2e -- --workers=1 --reporter=line`; xác nhận camera, minimap, markers, gameplay, NPC dialogue, notebook và audio đều hoạt động.
- [x] **Step 2: Chạy quality gates** — `npm run lint`, `npm run test`, `npm run build`, `npm run typecheck`, `npm run format:check`, `npm run memory:check`; backend không đổi nên không chạy dotnet.
- [ ] **Step 3: Review ảnh/audio/artifact** — kiểm tra ảnh ở 1280×720/760×600 và nghe music/footsteps; đối chiếu checksum/license; không gọi phase này complete nếu asset chưa có provenance hoặc visual/audio gate chưa đạt.
- [x] **Step 4: Ghi verification và cập nhật checkbox** — lưu summary output, tài sản/provenance và hạn chế còn lại; plan ghi kết quả thực tế.
- [x] **Step 5: Commit kết quả** — plan, code và verification cùng implementation handoff commit; cập nhật MEMORY ở commit kế tiếp và chạy `npm run memory:check`.

## Tự rà soát plan

- **Độ phủ spec:** zoom/follow/bounds/compact ở Task 1; nhãn tường/nameplate ở Task 2; music/gesture/duck/pause/mute/dispose và realistic footsteps/provenance ở Task 3; dialogue/notebook translation/evidence/audio controls ở Task 4; screenshots 1280×720/760×600 và full gates ở Task 5. Prompt chứng cứ đã thu thập được xử lý trong phase 11E gốc.
- **Thứ tự:** Tasks 1–4 tạo deliverable riêng nhưng dùng interface hiện hữu; Task 5 chỉ tích hợp/regression sau khi thay đổi runtime xong.
- **Tính nhất quán:** schema music là optional để các case cũ hợp lệ; audio owner quản lý lifecycle, store/bridge chỉ truyền trạng thái pause; camera không đổi nguồn minimap.
- **Review focus:** năm tình huống ở trên đều gắn với test tại task sở hữu.
- **Tỉ lệ:** plan nêu interface/test/gate và ranh giới file, không viết sẵn implementation body.

## Execution Handoff

Spec và plan đã được người dùng duyệt; implementation Tasks 1–4, quality gates và verification đã hoàn thành. Còn chờ người dùng nghe thử ambience/footsteps và xem lại screenshots trước khi đóng Phase 11E. Phase 12 chưa bắt đầu.

## Tiếp tục phiên 2026-10-01

- [x] Đối chiếu memory với Git và remote thật: `origin/dev` đã có `85229df`; thông tin chờ push cũ không còn đúng cho implementation trước.
- [x] Đóng phần kỹ thuật của prior partial review: reviewer độc lập xác nhận tám sửa lỗi cũ, không còn Critical/Important.
- [x] Sửa hai Minor: status giọng đọc đạt 14px; fixture voice có cấu trúc `DialogueAudio` hợp lệ và assert URL.
- [x] Bổ sung E2E camera kiểm bounds/player ở bốn rìa của Office/Archive, cả 1280×720 và 760×600.
- [x] Theo phản hồi người dùng, thay Project Utopia bằng Mystical Piano CC0, hướng thư giãn; cập nhật provenance và source/output hashes.
- [x] Chạy E2E toàn game trước sửa (114/114), rồi các suite ảnh hưởng sau sửa (7/7); audio validator và Python tests 6/6.
- [ ] Người dùng nghiệm thu bản nhạc thay thế và hình ảnh; giữ Phase 11E mở.
