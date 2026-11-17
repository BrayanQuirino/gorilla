// Stone architecture layer for Babylon.js arena.
// Geometry stays independent of the cobbled floor and the combat simulation.
// Three intact step pyramids and three partially collapsed temples.
const rnd=n=>{const x=Math.sin(n*127.17+46.23)*43758.5453;return x-Math.floor(x)};
const stoneColors=['#cec1a5','#d8cbb0','#b9ab90','#e1d3b7','#c4b69c','#a99f89'];
const SITES=[
 {x:-31.0,z:-18.8,size:7.0,levels:7,ruined:false,angle:.04},
 {x:31.0,z:-18.8,size:6.6,levels:7,ruined:true,angle:-.06},
 {x:-31.0,z:18.8,size:6.8,levels:7,ruined:true,angle:-.05},
 {x:31.0,z:18.8,size:7.0,levels:7,ruined:false,angle:.07},
 {x:-31.0,z:0,size:6.0,levels:6,ruined:true,angle:.08},
 {x:31.0,z:0,size:6.0,levels:6,ruined:false,angle:-.08}
];
export function planoPiramides(){
 return SITES.map((site,i)=>({...site,id:i,
  height:site.levels*.53+(site.ruined?0:1.05)}));
}
function rockTexture(B,scene){
 const size=256;
 const tex=new B.DynamicTexture('Limestone temple · mineral grain',
  {width:size,height:size},scene,false);
 const ctx=tex.getContext(),img=ctx.createImageData(size,size);
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const micro=rnd(x*111+y*371),vein=Math.sin(x*.14+y*.07+
    Math.sin(y*.028)*2),stain=rnd(Math.floor(x/23)*47+Math.floor(y/17)*89);
  const v=Math.min(1.13,Math.max(.66,.83+.13*micro+.06*stain-.04*Math.max(0,vein)));
  const idx=(y*size+x)*4;
  img.data[idx]=Math.round(250*v);
  img.data[idx+1]=Math.round(246*v);
  img.data[idx+2]=Math.round(235*v);
  img.data[idx+3]=255;
 }
 ctx.putImageData(img,0,0);tex.update();
 tex.wrapU=tex.wrapV=B.Texture.WRAP_ADDRESSMODE;tex.hasAlpha=false;
 return tex;
}
function materials(B,scene){
 const texture=rockTexture(B,scene);
 return stoneColors.map((color,i)=>{
  const mat=new B.StandardMaterial('Piedra antigua '+i,scene);
  mat.diffuseColor=B.Color3.FromHexString(color);
  mat.diffuseTexture=texture;
  mat.specularColor=new B.Color3(.025,.024,.02);
  mat.emissiveColor=new B.Color3(.055,.047,.034);
  mat.backFaceCulling=false;
  return mat;
 });
}
function box(B,scene,parent,name,x,y,z,w,h,d,mat,shadow,angle=0){
 const mesh=B.MeshBuilder.CreateBox(name,{width:w,height:h,depth:d},scene);
 mesh.parent=parent;mesh.position.set(x,y,z);mesh.rotation.y=angle;
 mesh.material=mat;mesh.receiveShadows=true;
 if(shadow && typeof shadow.addShadowCaster==='function')
  shadow.addShadowCaster(mesh);
 return mesh;
}
function debris(B,scene,parent,materials,site,i,shadow){
 const a=rnd(i*49+site.id*103)*Math.PI*2;
 const r=site.size*.43+rnd(i*181+site.id)*2.0;
 const x=Math.cos(a)*r,z=Math.sin(a)*r;
 const h=.10+rnd(i*31+site.id*29)*.24;
 const w=.18+rnd(i*13+site.id*23)*.50;
 const d=.15+rnd(i*17+site.id*43)*.47;
 // Fragmented lintels and fallen stones, just off the intact masonry.
 const mesh=box(B,scene,parent,'Piedra desprendida '+i,x,h*.5+.07,z,
  w,h,d,materials[Math.floor(rnd(i*19+site.id)*materials.length)],
  shadow&&i%6===0?shadow:null,rnd(i*83)*3);
 mesh.rotation.z=(rnd(i*23)-.5)*.32;
 mesh.rotation.x=(rnd(i*53)-.5)*.3;
}
export function construirPiramides(B,scene,sun){
 const mats=materials(B,scene);
 const shadow=new B.ShadowGenerator(1024,sun);
 shadow.usePercentageCloserFiltering=true;
 shadow.filteringQuality=B.ShadowGenerator.QUALITY_LOW;
 const all=planoPiramides();
 const parent=new B.TransformNode('Ruinas y pirámides · seis estructuras',scene);
 let intact=0,ruined=0;
 for(const site of all){
  const node=new B.TransformNode(
   (site.ruined?'Pirámide derrumbada ':'Pirámide conservada ')+(site.id+1),scene);
  node.parent=parent;node.position.set(site.x,0,site.z);node.rotation.y=site.angle;
  const mat=i=>mats[(Math.floor(rnd(site.id*1021+i*127)*mats.length))%mats.length];
  if(site.ruined)ruined++;else intact++;
  for(let tier=0;tier<site.levels;tier++){
   const full=site.size-tier*.67;
   if(full<.9)break;
   // For ruined monuments, upper terraces are fragmented instead of
   // artificially symmetrical. The lower mass still reads as a pyramid.
   if(site.ruined && tier>=site.levels-2){
    const n=tier===site.levels-2?3:1;
    for(let j=0;j<n;j++){
     const patch=full*(.31+.11*rnd(site.id+tier*17+j));
     box(B,scene,node,'Terraza fracturada',(-.25+.28*j)*full,
      .08+tier*.53+.265,(-.23+.20*j)*full,patch,.45,
      patch,mat(tier+j),shadow,tier===site.levels-1?.19:0);
    }
    continue;
   }
   const levelY=.08+tier*.53+.265;
   box(B,scene,node,'Cuerpo escalonado · bloque '+tier,0,levelY,0,
    full,.53,full,mat(tier),shadow);
   // Irregular stone courses, broken corner joints, not a smooth single box.
   const width=full*.94,edge=full/2+.016,blocks=Math.max(5,Math.round(full/.54));
   for(let j=0;j<blocks;j++){
    const shift=(rnd(site.id*113+tier*47+j*11)-.5)*.045;
    const seg=width/blocks-.017;
    const pos=-width/2+(j+.5)*width/blocks;
    if(site.ruined && tier>2 && rnd(site.id*71+tier*31+j*13)<.21)continue;
    box(B,scene,node,'Piedra tallada frontal',pos+shift,
     levelY+.18,-edge,seg,.14,.06,mat(91+tier*31+j),false);
    box(B,scene,node,'Piedra tallada posterior',pos,
     levelY+.15,edge,seg,.12,.05,mat(211+tier*19+j),false);
    box(B,scene,node,'Piedra tallada lateral',-edge,
     levelY+.17,pos,.065,.13,seg,mat(319+tier*17+j),false);
    box(B,scene,node,'Piedra tallada lateral',edge,
     levelY+.17,pos,.065,.13,seg,mat(411+tier*11+j),false);
   }
  }
  // An axial staircase, oriented toward the centre of the battlefield.
  const front=site.z>0?-1:1;
  for(let i=0;i<site.levels;i++){
   if(site.ruined&&i>site.levels-3)continue;
   const y=.08+i*.53+.08;
   const z=front*(site.size/2-i*.32+.03);
   box(B,scene,node,'Escalinata central '+i,0,y,z,
    Math.max(.75,1.6-i*.08),.17,.42,mat(600+i+site.id*20),false);
  }
  if(!site.ruined){
   // Small roofless sanctuary and lintel atop the complete temples.
   const top=.08+site.levels*.53,roofWidth=site.size-site.levels*.67;
   for(const px of [-1,1])for(const pz of [-1,1]){
    box(B,scene,node,'Pilar del santuario',px*roofWidth*.29,
     top+.48,pz*roofWidth*.29,.26,.9,.26,mat(731+px*8+pz),shadow);
   }
   box(B,scene,node,'Dintel del santuario',0,top+.96,0,
    roofWidth*.82,.22,roofWidth*.82,mat(809+site.id),shadow);
  }else{
   // Three different degrees of collapse, with asymmetric fallen masonry.
   const fragments=site.id===2?45:site.id===4?32:38;
   for(let i=0;i<fragments;i++)debris(B,scene,node,mats,site,i,shadow);
  }
  // Natural old stones around the foundations; sparse for intact pyramids.
  if(!site.ruined)
   for(let i=0;i<9;i++)debris(B,scene,node,mats,site,i,false);
 }
 return {parent,sites:all,complete:intact,collapsed:ruined,
  maxHeight:Math.max(...all.map(s=>s.height))};
}
