// First arena: beige weathered cobblestone pavement ONLY.
// Deliberately no GLB, trees, rocks, water, gameplay actors or UI geometry.
// Babylon.js is provided by index.html. Every stone has genuine bevelled 3D volume.
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const rand=n=>{const x=Math.sin(n*127.17+46.23)*43758.5453;return x-Math.floor(x)};
// Double width and depth => FOUR TIMES the paved area, without scaling stones.
const W=51,D=34,R=4.30;
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
   if(Math.hypot(x,z)<R+.21)continue;
   const id=row*503+col+500;
   stones.push({x,z,wx:.38*(.91+.13*rand(id)),wz:.325*(.90+.17*rand(id+12)),
    angle:(rand(id+7)-.5)*.045,seed:id,circle:false});
  }
 }
 // Central circle is composed of tangentially laid stones; not a painted decal.
 stones.push({x:0,z:0,wx:.34,wz:.34,angle:0,seed:900001,circle:true});
 let rings=0;
 for(let radius=.37;radius<R-.15;radius+=.355){
  const count=Math.max(9,Math.floor(TAU*radius/.395));
  const arc=TAU*radius/count;
  for(let i=0;i<count;i++){
   const theta=(i+(rings%2)*.5)*TAU/count;
   const seed=100000+rings*1000+i;
   stones.push({x:Math.cos(theta)*radius,z:Math.sin(theta)*radius,
    wx:Math.max(.18,arc-.047),wz:.318,
    angle:theta+Math.PI/2,seed,circle:true,ring:rings});
  }
  rings++;
 }
 // A continuous circular course makes its silhouette apparent from above.
 const radius=R-.10,n=Math.floor(TAU*radius/.34);
 for(let i=0;i<n;i++){
  const theta=i*TAU/n;
  stones.push({x:Math.cos(theta)*radius,z:Math.sin(theta)*radius,
   wx:TAU*radius/n-.028,wz:.19,angle:theta+Math.PI/2,
   seed:200000+i,circle:true,ring:rings});
 }
 return {stones,outerWidth:W,outerDepth:D,circleRadius:R,rings};
}
function stonePalette(seed,circle,ring){
 // Warm sandstones, darkened by decades of soot, rain and earth.
 const shades=[
  [.68,.60,.45],[.60,.53,.40],[.75,.67,.53],[.65,.56,.43],
  [.54,.49,.39],[.79,.70,.54],[.62,.57,.45],[.70,.62,.47]
 ];
 const color=shades[Math.floor(rand(seed*2.9)*shades.length)];
 const age=.87+.15*rand(seed+51);
 const center=circle?(ring%4===0?.95:1):1;
 return color.map(x=>x*age*center);
}
function buildPavement(B,scene){
 const layout=crearPlanoAdoquines();
 const positions=[],indices=[],colors=[],uvs=[];
 const sides=8;
 const push=(x,y,z,tint,light)=>{
  const index=positions.length/3;
  positions.push(x,y,z);
  colors.push(...tint.map(c=>clamp(c*light,0,1)),1);
  uvs.push(x/4,z/4);
  return index;
 };
 for(const s of layout.stones){
  const corners=[],inset=[],bottom=[];
  const hw=s.wx/2,hz=s.wz/2;
  const cornerRadius=Math.min(hw,hz)*(.38+.13*rand(s.seed+2));
  const bevel=.022+.014*rand(s.seed+41);
  // Octagonal footprint makes small rectangular cobbles visibly rounded.
  const outline=[
   [-hw+cornerRadius,-hz],[hw-cornerRadius,-hz],
   [hw,-hz+cornerRadius],[hw,hz-cornerRadius],
   [hw-cornerRadius,hz],[-hw+cornerRadius,hz],
   [-hw,hz-cornerRadius],[-hw,-hz+cornerRadius]
  ];
  const ca=Math.cos(s.angle),sa=Math.sin(s.angle);
  const baseY=.002+(rand(s.seed+6)-.5)*.007;
  const thickness=.046+.018*rand(s.seed+71);
  const tint=stonePalette(s.seed,s.circle,s.ring||0);
  function vertex(px,pz,y,scale,light){
   const xx=px*scale,zz=pz*scale;
   return push(s.x+xx*ca-zz*sa,y,s.z+xx*sa+zz*ca,tint,light);
  }
  for(const [x,z] of outline){
   corners.push(vertex(x,z,baseY+.007,1,.67));
   inset.push(vertex(x,z,baseY+thickness,1-bevel/Math.max(hw,hz),.96+
    .055*rand(s.seed+x*173+z*11)));
   bottom.push(vertex(x,z,baseY-.028,1,.49));
  }
  const mid=push(s.x,baseY+thickness+.001,s.z,tint,1.04);
  for(let j=0;j<sides;j++){
   const k=(j+1)%sides;
   // Upper top face, chiselled shoulder and darker joint walls.
   indices.push(mid,inset[j],inset[k]);
   indices.push(inset[j],corners[j],inset[k],inset[k],corners[j],corners[k]);
   indices.push(corners[j],bottom[j],corners[k],corners[k],bottom[j],bottom[k]);
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
  const v=21.25*(camera.radius/24);
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
  piedras:art.stones,anillos:art.rings,ancho:W,profundidad:D,actores:0,decoracion:0});
 return render;
}
