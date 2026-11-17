// Assembled from actual, licensed GLB meshes. NOT billboard sprites, PNG
// cutouts, spheres or procedural stand-ins. The game simulation, navigation
// and collision authority remain unchanged in terreno.js.
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {obstaculos_escena} from './terreno.js';

const UNIT=74;
const rng=n=>{const x=Math.sin(n*179.2+17.31)*15457.283;return x-Math.floor(x);};
const url=id=>import.meta.env.BASE_URL+'models/selva/'+id+'.glb';
const round=v=>Number(v.toFixed(2));

// Loads only models already copied into the published site's own /models/
// directory by scripts/fetch-art-assets.mjs. No runtime third-party requests.
async function loadGLB(id){
 const gltf=await new GLTFLoader().loadAsync(url(id));
 let triangles=0;
 gltf.scene.traverse(obj=>{
  if(!obj.isMesh)return;
  const geometry=obj.geometry;
  triangles+=geometry.index?geometry.index.count/3:geometry.attributes.position.count/3;
  obj.castShadow=false;
  obj.receiveShadow=true;
 });
 if(!triangles)throw new Error('GLB has no visible triangle mesh: '+id);
 return {root:gltf.scene,triangles:Math.round(triangles)};
}

// Authoritative collider dimensions are in the 2D simulation's own coordinate
// system. This mapping is the same used by arena-three.js.
function setModel(container,model,x,z,desiredHeight,width,rotation=0){
 const copy=model.root.clone(true);
 const bounds=new THREE.Box3().setFromObject(copy);
 const size=bounds.getSize(new THREE.Vector3()),center=bounds.getCenter(new THREE.Vector3());
 // Resist bad glTF pivots, e.g. a tree imported 20 meters from origin.
 const hs=Math.max(.001,size.y),ws=Math.max(.001,size.x,size.z);
 const scale=Math.min(desiredHeight/hs,width/ws);
 copy.scale.setScalar(scale);
 copy.position.set(-center.x*scale,-bounds.min.y*scale,-center.z*scale);
 const pivot=new THREE.Group();
 pivot.position.set(x,0,z);pivot.rotation.y=rotation;pivot.add(copy);
 container.add(pivot);
 return pivot;
}

export async function cargarArteSelvaGLB(stage,options={}){
 const isAlive=options.isAlive||(()=>true);
 const catalogue=await Promise.all([
  loadGLB('big_tree'),loadGLB('tree'),loadGLB('rock_moss')
 ]);
 if(!isAlive())return null;
 const [tallTree,smallTree,mossRock]=catalogue;
 const group=new THREE.Group();
 group.name='Selva HD · assets 3D GLB auténticos';
 stage.add(group);
 const sources={trees:0,rocks:0,triangles:0};
 // Replace only the procedural decorative tree canopy; do not mutate
 // obstacle footprints or the autonomous battle simulation.
 stage.traverse(obj=>{
  if(obj.name==='Bóveda forestal · árboles 3D')obj.visible=false;
 });
 const obstacles=obstaculos_escena('selva');
 for(let i=0;i<obstacles.length;i++){
  const o=obstacles[i],x=(o.x-500)/UNIT,z=(o.y-320)/UNIT;
  const rx=o.rx/UNIT,rz=o.ry/UNIT;
  // These are the EXACT render positions of existing combat colliders.
  if(o.tipo==='arbol'){
   setModel(group,tallTree,x,z,2.5,Math.max(.8,rx*1.9),i*.9);
   sources.trees++;sources.triangles+=tallTree.triangles;
   stage.traverse(obj=>{if(obj.userData?.collisionId===o.id)obj.visible=false;});
  }else if(o.tipo==='roca'){
   setModel(group,mossRock,x,z,Math.max(.45,o.altura/UNIT*.58),Math.max(.8,rx*1.65),i*1.13);
   sources.rocks++;sources.triangles+=mossRock.triangles;
   stage.traverse(obj=>{if(obj.userData?.collisionId===o.id)obj.visible=false;});
  }
 }
 // Perimeter dressing only: placement deliberately stays OUTSIDE the live
 // 1000x640 combat area so no foliage interferes with line of sight or AI.
 const locations=[];
 for(let i=0;i<22;i++){
  const angle=i*2.399+0.4;
  const distance=9.0+(i%4)*.84;
  const x=Math.cos(angle)*distance,z=Math.sin(angle)*distance*.88;
  locations.push({x,z,index:i});
 }
 for(const {x,z,index} of locations){
  const type=index%3===0?tallTree:smallTree;
  setModel(group,type,x,z,2.3+rng(index)*1.7,1.2+rng(index*3)*.4,
    rng(index*19)*Math.PI*2);
  sources.trees++;sources.triangles+=type.triangles;
 }
 group.userData.source='Licensed CC0 GLB · Quaternius, Poly Haven';
 group.userData.metadata={
  ...sources,
  collisionCount:obstacles.length,
  aiChanges:0,audioChanges:0,
  models:['big_tree.glb','tree.glb','rock_moss.glb'],
  realGLB:true
 };
 return group;
}
