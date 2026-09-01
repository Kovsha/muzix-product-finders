/* ddHiFi Brand Finder V2.1 start */
(function(){
'use strict';
var V=window.MUZIX_DDHIFI_V21;if(!V)return;
var root=document.getElementById('ddhv2-finder');if(!root||root.dataset.ddhv21Ready==='1')return;root.dataset.ddhv21Ready='1';
V.root=root;V.app=root.querySelector('[data-ddhv2-app]');if(!V.app)return;
V.app.innerHTML='<div class="ddhv2-home"><div class="ddhv2-eyebrow">ddHiFi Product Assistant</div><h2>Kínálat betöltése…</h2><p class="ddhv2-lead">Az aktuális termékeket, árakat és készletjelzést olvassuk be.</p></div>';
V.load(function(){V.renderHome();});
})();
