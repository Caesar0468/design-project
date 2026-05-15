// content/panel.js — Side panel. Reads from cache only, never triggers analysis.
var TL_PANEL = (function() {
  'use strict';

  var _panelEl = null;
  var _currentEl = null;
  var _isDark = true;

  function _colorHex(color) {
    var map = { green: '#22c55e', yellow: '#eab308', orange: '#f97316', red: '#ef4444' };
    return map[color] || '#9ca3af';
  }

  function _riskBadge(level) {
    var map = { none: '', low: 'tl-risk-low', medium: 'tl-risk-medium', high: 'tl-risk-high' };
    return map[level] || '';
  }

  function _esc(str) {
    return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function _applyTheme() {
    if (!_panelEl) return;
    if (_isDark) {
      _panelEl.classList.add('tl-dark');
      _panelEl.classList.remove('tl-light');
    } else {
      _panelEl.classList.add('tl-light');
      _panelEl.classList.remove('tl-dark');
    }
  }

  function _buildPanel() {
    var el = document.createElement('div');
    el.id = 'tl-panel';
    el.className = 'tl-panel';
    el.setAttribute('role', 'complementary');
    el.setAttribute('aria-label', 'TrustLayer confidence analysis');
    el.innerHTML =
      '<div class="tl-panel-header">' +
        '<div class="tl-panel-brand"><span class="tl-brand-icon">&#10022;</span><span class="tl-brand-name">TrustLayer</span><span class="tl-brand-v">v3</span></div>' +
        '<div class="tl-panel-controls">' +
          '<button class="tl-theme-toggle" id="tl-theme-btn" aria-label="Toggle light/dark mode" title="Toggle light/dark mode">&#9788;</button>' +
          '<button class="tl-panel-close" aria-label="Close panel" id="tl-close-btn">&times;</button>' +
        '</div>' +
      '</div>' +
      '<div class="tl-panel-body" id="tl-panel-body">' +
        _skeletonHTML() +
      '</div>';
    document.body.appendChild(el);
    el.querySelector('#tl-close-btn').addEventListener('click', close);
    el.querySelector('#tl-theme-btn').addEventListener('click', function() {
      _isDark = !_isDark;
      _applyTheme();
    });
    requestAnimationFrame(function() {
      requestAnimationFrame(function() {
        el.classList.add('tl-panel-open');
      });
    });
    return el;
  }

  function _skeletonHTML() {
    return '<div class="tl-skeleton-wrap">' +
      '<div class="tl-skel tl-skel-score"></div>' +
      '<div class="tl-skel tl-skel-bar"></div>' +
      '<div class="tl-skel tl-skel-line"></div>' +
      '<div class="tl-skel tl-skel-line tl-skel-short"></div>' +
      '<div class="tl-skel tl-skel-line"></div>' +
      '<div class="tl-skel tl-skel-line tl-skel-short"></div>' +
    '</div>';
  }

  function _renderResult(result) {
    var color = _colorHex(result.confidence_color);
    var pct   = result.confidence;
    var steps = Array.isArray(result.reasoning_steps) ? result.reasoning_steps : [];

    var stepsHtml = steps.map(function(s, i) {
      return '<li class="tl-step"><span class="tl-step-num">' + (i+1) + '</span><span>' + _esc(s) + '</span></li>';
    }).join('');

    var riskHtml = '';
    if (result.risk_level && result.risk_level !== 'none') {
      riskHtml = '<div class="tl-risk-box ' + _riskBadge(result.risk_level) + '">' +
        '<div class="tl-risk-title">&#9888; Risk: ' + _esc(result.risk_level.toUpperCase()) + '</div>' +
        '<div class="tl-risk-reason">' + _esc(result.risk_reason) + '</div>' +
      '</div>';
    }

    var verifyHtml = '';
    if (result.should_verify) {
      verifyHtml = '<div class="tl-verify-box">' +
        '<div class="tl-verify-title">&#10003; Verify this</div>' +
        '<div class="tl-verify-text">' + _esc(result.verify_suggestion) + '</div>' +
      '</div>';
    }

    // FIX: all three Gemini label strings now consistently say "Gemini 2.0 Flash"
    var sourceLabel = result.source === 'local' ? 'Local Engine' :
                      result.source === 'local_fallback' ? 'Local Engine (API fallback)' :
                      result.source === 'gemini' ? 'Gemini 2.0 Flash' :
                      result.source === 'openai' ? 'GPT-4.1 Mini' :
                      result.source === 'anthropic' ? 'Claude Sonnet' : result.source;

    return '<div class="tl-panel-content">' +
      '<div class="tl-score-section">' +
        '<div class="tl-score-num" style="color:' + color + '">' + pct + '<span class="tl-score-pct">%</span></div>' +
        '<div class="tl-score-label" style="color:' + color + '">' + _esc(result.confidence_label) + '</div>' +
        '<div class="tl-score-bar-wrap"><div class="tl-score-bar" style="width:' + pct + '%;background:' + color + '"></div></div>' +
        '<div class="tl-score-type">' + _esc(result.question_type.replace(/_/g,' ')) + '</div>' +
      '</div>' +
      '<div class="tl-summary">' + _esc(result.plain_english_summary) + '</div>' +
      '<div class="tl-section-label">How we scored this</div>' +
      '<ol class="tl-steps">' + stepsHtml + '</ol>' +
      '<div class="tl-section-label">What the AI didn\'t know</div>' +
      '<div class="tl-gaps">' + _esc(result.what_ai_didnt_know) + '</div>' +
      riskHtml +
      verifyHtml +
      '<div class="tl-source-label">Analyzed by: ' + _esc(sourceLabel) + '</div>' +
    '</div>';
  }

  function open(outputEl) {
    _currentEl = outputEl;

    if (!_panelEl || !document.body.contains(_panelEl)) {
      _panelEl = _buildPanel();
    } else {
      _panelEl.classList.add('tl-panel-open');
    }

    _applyTheme();

    var body = document.getElementById('tl-panel-body');
    if (!body) return;

    var cached = TL_CACHE.get(outputEl);

    if (cached && cached.status === 'ready') {
      body.innerHTML = _renderResult(cached.result);
    } else if (cached && cached.status === 'error') {
      body.innerHTML = '<div class="tl-error-msg">Analysis failed. ' + _esc(cached.error || '') + '</div>';
    } else {
      body.innerHTML = _skeletonHTML();
      TL_CACHE.onReady(outputEl, function(result, err) {
        if (_currentEl !== outputEl) return;
        var b = document.getElementById('tl-panel-body');
        if (!b) return;
        if (err || !result) {
          b.innerHTML = '<div class="tl-error-msg">Analysis failed: ' + _esc(err || 'unknown error') + '</div>';
        } else {
          b.innerHTML = _renderResult(result);
        }
      });
    }
  }

  function close() {
    if (_panelEl) {
      _panelEl.classList.remove('tl-panel-open');
    }
  }

  return { open: open, close: close };
})();