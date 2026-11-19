import { construirPiramides } from './arena-piramides.js';
import { construirCasasAntiguas } from './arena-casas.js';
import { construirCespedSelvatico } from './arena-cesped.js';
// First arena: beige weathered cobblestone pavement ONLY.
// Deliberately no GLB, trees, rocks, water, gameplay actors or UI geometry.
// Babylon.js is provided by index.html. Every stone has genuine bevelled 3D volume.
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const rand=n=>{const x=Math.sin(n*127.17+46.23)*43758.5453;return x-Math.floor(x)};
// Double width and depth => FOUR TIMES the paved area, without scaling stones.
// sqrt(2) per axis doubles the total surface without enlarging any stone.
const W=51*Math.SQRT2,D=34*Math.SQRT2,R=4.30;
// 3x3 grid: nine identical circular plazas symmetric around both axes.
const CIRCLES=[-1,0,1].flatMap(row=>[-1,0,1].map(col=>({x:col*W*.30,z:row*D*.30,r:R})));
const isInCircle=(x,z,padding=0)=>CIRCLES.some(c=>Math.hypot(x-c.x,z-c.z)<c.r+padding);
const TAU=Math.PI*2;

// Pure, testable authoring layout independent of GPU/browser.
export function crearPlanoAdoquines(){
 // Courses are laid all the way to each circle's perimeter. Trim stones
 // against the round masonry boundary instead of skipping entire tiles:
 // that skip was the cause of the beige empty bands in the screenshot.
 const stones=[],stepZ=.345,joint=.003;
 const rows=Math.ceil(D/stepZ);
 for(let row=0;row<rows;row++){
  const z=-D/2+(row+.5)*stepZ;
  const rowOffset=(row%2)*.19;
  let x=-W/2-.16-rowOffset,col=0;
  while(x<W/2){
   const id=row*1009+col+500;
   const width=.30+.23*rand(id*1.31);
   const a=Math.max(-W/2,x),b=Math.min(W/2,x+width);
   // Remove only the interior disk, not a whole rectangular stone.
   // Annular edge stones interlock with these clipped outer courses.
   let intervals=[[a,b]];
   for(const c of CIRCLES){
    if(Math.abs(z-c.z)>R+.275+stepZ/2)continue;
    // Cut at the course centre; edges are hand-fitted against the annular row.
    const dz=Math.abs(z-c.z);
    const half=Math.sqrt(Math.max(0,(R+.275)**2-dz*dz));
    const cutA=c.x-half,cutB=c.x+half;
    intervals=intervals.flatMap(([l,r])=>{
     if(r<=cutA||l>=cutB)return [[l,r]];
     const parts=[];
     if(cutA-l>.060)parts.push([l,cutA]);
     if(r-cutB>.060)parts.push([cutB,r]);
     return parts;
    });
   }
   for(let part=0;part<intervals.length;part++){
    const [l,r]=intervals[part],span=r-l;
    if(span<.065)continue;
    const h=stepZ-joint;
    stones.push({x:(l+r)/2,z,wx:span-joint,wz:h,
     angle:0,seed:id*3+part,circle:false,trimmed:span<width-.025});
   }
   x+=width+joint;col++;
  }
 }
 // Nine identical concentric cobbled courts, not flat decals.
 let rings=0;
 for(let plaza=0;plaza<CIRCLES.length;plaza++){
  const center=CIRCLES[plaza];
  stones.push({x:center.x,z:center.z,wx:.34,wz:.34,angle:0,
   seed:900001+plaza*1000000,circle:true,plaza});
  let localRings=0;
  for(let radius=.37;radius<R-.15;radius+=.355){
   const count=Math.max(9,Math.floor(TAU*radius/.395));
   const arc=TAU*radius/count;
   for(let i=0;i<count;i++){
    const theta=(i+(localRings%2)*.5)*TAU/count;
    const seed=100000+plaza*1000000+localRings*1000+i;
    stones.push({x:center.x+Math.cos(theta)*radius,
     z:center.z+Math.sin(theta)*radius,
     wx:Math.max(.18,arc-.003),wz:.354,
     angle:theta+Math.PI/2,seed,circle:true,ring:localRings,plaza});
   }
   localRings++;
  }
  // A hand-laid transition course bridges radial cobbles to straight rows.
  // The previous single thin circular row left a conspicuous empty moat.
  const radius=R+.085,n=Math.floor(TAU*radius/.393);
  for(let i=0;i<n;i++){
   const theta=i*TAU/n;
   stones.push({x:center.x+Math.cos(theta)*radius,
    z:center.z+Math.sin(theta)*radius,
    wx:TAU*radius/n-.003,wz:.37,angle:theta+Math.PI/2,
    seed:200000+plaza*1000000+i,circle:true,ring:localRings,plaza});
  }
  // Hand-fitted transition: narrow tapered and triangular wedges finish
  // the curved boundary where straight masonry courses cannot reach.
  // Two overlapping staggered rows eliminate the former circular white moat.
  for(let course=0;course<2;course++){
   const r=R+.36+course*.145;
   const count=Math.ceil(TAU*r/.24);
   for(let i=0;i<count;i++){
    const theta=TAU*(i+(course%2)*.5)/count;
    const seed=300000+plaza*1000000+course*1000+i;
    const arc=TAU*r/count;
    const taper=.28+.20*rand(seed+31);
    stones.push({x:center.x+Math.cos(theta)*r,
     z:center.z+Math.sin(theta)*r,
     wx:arc-.002,wz:.205,
     angle:theta+Math.PI/2,seed,circle:true,ring:localRings+course+1,plaza,
     // Polygonal hand-cut wedge, narrower at the outward end.
     polygon:[[-.5,-.5],[.5,-.5],[.5-taper,.5],[-.5+taper,.5]]
    });
   }
  }
  rings=Math.max(rings,localRings);
 }
 return {stones,outerWidth:W,outerDepth:D,circleRadius:R,rings,
  circles:CIRCLES.map(c=>({...c}))};
}
function stonePalette(seed,circle,ring){
 // Sandstone-beige surface, not a black albedo multiplied by dark vertex tones.
 const shades=[
  [.97,.92,.81],[.94,.88,.76],[.99,.95,.87],[.92,.86,.73],
  [.98,.91,.79],[.95,.93,.86],[.90,.85,.76],[.99,.94,.83]
 ];
 const color=shades[Math.floor(rand(seed*2.9)*shades.length)];
 const age=.97+.03*rand(seed+51);
 const ringTone=circle?(ring%4===0?.99:1):1;
 return color.map(x=>x*age*ringTone);
}
// Repeating rock microstructure: fine mineral inclusions, erosion, dirt
// and granular abrasion. UVs are world-space so the tile size never stretches.
function stoneGrain(B,scene){
 const n=512,tex=new B.DynamicTexture('Caliza erosionada · grano mineral',
  {width:n,height:n},scene,false);
 const ctx=tex.getContext(),pixels=ctx.createImageData(n,n);
 const smooth=t=>t*t*(3-2*t);
 const noise=(x,y)=>{
  const xx=Math.floor(x),yy=Math.floor(y),u=smooth(x-xx),v=smooth(y-yy);
  const c=(i,j)=>rand(i*173.31+j*83.37);
  const x0=c(xx,yy)*(1-u)+c(xx+1,yy)*u;
  const x1=c(xx,yy+1)*(1-u)+c(xx+1,yy+1)*u;
  return x0*(1-v)+x1*v;
 };
 for(let y=0;y<n;y++)for(let x=0;x<n;x++){
  const coarse=noise(x/62,y/62),grain=noise(x/10,y/10),micro=noise(x/2.5,y/2.5);
  const fine=rand(x*199+y*409),vein=Math.sin(x*.11+y*.17+coarse*7);
  const shade=clamp(.965+.018*coarse+.009*grain+.008*micro+.006*fine-.008*Math.max(0,vein),.94,1.02);
  const i=(y*n+x)*4;
  pixels.data[i]=clamp(255*shade,0,255);
  pixels.data[i+1]=clamp(254*shade,0,255);
  pixels.data[i+2]=clamp(250*shade,0,255);
  pixels.data[i+3]=255;
 }
 ctx.putImageData(pixels,0,0);tex.update();
 tex.wrapU=tex.wrapV=B.Texture.WRAP_ADDRESSMODE;
 tex.hasAlpha=false;
 return tex;
}
// Ortho view fits ALL four floor corners at any camera yaw and viewport ratio.
// Previously a hard-coded half-height clipped the plaza at certain angles.
export function calcularEncuadreArena(aspect,alpha,beta,width=W,depth=D){
 const ratio=Math.max(.4,aspect||1);
 const horizontal=.5*(width*Math.abs(Math.sin(alpha))+
  depth*Math.abs(Math.cos(alpha)));
 const vertical=.5*Math.abs(Math.cos(beta))*
  (width*Math.abs(Math.cos(alpha))+depth*Math.abs(Math.sin(alpha)));
 return (Math.max(vertical,horizontal/ratio)+.7)*1.12;
}
function buildPavement(B,scene){
 const layout=crearPlanoAdoquines();
 const positions=[],indices=[],colors=[],uvs=[];
 const sides=8;
 const push=(x,y,z,tint,light)=>{
  const index=positions.length/3;
  positions.push(x,y,z);
  colors.push(...tint.map(c=>clamp(c*light,0,1)),1);
  uvs.push(x/.65,z/.65);
  return index;
 };
 for(const s of layout.stones){
  // Triangular/trapezoidal hand-cut infill at the circle transition.
  // Polygon vertices are real meshes, not rectangles carrying a label.
  if(s.polygon){
   const ca=Math.cos(s.angle),sa=Math.sin(s.angle);
   const tint=stonePalette(s.seed,true,s.ring||0);
   const y=.047+(rand(s.seed+6)-.5)*.010;
   const contour=s.polygon.map(([px,pz])=>{
    const x=px*s.wx,z=pz*s.wz;
    return [s.x+x*ca-z*sa,s.z+x*sa+z*ca];
   });
   const top=[],base=[];
   for(const [x,z] of contour){
    top.push(push(x,y,z,tint,.98));
    base.push(push(x,-.022,z,tint,.90));
   }
   const mid=push(s.x,y+.002,s.z,tint,.99);
   for(let i=0;i<contour.length;i++){
    const j=(i+1)%contour.length;
    indices.push(mid,top[j],top[i]);
    indices.push(top[i],base[i],top[j],top[j],base[i],base[j]);
   }
   continue;
  }
  const hw=s.wx*.5,hz=s.wz*.5;
  const seed=s.seed,ca=Math.cos(s.angle),sa=Math.sin(s.angle);
  const base=(rand(seed+6)-.5)*.015,thick=.043+.024*rand(seed+71);
  const tint=stonePalette(seed,s.circle,s.ring||0);
  const count=12,corner=.10+.06*rand(seed+2);
  const outer=[],shoulder=[],crown=[],inner=[],foot=[];
  const tform=(px,pz)=>[s.x+px*ca-pz*sa,s.z+px*sa+pz*ca];
  const vertex=(px,pz,y,light,shade=1)=>{
   const [x,z]=tform(px,pz);
   return push(x,y,z,tint,light*shade);
  };
  // Genuine hand-chipped perimeter. Every stone has unique corner lengths,
  // damaged edges and locally variable elevation. Never a regular octagon.
  const corners=[
   [-hw*(1-corner),-hz], [0,-hz], [hw*(1-corner),-hz],
   [hw,-hz*(1-corner)], [hw,0],[hw,hz*(1-corner)],
   [hw*(1-corner),hz],[0,hz],[-hw*(1-corner),hz],
   [-hw,hz*(1-corner)],[-hw,0],[-hw,-hz*(1-corner)]
  ];
  const abrasion=.0015+.0025*rand(seed*2+7);
  for(let j=0;j<count;j++){
   const [xx,zz]=corners[j];
   const x=xx+(rand(seed*13+j*79)-.5)*.004;
   const z=zz+(rand(seed*29+j*41)-.5)*.004;
   const weather=rand(seed*3+j*17);
   const edgeY=base+.004+(weather-.5)*.013;
   const capY=base+thick+(rand(seed+j*37)-.5)*.015;
   foot.push(vertex(x,z,base-.037,.88));
   outer.push(vertex(x,z,edgeY,.93+.045*weather));
   shoulder.push(vertex(x*(1-abrasion/Math.max(hw,.1)),
    z*(1-abrasion/Math.max(hz,.1)),capY,
    .96+.035*rand(seed+j*19)));
   crown.push(vertex(x*.72,z*.72,capY+
    (rand(seed+j*47)-.5)*.021,.975+.025*rand(seed+j*59)));
   inner.push(vertex(x*.37,z*.37,capY+
    (rand(seed+j*61)-.5)*.028,.97+.03*rand(seed+j*67)));
  }
  // Rough, uneven top: concentric triangulation creates natural faceting
  // instead of one clean triangle-fan / smooth machined surface.
  const center=vertex(0,0,base+thick+
   (rand(seed+129)-.5)*.024,.98+.02*rand(seed+11));
  const rings=[foot,outer,shoulder,crown,inner];
  for(let k=0;k<rings.length-1;k++){
   const a=rings[k],b=rings[k+1];
   for(let j=0;j<count;j++){
    const next=(j+1)%count;
    indices.push(a[j],b[j],a[next],a[next],b[j],b[next]);
   }
  }
  for(let j=0;j<count;j++)indices.push(center,inner[(j+1)%count],inner[j]);
 }
 const normals=[];
 B.VertexData.ComputeNormals(positions,indices,normals);
 const cobbles=new B.Mesh('Mampostería de piedra caliza erosionada',scene);
 const vd=new B.VertexData();
 vd.positions=positions;vd.indices=indices;vd.normals=normals;
 vd.colors=colors;vd.uvs=uvs;vd.applyToMesh(cobbles);
 const stone=new B.StandardMaterial('Piedra beige, envejecida y mate',scene);
 stone.diffuseColor=B.Color3.White();
 // IMPORTANT: do not multiply beige vertex colors by a dark photograph.
 // The photographed surface is only a geometry reference. The lit stone
 // albedo stays beige, with subtle baked neutral mineral grain.
 const grain=stoneGrain(B,scene);
 stone.diffuseTexture=grain;
 stone.useVertexColors=true;
 stone.specularColor=new B.Color3(.035,.030,.023);
 stone.emissiveColor=new B.Color3(.24,.22,.19);
 stone.backFaceCulling=false;stone.alpha=1;
 stone.transparencyMode=B.Material.MATERIAL_OPAQUE;
 cobbles.material=stone;cobbles.receiveShadows=true;
 // Solid beige/grimy mortar below each joint: absolutely no transparency.
 const mortar=B.MeshBuilder.CreateGround('Mortero oscuro entre juntas',
  {width:W,height:D,subdivisions:1},scene);
 mortar.position.y=-.055;
 const mortarMat=new B.StandardMaterial('Mortero beige sucio',scene);
 mortarMat.diffuseColor=new B.Color3(.89,.84,.75);
 mortarMat.specularColor=B.Color3.Black();
 mortar.material=mortarMat;mortar.receiveShadows=true;
 // End-caps hide cracks outside of the playable square.
 return {stones:layout.stones.length,rings:layout.rings,mesh:cobbles};
}
// Distance is independent of orthographic zoom. It must exceed the full floor
// diagonal, otherwise Babylon clips the near half of the map as if cut off.
export const DISTANCIA_CAMARA_SEGURA=150;
export function crear_dibujante_babylon(canvas,requestDraw,onFailure){
 const B=window.BABYLON;
 if(!B?.Engine)throw new Error('Babylon.js no disponible');
 const engine=new B.Engine(canvas,true,{stencil:true,
  preserveDrawingBuffer:false,powerPreference:'high-performance'});
 engine.setHardwareScalingLevel(Math.max(1,(window.devicePixelRatio||1)/1.5));
 const scene=new B.Scene(engine);
 scene.clearColor=new B.Color4(.31,.29,.24,1);
 const camera=new B.ArcRotateCamera('Isométrica de adoquines',
  -Math.PI*.33,Math.PI*.29,DISTANCIA_CAMARA_SEGURA,new B.Vector3(0,0,0),scene);
 camera.mode=B.Camera.ORTHOGRAPHIC_CAMERA;
 camera.lowerBetaLimit=.22;camera.upperBetaLimit=1.10;
 camera.lowerRadiusLimit=DISTANCIA_CAMARA_SEGURA;
 camera.upperRadiusLimit=DISTANCIA_CAMARA_SEGURA;
 camera.minZ=.1;
 camera.maxZ=500;
 // Right-mouse drag pans the now larger plaza; left drag rotates it.
 camera.panningSensibility=110;camera.attachControl(canvas,true);
 camera.inputs.removeByType('ArcRotateCameraMouseWheelInput');
 const hemispheric=new B.HemisphericLight('Luz difusa cálida',
  new B.Vector3(.1,1,-.2),scene);
 hemispheric.intensity=1.18;hemispheric.groundColor=new B.Color3(.26,.23,.18);
 const sunlight=new B.DirectionalLight('Sol lateral de plaza',
  new B.Vector3(-.5,-1,.6),scene);
 sunlight.position=new B.Vector3(6,13,-8);sunlight.intensity=1.25;
 const art=buildPavement(B,scene);
 let pyramids={sites:[],complete:0,collapsed:0};
 try{
  pyramids=construirPiramides(B,scene,sunlight);
 }catch(error){
  // The cobbled floor is the approved baseline: an optional scenery error
  // must NEVER cause a fallback to the unrelated 2D combat game.
  console.error('No se pudieron construir las pirámides; se conserva el suelo 3D',error);
  onFailure?.(new Error('Fallo de pirámides; se mantiene el suelo de piedra: '+error.message));
 }
 // Independent small-scale ruins: six distinct ancient house floorplans.
 let houses={sites:[],stoneBlocks:0};
 try{
  houses=construirCasasAntiguas(B,scene);
 }catch(error){
  console.error('No se pudieron construir los restos de viviendas',error);
  onFailure?.(new Error('Fallo de restos de viviendas: '+error.message));
 }
 // 40% of the TOTAL surface area, not 40% per stone, nor a sum of
 // overlapping grass patches. The original paving geometry is untouched.
 let grass={globalCoverage:0,tufts:0};
 try{
  const vegetation=construirCespedSelvatico(B,scene,crearPlanoAdoquines(),{
   pyramids:pyramids.sites,houses:houses.sites
  });
  grass={globalCoverage:vegetation.globalCoverage,
   tufts:vegetation.grass.tufts};
 }catch(error){
  console.error('No se pudo construir el césped selvático',error);
  onFailure?.(new Error('Fallo de vegetación: '+error.message));
 }
 let disposed=false,lastW=0,lastH=0,zoom=1;
 const originalTarget=new B.Vector3(0,0,0);
 // A Babylon orthographic camera must use the physical drawing-buffer aspect,
 // not an assumed CSS aspect (the legacy game used a fixed 1000×640 canvas).
 // Project the FOUR physical floor corners through the actual view matrix:
 // this is more reliable than trigonometric guesses at any camera rotation.
 function resize(){
  const bounds=canvas.getBoundingClientRect();
  const width=Math.max(1,Math.round(bounds.width));
  const height=Math.max(1,Math.round(bounds.height));
  if(lastW!==width||lastH!==height){
   lastW=width;lastH=height;engine.resize();
  }
  const aspect=engine.getRenderWidth()/Math.max(1,engine.getRenderHeight());
  // Never allow the camera to approach the huge ground mesh as zoom changes.
  camera.radius=DISTANCIA_CAMARA_SEGURA;
  if(zoom>=1){
   camera.target.copyFrom(originalTarget);
  }else{
   camera.target.x=clamp(camera.target.x,-W*.39,W*.39);
   camera.target.z=clamp(camera.target.z,-D*.39,D*.39);
   camera.target.y=0;
  }
  const matrix=camera.getViewMatrix();
  let maxX=0,maxY=0;
  const project=(x,y,z)=>{
   const p=B.Vector3.TransformCoordinates(new B.Vector3(x,y,z),matrix);
   maxX=Math.max(maxX,Math.abs(p.x));
   maxY=Math.max(maxY,Math.abs(p.y));
  };
  for(const x of [-W/2,W/2])
   for(const z of [-D/2,D/2])project(x,0,z);
  // Pyramid roofs rise above the floor plane: include their actual 3D
  // bounding corners in the framing calculation at every orbit angle.
  for(const temple of pyramids.sites){
   const h=temple.height+1.1;
   for(const dx of [-temple.size/2,temple.size/2])
    for(const dz of [-temple.size/2,temple.size/2]){
     project(temple.x+dx,0,temple.z+dz);
     project(temple.x+dx,h,temple.z+dz);
    }
  }
  // Small human-scale ruins also stay visible at extreme isometric angles.
  for(const house of houses.sites){
   const radius=house.footprintRadius+.3;
   for(const dx of [-radius,radius])
    for(const dz of [-radius,radius]){
     project(house.x+dx,0,house.z+dz);
     project(house.x+dx,house.height*house.scale+.2,house.z+dz);
    }
  }
  // Extra 17% prevents the bevelled stone boundary from touching the edge.
  const v=Math.max(maxY,maxX/aspect)*1.17*zoom;
  camera.orthoTop=v;camera.orthoBottom=-v;
  camera.orthoLeft=-v*aspect;camera.orthoRight=v*aspect;
 }
 // CSS layout can settle AFTER the Babylon engine is created; observe it.
 const observer=typeof ResizeObserver!=='undefined'
  ?new ResizeObserver(()=>{if(!disposed)resize();}):null;
 observer?.observe(canvas);
 const onWheel=e=>{
  e.preventDefault();
  zoom=clamp(zoom*Math.exp(e.deltaY*.0012),.22,2.6);
  resize();requestDraw?.();
 };
 canvas.addEventListener('wheel',onWheel,{passive:false});
 const onResize=()=>resize();
 const resetView=()=>{
  camera.target.copyFrom(originalTarget);
  zoom=1;
  camera.radius=DISTANCIA_CAMARA_SEGURA;
  camera.alpha=-Math.PI*.33;camera.beta=Math.PI*.29;
  resize();requestDraw?.();
 };
 // Double click restores the complete symmetrical arena if the user zooms/pans.
 canvas.addEventListener('dblclick',resetView);
 canvas.addEventListener('contextmenu',e=>e.preventDefault());
 window.addEventListener('resize',onResize);
 engine.runRenderLoop(()=>{if(disposed)return;resize();scene.render();});
 const render=()=>!disposed;
 render.liberar=()=>{
  disposed=true;window.removeEventListener('resize',onResize);
  observer?.disconnect();
  canvas.removeEventListener('wheel',onWheel);
  canvas.removeEventListener('dblclick',resetView);
  camera.detachControl(canvas);engine.stopRenderLoop();
  scene.dispose();engine.dispose();
 };
 render.diagnostico=()=>({motor:'Babylon.js',escena:'adoquines beige',
  piedras:art.stones,anillos:art.rings,circulos:CIRCLES.length,piramides:pyramids.sites.length,conservadas:pyramids.complete,derrumbadas:pyramids.collapsed,casas:houses.sites.length,coberturaCespedGlobal:grass.globalCoverage,mechonesCesped:grass.tufts,ancho:W,profundidad:D,distanciaCamara:camera.radius,zoom,actores:0,decoracion:0});
 return render;
}
