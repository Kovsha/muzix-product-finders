/* ddHiFi Brand Finder V2.2 loader */
(function(){
'use strict';
if(window.__MUZIX_DDHIFI_BRAND_V22_LOADER__)return;
window.__MUZIX_DDHIFI_BRAND_V22_LOADER__=true;

var BASE='https://cdn.jsdelivr.net/gh/Kovsha/muzix-product-finders@ddhifi-brand-finder-v2/ddhifi-v2/';
var VERSION='2.2.0-beta.1';

function css(){
  var old=document.getElementById('ddhv2-css');
  if(old&&old.parentNode)old.parentNode.removeChild(old);
  var l=document.createElement('link');
  l.id='ddhv2-css';
  l.rel='stylesheet';
  l.href=BASE+'ddhifi-brand-finder.css?v='+VERSION;
  (document.head||document.documentElement).appendChild(l);
}

function script(id,file,done){
  var old=document.getElementById(id);
  if(old&&old.parentNode)old.parentNode.removeChild(old);
  var s=document.createElement('script');
  s.id=id;
  s.src=BASE+file+'?v='+VERSION;
  s.async=false;
  s.onload=function(){if(done)done();};
  s.onerror=function(){console.error('[ddHiFi V2.2] Nem tölthető be:',s.src);};
  (document.head||document.documentElement).appendChild(s);
}

function loadQueue(files,index){
  index=index||0;
  if(index>=files.length)return;
  var item=files[index];
  script(item[0],item[1],function(){loadQueue(files,index+1);});
}

function boot(){
  var root=document.getElementById('ddhv2-finder');
  if(!root)return;

  root.removeAttribute('data-ddhv21-ready');
  delete root.dataset.ddhv21Ready;
  window.MUZIX_DDHIFI_V21={};
  window.MUZIX_DDHIFI_PRODUCT_URLS={};

  css();
  loadQueue([
    ['ddhv22-data','ddhifi-brand-data.js'],
    ['ddhv22-urls1','ddhifi-v21-urls-1.js'],
    ['ddhv22-urls2','ddhifi-v21-urls-2.js'],
    ['ddhv22-urls3','ddhifi-v21-urls-3.js'],
    ['ddhv22-urls4','ddhifi-v21-urls-4.js'],
    ['ddhv22-urls5','ddhifi-v21-urls-5.js'],
    ['ddhv22-urls6','ddhifi-v21-urls-6.js'],
    ['ddhv22-core','ddhifi-v21-core.js'],
    ['ddhv22-patches','ddhifi-v21-patches.js'],
    ['ddhv22-flows','ddhifi-v21-flows.js'],
    ['ddhv22-results','ddhifi-v21-results.js'],
    ['ddhv22-start','ddhifi-v21-start.js']
  ]);
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
else boot();
})();
