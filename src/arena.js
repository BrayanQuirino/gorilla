import { alto, ancho } from './battle.js';
import { ARENAS } from './rules.js';
import { crear_atlas, accion_humano, accion_gorila, dibujar_sprite } from './sprites.js';

// Capa visual independiente: sprites dibujados en pixels, sin modificar la simulación.
// Los sprites definitivos del concept art podrán reemplazar estas figuras manteniendo esta API.
const paletas={
  claro:{fondo:'#2d442f',suelo:'#6b7e40',claro:'#897a49',oscuro:'#1a3027',hoja:'#4f8d42',roca:'#77816e',acento:'#b5b75b'},
  selva:{fondo:'#193f36',suelo:'#366b3f',claro:'#8a7849',oscuro:'#102d2e',hoja:'#36a258',roca:'#647565',acento:'#9cca56'},
  canon:{fondo:'#74513a',suelo:'#b08351',claro:'#d4a069',oscuro:'#503c36',hoja:'#72965a',roca:'#8f6b54',acento:'#dfc083'},
  hangar:{fondo:'#343d42',suelo:'#5b5b52',claro:'#777365',oscuro:'#222d31',hoja:'#6f8657',roca:'#86817a',acento:'#c5a46c'}
};
const equipoColores=['#efb65f','#78d0b0','#75b8ee','#e9857b','#c998e8','#d4c66f','#8fc971','#e7a175','#c6d2e6','#ef8eb3'];
const semilla=(x,y,n=1)=>{const v=Math.sin(x*127.1+y*311.7+n*74.7)*43758.5453;return v-Math.floor(v);};
const rect=(c,x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));};
function elipse(c,x,y,rx,ry,color){c.fillStyle=color;c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fill();}
function borde(c,x,y,w,h,fondo,brillo='#d5bd78'){
 rect(c,x+3,y+4,w,h,'#0b1417aa');rect(c,x,y,w,h,brillo);
 rect(c,x+3,y+3,w-6,h-6,fondo);
}
function arbol(c,x,y,escala=1){
 c.save();c.translate(x,y);c.scale(escala,escala);
 elipse(c,2,7,24,8,'#172a1b88');
 rect(c,-5,-19,11,27,'#4f3327');rect(c,-3,-15,3,16,'#95683b');
 for(const [dx,dy,r,color] of [[-15,-28,17,'#183d2d'],[16,-27,19,'#204d30'],[0,-40,22,'#307043'],[-11,-45,13,'#438d48'],[9,-51,12,'#4f9d4e']]){
  elipse(c,dx,dy,r,r*.68,color);
 }
 for(let i=0;i<9;i++)rect(c,-21+i*5,-44+(i%3)*6,4,3,i%2?'#7ab354':'#a4c56e');
 c.restore();
}
function roca(c,x,y,w=34,h=24,color='#77766c'){
 rect(c,x-w/2+4,y-h/2+6,w,h,'#15222677');rect(c,x-w/2,y-h/2,w,h,color);
 rect(c,x-w/2,y-h/2,w-8,5,'#c6b78e');rect(c,x+w/2-8,y-h/2+5,8,h-5,'#49534c');
 rect(c,x-w/2+6,y+h/2-4,w-10,4,'#414c40');
}
function caja(c,x,y,color='#90613d'){
 rect(c,x-13,y-9,28,23,'#1b2422');rect(c,x-13,y-12,26,23,color);
 rect(c,x-10,y-9,20,17,'#b58c59');rect(c,x-8,y-7,16,13,color);
 rect(c,x-2,y-9,4,17,'#d2a26a');rect(c,x-10,y-2,20,4,'#d2a26a');
}
function barril(c,x,y){
 rect(c,x-9,y-13,18,24,'#3b4645');rect(c,x-7,y-11,14,21,'#a35a38');
 rect(c,x-8,y-7,16,3,'#d7a267');rect(c,x-8,y+4,16,3,'#d7a267');
}
function agua(c,x,y,w,h){
 rect(c,x,y,w,h,'#1e6474');
 for(let i=0;i<Math.round(w*h/180);i++){
  const px=x+semilla(i,10)*w,py=y+semilla(i,22)*h;
  rect(c,px,py,8,2,i%3?'#4ca1ab':'#a6dce2');
 }
}
function terreno(id){
 const p=paletas[id]||paletas.claro;
 const canvas=document.createElement('canvas');canvas.width=ancho;canvas.height=alto;
 const c=canvas.getContext('2d');c.imageSmoothingEnabled=false;
 rect(c,0,0,ancho,alto,p.fondo);
 // suelo en parches rectangulares definidos, estética de tiles 16-bit.
 for(let y=0;y<alto;y+=16)for(let x=0;x<ancho;x+=16){
  const n=semilla(x,y,3);
  const color=n>.72?p.claro:n>.4?p.suelo:p.fondo;
  rect(c,x,y,16,16,color);
  if(n>.68)rect(c,x+semilla(x,y,6)*9,y+semilla(x,y,7)*9,4,2,p.acento);
  if(n<.16)rect(c,x+5,y+7,3,3,p.oscuro);
 }
 // zona central despejada deja espacio para 100 unidades.
 elipse(c,505,310,370,210,id==='hangar'?'#625f54':id==='canon'?'#b18a58':'#806c43');
 for(let i=0;i<340;i++){
   const x=120+semilla(i,4)*780,y=100+semilla(i,5)*450;
   rect(c,x,y,2+Math.round(semilla(i,8)*5),2,i%2?p.claro:p.suelo);
 }
 if(id==='hangar'){
   // hangar, plataformas, contenedores, torre y chatarra
   borde(c,20,14,360,100,'#3b4850','#a07c4b');
   for(let i=0;i<5;i++)borde(c,32+i*68,22,51,75,'#222e35','#6f7d78');
   borde(c,625,10,350,94,'#38444a','#947c55');
   for(let i=0;i<4;i++)borde(c,644+i*78,21,58,64,'#27353c','#73847c');
   for(let i=0;i<3;i++){rect(c,24,140+i*140,66,55,'#8b4937');rect(c,24,140+i*140,66,6,'#db7854');}
   rect(c,835,135,138,80,'#45677a');rect(c,835,135,138,9,'#8fa8ad');
   rect(c,850,140,10,66,'#2d444d');
   for(let i=0;i<6;i++)rect(c,110+i*145,580,70,16,'#9c815d');
   for(const [x,y] of [[112,190],[410,93],[760,560],[914,340]]){caja(c,x,y);barril(c,x+32,y+12);}
   for(let i=0;i<10;i++)rect(c,semilla(i,71)*950,semilla(i,81)*590,18,5,'#292f32');
 }else if(id==='canon'){
   for(const [x,y,w,h] of [[25,20,165,98],[820,20,152,94],[25,510,208,115],[805,508,171,110]]){
     rect(c,x,y,w,h,'#6e493b');rect(c,x+6,y+7,w-12,h-16,'#a4774d');rect(c,x+15,y+8,w-30,11,'#dbac6c');
   }
   agua(c,875,255,125,130);
   for(const [x,y] of [[135,155],[300,95],[815,190],[880,500],[220,550]])roca(c,x,y,54,36,'#866450');
   for(const [x,y] of [[174,110],[740,97],[92,495]])caja(c,x,y);
 }else{
   for(const [x,y,s] of [[43,88,1.2],[162,70,.85],[550,65,1.1],[940,120,1.2],[45,500,1.25],[908,535,1.4],[740,575,.8]])arbol(c,x,y,s);
   for(const [x,y] of [[155,155],[380,85],[855,190],[182,555],[620,560]])roca(c,x,y,44,27,p.roca);
   if(id==='selva'){
     agua(c,905,225,95,170);
     borde(c,20,25,155,95,'#647354','#aa9a65');borde(c,38,41,118,65,'#364a39','#c3aa73');
     for(let i=0;i<8;i++)rect(c,48+i*12,46,5,50,'#8b986c');
     for(const [x,y] of [[180,420],[840,520],[490,92]])arbol(c,x,y,.7);
   }else{
     borde(c,18,40,90,68,'#6b5035','#c0a46f');
     caja(c,125,100);caja(c,898,440);
   }
 }
 // pequeños detalles del terreno y hierba
 if(id!=='hangar')for(let i=0;i<120;i++){
   const x=semilla(i,51)*ancho,y=semilla(i,61)*alto;
   if(Math.hypot((x-500)/1.2,y-310)<185)continue;
   rect(c,x,y,3,8,p.hoja);rect(c,x+5,y+2,3,5,p.acento);
 }
 return canvas;
}
function humano(c,h,seleccionado,t,atlas){
 const muerto=h.vida<=0||h.estado==='eliminado'||h.estado==='incapacitado';
 if(seleccionado){elipse(c,h.x,h.y+2,13,6,'#f4e4a466');}
 if(h.oculto&&!muerto)elipse(c,h.x,h.y-3,15,5,'#4e9e6c55');
 elipse(c,h.x+2,h.y+1,11,4,'#0b151b80');
 const action=accion_humano(h);
 const frames=atlas.humano(action,h.escuadron-1,h.id%5,h.edad>=65,Boolean(h.objeto));
 const speed=action==='run'?1.8:action==='tired'?.45:1;
 dibujar_sprite(c,frames,h.x,h.y,25,34,t*speed,h.id*.41);
 if(h.proteccion>0&&!muerto)rect(c,h.x-7,h.y-27,14,3,'#bfc2a3');
 if(h.estado==='herido')rect(c,h.x+8,h.y-34,3,5,'#ef554f');
}
function gorila(c,g,t,atlas){
 elipse(c,g.x+3,g.y+1,g.radio*1.5,12,'#0c151baf');
 if(g.furia>0){for(let i=0;i<10;i++){
  const theta=i*Math.PI/5+t*2;
  rect(c,g.x+Math.cos(theta)*g.radio*1.45-3,g.y-36+Math.sin(theta)*25,6,7,i%2?'#eb513e':'#ffb65b');
 }}
 const action=accion_gorila(g);
 const frames=atlas.gorila.get(action)||atlas.gorila.get('idle');
 const scale=g.radio/30;
 dibujar_sprite(c,frames,g.x,g.y+10,Math.round(90*scale),Math.round(96*scale),t,0);
}
function baliza(c,x,y,r,color){
 c.strokeStyle=color;c.lineWidth=3;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.stroke();
}
export function crear_dibujante(canvas){
 const ctx=canvas.getContext('2d',{alpha:false});
 ctx.imageSmoothingEnabled=false;
 const capas=new Map();
 const atlas=crear_atlas();
 let tiempo=0;
 let visto=0;
 const chispas=[];
 let previo=null;
 return (batalla,escuadron)=>{
  const id=batalla.arena||'claro';
  if(!capas.has(id))capas.set(id,terreno(id));
  tiempo+=1/60;
  if(previo!==batalla){previo=batalla;visto=0;chispas.length=0;}
  const eventos=batalla.eventos||[];
  if(visto>eventos.length)visto=0;
  for(const e of eventos.slice(visto)){
   if(['arma_encontrada','disparo','baja','rescate','furia','compra','ataque_gorila'].includes(e.tipo)){
    const h=batalla.hombres.find(u=>u.id===e.hombre);
    const x=h?.x??batalla.gorila.x,y=h?.y??batalla.gorila.y;
    const txt={arma_encontrada:'¡EQUIPO!',disparo:'BANG!',baja:'¡CAÍDO!',rescate:'¡RESCATE!',furia:'¡FURIA!',compra:'🍌 COMPRA',ataque_gorila:'¡CUIDADO!'}[e.tipo];
    chispas.push({x,y,texto:txt,vida:1.0,color:e.tipo==='baja'?'#ff6960':e.tipo==='arma_encontrada'?'#f4e27a':'#fff2bd'});
   }
  }
  visto=eventos.length;
  ctx.imageSmoothingEnabled=false;ctx.drawImage(capas.get(id),0,0);
  // objetos aún en arena: los ocultos nunca se muestran antes de encontrarlos.
  for(const o of batalla.armas_suelo||[]){
    if(o.recogido_por||!o.visible)continue;
    caja(ctx,o.x,o.y,o.objeto?.tipo==='fuego'?'#ad6348':'#9c784d');
    if(o.objeto?.tipo==='fuego'){rect(ctx,o.x-6,o.y-3,12,3,'#252b30');rect(ctx,o.x+4,o.y-5,3,4,'#dfd49b');}
  }
  for(const s of batalla.suministros||[]){
    if(s.tipo==='barricada'){for(let i=0;i<5;i++)rect(ctx,s.x-40+i*17,s.y-13,16,26,'#b78b5a');}
    else caja(ctx,s.x,s.y,s.tipo==='trampa'?'#ae574e':'#799a70');
  }
  const g=batalla.gorila;
  if((g.fase==='aviso'||g.fase==='embestida')&&g.destino){
    const r=g.accion==='rugido'?145:g.accion==='golpe_area'?g.radio+75:g.radio+28;
    ctx.fillStyle=g.accion==='rugido'?'#eccc4560':'#e85c4e50';
    ctx.beginPath();ctx.arc(g.destino.x,g.destino.y,r,0,Math.PI*2);ctx.fill();
    baliza(ctx,g.destino.x,g.destino.y,r,g.accion==='rugido'?'#f9d668':'#ff9473');
  }
  // orden por eje Y para profundidad estilo arcade isométrico
  const actores=[...batalla.hombres.map(h=>({y:h.y,tipo:'humano',h})),{y:g.y,tipo:'gorila'}].sort((a,b)=>a.y-b.y);
  for(const a of actores){
    if(a.tipo==='gorila')gorila(ctx,g,tiempo,atlas);
    else humano(ctx,a.h,Boolean(escuadron&&escuadron===a.h.escuadron),tiempo,atlas);
  }
  // barras de estado discretas y contexto táctico
  const barra=lim=>Math.max(0,Math.min(1,lim));
  rect(ctx,g.x-34,g.y-g.radio-33,68,7,'#101a1c');
  rect(ctx,g.x-32,g.y-g.radio-31,64*barra(g.vida/g.vida_maxima),3,g.furia>0?'#ff5c38':'#e44e42');
  rect(ctx,g.x-32,g.y-g.radio-27,64*barra(g.energia/100),2,'#e6b85d');
  ctx.font='bold 12px monospace';ctx.textAlign='center';
  ctx.fillStyle='#fff0b2';ctx.fillText(g.furia>0?'¡FURIA!':'GORILA',g.x,g.y-g.radio-39);
  // Impactos y eventos efímeros, nunca interfieren con la simulación.
  ctx.textAlign='center';ctx.font='bold 12px monospace';
  for(let i=chispas.length-1;i>=0;i--){const fx=chispas[i];
   ctx.globalAlpha=Math.max(0,fx.vida);ctx.fillStyle='#151a21';ctx.fillText(fx.texto,fx.x+1,fx.y-34-(1-fx.vida)*25+2);
   ctx.fillStyle=fx.color;ctx.fillText(fx.texto,fx.x,fx.y-34-(1-fx.vida)*25);
   ctx.globalAlpha=1;fx.vida-=1/60;if(fx.vida<=0)chispas.splice(i,1);
  }
  // borde cromático característico de HUD arcade
  rect(ctx,0,0,ancho,4,'#17252a');rect(ctx,0,alto-4,ancho,4,'#17252a');
 };
}
