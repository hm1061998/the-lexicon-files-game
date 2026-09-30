# Phase 11C — Verification và đối chiếu concept

**Ngày:** 2026-09-30 11:06 +07:00  
**Code commit:** `9ef78aa` (`chore: complete phase 11C cleanup task 5`)  
**Phạm vi:** Task 5 và Task 6 của `docs/superpowers/plans/2026-09-30-phase-11c-concept-fidelity-and-cleanup.md`. Task 4 vẫn là WIP chưa được xác nhận đạt yêu cầu; phần bố cục được chuyển sang Phase 11D theo phản hồi người dùng.

## Kết quả gate

| Lệnh | Kết quả |
| --- | --- |
| `npm run lint` | PASS, 7 project |
| `npm run test` | PASS, 381 test |
| `npm run build -- --skip-nx-cache` | PASS; Vite báo bundle lớn nhất khoảng 1.887 MB (cảnh báo hiện hữu) |
| `npm run typecheck` | PASS |
| `npm run format:check` | PASS |
| `npm run memory:check` | PASS sau khi đồng bộ memory |
| `nx run ai-memory:test` | PASS, 30 test |
| `python -m unittest discover -s tools/art-codegen -p 'test_*.py'` | PASS, 35 test |
| `python -m py_compile tools/art-codegen/make_walk_frames.py tools/art-codegen/test_make_walk_frames.py` | PASS |
| `scene-layout.spec.ts --repeat-each=2 --retries=0` | PASS, 32/32 trong mỗi lần chạy; chạy hai lần liên tiếp |
| `npm run test:e2e -w @lexicon/game-web -- --retries=0` | PASS, 89/89 trong mỗi lần chạy; chạy hai lần liên tiếp |
| `git diff --check` | PASS, không có whitespace error |

Art-codegen chạy bằng môi trường mới `.venv-art-codegen` (Python 3.12, NumPy 2.3.5, SciPy 1.18.1, Pillow 12.3.0); môi trường nằm ngoài Git qua `.gitignore`. Playwright runner được đổi sang spawn trực tiếp Vite và Playwright, đợi HTTP readiness và luôn dừng Vite trong `finally`. Thay đổi này khắc phục tình trạng lệnh Playwright đã pass assertion nhưng treo lúc teardown của `webServer`.

Backend không đổi nên không chạy `dotnet build/test`.

## Nội dung Task 5

- Minimap scale marker theo chiều rộng world bounds, mô tả vị trí gần nhất có tên phòng; E2E overlap chạy ở 760×600 và 1280×720.
- Scene texture loader settle khi scene shutdown/destroy; lỗi tải ảnh evidence có nhánh xử lý; asset URL dùng chung schema validation; bỏ trường `imageAsset` không sử dụng; hook dev kiểm tra texture thiếu.
- Paper tile giảm xuống 512×512 / 304,243 bytes; đã xem ảnh và xác nhận hạt giấy còn nhìn thấy. Provenance và CSS được cập nhật.
- Xóa ba walk sheet NPC không được dùng; cập nhật hướng dẫn tái tạo và chiều cao nhân vật trong prompt.
- Các mục cũ Escape/focus, `unknownSuspect`, `aria-live`, âm lượng dưới StrictMode đã được kiểm tra trong test hiện hữu; không phát hiện thiếu test.

## Triage hoạt ảnh vung tay

Đã thử tách chuyển động tay khỏi sheet hiện tại nhưng vùng thân trên nối với tay, khiến phép biến dạng sinh mảnh ảnh rời. Hai biến thể đều làm tăng lỗi kiểm tra silhouette (12 rồi 9 subcase). Đã hoàn nguyên biến dạng và giữ test để bảo vệ silhouette. Theo fallback đã cho phép trong plan, bỏ vung tay cho tới khi asset được tách thủ công hoặc sinh lại; chân trụ vẫn lift 1 px như cũ.

## Đối chiếu hình ảnh

Đã xem screenshot office HUD, minimap, prompt ở phòng họp, evidence modal, notebook, pause và archive cạnh `docs/concept/ingame_main_office_hud.webp`.

| Hạng mục | Giống concept | Còn khác |
| --- | --- | --- |
| HUD và giấy tờ | Tông giấy/sepia, heading mục tiêu, số hồ sơ, marker đỏ, prompt tương tác và key bar cùng ngôn ngữ thị giác | Bố cục scene chưa theo mật độ và phối cảnh của ảnh concept |
| Notebook và pause | Dùng bề mặt giấy và kiểu chữ serif | Cấu trúc màn hình còn đơn giản hơn concept |
| Office / phòng họp | Có minimap, prompt, đồ nội thất và khu chức năng | Game là góc nhìn 2D trục thẳng, concept là isometric cắt lớp; sàn còn rộng, nội thất thưa; biên bản họp hiện ở cạnh bàn thay vì trên mặt bàn |
| Archive | Có kệ, nhãn/khu terminal và luồng đi giữa scene | Còn vùng trống; cửa chuyển cảnh chưa gắn vào tường |

Các sai lệch về kích thước phòng, logic nội thất, vật chứng trên mặt bàn, cửa trên tường và NPC được ghi thành backlog Phase 11D tại `docs/ai/2026-09-30-phase-11d-user-feedback-backlog.md`. Không kết luận scene đã giống concept.

## Hạn chế và quyết định

- Task 4 WIP chưa qua review và người dùng không hài lòng với kết quả; không tính là hoàn thành. Phase 11D sẽ xem lại và điều chỉnh bố cục theo backlog.
- Walk sheet vẫn là bản tạm sinh bằng code; chưa có vung tay do giới hạn phân đoạn silhouette. Asset vẽ tay thật vẫn chờ người dùng.
- `npm run build` vẫn in cảnh báo bundle lớn khoảng 1.887 MB.

