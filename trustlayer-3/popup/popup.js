// popup/popup.js — TrustLayer v3 Logic
(function() {
  'use strict';

  var _currentProvider = TL_CONSTANTS.PROVIDERS.LOCAL;

  var KEY_PATTERNS = {
    // Relaxed for modern 2026 API keys
    gemini: /^AIza[0-9A-Za-z_-]{20,}$/,
    openai: /^sk-[a-zA-Z0-9_-]{20,}$/,
    anthropic: /^sk-ant-[a-zA-Z0-9_-]{20,}$/
  };

  // ── DOM refs ──────────────────────────────────────────────────────────────
  function el(id) { return document.getElementById(id); }

  var statusDot = el('status-dot');
  var statusLabel = el('status-label');
  var providerGrid = el('provider-grid');
  var localInfo = el('local-info');
  var geminiSection = el('gemini-key-section');
  var openaiSection = el('openai-key-section');
  var anthropicSection = el('anthropic-key-section');
  var geminiInput = el('gemini-key');
  var openaiInput = el('openai-key');
  var anthropicInput = el('anthropic-key');
  var saveBtn = el('save-btn');
  var errorMsg = el('error-msg');
  var saveConfirm = el('save-confirm');

  // ── Load saved settings ───────────────────────────────────────────────────
  TL_STORAGE.getProviderSettings().then(function(settings) {
    _currentProvider = settings.provider || TL_CONSTANTS.PROVIDERS.LOCAL;
    if (geminiInput && settings.geminiKey) geminiInput.value = settings.geminiKey;
    if (openaiInput && settings.openaiKey) openaiInput.value = settings.openaiKey;
    if (anthropicInput && settings.anthropicKey) anthropicInput.value = settings.anthropicKey;
    _updateUI(_currentProvider);
  }).catch(function(e) {
    console.error('[TrustLayer popup] Load error:', e);
    _updateUI(TL_CONSTANTS.PROVIDERS.LOCAL);
  });

  // ── Provider card clicks ──────────────────────────────────────────────────
  if (providerGrid) {
    providerGrid.addEventListener('click', function(e) {
      var card = e.target.closest('.provider-card');
      if (!card) return;
      var provider = card.getAttribute('data-provider');
      if (!provider) return;
      _currentProvider = provider;
      _updateUI(provider);
      _hideError();
      _hideConfirm();
    });
  }

  // ── Show/hide key toggle ──────────────────────────────────────────────────
  document.querySelectorAll('.key-toggle').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var targetId = btn.getAttribute('data-target');
      var input = el(targetId);
      if (!input) return;
      if (input.type === 'password') {
        input.type = 'text';
        btn.textContent = '🙈';
      } else {
        input.type = 'password';
        btn.textContent = '👁';
      }
    });
  });

  // ── Save button ───────────────────────────────────────────────────────────
  if (saveBtn) {
    saveBtn.addEventListener('click', function() {
      _hideError();
      _hideConfirm();

      var geminiKey = geminiInput ? geminiInput.value.trim() : '';
      var openaiKey = openaiInput ? openaiInput.value.trim() : '';
      var anthropicKey = anthropicInput ? anthropicInput.value.trim() : '';

      if (_currentProvider !== TL_CONSTANTS.PROVIDERS.LOCAL) {
        var keyMap = {
          gemini: geminiKey,
          openai: openaiKey,
          anthropic: anthropicKey
        };
        var key = keyMap[_currentProvider] || '';
        var pattern = KEY_PATTERNS[_currentProvider];

        if (!key) {
          _showError('Please enter an API key for ' + _currentProvider + '.');
          return;
        }
        if (pattern && !pattern.test(key)) {
          var hints = {
            gemini: 'Gemini keys start with "AIza".',
            openai: 'OpenAI keys start with "sk-".',
            anthropic: 'Anthropic keys start with "sk-ant-".'
          };
          _showError('Invalid API key format. ' + (hints[_currentProvider] || ''));
          return;
        }
      }

      saveBtn.disabled = true;
      saveBtn.textContent = 'Saving…';

      TL_STORAGE.saveProviderSettings(_currentProvider, geminiKey, openaiKey, anthropicKey)
        .then(function() {
          saveBtn.disabled = false;
          saveBtn.textContent = 'Save Settings';
          _showConfirm();
          _updateStatus(_currentProvider);
        })
        .catch(function(e) {
          saveBtn.disabled = false;
          saveBtn.textContent = 'Save Settings';
          _showError('Failed to save: ' + e.message);
        });
    });
  }

  // ── UI update helpers ─────────────────────────────────────────────────────
  function _updateUI(provider) {
    document.querySelectorAll('.provider-card').forEach(function(card) {
      card.classList.toggle('card-active', card.getAttribute('data-provider') === provider);
    });

    _setDisplay(localInfo, provider === 'local');
    _setDisplay(geminiSection, provider === 'gemini');
    _setDisplay(openaiSection, provider === 'openai');
    _setDisplay(anthropicSection, provider === 'anthropic');

    _updateStatus(provider);
  }

  function _updateStatus(provider) {
    var labels = {
      local: 'Local Engine',
      gemini: 'Gemini 3.1 Flash-Lite', // Updated to match constants
      openai: 'GPT-4.1 Mini',
      anthropic: 'Claude 4.6 Sonnet' // Updated for 2026 naming conventions
    };
    if (statusLabel) statusLabel.textContent = labels[provider] || provider;
    if (statusDot) {
      // Logic for color: Local is Green, Cloud models are Blue
      statusDot.className = 'status-dot status-dot-' + (provider === 'local' ? 'green' : 'blue');
    }
  }

  function _showError(msg) {
    if (!errorMsg) return;
    errorMsg.textContent = msg;
    errorMsg.style.display = 'flex';
  }
  function _hideError() {
    if (errorMsg) errorMsg.style.display = 'none';
  }
  function _showConfirm() {
    if (!saveConfirm) return;
    saveConfirm.style.display = 'flex';
    setTimeout(function() { saveConfirm.style.display = 'none'; }, 3000);
  }
  function _hideConfirm() {
    if (saveConfirm) saveConfirm.style.display = 'none';
  }
  function _setDisplay(el, visible) {
    if (!el) return;
    el.style.display = visible ? '' : 'none';
  }

})();