(()=>{'use strict';
const N=window.NEXT,E=N.EVENTS,KEY='next26-rmr-250854-v4';
const DAYS={23:'Lun 23',24:'Mar 24',25:'Mié 25',26:'Jue 26',27:'Vie 27'};
const DLONG={23:'Lunes 23 de noviembre',24:'Martes 24 de noviembre',25:'Miércoles 25 de noviembre',26:'Jueves 26 de noviembre',27:'Viernes 27 de noviembre'};
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const pad=n=>String(n).padStart(2,'0'),clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
let S={};try{S=JSON.parse(localStorage.getItem(KEY)||'{}')}catch(e){}
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}};
const FL=[['c','Mi conclusión personal','¿Qué aprendí o qué cambió en mi forma de pensar? Con mis propias palabras.'],['i','Puntos de interés','Ideas, herramientas o casos que me llamaron la atención'],['g','Mi meta personal','Qué voy a hacer con esto, de forma concreta']];
const val=(ev,k)=>S[ev.id]&&k in S[ev.id]?S[ev.id][k]:(ev[k]||'');
const att=ev=>!ev.x&&(S[ev.id]&&'att' in S[ev.id]?S[ev.id].att:!!ev.att);
const pf=k=>S.profile&&k in S.profile?S.profile[k]:N.PROFILE[k];
const done=ev=>att(ev)&&FL.every(([k])=>val(ev,k).trim().length>=20);
const nWords=ev=>FL.map(([k])=>val(ev,k)).join(' ').split(/\s+/).filter(Boolean).length;
const mobile=()=>matchMedia('(max-width:767px)').matches;
const hours=ev=>ev.t+(ev.e?' – '+ev.e:'');
const loc=ev=>ev.place===ev.mode?ev.mode:ev.mode+' · '+ev.place;
const grow=t=>{t.style.height='auto';t.style.height=Math.max(t.scrollHeight+4,110)+'px'};
const whoT=ev=>ev.who.replace(/; /g,' · ');
const av=ev=>ev.photo?`<img class="av" src="assets/img/speakers/${ev.photo}.jpg" alt="${esc(ev.who)}" loading="lazy">`:'<span class="av ico" aria-hidden="true"><svg viewBox="0 0 24 24"><circle cx="12" cy="8.5" r="4"/><path d="M4 21c.4-4.6 3.6-7 8-7s7.6 2.4 8 7z"/></svg></span>';
const now=new Date(),TODAY=now.getFullYear()===2026&&now.getMonth()===10?now.getDate():(now>new Date(2026,10,28)?99:0);
let D=+(S.day||23),L=[];
const refL=()=>{L=E.filter(e=>e.day===D)};

/* audio */
const A={on:false,fx:{}};
['hover','click','open','whoosh','done'].forEach(n=>{const a=new Audio('assets/audio/'+n+'.wav');a.preload='auto';A.fx[n]=a});
A.amb=new Audio('assets/audio/ambient.wav');A.amb.loop=true;A.amb.volume=.22;
let lastW=0;const sfx=(n,v=.35)=>{if(!A.on)return;const a=A.fx[n].cloneNode();a.volume=v;a.play().catch(()=>{})};
function toast(m){const t=$('#toast');t.textContent=m;t.classList.add('on');clearTimeout(toast.h);toast.h=setTimeout(()=>t.classList.remove('on'),2200)}

/* construcción */
const track=$('#track'),stage=$('#stage'),panel=$('#panel');
function build(){
 refL();
 let h='<div class="rail"><i id="fill"></i></div>';
 h+=`<section class="slot intro"><article class="hero"><figure><img src="assets/img/ruben.jpg" alt="Foto de Rubén Morales Reyes"><figcaption class="mono">ID 250854</figcaption></figure>
 <div><p class="mono">Estudiante // ${esc(N.PROFILE.group)} · ${DLONG[D]}</p>
 <h1><input class="pf name" data-p="name" value="${esc(pf('name'))}" aria-label="Nombre"></h1>
 <input class="pf sub" data-p="career" value="${esc(pf('career'))}" aria-label="Carrera">
 <p class="mono">Matrícula ${esc(N.PROFILE.id)}</p>
 <label class="mono" for="goal">Mi compromiso al terminar NEXT 2026</label>
 <textarea id="goal" data-p="goal">${esc(pf('goal'))}</textarea>
 <input class="pf sub" data-p="goalDate" value="${esc(pf('goalDate'))}" aria-label="Fecha de la meta">
 <div class="stat mono"><span><b id="sN">0</b> / <span id="sT">0</span> listas</span><span><b id="sW">0</b> palabras</span><span>Desliza →</span></div></div></article></section>`;
 L.forEach((ev,i)=>{h+=`<section class="slot ${i%2?'down':'up'}" data-i="${i}"><span class="dotn"></span>
 <div class="card ${ev.x?'pend':''}" ${ev.x?'':'role="button" tabindex="0"'} data-i="${i}" ${ev.x?'':`aria-label="Abrir ${esc(ev.title)}"`}><span class="glow"></span><span class="brk"></span>
 <div class="row mono"><span class="idx">[${pad(i+1)}]</span><span>${hours(ev)}</span><span class="badge t-${ev.kind}">${ev.kind}</span></div>
 <h3>${esc(ev.title)}</h3><div class="sp">${av(ev)}<p class="who">${esc(whoT(ev))}<br>${esc(loc(ev))}</p></div>
 <div class="foot mono"><span class="pips"><i></i><i></i><i></i></span><span class="chip"></span></div></div></section>`});
 const upc=E.filter(e=>att(e)&&e.day>D&&!e.x).slice(0,3);
 upc.forEach((ev,k)=>{h+=`<section class="slot ${(L.length+k)%2?'down':'up'} pend"><span class="dotn"></span><div class="card pend" data-go="${ev.id}" role="button" tabindex="0" aria-label="Ir a ${esc(ev.title)}"><span class="brk"></span>
 <div class="row mono"><span>${esc(DLONG[ev.day].toUpperCase())} | ${ev.t}</span><span class="badge t-${ev.kind}">${ev.kind}</span></div><h3>${esc(ev.title)}</h3>
 <p class="who"><b>Ponente:</b> ${esc(whoT(ev))}</p><p class="who"><b>Lugar:</b> ${esc(ev.place)}</p>
 <div class="foot mono"><span>Toca para ir a ese día</span><span class="chip">Pendiente</span></div></div></section>`});
 h+='<section class="slot end"></section>';
 track.innerHTML=h;
 $('#segs').innerHTML=L.filter(e=>!e.x).map(()=>'<i></i>').join('');$('#tot').textContent=pad(L.length);
 $('#bgt').innerHTML=L.map((ev,i)=>`<span data-i="${i}">${ev.t.replace(':','')}</span>`).join('');
 $('#days').innerHTML=Object.keys(DAYS).map(d=>`<button data-d="${d}" aria-pressed="${+d===D}">${DAYS[d]}</button>`).join('');
}

/* scroll con inercia */
let cur=0,tar=0,vw=0,maxX=0,centers=[],idx=-1,open=-1,moved=0;
function layout(){
 vw=stage.clientWidth;maxX=Math.max(0,track.scrollWidth-vw);
 centers=L.map((_,i)=>{const s=$(`.slot[data-i="${i}"]`);return s.offsetLeft+s.offsetWidth/2});
 $$('#bgt span').forEach((s,i)=>{s.style.left=(vw/2+.25*(centers[i]-vw/2)-s.offsetWidth/2)+'px'});
 $('#sn').innerHTML=L.map((ev,i)=>`<button data-i="${i}" style="left:${centers[i]/track.scrollWidth*100}%" aria-label="Ir a ${esc(ev.title)}"><span>${ev.t}</span></button>`).join('');
 idx=-1;refresh();tar=clamp(tar,0,maxX);
}
function loop(){
 if(!mobile()){
  cur+=(tar-cur)*.085;if(Math.abs(tar-cur)<.1)cur=tar;
  track.style.transform=`translate3d(${-cur}px,0,0)`;$('#bgt').style.transform=`translate3d(${-cur*.25}px,0,0)`;
  $('#fill').style.width=(cur+vw/2)+'px';$('#sh').style.left=(maxX?cur/maxX*100:0)+'%';
  const mid=cur+vw/2;let b=0,bd=1e9;centers.forEach((c,i)=>{const d=Math.abs(c-mid);if(d<bd){bd=d;b=i}});setIdx(b);
 }
 requestAnimationFrame(loop);
}
function setIdx(b){if(b===idx)return;if(idx>=0)sfx('hover',.12);idx=b;$('#ctr').textContent=pad(b+1);$$('.card.near').forEach(c=>c.classList.remove('near'));const c=$(`.card[data-i="${b}"]`);c&&c.classList.add('near');$$('#sn button').forEach((x,i)=>x.classList.toggle('on',i===b))}
function goto(i){tar=clamp(centers[i]-(vw-(open>=0?Math.min(620,innerWidth):0))/2,0,maxX);if(mobile())$(`.slot[data-i="${i}"]`).scrollIntoView({behavior:'smooth',block:'center'})}
function nudge(d){tar=clamp(tar+d,0,maxX);const n=performance.now();if(n-lastW>350){sfx('whoosh',.18);lastW=n}}
stage.addEventListener('wheel',e=>{if(mobile())return;e.preventDefault();nudge((e.deltaY+e.deltaX)*1.15)},{passive:false});
let drag=null;
stage.addEventListener('pointerdown',e=>{if(mobile()||e.target.closest('input,textarea,button'))return;drag={x:e.clientX,t:tar};moved=0});
addEventListener('pointermove',e=>{if(!drag)return;const d=e.clientX-drag.x;if(Math.abs(d)>5){moved=1;stage.classList.add('drag')}tar=clamp(drag.t-d,0,maxX)});
addEventListener('pointerup',()=>{drag=null;stage.classList.remove('drag')});
addEventListener('keydown',e=>{
 if(e.key==='Escape'&&open>=0)return close();
 if(e.target.closest('input,textarea'))return;
 if(e.key==='ArrowRight')open>=0?step(1):nudge(470);else if(e.key==='ArrowLeft')open>=0?step(-1):nudge(-470);
});
addEventListener('resize',layout);

/* tarjetas y panel */
function go(id){const ev=E.find(x=>x.id===id);if(!ev)return;D=ev.day;S.day=D;save();close();cur=tar=0;build();layout();const i=L.indexOf(ev);if(i>=0)show(i)}
track.addEventListener('click',e=>{if(moved){moved=0;return}const g=e.target.closest('[data-go]');if(g)return go(g.dataset.go);const c=e.target.closest('.card[data-i]:not(.pend)');if(c)show(+c.dataset.i)});
track.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.matches('[data-go]')){e.preventDefault();return go(e.target.dataset.go)}if((e.key==='Enter'||e.key===' ')&&e.target.matches('.card[data-i]:not(.pend)')){e.preventDefault();show(+e.target.dataset.i)}});
track.addEventListener('mousemove',e=>{const c=e.target.closest('.card');if(!c)return;const r=c.getBoundingClientRect();c.style.setProperty('--mx',e.clientX-r.left+'px');c.style.setProperty('--my',e.clientY-r.top+'px')});
track.addEventListener('mouseover',e=>{const c=e.target.closest('.card');if(c&&!c.contains(e.relatedTarget))sfx('hover',.15)});
$('#sn').addEventListener('click',e=>{const b=e.target.closest('button');if(b){sfx('click');goto(+b.dataset.i)}});
$('#days').addEventListener('click',e=>{const b=e.target.closest('button');if(!b||+b.dataset.d===D)return;D=+b.dataset.d;S.day=D;save();sfx('whoosh');close();cur=tar=0;build();layout();toast(DLONG[D])});
function show(i){
 const ev=L[i];open=i;sfx('open');const on=att(ev);
 panel.innerHTML=`<button class="x mono" id="px">Esc ✕</button><p class="mono" style="color:var(--acc)">[${pad(i+1)}] · ${DLONG[ev.day]} · ${hours(ev)}</p>
 <div class="ph">${av(ev)}<div><h2>${esc(ev.title)}</h2></div></div><p class="who">${esc(whoT(ev))} · ${esc(ev.kind)} · ${esc(loc(ev))}</p>
 <label class="chk"><input type="checkbox" id="att" ${on?'checked':''}> Asistí a esta actividad</label>
 ${ev.note&&on?`<p class="note">${esc(ev.note)}</p>`:''}
 ${on?FL.map(([k,l,h])=>`<div class="f"><label for="f${k}">${l}</label><small>${h}</small><textarea id="f${k}" data-k="${k}">${esc(val(ev,k))}</textarea></div>`).join(''):'<p class="note">Marca «Asistí a esta actividad» para escribir tu reflexión. Si hay talleres a la misma hora, elige solo el tuyo.</p>'}
 <div class="spec mono" id="spec"></div>
 <div class="pn"><button id="pv" class="mono">‹ Prev</button><button id="nx" class="mono">Next ›</button></div>`;
 panel.classList.add('open');panel.setAttribute('aria-hidden','false');document.body.classList.add('focus');
 $$('.slot').forEach(s=>s.classList.toggle('on',s.dataset.i==i));
 $('#px').onclick=close;$('#pv').onclick=()=>step(-1);$('#nx').onclick=()=>step(1);
 $('#att').onchange=e=>{(S[ev.id]=S[ev.id]||{}).att=e.target.checked;save();sfx('click');show(i);refresh()};
 $$('textarea',panel).forEach(grow);panel.scrollTop=0;spec();goto(i);
}
function step(d){const n=open+d;if(n>=0&&n<L.length&&!L[n].x)show(n)}
function close(){open=-1;panel.classList.remove('open');panel.setAttribute('aria-hidden','true');document.body.classList.remove('focus');$$('.slot.on').forEach(s=>s.classList.remove('on'))}
function spec(){if(open<0)return;const ev=L[open];$('#spec').innerHTML=[['DÍA',DLONG[ev.day].toUpperCase()],['HORA',hours(ev)+' H'],['LUGAR',loc(ev)],['PONENTE',whoT(ev)],['FUENTE',ev.day!==23?'MIS NOTAS':ev.note?'SIN AUDIO':'TRANSCRIPCIÓN'],['PALABRAS',nWords(ev)],['STATUS',!att(ev)?'POR ASISTIR':ev.day>TODAY?'PENDIENTE':done(ev)?'LISTA':'POR COMPLETAR']].map(([a,b])=>`<div><span>${a}</span><b>${esc(b)}</b></div>`).join('')}
panel.addEventListener('input',e=>{const k=e.target.dataset.k;if(!k)return;const ev=L[open];(S[ev.id]=S[ev.id]||{})[k]=e.target.value;grow(e.target);save();refresh();spec()});
track.addEventListener('input',e=>{const p=e.target.dataset.p;if(!p)return;(S.profile=S.profile||{})[p]=e.target.value;save()});

const prev={};
function refresh(){
 L.forEach((ev,i)=>{const s=$(`.slot[data-i="${i}"]`);if(!s)return;const fut=ev.day>TODAY,a=att(ev),d=done(ev)&&!fut;
  s.classList.toggle('ok',d);s.classList.toggle('skip',!a&&!ev.x);$('.card',s).classList.toggle('skip',!a&&!ev.x);
  $$('.pips i',s).forEach((p,j)=>p.classList.toggle('d',a&&val(ev,FL[j][0]).trim().length>=20));
  $('.chip',s).textContent=ev.x?'Cierre':!a?'Por asistir':fut?'Pendiente':d?'Lista':'Por completar';
  const sb=$$('#sn button')[i];sb&&sb.classList.toggle('d',d);
  if(prev[ev.id]===false&&d)sfx('done',.4);prev[ev.id]=d});
 const real=L.filter(e=>!e.x);$$('#segs i').forEach((x,i)=>x.classList.toggle('d',done(real[i])));
 const T=E.filter(e=>att(e)&&e.day<=TODAY),n=T.filter(done).length,a=$('#sN');
 if(a){a.textContent=n;$('#sT').textContent=T.length;$('#sW').textContent=T.reduce((s,e)=>s+nWords(e),0)}
}
document.addEventListener('scroll',()=>{if(!mobile())return;const mid=innerHeight/2;let b=0,bd=1e9;$$('.slot[data-i]').forEach((s,i)=>{const r=s.getBoundingClientRect(),d=Math.abs(r.top+r.height/2-mid);if(d<bd){bd=d;b=i}});setIdx(b);track.style.setProperty('--fh',Math.min(track.scrollHeight,scrollY+innerHeight/2)+'px')},{passive:true});

/* regla inferior */
const scrub=$('#scrub');let sd=false;
const setS=x=>{const r=scrub.getBoundingClientRect();tar=clamp((x-r.left)/r.width,0,1)*maxX};
scrub.addEventListener('pointerdown',e=>{if(e.target.closest('button'))return;sd=true;scrub.setPointerCapture(e.pointerId);setS(e.clientX)});
scrub.addEventListener('pointermove',e=>{if(sd)setS(e.clientX)});scrub.addEventListener('pointerup',()=>sd=false);

/* acciones */
$('#snd').onclick=e=>{A.on=!A.on;e.target.setAttribute('aria-pressed',A.on);e.target.textContent='Sonido: '+(A.on?'on':'off');if(A.on){A.amb.play().catch(()=>{});sfx('click')}else A.amb.pause()};
const mine=()=>E.filter(e=>att(e)&&(e.day<=TODAY||FL.some(([k])=>val(e,k).trim())));
function mdText(){return '# Bitácora NEXT UTXJ 2026\n\n**'+pf('name')+'** · Matrícula '+N.PROFILE.id+' · '+N.PROFILE.group+'\n\n> '+pf('goal')+' ('+pf('goalDate')+')\n\n'+mine().map(ev=>`## ${DAYS[ev.day]} · ${ev.t} · ${ev.title}\n*${whoT(ev)}*\n\n`+FL.map(([k,l])=>`**${l}**\n\n${val(ev,k)||'_Pendiente_'}\n`).join('\n')).join('\n')}
$('#md').onclick=()=>{sfx('click');const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([mdText()],{type:'text/markdown'}));a.download='NEXT26_Ruben_Morales_250854.md';a.click();toast('Archivo descargado')};
$('#pr').onclick=()=>{sfx('click');print()};
$('#rs').onclick=()=>{if(confirm('¿Restaurar el borrador original? Se perderán tus cambios.')){S={};try{localStorage.removeItem(KEY)}catch(e){}D=23;close();cur=tar=0;build();layout();toast('Borrador restaurado')}};
addEventListener('beforeprint',()=>{$('#printDoc').innerHTML=`<h1>Bitácora NEXT UTXJ 2026</h1><p class="m">${esc(pf('name'))} · Matrícula ${N.PROFILE.id} · ${N.PROFILE.group} · ${esc(N.PROFILE.career)}</p><article><h2>Mi compromiso <small>${esc(pf('goalDate'))}</small></h2><p>${esc(pf('goal'))}</p></article>`+mine().map(ev=>`<article><h2>${esc(ev.title)}<small>${DLONG[ev.day]} · ${hours(ev)} h · ${esc(whoT(ev))}</small></h2>${FL.map(([k,l])=>`<h4>${l}</h4><p style="white-space:pre-line">${esc(val(ev,k)||'—')}</p>`).join('')}</article>`).join('')});

build();layout();requestAnimationFrame(()=>{layout();loop()});
if(document.fonts)document.fonts.ready.then(layout);
})();
