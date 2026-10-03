# UI phần 4b (cảm giác game) — báo cáo verification

Ngày: 03/10/2026. Plan: `docs/superpowers/plans/2026-10-03-ui-game-feel.md`. Spec: `docs/superpowers/specs/2026-10-03-ui-game-feel-design.md`. Báo cáo được bổ sung theo từng task.

## Baseline (Task 0, HEAD `859c447`)

- `npm run lint`: 0 lỗi. `npm run test`: game-web 708, content 277, core 59, ui 49 đều pass.
- E2E đầy đủ: dùng kết quả lần chạy cuối trước phase này (code không đổi từ đó, chỉ thêm tài liệu): 256 pass, 61 skipped, 17 đỏ có sẵn (`feedback-audio`, `feedback-navigation(-review)` ×3, `feedback-ui-controls`, `feedback-viewport` ×5, `hud` ×4, `learning`, `notebook-people`, `settings`). Đỏ ngoài danh sách đó là do phase này gây ra.
- pytest đỏ có sẵn: `tools/art-codegen/test_chair_directions.py`.
- FPS baseline (`main_office` đứng yên, GL phần mềm, ba lượt probe): 10,8 / 11,5 / 11,5 (trung bình 11,3). Ngưỡng cho phép: không giảm quá 10%.

## Ảnh trước

`docs/ai/playtests/2026-10-03-ui-game-feel/before/` — `dialogue`, `listening`, `evidence`, `title`, `pause` × 4 kích thước (1920×1080, 1280×720, 760×600, 390×844) bằng `e2e/ui-game-feel-shots.spec.ts` (`UI_SHOTS_DIR`, `UI_SHOTS_PHASE=before`). `dialogue-log` chỉ chụp ở ảnh sau.

## Task 3b — âm thanh CC0 (xong 03/10/2026)

Người dùng cung cấp `kenney_interface-sounds.zip` và `kenney_rpg-audio.zip` (cả hai `License.txt` ghi CC0). `tools/audio-codegen/import_ui_sounds.py` đọc `ui_sound_map.json`, kiểm tra giấy phép từng gói, copy bảy file vào `apps/game-web/public/audio/ui/` và ghi `provenance.json` (nguồn, gói, URL, SHA-256 hai đầu). Ánh xạ: `press` click_003, `tab` tick_001, `pen` tick_004, `device-click` metalClick, `paper-open` bookFlip2, `paper-close` bookClose, `stamp` bookPlace2.
- Máy không có ffmpeg hay soundfile (plan giả định có ffmpeg) và không được thêm dependency, nên file Kenney (đã là Ogg Vorbis) được copy nguyên, không chuẩn hóa -16 LUFS; âm giao diện nhỏ hơn âm thanh chính (0,6 × âm lượng).
- `tape-loop` chưa có file (không có tiếng băng CC0 từ OpenGameArt): máy ghi âm chạy không có tiếng băng.
- Kiểm chứng: `test_import_ui_sounds.py` (9) và `uiSoundManifest.test.ts` (3); trong trình duyệt thật, bấm nút kích hoạt tải `press.ogg` và `tab.ogg` (không nghe được âm lượng/độ êm của từng tiếng: cần người dùng nghe thử).
- Khi bấm đáp án đúng ở bài nghe, ngoài tiếng bút còn phát tiếng `stamp` lúc con dấu "Đã xác minh" hiện.

## Ảnh sau và so sánh

`docs/ai/playtests/2026-10-03-ui-game-feel/after/` — 6 màn × 4 kích thước (thêm `dialogue-log`).
Trước → sau: hội thoại từ tờ giấy dưới đáy thành dải thẩm vấn tối có chân dung ảnh dán, chữ Literata 24px hiện dần, lựa chọn đánh số 1–9 và ghi chú tay "Ghi chú điều tra"; camera đẩy vào ×1,2; nhật ký hội thoại (phím L) là cột giấy bên phải; bài nghe là máy ghi âm cassette (hai cuộn, màn hình LCD, sóng âm thật 64 cột, bốn phím); vật chứng đặt trên mặt bàn gỗ với hai mục dạng tab hồ sơ; mọi nút thuộc ba loại (ink, paper, device) có trạng thái hover/nhấn/focus và gắn `data-sfx`.

## Kết quả đo

| Hạng mục | Trước | Sau |
| --- | --- | --- |
| FPS `main_office` đứng yên (GL phần mềm) | 10,8 / 11,5 / 11,5 lúc ghi baseline | 10,5 / 10,7 / 8,5 và 10,1 / 9,8 / 8,9 |
| FPS đo lại cùng điều kiện máy lúc đo "sau" | commit baseline `859c447`: 9,7 / 10,3 | code mới: trung bình ≈ 9,8 |

Máy chậm hơn lúc ghi baseline (cùng commit baseline đo lại chỉ còn ≈ 10,0), nên so sánh công bằng là baseline đo lại ≈ 10,0 và code mới ≈ 9,8: chênh ≈ 2%, trong ngưỡng 10%. Không đụng Phaser ở cảnh đứng yên.

## Lệnh Definition of Done

- `npm run lint`: 0 lỗi. `npm run test`: game-web 787, content 281, core 59, ui 54, 18 + 1 ở project khác, đều pass. `npm run build`, `npm run typecheck`, `prettier --check .`: đạt. `build_ui_materials.py --check`: không drift.
- `python -m pytest tools/art-codegen -q`: 70 pass, 1 đỏ có sẵn (`test_chair_directions`). `node --test tools/audio-codegen/build_peaks.test.mjs`: 6/6.
- `npm run test:e2e` đầy đủ: 277 pass, 85 skipped, 19 đỏ = 17 đỏ có sẵn + 2 do phase này (`feedback-audio` lời đọc và lỗi tải giọng đọc: vùng đọc ẩn của dải hội thoại làm `getByText` trùng). Đã sửa (vùng đọc ẩn chỉ chứa câu khi đang hiện dần) và chạy lại: cả hai xanh; `dialogue`, `dialogue-band`, `ui-dialogue-evidence` xanh (37).
- E2E mới: `dialogue-band` (6), `button-guard` (15), `listening` (+2), `ui-dialogue-evidence` (đo không cuộn, thẻ nằm trên giấy).

## Ruling của executor

Xem `Ruling:` trong ledger. Tóm tắt: nghe `document` thay vì `App.tsx`; `useTextReveal(text, speed)` không có tham số `reducedMotion` (tốc độ chữ là lựa chọn riêng); không thêm `revealedChars` cho `VocabularyText`; vòng focus màu giấy trên dải tối; thẻ vật chứng giữ `ModalSheet` thay vì `FolderCover` (cuộn); thẻ bài nghe mở với focus ở phím Phát để Space phát; `button-guard` cho phép `.vocabulary-word`; `:where()` cho nền nút; animation đóng 160ms hoãn; Task 3b chờ người dùng.

## Việc còn chờ

- **Âm thanh giao diện:** đã có bảy file CC0 (xem Task 3b); còn thiếu `tape-loop` (tiếng băng chạy) và chưa chuẩn hóa âm lượng.
- Animation đóng 160ms (cần giữ phần tử khi thoát).

## Review độc lập và sửa

Một review toàn nhánh (opus): không Critical; năm mục Review Focus đạt. Sửa (RED→GREEN, `npm run test` game-web 789):
1. Bấm vào vùng lời thoại không hiện hết câu (spec §4.3) → `onAdvance` trên `.dialogue-body`, kèm E2E "a click on the line finishes it".
2. Migration settings v1→v2 reset cả cài đặt hợp lệ nếu chỉ lần ghi lại bị lỗi (nâng thành Important theo ảnh hưởng) → ghi lại là best-effort.

Minor chưa sửa (ledger): nút trong `<fieldset disabled>` (đáp án bài nghe đã giải) vẫn phát tiếng bút; viền focus giấy hiện quanh dòng khi chọn bằng phím (luật `:focus-visible` đè `outline: none`); lời thoại có thể được đọc hai lần khi đang hiện dần; phím 1–9 không chạy khi một nút trong dải đang giữ focus; camera có thể kẹt zoom cũ nếu đổi cỡ cửa sổ giữa lúc tween; `key` trùng và nhóm theo `npcId` thay vì `speakerId` trong nhật ký; tab vật chứng dùng `nav` + `aria-current` thay cho nhóm nút bật tắt; `build_peaks.mjs` chưa xử lý `channels = 0` và WAV `EXTENSIBLE`; `build_portraits.py` lỗi trên sprite trong suốt hoàn toàn; còn CSS chết (`.listening-timestamp`, `.listening-support`, `.evidence-tab`, `dialogue-band.css`), prop `shown` thừa ở `DialogueBand`, lerp 0,08 viết cứng hai nơi; chọn bằng phím không phát tiếng "tích bút"/"click".
