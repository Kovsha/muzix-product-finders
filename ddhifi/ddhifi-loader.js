/*
 * ddHiFi Product Finder loader
 * Loads CSS + product data + finder engine from jsDelivr.
 * Use this as the only global UNAS script for the ddHiFi finder.
 */
(function () {
  'use strict';

  if (window.__MUZIX_DDHIFI_LOADER__) return;
  window.__MUZIX_DDHIFI_LOADER__ = true;

  var BASE = 'https://cdn.jsdelivr.net/gh/Kovsha/muzix-product-finders@main/ddhifi/';
  var VERSION = '20260901-3';

  function injectCss() {
    if (document.getElementById('muzix-ddhifi-finder-css')) return;

    var link = document.createElement('link');
    link.id = 'muzix-ddhifi-finder-css';
    link.rel = 'stylesheet';
    link.type = 'text/css';
    link.href = BASE + 'ddhifi-finder.css?v=' + VERSION;

    link.onload = function () {
      document.documentElement.classList.add('ddhf26-css-loaded');
    };

    link.onerror = function () {
      console.error('[ddHiFi Finder] CSS failed to load:', link.href);
    };

    (document.head || document.documentElement).appendChild(link);
  }

  function loadScript(id, src, done) {
    var existing = document.getElementById(id);

    if (existing) {
      if (done) done();
      return;
    }

    var script = document.createElement('script');
    script.id = id;
    script.src = src;
    script.async = false;

    script.onload = function () {
      if (done) done();
    };

    script.onerror = function () {
      console.error('[ddHiFi Finder] Script failed to load:', src);
    };

    (document.head || document.documentElement).appendChild(script);
  }

  function start() {
    injectCss();

    if (window.MUZIX_DDHIFI_FINDER_DATA) {
      loadScript(
        'muzix-ddhifi-finder-engine',
        BASE + 'ddhifi-finder.js?v=' + VERSION
      );
      return;
    }

    loadScript(
      'muzix-ddhifi-finder-data',
      BASE + 'ddhifi-products.js?v=' + VERSION,
      function () {
        loadScript(
          'muzix-ddhifi-finder-engine',
          BASE + 'ddhifi-finder.js?v=' + VERSION
        );
      }
    );
  }

  start();
})();
