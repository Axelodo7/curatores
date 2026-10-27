/* Chapter quiz (questions from the page's quiz-data file): one question at a time, instant feedback, a Latin honour at the end. */
(function () {
  'use strict';

  var root = document.querySelector('[data-quiz]');
  var core = window.QuizCore;
  var questions = window.CURATORES_QUIZ;
  if (!root || !core || !questions) return;

  var problems = core.validateQuestions(questions);
  if (problems.length) {
    root.textContent = 'The quiz could not load. ' + problems.join('; ') + '.';
    return;
  }

  var KEYS = ['A', 'B', 'C', 'D'];
  var COUNT_UP_MS = 900;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var total = questions.length;

  /** @type {{index: number, results: Array<{choice: number, correct: boolean}>, answered: boolean}} */
  var state = { index: 0, results: [], answered: false };
  // True while one card animates out and the next in; input then would hit the old card.
  var swapping = false;

  var ui = buildShell();

  function el(tag, className, html) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (html !== undefined) node.innerHTML = html;
    return node;
  }

  function buildShell() {
    var top = el('div', 'quiz__top');
    var count = el('p', 'quiz__count');
    var score = el('p', 'quiz__score');
    top.append(count, score);

    var progress = el('ol', 'quiz__progress');
    progress.setAttribute('aria-hidden', 'true');
    progress.style.gridTemplateColumns = 'repeat(' + questions.length + ', 1fr)';
    var segments = questions.map(function () {
      var li = el('li');
      progress.appendChild(li);
      return li;
    });

    var card = el('div', 'quiz__card');
    var feedback = el('p', 'quiz__feedback');
    feedback.setAttribute('role', 'status');

    var actions = el('div', 'quiz__actions');
    var next = el('button', 'btn btn--primary');
    next.type = 'button';
    next.hidden = true;
    var hint = el('p', 'quiz__hint', 'Press <kbd>1</kbd>–<kbd>4</kbd> to answer');
    actions.append(next, hint);

    root.replaceChildren(top, progress, card, feedback, actions);
    return { count: count, score: score, segments: segments, card: card, feedback: feedback, actions: actions, next: next, hint: hint };
  }

  function correctCount(results) {
    return results.filter(function (r) { return r.correct; }).length;
  }

  function renderStatus() {
    var done = state.index >= total;
    ui.count.innerHTML = done
      ? 'Quiz complete'
      : 'Question <b>' + (state.index + 1) + '</b> of ' + total;
    ui.score.innerHTML = 'Correct <b>' + correctCount(state.results) + '</b>';
    ui.segments.forEach(function (segment, i) {
      var result = state.results[i];
      segment.className = result
        ? (result.correct ? 'is-right' : 'is-wrong')
        : (i === state.index ? 'is-current' : '');
    });
  }

  function questionMarkup(question) {
    var options = question.options.map(function (option, i) {
      return '<button class="option" type="button" data-choice="' + i + '">' +
        '<span class="option__key" aria-hidden="true">' + KEYS[i] + '</span>' +
        '<span class="option__text">' + core.formatLatin(option) + '</span>' +
        '<span class="option__mark" aria-hidden="true"></span>' +
        '</button>';
    }).join('');
    return '<h3 class="quiz__prompt" id="quiz-prompt" tabindex="-1">' + core.formatLatin(question.prompt) + '</h3>' +
      '<div class="quiz__options" role="group" aria-labelledby="quiz-prompt">' + options + '</div>';
  }

  function swapCard(render) {
    if (reduceMotion.matches || !ui.card.animate) {
      render();
      return Promise.resolve();
    }
    var easing = 'cubic-bezier(0.22, 0.8, 0.2, 1)';
    swapping = true;
    return ui.card.animate(
      [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateX(-1.25rem)' }],
      { duration: 220, easing: 'ease-in', fill: 'forwards' }
    ).finished.then(function () {
      render();
      swapping = false;
      return ui.card.animate(
        [{ opacity: 0, transform: 'translateX(1.25rem)' }, { opacity: 1, transform: 'none' }],
        { duration: 420, easing: easing, fill: 'forwards' }
      ).finished;
    });
  }

  function showQuestion(focusPrompt) {
    state = { index: state.index, results: state.results, answered: false };
    ui.feedback.innerHTML = '';
    ui.feedback.className = 'quiz__feedback';
    ui.next.hidden = true;
    ui.hint.hidden = false;
    renderStatus();
    return swapCard(function () {
      ui.card.innerHTML = questionMarkup(questions[state.index]);
      if (focusPrompt) ui.card.querySelector('.quiz__prompt').focus();
    });
  }

  function answer(choice) {
    if (swapping || state.answered || state.index >= total) return;
    var question = questions[state.index];
    var correct = core.isCorrect(question, choice);
    state = {
      index: state.index,
      results: state.results.concat([{ choice: choice, correct: correct }]),
      answered: true
    };

    var buttons = ui.card.querySelectorAll('.option');
    buttons.forEach(function (button, i) {
      button.disabled = true;
      if (i === question.answer) {
        button.classList.add('is-correct');
        button.querySelector('.option__mark').textContent = '✓';
      } else if (i === choice) {
        button.classList.add('is-wrong');
        button.querySelector('.option__mark').textContent = '✕';
      } else {
        button.classList.add('is-dimmed');
      }
    });

    ui.feedback.className = 'quiz__feedback ' + (correct ? 'is-right' : 'is-wrong');
    ui.feedback.innerHTML = '<strong>' + (correct ? 'Correct.' : 'Not quite.') + '</strong> ' + core.formatLatin(question.note);

    var isLast = state.index === total - 1;
    ui.next.innerHTML = (isLast ? 'See your result' : 'Next question') + ' <span class="btn__arrow" aria-hidden="true">→</span>';
    ui.next.hidden = false;
    ui.hint.hidden = true;
    renderStatus();
    ui.next.focus({ preventScroll: true });
  }

  function countUp(node, to) {
    if (reduceMotion.matches) {
      node.textContent = String(to);
      return;
    }
    var start = performance.now();
    function frame(now) {
      var t = Math.min(1, (now - start) / COUNT_UP_MS);
      var eased = 1 - Math.pow(1 - t, 3);
      node.textContent = String(Math.round(eased * to));
      if (t < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  function splitIntoWords(node, text) {
    node.replaceChildren();
    text.split(' ').forEach(function (word, i, words) {
      var outer = el('span', 'word');
      var inner = el('span', 'word__inner');
      inner.style.setProperty('--w', String(i + 2));
      inner.textContent = word;
      outer.appendChild(inner);
      node.appendChild(outer);
      if (i < words.length - 1) node.appendChild(document.createTextNode(' '));
    });
    node.classList.add('is-split');
  }

  function resultMarkup(score, honor) {
    var missed = state.results
      .map(function (result, i) { return { result: result, question: questions[i] }; })
      .filter(function (item) { return !item.result.correct; });
    var review = missed.length
      ? '<div class="quiz__review"><h4 class="quiz__review-title">Worth another look</h4><ol>' +
        missed.map(function (item) {
          var q = item.question;
          return '<li><span class="quiz__review-q">' + core.formatLatin(q.prompt) + '</span>' +
            '<span class="quiz__review-a">Answer: ' + core.formatLatin(q.options[q.answer]) + '</span></li>';
        }).join('') + '</ol></div>'
      : '<p class="quiz__perfect">Every answer correct.</p>';
    return '<div class="quiz__result">' +
      '<div class="laurel">' + laurelSvg() +
      '<p class="laurel__score" aria-hidden="true"><span class="quiz__total-num">0</span><span>of ' + total + '</span></p>' +
      '</div>' +
      '<h3 class="quiz__honor" lang="la" tabindex="-1">' + core.escapeHtml(honor.latin) + '</h3>' +
      '<p class="quiz__honor-en">' + core.escapeHtml(honor.english) + '</p>' +
      '<p class="quiz__total">' + score + ' of ' + total + ' correct' + bestNote(score) + '</p>' +
      review +
      '<button class="btn btn--ghost quiz__restart" type="button">Take the quiz again</button>' +
      '</div>';
  }

  function bestNote(score) {
    var progress = window.CuratoresProgress && window.CuratoresProgress.get();
    if (!progress || progress.quizBest === null) return '';
    if (progress.quizBest > score) return ' · your best is ' + progress.quizBest;
    return progress.quizBest === score ? ' · matches your best' : ' · a new best';
  }

  // A victor's laurel: two branches drawn round the score, leaves growing from the base up.
  function laurelSvg() {
    var cx = 100;
    var cy = 100;
    var radius = 74;
    var leavesPerSide = 7;
    var point = function (deg, r) {
      var a = (deg * Math.PI) / 180;
      return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
    };
    var start = point(108, radius);
    var end = point(248, radius);
    var leaves = [];
    for (var k = 0; k < leavesPerSide; k++) {
      var deg = 115 + (k / (leavesPerSide - 1)) * 125;
      var base = point(deg, radius);
      [deg + 55, deg + 125].forEach(function (dir) {
        var a = (dir * Math.PI) / 180;
        var x = base[0] + 9 * Math.cos(a);
        var y = base[1] + 9 * Math.sin(a);
        [[x, y, dir], [2 * cx - x, y, 180 - dir]].forEach(function (leaf) {
          // CSS rotate (not the SVG transform attribute) so it pivots on transform-origin: center.
          leaves.push('<ellipse class="laurel__leaf" style="--k:' + k + ';rotate:' + leaf[2].toFixed(1) +
            'deg" cx="' + leaf[0].toFixed(1) + '" cy="' + leaf[1].toFixed(1) + '" rx="10" ry="4.2"/>');
        });
      });
    }
    var arc = function (from, to, sweep) {
      return '<path class="laurel__stem" pathLength="1" d="M' + from[0].toFixed(1) + ' ' + from[1].toFixed(1) +
        ' A' + radius + ' ' + radius + ' 0 0 ' + sweep + ' ' + to[0].toFixed(1) + ' ' + to[1].toFixed(1) + '"/>';
    };
    return '<svg class="laurel__svg" viewBox="0 0 200 200" aria-hidden="true" focusable="false">' +
      arc(start, end, 1) + arc([2 * cx - start[0], start[1]], [2 * cx - end[0], end[1]], 0) +
      leaves.join('') + '</svg>';
  }

  function showResult() {
    state = { index: total, results: state.results, answered: true };
    var score = correctCount(state.results);
    var honor = core.honorFor(score, total);
    var markup = resultMarkup(score, honor);
    if (window.CuratoresProgress) window.CuratoresProgress.recordQuiz(score);
    ui.feedback.innerHTML = '';
    ui.feedback.className = 'quiz__feedback';
    ui.next.hidden = true;
    ui.actions.hidden = true;
    renderStatus();
    swapCard(function () {
      ui.card.innerHTML = markup;
      var honorNode = ui.card.querySelector('.quiz__honor');
      if (!reduceMotion.matches) splitIntoWords(honorNode, honor.latin);
      countUp(ui.card.querySelector('.quiz__total-num'), score);
      honorNode.focus({ preventScroll: true });
      ui.card.querySelector('.quiz__restart').addEventListener('click', restart);
    });
  }

  function restart() {
    state = { index: 0, results: [], answered: false };
    ui.actions.hidden = false;
    showQuestion(true);
  }

  ui.card.addEventListener('click', function (event) {
    var button = event.target.closest('.option');
    if (button && !button.disabled) answer(Number(button.getAttribute('data-choice')));
  });

  ui.next.addEventListener('click', function () {
    if (state.index === total - 1) {
      showResult();
      return;
    }
    state = { index: state.index + 1, results: state.results, answered: false };
    showQuestion(true);
  });

  root.addEventListener('keydown', function (event) {
    if (event.altKey || event.ctrlKey || event.metaKey || state.answered) return;
    var key = event.key.toUpperCase();
    var choice = ['1', '2', '3', '4'].indexOf(key);
    if (choice === -1) choice = KEYS.indexOf(key);
    if (choice === -1) return;
    event.preventDefault();
    answer(choice);
  });

  showQuestion(false);
})();
