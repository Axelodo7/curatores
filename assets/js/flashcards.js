/* Vocabulary flashcards: flip, filter by word type, and count the cards seen. */
(function () {
  'use strict';

  var root = document.querySelector('[data-flashcards]');
  if (!root) return;

  var cards = Array.prototype.slice.call(root.querySelectorAll('.flashcard'));
  var items = cards.map(function (card) { return card.closest('li'); });
  var filters = Array.prototype.slice.call(root.querySelectorAll('[data-filter]'));
  var flipAll = root.querySelector('[data-flip-all]');
  var flipAllText = root.querySelector('[data-flip-all-text]');
  var seenCount = root.querySelector('[data-seen-count]');
  var seenMeter = root.querySelector('[data-seen-meter]');
  var seen = new Set();

  function isFlipped(card) {
    return card.getAttribute('aria-pressed') === 'true';
  }

  function visibleCards() {
    return cards.filter(function (card, i) { return !items[i].hidden; });
  }

  function updateFlipAll() {
    var everyFlipped = visibleCards().every(isFlipped);
    flipAllText.textContent = everyFlipped ? 'Reset cards' : 'Flip all';
  }

  function updateSeen() {
    seenCount.textContent = String(seen.size);
    seenMeter.style.setProperty('--seen', String(seen.size / cards.length));
    if (seen.size === cards.length && window.CuratoresProgress) {
      window.CuratoresProgress.markPart('vocabulary');
    }
  }

  function setFlipped(card, flipped) {
    card.setAttribute('aria-pressed', String(flipped));
    card.querySelector('.flashcard__back').setAttribute('aria-hidden', String(!flipped));
    if (flipped && !seen.has(card)) {
      seen.add(card);
      card.classList.add('is-seen');
      updateSeen();
    }
  }

  function applyFilter(group) {
    filters.forEach(function (button) {
      button.setAttribute('aria-pressed', String(button.getAttribute('data-filter') === group));
    });
    var shown = 0;
    items.forEach(function (item) {
      var match = group === 'all' || item.getAttribute('data-group') === group;
      item.hidden = !match;
      if (match) {
        item.style.setProperty('--i', String(shown));
        shown += 1;
      }
    });
    updateFlipAll();
  }

  cards.forEach(function (card) {
    card.addEventListener('click', function () {
      setFlipped(card, !isFlipped(card));
      updateFlipAll();
    });
  });

  filters.forEach(function (button) {
    button.addEventListener('click', function () {
      applyFilter(button.getAttribute('data-filter'));
    });
  });

  flipAll.addEventListener('click', function () {
    var target = !visibleCards().every(isFlipped);
    visibleCards().forEach(function (card, i) {
      // A short cascade so the cards turn one after another.
      setTimeout(function () { setFlipped(card, target); }, i * 35);
    });
    setTimeout(updateFlipAll, visibleCards().length * 35 + 10);
  });

  items.forEach(function (item, i) { item.style.setProperty('--i', String(i)); });
  updateSeen();
})();
