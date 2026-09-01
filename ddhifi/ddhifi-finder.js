/*
 * ddHiFi Product Finder engine
 * Requires ddhifi-products.js to be loaded first.
 */
(function () {
  'use strict';

  var ROOT_ID = 'ddhf26-finder';
  var DATA = window.MUZIX_DDHIFI_FINDER_DATA;
  var root = document.getElementById(ROOT_ID);

  if (!root || !DATA || !Array.isArray(DATA.products)) return;
  if (root.dataset.ddhfReady === '1') return;
  root.dataset.ddhfReady = '1';

  var app = root.querySelector('[data-ddhf26-app]');
  var progress = root.querySelector('[data-ddhf26-progress]');
  if (!app || !progress) return;

  var QUESTIONS = [
    {
      key: 'device',
      title: 'Milyen eszközről hallgatsz zenét?',
      description: 'A forráseszköz a kapcsolat és a hordozható használat szempontjából fontos.',
      type: 'single',
      options: [
        ['usb-c-phone', 'USB-C telefon', 'Android vagy USB-C-s iPhone'],
        ['tablet', 'Tablet', 'USB-C-s iPad vagy Android tablet'],
        ['laptop', 'Laptop / PC', 'USB-C digitális audio'],
        ['lightning', 'Lightning iPhone', 'Külön kompatibilis kapcsolat szükséges']
      ]
    },
    {
      key: 'output',
      title: 'Milyen fejhallgató-csatlakozót használsz?',
      description: 'Ez valódi kompatibilitási szűrő. Nem ajánlunk első helyen nem megfelelő kimenetű modellt.',
      type: 'single',
      options: [
        ['3.5', '3,5 mm', 'Single-ended'],
        ['4.4', '4,4 mm balanced', 'Pentaconn balanced'],
        ['2.5', '2,5 mm balanced', 'Régebbi balanced kábelekhez'],
        ['both', '3,5 + 4,4 mm', 'Mindkettőt használom']
      ]
    },
    {
      key: 'load',
      title: 'Mit szeretnél meghajtani?',
      description: 'Egy érzékeny IEM és egy nagyobb fejhallgató teljesítményigénye jelentősen eltér.',
      type: 'single',
      options: [
        ['sensitive-iem', 'Érzékeny IEM', 'Kis teljesítményigény, fontos a hordozhatóság'],
        ['dynamic-iem', 'Single dynamic IEM', 'Általános vezetékes IEM'],
        ['multi-driver-iem', 'Multi-driver / hybrid IEM', 'Több meghajtós vagy hibrid fülhallgató'],
        ['portable-headphone', 'Könnyen hajtható fejhallgató', 'Hordozható vagy alacsonyabb teljesítményigényű over-ear'],
        ['fullsize-headphone', 'Nagyobb fejhallgató', 'A teljesítménytartalék már fontos szempont']
      ]
    },
    {
      key: 'priorities',
      title: 'Mi a legfontosabb számodra?',
      description: 'Legfeljebb három szempontot válassz. Ezek erősen befolyásolják az ajánlást.',
      type: 'multi',
      max: 3,
      options: [
        ['compact', 'Minél kisebb legyen', 'Zsebben és telefonon is kényelmes'],
        ['power', 'Nagy teljesítmény', 'Legyen minél nagyobb teljesítménytartalék'],
        ['controls', 'Fizikai hangerőszabályzás', 'Saját hangerőszabályzás a DAC-on'],
        ['gain', 'Gain kapcsoló', 'Külön erősítési fokozatot szeretnék'],
        ['charging', 'Töltés zenehallgatás közben', 'Passthrough töltés fontos'],
        ['detachable', 'Cserélhető USB kábel', 'Ne legyen fixen beépített a kábel'],
        ['direct', 'Közvetlen csatlakozás', 'Kábel nélkül közvetlenül csatlakozzon']
      ]
    },
    {
      key: 'sound',
      title: 'Milyen hangkaraktert részesítesz előnyben?',
      description: 'Ez csak finomhangolás. A kompatibilitás és a teljesítmény ennél nagyobb súlyt kap.',
      type: 'single',
      options: [
        ['any', 'Nem fontos', 'Ne befolyásolja az ajánlást'],
        ['neutral', 'Tiszta / neutrális', 'Minél kevésbé karakterezett megszólalás'],
        ['balanced', 'Kiegyensúlyozott / testes', 'Univerzálisabb, gazdagabb tónus'],
        ['relaxed', 'Lazább / hosszú hallgatásra', 'Kevésbé fárasztó karakter'],
        ['powerful', 'Dinamikus / erőteljes', 'Nagyobb energia és basszusérzet']
      ]
    },
    {
      key: 'music',
      title: 'Mit hallgatsz leggyakrabban?',
      description: 'Ez csak kisebb súlyú finomhangolás, nem kizárólag műfaj alapján választunk DAC-ot.',
      type: 'single',
      options: [
        ['any', 'Vegyesen mindent', 'Ne befolyásolja a rangsort'],
        ['vocal', 'Vokális zene', 'Ének, akusztikus zene'],
        ['classical', 'Klasszikus', 'Komolyzene és akusztikus felvételek'],
        ['orchestra', 'Nagyzenekari', 'Nagy dinamika, összetett hangszerelés'],
        ['pop', 'Pop / elektronikus', 'Modern, energikus felvételek'],
        ['instrumental', 'Instrumentális', 'Hangszeres zene']
      ]
    },
    {
      key: 'budget',
      title: 'Melyik árszint áll hozzád közelebb?',
      description: 'Relatív árszint a ddHiFi DAC-kínálaton belül. Az aktuális webshopárat az UNAS kezeli.',
      type: 'single',
      options: [
        ['value', 'Legjobb ár/érték', 'Az olcsóbb megoldások kapjanak előnyt'],
        ['mid', 'Középkategória', 'Ár és funkciók egyensúlya'],
        ['premium', 'Prémium is jöhet', 'A funkció fontosabb az árnál'],
        ['any', 'Nincs árkorlát', 'Ne számítson az árszint']
      ]
    }
  ];

  var state = {
    step: 0,
    device: null,
    output: null,
    load: null,
    priorities: [],
    sound: null,
    music: null,
    budget: null,
    onlyStock: false
  };

  var products = [];

  function esc(v) {
    return String(v == null ? '' : v)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function normalize(v) {
    return String(v || '').replace(/\s+/g, ' ').trim().toLowerCase();
  }

  function includes(arr, value) {
    return Array.isArray(arr) && arr.indexOf(value) !== -1;
  }

  function findProductLink(sku) {
    var skuUpper = String(sku).toUpperCase();
    var nodes = document.querySelectorAll('a[href], [data-sku], [data-product-sku]');

    for (var i = 0; i < nodes.length; i++) {
      if (root.contains(nodes[i])) continue;

      var hay = '';
      if (nodes[i].getAttribute) {
        hay += ' ' + (nodes[i].getAttribute('href') || '');
        hay += ' ' + (nodes[i].getAttribute('data-sku') || '');
        hay += ' ' + (nodes[i].getAttribute('data-product-sku') || '');
      }
      hay += ' ' + (nodes[i].textContent || '');

      try { hay = decodeURIComponent(hay); } catch (e) {}

      if (hay.toUpperCase().indexOf(skuUpper) !== -1) {
        if (nodes[i].tagName === 'A') return nodes[i];
        var inside = nodes[i].querySelector && nodes[i].querySelector('a[href]');
        if (inside) return inside;
        var parent = nodes[i].closest && nodes[i].closest('a[href]');
        if (parent) return parent;
      }
    }
    return null;
  }

  function findCard(link) {
    if (!link) return null;
    var selectors = [
      '.artlist__item', '.artlist__product', '.artlist__box',
      '.product-card', '.product-item', '.product__item',
      '.product_box', '.product-box', '[data-product-id]', '[data-sku]', 'article'
    ];

    for (var i = 0; i < selectors.length; i++) {
      var hit = link.closest(selectors[i]);
      if (hit) return hit;
    }

    var node = link.parentElement;
    for (var level = 0; level < 7 && node; level++, node = node.parentElement) {
      if (node.querySelector && node.querySelector('img')) return node;
    }
    return link.parentElement;
  }

  function extractImage(card) {
    if (!card) return '';
    var img = card.querySelector('img');
    if (!img) return '';
    return img.currentSrc || img.getAttribute('data-src') || img.getAttribute('data-lazy-src') || img.src || '';
  }

  function extractPrice(card) {
    if (!card) return '';
    var selectors = [
      '.artlist__price-sale', '.artlist__price-current', '.artlist__price',
      '.product__price-sale', '.product__price-current', '.product__price',
      '.product-price--sale', '.product-price', '[class*="price-sale"]',
      '[class*="price_current"]', '[class*="price-current"]'
    ];

    for (var i = 0; i < selectors.length; i++) {
      var el = card.querySelector(selectors[i]);
      if (el && el.textContent.trim()) return el.textContent.replace(/\s+/g, ' ').trim();
    }
    return '';
  }

  function detectStock(card) {
    if (!card) return 'unknown';
    var text = normalize(card.textContent);
    if (/előrendel|preorder|pre-order|vorbestell|precomand/.test(text)) return 'preorder';
    if (/nincs raktáron|elfogyott|out of stock|sold out|nicht auf lager|nicht verfügbar|stoc epuizat|indisponibil/.test(text)) return 'out';
    if (/raktáron|készleten|in stock|auf lager|sofort lieferbar|in stoc|disponibil/.test(text)) return 'in';
    return 'unknown';
  }

  function scanProduct(product) {
    var link = findProductLink(product.sku);
    var card = findCard(link);
    var copy = Object.assign({}, product);
    copy.live = {
      found: !!link,
      url: link ? link.href : (product.fallbackUrl || ''),
      image: extractImage(card),
      price: extractPrice(card),
      stock: detectStock(card)
    };
    return copy;
  }

  function scanAllProducts() {
    products = DATA.products.filter(function (p) { return p.enabled !== false; }).map(scanProduct);
  }

  function outputCompatible(product) {
    if (!state.output) return true;
    if (state.output === 'both') return includes(product.outputs, '3.5') && includes(product.outputs, '4.4');
    return includes(product.outputs, state.output);
  }

  function stockCompatible(product) {
    if (!state.onlyStock) return true;
    return product.live.stock !== 'out';
  }

  function hardCompatible(product) {
    return outputCompatible(product) && stockCompatible(product);
  }

  function requiredPerformance() {
    if (state.load === 'fullsize-headphone') return 5;
    if (state.load === 'portable-headphone') return 3;
    if (state.load === 'multi-driver-iem') return 3;
    if (state.load === 'dynamic-iem') return 2;
    return 1;
  }

  function scoreProduct(product) {
    if (!hardCompatible(product)) return { score: -999, reasons: [] };

    var score = 40;
    var reasons = [];

    if (state.device === 'lightning') score -= 5;
    else score += 5;

    if (state.output === 'both') {
      score += 18;
      reasons.push('3,5 és 4,4 mm-es kimenetet is kértél');
    } else if (state.output) {
      score += 14;
      reasons.push('Megvan a szükséges ' + state.output.replace('.', ',') + ' mm-es kimenet');
    }

    var diff = Math.abs(requiredPerformance() - product.performance);
    score += Math.max(0, 18 - diff * 5);

    if (includes(product.suitableFor, state.load)) score += 9;

    if (state.load === 'fullsize-headphone' && product.performance >= 5) {
      reasons.push('Nagyobb fejhallgatóhoz is komoly teljesítménytartalékot ad');
    }

    if (state.load === 'multi-driver-iem' && includes(product.suitableFor, 'multi-driver-iem')) {
      reasons.push('Multi-driver és hybrid IEM-ekhez is jól illeszkedik');
    }

    state.priorities.forEach(function (priority) {
      if (priority === 'compact') {
        score += product.compactness * 4;
        if (product.compactness >= 5) reasons.push('Kiemelkedően kompakt kialakítás');
      }
      if (priority === 'power') {
        score += product.performance * 7;
        if (product.performance >= 5) reasons.push('A nagy teljesítmény a modell egyik fő előnye');
      }
      if (priority === 'controls') {
        score += product.controls ? 24 : -11;
        if (product.controls) reasons.push('Saját fizikai hangerőszabályzást ad');
      }
      if (priority === 'gain') {
        score += product.gain ? 22 : -10;
        if (product.gain) reasons.push('Dedikált gain módot kínál');
      }
      if (priority === 'charging') {
        score += product.charging ? 30 : -22;
        if (product.charging) reasons.push('Zenehallgatás közbeni töltést is támogat');
      }
      if (priority === 'detachable') {
        score += product.detachableCable ? 22 : -9;
        if (product.detachableCable) reasons.push('Az USB kábel külön cserélhető');
      }
      if (priority === 'direct') {
        score += product.directPlug ? 20 : -6;
        if (product.directPlug) reasons.push('Közvetlenül csatlakoztatható, nincs külön DAC-kábel');
      }
    });

    if (state.sound && state.sound !== 'any' && includes(product.sound, state.sound)) {
      score += 8;
      reasons.push('A választott hangkarakter-preferenciához is illeszkedik');
    }

    if (state.music && state.music !== 'any' && includes(product.music, state.music)) score += 4;

    if (state.budget === 'value') score += (5 - product.priceTier) * 4;
    if (state.budget === 'mid') {
      if (product.priceTier === 2) score += 9;
      else if (product.priceTier === 3) score += 4;
    }
    if (state.budget === 'premium' && product.priceTier >= 3) score += 7;

    if (product.live.stock === 'in') {
      score += 5;
      reasons.push('Az oldal alapján jelenleg raktáron van');
    }
    if (product.live.stock === 'preorder') score -= 2;
    if (product.live.stock === 'out') score -= 8;
    if (product.legacy && state.output !== '2.5') score -= 13;

    score = Math.max(1, Math.min(99, Math.round(score)));
    reasons = reasons.filter(function (r, i, arr) { return arr.indexOf(r) === i; }).slice(0, 4);

    return { score: score, reasons: reasons };
  }

  function rankedProducts() {
    return products.map(function (p) {
      var s = scoreProduct(p);
      var copy = Object.assign({}, p);
      copy.matchScore = s.score;
      copy.matchReasons = s.reasons;
      return copy;
    }).filter(function (p) {
      return p.matchScore >= 0;
    }).sort(function (a, b) {
      return b.matchScore - a.matchScore;
    });
  }

  function isSelected(question, value) {
    if (question.type === 'multi') return state.priorities.indexOf(value) !== -1;
    return state[question.key] === value;
  }

  function canContinue(question) {
    if (question.type === 'multi') return state.priorities.length > 0;
    return !!state[question.key];
  }

  function compatibleCount() {
    return products.filter(hardCompatible).length;
  }

  function renderQuestion() {
    var q = QUESTIONS[state.step];
    progress.style.width = ((state.step / QUESTIONS.length) * 100) + '%';

    var html = '<div class="ddhf26-question">';
    html += '<span class="ddhf26-step">Kérdés ' + (state.step + 1) + ' / ' + QUESTIONS.length + '</span>';
    html += '<h3>' + esc(q.title) + '</h3>';
    html += '<p class="ddhf26-question-description">' + esc(q.description) + '</p>';
    html += '<div class="ddhf26-options">';

    q.options.forEach(function (opt) {
      var active = isSelected(q, opt[0]) ? ' is-active' : '';
      html += '<button type="button" class="ddhf26-option' + active + '" data-ddhf26-value="' + esc(opt[0]) + '">';
      html += '<strong>' + esc(opt[1]) + '</strong><small>' + esc(opt[2]) + '</small></button>';
    });

    html += '</div>';
    html += '<div class="ddhf26-filter-line">';
    html += '<div class="ddhf26-filter-info">Az ár, link, kép és készlet az aktuális terméklistából kerül beolvasásra.</div>';
    html += '<label class="ddhf26-check"><input type="checkbox" data-ddhf26-stock ' + (state.onlyStock ? 'checked' : '') + '> Csak elérhető modellek</label>';
    html += '</div></div>';

    html += '<div class="ddhf26-footer">';
    html += '<div><button type="button" class="ddhf26-btn ddhf26-btn-secondary" data-ddhf26-back ' + (state.step === 0 ? 'disabled' : '') + '>Vissza</button></div>';
    html += '<div class="ddhf26-compatible">' + compatibleCount() + ' kompatibilis modell</div>';
    html += '<div class="ddhf26-footer-right"><button type="button" class="ddhf26-btn ddhf26-btn-primary" data-ddhf26-next ' + (canContinue(q) ? '' : 'disabled') + '>' + (state.step === QUESTIONS.length - 1 ? 'Mutasd az ajánlásokat' : 'Tovább') + '</button></div>';
    html += '</div>';

    app.innerHTML = html;
    bindQuestionEvents(q);
  }

  function bindQuestionEvents(question) {
    Array.prototype.forEach.call(app.querySelectorAll('[data-ddhf26-value]'), function (button) {
      button.addEventListener('click', function () {
        var value = button.getAttribute('data-ddhf26-value');
        if (question.type === 'multi') {
          var idx = state.priorities.indexOf(value);
          if (idx !== -1) state.priorities.splice(idx, 1);
          else if (state.priorities.length < question.max) state.priorities.push(value);
        } else {
          state[question.key] = value;
        }
        renderQuestion();
      });
    });

    var stock = app.querySelector('[data-ddhf26-stock]');
    if (stock) stock.addEventListener('change', function () {
      state.onlyStock = !!stock.checked;
      renderQuestion();
    });

    var back = app.querySelector('[data-ddhf26-back]');
    if (back) back.addEventListener('click', function () {
      if (state.step > 0) {
        state.step--;
        renderQuestion();
      }
    });

    var next = app.querySelector('[data-ddhf26-next]');
    if (next) next.addEventListener('click', function () {
      if (!canContinue(question)) return;
      if (state.step < QUESTIONS.length - 1) {
        state.step++;
        renderQuestion();
      } else {
        renderResults();
      }
    });
  }

  function stockData(stock) {
    if (stock === 'in') return { text: 'Raktáron', className: 'is-in' };
    if (stock === 'out') return { text: 'Nincs raktáron', className: 'is-out' };
    if (stock === 'preorder') return { text: 'Előrendelhető', className: 'is-preorder' };
    return { text: 'Készlet nem azonosítható', className: '' };
  }

  function outputLabel(product) {
    return product.outputs.map(function (o) { return o.replace('.', ',') + ' mm'; }).join(' + ');
  }

  function connectionType(product) {
    if (product.detachableCable) return 'Cserélhető USB kábeles';
    if (product.directPlug) return 'Közvetlen adapter';
    return 'Rövid kábeles';
  }

  function yesNo(v) { return v ? 'Igen' : 'Nem'; }

  function whyNotTop(top, alternative) {
    var reasons = [];
    if (top.performance > alternative.performance) reasons.push(top.shortName + ' nagyobb teljesítménytartalékot kínál');
    if (top.controls && !alternative.controls) reasons.push(top.shortName + ' saját fizikai hangerőszabályzást ad');
    if (top.gain && !alternative.gain) reasons.push(top.shortName + ' külön gain módot is kínál');
    if (top.charging && !alternative.charging) reasons.push(top.shortName + ' támogatja a zenehallgatás közbeni töltést');
    if (top.detachableCable && !alternative.detachableCable) reasons.push(top.shortName + ' cserélhető USB kapcsolatot használ');
    if (top.compactness > alternative.compactness) reasons.push(top.shortName + ' kompaktabb kialakítású');
    if (!reasons.length) reasons.push('A választott prioritások összesített súlyozása alapján kapott magasabb pontszámot');
    return reasons.slice(0, 2).join('. ') + '.';
  }

  function productCard(product, index, topProduct) {
    var stock = stockData(product.live.stock);
    var image = product.live.image
      ? '<img src="' + esc(product.live.image) + '" alt="' + esc(product.name) + '" loading="lazy">'
      : '<div class="ddhf26-image-placeholder">A termékkép nem található az aktuális oldalon</div>';

    var badges = (product.badges || []).slice(0, 4).map(function (b) {
      return '<span class="ddhf26-tag">' + esc(b) + '</span>';
    }).join('');

    var reasons = product.matchReasons.length
      ? '<ul class="ddhf26-reasons">' + product.matchReasons.map(function (r) { return '<li>' + esc(r) + '</li>'; }).join('') + '</ul>'
      : '';

    var url = product.live.url || product.fallbackUrl || '';
    var why = index > 0
      ? '<details class="ddhf26-why"><summary>Miért nem ez lett az első?</summary><p>' + esc(whyNotTop(topProduct, product)) + '</p></details>'
      : '';

    return '<article class="ddhf26-product">' +
      '<div class="ddhf26-rank">' + (index === 0 ? 'Legjobb találat' : (index + 1) + '. ajánlás') + '</div>' +
      '<div class="ddhf26-score"><div><strong>' + product.matchScore + '</strong><small>match</small></div></div>' +
      '<div class="ddhf26-product-image">' + image + '</div>' +
      '<h4>' + esc(product.shortName) + '</h4>' +
      '<p class="ddhf26-product-lead">' + esc(product.description) + '</p>' +
      '<div class="ddhf26-tags">' + badges + '</div>' +
      reasons +
      '<div class="ddhf26-meta"><div class="ddhf26-price">' + esc(product.live.price || '') + '</div><div class="ddhf26-stock ' + stock.className + '">' + esc(stock.text) + '</div></div>' +
      '<a class="ddhf26-product-link' + (url ? '' : ' is-disabled') + '" href="' + esc(url || '#') + '">Termék megtekintése</a>' +
      why +
      '</article>';
  }

  function comparisonTable(list) {
    var rows = [
      ['Kimenet', function (p) { return outputLabel(p); }],
      ['Balanced teljesítmény', function (p) { return p.power44 ? p.power44 + ' mW' : 'Nincs megadva'; }],
      ['3,5 mm teljesítmény', function (p) { return p.power35 ? p.power35 + ' mW' : 'Nincs / nincs megadva'; }],
      ['DAC', function (p) { return p.dac || 'Nincs megadva'; }],
      ['Fizikai hangerő', function (p) { return yesNo(p.controls); }],
      ['Gain mód', function (p) { return yesNo(p.gain); }],
      ['Töltés hallgatás közben', function (p) { return yesNo(p.charging); }],
      ['Cserélhető USB kábel', function (p) { return yesNo(p.detachableCable); }],
      ['Kialakítás', function (p) { return connectionType(p); }]
    ];

    var html = '<div class="ddhf26-compare"><table><thead><tr><th>Összehasonlítás</th>';
    list.forEach(function (p) { html += '<th>' + esc(p.shortName) + '</th>'; });
    html += '</tr></thead><tbody>';

    rows.forEach(function (row) {
      html += '<tr><td>' + esc(row[0]) + '</td>';
      list.forEach(function (p) { html += '<td>' + esc(row[1](p)) + '</td>'; });
      html += '</tr>';
    });

    html += '</tbody></table></div>';
    return html;
  }

  function resetState() {
    state = {
      step: 0,
      device: null,
      output: null,
      load: null,
      priorities: [],
      sound: null,
      music: null,
      budget: null,
      onlyStock: false
    };
  }

  function renderResults() {
    scanAllProducts();
    progress.style.width = '100%';
    var ranked = rankedProducts();

    if (!ranked.length) {
      app.innerHTML = '<div class="ddhf26-empty"><span class="ddhf26-kicker">Nincs közvetlen találat</span><h3>A kiválasztott feltételek túl szűkek.</h3><p>Módosítsd a csatlakozót vagy kapcsold ki a csak elérhető modellek szűrőt.</p><button type="button" class="ddhf26-btn ddhf26-btn-secondary" data-ddhf26-restart>Válaszok módosítása</button></div>';
      var restartEmpty = app.querySelector('[data-ddhf26-restart]');
      if (restartEmpty) restartEmpty.onclick = function () { resetState(); renderQuestion(); };
      return;
    }

    var top = ranked.slice(0, 3);
    var cards = top.map(function (p, i) { return productCard(p, i, top[0]); }).join('');

    app.innerHTML = '<div class="ddhf26-results">' +
      '<div class="ddhf26-results-head"><div><span class="ddhf26-kicker">Személyre szabott ajánlás</span><h3>' + esc(top[0].shortName) + ' illeszkedik legjobban a választásaidhoz.</h3></div>' +
      '<p class="ddhf26-results-explain">A Match érték kompatibilitási és preferencia-pontszám. Nem hangminőségi százalék, és nem jelenti azt, hogy az egyik modell általánosan jobb a másiknál.</p></div>' +
      '<div class="ddhf26-result-grid">' + cards + '</div>' +
      comparisonTable(top) +
      '<div class="ddhf26-result-actions"><button type="button" class="ddhf26-btn ddhf26-btn-secondary" data-ddhf26-restart>Újrakezdés</button><button type="button" class="ddhf26-btn ddhf26-btn-secondary" data-ddhf26-edit>Utolsó válasz módosítása</button></div>' +
      '<p class="ddhf26-tech-note">A termék URL-ját, képét, árát és készletjelzését a finder SKU alapján próbálja kiolvasni az aktuális UNAS termékkártyából.</p>' +
      '</div>';

    var restart = app.querySelector('[data-ddhf26-restart]');
    if (restart) restart.onclick = function () { resetState(); renderQuestion(); };

    var edit = app.querySelector('[data-ddhf26-edit]');
    if (edit) edit.onclick = function () { state.step = QUESTIONS.length - 1; renderQuestion(); };
  }

  scanAllProducts();
  renderQuestion();

  var timer = null;
  var observer = new MutationObserver(function () {
    clearTimeout(timer);
    timer = setTimeout(scanAllProducts, 350);
  });

  observer.observe(document.body, { childList: true, subtree: true });
  setTimeout(function () {
    try { observer.disconnect(); } catch (e) {}
  }, 15000);
})();
