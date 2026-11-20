// Continuous jungle turf for the nine stone ruins.
// A single WORLD-SPACE grass pattern crosses masonry joints: no block-by-block
// green squares. Alpha-cutout turf follows exposed horizontal masonry, with
// thousands of real 3D blades. 40% applies to all eligible surfaces combined.
export const COBERTURA_ESTRUCTURAS=.40;
const STORAGE=Symbol.for('gorilla.arena.superficiesDePiedra');
function hash(x,y,z=0){
 let n=(Math.imul(x,374761393)+Math.imul(y,668265263)+Math.imul(z,1442695041))|0;
 n=Math.imul(n^(n>>>13),1274126177);
 return ((n^(n>>>16))>>>0)/4294967295;
}
const smooth=t=>t*t*(3-2*t);
function noise(x,z,seed){
 const ix=Math.floor(x),iz=Math.floor(z),u=smooth(x-ix),v=smooth(z-iz);
 const a=hash(ix,iz,seed)*(1-u)+hash(ix+1,iz,seed)*u;
 const b=hash(ix,iz+1,seed)*(1-u)+hash(ix+1,iz+1,seed)*u;
 return a*(1-v)+b*v;
}
// Stable broad jungle carpets, independently of any individual stone outline.
export function intensidadSelvatica(x,z){
 const broad=noise(x*.13,z*.13,8);
 const intermediate=noise(x*.36+31,z*.36,19);
 const detail=noise(x*1.25,z*1.25,29);
 return broad*.60+intermediate*.31+detail*.09;
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
 const totalArea=areaTotal??cells.reduce((s,c)=>s+c.area,0);
 if(!totalArea)return {selected:[],totalArea:0,coveredArea:0,coverage:0,threshold:1};
 const ordered=cells.map((c,i)=>({...c,index:i}))
  .sort((a,b)=>b.score-a.score||a.index-b.index);
 const goal=totalArea*coverage;
 let area=0;const selected=[];let threshold=1;
 for(const c of ordered){
  if(area>=goal-1e-10)break;
  const fraction=Math.min(1,(goal-area)/c.area);
  selected.push({...c,fraction});
  area+=c.area*fraction;threshold=c.score;
 }
 return {selected,totalArea,coveredArea:area,
  coverage:area/totalArea,threshold};
}
const add=(a,b,k=1)=>[a[0]+b[0]*k,a[1]+b[1]*k,a[2]+b[2]*k];
const mag=a=>Math.hypot(...a);
function upperFace(B,item){
 const m=item.mesh.getWorldMatrix(),{w,h,d}=item;
 const get=(x,y,z)=>{
  const p=B.Vector3.TransformCoordinates(new B.Vector3(x,y,z),m);
  return [p.x,p.y,p.z];
 };
 const o=get(-w/2,h/2,-d/2),a=get(w/2,h/2,-d/2),b=get(-w/2,h/2,d/2);
 const U=a.map((v,i)=>v-o[i]),V=b.map((v,i)=>v-o[i]);
 const outward=B.Vector3.TransformNormal(new B.Vector3(0,1,0),m);
 if(outward.y<.78||mag(U)<.03||mag(V)<.03)return null;
 return {o,U,V,area:Math.hypot(U[0]*V[2]-U[2]*V[0],
  U[0]*V[1]-U[1]*V[0],U[1]*V[2]-U[2]*V[1]),kind:item.kind};
}
function makeSamples(B,scene){
 const faces=[],samples=[],step=.23;
 for(const item of scene[STORAGE]||[]){
  item.mesh.computeWorldMatrix(true);
  const face=upperFace(B,item);
  if(!face)continue;
  const nx=Math.max(1,Math.ceil(mag(face.U)/step));
  const nz=Math.max(1,Math.ceil(mag(face.V)/step));
  face.nx=nx;face.nz=nz;face.stepArea=face.area/(nx*nz);
  faces.push(face);
  for(let j=0;j<nz;j++)for(let i=0;i<nx;i++){
   const point=add(add(face.o,face.U,(i+.5)/nx),face.V,(j+.5)/nz);
   // The score is WORLD-SPACE only, so it cannot reset at brick seams.
   // True patches may span many individual bricks.
   const score=intensidadSelvatica(point[0],point[2]);
   samples.push({face,i,j,point,score,area:face.stepArea});
  }
 }
 return {faces,samples};
}
// One coherent material over every stone cap. UV coordinates are computed in
// global world meters, so the same grass carpet continues across stone seams.
function makeCarpetMesh(B,scene,faces,world){
 const positions=[],indices=[],uvs=[],normals=[];
 for(const face of faces){
  const base=positions.length/3;
  const corners=[face.o,add(face.o,face.U),
   add(add(face.o,face.U),face.V),add(face.o,face.V)];
  for(const p of corners){
   positions.push(p[0],p[1]+.013,p[2]);
   uvs.push((p[0]-world.minX)/world.width,
    1-(p[2]-world.minZ)/world.depth);
   normals.push(0,1,0);
  }
  indices.push(base,base+1,base+2,base,base+2,base+3);
 }
 const mesh=new B.Mesh('Alfombra vegetal continua sobre ruinas',scene);
 const vd=new B.VertexData();
 vd.positions=positions;vd.indices=indices;vd.uvs=uvs;vd.normals=normals;
 vd.applyToMesh(mesh);
 return mesh;
}
function createTurfTexture(B,scene,threshold,world){
 const width=1024,height=704;
 const tex=new B.DynamicTexture('Césped continuo translúcido sobre ruinas',
  {width,height},scene,false);
 const ctx=tex.getContext(),pixels=ctx.createImageData(width,height);
 for(let j=0;j<height;j++){
  const z=world.minZ+(j+.5)/height*world.depth;
  for(let i=0;i<width;i++){
   const x=world.minX+(i+.5)/width*world.width;
   const value=intensidadSelvatica(x,z);
   const fine=noise(x*5.3,z*5.3,72),grain=hash(i,j,83);
   // Fine ragged edges and muted greens, no brick-shaped silhouettes.
   const growth=value-threshold+(.016*(fine-.5))+.009*(grain-.5);
   const k=(j*width+i)*4;
   const shade=.82+.23*fine+.13*grain;
   pixels.data[k]=Math.round(77*shade);
   pixels.data[k+1]=Math.round(138*shade);
   pixels.data[k+2]=Math.round(42*shade);
   pixels.data[k+3]=growth>=0?255:0;
  }
 }
 ctx.putImageData(pixels,0,0);tex.update();
 tex.hasAlpha=true;
 if(B.Texture)tex.wrapU=tex.wrapV=B.Texture.CLAMP_ADDRESSMODE;
 return tex;
}
function attachCarpetMaterial(B,scene,mesh,texture){
 const mat=new B.StandardMaterial('Tapete de hierba selvática continua',scene);
 mat.diffuseTexture=texture;mat.useAlphaFromDiffuseTexture=true;
 mat.transparencyMode=B.Material?.MATERIAL_ALPHATEST??1;
 mat.alphaCutOff=.5;mat.backFaceCulling=false;
 mat.diffuseColor=B.Color3.White();
 mat.specularColor=new B.Color3(.006,.009,.003);
 mat.emissiveColor=new B.Color3(.052,.075,.018);
 mesh.material=mat;mesh.receiveShadows=false;
}
// Actual narrow leaves growing OUT OF the selected carpet, batched into one
// mesh. Unlike the old technique, no per-stone flat green geometry is drawn.
function createGrass(B,scene,selected){
 const positions=[],indices=[],colors=[],normals=[];
 let tufts=0;
 const blades=7,maxTufts=6500;
 for(let k=0;k<selected.length;k++){
  const c=selected[k];
  if(tufts>=maxTufts||c.fraction<.45||
    hash(Math.round(c.point[0]*43),Math.round(c.point[2]*37),k)>.68)continue;
  const [x,y,z]=c.point;
  const height=.10+.19*hash(k,23,57),width=.023+.017*hash(k,27,61);
  const baseY=y+.02;
  for(let b=0;b<blades;b++){
   const angle=(b+hash(k,b,79)*.18)*Math.PI*2/blades;
   const dx=Math.cos(angle),dz=Math.sin(angle);
   const lean=height*(.36+.21*hash(k,b,83));
   const radius=.026+.062*hash(k,b,91);
   const px=x+dx*radius,pz=z+dz*radius;
   const sideX=-dz,sideZ=dx;
   const localHeight=height*(.65+.45*hash(k,b,97));
   const base=positions.length/3;
   const pts=[
    [px+sideX*width*.5,baseY,pz+sideZ*width*.5],
    [px-sideX*width*.5,baseY,pz-sideZ*width*.5],
    [px+dx*lean,baseY+localHeight,pz+dz*lean]];
   const shade=.83+.32*hash(k,b,103);
   for(let t=0;t<3;t++){
    positions.push(...pts[t]);
    colors.push(.19*shade,.41*shade,.083*shade,1);
   }
   indices.push(base,base+2,base+1);
  }
  tufts++;
 }
 const mesh=new B.Mesh('Césped fino 3D en ruinas',scene);
 const vd=new B.VertexData();
 B.VertexData.ComputeNormals(positions,indices,normals);
 vd.positions=positions;vd.indices=indices;vd.colors=colors;vd.normals=normals;
 vd.applyToMesh(mesh);
 const mat=new B.StandardMaterial('Hojas naturales en alfombra selvática',scene);
 mat.diffuseColor=B.Color3.White();
 mat.specularColor=new B.Color3(.01,.012,.005);
 mat.emissiveColor=new B.Color3(.07,.10,.027);
 mat.backFaceCulling=false;mat.useVertexColors=true;
 mesh.material=mat;
 return {mesh,tufts,blades:indices.length/3};
}
export function construirVegetacionEstructuras(B,scene){
 const {faces,samples}=makeSamples(B,scene);
 if(!samples.length)throw new Error('No hay piedra horizontal en las ruinas');
 const plan=seleccionarCoberturaGlobal(samples);
 const xs=samples.map(s=>s.point[0]),zs=samples.map(s=>s.point[2]);
 // Shared global coordinates, with extra padding so outer stone edges fit.
 const minX=Math.min(...xs)-4,maxX=Math.max(...xs)+4;
 const minZ=Math.min(...zs)-4,maxZ=Math.max(...zs)+4;
 const world={minX,minZ,width:maxX-minX,depth:maxZ-minZ};
 const moss=makeCarpetMesh(B,scene,faces,world);
 const texture=createTurfTexture(B,scene,plan.threshold,world);
 attachCarpetMaterial(B,scene,moss,texture);
 const ferns=createGrass(B,scene,plan.selected);
 return {...plan,moss,ferns,faces:faces.length,
  stones:contarPiedrasArquitectonicas(scene),
  mode:'alfombra continua en coordenadas globales + césped 3D',
  materialContinuo:true};
}
