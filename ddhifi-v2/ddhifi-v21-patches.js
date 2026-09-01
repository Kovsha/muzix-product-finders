/* ddHiFi V2.1 normalization + full-catalogue patches */
(function(){
'use strict';
var V=window.MUZIX_DDHIFI_V21;if(!V)return;

var oldFamily=V.familyFromUrl;
V.familyFromUrl=function(href,title){
  if(/\badapter\b/i.test(String(title||'')))return'adapter';
  return oldFamily(href,title);
};

function familyFromSubtype(subtype){
  if(subtype==='dac'||subtype==='amp')return'dac-amp';
  if(subtype==='adapter')return'adapter';
  if(subtype==='digital'||subtype==='analog'||subtype==='headphone')return'cable';
  if(subtype==='bridge')return'interface';
  if(subtype==='iem')return'earphone';
  return'other';
}

var oldEnrich=V.enrich;
V.enrich=function(p){
  p=oldEnrich(p);
  var t=String(p.title||'');
  var m=t.match(/(?:-|\s)(\d+(?:[\.,]\d+)?)\s*(mm|cm|m)\s*$/i);
  if(m){
    var n=parseFloat(m[1].replace(',','.'));
    if(isFinite(n)){
      var cm=m[2].toLowerCase()==='mm'?n/10:(m[2].toLowerCase()==='m'?n*100:n);
      cm=Math.round(cm);
      if(cm>0&&cm<=1000)p.lengthsCm=[cm];
    }
  }

  if(!p.family)p.family=familyFromSubtype(p.subtype);

  /* Every active ddHiFi SKU in the UNAS export uses this main-image pattern. */
  if(!p.image&&p.sku){
    p.image='https://www.muzix.hu/shop_ordered/90147/shop_pic/'+encodeURIComponent(p.sku)+'.jpg';
  }

  var urls=window.MUZIX_DDHIFI_PRODUCT_URLS||{};
  if(!p.url&&p.sku&&urls[p.sku])p.url=urls[p.sku];
  return p;
};

V.seedCatalogue=function(){
  var index=V.DATA.catalogueIndex||{};
  var urls=window.MUZIX_DDHIFI_PRODUCT_URLS||{};
  return Object.keys(index).map(function(sku){
    var meta=index[sku]||{};
    var model=meta.model||sku;
    return V.enrich({
      sku:sku,
      title:'DD HIFI '+model,
      name:model,
      url:urls[sku]||'',
      image:'https://www.muzix.hu/shop_ordered/90147/shop_pic/'+encodeURIComponent(sku)+'.jpg',
      price:'',
      stock:'unknown',
      family:familyFromSubtype(meta.subtype),
      subtype:meta.subtype||'other',
      connectors:[],
      source:'seed'
    });
  });
};

/* Later/live DOM data wins, while seed data fills products UNAS has not AJAX-loaded. */
V.merge=function(items){
  var map={};
  items.forEach(function(p){
    if(!p||!p.sku)return;
    if(!map[p.sku]){
      map[p.sku]=p;
      return;
    }
    var cur=map[p.sku];
    if(p.title)cur.title=p.title;
    if(p.name)cur.name=p.name;
    if(p.url)cur.url=p.url;
    if(p.image)cur.image=p.image;
    if(p.price)cur.price=p.price;
    if(p.stock&&p.stock!=='unknown')cur.stock=p.stock;
    if(p.family)cur.family=p.family;
    if(p.subtype)cur.subtype=p.subtype;
    if(p.connectors&&p.connectors.length)cur.connectors=V.unique((cur.connectors||[]).concat(p.connectors));
    if(p.connectorDetails&&p.connectorDetails.length)cur.connectorDetails=p.connectorDetails;
    Object.keys(p).forEach(function(k){
      if(cur[k]==null||cur[k]==='')cur[k]=p[k];
    });
  });
  return Object.keys(map).map(function(k){return V.enrich(map[k]);});
};

V.load=function(done){
  var seeded=V.seedCatalogue();
  var first=seeded.concat(V.parse(document,location.href));
  var pages=V.pageUrls();

  if(!pages.length){
    V.state.catalogue=V.merge(first);
    done();
    return;
  }

  Promise.all(pages.map(function(url){
    return fetch(url,{credentials:'same-origin'})
      .then(function(r){return r.ok?r.text():'';})
      .then(function(html){return html?V.parse(new DOMParser().parseFromString(html,'text/html'),url):[];})
      .catch(function(){return[];});
  })).then(function(groups){
    var all=first.slice();
    groups.forEach(function(g){all=all.concat(g);});
    V.state.catalogue=V.merge(all);
    done();
  });
};
})();
