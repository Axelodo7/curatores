/* Shared behaviour: header state, mobile menu, headline split, scroll reveals. */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var HIDE_AFTER_PX = 320;
  var SCROLL_JITTER_PX = 6;

  function initHeader() {
    var header = document.querySelector('[data-header]');
    if (!header) return;

    var lastY = window.scrollY;
    var queued = false;

    function update() {
      var y = window.scrollY;
      header.classList.toggle('is-scrolled', y > 24);
      if (Math.abs(y - lastY) > SCROLL_JITTER_PX) {
        var goingDown = y > lastY && y > HIDE_AFTER_PX;
        header.classList.toggle('is-hidden', goingDown && !root.classList.contains('menu-open'));
        lastY = y;
      }
      queued = false;
    }

    window.addEventListener('scroll', function () {
      if (queued) return;
      queued = true;
      requestAnimationFrame(update);
    }, { passive: true });

    header.addEventListener('focusin', function () {
      header.classList.remove('is-hidden');
    });
    update();
  }

  function initMenu() {
    var button = document.querySelector('[data-menu-button]');
    var menu = document.querySelector('[data-menu]');
    if (!button || !menu) return;

    var label = button.querySelector('.menu-button__label');
    var links = Array.prototype.slice.call(menu.querySelectorAll('a'));

    function setOpen(open) {
      button.setAttribute('aria-expanded', String(open));
      label.textContent = open ? 'Close' : 'Menu';
      root.classList.toggle('menu-open', open);
      if (open) {
        menu.hidden = false;
        requestAnimationFrame(function () {
          menu.classList.add('is-open');
        });
        links[0].focus();
      } else {
        menu.classList.remove('is-open');
        menu.hidden = true;
      }
    }

    button.addEventListener('click', function () {
      setOpen(button.getAttribute('aria-expanded') !== 'true');
    });

    links.forEach(function (link) {
      link.addEventListener('click', function () {
        setOpen(false);
      });
    });

    document.addEventListener('keydown', function (event) {
      if (!root.classList.contains('menu-open')) return;
      if (event.key === 'Escape') {
        setOpen(false);
        button.focus();
        return;
      }
      if (event.key !== 'Tab') return;
      // Keep focus inside the open menu: the toggle button plus the links.
      var focusables = [button].concat(links);
      var first = focusables[0];
      var last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });

    window.matchMedia('(min-width: 48rem)').addEventListener('change', function (query) {
      if (query.matches && root.classList.contains('menu-open')) setOpen(false);
    });
  }

  function splitWords(el) {
    var text = el.textContent.trim();
    var words = text.split(/\s+/);
    el.setAttribute('aria-label', text);
    el.textContent = '';
    words.forEach(function (word, index) {
      var outer = document.createElement('span');
      var inner = document.createElement('span');
      outer.className = 'word';
      outer.setAttribute('aria-hidden', 'true');
      inner.className = 'word__inner';
      inner.style.setProperty('--w', String(index));
      inner.textContent = word;
      outer.appendChild(inner);
      el.appendChild(outer);
      if (index < words.length - 1) el.appendChild(document.createTextNode(' '));
    });
    el.classList.add('is-split');
  }

  function initSplit() {
    if (reduceMotion.matches) return;
    document.querySelectorAll('[data-split]').forEach(splitWords);
  }

  function initReveal() {
    var items = document.querySelectorAll('[data-reveal]');
    if (!('IntersectionObserver' in window) || reduceMotion.matches) {
      items.forEach(function (el) { el.classList.add('is-in'); });
      return;
    }
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0 });
    items.forEach(function (el) { observer.observe(el); });
  }

  // Home page: the header logo appears once the hero scroll has left the viewport.
  function initBrandReveal() {
    var header = document.querySelector('.site-header--home');
    var heroLogo = document.querySelector('[data-hero-logo]');
    if (!header || !heroLogo) return;
    if (!('IntersectionObserver' in window)) {
      header.classList.add('show-brand');
      return;
    }
    new IntersectionObserver(function (entries) {
      header.classList.toggle('show-brand', !entries[0].isIntersecting);
    }, { rootMargin: '-72px 0px 0px 0px' }).observe(heroLogo);
  }

  function initYear() {
    document.querySelectorAll('[data-year]').forEach(function (el) {
      el.textContent = String(new Date().getFullYear());
    });
  }

  initHeader();
  initMenu();
  initSplit();
  initReveal();
  initBrandReveal();
  initYear();
})();
