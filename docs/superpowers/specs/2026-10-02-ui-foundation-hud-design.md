# Nền vật liệu UI, HUD trong game và chỉ dẫn trong thế giới

Ngày: 02/10/2026. Trạng thái: **đã duyệt (02/10/2026)**. Plan: `docs/superpowers/plans/2026-10-02-ui-foundation-hud.md`. Chưa sửa code.

Phân loại theo `brainstorming`: **architectural** — thêm dependency font, thêm primitive dùng chung trong `packages/ui`, thêm pipeline texture UI trong `tools/art-codegen`, đổi asset và vị trí cổng trong scene JSON của cả hai case, nới một product rule (ánh sáng cho cổng). Sau khi spec được duyệt mới chuyển sang `writing-plans`.

Đây là spec đầu tiên của chương trình **làm lại toàn bộ UI** (người dùng chọn ngày 02/10/2026). Các phần sau có spec riêng, xem §12.

## 1. Mục tiêu và nguồn yêu cầu

Người chơi nhìn vào phải thấy mình đang ở trong **một hồ sơ trinh thám**, không phải một trang web. Ảnh chụp trong game phải đủ tốt để đặt cạnh concept và dùng cho trang store (liên quan PR-06, PR-07).

Tiêu chí thành công:

1. Ảnh chụp sau thay đổi, đặt cạnh `docs/concept/ingame_main_office_hud.webp`, trông cùng một game; người dùng duyệt bằng mắt (điều kiện "phải cải thiện game").
2. Không còn thanh toolbar kín bề ngang, khối hộp viền 1–2px kiểu web hay nhãn NPC luôn hiện trong HUD.
3. Vật chứng chưa nhặt và cổng dịch chuyển dễ thấy từ xa; người chơi biết hướng của vật chứng ngoài khung hình.
4. Toàn bộ E2E hiện có vẫn pass, cả hai case vẫn chơi hết được.

Nguồn:

- Người dùng 02/10/2026: "giao diện game nhìn giống web nhiều hơn là game, nhất là các hub điều khiển"; chọn làm lại toàn bộ UI; chọn ưu tiên desktop; vật liệu sinh bằng code; bộ font A; spec đầu gồm nền vật liệu + HUD; đồng ý bóng mềm "miễn là nó cải thiện game".
- Người dùng 02/10/2026: "đổi hiệu ứng chỉ vị trí cho cổng dịch chuyển và các vật chứng dễ gây chú ý hơn"; "thay đổi hình ảnh cổng dịch chuyển trông giống các game nhập vai hiện nay, đặt ở vị trí sát mép tường"; chọn cho phép ánh sáng mềm riêng cho cổng.
- `docs/01_GAME_DESIGN_DOCUMENT.md` §2.3 Diegetic UI ("Không dùng UI giống LMS/dashboard").
- `docs/art/06_PHASER_CHARACTER_SCENE_ASSET_MODEL_SPEC.md` §63 (Post FX), §64 (paper overlay), phần kiểm tra cuối ("flat vector web UI … thì chưa đạt").
- Tài liệu định hướng `docs/product/2026-10-02-product-review-and-direction.md`: PR-02 khuyên tạm dừng polish notebook/board; người dùng đã chọn làm lại UI, ghi chú tại §8.

## 2. Hiện trạng (đối chiếu code tại `12ce31c`)

- **Font:** `--lexicon-font-body: Cambria, "Times New Roman", Georgia, serif` và mono `"Courier New"`. Cambria chỉ có trên Windows; Linux/Steam Deck/macOS hiển thị font khác. Phaser dùng `LABEL_FONT_FAMILY` riêng.
- **Primitive:** `packages/ui` chỉ có `PaperPanel` (viền 2px, đường mực đôi, bóng cứng 3px không nhòe, noise SVG) và `Keycap`.
- **HUD** (`apps/game-web/src/hud`): `ObjectivePanel` (kẹp giấy SVG, mép dưới `clip-path` răng cưa, nút "−" dạng hộp), `CaseProgress`, `Minimap` (caption "Bản đồ nhỏ • Bạn đang ở đây", nút "−"), `InteractionPrompt` (đã neo cạnh vật thể, tránh các khối HUD qua `AVOID_SELECTORS`), `KeyHints` (một `PaperPanel` kín bề ngang với 6 mục có khung, gồm câu dài "Di chuyển: W lên, A trái, S xuống, D phải").
- **Nhãn NPC** (`game/entities/createNpcNameplate.ts`): hộp kem viền nâu, chữ đậm 20px, luôn hiện.
- **Vật chứng** (`game/entities/WorldCueLayer.ts`): hình thoi đỏ 16×14px đứng yên cho mỗi cue đang hiện; vật gần nhất dùng marker nổi 4px/1000ms và viền đỏ. Không có chỉ báo khi vật chứng ngoài khung hình.
- **Cổng** (`game/systems/portalPresentation.ts` + `environment/common/brass_portal.png`): đĩa đồng trên sàn, đặt cách tường 1,5 ô trước một `opening` của tường ngoài; trang trí bằng elip vàng mờ (alpha 0,18–0,45) và ba đốm bay lên. Vị trí hiện có:

  | Case | Scene | Asset | Vị trí | Opening tương ứng |
  | --- | --- | --- | --- | --- |
  | 001 | main_office | `hallway_door` | u 1.5, v 5 | `west_wall_upper` v@0 [4–6] |
  | 001 | archive | `PLACEHOLDER_archive_door` | u 14.5, v 5 | `archive_east_outer_wall` v@15.75 [4–6] |
  | 002 | main_office | `door_to_mail_room` | u 1.5, v 5 | `west_wall_upper` v@0 [4–6] |
  | 002 | main_office | `door_to_reception` | u 14.5, v 7 | `east_outer_wall` v@15.75 [6–8] |
  | 002 | mail_room | `door_to_office` | u 14.5, v 5 | `east_wall` v@15.75 [4–6] |
  | 002 | reception | `door_to_office_from_reception` | u 1.5, v 5 | `west_wall` v@0 [4–6] |

- **Dải giấy phía trên:** ảnh chụp 1280×720 có một dải nền giấy chạy kín bề ngang ở mép trên, sau khối mục tiêu và hồ sơ. Chưa xác định nguồn (HUD, `.game-paper-overlay`, hay vùng ngoài biên scene/camera).
- **Rule liên quan:** `apps/game-web/AGENTS.md` "Marker: diamond đỏ, float 4px, 800–1200ms, không glow. Không neon outline, bloom, chromatic aberration"; `AGENTS.md` §6 màu đỏ chỉ cho clue/evidence/objective/contradiction/selected node/map marker.

## 3. Quyết định đã chốt

| Mã | Quyết định | Phương án loại |
| --- | --- | --- |
| D-1 | Ưu tiên desktop 16:9 từ 1280×720; màn hẹp (< 960 rộng hoặc < 640 cao) chỉ cần dùng được và qua test. | Đẹp như nhau mọi kích thước; chỉ desktop. |
| D-2 | Vật liệu UI sinh bằng code trong `tools/art-codegen` + CSS/SVG. | Chỉ CSS/SVG; art raster/ImageGen (để PR-06). |
| D-3 | Font: tiêu đề/con dấu **Xanh Mono** (≥ 18px), phím/nhãn nhỏ **IBM Plex Mono 500**, thân **Literata 400/600**, ghi tay **Patrick Hand**; đều OFL, có subset tiếng Việt. | Playfair/Spectral; Old Standard/EB Garamond; Special Elite/Courier Prime (không có tiếng Việt). |
| D-4 | Spec này gồm phần 1 (nền vật liệu), phần 2 (HUD) và phần 2b (chỉ dẫn trong thế giới). | Chỉ phần 1 kèm trang mẫu. |
| D-5 | Bóng mềm: blur ≤ 6px, alpha ≤ 25%, một hướng sáng; thay bóng mực cứng. | Giữ bóng cứng. |
| D-6 | **Ngoại lệ ánh sáng cho cổng**: lớp sáng ấm, alpha ≤ 0,35, vẽ cộng lớp trong Phaser, không post-process bloom. Marker vật chứng vẫn "không glow". | Giữ rule, cổng nổi bật chỉ bằng hình khối/chuyển động. |

## 4. Phần 1 — Nền vật liệu

### 4.1. Font

- Thêm dependency vào `packages/ui`: `@fontsource/xanh-mono`, `@fontsource/ibm-plex-mono`, `@fontsource/literata`, `@fontsource/patrick-hand`. Lý do (AGENTS.md §5): font phải đóng gói để chạy offline (Electron/Steam), có dấu tiếng Việt và giống nhau trên mọi OS. Chỉ import subset `latin`, `latin-ext`, `vietnamese` và đúng weight: Xanh Mono 400, IBM Plex Mono 500, Literata 400/600, Patrick Hand 400.
- Token mới trong `packages/ui/src/theme/palette.css` (đồng bộ `palette.ts`): `--lexicon-font-display`, `--lexicon-font-label`, `--lexicon-font-body`, `--lexicon-font-hand`; mỗi token có fallback hệ thống. `--lexicon-font-mono` trỏ về font label.
- Xanh Mono không dùng dưới 18px. Thân bài tối thiểu 14px (`--lexicon-text-min`), lời thoại và mục tiêu ≥ 18px.
- Phaser: `bootstrapGame` chờ `document.fonts.load` cho các font canvas dùng (label, body) với timeout 3 giây; hết hạn thì boot với fallback và log `[Assets]` ở dev. `LABEL_FONT_FAMILY` đổi sang IBM Plex Mono.
- `assets/PROVENANCE.md`: một dòng cho mỗi họ font (nguồn, phiên bản package, OFL 1.1).

### 4.2. Texture sinh bằng code

Script mới `tools/art-codegen/build_ui_materials.py` (Pillow + numpy như các script hiện có, seed cố định, xuất ổn định từng byte trên cùng phiên bản thư viện), xuất vào `apps/game-web/public/assets/ui/`:

| File | Dùng cho | Ghi chú |
| --- | --- | --- |
| `paper_sheet_fresh.png`, `paper_sheet_aged.png` | nền giấy | 512×512, lát liền mép, sắc độ trong palette |
| `paper_torn_frame.png` | khung mép xé | 9-slice cho CSS `border-image`, mép xé ở cạnh dưới và phải, alpha ngoài mép |
| `paper_clip.png` | kẹp giấy | 2× độ phân giải, mực `--lexicon-border` |
| `tape_corner.png` | băng dính góc | bán trong suốt |
| `index_tab_frame.png` | thẻ chia mục | 9-slice, đầu tab bo xiên |
| `stamp_ring.png` | con dấu | vòng mực không đều, tô màu bằng CSS `mask` |
| `keycap_plate.png` | đế phím | 9-slice |
| `cork_board.png` | dự trữ cho phần 5 | 512×512 lát liền mép |
| `world/evidence_ripple.png` | vòng mực dưới vật chứng | dùng ở §6.1 |
| `world/portal_arch_ne.png`, `world/portal_arch_nw.png` (+ `_veil` các frame) | vòm cổng | dùng ở §6.2 |

Test Python `tools/art-codegen/test_build_ui_materials.py` (unittest như các test hiện có, chạy được bằng pytest): chạy hai lần cùng seed cho cùng hash; kích thước và vùng slice đúng khai báo; ảnh 9-slice có góc trong suốt đúng chỗ; có đủ hai hướng vòm cổng. Mỗi file có dòng trong `PROVENANCE.md` ("sinh bằng code, `build_ui_materials.py`, seed …").

### 4.3. Primitive trong `packages/ui`

Chỉ React + CSS, không import game state, Phaser hay store:

| Primitive | Trách nhiệm | Thuộc tính chính |
| --- | --- | --- |
| `PaperSheet` | tờ giấy có texture, mép, bóng mềm | `edge: 'clean' \| 'torn'`, `tone: 'fresh' \| 'aged'`, `tilt` (−2…2°), `clip?: boolean`, `tape?: 'tl' \| 'tr'`, `as` |
| `PaperClip` | kẹp giấy trang trí | `aria-hidden` |
| `Keycap` | phím trên đế (giữ API hiện có) | `children` |
| `InkButton` | nút dạng chữ mực, gạch chân khi hover/focus, không khung hộp | thuộc tính `button` chuẩn |
| `IndexTab` | thẻ chia mục bìa hồ sơ | `children`, `tone` |
| `Stamp` | con dấu chữ | `children`, `animate?: boolean` |
| `KeyHintLine` | dòng phím mảnh | `items: { key, label, onActivate?, disabled? }[]`, `compact?: boolean` |

`PaperPanel` giữ làm alias của `PaperSheet edge="clean"` cho đến khi phần 5 xong, rồi xóa.

### 4.4. Bóng, chuyển động, khả năng truy cập

- Token bóng: `--lexicon-shadow-paper: 0 3px 6px rgb(42 37 33 / 25%)` (D-5), `--lexicon-shadow-lift` cho trạng thái hover/focus; cùng hướng sáng như world (từ trên-trái).
- Chuyển động: giấy trượt vào 160–220ms; gạch mực 300ms; con dấu 115% → 100% trong 180ms; không rung màn hình, không nhấp nháy.
- `prefers-reduced-motion: reduce` và setting giảm chuyển động hiện có: tắt chuyển động và độ nghiêng (tilt = 0).
- Focus: viền 3px màu `--lexicon-dark-red`, offset 3px (khớp ngưỡng ≥ 3px của E2E pause menu hiện có), dùng chung cho mọi primitive tương tác.
- Test tương phản (`palette.test.ts`) cho mọi cặp chữ/nền mới, ngưỡng WCAG AA 4.5:1 cho chữ thường.

## 5. Phần 2 — HUD trong game

Bố cục bốn góc và một dòng mảnh ở đáy; lề an toàn 20px; không thanh nào chạy kín bề ngang.

| Khối | Thiết kế mới | Giữ nguyên |
| --- | --- | --- |
| Mục tiêu (trên trái) | `PaperSheet edge="torn" clip tilt=-1`; tiêu đề Xanh Mono đỏ in hoa; nội dung Literata 18px. Đổi mục tiêu: dòng cũ gạch mực (300ms) rồi tờ mới trượt vào. Thu gọn: mép giấy gập (tab nhỏ có `◎` và chữ "Mục tiêu"), không còn nút "−" dạng hộp. | `objectiveVisible`, `toggleObjective`, class `.hud-objective-panel`, `.hud-panel-launcher` |
| Hồ sơ (trên phải) | `IndexTab` "HỒ SƠ 4/8", số Xanh Mono đỏ; khi có evidence mới số nảy một lần (180ms). | `.hud-case-progress` |
| Bản đồ nhỏ | `PaperSheet` có `tape`; bỏ caption hiển thị, giữ chú thích cho screen reader; thu gọn bằng mép gập như mục tiêu. | phím M, `.hud-minimap`, model minimap |
| Dòng phím (giữa đáy) | `KeyHintLine`: chữ mực trên dải mờ dần, không panel; E Tương tác · J Sổ tay · B Bảng suy luận · M Bản đồ · Esc Tạm dừng. E mờ khi không có gì ở gần. Các mục vẫn bấm chuột được. | `.hud-key-hints`, hành vi `disabled` khi `inputLocked` |
| Gợi ý di chuyển | Bỏ khỏi dòng cố định; coach note nhắc cho tới lần di chuyển đầu tiên (logic hiện có của onboarding). | tín hiệu onboarding |
| Prompt tương tác | Mảnh giấy nhỏ `PaperSheet` + `Keycap` + Literata 16px. | toàn bộ logic neo/tránh trong `InteractionPrompt` |
| Coach note | Giấy note viết tay (Patrick Hand ≥ 18px, `tape`). | nội dung và điều kiện hiện |
| Nhãn NPC (Phaser) | Thẻ tên hồ sơ có ghim nhỏ, chữ IBM Plex Mono; chỉ hiện khi người chơi trong 1,5× bán kính tương tác của NPC hoặc chuột rê lên NPC; hiện/ẩn 150ms; tắt fade khi giảm chuyển động. | `nameTagLayout`, độ sâu nhãn |

- **Dải giấy phía trên:** bước đầu của plan là xác định nguồn. Nếu do HUD/CSS → gỡ trong spec này. Nếu do camera hoặc biên scene → ghi vào báo cáo, không sửa ở đây.
- **Màn hẹp (D-1):** giữ `getInitialHudVisibility` (mục tiêu và bản đồ thu gọn ban đầu). `KeyHintLine compact` chỉ hiện phím, nhãn chuyển vào `aria-label`/`title`.
- Logic chọn nhãn NPC theo khoảng cách là hàm thuần trong `game/systems` (test được không cần Phaser).

## 6. Phần 2b — Chỉ dẫn trong thế giới

### 6.1. Vật chứng chưa nhặt

- Marker hình thoi lớn hơn (≈ 24px), nổi 4px chu kỳ 1000ms (trong khoảng 800–1200ms của rule), không glow.
- Vòng mực đỏ trên sàn dưới vật chứng (`evidence_ripple.png`): nở từ 60% lên 100% và mờ dần, chu kỳ 2,4 giây. Giảm chuyển động: vòng tĩnh alpha 0,5.
- **Chỉ báo ngoài màn hình:** khi anchor của cue nằm ngoài viewport camera, vẽ hình thoi nhỏ (16px) ở mép màn hình, hướng về vật chứng, cách mép 24px, tránh các khối HUD bằng danh sách vùng tránh do React cung cấp qua store (không cho Phaser đọc DOM). Tối đa 3 chỉ báo, ưu tiên vật gần nhất. Hàm tính vị trí là hàm thuần có test.
- Cue biến mất khi đã nhặt (giữ `interactionEligibility` và `worldCueIds` hiện có). Màu đỏ đúng rule (evidence/map marker).

### 6.2. Cổng dịch chuyển

- **Hình ảnh:** vòm cổng gắn trong lỗ mở của tường ngoài: khung đồng và gỗ tối, bên trong là màn sáng màu vàng giấy cũ xoáy chậm (spritesheet `_veil`, 8–12 frame, ~8 fps), hạt bụi trôi lên, vệt sáng hắt xuống sàn trước cổng. Phía trên có biển tên phòng đích (lấy từ content, không hardcode).
- **Ánh sáng (D-6):** lớp sáng cộng (`ADD` blend) alpha ≤ 0,35, bán kính ≤ 1,2 ô; không dùng post-process bloom hay viền neon; giảm chuyển động: veil đứng ở một frame, không hạt.
- **Hướng:** hai ảnh gốc, `ne` cho tường chạy theo trục v và `nw` cho tường chạy theo trục u; tường ở phía đối diện (vd. `u@15.75`) dùng ảnh cùng trục lật ngang (`flipX`). Hướng chọn tự động theo trục và vị trí của wall segment chứa opening, không khai báo tay trong content.
- **Vị trí:** dời mọi asset có `portal` (bảng §2) vào chính giữa `opening` của tường ngoài tương ứng; điểm tương tác đặt trước cổng 0,75 ô về phía trong phòng; collision footprint nằm trong bề dày tường để không chắn lối đi. Spawn point đến (`from_*`) giữ trong phòng, không trùng cổng.
- **Schema:** `portal.style` thêm giá trị `'arch'`; `'aged-brass'` giữ cho tương thích save/test cũ nhưng không còn dùng trong content.
- **Validator mới (`game-content`):** mọi asset có `portal` phải nằm trong một `opening` của một wall segment (sai số 0,25 ô theo trục vuông góc, nằm trong khoảng `start..end` của opening). Lỗi đọc được, ví dụ `scenes.main_office.hallway_door.portal: not inside any wall opening`.
- `createPortalPresentation` viết lại cho vòm; giữ API `setReducedMotion`/`destroy` và cleanup tween khi scene shutdown.

## 7. Ranh giới kiến trúc (không đổi)

- Không đổi `game-core`, `learning-engine`, save version, Condition/Effect, event bus, store, phím tắt, điều kiện khóa input.
- React không truy cập Phaser; Phaser không đọc DOM. Dữ liệu cho chỉ báo ngoài màn hình (vùng tránh của HUD) đi qua store.
- Text/ID hiển thị lấy từ content/UI strings. Chuỗi bỏ khỏi HUD (câu WASD dài) giữ trong UI strings nếu onboarding còn dùng.
- Giữ tên class mà E2E và `AVOID_SELECTORS` dùng; nếu buộc đổi, cập nhật test trong cùng commit và ghi lý do.

## 8. Thay đổi tài liệu và rule

- `apps/game-web/AGENTS.md`: thêm ngoại lệ D-6 ngay dưới rule marker; thêm quy tắc bóng mềm D-5 và bộ font D-3.
- `docs/art/06`: §63 ghi ngoại lệ ánh sáng cổng; phần UI ghi font và vật liệu sinh bằng code.
- `docs/product/2026-10-02-product-review-and-direction.md`: cột trạng thái PR-02 ghi "người dùng chọn làm lại toàn bộ UI 02/10/2026, xem spec này".
- `assets/PROVENANCE.md`: font và texture mới.
- `docs/ai/MEMORY.md` và báo cáo verification theo protocol.

## 9. Kiểm thử và tiêu chí hoàn thành

### 9.1. Test tự động

- `packages/ui`: render, role/`aria`, focus của từng primitive; tương phản cho cặp màu mới; token font có fallback.
- `tools/art-codegen`: test như §4.2.
- `game-web`: hàm thuần cho chỉ báo ngoài màn hình, ngưỡng hiện nhãn NPC, chọn hướng vòm cổng; `portalPresentation` dừng ở giảm chuyển động và dọn tween khi `destroy`; test HUD cập nhật cho cấu trúc mới.
- `game-content`: test cho validator cổng-trong-opening (một case đúng, một case sai) và cả hai case thật pass.
- `node .claude/skills/authoring-case-content/scripts/check-case-flow.mjs case-001` và `case-002`: vẫn `closable=true`.

### 9.2. E2E và ảnh chụp

- Toàn bộ E2E hiện có pass (chơi hết Case #001 và #002, onboarding, điều hướng, viewport).
- Bộ ảnh tại `docs/ai/playtests/YYYY-MM-DD-ui-foundation-hud/` (ngày chạy verification) ở 1920×1080, 1280×720, 760×600, 390×844 cho: vào game, gần vật chứng, gần cổng, vật chứng ngoài màn hình, đổi mục tiêu; kèm ảnh "trước" cùng vị trí.

### 9.3. Hiệu năng

- FPS trên GL phần mềm (cách đo của Phase 11B) không giảm quá 10% so với baseline đo ngay trước khi sửa.
- Báo dung lượng font thêm vào bundle/public và thời gian chờ font trước khi Phaser boot.

### 9.4. Duyệt bằng mắt

Ảnh trước / sau / concept đặt cạnh nhau trong báo cáo; người dùng duyệt trước khi phase được đánh dấu hoàn tất.

### 9.5. Definition of Done

Chạy và dán output: `npm run lint`, `npm run test`, `npm run build`, `npm run format:check`, `npm run test:e2e`, `npm run memory:check`, và test Python của `tools/art-codegen`. Báo cáo theo AGENTS.md §7.

## 10. Rủi ro và câu hỏi mở

| Mã | Rủi ro | Xử lý |
| --- | --- | --- |
| R-1 | Dải giấy phía trên đến từ camera/biên scene, không phải HUD. | Xác định ở bước đầu; nếu ngoài phạm vi, ghi báo cáo và đề xuất spec riêng. |
| R-2 | Font tải chậm làm Phaser vẽ nhãn bằng fallback. | Chờ `document.fonts.load` có timeout (§4.1); test E2E chụp nhãn sau boot. |
| R-3 | Lớp sáng cộng của cổng tốn FPS trên GL phần mềm. | Đo theo §9.3; nếu vượt ngưỡng, dùng ảnh sáng tĩnh thay cho vẽ động. |
| R-4 | Dời cổng vào opening làm thay đổi đường đi và E2E điều hướng. | Chạy lại E2E điều hướng; spawn `from_*` không trùng cổng; `check-case-flow` cho cả hai case. |
| R-5 | E2E dựa vào chữ hoặc cấu trúc DOM của `KeyHints`/nhãn NPC. | Rà selector trước khi sửa; đổi test cùng commit, ghi lý do. |
| R-6 | Xanh Mono quá mảnh ở một số kích thước. | Không dùng dưới 18px (D-3); kiểm trên ảnh 1280×720. |

## 11. Ngoài phạm vi

Màn tiêu đề, chọn case, tạm dừng, briefing, màn tổng kết (phần 3); hội thoại, modal evidence/listening (phần 4); sổ tay và bảng suy luận (phần 5); art nhân vật và scene ngoài vòm cổng; palette màu; backend.

## 12. Các spec tiếp theo của chương trình làm lại UI

1. **Phần 3 — Vỏ ngoài game:** màn tiêu đề tràn viền, chọn case, tạm dừng, briefing, màn tổng kết.
2. **Phần 4 — Hội thoại và modal evidence/listening.**
3. **Phần 5 — Sổ tay và bảng suy luận:** bỏ thanh tab và phân trang, chuyển sang thẻ chia mục và bảng ghim; xóa alias `PaperPanel`.

Mỗi phần có spec, plan và verification riêng; chỉ mở khi người dùng yêu cầu.
