# 07 — Bộ prompt tạo art bằng công cụ AI miễn phí

Tài liệu vận hành (không đổi product rule). Nguồn sự thật về phong cách, kích thước và tên file vẫn là `docs/art/06_PHASER_CHARACTER_SCENE_ASSET_MODEL_SPEC.md` và ảnh trong `docs/concept/`. Khi có mâu thuẫn, dùng `art/06`.

## 1. Quy trình

1. Mở công cụ AI tạo ảnh bạn dùng (Gemini app, Bing Image Creator, ChatGPT…). **Đính kèm `docs/concept/ingame_main_office_hud.webp` làm ảnh tham chiếu phong cách** cho mọi lần tạo, nếu công cụ hỗ trợ tải ảnh lên.
2. Dán **STYLE_LOCK** (mục 2) rồi dán prompt riêng của asset (mục 4). Tạo 3–4 phương án, chọn ảnh giống concept nhất.
3. Lưu bản gốc (PNG/JPG/WebP, càng lớn càng tốt, tối thiểu 1024 px cạnh dài) vào thư mục `assets/_incoming/` với **đúng tên file đích** (mục 4), ví dụ `prop_office_desk_01.png`.
4. Ghi một dòng vào `assets/PROVENANCE.md` (công cụ, ngày, prompt rút gọn, điều khoản sử dụng đầu ra của công cụ đó).
5. Báo tôi. Tôi sẽ: kiểm tra từng ảnh bằng mắt so với palette/phong cách, tách nền, đưa về kích thước/định dạng chuẩn (WebP), đặt vào đúng thư mục `assets/…` và tích hợp vào game.

## 2. STYLE_LOCK (dán ở đầu mọi prompt)

```text
Style: "lexicon_isometric_v1" — hand-drawn 2.5D isometric illustration for a detective game.
Camera: orthographic isometric view, rotated 45 degrees horizontally, looking down about 35 degrees. Never perspective, never a different angle.
Lines and shading: clean ink outline, soft pencil shading, subtle paper grain, low saturation, warm sepia mood.
Lighting: key light from the upper-left, soft fill, soft shadows falling to the lower-right. Same direction for every asset.
Palette only: Paper Cream #D8C5A4, Light Beige #CDBA97, Warm Gray #A89B87, Dark Brown #3E342B, Ink Black #2A2521, Muted Green #737660, Dusty Olive #8A8469. Investigation Red #A4412D / Dark Red #743026 ONLY on clues, evidence and objective marks — never on furniture or clothing.
Forbidden: neon, glossy or plastic look, strong bloom, photorealism, text or letters, logos, real brands, watermarks, people (unless the asset is a character), dramatic cast shadows on the ground.
Background: one flat solid pure magenta #FF00FF background, no gradient, no floor shadow, single object centered with margin.
```

Với texture giấy và toàn cảnh (mục 4.1, 4.2) bỏ dòng "Background".

## 3. Kích thước đích và neo (tôi xử lý — bạn chỉ cần tỉ lệ đúng)

| Loại | Kích thước cuối | Ghi chú |
|---|---|---|
| Floor/wall cảnh | 2400×1600 (tỉ lệ 3:2) | một ảnh mỗi cảnh, < 1,5 MB |
| Prop | cạnh dài 128–320 px | < 150 KB; đáy vật thể = điểm chạm sàn |
| Evidence | 512×512 | nền giấy/đặt trên bàn nhìn thẳng |
| Portrait | 512×512 | đầu + vai, nền phẳng |
| Nhân vật | khung 256×256, chân ở 88% chiều cao | 4 hướng: NE, SE, SW, NW |

## 4. Danh sách asset và prompt

Mỗi prompt bên dưới ghép sau STYLE_LOCK. Giữ nguyên tên file.

### 4.1 Ưu tiên 1 — thay đổi nhìn thấy ngay

| File đích | Prompt riêng |
|---|---|
| `paper_texture.png` | `Seamless tileable paper grain texture, warm cream #D8C5A4, very subtle fibers and faint stains, no objects, no text, no vignette, square 1024x1024.` |
| `scene_office_floor.png` | `Empty isometric office floor seen from above at 35 degrees: light beige worn linoleum tiles with faint ink grid lines, a slightly darker rug area in the center, no furniture, no walls, fills the whole frame edge to edge, 3:2 landscape.` |
| `scene_office_wall_back.png` | `Isometric back wall segment of a vintage detective office: cream plaster wall, dark brown wooden baseboard, one bulletin board with blank pinned papers (no readable text), muted green trim, wall only, long horizontal strip, 12:1 aspect.` |
| `prop_office_desk_01.png` | `Isometric wooden office desk with two monitors switched off, stacked paper files, a desk lamp and a coffee mug, dark brown wood, warm gray metal drawers, viewed from the front-right corner.` |
| `prop_note_01.png` | `Small handwritten paper note pinned flat, isometric, cream paper, ink scribbles (illegible), one thin Investigation Red #A4412D corner mark.` |
| `prop_door_hallway_01.png` | `Isometric office door in a wall frame, muted green painted door with small frosted glass window, dark brown frame, closed.` |
| `evidence_meeting_minutes.png` | `Top-down sheet of meeting minutes on a wooden desk: paper with faint printed lines (illegible), a paperclip, coffee ring stain, soft pencil shading.` |
| `evidence_leo_phone_recording.png` | `Top-down small voice recorder lying on a desk with a folded note beside it (illegible), warm gray metal body, small Investigation Red #A4412D record dot.` |
| `evidence_security_log.png` | `Top-down printed access log sheet on a clipboard, columns of tiny illegible entries, one line highlighted with Investigation Red #A4412D marker.` |

### 4.2 Ưu tiên 2 — hoàn thiện cảnh Archive và đồ phụ

| File đích | Prompt riêng |
|---|---|
| `scene_archive_floor.png` | như `scene_office_floor.png` nhưng `concrete-grey worn tiles, darker and colder, archive storage room`. |
| `scene_archive_wall_back.png` | như `scene_office_wall_back.png` nhưng `metal shelving units with cardboard archive boxes along the wall, dim lamp`. |
| `prop_security_terminal_01.png` | `Isometric old security terminal: boxy CRT monitor with beige case, keyboard, small green-tinted screen (no readable text), on a small metal stand.` |
| `prop_audio_recorder_01.png` | `Isometric handheld voice recorder standing on its side on a tiny stand, warm gray, small Investigation Red #A4412D dot.` |
| `prop_office_chair_01.png` | `Isometric swivel office chair, dark brown fabric, warm gray base, three-quarter view.` |
| `prop_office_plant_01.png` | `Isometric potted office plant in a muted green ceramic pot, dusty olive leaves.` |
| `prop_filing_cabinet_01.png` | `Isometric two-drawer filing cabinet, warm gray metal, small paper labels (illegible).` |
| `prop_meeting_table_01.png` | `Isometric long wooden meeting table with six chairs, scattered papers, a coffee mug, dark brown wood.` |

### 4.3 Ưu tiên 3 — nhân vật (khó nhất quán nhất, làm sau khi mục 4.1–4.2 ổn)

Mỗi nhân vật cần **4 ảnh idle**, cùng khung hình, cùng chiều cao, chân cùng vị trí: `chr_<tên>_idle_ne.png`, `_se`, `_sw`, `_nw`. Trong một lần tạo, yêu cầu nhân vật "same character, same outfit, turn-around pose". Nếu công cụ có thể, tạo tấm turn-around 4 góc rồi cắt.

| Nhân vật | Mô tả gắn vào prompt (theo art/06 §8–9) |
|---|---|
| `player` (Investigator) | `brown knee-length trench coat, dark trousers, leather shoes, neutral shirt, small notebook in hand, slightly stronger outline, standing idle. No red on clothing.` |
| `leo` | `Operations Analyst: office shirt with rolled sleeves, dark trousers, slightly nervous posture, average height.` |
| `anna` | `Project Coordinator: smart office wear, clean silhouette, lighter upper clothing, upright posture.` |
| `david` | `Office Manager: formal vest or jacket, more formal shape, slightly broader build, composed posture.` |

Portrait (tuỳ chọn, ưu tiên 3): `portrait_leo_neutral.png`, `portrait_anna_neutral.png`, `portrait_david_neutral.png` — `head-and-shoulders portrait of <mô tả nhân vật>, neutral expression, flat muted background, hand-drawn ink outline`.

### 4.4 Walk sheet — ảnh đi bộ thật thay bản thủ tục

Game đang dùng sheet đi bộ **tạm** sinh bằng code từ 4 ảnh idle (`tools/art-codegen/make_walk_frames.py`). Ảnh thật thay vào **cùng tên file, cùng lưới** là chạy, không sửa code.

**Hợp đồng sheet trong game** (`apps/game-web/public/assets/characters/<tên>/chr_<tên>_walk.png`):

| Mục | Giá trị |
|---|---|
| Lưới | **8 cột × 4 hàng**, ô vuông bằng nhau |
| Thứ tự hàng (trên → dưới) | `NE`, `SE`, `SW`, `NW` (giống turn-around idle) |
| Cột | 8 khung của một chu kỳ bước, lặp liền mạch (khung 8 nối về khung 1), 10 fps |
| Ô trong game | 160×160 px, sheet 1280×640, RGBA nền trong suốt |
| Chân | đế giày của khung thấp nhất trong hàng ở **88%** chiều cao ô (hàng 141); nhân vật cao ~100 px |
| Khung 1 | gần giống pose idle của hướng đó (hai chân khép) |

**Prompt** — dán STYLE_LOCK (mục 2, giữ dòng "Background" magenta), đính kèm 4 ảnh idle `chr_<tên>_idle_*.png` của đúng nhân vật làm tham chiếu, rồi dán:

```text
Sprite sheet of the SAME character as the attached reference images, same outfit, same proportions, same line weight and colours.
Walk cycle, 8 frames per row, 4 rows, arranged as a strict grid of 8 columns x 4 rows of equal square cells, no gaps drawn, no borders, no numbers, no text.
Row 1: walking towards the upper-right (back three-quarter view, NE). Row 2: walking towards the lower-right (front three-quarter view, SE).
Row 3: walking towards the lower-left (front three-quarter view, SW). Row 4: walking towards the upper-left (back three-quarter view, NW).
Each row is one looping step cycle: frame 1 contact with feet together like the idle pose, frames 2-4 right leg steps forward, frame 5 passing, frames 6-8 left leg steps forward, then back to frame 1.
Subtle body bob (a few pixels), arms swing slightly, no running, no jumping.
Every cell: the whole figure fits with margin, the character is centred horizontally, the soles of the lowest foot sit on the same horizontal line in every cell (about 88% of the cell height from the top), same figure height in every cell.
Flat solid pure magenta #FF00FF background everywhere, no floor, no shadow on the ground.
```

Mô tả nhân vật gắn thêm vào prompt: dùng dòng của nhân vật ở bảng 4.3. Nếu công cụ khó giữ 32 khung một lần, tạo **từng hàng** (8×1) cùng kích thước ô rồi ghép dọc theo thứ tự NE, SE, SW, NW trước khi cắt.

**Đặt file thay thế:**

1. Lưu sheet gốc vào `assets/_incoming/chr_<tên>_walk_raw.png` (không commit). Kích thước bất kỳ nhưng rộng chia hết cho 8, cao chia hết cho 4.
2. Chạy bằng Python venv: `python tools/art-codegen/slice_walk_sheet.py assets/_incoming/chr_<tên>_walk_raw.png <tên>`. Tool tách nền magenta, dùng một tỉ lệ chung cho cả sheet (nhân vật cao nhất → 100 px), đưa đế giày thấp nhất mỗi hàng về dòng 88% (khung nhấc chân vẫn giữ độ nhấc) và ghi đè `apps/game-web/public/assets/characters/<tên>/chr_<tên>_walk.png`.
3. Kiểm tra hợp đồng: `python -m unittest test_make_walk_frames` trong `tools/art-codegen` (kích thước, chân 88%, khung khác nhau, vòng lặp liền mạch, không viền magenta).
4. Ghi dòng mới vào `assets/PROVENANCE.md`, thay dòng "code-derived" của file đó.

Chỉ player đang được nối vào game (`characterSheets.player.walk` trong `case.json`). NPC đứng yên nên dùng ảnh idle; sheet NPC chỉ để xem trước.

## 5. Tiêu chí tôi dùng để nhận/loại ảnh

- Đúng góc isometric và hướng sáng; không có chữ đọc được, logo, watermark.
- Chỉ dùng màu trong palette; đỏ chỉ ở dấu hiệu manh mối/evidence.
- Nền phẳng magenta sạch để tách được; viền không lem.
- Cùng độ dày nét và mức bão hòa giữa các asset; nhân vật cùng tỉ lệ, chân cùng vị trí giữa 4 hướng.
- Ghi đủ provenance. Không dùng đầu ra nếu điều khoản công cụ cấm dùng thương mại hoặc không rõ.

## 6. Việc tôi làm sau khi nhận file

Tách nền và đưa về WebP đúng kích thước, đặt vào `assets/…` theo `art/06` §38, sinh manifest texture, thay placeholder trong scene JSON/loader (chỉ đổi texture key, kích thước, origin và collider theo file thật — không đổi logic game), chạy đủ test và E2E, rồi cập nhật memory. Nếu asset nào không đạt, tôi giữ placeholder cho asset đó.
