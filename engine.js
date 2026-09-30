export const W=960,H=540,GROUND=450;
export const LEVELS=[
 {name:'Costa de Cinzas',subtitle:'Rompa o bloqueio costeiro',sky:'#27485b',far:'#345e6b',near:'#244350',ground:'#6d6950',accent:'#b0a075',boss:'Bastião M-01',type:0,length:3900},
 {name:'Selva de Antenas',subtitle:'Recupere a estação de rádio',sky:'#233e38',far:'#355e48',near:'#214033',ground:'#575f36',accent:'#8fa760',boss:'Aracnídeo de Ferro',type:1,length:4300},
 {name:'Distrito em Ruínas',subtitle:'Liberte o corredor industrial',sky:'#4c4558',far:'#62546b',near:'#393543',ground:'#665764',accent:'#c68a6a',boss:'Cerco Blindado',type:2,length:4600},
 {name:'Cordilheira Fria',subtitle:'Atravesse a fortaleza glacial',sky:'#3e596f',far:'#7390a4',near:'#4c718b',ground:'#8da3b1',accent:'#d5e9e9',boss:'Vigia Boreal',type:3,length:4900},
 {name:'Fundição Rubra',subtitle:'Desative a linha de armamentos',sky:'#452c34',far:'#69403c',near:'#40292d',ground:'#665044',accent:'#e59855',boss:'Forja Colossal',type:4,length:5200},
 {name:'Núcleo Aurora',subtitle:'Destrua o núcleo e encerre a ocupação',sky:'#222f4b',far:'#394666',near:'#242e49',ground:'#4b566b',accent:'#75d1d5',boss:'Comandante Aurora',type:5,length:5500}
];
export const overlap=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
export function layout(index){const l=LEVELS[index],p=[{x:0,y:GROUND,w:l.length,h:100}];for(let x=500;x<l.length-750;x+=650)p.push({x,y:GROUND-85-(index%2)*20,w:185,h:18},{x:x+210,y:GROUND-150,w:145,h:18});return p;}
// One-way platforms. Sweep the feet over the entire frame to avoid tunnelling.
export function moveActor(a,dt,platforms){const previousBottom=a.y+a.h;a.vy+=1450*dt;a.x+=a.vx*dt;a.y+=a.vy*dt;a.grounded=false;if(a.vy>=0){let landing=Infinity;for(const p of platforms)if(a.x+a.w>p.x&&a.x<p.x+p.w&&previousBottom<=p.y+.5&&a.y+a.h>=p.y)landing=Math.min(landing,p.y);if(landing!==Infinity){a.y=landing-a.h;a.vy=0;a.grounded=true;}}}
export function segmentHit(x0,y0,x1,y1,r){let lo=0,hi=1;for(const [s,d,min,max] of [[x0,x1-x0,r.x,r.x+r.w],[y0,y1-y0,r.y,r.y+r.h]]){if(Math.abs(d)<1e-9){if(s<min||s>max)return false;}else{let a=(min-s)/d,b=(max-s)/d;if(a>b)[a,b]=[b,a];lo=Math.max(lo,a);hi=Math.min(hi,b);if(lo>hi)return false;}}return true;}
export function makePlayer(){return{x:90,y:GROUND-48,w:28,h:48,vx:0,vy:0,face:1,hp:100,grounded:true,inv:1,coyote:0,buffer:0,shot:0,grenade:0,ammo:8,weapon:0,weaponTime:0};}
export function makeEnemies(index){const l=LEVELS[index],arr=[];for(let x=640,n=0;x<l.length-650;x+=220,n++)arr.push({x,y:GROUND-42,w:28,h:42,hp:3+(index>2?1:0),max:4,type:n%5===3?'drone':n%5===4?'turret':'soldier',cool:1+(n%4)*.3,origin:x,phase:n,dead:false});return arr;}
export function makeBoss(index){const l=LEVELS[index];return{x:l.length-420,y:GROUND-120,w:150,h:120,hp:100+index*28,max:100+index*28,cool:2,phase:0,active:false,dead:false,type:index};}
export function loadSave(storage){try{const s=JSON.parse(storage.getItem('impacto-rebelde-v1'));if(s&&Number.isInteger(s.level)&&s.level>=0&&s.level<6&&Number.isFinite(s.score)&&s.score>=0)return{level:s.level,score:s.score,won:!!s.won};}catch{}return null;}
