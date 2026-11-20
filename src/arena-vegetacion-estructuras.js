// Continuous jungle turf on terraces AND vertical ancient masonry.
// Three WORLD-SPACE projected alpha textures are shared by every stone.
// This deliberately does NOT paint each brick or generate block-shaped moss.
// One area-weighted coverage budget is shared by all nine structures.
export const COBERTURA_ESTRUCTURAS=.40;
const STORAGE=Symbol.for('gorilla.arena.superficiesDePiedra');
const hash=(x,y,z=0)=>{
 let n=(Math.imul(x,374761393)+Math.imul(y,668265263)+Math.imul(z,1442695041))|0;
 n=Math.imul(n^(n>>>13),1274126177);
 return ((n^(n>>>16))>>>0)/4294967295;
};
const smooth=t=>t*t*(3-2*t);
const noise=(x,y,seed)=>{
 const i=Math.floor(x),j=Math.floor(y),u=smooth(x-i),v=smooth(y-j);
 const a=hash(i,j,seed)*(1-u)+hash(i+1,j,seed)*u;
 const b=hash(i,j+1,seed)*(1-u)+hash(i+1,j+1,seed)*u;
 return a*(1-v)+b*v;
};
// Shared spatial field. No dependence on stone ID, course, mesh or joint.
// Vertical grass cascades irregularly down from ledges rather than coloring
// every block independently. Height is in actual Babylon world units.
export function intensidadSelvatica(x,z,y=0,orientation='top'){
 if(orientation==='top')
  return .60*noise(x*.13,z*.13,8)+.31*noise(x*.36+31,z*.36,19)
   +.09*noise(x*1.25,z*1.25,29);
 const along=orientation==='x'?z:x;
 const broad=noise(along*.19,y*.29,113);
 const medium=noise(along*.62+11,y*.72,129);
 const fine=noise(along*2.2,y*1.7,151);
 const vines=noise(along*.29+4,y*.17,177);
 // Cascading vertical tendrils. The broad field connects across block seams.
 return .47*broad+.22*medium+.10*fine+.15*vines+
  .06*Math.exp(-Math.max(0,y)*.23);
}
export function registrarPiedraArquitectonica(scene,mesh,w,h,d,kind){
 if(!scene||!mesh||!(w>0&&h>0&&d>0))return;
 if(kind?.startsWith('Viga antigua'))return;
 (scene[STORAGE]??=[]).push({mesh,w,h,d,kind});
}
export const contarPiedrasArquitectonicas=scene=>scene?.[STORAGE]?.length||0;
export function seleccionarCoberturaGlobal(cells,coverage=COBERTURA_ESTRUCTURAS,
 areaTotal=null){
 if(coverage<0||coverage>1)throw new Error('Cobertura inválida');
 const totalArea=areaTotal??cells.reduce((a,c)=>a+c.area,0);
 if(!totalArea)return {selected:[],totalArea:0,coveredArea:0,coverage:0,threshold:1};
 const ordered=cells.map((c,i)=>({...c,index:i}))
  .sort((a,b)=>b.score-a.score||a.index-b.index);
 const goal=totalArea*coverage;
 let area=0,threshold=1;const selected=[];
 for(const c of ordered){
  if(area>=goal-1e-9)break;
  const fraction=Math.min(1,(goal-area)/c.area);
  selected.push({...c,fraction});area+=c.area*fraction;threshold=c.score;
 }
 return {selected,totalArea,coveredArea:area,
  coverage:area/totalArea,threshold};
}
const add=(a,b,k=1)=>[a[0]+b[0]*k,a[1]+b[1]*k,a[2]+b[2]*k];
const norm=a=>Math.hypot(...a);
function makeFace(B,mesh,o,a,b,localN,kind){
 const matrix=mesh.getWorldMatrix();
 const convert=p=>{
  const v=B.Vector3.TransformCoordinates(new B.Vector3(...p),matrix);
  return [v.x,v.y,v.z];
 };
 const origin=convert(o),A=convert(a),C=convert(b);
 const U=A.map((v,i)=>v-origin[i]),V=C.map((v,i)=>v-origin[i]);
 const outward=B.Vector3.TransformNormal(new B.Vector3(...localN),matrix);
 const len=norm(U)*norm(V);
 const orientation=Math.abs(outward.y)>.77?'top':
  Math.abs(outward.x)>Math.abs(outward.z)?'x':'z';
 if(len<.002|| (orientation==='top'&&outward.y<.77))return null;
 const area=norm([
  U[1]*V[2]-U[2]*V[1],U[2]*V[0]-U[0]*V[2],
  U[0]*V[1]-U[1]*V[0]]);
 if(area<.001)return null;
 const normal=[outward.x,outward.y,outward.z],nlen=norm(normal)||1;
 return {o:origin,U,V,area,normal:normal.map(t=>t/nlen),
  orientation,kind};
}
function getFaces(B,scene){
 const faces=[],samples=[],step=.34;
 for(const item of scene[STORAGE]||[]){
  item.mesh.computeWorldMatrix(true);
  const {mesh,w,h,d,kind}=item;
  const specs=[
   [[-w/2,h/2,-d/2],[w/2,h/2,-d/2],[-w/2,h/2,d/2],[0,1,0]],
   [[-w/2,-h/2,-d/2],[w/2,-h/2,-d/2],[-w/2,h/2,-d/2],[0,0,-1]],
   [[w/2,-h/2,d/2],[-w/2,-h/2,d/2],[w/2,h/2,d/2],[0,0,1]],
   [[-w/2,-h/2,d/2],[-w/2,-h/2,-d/2],[-w/2,h/2,d/2],[-1,0,0]],
   [[w/2,-h/2,-d/2],[w/2,-h/2,d/2],[w/2,h/2,-d/2],[1,0,0]]
  ];
  for(const [o,a,b,n] of specs){
   const face=makeFace(B,mesh,o,a,b,n,kind);
   if(!face)continue;
   faces.push(face);
   const nx=Math.max(1,Math.ceil(norm(face.U)/step));
   const ny=Math.max(1,Math.ceil(norm(face.V)/step));
   const area=face.area/(nx*ny);
   for(let j=0;j<ny;j++)for(let i=0;i<nx;i++){
    const point=add(add(face.o,face.U,(i+.5)/nx),face.V,(j+.5)/ny);
    const score=intensidadSelvatica(point[0],point[2],point[1],face.orientation);
    samples.push({point,score,area,face});
   }
  }
 }
 return {faces,samples};
}
function boundsFor(faces){
 const points=faces.flatMap(f=>[
  f.o,add(f.o,f.U),add(f.o,f.V),add(add(f.o,f.U),f.V)]);
 const xs=points.map(p=>p[0]),zs=points.map(p=>p[2]),ys=points.map(p=>p[1]);
 return {minX:Math.min(...xs)-.5,maxX:Math.max(...xs)+.5,
  minZ:Math.min(...zs)-.5,maxZ:Math.max(...zs)+.5,
  minY:Math.min(...ys)-.5,maxY:Math.max(...ys)+.5};
}
function makeOverlayMesh(B,scene,faces,orientation,bounds){
 const positions=[],indices=[],normals=[],uvs=[];
 const low=orientation==='x'?bounds.minZ:bounds.minX;
 const high=orientation==='x'?bounds.maxZ:bounds.maxX;
 const minB=orientation==='top'?bounds.minZ:bounds.minY;
 const maxB=orientation==='top'?bounds.maxZ:bounds.maxY;
 const x0=orientation==='top'?bounds.minX:low;
 const x1=orientation==='top'?bounds.maxX:high;
 for(const f of faces){
  if(f.orientation!==orientation)continue;
  const corners=[f.o,add(f.o,f.U),add(add(f.o,f.U),f.V),add(f.o,f.V)];
  const base=positions.length/3;
  for(const p of corners){
   positions.push(...add(p,f.normal,.014));
   const a=orientation==='top'?p[0]:orientation==='x'?p[2]:p[0];
   const b=orientation==='top'?p[2]:p[1];
   uvs.push((a-x0)/(x1-x0),1-(b-minB)/(maxB-minB));
   normals.push(...f.normal);
  }
  indices.push(base,base+1,base+2,base,base+2,base+3);
 }
 if(!positions.length)return null;
 const mesh=new B.Mesh('Alfombra selvática continua · '+orientation,scene);
 const data=new B.VertexData();
 data.positions=positions;data.indices=indices;
 data.normals=normals;data.uvs=uvs;data.applyToMesh(mesh);
 return mesh;
}
function makeTexture(B,scene,orientation,threshold,bounds){
 const width=768,height=384;
 const texture=new B.DynamicTexture('Enredaderas y césped continuo · '+orientation,
  {width,height},scene,false);
 const ctx=texture.getContext(),data=ctx.createImageData(width,height);
 const left=orientation==='top'?bounds.minX:orientation==='x'?bounds.minZ:bounds.minX;
 const right=orientation==='top'?bounds.maxX:orientation==='x'?bounds.maxZ:bounds.maxX;
 const bottom=orientation==='top'?bounds.minZ:bounds.minY;
 const top=orientation==='top'?bounds.maxZ:bounds.maxY;
 for(let j=0;j<height;j++)for(let i=0;i<width;i++){
  const a=left+(i+.5)/width*(right-left);
  const b=bottom+(j+.5)/height*(top-bottom);
  const x=orientation==='z'||orientation==='top'?a:0;
  const z=orientation==='x'?a:orientation==='top'?b:0;
  const y=orientation==='top'?0:b;
  const score=intensidadSelvatica(x,z,y,orientation);
  const fuzz=noise(a*7.1,b*7.1,297),grain=hash(i,j,401);
  const k=(j*width+i)*4;
  const shade=.74+.26*fuzz+.14*grain;
  data.data[k]=Math.round(72*shade);
  data.data[k+1]=Math.round(132*shade);
  data.data[k+2]=Math.round(43*shade);
  data.data[k+3]=score-threshold+.025*(fuzz-.5)+.013*(grain-.5)>0?255:0;
 }
 ctx.putImageData(data,0,0);texture.update();texture.hasAlpha=true;
 if(B.Texture)texture.wrapU=texture.wrapV=B.Texture.CLAMP_ADDRESSMODE;
 return texture;
}
function applyMaterial(B,scene,mesh,texture){
 const mat=new B.StandardMaterial('Musgo y hierba sin costuras de mampostería',scene);
 mat.diffuseTexture=texture;mat.useAlphaFromDiffuseTexture=true;
 mat.transparencyMode=B.Material?.MATERIAL_ALPHATEST??1;
 mat.alphaCutOff=.5;mat.backFaceCulling=false;
 mat.diffuseColor=B.Color3.White();
 mat.specularColor=new B.Color3(.008,.012,.005);
 mat.emissiveColor=new B.Color3(.035,.065,.02);
 mesh.material=mat;mesh.receiveShadows=false;
}
function createPlants(B,scene,selected){
 const positions=[],indices=[],colors=[],normals=[];
 let tufts=0,wallTufts=0;
 for(let k=0;k<selected.length;k++){
  const item=selected[k],f=item.face;
  if(item.fraction<.40||tufts>=9000||
   hash(Math.floor(item.point[0]*119),Math.floor(item.point[1]*173),
    Math.floor(item.point[2]*97))>.46)continue;
  const [x,y,z]=item.point,vertical=f.orientation!=='top';
  const n=f.normal,basePos=add([x,y,z],n,.025);
  const height=(vertical?.085:.12)+.16*hash(k,13,31);
  const blades=vertical?5:7;
  for(let i=0;i<blades;i++){
   const angle=(i+hash(k,i,19)*.15)*Math.PI*2/blades;
   let side,tip;
   if(vertical){
    // Real leaves grow OUT from walls, with some gravity-driven descent;
    // never green quads painted flat onto individual masonry blocks.
    const tangent=[-n[2],0,n[0]];
    side=add(basePos,tangent,.025*Math.cos(angle));
    tip=add(add(basePos,n,height*(.38+.2*hash(k,i,37))),
     [0,1,0],height*(.38*Math.sin(angle)-.17));
   }else{
    const dx=Math.cos(angle),dz=Math.sin(angle);
    side=add(basePos,[dx,0,dz],.04);
    tip=add(add(basePos,[dx,0,dz],height*.37),
     [0,1,0],height);
   }
   const across=vertical?[-n[2],0,n[0]]:[-Math.sin(angle),0,Math.cos(angle)];
   const w=.017+.017*hash(k,i,57);
   const p=[add(side,across,w),add(side,across,-w),tip];
   const base=positions.length/3,shade=.76+.31*hash(k,i,67);
   for(const q of p){
    positions.push(...q);
    colors.push(.23*shade,.48*shade,.105*shade,1);
   }
   indices.push(base,base+2,base+1);
  }
  tufts++;if(vertical)wallTufts++;
 }
 const mesh=new B.Mesh('Hojas verdes 3D colgantes y césped en ruinas',scene);
 const data=new B.VertexData();
 B.VertexData.ComputeNormals(positions,indices,normals);
 data.positions=positions;data.indices=indices;data.normals=normals;
 data.colors=colors;data.applyToMesh(mesh);
 const mat=new B.StandardMaterial('Follaje fino 3D de ruinas antiguas',scene);
 mat.diffuseColor=B.Color3.White();
 mat.specularColor=new B.Color3(.01,.012,.004);
 mat.emissiveColor=new B.Color3(.07,.10,.025);
 mat.backFaceCulling=false;mat.useVertexColors=true;
 mesh.material=mat;
 return {mesh,tufts,wallTufts};
}
export function construirVegetacionEstructuras(B,scene){
 const {faces,samples}=getFaces(B,scene);
 if(!samples.length)throw new Error('No hay superficies de piedra de ruinas');
 const plan=seleccionarCoberturaGlobal(samples);
 const bounds=boundsFor(faces),overlays=[];
 for(const orient of ['top','x','z']){
  const mesh=makeOverlayMesh(B,scene,faces,orient,bounds);
  if(!mesh)continue;
  applyMaterial(B,scene,mesh,makeTexture(B,scene,orient,plan.threshold,bounds));
  overlays.push(mesh);
 }
 const ferns=createPlants(B,scene,plan.selected);
 return {...plan,moss:overlays[0],overlays,ferns,
  faces:faces.length,stones:contarPiedrasArquitectonicas(scene),
  wallTufts:ferns.wallTufts,verticalFaces:faces.filter(f=>f.orientation!=='top').length,
  materialContinuo:true,
  mode:'alfombra continua sobre terrazas y paredes, enredaderas 3D'};
}
