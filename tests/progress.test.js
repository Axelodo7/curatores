const test = require('node:test');
const assert = require('node:assert/strict');
const progress = require('../assets/js/progress.js');

function memoryStorage(initial) {
  const data = new Map(Object.entries(initial || {}));
  return {
    getItem: (key) => (data.has(key) ? data.get(key) : null),
    setItem: (key, value) => data.set(key, String(value)),
    dump: () => Object.fromEntries(data)
  };
}

test('a fresh store has nothing done and no quiz score', () => {
  const state = progress.load(memoryStorage());
  assert.deepEqual(state, { parts: {}, quizBest: null });
  assert.equal(progress.countDone(state), 0);
});

test('withPart marks a part without touching the original', () => {
  const before = progress.empty();
  const after = progress.withPart(before, 'cases');
  assert.deepEqual(before, { parts: {}, quizBest: null });
  assert.equal(after.parts.cases, true);
  assert.equal(progress.countDone(after), 1);
});

test('withPart rejects unknown parts', () => {
  assert.throws(() => progress.withPart(progress.empty(), 'grammar'), RangeError);
});

test('withQuizScore keeps the best score and marks the quiz done', () => {
  let state = progress.withQuizScore(progress.empty(), 9);
  assert.equal(state.quizBest, 9);
  assert.equal(state.parts.quiz, true);
  state = progress.withQuizScore(state, 7);
  assert.equal(state.quizBest, 9);
  state = progress.withQuizScore(state, 13);
  assert.equal(state.quizBest, 13);
});

test('withQuizScore rejects impossible scores', () => {
  assert.throws(() => progress.withQuizScore(progress.empty(), -1), RangeError);
  assert.throws(() => progress.withQuizScore(progress.empty(), 2.5), RangeError);
});

test('save and load round-trip through storage', () => {
  const storage = memoryStorage();
  const state = progress.withQuizScore(progress.withPart(progress.empty(), 'vocabulary'), 12);
  assert.equal(progress.save(storage, state), true);
  assert.deepEqual(progress.load(storage), state);
});

test('corrupt or tampered storage falls back safely', () => {
  assert.deepEqual(progress.load(memoryStorage({ [progress.KEY]: '{not json' })), progress.empty());
  const tampered = memoryStorage({
    [progress.KEY]: JSON.stringify({ parts: { cases: true, grammar: true, quiz: 'yes' }, quizBest: '15' })
  });
  assert.deepEqual(progress.load(tampered), { parts: { cases: true }, quizBest: null });
});

test('save reports failure when storage throws', () => {
  const broken = { setItem: () => { throw new Error('quota'); } };
  assert.equal(progress.save(broken, progress.empty()), false);
});

test('the default store is Capitulum I under its original key', () => {
  assert.equal(progress.KEY, 'curatores:capitulum-1');
  assert.deepEqual(progress.PARTS, ['vocabulary', 'cases', 'etymology', 'quiz']);
  assert.equal(progress.QUIZ_TOTAL, 15);
});

test('each chapter has its own key and parts', () => {
  const second = progress.forChapter('capitulum-2');
  assert.equal(second.KEY, 'curatores:capitulum-2');
  assert.deepEqual(second.PARTS, ['vocabulary', 'declensions', 'etymology', 'quiz']);
  assert.equal(second.withPart(second.empty(), 'declensions').parts.declensions, true);
  assert.throws(() => second.withPart(second.empty(), 'cases'), RangeError);
  assert.throws(() => progress.withPart(progress.empty(), 'declensions'), RangeError);
});

test('unknown chapters are rejected', () => {
  assert.throws(() => progress.forChapter('capitulum-9'), RangeError);
  assert.throws(() => progress.forChapter('__proto__'), RangeError);
});

test('chapters save to separate keys and do not overwrite each other', () => {
  const storage = memoryStorage();
  const first = progress.forChapter('capitulum-1');
  const second = progress.forChapter('capitulum-2');
  first.save(storage, first.withPart(first.empty(), 'cases'));
  second.save(storage, second.withQuizScore(second.empty(), 11));
  assert.deepEqual(first.load(storage), { parts: { cases: true }, quizBest: null });
  assert.deepEqual(second.load(storage), { parts: { quiz: true }, quizBest: 11 });
});
