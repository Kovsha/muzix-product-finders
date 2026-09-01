/*
 * MUZIX ddHiFi Brand Finder V2
 * Discovers the live ddHiFi catalogue, including paginated brand pages,
 * then adds optional exact metadata from ddhifi-brand-data.js.
 */
(function () {
  'use strict';

  var ROOT_ID = 'ddhv2-finder';
  var DATA = window.MUZIX_DDHIFI_BRAND_DATA || {};
  var root = document.getElementById(ROOT_ID);
  if (!root || root.dataset.ddhv2Ready === '1') return;
  root.dataset.ddhv2Ready = '1';

  var app = root.querySelector('[data-ddhv2-app]');
  if (!app) return;

  var state = {
    screen: 'loading',
    family: null,
    answers: {},
    onlyStock: true,
    catalogue: [],
    loadingPages: true
  };

  var CONNECTOR_LABELS = {
    'usb-c': 'USB-C', 'usb-a': 'USB-A', 'usb-b': 'USB-B', lightning: 'Lightning',
    '2.5': '2,5 mm', '3.5': '3,5 mm', '4.4': '4,4 mm', '6.35': '6,35 mm',
    '2-pin': '2-Pin', mmcx: 'MMCX', a2dc: 'A2DC', lemo: 'LEMO',
    'mini-xlr': 'Mini-XLR', xlr4: '4-Pin XLR', xlr3: '3-Pin XLR', rca: 'RCA', coax: 'Coax'
  };

  var FAMILY_COPY = {
    'dac-amp': { title: 'DAC / fejhallgató-erősítő', text: 'A kimenet, a terhelés és a fontos funkciók alapján rangsorolunk.' },
    cable: { title: 'Kábel', text: 'A felhasználás, a két csatlakozó és a hossz alapján keresünk.' },
    adapter: { title: 'Adapter / átalakító', text: 'Mondd meg, milyen csatlakozóról milyenre szeretnél váltani.' },
    earphone: { title: 'Fülhallgató', text: 'A jelenlegi ddHiFi fülhallgató-kínálatból segítünk választani.' },
    'digital-link': { title: 'Digitális kapcsolat', text: 'Telefon, DAP vagy számítógép és DAC közötti digitális kapcsolat.' },
    other: { title: 'Egyéb kiegészítő', text: 'A más kategóriába nem sorolható ddHiFi megoldások.' }
  };

  function esc(v) {
    return String(v == null ? '' : v)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  }

  function norm(v) {
    return String(v || '').replace(/\s+/g, ' ').trim();
  }

  function lower(v) { return norm(v).toLowerCase(); }

  function unique(arr) {
    return arr.filter(function (v, i) { return arr.indexOf(v) === i; });
  }

  function absoluteUrl(href, base) {
    try { return new URL(href, base || location.href).href; } catch (e) { return href || ''; }
  }

  function skuFromHref(href) {
    var decoded = '';
    try { decoded = decodeURIComponent(href || ''); } catch (e) { decoded = href || ''; }
    var m = decoded.match(/\/(DDHIFI-[A-Z0-9-]+)(?:\/|$)/i);
    return m ? m[1].toUpperCase() : '';
  }

  function findCard(anchor) {
    var node = anchor;
    for (var i = 0; i < 8 && node; i++, node = node.parentElement) {
      if (!node || !node.textContent) continue;
      var txt = norm(node.textContent);
      if (/\d[\d\s\.]*\s*Ft/.test(txt) && txt.length < 4500) return node;
    }
    return anchor.parentElement;
  }

  function priceFromCard(card) {
    if (!card) return '';
    var priceNodes = card.querySelectorAll('[class*="price"]');
    for (var i = 0; i < priceNodes.length; i++) {
      var t = norm(priceNodes[i].textContent);
      if (/\d[\d\s\.]*\s*Ft/.test(t) && t.length < 100) return t;
    }
    var matches = norm(card.textContent).match(/\d[\d\s\.]*\s*Ft/g);
    return matches && matches.length ? matches[matches.length - 1] : '';
  }

  function numericPrice(price) {
    var m = String(price || '').replace(/\./g, '').match(/\d[\d\s]*/);
    return m ? parseInt(m[0].replace(/\s/g, ''), 10) || 0 : 0;
  }

  function stockFromCard(card) {
    var t = lower(card && card.textContent);
    if (/nincs raktáron|elfogyott|out of stock|nicht auf lager|indisponibil/.test(t)) return 'out';
    if (/előrendel|pre-?order|vorbestell|precomand/.test(t)) return 'preorder';
    if (/azonnal átvehető|raktáron|készleten|in stock|auf lager|in stoc/.test(t)) return 'in';
    return 'unknown';
  }

  function imageFromCard(card) {
    if (!card) return '';
    var img = card.querySelector('img');
    if (!img) return '';
    return img.currentSrc || img.getAttribute('data-src') || img.getAttribute('data-lazy-src') || img.src || '';
  }

  function inferConnectors(title) {
    var text = lower(title);
    var found = [];
    var aliases = DATA.connectorAliases || {};
    Object.keys(aliases).forEach(function (key) {
      var hit = aliases[key].some(function (alias) { return text.indexOf(lower(alias)) !== -1; });
      if (hit) found.push(key);
    });
    return unique(found);
  }

  function inferOrderedConnectorDetails(title) {
    var text = lower(title);
    var hits = [];
    var aliases = DATA.connectorAliases || {};
    Object.keys(aliases).forEach(function (key) {
      aliases[key].forEach(function (alias) {
        var a = lower(alias);
        var pos = text.indexOf(a);
        if (pos !== -1) {
          var after = text.slice(pos, pos + a.length + 35);
          var gender = /aljzat|female/.test(after) ? 'female' : (/dugó|apa|male/.test(after) ? 'male' : null);
          hits.push({ key: key, pos: pos, gender: gender });
        }
      });
    });
    hits.sort(function (a, b) { return a.pos - b.pos; });
    var seen = {};
    return hits.filter(function (h) {
      if (seen[h.key]) return false;
      seen[h.key] = true;
      return true;
    });
  }

  function inferLengthCm(title) {
    var t = lower(title);
    var m = t.match(/(?:-|\s)(\d+(?:[\.,]\d+)?)\s*(mm|cm|m)\b/);
    if (!m) return null;
    var n = parseFloat(m[1].replace(',', '.'));
    if (!isFinite(n)) return null;
    if (m[2] === 'mm') return Math.round(n / 10);
    if (m[2] === 'm') return Math.round(n * 100);
    return Math.round(n);
  }

  function inferFamilies(title) {
    var t = lower(title);
    var out = [];
    if (/dac|fejhallgató erősítő/.test(t)) out.push('dac-amp');
    if (/otg|adatkábel|digitális adapter|koax|coax/.test(t)) out.push('digital-link');
    if (/kábel/.test(t)) out.push('cable');
    if (/adapter/.test(t) && out.indexOf('dac-amp') === -1) out.push('adapter');
    if (/fülhallgató/.test(t) && !/kábel/.test(t)) out.push('earphone');
    if (!out.length) out.push('other');
    return unique(out);
  }

  function inferUseCases(title) {
    var t = lower(title);
    var out = [];
    if (/otg|adatkábel/.test(t)) out.push('digital-usb');
    if (/fejhallgató kábel/.test(t)) out.push('headphone-cable');
    if (/fülhallgató kábel/.test(t)) out.push('iem-cable');
    if (/jelkábel/.test(t)) out.push('analog-interconnect');
    if (/koax|coax/.test(t)) out.push('coax');
    if (/adapter/.test(t)) out.push('adapter');
    return out;
  }

  function mergeOverride(product) {
    var o = (DATA.overrides || {})[product.sku];
    if (!o) return product;
    Object.keys(o).forEach(function (k) { product[k] = o[k]; });
    if (o.family && product.families.indexOf(o.family) === -1) product.families.unshift(o.family);
    return product;
  }

  function parseDocument(doc, baseUrl) {
    var results = [];
    Array.prototype.forEach.call(doc.querySelectorAll('a[href]'), function (a) {
      var title = norm(a.textContent);
      if (!/^DD\s*HIFI\b/i.test(title)) return;
      var href = absoluteUrl(a.getAttribute('href'), baseUrl);
      var sku = skuFromHref(href);
      if (!sku) return;
      var card = findCard(a);
      var details = inferOrderedConnectorDetails(title);
      var p = {
        sku: sku,
        title: title,
        name: title.replace(/^DD\s*HIFI\s*/i, ''),
        url: href,
        image: imageFromCard(card),
        price: priceFromCard(card),
        priceValue: numericPrice(priceFromCard(card)),
        stock: stockFromCard(card),
        families: inferFamilies(title),
        connectors: inferConnectors(title),
        connectorDetails: details,
        lengthCm: inferLengthCm(title),
        useCases: inferUseCases(title),
        source: 'live'
      };
      results.push(mergeOverride(p));
    });
    return results;
  }

  function mergeCatalogue(items) {
    var map = {};
    items.forEach(function (p) {
      if (!map[p.sku]) map[p.sku] = p;
      else {
        if (!map[p.sku].image && p.image) map[p.sku].image = p.image;
        if (!map[p.sku].price && p.price) map[p.sku].price = p.price;
        if (map[p.sku].stock === 'unknown' && p.stock !== 'unknown') map[p.sku].stock = p.stock;
      }
    });
    return Object.keys(map).map(function (k) { return map[k]; });
  }

  function paginationUrls() {
    var urls = [];
    Array.prototype.forEach.call(document.querySelectorAll('a[href]'), function (a) {
      var txt = norm(a.textContent);
      if (!/^\d+$/.test(txt)) return;
      var href = absoluteUrl(a.href);
      try {
        var u = new URL(href);
        if (u.origin === location.origin && u.pathname === location.pathname) urls.push(u.href);
      } catch (e) {}
    });
    return unique(urls).slice(0, 8);
  }

  function loadCatalogue() {
    var first = parseDocument(document, location.href);
    var pages = paginationUrls();
    if (!pages.length) {
      state.catalogue = mergeCatalogue(first);
      state.loadingPages = false;
      renderHome();
      return;
    }

    Promise.all(pages.map(function (url) {
      return fetch(url, { credentials: 'same-origin' })
        .then(function (r) { return r.ok ? r.text() : ''; })
        .then(function (html) {
          if (!html) return [];
          var doc = new DOMParser().parseFromString(html, 'text/html');
          return parseDocument(doc, url);
        })
        .catch(function () { return []; });
    })).then(function (groups) {
      var all = first.slice();
      groups.forEach(function (g) { all = all.concat(g); });
      state.catalogue = mergeCatalogue(all);
      state.loadingPages = false;
      renderHome();
    });
  }

  function familyCount(key) {
    return state.catalogue.filter(function (p) { return p.families.indexOf(key) !== -1; }).length;
  }

  function iconSvg(type) {
    var icons = {
      wave: '<svg viewBox="0 0 32 32"><path d="M3 17h4l2-8 4 15 4-18 4 14 2-7 2 4h4"/></svg>',
      cable: '<svg viewBox="0 0 32 32"><path d="M7 7v6c0 6 4 9 9 9h4"/><path d="M4 4h6v5H4zM20 19h8v6h-8z"/></svg>',
      adapter: '<svg viewBox="0 0 32 32"><path d="M5 11h8v10H5zM19 8h8v16h-8zM13 16h6"/></svg>',
      earphone: '<svg viewBox="0 0 32 32"><path d="M8 7c5 0 8 3 8 8v4c0 4-2 7-5 7-2 0-3-1-3-3v-6h5v-2c0-3-2-5-5-5z"/></svg>',
      digital: '<svg viewBox="0 0 32 32"><path d="M5 8h8v8H5zM19 16h8v8h-8zM13 12h4v8h2"/></svg>',
      other: '<svg viewBox="0 0 32 32"><circle cx="8" cy="16" r="3"/><circle cx="16" cy="16" r="3"/><circle cx="24" cy="16" r="3"/></svg>'
    };
    return icons[type] || icons.other;
  }

  function renderHome() {
    state.screen = 'home';
    state.family = null;
    state.answers = {};
    var families = DATA.families || [];
    app.innerHTML =
      '<div class="ddhv2-home">' +
        '<div class="ddhv2-eyebrow">ddHiFi Product Assistant</div>' +
        '<h2>Mit szeretnél megoldani?</h2>' +
        '<p class="ddhv2-lead">Nem kell ismerned a típusszámokat. Válaszd ki, mit keresel, és a jelenlegi ddHiFi kínálatból szűrjük a megfelelő megoldásokat.</p>' +
        '<div class="ddhv2-family-grid">' +
          families.map(function (f) {
            return '<button class="ddhv2-family" data-family="' + esc(f.key) + '">' +
              '<span class="ddhv2-family-icon">' + iconSvg(f.icon) + '</span>' +
              '<span class="ddhv2-family-copy"><strong>' + esc(f.title) + '</strong><small>' + esc(f.subtitle) + '</small></span>' +
              '<span class="ddhv2-family-count">' + familyCount(f.key) + '</span>' +
            '</button>';
          }).join('') +
        '</div>' +
        '<button class="ddhv2-unsure" data-problem-solver>Nem tudom, mire van szükségem</button>' +
        '<div class="ddhv2-live-note">' + state.catalogue.length + ' ddHiFi SKU felismerve az aktuális márkaoldalról' + (state.loadingPages ? '…' : '') + '</div>' +
      '</div>';

    Array.prototype.forEach.call(app.querySelectorAll('[data-family]'), function (b) {
      b.addEventListener('click', function () { startFamily(b.getAttribute('data-family')); });
    });
    var ps = app.querySelector('[data-problem-solver]');
    if (ps) ps.addEventListener('click', renderProblemSolver);
  }

  function renderProblemSolver() {
    state.screen = 'problem';
    app.innerHTML = '<div class="ddhv2-flow">' +
      flowHeader('Segíts megoldani', 'Melyik helyzet írja le legjobban, amit szeretnél?') +
      '<div class="ddhv2-choice-grid">' +
        problemChoice('phone-jack', 'A telefonomon nincs fejhallgató-kimenet', 'USB-C vagy Lightning forráshoz keresek megoldást.') +
        problemChoice('phone-dac', 'Telefont / tabletet kötnék DAC-ra', 'Digitális USB vagy OTG kapcsolat kell.') +
        problemChoice('plug-adapt', 'A fejhallgatóm csatlakozója nem illik az erősítőhöz', 'Jack, Pentaconn vagy XLR átalakítás.') +
        problemChoice('upgrade-cable', 'Új kábelt keresek a fejhallgatómhoz / IEM-emhez', 'Csatlakozó és hossz alapján keresünk.') +
        problemChoice('dac-amp', 'Jobb hordozható DAC / erősítő kell', 'IEM vagy fejhallgató meghajtásához.') +
        problemChoice('dac-amp-link', 'DAC-ot és erősítőt kötnék össze', 'Analóg RCA vagy más összekötő kábel.') +
      '</div>' + backHomeButton() + '</div>';

    Array.prototype.forEach.call(app.querySelectorAll('[data-problem]'), function (b) {
      b.addEventListener('click', function () {
        var p = b.getAttribute('data-problem');
        if (p === 'phone-jack') { state.family = 'dac-amp'; state.answers.output = '3.5'; renderDacFlow(); }
        if (p === 'phone-dac') { state.family = 'digital-link'; renderDigitalFlow(); }
        if (p === 'plug-adapt') { state.family = 'adapter'; renderAdapterFlow(); }
        if (p === 'upgrade-cable') { state.family = 'cable'; renderCableFlow(); }
        if (p === 'dac-amp') { state.family = 'dac-amp'; renderDacFlow(); }
        if (p === 'dac-amp-link') { state.family = 'cable'; state.answers.purpose = 'analog-interconnect'; renderCableFlow(); }
      });
    });
    bindHome();
  }

  function problemChoice(key, title, text) {
    return '<button class="ddhv2-choice" data-problem="' + key + '"><strong>' + esc(title) + '</strong><small>' + esc(text) + '</small></button>';
  }

  function flowHeader(kicker, title) {
    return '<div class="ddhv2-flow-head"><div><div class="ddhv2-eyebrow">' + esc(kicker) + '</div><h3>' + esc(title) + '</h3></div><button class="ddhv2-close" data-home aria-label="Vissza">×</button></div>';
  }

  function backHomeButton() {
    return '<div class="ddhv2-flow-actions"><button class="ddhv2-secondary" data-home>Vissza a kategóriákhoz</button></div>';
  }

  function bindHome() {
    Array.prototype.forEach.call(app.querySelectorAll('[data-home]'), function (b) { b.addEventListener('click', renderHome); });
  }

  function startFamily(family) {
    state.family = family;
    state.answers = {};
    if (family === 'dac-amp') return renderDacFlow();
    if (family === 'cable') return renderCableFlow();
    if (family === 'adapter') return renderAdapterFlow();
    if (family === 'digital-link') return renderDigitalFlow();
    if (family === 'earphone') return renderSimpleFamily('earphone');
    return renderSimpleFamily('other');
  }

  function selectButton(key, value, title, text) {
    var active = state.answers[key] === value ? ' is-active' : '';
    return '<button class="ddhv2-choice' + active + '" data-answer-key="' + esc(key) + '" data-answer-value="' + esc(value) + '"><strong>' + esc(title) + '</strong>' + (text ? '<small>' + esc(text) + '</small>' : '') + '</button>';
  }

  function connectorButtons(key, values) {
    return '<div class="ddhv2-chip-grid">' + values.map(function (v) {
      var active = state.answers[key] === v ? ' is-active' : '';
      return '<button class="ddhv2-chip' + active + '" data-answer-key="' + key + '" data-answer-value="' + v + '">' + esc(CONNECTOR_LABELS[v] || v) + '</button>';
    }).join('') + '</div>';
  }

  function commonFooter(renderFn) {
    var stockChecked = state.onlyStock ? ' checked' : '';
    return '<div class="ddhv2-filterbar"><label><input type="checkbox" data-stock' + stockChecked + '> Csak elérhető modellek</label><span>' + currentCandidateCount() + ' lehetséges találat</span></div>' +
      '<div class="ddhv2-flow-actions"><button class="ddhv2-secondary" data-home>Kategóriák</button><button class="ddhv2-primary" data-results>Mutasd a találatokat</button></div>';
  }

  function bindAnswers(renderFn) {
    Array.prototype.forEach.call(app.querySelectorAll('[data-answer-key]'), function (b) {
      b.addEventListener('click', function () {
        state.answers[b.getAttribute('data-answer-key')] = b.getAttribute('data-answer-value');
        renderFn();
      });
    });
    var stock = app.querySelector('[data-stock]');
    if (stock) stock.addEventListener('change', function () { state.onlyStock = !!stock.checked; renderFn(); });
    var results = app.querySelector('[data-results]');
    if (results) results.addEventListener('click', renderResults);
    bindHome();
  }

  function renderDacFlow() {
    var a = state.answers;
    app.innerHTML = '<div class="ddhv2-flow">' + flowHeader('DAC / AMP', 'Milyen hordozható DAC illik a rendszeredhez?') +
      '<div class="ddhv2-section"><h4>1. Milyen fejhallgató-kimenetet használsz?</h4><div class="ddhv2-choice-grid">' +
        selectButton('output', '3.5', '3,5 mm', 'Single-ended') +
        selectButton('output', '4.4', '4,4 mm balanced', 'Pentaconn balanced') +
        selectButton('output', 'both', '3,5 + 4,4 mm', 'Mindkettőt használom') +
        selectButton('output', 'any', 'Mindegy', 'A funkciók alapján döntsünk') +
      '</div></div>' +
      '<div class="ddhv2-section"><h4>2. Mit szeretnél meghajtani?</h4><div class="ddhv2-choice-grid">' +
        selectButton('load', 'sensitive-iem', 'Érzékeny IEM', 'Kis teljesítményigény') +
        selectButton('load', 'multi-driver-iem', 'Multi-driver / hybrid IEM', 'Nagyobb tartalék') +
        selectButton('load', 'portable-headphone', 'Könnyen hajtható fejhallgató', 'Mobil over-ear') +
        selectButton('load', 'fullsize-headphone', 'Nagyobb fejhallgató', 'A teljesítmény elsődleges') +
      '</div></div>' +
      '<div class="ddhv2-section"><h4>3. Mi a legfontosabb extra?</h4><div class="ddhv2-choice-grid">' +
        selectButton('feature', 'compact', 'Minél kisebb legyen', '') +
        selectButton('feature', 'power', 'Nagy teljesítmény', '') +
        selectButton('feature', 'volume-control', 'Fizikai hangerőszabályzás', '') +
        selectButton('feature', 'charging', 'Töltés zenehallgatás közben', '') +
      '</div></div>' + commonFooter(renderDacFlow) + '</div>';
    bindAnswers(renderDacFlow);
  }

  function renderCableFlow() {
    app.innerHTML = '<div class="ddhv2-flow">' + flowHeader('Kábel', 'Milyen kapcsolatot szeretnél létrehozni?') +
      '<div class="ddhv2-section"><h4>1. Mire használod?</h4><div class="ddhv2-choice-grid">' +
        selectButton('purpose', 'digital-usb', 'USB / OTG adatkapcsolat', 'Telefon, tablet, DAP vagy számítógép') +
        selectButton('purpose', 'headphone-cable', 'Fejhallgató upgrade kábel', 'Over-ear fejhallgatóhoz') +
        selectButton('purpose', 'iem-cable', 'IEM / fülhallgató kábel', '2-Pin, MMCX és más IEM csatlakozók') +
        selectButton('purpose', 'analog-interconnect', 'Analóg összekötő', 'DAC és erősítő között') +
        selectButton('purpose', 'coax', 'Koaxiális digitális', 'S/PDIF kapcsolat') +
        selectButton('purpose', 'any', 'Nem tudom', 'Csatlakozó alapján keresek') +
      '</div></div>' +
      '<div class="ddhv2-section"><h4>2. Első csatlakozó</h4>' + connectorButtons('connectorA', ['usb-c','usb-a','usb-b','lightning','2.5','3.5','4.4','6.35','2-pin','mmcx','xlr4','rca','coax']) + '</div>' +
      '<div class="ddhv2-section"><h4>3. Második csatlakozó</h4>' + connectorButtons('connectorB', ['usb-c','usb-a','usb-b','2.5','3.5','4.4','6.35','2-pin','mmcx','a2dc','lemo','mini-xlr','xlr4','rca','coax']) + '</div>' +
      '<div class="ddhv2-section"><h4>4. Hossz</h4><div class="ddhv2-choice-grid ddhv2-choice-grid-small">' +
        selectButton('length', 'short', '15 cm alatt', 'Rövid mobil kapcsolat') +
        selectButton('length', 'medium', '15–100 cm', 'Általános digitális / analóg kapcsolat') +
        selectButton('length', 'long', '100 cm felett', 'Fejhallgató vagy asztali rendszer') +
        selectButton('length', 'any', 'Mindegy', '') +
      '</div></div>' + commonFooter(renderCableFlow) + '</div>';
    bindAnswers(renderCableFlow);
  }

  function renderAdapterFlow() {
    app.innerHTML = '<div class="ddhv2-flow">' + flowHeader('Adapter / átalakító', 'Miből szeretnél mibe átalakítani?') +
      '<div class="ddhv2-direction"><div class="ddhv2-section"><h4>Kiinduló csatlakozó</h4>' + connectorButtons('from', ['2.5','3.5','4.4','6.35','xlr4','usb-c','usb-a','rca','coax']) + '</div>' +
      '<div class="ddhv2-arrow">→</div>' +
      '<div class="ddhv2-section"><h4>Szükséges csatlakozó</h4>' + connectorButtons('to', ['2.5','3.5','4.4','6.35','xlr4','usb-c','usb-a','rca','coax']) + '</div></div>' +
      '<p class="ddhv2-helper">Az adaptereknél a dugó/aljzat irányt is figyelembe vesszük, ha az a termékadatból egyértelműen azonosítható.</p>' +
      commonFooter(renderAdapterFlow) + '</div>';
    bindAnswers(renderAdapterFlow);
  }

  function renderDigitalFlow() {
    app.innerHTML = '<div class="ddhv2-flow">' + flowHeader('Digitális kapcsolat', 'Milyen két eszközt szeretnél digitálisan összekötni?') +
      '<div class="ddhv2-section"><h4>Forrásoldali csatlakozó</h4>' + connectorButtons('connectorA', ['usb-c','lightning','usb-a','rca','coax']) + '</div>' +
      '<div class="ddhv2-section"><h4>DAC / készülék oldali csatlakozó</h4>' + connectorButtons('connectorB', ['usb-c','usb-b','rca','coax']) + '</div>' +
      '<div class="ddhv2-section"><h4>Hossz</h4><div class="ddhv2-choice-grid ddhv2-choice-grid-small">' +
        selectButton('length', 'short', '15 cm alatt', 'Telefon / DAP mellé') +
        selectButton('length', 'medium', '15–100 cm', 'Általános használat') +
        selectButton('length', 'long', '100 cm felett', 'Asztali rendszer') +
        selectButton('length', 'any', 'Mindegy', '') +
      '</div></div>' + commonFooter(renderDigitalFlow) + '</div>';
    bindAnswers(renderDigitalFlow);
  }

  function renderSimpleFamily(family) {
    state.family = family;
    app.innerHTML = '<div class="ddhv2-flow">' + flowHeader(FAMILY_COPY[family].title, FAMILY_COPY[family].text) +
      '<div class="ddhv2-simple-intro">Ebben a kategóriában jelenleg kevés termék van, ezért közvetlenül megmutatjuk az elérhető találatokat.</div>' +
      commonFooter(function(){ renderSimpleFamily(family); }) + '</div>';
    bindAnswers(function(){ renderSimpleFamily(family); });
  }

  function familyMatch(p) {
    return p.families.indexOf(state.family) !== -1 || (state.family === 'digital-link' && p.families.indexOf('cable') !== -1 && p.useCases.indexOf('digital-usb') !== -1);
  }

  function connectorMatch(p, key) {
    var v = state.answers[key];
    if (!v) return true;
    return p.connectors.indexOf(v) !== -1;
  }

  function lengthMatch(p) {
    var v = state.answers.length;
    if (!v || v === 'any' || p.lengthCm == null) return true;
    if (v === 'short') return p.lengthCm < 15;
    if (v === 'medium') return p.lengthCm >= 15 && p.lengthCm <= 100;
    if (v === 'long') return p.lengthCm > 100;
    return true;
  }

  function hardFilter(p) {
    if (!familyMatch(p)) return false;
    if (state.onlyStock && p.stock === 'out') return false;
    if (!connectorMatch(p, 'connectorA') || !connectorMatch(p, 'connectorB')) return false;
    if (!lengthMatch(p)) return false;
    if (state.family === 'dac-amp') {
      var out = state.answers.output;
      if (out && out !== 'any') {
        var outputs = p.outputs || p.connectors || [];
        if (out === 'both' && !(outputs.indexOf('3.5') !== -1 && outputs.indexOf('4.4') !== -1)) return false;
        if (out !== 'both' && outputs.indexOf(out) === -1) return false;
      }
    }
    if (state.family === 'adapter') {
      var from = state.answers.from, to = state.answers.to;
      if (from && p.connectors.indexOf(from) === -1) return false;
      if (to && p.connectors.indexOf(to) === -1) return false;
    }
    return true;
  }

  function currentCandidateCount() {
    return state.catalogue.filter(hardFilter).length;
  }

  function score(p) {
    if (!hardFilter(p)) return null;
    var s = 50;
    var reasons = [];

    if (p.stock === 'in') { s += 8; reasons.push('jelenleg elérhető'); }
    if (p.stock === 'preorder') { s += 2; reasons.push('előrendelhető'); }

    ['connectorA','connectorB'].forEach(function (key) {
      var v = state.answers[key];
      if (v && p.connectors.indexOf(v) !== -1) { s += 12; reasons.push((CONNECTOR_LABELS[v] || v) + ' csatlakozó'); }
    });

    if (state.family === 'adapter') {
      var f = state.answers.from, t = state.answers.to;
      if (f && t) {
        if (p.from === f && p.to === t) { s += 32; reasons.push('pontos átalakítási irány'); }
        else if (p.connectors.indexOf(f) !== -1 && p.connectors.indexOf(t) !== -1) { s += 15; reasons.push('mindkét szükséges csatlakozó megvan'); }
      }
    }

    if (state.family === 'cable') {
      var purpose = state.answers.purpose;
      if (purpose && purpose !== 'any' && p.useCases.indexOf(purpose) !== -1) { s += 20; reasons.push('megfelel a kiválasztott felhasználásnak'); }
      if (state.answers.length && state.answers.length !== 'any' && p.lengthCm != null) { s += 8; reasons.push(p.lengthCm + ' cm hossz'); }
    }

    if (state.family === 'digital-link') {
      if (p.useCases.indexOf('digital-usb') !== -1 || p.useCases.indexOf('coax') !== -1) { s += 18; reasons.push('digitális jelátvitelre készült'); }
    }

    if (state.family === 'dac-amp') {
      var load = state.answers.load;
      if (load && (p.suitableFor || []).indexOf(load) !== -1) { s += 20; reasons.push('illeszkedik a választott IEM / fejhallgató terheléshez'); }
      var feature = state.answers.feature;
      if (feature === 'power') { s += (p.performance || 1) * 6; if ((p.performance || 0) >= 4) reasons.push('nagy teljesítménytartalék'); }
      else if (feature && (p.features || []).indexOf(feature) !== -1) { s += 24; reasons.push('megvan a kiemelt funkció'); }
      else if (feature) s -= 8;
    }

    if (p.priceValue) s += Math.max(0, 6 - Math.min(6, p.priceValue / 50000));
    return { score: Math.max(1, Math.min(99, Math.round(s))), reasons: unique(reasons).slice(0, 4) };
  }

  function ranked() {
    return state.catalogue.map(function (p) {
      var r = score(p);
      if (!r) return null;
      var q = Object.assign({}, p);
      q.match = r.score;
      q.reasons = r.reasons;
      return q;
    }).filter(Boolean).sort(function (a, b) { return b.match - a.match || a.priceValue - b.priceValue; });
  }

  function stockLabel(stock) {
    if (stock === 'in') return ['Raktáron', 'in'];
    if (stock === 'preorder') return ['Előrendelhető', 'pre'];
    if (stock === 'out') return ['Nincs raktáron', 'out'];
    return ['Készlet ellenőrzése', 'unknown'];
  }

  function resultCard(p, index) {
    var stock = stockLabel(p.stock);
    var image = p.image ? '<img src="' + esc(p.image) + '" alt="' + esc(p.name) + '" loading="lazy">' : '<div class="ddhv2-noimage">ddHiFi</div>';
    var specs = [];
    if (p.connectors && p.connectors.length) specs.push(p.connectors.slice(0, 3).map(function(c){return CONNECTOR_LABELS[c] || c;}).join(' + '));
    if (p.lengthCm != null) specs.push(p.lengthCm + ' cm');
    if (p.power44) specs.push(p.power44 + ' mW balanced');
    return '<article class="ddhv2-result-card">' +
      '<div class="ddhv2-result-top"><span>' + (index === 0 ? 'Legjobb találat' : (index + 1) + '. találat') + '</span><b>' + p.match + '<small>match</small></b></div>' +
      '<div class="ddhv2-result-image">' + image + '</div>' +
      '<h4>' + esc(p.name) + '</h4>' +
      (p.summary ? '<p class="ddhv2-summary">' + esc(p.summary) + '</p>' : '') +
      '<div class="ddhv2-specs">' + specs.map(function(s){return '<span>' + esc(s) + '</span>';}).join('') + '</div>' +
      (p.reasons.length ? '<ul class="ddhv2-reasons">' + p.reasons.map(function(r){return '<li>' + esc(r) + '</li>';}).join('') + '</ul>' : '') +
      '<div class="ddhv2-result-meta"><strong>' + esc(p.price || '') + '</strong><span class="' + stock[1] + '">' + stock[0] + '</span></div>' +
      '<a href="' + esc(p.url) + '">Termék megtekintése</a>' +
    '</article>';
  }

  function renderResults() {
    var items = ranked();
    var title = FAMILY_COPY[state.family] ? FAMILY_COPY[state.family].title : 'Találatok';
    if (!items.length) {
      app.innerHTML = '<div class="ddhv2-results"><div class="ddhv2-results-head">' + flowHeader(title, 'Nincs pontos találat a kiválasztott feltételekre.') + '</div><p class="ddhv2-lead">Próbálj meg egy csatlakozót vagy a készletszűrést feloldani.</p><div class="ddhv2-flow-actions"><button class="ddhv2-secondary" data-home>Kategóriák</button><button class="ddhv2-primary" data-edit>Feltételek módosítása</button></div></div>';
      bindResultNav();
      return;
    }
    var shown = items.slice(0, 6);
    app.innerHTML = '<div class="ddhv2-results">' +
      '<div class="ddhv2-results-head">' + flowHeader(title, shown[0].name + ' illeszkedik legjobban a választásaidhoz.') + '<p>' + items.length + ' kompatibilis terméket találtunk. Az első hatot a relevancia alapján rendeztük.</p></div>' +
      '<div class="ddhv2-result-grid">' + shown.map(resultCard).join('') + '</div>' +
      '<div class="ddhv2-flow-actions"><button class="ddhv2-secondary" data-home>Kategóriák</button><button class="ddhv2-primary" data-edit>Feltételek módosítása</button></div>' +
    '</div>';
    bindResultNav();
  }

  function bindResultNav() {
    bindHome();
    var edit = app.querySelector('[data-edit]');
    if (edit) edit.addEventListener('click', function () {
      if (state.family === 'dac-amp') renderDacFlow();
      else if (state.family === 'cable') renderCableFlow();
      else if (state.family === 'adapter') renderAdapterFlow();
      else if (state.family === 'digital-link') renderDigitalFlow();
      else renderSimpleFamily(state.family);
    });
  }

  app.innerHTML = '<div class="ddhv2-loading"><div class="ddhv2-loader"></div><strong>ddHiFi kínálat betöltése</strong><span>Az aktuális termékeket és készletjelzéseket olvassuk be.</span></div>';
  loadCatalogue();
})();
