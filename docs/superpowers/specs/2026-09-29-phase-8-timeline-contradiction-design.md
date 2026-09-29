# Phase 8 — Dòng thời gian và mâu thuẫn

**Trạng thái:** Bản cập nhật chờ người dùng duyệt; phạm vi commerce trung lập đã được duyệt về hướng ngày 2026-09-29

**Ngày:** 2026-09-29

**Lộ trình:** `docs/04_CODEX_IMPLEMENTATION_ROADMAP.md` §27

**Tài liệu sản phẩm:** `docs/01_GAME_DESIGN_DOCUMENT.md` §§15–16, 20; `docs/03_CASE_001_VERTICAL_SLICE_SPEC.md` §§4–9

**Hướng đã duyệt:** Dòng thời gian và luồng tìm mâu thuẫn dựa trên dữ liệu; bổ sung một Archive tối thiểu và lối đi từ Main Office để Security Access Log được đặt tại đúng địa điểm trong case; chuẩn bị một cổng cấu hình thương mại trung lập với nhà cung cấp, chưa triển khai giao dịch.

## Mục tiêu

Cho người chơi sắp xếp lại các sự kiện của Case #001 theo thời gian dựa trên những sự kiện đã khám phá, sau đó nhận diện mâu thuẫn giữa lời khai của David và Security Access Log. Giao diện vẫn thuộc sổ tay điều tra và thế giới của case; giao diện không chấm điểm người chơi hoặc tiết lộ sự thật của case trước khi chứng cứ đủ sức hỗ trợ kết luận.

## Phạm vi

- Bổ sung định nghĩa dòng thời gian và mâu thuẫn dựa trên dữ liệu, có kiểm tra hợp lệ, vào hợp đồng nội dung case.
- Bổ sung các chuyển trạng thái thuần trong `game-core` để đặt một sự kiện đã khám phá vào một mốc thời gian và kiểm tra một cặp sự kiện đã khám phá do người chơi chọn.
- Thêm thẻ Dòng thời gian và tương tác tìm mâu thuẫn vào luồng sổ tay/chứng cứ hiện có.
- Thêm Security Access Log dưới dạng chứng cứ trong một Archive tối thiểu. Người chơi đến đó qua cửa hành lang Main Office hiện có và có lối quay lại.
- Giữ nguyên sự thật, dòng thời gian, hội thoại, tổng số chứng cứ (`5`) của Case #001, lối chơi local-first và mọi save hiện có.
- Lưu ID scene đang hoạt động khi di chuyển và khôi phục scene đã lưu tại điểm spawn được khai báo cho scene đó. Tọa độ người chơi và việc thiết kế lại toàn bộ cơ chế lưu thế giới nằm ngoài phase này.
- Thêm hợp đồng cấu hình runtime trung lập với nguồn dữ liệu, mặc định ở chế độ miễn phí; tương lai có thể thay provider mà không đưa logic thương mại vào `game-core` hoặc `game-content`.

## Chuẩn bị cấu hình thương mại trong tương lai

- Khai báo hợp đồng phiên bản hóa `CommerceConfig` và cổng `CommerceConfigProvider` ở ranh giới ứng dụng. Provider tải một snapshot cấu hình khi khởi động; nguồn mặc định của Phase 8 luôn trả `mode: 'free'`.
- Hợp đồng hiện tại chỉ phân biệt chế độ `free` và `commercial`. Đây là điểm nối kỹ thuật cho provider tương lai, không phải công tắc mở paywall trong Phase 8.
- Luồng khởi động nhận provider qua dependency injection. Sau này có thể thay provider mặc định bằng nguồn remote mà không sửa reducer, case content hoặc UI điều tra.
- Nếu provider không tải được hoặc trả cấu hình không hợp lệ, ứng dụng dùng cấu hình `free`; game vẫn khởi chạy với toàn bộ nội dung và tiến trình hiện có.
- Không lưu cấu hình này vào save game, case content hoặc learning profile.
- Cấu hình phía client không xác thực quyền mua và không được dùng để khóa nội dung, case, evidence hoặc tiến trình. Nếu tương lai có quyền truy cập trả phí, API phía máy chủ mới là nguồn xác thực.

## Ngoài phạm vi

- Buộc tội, kết thúc case, tóm tắt báo cáo hoặc xử lý chọn sai nghi phạm (Phase 9).
- Đồ thị chứng cứ tương tác, liên kết tự do, kéo-thả dòng thời gian hoặc nhập thời gian tùy ý. MVP dùng thao tác chọn bằng nhấp chuột và các mốc thời gian được khai báo trước, phù hợp với thiết kế sản phẩm.
- Scene mới ngoài Archive / Security Corner tối thiểu, đợt hoàn thiện hình ảnh môi trường toàn diện hoặc NPC/hội thoại mới.
- Tích hợp backend/remote/admin để quản lý commerce; catalog sản phẩm, giá, entitlement, paywall, checkout, thanh toán, subscription, hoàn tiền hoặc thông tin tài khoản.
- Cloud save, AI, nội dung tạo lúc chạy hoặc thay đổi hệ thống học tập.
- Những chứng cứ Case #001 còn lại không cần cho dòng thời gian hoặc mâu thuẫn của Phase 8.

## Hợp đồng nội dung Case #001

Giữ nguyên dòng thời gian đã được xác định trong `docs/03_CASE_001_VERTICAL_SLICE_SPEC.md` §4. Thẻ Dòng thời gian chỉ liệt kê sự kiện đã có trong phần giới thiệu case hoặc được mở khóa từ những sự kiện người chơi đã khám phá. Các mốc theo thứ tự:

| Thời gian | Sự kiện | Nguồn / điều kiện xuất hiện |
|---|---|---|
| 20:00 | Cuộc họp bắt đầu | `meeting_started` hiện có, từ Meeting Minutes |
| 20:18 | Anna rời phòng họp | Security Access Log |
| 20:27 | Leo rời phòng họp | Security Access Log |
| 20:29 | Leo ở bên ngoài phòng họp | `leo_outside_at_2029` hiện có, sau khi hoàn thành nhiệm vụ nghe |
| 20:32 | David vào phòng họp | Security Access Log |
| 20:36 | David rời phòng họp | Security Access Log |
| 20:40 | Leo vào phòng họp | Security Access Log |
| 20:45 | Cuộc họp kết thúc | Meeting Minutes |
| 21:05 | Báo cáo được phát hiện là đã mất | Phần giới thiệu case; đã biết từ đầu, không tạo chứng cứ sưu tầm mới |

Chứng cứ từ terminal có ID `security_access_log` và giữ nguyên văn các mục đã được xác định: Anna Reed EXIT lúc 20:18, Leo Tran EXIT lúc 20:27, David Cole ENTRY lúc 20:32, David Cole EXIT lúc 20:36 và Leo Tran ENTRY lúc 20:40. Người chơi khám phá chứng cứ này bằng cách tương tác với security terminal trong Archive. `evidenceTotal` vẫn bằng năm.

Hoàn thành objective đã có “Check the security records” khi người chơi khám phá access log. Chỉ hoàn thành “Compare David's statement with the evidence” sau khi người chơi xác định đúng mâu thuẫn. Không triển khai objective tiếp theo “Submit your conclusion”; objective đó thuộc Phase 9.

Fact `david_statement_no_entry_after_20_00` hiện có tiếp tục lấy từ hội thoại với David. Bổ sung các fact cần thiết để thể hiện từng sự kiện trong security log và thời điểm kết thúc cuộc họp lúc 20:45, kèm tham chiếu chéo đến chứng cứ đã xác định. Sự kiện 21:05 được khai báo là sự kiện trong dòng thời gian lấy từ phần giới thiệu case, không được tạo thành chứng cứ hoặc fact sưu tầm giả. Tái sử dụng `leo_outside_at_2029` và `meeting_started`, không tạo fact trùng lặp.

Chỉ khai báo một mâu thuẫn cho cặp `david_statement_no_entry_after_20_00` và `david_entry_20_32`. Phần giải thích đã được soạn sẵn nêu rằng security log ghi nhận David vào phòng lúc 20:32, trái với lời khai rằng anh không vào phòng sau 20:00. Khi thành công, đặt flag hiện có `david_contradiction_found` để mở khóa hội thoại David có điều kiện đã được khai báo. Không thay đổi lời thú nhận hoặc sự thật về nghi phạm.

## Hành vi dòng thời gian

- Mỗi sự kiện được khai báo trước gồm ID ổn định, nội dung hiển thị, tham chiếu mốc thời gian, địa điểm, người liên quan, nguồn, mô tả mức độ tin cậy, các fact cần có để xuất hiện (hoặc điều kiện có sẵn từ đầu case) và một cờ ghi nhận sự kiện đã được đặt.
- Các mốc thời gian và cặp sự kiện/mốc hợp lệ được khai báo trong nội dung case. Nội dung giao diện không tiết lộ thời gian đích trước khi người chơi chọn mốc.
- Khi người chơi chọn một sự kiện đang khả dụng và một mốc thời gian, hệ thống gọi chuyển trạng thái thuần của core. Nếu đặt đúng, cờ của sự kiện được lưu. Nếu đặt sai, game state không đổi, người chơi có thể thử lại và giao diện hiển thị nguyên văn `Something in the timeline is inconsistent.` cùng một gợi ý không tiết lộ đáp án, dựa trên chứng cứ.
- Sự kiện đã đặt vẫn giữ nguyên sau khi đóng/mở lại sổ tay và sau khi tải lại game. Sự kiện mới được khám phá sẽ xuất hiện mà không xóa các lựa chọn đã đặt trước đó.
- Sự kiện 21:05 lấy từ phần giới thiệu case và khả dụng ngay từ đầu. Các sự kiện cần chứng cứ chỉ xuất hiện sau khi người chơi khám phá fact nguồn tương ứng.

## Hành vi tìm mâu thuẫn

- Sổ tay chỉ hiển thị các fact có trong `discoveredFactIds`; giao diện không thể gửi một fact đang bị ẩn. Core kiểm tra riêng ID nhiệm vụ và ID fact, không dựa vào kiểm tra của giao diện.
- Khi chọn đúng cặp mâu thuẫn đã khai báo, hệ thống ghi nhận mâu thuẫn đúng một lần, đặt `david_contradiction_found=true` và hoàn thành objective Case #001 “Compare David's statement with the evidence.”
- Nếu cặp được chọn không khớp, case state không đổi; giao diện hiển thị nguyên văn `This interpretation doesn't match the evidence.` và đưa ra gợi ý dẫn người chơi về các nguồn liên quan mà không nêu đáp án.
- Gửi lại lựa chọn đã thành công phải có tính idempotent. Không nhân đôi sự kiện, fact hoặc tiến độ objective. Lần thử sai không xóa tiến độ và không bị tính phí.
- Việc hiển thị mâu thuẫn và hội thoại David có điều kiện tiếp tục dựa vào flag hiện có và yêu cầu người chơi đã khám phá cả hai fact.

## Scene Archive và điều hướng

- Case mới vẫn bắt đầu ở `main_office`. Thêm một scene `archive`, dùng asset sàn/tường placeholder có nhãn rõ ràng, một security terminal có thể tương tác và một cửa quay lại Main Office.
- Chuyển cửa hành lang Main Office hiện có thành lối sang Archive. Terminal cấp `security_access_log`; lối quay lại đưa người chơi tới điểm spawn an toàn ở Main Office.
- Điểm đến của chuyển scene và các điểm spawn được đặt tên phải được kiểm tra đối chiếu với danh sách scene đã đăng ký của case. Tham chiếu scene hoặc spawn không hợp lệ phải làm kiểm tra nội dung/build thất bại và nêu được đường dẫn dễ hiểu.
- Điều hướng đi qua các hợp đồng kiểu dữ liệu của app/world. Zustand sở hữu ID scene đang hoạt động mà giao diện và save sử dụng; Phaser hiển thị scene đó và giữ tọa độ người chơi đang chạy. React không gọi internals của Phaser.
- Nâng cấp bản ghi save cục bộ để lưu ID scene đang hoạt động. Chuyển save schema V1/V2 sang schema mới mà không làm mất case state; save cũ bắt đầu tại `main_office`. Khi khôi phục save đang ở Archive, đặt người chơi tại điểm spawn vào scene đã khai báo cho Archive. Giữ nguyên phiên bản cơ sở dữ liệu IndexedDB, trừ khi hợp đồng migration hiện có của repo yêu cầu khác.
- Tự động lưu khi đổi scene. Giữ nguyên hành vi khôi phục hiện có: lưu bản sao dự phòng của record không hợp lệ và không bao giờ âm thầm ghi đè chúng.

## Kiến trúc và giao diện

- `shared-types` định nghĩa kiểu nội dung/kết quả dòng thời gian và mâu thuẫn. Zod schema, loader, kiểm tra tham chiếu chéo và kiểm tra build của `game-content` đảm bảo ID duy nhất; fact, evidence, objective, scene và spawn đều tồn tại; tham chiếu mốc thời gian hợp lệ; cặp mâu thuẫn có đúng hai fact.
- `game-core` sở hữu logic thuần, xác định được cho việc đặt sự kiện lên dòng thời gian và kiểm tra mâu thuẫn. Package này không import React, Phaser, Zustand, DOM hoặc persistence.
- `gameStore` bọc kết quả từ core và chỉ cập nhật case state sau chuyển trạng thái thành công. Event có kiểu dữ liệu truyền yêu cầu/thông báo đổi scene qua ranh giới Phaser–React.
- Ranh giới ứng dụng khai báo `CommerceConfig` và `CommerceConfigProvider.load(): Promise<CommerceConfig>`. `GameCanvas` nhận provider khi bootstrap; provider mặc định trả chế độ `free`. Không package core/content nào import provider hoặc rẽ nhánh gameplay theo chế độ thương mại.
- Giao diện sổ tay thêm thẻ Dòng thời gian. Dùng bố cục hồ sơ giấy, trục thời gian rõ ràng, thẻ sự kiện đã soạn sẵn, nhãn nguồn/mức độ tin cậy và thao tác chọn mốc thời gian dùng được bằng bàn phím. Tương tác tìm mâu thuẫn hiển thị các fact đã khám phá dưới dạng thẻ có thể chọn. Focus phải nhìn thấy được; các điều khiển có nhãn và không chỉ dựa vào màu sắc.
- Dùng typography và bảng màu nâu giấy trầm hiện có. Màu đỏ điều tra (`#A4412D` / `#743026`) chỉ dành cho manh mối, mục dòng thời gian được chọn và mâu thuẫn đã xác nhận. Archive giữ bố cục thưa, dùng placeholder có tên; không đưa hình tạm không gắn nhãn vào production.
- Nội dung giao diện bản địa hóa tiếp tục nằm trong `packages/game-content/ui/vi.json` và schema tương ứng. Nội dung case của evidence/fact tiếp tục nằm trong case content, không đặt cứng trong mã React/Phaser.

## Kiểm tra và tiêu chí chấp nhận

- Unit test bao phủ trường hợp đặt dòng thời gian đúng/sai/không xác định/gửi lặp; điều kiện xuất hiện sự kiện; gửi mâu thuẫn đúng/sai/không xác định/gửi lặp; và kết quả chính xác của flag mâu thuẫn David cùng objective.
- Test nội dung từ chối ID trùng, tham chiếu fact/evidence/objective/scene/spawn không tồn tại, mốc thời gian sai định dạng, cặp mâu thuẫn không hợp lệ và nội dung bắt buộc còn thiếu. Case #001 đã đăng ký phải tải được với `evidenceTotal: 5`.
- Test persistence chuyển được các phiên bản save hiện có, round-trip được scene đang hoạt động và case flag, giữ bản sao dự phòng khi dữ liệu không hợp lệ, đồng thời khôi phục đúng spawn đã khai báo cho scene trong save.
- Test giao diện bao phủ sự kiện/fact chỉ hiện sau khi khám phá, phản hồi khi thử lại, trạng thái hoàn tất, thao tác bằng bàn phím, focus và trạng thái không chỉ phân biệt bằng màu.
- Test cấu hình commerce bao phủ provider mặc định `free`, provider thay thế được inject, và provider lỗi/cấu hình sai fallback về `free`; mọi trường hợp phải giữ nguyên khả năng chơi và không khóa nội dung.
- E2E bao phủ luồng: Main Office → Archive → thu thập Security Access Log → quay lại; lưu evidence và fact; đặt sự kiện vào dòng thời gian (bao gồm thử lại sau khi chọn sai mốc); khám phá lời khai David và fact từ access log; xác định mâu thuẫn; xác nhận thử thách hội thoại David hiện có được mở; tải lại và giữ scene/case progress; chỉ có một Phaser canvas và không có lỗi console.
- Chạy `npm run lint`, `npm run test`, `npm run build`, `npm run typecheck`, `npm run format:check`, `npm run test:e2e`, `npm run memory:check` và `git diff --check`. Không cần các bước kiểm tra .NET vì API không thay đổi.

## Việc tiếp nối ngoài phạm vi

Phase 9 phụ trách buộc tội và kết thúc case. Một phase persistence sau này có thể bổ sung tọa độ chính xác của người chơi; Phase 8 chỉ khôi phục scene đã lưu tại điểm spawn được đặt tên.
