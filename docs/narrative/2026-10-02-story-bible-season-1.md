# The Lexicon Files — Story Bible, Mùa 1: "The Ghostwriter"

Ngày: 02/10/2026. Trạng thái: **đề xuất** (chưa duyệt). Tài liệu advisory, không thay thế `01_GAME_DESIGN_DOCUMENT.md` hay spec từng case.

Nguồn đã đọc: `docs/01_GAME_DESIGN_DOCUMENT.md`, `docs/02_ENGLISH_LEARNING_SYSTEM_DESIGN.md` (§3 CEFR), `docs/03_CASE_001_VERTICAL_SLICE_SPEC.md`, `docs/superpowers/specs/2026-10-02-case-002-design.md`, content `case-001`/`case-002`, `docs/product/...product-review-and-direction.md` (PR-09: 5–8 case).

---

## 1. Ý tưởng xuyên suốt

> Mỗi case là một vụ án độc lập, giải trọn trong 20–40 phút.
> Nhưng từ Case #003, người chơi nhận ra nhiều vụ có chung một "giọng văn": ai đó đứng sau, viết chỉ thị cho những người thực hiện, và để lại **dấu vân tay ngôn ngữ** trong cách viết.

Mạch chính của mùa 1 là truy tìm **The Ghostwriter** — người bên trong IIB bán tài liệu mật của khách hàng cho đối thủ **Calder Group**. Không ai thấy mặt hắn; chỉ có những tin nhắn, ghi chú, email không ký tên.

Vì sao hợp với Golden Rule của GDD (§30): cơ chế "dấu vân tay ngôn ngữ" **chính là** kỹ năng tiếng Anh. Người chơi chỉ bắt được Ghostwriter nếu nhận ra khác biệt tinh tế: `while`/`whilst`, `4:30 PM`/`1630 hrs`, `04/03`/`04.03`, cách kết thư, thói quen gõ phím. Hiểu tiếng Anh tốt hơn → điều tra tốt hơn, ở cấp độ cả mùa chứ không chỉ một case.

### 1.1. Dấu vân tay của Ghostwriter (bí mật, chỉ trong data)

| # | Dấu hiệu | Ví dụ | Xuất hiện lần đầu |
|---|----------|-------|-------------------|
| F1 | Dùng `whilst` thay `while` | "Collect it whilst the lounge is empty." | Case #003 |
| F2 | Giờ kiểu quân đội/bảo vệ: `1415 hrs` | "Room 3 is free at 1415 hrs." | Case #003 |
| F3 | Kết thư `Kind regards,` và **không ký tên** | — | Case #004 |
| F4 | Ngày dùng dấu chấm: `04.03` | "Deadline: 12.05." | Case #005 |
| F5 | Hai dấu cách sau dấu chấm câu (thói quen gõ máy cũ) | hiện trong bản text thô/raw view | Case #006 |

Quy tắc thiết kế: dấu vân tay **không gắn với quốc tịch, giọng hay vùng miền** (tránh stereotype). Đó là thói quen cá nhân của một người làm nghề bảo vệ lâu năm.

### 1.2. Sự thật của mùa (không hiển thị)

**Victor Hale — Head of Security của IIB** là Ghostwriter. Hắn kiểm soát access log, key card và camera, nên biết lúc nào phòng nào trống. Hắn không tự tay lấy gì: hắn tìm người đang có điểm yếu (nợ, sợ mất việc, bị ép deadline) và gửi chỉ thị ngắn gọn cho họ.

Vì sao người chơi không nghi ngờ sớm: từ Case #001, mọi security log đều do Victor cung cấp và đều **đúng**. Người chơi quen tin log. Case #008 phá vỡ niềm tin đó.

---

## 2. Thế giới và giọng kể

- **IIB (International Investigation Bureau)**: văn phòng ở một thành phố quốc tế không nêu tên, mưa nhiều, ánh đèn vàng, giấy tờ ngổn ngang.
- **Tone**: noir nhẹ, ấm áp, không bạo lực. Không có án mạng trong mùa 1. Thủ phạm là người bình thường làm điều sai vì áp lực; kết luận luôn cho họ một câu giải thích có tính người.
- **Rủi ro chỉ là tài liệu, tiền, niềm tin, công việc** — phù hợp 15+ và tinh thần GDD §6.1 (gian lận, nội gián, tranh chấp, mất tài sản).
- **Luật kể chuyện**: mọi mạch truyện phải được người chơi tự đọc/nghe ra từ evidence; không dùng cutscene dài để "kể hộ".

---

## 3. Dàn nhân vật cố định

| Nhân vật | Vai trò | Chức năng kể chuyện | Chức năng gameplay |
|----------|---------|---------------------|---------------------|
| **Người chơi** | Junior Investigator → Special Agent | Người mới, không có tên/giới tính cố định | — |
| **Director Helena Marsh** | "Chief" trong briefing của Case #001 | Nghiêm, công bằng, ít lời. Là người giao case | Viết briefing memo đầu mỗi case |
| **Samuel "Sam" Okafor** | Senior Investigator, người hướng dẫn | Ấm áp, hay đùa, viết ghi chú ngắn ký "— S." | Hint system diegetic: ghi chú dán trong notebook |
| **Mira Lindqvist** | Kỹ thuật viên Language Lab | Mê ngôn ngữ, nói nhanh, cực kỳ để ý chi tiết | Replay audio, transcript; từ Case #005 mở bảng **Writing Profile** |
| **Victor Hale** | Head of Security | Lịch sự, chính xác, luôn có mặt "đúng lúc" | Cung cấp access log/key-card log ở hầu hết case |
| **Anna, Leo, David** | Ê-kíp văn phòng (Case #001–#002) | Sau hai case, họ trở thành nhân chứng quen thuộc, mỗi người một tính cách | Cameo, cung cấp thông tin phụ |

Cách viết lời cho Sam (quan trọng cho Case #007): Sam luôn viết `while`, `4:30 PM`, ngày `4 March`, ký `— S.`, một dấu cách sau dấu chấm. Ghi chú hint của Sam từ Case #001 trở thành **mẫu chữ thật** để so sánh ở Case #007 — người chơi đã thấy chúng suốt cả mùa mà không biết.

Cách viết lời cho Victor: các báo cáo chính thức của Victor dùng định dạng log `20:32` (chuẩn hệ thống), nhưng ghi chú tay/tin nhắn cá nhân của hắn lộ F1–F5. Chỉ xuất hiện ở Case #007–#008.

---

## 4. Lộ trình mùa 1

| Case | Tên | CEFR | Rank khi chơi | Trọng tâm ngôn ngữ = công cụ điều tra | Mạch chính |
|------|-----|------|---------------|---------------------------------------|------------|
| #001 | The Missing Report *(đã có)* | A2–B1 | Junior | before/after, giờ, past simple | Hook nhẹ (tuỳ chọn) |
| #002 | The Wrong Delivery *(đã có)* | A2–B1 | Junior | địa chỉ, số, sign/label/deliver | Hook nhẹ (tuỳ chọn) |
| #003 | The Fourth of March | A2–B1 | Investigator | ngày tháng, DD/MM vs MM/DD, giới từ nơi chốn | F1, F2 lần đầu |
| #004 | Fifteen or Fifty | B1 | Investigator | nghe: trọng âm số, can/can't, I'll/I'd | F3; "có người chỉ đạo" |
| #005 | Shall Not | B1–B2 | Senior | modal trong hợp đồng: shall/may/must, unless | F4; mở Writing Profile |
| #006 | Hearsay | B2 | Senior | reported speech, động từ tường thuật | F5; "kẻ đứng sau ở trong IIB" |
| #007 | Regrettably | B2–C1 | Lead Detective | email trang trọng, nghĩa hàm ý, câu điều kiện | Sam bị gài; loại trừ Sam |
| #008 | The Ghostwriter | C1 | Lead → Special Agent | văn bản pháp lý, hedging, so sánh văn phong | Lộ diện Victor |

Độ khó hai chiều theo GDD §23: Case #004 ngôn ngữ B1 nhưng điều tra dễ (một mâu thuẫn chính, mạnh về listening); Case #006 ngôn ngữ B2 nhưng điều tra vừa. Không case nào vừa khó ngôn ngữ vừa khó suy luận trừ #008.

Thứ tự: theo GDD không khoá tuần tự (spec Case #002 §12). Đề xuất: case lẻ mở tự do; riêng #007 và #008 cần đã đóng ít nhất 4 case trước vì chúng dựa vào Writing Profile. Đây là thay đổi sản phẩm, cần duyệt riêng.

---

## 5. Hook tuỳ chọn cho Case #001 và #002 (không đổi sự thật)

Hai case đầu giữ nguyên truth và động cơ đã viết trong content:

- #001: David lấy báo cáo vì phát hiện lỗi mình bỏ sót và hoảng ("I found an error I had missed and panicked").
- #002: Leo đổi nhãn 14 → 41 để câu giờ cho phần mẫu chưa xong.

Đề xuất thêm **một dòng epilogue** cho mỗi case, sau Case Closed, chỉ để gieo hạt. Không cần evidence, condition hay contradiction mới:

- **#001 epilogue — ghi chú của Sam:** "Funny thing. David says the numbers in section 3 were wrong — but he's sure he typed them correctly. Probably nothing. — S."
  → Sau này (Case #008) người chơi biết số liệu bị sửa trước khi David cầm báo cáo; Ghostwriter đã có bản sao.
- **#002 epilogue — biên nhận trả hàng:** "Returned to sender from 41 Bridge Street. Package opened. Tenant: Calder Consulting (short-term lease)."
  → Leo nói dối vì lý do của riêng anh, nhưng có kẻ đã tận dụng sai sót đó.

---

## 6. Case #003 — The Fourth of March

**CEFR** A2–B1 · **tier** easy · **~25 phút** · 3 scene · 6 evidence · 2 mâu thuẫn

### Premise

Khách hàng của IIB, bà **Eleanor Grant**, đến thành phố để đàm phán. Ngày 4 tháng 3, laptop chứa ghi chú đàm phán của bà biến mất khỏi phòng họp riêng ở **Hotel Arden** trong lúc bà đi ăn trưa (13:30–14:45).

### Nghi phạm

| Người | Vai trò | Lời khai | Thật/giả |
|-------|---------|----------|----------|
| **Priya Nair** | Trợ lý của bà Grant | "I was near the meeting room, but I didn't go in. I waited in the lobby." | Thật (red herring: bị thấy "near") |
| **Tom Becker** | Lễ tân khách sạn | "I wasn't even working that day. Check the staff rota — I was off on 03/04." | **Giả** |
| **Sofia Reyes** | Phiên dịch viên | "I was in the café opposite the hotel. I have the receipt." | Thật |

**Sự thật:** Tom lấy laptop. Một tin nhắn nặc danh trả 800 bảng cho anh nếu đặt laptop vào tủ gửi đồ số 12 ở ga tàu.

### Timeline lõi

```text
13:30 Mrs Grant leaves Meeting Room 3 for lunch
13:42 Priya waits in the lobby, next to the meeting room corridor
13:55 Sofia buys coffee at Café Lumen, opposite the hotel
14:12 Key card "RECEPTION-02" (Tom) opens Meeting Room 3
14:16 Meeting Room 3 closes
14:45 Mrs Grant returns; laptop is missing
```

### Evidence

| Id | Loại | Nội dung chính |
|----|------|----------------|
| `staff_rota` | document | Bảng phân ca: "Tom Becker — OFF: 03/04". Cùng trang có "Check-in audit: 15/03", "Inventory: 28/02" |
| `key_card_log` | digital | `04/03 14:12 RECEPTION-02 OPEN Meeting Room 3` (do bộ phận an ninh khách sạn cung cấp) |
| `cafe_receipt` | document | Café Lumen, 04/03, 13:55, Flat white |
| `lobby_statement` | statement | Nhân viên dọn phòng: "The young woman was **next to** the corridor, not **in** it." |
| `locker_ticket` | object | Vé tủ gửi đồ số 12, ga trung tâm, 04/03 15:02 |
| `anonymous_message` | digital | Trên điện thoại Tom: "Room 3 is free at 1415 hrs. Collect it whilst the lounge is empty. Locker 12." |

### Mâu thuẫn

1. **Ngày nghỉ:** Tom nói anh nghỉ ngày 4/3 vì rota ghi `03/04`. Nhưng rota dùng DD/MM (vì có `15/03` và `28/02` — không có tháng 15 hay 28), nên `03/04` là **3 tháng 4**. Tom làm việc ngày 4/3.
2. **Key card:** Tom nói "I didn't go upstairs that day", nhưng key card của quầy lễ tân mở phòng lúc 14:12.

### Vì sao tiếng Anh giúp phá án

- Người chơi phải hiểu hai cách viết ngày (UK `DD/MM`, US `MM/DD`) và tự suy luận định dạng từ ngữ cảnh.
- Phân biệt `near / next to / in / opposite` để loại trừ Priya và Sofia.
- Ordinal: "the fourth of March", "the third of April".

### Từ vựng mục tiêu

`rota`, `shift`, `off (work)`, `key card`, `opposite`, `next to`, `corridor`, `lobby`, `locker`, `collect`

### Hook mạch chính

Tin nhắn nặc danh dùng **`whilst`** và **`1415 hrs`** (F1, F2). Tom: "I don't know who sent it. The number doesn't exist anymore." Sam ghi chú: "Who writes 'hrs' in a text message? — S."

---

## 7. Case #004 — Fifteen or Fifty

**CEFR** B1 · **tier** easy (điều tra) / medium (nghe) · **~25 phút** · 3 scene · 6 evidence · 1 mâu thuẫn chính + 1 phụ · **listening-heavy**

### Premise

Tại hội chợ công nghệ, mẫu thử (prototype) của một khách hàng IIB biến mất khỏi tủ kính có khoá số ở gian hàng B12, trong khoảng 12:00–13:00.

### Nghi phạm

| Người | Vai trò | Lời khai | Thật/giả |
|-------|---------|----------|----------|
| **Hannah Cho** | Nhân viên gian hàng | "I told my manager I'd be gone for **fifty** minutes. I was having lunch." | **Giả** |
| **Marco Bellini** | Đại diện bán hàng | "I **can** open the case, yes. But I didn't." | Thật (red herring: biết mã khoá) |
| **Raj Patel** | Bảo vệ hợp đồng | "I walked past B12 at twelve thirty. Nobody was there." | Thật nhưng thiếu chi tiết |

**Sự thật:** Hannah lấy prototype. Cô nhận một ghi chú in sẵn kèm mã khoá — cô không cần Marco.

### Timeline lõi

```text
12:00 Hannah leaves voicemail for her manager
12:05 Hannah leaves booth B12
12:20 Badge scan: Hannah enters Hall B (side door)
12:22 Display case opened (code entered)
12:30 Raj walks past B12; booth is empty
12:55 Hannah returns "from lunch"
13:00 Manager notices the prototype is missing
```

### Evidence

| Id | Loại | Nội dung chính |
|----|------|----------------|
| `manager_voicemail` | audio | Hannah: "Hi, it's Hannah. I'll be back at the booth in **fifteen** minutes." |
| `hall_badge_log` | digital | `12:20 H. CHO ENTRY Hall B side door` |
| `case_lock_log` | digital | `12:22 CODE OK` — không ghi ai |
| `marco_voicemail` | audio | Marco: "I **can't** get to the booth before one, sorry." (weak form) |
| `lunch_receipt` | document | Food court, 12:58 — trả tiền **sau** khi đã quay lại khu hội chợ |
| `printed_note` | document | "Code: 4471. Hall B side door is quiet at 1215 hrs. Kind regards," |

### Mâu thuẫn

1. **Fifteen vs fifty:** Hannah khẳng định đã nói "fifty". Voicemail nói "fif**TEEN**" (trọng âm cuối, âm /t/ rõ). Bằng chứng phụ: badge scan 12:20 — 15 phút sau khi rời gian hàng.
2. **(phụ) Bữa trưa:** Hannah nói ăn trưa từ 12:05, nhưng biên nhận ăn trưa lúc 12:58.

### Vì sao tiếng Anh giúp phá án

- **Listening có hệ quả:** người chơi replay ở tốc độ chậm và phân biệt `fifteen /fɪfˈtiːn/` vs `fifty /ˈfɪfti/`; `can /kən/` vs `can't /kɑːnt/`.
- Hiểu sai `can't` của Marco → nghi Marco sai người.
- Phù hợp Listening Task hiện có của engine (Case #001 đã có).

### Từ vựng mục tiêu

`prototype`, `booth`, `display case`, `badge`, `voicemail`, `side door`, `be back`, `get to`, `notice`, `code`

### Hook mạch chính

Ghi chú in sẵn: `1215 hrs` (F2) và **`Kind regards,` không ký tên** (F3). Mira (Language Lab) nhận xét: "Same habit as the text message in the Grant case. Two cases, one writer." → Director lập hồ sơ mật tên **"The Lexicon File"**.

---

## 8. Case #005 — Shall Not

**CEFR** B1–B2 · **tier** medium · **~30 phút** · 3 scene · 7 evidence · 2 mâu thuẫn

### Premise

Công ty khách hàng của IIB bị nhà cung cấp kiện vì "vi phạm hợp đồng". Bản hợp đồng lưu tại văn phòng luật có điều khoản 7 khác với bản khách hàng giữ:

- Bản khách hàng: "The Supplier **shall not** terminate this agreement **unless** payment is more than 30 days late."
- Bản văn phòng luật: "The Supplier **may** terminate this agreement **if** payment is late."

Một trang đã bị tráo.

### Nghi phạm

| Người | Vai trò | Lời khai | Thật/giả |
|-------|---------|----------|----------|
| **Grace Whitfield** | Luật sư | "Every page was checked and initialled on the day of signing." | Thật |
| **Ivan Petrov** | Chủ nhà cung cấp | "I never touched the original. I only read a copy." | **Giả** |
| **Ben Adams** | Thư ký pháp lý | "I scanned the contract. All twelve pages." | Thật |

**Sự thật:** Ivan tráo trang 4 khi được để một mình trong phòng họp 6 phút để "đọc lại hợp đồng". Trang giả được soạn sẵn và gửi cho anh ta.

### Evidence

| Id | Loại | Nội dung chính |
|----|------|----------------|
| `law_office_contract` | document | Trang 4 ghi "Page 4 of **11**"; các trang khác "of 12". Không có chữ ký tắt (initials) ở góc |
| `client_contract` | document | Bản gốc của khách hàng, điều 7 với `shall not ... unless` |
| `scan_log` | digital | Ben scan 12 trang lúc 10:05, trước buổi gặp Ivan |
| `scanned_copy` | document | Bản scan có điều 7 giống bản khách hàng |
| `visitor_log` | digital | `11:40–11:46 I. Petrov, Meeting Room B, unaccompanied` |
| `grace_email` | digital | "Please initial every page." |
| `draft_page` | document | Tìm thấy trong cặp Ivan (khi khám xét hợp pháp): ghi chú bên lề "Replace p.4 whilst alone. Deadline 12.05." |

### Mâu thuẫn

1. Ivan: "I never touched the original" ↔ visitor log: một mình với bản gốc 6 phút.
2. Bản scan lúc 10:05 (trước khi Ivan đến) có điều 7 `shall not ... unless` ↔ bản gốc hiện tại ghi `may ... if` → trang bị thay sau 10:05.

### Vì sao tiếng Anh giúp phá án

- **Modal pháp lý:** `shall` (bắt buộc), `shall not` (cấm), `may` (được phép), `must`; `unless` vs `if`. Hiểu sai modal = hiểu sai ai vi phạm.
- Đọc chi tiết nhỏ: "Page 4 of 11", "initial (v.)".

### Từ vựng mục tiêu

`agreement`, `terminate`, `clause`, `unless`, `shall`, `may`, `initial (v.)`, `breach`, `supplier`, `unaccompanied`

### Hook mạch chính và cơ chế mới

Ghi chú `whilst` (F1) và ngày `12.05` (F4). Mira mở **Writing Profile** trong Notebook: bảng so sánh mẫu chữ, nơi người chơi gắn "đặc điểm" (feature) cho từng mẫu. Đã có 4 mẫu từ #003–#005 cùng một người viết.

---

## 9. Case #006 — Hearsay

**CEFR** B2 · **tier** medium · **~30 phút** · 3 scene · 7 evidence · 2 mâu thuẫn

### Premise

Quyết định mật của hội đồng quản trị khách hàng (đóng cửa nhà máy ở Lisbon) bị lộ cho báo chí trước khi công bố. Bốn người kể lại "ai nói gì với ai". Người chơi phải dựng lại **chuỗi tin đồn** để tìm người đầu tiên biết.

### Nghi phạm

| Người | Vai trò | Lời khai |
|-------|---------|----------|
| **Nadia Fischer** | Trợ lý giám đốc | "Greg **told me** the board **had decided** to close Lisbon. I only repeated it." |
| **Greg Lawson** | Thành viên hội đồng | "I **didn't** tell anyone. Nadia **claimed** she'd heard it from me, but that's not true." |
| **Elliot Shaw** | Nhà báo | "My source **said** she **was** in the room when the vote happened." |

**Sự thật:** Nadia là nguồn. Cô ở trong phòng ghi biên bản cuộc bỏ phiếu và bán thông tin. Cô đổ cho Greg.

### Evidence chính

| Id | Loại | Nội dung chính |
|----|------|----------------|
| `board_minutes` | document | "Minutes taken by N. Fischer." Bỏ phiếu lúc 16:10 |
| `journalist_notes` | document | Ghi chép của Elliot, reported speech: "Source said she had taken the minutes herself." |
| `greg_calendar` | digital | Greg rời cuộc họp lúc 15:50 (trước khi bỏ phiếu) |
| `nadia_messages` | digital | Tin nhắn từ số lạ: "Send the result whilst the board is still in session.  Kind regards," (hai dấu cách — F5, chỉ thấy ở **raw view**) |
| `press_email` | digital | Email Elliot nhận tin lúc 16:18 |

### Mâu thuẫn

1. Nadia: "Greg told me" ↔ Greg rời phòng 15:50, việc bỏ phiếu xảy ra 16:10 → Greg không thể biết kết quả.
2. Nguồn của nhà báo "had taken the minutes herself" ↔ biên bản ghi người lập là Nadia.

### Vì sao tiếng Anh giúp phá án

- **Reported speech và lùi thì**: "She said she **was** in the room" (lúc đó) vs "she **had been**" (trước đó).
- **Động từ tường thuật mang thái độ**: `claimed`, `admitted`, `denied`, `suggested`, `insisted` — chọn đúng động từ khi điền vào notebook quyết định độ tin cậy của lời khai.
- Mechanic gợi ý: timeline có thêm cột "First-hand / Second-hand".

### Từ vựng mục tiêu

`board`, `vote`, `minutes`, `source`, `leak`, `claim`, `deny`, `admit`, `in session`, `on the record`

### Hook mạch chính (điểm giữa mùa)

Số điện thoại gửi tin cho Nadia là số đã dùng trong Case #003. Quan trọng hơn: tin nhắn đến lúc 09:02 sáng hôm đó — **trước** khi IIB nhận vụ này, nhưng nhắc đúng tên phòng họp IIB đã đề xuất cho khách hàng. → **Ghostwriter có quyền truy cập hồ sơ nội bộ IIB.** Director đóng băng hồ sơ: chỉ người chơi, Sam và Mira được làm "The Lexicon File".

---

## 10. Case #007 — Regrettably

**CEFR** B2–C1 · **tier** hard (ngôn ngữ) / medium (điều tra) · **~35 phút** · 3 scene · 8 evidence · 2 mâu thuẫn

### Premise

Một loạt email từ tài khoản của **Sam Okafor** gửi tài liệu vụ #006 cho Calder Group. Sam bị đình chỉ. Director giao vụ cho người chơi — điều tra chính người hướng dẫn của mình.

Email của Director mở đầu:

> "Regrettably, the evidence suggests that Sam may have been involved. I would rather be wrong. Prove me wrong — or prove me right."

### Nghi phạm

| Người | Vai trò | Lời khai |
|-------|---------|----------|
| **Sam Okafor** | Senior Investigator | "I didn't send them. I was at home. I wouldn't even know how to attach a file that big." |
| **Clara Moss** | IT administrator | "Sam's password was reset last week. Anyone could have asked for it — but only security can approve a reset." |
| **Victor Hale** | Head of Security | "The login came from a terminal on the third floor at 0214 hrs. That's Sam's floor." |

**Sự thật của case:** Sam vô tội. Email được gửi từ terminal trong **phòng an ninh** (tầng 3), không phải bàn của Sam. Kết luận đúng của case là **loại trừ Sam** và xác định "người có quyền duyệt reset mật khẩu". Case khép lại với Victor là người vẫn ngồi trong phòng, chưa bị buộc tội.

### Evidence chính

| Id | Loại | Nội dung chính |
|----|------|----------------|
| `leaked_emails` | digital | Từ tài khoản Sam: "Attached whilst the office is closed. Kind regards," — gửi 02:14 |
| `sam_notes` | document | Các ghi chú hint của Sam từ đầu mùa: `while`, `4:30 PM`, ký `— S.` |
| `sam_badge` | digital | Sam ra khỏi toà nhà 18:40, không vào lại |
| `terminal_log` | digital | Login từ `T3-SEC-01` (tên terminal — người chơi phải đọc sơ đồ tầng để biết là phòng an ninh) |
| `reset_request` | digital | "Password reset approved by: Security (V.H.)" |
| `polite_threat` | digital | Email gửi Clara: "It would be regrettable if your contract were not renewed next month. I am sure you understand." |

### Mâu thuẫn

1. Email gửi từ tầng 3 lúc 02:14 ↔ Sam ra khỏi toà nhà 18:40 và không vào lại.
2. Văn phong email bị lộ (F1, F3) ↔ văn phong thật của Sam (mẫu đã thu thập cả mùa). Người chơi chứng minh bằng Writing Profile.

### Vì sao tiếng Anh giúp phá án

- **Nghĩa hàm ý, lời đe doạ lịch sự**: "It would be regrettable if..." = đe doạ; "I am sure you understand" = áp lực. Người chơi phải "dịch" lời lịch sự thành ý thật để hiểu vì sao Clara im lặng.
- **Câu điều kiện loại 2** (were not renewed), `would rather`, `may have been` (suy đoán quá khứ).

### Từ vựng mục tiêu

`regrettably`, `suspend`, `renew`, `approve`, `attach`, `involved`, `imply`, `terminal`, `reset`, `would rather`

### Hook mạch chính

Clara cuối cùng nói: "I can't say who wrote that email. But I can tell you who always writes 'hrs'." Sam được phục hồi. Người chơi lên **Lead Detective**.

---

## 11. Case #008 — The Ghostwriter (finale)

**CEFR** C1 · **tier** hard · **~40 phút** · 4 scene · 9 evidence · 3 mâu thuẫn

### Premise

Director cho phép điều tra nội bộ chính thức. Ba người có quyền truy cập cả hồ sơ IIB lẫn hệ thống an ninh:

| Người | Vai trò | Lời khai |
|-------|---------|----------|
| **Victor Hale** | Head of Security | "I may have stayed late that night, but I wouldn't say I was working. I left at six, as the log shows." |
| **Clara Moss** | IT administrator | Đã hợp tác ở #007, nhưng có quyền sửa log |
| **Daniel Price** | Phó giám đốc | Biết mọi case, từng bất đồng công khai với Director |

**Sự thật:** Victor.

### Evidence chính

| Id | Loại | Nội dung chính |
|----|------|----------------|
| `official_access_log` | digital | `18:02 V. HALE EXIT` — không có entry sau đó |
| `backup_tape_log` | digital | Bản lưu dự phòng (Mira phục hồi) có thêm `21:40 V. HALE ENTRY` → log chính đã bị **sửa** |
| `vending_receipt` | document | Máy bán hàng tầng 3, 21:44 |
| `victor_handwritten_note` | document | Ghi chú cá nhân trong ngăn bàn: "Audit runs till 2300 hrs. Stay whilst it finishes." |
| `risk_report_draft` | digital | Từ #001: lịch sử chỉnh sửa cho thấy section 3 bị sửa từ terminal `T3-SEC-01` hai ngày trước cuộc họp |
| `calder_payments` | document | Bảng chuyển khoản của Calder Group cho "VH Consulting" |
| `writing_samples` | — | Toàn bộ mẫu đã thu thập từ #003–#007 trong Writing Profile |

### Ba mâu thuẫn

1. Victor nói rời đi 18:02 ↔ backup log + biên nhận máy bán hàng 21:44.
2. Log chính thiếu entry 21:40 ↔ backup log có → log chính đã bị sửa, và chỉ Security có quyền sửa log.
3. **Văn phong**: ghi chú tay của Victor có đủ F1–F5 ↔ các tin nhắn chỉ đạo trong #003–#007.

### Kết luận đặc biệt

Thay vì chỉ chọn nghi phạm, người chơi **dựng câu kết luận** bằng word-order reconstruction (GDD §17): ghép mảnh câu thành báo cáo cuối, ví dụ:

> "Victor Hale **edited** the access log **to hide** his return at 21:40, **and** his writing **matches** every anonymous instruction since the Grant case."

Ghép sai không bị phạt; game phản hồi theo mẫu "This interpretation doesn't match the evidence."

### Vì sao tiếng Anh giúp phá án

- **Hedging**: "I may have stayed late, but I wouldn't say I was working" — Victor không nói dối trực tiếp; người chơi phải nhận ra đó là né tránh.
- So sánh văn phong ở cấp C1: lựa chọn từ, định dạng, thói quen gõ phím.
- Văn bản pháp lý/kiểm toán: `audit`, `tamper`, `retain`, `authorise`.

### Kết thúc mùa

- Victor thừa nhận, giải thích bằng giọng bình tĩnh: hắn bị Calder trả tiền suốt hai năm, chọn những người đang gặp khó khăn vì "people under pressure don't ask questions".
- Người chơi được thăng **Special Agent**. Director chính thức lập đơn vị **The Lexicon Files** (giải thích tên game).
- Sam viết ghi chú cuối, lần đầu ký đầy đủ tên: "Every word is a clue. You proved it. — Samuel."

### Hook mùa 2

Trong bảng chuyển khoản Calder có một email nội bộ từ văn phòng Singapore, kết thúc bằng `Kind regards,` không ký tên — nhưng **không có** `whilst`. Victor: "I learned to write like that from someone. You'll never find them."

---

## 12. Side case ngắn (A1–A2, 10–15 phút)

Dành cho người mới hoàn toàn, chơi trong hub IIB, dùng lại scene và nhân vật có sẵn (rẻ để sản xuất). Không gắn mạch chính.

| Case | Premise | Ngôn ngữ = công cụ | Sự thật |
|------|---------|--------------------|---------|
| **S1 — The Sticky Note** (A1) | Ai đó ăn bánh sinh nhật của Mira trong tủ lạnh, để lại giấy "Sorry! I owe you one." | Simple present, thói quen ("I always...", "I never..."), số và giờ | Leo — giấy note dùng mực xanh của bút chỉ Leo dùng; Leo nói "I never eat cake" nhưng lịch ăn trưa... |
| **S2 — The Lost Umbrella** (A1–A2) | Ba chiếc ô giống nhau ở quầy lễ tân, một chiếc bị lấy nhầm | Màu sắc, mô tả đồ vật, giới từ nơi chốn, sở hữu (`mine/yours/hers`) | Không có kẻ xấu: David lấy nhầm. Kết luận là "trả đúng chủ" |
| **S3 — Room 204** (A2) | Khách được gửi tới phòng 240 thay vì 204 | Nghe số phòng: "two-oh-four" vs "two-forty" | Lễ tân nghe nhầm qua điện thoại; không ai có lỗi cố ý |

Hai side case không có thủ phạm thực thụ: dạy người chơi rằng không phải mọi bí ẩn đều có kẻ xấu, giảm cảm giác "luôn có người để buộc tội".

---

## 13. Tác động tới engine và content

Dựa trên `docs/ai/2026-10-02-case-002-engine-generality.md`:

| Nhu cầu | Case | Hiện trạng | Đề xuất |
|---------|------|------------|---------|
| Listening task + voice | #004, S3 | Có ở #001; audio-codegen gắn cứng #001 (F-3) | Mở rộng audio-codegen theo case trước #004 |
| Evidence có raw view (thấy hai dấu cách) | #006 | Chưa có | Có thể thay F5 bằng dấu hiệu khác nếu không muốn làm raw view |
| Writing Profile (so sánh văn phong xuyên case) | #005–#008 | Chưa có; save/learning theo từng case | Tính năng mới, cần spec riêng; cần dữ liệu xuyên case (tiến độ meta) |
| Mở khoá có điều kiện (#007/#008) | #007, #008 | Không khoá tuần tự (spec #002 §12) | Quyết định sản phẩm, cần duyệt |
| Word-order reconstruction cho kết luận | #008 | Có trong GDD, chưa làm | Spec riêng |
| Cột First-hand/Second-hand trong timeline | #006 | Chưa có | Tuỳ chọn; có thể giải bằng contradiction thường |
| Art mới (khách sạn, hội chợ, văn phòng luật) | #003–#006 | Chỉ có office/archive | PR-06; tạm thời tái dùng prop office |

Phương án rẻ: #003 và #005 làm được gần như chỉ bằng content (giống #002). #004 cần audio pipeline. #006–#008 cần Writing Profile.

---

## 14. Khuôn soạn một case mới

Mỗi case trong mùa nên trả lời đủ các ô sau trước khi viết JSON:

1. **Premise** 2–3 câu, rủi ro không phải tính mạng.
2. **Sự thật** một câu + động cơ có tính người.
3. **3 nghi phạm**: 1 thủ phạm, 1 red herring có lý do bị nghi rõ ràng, 1 nhân chứng thật nhưng thiếu chi tiết.
4. **Timeline lõi** 6–8 mốc, giờ khớp với mọi evidence.
5. **Một điểm ngôn ngữ trung tâm** mà nếu hiểu sai sẽ buộc tội sai người.
6. **1–3 mâu thuẫn**, mỗi cái nối một lời khai với một evidence.
7. **8–12 từ vựng mục tiêu** đúng CEFR, xuất hiện trong evidence/dialogue (không trong danh sách rời).
8. **Hook mạch chính** (nếu có): tối đa một dòng, không làm hỏng case độc lập.
9. Kiểm tra bằng skill `authoring-case-content` + agent `case-solvability-checker`.

---

## 15. Câu hỏi cần quyết định

1. Có giữ mạch chính Ghostwriter không, hay mùa 1 chỉ gồm các case độc lập?
2. Có thêm epilogue hook cho #001/#002 không (mục 5)?
3. Victor là thủ phạm cuối có quá dễ đoán không? Phương án thay: Daniel Price (phó giám đốc) với Victor là đồng phạm bị lợi dụng.
4. Khoá #007/#008 theo số case đã đóng: chấp nhận hay giữ "không khoá tuần tự"?
5. Thứ tự sản xuất đề xuất: #003 (rẻ, chỉ content) → #005 → #004 (cần audio) → Writing Profile → #006–#008.
