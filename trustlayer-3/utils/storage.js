// utils/storage.js — chrome.storage.local wrapper
var TL_STORAGE = (function() {
  'use strict';

  function getProviderSettings() {
    return new Promise(function(resolve, reject) {
      try {
        chrome.storage.local.get(['tl_provider','tl_gemini_key','tl_openai_key','tl_anthropic_key'], function(r) {
          if (chrome.runtime.lastError) { reject(new Error(chrome.runtime.lastError.message)); return; }
          resolve({
            provider:     r.tl_provider     || TL_CONSTANTS.PROVIDERS.LOCAL,
            geminiKey:    r.tl_gemini_key    || '',
            openaiKey:    r.tl_openai_key    || '',
            anthropicKey: r.tl_anthropic_key || ''
          });
        });
      } catch(e) { reject(e); }
    });
  }

  function saveProviderSettings(provider, geminiKey, openaiKey, anthropicKey) {
    return new Promise(function(resolve, reject) {
      try {
        chrome.storage.local.set({
          tl_provider:      provider,
          tl_gemini_key:    geminiKey    || '',
          tl_openai_key:    openaiKey    || '',
          tl_anthropic_key: anthropicKey || ''
        }, function() {
          if (chrome.runtime.lastError) { reject(new Error(chrome.runtime.lastError.message)); return; }
          resolve();
        });
      } catch(e) { reject(e); }
    });
  }

  return { getProviderSettings: getProviderSettings, saveProviderSettings: saveProviderSettings };
})();
