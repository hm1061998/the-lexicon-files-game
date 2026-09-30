# Phase 11E — Hoàn thiện cảnh, HUD và âm thanh theo feedback

Ngày: 2026-09-30. Trạng thái: người dùng đã duyệt spec bằng phản hồi “duyệt spec”; implementation plan cần được review trước khi thực thi. Bố cục nền Office/Archive ở `40c9911` được người dùng đánh giá tạm ổn; không xem feedback mới là nghiệm thu toàn bộ Phase 11E.

## Mục tiêu và phạm vi đã được người dùng xác nhận

Giữ bố cục tổng thể đã dựng, làm không gian có chỉ dẫn gắn với kiến trúc, cửa chuyển cảnh có quan hệ rõ ràng, giao diện không che việc điều tra và âm thanh tạo cảm giác có người đang làm việc trong văn phòng.

Người dùng xác nhận thêm:

- Giữ hai cảnh Main Office và Kho lưu trữ; căn cửa và điểm xuất hiện tương ứng. Không thêm scene Hành lang riêng.
- Voice đọc đầy đủ câu thoại tiếng Anh bằng audio tạo sẵn. Không dùng tiếng nói ngắn thay cho câu thoại.

Tất cả thuộc Phase 11E. Giữ scene/interactable/evidence/dialogue/objective IDs và luật điều tra, học, lưu tiến độ, backend. Spec này bổ sung/thay thế các quyết định trình bày liên quan của plan `controls-visual-ux` và redesign static world; không tự triển khai những task còn lại không liên quan như nhịp thở nhân vật.

## Đối chiếu 10 feedback

| Feedback                      | Thiết kế đề xuất                                                                                             |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Nhãn phòng đang nổi trên cảnh | Nhãn phòng gắn vào mặt tường; nhãn hành lang nằm trên mặt sàn, cùng phối cảnh 2:1                            |
| Cửa/arrival không tương ứng   | Đặt cặp cửa ở hai đầu đối ứng, đi qua cùng một hướng không bị quay về cùng cạnh của cả hai phòng             |
| Hai thanh scroll toàn trang   | Sửa kích thước shell và margin gốc; body không scroll, modal dài vẫn cuộn nội bộ                             |
| Viền trắng hai bên            | Nền html/body/root và vùng letterbox cùng màu nền canvas                                                     |
| Thiếu âm thanh                | Footsteps khi di chuyển thật, SFX thao tác/cửa/giấy và voice tiếng Anh theo node                             |
| Thiếu marker vật chứng/cổng   | Cue cho vật chứng và cửa đã hiện trong case, nhìn thấy trước khi vào interaction radius; outline khi tới gần |
| Ghế quay ra ngoài             | Sinh biến thể ghế theo hướng, đặt mặt ngồi hướng về bàn liên quan                                            |
| Prompt E thô/che tầm nhìn     | Prompt một hàng gọn, viền nhẹ, đặt tránh nhân vật/vật chứng/HUD; màn hình nhỏ dùng vùng cạnh dưới            |
| Minimap không theo di chuyển  | Sửa ngưỡng phát sự kiện theo đúng đơn vị, giữ một lần projection và nguồn vị trí từ Phaser                   |
| HUD nhỏ che cảnh              | Mục tiêu và minimap có nút thu/mở; màn hình hẹp mặc định thu gọn, launcher luôn truy cập được                |

## Bằng chứng baseline

Diagnostic read-only ở `dev` HEAD `6a4e716`, Vite 5174, không sửa runtime:

```text
Viewport 1280×720: body margin 8px, page 1288×736, canvas starts (8,8).
Viewport 760×600: body margin 8px, page 768×616; canvas letterboxed.
Viewport 1920×1080: page 1928×1096.
Minimap: player (u=10,v=9) → (10.2578125,8.7421875), dot stays (896,788).
```

- Shell hiện dùng `100vw × 100vh`, nhưng body vẫn có margin mặc định và nền trong suốt. Đây là nguyên nhân scroll và mép trắng, không phải lỗi kích thước PNG.
- `publishPlayerPosition` gọi `shouldEmitPlayerMoved` với tọa độ logic, trong khi helper có ngưỡng 2 px. Vì vậy vị trí HUD chậm cập nhật tới khi đi gần hai đơn vị logic. E2E trước đó giữ phím tới khi vượt ngưỡng nên không bắt được lỗi di chuyển ngắn.
- `createRoomLabel` dựng bảng giấy ngang ở depth cao nhất; không có thông tin mặt tường/sàn. Marker/outline hiện chỉ cho target gần nhất trong radius.
- Cửa và arrival spawn của cả hai scene hiện cùng cạnh `u≈0`; không diễn đạt hai phía của cùng lối đi.
- Ghế office đang dùng chung một sprite hướng cố định. Renderer Python có khả năng quay geometry trước khi render; không cần xoay sprite phẳng trong runtime.
- Howler và master volume đã có cho listening evidence. WAV của Phase 7 là asset tạo bằng Kokoro; máy hiện tại chưa có môi trường TTS/model cache, cần khôi phục công cụ tạo audio ở bước triển khai.

Log chi tiết local: `.superpowers/phase-11e-feedback-baseline.log`. Baseline kỹ thuật trước feedback vẫn ở `docs/ai/2026-09-30-phase-11e-static-world-verification.md`; không dùng kết quả cũ để tuyên bố các sửa mới đã pass.

## Hướng triển khai

Có hai cách tổ chức phù hợp: một plan tích hợp toàn bộ feedback trong Phase 11E, hoặc hai plan lần lượt cho world/HUD và audio. Chọn một plan tích hợp với task riêng và gate từng phần: sửa hai lỗi runtime/layout trước, chỉnh scene và chỉ dẫn, làm HUD, sau đó thêm audio và chạy tích hợp. Cách này giữ một bộ tiêu chí nghiệm thu và một lần review toàn bộ thay đổi; asset audio vẫn có thể sinh sau khi world/UI ổn định.

Mở rộng những đường dữ liệu hiện hữu: scene JSON → Phaser; typed event bus → Zustand/React; content → Howler. Không thay state ownership hoặc thêm package runtime.

## 1. Shell và viewport

- Reset margin html/body; root và game shell chiếm đúng viewport, dùng chiều cao động với fallback. Không dùng `100vw` cộng margin/padding.
- Dùng token màu mực/nâu tối đang là canvas background cho html/body/root/letterbox; không thêm màu trắng ngoài cảnh.
- Giữ camera FIT và tỷ lệ 16:9. Canvas/HUD dùng cùng hệ quy chiếu; vùng letterbox được kiểm tra riêng ở tỷ lệ viewport khác 16:9.
- Chỉ shell trò chơi không scroll. Dialog, notebook, pause/settings và màn hình báo lỗi dài vẫn có vùng cuộn nội bộ, với close/header/focus nhìn thấy được.
- Kiểm cả việc resize, không chỉ CSS `overflow:hidden`: bounds của shell phải đúng viewport, canvas không tràn và không có thanh cuộn page.

## 2. Nhãn gắn tường/sàn và ghế

Scene content khai báo mặt đặt nhãn và anchor. Nhãn phòng dùng wall segment/axis, vị trí logic và elevation trên mặt tường; chữ/bảng có baseline song song tường. Nhãn hành lang dùng anchor trên sàn và affine projection theo trục 2:1, giống chữ trên nền. Không dùng bảng overlay ngang nổi cao hơn mọi nhân vật.

- Tất cả text/ID vẫn lấy từ `packages/game-content`; Phaser không hardcode tên phòng.
- Mặt phẳng chỉ ảnh hưởng visual/depth; không tạo collider, không thay world anchor hoặc interaction.
- Renderer nhãn dùng khả năng 2D hiện có, không thêm 3D/physics/package. Texture/container được cleanup khi shutdown/destroy.
- Có thể đặt biển phòng trên đoạn tường thấp nhìn thấy được; không tăng chiều cao toàn bộ tường chỉ để gắn biển. Giữ lối đi và đồ vật nhìn thấy như baseline.

Ghế có các biến thể hướng cần dùng của cùng geometry/camera 30°. Mặt ngồi hướng vào bàn, lưng quay ra lối đi. Sinh ảnh từ geometry đã quay, không dùng angle của sprite để giả hướng isometric. Ghế gộp trong meeting-table builder cũng được rà hướng; chỉ sửa geometry sai được xác nhận. Mỗi biến thể có pivot/footprint/provenance và placement tương ứng, collision không bị thay bởi visual rotation.

## 3. Cặp cửa và arrival spawn

Giữ `hallway_door ↔ PLACEHOLDER_archive_door`, `from_archive`/`from_office`. Cặp cửa phải thể hiện hai phía của một đường nối.

Đề xuất giữ Office exit ở cạnh `u=0` và dời cửa quay về Office của Archive sang cạnh đối diện `u≈16`, cùng tuyến `v≈5`. Office ra hướng lên-trái thì Archive xuất hiện từ mép dưới-phải và đi tiếp lên-trái vào phòng; chiều ngược lại giữ quan hệ tương ứng. Camera/projection không đổi.

- Opening, khung cửa, interaction floor anchor và marker cùng nằm trên lối đi thật.
- Spawn nằm hẳn phía trong cửa, cách đủ body/clearance; người chơi không đứng trong wall hoặc tự trigger lại cửa ngay lúc arrival.
- Dời props gần opening mới nếu cần, giữ khu chức năng tổng thể và mọi gameplay ID.
- Có dấu hướng đi gọn/marker cửa đọc được; prompt dùng tên đích từ content.
- Test đi bộ bằng WASD/E tới cửa cả hai chiều, assert scene đích và tọa độ arrival chính xác sau runtime readiness. Không dùng teleport để chứng minh traversal.

## 4. Marker và prompt tương tác

Cue nhỏ cho mỗi vật chứng/cửa đã được case cho hiện, kể cả ngoài radius; không gợi ý đáp án hay lộ vật chưa được reveal. Không gắn marker đỏ lên mọi props trang trí. Dùng semantic evidence/transition từ content, không danh sách ID Case #001 trong scene class.

- Vật chứng: diamond nhỏ trên visual surface; doors: cue trên khung/lối đi. Đỏ chỉ dùng đúng các loại được product guardrails cho phép.
- Khi tới gần, target hiện outline gọn và một prompt ưu tiên; không nhân đôi diamond lớn với cue nhỏ của cùng target.
- Dừng float ở reduced motion; marker không che chân, mặt hoặc evidence art. Dọn listener/tween/object theo lifecycle.
- Prompt một hàng: keycap E nhỏ + động từ/tên ngắn lấy từ content, nền giấy mỏng, padding/viền nhẹ. Không dùng khung lớn như panel.
- Desktop đặt cạnh target, tránh bounds của target/người chơi và các HUD hiện đang mở. Nếu không đủ chỗ, dùng vùng cạnh dưới an toàn; compact ưu tiên vùng này.
- Prompt biến mất khi input locked/dialogue/modal/transition, không mở rộng hit radius và không tạo thêm shortcut khi đang gõ input.

## 5. Minimap và HUD thu gọn

Ngưỡng sự kiện movement được đo bằng projected world pixels cho cả scene logic lẫn scene pixel. Payload vẫn khai báo coordinateSpace; minimap project logical point đúng một lần. Giữ throttle tối đa một lần mỗi 100 ms, ngưỡng 2 px đúng nghĩa; teleport/transition publish/reset theo luồng hiện hữu. Phaser là nguồn vị trí duy nhất.

- Chấm player có tương phản rõ với floor/walls/markers, vẽ sau geometry; kiểm di chuyển ngắn, nhiều hướng, dừng, cạnh obstacle và sau scene transition.
- Objective có trạng thái thu/mở trong UI store; không lưu vào save gameplay.
- Minimap dùng trạng thái hiển thị đã có, không thêm state thứ hai cho cùng khả năng mở/ẩn. Khi thu gọn, giữ launcher `Bản đồ`; M và nút đều mở/thu được, vẫn bỏ qua khi focus input hoặc gameplay bị khóa.
- Objective launcher vẫn báo có mục tiêu hiện tại; mở ra xem đủ text. Hai launcher có label, `aria-expanded`, focus-visible và target thao tác ≥44px.
- Ở viewport rộng, mặc định mở như hiện nay nhưng cho thu lại. Ở compact dưới 960px hoặc chiều cao dưới 640px, mặc định thu; lựa chọn tay không bị reset chỉ vì đổi scene. Không che modal và không làm canvas remount khi toggle.
- Không thêm button đỏ cho mục đích chung; dùng giấy/mực theo art06. Nút thu/mở không tự pause game hoặc thay case progress.

## 6. Âm thanh và voice tạo sẵn

### Nội dung và asset

SFX/voice được khai báo bằng content metadata và URL local. Dialogue nodes được bổ sung clip theo `speakerId + treeId + nodeId`; text nguyên gốc là nguồn tạo audio, không viết bản thoại thứ hai trong React. Node clip đọc đầy đủ câu tiếng Anh đang hiển thị. Các lựa chọn hỏi của player vẫn là text; nút UI tiếng Việt không bị đọc bằng giọng NPC.

- Một giọng ổn định cho Anna, một cho Leo, một cho David; phát âm rõ, nhịp hội thoại tự nhiên. Không bắt chước giọng người thật theo danh tính.
- Case hiện có 3 dialogue trees, 15 nodes của ba NPC. Sinh đủ clip cho 15 nodes, gồm nhánh điều kiện; content gate kiểm coverage, không chỉ làm demo cho entry node.
- Sinh WAV/clip ở công cụ dev offline, theo cách đã dùng ở Phase 7; app chỉ đóng gói file audio, không model/TTS/API runtime.
- Mỗi clip ghi text, speaker, generator/model/voice revision, checksum, duration/format và provenance. Gate đối chiếu text/checksum để phát hiện audio cũ khi content đổi.
- Sinh SFX nhẹ cho bước chân trên sàn office, giấy/notebook, thao tác UI, mở evidence và chuyển cửa. Có ít nhất hai biến thể footstep, tránh lặp âm máy đều. Không thêm âm phạt sai, fanfare thưởng hoặc nhạc nền vào scope này.
- Howler hiện có được dùng lại; không dependency JS mới. Công cụ sinh WAV/TTS nằm ngoài runtime, tạo trong môi trường dev riêng và không commit model weights/cache.

Tài liệu nguồn cho công cụ TTS: [Kokoro upstream](https://github.com/hexgrad/kokoro), [model upstream](https://huggingface.co/hexgrad/Kokoro-82M); provenance Phase 7 ở `apps/game-web/public/audio/case-001/leo-phone-recording.provenance.json`. Kho upstream hỗ trợ pipeline xuất WAV; việc khôi phục runtime/model generation được kiểm chứng lúc thực thi, không giả định môi trường đã có.

### Phát và lifecycle

- Footstep được yêu cầu từ chuyển động thực của player, không từ việc giữ WASD. Đứng sát tường, bị pause/modal/dialogue/transition hoặc đứng yên không phát bước chân. Nhịp dựa trên quãng đường/thời gian di chuyển thật, không phụ thuộc FPS.
- Phaser phát typed cue event; audio owner ở lớp presentation/bridge phát Howler. Không đưa audio vào game-core hoặc learning-engine, không global mutable singleton mới.
- UI cue phát đúng lúc thao tác thành công: mở/đóng notebook, evidence, pause/settings; chọn dialogue; thu/mở HUD; door transition. Không phát theo hover, gõ input hoặc React rerender.
- Voice tự phát khi một node được mở bởi phiên dialogue bắt đầu từ thao tác người dùng; có replay và mute/master volume hiện hữu. Không đợi clip hết mới cho tiếp tục hỏi.
- Chuyển node dừng clip trước rồi phát clip mới. Đóng dialogue, đổi scene, pause hoặc unmount dừng voice; callback của clip cũ không khởi động lại playback.
- Chỉ một voice cùng lúc; SFX không lấn voice, footstep giảm mức khi voice/listening evidence hoạt động. Master volume/mute áp dụng cho mọi kênh, không sửa telemetry hoặc câu hỏi listening hiện tại.
- Load/play lỗi vẫn cho đọc câu và tiếp tục điều tra; hiện trạng thái/nút replay ngắn. Missing asset được content gate/diagnostic nêu rõ, không im lặng hoặc trắng màn hình.
- Autoplay bị browser chặn thì chờ thao tác/replay, không lặp play vô hạn; gameplay vẫn dùng được khi mute hoặc không có audio device.

## Kiểm tra và nghiệm thu

TDD cho logic movement threshold, door pairing/spawn, marker eligibility, HUD toggles và audio lifecycle. Test browser dựa trên trạng thái/điều kiện, không tăng timeout để che lỗi.

1. Page không scroll ngang/dọc và không mép trắng ở 760×600, 1024×768, 1280×720, 1920×1080; resize đúng, modal dài vẫn cuộn và close/focus truy cập được.
2. Screenshot cho cả hai cảnh: nhãn bám đúng mặt, ghế nhìn vào bàn, hai cửa đối ứng, vật chứng/cửa có cue, prompt không che target/người chơi, HUD compact có launcher.
3. Minimap dot cập nhật sau bước ngắn dưới 2 đơn vị logic; bốn hướng, transition/reload/resize, tần suất hợp lý và không duplicate projection.
4. Traversal WASD/E hai chiều và assert arrival coordinates. Content validation/reachability/clearance/IDs vẫn đạt; case IDs và save compatibility không đổi.
5. Cue/audio tests xác nhận actual movement, khóa input, UI action một lần, voice theo node, replay/mute, race khi đổi node/close, lỗi asset và cleanup. Audio không gây đổi case/learning state.
6. Người dùng nghe mẫu giọng của ba NPC và SFX, rồi kiểm câu thoại đầy đủ; nghe không chồng clip, không cắt mất nội dung ở playback bình thường. Chỉ nghiệm thu voice sau audition.
7. Chạy `npm run lint`, `npm run test`, `npm run build`, typecheck/format/content/memory gates; Python khi renderer/generator đổi; full E2E và repeat những nhóm nhạy movement/transition/audio. Dán output vào verification, final review một lần và memory commit riêng theo protocol. Backend không đổi thì không tuyên bố backend checks mới.

## Những phần chưa thuộc đợt feedback này

Không Phase 12, scene thứ ba, AI NPC, voice recognition/microphone, cloud TTS lúc chơi, multiplayer, nhạc/ambient dài hoặc đổi nội dung vụ án. Task modal/header và breathing của plan cha vẫn ghi nhận là backlog riêng; chỉ chỉnh modal layout tối thiểu nếu shell viewport mới làm lộ lỗi cản đóng/đọc.

Spec không tuyên bố đã sửa code hoặc đã tạo audio. Bước kế tiếp là review implementation plan tiếng Việt cho phạm vi này, tiếp tục Native đã được chọn trong session.
