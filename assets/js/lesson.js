/* Lesson page: reading progress, contents scrollspy, and tabbed explorers (cases, etymology). */
(function () {
  'use strict';

  function initReadingProgress() {
    var bar = document.querySelector('[data-read-progress]');
    if (!bar) return;
    var queued = false;

    function update() {
      var scrollable = document.documentElement.scrollHeight - window.innerHeight;
      var ratio = scrollable > 0 ? Math.min(1, window.scrollY / scrollable) : 0;
      bar.style.transform = 'scaleX(' + ratio.toFixed(4) + ')';
      queued = false;
    }

    function queue() {
      if (queued) return;
      queued = true;
      requestAnimationFrame(update);
    }

    window.addEventListener('scroll', queue, { passive: true });
    window.addEventListener('resize', queue);
    update();
  }

  function initScrollSpy() {
    var links = Array.prototype.slice.call(document.querySelectorAll('[data-toc-link]'));
    var targets = Array.prototype.slice.call(document.querySelectorAll('[data-spy]'));
    if (!links.length || !('IntersectionObserver' in window)) return;

    function activate(id) {
      links.forEach(function (link) {
        var on = link.getAttribute('href') === '#' + id;
        link.classList.toggle('is-active', on);
        if (on) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
    }

    var visible = new Set();
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) visible.add(entry.target);
        else visible.delete(entry.target);
      });
      var current = targets.filter(function (t) { return visible.has(t); }).pop();
      if (current) activate(current.id);
    }, { rootMargin: '-35% 0px -55% 0px' });

    targets.forEach(function (target) { observer.observe(target); });
  }

  /*
    Tabs with arrow-key support. Options read from the root element:
    data-track="<part>"   marks that chapter part done once every tab has been viewed
    [data-tab-indicator]  a sliding highlight placed under the selected tab
    [data-case-form]      items highlighted in step with the selected tab
  */
  function initTabs(root) {
    var tabs = Array.prototype.slice.call(root.querySelectorAll('[role="tab"]'));
    var list = tabs[0].parentElement;
    var panels = tabs.map(function (tab) { return document.getElementById(tab.getAttribute('aria-controls')); });
    var indicator = root.querySelector('[data-tab-indicator]');
    var forms = root.querySelectorAll('[data-case-form]');
    var track = root.getAttribute('data-track');
    var viewed = new Set();
    var selected = 0;

    panels.forEach(function (panel) {
      panel.querySelectorAll('.root').forEach(function (item, i) {
        item.style.setProperty('--i', String(i));
      });
    });

    function placeIndicator() {
      if (!indicator) return;
      var tab = tabs[selected];
      indicator.style.setProperty('--x', tab.offsetLeft + 'px');
      indicator.style.setProperty('--w', tab.offsetWidth + 'px');
    }

    function noteViewed(i) {
      viewed.add(i);
      if (track && viewed.size === tabs.length && window.CuratoresProgress) {
        window.CuratoresProgress.markPart(track);
      }
    }

    function select(next, options) {
      selected = next;
      tabs.forEach(function (tab, i) {
        var on = i === next;
        tab.setAttribute('aria-selected', String(on));
        tab.tabIndex = on ? 0 : -1;
        panels[i].hidden = !on;
      });
      forms.forEach(function (form, i) { form.classList.toggle('is-current', i === next); });
      placeIndicator();
      if (options.animate) {
        var panel = panels[next];
        panel.classList.remove('is-entering');
        void panel.offsetWidth; // restart the entrance animation
        panel.classList.add('is-entering');
      }
      if (options.focus) tabs[next].focus();
      if (list.scrollWidth > list.clientWidth) {
        var tab = tabs[next];
        list.scrollTo({ left: tab.offsetLeft - list.clientWidth / 2 + tab.offsetWidth / 2, behavior: 'smooth' });
      }
      if (options.count) noteViewed(next);
    }

    tabs.forEach(function (tab, i) {
      tab.addEventListener('click', function () {
        select(i, { animate: true, focus: false, count: true });
      });
      tab.addEventListener('keydown', function (event) {
        var last = tabs.length - 1;
        var target = null;
        if (event.key === 'ArrowRight' || event.key === 'ArrowDown') target = i === last ? 0 : i + 1;
        if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') target = i === 0 ? last : i - 1;
        if (event.key === 'Home') target = 0;
        if (event.key === 'End') target = last;
        if (target === null) return;
        event.preventDefault();
        select(target, { animate: true, focus: true, count: true });
      });
    });

    window.addEventListener('resize', placeIndicator);
    document.fonts.ready.then(placeIndicator);
    select(0, { animate: false, focus: false, count: false });

    // The first tab counts as viewed once the explorer is actually on screen.
    if ('IntersectionObserver' in window) {
      var seen = new IntersectionObserver(function (entries) {
        if (!entries[0].isIntersecting) return;
        noteViewed(selected);
        placeIndicator();
        seen.disconnect();
      }, { threshold: 0.3 });
      seen.observe(root);
    }
  }

  initReadingProgress();
  initScrollSpy();
  document.querySelectorAll('[data-tabs]').forEach(initTabs);
})();
