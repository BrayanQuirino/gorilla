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
 const stones=[],stepX=.43,stepZ=.37;
 const rows=Math.ceil(D/stepZ),columns=Math.ceil(W/stepX);
 for(let row=0;row<rows;row++){
  const z=-D/2+(row+.5)*stepZ;
  for(let col=-1;col<=columns;col++){
   const x=-W/2+(col+.5+(row%2)*.5)*stepX;
   if(Math.abs(x)>W/2-.16)continue;
   // Circular plaza is reserved for actual concentric masonry.
   if(isInCircle(x,z,.24))continue;
   const id=row*503+col+500;
   stones.push({x,z,wx:.38*(.91+.13*rand(id)),wz:.325*(.90+.17*rand(id+12)),
    angle:(rand(id+7)-.5)*.045,seed:id,circle:false});
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
 const age=.81+.24*rand(seed+51);
 const ringTone=circle?(ring%4===0?.92:1):1;
 return color.map(x=>x*age*ringTone);
}
// Repeating rock microstructure: fine mineral inclusions, erosion, dirt
// and granular abrasion. UVs are world-space so the tile size never stretches.
function stoneGrain(B,scene){
 const n=256,tex=new B.DynamicTexture('Caliza erosionada · grano mineral',
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
  const coarse=noise(x/38,y/38),grain=noise(x/8,y/8);
  const fine=rand(x*199+y*409),vein=Math.sin(x*.11+y*.17+coarse*7);
  const shade=clamp(.77+.22*coarse+.13*grain+.075*fine-.045*Math.max(0,vein),.57,1.11);
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
function buildPavement(B,scene){
 const layout=crearPlanoAdoquines();
 const positions=[],indices=[],colors=[],uvs=[];
 const sides=8;
 const push=(x,y,z,tint,light)=>{
  const index=positions.length/3;
  positions.push(x,y,z);
  colors.push(...tint.map(c=>clamp(c*light,0,1)),1);
  uvs.push(x/2.3,z/2.3);
  return index;
 };
 for(const s of layout.stones){
  const rim=[],bevels=[],bottom=[];
  const hw=s.wx*.5,hz=s.wz*.5;
  const corner=Math.min(hw,hz)*(.34+.13*rand(s.seed+2));
  const round=[
   [-hw+corner,-hz], [0,-hz], [hw-corner,-hz],
   [hw,-hz+corner], [hw,0], [hw,hz-corner],
   [hw-corner,hz], [0,hz], [-hw+corner,hz],
   [-hw,hz-corner],[-hw,0],[-hw,-hz+corner]
  ];
  const ca=Math.cos(s.angle),sa=Math.sin(s.angle);
  const baseY=(rand(s.seed+6)-.5)*.012;
  const thickness=.035+.023*rand(s.seed+71);
  const tint=stonePalette(s.seed,s.circle,s.ring||0);
  const wear=.015+.015*rand(s.seed+4);
  const interior=[];
  const transform=(px,pz)=>[
   s.x+px*ca-pz*sa,
   s.z+px*sa+pz*ca
  ];
  for(let j=0;j<round.length;j++){
   const p=round[j];
   const jitter=(rand(s.seed*7+j*29)-.5)*.018;
   const px=p[0]+jitter*(j%3?1:-1);
   const pz=p[1]+(rand(s.seed+j*53)-.5)*.014;
   const edgeLevel=baseY+.005+(rand(s.seed+j*41)-.5)*.010;
   const topLevel=baseY+thickness+(rand(s.seed+j*67)-.5)*.012;
   const [rx,rz]=transform(px,pz);
   const [ix,iz]=transform(px*(1-wear/Math.max(hw,.1)),pz*(1-wear/Math.max(hz,.1)));
   rim.push(push(rx,edgeLevel,rz,tint,.65+.12*rand(s.seed+j)));
   bevels.push(push(ix,topLevel,iz,tint,.91+.13*rand(s.seed+j*31)));
   bottom.push(push(rx,baseY-.026,rz,tint,.52));
  }
  // Uneven worn top with a subtle geological ridge rather than a flat polygon.
  const centerTint=.92+.12*rand(s.seed+103);
  const mid=push(s.x,baseY+thickness+(rand(s.seed+131)-.5)*.018,
   s.z,tint,centerTint);
  for(let j=0;j<round.length;j++){
   const next=(j+1)%round.length;
   indices.push(mid,bevels[j],bevels[next]);
   indices.push(bevels[j],rim[j],bevels[next],
    bevels[next],rim[j],rim[next]);
   indices.push(rim[j],bottom[j],rim[next],
    rim[next],bottom[j],bottom[next]);
  }
 }
 const normals=[];
 B.VertexData.ComputeNormals(positions,indices,normals);
 const cobbles=new B.Mesh('Adoquines redondeados de piedra real',scene);
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
 function resize(){
  const w=canvas.clientWidth||canvas.width,h=canvas.clientHeight||canvas.height;
  if(lastW!==w||lastH!==h){lastW=w;lastH=h;engine.resize();}
  const aspect=engine.getRenderWidth()/Math.max(1,engine.getRenderHeight());
  // Frame the expanded arena at startup; zoom changes projection extents.
  const v=30.6*(camera.radius/24);
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
 window.addEventListener('resize',onResize);
 engine.runRenderLoop(()=>{if(disposed)return;resize();scene.render();});
 const render=()=>!disposed;
 render.liberar=()=>{
  disposed=true;window.removeEventListener('resize',onResize);
  canvas.removeEventListener('wheel',onWheel);
  camera.detachControl(canvas);engine.stopRenderLoop();
  scene.dispose();engine.dispose();
 };
 render.diagnostico=()=>({motor:'Babylon.js',escena:'adoquines beige',
  piedras:art.stones,anillos:art.rings,circulos:CIRCLES.length,ancho:W,profundidad:D,actores:0,decoracion:0});
 return render;
}
