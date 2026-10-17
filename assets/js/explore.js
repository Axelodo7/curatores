/*
  Word explorer: English words set over their Latin roots, the shared stem
  aligned and highlighted. Tours on its own until the visitor picks a word.
*/
(function () {
  'use strict';

  var PAIRS = Object.freeze([
    { en: ['', 'ocul', 'ar'], la: ['', 'ocul', 'us'], word: 'oculus', gloss: 'eye', tag: 'Etymology · Medicine' },
    { en: ['', 'manu', 'al'], la: ['', 'manu', 's'], word: 'manus', gloss: 'hand', tag: 'Etymology · Medicine' },
    { en: ['', 'cerebr', 'al'], la: ['', 'cerebr', 'um'], word: 'cerebrum', gloss: 'brain', tag: 'Etymology · Medicine' },
    { en: ['', 'mater', 'nal'], la: ['', 'mater', ''], word: 'mater', gloss: 'mother', tag: 'Vocabulary · Nouns' },
    { en: ['', 'puer', 'ile'], la: ['', 'puer', ''], word: 'puer', gloss: 'boy', tag: 'Vocabulary · Nouns' },
    { en: ['', 'irat', 'e'], la: ['', 'irat', 'us'], word: 'iratus', gloss: 'angry', tag: 'Vocabulary · Adjectives' },
    { en: ['', 'aud', 'ience'], la: ['', 'aud', 'it'], word: 'audit', gloss: 'hears', tag: 'Vocabulary · Verbs' },
    { en: ['', 'vid', 'eo'], la: ['', 'vid', 'et'], word: 'videt', gloss: 'sees', tag: 'Vocabulary · Verbs' },
    { en: ['', 'dormit', 'ory'], la: ['', 'dormit', ''], word: 'dormit', gloss: 'sleeps', tag: 'Vocabulary · Verbs' },
    { en: ['ad', 'ven', 't'], la: ['', 'ven', 'it'], word: 'venit', gloss: 'comes', tag: 'Vocabulary · Verbs' }
  ]);

  var HOLD_MS = 3800;
  var ENTER_MS = 700;
  var STAGGER_MS = 30;
  var MAX_FONT_PX = 120;
  var MIN_FONT_PX = 38;
  var EASE = 'cubic-bezier(0.22, 0.8, 0.2, 1)';
  var ENTER = [{ transform: 'translateY(108%)', opacity: 0 }, { transform: 'translateY(0)', opacity: 1 }];
  var EXIT = [{ transform: 'translateY(0)', opacity: 1 }, { transform: 'translateY(-108%)', opacity: 0 }];

  var root = document.querySelector('[data-explore]');
  if (!root) return;

  var list = root.querySelector('[data-explore-list]');
  var panel = root.querySelector('[data-explore-panel]');
  var grid = root.querySelector('[data-explore-grid]');
  var meta = root.querySelector('.explore__meta');
  var meaning = root.querySelector('[data-explore-meaning]');
  var tag = root.querySelector('[data-explore-tag]');
  var srText = root.querySelector('[data-explore-sr]');
  var timer = root.querySelector('[data-explore-timer]');
  var toggle = root.querySelector('[data-explore-toggle]');
  var toggleIcon = root.querySelector('[data-explore-toggle-icon]');
  var toggleText = root.querySelector('[data-explore-toggle-text]');
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  var index = 0;
  var generation = 0;
  var hold = null;
  var flags = { user: false, hover: false, focus: false, offscreen: true };
  var tabs = PAIRS.map(buildTab);

  function english(pair) {
    return pair.en.join('');
  }

  function buildTab(pair, i) {
    var tab = document.createElement('button');
    tab.type = 'button';
    tab.className = 'explore__word';
    tab.id = 'explore-tab-' + i;
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-controls', panel.id);
    var word = document.createElement('span');
    word.textContent = english(pair);
    var hint = document.createElement('span');
    hint.className = 'explore__hint';
    hint.textContent = pair.gloss;
    tab.append(word, hint);
    tab.addEventListener('click', function () { choose(i, false); });
    tab.addEventListener('keydown', onTabKey);
    list.appendChild(tab);
    return tab;
  }

  function onTabKey(event) {
    var current = tabs.indexOf(event.currentTarget);
    var last = tabs.length - 1;
    var next = null;
    if (event.key === 'ArrowDown' || event.key === 'ArrowRight') next = current === last ? 0 : current + 1;
    if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') next = current === 0 ? last : current - 1;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = last;
    if (next === null) return;
    event.preventDefault();
    choose(next, true);
  }

  function markSelected(i) {
    tabs.forEach(function (tab, j) {
      var on = i === j;
      tab.setAttribute('aria-selected', String(on));
      tab.tabIndex = on ? 0 : -1;
    });
    panel.setAttribute('aria-labelledby', tabs[i].id);
    // Keep the active chip in view on the horizontal phone layout, without moving the page.
    var tab = tabs[i];
    if (list.scrollWidth > list.clientWidth) {
      list.scrollTo({ left: tab.offsetLeft - list.clientWidth / 2 + tab.offsetWidth / 2, behavior: 'smooth' });
    }
  }

  function cell(row, part, text) {
    var span = document.createElement('span');
    span.className = 'explore__cell explore__' + part;
    span.setAttribute('data-row', row);
    Array.prototype.forEach.call(text, function (ch) {
      var letter = document.createElement('span');
      letter.className = 'explore__ch';
      letter.textContent = ch;
      span.appendChild(letter);
    });
    return span;
  }

  function label(text, row) {
    var span = document.createElement('span');
    span.className = 'explore__label';
    span.style.gridRow = String(row);
    span.textContent = text;
    return span;
  }

  function render(pair) {
    var frame = document.createElement('span');
    frame.className = 'explore__frame';
    grid.classList.remove('is-framed');
    grid.replaceChildren(
      frame,
      label('English', 1), cell('en', 'pre', pair.en[0]), cell('en', 'stem', pair.en[1]), cell('en', 'suf', pair.en[2]),
      label('Latin', 2), cell('la', 'pre', pair.la[0]), cell('la', 'stem', pair.la[1]), cell('la', 'suf', pair.la[2])
    );
    grid.classList.add('is-live');

    var latin = document.createElement('i');
    latin.lang = 'la';
    latin.textContent = pair.word;
    var gloss = document.createElement('b');
    gloss.textContent = '“' + pair.gloss + '”';
    meaning.replaceChildren(latin, document.createTextNode(' means '), gloss);
    tag.textContent = pair.tag;
    var word = english(pair);
    srText.textContent = word.charAt(0).toUpperCase() + word.slice(1) + ' comes from the Latin ' +
      pair.word + ', which means ' + pair.gloss + '.';
  }

  // One font size for every pair, so the words don't jump in size as they change.
  function fit() {
    var context = document.createElement('canvas').getContext('2d');
    context.font = '100px ' + getComputedStyle(grid).fontFamily;
    var width = function (text) { return context.measureText(text).width; };
    var widest = PAIRS.reduce(function (max, pair) {
      return Math.max(max, Math.max(width(pair.en[0]), width(pair.la[0])) + width(pair.en[1]) +
        Math.max(width(pair.en[2]), width(pair.la[2])));
    }, 0);
    var labelWidth = grid.querySelector('.explore__label').getBoundingClientRect().width;
    var available = grid.parentElement.clientWidth - labelWidth;
    var size = Math.min(MAX_FONT_PX, Math.max(MIN_FONT_PX, (available / widest) * 100 * 0.94));
    grid.style.fontSize = size + 'px';
  }

  function play(nodes, keyframes, duration, stagger, startDelay) {
    return Promise.all(Array.prototype.map.call(nodes, function (node, i) {
      return node.animate(keyframes, {
        duration: duration,
        delay: (startDelay || 0) + i * stagger,
        easing: EASE,
        fill: 'both'
      }).finished;
    })).catch(function () { /* cancelled by a newer render */ });
  }

  function letters(row) {
    return grid.querySelectorAll('[data-row="' + row + '"] .explore__ch');
  }

  function isPaused() {
    return flags.user || flags.hover || flags.focus || flags.offscreen || document.hidden;
  }

  function syncPause() {
    if (!hold) return;
    if (isPaused()) hold.pause();
    else hold.play();
  }

  function runHold() {
    if (hold) hold.cancel();
    hold = timer.animate([{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], { duration: HOLD_MS, fill: 'both' });
    syncPause();
    return hold.finished.catch(function () { /* cancelled by a newer choice */ });
  }

  async function present(i, gen) {
    markSelected(i);
    render(PAIRS[i]);
    meta.classList.remove('is-in');
    if (reduceMotion.matches) {
      grid.classList.add('is-framed');
      meta.classList.add('is-in');
      return;
    }
    var englishLetters = letters('en');
    var englishMs = ENTER_MS + (englishLetters.length - 1) * STAGGER_MS;
    var latinRun = play(letters('la'), ENTER, ENTER_MS, STAGGER_MS, englishMs + 120);
    await play(englishLetters, ENTER, ENTER_MS, STAGGER_MS);
    if (gen !== generation) return;
    grid.classList.add('is-framed');
    await latinRun;
    if (gen !== generation) return;
    meta.classList.add('is-in');
  }

  async function dismiss() {
    if (reduceMotion.matches) return;
    grid.classList.remove('is-framed');
    meta.classList.remove('is-in');
    await play(grid.querySelectorAll('.explore__ch'), EXIT, 420, 12);
  }

  async function tour() {
    generation += 1;
    var gen = generation;
    for (;;) {
      await present(index, gen);
      if (gen !== generation) return;
      await runHold();
      if (gen !== generation) return;
      await dismiss();
      if (gen !== generation) return;
      index = (index + 1) % PAIRS.length;
    }
  }

  function setUserPaused(paused) {
    flags.user = paused;
    toggleText.textContent = paused ? 'Play' : 'Pause';
    toggleIcon.setAttribute('href', paused ? '#i-play' : '#i-pause');
    toggle.setAttribute('aria-label', paused ? 'Play the word tour' : 'Pause the word tour');
    syncPause();
  }

  // Picking a word stops the tour; the play button restarts it from there.
  function choose(i, focus) {
    index = i;
    setUserPaused(true);
    if (focus) tabs[i].focus();
    tour();
  }

  toggle.addEventListener('click', function () {
    setUserPaused(!flags.user);
  });

  root.addEventListener('pointerenter', function () { flags.hover = true; syncPause(); });
  root.addEventListener('pointerleave', function () { flags.hover = false; syncPause(); });
  root.addEventListener('focusin', function (event) {
    flags.focus = event.target !== toggle;
    syncPause();
  });
  root.addEventListener('focusout', function (event) {
    if (!root.contains(event.relatedTarget)) {
      flags.focus = false;
      syncPause();
    }
  });
  document.addEventListener('visibilitychange', syncPause);

  var resizeFrame = 0;
  window.addEventListener('resize', function () {
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(fit);
  });

  markSelected(0);
  document.fonts.ready.then(function () {
    fit();
    var started = false;
    new IntersectionObserver(function (entries) {
      flags.offscreen = !entries[0].isIntersecting;
      if (!flags.offscreen && !started) {
        started = true;
        tour();
      }
      syncPause();
    }, { threshold: 0.35 }).observe(panel);
  });
})();
