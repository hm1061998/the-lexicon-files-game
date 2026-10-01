# Phase 11E — Camera gần, điều khiển chuột/phím và cổng chuyển scene

**Trạng thái:** Người dùng đã duyệt hướng thiết kế và spec trong chat ngày 2026-10-01. Implementation plan được lập từ spec này và chờ review trước coding. Chưa triển khai phạm vi mới.

## 1. Mục tiêu và phạm vi

Cho phép điều tra bằng chuột, bàn phím hoặc xen kẽ hai phương thức; nhân vật dễ quan sát, minimap chỉ rõ vị trí và controls học không chen vào lúc chơi. Cổng chuyển scene lấy ý tưởng bục tròn/hologram từ ảnh người dùng, chuyển thành **bục đồng, ánh vàng nhẹ** theo lựa chọn đã xác nhận.

Phạm vi gồm sáu phần:

1. Camera zoom sâu hơn, tiếp tục follow và clamp.
2. Chọn chế độ dịch chỉ trong Settings.
3. Dấu player/marker minimap rõ và đúng đơn vị.
4. Arrow keys dùng song song WASD.
5. Click để đi và tương tác, có tìm đường tránh vật cản.
6. Hai cổng chuyển scene với hình dáng bục đồng và hiệu ứng ánh vàng tiết chế.

Giữ Phase 11E mở. Không bắt đầu Phase 12, không thêm backend, dependency, nội dung học, scene thứ ba, zoom slider hoặc hệ thống teleport tùy ý trong cùng scene.

## 2. Nguồn và quyết định đã chốt

- Rule gốc và frontend: `AGENTS.md`, `apps/game-web/AGENTS.md`.
- Product/learning/content: docs 01–03; kiến trúc: `docs/architecture/ARCHITECTURE.md`; asset/projection/palette: art/06.
- Scope trước: `2026-10-01-phase-11e-camera-audio-ui-addendum.md`. Spec mới thay mốc zoom và vị trí controls translation của addendum đó; các quy tắc audio/lifecycle khác giữ nguyên.
- Phân tích và bằng chứng: `docs/ai/2026-10-01-phase-11e-input-feedback-analysis.md`.
- Người dùng đã chọn: **click mục tiêu xa để đi tới; click lần nữa để tương tác**. Việc đến nơi không tự tương tác.
- Người dùng đã chọn: **bục đồng, ánh vàng nhẹ**, không giữ neon xanh của ảnh tham chiếu.
- Tiếp tục inline trên `dev` theo workflow hiện có; spec/plan tiếng Việt, npm + Nx, giữ debug.log nguyên trạng.

## 3. Camera

- Zoom khởi điểm **1.8× desktop**, **1.6× compact**. Compact theo breakpoint đang có: dưới 960px rộng hoặc dưới 640px cao.
- Tiếp tục nâng zoom nếu viewport lớn hơn projected scene bounds, dùng fit margin hiện có để tránh lộ mép do rounding.
- Follow mượt, dead-zone nhỏ; player luôn trong khung khi đi đến bốn rìa, resize hoặc chuyển Office/Archive.
- Zoom chỉ thay view. Logical position, tốc độ di chuyển theo màn hình, collision, tương tác và minimap không đổi đơn vị.
- Click phải được đổi từ CSS/canvas coordinates qua camera hiện tại rồi inverse projection sang logical plane, đúng khi camera cuộn, zoom và canvas letterbox.
- Chụp 1280×720 và 760×600 để duyệt framing. Nếu cần chỉnh mốc zoom do feedback ảnh, ghi rõ thay đổi; không âm thầm giảm về mức cũ.

## 4. Chế độ dịch chỉ ở Settings

- Giữ ba mode và giá trị đã lưu, callbacks/settings persistence hiện có.
- Chỉ Settings/Pause có control đổi mode. Bỏ controls đó khỏi dialogue, notebook, evidence, listening/vocabulary reader và mọi gameplay overlay.
- Các nơi hiển thị nội dung vẫn đọc mode đã lưu và áp dụng đúng translation/tooltip. Tooltip từ vựng tiếp tục chỉ mở khi click.
- Có nút mở Settings/Pause bằng chuột, accessible name, focus visible, target tối thiểu 44px; Esc vẫn hoạt động như trước.
- Thay đổi mode trong Settings phải áp dụng sau khi resume và tồn tại qua reload; không thay progress hoặc reset case.

## 5. Minimap

Root cause đã xác minh: radius lấy từ logical world width 16, nhưng SVG viewBox là projected width 1792. Dấu player hiển thị đường kính khoảng 0.12 CSS px dù vị trí cập nhật đúng.

- Tính marker size trong cùng không gian với viewBox; bảo đảm dấu player nhìn thấy khoảng **8–10 CSS px** ở hai viewport nghiệm thu khi map mở.
- Dấu player có nền mực/viền giấy rõ và chú giải phân biệt với NPC, evidence, cổng. Không dùng màu đỏ làm trang trí player.
- Markers mục tiêu cũng sửa sai đơn vị, giữ ý nghĩa màu đã duyệt. Dấu player vẽ trên markers/geometry để không bị che khi trùng tọa độ.
- Player position tiếp tục từ Phaser → typed bus → store → React. Không tạo một nguồn vị trí khác hoặc lấy camera scroll làm vị trí world.
- Map cập nhật khi dùng bất kỳ input nào, ngay khi spawn/chuyển scene và không giữ vị trí scene cũ trong lúc transition.
- Minimap là view; click lên panel hoặc controls của nó không phát lệnh world navigation.

## 6. Điều khiển bàn phím

- Up/W lên màn hình, Down/S xuống, Left/A sang trái, Right/D sang phải.
- Gộp từng cặp bằng trạng thái hướng, không cộng lực: W + Up không nhanh hơn W; diagonal được chuẩn hóa. Hai hướng đối nhau triệt tiêu như WASD hiện có.
- Bỏ qua input/textarea/contenteditable. Chỉ preventDefault cho arrow khi phím được dùng để chơi, không chặn thao tác trên form hoặc browser ngoài canvas/game flow.
- Keyboard movement hủy đường đi đang có từ chuột và lập tức nhận quyền di chuyển. E vẫn dùng tương tác hiện tại, không kích hoạt mục tiêu xa đã click nếu chưa trong radius.
- Dialogue/modal/pause/transition khóa movement và interaction như hiện tại. Press trong lúc khóa không được thực thi trễ khi mở khóa.
- Cleanup cả key registrations, pointer listeners và navigation state khi shutdown/destroy.

## 7. Điều khiển chuột và tìm đường

### 7.1. Hành vi người chơi

- Chỉ primary click phát lệnh world. Click sàn reachable: đi tới vị trí đó rồi dừng.
- Click NPC/chứng cứ/cổng đang ở ngoài interaction radius: chọn đường đến điểm đứng reachable trong radius, đi tới rồi dừng. Không emit interaction khi đến nơi.
- Khi ở trong radius, một click rõ vào mục tiêu hoặc nút prompt sẽ tương tác qua cùng typed event bus/eligibility như E.
- Click lại mục tiêu khi vẫn còn ở xa chỉ cập nhật lệnh đi; không xếp hàng tương tác cho tương lai.
- Click mới thay mục tiêu/route hiện tại. Route không được lưu trong IndexedDB hoặc tạo state gameplay trùng ở Zustand.
- Click xuyên HUD/modal, đổi mode, mở notebook hoặc đóng dialogue không làm nhân vật di chuyển. Double click không được phát hai lần tương tác hay skip dialogue node.
- Nút mở notebook, map và Settings/Pause phải click được cả desktop/compact, để các thao tác đã có shortcut cũng thực hiện được bằng chuột.

### 7.2. Chọn mục tiêu và tọa độ

- Ưu tiên mục tiêu world có thể tương tác khi click vùng hình hiển thị của nó; giữ visual hit testing tách khỏi collision footprint.
- Mục tiêu hiện bị occlusion hoàn toàn không được chọn xuyên tường; khi nhiều vùng chồng nhau, dùng thứ tự hiển thị và lựa chọn ổn định.
- Không điều hướng vào background ngoài diamond sàn, vào object blocking hoặc ngoài scene bounds.
- Không đổi ID công khai của Case #001. Tên/prompt/đích scene lấy từ content.

### 7.3. Navigation và collision

- Dùng A* thuần TypeScript trong `apps/game-web/src/game/systems`, đầu vào là bounds/solids/footprint logical hiện có. Không đưa presentation navigation vào game-core hoặc learning-engine.
- Điểm đích cho interaction nằm trong radius, có chỗ cho body 0.36×0.36 và reachable từ vị trí hiện tại; không đi thẳng vào tâm furniture hoặc NPC.
- Đường đi có clearance cho player, không cắt corner qua hai vật cản và không làm tắt passage hợp lệ. Nếu dùng smoothing, từng segment phải được kiểm tra va chạm.
- Movement mỗi frame vẫn qua collision resolver và cùng tốc độ/animation/footsteps của keyboard. Pathfinding không teleport player hoặc ghi trực tiếp position vào store.
- Thuật toán có giới hạn tìm kiếm hữu hạn và trả trạng thái không tìm được đường. Không loop vô hạn, không chạy pathfinding lại mỗi frame.
- Đích không hợp lệ/không reachable: không phát tương tác và không đi xuyên vật cản; kết thúc navigation sạch, phản hồi nhẹ bằng cursor/indicator mực hoặc thông báo UI theo strings, không dùng hiệu ứng phạt.
- Khi bị collision làm không tiến triển, dừng route thay vì rung/chạy tại chỗ vô hạn.
- Modal/pause/transition, scene shutdown hoặc mất quyền input hủy route. Resume không tự khôi phục lệnh cũ.

## 8. Cổng chuyển scene

### 8.1. Hình ảnh

- Bục tròn thấp nhìn theo dimetric 2:1, chất liệu đồng cũ, viền mực nâu, grain giấy và muted sepia.
- Lấy các vòng đồng tâm, vòng sáng xoay chậm và cột ánh sáng trong ảnh làm ý tưởng hình dạng. Ánh vàng mềm, opacity thấp, hạt ít; không neon xanh, glossy PBR, strong bloom hoặc flash toàn màn hình.
- Reduced motion giữ cổng tĩnh và vẫn dễ nhận ra là điểm chuyển scene.
- Palette theo art/06; đỏ chỉ ở marker/selection điều tra hợp lệ, không dùng cho nền bục hay ánh sáng trang trí.
- Tạo asset/effect phù hợp pipeline code-native hiện có, ghi provenance nếu thêm asset. Không dùng ảnh JPEG tham chiếu làm room background hoặc sprite cổng trực tiếp.

### 8.2. Content và gameplay

- Giữ hai transition public IDs: Office `hallway_door` → Archive `from_office`; Archive `PLACEHOLDER_archive_door` → Office `from_archive`.
- Bục đặt trên sàn phía trong scene và có lối đứng/đi tiếp cận. Không dùng tọa độ tâm door frame hiện ở mép world làm tâm bục nếu khiến bục tràn bounds.
- Update authored positions, interaction anchors, texture/presentation metadata và spawn nếu cần để tạo cặp cổng đúng geometry. Mọi thay đổi nằm trong game-content; validation kiểm bounds, solids, clearance và reachability cả hai chiều.
- Bục là mặt sàn tiếp cận được, không tự thêm collider chặn người chơi đứng trong interaction radius. Kích thước/elevation hình vẽ không làm sai điểm sàn hoặc depth.
- Cổng không kích hoạt do overlap/đứng lên bục. Đến gần rồi nhấn E hoặc click tương tác lần nữa mới chuyển scene.
- Dùng transition owner, loading/fade/input lock và texture lifecycle hiện có. Không gọi API, không reset progress và không đổi content điều tra.
- Bản đồ và prompt thể hiện đúng destination từ content; prompt cũ “Ra hành lang” phải được cập nhật cho cổng đi Archive nếu không còn phản ánh presentation mới.

## 9. Kiến trúc và ranh giới

| Thành phần | Sở hữu |
|---|---|
| Phaser scene/presentation systems | Camera, sprite/animation, input, route tạm thời, hit testing, collision, portal effects |
| Typed bus + bridge | Interaction request, publish vị trí, input lock và transition theo contract |
| Zustand | Case progress, nearby/view state đã phê duyệt, settings hiện có |
| IndexedDB | Save/settings như trước; không lưu route |
| Game-content | Geometry, IDs/prompt/transition/spawn và asset/presentation metadata |
| Game-core/learning-engine | Luật điều tra và học hiện có; không chứa navigation, DOM, Phaser hoặc React |

Schema/presentation metadata mới nếu cần phải optional hoặc có migration rõ cho content cũ. Scene renderer vẫn generic, không hardcode Case #001. Không thêm global mutable singleton.

## 10. Kiểm thử và nghiệm thu

### Unit và content

- Arrow/WASD gộp hướng, tốc độ diagonal, đối hướng, typing và input lock.
- A*: đường quanh desk/partition, corridor/doorway đủ clearance, corner blocking, đích invalid/unreachable, điểm tiếp cận trong radius, thay/hủy route và không tiến triển.
- Minimap: đúng projection/coordinate space, radius trong đơn vị đúng và sync spawn/scene.
- Controls translation chỉ ở Settings, mode rendering/persistence vẫn đúng.
- Content/schema/geometry portal: IDs và hai chiều, bounds/clearance/spawn/reachability, asset cleanup và reduced motion.

### E2E và visual

- Keyboard arrows/WASD xen kẽ, giữ cùng hướng hai bộ phím không tăng tốc, form focus không di chuyển hoặc scroll ngoài ý muốn.
- Mouse-only: click sàn quanh vật cản, đến NPC rồi click tương tác, thu evidence, mở notebook/Settings và chuyển cổng cả hai chiều.
- First distant click không mở dialogue/modal hoặc đổi scene; khi đến gần vẫn chờ click lần hai. Click HUD/modal không move; double click không skip.
- Click tọa độ đúng dưới zoom/follow/letterbox và sau resize. Keyboard interrupt, click replacement, pause/modal/transition cancel đúng.
- Camera bốn rìa của hai scene và dấu player thực sự nhìn thấy ở 1280×720 / 760×600. Kiểm bounding-box CSS, không chỉ tồn tại circle/cx/cy.
- Screenshot Office/Archive có cổng, desktop/compact, dialogue/notebook không còn bộ chọn mode. Người dùng review hình ảnh và nhạc trước đóng Phase 11E.

Chạy và lưu output `npm run lint`, `npm run test`, `npm run build`, typecheck/format/memory checks; E2E một worker và các asset validator phù hợp. Không chỉnh runtime trong lúc E2E chạy. Chỉ chạy dotnet khi backend thay đổi.

## 11. Đầu ra và bước tiếp theo

Sau người dùng review spec này: viết implementation plan tiếng Việt, chia task theo camera/Settings/minimap, keyboard/navigation, click interaction, portal content/presentation, integration/verification. Người dùng review plan trước coding; giữ phương thức Native inline đã chọn theo workflow.

Spec chỉ ghi phạm vi thiết kế đã duyệt; không đánh dấu Phase 11E complete và không chứng nhận các thay đổi chưa triển khai.
