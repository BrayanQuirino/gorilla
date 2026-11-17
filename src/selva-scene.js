// Selva ancestral art module: all large collision solids derive from terreno.js.
// Pure 3D geometry, no pasted images, no gameplay/audio/state mutations.
import * as THREE from 'three';
import {ancho,alto,obstaculos_escena,obstaculo_humano} from './terreno.js';
const U=74;
const P=(x,y)=>[(x-ancho/2)/U,(y-alto/2)/U];
const rnd=n=>{const a=Math.sin(n*123.41+13.21)*43758.5;return a-Math.floor(a);};
const colors={rock:0x898a72,light:0xb0aa8d,dark:0x676e5c,moss:0x3f7548,
 dirt:0x806b50,grass:0x405f3d,forest:0x2e573a,leaves:0x4e8952,
 bark:0x594a36,wood:0x927452,water:0x2e8794};
const materials=Object.fromEntries(Object.entries(colors).map(([k,c])=>[k,new THREE.MeshStandardMaterial({color:c,roughness:k==='water'?.35:.92})]));
const geo={rock:new THREE.DodecahedronGeometry(1,1),boulder:new THREE.IcosahedronGeometry(1,1),
 leaf:new THREE.IcosahedronGeometry(1,2),box:new THREE.BoxGeometry(1,1,1),
 stem:new THREE.CylinderGeometry(1,1,1,8),cone:new THREE.ConeGeometry(1,1,6)};
function add(parent,g,m,x,y,z,sx=1,sy=1,sz=1){
 const o=new THREE.Mesh(g,typeof m==='string'?materials[m]:m);
 o.position.set(x,y,z);o.scale.set(sx,sy,sz);o.receiveShadow=true;parent.add(o);return o;
}
function block(p,x,y,z,w,h,d,m='rock'){return add(p,geo.box,m,x,y+h/2,z,w,h,d);}
function stone(p,x,y,z,sx,sy,sz,n=1,m='rock'){
 const o=add(p,geo.rock,m,x,y,z,sx,sy,sz);o.rotation.y=rnd(n)*Math.PI*2;return o;
}
function batch(p,g,material,entries){
 const o=new THREE.InstancedMesh(g,materials[material],entries.length);
 const dummy=new THREE.Object3D(),color=new THREE.Color();
 entries.forEach((e,i)=>{
  dummy.position.set(e.x,e.y,e.z);dummy.rotation.set(e.rx||0,e.ry||0,e.rz||0);
  dummy.scale.set(e.sx||1,e.sy||1,e.sz||1);dummy.updateMatrix();o.setMatrixAt(i,dummy.matrix);
  if(e.color){color.setHex(e.color);o.setColorAt(i,color);}
 });
 o.instanceMatrix.needsUpdate=true;o.frustumCulled=false;p.add(o);return o;
}
function floor(p){
 const g=new THREE.PlaneGeometry(15.4,11.3,95,75),v=g.attributes.position,c=[];
 const forest=new THREE.Color(colors.grass),dirt=new THREE.Color(colors.dirt);
 for(let i=0;i<v.count;i++){
  const x=v.getX(i),z=-v.getY(i),r=Math.hypot(x,z);
  v.setZ(i,(Math.sin(x*2.9+z*1.4)+Math.cos(z*4.6))*0.009);
  const t=Math.max(Math.exp(-Math.pow((z-.2*Math.sin(x*.68))/.56,2))*.5,Math.max(0,Math.min(1,(3.1-r)*1.2))*.72);
  const tint=forest.clone().lerp(dirt,t).multiplyScalar(.89+rnd(i*11)*.19);
  c.push(tint.r,tint.g,tint.b);
 }
 g.setAttribute('color',new THREE.Float32BufferAttribute(c,3));g.rotateX(-Math.PI/2);g.computeVertexNormals();
 add(p,g,new THREE.MeshStandardMaterial({vertexColors:true,roughness:1}),0,-.07,0);
 block(p,0,-.42,0,15.4,.32,11.3,'forest');
}
function circle(p){
 const inner=new THREE.Mesh(new THREE.CylinderGeometry(2.61,2.61,.025,96),
  materials.dark);inner.position.y=-.041;p.add(inner);
 const tiles=[];
 for(let row=0;row<10;row++){
  const r=.28+row*.241,n=Math.max(14,Math.floor(r*37));
  for(let i=0;i<n;i++){
   const a=(i+(row%2)*.5)*Math.PI*2/n;
   tiles.push({x:r*Math.cos(a),y:-.013,z:r*Math.sin(a),sx:.105,sy:.019,sz:.115,
    ry:a,color:[colors.rock,colors.light,colors.dark][Math.floor(rnd(i*19+row*17)*3)]});
  }
 }
 batch(p,geo.box,'rock',tiles);
 const circle=new THREE.Mesh(new THREE.TorusGeometry(.35,.027,7,48),materials.light);
 circle.rotation.x=-Math.PI/2;circle.position.y=.017;p.add(circle);
 for(let i=0;i<8;i++){
  const a=i*Math.PI/4;
  const tile=block(p,Math.cos(a)*.24,.009,Math.sin(a)*.24,.13,.01,.03,'light');
  tile.rotation.y=a;
 }
}
function roads(p){
 const road=[];
 for(let i=0;i<210;i++){
  const x=-7.4+i*(14.8/209),z=.18*Math.sin(x*.68);
  if(Math.abs(x)<2.7)continue;
  for(let k=-2;k<=2;k++){
   road.push({x,y:-.032,z:z+k*.16,sx:.07+rnd(i+k)*.05,sy:.009,sz:.072,
    color:Math.abs(k)===2?colors.dark:colors.rock});
  }
 }
 batch(p,geo.box,'rock',road);
}
function cliffs(p){
 // The seven collision footprints are the authoritative boundaries.
 const obstacles=obstaculos_escena('selva');
 for(const [index,o] of obstacles.entries()){
  const [x,z]=P(o.x,o.y),rx=o.rx/U,rz=o.ry/U,h=Math.max(.42,o.altura/U*.70);
  const group=new THREE.Group();group.position.set(x,0,z);
  group.userData.collisionId=o.id;p.add(group);
  if(o.tipo==='arbol'){
   add(group,geo.stem,'bark',0,h*.8,0,.16,h*.83,.16);
   const leaves=[];
   for(let j=0;j<27;j++){
    const a=j*2.399,r=.32+rnd(j+index)*.65;
    leaves.push({x:Math.cos(a)*rx*r,y:h*1.65+(rnd(j*9+index)-.5)*.49,
     z:Math.sin(a)*rz*r,sx:.30+rnd(j)*.34,sy:.30+rnd(j+5)*.25,sz:.35+rnd(j+1)*.30,
     color:j%4?0x4e8952:0x83a468});
   }
   batch(group,geo.leaf,'leaves',leaves);
  }else if(o.tipo==='ruina'){
   const pillars=[];
   for(let j=0;j<9;j++){
    const a=j*Math.PI*2/9;
    pillars.push({x:rx*.74*Math.cos(a),y:h*(.3+rnd(j+index)*.21),
      z:rz*.74*Math.sin(a),sx:.18,sy:h*(.58+rnd(j+index)*.42),sz:.18,
      ry:a,color:j%2?colors.rock:colors.dark});
   }
   batch(group,geo.box,'rock',pillars);
   block(group,0,h*.78,-rz*.47,rx*1.6,.15,rz*.34,'light');
   block(group,0,h*.48,rz*.42,rx*.7,.14,rz*.43,'dark');
  }else{
   const rocks=[{x:0,y:h*.40,z:0,sx:rx*.9,sy:h*.68,sz:rz*.9,color:colors.dark}];
   for(let j=0;j<18;j++){
    const a=j*2.399,r=.36+rnd(j*6+index)*.57;
    rocks.push({x:Math.cos(a)*rx*r,y:h*(.25+.33*rnd(j*3+index)),
     z:Math.sin(a)*rz*r,sx:rx*(.18+rnd(j+index)*.25),
     sy:h*(.25+.22*rnd(j)),sz:rz*(.18+.23*rnd(j*11+index)),
     ry:rnd(j*3+index)*3,color:j%3===0?colors.light:colors.rock});
   }
   batch(group,geo.rock,'rock',rocks);
  }
  const moss=[];
  for(let j=0;j<28;j++){
   const a=j*2.399,r=.28+rnd(j*13+index)*.68;
   moss.push({x:Math.cos(a)*rx*r,y:h*(.25+rnd(j+index)*.46),
    z:Math.sin(a)*rz*r,sx:.10,sy:.05,sz:.13,color:j%3?colors.moss:0x315a38});
  }
  batch(group,geo.leaf,'moss',moss);
 }
 return obstacles;
}
function water(p){
 const channel=new THREE.Group();p.add(channel);
 const mat=new THREE.ShaderMaterial({
  uniforms:{uTime:{value:0},uColor:{value:new THREE.Color(colors.water)}},
  vertexShader:'varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader:'uniform float uTime;uniform vec3 uColor;varying vec2 vUv; void main(){float a=sin(vUv.y*60.0+uTime*2.0+sin(vUv.x*17.0));float b=pow(max(0.0,sin(vUv.y*110.0-uTime*3.0)),14.0);gl_FragColor=vec4(uColor*(.84+.16*a)+vec3(.13,.32,.27)*b,.92);}',
  transparent:true,depthWrite:false,side:THREE.DoubleSide
 });
 const banks=[];
 for(let i=0;i<45;i++){
  const z=-5.25+i*.24,x=-6.67+.13*Math.sin(z*1.34);
  const tile=add(channel,new THREE.PlaneGeometry(1.10,.27),mat,x,-.043,z);
  tile.rotation.x=-Math.PI/2;
  if(i%2===0)for(const side of [-1,1]){
   banks.push({x:x+side*.62,y:-.004,z,sx:.19,sy:.10,sz:.25,color:colors.dark});
  }
 }
 batch(channel,geo.rock,'rock',banks);
 return mat;
}
function bridge(p,x,z){
 const g=new THREE.Group();g.position.set(x,0,z);p.add(g);
 const planks=[];
 for(let i=0;i<13;i++)planks.push({x:(i-6)*.095,y:.06,z:0,sx:.083,sy:.045,sz:.67,
  color:i%3===0?0xa58a61:colors.wood});
 batch(g,geo.box,'wood',planks);
 for(const side of [-1,1]){
  for(const xx of [-.52,0,.52])block(g,xx,.07,side*.38,.035,.31,.035,'wood');
  block(g,0,.40,side*.38,1.19,.032,.032,'wood');
 }
}
function dress(p){
 const grass=[],petals=[];
 for(let i=0;i<950;i++){
  const x=(rnd(i*11)-.5)*14.8,z=(rnd(i*29+2)-.5)*10.5;
  if(Math.hypot(x,z)<2.83||obstaculo_humano({x:x*U+ancho/2,y:z*U+alto/2},'selva',12))continue;
  const scale=.06+rnd(i*13)*.13;
  grass.push({x,y:scale*.46-.052,z,sx:scale*.29,sy:scale,sz:scale*.32,
   ry:rnd(i*37)*6.283,color:i%5===0?0x83a86c:0x4d8250});
  if(i%12===0)petals.push({x:x+.03,y:-.031,z:z+.03,
   sx:.028,sy:.012,sz:.024,color:i%2?0xb4965f:0xa473aa});
 }
 batch(p,geo.cone,'leaves',grass);batch(p,geo.box,'light',petals);
 // Marginal ruins and cliff contour are environmental border decoration only.
 for(const side of [-1,1])for(let i=0;i<12;i++){
  const x=-7.1+i*1.3,z=side*5.46;
  stone(p,x,.24,z,.51,.36,.43,i*23,'dark');
  stone(p,x+.2,.40,z,.36,.29,.30,i*27,'rock');
 }
 for(const [i,[x,z]] of [[-7,-4.6],[7,-4.6],[-7,4.6],[7,4.6]].entries()){
  block(p,x,0,z,.32,.44,.32,'rock');
  const fire=new THREE.Mesh(new THREE.ConeGeometry(.13,.32,8),
   new THREE.MeshStandardMaterial({color:0xffa342,emissive:0xff7b23,emissiveIntensity:2}));
  fire.position.set(x,.60,z);p.add(fire);
 }
}
export function construirSelvaAncestral(scene){
 const root=new THREE.Group();root.name='Selva ancestral · 3D';scene.add(root);
 floor(root);roads(root);circle(root);
 const obstacles=cliffs(root);
 const surface=water(root);
 bridge(root,-6.65,-2.50);bridge(root,-6.65,2.6);
 dress(root);
 return {
  root,update:(seconds)=>{surface.uniforms.uTime.value=seconds;},
  metadata:{arena:'selva',collisions:obstacles.map(o=>o.id),
   bridgeCount:2,plaza:true,artwork:'procedural-3d',musicOverride:false}
 };
}
