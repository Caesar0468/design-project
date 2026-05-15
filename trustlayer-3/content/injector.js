// content/injector.js — MutationObserver orchestrator. Ties everything together.
(function () {
  'use strict';

  var _config = TL_DETECTOR.getCurrentConfig();
  if (!_config) return; // Not a supported site

  var _processed = new WeakMap(); // element → last text length analyzed
  var _debounceTimer = null;

  function _requestAnalysis(outputEl, query) {
    TL_CACHE.initPending(outputEl);

    var timedOut = false;
    var timeoutId = setTimeout(function() {
      timedOut = true;
      TL_CACHE.reject(outputEl, 'Analysis timed out. Background script may have been suspended.');
    }, 15000);

    chrome.runtime.sendMessage({
      type: TL_CONSTANTS.MESSAGES.ANALYZE_REQUEST,
      query: query,
      responseText: outputEl.textContent || ''
    }, function (response) {
      clearTimeout(timeoutId);
      if (timedOut) return;
      if (chrome.runtime.lastError) {
        TL_CACHE.reject(outputEl, chrome.runtime.lastError.message);
        return;
      }
      if (!response || !response.ok) {
        TL_CACHE.reject(outputEl, (response && response.error) || 'Unknown error');
        return;
      }
      TL_CACHE.resolve(outputEl, response.result);
    });
  }

  function _getQueryForElement(outputEl) {
    var userMsgSelectors = [
      '[data-message-author-role="user"] p',
      '[data-message-author-role="user"] div',
      '.human-turn p',
      '[class*="user-message"] p',
      '.HumanTurn p',
      'user-query .query-text',
      'user-query p',
      '.user-message p',
      '[class*="UserMessage"] p'
    ];

    for (var s = 0; s < userMsgSelectors.length; s++) {
      var allUserMsgs = document.querySelectorAll(userMsgSelectors[s]);
      if (allUserMsgs.length > 0) {
        var best = null;
        for (var i = 0; i < allUserMsgs.length; i++) {
          var rel = outputEl.compareDocumentPosition(allUserMsgs[i]);
          if (rel & 2) { best = allUserMsgs[i]; } // PRECEDING
        }
        if (best) return best.textContent.trim();
        return allUserMsgs[allUserMsgs.length - 1].textContent.trim();
      }
    }

    try {
      var inputEl = document.querySelector(_config.inputSelector);
      if (inputEl) return (inputEl.value || inputEl.textContent || '').trim();
    } catch (e) {}
    return '';
  }

  function _processOutputEl(outputEl) {
    var text = outputEl.textContent || '';
    // FIX: lowered threshold from 50 to 20 — short answers like "Yes, because..."
    // were silently skipped and never got a badge
    if (text.trim().length < 20) return;

    var lastLen = _processed.get(outputEl) || 0;
    if (Math.abs(text.length - lastLen) < 20 && lastLen > 0) return;

    _processed.set(outputEl, text.length);

    var query = _getQueryForElement(outputEl);

    TL_BADGE.inject(outputEl, function (el) {
      TL_PANEL.open(el);
    });

    _requestAnalysis(outputEl, query);
  }

  function _scanForOutputs() {
    if (!_config.outputSelector) return;
    var selectors = _config.outputSelector.split(',');
    for (var s = 0; s < selectors.length; s++) {
      var els;
      try { els = document.querySelectorAll(selectors[s].trim()); } catch (e) { continue; }
      for (var i = 0; i < els.length; i++) {
        _processOutputEl(els[i]);
      }
    }
  }

  function _debouncedScan() {
    clearTimeout(_debounceTimer);
    _debounceTimer = setTimeout(_scanForOutputs, 600);
  }

  _scanForOutputs();

  var observeTarget = null;
  var observeSelectors = (_config.observeSelector || 'body').split(',');
  for (var i = 0; i < observeSelectors.length; i++) {
    try {
      observeTarget = document.querySelector(observeSelectors[i].trim());
      if (observeTarget) break;
    } catch (e) { }
  }
  if (!observeTarget) observeTarget = document.body;

  var observer = new MutationObserver(function (mutations) {
    var relevant = false;
    for (var i = 0; i < mutations.length; i++) {
      var m = mutations[i];
      if (m.type === 'childList' && m.addedNodes.length > 0) { relevant = true; break; }
      if (m.type === 'attributes') { relevant = true; break; }
    }
    if (relevant) _debouncedScan();
  });

  observer.observe(observeTarget, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-is-streaming'] });

  TL_CONFIRMER.init(_config);

  // FIX: guard pushState patch so it only wraps once, even if the content script
  // reinjects (e.g. Firefox tab restore). Without this, multiple wrappers stack and
  // TL_PANEL.close() fires multiple times per navigation.
  var _lastUrl = window.location.href;
  (function _watchNavigation() {
    if (history._tlPatched) return;
    history._tlPatched = true;
    var orig = history.pushState;
    history.pushState = function() {
      orig.apply(this, arguments);
      if (window.location.href !== _lastUrl) {
        _lastUrl = window.location.href;
        TL_PANEL.close();
      }
    };
    window.addEventListener('popstate', function() {
      TL_PANEL.close();
    });
  })();

})();