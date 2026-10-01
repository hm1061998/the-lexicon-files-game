# Bổ sung thiết kế — camera, âm thanh nền và giao diện

**Trạng thái:** Spec và plan đã được người dùng duyệt ngày 2026-10-01; implementation đã bàn giao, còn chờ nghiệm thu hình ảnh/âm thanh. Bổ sung cho feedback Phase 11E; không sửa product rules đã chốt.

## Bối cảnh

Sau khi bố cục tổng thể tạm ổn, người dùng bổ sung yêu cầu camera gần hơn và đi theo nhân vật; chỉnh nhãn Phòng Điều Tra không chèn tường, làm đẹp nhãn tên NPC; thêm nhạc nền miễn phí; thay tiếng bước chân hiện nghe như chà giấy; ẩn prompt E của chứng cứ đã thu thập; và cải thiện cách trình bày các điều khiển trong hội thoại/sổ tay (chế độ dịch, xem chứng cứ, nghe lại audio).

Việc ẩn prompt vật chứng đã được đưa vào phạm vi spec 11E đã duyệt và triển khai ở đó; addendum này chỉ ghi nhận yêu cầu để người duyệt xác nhận không cần mở rộng hành vi đó.

## Mục tiêu

1. Tăng độ gần khi chơi mà vẫn giữ nhân vật trong khung và giữ được khả năng quan sát phòng.
2. Làm camera theo nhân vật mượt, dừng ở biên scene, không gây scroll trang hoặc đổi projection/collision/minimap.
3. Đặt nhãn Phòng Điều Tra trong phần mặt tường nhìn thấy, không tràn qua tường giao nhau; làm nameplate NPC hợp phong cách hồ sơ điều tra và dễ đọc.
4. Thêm một ambience loop nhẹ cho Office/Archive, ưu tiên nhạc nền không lời, tiết chế để không tranh thoại và clue audio.
5. Thay hai sample bước chân hiện có bằng recording nghe như bước giày trên nền văn phòng cứng; giữ cadence theo quãng đường thật và random variation.
6. Sắp xếp lại cụm điều khiển dialogue/notebook theo nhóm nhiệm vụ, hiển thị rõ lựa chọn dịch, xem/nghe chứng cứ và replay; hỗ trợ màn nhỏ, bàn phím và focus.

## Không đổi

- Giữ hai scene Office/Archive, luật chuyển cửa, collision, logical position, projection 2:1, nội dung case, dialogue text, learning/save/backend và typed event bus.
- Không thêm thiết lập zoom, âm thanh riêng hoặc state lưu mới trừ khi implementation review cho thấy cần; ưu tiên dùng master audio setting hiện có.
- Không có nhạc hoặc âm thanh trừng phạt câu trả lời sai; ambience dừng/duck khi dialogue hoặc listening phát.
- Asset bên thứ ba phải có nguồn, license, người tạo, URL tải, checksum và attribution trong provenance; không dùng file từ nguồn có quyền không rõ.

## Hướng thiết kế đề xuất

- Tăng camera zoom vừa phải (mốc đầu để kiểm bằng screenshot là khoảng 1.2×), follow có smoothing/dead-zone nhỏ, clamp theo world bounds; tự điều chỉnh zoom khi compact để không cắt đường tới evidence/exit. Camera chỉ đổi view, không đổi world coordinates.
- Reposition nhãn Investigation trên một đoạn `wallId` hợp lệ sau khi chụp cận cảnh cả phòng; dùng cùng wall-plane resolver của 11E. Nameplate NPC dùng nền giấy ngà nhỏ, viền/nét mực tối giản, typography theo art/06; không dùng đỏ ngoài chức năng clue.
- Tích hợp một loop ambience duy nhất cho hai scene, mức nền thấp, không gap/ramp bật tắt, dừng khi unmount, pause theo master mute. Trước khi chốt, nghe thử candidate CC0 và xác nhận loop không có transient đầu/cuối.
- Dùng recording bước chân đã được cấp phép, chọn sample phù hợp sàn cứng; cắt bỏ silence/dư âm dài nếu cần và tạo nhiều biến thể từ các recording riêng. Giữ stride/cadence đã kiểm.
- Dialogue/notebook: gom chế độ dịch thành segmented control/nhãn rõ; nhóm nút evidence/audio theo một hàng trên desktop và wrap thành nhóm compact trên màn nhỏ; replay phản ánh playback state hiện hữu. Tránh đổi wording hoặc thêm flow học mới.

## Asset tham khảo đã tra cứu

- Nhạc **Suspense** của wipics trên OpenGameArt: trang liệt kê CC0, Copyright/Attribution Notice là Public Domain, có WAV 4.7 MB và OGG 300.3 KB. Candidate cần audition loop và kiểm kỹ metadata trước khi dùng: https://opengameart.org/content/suspense-0
- **Steps in wood floor** của mikeask trên OpenGameArt: trang liệt kê CC0, “it's yours”, WAV 613.9 KB. Candidate cần audition để xác nhận chất liệu hợp nền Office: https://opengameart.org/content/steps-in-wood-floor
- **Mysterious Cinematic Ambient** của zec53 trên Pixabay được trang ghi “Free for use under the Pixabay Content License”, nhưng cũng đánh dấu Content ID Registered; chưa chọn làm asset để tránh rủi ro claim không cần thiết: https://pixabay.com/music/mystery-mysterious-cinematic-ambient-291084/

Các link trên là nguồn nghiên cứu, chưa xác nhận dùng file nào và chưa tải asset mới. Ghi nhận trạng thái/attribution cuối cùng vào `assets/PROVENANCE.md` nếu asset được duyệt.

## Tiêu chí nghiệm thu

- Ảnh 1280×720 và 760×600 cho thấy nhân vật lớn hơn hiện tại, camera theo nhân vật không giật, không lộ mép world, tương tác vẫn dùng được và minimap/player dot đúng vị trí.
- Nhãn Investigation nằm hoàn toàn trong một đoạn tường nhìn thấy; NPC nameplates không che mặt/thoại và đọc được ở desktop/compact.
- Nhạc lặp liền mạch, không tự phát trước tương tác đầu tiên của trình duyệt; dialogue/listening rõ hơn ambience; mute/master volume/pause/dispose hoạt động.
- Footsteps phân biệt được nhiều bước, không tạo tiếng cọ liên tục khi đứng yên/va tường/đang mở modal; nguồn và quyền dùng kiểm tra được.
- Dialogue/notebook ở desktop và compact không tràn viewport; điều khiển có accessible name, focus visible, shortcuts bỏ qua input và thao tác vẫn hoạt động như trước.
- Unit, visual/E2E, audio lifecycle và asset-license validation phù hợp đều đạt trước bàn giao.

## Câu hỏi còn mở cho bước duyệt

- Camera khoảng 1.2× là điểm bắt đầu để nghiệm thu; có thể cần chỉnh bằng ảnh thử. Phần addendum không cam kết zoom slider.
- Hai candidate CC0 chỉ là đề xuất; cần nghe thử trước khi chọn. Nếu không hợp, tìm candidate CC0 khác thay vì tự ý chọn nhạc Pixabay có Content ID.
- Chỉnh UI giới hạn vào cụm điều khiển dialogue/notebook; không làm lại nội dung modal, vocabulary interaction hoặc case flow.

## Cập nhật nghiệm thu 2026-10-01

Người dùng yêu cầu đổi Project Utopia và làm rõ hướng nhạc: “nhạc thư giãn thôi, đừng quá u tối”. Candidate thay thế là **Mystical Piano** của Indieteur, CC0, cắt tại 1:35 theo hướng dẫn loop trên trang nguồn. Giữ audio owner, gain nền và lifecycle đã duyệt; cập nhật file local, case URL, provenance và kiểm tra asset/E2E. Chưa coi candidate mới hoặc hình ảnh đã được người dùng nghiệm thu.
