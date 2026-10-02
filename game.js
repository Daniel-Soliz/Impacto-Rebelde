import{W,H,GROUND,LEVELS,overlap,layout,moveActor,segmentHit,makePlayer,makeEnemies,makeBoss,loadSave,hazards,hazardActive}from'./engine.js';
const canvas=document.querySelector('#game'),ctx=canvas.getContext('2d'),overlay=document.querySelector('#overlay'),primary=document.querySelector('#primary'),secondary=document.querySelector('#secondary');
ctx.imageSmoothingEnabled=false;const keys=new Set(),touchKeys=new Set();const isPressed=code=>keys.has(code)||touchKeys.has(code);let mode='menu',level=0,p=makePlayer(),platforms=[],enemies=[],boss,shots=[],grenades=[],particles=[],pickups=[],hostages=[],traps=[],camera=0,time=0,score=0,lives=3,checkpoint=90,banner=0,shake=0,audioOn=true,audioContext,save=loadSave(localStorage),toastTimer;
const $=s=>document.querySelector(s),rand=(a,b)=>a+Math.random()*(b-a),clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
function tone(freq,duration=.07,type='square',volume=.025){if(!audioOn)return;try{audioContext??=new AudioContext();if(audioContext.state==='suspended')audioContext.resume();const o=audioContext.createOscillator(),g=audioContext.createGain();o.type=type;o.frequency.setValueAtTime(freq,audioContext.currentTime);o.frequency.exponentialRampToValueAtTime(Math.max(30,freq*.4),audioContext.currentTime+duration);g.gain.setValueAtTime(volume,audioContext.currentTime);g.gain.exponentialRampToValueAtTime(.001,audioContext.currentTime+duration);o.connect(g);g.connect(audioContext.destination);o.start();o.stop(audioContext.currentTime+duration);}catch{}}
function toast(text){$('#toast').textContent=text;$('#toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),2800);}
function persist(won=false){try{localStorage.setItem('impacto-rebelde-v1',JSON.stringify({level,score,won}));save={level,score,won};}catch{toast('Armazenamento indisponível: progresso nesta sessão.');}}
function screen(title,description,label,action,eyebrow='OPERAÇÃO AURORA'){clearInput();overlay.hidden=false;$('#title').innerHTML=title;$('#description').textContent=description;$('#eyebrow').textContent=eyebrow;primary.textContent=label;primary.onclick=action;secondary.hidden=true;$('#hint').textContent=touchEnabled?'Use os botões na tela · Combine movimento, pulo e tiro.':'A/D mover · Espaço pular · J atirar · K granada · Esc pausa';}
function start(i=0,continuing=false){level=i;score=continuing?(save?.score||0):0;lives=3;loadLevel();}
function loadLevel(){p=makePlayer();platforms=layout(level);enemies=makeEnemies(level);boss=makeBoss(level);shots=[];grenades=[];particles=[];pickups=[];hostages=[];traps=hazards(level);checkpoint=90;camera=0;banner=4;time=0;for(let x=1050;x<LEVELS[level].length-650;x+=1050){hostages.push({x,y:GROUND-40,w:24,h:40,saved:false});pickups.push({x:x+200,y:GROUND-24,w:24,h:24,type:x%2100===0?'health':'weapon',used:false});}mode='play';overlay.hidden=true;clearInput();canvas.focus();persist();enterMobileView();}
function burst(x,y,color,count=15){for(let i=0;i<count;i++)particles.push({x,y,vx:rand(-200,200),vy:rand(-220,100),life:rand(.2,.7),color,size:rand(2,6)});}
function damage(amount){if(p.inv>0||mode!=='play')return;p.hp-=amount;p.inv=1.15;shake=8;burst(p.x+12,p.y+20,'#ffa06a',8);tone(100,.14,'sawtooth');if(p.hp<=0){lives--;if(lives>0){p=makePlayer();p.x=checkpoint;p.inv=2.5;shots=shots.filter(s=>s.friendly);toast('Reagrupando no checkpoint.');}else{mode='over';screen('MISSÃO<br><em>INTERROMPIDA</em>','A resistência ainda precisa de você. Tente novamente a missão atual.','TENTAR NOVAMENTE',()=>{lives=3;loadLevel();});}}}
function hitEnemy(e,amount){if(e.dead)return;e.hp-=amount;e.flash=.09;if(e.hp<=0){e.dead=true;score+=e===boss?1500:100;burst(e.x+e.w/2,e.y+e.h/2,'#ffb75b',e===boss?65:18);tone(70,.25,'sawtooth',.05);if(e===boss){shake=16;shots=shots.filter(s=>s.friendly);pickups.push({x:e.x,y:GROUND-24,w:24,h:24,type:'health',used:false});toast('Chefão neutralizado. Avance até o ponto de extração!');}else if(Math.random()<.12)pickups.push({x:e.x,y:GROUND-24,w:24,h:24,type:'health',used:false});}}
function fire(){const up=isPressed('KeyW')||isPressed('ArrowUp'),crouch=isPressed('KeyS')||isPressed('ArrowDown');const x=p.x+14+(up?0:p.face*20),y=p.y+(up?4:crouch&&p.grounded?34:19);for(const spread of p.weapon===2?[-.16,0,.16]:[0]){shots.push({x,y,vx:up?Math.sin(spread)*800:p.face*800,vy:up?-800:Math.sin(spread)*800,life:1.5,friendly:true,power:p.weapon===1?2:1});}p.shot=p.weapon===1?.09:p.weapon===2?.26:.16;tone(p.weapon===2?150:220,.045);burst(x,y,'#ffe59a',3);}
function throwGrenade(){if(p.ammo<=0||p.grenade>0)return;p.ammo--;p.grenade=.55;grenades.push({x:p.x+14,y:p.y+12,w:8,h:8,vx:p.face*370,vy:-470,life:1.25,grounded:false});tone(500,.05);}
function complete(){score+=500+lives*100;mode=level===LEVELS.length-1?'win':'between';persist(level===LEVELS.length-1);if(level===LEVELS.length-1)screen('AURORA<br><em>LIBERTADA</em>',`Você encerrou a ocupação e devolveu a energia à cidade. Pontuação final: ${score.toLocaleString('pt-BR')}. Obrigado por jogar Impacto Rebelde!`,'JOGAR NOVAMENTE',()=>start(),'CAMPANHA CONCLUÍDA • DANIEL SOLIZ');else screen('MISSÃO<br><em>CONCLUÍDA</em>',`Próximo destino: ${LEVELS[level+1].name}. ${LEVELS[level+1].subtitle}. Pontuação: ${score}.`,'PRÓXIMA MISSÃO',()=>{level++;lives=Math.min(5,lives+1);loadLevel();});}
function pause(){if(mode==='play'){mode='pause';screen('OPERAÇÃO<br><em>EM PAUSA</em>','Respire. O campo de batalha espera por você.','VOLTAR AO JOGO',resume);}else if(mode==='pause')resume();}
function resume(){mode='play';overlay.hidden=true;clearInput();canvas.focus();}
const activePointers=new Map();
function clearInput(){keys.clear();touchKeys.clear();activePointers.clear();document.querySelectorAll?.('[data-key]').forEach(button=>button.classList.remove('pressed'));}
function pressAction(code){if(code==='Space')p.buffer=.14;if(code==='KeyK')throwGrenade();}
function releaseJump(){if(!isPressed('Space')&&p.vy< -240)p.vy=-240;}
const gameKeys=['KeyA','KeyD','KeyW','KeyS','ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Space','KeyJ','KeyK','Escape','KeyP'];
window.addEventListener('keydown',e=>{if(!gameKeys.includes(e.code))return;e.preventDefault();if(e.code==='Escape'||e.code==='KeyP'){if(!e.repeat)pause();return;}if(mode!=='play')return;if(!e.repeat)pressAction(e.code);keys.add(e.code);});
window.addEventListener('keyup',e=>{keys.delete(e.code);if(e.code==='Space')releaseJump();});
window.addEventListener('blur',()=>{clearInput();if(mode==='play')pause();});
document.addEventListener('visibilitychange',()=>{if(document.hidden){clearInput();if(mode==='play')pause();}});
function releaseTouchState(held){
 if(held.code&&! [...activePointers.values()].some(v=>v.code===held.code))touchKeys.delete(held.code);
 if(held.button&&! [...activePointers.values()].some(v=>v.button===held.button))held.button.classList.remove('pressed');
 if(held.code==='Space')releaseJump();
}
export function touchTargetAt(pad,x,y){
 const bounds=pad.getBoundingClientRect?.();
 if(bounds){
  if(x<bounds.left-8||x>bounds.right+8||y<bounds.top-8||y>bounds.bottom+8)return null;
  let nearest=null,distance=Infinity;
  for(const candidate of pad.querySelectorAll('[data-key]')){
   const r=candidate.getBoundingClientRect();
   if(x>=r.left&&x<=r.right&&y>=r.top&&y<=r.bottom)return candidate;
   const d=Math.hypot(x-(r.left+r.right)/2,y-(r.top+r.bottom)/2);
   if(d<distance){distance=d;nearest=candidate;}
  }
  return nearest;
 }
 const hit=document.elementFromPoint?.(x,y),next=hit?.closest?.('[data-key]');return next&&pad.contains(next)?next:null;
}
export function bindTouchButton(button){
 const release=e=>{const held=activePointers.get(e.pointerId);if(!held||held.owner!==button)return;activePointers.delete(e.pointerId);releaseTouchState(held);};
 button.addEventListener('pointerdown',e=>{e.preventDefault();if(mode!=='play'||activePointers.has(e.pointerId)||(e.pointerType==='mouse'&&e.button!==0))return;const code=button.dataset.key;const first=!isPressed(code);activePointers.set(e.pointerId,{code,button,owner:button});touchKeys.add(code);button.classList.add('pressed');try{button.setPointerCapture(e.pointerId);}catch{}if(first)pressAction(code);});
 button.addEventListener('pointermove',e=>{
  const held=activePointers.get(e.pointerId);if(!held||held.owner!==button||!(button.closest?.('.movement-pad')||button.closest?.('.action-pad')))return;
  e.preventDefault();const pad=button.closest('.movement-pad')||button.closest('.action-pad');const next=touchTargetAt(pad,e.clientX,e.clientY);
  if(next===held.button)return;
  activePointers.delete(e.pointerId);releaseTouchState(held);
  const code=next?.dataset.key??null;activePointers.set(e.pointerId,{code,button:next,owner:button});
  if(next){const first=!isPressed(code);touchKeys.add(code);next.classList.add('pressed');if(first)pressAction(code);}
 });
 for(const event of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(event,release);
 button.addEventListener('contextmenu',e=>e.preventDefault());
}
document.querySelectorAll?.('[data-key]').forEach(bindTouchButton);
const touchControls=$('.touch-controls'),touchToggle=$('#touch-toggle');let touchEnabled=(window.matchMedia?.('(pointer: coarse)').matches??false)||(navigator.maxTouchPoints>0);
function showTouchControls(){touchControls.hidden=!touchEnabled;$('.mobile-tip').hidden=!touchEnabled;$('.controls').hidden=touchEnabled;touchToggle.setAttribute?.('aria-pressed',String(touchEnabled));touchToggle.textContent=touchEnabled?'CONTROLES: TOQUE':'CONTROLES: TECLADO';$('#hint').textContent=touchEnabled?'Use os botões na tela. O jogo abre em formato horizontal.':'A/D mover · Espaço pular · J atirar · K granada · Esc pausa';}
touchToggle.onclick=()=>{touchEnabled=!touchEnabled;if(!touchEnabled){mobileSession=false;document.body?.classList.remove('mobile-session');try{window.screen?.orientation?.unlock?.();}catch{}}clearInput();if(mode==='play')pause();showTouchControls();};showTouchControls();
$('#touch-pause').onclick=()=>pause();
$('#audio').onclick=()=>{audioOn=!audioOn;$('#audio').textContent='ÁUDIO: '+(audioOn?'ON':'OFF');if(audioOn)tone(440);};
let mobileSession=false;
async function enterMobileView(){
  if(!touchEnabled||mobileSession)return;
  mobileSession=true;document.body?.classList.add('mobile-session');
  const shell=$('#game-shell');
  try{if(shell.requestFullscreen&&!document.fullscreenElement)await shell.requestFullscreen();}catch{}
  try{await window.screen?.orientation?.lock?.('landscape');}catch{}
}
async function leaveMobileView(){
  mobileSession=false;document.body?.classList.remove('mobile-session');clearInput();
  try{window.screen?.orientation?.unlock?.();if(document.fullscreenElement)await document.exitFullscreen();}catch{}
  mode='menu';screen('IMPACTO<br><em>REBELDE</em>','A resistência precisa de você. Escolha iniciar uma nova operação ou continuar sua campanha.','INICIAR OPERAÇÃO',()=>start());
  if(save){secondary.hidden=false;secondary.onclick=()=>start(save.won?0:save.level,true);}
}
$('#touch-exit').onclick=()=>leaveMobileView();
$('#fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else{await $('#game-shell').requestFullscreen();if(touchEnabled)try{await window.screen?.orientation?.lock?.('landscape');}catch{}}}catch{toast('O jogo já usa o layout horizontal no celular.');}};
window.addEventListener('resize',()=>clearInput());

function update(dt){time+=dt;if(mode!=='play'){for(const q of particles)q.life-=dt;return;}banner=Math.max(0,banner-dt);shake=Math.max(0,shake-30*dt);p.inv=Math.max(0,p.inv-dt);p.shot-=dt;p.grenade-=dt;p.buffer=Math.max(0,p.buffer-dt);p.weaponTime-=dt;if(p.weaponTime<=0)p.weapon=0;const left=isPressed('KeyA')||isPressed('ArrowLeft'),right=isPressed('KeyD')||isPressed('ArrowRight'),crouch=(isPressed('KeyS')||isPressed('ArrowDown'))&&p.grounded;p.vx=(Number(right)-Number(left))*(crouch?105:260);if(p.vx)p.face=Math.sign(p.vx);if(p.grounded)p.coyote=.1;else p.coyote=Math.max(0,p.coyote-dt);if(p.buffer>0&&p.coyote>0){p.vy=-580;p.grounded=false;p.coyote=0;p.buffer=0;tone(360,.09,'triangle');}moveActor(p,dt,platforms);p.x=clamp(p.x,0,LEVELS[level].length-p.w);if(p.y>H+100)damage(100);if(isPressed('KeyJ')&&p.shot<=0)fire();
const cp=Math.floor(p.x/1100)*1100+90;if(cp>checkpoint&&cp<LEVELS[level].length-650){checkpoint=cp;toast('Checkpoint alcançado • granadas reabastecidas');p.ammo=Math.max(p.ammo,5);}
for(const e of enemies){if(e.dead||Math.abs(e.x-p.x)>850)continue;e.flash=Math.max(0,(e.flash||0)-dt);if(['soldier','heavy','sniper'].includes(e.type)){e.x=e.origin+Math.sin(time*(e.type==='heavy'?.55:.9)+e.phase)*(e.type==='sniper'?18:48);e.y=GROUND-e.h;}else if(e.type==='drone'){e.y=GROUND-180+Math.sin(time*2+e.phase)*30;}else{e.w=38;e.h=34;e.y=GROUND-e.h;}e.cool-=dt;if(e.cool<=0&&Math.abs(p.x-e.x)<600){const dx=p.x+14-e.x-e.w/2,dy=p.y+22-e.y-15,d=Math.hypot(dx,dy);shots.push({x:e.x+e.w/2,y:e.y+15,vx:dx/Math.max(1,d)*(e.type==='sniper'?420+level*8:220+level*16),vy:dy/Math.max(1,d)*(e.type==='sniper'?420+level*8:220+level*16),life:4,friendly:false});e.cool=Math.max(.8,2.05+Math.random()*.5-level*.13);if(e.type==='heavy'){shots.push({x:e.x+e.w/2,y:e.y+22,vx:dx/Math.max(1,d)*(205+level*14),vy:dy/Math.max(1,d)*(205+level*14)+35,life:4,friendly:false});}}if(overlap(p,e))damage(15);}
boss.active ||= p.x>boss.x-650;if(boss.active&&!boss.dead){boss.phase+=dt;boss.flash=Math.max(0,(boss.flash||0)-dt);boss.y=GROUND-boss.h+(level===3?Math.sin(boss.phase*1.7)*45-45:0);boss.cool-=dt;if(boss.cool<=0){const dx=p.x+14-(boss.x+20),dy=p.y+20-(boss.y+50),a=Math.atan2(dy,dx),count=boss.hp<boss.max*.5?Math.min(7,4+Math.floor(level/2)):3+Math.floor(level/4);for(let n=0;n<count;n++){const t=a+(n-(count-1)/2)*.16;shots.push({x:boss.x+20,y:boss.y+50,vx:Math.cos(t)*(220+level*12),vy:Math.sin(t)*(220+level*12),life:5,friendly:false});}boss.cool=Math.max(.7,1.7-level*.115);if(level>=2){shots.push({x:boss.x,y:GROUND-9,vx:-185-level*15,vy:0,life:5,friendly:false});}if(level>=5&&boss.hp<boss.max*.5){shots.push({x:boss.x+75,y:boss.y,vx:-160-level*8,vy:-280,gravity:380,life:4,friendly:false});}tone(90,.1,'triangle',.015);}if(overlap(p,boss))damage(25);}
for(const s of shots){const x=s.x,y=s.y;s.x+=s.vx*dt;if(s.gravity)s.vy+=s.gravity*dt;s.y+=s.vy*dt;s.life-=dt;if(s.friendly){for(const e of [...enemies,boss])if(!e.dead&&(e!==boss||boss.active)&&segmentHit(x,y,s.x,s.y,e)){hitEnemy(e,s.power);s.life=0;break;}}else{const r=crouch?{x:p.x,y:p.y+22,w:p.w,h:26}:p;if(segmentHit(x,y,s.x,s.y,r)){damage(12);s.life=0;}}if(s.y>GROUND)s.life=0;}
shots=shots.filter(s=>s.life>0&&Math.abs(s.x-p.x)<1200&&s.y>-200);
for(const g of grenades){moveActor(g,dt,platforms);if(g.grounded)g.vx*=.94;g.life-=dt;if(g.life<=0){burst(g.x,g.y,'#ffbc58',45);shake=9;tone(60,.3,'sawtooth',.05);for(const e of [...enemies,boss])if(!e.dead&&(e!==boss||boss.active)&&Math.hypot(e.x+e.w/2-g.x,e.y+e.h/2-g.y)<180)hitEnemy(e,26);}}grenades=grenades.filter(g=>g.life>0);
for(const q of particles){q.x+=q.vx*dt;q.y+=q.vy*dt;q.vy+=500*dt;q.life-=dt;}particles=particles.filter(q=>q.life>0).slice(-300);
for(const item of pickups)if(!item.used&&overlap(p,item)){item.used=true;if(item.type==='health'){p.hp=Math.min(100,p.hp+30);toast('Kit médico +30');}else{p.weapon=level%2+1;p.weaponTime=22;p.ammo+=3;toast(p.weapon===1?'METRALHADORA • 22 segundos':'ESCOPETA • 22 segundos');}tone(600,.15,'triangle');}
for(const h of hostages)if(!h.saved&&overlap(p,h)){h.saved=true;score+=300;p.ammo+=2;toast('Civil resgatado • +300 pontos • +2 granadas');tone(700,.18,'triangle');}
for(const h of traps)if(hazardActive(h,time)&&overlap(p,h))damage(18+level);
camera=clamp(p.x-W*.32,0,LEVELS[level].length-W);if(boss.dead&&p.x>LEVELS[level].length-100)complete();}
function rect(x,y,w,h,c){ctx.fillStyle=c;ctx.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));}
function text(s,x,y,size=12,color='#f4efe1',align='left'){ctx.font=`bold ${size}px monospace`;ctx.textAlign=align;ctx.fillStyle=color;ctx.fillText(s,x,y);ctx.textAlign='left';}
// Five painted environments with explicit row bounds (the panels are not equal).
const sceneryAtlas=typeof Image==='undefined'?null:new Image();
if(sceneryAtlas)sceneryAtlas.src='./assets/backgrounds-v13.webp';
const SCENERY_ROWS=[0,361,677,1002,1310,1672];
const MISSION_SCENERY=[1,4,2,2,3,0,1,2,0];
const SCENERY_PALETTES=[['#302148','#a782e5'],['#33394b','#f2b275'],['#202947','#889bd8'],['#372825','#fbb06b'],['#472351','#d58cdd']];
function paintedBackground(){
 if(!sceneryAtlas?.complete||!sceneryAtlas.naturalWidth)return false;
 const theme=MISSION_SCENERY[level],sy=SCENERY_ROWS[theme],sh=SCENERY_ROWS[theme+1]-sy;
 const tileWidth=sceneryAtlas.naturalWidth*GROUND/sh,offset=camera*.16;
 ctx.save();ctx.imageSmoothingEnabled=true;
 // Mirrored neighboring panels meet at the same edge, without a hard wrapping seam.
 for(let tile=Math.floor(offset/tileWidth);tile*tileWidth-offset<W;tile++){
  const dx=tile*tileWidth-offset;ctx.save();ctx.translate(dx+(tile%2?tileWidth:0),0);ctx.scale(tile%2?-1:1,1);
  ctx.drawImage(sceneryAtlas,0,sy,sceneryAtlas.naturalWidth,sh,0,0,tileWidth,GROUND);ctx.restore();
 }
 // Independent nearer layer: depth remains visible when the distant art moves slowly.
 for(let n=-1;n<9;n++){const x=n*170-(camera*.42%170),h=24+(n+10)*19%53;
  if(theme===1||theme===2){rect(x,GROUND-h,95,h,theme===2?'#111b35b0':'#29274099');for(let j=0;j<4;j++)rect(x+9+j*19,GROUND-h+9,4,6,'#ffd39c55');}
  else if(theme===4){rect(x+30,GROUND-90,8,90,'#35204088');for(let j=0;j<4;j++)rect(x+14-j*3,GROUND-83+j*14,40+j*9,7,'#71376b66');}
  else{ctx.fillStyle=theme===3?'#221d22a0':'#292039a0';ctx.beginPath();ctx.moveTo(x,GROUND);ctx.lineTo(x+42,GROUND-h);ctx.lineTo(x+108,GROUND);ctx.fill();}
 }
 // Stars, drifting cloud wisps, embers and petals move independently of the player.
 for(let n=0;n<28;n++){
  const speed=theme===3?12:theme===4?18:4;
  const x=((n*83+time*speed-camera*.08)%W+W)%W,y=80+(n*47)%320;
  if(theme===0||theme===2){ctx.globalAlpha=.25+.45*(.5+.5*Math.sin(time*1.5+n));rect(x,y,2,2,'#dce3ff');}
  else if(theme===3){ctx.globalAlpha=.5;rect(x,GROUND-((n*43+time*30)%330),2,4,'#ffc578');}
  else if(theme===4){ctx.globalAlpha=.4;rect(x,y+Math.sin(time+n)*9,4,2,'#f5afd7');}
  else if(n<7){ctx.globalAlpha=.06;rect(x,120+n*25,105,9,'#fff2de');}
 }
 ctx.globalAlpha=1;
 if(theme===3){const glow=ctx.createLinearGradient(0,GROUND-80,0,GROUND);glow.addColorStop(0,'#ff9c2800');glow.addColorStop(1,`rgba(255,115,28,${.12+Math.sin(time*2)*.035})`);ctx.fillStyle=glow;ctx.fillRect(0,GROUND-80,W,80);}
 const [base,rim]=SCENERY_PALETTES[theme];rect(0,GROUND,W,H-GROUND,base);rect(0,GROUND,W,6,rim);
 for(let n=-1;n<34;n++){const x=n*32-camera%32;rect(x,GROUND+12+(n+35)*17%65,18,2,'#ffffff14');rect(x+22,GROUND+8,2,15,'#00000030');}
 const shadow=ctx.createLinearGradient(0,GROUND,0,H);shadow.addColorStop(0,'#00000000');shadow.addColorStop(1,'#00000066');ctx.fillStyle=shadow;ctx.fillRect(0,GROUND,W,H-GROUND);
 // Explosions briefly illuminate the scenery instead of affecting collision geometry.
 if(shake>3){ctx.fillStyle=`rgba(255,176,79,${Math.min(.09,shake*.006)})`;ctx.fillRect(0,61,W,GROUND-61);}
 ctx.restore();return true;
}
function themedPlatform(platform){
 const theme=MISSION_SCENERY[level],[base,rim]=SCENERY_PALETTES[theme],{x,y,w,h}=platform;
 // Draw exactly the collision rectangle, with its bright top edge at platform.y.
 rect(x,y,w,h,base);rect(x,y,w,4,rim);rect(x,y+h-4,w,4,'#00000040');
 for(let j=8;j<w;j+=28){rect(x+j,y+7,17,2,'#ffffff20');rect(x+j+19,y+5,2,h-6,'#00000035');}
 if(theme===4){for(let j=10;j<w;j+=43){rect(x+j,y-4,2,4,'#dd92d5');rect(x+j+2,y+h,3,17,'#815182');}}
 else{rect(x+12,y+h,6,GROUND-y-h,'#18233670');rect(x+w-18,y+h,6,GROUND-y-h,'#18233670');}
}
function background(){if(paintedBackground())return;const l=LEVELS[level];rect(0,0,W,H,l.sky);const gradient=ctx.createLinearGradient(0,0,0,GROUND);gradient.addColorStop(0,l.sky);gradient.addColorStop(1,l.far);ctx.fillStyle=gradient;ctx.fillRect(0,0,W,GROUND);rect(738-camera*.03,65,65,65,level===4?'#d18157':'#e8ce9d');for(let layer=0;layer<2;layer++){const speed=layer?.38:.16,col=layer?l.near:l.far;for(let n=-1;n<10;n++){const x=n*180-(camera*speed%180),height=80+((n+11)*47%130);if(level===1){rect(x+65,GROUND-height,15,height,col);ctx.fillStyle=col;ctx.beginPath();ctx.moveTo(x,GROUND-height+50);ctx.lineTo(x+75,GROUND-height-80);ctx.lineTo(x+155,GROUND-height+50);ctx.fill();}else if(level===3){ctx.fillStyle=col;ctx.beginPath();ctx.moveTo(x-80,GROUND);ctx.lineTo(x+70,GROUND-height-70);ctx.lineTo(x+240,GROUND);ctx.fill();if(layer===0){ctx.fillStyle='#a1b6be';ctx.beginPath();ctx.moveTo(x+36,GROUND-height-15);ctx.lineTo(x+70,GROUND-height-70);ctx.lineTo(x+105,GROUND-height-15);ctx.fill();}}else{rect(x,GROUND-height,95,height,col);rect(x+20,GROUND-height-25,12,25,col);for(let j=0;j<4;j++)rect(x+12+j*18,GROUND-height+18,7,10,layer?'#ffffff0b':'#e2b96c20');}}}scenery(l);environmentDetails(l);rect(0,GROUND,W,H-GROUND,l.ground);rect(0,GROUND,W,7,l.accent);for(let n=0;n<45;n++)rect((n*39-camera%39),GROUND+17+(n*13%65),15,3,'#00000025');terrainDetails(l);}
function scenery(l){
 const offset=camera*.65;
 for(let n=-1;n<9;n++){const x=n*220-offset%220;
 if(level===0){rect(x,370,9,80,'#675a43');rect(x-35,365,100,8,'#a1906b');rect(x-20,402,145,3,'#7fa1a9');}
 else if(level===1){rect(x+70,215,22,235,'#314c3b');for(let j=0;j<4;j++)rect(x+35-j*8,210+j*24,90+j*14,18,'#3e6347');rect(x+115,200,4,180,'#769467');}
 else if(level===2){rect(x,335,120,115,'#504756');rect(x+15,290,36,45,'#504756');rect(x+4,335,40,8,'#998174');rect(x+25,355,30,45,'#26333f');rect(x+70,355,25,25,'#26333f');}
 else if(level===3){rect(x,395,135,55,'#b5c8d0');rect(x+15,380,100,15,'#d4e4e7');for(let j=0;j<5;j++)rect(x+j*29,365,3,85,'#7098af');}
 else if(level===4){rect(x,300,70,150,'#524046');rect(x+4,310,62,10,'#b9754d');rect(x+20,335,30,75,'#201f2c');rect(x+24,350,22,55,'#d58b44');rect(x+80,245,20,205,'#655358');rect(x+77,240,26,8,'#aa7e60');}
 else if(level===5){ctx.fillStyle='#ba8d5b';ctx.beginPath();ctx.moveTo(x-80,450);ctx.quadraticCurveTo(x+70,330,x+235,450);ctx.fill();rect(x+50,390,45,60,'#756148');rect(x+58,393,23,5,'#caaa72');}
 else if(level===6){rect(x+10,360,170,90,'#365d70');rect(x+15,365,160,5,'#90a9ad');for(let j=0;j<7;j++)rect(x+23+j*20,373,4,70,'#527d8a');rect(x+120,140,9,220,'#839cac');rect(x+55,135,180,8,'#839cac');rect(x+210,135,3,200,'#91aab4');}
 else if(level===7){rect(x,245,190,22,'#686981');rect(x+45,267,15,183,'#555973');rect(x+160,267,15,183,'#555973');rect(x,238,190,4,'#bbadc4');rect(x+50,345,100,7,'#6c6d86');}
 else{rect(x+30,215,96,235,'#324658');rect(x+35,220,86,8,'#65b6bf');for(let j=0;j<5;j++){rect(x+44,245+j*32,65,4,'#69c4c8');rect(x+50,254+j*32,8,14,'#182b3d');}rect(x+135,360,55,90,'#344f62');}
 }
 if(level===3||level===6){for(let n=0;n<55;n++){const x=(n*71+time*(level===3?28:130))%W,y=(n*37+time*110)%GROUND;rect(x,y,level===3?3:2,level===3?3:12,'#d2e1ed55');}}
}
function environmentDetails(l){
 // Deterministic masonry, foliage and weather: no random shimmer or heavy assets.
 for(let n=-1;n<8;n++){const x=n*220-(camera*.65%220);
  if([2,4,6,8].includes(level)){for(let row=0;row<6;row++){rect(x+4,342+row*17,112,1,'#00000026');for(let col=0;col<4;col++)rect(x+col*29+(row%2)*12,343+row*17,1,15,'#ffffff12');}rect(x+5,338,3,104,'#ffffff20');rect(x+110,340,6,110,'#00000030');}
  if(level===1){for(let j=0;j<12;j++){const dx=(j*31)%120;rect(x+dx,250+(j*23)%175,15,6,j%2?'#72935a55':'#183c3255');}rect(x+73,230,4,215,'#b5b78322');}
  if(level===0||level===6){for(let j=0;j<4;j++)rect(x+j*42,420+j%2*9,32,2,'#c0dfe337');}
  if(level===2){rect(x+60,310,4,67,'#161d2b');rect(x+64,365,18,3,'#161d2b');rect(x+90,419,25,12,'#998475');}
  if(level===4){for(let j=0;j<4;j++)rect(x+28+j*5,368-(time*24+j*17)%85,2,5,'#ffcc7960');}
  if(level===5){rect(x+50,402,3,42,'#e1bc8a60');rect(x+88,399,7,51,'#392b2d55');}
  if(level===7){for(let j=0;j<5;j++){rect(x+j*37,247,30,2,'#ffffff20');rect(x+j*37+29,250,2,15,'#00000030');}}
 }
 // Atmospheric horizon softens the distant silhouettes.
 const haze=ctx.createLinearGradient(0,300,0,GROUND);haze.addColorStop(0,'#c1d1ca00');haze.addColorStop(1,level===4?'#dc946522':'#c1d1ca22');ctx.fillStyle=haze;ctx.fillRect(0,300,W,150);
}
function terrainDetails(l){
 const shade=ctx.createLinearGradient(0,GROUND,0,H);shade.addColorStop(0,'#00000008');shade.addColorStop(1,'#00000070');ctx.fillStyle=shade;ctx.fillRect(0,GROUND,W,H-GROUND);
 for(let n=-1;n<36;n++){const x=n*31-camera%31,y=GROUND+12+(n*17+620)%65;rect(x,y,7,2,'#ffffff18');rect(x+9,y+3,3,3,'#00000032');}
 for(let n=-1;n<12;n++){const x=n*93-camera%93;rect(x,GROUND+7,39,2,'#00000038');rect(x+37,GROUND+9,2,7,'#00000025');if(level===1){rect(x+8,GROUND-7,2,9,'#9cb779');rect(x+12,GROUND-4,2,6,'#65894e');}if(level===3)rect(x,GROUND,53,3,'#e4f0ed');}
}
function drawHazards(){for(const h of traps){const active=hazardActive(h,time),phase=(time+h.phase)%h.period,warning=!active&&phase>h.period*.4;rect(h.x-3,GROUND-5,h.w+6,5,'#1d2e39');rect(h.x,h.y,h.w,h.h,active?'#ec8057':warning?'#edbe65':'#60786f');for(let j=0;j<h.w;j+=12)rect(h.x+j,h.y+3,5,3,active?'#ffdc8a':'#a3a988');if(active&&(h.type==='flame'||h.type==='laser'||h.type==='electric')){for(let j=0;j<h.w;j+=10)rect(h.x+j,h.y-7-(Math.floor(time*18+j)%3)*5,4,16,h.type==='flame'?'#ffc179':'#8de1e3');}if(warning)text('!',h.x+h.w/2,h.y-8,14,'#ffd287','center');}}
// Original character artwork: 2171 × 724 RGBA atlas, eight separate designs.
const characterAtlas=typeof Image==='undefined'?null:new Image();
if(characterAtlas)characterAtlas.src='./assets/characters-v12.webp';
const CHARACTER_REGIONS=[
 {name:'Rebelde Cobalto',x:0,w:261}, {name:'Infantaria',x:261,w:229},
 {name:'Atirador das Dunas',x:490,w:293}, {name:'Blindado',x:783,w:289},
 {name:'Comando Urbano',x:1072,w:271}, {name:'Patrulha Polar',x:1343,w:267},
 {name:'Oficial Carmesim',x:1610,w:281}, {name:'Androide',x:1891,w:280}
];
function illustratedSoldier(x,y,face,friendly,walk,crouch,role,variant){
 if(!characterAtlas?.complete||!characterAtlas.naturalWidth||role==='civilian')return false;
 const index=friendly?0:role==='heavy'?3:role==='sniper'?2:variant??1;
 const region=CHARACTER_REGIONS[index],sourceY=125,sourceH=523;
 // Feet stay attached to the physics body; visual size does not alter hitboxes.
 const height=friendly?62:58,width=height*region.w/sourceH,feet=y+(friendly?48:42);
 const step=Math.sin(walk),moving=walk!==0,bob=moving?Math.abs(step)*1.1:Math.sin(time*2)*.25;
 const recoil=friendly&&isPressed('KeyJ')&&p.shot>.07?1.7:0;
 ctx.save();ctx.translate(x+14,feet);ctx.scale(face<0?-1:1,1);
 ctx.imageSmoothingEnabled=true;
 ctx.fillStyle='#00000038';ctx.beginPath();ctx.ellipse(0,0,18,3,0,0,Math.PI*2);ctx.fill();
 if(crouch){ctx.translate(0,0);ctx.scale(1.12,.68);}
 // Split at the hip: animate two leg regions while the upper body bobs and recoils.
 const split=Math.floor(sourceH*.66),topHeight=height*split/sourceH,legHeight=height-topHeight;
 ctx.drawImage(characterAtlas,region.x,sourceY,region.w,split,-width/2-recoil,-height-bob,width,topHeight);
 for(let leg=0;leg<2;leg++){
  const half=region.w/2,dy=moving?(leg===0?step:-step)*2.2:0;
  ctx.save();ctx.translate((leg===0?-width/4:width/4),-legHeight);
  ctx.rotate(moving?(leg===0?step:-step)*.09:0);
  ctx.drawImage(characterAtlas,region.x+leg*half,sourceY+split,half,sourceH-split,-width/4,dy,width/2,legHeight-dy);
  ctx.restore();
 }
 // Directional barrel makes upward aim legible; gun recoil uses the firing cooldown.
 if(friendly&&(isPressed('KeyW')||isPressed('ArrowUp'))){rect(1,-height-9,4,24,'#172b38');rect(2,-height-8,1,17,'#a5d9e3');}
 if(friendly&&isPressed('KeyJ')&&p.shot>.1){const up=isPressed('KeyW')||isPressed('ArrowUp');const fx=up?3:width/2+2,fy=up?-height-13:-height*.52;ctx.fillStyle='#ffdc82';ctx.beginPath();ctx.moveTo(fx-3,fy);ctx.lineTo(fx+(up?0:9),fy-5);ctx.lineTo(fx+4,fy+2);ctx.lineTo(fx,fy+5);ctx.fill();}
 ctx.restore();return true;
}
function soldier(x,y,face,friendly=false,walk=0,crouch=false,role='soldier',variant=1){if(illustratedSoldier(x,y,face,friendly,walk,crouch,role,variant))return;const armor=friendly?'#e7b76b':role==='heavy'?'#a3a3a1':role==='sniper'?'#b5b193':'#8eaa89',shadow=friendly?'#8d613c':'#4a6559',pants=friendly?'#365e78':'#3d514f',skin='#eec69f';
const yy=y+(crouch?20:0),step=crouch?0:Math.sin(walk)*5;
rect(x-5,y+(friendly?48:42),39,3,'#00000035');
// Silhouette, boots, articulated legs and shaded armor; same collision footprint.
if(!crouch){rect(x+2,yy+27,10,16+step,'#162733');rect(x+16,yy+27,11,16-step,'#162733');rect(x+4,yy+28,6,12+step,pants);rect(x+18,yy+28,6,12-step,pants);rect(x+4,yy+32,6,3,'#78918d');rect(x+18,yy+32,6,3,'#78918d');rect(x,yy+41+step,13,6,'#162733');rect(x+16,yy+41-step,15,6,'#162733');rect(x+2,yy+41+step,8,2,'#657b83');rect(x+18,yy+41-step,9,2,'#657b83');}else{rect(x+1,yy+19,28,13,'#162733');rect(x+4,yy+20,20,6,pants);rect(x-2,yy+29,34,4,'#263640');}
rect(x+2,yy+12,26,crouch?16:20,'#172b35');rect(x+4,yy+13,22,crouch?13:17,shadow);rect(x+5,yy+13,18,12,armor);rect(x+6,yy+14,3,10,'#ffdf9f');rect(x+11,yy+16,12,3,shadow);rect(x+10,yy+21,5,6,'#435849');rect(x+18,yy+21,5,6,'#435849');rect(x+4,yy+28,22,3,'#2d3d40');rect(x+13,yy+28,5,3,'#c4bb91');
rect(x+7,yy+3,17,13,'#6d5140');rect(x+9,yy+4,14,10,skin);rect(x+10,yy+4,6,3,'#ffe1b6');rect(x+(face>0?21:7),yy+7,4,4,skin);rect(x+(face>0?18:10),yy+7,3,2,'#172732');rect(x+12,yy+13,8,2,'#ad7a60');rect(x+5,yy,22,6,friendly?'#365568':role==='sniper'?'#737e58':'#496b5b');rect(x+6,yy,20,2,'#98b0a7');rect(x+3,yy+4,26,3,'#243e47');if(friendly){rect(x+5,yy+5,24,2,'#df8360');rect(x-1,yy+6,5,8,'#c36a50');}
rect(x-3,yy+13,7,17,'#1d3541');rect(x-2,yy+14,4,11,'#617e77');rect(x+4,yy+15,7,12,shadow);rect(x+5,yy+16,5,7,armor);rect(x+8,yy+22,13,4,skin);rect(x+9,yy+25,7,3,'#34484b');
const up=friendly&&(isPressed('KeyW')||isPressed('ArrowUp'));if(up){rect(x+12,yy-13,7,31,'#152631');rect(x+14,yy-10,3,23,'#82949b');rect(x+10,yy+5,11,8,'#455c65');}else{const gun=face>0?x+15:x-19;rect(gun,yy+17,role==='sniper'?40:34,7,'#152630');rect(gun+2,yy+17,29,2,'#7f939a');rect(gun+9,yy+23,6,7,'#233943');rect(gun+8,yy+19,13,3,'#4b6570');if(role==='sniper')rect(gun+12,yy+12,13,4,'#213a43');}
// Seams, cheek shading, gloves, armor panels and worn edges.
rect(x+21,yy+8,2,5,'#ae795a');rect(x+10,yy+11,3,2,'#cf9774');rect(x+8,yy+1,13,1,'#cad3b766');rect(x+8,yy+16,2,9,'#ffffff35');rect(x+20,yy+16,3,10,'#00000035');rect(x+12,yy+17,6,5,'#253c3f');rect(x+13,yy+18,4,1,'#9bafa1');rect(x+9,yy+23,3,3,'#342e29');rect(x+18,yy+23,3,3,'#342e29');if(!crouch){rect(x+6,yy+29,1,10,'#ffffff28');rect(x+20,yy+29,1,10,'#ffffff28');rect(x+4,yy+37+step,7,2,'#293a3b');rect(x+18,yy+37-step,7,2,'#293a3b');}
if(role==='heavy'){rect(x,yy+14,5,14,'#b8b9ad');rect(x+23,yy+14,6,14,'#b8b9ad');rect(x+6,yy+12,18,4,'#d3d4bf');}
}
function drawBoss(){if(boss.dead)return;const b=boss,x=b.x,y=b.y;const colors=['#8e9873','#78895b','#987a69','#92b6bd','#ae7052','#c7a063','#738fa6','#a5a0bb','#688eaa'];rect(x-4,y+b.h-27,b.w+8,27,'#17252e');for(let n=0;n<6;n++){ctx.fillStyle='#687580';ctx.beginPath();ctx.arc(x+10+n*25,y+b.h-13,10,0,Math.PI*2);ctx.fill();rect(x+6+n*25,y+b.h-16,8,5,'#1c2c34');}rect(x+6,y+36,b.w-12,b.h-60,b.flash>0?'#fff0c3':colors[level]);rect(x+26,y+16,95,35,colors[level]);rect(x-40,y+39,75,14,'#293c48');rect(x-45,y+35,12,22,'#7e9094');rect(x+43,y+4,51,18,'#293d48');rect(x+49,y+8,35,6,level===5?'#78eef0':'#ffca73');rect(x+15,y+59,b.w-32,5,'#0003');rect(x+60,y+65,25,20,'#364652');// Mission-specific boss attachments and silhouettes.
if(level===1||level===5){for(let n=0;n<3;n++){const dx=Math.sin(time*3+n)*8;rect(x-16+n*65,y+65,12,40,'#344842');rect(x-25+n*65+dx,y+100,32,12,colors[level]);}rect(x+110,y+3,13,34,'#253a43');}
if(level===3||level===7){rect(x-18,y+20,185,8,'#94b6c7');rect(x+32,y-20,80,20,colors[level]);rect(x+68,y-36,7,16,'#243c4c');rect(x+9,y-39,120,4,'#aac5cb');}
if(level===4){rect(x+112,y-40,21,75,'#675753');rect(x+116,y-38,7,63,'#dd9b63');rect(x+25,y+43,90,8,'#edaa60');}
if(level===6){rect(x+86,y-38,11,61,'#668898');rect(x+40,y-38,57,9,'#668898');rect(x+33,y-36,10,31,'#374d5a');}
if(level===8){rect(x+60,y-38,32,43,'#436a82');rect(x+65,y-32,22,28,'#80dddc');rect(x-12,y+65,174,7,'#78bec8');}
for(let j=0;j<6;j++){rect(x+12+j*21,y+40,16,2,'#ffffff35');rect(x+18+j*21,y+57,2,2,'#cad6ce');rect(x+17+j*21,y+85,2,2,'#132634');}rect(x+8,y+38,b.w-16,3,'#ffffff25');rect(x+8,y+b.h-34,b.w-16,7,'#00000035');rect(x+12,y+43,5,25,'#ffffff30');rect(x+21,y+70,30,4,'#192f3c');rect(x+95,y+70,25,4,'#192f3c');
if(b.active){rect(245,78,470,26,'#0b1523dd');rect(250,98,460,4,'#ffffff20');rect(250,98,460*Math.max(0,b.hp/b.max),4,'#ffae62');text(LEVELS[level].boss.toUpperCase(),480,91,10,'#f5bc74','center');}}
function draw(){ctx.save();if(shake)ctx.translate(rand(-shake,shake),rand(-shake/2,shake/2));background();ctx.save();ctx.translate(-Math.round(camera),0);const l=LEVELS[level];for(const platform of platforms.slice(1))themedPlatform(platform);for(let x=320;x<l.length-650;x+=740){rect(x,GROUND-29,42,29,'#776d51');rect(x+3,GROUND-26,36,3,'#baa372');rect(x+18,GROUND-25,4,22,'#4e4b37');}drawHazards();for(const h of hostages)if(!h.saved){soldier(h.x,h.y,1,false,0,true,'civilian');text('SOS',h.x+12,h.y-10,11,'#ffd77d','center');}for(const e of enemies)if(!e.dead){if(['soldier','heavy','sniper'].includes(e.type))soldier(e.x,e.y,p.x>e.x?1:-1,false,e.type==='sniper'?0:time*8,false,e.type,e.skin);else if(e.type==='drone'){rect(e.x-12,e.y+6,55,7,'#9aafae');rect(e.x,e.y,28,20,e.flash?'#fff':'#4a6a77');rect(e.x+10,e.y+18,7,10,'#ffbd67');rect(e.x-16,e.y+4,12,3,'#263942');rect(e.x+42,e.y+4,12,3,'#263942');}else{rect(e.x,e.y+12,38,22,'#526b68');rect(e.x+5,e.y,28,18,'#8e9b80');rect(e.x-13,e.y+4,24,6,'#293d45');}if(e.flash)rect(e.x+5,e.y,16,4,'#ffdc9d');}drawBoss();for(const i of pickups)if(!i.used){const y=i.y+Math.sin(time*4)*3;rect(i.x-2,y-2,28,28,'#142d3a');rect(i.x,y,24,24,i.type==='health'?'#8fc5b0':'#efb766');text(i.type==='health'?'+':'W',i.x+12,y+17,18,'#162d38','center');}for(const g of grenades){rect(g.x,g.y,8,10,'#a9bd77');rect(g.x+2,g.y-3,4,4,'#fff0ac');}for(const s of shots){rect(s.x-(s.friendly?6:3),s.y-2,s.friendly?14:7,4,s.friendly?'#ffe4a1':'#ff7d62');}if(p.inv<=0||Math.floor(time*18)%2===0)soldier(p.x,p.y,p.face,true,p.vx?time*13:0,(isPressed('KeyS')||isPressed('ArrowDown'))&&p.grounded);for(const q of particles)rect(q.x,q.y,q.size,q.size,q.color);const exit=l.length-90;rect(exit,GROUND-125,6,125,'#c4d5d9');rect(exit+6,GROUND-125,55,35,boss.dead?'#9fdaaf':'#ad7770');text(boss.dead?'SAÍDA':'BLOQUEADO',exit-15,GROUND-145,11,boss.dead?'#c4eccb':'#f1ba97');ctx.restore();ctx.restore();
rect(0,0,W,61,'#0a1724ed');text('IR',20,34,24,'#ffbd66');text('AGENTE • RESISTÊNCIA',67,21,10,'#98aebb');rect(67,29,160,10,'#ffffff15');rect(67,29,160*Math.max(0,p.hp/100),10,p.hp<30?'#ef7d68':'#a6d3a6');text(`${Math.max(0,p.hp)} HP`,237,39,11);text(`VIDAS ${lives}`,325,24,12);text(`GRANADAS ${p.ammo}`,325,43,10,'#edc386');text(`MISSÃO ${level+1}/${LEVELS.length}`,500,24,12,'#ffbf6b');text(LEVELS[level].name.toUpperCase(),500,43,10,'#b7c9d4');text(String(score).padStart(7,'0'),W-20,32,20,'#f2ead4','right');text(p.weapon===0?'FUZIL':`${p.weapon===1?'METRALHADORA':'ESCOPETA'} ${Math.ceil(Math.max(0,p.weaponTime))}s`,22,H-18,12,'#ffcf85');rect(W-220,H-28,195,5,'#ffffff20');rect(W-220,H-28,195*clamp(p.x/LEVELS[level].length,0,1),5,'#e8ba77');if(banner>0&&mode==='play'){rect(250,135,460,64,'#0d1d2ae8');text(`MISSÃO ${level+1} — ${LEVELS[level].name.toUpperCase()}`,480,162,18,'#ffcb82','center');text(LEVELS[level].subtitle,480,184,11,'#d2dee0','center');}}
platforms=layout(0);enemies=makeEnemies(0);boss=makeBoss(0);camera=350;p.x=450;primary.onclick=()=>start();if(save){secondary.hidden=false;secondary.onclick=()=>start(save.won?0:save.level,true);}
let last=0,accumulator=0;function frame(now){const delta=Math.min(.1,(now-last)/1000||0);last=now;accumulator+=delta;while(accumulator>=1/120){update(1/120);accumulator-=1/120;}draw();requestAnimationFrame(frame);}requestAnimationFrame(frame);
if('serviceWorker'in navigator){navigator.serviceWorker.register('./sw.js').then(()=>navigator.serviceWorker.ready).then(()=>{$('#offline').textContent='PRONTO PARA JOGAR OFFLINE';}).catch(()=>{$('#offline').textContent='MODO ONLINE • CACHE INDISPONÍVEL';});}else $('#offline').textContent='NAVEGADOR SEM CACHE OFFLINE';
