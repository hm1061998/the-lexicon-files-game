# Phase 12 — báo cáo hiệu năng và leak (2026-10-01)

Đo bằng `apps/game-web/e2e/performance.spec.ts` (Chromium, Vite dev server, Windows, một worker). Heap đọc qua `performance.memory` với `--enable-precise-memory-info` và `gc()` hai lượt (không bật cờ này thì heap bị làm tròn thô, ba lần chạy cho cùng một số).

## Leak: chuyển cảnh Office↔Archive + mở/đóng sổ tay

Mỗi vòng = Office→Archive→Office + mở/đóng notebook. Có một vòng khởi động trước khi lấy mốc.

| Số vòng | Texture | Listener | Node DOM | Heap trước → sau | Tỉ lệ |
| ------- | ------- | -------- | -------- | ---------------- | ----- |
| 10 | 70 → 70 | 80 → 80 | 166 → 166 | 44.8 → 46.6 MB | 1.039 |
| 10 | 70 → 70 | 80 → 80 | 166 → 166 | 45.2 → 46.9 MB | 1.037 |
| 30 | 70 → 70 | 80 → 80 | 166 → 166 | 45.2 → 47.1 MB | 1.042 |
| 30 | 70 → 70 | 80 → 80 | 166 → 166 | 44.7 → 47.5 MB | 1.062 |

- Listener = scene `events` + `input` + `scale` + `game.events` (sau review mở rộng từ 56 lên 80; bus của React không nằm trong số đếm). Số liệu 4 dòng bảng trên được lấy trước khi mở rộng; lần đo lại sau mở rộng: 10 vòng, texture 70→70, listener 80→80, DOM 166→166, heap 44.7→46.9 MB (1.049).
- Bộ đệm resource timing được nâng lên 100 000 mục (mặc định 250) để không đếm thiếu; kết quả 253 request, 13.2 MB.
- Texture, listener, DOM: **không đổi** (assert chính xác; DOM cho phép +5).
- Heap: tăng ~1.7 MB ở 10 vòng và ~1.9–2.8 MB ở 30 vòng, tức gấp 3 số vòng mà mức tăng gần như không đổi ⇒ khởi động bộ nhớ đệm, không phải tăng theo vòng.
- Đối chứng: cấp phát giữ lại 50 000 object làm cùng phép đo tăng ~10% (1.102), nên phép đo đủ nhạy.
- Ngưỡng test: tỉ lệ heap < 1.10 (quan sát cao nhất 1.062).
- Cleanup scene khi `shutdown`/`destroy`: đã có test đơn vị `assetManifest.test.ts` ("settles and cleans listeners on scene shutdown/destroy"); không cần thêm.

## Tải lạnh (dev server)

| Chỉ số | Giá trị | Ngưỡng |
| ------ | ------- | ------ |
| Thời gian tới `__lexiconDebug` | ~1.1 s | < 5 s |
| Tổng bytes (253 request) | 13.2 MB | < 25 MB |
| Trong đó ảnh | 3.4 MB | |
| Trong đó script (chưa minify) | 9.4 MB | |
| Audio lúc tải lạnh | 0 | |

Production: `dist` 21 MB, bundle JS chính ~1.9 MB; `public` 19 MB (assets 15 MB, audio 3.8 MB). Lúc tải lạnh mới kéo 3.4 MB ảnh trên tổng 15 MB, và audio chưa tải, nên asset đã tải theo nhu cầu.

## Kết luận

- Leak: **đạt**, không phải sửa.
- Tải: **đạt**; atlas, lazy load thêm và nén asset **không cần** ở thời điểm này (quyết định theo ngưỡng của spec; nếu muốn giảm 19 MB `public` thì là tối ưu tuỳ chọn, ngoài phạm vi Phase 12).
- Hạn chế: số đo từ một máy Windows và dev server; tải lạnh của bản production chưa đo bằng trình duyệt.
