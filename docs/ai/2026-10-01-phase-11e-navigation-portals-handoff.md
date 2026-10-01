# Phase 11E — Handoff navigation và cổng đồng

Ngày 2026-10-01, người dùng duyệt plan rồi yêu cầu: “commit và lưu memory những thứ đã làm được, tôi sẽ tiếp tục công việc sau”. Dừng triển khai tại snapshot này, không push, không chuyển Phase 12. Chưa đạt Definition of Done cuối.

## Đã triển khai

- `4a12ace`: zoom 1.8 desktop / 1.6 compact, fit/clamp theo bounds.
- `bbaa19c`: minimap player/marker cố định 9 CSS px, vị trí cập nhật từ bus.
- `146de79`: chế độ dịch chỉ Settings; HUD chuột 44px gồm notebook/map/pause và nút tương tác; compact có controls chuột.
- `b377663`: A* và controller route tạm thời, collision body 0.36×0.36, không tự tương tác khi đến đích.
- `89e98da`: mũi tên song song WASD, click sàn để đi, click xa đến NPC/chứng cứ/cổng rồi click lại để tương tác, hủy route khi bàn phím/modal/pause/blur/transition.
- `ae36b49`: hai scene dùng bục đồng và ánh vàng nhẹ, vòng/mote chậm, reduced-motion tĩnh, asset deterministic và provenance. IDs/transition/spawn giữ contract. Có legend “Bạn đang ở đây”.
- Snapshot tiếp theo gồm sửa review: minimap nhận pointer để không click xuyên; trục A* thêm clearance boundaries/start/goal để giữ passage hẹp lệch grid; physical-key gate chặn repeat tới keyup; movement tiêu thụ thời gian dư qua waypoint; hit-test alpha texture của tường.

## Review và kiểm tra

Reviewer độc lập `/root/review_navigation_portals` (gpt-6-astra), range `d940c64..ae36b49`: không Critical, 5 Important như danh sách sửa review trên. Đã sửa trong snapshot này và unit mới pass, nhưng browser regression cho các sửa đó chưa chạy. Chưa tuyên bố review closure.

Trước sửa review, root lint/test/build pass: 7 Nx projects; frontend 74 files / 492 tests, content 16 files / 165 tests. Typecheck và format pass. Art suite 45/45 pass. Đó là kết quả trên `ae36b49`, không phải verification cuối của snapshot mới.

Full E2E trước sửa review:

```text
npm run test:e2e -- --workers=1
22 failed
101 passed (10.8m)
NX Running target test:e2e for project @lexicon/game-web failed
```

Regression review RED: off-grid corridor và transparent corner fail; helper key gate/movement chưa tồn tại. Sau sửa:

```text
npx nx run game-web:test -- src/game/systems/navigation.test.ts src/game/systems/worldPointer.test.ts src/game/systems/gameInputGate.test.ts src/game/systems/navigationMovement.test.ts
Test Files 4 passed (4)
Tests 15 passed (15)
NX Successfully ran target test for project @lexicon/game-web
```

Regression bubble đang cố ý ở RED, chưa sửa vì người dùng yêu cầu dừng:

```text
npx nx run game-web:test -- src/game/systems/anchorScreen.test.ts
Test Files 1 failed (1)
Tests 1 failed | 16 passed (17)
placeBubble > keeps a 44px action bubble above a zoomed target and player
expected null not to be null
```

Typecheck snapshot trước commit:

```text
npm run typecheck
tsc -b
exit 0
```

Không chạy lại toàn bộ lint/test/build/E2E sau sửa review. Có test RED còn lại nên snapshot là WIP. Không đổi backend/dependency. Một lệnh unit đầu dùng sai option `--testFiles`; đã chạy lại với positional filters đúng. Diagnostic E2E tạm đã xóa sau khi đo xong, kết quả lưu trong artifact ignored.

## Việc còn lại và root cause đã xác nhận

1. **Bubble desktop:** nút tương tác mới làm bubble cao 58px. Các candidate `placeBubble` sát anchor đụng rect của target/player khi zoom 1.8, nên fallback. Regression trong `anchorScreen.test.ts` đã RED. Cần thêm candidate thực sự phía trên target (ví dụ `anchor.y - size.height - BUBBLE_GAP`), giữ tránh HUD/target/player, rerun 4 bubble E2E. Đo browser: anchor x≈534 y≈132; target rect≈467,126–540,180; player≈569,132–621,269; bubble 138×58.
2. **Portal Office:** center (1.5,5) chồng collider `decor_chair_desk_west` ở (1.8,4.5). Diagnostic liệt kê đúng blocker này; E2E collider center fail. Giữ pad theo spec, dời ghế ra khỏi footprint 1.3×1.3 và bổ sung content regression cả center/footprint/spawn. Gợi ý vị trí ghế (3,4.5), cần kiểm tra geometry rồi mới chốt. Chưa dời ghế.
3. **Oracle E2E cũ:** đổi prompt hardcoded “Ra hành lang”/“Quay lại Main Office” sang lấy content hoặc prompt cổng mới (“Đến phòng lưu trữ”/prompt Archive trong JSON). HUD compact giờ hiện ba nút, chỉ ẩn movement/E hint; helper `hud.spec.ts/openWorld` và test compact vẫn đòi cả bar hidden. Keycap giờ “WASD / ↑↓←→”. Notebook không còn selector dịch; sửa assertion cũ ở hud.spec.ts:207.
4. **Mouse E2E:** meeting_minutes approach currently reports phone_recording (các evidence cùng mặt bàn). Xác minh điểm click/hit bounds và bán kính mục tiêu; không ép tracker thành clicked ID nếu nó đúng nearest. Fixture (5.8,9.5) có body chạm partition, cần đổi điểm hợp lệ (5.5,9.5) rồi kiểm tra. Resize test dừng lệch 17.89px cần chạy lại với movement/alpha fixes và chẩn đoán, không tăng tolerance tùy tiện. Timed paired-key test lệch 0.367 logical trong full suite (tolerance .3); unit OR chính xác pass, cần oracle ổn định theo frame/thời gian thực.
5. **E key timing:** `feedback-evidence-prompt` thất bại ngay press E; dự án đã có helper giữ E đến dialog vì immediate keyup có thể xóa JustDown trước frame. Dùng oracle ổn định hoặc sửa input nếu chứng minh lỗi sản phẩm, không bỏ assertion. World cue count Archive expected2 actual1 cần kiểm tra visibility theo camera mới trước sửa expected.

Sau xử lý: thêm browser regression minimap surface/legend/padding không di chuyển/tương tác, giữ Arrow khi pause/resume/native repeat và form controls; xác minh alpha transparency và route speed. Chạy toàn bộ E2E một worker, root lint/test/build, typecheck/format/memory. Không sửa runtime trong khi E2E đang chạy. Cập nhật verification/review rồi mới kết luận kỹ thuật.

## Artifact và môi trường

- `.superpowers/sdd/2026-10-01-phase-11e-navigation-portals/`: ledger, logs và screenshots Office/Archive desktop/compact; ignored, không đảm bảo tồn tại ở checkout khác. `feedback-navigation.spec.ts` tái tạo screenshots cổng. `diagnostic-prompt.png` ghi fallback đã đo.
- Tiếp tục Native tại `dev`, không worktree mới. Git cần `-c safe.directory=F:/work/the-lexicon-files-game`. Git writes/npm gates cần escalation trong môi trường này.
- Prepend `.superpowers/runtime/npm-shim` vào PATH, `NX_DAEMON=false`. Lệnh regression gần nhất báo Node 24.15.0; chưa xác minh Node 22. Python art dùng `.venv-art-codegen/Scripts/python.exe` (có scipy).
- Giữ root `debug.log` và `apps/game-web/debug.log` nguyên trạng, không stage.
- Không có browser suite/dev server chủ động còn chạy tại handoff. Các run đã kết thúc. Music Mystical Piano và visual cổng vẫn cần người dùng nghe/xem chấp nhận; Phase 11E còn mở.
