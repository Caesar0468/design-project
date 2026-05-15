// content/cache.js — Element-keyed result cache (WeakMap). Single source of truth for badge+panel.
var TL_CACHE = (function() {
  'use strict';

  // WeakMap: DOM element → { status: 'pending'|'ready'|'error', result: {...}, callbacks: [] }
  var _cache = new WeakMap();

  function get(el) {
    return _cache.get(el) || null;
  }

  function initPending(el) {
    var entry = { status: 'pending', result: null, callbacks: [] };
    _cache.set(el, entry);
    return entry;
  }

  function resolve(el, result) {
    var entry = _cache.get(el);
    if (!entry) {
      entry = { status: 'ready', result: result, callbacks: [] };
      _cache.set(el, entry);
      return;
    }
    entry.status = 'ready';
    entry.result = result;
    var cbs = entry.callbacks.slice();
    entry.callbacks = [];
    for (var i = 0; i < cbs.length; i++) {
      try { cbs[i](result); } catch(e) { console.error('[TrustLayer cache] callback error:', e); }
    }
  }

  function reject(el, errorMsg) {
    var entry = _cache.get(el);
    if (!entry) {
      entry = { status: 'error', result: null, callbacks: [], error: errorMsg };
      _cache.set(el, entry);
      return;
    }
    entry.status = 'error';
    entry.error = errorMsg;
    var cbs = entry.callbacks.slice();
    entry.callbacks = [];
    for (var i = 0; i < cbs.length; i++) {
      try { cbs[i](null, errorMsg); } catch(e) {}
    }
  }

  // Register a callback: called immediately if ready, queued if pending
  function onReady(el, cb) {
    var entry = _cache.get(el);
    if (!entry) return;
    if (entry.status === 'ready') {
      cb(entry.result);
    } else if (entry.status === 'error') {
      cb(null, entry.error);
    } else {
      entry.callbacks.push(cb);
    }
  }

  function has(el) {
    return _cache.has(el);
  }

  return { get: get, initPending: initPending, resolve: resolve, reject: reject, onReady: onReady, has: has };
})();
