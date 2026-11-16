// Native WebGL 3D: real meshes, directional lighting and an orthographic MOBA
// camera. Existing simulation still owns every position and combat rule.
import {ancho,alto,obstaculos_escena} from './terreno.js';
import {arquetipos} from './roster.js';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),TAU=Math.PI*2,SCALE=74;
const color=(r,g,b)=>[r/255,g/255,b/255];
const palettes={
 claro:{ground:color(78,124,80),soil:color(142,114,76),leaf:color(47,106,66),rock:color(131,142,129),sky:color(158,188,177)},
 selva:{ground:color(58,111,73),soil:color(121,105,66),leaf:color(35,105,64),rock:color(127,142,114),sky:color(135,184,162)},
 canon:{ground:color(137,117,83),soil:color(175,105,71),leaf:color(121,124,83),rock:color(172,117,85),sky:color(211,174,147)},
 hangar:{ground:color(84,101,102),soil:color(109,114,108),leaf:color(82,111,114),rock:color(131,146,151),sky:color(145,167,180)}
};
const shade=(c,k)=>c.map(v=>clamp(v*k,0,1));
const blend=(a,b,t)=>a.map((v,i)=>v*(1-t)+b[i]*t);
const noise=n=>{const v=Math.sin(n*12.9898+45.127)*43758.5453;return v-Math.floor(v)};
const point=o=>[(o.x-ancho/2)/SCALE,(o.altura||0)/SCALE,(o.y-alto/2)/SCALE];
const minus=(a,b)=>a.map((v,i)=>v-b[i]);
const plus=(a,b)=>a.map((v,i)=>v+b[i]);
const scale=(a,f)=>a.map(v=>v*f);
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const dot=(a,b)=>a.reduce((v,t,i)=>v+t*b[i],0);
const normal=v=>{const n=Math.hypot(...v)||1;return scale(v,1/n)};
function shader(gl,type,src){
 const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);
 if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){const err=gl.getShaderInfoLog(s);gl.deleteShader(s);throw Error(err)}
 return s;
}
function makeProgram(gl){
 const vs=shader(gl,gl.VERTEX_SHADER,[
 'attribute vec3 aPosition;attribute vec3 aNormal;attribute vec3 aColor;',
 'attribute vec3 aInstancePosition;attribute vec4 aInstanceInfo;',
 'uniform mat4 uProjection;uniform float uInstanced;uniform float uTime;',
 'varying vec3 vColor;varying vec3 vNormal;',
 'void main(){',
 'vec3 p=aPosition;vec3 normal=aNormal;',
 'if(uInstanced>0.5){',
 'float yaw=aInstanceInfo.x;float c=cos(yaw);float s=sin(yaw);',
 'float moving=clamp(aInstanceInfo.w,0.0,1.0);',
 'float gait=sin(uTime*9.0+aInstanceInfo.z)*moving;',
 'if(p.y<0.45){p.z+=gait*sign(p.x)*0.12;}',
 'else if(p.y<0.92&&abs(p.x)>0.2){p.z-=gait*sign(p.x)*0.09;}',
 'p.y+=abs(gait)*0.036;',
 'p=vec3(p.x*c+p.z*s,p.y,-p.x*s+p.z*c)*aInstanceInfo.y+aInstancePosition;',
 'normal=vec3(normal.x*c+normal.z*s,normal.y,-normal.x*s+normal.z*c);',
 '}',
 'gl_Position=uProjection*vec4(p,1.0);vColor=aColor;vNormal=normal;',
 '}'
 ].join('\n'));
 const fs=shader(gl,gl.FRAGMENT_SHADER,[
 'precision mediump float;varying vec3 vColor;varying vec3 vNormal;uniform vec3 uLight;',
 'void main(){float d=max(0.0,dot(normalize(vNormal),normalize(uLight)));',
 'vec3 c=vColor*(0.50+0.56*d);gl_FragColor=vec4(c,1.0);}'
 ].join('\n'));
 const p=gl.createProgram();gl.attachShader(p,vs);gl.attachShader(p,fs);gl.linkProgram(p);
 gl.deleteShader(vs);gl.deleteShader(fs);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(p));
 return p;
}
// Orthographic projection matrices are column major (OpenGL style).
function lookAt(eye,target){
 const forward=normal(minus(eye,target)),right=normal(cross([0,1,0],forward)),up=cross(forward,right);
 return [right[0],up[0],forward[0],0,right[1],up[1],forward[1],0,right[2],up[2],forward[2],0,
 -dot(right,eye),-dot(up,eye),-dot(forward,eye),1];
}
function ortho(h,aspect){const w=h*aspect;return [1/w,0,0,0,0,1/h,0,0,0,0,-1/60,0,0,0,0,1]}
function matrix(a,b){const r=Array(16).fill(0);for(let j=0;j<4;j++)for(let i=0;i<4;i++)
 for(let k=0;k<4;k++)r[j*4+i]+=a[k*4+i]*b[j*4+k];return r;}
class Mesh {
 constructor(){this.vertices=[];this.count=0}
 tri(a,b,c,color){
  const n=normal(cross(minus(b,a),minus(c,a)));
  for(const p of [a,b,c])this.vertices.push(...p,...n,...color);
  this.count+=3;
 }
 quad(a,b,c,d,c0){this.tri(a,b,c,c0);this.tri(a,c,d,c0)}
 ellipsoid(x,y,z,rx,ry,rz,c,seed=1,sides=9,tiers=5){
  for(let j=0;j<tiers;j++)for(let i=0;i<sides;i++){
   const t=j*Math.PI/tiers-Math.PI/2,u=(j+1)*Math.PI/tiers-Math.PI/2;
   const a=i*TAU/sides,b=(i+1)*TAU/sides;
   const v=(h,v)=>[x+rx*Math.cos(h)*Math.cos(v),y+ry*Math.sin(h),z+rz*Math.cos(h)*Math.sin(v)];
   const tone=shade(c,.89+.14*noise(seed+i*19+j*67));
   this.quad(v(t,a),v(t,b),v(u,b),v(u,a),tone);
  }
 }
 tube(a,b,r1,r2,c,sides=7){
  const axis=normal(minus(b,a)),right=normal(cross(axis,Math.abs(axis[1])>.8?[1,0,0]:[0,1,0])),side=cross(axis,right);
  const v=(p,r,t)=>plus(p,plus(scale(right,Math.cos(t)*r),scale(side,Math.sin(t)*r)));
  for(let i=0;i<sides;i++){
   const t=i*TAU/sides,u=(i+1)*TAU/sides;
   this.quad(v(a,r1,t),v(a,r1,u),v(b,r2,u),v(b,r2,t),shade(c,.85+.20*noise(i+a[0])));
  }
 }
 box(x,y,z,w,h,d,c,rot=0){
  const cs=Math.cos(rot),sn=Math.sin(rot);
  const p=(dx,dy,dz)=>[x+cs*dx+sn*dz,y+dy,z-sn*dx+cs*dz];
  const A=p(-w/2,0,-d/2),B=p(w/2,0,-d/2),C=p(w/2,0,d/2),D=p(-w/2,0,d/2);
  const E=p(-w/2,h,-d/2),F=p(w/2,h,-d/2),G=p(w/2,h,d/2),H=p(-w/2,h,d/2);
  this.quad(A,E,F,B,shade(c,.76));this.quad(B,F,G,C,shade(c,.86));
  this.quad(C,G,H,D,shade(c,.70));this.quad(D,H,E,A,shade(c,.72));
  this.quad(E,H,G,F,shade(c,1.12));
 }
 terrain(arena){
  const p=palettes[arena],nx=48,nz=32,dx=ancho/SCALE/nx,dz=alto/SCALE/nz;
  for(let j=0;j<nz;j++)for(let i=0;i<nx;i++){
   const x=-ancho/SCALE/2+i*dx,z=-alto/SCALE/2+j*dz;
   const center=Math.abs(z+.32*Math.sin(x*.7));
   const path=center<.53||Math.abs(z)>2.65&&Math.abs(z)<3.13;
   const c=shade(path?blend(p.ground,p.soil,.72):p.ground,.85+.28*noise(i*17+j*123));
   const y=.013*Math.sin(x*2.8+z*2);
   this.quad([x,y,z],[x+dx,y,z],[x+dx,y,z+dz],[x,y,z+dz],c);
  }
  // Tangible scene objects share the collision footprints in terreno.js.
  for(const o of obstaculos_escena(arena))this.obstacle(o,p);
  // Sparse foliage avoids obstructing the central combat paths.
  for(let i=0;i<220;i++){
   const x=(noise(i*3+9)-.5)*13,z=(noise(i*11+17)-.5)*8.15;
   if(Math.abs(z+.30*Math.sin(x*.7))<.65)continue;
   const height=.05+noise(i*7)*.11;
   this.tube([x,0,z],[x+.025,height,z+.03],.016,.004,shade(p.leaf,.76+noise(i*7+19)*.42),3);
  }
  if(arena==='selva'||arena==='claro'){
   // Water is a genuine plane; the bridge crosses it on its own geometry.
   this.box(-6.08,-.06,2.5,.78,.02,2.7,color(56,142,156),-.13);
   for(let i=0;i<19;i++){const z=1.25+noise(i*21)*2.4;
    this.box(-6.09+noise(i+5)*.3,-.034,z,.16,.005,.023,color(130,208,190));}
  }
 }
 obstacle(o,p){
  const [x,,z]=point(o),rx=o.rx/SCALE,rz=o.ry/SCALE;
  const h=clamp(o.altura/SCALE*.80,.32,1.8);
  if(o.tipo==='puente'){
   this.box(x,.01,z,rx*2,.08,rz*2,color(137,104,70));
   for(let i=-4;i<=4;i++)this.box(x+i*rx*.22,.10,z,.035,.026,rz*1.9,color(98,76,53));
   return;
  }
  if(o.tipo==='arbol'){
   this.tube([x,0,z],[x,h*1.65,z],Math.min(rx*.35,.23),.11,color(101,72,47),9);
   for(let i=0;i<4;i++){
    const a=i*2.4,dx=Math.cos(a)*rx*.42,dz=Math.sin(a)*rz*.36;
    this.ellipsoid(x+dx,h*(1.5+i*.06),z+dz,rx*.78,h*.67,Math.max(.36,rz*1.8),
      shade(p.leaf,.82+.25*noise(i+o.x)),i+o.x,9,6);
   }
   return;
  }
  if(o.tipo==='contenedor'||o.tipo==='caja'){
   const c=o.tipo==='contenedor'?color(91,117,125):color(146,103,69);
   this.box(x,0,z,rx*1.8,h,rz*1.85,c,.04);
   for(let i=-3;i<=3;i++)this.box(x+i*rx*.22,.03,z+rz*.94,.024,h*.82,.024,shade(c,1.18));
   return;
  }
  if(o.tipo==='ruina'){
   for(let i=0;i<3;i++){const a=i*TAU/3;
    this.box(x+Math.cos(a)*rx*.55,0,z+Math.sin(a)*rz*.65,rx*.35,h*(.78+noise(i+o.x)*.48),rz*.40,p.rock);}
   this.box(x,h*.76,z,rx*1.22,.15,rz*1.04,shade(p.rock,1.15));
   return;
  }
  this.ellipsoid(x,h*.43,z,rx*.97,h*.66,rz*1.04,p.rock,o.x+o.y,10,6);
  this.ellipsoid(x-rx*.25,h*.26,z+rz*.26,rx*.54,h*.34,rz*.64,shade(p.rock,.87),o.y,8,4);
  if(h>.68)this.ellipsoid(x+rx*.13,h*.78,z-rz*.12,rx*.49,h*.34,rz*.53,shade(p.rock,1.07),o.x,8,4);
 }
 humano(h,t){
  const [x,a,z]=point(h),alive=h.vida>0&&h.estado!=='eliminado'&&h.estado!=='incapacitado';
  const seed=h.id||0,medic=h.arquetipo==='Paramédico';
  const athlete=/Atleta|Velocista|Acróbata|Corredor|Boxeador|Tarzán/.test(h.arquetipo||'');
  const strong=/Musculoso|Boxeador|Beisbolista|Tarzán/.test(h.arquetipo||'');
  const size=(strong?1.13:1)*(h.arquetipo==='Anciano'?.85:1);
  if(!alive){this.ellipsoid(x,.10,z,.45,.12,.25,color(120,95,74),seed);return;}
  this.ellipsoid(x,.018,z,.25,.014,.17,color(40,64,52),seed+5,7,3);
  const v=Math.hypot(h.vx||0,h.vy||0),yaw=v>3?Math.atan2(h.vx,h.vy):0;
  const si=Math.sin(yaw),co=Math.cos(yaw);
  const P=(sx,y,sz)=>[x+sx*co+sz*si,a+y,z-sx*si+sz*co];
  const uniforms={
   Entrenador:[72,116,90],Campista:[150,120,80],Estudiante:[110,129,162],
   Boxeador:[178,63,71],'Científico':[223,221,202],'Acróbata':[127,84,158],
   Oficinista:[91,115,134],Aficionado:[151,105,72],Turista:[190,147,84],
   Repartidor:[177,126,61],Musculoso:[111,106,102],Adolescente:[124,159,128],
   'Paramédico':[207,226,214],Velocista:[60,136,188],Atleta:[65,119,171],
   Beisbolista:[184,171,124],Malabarista:[166,96,158],Corredor:[74,145,133],
   Anciano:[130,133,127],'Tarzán':[96,132,71]
  };
  const uniform=color(...(uniforms[h.arquetipo]||[174,108,76]));
  const skin=color(180+Math.floor(noise(seed)*34),136+Math.floor(noise(seed+4)*28),109);
  const pants=medic?color(59,98,101):color(53,65,79);
  const walk=v>3?Math.sin(t*11+seed*.7):0,bounce=Math.abs(walk)*.04;
  const striking=(h.atacando_hasta||0)>t;
  this.ellipsoid(...P(0,.65*size+bounce,0),.23*size,.32*size,.17*size,uniform,seed);
  this.ellipsoid(...P(0,1.05*size+bounce,0),.16*size,.19*size,.15*size,skin,seed+23);
  this.ellipsoid(...P(0,1.18*size+bounce,0),.15*size,.06*size,.15*size,
   h.cascondo?color(201,169,80):h.arquetipo==='Anciano'?color(189,189,180):color(52,48,45),seed+30,7,3);
  // Archetype silhouettes have identifiable gear, rather than identical skins.
  if(h.arquetipo==='Científico'||h.arquetipo==='Oficinista')
   this.box(...P(0,.70*size,-.18),.08,.24,.025,
    h.arquetipo==='Científico'?color(49,133,154):color(199,139,74));
  if(h.arquetipo==='Repartidor'||h.arquetipo==='Campista'||h.arquetipo==='Turista')
   this.box(...P(0,.59*size,.19),.32,.40,.14,color(108,87,61));
  if(h.arquetipo==='Paramédico'){
   this.box(...P(0,.70*size,-.17),.16,.045,.028,color(178,51,51));
   this.box(...P(0,.64*size,-.17),.044,.17,.030,color(178,51,51));
  }
  if(h.arquetipo==='Beisbolista'||h.arquetipo==='Entrenador')
   this.ellipsoid(...P(0,1.23*size+bounce,-.03),.17,.055,.17,
    color(100,120,89),seed+62,7,3);
  for(const side of [-1,1]){
   const hip=P(side*.12,.40*size,0),knee=P(side*.12,.23*size,walk*side*.08);
   const foot=P(side*.13,.045*size,walk*side*.20);
   this.tube(hip,knee,.083*size,.072*size,pants,6);
   this.tube(knee,foot,.072*size,.078*size,pants,6);
   this.ellipsoid(...foot,.11,.063,.15,color(51,47,47),seed+side,6,3);
   const shoulder=P(side*.24,.86*size+bounce,0);
   const elbow=P(side*.33,.57*size,walk*side*.07);
   const fist=P(side*.36,.41*size+(striking&&side===1?.22:0),walk*side*.12+(striking&&side===1?.35:0));
   this.tube(shoulder,elbow,.083*size,.067*size,uniform,6);
   this.tube(elbow,fist,.061*size,.054*size,skin,6);
   this.ellipsoid(...fist,.072,.068,.072,skin,seed+side,6,3);
  }
  if(h.objeto){
   const gun=h.objeto.tipo==='fuego';
   this.tube(P(.38,.41*size,-.03),P(.38,.42*size,gun?-.48:-.28),
    gun?.048:.032,.022,gun?color(42,50,60):color(124,91,63),6);
  }
 }
 gorila(g,t){
  const [x,a,z]=point(g),k=clamp(g.radio/26,.85,1.42);
  const angry=g.furia_permanente||g.furia>0||g.segunda_vida==='activa';
  const fur=angry?color(118,69,54):color(75,72,67),face=angry?color(164,92,67):color(110,108,96);
  const move=g.movimiento>2,walk=move?Math.sin(t*7)*.19:0;
  const climbing=(g.trepando_hasta||0)>(g.navegacion_reloj||0);
  const striking=['aviso','agarre','embestida'].includes(g.fase);
  const y=a+.75*k+(move?Math.abs(walk)*.14:0);
  this.ellipsoid(x,.025,z,.78*k,.019,.46*k,color(40,59,50),1001,9,3);
  if(g.vida<=0){this.ellipsoid(x,.24,z,.85*k,.22*k,.47*k,fur,10);return;}
  this.ellipsoid(x,y,z,.65*k,.63*k,.53*k,fur,7,12,7);
  this.ellipsoid(x,y+.12*k,z+.26*k,.47*k,.53*k,.43*k,shade(fur,1.07),8,10,6);
  this.ellipsoid(x,y+.28*k,z+.51*k,.40*k,.39*k,.35*k,fur,9,10,6);
  this.ellipsoid(x,y+.19*k,z+.77*k,.30*k,.19*k,.25*k,face,12,9,4);
  for(const side of [-1,1]){
   const shoulder=[x+side*.51*k,y+.19*k,z+.14*k];
   const elbow=[x+side*.75*k,a+(.47+(climbing?.27:0))*k,z+.33*k+walk*side];
   const hand=[x+side*.77*k,a+(.14+(striking?.27:0)+(climbing?.34:0))*k,z+.79*k+walk*side];
   this.tube(shoulder,elbow,.23*k,.18*k,fur,9);
   this.tube(elbow,hand,.20*k,.17*k,fur,8);
   this.ellipsoid(...hand,.20*k,.16*k,.21*k,face,18+side,8,4);
   this.tube([x+side*.39*k,y-.28*k,z-.29*k],
    [x+side*.48*k,a+.16*k,z-.59*k-walk*side],.26*k,.19*k,fur,9);
  }
  this.ellipsoid(x-.14*k,y+.30*k,z+.85*k,.048*k,.05*k,.03*k,color(247,180,94),22,6,3);
  this.ellipsoid(x+.14*k,y+.30*k,z+.85*k,.048*k,.05*k,.03*k,color(247,180,94),23,6,3);
 }
 decoration(b){
  for(const o of b.armas_suelo||[]){
   if(o.recogido_por||!(o.reserva?o.descubierto:o.visible))continue;
   const [x,,z]=point(o);
   this.box(x,.02,z,.18,.13,.16,color(186,145,81));
  }
  for(const o of b.suministros||[]){
   const [x,,z]=point(o);const barricade=o.tipo==='barricada';
   this.box(x,.03,z,barricade?.82:.21,barricade?.58:.21,barricade?.22:.23,
    barricade?color(136,107,69):color(173,177,109));
  }
 }
}
export function crear_dibujante_moba(canvas,actualizar,fallo){
 const gl=canvas.getContext('webgl',{alpha:false,antialias:true,depth:true});
 if(!gl)throw Error('WebGL no disponible');
 const prog=makeProgram(gl),buffer=gl.createBuffer(),instanceBuffer=gl.createBuffer();
 const extension=gl.getExtension('ANGLE_instanced_arrays');
 const pos=gl.getAttribLocation(prog,'aPosition'),nor=gl.getAttribLocation(prog,'aNormal'),col=gl.getAttribLocation(prog,'aColor');
 const instancePos=gl.getAttribLocation(prog,'aInstancePosition'),instanceInfo=gl.getAttribLocation(prog,'aInstanceInfo');
 const projection=gl.getUniformLocation(prog,'uProjection'),light=gl.getUniformLocation(prog,'uLight');
 const instanced=gl.getUniformLocation(prog,'uInstanced'),timeUniform=gl.getUniformLocation(prog,'uTime');
 const meshes=new Map(),templates=new Map();
 const mock={id:1,x:ancho/2,y:alto/2,vida:20,estado:'normal',vx:0,vy:0,cascondo:false,objeto:null};
 if(extension){
  for(const archetype of arquetipos){
   const key=archetype;
   const m=new Mesh();m.humano({...mock,arquetipo:archetype},0);
   const gpu=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,gpu);
   gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(m.vertices),gl.STATIC_DRAW);
   templates.set(key,{buffer:gpu,count:m.count});
  }
 }
 let destroyed=false,previousArena=null,zoom=1;
 const onWheel=e=>{e.preventDefault();zoom=clamp(zoom*(e.deltaY>0?1.09:.91),.82,1.40);actualizar?.();};
 const onContextLost=e=>{e.preventDefault();fallo(new Error('Se perdió el contexto WebGL'))};
 canvas.addEventListener('wheel',onWheel,{passive:false});
 canvas.addEventListener('webglcontextlost',onContextLost);
 gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.disable(gl.CULL_FACE);
 function bindGeometry(gpu){
  gl.bindBuffer(gl.ARRAY_BUFFER,gpu);
  for(const [attr,offset] of [[pos,0],[nor,12],[col,24]]){
   gl.enableVertexAttribArray(attr);gl.vertexAttribPointer(attr,3,gl.FLOAT,false,36,offset);
  }
 }
 function archetypeGroup(h){return arquetipos.includes(h.arquetipo)?h.arquetipo:'Oficinista';}
 function frame(b){
  if(destroyed||gl.isContextLost())return false;
  const id=b.arena||'claro',pal=palettes[id]||palettes.claro;
  if(!meshes.has(id)){
   const scene=new Mesh();scene.terrain(id);
   const gpu=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,gpu);
   gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(scene.vertices),gl.STATIC_DRAW);
   meshes.set(id,{buffer:gpu,count:scene.count});
  }
  if(previousArena!==id)previousArena=id;
  const dynamic=new Mesh();
  dynamic.decoration(b);
  const t=b.transcurrido+(b.celebracion||0);
  const batches=new Map();
  for(const h of b.hombres){
   if(!extension){
    dynamic.humano(h,t);
    continue;
   }
   if(h.vida<=0||h.estado==='eliminado'||h.estado==='incapacitado'){
    dynamic.caido(h);continue;
   }
   const group=archetypeGroup(h);
   if(!batches.has(group))batches.set(group,[]);
   const location=point(h),moving=Math.hypot(h.vx||0,h.vy||0);
   const yaw=moving>3?Math.atan2(h.vx,h.vy):0;
   const bodyScale=1+(h.arquetipo==='Boxeador'?.035:0);
   batches.get(group).push(...location,yaw,bodyScale,h.id*.72,clamp(moving/28,0,1));
   if(h.objeto){
    const [x,a,z]=location;
    dynamic.tube([x+.19,a+.46,z],[x+.24,a+.43,z-.30],
     .045,.021,h.objeto.tipo==='fuego'?color(40,47,54):color(145,104,70),5);
   }
  }
  dynamic.gorila(b.gorila,t);
  const aspect=canvas.width/Math.max(1,canvas.height);
  const eye=[11.7,15.0,17.8],target=[0,.05,0];
  const m=matrix(ortho((aspect>1.5?5.9:8.0)*zoom,aspect),lookAt(eye,target));
  gl.viewport(0,0,canvas.width,canvas.height);
  gl.clearColor(...pal.sky,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
  gl.useProgram(prog);gl.uniformMatrix4fv(projection,false,new Float32Array(m));
  gl.uniform3f(light,.56,.87,.45);gl.uniform1f(timeUniform,t);
  gl.uniform1f(instanced,0);
  bindGeometry(meshes.get(id).buffer);
  gl.drawArrays(gl.TRIANGLES,0,meshes.get(id).count);
  gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
  gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(dynamic.vertices),gl.DYNAMIC_DRAW);
  bindGeometry(buffer);
  gl.drawArrays(gl.TRIANGLES,0,dynamic.count);
  if(extension){
   gl.uniform1f(instanced,1);
   for(const [group,instances] of batches){
    const template=templates.get(group);if(!template||!instances.length)continue;
    bindGeometry(template.buffer);
    gl.bindBuffer(gl.ARRAY_BUFFER,instanceBuffer);
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(instances),gl.DYNAMIC_DRAW);
    if(instancePos>=0){
     gl.enableVertexAttribArray(instancePos);
     gl.vertexAttribPointer(instancePos,3,gl.FLOAT,false,28,0);
     extension.vertexAttribDivisorANGLE(instancePos,1);
    }
    if(instanceInfo>=0){
     gl.enableVertexAttribArray(instanceInfo);
     gl.vertexAttribPointer(instanceInfo,4,gl.FLOAT,false,28,12);
     extension.vertexAttribDivisorANGLE(instanceInfo,1);
    }
    extension.drawArraysInstancedANGLE(gl.TRIANGLES,0,template.count,instances.length/7);
   }
   if(instancePos>=0){extension.vertexAttribDivisorANGLE(instancePos,0);gl.disableVertexAttribArray(instancePos);}
   if(instanceInfo>=0){extension.vertexAttribDivisorANGLE(instanceInfo,0);gl.disableVertexAttribArray(instanceInfo);}
   gl.uniform1f(instanced,0);
  }
  return true;
 }
 frame.liberar=()=>{
  destroyed=true;
  canvas.removeEventListener('wheel',onWheel);
  canvas.removeEventListener('webglcontextlost',onContextLost);
  gl.deleteBuffer(buffer);gl.deleteBuffer(instanceBuffer);
  for(const t of templates.values())gl.deleteBuffer(t.buffer);
  for(const m of meshes.values())gl.deleteBuffer(m.buffer);
  gl.deleteProgram(prog);meshes.clear();templates.clear();
 };
 return frame;
}

export function diagnostico_geometria_moba(arena){
 const mesh=new Mesh();
 mesh.terrain(arena);
 return {arena,vertices:mesh.count,obstaculos:obstaculos_escena(arena).length,
  limites:{x:ancho/SCALE,z:alto/SCALE},
  colores:palettes[arena]||palettes.claro};
}
