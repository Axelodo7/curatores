const test = require('node:test');
const assert = require('node:assert/strict');
const core = require('../assets/js/quiz-core.js');
const questions = require('../assets/js/quiz-data.js');
const questionsII = require('../assets/js/quiz-data-2.js');

test('quiz data has fifteen valid questions', () => {
  assert.equal(questions.length, 15);
  assert.deepEqual(core.validateQuestions(questions), []);
});

test('Capitulum II quiz data has fifteen valid questions', () => {
  assert.equal(questionsII.length, 15);
  assert.deepEqual(core.validateQuestions(questionsII), []);
});

test('each quiz spreads its correct answers over all four positions', () => {
  for (const quiz of [questions, questionsII]) {
    assert.deepEqual([...new Set(quiz.map((q) => q.answer))].sort(), [0, 1, 2, 3]);
  }
});

test('first question is the original puella question with Girl correct', () => {
  const first = questions[0];
  assert.equal(first.prompt, 'What does *puella* mean?');
  assert.equal(first.options[first.answer], 'Girl');
});

test('honorFor gives summa cum laude only for a perfect score', () => {
  assert.equal(core.honorFor(15, 15).latin, 'Summa cum laude');
  assert.equal(core.honorFor(14, 15).latin, 'Magna cum laude');
});

test('honorFor thresholds sit at 80% and 60%', () => {
  assert.equal(core.honorFor(12, 15).latin, 'Magna cum laude');
  assert.equal(core.honorFor(11, 15).latin, 'Cum laude');
  assert.equal(core.honorFor(9, 15).latin, 'Cum laude');
  assert.equal(core.honorFor(8, 15).latin, 'Iterum tempta');
  assert.equal(core.honorFor(0, 15).latin, 'Iterum tempta');
});

test('honorFor rejects impossible scores', () => {
  assert.throws(() => core.honorFor(16, 15), RangeError);
  assert.throws(() => core.honorFor(-1, 15), RangeError);
  assert.throws(() => core.honorFor(1.5, 15), RangeError);
  assert.throws(() => core.honorFor(0, 0), RangeError);
});

test('isCorrect compares the choice with the answer index', () => {
  assert.equal(core.isCorrect({ answer: 2 }, 2), true);
  assert.equal(core.isCorrect({ answer: 2 }, 1), false);
});

test('formatLatin italicises *words* and escapes HTML', () => {
  assert.equal(core.formatLatin('What does *puella* mean?'), 'What does <i lang="la">puella</i> mean?');
  assert.equal(core.formatLatin('<b>"x"</b> & *y*'), '&lt;b&gt;&quot;x&quot;&lt;/b&gt; &amp; <i lang="la">y</i>');
});

test('validateQuestions reports broken questions', () => {
  const broken = [
    { prompt: 'Q', options: ['a', 'a', 'b', 'c'], answer: 0, note: 'n' },
    { prompt: '', options: ['a', 'b', 'c'], answer: 5, note: '' }
  ];
  assert.deepEqual(core.validateQuestions(broken), [
    'question 1: options repeat',
    'question 2: missing prompt',
    'question 2: missing note',
    'question 2: needs exactly 4 options',
    'question 2: answer out of range'
  ]);
  assert.deepEqual(core.validateQuestions([]), ['no questions']);
});
