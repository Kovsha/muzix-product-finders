# ddHiFi Brand Finder V2

This branch contains the next-generation ddHiFi brand assistant for Muzix.

## Scope

The finder is no longer DAC-only. It supports:

- DAC / headphone amplifier
- cables
- adapters / converters
- earphones
- digital / OTG connections
- other accessories
- problem-solver entry flow for users who do not know the product category

## Runtime data strategy

The engine reads the current ddHiFi brand page and its pagination pages on muzix.hu. From the live catalogue it attempts to identify:

- SKU from product URL
- product title
- product URL
- current price
- stock state
- product image
- broad product family
- connectors from the product title
- cable length from the product title
- common use cases

`ddhifi-brand-data.js` only contains exact metadata that cannot be reliably inferred from the storefront.

## UNAS HTML

```html
<section id="ddhv2-finder">
  <div class="ddhv2-shell">
    <div data-ddhv2-app></div>
  </div>
</section>
```

## UNAS external integration script for beta testing

```html
<script src="https://cdn.jsdelivr.net/gh/Kovsha/muzix-product-finders@ddhifi-brand-finder-v2/ddhifi-v2/ddhifi-brand-loader.js?v=2.0.0-beta.1"></script>
```

Do not replace the production V1 loader until V2 is tested on the DD HIFI brand page.

## Data still worth importing from UNAS

A DD HIFI product export would make connector and product-family classification significantly more reliable, especially for products whose titles do not contain every relevant parameter.

Useful fields:

- SKU / Cikkszám
- product name
- manufacturer
- category path
- product status
- all product parameters
- Connector type (1st)
- Connector type (2nd)
- Csatlakozók
- Hossz / Méret
- cable type / product type parameters
- headphone / IEM connector parameters
- optionally product URL

Price and stock do not need to be maintained in GitHub because the finder reads them from the live storefront.
