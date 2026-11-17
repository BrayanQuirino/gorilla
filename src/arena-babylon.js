// Babylon.js environmental showcase. No THREE imports, no combatants, no HUD.
// Uses real CC0 GLB tree/rock meshes obtained by the existing Pages asset pipeline.
// Babylon.js and its glTF loader are loaded by index.html; combat stays in battle.js.
import { obstaculos_escena } from './terreno.js';

const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const hash=v=>{const n=Math.sin(v*127.1+71.3)*43758.5453;return n-Math.floor(n)};
const blend=(a,b,t)=>a.map((v,i)=>v*(1-t)+b[i]*t);
const U=74;
const P=o=>({x:(o.x-500)/U,z:(o.y-320)/U});
const rootUrl=()=>import.meta.env.BASE_URL+'models/selva/';
const mix=(a,b,t)=>a+(b-a)*t;
function noise(x,z){
 const ix=Math.floor(x),iz=Math.floor(z),fx=x-ix,fz=z-iz;
 const sx=fx*fx*(3-2*fx),sz=fz*fz*(3-2*fz);
 const c=(i,j)=>hash(i*19.371+j*67.29);
 return mix(mix(c(ix,iz),c(ix+1,iz),sx),mix(c(ix,iz+1),c(ix+1,iz+1),sx),sz);
}
function terrainHeight(x,z){
 const r=Math.hypot(x/9,z/6);
 const edge=clamp((r-.66)*2.2,0,1);
 return -.12+edge*(.24*noise(x*.7,z*.7)+.07*Math.sin(x*2+z*1.4));
}
function makeMaterial(B,scene,name,hex,rough=1){
 const m=new B.PBRMaterial(name,scene);
 m.albedoColor=B.Color3.FromHexString(hex);
 m.roughness=rough;m.metallic=0;
 return m;
}
function ground(scene,B){
 // Solid terrain: world-space splat-map baked directly into an opaque
 // diffuse texture. It cannot disappear behind vertex-color multiplication.
 const segmentsX=150,segmentsZ=116,width=27,depth=21;
 const positions=[],indices=[],normals=[],uvs=[];
 for(let j=0;j<=segmentsZ;j++){
  const z=(j/segmentsZ-.5)*depth;
  for(let i=0;i<=segmentsX;i++){
   const x=(i/segmentsX-.5)*width;
   positions.push(x,terrainHeight(x,z),z);
   uvs.push(i/segmentsX,j/segmentsZ);
   if(i<segmentsX&&j<segmentsZ){
    const a=j*(segmentsX+1)+i,b=a+1,c=a+(segmentsX+1),d=c+1;
    indices.push(a,c,b,b,c,d);
   }
  }
 }
 B.VertexData.ComputeNormals(positions,indices,normals);
 const mesh=new B.Mesh('Suelo sólido selvático · malla 3D',scene);
 const data=new B.VertexData();
 Object.assign(data,{positions,indices,normals,uvs});
 data.applyToMesh(mesh);
 const texture=new B.DynamicTexture('Tierra, césped y musgo 1024px',
  {width:1024,height:768},scene,false);
 const ctx=texture.getContext(),pixels=ctx.createImageData(1024,768);
 for(let y=0;y<768;y++)for(let x=0;x<1024;x++){
  const wx=(x/1023-.5)*width,wz=(y/767-.5)*depth;
  const macro=noise(wx*.30+15,wz*.30+18),mid=noise(wx*1.15,wz*1.15);
  const fine=noise(wx*7.1+4,wz*7.1+1);
  const path=Math.exp(-Math.pow((wz-.43*Math.sin(wx*.55))/.81,2));
  const clearing=1-clamp((Math.hypot(wx/3.6,wz/3.0)-.7)*2,0,1);
  const soil=clamp(path*.7+clearing*.7+(.5-mid)*.22,0,1);
  const grass=[49+macro*25,77+mid*34,42+macro*23];
  const earth=[103+macro*19,81+mid*16,56+fine*12];
  const rgb=blend(grass,earth,soil);
  const grain=.81+.22*fine+.09*hash(x*11+y*29);
  const k=(y*1024+x)*4;
  for(let c=0;c<3;c++)pixels.data[k+c]=Math.round(clamp(rgb[c]*grain,0,255));
  pixels.data[k+3]=255;
 }
 ctx.putImageData(pixels,0,0);texture.update();
 texture.hasAlpha=false;
 texture.wrapU=texture.wrapV=B.Texture.CLAMP_ADDRESSMODE;
 const mat=new B.StandardMaterial('Suelo opaco / vegetación y tierra',scene);
 mat.diffuseTexture=texture;mat.diffuseColor=new B.Color3(1,1,1);
 mat.specularColor=new B.Color3(.035,.045,.03);
 mat.alpha=1;mat.transparencyMode=B.Material.MATERIAL_OPAQUE;
 mat.backFaceCulling=false;
 mesh.material=mat;mesh.receiveShadows=true;
 return mesh;
}
function stream(scene,B){
 const vertices=[],indices=[],width=1.05;
 for(let i=0;i<=120;i++){
  const z=-9.3+i*18.6/120,x=-6.75+.5*Math.sin(z*.5)+.22*Math.sin(z*1.27);
  vertices.push(x-width/2,-.074,z,x+width/2,-.074,z);
  if(i<120){const a=i*2;indices.push(a,a+2,a+1,a+1,a+2,a+3);}
 }
 const mesh=new B.Mesh('Arroyo sinuoso 3D',scene),normals=[];
 B.VertexData.ComputeNormals(vertices,indices,normals);
 const data=new B.VertexData();
 data.positions=vertices;data.indices=indices;data.normals=normals;
 data.applyToMesh(mesh);
 const m=makeMaterial(B,scene,'Agua verde turquesa','#357b79',.22);
 m.alpha=.91;m.backFaceCulling=false;
 m.metallic=.09;
 mesh.material=m;
 return mesh;
}
async function importModel(scene,B,id){
 const imported=await B.SceneLoader.ImportMeshAsync('',rootUrl(),id+'.glb',scene);
 const base=imported.meshes[0];
 if(!base)throw new Error('El GLB no contiene geometría: '+id);
 const bounds=base.getHierarchyBoundingVectors(true);
 const size=bounds.max.subtract(bounds.min);
 const center=bounds.max.add(bounds.min).scale(.5);
 // Source pivots can be arbitrarily offset: correct for them in an outer parent.
 jungleTreeMaterials(scene,B,{base},id);
 base.setEnabled(false);
 return {base,size,center,min:bounds.min};
}
function placeModel(scene,B,src,name,x,z,height,rotation=0){
 const pivot=new B.TransformNode(name,scene);
 const instance=src.base.clone(name+' · GLB',pivot);
 instance.setEnabled(true);
 const s=height/Math.max(.001,src.size.y);
 instance.scaling.set(s,s,s);
 instance.position.set(-src.center.x*s,-src.min.y*s+terrainHeight(x,z),-src.center.z*s);
 pivot.position.set(x,0,z);
 pivot.rotation.y=rotation;
 instance.getChildMeshes(false).forEach(m=>{m.receiveShadows=true;});
 return {pivot,meshes:instance.getChildMeshes(false)};
}
// Replace inappropriate red fantasy-tree foliage with a deliberately green
// rainforest palette. The supplied GLB is reused for its actual 3D silhouette.
function jungleTreeMaterials(scene,B,model,id){
 if(id==='rock_moss')return;
 const green=[
  new B.Color3(.14,.38,.19),
  new B.Color3(.22,.46,.20),
  new B.Color3(.31,.53,.23),
  new B.Color3(.16,.32,.17)
 ];
 const bark=new B.Color3(.34,.27,.16);
 const cache=new Map();
 for(const mesh of model.base.getChildMeshes(false)){
  const old=mesh.material;
  if(!old)continue;
  const key=old.uniqueId||old.name;
  if(!cache.has(key)){
   const c=old.albedoColor||old.diffuseColor||new B.Color3(1,1,1);
   const red=c.r>c.g*1.16&&c.r>c.b*1.08;
   const pale=c.r>.61&&c.g>.61&&c.b<.71;
   const lower=(old.name||'').toLowerCase();
   const trunk=/trunk|bark|wood|stem|branch/.test(lower)||pale&&!red;
   const next=new B.PBRMaterial('Selva tropical · '+old.name,scene);
   next.albedoColor=trunk?bark:green[Math.floor(hash(key?.length||3)*4)];
   // Never retain the source's red albedo texture. Original tree sources
   // are red-fantasy assets, not jungle leaves.
   next.metallic=0;next.roughness=.94;
   next.backFaceCulling=false;
   cache.set(key,next);
  }
  mesh.material=cache.get(key);
 }
}
// Extra recognizable tropical palms: actual volumetric fronds and bent
// trunks, batched inside only the environment layer (no hidden colliders).
function addTropicalPalm(scene,B,x,z,size,seed,shadow){
 const trunkMat=scene.getMaterialByName('Palmera · corteza')||
  makeMaterial(B,scene,'Palmera · corteza','#69533a');
 const leafMat=scene.getMaterialByName('Palmera · hojas')||
  makeMaterial(B,scene,'Palmera · hojas','#2e7747');
 const stem=new B.TransformNode('Palmera tropical',scene);
 stem.position.set(x,terrainHeight(x,z),z);
 const height=size*(1.05+hash(seed)*.3);
 const trunk=B.MeshBuilder.CreateCylinder('Tronco curvo',{height,
  diameterTop:.14*size,diameterBottom:.23*size,tessellation:8},scene);
 trunk.position.y=height*.50;trunk.rotation.z=(hash(seed+7)-.5)*.2;
 trunk.material=trunkMat;trunk.parent=stem;
 const crownY=height*1.02;
 const frondCount=9;
 for(let i=0;i<frondCount;i++){
  const a=i*Math.PI*2/frondCount+hash(seed)*2.1;
  const radius=.75*size*(.8+hash(i+seed)*.45);
  const verts=[],inds=[];
  const segments=9;
  for(let j=0;j<=segments;j++){
   const t=j/segments,r=radius*t;
   const y=crownY+size*.21*Math.sin(t*Math.PI)-size*.38*t*t;
   const w=.23*size*Math.sin(Math.PI*t);
   const cx=Math.cos(a)*r,cz=Math.sin(a)*r;
   verts.push(cx-Math.sin(a)*w,y,cz+Math.cos(a)*w,
    cx+Math.sin(a)*w,y,cz-Math.cos(a)*w);
   if(j<segments){
    const k=j*2;inds.push(k,k+1,k+2,k+1,k+3,k+2);
   }
  }
  const normals=[];B.VertexData.ComputeNormals(verts,inds,normals);
  const frond=new B.Mesh('Hoja tropical curvada',scene);
  const vd=new B.VertexData();
  vd.positions=verts;vd.indices=inds;vd.normals=normals;
  vd.applyToMesh(frond);frond.material=leafMat;frond.parent=stem;
  frond.receiveShadows=true;
 }
 return stem;
}
function scatterModels(scene,B,models,shadow){
 let trees=0,rocks=0;
 const add=(id,x,z,h,angle=0)=>{
  const src=models[id];if(!src)return;
  const item=placeModel(scene,B,src,id+' '+(trees+rocks),x,z,h,angle);
  // Shadow casters are limited for browser performance; nearby hero objects
  // and the recognizable forest edge get full dynamic shadows.
  if(Math.hypot(x,z)<11)for(const m of item.meshes)shadow.addShadowCaster(m);
  if(id==='rock_moss')rocks++;else trees++;
 };
 // All gameplay blocker centers remain sourced from the combat terrain module.
 const obstacles=obstaculos_escena('selva');
 obstacles.forEach((o,i)=>{
  const p=P(o);
  if(o.tipo==='arbol')add('big_tree',p.x,p.z,3.35+i*.10,hash(i*31)*6.28);
  else if(o.tipo==='roca')add('rock_moss',p.x,p.z,.9+hash(i*9)*.35,i*2.4);
  else { // ruined ancient stone: build irregular masses, not a geometric disk
   for(let j=0;j<3;j++){
    const a=j*2.09+hash(i+j)*.5;
    add('rock_moss',p.x+Math.cos(a)*.32,p.z+Math.sin(a)*.31,
     .65+hash(i*29+j)*.65,a);
   }
  }
 });
 // Deterministically art-direct dense forest toward the rim of the arena.
 // The open central floor intentionally remains readable for 100 fighters later.
 for(let i=0;i<78;i++){
  const a=i*2.39996+hash(i*9)*.24,ring=8.0+hash(i*37)*5;
  const x=Math.cos(a)*ring*1.15,z=Math.sin(a)*ring*.92;
  const id=i%5===0?'big_tree':'tree';
  add(id,x,z,id==='big_tree'?3.6+hash(i)*1.8:2.2+hash(i)*1.35,
   hash(i*33)*6.28);
  if(i%3===0)add('rock_moss',x+(hash(i*19)-.5)*2,
   z+(hash(i*27)-.5)*2,.28+hash(i*47)*.66,i*.93);
 }
 // Irregular rock berms follow the water, avoiding the rigid straight rock row.
 for(let i=0;i<27;i++){
  const z=-8.4+i*.37,x=-6.75+.5*Math.sin(z*.5)+.22*Math.sin(z*1.27);
  const side=i%2===0?-1:1;
  add('rock_moss',x+side*(.62+hash(i*9)*.4),z,.24+hash(i*31)*.42,i*1.37);
 }
 for(let i=0;i<34;i++){
  const a=i*2.39996,ring=7.5+hash(i*53)*3.7;
  addTropicalPalm(scene,B,Math.cos(a)*ring*1.27,Math.sin(a)*ring,
   1.3+hash(i*19)*.6,i,shadow);
 }
 return {trees,rocks,palms:34,blockers:obstacles.length};
}
export function crear_dibujante_babylon(canvas,requestDraw,onFailure){
 const B=window.BABYLON;
 if(!B?.Engine||!B?.SceneLoader)throw new Error('Babylon.js no se cargó');
 const engine=new B.Engine(canvas,true,{preserveDrawingBuffer:false,stencil:true,
  adaptToDeviceRatio:true,powerPreference:'high-performance'});
 engine.setHardwareScalingLevel(Math.max(1,(window.devicePixelRatio||1)/1.5));
 const scene=new B.Scene(engine);
 scene.clearColor=new B.Color4(.16,.24,.20,1);
 scene.fogMode=B.Scene.FOGMODE_EXP2;
 scene.fogColor=new B.Color3(.28,.40,.34);scene.fogDensity=.008;
 scene.environmentIntensity=.65;
 const camera=new B.ArcRotateCamera('Cámara isométrica MOBA',
  -Math.PI*.36,Math.PI*.27,23,new B.Vector3(0,.13,0),scene);
 camera.mode=B.Camera.ORTHOGRAPHIC_CAMERA;
 camera.lowerBetaLimit=.24;camera.upperBetaLimit=1.05;
 camera.lowerRadiusLimit=10;camera.upperRadiusLimit=33;
 camera.wheelPrecision=45;camera.panningSensibility=0;
 camera.attachControl(canvas,true);
 camera.inputs.attached.pointers.buttons=[0,1,2];
 const hemi=new B.HemisphericLight('Cielo selvático',
  new B.Vector3(-.3,1,.2),scene);
 hemi.intensity=.86;hemi.groundColor=new B.Color3(.15,.22,.17);
 const key=new B.DirectionalLight('Sol cálido entre copas',
  new B.Vector3(-.48,-1,.47),scene);
 key.position=new B.Vector3(10,17,-12);key.intensity=2.35;
 const shadow=new B.ShadowGenerator(2048,key);
 shadow.usePercentageCloserFiltering=true;
 shadow.filteringQuality=B.ShadowGenerator.QUALITY_MEDIUM;
 ground(scene,B);stream(scene,B);
 const rim=new B.GlowLayer('brillo atmosférico suave',scene,{blurKernelSize:24});
 rim.intensity=.13;
 let ready=false,disposed=false,error=null,loaded=0,assetStats=null;
 let lastWidth=0,lastHeight=0;
 const resize=()=>{
  const w=canvas.clientWidth||canvas.width||1000,
   h=canvas.clientHeight||canvas.height||640;
  if(w!==lastWidth||h!==lastHeight){
   lastWidth=w;lastHeight=h;engine.resize();
  }
  const ratio=engine.getRenderWidth()/Math.max(1,engine.getRenderHeight());
  // ArcRotateCamera.radius does not zoom an orthographic projection.
  // Tie the actual orthographic extents to radius so wheel zoom really works.
  const v=7.45*(camera.radius/23);
  camera.orthoTop=v;camera.orthoBottom=-v;
  camera.orthoLeft=-v*ratio;camera.orthoRight=v*ratio;
 };
 const onWheel=e=>{
  e.preventDefault();
  camera.radius=clamp(camera.radius*Math.exp(e.deltaY*.0011),10,33);
  requestDraw?.();
 };
 // Use one explicit orthographic zoom controller, not Babylon's perspective wheel.
 camera.inputs.removeByType('ArcRotateCameraMouseWheelInput');
 canvas.addEventListener('wheel',onWheel,{passive:false});
 const update=()=>{if(disposed)return;resize();scene.render();};
 const pending=Promise.allSettled(
  ['big_tree','tree','rock_moss'].map(async id=>{
   const model=await importModel(scene,B,id);loaded++;return [id,model];
  })
 ).then(results=>{
  if(disposed)return;
  const models=Object.fromEntries(results.filter(r=>r.status==='fulfilled')
   .map(r=>r.value));
  for(const r of results.filter(r=>r.status==='rejected'))
   console.warn('Modelo de selva no disponible:',r.reason);
  if(!models.tree&&!models.big_tree)
   throw new Error('No se pudieron cargar los árboles GLB de la selva');
  assetStats=scatterModels(scene,B,models,shadow);
  ready=true;requestDraw?.();
 }).catch(e=>{if(!disposed){error=e;onFailure?.(e);}});
 engine.runRenderLoop(update);
 const onResize=()=>engine.resize();
 window.addEventListener('resize',onResize);
 const render=()=>{
  if(disposed)return false;
  // Keep rendering while 3D resources arrive; never report a complete scene
  // before at least a tree model was loaded and instantiated.
  return ready&&error===null;
 };
 render.liberar=()=>{
  disposed=true;window.removeEventListener('resize',onResize);
  canvas.removeEventListener('wheel',onWheel);
  camera.detachControl(canvas);engine.stopRenderLoop();scene.dispose();engine.dispose();
 };
 render.diagnostico=()=>({motor:'Babylon.js',arena:'selva',
  ready,loaded,assetStats,error:error?.message||null});
 return render;
}
