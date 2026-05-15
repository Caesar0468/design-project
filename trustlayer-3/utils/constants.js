// utils/constants.js — TrustLayer v3 constants (shared by background + content)
var TL_CONSTANTS = (function () {
  'use strict';
  var PROVIDERS = { LOCAL: 'local', GEMINI: 'gemini', OPENAI: 'openai', ANTHROPIC: 'anthropic' };
  var QUERY_TYPES = {
    verifiable_fact: { ceiling: 94, base: 82, label: 'Verifiable Fact' },
    code_technical: { ceiling: 92, base: 80, label: 'Code / Technical' },
    scientific_consensus: { ceiling: 85, base: 72, label: 'Scientific Consensus' },
    general_knowledge: { ceiling: 74, base: 60, label: 'General Knowledge' },
    sensitive_highstakes: { ceiling: 58, base: 44, label: 'Medical / Legal / Financial' },
    opinion_subjective: { ceiling: 50, base: 38, label: 'Opinion / Subjective' },
    future_prediction: { ceiling: 35, base: 22, label: 'Future Prediction' },
    philosophical_ethical: { ceiling: 26, base: 16, label: 'Philosophical / Ethical' },
    contested_political: { ceiling: 30, base: 20, label: 'Contested / Political' }
  };
  function scoreToLabel(s) {
    if (s >= 80) return 'Very High';
    if (s >= 65) return 'High';
    if (s >= 45) return 'Moderate';
    if (s >= 25) return 'Low';
    return 'Uncertain';
  }
  function scoreToColor(s) {
    if (s >= 65) return 'green';
    if (s >= 45) return 'yellow';
    if (s >= 25) return 'orange';
    return 'red';
  }
  var API_MODELS = {
    gemini: 'gemini-3.1-flash-lite', // 2.5 was retired March 2026; 3.1 is the new free GA
    openai: 'gpt-4.1-mini',
    anthropic: 'claude-sonnet-4-6'
  };
  return {
    PROVIDERS: PROVIDERS,
    QUERY_TYPES: QUERY_TYPES,
    API_ENDPOINTS: {
      // Switched to v1beta for better system_instruction support
      gemini: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent',
      openai: 'https://api.openai.com/v1/chat/completions',
      anthropic: 'https://api.anthropic.com/v1/messages'
    },
    API_MODELS: API_MODELS,
    MESSAGES: { ANALYZE_REQUEST: 'TL_ANALYZE', ANALYZE_RESPONSE: 'TL_RESULT', GET_SETTINGS: 'TL_GET_SETTINGS' },
    scoreToLabel: scoreToLabel,
    scoreToColor: scoreToColor
  };
})();