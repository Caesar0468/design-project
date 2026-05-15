// content/detector.js — Site configs and DOM selectors
var TL_DETECTOR = (function() {
  'use strict';

  var SITE_CONFIGS = {
    'chatgpt.com': {
      name: 'ChatGPT',
      outputSelector: '[data-message-author-role="assistant"] .markdown',
      inputSelector: '#prompt-textarea',
      observeSelector: 'main',
      criticalKeywords: ['delete', 'clear', 'remove', 'reset', 'archive']
    },
    'chat.openai.com': {
      name: 'ChatGPT',
      outputSelector: '[data-message-author-role="assistant"] .markdown',
      inputSelector: '#prompt-textarea',
      observeSelector: 'main',
      criticalKeywords: ['delete', 'clear', 'remove', 'reset', 'archive']
    },
    'claude.ai': {
      name: 'Claude',
      outputSelector: '[data-is-streaming="false"] .prose',
      inputSelector: '[contenteditable="true"]',
      observeSelector: '.flex-1',
      criticalKeywords: ['delete', 'clear conversation']
    },
    'gemini.google.com': {
      name: 'Gemini',
      outputSelector: 'message-content .markdown, .model-response-text',
      inputSelector: 'rich-textarea .ql-editor',
      observeSelector: 'chat-window, main',
      criticalKeywords: ['delete', 'clear'],
      userMsgSelectors: [
        'user-query .query-text',
        'user-query p',
        '.user-message-bubble p',
        '[class*="user-query"] p',
        'div[jsname] p'
      ]
    },
    'perplexity.ai': {
      name: 'Perplexity',
      outputSelector: '.prose, [class*="answer"] .prose',
      inputSelector: 'textarea[placeholder]',
      observeSelector: 'main',
      criticalKeywords: ['delete', 'clear'],
      // FIX: added user message selectors — previously missing, causing empty query capture
      userMsgSelectors: [
        '[data-testid="user-message"]',
        '[class*="userMessage"] p',
        '[class*="UserMessage"] p',
        '.break-words p'
      ]
    },
    'copilot.microsoft.com': {
      name: 'Copilot',
      outputSelector: '.ac-textBlock, [class*="message-content"]',
      inputSelector: 'textarea, [contenteditable]',
      observeSelector: 'main, [class*="chat"]',
      criticalKeywords: ['delete', 'clear', 'new topic']
    },
    // FIX: added Bing AI — was advertised in README but completely missing from code
    'www.bing.com': {
      name: 'Bing AI',
      outputSelector: '[class*="ac-textBlock"], cib-message-group [class*="content"]',
      inputSelector: 'textarea#searchbox, cib-text-input textarea',
      observeSelector: 'cib-serp, main',
      criticalKeywords: ['delete', 'clear', 'new topic']
    },
    'copilot.bing.com': {
      name: 'Bing Copilot',
      outputSelector: '[class*="ac-textBlock"], [class*="message-content"]',
      inputSelector: 'textarea, [contenteditable]',
      observeSelector: 'main, [class*="chat"]',
      criticalKeywords: ['delete', 'clear', 'new topic']
    }
  };

  function getCurrentConfig() {
    var host = window.location.hostname.replace(/^www\./, '');
    return SITE_CONFIGS[host] || SITE_CONFIGS['www.' + host] || null;
  }

  function getLastUserQuery() {
    var config = getCurrentConfig();
    if (!config) return '';

    var selectors = config.userMsgSelectors || [
      '[data-message-author-role="user"] p',
      '.human-turn p',
      '[class*="user-message"] p',
      '.HumanTurn p'
    ];

    for (var i = 0; i < selectors.length; i++) {
      var els = document.querySelectorAll(selectors[i]);
      if (els.length > 0) {
        return els[els.length - 1].textContent.trim();
      }
    }

    try {
      var inputEl = document.querySelector(config.inputSelector);
      if (inputEl) return (inputEl.value || inputEl.textContent || '').trim();
    } catch(e) {}
    return '';
  }

  return { getCurrentConfig: getCurrentConfig, getLastUserQuery: getLastUserQuery, SITE_CONFIGS: SITE_CONFIGS };
})();