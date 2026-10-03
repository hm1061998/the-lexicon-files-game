/** Vocabulary markup of a spoken line: `[word]` or `[surface|vocab_id]`, `\[` for a literal bracket. */

/** Same word whatever the Unicode form it was typed in (é as one character or as e + accent). */
const norm = (s) => s.normalize('NFC').toLowerCase();

/** Entries a written form can mean: the lemma or one of the surface forms (no case). */
function candidates(surface, vocabulary) {
  const key = norm(surface);
  return vocabulary.filter(
    (w) => norm(w.lemma) === key || (w.surfaceForms ?? []).some((f) => norm(f) === key),
  );
}

/**
 * @param {string} markup
 * @param {{ id: string; lemma: string; surfaceForms?: string[] }[]} vocabulary
 * @returns {{ text: string; spans: { start: number; end: number; vocabularyId: string }[];
 *   issues: { code: 'unknown-word' | 'ambiguous-word' | 'bad-markup'; at: number; message: string; hint?: string }[] }}
 */
export function extractSpans(markup, vocabulary) {
  let text = '';
  const spans = [];
  const issues = [];
  let i = 0;
  while (i < markup.length) {
    const ch = markup[i];
    if (ch === '\\' && markup[i + 1] === '[') {
      text += '[';
      i += 2;
      continue;
    }
    if (ch !== '[') {
      text += ch;
      i += 1;
      continue;
    }
    const close = markup.indexOf(']', i + 1);
    if (close === -1) {
      issues.push({
        code: 'bad-markup',
        at: i,
        message: 'dấu [ không có dấu ] đóng',
        hint: 'viết \\[ nếu muốn một dấu [ thật',
      });
      text += markup.slice(i);
      break;
    }
    const inner = markup.slice(i + 1, close);
    const bar = inner.indexOf('|');
    const surface = bar === -1 ? inner : inner.slice(0, bar);
    const explicit = bar === -1 ? null : inner.slice(bar + 1);
    if (!surface) {
      issues.push({ code: 'bad-markup', at: i, message: 'dấu [ ] rỗng' });
      i = close + 1;
      continue;
    }
    let id = null;
    if (explicit !== null) {
      if (vocabulary.some((w) => w.id === explicit)) id = explicit;
      else
        issues.push({
          code: 'unknown-word',
          at: i,
          message: `"${explicit}" không phải id nào trong vocabulary`,
        });
    } else {
      const found = candidates(surface, vocabulary);
      if (found.length === 1) id = found[0].id;
      else if (found.length === 0)
        issues.push({
          code: 'unknown-word',
          at: i,
          message: `"${surface}" không có trong vocabulary`,
          hint: 'thêm mục vocabulary hoặc bỏ dấu [ ]',
        });
      else
        issues.push({
          code: 'ambiguous-word',
          at: i,
          message: `"${surface}" khớp ${found.length} mục: ${found.map((w) => w.id).join(', ')}`,
          hint: `chọn bằng [${surface}|${found[0].id}]`,
        });
    }
    const start = text.length;
    text += surface;
    if (id !== null) spans.push({ start, end: text.length, vocabularyId: id });
    i = close + 1;
  }
  return { text, spans, issues };
}

/**
 * Inverse of {@link extractSpans}. Throws if the spans overlap or run off the text.
 * @param {string} text
 * @param {{ start: number; end: number; vocabularyId: string }[]} spans
 * @param {{ id: string; lemma: string; surfaceForms?: string[] }[]} vocabulary
 */
export function injectMarkup(text, spans, vocabulary) {
  const sorted = [...spans].sort((a, b) => a.start - b.start);
  let out = '';
  let cursor = 0;
  for (const span of sorted) {
    if (span.start < cursor || span.end > text.length || span.end <= span.start)
      throw new Error(`span ${span.start}-${span.end} chồng nhau hoặc nằm ngoài văn bản`);
    out += text.slice(cursor, span.start).replaceAll('[', '\\[');
    const surface = text.slice(span.start, span.end);
    const found = candidates(surface, vocabulary);
    const alone = found.length === 1 && found[0].id === span.vocabularyId;
    out += alone ? `[${surface}]` : `[${surface}|${span.vocabularyId}]`;
    cursor = span.end;
  }
  return out + text.slice(cursor).replaceAll('[', '\\[');
}
