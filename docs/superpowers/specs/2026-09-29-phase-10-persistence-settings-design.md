# Phase 10 — Persistence: Settings và kiểm chứng auto-save

**Trạng thái:** Đã duyệt thiết kế trong chat, chờ duyệt spec
**Ngày:** 2026-09-29
**Lộ trình:** `docs/04_CODEX_IMPLEMENTATION_ROADMAP.md` §29
**Tài liệu liên quan:** `docs/01_GAME_DESIGN_DOCUMENT.md` §26; `docs/02_ENGLISH_LEARNING_SYSTEM_DESIGN.md` (subtitle configurable, telemetry `subtitle_enabled`); `docs/architecture/ARCHITECTURE.md` §4 (state boundaries); spec Phase 6 (learning persistence), Phase 7 (audio/listening), Phase 9 (save V4).

## 1. Mục tiêu và hiểu biết đã thống nhất

Roadmap §29 yêu cầu IndexedDB cho `GameSave`, `Settings`, `LanguageProfile`, auto-save theo evidence/objective/dialogue/scene/contradiction và "reload browser resumes progress". Audit trước phase cho thấy `GameSave` (V4) và `LanguageProfile` đã có repository, migration và recovery; auto-save đã chạy khi `caseState` hoặc scene đổi. Phần còn thiếu là **Settings** như một schema riêng và bằng chứng kiểm thử theo từng trigger.

Người dùng đã chọn:

- Phạm vi "Settings + kiểm chứng"; không làm save slot.
- Settings gồm chế độ dịch (chuyển từ hồ sơ học tập sang), âm lượng, phụ đề bản ghi và giảm chuyển động.
- Lưu Settings trong database IndexedDB riêng `lexicon-settings` để settings và tiến độ phục hồi độc lập.

## 2. Phạm vi

- Schema `SettingsV1`, repository IndexedDB riêng, backup/khôi phục khi record hỏng.
- Nâng record hồ sơ học tập từ V1 lên V2, bỏ `translationMode`; chế độ dịch cũ được chuyển sang Settings ở lần chạy đầu.
- Store settings (Zustand, per-mount, không singleton) và autosave settings.
- Điều khiển trong menu Tạm dừng: chế độ dịch (đã có, đổi nguồn), âm lượng, phụ đề, giảm chuyển động.
- Áp dụng âm lượng vào Howler, phụ đề vào `ListeningTaskPanel`, giảm chuyển động vào Phaser marker và CSS.
- Unit test auto-save theo từng trigger; E2E reload tổng hợp; test lỗi storage.

## 3. Schema Settings

```ts
type SubtitlePreference = 'auto' | 'on' | 'off';
type SettingsV1 = {
  schemaVersion: 1;
  translationMode: 'Beginner' | 'Learning' | 'Immersion';
  volume: number;          // số nguyên 0–100
  subtitles: SubtitlePreference;
  reducedMotion: boolean;
};
```

- Mặc định: `translationMode: 'Learning'`, `volume: 80`, `subtitles: 'auto'`, `reducedMotion` = `matchMedia('(prefers-reduced-motion: reduce)').matches` tại lần tạo đầu tiên (false nếu không có `matchMedia`).
- Validate bằng Zod strict; trường thừa, kiểu sai, `volume` ngoài 0–100 hoặc không nguyên đều không hợp lệ.
- Database `lexicon-settings`, version `1`, object store `records` (key `local-settings`) và `backups` (autoIncrement). Không tăng version của `lexicon-game-saves` hay `lexicon-learning`.
- Settings không chứa tiến độ nên record hỏng được backup rồi thay bằng mặc định, không cần xác nhận; UI hiện thông báo trạng thái đọc được (`role="status"`).
- Database không mở được → dùng mặc định trong bộ nhớ, hiển thị thông báo, game vẫn chơi được; không ghi settings trong phiên đó.

## 4. Di trú và ranh giới state

- `LearningRecordV2` = V1 bỏ `translationMode`. Đọc V1: validate như hiện tại, backup raw, ghi V2. Lỗi backup/ghi → giữ record nguồn, trả lỗi theo cơ chế recovery Phase 6.
- Khi chưa có record settings: nếu record học tập đọc được là V1 thì seed `translationMode` từ đó; nếu không, dùng mặc định. Thứ tự bootstrap: nạp learning (thu `legacyTranslationMode`) → nạp settings với seed.
- Sau di trú, `translationMode` chỉ tồn tại trong Settings; learning store đọc chế độ dịch từ settings store, không giữ bản sao.
- Settings là UI/app state: không nằm trong `GameState`, không ảnh hưởng save case hay `LanguageProfile`.

## 5. Áp dụng từng cài đặt

- **Âm lượng:** thanh trượt 0–100 (bước 5) trong menu Tạm dừng, có nhãn và giá trị phần trăm. Áp vào Howler cho mọi bản ghi đang và sẽ phát; đổi âm lượng khi đang phát có hiệu lực ngay.
- **Phụ đề bản ghi:**
  - `auto`: giữ nguyên hành vi Phase 7 (Beginner hiện lời thoại + bản dịch; Learning có nút mở lời thoại; Immersion ẩn).
  - `on`: lời thoại tiếng Anh hiện sẵn ở mọi chế độ; bản dịch vẫn chỉ theo chế độ dịch (Beginner hiện, Learning khi mở, Immersion không).
  - `off`: không tự hiện lời thoại ở bất kỳ chế độ nào; Beginner và Learning có nút "Mở lời thoại"; Immersion vẫn ẩn.
  - Bộ đếm `listening.subtitleUses` tăng một lần mỗi phiên bản ghi khi lời thoại được hiển thị lúc bắt đầu phát (như Beginner hiện nay); mở bằng nút vẫn tính `transcriptOpens` như cũ.
- **Giảm chuyển động:** khi bật, marker tương tác đứng yên (dừng tween, giữ vị trí gốc) và CSS transition/animation của HUD/overlay bị tắt qua thuộc tính trên root. Phaser nhận interface chỉ-đọc `MotionSource { reducedMotion(): boolean }` (không import Zustand) và áp dụng khi giá trị đổi trong lúc chơi.
- Tất cả chuỗi mới nằm trong `packages/game-content/ui/vi.json` và schema UI.

## 6. Kiểm chứng auto-save và reload

- Unit test `connectAutosave`: lưu đúng một lần cho mỗi thay đổi evidence, objective, dialogue flag, scene và contradiction; không lưu khi chỉ UI state (notebook, pause, nearby, modal) đổi; lưu theo thứ tự và bỏ qua sau khi disconnect.
- Unit test settings repository/migration: mặc định, seed từ learning V1, record hỏng → backup + mặc định, database lỗi → memory-only, round-trip.
- Unit test learning migration V1 → V2 (backup trước khi ghi, lỗi ghi giữ nguồn).
- E2E: đổi chế độ dịch, âm lượng, phụ đề `on`, giảm chuyển động; thu evidence và đổi scene; reload → settings và tiến độ còn nguyên, lời thoại hiện sẵn trong Immersion khi phụ đề `on`, không console error.
- E2E hiện có (timeline, listening, dialogue, conclusion) tiếp tục PASS.

## 7. Ngoài phạm vi

- Save slot, chơi lại từ đầu, xuất/nhập save, đồng bộ đám mây, backend.
- Thay đổi save case V4, quy tắc học tập hoặc cách tính bộ đếm learning khác ngoài quy tắc `subtitleUses` ở §5.
- Nhạc nền/SFX, remap phím, cỡ chữ.

## 8. Tiêu chí chấp nhận

- Reload trình duyệt tiếp tục tiến độ case, hồ sơ học tập và cả bốn cài đặt.
- Người chơi đã chọn chế độ dịch trước Phase 10 giữ nguyên lựa chọn sau khi nâng cấp.
- Settings hỏng hoặc không truy cập được không chặn gameplay và không làm mất tiến độ.
- Không có state trùng: `translationMode` chỉ nằm trong Settings sau di trú.
- Chạy và lưu output: `npm run lint`, `npm run test`, `npm run build`, `npm run typecheck`, `npm run format:check`, `npm run test:e2e`, `npm run memory:check`, `git diff --check`. Backend checks chỉ khi sửa `apps/api`.
