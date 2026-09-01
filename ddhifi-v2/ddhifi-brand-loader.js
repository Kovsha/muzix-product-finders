/* ddHiFi Brand Finder V2.1 loader */
(function(){
'use strict';
if(window.__MUZIX_DDHIFI_BRAND_V21_LOADER__)return;
window.__MUZIX_DDHIFI_BRAND_V21_LOADER__=true;

var BASE='https://cdn.jsdelivr.net/gh/Kovsha/muzix-product-finders@ddhifi-brand-finder-v2/ddhifi-v2/';
var VERSION='2.1.0-beta.3';

function css(){
  if(document.getElementById('ddhv2-css'))return;
  var l=document.createElement('link');
  l.id='ddhv2-css';
  l.rel='stylesheet';
  l.href=BASE+'ddhifi-brand-finder.css?v='+VERSION;
  (document.head||document.documentElement).appendChild(l);
}

function script(id,file,done){
  if(document.getElementById(id)){if(done)done();return;}
  var s=document.createElement('script');
  s.id=id;
  s.src=BASE+file+'?v='+VERSION;
  s.async=false;
  s.onload=function(){if(done)done();};
  s.onerror=function(){console.error('[ddHiFi V2.1] Nem tölthető be:',s.src);};
  (document.head||document.documentElement).appendChild(s);
}

function loadQueue(files,index){
  index=index||0;
  if(index>=files.length)return;
  var item=files[index];
  script(item[0],item[1],function(){loadQueue(files,index+1);});
}

function boot(){
  if(!document.getElementById('ddhv2-finder'))return;
  css();
  loadQueue([
    ['ddhv21-data','ddhifi-brand-data.js'],
    ['ddhv21-urls1','ddhifi-v21-urls-1.js'],
    ['ddhv21-urls2','ddhifi-v21-urls-2.js'],
    ['ddhv21-urls3','ddhifi-v21-urls-3.js'],
    ['ddhv21-urls4','ddhifi-v21-urls-4.js'],
    ['ddhv21-urls5','ddhifi-v21-urls-5.js'],
    ['ddhv21-urls6','ddhifi-v21-urls-6.js'],
    ['ddhv21-core','ddhifi-v21-core.js'],
    ['ddhv21-patches','ddhifi-v21-patches.js'],
    ['ddhv21-flows','ddhifi-v21-flows.js'],
    ['ddhv21-results','ddhifi-v21-results.js'],
    ['ddhv21-start','ddhifi-v21-start.js']
  ]);
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
else boot();
})();
