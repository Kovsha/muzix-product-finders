/* ddHiFi Brand Finder V2 data/config */
window.MUZIX_DDHIFI_BRAND_DATA = {
  version: '2.0.0-beta.1',
  brand: 'ddHiFi',

  families: [
    { key: 'dac-amp', title: 'DAC / fejhallgató-erősítő', subtitle: 'Telefonhoz, tablethez vagy számítógéphez', icon: 'wave' },
    { key: 'cable', title: 'Kábel', subtitle: 'USB, OTG, analóg, fejhallgató és IEM kábelek', icon: 'cable' },
    { key: 'adapter', title: 'Adapter / átalakító', subtitle: 'Jack, Pentaconn, XLR, USB és egyéb csatlakozók', icon: 'adapter' },
    { key: 'earphone', title: 'Fülhallgató', subtitle: 'Vezetékes IEM és kapcsolódó megoldások', icon: 'earphone' },
    { key: 'digital-link', title: 'Digitális kapcsolat', subtitle: 'Telefon, DAP vagy PC összekötése DAC-kal', icon: 'digital' },
    { key: 'other', title: 'Egyéb kiegészítő', subtitle: 'Tok, tartó, jeltovábbító és más megoldások', icon: 'other' }
  ],

  connectorAliases: {
    'usb-c': ['usb type-c', 'usb-c', 'type-c', 'c típusú usb', 'type c'],
    'usb-a': ['usb-a', 'usb a'],
    'usb-b': ['usb-b', 'usb b'],
    'lightning': ['lightning'],
    '2.5': ['2,5mm', '2.5mm', '2,5 mm', '2.5 mm'],
    '3.5': ['3,5mm', '3.5mm', '3,5 mm', '3.5 mm'],
    '4.4': ['4,4mm', '4.4mm', '4,4 mm', '4.4 mm', 'pentaconn'],
    '6.35': ['6,35mm', '6.35mm', '6,35 mm', '6.35 mm'],
    '2-pin': ['2-pin', '2 pin', '0.78mm', '0,78mm'],
    'mmcx': ['mmcx'],
    'a2dc': ['a2dc'],
    'lemo': ['lemo'],
    'mini-xlr': ['mini-xlr', 'mini xlr'],
    'xlr4': ['4-pin xlr', 'xlr 4-pin', 'xlr4', 'xlr 4 pin'],
    'xlr3': ['3-pin xlr', 'xlr 3-pin', 'xlr3', 'xlr 3 pin'],
    'rca': ['rca'],
    'coax': ['coax', 'koax']
  },

  /*
   * Optional exact metadata overrides. The engine auto-discovers the live catalogue
   * from the ddHiFi brand pages and parses names/links/price/stock/connectors.
   * Put only information here that cannot be inferred reliably from the storefront.
   */
  overrides: {
    'DDHIFI-TC35M2': {
      family: 'dac-amp', outputs: ['3.5'], performance: 1,
      features: ['compact'], suitableFor: ['sensitive-iem', 'dynamic-iem'],
      summary: 'Ultrakompakt USB-C DAC/AMP 3,5 mm-es fülhallgatókhoz.'
    },
    'DDHIFI-TC44CM2': {
      family: 'dac-amp', outputs: ['4.4'], performance: 3,
      power44: 330, features: ['balanced', 'compact'],
      suitableFor: ['dynamic-iem', 'multi-driver-iem', 'portable-headphone'],
      summary: 'Minimalista 4,4 mm balanced DAC/AMP nagyobb teljesítménytartalékkal.'
    },
    'DDHIFI-TC44PROM3': {
      family: 'dac-amp', outputs: ['3.5', '4.4'], performance: 2,
      power35: 90, power44: 120, features: ['balanced', 'compact'],
      suitableFor: ['sensitive-iem', 'dynamic-iem', 'multi-driver-iem', 'portable-headphone'],
      summary: 'Kompakt mindenes 3,5 és 4,4 mm-es kimenettel.'
    },
    'DDHIFI-TC44PRO-E3': {
      family: 'dac-amp', outputs: ['3.5', '4.4'], performance: 5,
      power35: 175, power44: 510,
      features: ['balanced', 'volume-control', 'gain', 'detachable-usb'],
      suitableFor: ['dynamic-iem', 'multi-driver-iem', 'portable-headphone', 'fullsize-headphone'],
      summary: 'Nagy teljesítményű moduláris DAC/AMP fizikai hangerőszabályzással és gain móddal.'
    },
    'DDHIFI-TC44GRIP': {
      family: 'dac-amp', outputs: ['3.5', '4.4'], performance: 4,
      power35: 80, power44: 330,
      features: ['balanced', 'charging', 'magnetic'],
      suitableFor: ['dynamic-iem', 'multi-driver-iem', 'portable-headphone'],
      summary: 'Telefonra rögzíthető DAC/AMP, amely zenehallgatás közben is engedi a töltést.'
    },
    'DDHIFI-DJ65B-AL': {
      family: 'adapter', from: '6.35', to: '4.4',
      fromGender: 'male', toGender: 'female',
      useCases: ['headphone-adapter']
    },
    'DDHIFI-XLR44B': {
      family: 'adapter', from: 'xlr4', to: '4.4',
      fromGender: 'male', toGender: 'female',
      useCases: ['headphone-adapter']
    },
    'DDHIFI-XLR44C': {
      family: 'adapter', from: '4.4', to: 'xlr4',
      fromGender: 'male', toGender: 'female',
      useCases: ['headphone-adapter']
    },
    'DDHIFI-TC07BC-100': {
      family: 'digital-link', connectors: ['usb-c', 'usb-b'], lengthCm: 100,
      useCases: ['phone-to-dac', 'tablet-to-dac', 'pc-to-dac']
    }
  }
};
