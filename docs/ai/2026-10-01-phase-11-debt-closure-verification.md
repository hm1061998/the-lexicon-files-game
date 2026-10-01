# Phase 11 — Đóng nợ navigation, môi trường và nghiệm thu

Ngày 2026-10-01. Người dùng chấp nhận Phase 12, yêu cầu giải quyết nợ Phase 11, rồi chấp nhận cả hình cổng đồng/ánh vàng nhẹ và nhạc Mystical Piano. Không push, không mở tính năng/phase mới.

Plan: `docs/superpowers/plans/2026-10-01-phase-11-debt-closure.md`. Spec: `docs/superpowers/specs/2026-10-01-phase-11e-navigation-portals-design.md`.

**Trạng thái:** Đã đóng nợ kỹ thuật Phase 11 và hoàn tất nghiệm thu hình/nhạc. Full E2E138/138, quality gates và regression cuối10/10 đạt trên Node22.

## Reconcile và thay đổi

- Handoff 0febc78 có bubble đỏ, ghế đè cổng và assertion E2E cũ; Git sau đó đã sửa trong b6503ca/a031ec3/40ef0bc trước Phase12. Không làm lại những việc này. Baseline hiện tại7524305 đã full E2E133/133 ở Phase12.
- bb109fe thêm `feedback-navigation-review.spec.ts`: minimap drawing/player/legend/padding ở desktop/compact; Arrow held/native repeat qua pause; native range/text input; PNG wall alpha thật và hành vi click; sáu lần desktop↔compact resize, kiểm riêng điểm click world và vị trí tới đích.
- `navigation.test.ts` mở rộng route tới mọi spawn của hai scene và kiểm từng segment collision clear. Các unit hiện có kiểm passage0.40 lệch lattice và góc rẽ, collision corner, frame remainder/speed220px/s ở30/60/120FPS.
- `debug.ts`/`WorldScene.ts` thêm `pointerState()` chỉ đọc, trả bản sao, ghi dữ liệu trong dev, reset khi create; không thêm state gameplay/bus/store hoặc API tương tác mới. Diagnostic phân biệt conversion/target/occlusion/path status.
- Phase12 spec/report ghi acceptance thực của người dùng; không đổi kết quả/hạn chế lịch sử.

## Bằng chứng regression

| Khoản nợ | Bằng chứng |
|---|---|
| Click xuyên minimap | Browser drawing/player/legend/padding desktop+compact, không nhận world command; mutation pointer-events:none đã RED, CSS được khôi phục đúng |
| Passage hẹp lệch grid | Unit0.40 corridor và rẽ vào phòng; mọi spawn→mọi target, từng segment clear |
| Held key kích lại sau pause | Browser ArrowRight held + ba native repeat sau resume vẫn đứng yên, release/new press di chuyển; native form controls không di chuyển/replay |
| Route speed theo FPS | Unit30/60/120FPS tiêu thụ frame qua48waypoints, dựa projected distance/220, sai số tối đa một frame+10ms; corner collision clear |
| Transparent wall corner | Pixel PNG alpha0/255, cùng wall opacity1; corner tới sàn rồi dừng; opaque click ghi occluded và đứng yên |
| Resize lệch khoảng18px | Không tái hiện trên code hiện tại.12 lần resize trong hai lượt mới đều command error≤2worldpx và arrival≤3worldpx; không nới tolerance và không sửa runtime dựa giả thuyết |

Hai oracle mới ban đầu sai fixture: range step authored5 nên40→45 (không phải41); alpha fixture đè credenza/plant nên A* invalid là đúng. Đo colliders rồi chọn điểm có clearance, giữ assertion found/occluded. Không sửa sản phẩm để hợp fixture sai.

## Môi trường Node22

Runtime official portable22.23.3, npm10.9.9, cài vào `.superpowers/runtime/node-v22.23.3-win-x64` ignored; không đổi Node/system PATH của người dùng. ZIP được đối chiếu [SHASUMS chính thức](https://nodejs.org/dist/latest-v22.x/SHASUMS256.txt), SHA256:

```text
2b0ff57b049cda1bbcea2240eec20467018713c1efe1f7360c2681859b90ed71
v22.23.3
10.9.9
```

Chạy PATH prepend runtime này, NX_DAEMON=false. Lint/test/build được chạy lại với `--skip-nx-cache` để không dựa vào cache Node24.

## Output quality gate

```text
npm run lint -- --skip-nx-cache
NX Successfully ran target lint for 7 projects

npm run test -- --skip-nx-cache
game-web: Test Files76 passed / Tests499 passed
game-content: Test Files16 passed / Tests166 passed
game-core: Test Files8 passed / Tests57 passed
learning-engine: Test Files2 passed / Tests17 passed
ui: Test Files3 passed / Tests18 passed
shared-types: Test Files1 passed / Tests1 passed
NX Successfully ran target test for 7 projects

npm run build -- --skip-nx-cache
dist/assets/index-RaBJb_jd.css 24.78kB | gzip5.31kB
dist/assets/index-DyIYcwtx.js 1946.25kB | gzip474.44kB
built in13.30s
NX Successfully ran target build for project @lexicon/game-web

npm run typecheck
tsc -b
exit0

npm run format:check
All matched files use Prettier code style!

npm run test:coverage
game-core lines96.7% / branches91.4%; learning-engine lines100% / branches96.72%
exit0

npx nx run game-web:test -- navigation.test.ts navigationMovement.test.ts worldPointer.test.ts gameInputGate.test.ts
Test Files4 passed / Tests15 passed

npm run test:e2e -- --workers=1 feedback-navigation-review.spec.ts --repeat-each=2
10 passed(1.5m)
NX Successfully ran target test:e2e for project @lexicon/game-web
```

Full E2E trên bb109fe (Node22), bao gồm cả journey/performance:

```text
npm run test:e2e -- --workers=1
138 passed(11.0m)
NX Successfully ran target test:e2e for project @lexicon/game-web
PERF-LEAK laps10: textures70→70, listeners80→80, DOM166→166
heap44821778→46922028; ratio1.046857802026506
PERF-LOAD ready1488ms, requests253, total13198245bytes
```

Sau full run chỉ tăng assertion trong test minimap, không đổi source/runtime. Mutation tạm `pointer-events:none` được thực thi riêng sau full run, rồi khôi phục bằng finally, Git xác nhận CSS không đổi. RED bắt world command `status:found`, targetId:null, x1326.8333,y597.6667; do đó regression không chỉ suy luận từ vị trí đứng yên. Lượt regression cuối với assertion mới đạt10/10(1.5m), exit0. Full138/138 chạy trên bb109fe trước assertion bổ sung; nhóm bị ảnh hưởng đã được chạy lại đầy đủ hai lần.

Không đổi backend, không dotnet; không đổi asset/audio, không cần chạy lại art/audio transform.

## Review và rulings

Reviewer độc lập gpt-6-astra read-only range7524305..bb109fe: không Critical/Important gameplay; một Minor về minimap oracle có thể bỏ lọt canvas command invalid/occluded. Executor regrade thành Important đối với gate đóng nợ regression (spec yêu cầu HUD consume-click, kể cả không hủy route). Thêm assertion pointerState vẫn null sau mỗi click, mutation RED đã chứng minh, GREEN cuối10/10. Không phát hiện gameplay finding mới; không dispatch review lần hai.

Các ruling của lượt này:

1. Tiếp tục Native trên dev tại chỗ theo lựa chọn đã lưu; không worktree mới. Nếu cần isolation khác, chi phí là tách checkout sau đó.
2. Diagnostic pointer chỉ đọc dev để phân biệt conversion/occlusion/path; không sửa gameplay resize khi chưa tái hiện. Chi phí nếu lỗi chỉ xuất hiện ở timing khác là cần một trace thực nữa, không bỏ assertion hiện có.
3. Acceptance cổng/nhạc dựa vào trả lời trực tiếp của người dùng; reviewer không thay thế đánh giá thẩm mỹ.
4. Click khi resize/camera đang chuyển động chưa được test mới chứng minh (test chờ1.5s). Không có lỗi cụ thể được tái hiện; giữ pipeline Phaser, không suy rộng regression ổn định thành mọi timing.
5. Minor Phase12/backend/arbitrary projection ngoài authored content giữ phạm vi cũ, không đưa vào debt closure này; chi phí là các limitation đã ghi trong Phase12 report tiếp tục tồn tại.
6. Regrade minimap oracle thành Important cho gate regression, vì vị trí không đổi không chứng minh HUD chặn world command/hủy route. Thêm assertion trên diagnostic đã có, không thêm production API; chi phí là test phụ thuộc diagnostic dev được kiểm cùng pointer pipeline.

## Artifact

Cổng Office/Archive desktop/compact trong `.superpowers/sdd/2026-10-01-phase-11e-navigation-portals/` được browser test tái tạo và người dùng đã chấp nhận. Nhạc hiện tại: `apps/game-web/public/audio/case-001/music/mystical-piano-loop.ogg`. Output quan trọng và review rulings được lưu trong báo cáo này; scratch riêng của debt-closure được dọn sau commit theo protocol executing-plans. Runtime Node22 và artifact các phase trước được giữ.

Hạn chế không đổi: advisory bundle>500kB; số đo performance một máy Windows/Vite dev; Minor Phase12 theo báo cáo lịch sử. Không push; giữ cả hai debug.log untracked.
