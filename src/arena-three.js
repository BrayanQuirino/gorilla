// Gorilla Three.js art preview. All combat, AI, evolution, bananas, HUD and
// supplies belong to the existing simulation and React UI, never to this file.
// Procedural, real 3D geometry: no cut-out image or flat background textures.
import * as THREE from 'three';
import {ancho,alto,obstaculos_escena} from './terreno.js';

const UNIT=74;
const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
const hash=n=>{const x=Math.sin(n*127.1+71.3)*43758.5453;return x-Math.floor(x)};
const terrainColors={
 selva:{ground:0x425c3d,earth:0x624c37,rock:0x696b57,leaf:0x316342,accent:0x8acb83,fog:0x869b85},
 claro:{ground:0x60754a,earth:0x766043,rock:0x888979,leaf:0x486e42,accent:0xc5b88a,fog:0xa2aa89},
 canon:{ground:0x96714d,earth:0x9b6747,rock:0xa17c62,leaf:0x77744d,accent:0xd8b386,fog:0xc1a78a},
 hangar:{ground:0x424e50,earth:0x515657,rock:0x727c7e,leaf:0x556263,accent:0xb5a374,fog:0x747e85}
};
const outfits={
 Entrenador:0x44765d,Campista:0xa48b5c,Estudiante:0x6380aa,Boxeador:0xa64040,
 'Científico':0xd9e2dc,'Acróbata':0x875fa7,Oficinista:0x6b8398,
 Aficionado:0x92734d,Turista:0xc9a46d,Repartidor:0xb07c3b,
 Musculoso:0x646b68,Adolescente:0x69a18c,'Paramédico':0xd9eee4,
 Velocista:0x2e8bc3,Atleta:0x3d8aad,Beisbolista:0xa69571,
 Malabarista:0xa969ae,Corredor:0x5c9e90,Anciano:0x838b87,
 'Tarzán':0x6f8d4e
};
const shared={
 sphere:new THREE.SphereGeometry(1,12,8),
 head:new THREE.SphereGeometry(1,14,10),
 cylinder:new THREE.CylinderGeometry(1,1,1,9),
 rock:new THREE.IcosahedronGeometry(1,1),
 box:new THREE.BoxGeometry(1,1,1),
 plane:new THREE.PlaneGeometry(1,1),
 cone:new THREE.ConeGeometry(1,1,7),
 torus:new THREE.TorusGeometry(1,.1,6,16)
};
const material=(color,roughness=.91,metalness=0)=>new THREE.MeshStandardMaterial({color,roughness,metalness,flatShading:false});
const materialCache=new Map();
function mat(c,r=.91,m=0){const key=c+'/'+r+'/'+m;if(!materialCache.has(key))materialCache.set(key,material(c,r,m));return materialCache.get(key);}
function mesh(geometry,c,parent,x,y,z,sx=1,sy=1,sz=1){
 const ob=new THREE.Mesh(geometry,typeof c==='number'?mat(c):c);
 ob.position.set(x,y,z);ob.scale.set(sx,sy,sz);
 ob.castShadow=true;ob.receiveShadow=true;parent.add(ob);return ob;
}
const P=(x,z)=>new THREE.Vector3((x-ancho/2)/UNIT,0,(z-alto/2)/UNIT);
const yOf=h=>(h.altura||0)/UNIT;
function box(parent,c,x,y,z,w,h,d){return mesh(shared.box,c,parent,x,y+h/2,z,w,h,d)}
function orb(parent,c,x,y,z,sx,sy,sz){return mesh(shared.sphere,c,parent,x,y,z,sx,sy,sz)}
function cylinderBetween(parent,c,a,b,radius,bottomRadius=radius){
 const delta=b.clone().sub(a),center=a.clone().addScaledVector(delta,.5);
 const part=mesh(shared.cylinder,c,parent,center.x,center.y,center.z,radius,delta.length(),bottomRadius);
 part.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());return part;
}
function rockShape(parent,c,x,y,z,rx,ry,rz,seed=0){
 const geometry=shared.rock.clone(),a=geometry.attributes.position;
 for(let i=0;i<a.count;i++){
  const v=new THREE.Vector3().fromBufferAttribute(a,i);
  v.multiplyScalar(.86+.19*hash(seed+i*7));
  a.setXYZ(i,v.x,v.y,v.z);
 }
 geometry.computeVertexNormals();
 const o=mesh(geometry,c,parent,x,y,z,rx,ry,rz);o.rotation.y=hash(seed+1)*2;
 return o;
}
function environment(scene,arena){
 const palette=terrainColors[arena]||terrainColors.selva;
 const ground=material(palette.ground,.98);
 const field=mesh(new THREE.PlaneGeometry(18,13,44,32),ground,scene,0,-.065,0);
 field.rotation.x=-Math.PI/2;field.castShadow=false;field.receiveShadow=true;
 const stage=new THREE.Group();scene.add(stage);
 const earth=mat(palette.earth),rock=palette.rock,leaf=palette.leaf;
 // Shaped paths mark routes without placing invisible decorative collision boxes.
 for(let i=0;i<38;i++){
  const x=-6.7+i*.35,z=.18*Math.sin(x*.7);
  const path=orb(stage,palette.earth,x,-.04,z,.35,.016,.39);
  path.castShadow=false;
 }
 // Geometric cliffs are offset toward the distant edge so combat stays visible.
 for(let i=0;i<25;i++){
  const x=-8+i*.7,z=-5.6+hash(i*4)*1.0,height=.7+hash(i*13)*1.7;
  rockShape(stage,rock,x,height*.4-.12,z,.39+hash(i)*.4,height,.50+hash(i+2)*.5,i*11);
 }
 // These render props occupy EXACTLY the footprint used by the battle engine.
 for(const o of obstaculos_escena(arena)){
  const p=P(o.x,o.y),rx=o.rx/UNIT,rz=o.ry/UNIT;
  const h=clamp(o.altura/UNIT*.74,.35,1.6);
  if(o.tipo==='puente'){
   box(stage,0x846647,p.x,.04,p.z,rx*2.15,.14,rz*1.90);
   for(let k=-5;k<=5;k++)box(stage,0xb08a59,p.x+k*rx*.17,.13,p.z,rx*.12,.055,rz*1.85);
   continue;
  }
  if(o.tipo==='arbol'){
   cylinderBetween(stage,0x695038,new THREE.Vector3(p.x,0,p.z),new THREE.Vector3(p.x+.08,h*2,p.z),.14);
   for(let j=0;j<5;j++){
    const a=j*2.4;
    orb(stage,j%2?0x386c45:leaf,p.x+Math.cos(a)*rx*.5,h*(1.7+j*.06),p.z+Math.sin(a)*rz*.4,rx*.75,h*.56,rz*1.5);
   }
  } else if(o.tipo==='contenedor'||o.tipo==='caja'){
   const c=o.tipo==='contenedor'?0x63757a:0x94714d;
   box(stage,c,p.x,0,p.z,rx*1.76,h,rz*1.82);
   for(let k=-3;k<=3;k++)box(stage,0x344347,p.x+k*rx*.23,.08,p.z+rz*.91,.026,h*.78,.032);
  } else if(o.tipo==='ruina'){
   for(let k=0;k<4;k++){
    const a=k*Math.PI/2;
    box(stage,0x85816c,p.x+Math.cos(a)*rx*.55,0,p.z+Math.sin(a)*rz*.6,rx*.26,h*(.65+hash(k+o.x)*.4),rz*.34);
   }
   box(stage,0x99947f,p.x,h*.83,p.z,rx*1.4,.14,rz*1.25);
   orb(stage,0x4e7653,p.x,h*.9,p.z,rx*.45,.06,rz*.6);
  } else {
   rockShape(stage,rock,p.x,h*.45,p.z,rx*.99,h*.67,rz*.99,o.x+o.y);
   rockShape(stage,0x858875,p.x-rx*.27,h*.19,p.z+rz*.14,rx*.56,h*.34,rz*.65,o.y);
   orb(stage,0x426b42,p.x,h*.62,p.z,rx*.34,.04,rz*.27);
  }
 }
 if(arena==='selva'||arena==='claro'){
  // A real water surface, banks, 3D bridges, and ruins.
  const water=new THREE.Mesh(new THREE.PlaneGeometry(1.2,8.5),new THREE.MeshStandardMaterial({
   color:0x4096a3,roughness:.18,metalness:.12,transparent:true,opacity:.84,side:THREE.DoubleSide
  }));water.rotation.x=-Math.PI/2;water.position.set(-6.2,-.038,0);scene.add(water);
  for(let i=0;i<13;i++){
   const x=-6.2+hash(i+11)*.8,z=-3.8+i*.59;
   const ripple=mesh(shared.torus,0x78c8c5,stage,x,-.009,z,.07,.07,.025);
   ripple.rotation.x=-Math.PI/2;ripple.castShadow=false;
  }
 }
 if(arena==='hangar'){
  // Abandoned aircraft: wings, fuselage, tail and turbines as 3D meshes.
  const aircraft=new THREE.Group();scene.add(aircraft);aircraft.position.set(-3.3,.12,-3.45);
  orb(aircraft,0x84949a,0,.28,0,.48,.37,2.2);
  box(aircraft,0x697c84,0,.32,-.25,4.8,.14,.68);
  box(aircraft,0x6b8087,0,.30,1.67,1.72,.13,.55);
  box(aircraft,0x71898a,0,.34,1.78,.13,.85,.55);
  for(const side of [-1,1]){
   orb(aircraft,0x555e66,side*1.32,.10,-.24,.28,.24,.42);
  }
 }else if(arena==='canon'){
  for(let i=0;i<13;i++){
   const x=-7+i*1.22,z=4.25;
   rockShape(stage,i%2?0x9e7456:0xb38b68,x,.25,z,.45,.56,.66,i+122);
  }
 }
 // Three-dimensional scenery vegetation stays outside the middle combat field.
 for(let i=0;i<(arena==='hangar'?48:165);i++){
  const x=(hash(i*11)-.5)*14,z=(hash(i*19+7)-.5)*9.6;
  if(Math.abs(z)<.95||Math.hypot(x/2,z/2)<1)continue;
  const height=.08+hash(i*31)*.19;
  const tuft=mesh(shared.cone,i%4?0x588456:0x7c9b5b,stage,x,height/2,z,.037,height,.042);
  tuft.rotation.z=(hash(i+8)-.5)*.3;
 }
 return {root:stage,palette};
}

const HUMAN_PARTS={
 torso:{geometry:shared.sphere,scale:[.19,.31,.15],pos:[0,.68,0]},
 pelvis:{geometry:shared.sphere,scale:[.18,.14,.14],pos:[0,.41,0]},
 head:{geometry:shared.head,scale:[.14,.18,.14],pos:[0,1.08,0]},
 hair:{geometry:shared.sphere,scale:[.149,.065,.144],pos:[0,1.215,-.012]},
 leftUpperArm:{geometry:shared.sphere,scale:[.072,.17,.073],pos:[-.24,.76,0]},
 rightUpperArm:{geometry:shared.sphere,scale:[.072,.17,.073],pos:[.24,.76,0]},
 leftHand:{geometry:shared.sphere,scale:[.07,.085,.07],pos:[-.29,.50,0]},
 rightHand:{geometry:shared.sphere,scale:[.07,.085,.07],pos:[.29,.50,0]},
 leftThigh:{geometry:shared.sphere,scale:[.095,.20,.087],pos:[-.105,.28,0]},
 rightThigh:{geometry:shared.sphere,scale:[.095,.20,.087],pos:[.105,.28,0]},
 leftShin:{geometry:shared.sphere,scale:[.073,.17,.077],pos:[-.105,.11,0]},
 rightShin:{geometry:shared.sphere,scale:[.073,.17,.077],pos:[.105,.11,0]},
 leftBoot:{geometry:shared.sphere,scale:[.091,.065,.12],pos:[-.105,.045,-.06]},
 rightBoot:{geometry:shared.sphere,scale:[.091,.065,.12],pos:[.105,.045,-.06]},
 equipment:{geometry:shared.box,scale:[.045,.13,.32],pos:[.33,.48,-.17]},
 backpack:{geometry:shared.box,scale:[.21,.28,.10],pos:[0,.69,.17]},
 shadow:{geometry:shared.plane,scale:[.35,.22,1],pos:[0,.018,0]}
};
const parts=Object.keys(HUMAN_PARTS);
const scratchObj=new THREE.Object3D(),colorObj=new THREE.Color();
function makeHumans(scene){
 const root=new THREE.Group();scene.add(root);
 const meshes={};
 for(const name of parts){
  const s=HUMAN_PARTS[name];
  const shadow=name==='shadow';
  const m=new THREE.MeshStandardMaterial({color:0xffffff,roughness:.92,metalness:0,transparent:shadow,opacity:shadow?.26:1,
   depthWrite:!shadow,side:shadow?THREE.DoubleSide:THREE.FrontSide});
  const batch=new THREE.InstancedMesh(s.geometry,m,100);
  batch.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  batch.castShadow=!shadow;batch.receiveShadow=!shadow;
  batch.frustumCulled=false;root.add(batch);meshes[name]=batch;
 }
 const originColor=new THREE.Color(0xeeeeec);
 function apply(humans,t){
  const visible=humans.slice(0,100);
  for(let i=0;i<100;i++){
   const h=visible[i],alive=h&&h.vida>0&&h.estado!=='eliminado'&&h.estado!=='incapacitado';
   const ground=h?P(h.x,h.y):new THREE.Vector3(0,0,0);
   const speed=h?Math.hypot(h.vx||0,h.vy||0):0;
   const yaw=speed>3?Math.atan2(h.vx,h.vy):h?Math.atan2(500-h.x,320-h.y):0;
   const angle=Math.sin(t*8.4+(h?.id||i)*.85);
   const walk=speed>5?.17*angle:0;
   const strike=h&&(h.atacando_hasta||0)>t?Math.sin(t*22)*.38:0;
   const injured=h&&h.estado==='herido';
   const arch=h?.arquetipo||'Oficinista';
   const scale=arch==='Anciano'?.86:/Musculoso|Tarzán|Boxeador/.test(arch)?1.13:1;
   const team=new THREE.Color(outfits[arch]||0x7b8690);
   const skin=new THREE.Color().setHSL(.07+.02*hash(h?.id||0),.27+hash((h?.id||0)*7)*.19,.57);
   const hair=arch==='Anciano'?new THREE.Color(0xb5b3a9):new THREE.Color(0x3d302c);
   const hasWeapon=Boolean(h?.objeto);
   const isBackpack=/Campista|Turista|Repartidor|Paramédico/.test(arch);
   for(const name of parts){
    const part=HUMAN_PARTS[name],o=meshes[name],s=part.scale;
    const hidden=(!h||(name!=='shadow'&&!alive)||(name==='equipment'&&!hasWeapon)||(name==='backpack'&&!isBackpack));
    const p=part.pos;
    scratchObj.position.set(ground.x,ground.y+(h?.altura||0)/UNIT,ground.z);
    scratchObj.rotation.set(0,yaw,0);
    scratchObj.scale.set(scale,scale,scale);
    let x=p[0],y=p[1],z=p[2];
    if(name.includes('Thigh')||name.includes('Shin')||name.includes('Boot'))z+=(name.startsWith('left')?walk:-walk)*.44;
    if(name.includes('Arm')||name.includes('Hand')){
     z+=(name.startsWith('left')?-walk:walk)*.38;
     if(name.startsWith('right'))z-=strike;
    }
    if(name==='torso'||name==='head'||name==='hair')y+=Math.abs(walk)*.06;
    if(name==='shadow'){y=-ground.y-(h?.altura||0)/UNIT+.025;scratchObj.rotation.set(-Math.PI/2,0,0);}
    const ca=Math.cos(yaw),sa=Math.sin(yaw);
    scratchObj.position.x+=x*ca+z*sa;
    scratchObj.position.z+=-x*sa+z*ca;
    scratchObj.position.y+=y*scale;
    scratchObj.scale.set(s[0]*scale*(hidden?.00001:1),s[1]*scale*(hidden?.00001:1),s[2]*scale*(hidden?.00001:1));
    if(name==='shadow')scratchObj.scale.set(hidden?.00001:.33,hidden?.00001:.23,1);
    scratchObj.updateMatrix();o.setMatrixAt(i,scratchObj.matrix);
    let c=team;
    if(name==='pelvis'||name.includes('Thigh')||name.includes('Shin'))c=new THREE.Color(0x343e4c);
    if(name==='head'||name.includes('Hand'))c=skin;
    if(name==='hair')c=hair;
    if(name.includes('Boot'))c=new THREE.Color(0x292c2a);
    if(name==='equipment')c=new THREE.Color(h.objeto?.tipo==='fuego'?0x364249:0x987b56);
    if(name==='backpack')c=new THREE.Color(0x756b52);
    if(name==='shadow')c=new THREE.Color(0x132e24);
    if(injured)c=c.clone().multiplyScalar(.75);
    o.setColorAt(i,c);
   }
  }
  for(const name of parts){meshes[name].instanceMatrix.needsUpdate=true;
   if(meshes[name].instanceColor)meshes[name].instanceColor.needsUpdate=true;}
 }
 return {apply,meshes,root};
}
function makeGorilla(scene){
 const group=new THREE.Group();scene.add(group);
 const fur=mat(0x333736,.99),silver=mat(0x676b64,.98),skin=mat(0x61564d,.91),black=mat(0x1d2221),iris=mat(0xd4a255,.48);
 const body=new THREE.Group();group.add(body);
 orb(body,fur,0,.83,0,.68,.69,.55);
 orb(body,silver,0,.94,.25,.55,.48,.38);
 orb(body,fur,0,1.32,.46,.41,.38,.39);
 orb(body,skin,0,1.22,.77,.33,.22,.26);
 orb(body,black,0,1.045,.86,.24,.054,.14);
 for(const side of [-1,1]){
  orb(body,skin,side*.16,1.35,.78,.17,.12,.06);
  orb(body,black,side*.16,1.42,.831,.084,.043,.034);
  orb(body,iris,side*.165,1.374,.855,.045,.035,.025);
  orb(body,fur,side*.54,.98,.07,.30,.39,.28);
 }
 const arms=[],legs=[];
 for(const side of [-1,1]){
  const arm=new THREE.Group();arm.position.set(side*.57,1.10,.08);body.add(arm);
  orb(arm,fur,side*.13,-.31,.13,.245,.42,.22);
  orb(arm,fur,side*.22,-.67,.35,.22,.34,.21);
  orb(arm,skin,side*.22,-.92,.52,.25,.15,.23);
  arms.push(arm);
  const leg=new THREE.Group();leg.position.set(side*.38,.39,-.30);body.add(leg);
  orb(leg,fur,0,-.12,-.08,.29,.32,.27);
  orb(leg,skin,0,-.36,.02,.29,.15,.34);
  legs.push(leg);
 }
 const anger=mesh(shared.torus,new THREE.MeshBasicMaterial({color:0xe87535,transparent:true,opacity:.0}),body,0,.55,0,1.35,1.35,.17);
 anger.rotation.x=-Math.PI/2;
 function apply(g,t){
  group.visible=Boolean(g);
  if(!g)return;
  const p=P(g.x,g.y),k=clamp((g.radio||26)/26,.87,1.55);
  group.position.set(p.x,(g.altura||0)/UNIT,p.z);
  group.scale.setScalar(k);
  group.rotation.y=(g.mira_izquierda?-Math.PI*.6:0);
  body.position.y=Math.abs(Math.sin(t*5))*Math.min(1,(g.movimiento||0)/35)*.04;
  const moving=Math.min(1,(g.movimiento||0)/32);
  const attack=['agarre','embestida','aviso','golpe_area'].includes(g.fase);
  const climb=(g.trepando_hasta||0)>(g.navegacion_reloj||0);
  arms.forEach((a,i)=>{a.rotation.x=(i?1:-1)*Math.sin(t*6)*moving*.22+(attack?-.75:0)+(climb?-.42:0);});
  legs.forEach((l,i)=>{l.rotation.x=(i?1:-1)*Math.sin(t*6)*moving*.24;});
  const rage=g.furia_permanente||(g.furia||0)>0;
  anger.material.opacity=rage?.55:0;anger.rotation.z+=.04;
 }
 return {root:group,apply};
}
function makeSundries(scene){
 const root=new THREE.Group();scene.add(root);
 const weapon=mat(0xa7976c),supply=mat(0x78946a);
 let refs=[];
 function update(b){
  for(const ob of refs)root.remove(ob);
  refs=[];
  for(const item of (b.armas_suelo||[]).slice(0,35)){
   if(item.recogido_por||(!item.visible&&!item.descubierto))continue;
   const g=new THREE.Group(),p=P(item.x,item.y);
   g.position.copy(p);g.position.y=.02;
   box(g,weapon,0,0,0,.14,.15,.28);root.add(g);refs.push(g);
  }
  for(const item of (b.suministros||[]).slice(0,20)){
   if(!Number.isFinite(item.x)||!Number.isFinite(item.y))continue;
   const g=new THREE.Group(),p=P(item.x,item.y);
   g.position.copy(p);
   box(g,supply,0,0,0,.32,.25,.32);root.add(g);refs.push(g);
  }
 }
 return {update};
}

export function crear_dibujante_three(canvas,requestDraw,onFailure){
 const renderer=new THREE.WebGLRenderer({canvas,antialias:false,alpha:false,powerPreference:'high-performance'});
 renderer.setSize(canvas.width,canvas.height,false);
 renderer.setPixelRatio(1);
 renderer.toneMapping=THREE.ACESFilmicToneMapping;
 renderer.toneMappingExposure=1.35;
 renderer.outputColorSpace=THREE.SRGBColorSpace;
 renderer.shadowMap.enabled=false; // One mesh per person; GPU instancing over costly shadows.
 const scene=new THREE.Scene();
 const ambient=new THREE.HemisphereLight(0xeaf2dc,0x384638,2.0);scene.add(ambient);
 const sunlight=new THREE.DirectionalLight(0xffe3ac,2.25);sunlight.position.set(-5,11,8);scene.add(sunlight);
 const fill=new THREE.DirectionalLight(0xb3d9d0,.7);fill.position.set(5,6,-7);scene.add(fill);
 const camera=new THREE.OrthographicCamera(-9,9,5,-5,.1,90);
 camera.position.set(10.4,14.5,17.6);camera.lookAt(0,.4,0);
 let zoom=1,activeArena=null,stage=null,humans=null,gorilla=null,sundries=null;
 let lastRender=0,lastSupplies=0,disposed=false;
 let lastSize={w:0,h:0};
 const events=[];
 const onWheel=e=>{e.preventDefault();zoom=clamp(zoom*(e.deltaY>0?1.085:.92),.82,1.6);requestDraw?.();};
 canvas.addEventListener('wheel',onWheel,{passive:false});
 events.push(['wheel',onWheel]);
 function resize(){
  const w=Math.max(400,canvas.width),h=Math.max(300,canvas.height);
  if(lastSize.w===w&&lastSize.h===h)return;
  const ratio=w/h,halfHeight=ratio>1.45?5.1:6.6;
  camera.left=-halfHeight*ratio;camera.right=halfHeight*ratio;
  camera.top=halfHeight;camera.bottom=-halfHeight;
  camera.updateProjectionMatrix();lastSize={w,h};
 }
 function clearArena(){
  if(stage){
   stage.traverse(o=>{if(o.geometry&&!Object.values(shared).includes(o.geometry))o.geometry.dispose();});
   scene.remove(stage);
  }
  if(humans)scene.remove(humans.root);
  if(gorilla)scene.remove(gorilla.root);
  if(sundries)scene.remove(sundries.root);
  stage=null;humans=null;gorilla=null;sundries=null;
 }
 function prepare(arena){
  clearArena();
  stage=new THREE.Group();scene.add(stage);
  // Build backdrop per arena; it is all real geometry rather than a flat plate.
  const world=new THREE.Group();stage.add(world);
  environment(world,arena);
  humans=makeHumans(stage);
  gorilla=makeGorilla(stage);
  sundries=makeSundries(stage);
  activeArena=arena;
  const c=terrainColors[arena]||terrainColors.selva;
  scene.background=new THREE.Color(c.fog);
  scene.fog=new THREE.FogExp2(c.fog,.018);
 }
 const onLost=e=>{e.preventDefault();onFailure?.(new Error('Se perdió el contexto WebGL 3D'))};
 canvas.addEventListener('webglcontextlost',onLost);events.push(['webglcontextlost',onLost]);
 function render(b){
  if(disposed)return false;
  if(b.arena!==activeArena)prepare(b.arena);
  resize();
  camera.zoom=1/zoom;camera.updateProjectionMatrix();
  const now=performance.now();
  // Cap 3D drawing at 30 FPS. Simulation and AI are still updated every frame
  // in battle.js, so this does not change any combat timers or rules.
  if(now-lastRender<32 && lastRender>0)return true;
  lastRender=now;
  humans.apply(b.hombres,b.transcurrido||0);
  gorilla.apply(b.gorila,b.transcurrido||0);
  if(now-lastSupplies>350){sundries.update(b);lastSupplies=now;}
  renderer.render(scene,camera);
  return true;
 }
 render.liberar=()=>{
  disposed=true;for(const [event,cb] of events)canvas.removeEventListener(event,cb);
  clearArena();renderer.dispose();
 };
 return render;
}


// Headless regression probe: validates actual geometry and 100 reusable human
// models without creating a browser, WebGL context or private image assets.
export function diagnostico_three(arena='selva'){
 const scene=new THREE.Scene();
 const env=environment(scene,arena);
 const people=makeHumans(scene);
 const gorilla=makeGorilla(scene);
 const actors=Array.from({length:100},(_,i)=>({
  id:i+1,x:80+i%10*82,y:80+Math.floor(i/10)*49,altura:0,
  arquetipo:Object.keys(outfits)[i%Object.keys(outfits).length],vida:20,
  estado:'normal',vx:12,vy:5
 }));
 people.apply(actors,1);
 gorilla.apply({x:500,y:320,radio:26,vida:650,movimiento:2,fase:'espera'},1);
 let realMeshes=0,instancedMeshes=0;
 scene.traverse(o=>{if(o.isMesh)realMeshes++;if(o.isInstancedMesh)instancedMeshes++;});
 return {
  arena,obstaculos:obstaculos_escena(arena).length,
  mallas:realMeshes,gruposInstanciados:instancedMeshes,
  humanos:actors.length,modelosGeneradosConGeometria:true,
  estilos:Object.keys(outfits).length,
  escenaActiva:Boolean(env.root&&people.root&&gorilla.root)
 };
}
