// content/confirmer.js — Guards critical destructive actions (delete/clear/reset buttons)
var TL_CONFIRMER = (function() {
  'use strict';

  var _config = null;
  var _active = false;

  var SCOPE_SELECTORS = [
    'nav', '[class*="sidebar"]', '[class*="Sidebar"]',
    '[class*="conversation-list"]', '[class*="history"]',
    '[class*="thread-list"]', '[aria-label*="conversation"]',
    '[aria-label*="Conversation"]', '[data-testid*="conversation"]'
  ];

  function _isInConversationScope(el) {
    for (var i = 0; i < SCOPE_SELECTORS.length; i++) {
      try {
        if (el.closest(SCOPE_SELECTORS[i])) return true;
      } catch(e) {}
    }
    return false;
  }

  function _isCriticalButton(el) {
    if (!_config || !_config.criticalKeywords) return false;
    var text = (el.textContent || el.value || el.getAttribute('aria-label') || '').toLowerCase().trim();
    for (var i = 0; i < _config.criticalKeywords.length; i++) {
      if (text.indexOf(_config.criticalKeywords[i].toLowerCase()) !== -1) {
        return _isInConversationScope(el);
      }
    }
    return false;
  }

  function _triggerClick(btn) {
    // FIX: ChatGPT and other React SPAs use synthetic events — a plain .click() may
    // not fire the React onClick handler. Dispatch a real bubbling MouseEvent first,
    // then fall back to .click() so native buttons are also covered.
    try {
      btn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    } catch(e) {
      btn.click();
    }
  }

  function _showGuard(originalBtn) {
    var existing = document.getElementById('tl-confirm-guard');
    if (existing) existing.remove();

    var overlay = document.createElement('div');
    overlay.id = 'tl-confirm-guard';
    overlay.className = 'tl-confirm-overlay';
    overlay.innerHTML =
      '<div class="tl-confirm-dialog" role="alertdialog" aria-modal="true">' +
        '<div class="tl-confirm-icon">&#9888;</div>' +
        '<div class="tl-confirm-title">Confirm Action</div>' +
        '<div class="tl-confirm-msg">This will delete or clear your conversation. Are you sure?</div>' +
        '<div class="tl-confirm-btns">' +
          '<button class="tl-confirm-cancel" id="tl-guard-cancel">Cancel</button>' +
          '<button class="tl-confirm-proceed" id="tl-guard-proceed">Yes, proceed</button>' +
        '</div>' +
      '</div>';

    document.body.appendChild(overlay);

    document.getElementById('tl-guard-cancel').addEventListener('click', function() {
      overlay.remove();
    });
    document.getElementById('tl-guard-proceed').addEventListener('click', function() {
      overlay.remove();
      _active = false;
      _triggerClick(originalBtn);
      setTimeout(function() { _active = true; }, 300);
    });

    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) overlay.remove();
    });
  }

  function init(siteConfig) {
    _config = siteConfig;
    _active = true;
    document.addEventListener('click', function(e) {
      if (!_active) return;
      var target = e.target;
      for (var depth = 0; depth < 4; depth++) {
        if (!target || target === document.body) break;
        if ((target.tagName === 'BUTTON' || target.tagName === 'A' || target.getAttribute('role') === 'button') && _isCriticalButton(target)) {
          e.preventDefault();
          e.stopImmediatePropagation();
          _showGuard(target);
          return;
        }
        target = target.parentElement;
      }
    }, true);
  }

  return { init: init };
})();