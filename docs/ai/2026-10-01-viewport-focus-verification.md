# Sửa viewport/focus sau playtest

Người dùng duyệt gói bounded viewport/focus ngày2026-10-01 từ `2026-10-01-player-playtest-feedback.md`. Baseline497cb85 trên dev; tiếp tục inline, không dependency/backend mới, không push. Chỉ sửa UI viewport/panel, không triển khai tabPeople hoặc onboarding.

**Trạng thái:** Đã sửa và kiểm chứng gói viewport/focus; tất cả failure của lượt kiểm tra được xử lý và nhóm ảnh hưởng chạy lại GREEN.

## Nguyên nhân và thay đổi

Browser regression tái hiện chuỗi Arrow→E mở Anna→Tab/Enter mở nghĩa→Escape→J:

- Compact760×600: game-root scrollTop86 thay vì0; tên người nói/control bị cắt và offset lưu qua modal.
- Notebook desktop1280×720: panel bottom748 vượt viewport720. Overlay/panel dùng content-box nên padding cộng vào chiều cao100%.
- Evidence760×360: panel top−8 vì max-height tính nội dung rồi cộng padding, cao hơn vùng chứa.

`overflow:hidden` vẫn tạo scroll container; focus có thể cuộn nó. Chỉ đổi root sang clip chưa đủ: focus tiếp tục cuộn document86px. Cách sửa cuối neo game-root fixed/inset0 vào viewport và dùng overflow:clip; không tắt native focus scroll bên trong panel, không reset scroll bằng event/timer.

Files:

- `apps/game-web/src/game/gameShell.css`: viewport fixed, clip thay hidden.
  Thông báo learning/settings recovery được đặt trong viewport bằng CSS thay vì nằm sau canvas trong luồng trang.
- `apps/game-web/src/notebook/notebook.css`: border-box cho overlay/panel để chiều cao gồm padding.
- `apps/game-web/src/evidence/evidence.css`: border-box, max-height gồm padding và không vượt available height/dynamic viewport.
- `apps/game-web/src/pause/pause.css`: overlay padding/border-box, panel giới hạn kích thước và overflow-y:auto để Settings dài cuộn nội bộ.
- `apps/game-web/e2e/viewport-focus.spec.ts`: regression keyboard compact/desktop, geometry cả panel/nút Đóng/popup/focus, evidence và Settings cửa sổ thấp, viewport offsets.

Không thêm preventScroll hàng loạt: giữ khả năng Tab tự đưa control trong panel vào vùng nhìn thấy. Body/loading/recovery styles giữ contract cũ; fixed chỉ áp dụng vùng game.

## RED/GREEN và verification

RED trên source cũ:

```text
Expected game-root.scrollTop0 / Received86
Expected notebook bottom<=720 / Received748
Expected evidence top>=0 / Received−8 (760×360)
```

Fixture đầu tiên gặp canvas tạm thời hai phần tử trong dev mount; test chờ debug ready và canvas count1 trước input, không coi lỗi readiness này là RED của viewport. Meeting Minutes ở600px chưa cần scroll; dùng viewport360px để kiểm nội dung dài thực, không kéo dài content giả.

Lượt GREEN đầu:

```text
npm run test:e2e -- --workers=1 viewport-focus.spec.ts
3 passed(1.1m)
```

Root quality gates trên Node22.23.3/npm10.9.9:

```text
npm run lint
NX Successfully ran target lint for7projects (6cache, frontend chạy)
npm run test
NX Successfully ran target test for7projects (6cache, frontend499/76files chạy)
npm run build
NX Successfully ran target build for project @lexicon/game-web
npm run typecheck
tsc -b / exit0
```

Nhóm E2E rộng gồm viewport/navigation/UI/dialogue/journey/learning/settings:36/38 pass(5.6m) trước chỉnh recovery và oracle cuối. Journey kết thúc+reload, điều hướng/cổng hai chiều, dialogue focus và viewport đều đạt. Hai failure được chẩn đoán riêng:

- Learning recovery: nút nằm ngoài viewport vì notice chưa có CSS, nằm sau container canvas height100%. Clip ngăn browser cuộn tới nút. Thêm style đặt notice vào viewport; không force-click, không thay recovery logic.
- Settings360px không đủ dài để cần scroll, nên oracle scrolled=true sai fixture. Dùng240px cho Settings, giữ360px cho evidence; assertion viewport/panel không nới.

Oracle native keyboard mới dài hơn bước mouse cũ; lượt đầu chạm test budget30s ở bước cuối, snapshot vẫn có control trong panel và không có geometry assertion thất bại. Chỉ file regression mới dùng90s để đủ chuỗi đa-panel; không tăng timeout assertion hoặc retry, không sửa runtime để hợp timing.

Lượt cuối trên source hoàn thiện chạy lại toàn bộ nhóm bị ảnh hưởng:

```text
npm run test:e2e -- --workers=1 viewport-focus.spec.ts learning.spec.ts settings.spec.ts
8 passed(2.4m)
NX Successfully ran target test:e2e for project @lexicon/game-web
```

Evidence native Tab/Shift+Tab và Settings240px đạt; test dài nhất47.8s, root/window offsets0, focused control nằm trong panel client rect và viewport; Close được kích hoạt bằng Enter sau khi quay lại bằng Shift+Tab. Full E2E toàn repo không chạy lại trong gói này; chỉ nhóm liên quan và root quality gates. Không cộng các lượt run thành một fullsuite giả.

## Review và phạm vi

Reviewer độc lập read-only workingtree từ497cb85: không Critical/Important source; một Important về oracle evidence dùng scrollTop assignment+click auto-scroll chưa chứng minh native keyboard inner-scroll. Đã bổ sung Tab/Shift+Tab thực, focused control ở trong client rect panel và viewport, quay về Close bằng keyboard; Settings thấp có Tab/scroll assertion. GREEN cuối8/8; không còn finding review chưa xử lý trong gói này.

Reviewer không đánh giá People/onboarding (ngoài gói đã duyệt), movement/portal/audio/save không đổi source, browser engines khác/mobile chưa có execution evidence. Báo cáo này chỉ khẳng định hành vi được test trên Chromium Windows; không thay feedback người dùng thật.

Hạn chế cũ: bundle advisory>500kB; tabPeople/onboarding và friction quanh bàn cần công việc riêng. Không backend nên không chạy dotnet. Không tự push các commit mới.
