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
 // Unequal hand-laid masonry courses: each row has a different run of
 // short and long stones instead of identical rounded rectangles on a grid.
 // The reference photo is used for form/material direction, not as a texture.
 const stones=[],stepZ=.36;
 const rows=Math.ceil(D/stepZ);
 for(let row=0;row<rows;row++){
  const z=-D/2+(row+.5)*stepZ;
  const rowOffset=(row%2)*.18;
  let x=-W/2+.14-rowOffset,col=0;
  while(x<W/2-.12){
   const id=row*1009+col+500;
   const width=.28+.26*rand(id*1.31);
   const gap=.020+.032*rand(id+19);
   const cx=x+width/2;
   const height=.285+.085*rand(row*23+col*2);
   // Leave the same exact nine clear circle footprints and all symmetries.
   if(cx<W/2-.09&&!isInCircle(cx,z,.36))
    stones.push({x:cx,z,wx:width,wz:height,
     angle:(rand(id+7)-.5)*.085,seed:id,circle:false});
   x+=width+gap;col++;
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
     wx:Math.max(.18,arc-.047),wz:.318,
     angle:theta+Math.PI/2,seed,circle:true,ring:localRings,plaza});
   }
   localRings++;
  }
  const radius=R-.10,n=Math.floor(TAU*radius/.34);
  for(let i=0;i<n;i++){
   const theta=i*TAU/n;
   stones.push({x:center.x+Math.cos(theta)*radius,
    z:center.z+Math.sin(theta)*radius,
    wx:TAU*radius/n-.028,wz:.19,angle:theta+Math.PI/2,
    seed:200000+plaza*1000000+i,circle:true,ring:localRings,plaza});
  }
  rings=Math.max(rings,localRings);
 }
 return {stones,outerWidth:W,outerDepth:D,circleRadius:R,rings,
  circles:CIRCLES.map(c=>({...c}))};
}
function stonePalette(seed,circle,ring){
 // Weathered limestone: sandstone beige, grey mineral veins and old soot.
 const shades=[
  [.67,.61,.49],[.57,.53,.44],[.74,.68,.55],[.65,.59,.48],
  [.52,.50,.45],[.75,.69,.57],[.60,.56,.46],[.70,.64,.51]
 ];
 const color=shades[Math.floor(rand(seed*2.9)*shades.length)];
 const age=.73+.31*rand(seed+51);
 const ringTone=circle?(ring%4===0?.94:1):1;
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
  const shade=clamp(.55+.36*coarse+.15*grain+.09*micro+.10*fine-.13*Math.max(0,vein),.36,1.10);
  const i=(y*n+x)*4;
  pixels.data[i]=clamp(255*shade,0,255);
  pixels.data[i+1]=clamp(249*shade,0,255);
  pixels.data[i+2]=clamp(235*shade,0,255);
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
  const hw=s.wx*.5,hz=s.wz*.5;
  const seed=s.seed,ca=Math.cos(s.angle),sa=Math.sin(s.angle);
  const base=(rand(seed+6)-.5)*.015,thick=.043+.024*rand(seed+71);
  const tint=stonePalette(seed,s.circle,s.ring||0);
  const count=12,corner=.25+.15*rand(seed+2);
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
  const abrasion=.012+.025*rand(seed*2+7);
  for(let j=0;j<count;j++){
   const [xx,zz]=corners[j];
   const x=xx+(rand(seed*13+j*79)-.5)*.038;
   const z=zz+(rand(seed*29+j*41)-.5)*.033;
   const weather=rand(seed*3+j*17);
   const edgeY=base+.004+(weather-.5)*.013;
   const capY=base+thick+(rand(seed+j*37)-.5)*.015;
   foot.push(vertex(x,z,base-.037,.39));
   outer.push(vertex(x,z,edgeY,.48+.24*weather));
   shoulder.push(vertex(x*(1-abrasion/Math.max(hw,.1)),
    z*(1-abrasion/Math.max(hz,.1)),capY,
    .72+.16*rand(seed+j*19)));
   crown.push(vertex(x*.72,z*.72,capY+
    (rand(seed+j*47)-.5)*.021,.78+.20*rand(seed+j*59)));
   inner.push(vertex(x*.37,z*.37,capY+
    (rand(seed+j*61)-.5)*.028,.71+.26*rand(seed+j*67)));
  }
  // Rough, uneven top: concentric triangulation creates natural faceting
  // instead of one clean triangle-fan / smooth machined surface.
  const center=vertex(0,0,base+thick+
   (rand(seed+129)-.5)*.024,.84+.13*rand(seed+11));
  const rings=[foot,outer,shoulder,crown,inner];
  for(let k=0;k<rings.length-1;k++){
   const a=rings[k],b=rings[k+1];
   for(let j=0;j<count;j++){
    const next=(j+1)%count;
    indices.push(a[j],b[j],a[next],a[next],b[j],b[next]);
   }
  }
  for(let j=0;j<count;j++)indices.push(center,inner[j],inner[(j+1)%count]);
 }
 const normals=[];
 B.VertexData.ComputeNormals(positions,indices,normals);
 const cobbles=new B.Mesh('Mampostería de piedra caliza erosionada',scene);
 const vd=new B.VertexData();
 vd.positions=positions;vd.indices=indices;vd.normals=normals;
 vd.colors=colors;vd.uvs=uvs;vd.applyToMesh(cobbles);
 const stone=new B.StandardMaterial('Piedra beige, envejecida y mate',scene);
 stone.diffuseColor=B.Color3.White();
 stone.diffuseTexture=stoneGrain(B,scene);
 stone.useVertexColors=true;
 stone.specularColor=new B.Color3(.035,.030,.023);
 stone.backFaceCulling=false;stone.alpha=1;
 stone.transparencyMode=B.Material.MATERIAL_OPAQUE;
 cobbles.material=stone;cobbles.receiveShadows=true;
 // Solid beige/grimy mortar below each joint: absolutely no transparency.
 const mortar=B.MeshBuilder.CreateGround('Mortero oscuro entre juntas',
  {width:W,height:D,subdivisions:1},scene);
 mortar.position.y=-.055;
 const mortarMat=new B.StandardMaterial('Mortero beige sucio',scene);
 mortarMat.diffuseColor=new B.Color3(.35,.305,.235);
 mortarMat.specularColor=B.Color3.Black();
 mortar.material=mortarMat;mortar.receiveShadows=true;
 // End-caps hide cracks outside of the playable square.
 return {stones:layout.stones.length,rings:layout.rings,mesh:cobbles};
}
export function crear_dibujante_babylon(canvas,requestDraw,onFailure){
 const B=window.BABYLON;
 if(!B?.Engine)throw new Error('Babylon.js no disponible');
 const engine=new B.Engine(canvas,true,{stencil:true,
  preserveDrawingBuffer:false,powerPreference:'high-performance'});
 engine.setHardwareScalingLevel(Math.max(1,(window.devicePixelRatio||1)/1.5));
 const scene=new B.Scene(engine);
 scene.clearColor=new B.Color4(.31,.29,.24,1);
 const camera=new B.ArcRotateCamera('Isométrica de adoquines',
  -Math.PI*.33,Math.PI*.29,24,new B.Vector3(0,0,0),scene);
 camera.mode=B.Camera.ORTHOGRAPHIC_CAMERA;
 camera.lowerBetaLimit=.22;camera.upperBetaLimit=1.10;
 camera.lowerRadiusLimit=5;camera.upperRadiusLimit=64;
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
 let disposed=false,lastW=0,lastH=0;
 const originalTarget=new B.Vector3(0,0,0);
 function resize(){
  const w=canvas.clientWidth||canvas.width,h=canvas.clientHeight||canvas.height;
  if(lastW!==w||lastH!==h){lastW=w;lastH=h;engine.resize();}
  const aspect=engine.getRenderWidth()/Math.max(1,engine.getRenderHeight());
  // Rotating a non-square floor changes its screen-space bounding rectangle.
  // Re-fit every frame, instead of assuming a constant vertical extent.
  const fit=calcularEncuadreArena(aspect,camera.alpha,camera.beta);
  if(camera.radius>=24)camera.target.copyFrom(originalTarget);
  else{
   camera.target.x=clamp(camera.target.x,-W*.39,W*.39);
   camera.target.z=clamp(camera.target.z,-D*.39,D*.39);
   camera.target.y=0;
  }
  const v=fit*(camera.radius/24);
  camera.orthoTop=v;camera.orthoBottom=-v;
  camera.orthoLeft=-v*aspect;camera.orthoRight=v*aspect;
 }
 const onWheel=e=>{
  e.preventDefault();
  camera.radius=clamp(camera.radius*Math.exp(e.deltaY*.0012),5,64);
  resize();requestDraw?.();
 };
 canvas.addEventListener('wheel',onWheel,{passive:false});
 const onResize=()=>resize();
 const resetView=()=>{
  camera.target.copyFrom(originalTarget);
  camera.radius=24;
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
  canvas.removeEventListener('wheel',onWheel);
  canvas.removeEventListener('dblclick',resetView);
  camera.detachControl(canvas);engine.stopRenderLoop();
  scene.dispose();engine.dispose();
 };
 render.diagnostico=()=>({motor:'Babylon.js',escena:'adoquines beige',
  piedras:art.stones,anillos:art.rings,circulos:CIRCLES.length,ancho:W,profundidad:D,actores:0,decoracion:0});
 return render;
}
