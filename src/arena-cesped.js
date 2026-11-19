// Ancient jungle groundcover with EXACT 40% global coverage by area.
// Unlike summing overlapping quads, the coverage mask measures the UNION
// of all patches over a uniform physical-area grid. One texture + one
// batched 3D grass mesh keep Babylon draw calls bounded.
export const COBERTURA_OBJETIVO=.40;
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
function hash(x,y,seed=0){
 let n=Math.imul(x,374761393)+Math.imul(y,668265263)+Math.imul(seed,1442695041);
 n=Math.imul(n^(n>>>13),1274126177);
 return ((n^(n>>>16))>>>0)/4294967295;
}
function noise(x,y,seed){
 const ix=Math.floor(x),iy=Math.floor(y),tx=x-ix,ty=y-iy;
 const u=tx*tx*(3-2*tx),v=ty*ty*(3-2*ty);
 const a=hash(ix,iy,seed)*(1-u)+hash(ix+1,iy,seed)*u;
 const b=hash(ix,iy+1,seed)*(1-u)+hash(ix+1,iy+1,seed)*u;
 return a*(1-v)+b*v;
}
const CLUSTERS=[
 [-23,-10,6.4,4.5,.69],[16,5,5.8,4.1,.72],
 [-11,14,6.1,4.5,.73],[25,-17,4.7,3.5,.76],
 [0,-16,5.5,3.6,.65],[-27,15,4.8,3.4,.72],
 [3,17,4.0,3.0,.78]
];
function scoreAt(x,z){
 let n=.54*noise(x/8,z/8,3)+.29*noise(x/2.8,z/2.8,11)+
  .12*noise(x/.8,z/.8,17)+.05*hash(Math.floor(x*17),Math.floor(z*17),23);
 for(const [cx,cz,rx,rz,weight] of CLUSTERS){
  const d=((x-cx)/rx)**2+((z-cz)/rz)**2;
  if(d<1.5)n+=weight*Math.pow(Math.max(0,1-d/1.5),1.55);
 }
 return n;
}
function obstructed(x,z,pyramids,houses){
 // Exclude structures from grass placement; the 40% denominator is STILL
 // the whole arena, not the available cells nor individual paving stones.
 for(const p of pyramids){
  const a=p.size/2+.26;
  if(Math.abs(x-p.x)<a&&Math.abs(z-p.z)<a)return true;
 }
 for(const h of houses){
  const radius=Math.hypot(h.lengthX,h.lengthZ)*h.scale/2+.19;
  if(Math.hypot(x-h.x,z-h.z)<radius)return true;
 }
 return false;
}
export function crearPlanoCesped(ground,{coverage=COBERTURA_OBJETIVO,
 pyramids=[],houses=[],widthPx=480,heightPx=320}={}){
 const width=ground.outerWidth,depth=ground.outerDepth;
 if(!(width>0&&depth>0)||!Number.isInteger(widthPx)||!Number.isInteger(heightPx)||
    widthPx<16||heightPx<16||coverage<0||coverage>1)
  throw new Error('Dimensiones o cobertura de césped inválidas');
 const total=widthPx*heightPx,mask=new Uint8Array(total);
 const scores=new Float32Array(total),allowed=[];
 for(let z=0;z<heightPx;z++)for(let x=0;x<widthPx;x++){
  const i=z*widthPx+x;
  const worldX=(x+.5)/widthPx*width-width/2;
  const worldZ=(z+.5)/heightPx*depth-depth/2;
  if(obstructed(worldX,worldZ,pyramids,houses))continue;
  scores[i]=scoreAt(worldX,worldZ);
  allowed.push(i);
 }
 const selected=Math.round(total*coverage);
 if(selected>allowed.length)throw new Error('No cabe la cobertura solicitada fuera de las ruinas');
 allowed.sort((a,b)=>scores[b]-scores[a]||a-b);
 for(let i=0;i<selected;i++)mask[allowed[i]]=1;
 return {mask,widthPx,heightPx,outerWidth:width,outerDepth:depth,
  coverage: selected/total,coveredCells:selected,totalCells:total,
  areaCovered:width*depth*selected/total,areaTotal:width*depth,
  excludedCells:total-allowed.length};
}
function mossTexture(B,scene,plan){
 const tex=new B.DynamicTexture('Cobertura selvática global 40% · máscara',
  {width:plan.widthPx,height:plan.heightPx},scene,false);
 const ctx=tex.getContext(),image=ctx.createImageData(plan.widthPx,plan.heightPx);
 for(let z=0;z<plan.heightPx;z++)for(let x=0;x<plan.widthPx;x++){
  const i=z*plan.widthPx+x,k=i*4;
  const grain=hash(x,z,97),tone=noise(x/11,z/11,47);
  const v=.71+.17*grain+.15*tone;
  image.data[k]=Math.round(74*v);
  image.data[k+1]=Math.round(135*v);
  image.data[k+2]=Math.round(43*v);
  image.data[k+3]=plan.mask[i]?255:0;
 }
 ctx.putImageData(image,0,0);tex.update();tex.hasAlpha=true;
 tex.wrapU=B.Texture.CLAMP_ADDRESSMODE;
 tex.wrapV=B.Texture.CLAMP_ADDRESSMODE;
 return tex;
}
function grassTufts(B,scene,plan){
 const positions=[],indices=[],colors=[];
 function vertex(x,y,z,r,g,b){
  const i=positions.length/3;
  positions.push(x,y,z);colors.push(r,g,b,1);return i;
 }
 const addBlade=(x,z,angle,radius,height,wide,seed)=>{
  const dx=Math.cos(angle),dz=Math.sin(angle);
  const sideX=-dz,sideZ=dx,base=.104;
  const r=.18+.11*hash(seed,0,17),g=.35+.24*hash(seed,1,19);
  const b=.075+.07*hash(seed,2,23);
  const lean=height*(.26+.27*hash(seed,3,29));
  const a=vertex(x+sideX*wide*.5,base,z+sideZ*wide*.5,r*.65,g*.68,b*.70);
  const c=vertex(x-sideX*wide*.5,base,z-sideZ*wide*.5,r*.68,g*.72,b*.75);
  const tip=vertex(x+dx*lean,base+height,z+dz*lean,r,g,b);
  indices.push(a,tip,c);
 };
 // Grass clumps come ONLY from green cells; they add height but not new
 // coverage area, since the exact union mask already accounts for it.
 let created=0;
 for(let attempt=0;attempt<11000&&created<3300;attempt++){
  const px=Math.floor(hash(attempt,11,41)*plan.widthPx);
  const py=Math.floor(hash(attempt,31,43)*plan.heightPx);
  if(!plan.mask[py*plan.widthPx+px])continue;
  const x=(px+.3+.4*hash(attempt,13,47))/plan.widthPx*plan.outerWidth-
   plan.outerWidth/2;
  const z=(py+.3+.4*hash(attempt,17,53))/plan.heightPx*plan.outerDepth-
   plan.outerDepth/2;
  const seed=attempt*17;
  const tropical=hash(attempt,1,71)>.84;
  const blades=tropical?5:4;
  const height=(tropical?.20:.105)+hash(attempt,3,67)*(tropical?.23:.16);
  for(let blade=0;blade<blades;blade++){
   const a=(blade+.3*hash(seed,blade,79))*Math.PI*2/blades;
   const rad=.018+.075*hash(seed,blade,81);
   addBlade(x+Math.cos(a)*rad,z+Math.sin(a)*rad,a,
    rad,height*(.77+.45*hash(seed,blade,89)),
    tropical?.055:.028,seed+blade);
  }
  created++;
 }
 const normals=[];
 B.VertexData.ComputeNormals(positions,indices,normals);
 const mesh=new B.Mesh('Mechones tropicales 3D · geometría combinada',scene);
 const vd=new B.VertexData();
 vd.positions=positions;vd.indices=indices;vd.normals=normals;vd.colors=colors;
 vd.applyToMesh(mesh);
 const mat=new B.StandardMaterial('Hojas de césped selvático',scene);
 mat.diffuseColor=B.Color3.White();
 mat.specularColor=new B.Color3(.01,.015,.006);
 mat.emissiveColor=new B.Color3(.095,.13,.035);
 mat.backFaceCulling=false;mat.useVertexColors=true;
 mesh.material=mat;mesh.receiveShadows=false;
 return {mesh,tufts:created,blades:indices.length/3};
}
export function construirCespedSelvatico(B,scene,ground,buildings={}){
 const plan=crearPlanoCesped(ground,{
  pyramids:buildings.pyramids||[],houses:buildings.houses||[]
 });
 const texture=mossTexture(B,scene,plan);
 const moss=B.MeshBuilder.CreateGround('Musgo y césped selvático · máscara exacta',
  {width:plan.outerWidth,height:plan.outerDepth,subdivisions:1},scene);
 // Above all cobbles; no z-fighting. 0 alpha cells expose untouched stone.
 moss.position.y=.101;
 const mat=new B.StandardMaterial('Musgo de invasión natural',scene);
 mat.diffuseTexture=texture;mat.useAlphaFromDiffuseTexture=true;
 mat.transparencyMode=B.Material.MATERIAL_ALPHATEST;
 mat.alphaCutOff=.5;mat.backFaceCulling=false;
 mat.diffuseColor=B.Color3.White();
 mat.specularColor=B.Color3.Black();moss.material=mat;
 moss.receiveShadows=false;
 const grass=grassTufts(B,scene,plan);
 return {...plan,moss,grass,globalCoverage:plan.coverage};
}
