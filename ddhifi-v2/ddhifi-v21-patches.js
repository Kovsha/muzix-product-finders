/* ddHiFi V2.1 normalization patches */
(function(){
'use strict';
var V=window.MUZIX_DDHIFI_V21;if(!V)return;
var oldFamily=V.familyFromUrl;
V.familyFromUrl=function(href,title){if(/\badapter\b/i.test(String(title||'')))return'adapter';return oldFamily(href,title);};
var oldEnrich=V.enrich;
V.enrich=function(p){p=oldEnrich(p);var t=String(p.title||'');var m=t.match(/(?:-|\s)(\d+(?:[\.,]\d+)?)\s*(mm|cm|m)\s*$/i);if(m){var n=parseFloat(m[1].replace(',','.'));if(isFinite(n)){var cm=m[2].toLowerCase()==='mm'?n/10:(m[2].toLowerCase()==='m'?n*100:n);cm=Math.round(cm);if(cm>0&&cm<=1000)p.lengthsCm=[cm];}}return p;};
})();
