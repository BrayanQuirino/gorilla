// Sprite atlas built in code at native pixel resolution, then scaled with nearest-neighbor.
// All 8-frame animations are independent of the battle engine and React.
const ink='#171923';
const palette={
 gorila:{body:'#282c37',shadow:'#171a23',silver:'#9696a1',light:'#c0bdc3',skin:'#6d6366',eyes:'#f4bf76'},
 skin:['#e9bb92','#b9825e','#f3cda4','#9c624b','#d29a78'],
 pants:['#303a48','#4b3a38','#333e32','#4c4454'],
};
const rect=(c,x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));};
function body(c,part,x,y,w,h,shade){rect(c,x+1,y+2,w,h,ink);rect(c,x,y,w,h,shade);}
function frameGorila(c,action,frame){
 const p=palette.gorila;const beat=frame%4;const walk=action==='walk'||action==='charge';
 const rage=action==='rage';const attack=action==='attack'||action==='charge'||action==='grab';
 const down=action==='down';const hurt=action==='hurt';
 c.clearRect(0,0,72,76);
 if(down){c.save();c.translate(4,28);c.scale(1,.67);}
 const bob=walk?(beat%2?2:0):rage?(beat%2?-2:1):0;
 const fore=attack?(beat<2?-11:beat===2?9:2):0;
 // Distinct, imposing knuckle-walking silhouette.
 body(c,'leg',18,49+bob,16,15,p.shadow);body(c,'leg',41,49+bob,15,15,p.shadow);
 rect(c,14,61+bob,22,7,p.skin);rect(c,40,61+bob,23,7,p.skin);
 body(c,'torso',13,21+bob,46,37,p.body);
 rect(c,19,24+bob,36,10,p.silver);rect(c,17,31+bob,40,12,p.silver);
 rect(c,21,28+bob,30,5,p.light);rect(c,25,39+bob,23,5,p.skin);
 body(c,'arm',6,28+bob+(walk?beat%2*3:0),15,32,p.body);
 body(c,'arm',52,27+bob+fore,15,32,p.body);
 rect(c,4,54+bob,17,9,p.skin);rect(c,54,55+bob+fore,15,9,p.skin);
 rect(c,8,59+bob,15,5,p.shadow);rect(c,55,60+bob+fore,14,5,p.shadow);
 // Massive head, strong brow, squared muzzle.
 body(c,'head',20,5+bob,33,26,p.body);
 rect(c,24,9+bob,25,9,p.shadow);rect(c,23,19+bob,29,12,p.skin);
 rect(c,27,24+bob,21,5,hurt?'#8e4b4a':'#413b43');
 rect(c,24,17+bob,10,4,p.shadow);rect(c,41,17+bob,9,4,p.shadow);
 rect(c,28,19+bob,4,2,rage?'#ff5944':p.eyes);
 rect(c,43,19+bob,4,2,rage?'#ff5944':p.eyes);
 if(attack||rage){rect(c,30,26+bob,15,6,'#2c2025');rect(c,32,26+bob,3,3,'#fff0db');rect(c,41,26+bob,3,3,'#fff0db');}
 else rect(c,32,28+bob,14,3,'#312c32');
 if(action==='roar'){rect(c,29,25+bob,18,11,'#291c24');rect(c,31,25+bob,4,3,'#fff2dc');rect(c,42,25+bob,4,3,'#fff2dc');}
 if(hurt)rect(c,50,10+bob,8,5,'#c25147');
 if(down)c.restore();
}
function frameHumano(c,action,frame,color,skin,age,armed){
 c.clearRect(0,0,28,37);
 const walk=['walk','run','search','retreat'].includes(action);
 const step=walk?(frame%4<2?2:-2):0;
 const attack=action==='attack';
 const crouch=['hide','ambush'].includes(action);
 const fall=action==='down';
 const panic=action==='panic';
 const tired=action==='tired';
 if(fall){rect(c,5,27,20,5,skin);rect(c,9,23,12,5,color);rect(c,22,28,4,3,'#3e4251');return;}
 if(crouch){rect(c,4,25,19,8,color);rect(c,7,19,10,8,skin);rect(c,7,16,12,3,age>=65?'#bfc2bb':'#3b2c2c');return;}
 rect(c,8,25+step,5,10,'#293747');rect(c,16,25-step,5,10,'#293747');
 rect(c,7,32+step,7,3,'#171c27');rect(c,16,32-step,7,3,'#171c27');
 body(c,'chest',6,14,17,14,color);rect(c,9,15,10,3,'#e2c9a1');
 rect(c,2,15+Math.max(0,-step),5,12,skin);
 rect(c,23,attack?11:15,5,attack?11:12,skin);
 rect(c,8,6,13,11,skin);
 rect(c,7,4,15,4,age>=65?'#bfc2bb':'#342a2a');
 rect(c,18,11,2,2,'#26222b');
 if(age>=65)rect(c,5,8,3,9,'#bfc2bb');
 if(tired)rect(c,3,12,3,3,'#6ba6d2');
 if(panic){rect(c,11,0,5,3,'#f9b85e');rect(c,11,4,5,2,'#f9b85e');}
 if(armed){rect(c,25,attack?7:15,3,12,'#8e979c');rect(c,26,attack?6:12,2,6,'#edc77a');}
 if(action==='hurt')rect(c,4,13,4,5,'#d24c3d');
}
function offscreen(w,h){const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;return canvas;}
export function crear_atlas(){
 const gorila=new Map(),humanos=new Map();
 for(const action of ['idle','walk','charge','attack','grab','roar','rage','hurt','down','tired']){
  const frames=[];
  for(let i=0;i<4;i++){const el=offscreen(72,76);frameGorila(el.getContext('2d'),action,i);frames.push(el);}
  gorila.set(action,frames);
 }
 function humano(action,colorId=0,skinId=0,old=false,armed=false){
  const key=[action,colorId,skinId,old,armed].join(':');
  if(!humanos.has(key)){
   const color=['#edb65b','#6cc5ad','#72b9e5','#ed8e80','#b89add','#d2c36f','#99c66a','#e0a378','#c4cfe0','#e58db2'][colorId%10];
   const skin=palette.skin[skinId%palette.skin.length];
   const frames=[];
   for(let i=0;i<4;i++){const el=offscreen(28,37);frameHumano(el.getContext('2d'),action,i,color,skin,old?75:35,armed);frames.push(el);}
   humanos.set(key,frames);
  }
  return humanos.get(key);
 }
 return {gorila,humano};
}
export function accion_humano(h){
 if(h.vida<=0||h.estado==='incapacitado'||h.estado==='eliminado')return 'down';
 if(h.estado==='panico'||h.miedo>74)return 'panic';
 if(h.estado==='herido')return 'hurt';
 if(h.oculto)return h.orden==='emboscada'?'ambush':'hide';
 if(h.energia<20)return 'tired';
 if(h.orden==='buscar_armas')return 'search';
 if(h.orden==='huir'||h.orden==='retirar')return 'run';
 if(h.orden==='atacar'&&h.recarga>0)return 'attack';
 if(Math.hypot(h.vx||0,h.vy||0)>8)return 'walk';
 return 'idle';
}
export function accion_gorila(g){
 if(g.vida<=0)return 'down';
 if(g.furia>0)return 'rage';
 if(g.fase==='embestida')return 'charge';
 if(g.fase==='aviso')return g.accion==='rugido'?'roar':'attack';
 if(g.fase==='recuperacion'&&g.energia<25)return 'tired';
 if(g.fase==='recuperacion')return 'hurt';
 return 'idle';
}
export function dibujar_sprite(c,frames,x,y,w,h,t,offset=0){
 const frame=frames[Math.floor(t*7+offset)%frames.length];
 c.drawImage(frame,Math.round(x-w/2),Math.round(y-h),w,h);
}
