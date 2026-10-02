# Sổ tay và bảng suy luận không cuộn, artwork SVG

Ngày: 02/10/2026. Trạng thái: hướng thiết kế đã được chấp thuận; bản spec viết này chờ người dùng xem và duyệt. Chưa triển khai.

## 1. Mục tiêu và nguồn yêu cầu

Người chơi sử dụng vật dụng điều tra trong game, không đọc một trang web dài. Sổ tay và bảng suy luận phải nằm trọn trong viewport, không cuộn dọc/ngang. Nội dung dài vẫn đọc được đầy đủ bằng lật trang hoặc chuyển mặt làm việc. Đinh ghim, vòng gáy, góc bìa và khung sổ dùng artwork SVG có khối, chất liệu và bóng tiếp xúc, thay các mô phỏng vật thể bằng CSS hiện tại.

Phạm vi: hai overlay J/B, hồ sơ đọc bên trong, điều hướng, hiệu ứng, bộ SVG và kiểm chứng. Không mở phase backend/content/gameplay mới. Thực thi inline trên dev theo phương thức đã chọn trong phiên.

Tài liệu này bổ sung `2026-10-01-notebook-deduction-ui-design.md`, thay quy tắc cuộn và xếp các section thành cột dài trong mục 3 và 5.1 của bản cũ. Những hợp đồng về content, engine, learning, save, modal routing và guardrails của bản cũ giữ nguyên. Spec/plan cũ đã hoàn tất, không sửa lịch sử kết quả thành chưa hoàn tất.

Ảnh tham chiếu trong bản cũ tiếp tục là nguồn phong cách, không phải nội dung vụ án. Palette/typography theo docs/art/06; không thêm tuổi, IPA, ghi chú, ngày giờ hoặc nguồn dữ kiện không có trong content.

## 2. Cách tiếp cận

Chọn phân trang theo không gian đọc thực tế, kết hợp hiệu ứng giấy cho sổ và chuyển mặt cho bảng. Đây là lựa chọn phục vụ đọc được toàn bộ nội dung và vẫn thao tác điều tra ổn định.

- Chỉ ẩn scrollbar hoặc clip panel: loại vì có thể làm mất nội dung và nút thao tác.
- Co cả giao diện như một ảnh: loại vì chữ và vùng bấm nhỏ đi; không đạt font tối thiểu 14px và target 44×44px.
- Lật giấy cho mọi thành phần: loại vì bảng ghim cần giữ cảm giác bảng; áp dụng lật giấy cho sổ/hồ sơ, chuyển mặt ngắn cho bảng.

## 3. Khung màn hình và điều hướng

Overlay chiếm vùng chơi có safe inset, chiều cao theo không gian thực tế, không vượt viewport. Header, nút đóng và vùng thao tác chính luôn nằm trong khung. Phần trang đọc nhận phần chiều cao còn lại, không dựa vào max-height rồi overflow:auto.

Desktop ưu tiên trải nghiệm hai trang giấy; màn hình hẹp hoặc thấp chuyển một trang đọc/một mặt thao tác tại một thời điểm. Không xếp tất cả section dọc xuống dưới. Dựa cả chiều rộng lẫn chiều cao có sẵn để chọn bố cục. Ảnh minh họa và trang trí được giảm diện tích trước khi giảm diện tích chữ; không giảm font xuống dưới 14px.

Mỗi tập nội dung có trang trước/sau, chỉ báo trang hiện tại/tổng số trang, trạng thái đầu/cuối rõ ràng. Nút góc giấy có vùng bấm ít nhất 44×44px. Chuột và bàn phím dùng được; kéo góc giấy là bổ sung, không phải đường duy nhất để chuyển trang. Wheel/touch kéo không cuộn nội dung và không tự chuyển trang.

Tab/Shift+Tab giữ hành vi focus trong modal. PageUp/PageDown điều khiển tập trang đang hoạt động, bỏ qua input/textarea/contenteditable và các tổ hợp modifier; không giành phím của chooser hoặc popover. J/B, Esc, trap/restore focus và khóa movement giữ như hiện tại. Sau đổi trang, focus còn trên nút chuyển trang hoặc được chuyển tới heading trang nếu điều hướng trực tiếp; không nằm trong trang đã ẩn. Trang không hoạt động không nhận focus.

## 4. Sổ tay

Giữ đúng bốn mục Nhân vật / Chứng cứ / Từ vựng / Dòng thời gian. Không thêm tab suy luận vào sổ.

### 4.1. Hai trang và một trang

Khi đủ diện tích, trang trái là mục lục phân trang, trang phải là hồ sơ được chọn phân trang. Chọn hồ sơ thay nội dung trang phải và đưa hồ sơ mới về trang đầu. Mục lục giữ vị trí khi đọc tiếp hồ sơ. Nút/chỉ báo mỗi bên ghi rõ tập nội dung đang điều hướng.

Khi không đủ diện tích, hiện mục lục hoặc hồ sơ trong một trang. Chọn mục mở hồ sơ; nút quay lại mục lục luôn có sẵn. Không mount thêm mục lục dài ở trên hồ sơ. Giữ mục đang chọn và vị trí đọc khi chuyển tab/mở lại trong cùng case, bằng state UI tạm thời. Đổi case reset; không thêm state này vào save.

### 4.2. Nội dung

- Nhân vật: mục lục hồ sơ, trang thông tin và lời khai nối tiếp. Không ép tất cả lời khai vào trang đầu. Nhãn nguồn/context được giữ khi lời khai kéo dài nhiều trang.
- Chứng cứ: mục lục thẻ ảnh; hồ sơ ảnh/mô tả và các trang tiếp theo. Nút xem lại evidence hiện có vẫn truy cập được, không tự chạy audio khi lật.
- Từ vựng: mục lục từ; definition, ví dụ và nguồn chia theo trang. Beginner/Learning/Immersion, reveal và stage giữ đúng dữ liệu hiện tại. Bản dịch được tính trong bố cục trang khi bật.
- Dòng thời gian: chỉ các sự kiện đã đặt đúng, thứ tự authored; trang trước/sau thay cuộn danh sách. Empty state vẫn dẫn tới bảng suy luận.

## 5. Bảng suy luận

Khung gỗ/bảng ghim cố định, có bốn mặt làm việc: **Manh mối / Dòng thời gian / Đối chiếu / Kết luận**. Điều hướng thể hiện bằng nhãn hồ sơ giấy, không dựng hàng dashboard. Desktop mặt Manh mối có thể giữ bố cục ba vùng giống ảnh; chiều cao thấp/hẹp dùng một vùng đang hoạt động với đường tới hồ sơ vụ việc, chi tiết và các thao tác liên quan.

### 5.1. Manh mối

Thẻ nhân vật/chứng cứ phân thành các trang bảng ghim. Chọn thẻ mở tập hồ sơ giấy trong khung, có nút quay lại mặt Manh mối; nội dung dài phân trang. Dây SVG chỉ nối đầu mối authored đang hiển thị trên trang hiện tại. Quan hệ với thẻ ở trang khác vẫn đọc được trong tập danh sách quan hệ phân trang, không suy diễn dây mới.

Hồ sơ vụ việc, mục tiêu và hướng dẫn cũng có trang tiếp khi dài. Không hiển thị toàn bộ chúng như cột làm bảng vượt chiều cao.

### 5.2. Dòng thời gian

Tách thao tác thành các bước nhìn thấy rõ: chọn sự kiện → chọn slot → xác nhận; mỗi danh sách và bản ghi đã đặt có trang riêng khi cần. Giữ eventId/slotId khi đổi trang hoặc mặt làm việc. Slot time authored vẫn hiển thị đúng availability cũ, không đưa đáp án event lên thẻ chưa đặt. Engine quyết định đúng/sai.

### 5.3. Đối chiếu

Danh sách dữ kiện phân trang, có khay hai dữ kiện đang chọn và nút Suy luận/Xóa lựa chọn luôn truy cập được. Giữ cặp đã chọn qua trang/mặt, không tự thay bằng cặp đúng. Nếu text trong khay quá dài, xem đầy đủ qua hồ sơ phân trang. Feedback và mâu thuẫn đã xác nhận được đọc trong trang kết quả; không hiển thị giải thích chưa được engine xác nhận. Nút suy luận tuân thủ availability và điều kiện hiện có.

### 5.4. Kết luận

Chỉ cho chọn nghi phạm khi objective hiện tại cho phép. Chooser, hồ sơ nghi phạm và feedback dài có trang tiếp. Không reset tiến độ khi sai, đúng đóng overlay theo routing hiện tại. Giữ lựa chọn hợp lệ qua chuyển mặt. State tạm thời thuộc một chủ sở hữu React của board, không để unmount workspace làm mất lựa chọn.

## 6. Phân trang và learning

Lớp phân trang chung ở frontend nhận nội dung có stable ID và vùng đọc. Đo sau font/ảnh sẵn sàng, tính lại khi resize, thay nội dung hoặc translation mode/reveal làm chiều cao thay đổi. Chưa đo xong thì hiển thị trạng thái ngắn trong khung; không flash nội dung dài rồi cắt.

Ưu tiên ngắt giữa thẻ/đoạn/lời khai. Một đoạn dài hơn cả trang phải ngắt tiếp theo câu/từ; không ngắt giữa một token từ vựng. Dùng offset của văn bản gốc và remap vocabulary spans cho mảnh hiển thị, giữ contextId gốc. Không cắt theo số ký tự cố định hoặc chỉ lấy N phần tử đầu. Chuỗi dài không có khoảng trắng được wrap trong vùng đọc.

Khi reflow, giữ neo nội dung đang đọc bằng ID/offset, không chỉ giữ chỉ số trang cũ. Khi discovery đổi, clamp neo/lựa chọn về mục hợp lệ, không hiện dữ kiện bị ẩn. Không sửa dữ liệu content hoặc game-core để phân trang.

Đo nội dung bằng phần trình bày không tương tác; không mount VocabularyText có callback trong lớp đo hoặc các trang chưa mở. Chỉ trang thực sự nhìn thấy mount annotation/learning callbacks. Animation không tạo encounter/reveal/inspect cho trang chưa đọc. Không nhân bản nội dung tương tác để tạo hai bản trên trang lật. Popover từ vựng mở bằng click vẫn nằm trong viewport; nếu dài thì có nội dung tiếp theo, không dùng scroll bên trong hai overlay. Esc đóng popover trước overlay.

## 7. Hiệu ứng giấy

Ưu tiên khảo sát tích hợp **StPageFlip (`page-flip`)** cho trang giấy mềm: cong mép, bóng theo chuyển động và chuyển trang có chiều sâu. Thư viện phục vụ hiệu ứng, không thay layer phân trang/ngữ nghĩa/state React. Chỉ cài qua npm workspace sau khi plan được duyệt; lý do dependency là hiệu ứng giấy cong tự nhiên. Tài liệu chính thức: https://nodlik.github.io/StPageFlip/ và https://github.com/Nodlik/StPageFlip.

Plan phải có task kiểm chứng adapter trên React18: tương tác vocabulary/nút, cleanup, trang ẩn không focus/callback, resize, giảm chuyển động, không remount Phaser. Chỉ dùng nếu đạt các kiểm chứng này. Nếu không đạt, dùng chuyển trang giấy bằng SVG/CSS transform với giới hạn hiệu ứng được ghi trong report; không hy sinh learning/focus để giữ thư viện. Không chọn thêm thư viện animation thứ hai.

Lật bằng nút khoảng 450–650ms, âm giấy hiện có theo Settings một lần mỗi chuyển trang, không chồng âm. Bìa/gáy/vòng cố định, trang giấy chuyển động bên dưới. Board chuyển mặt ngắn khoảng 180–250ms; không lật toàn bộ khung gỗ. Khi prefers-reduced-motion bật, đổi nội dung trực tiếp, bỏ cong giấy và chuyển mặt. Điều hướng nhanh phải kết thúc nhất quán, không kẹt lớp overlay hoặc khóa input vĩnh viễn.

## 8. Bộ artwork SVG

SVG riêng trong khu vực asset UI của frontend, đặt tên và viewBox rõ ràng, dùng lại qua component trang trí. SVG không chứa nội dung case, chữ giao diện hoặc external resource/script. CSS chỉ bố trí, responsive và chuyển động; thay pseudo-element/gradient đang đóng vai trò vẽ ghim/vòng/góc bìa.

- Đinh ghim: đầu ghim có cạnh/khối, thân kim nghiêng, highlight nhỏ, bóng tiếp xúc; nhiều biến thể góc để bố trí không lặp máy móc.
- Vòng gáy: đường cong kim loại, mặt tối/sáng, lỗ giấy và phần trước/sau đúng lớp; không giống những thanh chữ nhật lặp bằng repeating-gradient.
- Góc bìa/khung sổ: đường viền hơi bất quy tắc, cạnh bìa, góc gia cố, độ mòn nhỏ và lớp giấy; scale không kéo méo góc/vòng/ghim.
- Ghim hồ sơ và chi tiết trang trí liên quan dùng cùng phong cách nét vẽ của ảnh, màu muted của repo. Không dùng emoji hoặc icon thư viện phẳng để thay vật thể.

Ưu tiên path/gradient/clipPath và bóng nhẹ cục bộ, hạn chế filter lớn. Mỗi instance có ID không trùng cho defs khi cần; không tràn filter ra viewport. Trang trí aria-hidden, pointer-events:none, không che chữ, nút và focus. Đỏ chỉ dùng đúng vai trò điều tra đã khóa; ghim trang trí không mặc định tất cả đỏ.

Hình nhân vật/chứng cứ tiếp tục dùng asset content hiện tại; bộ SVG này không mở scope vẽ portrait mới. Kiểm tra trực quan ở kích thước thật, không đánh giá chỉ dựa vào SVG có tồn tại.

## 9. Kiến trúc và phạm vi loại trừ

Giữ selector discovery, game-core submit/place, Zustand modal exclusivity và typed bridge. Lớp phân trang, artwork và animation chỉ trong game-web; game-core/learning-engine không import DOM. Nhãn mới nằm trong content/shared-types theo schema hiện có. Không duplicate state điều tra hoặc thêm save version, không backend change.

Không thêm free drag-link, graph tự do, đáp án tự động, quiz/reward hoặc thay Case001. Không mở rộng yêu cầu không cuộn sang các màn hình ngoài sổ/board trong gói này; các hồ sơ/popover nằm trong hai overlay phải tuân thủ.

## 10. Acceptance và kiểm chứng

1. Sổ bốn tab và board bốn mặt dùng trọn chức năng hiện tại, không wheel/touch/keyboard scroll dọc/ngang; không chỉ giấu scrollbar.
2. Không mất text, nguồn, bản dịch đã reveal hoặc nút thao tác. Test nội dung dài tổng hợp, một đoạn vượt trang, nhiều thẻ, nhiều lời khai và nguồn; lần lượt tới tất cả trang để chứng minh đầy đủ.
3. Viewport bắt buộc: 1280×720, 760×600, 390×844; thêm 1280×540 và 844×390 cho chiều cao thấp. Kiểm tra cả DOM bounds của text/control, scroll offsets không đổi khi wheel/focus và ảnh chụp. Font ≥14px, vùng bấm ≥44×44px.
4. Resize khi đang đọc, font/ảnh load, bật dịch và đổi mode đều reflow đúng; không nhảy khỏi neo đọc hoặc tràn nội dung.
5. Fact pair/event/slot/suspect selection giữ qua trang/mặt; sai→đúng, objective unlock, accusation, save/reload vẫn pass; không leak hidden fact/explanation.
6. J/B/esc/trap/restore/editable guards, native Tab/Shift+Tab, PageUp/PageDown, reduced-motion, chuyển trang nhanh và modal đóng khi đang lật được kiểm chứng. Một Phaser canvas; listener/animation cleanup.
7. Learning test chứng minh chỉ trang nhìn thấy phát encounter/inspect/reveal, context/spans không đổi ngữ nghĩa khi chia đoạn. Trang đo/ẩn không tương tác.
8. SVG đúng palette, có khối/bóng/chất liệu, không méo khi resize; vòng ở gáy và ghim đúng lớp trong lúc lật. Đánh giá ảnh thực tế cho cả sổ và board, không chấp nhận chỉ UI mock.
9. Chạy và dán output npm run lint/test/build; thêm typecheck, memory:check và E2E nhóm liên quan. Report ghi browser thực tế, dependency/giới hạn animation nếu có và ảnh. Không báo complete trước kiểm chứng.

## 11. Handoff

Sau khi người dùng duyệt bản spec viết này, dùng writing-plans để tạo plan tiếng Việt cho phân trang, SVG/animation adapter, notebook, board và regression. Plan được duyệt rồi mới sửa code/cài dependency; giữ inline dev và push chỉ khi có yêu cầu riêng.
