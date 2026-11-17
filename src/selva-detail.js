// Art-directed jungle foliage and ancient masonry. GPU-instanced, entirely
// generated 3D geometry; only decorative ground cover, no new collision solids.
// Game logic, routes and all audio remain owned by existing modules.
import * as THREE from 'three';

const rand=n=>{const v=Math.sin(n*91.173+17.29)*43758.5453;return v-Math.floor(v);};
const pal={
 palm:0x477845,palmLight:0x699b4d,palmDark:0x245736,
 broadleaf:0x47794d,broadleafLight:0x83ac65,broadleafDark:0x245d3e,
 bark:0x554533,barkLight:0x796146,root:0x3c3427,vine:0x356742,
 moss:0x4a7942,flower:0x975d9e,flowerPink:0xc6797a,
 gold:0xae9d79,stone:0x8c8974,stoneShadow:0x626f60
};
const mats=Object.fromEntries(Object.entries(pal).map(([k,v])=>[k,
 new THREE.MeshStandardMaterial({color:v,roughness:.94,metalness:0,side:THREE.DoubleSide})]));
const pos=new THREE.Object3D(),tint=new THREE.Color();
const leafGeo=(()=>{
 // Leaf with midrib, tapered point and gently bent surface (both faces).
 const verts=new Float32Array([
  0,0,0, -.19,.24,0.02, 0,.58,.13,
  0,0,0, 0,.58,.13, .19,.24,.02,
  -.19,.24,.02, -.12,.51,.14,0,.58,.13,
  .19,.24,.02, 0,.58,.13,.12,.51,.14
 ]);
 const geo=new THREE.BufferGeometry();
 geo.setAttribute('position',new THREE.BufferAttribute(verts,3));geo.computeVertexNormals();return geo;
})();
const frondGeo=(()=>{
 const verts=[],inds=[];
 for(let i=0;i<7;i++){
  const t=i/6;
  verts.push(t*1.7,(1-t)*.22+Math.sin(t*Math.PI)*.12,t*t*-.36);
  verts.push(t*1.7,(1-t)*.22+Math.sin(t*Math.PI)*.12,(t*t*-.36)+Math.sin(t*Math.PI)*.15);
 }
 for(let i=0;i<6;i++){const n=i*2;inds.push(n,n+1,n+2,n+1,n+3,n+2);}
 const geo=new THREE.BufferGeometry();
 geo.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));geo.setIndex(inds);geo.computeVertexNormals();
 return geo;
})();
const grassGeo=new THREE.ConeGeometry(.055,.34,3);
const twigGeo=new THREE.CylinderGeometry(.12,.18,1,7,2);
const stoneGeo=new THREE.IcosahedronGeometry(1,2);
function instance(root,geometry,material,items){
 if(!items.length)return null;
 const mesh=new THREE.InstancedMesh(geometry,material,items.length);
 mesh.instanceMatrix.setUsage(THREE.StaticDrawUsage);
 mesh.frustumCulled=false;mesh.castShadow=false;mesh.receiveShadow=true;
 items.forEach((o,i)=>{
  pos.position.set(o.x,o.y,o.z);pos.rotation.set(o.rx||0,o.ry||0,o.rz||0);
  pos.scale.set(o.sx||1,o.sy||1,o.sz||1);pos.updateMatrix();mesh.setMatrixAt(i,pos.matrix);
  if(o.tint){tint.setHex(o.tint);mesh.setColorAt(i,tint);}
 });
 mesh.instanceMatrix.needsUpdate=true;root.add(mesh);return mesh;
}
const mk=(x,y,z,sx=1,sy=1,sz=1,rx=0,ry=0,rz=0,tint)=>({x,y,z,sx,sy,sz,rx,ry,rz,tint});
function segment(a,b,r=0.1,root,material=mats.bark){
 const start=new THREE.Vector3(...a),end=new THREE.Vector3(...b);
 const delta=end.clone().sub(start),length=delta.length();
 const obj=new THREE.Mesh(twigGeo,material);
 obj.position.copy(start.add(end).multiplyScalar(.5));
 obj.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());
 obj.scale.set(r/.15,length,r/.15);obj.castShadow=true;obj.receiveShadow=true;
 root.add(obj);return obj;
}
// Permits only big perimeter trees. In-game blockers still come exclusively
// from authoritative obstacles in terreno.js.
export function bosqueDetallado(root){
 const trees=new THREE.Group();trees.name='Bóveda forestal · árboles 3D';root.add(trees);
 const leaves=[],lightLeaves=[],darkLeaves=[],palms=[],moss=[],flowers=[],ferns=[],branches=[];
 let treeCount=0;
 const outOfBounds=(x,z)=>Math.abs(x)>7.65||Math.abs(z)>5.62;
 for(let i=0;i<106;i++){
  const x=(rand(i*13+1)-.5)*26,z=(rand(i*29+8)-.5)*19.8;
  if(!outOfBounds(x,z))continue;
  const seed=i*41;
  const height=2.2+rand(seed+2)*2.4, spread=1.25+rand(seed+3)*.85;
  const type=i%6===0?'palm':'canopy';
  const group=new THREE.Group();group.position.set(x,0,z);trees.add(group);
  treeCount++;
  if(type==='palm'){
   const bend=(rand(seed+9)-.5)*.65;
   segment([0,0,0],[bend,height*.62,0],.19,group);
   segment([bend,height*.62,0],[bend*1.42,height,0],.125,group);
   const cx=bend*1.42;
   for(let j=0;j<12;j++){
    const a=j*Math.PI/6;
    palms.push(mk(x+cx,height*.96,z,spread*.70,.9,spread*.70,0,a,0,
      j%3===0?pal.broadleafLight:pal.palmDark));
   }
  }else{
   const bend=(rand(seed+10)-.5)*.55;
   segment([0,0,0],[bend*.55,height*.46,0],.22,group);
   segment([bend*.55,height*.46,0],[bend,height*.85,.07],.16,group);
   for(let j=0;j<6;j++){
    const a=j*2.399+rand(seed+4)*6.28,
      length=.62+rand(seed+j+17)*1.05,
      yy=height*(.55+j*.045);
    const endpoint=[bend+Math.cos(a)*length,yy+.30+rand(seed+j+7)*.36,Math.sin(a)*length];
    segment([bend*.74,yy,0],endpoint,.072,group,mats.barkLight);
    for(let k=0;k<10;k++){
     const aa=a+(k-5)*.28,rr=length*(.32+rand(seed+j*31+k)*.8);
     const px=x+bend+Math.cos(aa)*rr,py=endpoint[1]+(rand(seed+k*3)-.5)*.55,
       pz=z+Math.sin(aa)*rr;
     const rec=mk(px,py,pz,.48+rand(k+seed)*.30,.7+rand(k*11+seed)*.40,
       .48+rand(k*17+seed)*.30,(rand(seed+k)-.5)*.7,a,
       (rand(seed+j+k)-.5)*.8);
     const c=(j+k)%5;
     (c===0?lightLeaves:c===1?darkLeaves:leaves).push(rec);
    }
   }
  }
 }
 instance(trees,leafGeo,mats.broadleaf,leaves);
 instance(trees,leafGeo,mats.broadleafLight,lightLeaves);
 instance(trees,leafGeo,mats.broadleafDark,darkLeaves);
 instance(trees,frondGeo,mats.palm,palms);
 // Dense layered low foliage near frame edges; tiny details near plaza remain
 // decorative and do not participate in navigation or collision.
 for(let i=0;i<3400;i++){
  const x=(rand(i*3+9)-.5)*15.0,z=(rand(i*11+19)-.5)*11;
  const d=Math.hypot(x/1.3,z/1.3);
  if(d<2.55||Math.abs(z-.18*Math.sin(x*.68))<.55)continue;
  const h=.06+rand(i*19+3)*.24;
  ferns.push(mk(x,h*.35-.052,z,.55+rndScale(i),h*1.4,.55+rndScale(i+4),
    0,rand(i*7)*6.28,(rand(i*5)-.5)*.25,
    i%6===0?pal.broadleafLight:pal.moss));
  if(i%13===0)flowers.push(mk(x,.015,z,.03,.035,.04,0,rand(i*29)*6.28,0,
    i%2?pal.flower:pal.flowerPink));
 }
 function rndScale(i){return rand(i*8)*.85;}
 instance(root,leafGeo,mats.moss,ferns);
 instance(root,stoneGeo,mats.flower,flowers);
 const metadata={trees:treeCount,branches:treeCount*5,
  leaves:leaves.length+lightLeaves.length+darkLeaves.length+palms.length,
  groundFoliage:ferns.length,instanced:true,collisionChanges:0};
 return metadata;
}
export function detalleMamposteria(root,obstacles){
 const pebbles=[],moss=[],lichen=[];
 for(const o of obstacles){
  const x=(o.x-500)/74,z=(o.y-320)/74,rX=o.rx/74,rZ=o.ry/74;
  for(let i=0;i<70;i++){
   const a=i*2.399,r=.8+rand(i*19+o.x)*.35;
   const xx=x+Math.cos(a)*r*rX,zz=z+Math.sin(a)*r*rZ;
   const h=.025+rand(i*5+o.y)*.065;
   pebbles.push(mk(xx,h/2,zz,.045+rand(i)*.08,h,.065+rand(i*7)*.05,
     0,rand(i*11)*6.28,0,i%3?pal.stone:pal.stoneShadow));
   if(i%3===0)moss.push(mk(xx,h+.02,zz,.17,.11,.22,
     0,rand(i*7+o.x)*6.28,(rand(i+o.y)-.5)*.2,
     i%2?pal.moss:pal.broadleafDark));
  }
 }
 instance(root,stoneGeo,mats.stone,pebbles);
 instance(root,leafGeo,mats.moss,moss);
 return {stoneFragments:pebbles.length,groundMoss:moss.length};
}
