/*
  Chapter progress saved in this browser (localStorage), one key per chapter.
  The pure functions are shared with the Node tests; the browser part keeps
  every [data-progress-*] element on the page in step with the saved state.
  An element belongs to the chapter named by its closest [data-chapter]
  ancestor, or to Capitulum I when there is none.
*/
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.ProgressCore = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var MAX_SCORE = 1000;
  var DEFAULT_CHAPTER = 'capitulum-1';
  var CHAPTERS = Object.freeze({
    'capitulum-1': Object.freeze({ parts: Object.freeze(['vocabulary', 'cases', 'etymology', 'quiz']), quizTotal: 15 }),
    'capitulum-2': Object.freeze({ parts: Object.freeze(['vocabulary', 'declensions', 'etymology', 'quiz']), quizTotal: 15 })
  });

  /** @returns {{parts: Object<string, boolean>, quizBest: (number|null)}} */
  function empty() {
    return { parts: {}, quizBest: null };
  }

  /** The store for one chapter: its storage key, its parts, and pure updates. */
  function forChapter(id) {
    if (!Object.prototype.hasOwnProperty.call(CHAPTERS, id)) throw new RangeError('unknown chapter: ' + id);
    var KEY = 'curatores:' + id;
    var PARTS = CHAPTERS[id].parts;

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
      ID: id,
      KEY: KEY,
      PARTS: PARTS,
      QUIZ_TOTAL: CHAPTERS[id].quizTotal,
      empty: empty,
      sanitize: sanitize,
      withPart: withPart,
      withQuizScore: withQuizScore,
      countDone: countDone,
      load: load,
      save: save
    });
  }

  // The module itself is Capitulum I's store, plus the way to reach the others.
  return Object.freeze(Object.assign({}, forChapter(DEFAULT_CHAPTER), {
    DEFAULT_CHAPTER: DEFAULT_CHAPTER,
    forChapter: forChapter
  }));
});

/* Browser: the shared stores and the elements that display them. */
(function () {
  'use strict';
  if (typeof window === 'undefined' || !window.ProgressCore) return;

  var core = window.ProgressCore;
  var storage = null;
  try {
    storage = window.localStorage;
  } catch (error) {
    storage = null;
  }

  /** Chapter id -> { api, state }, filled the first time a chapter is needed. */
  var stores = {};
  var pageChapter = document.body.getAttribute('data-chapter') || core.DEFAULT_CHAPTER;

  function storeFor(id) {
    if (!stores[id]) {
      var api = core.forChapter(id);
      stores[id] = { api: api, state: storage ? api.load(storage) : api.empty() };
    }
    return stores[id];
  }

  function chapterOf(el) {
    var scope = el.closest('[data-chapter]');
    return scope ? scope.getAttribute('data-chapter') : core.DEFAULT_CHAPTER;
  }

  function labelFor(done, total) {
    if (done === 0) return 'Not started';
    if (done === total) return 'Chapter complete';
    return done + ' of ' + total + ' parts done';
  }

  /** Calls fn(element, store, doneCount) for every element matching selector. */
  function each(selector, fn) {
    document.querySelectorAll(selector).forEach(function (el) {
      var store = storeFor(chapterOf(el));
      fn(el, store, store.api.countDone(store.state));
    });
  }

  function render() {
    each('[data-progress-meter], [data-progress-ring]', function (el, store, done) {
      el.style.setProperty('--value', String(done / store.api.PARTS.length));
    });
    each('[data-progress-label]', function (el, store, done) {
      el.textContent = labelFor(done, store.api.PARTS.length);
    });
    each('[data-progress-count]', function (el, store, done) {
      el.textContent = String(done);
    });
    each('[data-progress-go]', function (el, store, done) {
      var total = store.api.PARTS.length;
      el.textContent = done === 0 ? 'Start chapter' : done === total ? 'Review chapter' : 'Continue';
    });
    each('[data-progress-part]', function (el, store) {
      var isDone = store.state.parts[el.getAttribute('data-progress-part')] === true;
      el.classList.toggle('is-done', isDone);
      var status = el.querySelector('[data-progress-status]');
      if (status) status.textContent = isDone ? 'done' : 'not done';
    });
    each('[data-progress-best]', function (el, store) {
      var best = store.state.quizBest;
      el.textContent = best === null ? 'Not taken yet' : best + ' of ' + store.api.QUIZ_TOTAL;
    });
  }

  function commit(next) {
    var store = storeFor(pageChapter);
    stores[pageChapter] = { api: store.api, state: next };
    if (storage) store.api.save(storage, next);
    render();
  }

  // Lesson scripts report to the chapter the page belongs to.
  window.CuratoresProgress = Object.freeze({
    get: function () { return storeFor(pageChapter).state; },
    markPart: function (part) {
      var store = storeFor(pageChapter);
      if (store.state.parts[part] !== true) commit(store.api.withPart(store.state, part));
    },
    recordQuiz: function (score) {
      var store = storeFor(pageChapter);
      commit(store.api.withQuizScore(store.state, score));
    }
  });

  // Another tab may finish a part; keep this page in step.
  window.addEventListener('storage', function (event) {
    if (!storage) return;
    Object.keys(stores).forEach(function (id) {
      var api = stores[id].api;
      if (event.key === api.KEY) stores[id] = { api: api, state: api.load(storage) };
    });
    render();
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', render);
  else render();
})();
