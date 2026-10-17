/*
  Chapter progress saved in this browser (localStorage).
  The pure functions are shared with the Node tests; the browser part keeps
  every [data-progress-*] element on the page in step with the saved state.
*/
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.ProgressCore = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var KEY = 'curatores:capitulum-1';
  var PARTS = Object.freeze(['vocabulary', 'cases', 'etymology', 'quiz']);
  var MAX_SCORE = 1000;

  /** @returns {{parts: Object<string, boolean>, quizBest: (number|null)}} */
  function empty() {
    return { parts: {}, quizBest: null };
  }

  /** Accepts anything parsed from storage and keeps only known, well-typed fields. */
  function sanitize(raw) {
    if (!raw || typeof raw !== 'object') return empty();
    var parts = {};
    PARTS.forEach(function (part) {
      if (raw.parts && raw.parts[part] === true) parts[part] = true;
    });
    var best = Number.isInteger(raw.quizBest) && raw.quizBest >= 0 && raw.quizBest <= MAX_SCORE ? raw.quizBest : null;
    return { parts: parts, quizBest: best };
  }

  function withPart(progress, part) {
    if (PARTS.indexOf(part) === -1) throw new RangeError('unknown part: ' + part);
    var parts = Object.assign({}, progress.parts);
    parts[part] = true;
    return { parts: parts, quizBest: progress.quizBest };
  }

  function withQuizScore(progress, score) {
    if (!Number.isInteger(score) || score < 0 || score > MAX_SCORE) throw new RangeError('bad score');
    var marked = withPart(progress, 'quiz');
    var best = progress.quizBest === null ? score : Math.max(progress.quizBest, score);
    return { parts: marked.parts, quizBest: best };
  }

  function countDone(progress) {
    return PARTS.filter(function (part) { return progress.parts[part] === true; }).length;
  }

  function load(storage) {
    try {
      return sanitize(JSON.parse(storage.getItem(KEY)));
    } catch (error) {
      return empty();
    }
  }

  function save(storage, progress) {
    try {
      storage.setItem(KEY, JSON.stringify(progress));
      return true;
    } catch (error) {
      return false;
    }
  }

  return Object.freeze({
    KEY: KEY,
    PARTS: PARTS,
    empty: empty,
    sanitize: sanitize,
    withPart: withPart,
    withQuizScore: withQuizScore,
    countDone: countDone,
    load: load,
    save: save
  });
});

/* Browser: the shared store and the elements that display it. */
(function () {
  'use strict';
  if (typeof window === 'undefined' || !window.ProgressCore) return;

  var core = window.ProgressCore;
  var QUIZ_TOTAL = 15;
  var storage = null;
  try {
    storage = window.localStorage;
  } catch (error) {
    storage = null;
  }
  var state = storage ? core.load(storage) : core.empty();

  function labelFor(done, total) {
    if (done === 0) return 'Not started';
    if (done === total) return 'Chapter complete';
    return done + ' of ' + total + ' parts done';
  }

  function render() {
    var total = core.PARTS.length;
    var done = core.countDone(state);
    document.querySelectorAll('[data-progress-meter], [data-progress-ring]').forEach(function (el) {
      el.style.setProperty('--value', String(done / total));
    });
    document.querySelectorAll('[data-progress-label]').forEach(function (el) {
      el.textContent = labelFor(done, total);
    });
    document.querySelectorAll('[data-progress-count]').forEach(function (el) {
      el.textContent = String(done);
    });
    document.querySelectorAll('[data-progress-go]').forEach(function (el) {
      el.textContent = done === 0 ? 'Start chapter' : done === total ? 'Review chapter' : 'Continue';
    });
    document.querySelectorAll('[data-progress-part]').forEach(function (el) {
      var isDone = state.parts[el.getAttribute('data-progress-part')] === true;
      el.classList.toggle('is-done', isDone);
      var status = el.querySelector('[data-progress-status]');
      if (status) status.textContent = isDone ? 'done' : 'not done';
    });
    document.querySelectorAll('[data-progress-best]').forEach(function (el) {
      el.textContent = state.quizBest === null ? 'Not taken yet' : state.quizBest + ' of ' + QUIZ_TOTAL;
    });
  }

  function commit(next) {
    state = next;
    if (storage) core.save(storage, state);
    render();
  }

  window.CuratoresProgress = Object.freeze({
    get: function () { return state; },
    markPart: function (part) {
      if (state.parts[part] !== true) commit(core.withPart(state, part));
    },
    recordQuiz: function (score) {
      commit(core.withQuizScore(state, score));
    }
  });

  // Another tab may finish a part; keep this page in step.
  window.addEventListener('storage', function (event) {
    if (event.key === core.KEY && storage) {
      state = core.load(storage);
      render();
    }
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', render);
  else render();
})();
