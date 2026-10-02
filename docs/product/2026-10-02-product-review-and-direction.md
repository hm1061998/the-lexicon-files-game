# Đánh giá sản phẩm và định hướng phát triển

Ngày: 02/10/2026. Trạng thái: **advisory** — tài liệu tham khảo cho người dùng và coding agent khi đề xuất việc tiếp theo.

## 0. Cách agent sử dụng tài liệu này

- Đây **không** phải nguồn authoritative. Khi mâu thuẫn, áp dụng bảng ưu tiên trong `docs/README.md` (product → docs/01, learning → docs/02, case → docs/03, phase/DoD → docs/04, agent workflow → `AGENTS.md`).
- Không tự mở phase, không tự triển khai mục nào trong backlog dưới đây. Mỗi mục cần người dùng chọn, rồi đi theo workflow `brainstorming → spec → writing-plans → thực thi` như `AGENTS.md`.
- Khi người dùng hỏi "làm gì tiếp", dùng §6 (backlog có mã `PR-xx`) để đề xuất, nêu mã mục, lý do và chi phí ước lượng. Khi một mục được duyệt hoặc hoàn tất, ghi pointer trong `docs/ai/MEMORY.md`, không sửa lịch sử tài liệu này ngoài cột trạng thái ở §6.
- Mục tiêu tối ưu: giá trị người chơi thực và khả năng thương mại, không phải số lượng polish trên một màn hình.

## 1. Tóm tắt

Nền kỹ thuật tốt hơn mức prototype thông thường; ý tưởng có điểm khác biệt thật. **Rủi ro lớn nhất không phải công nghệ** mà là: (1) khối lượng nội dung, (2) chất lượng art, (3) xu hướng dồn công sức trau chuốt UI của một case duy nhất.

Ảnh chụp trạng thái khi đánh giá (02/10/2026, branch `dev`): 356 commit trong khoảng 6 ngày; ~13k dòng code chính, ~11k dòng test; game-web 547 + content 188 unit test, nhóm E2E 61 test; build JS một chunk ~1,96 MB (gzip ~479 KB). Một case (Case #001, 20–30 phút): 2 scene, 3 NPC, 5 evidence, ~53 KB JSON viết tay.

## 2. Ý tưởng

### 2.1. Điểm mạnh — giữ nguyên

- Lõi "hiểu tiếng Anh tốt hơn → điều tra tốt hơn" đúng: ngôn ngữ là công cụ chơi, không phải quiz gắn thêm. Thể loại suy luận/điền chữ (vd. _The Case of the Golden Idol_, _Return of the Obra Dinn_) đã chứng minh có người trả tiền.
- Guardrail (không energy, ads, streak phạt, timer ép) nhất quán với mô hình **premium**, không phải freemium mobile. Không đề xuất mô hình phá guardrail này.

### 2.2. Rủi ro

| Mã     | Rủi ro                                                                                                                                                                                                             | Hệ quả                                                     |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------- |
| RISK-1 | Chưa chốt người mua chính. Người mê trinh thám thấy tiếng Anh A2 quá dễ; người học A2 có thể thấy suy luận quá khó.                                                                                               | Độ khó, marketing và giá không có điểm neo.                |
| RISK-2 | Nội dung là nút thắt: 1 case 20–30 phút. Bán Steam giá 10–15 USD thường cần 3–6 giờ (≈5–8 case).                                                                                                                  | Engine tốt nhưng không có gì để bán.                       |
| RISK-3 | Engine mới chứng minh với Case #001; có thể còn giả định riêng của case này.                                                                                                                                       | Chi phí Case #002 chưa biết.                               |
| RISK-4 | Chưa có công cụ soạn case; `dialogues.json` một case đã ~20 KB viết tay.                                                                                                                                           | Mỗi case mới tốn nhiều công và dễ lỗi tham chiếu.          |
| RISK-5 | Polish spiral: notebook/board đã qua nhiều vòng (people → deduction → no-scroll + SVG) trong khi nội dung đứng yên.                                                                                               | Thời gian đi vào phần ít ảnh hưởng doanh thu.              |
| RISK-6 | Art: sprite nhân vật 160×160 trên canvas 1920×1080, một phần ảnh do AI sinh. Screenshot quyết định lượt mua trên Steam; Steam yêu cầu khai báo nội dung AI; art AI thuần khó được bảo hộ bản quyền.                | Trang store kém hấp dẫn, rủi ro pháp lý tài sản.           |
| RISK-7 | Hai playtest hiện có là persona AI, chưa có người chơi thật đo completion/learning.                                                                                                                               | Quyết định thiết kế dựa trên giả định.                     |

## 3. Công nghệ

### 3.1. Làm tốt — không thay

- npm + Nx monorepo, ranh giới package rõ: `game-core`, `learning-engine` TS thuần; content JSON + Zod validate khi build; Condition/Effect là discriminated union; save có migration v1→v3.
- Phaser cho world + React cho UI: đúng cho game nặng chữ (chữ DOM sắc, focus/Tab, dễ localization). **Không cần chuyển Unity/Godot.**
- Test dày; `assets/PROVENANCE.md` ghi nguồn từng asset (nhạc CC0, Kokoro-82M, ImageGen, art sinh bằng code) — tài sản giá trị khi thương mại hóa.
- Persistence đã tách repository (`saveRepository`, `learningRepository`, `settingsRepository`) → thay adapter khi lên desktop.
- `apps/game-web/src/commerce/commerceConfig.ts` đã có khung `free | commercial`.

### 3.2. Cần lưu ý

| Mã     | Vấn đề                                                                                         | Đề xuất                                                                                       |
| ------ | ---------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| TECH-1 | JS một chunk ~1,96 MB.                                                                         | Không gấp cho desktop. Khi làm demo web: tách Phaser, lazy-load overlay (notebook/board/summary). |
| TECH-2 | Backend .NET mới có health check.                                                              | Đúng hướng local-first. Chỉ phát triển khi có B2B/tài khoản web; Steam Cloud thay cloud save cho bản desktop. |
| TECH-3 | Repo trên Windows: ~409 file báo modified chỉ do line ending/mode.                             | Thêm `.gitattributes` chuẩn hóa EOL (việc nhỏ, cần người dùng duyệt).                          |
| TECH-4 | Chưa có gamepad.                                                                               | Cần cho Steam Deck Verified; làm ở giai đoạn desktop.                                          |
| TECH-5 | Quy trình agent nặng (memory/report rất dài cho từng thay đổi UI).                             | Giữ verification, nhưng tỷ lệ chi phí quy trình nên tương xứng giá trị thay đổi.               |

## 4. Desktop và Steam

- **Khuyến nghị: Electron + steamworks.js.** Electron chạy Chromium, trùng môi trường E2E hiện tại (Chromium) → tái dùng bộ test. Dung lượng ~120 MB không đáng kể trên Steam.
- Tauri nhẹ hơn nhưng WebView khác nhau theo OS (macOS/Linux/Steam Deck không phải Chromium), Steam overlay cần plugin riêng → ma trận test lớn hơn. Phaser có template Tauri chính thức nếu sau này cần.
- Việc cần cho bản Steam: adapter save ra file + Steam Cloud, achievements, gamepad, UI hint đa ngôn ngữ mẹ đẻ (không chỉ tiếng Việt), màn hình tiêu đề/menu (xem spec intro), khai báo AI content.
- Chi phí: Steam Direct 100 USD/game, Steam giữ 30% doanh thu.
- Nếu hướng livestream: nhạc CC0 an toàn DMCA; có thể thêm chế độ chat bình chọn nghi phạm (sau MVP).

## 5. Thương mại hóa

| Mô hình                                              | Mức phù hợp       | Ghi chú                                                                                  |
| ---------------------------------------------------- | ----------------- | ---------------------------------------------------------------------------------------- |
| Premium Steam (Case 1 làm demo, bản đầy đủ 5–8 case) | Cao               | Khớp guardrail. Mở trang Steam sớm để gom wishlist.                                      |
| Web miễn phí Case 1 + bán gói case                   | Trung bình        | Dùng `commerceConfig`. VN: SePay/VietQR; quốc tế: Paddle (merchant of record).           |
| B2B trường/trung tâm tiếng Anh                       | Cao (thị trường VN) | Cần backend + dashboard giáo viên; có thể đi qua hệ sinh thái giáo dục của FPT.         |
| Ads / energy / IAP thời gian                         | Không             | Trái guardrail docs/01 và `AGENTS.md` §6.                                                |

## 6. Backlog định hướng (theo thứ tự ưu tiên)

Mỗi mục là một gói riêng, cần người dùng chọn và duyệt spec/plan. Cột "Tín hiệu xong" là tiêu chí để biết gói có giá trị, không phải DoD kỹ thuật (DoD theo `AGENTS.md` §7).

| Mã    | Gói                                                                                                       | Liên quan           | Tín hiệu xong                                                                                     | Trạng thái                                                              |
| ----- | --------------------------------------------------------------------------------------------------------- | ------------------- | ------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| PR-01 | Intro + onboarding Case #001 (màn hình tiêu đề, briefing, gợi ý theo ngữ cảnh, "Cách điều tra")          | Playtest P2, RISK-7 | Người chơi mới biết việc đầu tiên cần làm trong < 1 phút, không cần đọc tài liệu ngoài.           | Đã triển khai trên dev (chưa full E2E): `docs/ai/2026-10-02-intro-onboarding-verification.md` |
| PR-02 | Tạm dừng polish notebook/board; xử lý minor đã ghi chỉ khi ảnh hưởng người chơi thật                      | RISK-5              | Không mở thêm vòng UI notebook/board trước PR-03.                                                 | Người dùng chọn làm lại toàn bộ UI (02/10/2026); phần 1+2 theo spec `2026-10-02-ui-foundation-hud-design.md` đã duyệt; phần 3 (vỏ ngoài game) theo spec `2026-10-02-ui-shell-design.md` đã triển khai và duyệt ảnh trước/sau (03/10/2026) |
| PR-03 | Case #002 chỉ bằng content (không sửa engine nếu được), ghi lại mọi chỗ engine buộc phải đổi            | RISK-2, RISK-3      | Case #002 chơi hết được; danh sách thay đổi engine là bằng chứng về tính tổng quát.              | Đã làm (chờ duyệt push): Case #002 chơi hết được, 2 lỗi engine bắt được và sửa (F-6, F-7); báo cáo `docs/ai/2026-10-02-case-002-engine-generality.md` |
| PR-04 | Công cụ soạn case (tối thiểu: bảng tính/YAML → JSON + validator hiện có, báo lỗi tham chiếu dễ đọc)     | RISK-4              | Soạn một dialogue tree mới không cần sửa JSON tay.                                                | Đề xuất                                                                 |
| PR-05 | Playtest 10–20 người thật A2–B2: completion rate, thời gian, từ vựng trước/sau                          | RISK-1, RISK-7      | Có số liệu để chốt người mua chính và độ khó.                                                     | Đề xuất                                                                 |
| PR-06 | Art pass cho hai scene chính và nhân vật (họa sĩ hoặc chỉnh tay), cập nhật provenance                     | RISK-6              | Bộ screenshot đủ chất lượng cho trang store.                                                      | Đề xuất                                                                 |
| PR-07 | Demo web công khai (itch.io) + tối ưu tải (TECH-1)                                                        | RISK-1              | Người lạ chơi được Case #001 trên web; có kênh thu feedback.                                     | Đề xuất                                                                 |
| PR-08 | Bản desktop: Electron + Steamworks, save file/Steam Cloud, gamepad, achievements                           | §4, TECH-4          | Build chạy trên Steam (branch test), save đồng bộ.                                                | Đề xuất                                                                 |
| PR-09 | Mở rộng 5–8 case + localization UI hint                                                                   | RISK-2              | Đủ thời lượng cho bản premium.                                                                    | Đề xuất                                                                 |
| PR-10 | Track B2B: backend .NET (tài khoản, lớp học, tiến độ), dashboard giáo viên                               | §5, TECH-2          | Một lớp học thử dùng được.                                                                        | Đề xuất                                                                 |

## 7. Nguyên tắc khi agent đề xuất thay đổi

1. Hỏi: thay đổi này giúp **người chơi thật** hay **khả năng bán** như thế nào? Nếu chỉ tăng độ hoàn thiện của một màn hình đã dùng được, ưu tiên thấp.
2. Ưu tiên việc làm engine dùng chung được cho case sau (content-driven), tránh giải pháp chỉ cho Case #001.
3. Giữ guardrail docs/01 và `AGENTS.md` §6; không đề xuất mô hình kiếm tiền phá guardrail.
4. Asset mới phải có dòng provenance và điều khoản cho phép dùng thương mại.
5. Chi phí verification tương xứng rủi ro: thay đổi copy/CSS nhỏ không cần cùng mức báo cáo như thay đổi engine/save.

## 8. Nguồn tham khảo bên ngoài

- Phí Steam: <https://unanswered.io/guide/steam-fees-and-commissions>, <https://www.steampageanalyzer.com/blog/steam-revenue-share-explained>
- Phaser + Tauri template: <https://github.com/phaserjs/template-tauri>
- Steam overlay cho Tauri: <https://github.com/qwook/tauri-plugin-steam-overlay>, <https://lib.rs/crates/tauri-plugin-steamworks>
