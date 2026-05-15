// content/badge.js — Renders inline confidence badge, reads from cache. Never triggers new analysis.
var TL_BADGE = (function() {
  'use strict';

  var _idCounter = 0;

  function _makeId() {
    return 'tl-' + Date.now() + '-' + (++_idCounter);
  }

  function _colorClass(color) {
    var map = { green: 'tl-tag-green', yellow: 'tl-tag-yellow', orange: 'tl-tag-orange', red: 'tl-tag-red' };
    return map[color] || 'tl-tag-grey';
  }

  function inject(outputEl, onWhyClick) {
    // Remove existing badge so we can re-inject with fresh cache listener on re-analysis
    var existing = outputEl.querySelector('.tl-badge');
    if (existing) existing.remove();

    var id = _makeId();
    var badge = document.createElement('div');
    badge.className = 'tl-badge';
    badge.setAttribute('data-tl-id', id);
    badge.innerHTML =
      '<button class="tl-why-btn" type="button" aria-label="Why this confidence score?">&#10022; Why this?</button>' +
      '<span class="tl-tag tl-tag-loading" aria-live="polite">' +
        '<span class="tl-tag-dot"></span>' +
        '<span class="tl-tag-text">Analyzing\u2026</span>' +
      '</span>';

    outputEl.appendChild(badge);

    var tagEl  = badge.querySelector('.tl-tag');
    var dotEl  = badge.querySelector('.tl-tag-dot');
    var textEl = badge.querySelector('.tl-tag-text');
    var whyBtn = badge.querySelector('.tl-why-btn');

    whyBtn.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      if (typeof onWhyClick === 'function') onWhyClick(outputEl, id);
    });

    TL_CACHE.onReady(outputEl, function(result, err) {
      if (err || !result) {
        tagEl.className = 'tl-tag tl-tag-error';
        textEl.textContent = 'Error';
        return;
      }
      var colorClass = _colorClass(result.confidence_color);
      tagEl.className = 'tl-tag ' + colorClass;
      tagEl.classList.remove('tl-tag-loading');
      dotEl.style.background = '';
      textEl.textContent = result.confidence + '% \u2014 ' + result.confidence_label;
      tagEl.setAttribute('title', result.plain_english_summary || '');
    });

    return badge;
  }

  return { inject: inject };
})();
