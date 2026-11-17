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
 const segmentsX=150,segmentsZ=116,width=27,depth=21;
 const positions=[],indices=[],normals=[],colors=[],uvs=[];
 const grass=[.26,.39,.27],earth=[.43,.34,.23],moss=[.20,.31,.22];
 for(let j=0;j<=segmentsZ;j++){
  const z=(j/segmentsZ-.5)*depth;
  for(let i=0;i<=segmentsX;i++){
   const x=(i/segmentsX-.5)*width;
   const wide=noise(x*.33+10,z*.33),detail=noise(x*2.3,z*2.3);
   const central=clamp((Math.hypot(x/3.25,z/2.45)-.75)*2,0,1);
   const path=Math.exp(-Math.pow((z-.43*Math.sin(x*.55))/.62,2))*.58;
   const dirt=clamp((1-central)*.76+path+.13*detail,0,.94);
   const color=blend(blend(grass,moss,wide*.57),earth,dirt);
   const daylight=.85+.18*detail+.08*noise(x*1.6+40,z*1.6);
   positions.push(x,terrainHeight(x,z),z);
   colors.push(...color.map(c=>clamp(c*daylight,0,1)),1);
   uvs.push(i/segmentsX*9,j/segmentsZ*7);
   if(i<segmentsX&&j<segmentsZ){
    const a=j*(segmentsX+1)+i,b=a+1,c=a+(segmentsX+1),d=c+1;
    indices.push(a,c,b,b,c,d);
   }
  }
 }
 B.VertexData.ComputeNormals(positions,indices,normals);
 const mesh=new B.Mesh('Terreno de selva · malla de relieve',scene);
 const data=new B.VertexData();
 Object.assign(data,{positions,indices,normals,colors,uvs});
 data.applyToMesh(mesh);
 const mat=makeMaterial(B,scene,'Suelos mezclados - tierra y musgo','#ffffff');
 mat.useVertexColors=true;mat.backFaceCulling=false;
 // Microtexture breaks up the smooth gradient at camera distance.
 const texture=new B.DynamicTexture('Textura de tierra y vegetación',{width:512,height:512},scene,true);
 const ctx=texture.getContext(),image=ctx.createImageData(512,512);
 for(let y=0;y<512;y++)for(let x=0;x<512;x++){
  const a=noise(x/27,y/27),b=noise(x/5,y/5),v=clamp(.59+.38*a+.11*b,0,1);
  const k=(y*512+x)*4;
  image.data[k]=Math.floor(v*255);
  image.data[k+1]=Math.floor(v*253);
  image.data[k+2]=Math.floor(v*244);
  image.data[k+3]=255;
 }
 ctx.putImageData(image,0,0);texture.update();
 texture.uScale=9;texture.vScale=7;
 mat.albedoTexture=texture;mat.albedoColor=new B.Color3(1,1,1);
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
 for(let i=0;i<115;i++){
  const a=i*2.39996+hash(i*9)*.24,ring=8.0+hash(i*37)*5;
  const x=Math.cos(a)*ring*1.15,z=Math.sin(a)*ring*.92;
  const id=i%5===0?'big_tree':'tree';
  add(id,x,z,id==='big_tree'?3.6+hash(i)*1.8:2.2+hash(i)*1.35,
   hash(i*33)*6.28);
  if(i%2===0)add('rock_moss',x+(hash(i*19)-.5)*2,
   z+(hash(i*27)-.5)*2,.28+hash(i*47)*.66,i*.93);
 }
 // Irregular rock berms follow the water, avoiding the rigid straight rock row.
 for(let i=0;i<46;i++){
  const z=-8.4+i*.37,x=-6.75+.5*Math.sin(z*.5)+.22*Math.sin(z*1.27);
  const side=i%2===0?-1:1;
  add('rock_moss',x+side*(.62+hash(i*9)*.4),z,.24+hash(i*31)*.42,i*1.37);
 }
 return {trees,rocks,blockers:obstacles.length};
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
  const v=7.45;
  camera.orthoTop=v;camera.orthoBottom=-v;
  camera.orthoLeft=-v*ratio;camera.orthoRight=v*ratio;
 };
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
  camera.detachControl(canvas);engine.stopRenderLoop();scene.dispose();engine.dispose();
 };
 render.diagnostico=()=>({motor:'Babylon.js',arena:'selva',
  ready,loaded,assetStats,error:error?.message||null});
 return render;
}
