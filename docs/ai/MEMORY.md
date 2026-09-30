---
schema_version: 1
updated_at: 2026-09-30T20:32:26.1692381+07:00
phase: phase-11e
status: in_progress
result_commit: c8ac245
active_spec: docs/superpowers/specs/2026-09-30-phase-11e-feedback-polish-design.md
active_plan: none
---

## Metadata

- Người dùng đánh giá bố cục Office/Archive tạm ổn và đưa 10 feedback. Đã khám phá, tái hiện lỗi và viết spec đề xuất c8ac245; chờ duyệt spec trước khi lập implementation plan. Memory commit kế tiếp theo protocol.

## Current Phase

- Phase 11E, mở rộng polish world/HUD/audio theo feedback. Redesign static world baseline đạt kỹ thuật, được tạm chấp nhận về bố cục. Plan cha controls-visual-ux còn Tasks 3–6; không xem Phase 11E complete. Phase 12 chưa bắt đầu.

## Active Goal

- Xử lý 10 feedback: nhãn tường/sàn, cửa đối ứng, viewport/background, SFX/voice đầy đủ, markers, ghế, prompt gọn, minimap theo movement và HUD thu gọn. Bước hiện tại là user review spec đã viết.

## Current Status

- Giữ hai cảnh Office/Kho lưu trữ, căn cặp cửa/arrival tương ứng; không scene Hành lang thứ ba (người dùng đã chọn).
- Voice đọc đầy đủ câu tiếng Anh bằng audio tạo sẵn (người dùng đã chọn). Có 3 dialogue trees/15 NPC nodes cần clip, gồm nhánh điều kiện; không dùng tiếng nói ngắn thay câu thoại.
- Đã tái hiện page overflow và minimap chậm cập nhật; diagnostic/spec chỉ đọc runtime, chưa có implementation của feedback.
- Spec mới đề xuất một plan tích hợp trong Phase 11E. Architectural path: duyệt written spec → writing-plans → duyệt written plan; Native đã được chọn trong session, không hỏi lại execution method.

## Completed

- Phase 0A–11D: Git và docs/ai/2026-09-30-phase-11d-verification.md.
- Controls Task 1 b3fa09d. Composition Task 2 bcab0e5 bị thay, không xem là nghiệm thu.
- Redesign Tasks 1–5: d2fef68, 18af425, 619ea31, 7e04784, c2b7591. Migration/boards checkpoint 9db54e6; memory 3b758e1.
- Redesign kỹ thuật cuối 40c9911, memory 6a4e716: sửa facing tween crash, global ID/overlap validation, 7 regressions mới, docs/gates/final review.
- c8ac245: spec đề xuất feedback polish, đủ 10 mục, baseline chứng minh và tiêu chí nghiệm thu. Không sửa product code hoặc tạo audio mới ở commit này.

## In Progress

- Chờ duyệt docs/superpowers/specs/2026-09-30-phase-11e-feedback-polish-design.md. Chưa có implementation plan được duyệt cho feedback; active_plan=none là trạng thái thực tế.
- Footstep/UI/door SFX và voice sẽ dùng Howler hiện có. Môi trường hiện chưa có kokoro/torch/soundfile hoặc model cache; khôi phục dev-only generator khi triển khai, không model/TTS/API runtime.
- Hai Minor của review trước vẫn hoãn: assertion tọa độ arrival chính xác và fixture opening đúng 0/1 module. Arrival assertions được đưa vào phạm vi sửa cửa lần này; không tuyên bố đã sửa.
- Task modal/header và breathing của plan cha chưa triển khai. Spec mới chỉ điều chỉnh modal layout tối thiểu nếu shell viewport mới làm lộ lỗi cản thao tác.

## Active Decisions

- Native inline, checkout dev hiện tại. Commit local; không push/merge theo workflow đang giữ.
- Giữ hai scene Office/Archive, căn doors/arrival đối ứng. Người dùng không yêu cầu cảnh Hành lang riêng.
- Voice NPC đọc đầy đủ câu tiếng Anh bằng clip tạo sẵn; mỗi NPC một giọng ổn định, source text từ content. Quyết định đã xác nhận; thiết kế lifecycle/cues còn chờ spec approval.
- Projection 2:1, WASD theo màn hình; footprint/collision/interaction/visual độc lập theo art06/architecture. Không đổi product rules, gameplay IDs hoặc learning/persistence/backend.
- Generated walls chỉ được overlap vuông góc tại endpoint góc/chữ T; global asset IDs unique sau expansion. Gate cũ vẫn giữ khi đổi door layout.
- Môi trường camera 30°, giấy/sepia; character/evidence giữ nguyên. Legacy PNG/builders giữ vì assets_config.json còn tham chiếu.
- npm + Nx. Node 24.19.0, npm 10.9.7 qua .superpowers/runtime/npm-shim/npm.cmd; venv art Python bundle 3.12 + numpy/Pillow/scipy. Kiểm tồn tại trước dùng, không suy từ memory.
- Không sửa runtime khi browser tests chạy; Vite HMR từng detach canvas. Playwright 1 worker, chạy từ apps/game-web, Vite 5174.
- Spec/plan tiếng Việt. Không tự đánh dấu Phase 11E complete hoặc bắt đầu Phase 12. Review spec/plan mới theo brainstorming/writing-plans trước implementation.
- Bố cục nền chỉ tạm chấp nhận; user review ảnh và audition audio vẫn cần cho polish cuối. Giữ việc điều tra nhìn thấy, HUD gọn và không audio phạt sai.

## Blockers

- Gate hiện tại: user review spec đề xuất, chưa phải lỗi kỹ thuật chặn triển khai. Không hỏi lại hai lựa chọn voice/cảnh đã được trả lời.

## Next Actions

1. Nhận duyệt/chỉnh sửa written spec feedback polish. Không coi phản hồi đã duyệt bố cục nền là duyệt spec mới.
2. Sau spec approval, dùng writing-plans tạo plan tiếng Việt và để user review; tiếp tục Native đã chọn khi plan được duyệt.
3. Triển khai theo task: shell/minimap bugs, world labels/door/chairs, markers/prompt/collapsible HUD, rồi SFX/15-node voice; test RED→GREEN và gate từng phần.
4. Chạy full gates/review, gửi ảnh và mẫu audio nghiệm thu, commit verification rồi memory riêng. Giữ backlog plan cha/Phase 12 rõ ràng.

## Verification

- Baseline product code chưa đổi trong phiên feedback: npm/Nx lint 7 projects PASS, 685 Vitest +30 memory tests PASS, build/typecheck/format PASS; E2E repeat world/HUD/layout 152/152 + sáu suite 20/20, Python 41/41. Chi tiết tại docs/ai/2026-09-30-phase-11e-static-world-verification.md.
- Diagnostic feedback: body margin 8px + shell 100vw/100vh → page 1288×736 ở viewport 1280×720; 768×616 ở 760×600; 1928×1096 ở 1920×1080. Body background trong suốt giải thích viền trắng.
- Di chuyển ngắn: logical player (10,9) → (10.2578125,8.7421875), minimap dot vẫn (896,788). Root cause: ngưỡng 2 px của shouldEmitPlayerMoved đang nhận đơn vị logic. Test cũ chỉ bắt cập nhật sau đi đủ xa.
- Browser diagnostic exit 0, log .superpowers/phase-11e-feedback-baseline.log. Không tuyên bố lỗi đã fixed hoặc các gate của implementation mới pass.
- Spec self-review: đủ 10 feedback, không placeholder/chưa rõ, giữ IDs/architecture; git diff --check PASS. memory:check được chạy sau cập nhật này trước memory commit. Backend không đổi.

## Latest Handoff

- Result commit c8ac245 lưu spec đề xuất; code baseline 40c9911. Memory commit kế tiếp, không push.
- Vite 127.0.0.1:5174 và ignored .superpowers scripts/logs có trên máy hiện tại; kiểm process/port khi tiếp tục. Không chạy lại scratch migrate.mjs (không idempotent).
- Screenshot baseline và ledger: .superpowers/sdd/2026-09-30-phase-11e-office-archive-static-world-redesign/. Giữ để đối chiếu; người dùng chỉ tạm chấp nhận và yêu cầu chỉnh polish.
- Không sửa/xóa untracked Claude outputs/ hoặc generated debug.log ở root/apps/game-web; không git add .

## Required Reading

- AGENTS.md, apps/game-web/AGENTS.md, docs/ai/README.md, spec feedback polish trong metadata.
- docs/superpowers/specs/2026-09-30-phase-11e-office-archive-static-world-redesign-design.md và plan cùng tên; baseline authoritative, placement được phép chỉnh theo feedback mới.
- docs/ai/2026-09-30-phase-11e-static-world-verification.md; docs/ai/2026-09-30-phase-11e-static-world-final-review.md.
- docs/art/06_PHASER_CHARACTER_SCENE_ASSET_MODEL_SPEC.md, docs/architecture/ARCHITECTURE.md, docs/concept/ingame_main_office_hud.webp; docs/ai/2026-09-29-phase-7-audio-listening-verification.md và WAV provenance để khôi phục TTS generator.
- Plan cha docs/superpowers/plans/2026-09-30-phase-11e-controls-visual-ux.md: Tasks 3–6 còn lại, không tự chuyển phase.
