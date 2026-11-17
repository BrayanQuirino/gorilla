// Four small ancient stone house corners at human scale.
// The 40 m pyramid reference makes a 4–5 m surviving wall about 0.45–0.58
// Babylon world units: deliberately far smaller than a 4–5 unit pyramid.
const random=n=>{const x=Math.sin(n*127.17+46.23)*43758.5453;return x-Math.floor(x);};
export const METROS_POR_UNIDAD=40/4.76;
const CASAS=[
 {x:-9.6,z:-7.4,angle:.26,lengthX:2.05,lengthZ:1.85,height:.56,damage:.49},
 {x:11.0,z:-6.8,angle:-.38,lengthX:1.83,lengthZ:2.19,height:.47,damage:.67},
 {x:-29.0,z:7.0,angle:.63,lengthX:2.23,lengthZ:1.96,height:.59,damage:.38},
 {x:31.0,z:-9.3,angle:-.17,lengthX:1.91,lengthZ:2.21,height:.50,damage:.60}
];
export function planoCasasAntiguas(){
 return CASAS.map((site,i)=>({...site,id:i,
  heightMetros:Math.round(site.height*METROS_POR_UNIDAD*10)/10}));
}

function palette(B,scene){
 const colors=['#d6c7ab','#e0d3b9','#c4b79f','#d9cfb9','#cdbfa7','#bcae94'];
 return colors.map((hex,i)=>{
  const mat=new B.StandardMaterial('Muro antiguo · caliza '+i,scene);
  mat.diffuseColor=B.Color3.FromHexString(hex);
  mat.specularColor=new B.Color3(.014,.013,.01);
  mat.backFaceCulling=false;mat.alpha=1;
  return mat;
 });
}
function brick(B,scene,node,name,x,y,z,w,h,d,material,turn=0){
 const mesh=B.MeshBuilder.CreateBox(name,{width:w,height:h,depth:d},scene);
 mesh.parent=node;mesh.position.set(x,y,z);
 mesh.rotation.y=turn;
 mesh.material=material;mesh.receiveShadows=true;
 return mesh;
}
function wall(B,scene,node,site,axis,materials){
 const isX=axis==='x';
 const length=isX?site.lengthX:site.lengthZ;
 const blockW=.26;
 const courseH=.11;
 const count=Math.ceil(site.height/courseH);
 const segments=Math.ceil(length/blockW);
 const isDamaged=!isX;
 let built=0;
 // Each wall starts at the same corner (0,0), making a recognizable 'L'.
 // A winding line of individual weathered masonry blocks forms its jagged top.
 for(let course=0;course<count;course++){
  const bottom=course*courseH;
  const blockHeight=Math.min(courseH,site.height-bottom);
  const offset=(course%2)*blockW*.47;
  for(let n=0;n<segments;n++){
   const run=n*blockW-offset;
   const left=Math.max(0,run);
   const right=Math.min(length,run+blockW);
   if(right-left<.055)continue;
   const center=(left+right)/2;
   const t=center/length;
   const seed=site.id*997+course*83+n*17+(isX?0:503);
   // Second wall progressively collapses away from the corner, with
   // a highly irregular skyline, actual missing stones, not a clean cut.
   const surviving=site.height*(
     isDamaged ? Math.max(.14,1-t*(.70+site.damage*.48)+
       (random(site.id*31+n*9)-.5)*.22)
       : .82+.18*random(site.id*57+n*13));
   if(bottom>surviving)continue;
   if(isDamaged && t>.28 && course>=2 &&
      random(seed*4)<site.damage*.19)continue;
   const irregular=(random(seed)-.5)*.015;
   const width=right-left-.005;
   const depth=.16+(random(seed+7)-.5)*.026;
   const x=isX?center:0;
   const z=isX?0:center;
   brick(B,scene,node,
     (isDamaged?'Muro colapsado':'Muro conservado')+' · sillar',
     x+(isX?irregular:0),bottom+blockHeight/2+.008,
     z+(isX?0:irregular),isX?width:depth,blockHeight-.003,
     isX?depth:width,materials[Math.floor(random(seed+49)*materials.length)],
     (random(seed+101)-.5)*.025);
   built++;
  }
 }
 return built;
}
function rubble(B,scene,node,site,materials){
 const count=11+Math.round(site.damage*24);
 for(let i=0;i<count;i++){
  const seed=site.id*1397+i*73;
  // Irregular clusters along the broken wall, not around the intact one.
  const t=.25+.77*random(seed);
  const dist=.16+(random(seed+7)-.5)*.48;
  const x=dist, z=Math.min(site.lengthZ+.32,t*site.lengthZ);
  const w=.06+.13*random(seed+17);
  const h=.035+.065*random(seed+23);
  const d=.07+.15*random(seed+37);
  const mesh=brick(B,scene,node,'Escombro de vivienda antigua',
   x,h/2+.005,z,w,h,d,
   materials[Math.floor(random(seed+63)*materials.length)],
   random(seed+31)*Math.PI*2);
  mesh.rotation.x=(random(seed+41)-.5)*.6;
  mesh.rotation.z=(random(seed+43)-.5)*.6;
 }
}
export function construirCasasAntiguas(B,scene){
 const mats=palette(B,scene);
 const root=new B.TransformNode('Cuatro restos de viviendas antiguas',scene);
 const sites=planoCasasAntiguas();
 let stoneBlocks=0;
 for(const site of sites){
  const node=new B.TransformNode('Casa en ruinas · '+(site.id+1),scene);
  node.parent=root;node.position.set(site.x,0,site.z);
  node.rotation.y=site.angle;
  // Small foundation traces suggest the house's former footprint.
  for(const axis of ['x','z']){
   const isX=axis==='x';
   brick(B,scene,node,'Cimentación de casa',
    isX?site.lengthX*.5:0,.035,isX?0:site.lengthZ*.5,
    isX?site.lengthX:.20,.07,isX?.20:site.lengthZ,mats[(site.id+4)%mats.length]);
  }
  stoneBlocks+=wall(B,scene,node,site,'x',mats);
  stoneBlocks+=wall(B,scene,node,site,'z',mats);
  rubble(B,scene,node,site,mats);
 }
 return {root,sites,stoneBlocks};
}
