# Phase 11D — Xác minh hoàn tất

**Ngày:** 2026-09-30 14:33 +07:00  
**Code commit:** sẽ điền sau khi commit Task 8  
**Phạm vi:** Tasks 6–8 của `docs/superpowers/plans/2026-09-30-phase-11d-isometric-dimetric.md`.

## Kết quả

Phase 11D chuyển Case #001 sang game 2D chiếu dimetric 2:1. Office và archive dùng logical plane `(u,v)` cùng trục điều khiển đã được người dùng chốt: phép chiếu `x=originX+(u-v)×64`, `y=originY+(u+v)×32−elevationPx`; `u+` đi SE, `v+` đi SW; W=NW, D=NE, S=SE, A=SW. NPC có tên, hướng đối thoại và nhịp thở hình ảnh; player và ba NPC có walk sheet thật 8×4.

## Kiểm tra

Môi trường hiện tại không có `npm` trong PATH. Nx khởi chạy nhưng các target dùng npm scripts dừng với `'npm' is not recognized as an internal or external command`. Chạy runner cài sẵn trực tiếp thay thế:

| Kiểm tra | Kết quả |
| --- | --- |
| Vitest `apps/game-web` | PASS — 432/432 |
| Vitest `packages/game-content` | PASS — 128/128 |
| Vitest `packages/game-core` | PASS — 49/49 |
| Vitest `packages/learning-engine` | PASS — 12/12 |
| Vitest `packages/shared-types` | PASS — 1/1 |
| Vitest `packages/ui` | PASS — 18/18 |
| TypeScript composite `tsc -b` | PASS |
| ESLint trên source apps/packages | PASS |
| Vite production build | PASS; bundle JS 1,908.86 kB, giữ cảnh báo chunk hiện có |
| Prettier `--check .` | PASS; provenance table được giữ nguyên định dạng căn cột và thêm vào `.prettierignore` |
| AI memory test qua Nx cache/runtime | PASS — 30/30 |
| AI memory check | PASS trước khi cập nhật memory handoff cuối |
| Art-codegen Python unittest | PASS — 35/35 |
| `world.spec.ts --retries=0` | PASS hai lần — 29/29 mỗi lần |
| `scene-layout.spec.ts --repeat-each=2 --retries=0` | PASS hai lần — 24/24 mỗi lần |
| Bài chụp trạng thái UI tạm thời | PASS — office, archive, dialogue, evidence, notebook, pause; test tạm đã xóa |
| `git diff --check` | PASS trước bước ghi ledger |

Backend không đổi trong phase; không chạy dotnet build/test.

## Rà soát hình ảnh

Ảnh lưu trong thư mục SDD bị ignore `.superpowers/sdd/2026-09-30-phase-11d-isometric-dimetric/` để tiện xem lại: `task8-office.png`, `task8-archive.png`, `task8-dialogue.png`, `task8-evidence.png`, `task8-notebook.png`, `task8-pause.png`. Office có minimap; archive, đối thoại, vật chứng, notebook và pause đều được mở từ runtime. Đã xem từng walk sheet player/Anna/Leo/David ở độ phân giải 1280×640.

| Hạng mục | Đạt | Khác biệt / lưu ý |
| --- | --- | --- |
| Office và archive | Sàn diamond, vùng chức năng có nhãn, phối cảnh 2:1, màu giấy/sepia và nội thất đọc được | Bố cục vẫn thưa hơn concept; vài dải tường/nội thất hậu cảnh chưa liền mạch theo mép phòng |
| Minimap | Hiển thị diamond và các vùng/marker của scene | Chi tiết thu nhỏ đơn giản hơn concept, phù hợp kích thước HUD hiện tại |
| Dialogue, notebook, pause | Hệ giấy, viền mực, serif và màu trầm nhất quán | Notebook chiếm nửa phải màn hình; cấu trúc còn gọn hơn concept |
| Evidence | Modal dùng ảnh evidence, transcript và điều khiển nghe | Nội dung kéo dài bị cắt ở cạnh dưới viewport 1280×720 trong ảnh; cần rà riêng responsive/scroll modal |
| Bốn walk sheet | Mỗi sheet có 32 frame, bốn hàng hướng, alpha trong suốt; tạo dáng/nhận diện từng nhân vật nhất quán | Chuyển động tay còn tiết chế; không có NPC tự đi |

Không dùng “giống concept” làm cổng pass tuyệt đối; scene hiện tại đạt hướng chiếu và cấu trúc đã duyệt, các chênh lệch nêu trên được lưu làm điểm xem lại.

## Tài liệu và self-review

- Đồng bộ `docs/art/06` với logical plane, projector, collision footprint, depth anchor, interaction, camera, spawn và texture manifest. Ví dụ Cartesian cũ được đánh dấu legacy.
- Đồng bộ `docs/art/07`, `docs/concept/README.md`, `docs/architecture/ARCHITECTURE.md` và spec trục dimetric. Không còn quy ước `v+ = NE` trong tài liệu active.
- Kiểm tra event lifecycle dialogue start/end, cleanup listener, reduced-motion cho hướng/nhịp thở; animation đi bộ vẫn là phản hồi điều khiển chức năng.
- Xác nhận tabletop `restsOn`/`surfaceOffset`, chuyển cửa office/archive hai chiều, collision logic, texture manifest đủ và không có NPC movement tự động qua test hiện có.
- Giữ nguyên nội dung/progression/evidence IDs và product guardrails; không có thay đổi backend.
- Art provenance từng walk sheet đã ghi trong `assets/PROVENANCE.md`; nguồn được tạo theo terms ChatGPT mà chủ dự án đã chấp nhận.

## Hạn chế còn lại

- Các lệnh `npm run lint/test/build/typecheck/format:check/memory:check` nguyên gốc không chạy được do `npm` không nằm trong PATH. Đã xác minh trực tiếp các runner tương ứng; target Nx cấu hình gọi npm vẫn cần môi trường có npm để pass qua đúng entry point.
- Vite cảnh báo chunk JavaScript vượt 500 kB (1,908.86 kB chưa gzip).
- Evidence modal có vùng nội dung bị cắt trong screenshot viewport 1280×720; follow-up nên kiểm tra scroll/responsive.
- Office/archive vẫn thưa hơn concept và vài dải tường hậu cảnh chưa ăn khớp với sàn.
