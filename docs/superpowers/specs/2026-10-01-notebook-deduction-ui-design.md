# Thiết kế UI/UX sổ tay và bảng suy luận riêng

Ngày: 2026-10-01. Trạng thái: đề xuất, chờ duyệt file spec.

## 1. Mục tiêu và phạm vi đã thống nhất

Người chơi cần hai công cụ điều tra có vai trò rõ ràng:

- **Sổ tay:** đọc lại nhân vật, lời khai, chứng cứ, từ vựng và dòng thời gian đã ghi nhận; hình thức quyển sổ mở hai trang theo ảnh tham chiếu đầu tiên.
- **Bảng suy luận:** xem các manh mối cùng nhau, xếp sự kiện, đối chiếu hai dữ kiện và đưa ra kết luận; hình thức bảng ghim theo ảnh tham chiếu thứ hai.

Người dùng đã duyệt thiết kế sổ tay, sau đó yêu cầu tách phần suy luận và chọn làm cả hai trong cùng gói, sử dụng logic điều tra hiện có. Thực thi inline trên `dev`; không tự mở phase nội dung hoặc backend mới.

Ảnh là tham chiếu bố cục, chất liệu và cách tương tác, không phải hợp đồng nội dung Case #001. Tên vai trò, ngày giờ, chứng cứ, lời khai và mâu thuẫn trong ảnh không thay thế content của repo.

Tham chiếu:

- `C:/Users/Minh/Downloads/11053ae1-7c5b-41b7-ba1e-bba8bb74e78a.png`.
- `C:/Users/Minh/Downloads/ChatGPT Image Oct 1, 2026, 11_04_44 PM-2.png`.
- `docs/01_GAME_DESIGN_DOCUMENT.md`, mục 19–21; `docs/03_CASE_001_VERTICAL_SLICE_SPEC.md`, mục 11–14; `docs/art/06_PHASER_CHARACTER_SCENE_ASSET_MODEL_SPEC.md`; `docs/architecture/ARCHITECTURE.md`.

## 2. Những ranh giới cần giữ

- Chỉ thay giao diện và nơi người chơi thực hiện thao tác. `placeTimelineEvent`, `submitContradiction`, `submitAccusation` của game-core vẫn là nguồn quyết định.
- Không đổi Case #001, điều kiện mở nhiệm vụ, flag ghi lời khai, đáp án đúng, audio, các lựa chọn hội thoại hoặc thứ tự điều tra.
- Không thêm transcript, visitedNPC, graph tiến độ hoặc save version. Các profile lời khai dùng `selectNotebookPeople` đã verified.
- UI không đọc `correctSuspectNpcId` để tô thẻ thủ phạm, không tô mâu thuẫn trước khi người chơi xác nhận, không tự xếp sự kiện đúng.
- Không thêm kéo thả tạo liên kết, chỉnh vị trí ghim hoặc lưu dây nối tự do. Dây nối chỉ minh họa quan hệ nguồn đã có trong content và đã được khám phá; phù hợp MVP graph chỉ đọc trong docs01.
- Không hiển thị tuổi, quốc tịch, ngày gặp, thời điểm ghi lời khai, IPA, nút audio từ vựng hoặc ghi chú cá nhân khi chưa có dữ liệu/tính năng tương ứng.
- Không dependency mới; npm + Nx; React không gọi Phaser internals.

## 3. Hình thức chung

Theo palette và typography đã khóa của repo: paper cream, light beige, warm gray, dark brown, ink black; đỏ điều tra dùng cho dữ kiện, mâu thuẫn và mục đang chọn.

Sổ tay dùng texture giấy React hiện có, nhiều lớp mép giấy, đường gáy giữa hai trang, khuyên kim loại và tab giấy. Bảng dùng nền nâu dạng bảng ghim, khung gỗ dựng bằng CSS và các thẻ giấy có ghim. Những chi tiết này là trang trí, `aria-hidden`, không che chữ hay vùng focus.

Màn hình desktop: modal lớn, căn giữa, chừa viền nhìn thấy thế giới; khoảng tối phía sau đủ phân biệt modal. Màn hình hẹp: các cột xếp dọc, nội dung cuộn trong modal; không ép chữ nhỏ để giữ ba cột.

Khung sổ rộng tối đa 1160px, cách viewport ít nhất 12px; từ 720px trở lên dùng hai trang với danh sách khoảng 36% và chi tiết 64%, dưới 720px xếp dọc. Bảng rộng tối đa 1440px; từ 1100px trở lên dùng ba cột (hồ sơ khoảng 240px, manh mối linh hoạt, kết quả khoảng 320px), dưới 1100px xếp section dọc. Trên màn hình thấp, modal có max-height theo viewport và vùng nội dung cuộn, không cắt mất nút đóng/chuyển.

Font nội dung tối thiểu 14px, ưu tiên 16px; nút tối thiểu 44×44px. Header/nút đóng luôn truy cập được. Khoảng cuộn chừa vùng focus, không cuộn trang web phía sau.

## 4. Sổ tay

### 4.1. Khung và điều hướng

Chỉ có bốn tab: **Nhân vật / Chứng cứ / Từ vựng / Dòng thời gian**. Bỏ tab Kết luận khỏi `NotebookTab`, component và test notebook.

Header có tên sổ tay, gợi ý `J`, nút đóng và nút chuyển sang Bảng suy luận. Tab được chọn có hình thức giấy đánh dấu; điều hướng bằng button có tên rõ ràng và trạng thái chọn. Phím Tab vẫn di chuyển focus theo hành vi trình duyệt.

Mở sổ tay mặc định ở Chứng cứ như hiện tại. Chọn một mục chỉ thay lựa chọn UI, không cập nhật tiến độ vụ án. Mỗi trang chọn mục đầu tiên có sẵn khi chưa có lựa chọn hợp lệ; mất mục sau đổi case/progress thì dùng mục còn hợp lệ, không render mục đã ẩn.

### 4.2. Nhân vật

Trang trái là danh sách hồ sơ được selector hiện có trả về, giữ thứ tự content. Mỗi thẻ có hình nhân vật, tên, vai trò và trạng thái phỏng vấn hiện có. Không dùng trạng thái “đã gặp” nếu tiến độ chưa cung cấp bằng chứng đó.

Trang phải có hồ sơ được chọn, vai trò và đầy đủ lời khai đã ghi. Lời khai lịch sử không bị ẩn do condition hội thoại hiện tại. Chỉ mount `VocabularyText` cho hồ sơ được chọn; context giữ nguyên `dialogue:${treeId}:${nodeId}:text`, không ghi encounter cho các hồ sơ chưa mở.

Hình nhân vật lấy từ still texture của character khai báo trong content, đóng khung và crop bằng CSS cho phù hợp thẻ hồ sơ. Không hardcode đường dẫn riêng Anna/Leo/David trong React, không cắt ảnh tham chiếu thành UI. Thiếu hình hợp lệ thì thẻ chữ vẫn dùng được.

### 4.3. Chứng cứ

Trang trái là lưới thẻ ảnh và tên, chỉ lấy `evidenceIds` đã thu thập. Trang phải là ảnh lớn, tên và mô tả của chứng cứ được chọn. Ảnh chỉ có tính minh họa, giữ mô tả chữ khi content thiếu ảnh.

Mô tả tiếp tục dùng `VocabularyText` với context evidence gốc. Các liên hệ nhân vật chỉ hiện khi có `relatedNpcIds` authored và hồ sơ tương ứng đã được khám phá; không đoán liên hệ từ chuỗi văn bản.

Nút xem lại mở EvidenceModal hiện có, giữ đầy đủ luồng nghe và câu hỏi của audio evidence. Chọn thẻ không tự bắt đầu audio hoặc mở lại câu hỏi. Xem lại không thêm evidence hoặc reset progress.

### 4.4. Từ vựng

Trang trái chỉ liệt kê từ có trong learning profile, theo thứ tự catalogue. Trang phải hiển thị lemma, từ loại, definitionEn, các ví dụ authored và stage đạt được thực tế.

Giữ Beginner/Learning/Immersion do Settings sở hữu: Beginner hiện dịch; Learning chỉ hiện sau khi bấm reveal; Immersion không hiện dịch. Reveal dùng context đã ghi nhận của từ, không tự tạo context.

Các `contextsSeen` được trình bày bằng tên nguồn từ content khi resolve được: chứng cứ hoặc hội thoại tương ứng. Không đưa ID kỹ thuật thô vào giao diện. Nguồn không resolve được bỏ khỏi danh sách nhãn, không ảnh hưởng learning profile và không bịa nhãn.

Không nút “đã học” tự đánh dấu mastery. Chuyển từ hoặc đổi mode không làm bản dịch của từ trước xuất hiện ở từ mới.

### 4.5. Dòng thời gian

Trang ghi chép chỉ hiển thị sự kiện đã được đặt đúng trong `timelineEventIds`, sắp xếp theo thứ tự slot authored. Mỗi hàng có giờ, mô tả, địa điểm và nguồn. Đây là bản ghi đọc lại, không tự suy ra giờ đúng cho các sự kiện chưa xếp.

Khi chưa có sự kiện đã xếp, hiện empty state và nút sang bảng suy luận. Thao tác chọn sự kiện/slot, xác nhận và đối chiếu mâu thuẫn chuyển hoàn toàn sang bảng riêng.

## 5. Bảng suy luận

### 5.1. Khung bảng

Desktop chia ba vùng:

1. **Hồ sơ vụ việc:** tên case từ content, các mục tiêu đang active, hướng dẫn ngắn và phím tắt.
2. **Manh mối:** các thẻ nhân vật, chứng cứ đã khám phá và vùng xếp dòng thời gian.
3. **Đối chiếu / Mâu thuẫn / Kết luận:** chọn dữ kiện để suy luận, xem kết quả đã xác nhận và kết luận khi objective cho phép.

Không tự viết bản tóm tắt tình tiết từ ảnh vì case chưa có field summary. Dùng title, objective và dữ kiện authored hiện có.

Màn hình hẹp chuyển ba vùng thành các section dọc, vẫn giữ thứ tự đọc và nút đóng dễ truy cập. Nút mở Sổ tay chuyển modal một cách nguyên tử.

### 5.2. Thẻ, chi tiết và dây nối

Nhân vật dùng cùng hồ sơ đã ghi nhận của notebook; chứng cứ dùng các evidence đã thu thập. Chọn thẻ mở vùng chi tiết của nó, không chọn đáp án đúng và không tự xác nhận mâu thuẫn.

Dây nối chỉ được vẽ khi cả hai đầu đã hiển thị và có quan hệ authored: evidence → NPC qua `relatedNpcIds`; fact → evidence/dialogue qua sourceIds và owner hội thoại. Không có quan hệ hợp lệ thì không vẽ dây ngẫu nhiên chỉ để giống ảnh. Văn bản “liên quan” và tên nguồn có thể đọc bằng bàn phím/screen reader; dây SVG là minh họa, không mang thông tin duy nhất.

Quan hệ nguồn không đồng nghĩa với tội phạm hay mâu thuẫn. Màu, dấu kiểm và nhãn hồ sơ không kết luận lời khai nhất quán/không nhất quán khi chưa có kết quả được engine xác nhận.

### 5.3. Suy luận hai dữ kiện

Chuyển chooser dữ kiện đã khám phá hiện có khỏi NotebookPanel. Người chơi chọn tối đa hai `discoveredFactIds`; dữ kiện chưa khám phá không xuất hiện. Chọn thẻ nguồn có thể hỗ trợ đọc chi tiết, nhưng không tự chọn cặp dữ kiện đúng.

Giữ điều kiện availability hiện có cho thao tác đối chiếu. Với mỗi đối chiếu sẵn có trong content, nút **Suy luận** dispatch id authored và hai factIds vào `submitContradiction`. React không đối chiếu với `factIds` đúng để tự trả kết quả.

Nút xóa lựa chọn chỉ bỏ hai lựa chọn UI đang chọn. Không xóa dây nguồn, evidence, flag hoặc mâu thuẫn đã xác nhận; nhãn không dùng “Xóa liên kết” khi chưa có graph chỉnh sửa.

Chọn sai dùng feedback/hint hiện có, không reset case, không animation WRONG. Khi đúng, hiển thị explanation authored của mâu thuẫn đã có trong `contradictionIds`; hiệu ứng unlock challenge dialogue vẫn do engine thực hiện.

### 5.4. Xếp dòng thời gian

Chuyển picker sự kiện và slot hiện có sang section trên bảng. Sự kiện chỉ xuất hiện khi availability thỏa mãn; slot chỉ xuất hiện sau khi chọn sự kiện. Không hiển thị `slotId` đáp án dưới thẻ chưa xếp.

Chọn slot và bấm xác nhận gọi `placeTimelineEvent`, giữ nguyên feedback mismatch/hint. Kết quả đúng cập nhật state/autosave như hiện tại và xuất hiện trong trang Dòng thời gian của sổ tay.

### 5.5. Kết luận

Vùng kết luận luôn có chỗ trên bảng, nhưng khi objective chưa active chỉ hiện trạng thái chưa khả dụng từ UI content. Không mount chooser thủ phạm hoặc nút submit khi chưa đủ điều kiện.

Khi objective kết luận active, sử dụng AccusationPanel với danh sách nghi phạm authored. Chọn sai không mất tiến độ; đúng đóng bảng và notebook, chuyển CaseSummary hiện có. Không thay unlock condition hoặc thêm mâu thuẫn Leo chỉ vì ảnh có ví dụ đó.

## 6. State, input, focus và tích hợp

- Thêm `deductionOpen` và action mở/đóng/chuyển modal vào gameStore, chỉ là state trình bày. `notebookOpen` và `deductionOpen` không đồng thời true.
- Mở bảng/sổ tay bị chặn khi pause, evidence modal, dialogue hoặc case đã closed. Chuyển giữa bảng và sổ chỉ khi đang có modal tương ứng và không bị các guard trên chặn.
- `inputLocked` tính cả bảng suy luận. `reviewEvidence` đóng cả bảng/sổ trước khi mở evidence. Accusation thành công đóng cả hai; sai giữ nguyên.
- `J` vẫn mở/đóng sổ tay; `B` mở/đóng bảng suy luận. Dùng B thay Tab trong ảnh để giữ native Tab/Shift+Tab. Trong modal kia, J/B chỉ chuyển nếu action store cho phép.
- Escape đóng popover đang mở trước (theo owner hiện có), sau đó đóng modal đang mở; không vô tình bật Pause sau khi đóng bảng. Shortcut bỏ qua input/textarea/contenteditable và modifier keys.
- HUD có nút mở bảng với nhãn content và gợi ý B; không chỉ có phím tắt. Header hai modal có nút chuyển sang công cụ còn lại.
- Mỗi modal có role dialog, aria-modal, accessible name, initial focus ở nút đóng, focus trap Tab/Shift+Tab và cleanup listener khi unmount. Chuyển modal đưa focus vào modal mới; đóng về control hợp lệ hoặc canvas container focusable.
- Phần canvas không remount khi mở/đóng/chuyển công cụ. Không thêm gameplay/learning logic vào GameCanvas; layer mới chỉ đọc store và nối callbacks.
- Audio dùng cue giấy hiện có cho bảng, không thêm voice vào notebook/board. Autosave tiếp tục theo case-state changes; UI selection/open state không lưu IndexedDB.

## 7. Các phần dự kiến thay đổi

- `apps/game-web/src/notebook/`: khung, CSS, People selector consumer, evidence/vocabulary/timeline read-only panels.
- `apps/game-web/src/deduction/`: board, sections timeline/contradiction, CSS, selector quan hệ nguồn nếu cần, shortcut.
- `apps/game-web/src/state/gameStore.ts`, pause/notebook shortcuts, HUD, presentation audio bridge và GameCanvas layers: vòng đời modal/input.
- `apps/game-web/src/conclusion/AccusationPanel.tsx`: tái sử dụng; chỉ tách style phụ thuộc notebook nếu cần.
- `packages/shared-types/src/case.ts`, `packages/game-content/src/schema/ui.ts`, `packages/game-content/ui/vi.json`: nhãn UI cần thiết, không sửa rules/content lời khai.
- Unit tests và E2E đang thao tác suy luận qua notebook được cập nhật sang board. Không sửa test để bỏ assertions progress, availability, persistence hoặc learning.

## 8. Verification và tiêu chí chấp nhận

1. Chụp/xem cả bốn trang notebook và board ở 1280×720, 760×600 và màn hình hẹp 390×844; cấu trúc giống ảnh, không tràn ngang/che focus, chữ đạt minimum.
2. Notebook có đúng bốn tab, không có chooser mâu thuẫn/kết luận/xếp sự kiện; board có các hành động đó và không sửa case state chỉ vì mở/đọc.
3. Kiểm thử selectors/render: chỉ nội dung đã khám phá; context gốc; translation modes; fallback asset; sự kiện chưa đặt không lộ giờ đúng trong notebook.
4. Unit tests store/shortcut: modal loại trừ nhau, khóa movement, guards, Esc, J/B, editable focus, wrong/correct accusation và review evidence.
5. Browser thật: chuyển hồ sơ/chứng cứ/từ, focus trap/restore, cuộn từng vùng, vocabulary click/Enter, Learning reveal và Settings; canvas luôn một instance.
6. Journey đầy đủ qua board: thu thập → hội thoại → xếp sự kiện → đối chiếu sai/đúng → challenge David → accuse sai/đúng → case closed → reload; kết quả/tiến độ không thay đổi.
7. Regression save cũ David tiếp tục giữ progress, không đoán transcript; các bài notebook People trước tiếp tục kiểm lịch sử theo UI selection mới.
8. Chạy và lưu output `npm run lint`, `npm run test`, `npm run build`, thêm typecheck, format và memory:check. Backend không đổi nên không cần dotnet.

## 9. Handoff

Spec này cụ thể hóa hai yêu cầu ảnh và phạm vi “cả hai, dùng logic hiện có”. Cần người dùng duyệt **file spec** trước khi tạo implementation plan theo workflow architectural. Approval thiết kế notebook trước không được dùng thay approval artifact mới này.

Sau khi spec được duyệt: viết plan tiếng Việt có các task tách metadata UI, vòng đời modal/store, notebook, board, browser/regression; trình file plan và chốt execution inline dev. Chỉ commit/push implementation sau verification và authorization phù hợp; approval push People trước không tự áp dụng cho gói mới.
