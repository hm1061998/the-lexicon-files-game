# UI foundation + HUD — báo cáo verification

Ngày: 02/10/2026. Plan: `docs/superpowers/plans/2026-10-02-ui-foundation-hud.md`. Báo cáo này được bổ sung theo từng task.

## Baseline (Task 0, HEAD `0750ce6`, Chromium Windows, 1 worker)

- `npm run test:e2e`: 19 test đỏ trước khi sửa gì (danh sách dưới), phần còn lại xanh. Đây là danh sách "đỏ có sẵn" cho Task 9; test nào đỏ ngoài danh sách này là do phase.
- Lệnh chạy sạch (cây thư mục không đổi trong lúc chạy; lần chạy đầu bị loại vì sửa file làm HMR nhiễu).

- x e2e\feedback-audio.spec.ts:4:1 › loads ambient music only after the first real browser gesture (8.6s)
- x e2e\feedback-navigation-review.spec.ts:161:1 › repeated desktop and compact resize preserves the clicked floor point (6.2s)
- x e2e\feedback-navigation.spec.ts:46:1 › click floor navigates and keyboard interrupts without resuming (10.7s)
- x e2e\feedback-navigation.spec.ts:167:1 › resized click coordinates and modal cancellation do not resume an old route (10.6s)
- x e2e\feedback-ui-controls.spec.ts:6:1 › dialogue and notebook controls stay accessible and fit a compact viewport (14.2s)
- x e2e\feedback-viewport.spec.ts:12:3 › shell fits 760x600 including letterbox (5.8s)
- x e2e\feedback-viewport.spec.ts:12:3 › shell fits 1024x768 including letterbox (5.9s)
- x e2e\feedback-viewport.spec.ts:12:3 › shell fits 1280x720 including letterbox (6.9s)
- x e2e\feedback-viewport.spec.ts:12:3 › shell fits 1920x1080 including letterbox (6.6s)
- x e2e\feedback-viewport.spec.ts:66:1 › compact HUD panels keep 44px launchers and preserve manual visibility through resize (8.8s)
- x e2e\hud.spec.ts:185:1 › collecting evidence opens modal, locks movement, and adds it to the notebook (7.1s)
- x e2e\hud.spec.ts:232:1 › discovered evidence survives reload without reopening its modal (9.2s)
- x e2e\hud.spec.ts:258:1 › storage warning is readable and does not cover the objective panel (180ms)
- x e2e\hud.spec.ts:406:1 › minimap is hidden on narrow viewports (8.9s)
- x e2e\hud.spec.ts:414:1 › HUD chrome follows the concept: red objective heading, clip, case badge, movement and action key bar (6.9s)
- x e2e\hud.spec.ts:492:1 › compact viewports keep the mouse controls and hide only the movement hints (8.9s)
- x e2e\learning.spec.ts:76:1 › visible dialogue records only annotated contexts and persists mode/progress (10.9s)
- x e2e\notebook-people.spec.ts:246:1 › reuses vocabulary context without encounter inflation (12.2s)
- x e2e\settings.spec.ts:172:1 › legacy learning V1 translation mode is preserved (9.2s)

## FPS baseline (GL phần mềm `--use-gl=swiftshader`, `main_office` đứng yên, 3 lượt × 5 giây)

- `{ "fps": 12.1, "runs": [12.2, 12, 12.2] }` (probe `e2e/fps-probe.spec.ts`, chạy bằng `FPS_PROBE=1`).

## Ảnh "trước"

- `docs/ai/playtests/2026-10-02-ui-foundation-hud/before/` — 5 tình huống × 4 kích thước (`ui-shots.spec.ts`, chạy bằng `UI_SHOTS_DIR`, đường dẫn tính từ `apps/game-web`).

## Nguồn dải giấy phía trên (1280×720)

- Ẩn `.hud` thì dải biến mất; không có phần tử nào của `.game-root` rộng > 900px nằm ở đó; `camera.worldView` nằm trong biên scene. Kết luận: **UI (HUD)**, không phải camera/scene. Selector chính xác sẽ được xác định khi dựng lại khối mục tiêu ở Task 4/5 (xem ledger), gỡ ở Task 5.
