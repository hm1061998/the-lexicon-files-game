# The Lexicon Files — English Learning System Design

## 1. Mục tiêu

Xây dựng hệ thống học tiếng Anh nằm bên trong gameplay trinh thám.

Không coi người chơi là học viên đang làm bài tập.

Hệ thống cần:

- đo khả năng;
- cung cấp context;
- nhắc lại đúng lúc;
- điều chỉnh độ khó;
- hỗ trợ khi cần;
- không phá immersion.

---

# 2. Learning Domains

Theo dõi 5 nhóm chính:

```text
Vocabulary
Grammar
Reading
Listening
Communication
```

Trong tương lai có thể thêm:

```text
Pronunciation
Writing
```

---

# 3. CEFR

Mức chính:

```text
A1
A2
B1
B2
C1
```

## A1

- simple present;
- basic location;
- numbers;
- time;
- basic nouns/verbs.

## A2

- past simple;
- directions;
- sequence;
- routine;
- simple comparison.

## B1

- past continuous;
- reported speech basics;
- cause/effect;
- inference;
- longer dialogue.

## B2

- implicit meaning;
- business English;
- formal email;
- conditionals;
- advanced reported speech.

## C1

- legal/formal text;
- nuance;
- idiom;
- persuasion;
- complex implication.

---

# 4. Learning Profile

```ts
type LanguageProfile = {
  cefrEstimate: CEFRLevel;

  skillScores: {
    vocabulary: number;
    grammar: number;
    reading: number;
    listening: number;
    communication: number;
  };

  vocabulary: Record<string, VocabularyProgress>;
  grammar: Record<string, GrammarProgress>;

  assistanceUsage: {
    translations: number;
    hints: number;
    transcriptOpens: number;
    audioReplays: number;
  };
};
```

Score không cần hiển thị trực tiếp cho user trong MVP.

---

# 5. Vocabulary Lifecycle

```text
Unknown
↓
Seen
↓
Recognized
↓
Understood
↓
Used
↓
Mastered
```

```ts
type VocabularyStage =
  | 'unknown'
  | 'seen'
  | 'recognized'
  | 'understood'
  | 'used'
  | 'mastered';
```

---

# 6. Vocabulary Data

```ts
type VocabularyEntry = {
  id: string;
  lemma: string;
  partOfSpeech: string;
  cefr: CEFRLevel;
  definitionEn: string;
  translationVi?: string;
  examples: string[];
  synonyms?: string[];
  tags: string[];
};
```

Ví dụ:

```json
{
  "id": "vocab_alibi",
  "lemma": "alibi",
  "partOfSpeech": "noun",
  "cefr": "B2",
  "definitionEn": "Evidence that someone was elsewhere when an event happened.",
  "translationVi": "bằng chứng ngoại phạm",
  "examples": [
    "Leo claimed he had an alibi."
  ],
  "tags": ["crime", "investigation"]
}
```

---

# 7. Vocabulary Encounter Tracking

```ts
type VocabularyProgress = {
  vocabularyId: string;
  stage: VocabularyStage;

  encounterCount: number;
  correctRecognitionCount: number;
  incorrectRecognitionCount: number;

  lastSeenAt: string;
  nextReviewAt?: string;

  contextsSeen: string[];
};
```

---

# 8. Spaced Repetition

Không hiển thị flashcard bắt buộc.

Hệ thống dùng spaced repetition để chọn từ xuất hiện lại trong:

- document;
- NPC speech;
- objective;
- clue;
- report;
- optional review room.

## Suggested intervals

```text
Seen → 10 min
Recognized → 1 day
Understood → 3 days
Used → 7 days
Mastered → 21+ days
```

Không cần chính xác tuyệt đối trong MVP.

MVP chỉ cần priority score.

---

# 9. Review Priority

Ví dụ:

```ts
priority =
  timeSinceLastSeen *
  difficultyWeight *
  errorWeight *
  relevanceWeight;
```

Trong đó:

- từ sai nhiều → tăng priority;
- từ quá dễ → giảm;
- từ liên quan case hiện tại → tăng.

---

# 10. Contextual Reinforcement

Từ không nên lặp y nguyên.

Ví dụ:

```text
receipt
```

Context 1:

> A receipt was found on the desk.

Context 2:

> Did you keep the receipt?

Context 3:

> The receipt shows a purchase at 8:42 PM.

Mục tiêu:

```text
recognize
→ understand
→ infer
→ use
```

---

# 11. Click-to-Learn

Người chơi click một từ.

Popup:

```text
conclude
verb

to end something

Vietnamese:
kết thúc

Example:
The meeting concluded at 9 PM.

Synonyms:
end, finish
```

Action:

```text
Add to notebook
```

Không cần button nếu auto-add sau lần inspect đầu.

---

# 12. Translation Modes

## Beginner

```text
English
Vietnamese
```

## Learning — Default

```text
English only
Tap word/phrase to inspect
```

## Immersion

```text
English only
Translation hidden
```

User có thể thay đổi bất cứ lúc nào.

---

# 13. Grammar Model

Grammar không phải chapter riêng.

```ts
type GrammarConcept = {
  id: string;
  name: string;
  cefr: CEFRLevel;
  examples: string[];
  investigationUse: string;
};
```

Ví dụ:

```json
{
  "id": "grammar_past_simple",
  "name": "Past Simple",
  "cefr": "A2",
  "examples": [
    "Leo arrived at 8:45.",
    "Anna left the room early."
  ],
  "investigationUse": "Describe completed past events."
}
```

---

# 14. Grammar as Investigation Tool

| Grammar | Investigation use |
|---|---|
| Past Simple | completed events |
| Past Continuous | background event |
| Present Perfect | change/relevance |
| Reported Speech | witness statement |
| Conditional | hypothesis |
| Passive Voice | formal report |
| Modals | certainty/probability |

---

# 15. Reading Tasks

Không gọi là “Reading Exercise”.

Dùng:

- email;
- meeting minutes;
- memo;
- security log;
- chat;
- report;
- receipt;
- instruction;
- handwritten note.

Task:

```text
extract name
extract time
extract location
identify sequence
detect contradiction
infer intent
```

---

# 16. Listening Tasks

Nguồn:

- phone recording;
- voicemail;
- interview;
- hallway audio;
- meeting recording;
- radio.

Mức hỗ trợ:

```text
Level 1: audio + subtitles
Level 2: audio + keyword hints
Level 3: audio only
```

User có thể replay.

Không hạn chế replay bằng currency.

---

# 17. Listening Telemetry

Track:

```text
audio replays
subtitle usage
transcript usage
answer correctness
time to extract fact
```

Không cần track microphone trong MVP.

---

# 18. Communication

MVP dùng dialogue choices.

Các choice không nên chỉ khác nhau cosmetic.

Ví dụ:

```text
1. Where were you?
2. Could you tell me where you were around 9 PM?
3. You were there, weren't you?
```

Mỗi choice có:

```text
tone
clarity
directness
languageDifficulty
npcReaction
```

---

# 19. Communication Skills

Các function học:

```text
Ask
Clarify
Confirm
Challenge
Follow up
Summarize
Persuade
```

Ví dụ:

### Clarify

> Could you explain what you mean by...?

### Confirm

> Do you mean that...?

### Challenge

> But earlier you said that...

---

# 20. Hint System

## Hint 1 — Directional

Chỉ hướng attention:

> Check the time in the security log.

## Hint 2 — Linguistic

Giải thích từ/cấu trúc:

> “before” means earlier than another event.

## Hint 3 — Simplification

Paraphrase:

Original:

> Leo claims to have left shortly before the meeting concluded.

Simplified:

> Leo says he left before the meeting ended.

## Hint 4 — Strong

Chỉ rõ hai evidence cần so sánh.

Chỉ dùng khi user yêu cầu tiếp.

---

# 21. Adaptive Difficulty

Không đổi difficulty quá mạnh trong cùng case.

Adjustment chủ yếu:

- subtitle;
- tooltip;
- hint frequency;
- vocabulary density;
- sentence length;
- distractor complexity.

Không rewrite toàn bộ case runtime trong MVP.

---

# 22. Skill Score Updating

MVP có thể dùng heuristic.

Ví dụ:

```ts
newScore =
  oldScore * 0.8 +
  recentPerformance * 0.2;
```

Không cần ML.

---

# 23. Reading Score Factors

```text
correct fact extraction
number of hints
translation usage
time
retry count
```

Time chỉ dùng nhẹ.

Không phạt người đọc chậm.

---

# 24. Vocabulary Mastery Heuristic

Ví dụ:

```text
Seen:
first encounter

Recognized:
correctly identifies meaning once

Understood:
correct use in 2 different contexts

Used:
chooses/constructs phrase correctly

Mastered:
successful recall across multiple days/cases
```

---

# 25. Review Content Generation

MVP:

- authored manually;
- tagged vocabulary.

Post-MVP:

- dynamic sentence selection;
- generated side cases;
- AI-assisted content authoring.

Không cho LLM generate critical case truth runtime trong MVP.

---

# 26. Notebook Learning UI

Vocabulary page:

```text
WORD
PRONUNCIATION
PART OF SPEECH
MEANING
CASE FOUND
EXAMPLE
RELATED WORDS
MASTERY
```

Grammar page:

```text
CONCEPT
INVESTIGATION USE
EXAMPLES FOUND IN CASES
```

---

# 27. Error Handling

Khi user sai:

Không hiện:

```text
WRONG!
```

Dùng:

```text
This interpretation doesn't match the evidence.
```

Hoặc:

```text
Something in the timeline is inconsistent.
```

Sau đó gợi ý evidence.

---

# 28. Language Content Rules

Mọi câu phải:

- tự nhiên;
- đúng CEFR target;
- không cố nhồi grammar;
- phù hợp nhân vật;
- phù hợp tình huống.

Không dùng câu textbook thiếu ngữ cảnh.

---

# 29. Vietnamese Support

Vietnamese chỉ là scaffolding.

Mặc định:

- interface có thể Việt/Anh;
- game content chủ yếu English;
- translation theo click.

Mục tiêu cuối:

```text
decrease dependence on Vietnamese
```

nhưng không ép.

---

# 30. Data-Driven Content

File ví dụ:

```text
content/
├── vocabulary/
│   ├── A1.json
│   ├── A2.json
│   ├── B1.json
│   └── B2.json
│
├── grammar/
├── dialogues/
└── cases/
```

---

# 31. Telemetry Events

Local-first trong MVP.

```text
vocab_seen
vocab_inspected
translation_opened
audio_played
audio_replayed
subtitle_enabled
hint_used
fact_discovered
contradiction_found
dialogue_choice_selected
case_completed
```

Có thể sync server sau.

---

# 32. Privacy Principle

Không thu audio/microphone trong MVP.

Nếu sau này thêm speaking:

- explicit consent;
- clear retention policy;
- opt-out;
- không bật microphone tự động.

---

# 33. MVP Learning Scope

Case #001 target:

```text
A2–B1
```

Vocabulary khoảng:

```text
15–25 target words
```

Grammar:

```text
Past Simple
Time expressions
Before / After
Reported statement basics
```

Listening:

```text
1 short audio
```

Reading:

```text
3–4 short documents
```

Communication:

```text
3 NPC dialogue trees
```

---

# 34. Acceptance Criteria

Learning system MVP đạt yêu cầu khi:

- vocabulary được track;
- click word hiển thị definition;
- evidence có vocabulary metadata;
- notebook hiển thị từ đã gặp;
- hint có 3 cấp;
- audio replay được;
- subtitle configurable;
- case report hiển thị learning summary;
- language profile được lưu.

---

# 35. Golden Rule

> Người chơi không được cảm thấy game dừng lại để “dạy bài”.

Learning phải xảy ra **trong lúc điều tra**.
