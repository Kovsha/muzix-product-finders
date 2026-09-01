/* ddHiFi Brand Finder V2.2 flows */
(function(){
'use strict';
var V=window.MUZIX_DDHIFI_V21;if(!V)return;

var CABLE_ALLOWED={
  digital:['usb-c','usb-a','usb-b','lightning','coax'],
  analog:['2.5','3.5','4.4','6.35','rca','2x-rca','xlr3','xlr4'],
  headphone:['2.5','3.5','4.4','6.35','xlr4','2-pin','2-pin-recessed','mmcx','3.5-hifiman','3.5-extended','2.5-audio-technica','a2dc','lemo','mini-xlr4','nyx-pin','mmcx/2-pin']
};

var HEADPHONE_SOURCE=['2.5','3.5','4.4','6.35','xlr4'];
var HEADPHONE_DEVICE=['2-pin','2-pin-recessed','mmcx','3.5-hifiman','3.5-extended','2.5-audio-technica','a2dc','lemo','mini-xlr4','nyx-pin','mmcx/2-pin'];

V.chip=function(key,label,group,active){
  return'<button class="ddhv2-chip'+(active?' is-active':'')+'" data-answer-group="'+V.esc(group)+'" data-answer="'+V.esc(key)+'">'+V.esc(label)+'</button>';
};
V.choice=function(key,title,sub,group,active){
  return'<button class="ddhv2-choice'+(active?' is-active':'')+'" data-answer-group="'+V.esc(group)+'" data-answer="'+V.esc(key)+'"><strong>'+V.esc(title)+'</strong><small>'+V.esc(sub||'')+'</small></button>';
};
V.section=function(title,body,extra){
  return'<div class="ddhv2-section'+(extra?' '+extra:'')+'"><h4>'+V.esc(title)+'</h4>'+body+'</div>';
};

function has(p,c){return !c||c==='any'||(p.connectors||[]).indexOf(c)!==-1;}
function restrict(list,allowed){return list.filter(function(c){return allowed.indexOf(c)!==-1;});}
function connectorsFor(products,allowed){return restrict(V.availableConnectors(products),allowed);}

V.bindFlow=function(){
  Array.prototype.forEach.call(V.app.querySelectorAll('[data-answer-group]'),function(b){
    b.addEventListener('click',function(){
      var g=b.getAttribute('data-answer-group');
      var val=b.getAttribute('data-answer');

      if(g==='cableType'&&V.state.answers.cableType!==val){
        V.state.answers.connectorA='any';
        V.state.answers.connectorB='any';
      }
      if(g==='connectorA'&&V.state.answers.connectorA!==val){
        V.state.answers.connectorB='any';
      }
      if(g==='deviceConnector'&&V.state.answers.deviceConnector!==val){
        V.state.answers.cableConnector='any';
      }

      V.state.answers[g]=val;
      V.renderFamily();
    });
  });

  Array.prototype.forEach.call(V.app.querySelectorAll('[data-home]'),function(b){b.addEventListener('click',V.renderHome);});
  var show=V.app.querySelector('[data-show-results]');if(show)show.addEventListener('click',V.renderResults);
  var stock=V.app.querySelector('[data-stock]');if(stock)stock.addEventListener('change',function(){V.state.onlyStock=!!stock.checked;});
};

V.openFamily=function(k){V.state.family=k;V.state.answers={};V.renderFamily();};

V.renderFamily=function(){
  var f=V.copy[V.state.family]||{title:'ddHiFi',text:''};
  var ps=V.familyProducts(V.state.family),html='';

  if(V.state.family==='cable')html=V.renderCable(ps);
  else if(V.state.family==='adapter')html=V.renderAdapter(ps);
  else if(V.state.family==='dac-amp')html=V.renderDac(ps);
  else if(V.state.family==='interface')html=V.renderInterface(ps);
  else if(V.state.family==='earphone')html=V.renderEarphone(ps);
  else html='<div class="ddhv2-simple-intro"><strong>'+ps.length+' termék</strong><span>Ebben a kategóriában nincs szükség további technikai szűrésre.</span></div>';

  V.app.innerHTML='<div class="ddhv2-flow"><div class="ddhv2-flow-head"><div><div class="ddhv2-eyebrow">ddHiFi Product Assistant</div><h3>'+V.esc(f.title)+'</h3><p class="ddhv2-lead">'+V.esc(f.text)+'</p></div><button class="ddhv2-close" data-home aria-label="Bezárás">×</button></div>'+html+'<div class="ddhv2-filterbar"><span><b>'+ps.length+'</b> termék ebben a kategóriában</span><label><input type="checkbox" data-stock '+(V.state.onlyStock?'checked':'')+'> Csak raktáron</label></div><div class="ddhv2-flow-actions"><button class="ddhv2-secondary" data-home>Vissza</button><button class="ddhv2-primary" data-show-results>Mutasd a találatokat</button></div></div>';

  V.bindFlow();
};

V.renderCable=function(ps){
  var a=V.state.answers;
  var type=a.cableType||'any';
  var filtered=type==='any'?ps:ps.filter(function(p){return p.subtype===type;});
  var c1=a.connectorA||'any',c2=a.connectorB||'any',len=a.length||'any';

  var types='<div class="ddhv2-choice-grid ddhv2-cable-types">'+(V.DATA.cableTypes||[]).map(function(t){return V.choice(t.key,t.title,t.subtitle,'cableType',type===t.key);}).join('')+'</div>';

  if(type==='any'){
    return V.section('1. Milyen kábelre van szükséged?',types)+'<div class="ddhv2-hint-card"><strong>Előbb válassz kábeltípust.</strong><span>Így csak az ahhoz való csatlakozókat mutatjuk, nem keverjük az USB, analóg és fejhallgató csatlakozásokat.</span></div>';
  }

  var allowed=CABLE_ALLOWED[type]||[];
  var connsA=connectorsFor(filtered,allowed);
  if(type==='headphone')connsA=restrict(connsA,HEADPHONE_SOURCE);

  var productsB=c1==='any'?filtered:filtered.filter(function(p){return has(p,c1);});
  var connsB=connectorsFor(productsB,allowed).filter(function(c){return c!==c1;});
  if(type==='headphone')connsB=restrict(connsB,HEADPHONE_DEVICE);

  if(c1!=='any'&&connsA.indexOf(c1)===-1)c1='any';
  if(c2!=='any'&&connsB.indexOf(c2)===-1)c2='any';

  var labelA=type==='headphone'?'Forrásoldali csatlakozó':'Az egyik csatlakozó';
  var labelB=type==='headphone'?'Fej- vagy fülhallgató oldali csatlakozó':'A másik csatlakozó';

  var h1='<div class="ddhv2-chip-grid">'+V.chip('any','Mindegy','connectorA',c1==='any')+connsA.map(function(c){return V.chip(c,V.connectorLabel(c),'connectorA',c1===c);}).join('')+'</div>';
  var h2='<div class="ddhv2-chip-grid">'+V.chip('any','Mindegy','connectorB',c2==='any')+connsB.map(function(c){return V.chip(c,V.connectorLabel(c),'connectorB',c2===c);}).join('')+'</div>';

  var ls=[['any','Mindegy'],['short','≤ 20 cm'],['medium','21–60 cm'],['normal','61–120 cm'],['long','121–200 cm'],['xl','200 cm felett']];
  var lh='<div class="ddhv2-chip-grid">'+ls.map(function(x){return V.chip(x[0],x[1],'length',len===x[0]);}).join('')+'</div>';

  var helper=type==='headphone'?'Itt kizárólag fej- és fülhallgató-kábelhez releváns csatlakozókat mutatunk. USB-A, USB-B és más digitális végpont nem jelenik meg.':'A második csatlakozó listája az első választás után automatikusan leszűkül a ténylegesen létező ddHiFi kombinációkra.';

  return V.section('1. Milyen kábelre van szükséged?',types)+'<div class="ddhv2-direction">'+V.section('2. '+labelA,h1)+'<div class="ddhv2-arrow">→</div>'+V.section('3. '+labelB,h2)+'</div><p class="ddhv2-helper">'+helper+'</p>'+V.section('4. Milyen hossz megfelelő?',lh);
};

V.renderAdapter=function(ps){
  var a=V.state.answers,d=a.deviceConnector||'any',c=a.cableConnector||'any';
  var all=V.availableConnectors(ps);
  var device=all.filter(function(x){return['2.5','3.5','4.4','6.35','xlr4','usb-a','usb-c'].indexOf(x)!==-1;});
  var filtered=d==='any'?ps:ps.filter(function(p){return has(p,d);});
  var target=V.availableConnectors(filtered).filter(function(x){return x!==d;});

  var h1='<div class="ddhv2-chip-grid">'+V.chip('any','Mindegy','deviceConnector',d==='any')+device.map(function(x){return V.chip(x,V.connectorLabel(x),'deviceConnector',d===x);}).join('')+'</div>';
  var h2='<div class="ddhv2-chip-grid">'+V.chip('any','Mindegy','cableConnector',c==='any')+target.map(function(x){return V.chip(x,V.connectorLabel(x),'cableConnector',c===x);}).join('')+'</div>';

  return'<div class="ddhv2-direction">'+V.section('Milyen aljzat van a készülékeden?',h1)+'<div class="ddhv2-arrow">→</div>'+V.section('Milyen dugó van a kábeleden / fejhallgatódon?',h2)+'</div><p class="ddhv2-helper">A második oldal csak olyan csatlakozókat mutat, amelyekhez van tényleges ddHiFi adapter a kínálatban.</p>';
};

V.renderDac=function(){
  var a=V.state.answers,s=a.source||'any',o=a.output||'any',u=a.usage||'any',p=a.priority||'balanced';
  var source='<div class="ddhv2-choice-grid">'+V.choice('any','Mindegy','Bármelyik forrás megfelelő','source',s==='any')+V.choice('usb-c','USB-C','Android, USB-C iPhone, tablet vagy számítógép','source',s==='usb-c')+V.choice('lightning','Lightning','Régebbi Lightning iPhone','source',s==='lightning')+'</div>';
  var out='<div class="ddhv2-chip-grid">'+[['any','Mindegy'],['3.5','3,5 mm'],['4.4','4,4 mm balanced'],['2.5','2,5 mm balanced']].map(function(x){return V.chip(x[0],x[1],'output',o===x[0]);}).join('')+'</div>';
  var usage='<div class="ddhv2-choice-grid">'+V.choice('any','Általános','IEM és könnyebben hajtható fejhallgatók','usage',u==='any')+V.choice('iem','IEM / fülhallgató','Kompakt méret és megfelelő kontroll','usage',u==='iem')+V.choice('headphone','Nagyobb fejhallgató','Nagyobb teljesítménytartalék','usage',u==='headphone')+'</div>';
  var pr='<div class="ddhv2-choice-grid">'+V.choice('balanced','Kiegyensúlyozott választás','Általános használatra','priority',p==='balanced')+V.choice('power','Nagy teljesítmény','Fejhallgatóhoz is legyen tartalék','priority',p==='power')+V.choice('compact','Minél kisebb','A hordozhatóság az első','priority',p==='compact')+V.choice('charging','Töltés zene közben','Passthrough töltés legyen','priority',p==='charging')+'</div>';
  return V.section('1. Milyen forrásról használod?',source)+V.section('2. Milyen fejhallgató-kimenet kell?',out)+V.section('3. Mit hajtasz meg?',usage)+V.section('4. Mi a legfontosabb?',pr);
};

V.renderInterface=function(ps){
  var a=V.state.answers,conns=V.availableConnectors(ps),x=a.connectorA||'any',y=a.connectorB||'any';
  var h1='<div class="ddhv2-chip-grid">'+V.chip('any','Mindegy','connectorA',x==='any')+conns.map(function(c){return V.chip(c,V.connectorLabel(c),'connectorA',x===c);}).join('')+'</div>';
  var filtered=x==='any'?ps:ps.filter(function(p){return has(p,x);});
  var conns2=V.availableConnectors(filtered).filter(function(c){return c!==x;});
  var h2='<div class="ddhv2-chip-grid">'+V.chip('any','Mindegy','connectorB',y==='any')+conns2.map(function(c){return V.chip(c,V.connectorLabel(c),'connectorB',y===c);}).join('')+'</div>';
  return'<div class="ddhv2-direction">'+V.section('Az egyik csatlakozó',h1)+'<div class="ddhv2-arrow">→</div>'+V.section('A másik csatlakozó',h2)+'</div>';
};

V.renderEarphone=function(ps){
  if(!ps.length)return'<div class="ddhv2-hint-card"><strong>Jelenleg nincs aktív ddHiFi fülhallgató az adatbázisban.</strong></div>';
  var p=ps[0];
  return'<div class="ddhv2-earphone-preview">'+(p.image?'<div class="ddhv2-earphone-image"><img src="'+V.esc(p.image)+'" alt="'+V.esc(p.model||p.name)+'"></div>':'')+'<div><span class="ddhv2-mini-label">Jelenlegi ddHiFi IEM</span><h4>'+V.esc(p.model||p.name)+'</h4><p>A terméket a teljes ddHiFi katalógusból töltjük be, így nem függ az UNAS AJAX terméklistától.</p></div></div>';
};

V.renderProblemSolver=function(){
  V.app.innerHTML='<div class="ddhv2-flow"><div class="ddhv2-flow-head"><div><div class="ddhv2-eyebrow">Gyors problémamegoldó</div><h3>Mit szeretnél megoldani?</h3><p class="ddhv2-lead">Válassz egy hétköznapi helyzetet, és a megfelelő terméktípushoz viszünk.</p></div><button class="ddhv2-close" data-home>×</button></div><div class="ddhv2-choice-grid"><button class="ddhv2-choice" data-problem="phone-jack"><strong>A telefonomon nincs fejhallgató-kimenet</strong><small>USB-C / Lightning → fejhallgató</small></button><button class="ddhv2-choice" data-problem="phone-dac"><strong>Telefont vagy laptopot kötnék DAC-ra</strong><small>USB / OTG digitális kapcsolat</small></button><button class="ddhv2-choice" data-problem="plug-mismatch"><strong>Nem illik a fejhallgatóm dugója az erősítőbe</strong><small>Jack / Pentaconn / XLR adapter</small></button><button class="ddhv2-choice" data-problem="upgrade"><strong>Upgrade kábelt keresek</strong><small>Fejhallgató vagy IEM cserélhető kábel</small></button><button class="ddhv2-choice" data-problem="analog"><strong>Két audio készüléket kötnék össze</strong><small>RCA / XLR / 4,4 mm analóg összekötő</small></button></div></div>';
  var h=V.app.querySelector('[data-home]');if(h)h.addEventListener('click',V.renderHome);
  Array.prototype.forEach.call(V.app.querySelectorAll('[data-problem]'),function(b){b.addEventListener('click',function(){var p=b.getAttribute('data-problem');if(p==='phone-jack'){V.state.family='dac-amp';V.state.answers={};}if(p==='phone-dac'){V.state.family='cable';V.state.answers={cableType:'digital'};}if(p==='plug-mismatch'){V.state.family='adapter';V.state.answers={};}if(p==='upgrade'){V.state.family='cable';V.state.answers={cableType:'headphone'};}if(p==='analog'){V.state.family='cable';V.state.answers={cableType:'analog'};}V.renderFamily();});});
};
})();
