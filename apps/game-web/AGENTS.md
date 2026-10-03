# AGENTS.md — apps/game-web

Áp dụng thêm cho frontend. Rule gốc: `/AGENTS.md`. Chi tiết asset: `docs/art/06_PHASER_CHARACTER_SCENE_ASSET_MODEL_SPEC.md`.

## Phaser (`src/game`)

- `WorldScene` generic, dựng từ `SceneDefinition` JSON; không hardcode props trong scene class.
- World position = feet / floor contact. Character origin `(0.5, 0.88)`, depth `= y + depthBias`.
- Collider là footprint nhỏ (Arcade Physics). Không dùng full sprite làm collider.
- Hướng: NE/SE/SW/NW. Anim key `${actor}_${action}_${direction}`.
- Chỉ preload asset trong scene manifest hiện tại.
- Movement khoá khi: dialogue active, critical modal mở, scene transition.
- Interaction radius: NPC 80–110, evidence nhỏ 60–90, door 90–120 px.
- Marker: diamond đỏ, float 4px, 800–1200ms, không glow. Không neon outline, bloom, chromatic aberration.
- Ngoại lệ (02/10/2026): cổng dịch chuyển được có lớp sáng ấm blend `ADD` alpha ≤ 0,35, bán kính ≤ 1,2 ô; không bloom/post-process, không viền neon. Bóng UI mềm blur ≤ 6px, alpha ≤ 25%. Font UI: Xanh Mono (tiêu đề ≥ 18px), IBM Plex Mono (phím/nhãn), Literata (thân), Patrick Hand (ghi chú tay), đóng gói qua `@fontsource`.
- Paper overlay chỉ trong Phaser (alpha 0.10–0.18); React UI dùng texture riêng.
- `shutdown`/`destroy` phải gỡ mọi listener bus/input/timer.

## React (`src/hud`, `notebook`, `dialogue`, …)

- Không truy cập `Phaser.Game`/scene trực tiếp; dùng `bridge/` hooks + store.
- Không re-render/mount lại canvas khi state UI thay đổi.
- Font ≥ 14px, focus visible, modal có focus trap, điều khiển được bằng bàn phím.
- UI diegetic (notebook, case file, paper) — không giống dashboard LMS.
- Text/ID hiển thị lấy từ content, không hardcode.
- Nút: chỉ ba loại trong `packages/ui` — `InkButton` (thao tác phụ), `PaperButton` (thao tác chính), `DeviceKey` (phím trên thiết bị như máy ghi âm); từ vựng nội dòng `.vocabulary-word` là ngoại lệ. Không thêm `<button>` thô ở các màn phần 1–4b (`button-guard.spec.ts` canh); phần 5 (sổ tay, bảng suy luận, buộc tội) cũng tuân theo, canh bởi `button-guard.spec.ts` và `ui-investigation.spec.ts`. Sổ tay là một cặp trang liền mạch lật bằng `SpreadReader` (vuốt/nút/PageUp-PageDown); bảng suy luận không phân trang, dùng `SwipeRow` (vuốt ngang / cuộn dọc, không thanh cuộn). Toàn game không cho bôi đen chữ (`user-select: none`).
- Âm thanh giao diện là âm chung của game, không thuộc `case.audio`: nút gắn `data-sfx` (`press`, `paper-open`, `paper-close`, `pen`, `stamp`, `tab`, `device-click`), một listener ở `document` phát qua `audio/uiSound.ts`; nút `disabled`/`aria-disabled` im, `uiSounds=false` hoặc volume 0 im, file nhạc nằm trong `public/audio/ui/` kèm `provenance.json` (CC0 kiểm giấy phép từng file).
- Hội thoại là dải thẩm vấn (phím 1–9, Space/E/Enter, L mở nhật ký); chữ hiện dần theo `textSpeed` (E2E mặc định `instant` qua `useInstantText`). Tilt/animation mới phải đăng ký trong `packages/ui/src/primitives/motion.css` cho cả `lexicon-motion-off` và `prefers-reduced-motion`.

## State & persistence

- Zustand store bọc reducer của `game-core`; không nhân bản logic engine trong store.
- IndexedDB qua `persistence/`; auto-save khi evidence / objective / dialogue / scene / contradiction thay đổi.
- Save hỏng: backup → migrate → chỉ tạo save mới sau khi user xác nhận.

## Test

- Logic: Vitest ở package tương ứng, không test logic qua Phaser.
- E2E Playwright (`e2e/`): luồng start case → evidence → NPC → security log → contradiction → accuse David → case closed → reload.
