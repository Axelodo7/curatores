/*
  Quiz logic with no DOM access, shared by the browser (window.QuizCore)
  and the Node tests (module.exports).
*/
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.QuizCore = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /** Latin honours, highest first. `min` is the share of correct answers needed. */
  var HONORS = Object.freeze([
    Object.freeze({ min: 1, latin: 'Summa cum laude', english: 'With highest praise' }),
    Object.freeze({ min: 0.8, latin: 'Magna cum laude', english: 'With great praise' }),
    Object.freeze({ min: 0.6, latin: 'Cum laude', english: 'With praise' }),
    Object.freeze({ min: 0, latin: 'Iterum tempta', english: 'Try again' })
  ]);

  var EPSILON = 1e-9;
  var OPTION_COUNT = 4;

  /**
   * @param {number} score
   * @param {number} total
   * @returns {{min: number, latin: string, english: string}}
   */
  function honorFor(score, total) {
    if (!Number.isInteger(total) || total <= 0) {
      throw new RangeError('total must be a positive integer');
    }
    if (!Number.isInteger(score) || score < 0 || score > total) {
      throw new RangeError('score must be an integer from 0 to total');
    }
    var ratio = score / total;
    return HONORS.find(function (honor) { return ratio + EPSILON >= honor.min; });
  }

  /**
   * @param {{answer: number}} question
   * @param {number} choice
   * @returns {boolean}
   */
  function isCorrect(question, choice) {
    return choice === question.answer;
  }

  /** @param {string} text */
  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /**
   * Escapes the text, then turns *word* into an italic Latin word.
   * @param {string} text
   * @returns {string} safe HTML
   */
  function formatLatin(text) {
    return escapeHtml(text).replace(/\*([^*]+)\*/g, '<i lang="la">$1</i>');
  }

  /**
   * @param {Array<{prompt: string, options: string[], answer: number, note: string}>} questions
   * @returns {string[]} a list of problems; empty when the set is valid
   */
  function validateQuestions(questions) {
    if (!Array.isArray(questions) || questions.length === 0) return ['no questions'];
    return questions.reduce(function (problems, q, i) {
      var label = 'question ' + (i + 1);
      var found = [];
      if (!q || typeof q.prompt !== 'string' || !q.prompt.trim()) found.push(label + ': missing prompt');
      if (!q || typeof q.note !== 'string' || !q.note.trim()) found.push(label + ': missing note');
      if (!q || !Array.isArray(q.options) || q.options.length !== OPTION_COUNT) {
        found.push(label + ': needs exactly ' + OPTION_COUNT + ' options');
      } else if (new Set(q.options).size !== q.options.length) {
        found.push(label + ': options repeat');
      }
      if (!q || !Number.isInteger(q.answer) || q.answer < 0 || q.answer >= OPTION_COUNT) {
        found.push(label + ': answer out of range');
      }
      return problems.concat(found);
    }, []);
  }

  return Object.freeze({
    HONORS: HONORS,
    honorFor: honorFor,
    isCorrect: isCorrect,
    escapeHtml: escapeHtml,
    formatLatin: formatLatin,
    validateQuestions: validateQuestions
  });
});
