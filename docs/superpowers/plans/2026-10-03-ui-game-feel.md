# Phần 4b — Cảm giác game — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Biến hội thoại thành cảnh thẩm vấn, bài nghe thành thao tác trên máy ghi âm, và thống nhất mọi nút của phần 1–4 thành ba loại có trạng thái, âm thanh và con trỏ riêng.

**Architecture:** Primitive và âm thanh nằm ở tầng chung (`packages/ui` chỉ gắn `data-sfx`; game-web có một listener phát âm), logic mới là hàm thuần có test (`revealCount`, `isChoiceSeen`, `dialogueCameraTarget`, peaks). Phaser chỉ nghe event bus có sẵn (`dialogue:started/ended`) để zoom camera; dữ liệu nhật ký hội thoại sống trong store, không vào save.

**Tech Stack:** TypeScript strict, React 18, Phaser 3.88, Zustand, Howler (đã có), Vitest, Playwright; Python (numpy + Pillow, unittest) trong `.venv-art-codegen`; Node ESM không dependency cho peaks.

**Spec:** `docs/superpowers/specs/2026-10-03-ui-game-feel-design.md` (đã duyệt 03/10/2026).

## Global Constraints

- npm + Nx; không thêm dependency npm/pip. Node 22 theo `docs/ai/MEMORY.md`.
- Âm thanh UI chỉ từ bộ CC0 có sẵn, kiểm giấy phép từng file, ghi `apps/game-web/public/audio/ui/provenance.json`; không tự tổng hợp (G-3). Thiếu âm → báo người dùng.
- Không đổi `game-core`, `learning-engine`, `dialogueRunner`, `answerListeningTask`, save version, Condition/Effect, event bus (chỉ dùng event có sẵn), phím toàn cục J/B/M/Esc.
- Guardrail AGENTS.md §6: không timer ép trả lời, sai không phạt (chuỗi "This interpretation doesn't match the evidence."), đỏ chỉ đúng chỗ.
- Chữ ≥ 14px; Xanh Mono ≥ 18px; focus 3px `--lexicon-dark-red` offset 3px; bóng blur ≤ 6px alpha ≤ 25%.
- Chuyển động: mở 220ms, đóng 160ms, lần lượt 40ms, camera 400ms; tắt hết khi `reducedMotion` hoặc `prefers-reduced-motion`.
- Phím tắt mới bỏ qua khi focus ở `input`/`textarea`/`contenteditable` (dùng `shouldHandleShortcut` hiện có).
- UI string mới thêm vào `packages/game-content/ui/vi.json` + `packages/game-content/src/schema/ui.ts`; text/ID của case chỉ nằm trong content.
- Phạm vi chuyển nút (spec §6.2): `hud/*`, `title/*`, `pause/*`, `briefing/*`, `conclusion/CaseSummaryScreen.tsx`, `onboarding/*`, `dialogue/*`, `evidence/*`, `vocabulary/*`, `game/GameCanvas.tsx`. Không đụng `notebook/*`, `deduction/*`, `investigation/*`, `conclusion/AccusationPanel.tsx`.
- Mỗi task một commit; `git add` đường dẫn cụ thể; không push. Báo cáo: `docs/ai/2026-10-03-ui-game-feel-verification.md`.

## Đầu vào cần người dùng (chặn Task 3b)

Mạng của cả máy ảo cục bộ và sandbox cloud **không truy cập được** kenney.nl và opengameart.org (đã thử 03/10/2026, proxy từ chối). Người dùng tải và giải nén vào `assets/_incoming/audio/`:

1. Kenney **Interface Sounds** (CC0) → `assets/_incoming/audio/kenney-interface-sounds/`
2. Kenney **RPG Audio** (CC0, có tiếng sách/giấy) → `assets/_incoming/audio/kenney-rpg-audio/`
3. (Tuỳ chọn) một tiếng băng cassette chạy CC0 từ OpenGameArt, kèm URL trang nguồn → `assets/_incoming/audio/oga-tape/`

Các task khác không phụ thuộc vào bước này; khi chưa có file, manifest âm thanh UI rỗng và game im lặng, không lỗi.

## Review Focus

1. Người chơi bấm Space liên tục rất nhanh khi chữ đang hiện: không bỏ qua lựa chọn, không chọn nhầm, không chạy lặp sang node sau. (Task 5)
2. Đóng hội thoại giữa lúc camera đang tween: camera về đúng zoom/follow cũ, không kẹt ở zoom 1,2. (Task 5)
3. Mở nhật ký (L) khi đang có modal vật chứng hoặc tạm dừng: không mở chồng, focus không thoát. (Task 6)
4. Máy ghi âm bị đóng khi đang phát: âm thanh và tiếng băng lặp dừng ngay, không rò listener/RAF. (Task 7)
5. `uiSounds=false` hoặc volume 0: không có âm nào phát kể cả con dấu và tiếng băng. (Task 3a)

---

## Định danh chung

| Loại | Giá trị |
| --- | --- |
| Settings v2 | `{ schemaVersion: 2; translationMode; volume; subtitles; reducedMotion; textSpeed: 'instant' \| 'normal' \| 'fast'; uiSounds: boolean }`; mặc định `textSpeed: 'normal'`, `uiSounds: true`; `TEXT_SPEED_CPS = { normal: 45, fast: 90 }` |
| `data-sfx` | `'press' \| 'paper-open' \| 'paper-close' \| 'pen' \| 'stamp' \| 'tab' \| 'device-click'`; `'tape-loop'` chỉ phát qua API, không qua `data-sfx` |
| Manifest âm UI | `apps/game-web/src/audio/uiSoundManifest.ts`: `export const UI_SOUND_FILES: Partial<Record<UiSoundId, string>>` (URL `/audio/ui/<id>.ogg`) |
| Primitive mới | `PaperButton`, `DeviceKey` (`packages/ui/src/primitives/`) |
| Store mới | `dialogueLog: readonly DialogueLogEntry[]` (`{ npcId; treeId; nodeId }`), `dialogueLogOpen: boolean`, `toggleDialogueLog()`, `closeDialogueLog()` |
| Debug hook | `cameraZoom(): number`, `cameraBaseZoom(): number` |
| Content | `npcs.json` → `portrait?: { default: string } & Record<string, string>`; ảnh `apps/game-web/public/assets/portraits/<npc>.png` 240×300 |
| Peaks | `<audio>.peaks.json` = `{ "version": 1, "bars": number[64] }`, giá trị 0–1 làm tròn 3 chữ số |

---

### Task 0: Baseline và bộ chụp ảnh

**Files:** Create `apps/game-web/e2e/ui-game-feel-shots.spec.ts`, `docs/ai/2026-10-03-ui-game-feel-verification.md`.

- [ ] **Step 1:** Chạy `npm run lint`, `npm run test`, `npm run build`, `npm run test:e2e`; ghi danh sách đỏ có sẵn (kỳ vọng 17 E2E, 1 pytest) vào báo cáo.
- [ ] **Step 2:** Viết spec chụp ảnh theo mẫu `ui-dialogue-evidence-shots.spec.ts`, chạy khi đặt `UI_SHOTS_DIR`: `dialogue`, `dialogue-log` (bỏ qua ở "before"), `listening`, `evidence`, `title`, `pause` × 1920×1080, 1280×720, 760×600, 390×844.
- [ ] **Step 3:** Chụp "before" vào `docs/ai/playtests/2026-10-03-ui-game-feel/before/`; chạy `FPS_PROBE=1` ba lần, ghi baseline.
- [ ] **Step 4:** Commit `test(e2e): game-feel screenshot spec and baseline`.

### Task 1: Settings v2

**Files:** Modify `apps/game-web/src/persistence/settingsSchema.ts`, `settingsSchema.test.ts`, `settingsRepository.ts`, `connectSettingsAutosave.ts`, `apps/game-web/src/state/settingsStore.ts`, `apps/game-web/src/pause/SettingsFields.tsx` (+ test), `packages/game-content/src/schema/ui.ts`, UI strings `vi`; `apps/game-web/e2e/journeyHelpers.ts` (helper `useInstantText(page)`).

**Interfaces:**
- Produces: `SettingsV2`, `parseSettings(raw: unknown): SettingsV2` (nhận v1 hoặc v2; v1 → điền mặc định), `createDefaultSettings(...)` trả v2; store actions `setTextSpeed(speed)`, `setUiSounds(on)`.

- [ ] **Step 1: Test đỏ** — v1 hợp lệ parse thành v2 với `textSpeed: 'normal'`, `uiSounds: true`, giữ nguyên bốn trường cũ; v2 hợp lệ giữ nguyên; `textSpeed: 'slow'` bị từ chối; `SettingsFields` render nhóm chọn tốc độ chữ (3 lựa chọn) và công tắc âm thanh UI.
- [ ] **Step 2:** `npx vitest run apps/game-web/src/persistence apps/game-web/src/pause` — FAIL.
- [ ] **Step 3:** Cài đặt; repository ghi lại bản v2 sau khi đọc v1. Thêm UI strings (`packages/game-content/ui/vi.json` + `schema/ui.ts`) `settingsTextSpeed`, `textSpeedInstant`, `textSpeedNormal`, `textSpeedFast`, `settingsUiSounds`.
- [ ] **Step 4:** Test PASS. Helper E2E `useInstantText(page)` ghi settings v2 với `textSpeed: 'instant'` trước khi mở game; áp dụng cho `openWorld` mặc định (R-2). Chạy `e2e/settings.spec.ts` — PASS.
- [ ] **Step 5:** Commit `feat(settings): v2 with text speed and UI sounds`.

### Task 2: `PaperButton`, `DeviceKey`, con trỏ

**Files:** Create `packages/ui/src/primitives/PaperButton.tsx`, `paper-button.css`, `DeviceKey.tsx`, `device-key.css`, `cursors.css`; modify `InkButton.tsx`, `primitives.test.tsx`, `packages/ui/src/index.ts`; modify `tools/art-codegen/build_ui_materials.py` + test (con trỏ); output `apps/game-web/public/assets/ui/cursor_magnifier.png`, `cursor_pen.png`, `cursor_hand.png`; `assets/PROVENANCE.md`.

**Interfaces:**
- Produces: `PaperButton(props: ButtonHTMLAttributes<HTMLButtonElement> & { sfx?: SfxId })` class `paper-button`, `data-sfx` mặc định `press`; `DeviceKey(props: ButtonHTMLAttributes<HTMLButtonElement> & { icon: ReactNode; label: string; pressed?: boolean; sfx?: SfxId })` class `device-key`, `aria-pressed` khi có `pressed`, `data-sfx` mặc định `device-click`; `InkButton` thêm prop `sfx` (mặc định `press`). `type SfxId` export từ `packages/ui`. `cursors.css` định nghĩa `.cursor-world`, `.cursor-paper`, và nút dùng `cursor_hand` (hotspot magnifier 11 11, pen 2 30, hand 10 2).
- Python: `render_cursor(kind: Literal['magnifier','pen','hand']) -> Image` 32×32, nền trong suốt.

- [ ] **Step 1: Test đỏ** — render ra đúng class và `data-sfx`; `sfx="stamp"` ghi đè; `DeviceKey pressed` có `aria-pressed="true"`; nút `disabled` vẫn có `data-sfx` (listener tự bỏ qua). Python: ba cursor 32×32, góc xa hotspot trong suốt.
- [ ] **Step 2:** Chạy vitest + pytest — FAIL.
- [ ] **Step 3:** Cài đặt trạng thái: hover nhấc 1px + `--lexicon-shadow-lift`; nhấn lún `InkButton` 1px, `PaperButton` 2px, `DeviceKey` 4px; vô hiệu `opacity: .45`; focus token chung. Gắn `.cursor-paper` cho `PaperSheet`/`ModalSheet`, `.cursor-world` cho vùng canvas trong game-web.
- [ ] **Step 4:** Test PASS; commit `feat(ui): paper and device buttons with shared states and custom cursors`.

### Task 3a: Hệ thống âm thanh UI

**Files:** Create `apps/game-web/src/audio/uiSound.ts`, `uiSound.test.ts`, `uiSoundManifest.ts`, `useUiSoundDelegation.ts`; modify `apps/game-web/src/App.tsx` (gắn delegation một lần ở gốc).

**Interfaces:**
- Consumes: settings v2 (`uiSounds`, `volume`); `HowlFactory` từ `audioController.ts`.
- Produces: `createUiSound(options: { files: Partial<Record<UiSoundId, string>>; factory?: HowlFactory; enabled: () => boolean; volume: () => number }): { play(id: UiSoundId): void; startLoop(id: 'tape-loop'): void; stopLoop(): void; dispose(): void }`; `type UiSoundId = SfxId | 'tape-loop'`; `sfxForEvent(target: EventTarget | null): SfxId | null` — tìm `closest('[data-sfx]')`, trả `null` khi phần tử `disabled` hoặc `aria-disabled="true"`; `useUiSoundDelegation(rootRef, uiSound)` nghe `pointerdown` và `keydown` (Enter/Space) ở pha capture.

- [ ] **Step 1: Test đỏ** — `sfxForEvent` trả `null` cho nút disabled/aria-disabled và cho phần tử không có `data-sfx`; `play` không gọi factory khi `enabled()` false hoặc `volume()` 0 hoặc id không có trong `files`; volume Howl = `volume()/100 * 0.6`; `startLoop` hai lần chỉ tạo một Howl `loop: true`; `stopLoop`/`dispose` dừng và unload.
- [ ] **Step 2:** `npx vitest run apps/game-web/src/audio/uiSound.test.ts` — FAIL.
- [ ] **Step 3:** Cài đặt; `UI_SOUND_FILES = {}` (rỗng cho đến Task 3b).
- [ ] **Step 4:** Test PASS; commit `feat(audio): global UI sound service driven by data-sfx`.

### Task 3b: Tệp âm thanh CC0 (chặn bởi người dùng)

**Files:** Create `tools/audio-codegen/import_ui_sounds.py` (+ test), output `apps/game-web/public/audio/ui/*.ogg`, `apps/game-web/public/audio/ui/provenance.json`; modify `uiSoundManifest.ts`.

**Interfaces:** `import_ui_sounds.py --map map.json`: `map.json` (commit trong `tools/audio-codegen/ui_sound_map.json`) ánh xạ `UiSoundId` → `{ source: <đường dẫn trong assets/_incoming/audio>, pack, url, license: "CC0-1.0", trimMs?, gainDb? }`; script dùng `ffmpeg` (đã có ở máy) để cắt/chuẩn hóa về -16 LUFS ±1, mono 44,1 kHz, Ogg Vorbis q4, và ghi `provenance.json` gồm SHA-256 nguồn và kết quả.

- [ ] **Step 1:** Kiểm thư mục `assets/_incoming/audio/`; nếu chưa có gói nào, dừng task, ghi "chờ người dùng" vào báo cáo và chuyển Task 4 (không chặn các task sau).
- [ ] **Step 2:** Chọn file cho 8 id (ưu tiên: Interface Sounds cho `press`/`tab`/`device-click`; RPG Audio cho `paper-open`/`paper-close`/`pen`/`stamp`; `tape-loop` từ OGA nếu có). Đọc `License.txt` của từng gói, xác nhận CC0. Id không có ứng viên → liệt kê cho người dùng, để trống trong manifest.
- [ ] **Step 3: Test đỏ** — test Python: mọi id trong `ui_sound_map.json` có file đầu ra, `provenance.json` có đủ khóa, license đều `CC0-1.0`.
- [ ] **Step 4:** Chạy script; test PASS; điền `UI_SOUND_FILES`.
- [ ] **Step 5:** Commit `feat(audio): CC0 UI sound set with provenance`.

### Task 4: Chân dung NPC

**Files:** Modify `packages/shared-types/src/dialogue.ts` (`NPCDefinition.portrait?`), `packages/game-content/src/schema/dialogue.ts` (`npcSchema`), `packages/game-content/cases/case-001/npcs.json`, `case-002/npcs.json`; create `tools/art-codegen/build_portraits.py` + `test_build_portraits.py`; output `apps/game-web/public/assets/portraits/{anna,leo,david}.png`; create `apps/game-web/src/dialogue/Portrait.tsx` (+ test); `assets/PROVENANCE.md`.

**Interfaces:**
- Produces: schema `portrait: z.object({ default: assetPath }).catchall(assetPath).optional()`; `Portrait({ npcName: string; src?: string; reducedMotion: boolean })` — có `src` thì `<img alt="">` trong khung ảnh dán; lỗi tải hoặc không có `src` → thẻ chữ cái đầu (`npcName` tách theo khoảng trắng, tối đa 2 chữ cái).
- Python: `render_portrait(sprite: Image) -> Image` 240×300 (crop theo bbox alpha phần trên 55%, phóng LANCZOS, sepia + làm đậm biên bằng Sobel, nền giấy `#cdba97`); `build(out_dir) -> list[Path]` đọc `chr_<npc>_idle_sw.png`.

- [ ] **Step 1: Test đỏ** — schema nhận `portrait` hợp lệ, từ chối đường dẫn không bắt đầu `/assets/`; case không có `portrait` vẫn hợp lệ; `Portrait` không `src` render "AR" cho "Anna Reed"; Python: cùng đầu vào cùng bytes, kích thước 240×300.
- [ ] **Step 2:** FAIL; **Step 3:** cài đặt, sinh ảnh, thêm `portrait.default` cho 3 NPC ở hai case; **Step 4:** PASS (`npm run test -w @lexicon/game-content`, check-case-flow hai case `closable=true`).
- [ ] **Step 5:** Commit `feat(content): NPC portraits generated from sprites`.

### Task 5: Hội thoại dạng cảnh

**Files:** Create `apps/game-web/src/dialogue/revealCount.ts`, `isChoiceSeen.ts` (+ tests), `useTextReveal.ts`, `DialogueBand.tsx`, `dialogue-band.css`; modify `DialogueLayer.tsx`, `DialogueView.tsx` (thay bằng `DialogueBand` hoặc giữ tên và đổi nội dung), `DialogueVoiceControls.tsx`, `apps/game-web/src/hud/Hud.tsx`/`hud.css` (ẩn khi `dialogueSession`), `apps/game-web/src/vocabulary/VocabularyText.tsx` (prop `revealedChars?: number`); create `apps/game-web/src/game/systems/dialogueCamera.ts` (+ test); modify `apps/game-web/src/game/scenes/WorldScene.ts` (zoom/follow, ẩn nhãn + cue khi hội thoại, debug hook); e2e `apps/game-web/e2e/dialogue.spec.ts`.

**Interfaces:**
- Produces:
  - `revealCount(elapsedMs: number, charsPerSecond: number, length: number): number` — `Math.min(length, Math.floor(elapsedMs * cps / 1000))`; `cps` vô hạn (`instant`) → `length`.
  - `isChoiceSeen(choice: DialogueChoice, target: DialogueNode | undefined, flags: Readonly<Record<string, boolean>>): boolean` (spec §4.4).
  - `useTextReveal(text: string, speed: TextSpeed, reducedMotion: boolean): { shown: number; done: boolean; finish(): void }` — `reducedMotion` không ép `instant` (tốc độ chữ là lựa chọn riêng).
  - `dialogueCameraTarget(args: { player: Point; npc: Point; view: { width: number; height: number }; bounds: Rect; zoom: number }): Point` — trung điểm, kẹp sao cho khung nhìn ở `zoom` nằm trong `bounds`.
  - Phím trong dải: `1`–`9` chọn lựa chọn thứ n (chỉ khi `done`); Space/E/Enter: chưa `done` → `finish()`, đã `done` và đúng một lựa chọn → chọn nó; nhiều lựa chọn → không làm gì.
  - WorldScene: lưu `{ zoom, following }` khi `dialogue:started`, `stopFollow`, tween zoom `base × 1.2` và `pan` tới target 400ms (instant nếu `reducedMotion`); `dialogue:ended` hoặc shutdown giữa tween → dừng tween, khôi phục zoom và `startFollow` cũ.

- [ ] **Step 1: Test đỏ** — `revealCount` (0 ms → 0; vượt độ dài → length; instant → length); `isChoiceSeen` (không flag → false; một flag đã true → true; một trong hai flag chưa true → false; flag do node đích ghi cũng tính); `dialogueCameraTarget` kẹp đúng ở mép bounds; `DialogueBand` (renderToString) có chân dung, tên, chức danh, khu vực `aria-live` chứa toàn câu, các lựa chọn có keycap số, lựa chọn đã hỏi có class `dialogue-choice--seen` và chữ `strings.dialogueChoiceSeen`.
- [ ] **Step 2:** FAIL.
- [ ] **Step 3:** Cài đặt bố cục spec §4.1 (dải ≥ 260px ở 1280×720, Literata 24px, nhãn "ĐANG THẨM VẤN"); ghi chú tay góc phải lấy các statement đã ghi của NPC đang nói (cùng nguồn với sổ tay); `sfx="pen"` khi chọn; chuyển động mở 220ms.
- [ ] **Step 4:** Test PASS. E2E: với `textSpeed: 'normal'` (riêng test này), Space lần đầu hiện hết câu, phím `2` chọn lựa chọn thứ hai; nhấn Space 10 lần liên tục không đi quá một node khi có nhiều lựa chọn; `cameraZoom() / cameraBaseZoom()` ≈ 1,2 (±0,02) khi mở, về 1,0 sau đóng, kể cả đóng ngay (Esc) trong 100ms đầu. Chạy `dialogue.spec.ts`, `journey.spec.ts`, `case-002.spec.ts` — PASS.
- [ ] **Step 5:** Commit `feat(dialogue): interrogation band with portrait, text reveal, numbered choices and camera push-in`.

### Task 6: Nhật ký hội thoại (L)

**Files:** Modify `apps/game-web/src/state/gameStore.ts` (+ test); create `apps/game-web/src/dialogue/DialogueLog.tsx`, `dialogue-log.css`, `useDialogueLogShortcut.ts` (+ tests); UI strings.

**Interfaces:**
- Produces: store như "Định danh chung"; `startDialogue` và `chooseDialogue` thành công thì thêm entry của node vừa vào (không thêm trùng liền kề); `toggleDialogueLog` chỉ mở khi không có modal vật chứng, tạm dừng, sổ tay hay bảng suy luận đang mở; `closeDialogueLog` khi mở các modal đó. `DialogueLog` là cột phải 360–420px, nhóm theo NPC, câu mới nhất ở dưới, focus trap, Esc/L đóng và trả focus.

- [ ] **Step 1: Test đỏ** — store: hai lần chọn tạo hai entry đúng thứ tự; mở lại cùng node không nhân đôi; `toggleDialogueLog` không mở khi `notebookOpen`; save serialize không chứa `dialogueLog`. Component: nhóm theo tên NPC, hiển thị text node từ content.
- [ ] **Step 2:** FAIL; **Step 3:** cài đặt; **Step 4:** PASS + E2E: L mở/đóng trong và ngoài hội thoại; L khi đang mở vật chứng không làm gì.
- [ ] **Step 5:** Commit `feat(dialogue): L-key conversation log`.

### Task 7: Bàn vật chứng và máy ghi âm

**Files:** Create `tools/audio-codegen/build_peaks.mjs`, `build_peaks.test.mjs`; output `apps/game-web/public/audio/case-001/leo-phone-recording.wav.peaks.json`; modify `apps/game-web/src/audio/audioController.ts`, `useAudioPlayback.ts` (+ tests); create `apps/game-web/src/evidence/CassetteRecorder.tsx`, `cassette-recorder.css`, `useRecorderShortcuts.ts` (+ tests); modify `EvidenceModal.tsx`, `ListeningTaskPanel.tsx`, `evidence.css`; e2e `listening.spec.ts`.

**Interfaces:**
- Produces:
  - `node tools/audio-codegen/build_peaks.mjs [files...]` (mặc định: mọi `.wav` có `listeningTasks.audioAsset` của các case) — WAV PCM16 → 64 cột RMS chuẩn hóa theo max, làm tròn 3 chữ số; WAV khác PCM16 → lỗi rõ ràng, exit 1.
  - `AudioController.getProgress(): number` (0–1); `useAudioPlayback` trả thêm `progress`, cập nhật bằng RAF chỉ khi `playing`, hủy RAF khi dừng/unmount.
  - `CassetteRecorder({ state, progress, timestamp, peaks, onPlayPause, onRestart, onHint, onTranscript, hintOpen, transcriptOpen, reducedMotion, strings })` — 4 `DeviceKey`, LCD `mm:ss` của tiến độ; `peaks` null → không vẽ sóng; khi `state === 'playing'` gọi `uiSound.startLoop('tape-loop')`, ngược lại `stopLoop()`.
  - `useRecorderShortcuts({ enabled, onPlayPause, onRestart, onHint, onTranscript })` — Space/R/H/T, qua `shouldHandleShortcut`.
  - Đáp án: phím `1`–`n`; đúng → `Stamp animate` "ĐÃ XÁC MINH" (`sfx` `stamp`); sai giữ chuỗi `listeningMismatch`.
  - Vật chứng: `DeskBackdrop` + ảnh ghim trái + thẻ mô tả phải; tab `FolderTabs` (`sfx="tab"`).

- [ ] **Step 1: Test đỏ** — peaks: WAV PCM16 tổng hợp trong test (sin nửa đầu, im lặng nửa sau) → 64 cột, nửa sau ≈ 0, max = 1, chạy hai lần cùng JSON; WAV 8-bit → exit 1. `useAudioPlayback` (controller giả) trả `progress`. `useRecorderShortcuts` bỏ qua khi focus ở input. `CassetteRecorder` không `peaks` thì không có `svg.recorder-wave`; khi unmount lúc đang phát gọi `stopLoop`.
- [ ] **Step 2:** FAIL; **Step 3:** cài đặt, sinh peaks cho file hiện có; **Step 4:** PASS + E2E `listening.spec.ts`: Space phát rồi dừng, R về 0, H hiện note, T hiện băng lời thoại theo `transcriptVisibility`, phím đáp án đúng hiện con dấu; đóng modal khi đang phát → trạng thái audio `paused`/`idle`.
- [ ] **Step 5:** Commit `feat(evidence): evidence desk and cassette recorder with real waveform`.

### Task 8: Chuyển nút trong phạm vi và test canh gác

**Files:** Modify các file trong phạm vi (Global Constraints) còn `<button>` thô; create `apps/game-web/e2e/button-guard.spec.ts`; modify CSS liên quan; motion cho `ModalSheet`/dải/nhật ký trong `packages/ui/src/primitives/motion.css`.

**Interfaces:**
- Quy tắc chọn loại: hành động chính của màn (Vụ án mới, Tiếp tục, Xác nhận, Bắt đầu điều tra, Đóng hồ sơ) → `PaperButton`; còn lại → `InkButton`; thiết bị → `DeviceKey`. Giữ nguyên `aria-*`, thứ tự focus và text.
- `button-guard.spec.ts`: với mỗi màn (title, case picker, settings, how-to, pause, briefing, HUD, hội thoại, nhật ký, vật chứng, bài nghe, tổng kết), mọi `button:visible` phải khớp `.ink-button, .paper-button, .device-key, .folder-tabs button, .key-hint-line button`.

- [ ] **Step 1:** Viết `button-guard.spec.ts`, chạy — FAIL, liệt kê nút vi phạm.
- [ ] **Step 2:** Chuyển từng màn; chạy test unit/E2E của màn đó sau mỗi màn.
- [ ] **Step 3:** Motion mở/đóng/lần lượt (220/160/40ms), tắt bởi `lexicon-motion-off`/media query.
- [ ] **Step 4:** `button-guard.spec.ts` PASS; E2E focus/pause/title hiện có PASS.
- [ ] **Step 5:** Commit `feat(ui): move parts 1-4 to the three button kinds; add button guard`.

### Task 9: Verification, tài liệu, review

- [ ] **Step 1:** Chụp "after" vào `docs/ai/playtests/2026-10-03-ui-game-feel/after/`; bảng trước/sau trong báo cáo.
- [ ] **Step 2:** `FPS_PROBE=1` ba lần, so baseline (ngưỡng 10%).
- [ ] **Step 3:** DoD, dán output: `npm run lint`, `npm run test`, `npm run build`, `npm run format:check`, `npm run test:e2e`, `npm run memory:check`, `python -m pytest tools/art-codegen tools/audio-codegen -q`, `node --test tools/audio-codegen/build_peaks.test.mjs`. Đỏ chỉ được phép nằm trong danh sách baseline.
- [ ] **Step 4:** Một review độc lập toàn nhánh (`requesting-code-review`): guardrail §6, cleanup tween/RAF/Howl, focus và phím tắt, provenance âm thanh. Xử lý theo `receiving-code-review`.
- [ ] **Step 5:** Cập nhật `apps/game-web/AGENTS.md` (ba loại nút, `data-sfx`, âm UI chung không thuộc case), `MEMORY.md`, provenance; commit `docs(ui): game-feel verification, screenshots and memory`. Chờ người dùng duyệt ảnh; không push.
