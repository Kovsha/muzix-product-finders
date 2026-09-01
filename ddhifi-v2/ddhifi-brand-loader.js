/* ddHiFi Brand Finder V2 loader */
(function () {
  'use strict';
  if (window.__MUZIX_DDHIFI_BRAND_V2_LOADER__) return;
  window.__MUZIX_DDHIFI_BRAND_V2_LOADER__ = true;

  var BASE = 'https://cdn.jsdelivr.net/gh/Kovsha/muzix-product-finders@ddhifi-brand-finder-v2/ddhifi-v2/';
  var VERSION = '2.0.0-beta.1';

  function css() {
    if (document.getElementById('ddhv2-css')) return;
    var l = document.createElement('link');
    l.id = 'ddhv2-css';
    l.rel = 'stylesheet';
    l.href = BASE + 'ddhifi-brand-finder.css?v=' + VERSION;
    (document.head || document.documentElement).appendChild(l);
  }

  function script(id, src, done) {
    if (document.getElementById(id)) { if (done) done(); return; }
    var s = document.createElement('script');
    s.id = id;
    s.src = src;
    s.async = false;
    s.onload = function () { if (done) done(); };
    s.onerror = function () { console.error('[ddHiFi V2] Nem tölthető be:', src); };
    (document.head || document.documentElement).appendChild(s);
  }

  function boot() {
    if (!document.getElementById('ddhv2-finder')) return;
    css();
    script('ddhv2-data', BASE + 'ddhifi-brand-data.js?v=' + VERSION, function () {
      script('ddhv2-engine', BASE + 'ddhifi-brand-finder.js?v=' + VERSION);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once:true });
  else boot();
})();
