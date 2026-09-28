# The Lexicon Files — Game Design Document

## 1. High Concept

**The Lexicon Files** là web game trinh thám 2.5D isometric, trong đó người chơi giải các vụ án bằng cách sử dụng tiếng Anh như một công cụ điều tra.

Người chơi không học bằng chuỗi bài tập tách biệt. Thay vào đó, họ phải:

- đọc hồ sơ;
- nghe lời khai;
- hiểu email/tin nhắn;
- thu thập từ khóa;
- xây dựng timeline;
- phát hiện mâu thuẫn;
- đặt câu hỏi;
- liên kết evidence;
- đưa ra kết luận.

> **Core principle:** Nếu người chơi hiểu tiếng Anh tốt hơn, họ điều tra tốt hơn.

---

# 2. Product Pillars

## 2.1. Investigation First

Game phải mang cảm giác là game trinh thám trước khi mang cảm giác là app học tiếng Anh.

Không sử dụng flow:

```text
Walk → Quiz → Reward → Walk → Quiz
```

Thay bằng:

```text
Explore
→ Observe
→ Read / Listen
→ Understand
→ Collect
→ Connect
→ Question
→ Deduce
```

## 2.2. Contextual Learning

Mọi từ/cấu trúc ngôn ngữ phải xuất hiện trong ngữ cảnh có ý nghĩa.

Ví dụ:

```text
"before"
```

không được dạy bằng định nghĩa đơn thuần.

Nó xuất hiện trong:

> Leo left before the meeting ended.

Nếu hiểu sai `before`, người chơi có thể xây dựng timeline sai.

## 2.3. Diegetic UI

UI phải tồn tại hợp lý trong thế giới game:

- Notebook
- Case file
- Evidence board
- Map
- Archive
- Investigator report

Không dùng UI giống LMS/dashboard giáo dục.

## 2.4. Player Agency

Cho phép người chơi:

- tự chọn evidence cần xem;
- tự mở notebook;
- tự đối chiếu timeline;
- tự chọn câu hỏi với NPC;
- dùng hint khi cần;
- không bị buộc làm tutorial quá dài.

---

# 3. Target Audience

## Primary

- Người học tiếng Anh A2–B2.
- 15+.
- Thích mystery, detective, puzzle.
- Muốn học qua nội dung thay vì giáo trình truyền thống.

## Secondary

- Người chơi game story-driven.
- Người học IELTS/general English muốn tăng reading/listening contextual.
- Người thích game kiểu investigation board.

---

# 4. Target Platform

MVP:

```text
Desktop Web
Chrome / Edge / Firefox
Keyboard + Mouse
16:9
```

Không ưu tiên mobile trong MVP.

---

# 5. Visual Identity

Phong cách:

```text
2.5D Isometric
+
Hand-drawn
+
Vintage paper
+
Muted palette
+
Dark brown outline
+
Red investigation accent
```

Màu đỏ chỉ dùng cho:

- clue;
- evidence;
- objective;
- contradiction;
- selected node;
- map marker.

---

# 6. World

## 6.1. Organization

Người chơi làm việc tại:

**International Investigation Bureau (IIB)**

Đây là tổ chức giả tưởng giải quyết các case liên quan tới:

- doanh nghiệp quốc tế;
- người nước ngoài;
- tài liệu đa quốc gia;
- email/hợp đồng;
- tranh chấp;
- mất tài sản;
- gian lận;
- nội gián.

## 6.2. Player Role

Khởi đầu:

```text
Junior Investigator
```

Rank:

```text
Junior Investigator
Investigator
Senior Investigator
Lead Detective
Special Agent
```

Rank gắn với:

- story progression;
- độ khó language;
- case complexity;
- cosmetic unlock.

---

# 7. Hub

Trụ sở IIB là hub chính.

## Phòng

### Main Office
- nhận objective;
- gặp NPC;
- mở case.

### Meeting Room
- briefing;
- đọc tài liệu;
- xem meeting minutes.

### Archive Room
- review vocabulary;
- review evidence;
- case history.

### Interrogation Room
- dialogue;
- listening;
- questioning.

### Language Lab
Không phải lớp học.
Đây là nơi replay:
- audio;
- transcript;
- pronunciation;
- previously encountered phrases.

### Evidence Board Room
- graph;
- timeline;
- deduction.

---

# 8. Core Loop

```text
Receive Case
   ↓
Explore Scene
   ↓
Find Evidence
   ↓
Read / Listen
   ↓
Extract Facts
   ↓
Interview NPC
   ↓
Build Timeline
   ↓
Find Contradictions
   ↓
Connect Evidence
   ↓
Make Deduction
   ↓
Case Closed
```

---

# 9. World Interaction

## Controls

```text
WASD     Move
E        Interact
J        Notebook
M        Map
Tab      Evidence quick view
Esc      Pause
Mouse    UI interaction
```

## Interaction

Khi gần object:

```text
◇
[E] Read meeting minutes
```

Object types:

```text
evidence
document
door
npc
computer
audio-device
container
location-marker
```

---

# 10. Player State

```ts
type PlayerProgress = {
  currentCaseId: string;
  currentSceneId: string;
  objectives: ObjectiveState[];
  evidenceIds: string[];
  discoveredFacts: string[];
  vocabularyProgress: Record<string, VocabularyProgress>;
  languageProfile: LanguageProfile;
  rank: InvestigatorRank;
};
```

---

# 11. Case Structure

Mỗi case là content data-driven.

```ts
type CaseDefinition = {
  id: string;
  title: string;
  cefrLevel: 'A1' | 'A2' | 'B1' | 'B2' | 'C1';
  scenes: SceneDefinition[];
  npcs: NPCDefinition[];
  evidences: EvidenceDefinition[];
  objectives: ObjectiveDefinition[];
  facts: FactDefinition[];
  contradictions: ContradictionDefinition[];
  conclusion: CaseConclusion;
};
```

---

# 12. Objective System

Objective không được giống checklist LMS.

Ví dụ:

```text
MỤC TIÊU HIỆN TẠI
○ Đối chiếu lời khai của Leo
```

Objective states:

```text
locked
active
completed
failed(optional)
```

Objective có trigger:

```text
evidence_discovered
dialogue_completed
fact_unlocked
contradiction_found
scene_entered
```

---

# 13. Evidence System

```ts
type Evidence = {
  id: string;
  caseId: string;
  name: string;
  category:
    | 'document'
    | 'audio'
    | 'photo'
    | 'object'
    | 'statement'
    | 'digital';
  description: string;
  discoveredAt?: string;
  relatedNpcIds: string[];
  relatedFactIds: string[];
  vocabularyIds: string[];
  imageAsset?: string;
};
```

Evidence phải có ý nghĩa gameplay.

Không tạo evidence chỉ để tăng số lượng collectible.

---

# 14. Fact System

Evidence không đồng nghĩa Fact.

Ví dụ:

Evidence:

```text
Security Log
```

Fact rút ra:

```text
Leo left at 21:16.
```

```ts
type FactDefinition = {
  id: string;
  text: string;
  sourceEvidenceIds: string[];
  unlockCondition: Condition;
};
```

---

# 15. Contradiction System

```ts
type Contradiction = {
  id: string;
  factA: string;
  factB: string;
  explanation: string;
};
```

Ví dụ:

```text
Statement:
"I left before nine."

Security log:
21:16 exit

→ contradiction
```

Contradiction chỉ unlock khi người chơi đã biết cả hai fact.

---

# 16. Timeline System

Timeline chứa:

```text
Event
Time
Location
People
Evidence source
Confidence
```

Player có thể kéo event vào timeline.

MVP có thể đơn giản hóa:

- click event;
- chọn slot time;
- game validate.

Sau MVP có thể drag/drop hoàn chỉnh.

---

# 17. Dialogue System

## Dialogue Modes

### Fixed choice
MVP.

### Word-order reconstruction
Dùng cho language practice có ngữ cảnh.

### Free text
Post-MVP.

### Voice input
Future.

## Dialogue Node

```ts
type DialogueNode = {
  id: string;
  speakerId: string;
  text: string;
  choices?: DialogueChoice[];
  conditions?: Condition[];
  effects?: Effect[];
};
```

---

# 18. NPC Model

```ts
type NPCDefinition = {
  id: string;
  name: string;
  role: string;
  portraitAsset: string;
  spriteAsset: string;
  knownFacts: string[];
  hiddenFacts: string[];
  dialogueTreeId: string;
};
```

NPC không cần AI trong MVP.

---

# 19. Notebook

Tabs:

```text
CASE
PEOPLE
EVIDENCE
VOCABULARY
PHRASES
TIMELINE
NOTES
```

Notebook là trung tâm meta-game.

---

# 20. Evidence Board

Node types:

```text
Person
Evidence
Location
Event
Statement
Contradiction
```

Edges:

```text
related_to
seen_at
said_by
conflicts_with
occurred_at
supports
```

MVP có thể hiển thị graph read-only sau khi người chơi unlock connection.

Interactive linking có thể triển khai Phase 2.

---

# 21. Case Completion

Không dùng:

```text
Quiz Score: 8/10
```

Dùng:

```text
CASE CLOSED

Evidence Found          8/10
Statements Understood   6/7
Vocabulary Mastered     12
Listening Accuracy      84%
Hints Used              2
```

Không phạt nặng người dùng vì dùng hint.

---

# 22. Progression

## Investigator XP

Nhận từ:

- case completion;
- optional evidence;
- no-hint discovery;
- vocabulary mastery;
- contradiction discovery.

## Unlock

- case;
- cosmetic;
- notebook skin;
- office decoration;
- optional side case.

Không bán power.

---

# 23. Difficulty

Case difficulty có 2 dimension:

```text
Investigation complexity
Language complexity
```

Không được mặc định B2 = puzzle khó hơn hoàn toàn.

Có thể có:

```text
A2 language + medium investigation
B2 language + easy investigation
```

để cân bằng.

---

# 24. Save System

Auto-save khi:

- evidence acquired;
- dialogue completed;
- objective completed;
- scene changed.

Manual save không bắt buộc cho MVP.

---

# 25. Audio

SFX:

- footsteps;
- paper;
- file drawer;
- keyboard;
- door;
- pencil;
- UI stamp.

Ambient:

- office hum;
- rain;
- distant city;
- AC;
- archive room ambience.

Music:

- low-key noir;
- không lấn voice.

---

# 26. UX Rules

1. Không bắt người chơi đọc đoạn text quá dài liên tục.
2. Highlight từ quan trọng bằng interaction, không bằng rainbow color.
3. Tooltip từ vựng chỉ mở khi click.
4. Subtitle có thể bật/tắt.
5. Không làm người chơi fail case chỉ vì một lỗi tiếng Anh nhỏ.
6. Cho phép replay audio.
7. Cho phép xem transcript theo chế độ.
8. Hint phải giúp hiểu, không tự solve puzzle ngay.

---

# 27. Anti-Patterns

Không làm:

- energy system;
- heart/lives;
- paywall từ vựng;
- timer ép trả lời;
- streak punishment;
- multiple-choice liên tục;
- ads xen giữa case;
- “wrong answer” animation làm người học xấu hổ.

---

# 28. MVP Scope

Chỉ làm:

```text
1 Case
3 Scenes
3 NPC
5 Evidence
1 Timeline
1 Contradiction
1 Case Conclusion
A2–B1 language
```

Không làm:

- multiplayer;
- AI NPC;
- procedural cases;
- voice recognition;
- full skill tree;
- complex character customization.

---

# 29. Definition of Fun

Vertical slice được coi là thành công nếu người chơi:

1. muốn đọc evidence vì tò mò;
2. nhớ một số từ do context;
3. cảm thấy thông minh khi phát hiện contradiction;
4. hiểu vì sao English giúp phá án;
5. muốn chơi case tiếp theo.

---

# 30. Golden Rule

> Mọi mechanic học tiếng Anh phải trả lời được câu hỏi:
>
> **“Điều này giúp người chơi điều tra như thế nào?”**

Nếu không trả lời được, mechanic đó không thuộc core game.
