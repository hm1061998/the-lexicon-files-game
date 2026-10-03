import assert from 'node:assert/strict';
import test from 'node:test';

import { extractSpans, injectMarkup } from '../src/vocab.mjs';

const vocabulary = [
  { id: 'address', lemma: 'address', surfaceForms: ['addresses'] },
  { id: 'sign', lemma: 'sign', surfaceForms: ['signs', 'signed', 'signing'] },
  { id: 'sign_off', lemma: 'sign off', surfaceForms: ['signed'] },
  { id: 'package', lemma: 'package', surfaceForms: ['packages'] },
  { id: 'client', lemma: 'client', surfaceForms: ['clients'] },
];

test('marked words become spans with UTF-16 offsets on the unbracketed text', () => {
  const r = extractSpans(
    'I checked the [address] when I [sign|sign]ed the [package] into the mail room.',
    vocabulary,
  );
  assert.equal(r.text, 'I checked the address when I signed the package into the mail room.');
  assert.deepEqual(r.spans, [
    { start: 14, end: 21, vocabularyId: 'address' },
    { start: 29, end: 33, vocabularyId: 'sign' },
    { start: 40, end: 47, vocabularyId: 'package' },
  ]);
  assert.deepEqual(r.issues, []);
});

test('a word is found by lemma or by surface form, ignoring case', () => {
  const r = extractSpans('[Addresses] and [CLIENT] and [signing]', vocabulary);
  assert.deepEqual(
    r.spans.map((s) => s.vocabularyId),
    ['address', 'client', 'sign'],
  );
  assert.equal(r.text, 'Addresses and CLIENT and signing');
});

test('punctuation after a marked word is not part of the span', () => {
  const r = extractSpans('Read the [package].', vocabulary);
  assert.equal(r.text, 'Read the package.');
  assert.deepEqual(r.spans, [{ start: 9, end: 16, vocabularyId: 'package' }]);
});

test('the same word twice gives two spans', () => {
  const r = extractSpans('The [client] met the [client].', vocabulary);
  assert.deepEqual(r.spans, [
    { start: 4, end: 10, vocabularyId: 'client' },
    { start: 19, end: 25, vocabularyId: 'client' },
  ]);
});

test('an unknown word is reported with its position in the markup', () => {
  const r = extractSpans('The [harper] case', vocabulary);
  assert.equal(r.issues.length, 1);
  assert.equal(r.issues[0].code, 'unknown-word');
  assert.equal(r.issues[0].at, 4);
  assert.match(r.issues[0].message, /harper/);
});

test('a word matching two entries is ambiguous and lists them', () => {
  const r = extractSpans('He [signed] it', vocabulary);
  assert.equal(r.issues[0].code, 'ambiguous-word');
  assert.match(r.issues[0].message, /sign/);
  assert.match(r.issues[0].message, /sign_off/);
  assert.match(r.issues[0].hint ?? '', /\[signed\|sign\]/);
});

test('an explicit id picks the entry', () => {
  const r = extractSpans('He [signed|sign_off] it', vocabulary);
  assert.deepEqual(r.spans, [{ start: 3, end: 9, vocabularyId: 'sign_off' }]);
  assert.deepEqual(r.issues, []);
});

test('an escaped bracket is a literal bracket, an unclosed one is bad markup', () => {
  const ok = extractSpans('Press \\[Enter] now', vocabulary);
  assert.equal(ok.text, 'Press [Enter] now');
  assert.deepEqual(ok.spans, []);
  const bad = extractSpans('The [client case', vocabulary);
  assert.equal(bad.issues[0].code, 'bad-markup');
});

test('injectMarkup is the inverse of extractSpans', () => {
  const markups = [
    'I checked the [address] when I [signed|sign] the [package] into the mail room.',
    'The [client] met the [client].',
    'Press \\[Enter] and read the [package].',
  ];
  for (const markup of markups) {
    const { text, spans } = extractSpans(markup, vocabulary);
    assert.equal(injectMarkup(text, spans, vocabulary), markup);
  }
});

test('injectMarkup writes the id only when the word does not resolve to that entry alone', () => {
  const text = 'He signed it';
  const plain = injectMarkup(text, [{ start: 3, end: 9, vocabularyId: 'sign' }], vocabulary);
  assert.equal(plain, 'He [signed|sign] it');
  const lone = injectMarkup('A client', [{ start: 2, end: 8, vocabularyId: 'client' }], vocabulary);
  assert.equal(lone, 'A [client]');
});
