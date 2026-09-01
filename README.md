# muzix-product-finders
Product finder scripts for Muzix webshops.

## ddHiFi finder

Files:
- `ddhifi/ddhifi-products.js` product data
- `ddhifi/ddhifi-finder.js` finder engine

Recommended load order on UNAS:

```html
<div id="ddhf26-finder">
  <div class="ddhf26-shell">
    <header class="ddhf26-header">
      <span class="ddhf26-kicker">ddHiFi Product Finder</span>
      <h2 class="ddhf26-title">Melyik ddHiFi DAC illik hozzád?</h2>
      <p class="ddhf26-intro">Válaszolj néhány kérdésre, és a csatlakozás, a fejhallgató, a teljesítményigény és a használati mód alapján rangsoroljuk a számodra megfelelő modelleket.</p>
    </header>
    <div class="ddhf26-progress-wrap"><div class="ddhf26-progress"><div class="ddhf26-progress-bar" data-ddhf26-progress></div></div></div>
    <div class="ddhf26-main" data-ddhf26-app></div>
  </div>
</div>

<script src="https://cdn.jsdelivr.net/gh/Kovsha/muzix-product-finders@main/ddhifi/ddhifi-products.js"></script>
<script src="https://cdn.jsdelivr.net/gh/Kovsha/muzix-product-finders@main/ddhifi/ddhifi-finder.js" defer></script>
```

The finder tries to resolve product URL, image, price and stock from the current UNAS page using the SKU. Product characteristics and recommendation logic are maintained separately in `ddhifi-products.js`.

For production changes, prefer version tags or jsDelivr purge/versioning instead of relying indefinitely on the mutable `@main` URL.
