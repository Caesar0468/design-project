// background/analyzer.js — All API calls + local 5-signal engine. Single source of truth.
(function () {
  'use strict';

  // ── Query classification patterns (priority order matters) ──────────────────
  var QUERY_PATTERNS = {
    philosophical_ethical: [
      /trolley\s*problem/i,
      /meaning\s*of\s*life/i,
      /\b(ethics|ethical|morality|moral\b|consciousness|free\s*will|afterlife|moral\s*dilemma|existential|purpose\s*of\s*existence|soul|heaven|hell|spiritual|divine)\b/i,
      /\b(philosophy|philosopher|plato|aristotle|kant|nietzsche|sartre|camus|hegel|descartes)\b/i,
      /\b(what\s+is\s+(the\s+)?(point|purpose|meaning)\s+of|why\s+(are|do)\s+we\s+(exist|live|die))\b/i,
      /\bis\s+(there\s+a\s+)?(God|god|Allah|deity|higher\s+power)\b/i,
      /\b(right\s+or\s+wrong|moral\s+responsibility|ethical\s+dilemma)\b/i,
      /\b(morally\s+(right|wrong|good|bad|justified|permissible))\b/i,
      /\b(is\s+(killing|murder|lying|stealing|cheating|violence|war)\s+(ever|always|sometimes)\s+(ok|okay|right|wrong|justified|acceptable|permissible))\b/i
    ],
    contested_political: [
      /\b(democrat|republican|liberal|conservative|left.?wing|right.?wing|socialist|communist|fascist)\b/i,
      /\b(election|vote|ballot|abortion|gun\s*(control|rights)|immigration\s*policy|border\s*wall)\b/i,
      /\b(trump|biden|obama|maga|antifa|blm)\b/i,
      /\b(healthcare\s*reform|climate\s*change\s*policy|affirmative\s*action|death\s*penalty)\b/i
    ],
    future_prediction: [
      /\bwill\s+.{3,60}\s+(happen|occur|crash|rise|fall|win|lose|succeed|fail)\b/i,
      /\b(going\s*to|shall\s+we|predict|forecast|outlook|by\s+20\d\d|next\s+(year|decade|century|month|week))\b/i,
      /\b(what\s+will\s+happen|what\s+does\s+the\s+future|when\s+will)\b/i
    ],
    sensitive_highstakes: [
      // Core medical — explicit clinical terms
      /\b(doctor|physician|medication|drug|prescription|diagnosis|symptom|disease|illness|cancer|diabetes|surgery|treatment|dosage|overdose|side\s*effect)\b/i,
      // FIX: Added common lay-medical terms that were missing and causing dangerous misclassification.
      // "I have a fever", "chest pain", "headache", "blood pressure", "nausea", "dizziness" all
      // fell through to general_knowledge and received an unwarranted green ~61% confidence badge.
      /\b(fever|headache|migraine|chest\s*pain|stomach\s*ache|stomachache|nausea|vomit|dizziness|dizzy|rash|infection|inflammation|allergy|allergic|antibiotic|painkiller|ibuprofen|aspirin|paracetamol|acetaminophen|blood\s*pressure|heart\s*rate|pulse|breathing|shortness\s*of\s*breath|swelling|wound|injury|fracture|sprain|concussion|seizure|stroke|heart\s*attack|covid|flu|cold\s+symptoms|mental\s+health|anxiety|depression|panic\s+attack)\b/i,
      // Legal
      /\b(lawyer|attorney|lawsuit|legal\s*advice|sue|liability|court)\b/i,
      /\b(legal\s+contract|breach\s+of\s+contract|contract\s+law|contract\s+dispute|contract\s+clause)\b/i,
      // Financial
      /\b(invest|stock|bond|crypto|bitcoin|ethereum|portfolio|retirement|mortgage|financial\s*advice|tax\s*advice)\b/i,
      // Safety
      /\b(emergency|danger|hazard|poison|explosive|weapon)\b/i
    ],
    // FIX: opinion_subjective before code_technical so "Is Python better than JS?" doesn't
    // get swallowed by the language-name pattern in code_technical
    opinion_subjective: [
      /\b(best\s+(programming\s+language|framework|tool|library|phone|laptop|car|movie|book|restaurant))\b/i,
      /\b(should\s+i\s+(buy|use|learn|watch|read|try|visit|choose))\b/i,
      /\b(recommend|worth\s+(it|buying|watching)|better\s+than|vs\.?\s+|versus\s+|compare\s+.+\s+to)\b/i,
      /\b(top\s+\d+|most\s+(popular|loved|hated|underrated|overrated))\b/i,
      /\bis\s+.{3,40}\s+(good|bad|worth|overrated|underrated|better|worse)\b/i
    ],
    verifiable_fact: [
      /\b(capital\s+of|currency\s+of|population\s+of|area\s+of)\b/i,
      /\b(when\s+was\s+.{3,40}\s+(born|founded|invented|discovered|built))\b/i,
      /\b(what\s+(year|date)\s+(was|did|is)|how\s+many\s+(people|countries|states|days|years))\b/i,
      /\b(define|definition\s+of|formula\s+for|equation\s+for|chemical\s+symbol)\b/i,
      /\b(who\s+(invented|discovered|founded|wrote|painted|composed))\b/i,
      /\b(speed\s+of\s+light|boiling\s+point|melting\s+point|atomic\s+number)\b/i,
      /\b(who\s+is\s+(the\s+)?(current\s+)?(president|prime\s*minister|ceo|founder|director|head|leader|king|queen|chancellor|emperor|pope))\b/i,
      /\b(what\s+is\s+the\s+(capital|currency|population|area|size|height|distance|speed|temperature|boiling|melting))\b/i,
      /\b(how\s+(tall|fast|far|old|long|wide|deep|heavy)\s+is)\b/i,
      /\b(what\s+(country|city|year|language|color|colour|element|planet|continent)\s+(is|are|was|were|has|have))\b/i,
      /\b(whats?\s+the\s+(ans(wer)?|result|value|formula|definition)\s+(to|of|for))\b/i,
      /\b(\d+\s*[\+\-\*\/\^]\s*\d+|\bwhat\s+is\s+\d+)\b/i,
    ],
    code_technical: [
      /\b(write|code|debug|fix|implement|build)\s+.{0,20}(function|script|program|class|component|api|query)\b/i,
      /\b(python|javascript|typescript|java|rust|golang|react|nodejs|html|css|bash|docker|kubernetes|sql|regex)\b/i,
      /```|`[^`]+`|\.(js|py|ts|css|html|java|go|rs|rb|php|sh)\b/i,
      /\b(syntax\s*error|runtime\s*error|bug|stack\s*trace|exception|compile|deploy|install\s+package)\b/i,
      /\b(git\s+(commit|push|pull|merge)|npm\s+install|pip\s+install)\b/i
    ],
    scientific_consensus: [
      /\b(how\s+does|why\s+does|what\s+causes|what\s+happens\s+when)\b/i,
      /\b(photosynthesis|evolution|gravity|quantum|relativity|DNA|RNA|protein|cell|atom|molecule|gene)\b/i,
      /\b(biology|chemistry|physics|geology|astronomy|ecology|neuroscience|immunology)\b/i,
      /\b(mechanism\s+of|process\s+of|explain\s+(how|why)|scientific\s+explanation)\b/i,
      /\bis\s+.{3,60}\s+(real|true|proven|scientifically\s+accurate|a\s+fact|established)\b/i
    ],
    general_knowledge: [
      /\b(what\s+is|who\s+is|where\s+is|tell\s+me\s+about|explain|describe|overview|summary|history\s+of)\b/i
    ]
  };

  // ── Hedge & verify word lists ────────────────────────────────────────────────
  var HEDGE_RE = /\b(might|may|could|possibly|perhaps|probably|likely|unlikely|seems|appear[s]?|suggest[s]?|indicate[s]?|arguably|presumably|approximately|roughly|around|about|nearly|almost|somewhat|reportedly|allegedly|supposedly|claimed|unclear|uncertain|unknown|debated|disputed|controversial|sometimes|occasionally|in\s+some\s+cases|generally|typically|usually|often|can\s+be|tend\s+to|for\s+the\s+most\s+part|to\s+some\s+extent|it\s+is\s+possible|it\s+seems|it\s+appears|one\s+could\s+argue|some\s+argue|some\s+suggest|not\s+entirely\s+clear|hard\s+to\s+say|difficult\s+to\s+say|varies|variable|inconsistent|limited\s+evidence|anecdotal|preliminary)\b/i;
  var VERIFY_RE = /\b(definitely|certainly|always|never|exactly|precisely|proven|confirmed|established|demonstrated|shown|found|research\s+shows|studies\s+show|evidence\s+shows|defined\s+as|known\s+as|refers\s+to|means\s+that|it\s+is\s+a\s+fact|factually|historically|therefore|thus|hence|consequently|in\s+fact|as\s+a\s+result)\b/i;

  // ── Epistemic source patterns ────────────────────────────────────────────────
  var DIRECT_FACT_RE = /\b(equals|contains|consists|comprises|defined\s+as|known\s+as)\b/i;
  var INFERENCE_RE = /\b(this\s+suggests|this\s+means|therefore|thus|hence|consequently|it\s+follows|so\s+we\s+can|indicates\s+that)\b/i;
  var TESTIMONY_RE = /\b(according\s+to|research\s+shows|studies\s+(show|indicate|suggest)|scientists\s+(say|found)|experts\s+(say|agree)|evidence\s+shows|data\s+shows)\b/i;
  var OPINION_RE = /\b(i\s+think|i\s+believe|personally|in\s+my\s+opinion|i\s+feel|i\s+would\s+say)\b/i;

  // ── Risk domains ─────────────────────────────────────────────────────────────
  var RISK_DOMAINS = {
    medical: {
      re: /\b(medical|health|symptom|diagnosis|treatment|medication|drug|dose|disease|illness|surgery|therapy|fever|headache|migraine|chest\s*pain|nausea|dizziness|rash|infection|blood\s*pressure|heart\s*attack|stroke|seizure|anxiety|depression)\b/i,
      suggest: 'Consult a licensed physician or healthcare professional for medical advice.'
    },
    legal: {
      re: /\b(legal|law|lawsuit|contract|liability|attorney|court|regulation|compliance|rights)\b/i,
      suggest: 'Consult a licensed attorney in your jurisdiction for legal advice.'
    },
    // FIX: Added bitcoin, ethereum, and other crypto terms to financial risk regex.
    // Previously "Should I buy Bitcoin?" classified as sensitive_highstakes correctly
    // but then risk_level returned 'none' because RISK_DOMAINS.financial didn't match "bitcoin".
    financial: {
      re: /\b(invest|stock|crypto|bitcoin|ethereum|btc|eth|altcoin|financial|tax|retirement|pension|portfolio|trading|money\s+management|forex|commodities|hedge\s+fund|mutual\s+fund)\b/i,
      suggest: 'Consult a certified financial advisor (CFP/CFA) for investment guidance.'
    },
    safety: {
      re: /\b(dangerous|hazardous|explosive|toxic|poison|weapon|fire|electrical|chemical\s+reaction)\b/i,
      suggest: 'Consult official safety guidelines or emergency services.'
    },
    privacy: {
      re: /\b(password|personal\s+data|GDPR|HIPAA|surveillance|tracking|privacy\s+policy)\b/i,
      suggest: 'Consult a privacy expert or review official regulatory guidance.'
    }
  };

  // ── System prompt for all API providers ─────────────────────────────────────
  var SYSTEM_PROMPT = [
    'You are a calibrated AI transparency analyzer. Your confidence scores MUST follow these ranges — do not deviate:\n',
    'QUESTION TYPE → SCORE RANGE:\n',
    '- Verifiable facts (capitals, dates, formulas, definitions): 78–95\n',
    '- Code and programming tasks: 72–92\n',
    '- Scientific consensus topics: 65–85\n',
    '- General knowledge and explanations: 50–74\n',
    '- Medical, legal, or financial questions: 35–60 (high consequence)\n',
    '- Opinion or "best of" questions: 28–52\n',
    '- Future predictions or forecasts: 12–36\n',
    '- Philosophical, ethical, existential questions (trolley problem, meaning of life, morality, consciousness, God, ethics): 8–26\n',
    '- Politically contested topics: 15–32\n\n',
    'You must first identify which category the user\'s question falls into, then score within that range.\n',
    'A philosophical question CANNOT score above 26. A verifiable fact CANNOT score below 78 if answered correctly.\n\n',
    'Return ONLY valid JSON, no markdown fences, no preamble:\n',
    '{"question_type":"<category>","confidence":<int 0-100>,"confidence_label":"<Uncertain|Low|Moderate|High|Very High>",',
    '"confidence_color":"<red|orange|yellow|green>",',
    '"plain_english_summary":"<2 sentences: what the AI said AND what the score means>",',
    '"reasoning_steps":["<step1: question type and reliability ceiling>","<step2: hedge vs assertion language>","<step3: specific gaps>"],',
    '"what_ai_didnt_know":"<specific gaps, not generic>",',
    '"should_verify":<true/false>,',
    '"verify_suggestion":"<specific source, not just check a reliable source>",',
    '"risk_level":"<none|low|medium|high>",',
    '"risk_reason":"<if not none: specific consequence>"}',
  ].join('');

  // ── Local 5-signal engine ────────────────────────────────────────────────────
  function classifyQuery(query) {
    if (!query || !query.trim()) return { type: 'general_knowledge', config: TL_CONSTANTS.QUERY_TYPES.general_knowledge };
    var q = query.trim();
    var order = [
      'philosophical_ethical', 'contested_political', 'future_prediction', 'sensitive_highstakes',
      'opinion_subjective', 'verifiable_fact', 'code_technical', 'scientific_consensus', 'general_knowledge'
    ];
    for (var i = 0; i < order.length; i++) {
      var type = order[i];
      var patterns = QUERY_PATTERNS[type];
      for (var j = 0; j < patterns.length; j++) {
        if (patterns[j].test(q)) return { type: type, config: TL_CONSTANTS.QUERY_TYPES[type] };
      }
    }
    return { type: 'general_knowledge', config: TL_CONSTANTS.QUERY_TYPES.general_knowledge };
  }

  function computeHVR(text) {
    var sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    var hedgeCount = 0, verifyCount = 0;
    for (var i = 0; i < sentences.length; i++) {
      var s = sentences[i];
      if (HEDGE_RE.test(s)) hedgeCount++;
      if (VERIFY_RE.test(s)) verifyCount++;
    }
    var hvr = hedgeCount / Math.max(verifyCount, 1);
    var adj = 0;
    if (hvr < 0.3) adj = 12;
    else if (hvr < 0.7) adj = 5;
    else if (hvr < 1.2) adj = 0;
    else if (hvr < 2.0) adj = -10;
    else if (hvr < 3.0) adj = -18;
    else adj = -25;
    return { hvr: hvr, adj: adj, hedgeCount: hedgeCount, verifyCount: verifyCount };
  }

  function computeSpecificity(text) {
    var score = 0;
    var nums = text.match(/\b\d+(\.\d+)?(%|percent)?\b/g) || [];
    score += Math.min(nums.length * 2, 12);
    var COMMON_STARTS = /^(The|This|That|These|Those|It|In|At|A|An|But|So|And|Or|If|When|While|After|Before|Since|Then|Now|Here|There|For|With|By|To|Of|On|As|Be|We|You|He|She|They|Its|Our|Your|His|Her|Their)$/;
    var rawNouns = text.match(/\b[A-Z][a-z]{2,}\b/g) || [];
    var properNouns = rawNouns.filter(function (w) { return !COMMON_STARTS.test(w); });
    score += Math.min(properNouns.length, 8);
    if (/\b(according\s+to|cited\s+in|source:|reference:|doi:|arxiv:|pubmed:|\[[0-9]+\])/i.test(text)) score += 6;
    if (/```[\s\S]*?```/.test(text) || /`[^`]+`/.test(text)) score += 15;
    var words = text.trim().split(/\s+/).length;
    if (words > 200) score += 5;
    else if (words < 30) score -= 12;
    else if (words < 80) score -= 6;
    if (nums.length === 0 && properNouns.length === 0) score -= 5;
    return score;
  }

  function computeEpistemicAdj(text) {
    var sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    var groundedCount = 0, ungroundedCount = 0;
    for (var i = 0; i < sentences.length; i++) {
      var s = sentences[i];
      if (TESTIMONY_RE.test(s) || (DIRECT_FACT_RE.test(s) && !OPINION_RE.test(s))) {
        groundedCount++;
      } else if (OPINION_RE.test(s)) {
        ungroundedCount++;
      } else if (!INFERENCE_RE.test(s) && s.trim().length > 20) {
        ungroundedCount++;
      }
    }
    var total = groundedCount + ungroundedCount;
    if (total === 0) return 0;
    var ratio = groundedCount / total;
    return Math.round(ratio * 8);
  }

  function detectRisk(text, query) {
    var combined = (query + ' ' + text).toLowerCase();
    var highest = 'none';
    var suggestion = '';
    var reason = '';
    var levels = ['safety', 'medical', 'legal', 'financial', 'privacy'];
    for (var i = 0; i < levels.length; i++) {
      var domain = levels[i];
      if (RISK_DOMAINS[domain].re.test(combined)) {
        highest = (domain === 'safety') ? 'high' :
          (domain === 'medical' || domain === 'legal') ? 'high' :
            (domain === 'financial') ? 'medium' : 'low';
        suggestion = RISK_DOMAINS[domain].suggest;
        reason = 'Acting on ' + domain + ' advice from an AI without professional verification could cause real harm.';
        break;
      }
    }
    return { level: highest, suggestion: suggestion, reason: reason };
  }

  function runLocalEngine(query, responseText) {
    var classification = classifyQuery(query);
    var queryType = classification.type;
    var queryConfig = classification.config;
    var hvrResult = computeHVR(responseText);
    var specificityScore = computeSpecificity(responseText);
    var epistemicAdj = computeEpistemicAdj(responseText);
    var raw = queryConfig.base + hvrResult.adj + specificityScore + epistemicAdj;
    var finalScore = Math.max(8, Math.min(raw, queryConfig.ceiling));
    var label = TL_CONSTANTS.scoreToLabel(finalScore);
    var color = TL_CONSTANTS.scoreToColor(finalScore);
    var risk = detectRisk(responseText, query);

    var verifyMap = {
      verifiable_fact: 'Cross-check with Wikipedia, encyclopaedias, or the original primary source.',
      code_technical: 'Test the code in your own environment; check official documentation.',
      scientific_consensus: 'See peer-reviewed sources via Google Scholar or PubMed.',
      general_knowledge: 'Verify key claims with reputable encyclopaedias or primary sources.',
      sensitive_highstakes: risk.suggestion || 'Consult a qualified professional before acting.',
      opinion_subjective: 'Compare multiple expert reviews and user experiences.',
      future_prediction: 'No source can reliably predict the future; treat as speculation.',
      philosophical_ethical: 'Consult academic philosophy texts or diverse ethical frameworks.',
      contested_political: 'Read primary sources and multiple perspectives from reputable news outlets.'
    };

    return {
      source: 'local',
      question_type: queryType,
      confidence: finalScore,
      confidence_label: label,
      confidence_color: color,
      plain_english_summary: queryConfig.label + ' questions have a reliability ceiling of ' + queryConfig.ceiling +
        '%. The local engine scored this response ' + finalScore + '% based on hedge density, specificity, and source grounding.',
      reasoning_steps: [
        'Question type: "' + queryConfig.label + '" — ceiling ' + queryConfig.ceiling + ', base ' + queryConfig.base + '.',
        'Hedge-to-Verify Ratio: ' + hvrResult.hvr.toFixed(2) + ' (' + hvrResult.hedgeCount + ' hedge sentences vs ' + hvrResult.verifyCount + ' assertive) → adjustment ' + (hvrResult.adj >= 0 ? '+' : '') + hvrResult.adj + '.',
        'Specificity: +' + specificityScore + ' (numbers, proper nouns, citations, length). Epistemic grounding: +' + epistemicAdj + '.'
      ],
      what_ai_didnt_know: 'Local engine cannot assess specific factual accuracy — it evaluates linguistic confidence signals only.',
      should_verify: finalScore < 70 || ['sensitive_highstakes', 'future_prediction', 'philosophical_ethical', 'contested_political'].indexOf(queryType) !== -1,
      verify_suggestion: risk.suggestion || verifyMap[queryType] || 'Check with a domain expert.',
      risk_level: risk.level,
      risk_reason: risk.reason
    };
  }

  // ── API caller helpers ───────────────────────────────────────────────────────
  function buildUserMessage(query, responseText) {
    return 'USER QUESTION: ' + query + '\n\nAI RESPONSE TO ANALYZE:\n' + responseText;
  }

  function callGemini(apiKey, query, responseText) {
    var url = TL_CONSTANTS.API_ENDPOINTS.gemini + '?key=' + apiKey;
    var body = {
      systemInstruction: {
        parts: [{ text: SYSTEM_PROMPT }]
      },
      contents: [
        { role: 'user', parts: [{ text: buildUserMessage(query, responseText) }] }
      ],
      generationConfig: { maxOutputTokens: 800, temperature: 0.1 }
    };
    return fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (data.error) throw new Error('Gemini error: ' + data.error.message);
        var text = data.candidates && data.candidates[0] && data.candidates[0].content &&
          data.candidates[0].content.parts && data.candidates[0].content.parts[0] &&
          data.candidates[0].content.parts[0].text;
        if (!text) throw new Error('Gemini: empty response');
        return JSON.parse(text.replace(/```json\n?|```/g, '').trim());
      });
  }

  function callOpenAI(apiKey, query, responseText) {
    var body = {
      model: TL_CONSTANTS.API_MODELS.openai,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: buildUserMessage(query, responseText) }
      ],
      max_tokens: 800,
      temperature: 0.1
    };
    return fetch(TL_CONSTANTS.API_ENDPOINTS.openai, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + apiKey },
      body: JSON.stringify(body)
    })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (data.error) throw new Error('OpenAI error: ' + data.error.message);
        var text = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
        if (!text) throw new Error('OpenAI: empty response');
        return JSON.parse(text.replace(/```json\n?|```/g, '').trim());
      });
  }

  function callAnthropic(apiKey, query, responseText) {
    var body = {
      model: TL_CONSTANTS.API_MODELS.anthropic,
      max_tokens: 800,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: buildUserMessage(query, responseText) }]
    };
    return fetch(TL_CONSTANTS.API_ENDPOINTS.anthropic, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(body)
    })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (data.error) throw new Error('Anthropic error: ' + (data.error.message || JSON.stringify(data.error)));
        var text = data.content && data.content[0] && data.content[0].text;
        if (!text) throw new Error('Anthropic: empty response');
        return JSON.parse(text.replace(/```json\n?|```/g, '').trim());
      });
  }

  function normalizeApiResult(raw, provider) {
    var score = parseInt(raw.confidence, 10);
    if (isNaN(score) || score < 0 || score > 100) score = 50;
    return {
      source: provider,
      question_type: raw.question_type || 'general_knowledge',
      confidence: score,
      confidence_label: raw.confidence_label || TL_CONSTANTS.scoreToLabel(score),
      confidence_color: raw.confidence_color || TL_CONSTANTS.scoreToColor(score),
      plain_english_summary: raw.plain_english_summary || '',
      reasoning_steps: Array.isArray(raw.reasoning_steps) ? raw.reasoning_steps : [raw.reasoning_steps || ''],
      what_ai_didnt_know: raw.what_ai_didnt_know || '',
      should_verify: !!raw.should_verify,
      verify_suggestion: raw.verify_suggestion || '',
      risk_level: raw.risk_level || 'none',
      risk_reason: raw.risk_reason || ''
    };
  }

  // ── Message listener ─────────────────────────────────────────────────────────
  chrome.runtime.onMessage.addListener(function (msg, _sender, sendResponse) {
    if (msg.type !== TL_CONSTANTS.MESSAGES.ANALYZE_REQUEST) return false;

    var query = msg.query || '';
    var responseText = msg.responseText || '';

    TL_STORAGE.getProviderSettings().then(function (settings) {
      var provider = settings.provider || TL_CONSTANTS.PROVIDERS.LOCAL;

      if (provider === TL_CONSTANTS.PROVIDERS.LOCAL) {
        var result = runLocalEngine(query, responseText);
        sendResponse({ ok: true, result: result });
        return;
      }

      var apiCall;
      if (provider === TL_CONSTANTS.PROVIDERS.GEMINI) {
        if (!settings.geminiKey) { sendResponse({ ok: false, error: 'No Gemini API key set.' }); return; }
        apiCall = callGemini(settings.geminiKey, query, responseText);
      } else if (provider === TL_CONSTANTS.PROVIDERS.OPENAI) {
        if (!settings.openaiKey) { sendResponse({ ok: false, error: 'No OpenAI API key set.' }); return; }
        apiCall = callOpenAI(settings.openaiKey, query, responseText);
      } else if (provider === TL_CONSTANTS.PROVIDERS.ANTHROPIC) {
        if (!settings.anthropicKey) { sendResponse({ ok: false, error: 'No Anthropic API key set.' }); return; }
        apiCall = callAnthropic(settings.anthropicKey, query, responseText);
      } else {
        var result = runLocalEngine(query, responseText);
        sendResponse({ ok: true, result: result });
        return;
      }

      apiCall
        .then(function (raw) {
          sendResponse({ ok: true, result: normalizeApiResult(raw, provider) });
        })
        .catch(function (e) {
          console.warn('[TrustLayer] API error:', e.message);
          // Surface the real error so the user knows the API failed
          // instead of silently showing a local result as if Gemini ran
          sendResponse({ ok: false, error: 'API call failed: ' + e.message });
        });
    }).catch(function (e) {
      sendResponse({ ok: false, error: e.message });
    });

    return true; // keep channel open for async sendResponse
  });

})();