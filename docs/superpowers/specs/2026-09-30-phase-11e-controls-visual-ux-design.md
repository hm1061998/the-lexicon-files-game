# Phase 11E — Điều khiển màn hình, hoàn thiện scene và UI/UX

## 1. Mục tiêu

Làm cho việc di chuyển trong Case #001 trực quan theo WASD truyền thống, đồng thời cải thiện độ liền mạch của office/archive, khả năng đọc và sử dụng các panel UI, và nhịp thở của nhân vật. Giữ góc nhìn game 2D dimetric 2:1, gameplay điều tra, nhận diện art giấy sepia và các ranh giới kiến trúc hiện có.

Phase 12 trong roadmap hiện dành cho Testing & Performance. Công việc này là phần hoàn thiện visual polish nên được quản lý là Phase 11E, không đổi định nghĩa Phase 12.

## 2. Phạm vi

### 2.1. Di chuyển WASD theo hướng màn hình

- W đi lên màn hình, A đi sang trái, S đi xuống, D đi sang phải. Tổ hợp hai phím vuông góc đi theo hướng chéo; tốc độ màn hình được chuẩn hóa để không nhanh hơn đi thẳng.
- Scene vẫn lưu tọa độ logic `(u,v)` và collision/bounds tiếp tục giải trên logical plane. Bộ input đổi vector màn hình `(screenX, screenY)` sang vector logic bằng nghịch đảo projector dimetric:

```text
u = screenX / 128 + screenY / 64
v = screenY / 64 - screenX / 128
```

- Các phím đối nhau triệt tiêu theo từng trục; focus trong input/textarea/contenteditable không di chuyển nhân vật. Khóa di chuyển khi modal, hội thoại hoặc chuyển scene vẫn giữ nguyên.
- Hướng animation tiếp tục dùng bốn hàng NE/SE/SW/NW hiện có. Chọn hướng từ vector màn hình; với hướng nằm đúng giữa hai hàng, dùng quy tắc tie ổn định để không đổi hàng liên tục.
- HUD và tài liệu điều khiển phải hiển thị đúng cách WASD mới.

### 2.2. Bố cục art office và archive

- Dựng lại bố cục theo mô-đun sàn–tường–cửa–nội thất để mép phòng khép kín, dải tường khớp mặt sàn, nội thất thành cụm chức năng và lối đi dễ đọc.
- Giữ phong cách minh họa, camera dimetric 2:1, palette, hướng sáng và giới hạn màu của `docs/art/06`; tăng độ liền mạch và chiều sâu bằng composition, không đổi sang phong cách mới.
- Giữ nguyên ID scene/asset/interactable, evidence, dialogue, objective, trigger và ý nghĩa điều tra. Có thể đổi logical position, footprint, scale hoặc asset khi cần để cải thiện composition và traversal.
- Scene chỉ load asset qua content manifest hiện hữu; asset mới phải theo contract và có provenance. Không đặt art/content ID của Case #001 vào React hoặc scene class.

### 2.3. UI/UX HUD và panel

- Evidence modal vừa viewport; tiêu đề và thao tác đóng luôn tìm thấy; phần thân chứa ảnh, transcript, câu hỏi và điều khiển có thể cuộn bên trong panel mà không cắt nội dung ra ngoài màn hình.
- Giữ focus trap, focus-visible, trả focus khi đóng, và target điều khiển tối thiểu theo chuẩn UI hiện hữu. Modal tiếp tục khóa gameplay input.
- Rà tính nhất quán về khoảng cách, cỡ chữ, chiều cao nút và phân cấp thị giác của HUD, notebook, pause và evidence. Chỉ chỉnh các điểm cần để dễ đọc/dễ dùng; giữ diegetic paper UI, không thiết kế lại toàn bộ sản phẩm thành một dashboard.
- Hỗ trợ rà soát ở viewport desktop 1280×720 và compact 760×600. Không mở rộng yêu cầu sang mobile.
- Nội dung, hành vi learning, dialogue, evidence và persistence không đổi.

### 2.4. Nhịp thở nhân vật

- Chẩn đoán cập nhật runtime và chuyển trạng thái để loại cảm giác giật. Hiệu ứng idle là nhịp co giãn rất nhỏ, chậm, liên tục; giảm scale amplitude so với ±0.8%/chu kỳ 1.8 giây hiện tại và blend êm khi vào/ra trạng thái idle.
- Áp dụng thống nhất cho player và NPC khi đứng yên; không thở khi di chuyển hoặc đang tham gia dialogue. NPC không tự đi.
- Chân tiếp tục neo tại floor point; không thay logical position, collider, depth, interaction radius, marker, name tag hoặc gameplay state.
- `reducedMotion` tắt hoạt ảnh và giữ scale trung tính. Không dùng timer/global mutable singleton; tính nhịp từ clock của scene với phase offset ổn định giữa các NPC.
- Biên độ, chu kỳ và thời gian blend được tinh chỉnh bằng preview nhằm tạo nhịp gần như không gây chú ý, không làm thân nhân vật nảy lên hoặc nhấp nháy.

## 3. Ngoài phạm vi

- Không đổi projection dimetric, camera model, scene graph, event bus, game store hoặc persistence architecture.
- Không tạo lại character roster, không thêm walk direction thứ 5–8, không thêm AI/pathfinding hoặc tự di chuyển NPC.
- Không đổi case rules, evidence IDs, dialogue/content, learning logic, API/backend hoặc quy tắc thương mại.
- Không đổi toàn bộ art direction, palette, typography hoặc thiết kế UI đã duyệt.

## 4. Kiến trúc và ranh giới

- Pure input/projection helpers nhận phím và trả vector logic; `WorldScene` áp dụng movement, collision, camera và animation hiện có. Unit tests của helper không phụ thuộc Phaser/DOM.
- Scene và asset tiếp tục được mô tả trong `packages/game-content`; Phaser dựng scene, React render HUD/panel, giao tiếp qua typed event bus/Zustand store.
- Evidence modal và notebook vẫn là React UI; không đọc hoặc gọi Phaser internals. Asset load/transition và event listener phải cleanup theo lifecycle scene.
- Breathing là hiệu ứng presentation thuần; state walking/dialogue/reduced motion chỉ quyết định output visual và không phát domain effect.

## 5. Tiêu chí nghiệm thu

1. W/A/S/D dịch chuyển lần lượt lên/trái/xuống/phải theo màn hình; mỗi cặp chéo đi đúng góc; vận tốc hiển thị của đi thẳng và đi chéo bằng nhau trong sai số test.
2. Collision, bounds, side-slide, interaction range, scene transition, typing-focus guard và input lock hoạt động như trước.
3. Player/NPC đổi hàng animation theo hướng chiếu ổn định; không flicker khi đi thẳng theo screen cardinal.
4. Screenshot office/archive ở 1280×720 cho thấy sàn/tường/nội thất kết thành phòng có chủ đích, lối đi và vùng chức năng dễ nhận ra; không có dải tường lạc khỏi mép phòng. Layout qua scene-layout và E2E hiện có.
5. Evidence modal hiển thị toàn bộ nội dung qua cuộn nội bộ ở 1280×720 và 760×600; header/đóng, keyboard focus, scroll, ảnh và controls vẫn dùng được.
6. Notebook, pause và HUD được rà ở cùng viewport; chữ, focus và hit target rõ ràng, đúng palette và product guardrails.
7. Nhịp thở của player và NPC thay đổi liên tục, mềm, nhỏ và lệch pha; bắt đầu/dừng không snap; nhân vật không trượt chân; dialogue, bước đi và reduced-motion tắt hiệu ứng đúng trạng thái.
8. Thực hiện full phase gates theo `AGENTS.md`: lint, test, build; typecheck, format, memory checks; E2E và kiểm tra art/tool nếu có sửa pipeline. Báo rõ output và hạn chế còn lại.

## 6. Tệp/deliverable dự kiến

- `apps/game-web/src/game/systems/isoInput.ts` và test; `WorldScene`/facing hoặc key hints nếu cần.
- `packages/game-content/cases/case-001/scenes/main_office.json`, `archive.json`, và asset `public/assets`/provenance tương ứng nếu composition yêu cầu asset mới.
- `apps/game-web/src/evidence/EvidenceModal.tsx`, `evidence.css`, cùng test; CSS/markup HUD, notebook hoặc pause chỉ khi rà soát xác nhận cần.
- `apps/game-web/src/game/systems/breathing.ts`, tests, `WorldScene.ts`, E2E cho player/NPC idle, dialogue, walking và reduced motion.
- Cập nhật `apps/game-web/AGENTS.md`, `docs/01_GAME_DESIGN_DOCUMENT.md`, `docs/art/06_PHASER_CHARACTER_SCENE_ASSET_MODEL_SPEC.md`, `docs/art/07_AI_ASSET_PROMPT_PACK.md` và architecture docs nếu control/art contract mới cần được lưu.

