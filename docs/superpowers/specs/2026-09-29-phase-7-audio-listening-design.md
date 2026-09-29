# Phase 7 Audio / Listening — Thiết kế

## Mục tiêu

Hoàn thiện trải nghiệm điều tra qua nghe đầu tiên có thể chơi được trong Case #001: người chơi tìm và nghe bản ghi điện thoại liên quan tới Leo, trả lời câu hỏi về vị trí của anh ấy, và cách hiểu đúng sẽ cập nhật trạng thái vụ án. Người chơi có thể nghe lại không giới hạn và dùng các mức hỗ trợ nghe đã có trong thiết kế hệ thống học tiếng Anh. Trải nghiệm phải giữ nhịp điều tra làm trọng tâm và không chấm lỗi tiếng Anh nhỏ thành thất bại.

Người dùng đã chọn thực thi inline và đồng ý tạo recording bằng Kokoro. Phase 7 là thay đổi kiến trúc vì bổ sung nội dung audio, vòng đời playback, trạng thái listening task và một đường mới để mở fact trong case.

## Nguồn chuẩn và ràng buộc

- Roadmap §26: playback bằng Howler, play/pause/replay, chế độ subtitle, evidence là phone recording; tiêu chí chấp nhận gồm nghe lại, trả lời task và cập nhật case state.
- Thiết kế hệ thống học tiếng Anh §§16–17, 31–32: các mức nghe gồm audio kèm subtitle, audio kèm keyword hint, và chỉ audio; replay không giới hạn; theo dõi cục bộ việc replay/subtitle/transcript/answer; MVP không thu microphone.
- Case #001 §15 Evidence 5: Archive/audio device; lời thoại chính xác “Hi, I'm outside the meeting room. I'll call you back in a few minutes.”; thời điểm 20:29; hỗ trợ fact `Leo was outside at 20:29`; câu hỏi “Where was Leo?” với đáp án đúng “Outside the meeting room”.
- Tổng số evidence của case vẫn là năm; phone recording là evidence audio đã có trong hợp đồng nội dung của case, không phải evidence thứ sáu. Không thay đổi truth nào khác của case hoặc tạo thêm audio clue.
- Dùng Howler đã khai báo trong `apps/game-web`; không thêm dependency và không gọi API/backend trong gameplay. Logic core vẫn độc lập framework. React và Phaser giao tiếp qua typed event bus/store; scene phải dọn listener khi đóng.
- Giữ local-first save và schema hiện có, trừ khi trong lúc triển khai chứng minh được cần migration. Không lưu vị trí playback tạm thời hoặc buffer audio.
- Guardrail sản phẩm: không ép thành luồng quiz/reward, không lives/timer/streak punishment, không hiện “WRONG!”, replay không giới hạn, hint giúp hiểu ngôn ngữ thay vì tiết lộ đáp án, không truy cập microphone.

## Các phương án đã cân nhắc

1. **Dùng Kokoro tạo clip tĩnh cho nội dung game (đề xuất và đã đồng ý).** Không cần dịch vụ ở runtime, yêu cầu mạng hay trả phí theo mỗi lần chơi; asset cố định được đóng gói cùng game. Không đưa model vào ứng dụng phát hành. Trước khi phát hành preset voice đã chọn, lưu lại model/voice chính xác cùng bằng chứng nguồn và license; license Apache-2.0 của model không tự giải quyết nguồn gốc/license của mọi preset voice.
2. **Tạo bằng hosted TTS API.** Tiện lợi và có thể có hạn mức miễn phí, nhưng cần cấu hình tài khoản/billing, đồng thời phụ thuộc điều khoản của dịch vụ bên ngoài trong khâu sản xuất nội dung.
3. **Thu âm người thật hoặc tải recording có sẵn.** Có thể tự nhiên hơn nhưng cần quyền từ người biểu diễn/quyền bản ghi, hoặc xác minh được license asset và yêu cầu attribution. Không dùng clip lời thoại đã tải nếu quyền sử dụng không rõ.

Hướng đã chốt: phương án 1. Không cần recording miễn phí trên mạng cho lời thoại do game viết của Leo. Tải ambience/SFX tùy chọn nằm ngoài phase này; nếu bổ sung sau, từng asset phải có license tương thích và ghi nhận nguồn/attribution.

## Thiết kế runtime

### Audio asset và nguồn gốc

Tạo một recording tĩnh với đúng lời thoại Case #001, giọng tiếng Anh rõ và tự nhiên. Lưu file đã encode theo quy ước public asset hiện có của game và tham chiếu từ case content đã được validate; không hardcode URL riêng của case trong React hoặc Phaser. Chọn format/sample rate/bitrate cuối cùng theo build và khả năng hỗ trợ trình duyệt hiện tại; ưu tiên audio nén phù hợp phân phối web, đồng thời giữ bản lossless để tái tạo nếu khả thi.

Đặt một bản ghi provenance nhỏ cạnh asset, gồm văn bản nguồn, model và revision đã pin, preset voice, ngày tạo, format đầu ra, liên kết license của model/code, kết quả rà soát license voice/data và attribution bắt buộc (nếu có). Không commit model weights, secret, bản ghi của người dùng hoặc generated files ngoài asset của case này. Nếu không thể xác minh quyền phân phối của preset từ thông tin nguồn/license đã công bố, chọn preset khác hoặc ghi rõ clip chỉ dùng cho prototype; không mặc định license Apache của model bao trùm mọi quyền sử dụng voice.

### Vòng đời playback

Đặt Howler sau một typed controller/hook nhỏ trong `apps/game-web/src/audio/` để evidence surface của React sử dụng. Các trạng thái cần có: idle, loading, playing, paused, ended và lỗi tải/phát có thể phục hồi. Các điều khiển: play, pause, replay từ đầu; replay không giới hạn. Dừng và unload khi đóng evidence/unmount; chặn callback bất đồng bộ cũ tác động lên view đã đóng. Tuân thủ yêu cầu user gesture của trình duyệt. Nếu asset lỗi, hiển thị thông báo dễ hiểu và cho retry; modal không được trống trắng. Telemetry playback tuân theo policy profile/session cục bộ, không lưu audio bytes hoặc chép transcript sang state thứ hai.

### Evidence và listening task

Đưa phone recording vào luồng tương tác evidence hiện có. Evidence view hiển thị tên, timestamp, điều khiển recording và task có accessibility sau khi người chơi có cơ hội nghe. Điều khiển audio phải do người chơi chủ động dùng; không autoplay khi vừa phát hiện evidence. Các mức hỗ trợ subtitle:

- **Beginner / Level 1:** audio kèm transcript tiếng Anh do game biên soạn (và bản dịch tiếng Việt chỉ khi Beginner mode hiện có cho phép).
- **Learning / Level 2:** audio kèm keyword hint do game biên soạn; transcript ẩn cho tới khi người chơi chủ động mở; hành động mở transcript được theo dõi và tính là hỗ trợ.
- **Immersion / Level 3:** chỉ audio; không tiết lộ transcript hoặc bản dịch trong listening surface.

Mode phải dùng lại tùy chọn translation mode hiện tại đã được lưu, không thêm một thiết lập độ khó toàn cục cạnh tranh. Đổi mode trong khi đang phát không được reset hay làm hỏng tiến độ case. Nội dung, câu hỏi, lựa chọn, hint, đáp án kỳ vọng và state effects đều lấy từ data, được validate trong `packages/game-content`; UI strings nằm trong nguồn UI content đã localized.

Với câu “Where was Leo?”, các lựa chọn phải đúng theo hợp đồng Case #001: inside the meeting room, outside the meeting room, at home. Đáp án đúng áp dụng case effects đã khai báo để ghi nhận phone-recording evidence/fact và đánh dấu listening task hoàn thành. Hint không được tiết lộ lựa chọn đúng. Đáp án sai nhận phản hồi nhẹ nhàng đã thống nhất (“This interpretation doesn't match the evidence.”) kèm gợi ý nghe lại/từ khóa hữu ích; không làm fail case, xóa tiến độ hoặc đặt punitive flag. Luôn cho nghe lại trước và sau khi trả lời. Có cho đổi lựa chọn sau khi đã đúng hay không là chi tiết triển khai; gửi lại đáp án đúng phải idempotent và không thêm trùng evidence/fact.

### Ranh giới state

- Prompt/lựa chọn/hint/effects/audio reference được biên soạn trong `packages/game-content`, kiểm tra bằng Zod và cross-reference validation.
- Trả lời đúng làm thay đổi case state có thẩm quyền qua discriminated `Condition`/`Effect` và API transition của game-core; không dùng `eval`, không nhân bản case facts trong React và không tạo singleton mới.
- Vị trí/trạng thái playback chỉ tồn tại tạm trong audio controller. Case store chỉ giữ kết quả ổn định của đáp án/effect cần cho persistence.
- Telemetry cần cho learning profile chỉ là counter (replay/subtitle/transcript/use/answer); không thu microphone hay giữ raw audio.
- Callback của Howler, event-bus listener và task subscription phải được dọn khi modal đóng hoặc component chủ sở hữu bị destroy.

## Trải nghiệm và accessibility

Recording vẫn là evidence trong giao diện điều tra, không trở thành một quiz screen tách rời. Người chơi chủ động chọn play, pause, replay, mở transcript (nếu mode cho phép) và gửi cách diễn giải. Nút có tên truy cập rõ ràng, focus nhìn thấy được; lựa chọn task dùng được bằng bàn phím; lỗi/trạng thái được thông báo mà không cướp focus. Chỉ dùng đỏ cho accent điều tra theo visual rules. Không dùng âm thanh làm cách duy nhất để báo trạng thái điều khiển hoặc lỗi.

## Ranh giới phạm vi

Bao gồm: wrapper playback dùng Howler, asset phone recording Case #001 và provenance, nội dung recording/listening đã validate, hỗ trợ subtitle/keyword cho ba mode hiện có, feedback/effects của đáp án, unit/content/UI tests tập trung và E2E listening flow.

Không bao gồm: pipeline tổng quát cho soundscape/music, tải ambience/SFX, microphone/speech recognition, cloud TTS ở runtime, voice cloning, TTS động, audio mixer/settings tổng quát, backend sync, learning assessment/scoring mới, timeline/contradiction thuộc Phase 8, mở rộng nội dung case ngoài phạm vi hoặc thay đổi truth Case #001.

## Cách xử lý lỗi

- Audio metadata/content thiếu hoặc sai sẽ làm content validation thất bại hoặc hiển thị lỗi nội dung dễ hiểu cho developer qua loading/error boundary hiện có.
- Asset đóng gói nội bộ bị lỗi tải/phát sẽ hiện thông báo có thể phục hồi và nút retry; phần còn lại của evidence/case vẫn dùng được.
- Callback audio cũ sau khi đóng/mở lại không được ảnh hưởng evidence session mới.
- Đáp án/effect sai hoặc lặp bị game-core từ chối hoặc xử lý idempotent; không thể làm hỏng persisted state.
- Nếu trình duyệt yêu cầu user gesture thì chỉ bắt đầu playback sau thao tác rõ ràng của người chơi.

## Tiêu chí chấp nhận và kiểm chứng

- Content schema từ chối audio source/text/options/effects bị thiếu, evidence/fact/objective reference không tồn tại, answer ID sai và hint không hợp lệ; registered content validation/build kiểm tra cross-reference.
- Audio wrapper tests bao phủ play/pause/replay, lỗi tải/phát, callback sau dispose và cleanup mà không phụ thuộc phát ra âm thanh thật.
- Core tests chứng minh đáp án đúng chỉ mở đúng fact/evidence/objective effects đã biên soạn; đáp án sai không đổi truth/progress của case; gửi lặp đáp án đúng idempotent.
- UI tests xác minh transcript/hint hiển thị theo từng mode, quy tắc mở transcript, playback/task controls có accessibility, feedback nhẹ nhàng và vẫn replay được sau khi trả lời.
- E2E chứng minh luồng phát hiện → chủ động play/replay → trả lời → case fact/state còn sau reload; không có console error hoặc canvas thứ hai.
- Gate bắt buộc của repo: `npm run lint`, `npm run test`, `npm run build` cùng typecheck, format, E2E, memory và diff checks hiện có. Không cần kiểm tra backend trừ khi thay đổi `apps/api`.
- Kiểm tra audio: nghe asset cuối và xác minh đúng lời thoại, phát âm, độ rõ, thời lượng/kích thước cùng timestamp 20:29 trên evidence view.

## Lựa chọn triển khai còn mở

- Chọn và pin một Kokoro English voice preset sau khi kiểm tra nguồn/license đã công bố. Ưu tiên giọng Mỹ rõ ràng, phù hợp Case #001; preset cụ thể là quyết định khi sản xuất asset, không phải tùy chọn runtime.
- Chọn encoding nén và chi tiết playback component sau khi đo kích thước asset và đối chiếu quy ước project hiện tại. Các lựa chọn này phải nằm trong những hợp đồng nêu trên.
