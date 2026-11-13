// Renderizador WebGL 2.5D sin dependencias: geometría 3D, cámara fija y sombreado.
// El motor de simulación conserva sus coordenadas 1000x640; sólo cambia su representación.
import { ancho, alto } from './battle.js';

const TAU=Math.PI*2;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const palette={
 claro:{ground:'#52663a',path:'#92794b',foliage:'#366b3d',rock:'#818275',sky:'#b2c6a2'},
 selva:{ground:'#36583b',path:'#786c45',foliage:'#25714b',rock:'#8b977b',sky:'#9cb7a4'},
 canon:{ground:'#986b49',path:'#c49a6a',foliage:'#7e8550',rock:'#b67a58',sky:'#dfb58b'},
 hangar:{ground:'#4b575d',path:'#626765',foliage:'#5c655e',rock:'#68777d',sky:'#929e9f'}
};
const uniforms={};
function hex(s){const n=parseInt(s.slice(1),16);return [(n>>16&255)/255,(n>>8&255)/255,(n&255)/255];}
function shader(gl,type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;}
function program(gl){
 const p=gl.createProgram();
 gl.attachShader(p,shader(gl,gl.VERTEX_SHADER,`
 attribute vec3 position;attribute vec3 normal;
 uniform mat4 projection,model;
 varying vec3 vNormal;varying vec3 vWorld;
 void main(){vec4 world=model*vec4(position,1.0);vWorld=world.xyz;vNormal=normalize(mat3(model)*normal);gl_Position=projection*world;}
 `));
 gl.attachShader(p,shader(gl,gl.FRAGMENT_SHADER,`
 precision mediump float;
 uniform vec3 color;uniform float alpha;
 varying vec3 vNormal;varying vec3 vWorld;
 void main(){
 float light=max(dot(normalize(vNormal),normalize(vec3(-0.52,0.93,0.66))),0.0);
 float shade=0.42+0.58*light;
 float vignette=1.0-min(length(vWorld.xz)/50.0,1.0)*0.16;
 gl_FragColor=vec4(color*shade*vignette,alpha);
 }
 `));
 gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(p));
 return p;
}
function geometry(gl,vertices,normals){
 const count=vertices.length/3;
 const v=gl.createBuffer(),n=gl.createBuffer();
 gl.bindBuffer(gl.ARRAY_BUFFER,v);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(vertices),gl.STATIC_DRAW);
 gl.bindBuffer(gl.ARRAY_BUFFER,n);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(normals),gl.STATIC_DRAW);
 return {v,n,count};
}
function cube(gl){
 const a=[],b=[];
 for(const [normal,vs] of [
 [[0,0,1],[-.5,-.5,.5,.5,-.5,.5,.5,.5,.5,-.5,.5,.5]],
 [[0,0,-1],[.5,-.5,-.5,-.5,-.5,-.5,-.5,.5,-.5,.5,.5,-.5]],
 [[1,0,0],[.5,-.5,.5,.5,-.5,-.5,.5,.5,-.5,.5,.5,.5]],
 [[-1,0,0],[-.5,-.5,-.5,-.5,-.5,.5,-.5,.5,.5,-.5,.5,-.5]],
 [[0,1,0],[-.5,.5,.5,.5,.5,.5,.5,.5,-.5,-.5,.5,-.5]],
 [[0,-1,0],[-.5,-.5,-.5,.5,-.5,-.5,.5,-.5,.5,-.5,-.5,.5]]
 ]){
  for(const i of [0,1,2,0,2,3]){a.push(vs[i*3],vs[i*3+1],vs[i*3+2]);b.push(...normal);}
 }
 return geometry(gl,a,b);
}
function sphere(gl,lat=8,lon=12){
 const a=[],b=[];function point(t,p){return [Math.sin(t)*Math.cos(p),Math.cos(t),Math.sin(t)*Math.sin(p)];}
 for(let y=0;y<lat;y++)for(let x=0;x<lon;x++){
  const t=y*Math.PI/lat,T=(y+1)*Math.PI/lat,p=x*TAU/lon,P=(x+1)*TAU/lon;
  const q=[point(t,p),point(T,p),point(T,P),point(t,P)];
  for(const i of [0,1,2,0,2,3]){a.push(...q[i]);b.push(...q[i]);}
 }
 return geometry(gl,a,b);
}
function cylinder(gl,segments=10){
 const a=[],b=[];for(let i=0;i<segments;i++){
  const p=i*TAU/segments,P=(i+1)*TAU/segments;
  const q=[[Math.cos(p),-.5,Math.sin(p)],[Math.cos(P),-.5,Math.sin(P)],[Math.cos(P),.5,Math.sin(P)],[Math.cos(p),.5,Math.sin(p)]];
  for(const k of [0,1,2,0,2,3]){const v=q[k];a.push(...v);b.push(v[0],0,v[2]);}
  for(const [Y,order] of [[.5,[3,2] ],[-.5,[1,0]]]){
    const e=[[0,Y,0],q[order[0]],q[order[1]]];
    for(const v of e){a.push(...v);b.push(0,Y>0?1:-1,0);}
  }
 }
 return geometry(gl,a,b);
}
function ortho(l,r,b,t,n,f){return [2/(r-l),0,0,0,0,2/(t-b),0,0,0,0,-2/(f-n),0,-(r+l)/(r-l),-(t+b)/(t-b),-(f+n)/(f-n),1];}
function lookAt(e,c,up){
 const z=normalize(sub(e,c)),x=normalize(cross(up,z)),y=cross(z,x);
 return [x[0],y[0],z[0],0,x[1],y[1],z[1],0,x[2],y[2],z[2],0,-dot(x,e),-dot(y,e),-dot(z,e),1];
}
const sub=(a,b)=>a.map((v,i)=>v-b[i]),dot=(a,b)=>a.reduce((v,n,i)=>v+n*b[i],0);
const normalize=a=>{const n=Math.hypot(...a)||1;return a.map(v=>v/n);};
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
function mul(a,b){const out=Array(16).fill(0);for(let c=0;c<4;c++)for(let r=0;r<4;r++)for(let k=0;k<4;k++)out[c*4+r]+=a[k*4+r]*b[c*4+k];return out;}
function model(x,y,z,sx,sy,sz,rot=0){
 const c=Math.cos(rot),s=Math.sin(rot);
 return [c*sx,0,-s*sx,0,0,sy,0,0,s*sz,0,c*sz,0,x,y,z,1];
}
function hash(n){const v=Math.sin(n*127.1+42.4)*43758.5453;return v-Math.floor(v);}
function world(x,y){return [(x-500)/24,(y-320)/24];}
function createScene(gl,canvas){
 const p=program(gl);gl.useProgram(p);
 const loc={position:gl.getAttribLocation(p,'position'),normal:gl.getAttribLocation(p,'normal'),
 projection:gl.getUniformLocation(p,'projection'),model:gl.getUniformLocation(p,'model'),
 color:gl.getUniformLocation(p,'color'),alpha:gl.getUniformLocation(p,'alpha')};
 const mesh={cube:cube(gl),sphere:sphere(gl),cylinder:cylinder(gl)};
 gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);
 const cam=[0,39,48],view=lookAt(cam,[0,0,0],[0,1,0]);
 const proj=mul(ortho(-24,24,-14,14,.1,110),view);
 gl.uniformMatrix4fv(loc.projection,false,new Float32Array(proj));
 function draw(type,x,y,z,w,h,d,color,rot=0,alpha=1){
  const g=mesh[type];gl.bindBuffer(gl.ARRAY_BUFFER,g.v);gl.enableVertexAttribArray(loc.position);gl.vertexAttribPointer(loc.position,3,gl.FLOAT,false,0,0);
  gl.bindBuffer(gl.ARRAY_BUFFER,g.n);gl.enableVertexAttribArray(loc.normal);gl.vertexAttribPointer(loc.normal,3,gl.FLOAT,false,0,0);
  gl.uniformMatrix4fv(loc.model,false,new Float32Array(model(x,y,z,w,h,d,rot)));
  gl.uniform3fv(loc.color,new Float32Array(hex(color)));gl.uniform1f(loc.alpha,alpha);
  gl.drawArrays(gl.TRIANGLES,0,g.count);
 }
 return {draw,gl,p,loc,canvas,mesh};
}
function forest(draw,arena){
 const p=palette[arena];
 for(let i=0;i<36;i++){
  const x=(hash(i*4+3)-.5)*43,z=(hash(i*4+17)-.5)*26;
  if(Math.abs(x)<13&&Math.abs(z)<8)continue;
  if(arena==='hangar'){
   draw('cube',x,.55,z,1.4,1.1,1.25,i%3?'#816749':'#516a75');
   if(i%4===0)draw('cube',x,1.17,z,1.5,.12,1.3,'#b39b65');
  }else if(arena==='canon'){
   draw('sphere',x,.55,z,1.7,1.2,1.4,p.rock);
   if(i%4===0)draw('sphere',x+1,.30,z+.3,.95,.6,.85,'#d3a071');
  }else if(i%3!==0){
   draw('cylinder',x,.9,z,.35,1.8,.35,'#654332');
   draw('sphere',x,2.5,z,2.5,2.0,2.2,p.foliage);
   draw('sphere',x-.65,3.1,z,1.5,1.2,1.5,'#5b9356');
  }else draw('sphere',x,.35,z,1.2,.7,1.1,p.rock);
 }
 if(arena==='hangar'){
   for(const x of [-21,21]){draw('cube',x,2,0,1,4,26,'#263f4d');
   for(let i=-10;i<=10;i+=5)draw('cube',x,3.7,i,1.5,.3,3,'#a38a58');}
   draw('cube',0,.18,-12,42,.35,1,'#a6a49b');
 }else if(arena==='selva'){
  for(const x of [-19,19])draw('cube',x,.65,-10,3,1.3,3,'#7d866b');
  draw('cube',18,.05,0,3,.08,23,'#4c8c99');
 }
}
function fighter(draw,h,t,selection){
 const [x,z]=world(h.x,h.y);
 const dead=h.vida<=0||h.estado==='incapacitado'||h.estado==='eliminado';
 const panicked=h.miedo>74;
 const moving=Math.hypot(h.vx||0,h.vy||0)>7;
 const stride=moving?Math.sin(t*12+h.id)*.22:0;
 const scale=dead?.72:1;
 const skin=['#c88d68','#a46b4e','#e2a77c','#784c3b'][h.id%4];
 const cloth=['#e8b65a','#74b5aa','#77a7dc','#d28779','#ae91ce','#cbb86b','#8aac6c','#d8a278','#bccbda','#d78aaf'][(h.escuadron-1)%10];
 draw('sphere',x,.035,z,.42,.05,.30,'#25302c');
 if(selection)draw('cylinder',x,.045,z,.52,.04,.52,'#f1d17a');
 const y0=dead?.07:0;
 if(dead){draw('sphere',x,.22,z,.64,.22,.42,cloth);return;}
 draw('cube',x-.17,.39+stride,z,.22,.68,.24,'#303b42');
 draw('cube',x+.17,.39-stride,z,.22,.68,.24,'#283840');
 draw('sphere',x,1.17+y0,z,.53,.67,.33,cloth);
 draw('sphere',x,1.99+y0,z,.36,.37,.33,skin);
 draw('sphere',x,2.28,z-.04,.38,.15,.33,h.edad>65?'#c1c1b7':'#392e2d');
 draw('cube',x-.55,1.12-stride,z,.22,.70,.23,skin);
 draw('cube',x+.55,1.12+stride,z,.22,.70,.23,skin);
 if(h.objeto)draw('cube',x+.69,1.05+stride,z,.10,.42,h.objeto.tipo==='fuego'?.44:.14,'#c4bb9e');
 if(panicked)draw('sphere',x,2.6,z,.13,.13,.13,'#e9b456');
}
function gorilla(draw,g,t){
 const [x,z]=world(g.x,g.y);const charge=g.fase==='embestida';
 const rage=g.furia>0;
 const bounce=charge?Math.sin(t*18)*.22:Math.sin(t*2)*.06;
 const dark='#282b33',silver='#92929c',skin='#5b5358';
 draw('sphere',x,.06,z,2.2,.06,1.35,'#212d2d');
 const s=clamp(g.radio/30,.8,1.6);
 const part=(shape,dx,dy,dz,w,h,d,c,rot=0)=>draw(shape,x+dx*s,dy*s+Math.max(0,bounce),z+dz*s,w*s,h*s,d*s,c,rot);
 part('sphere',0,2.05,0,2.2,2.60,1.50,dark);
 part('sphere',0,2.95,-.45,1.9,1.35,1.05,silver);
 part('sphere',0,3.60,.44,1.28,1.20,1.04,dark);
 part('sphere',0,3.24,1.08,1.04,.62,.54,skin);
 part('sphere',-.43,3.90,1.28,.17,.12,.10,rage?'#e63e35':'#e2ae7b');
 part('sphere',.43,3.90,1.28,.17,.12,.10,rage?'#e63e35':'#e2ae7b');
 part('sphere',-1.90,2.15,.15,.78,2.0,.87,dark,charge?.20:-.15);
 part('sphere',1.90,2.15,.15,.78,2.0,.87,dark,charge?-.25:.15);
 part('sphere',-2.13,.63,.80,.83,.56,.85,skin);
 part('sphere',2.13,.63,.80,.83,.56,.85,skin);
 part('sphere',-.77,.68,-.35,.84,1.20,.86,dark);
 part('sphere',.77,.68,-.35,.84,1.20,.86,dark);
 if(rage)part('sphere',0,4.85,.12,1.4,.18,1.4,'#d65f42');
}
function pickup(draw,o,t){
 const [x,z]=world(o.x,o.y);
 const color=o.objeto?.tipo==='fuego'?'#bb774b':'#a78955';
 draw('cube',x,.21+Math.sin(t*2+o.x)*.04,z,.45,.38,.45,color);
 draw('cube',x,.43,z,.39,.10,.39,'#e2bf7c');
}
export function crear_dibujante_3d(canvas){
 const gl=canvas.getContext('webgl',{alpha:false,antialias:true,preserveDrawingBuffer:false});
 if(!gl)throw new Error('WebGL no disponible');
 const scene=createScene(gl,canvas),draw=scene.draw;
 let time=0,lastArena='';
 return (battle,selected)=>{
  time+=1/60;
  const arena=battle.arena||'claro',p=palette[arena]||palette.claro;
  gl.viewport(0,0,canvas.width,canvas.height);
  const sky=hex(p.sky);gl.clearColor(...sky,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
  gl.useProgram(scene.p);
  gl.uniformMatrix4fv(scene.loc.projection,false,new Float32Array(mul(ortho(-24,24,-14,14,.1,110),lookAt([0,39,48],[0,0,0],[0,1,0]))));
  draw('cube',0,-.25,0,46,.45,30,p.ground);
  draw('sphere',0,-.045,0,34,.13,22,p.path);
  forest(draw,arena);
  for(const o of battle.armas_suelo||[])if(!o.recogido_por&&o.visible)pickup(draw,o,time);
  for(const supply of battle.suministros||[]){
    const [x,z]=world(supply.x,supply.y);
    draw('cube',x,.4,z,supply.tipo==='barricada'?2:.7,.8,.7,'#c3a05c');
  }
  for(const h of battle.hombres||[])fighter(draw,h,time,selected>0&&h.escuadron===selected);
  gorilla(draw,battle.gorila,time);
 };
}

// Proyección del clic a la superficie del terreno bajo una cámara ortográfica oblicua.
export function punto_terreno_3d(nx,ny){
 const x=(nx-.5)*48;
 const vertical=(.5-ny)*28;
 const z=-vertical*(Math.hypot(39,48)/39);
 return {x:clamp(500+x*24,12,988),y:clamp(320+z*24,12,628)};
}
