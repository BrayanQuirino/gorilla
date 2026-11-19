// Stone architecture layer for Babylon.js arena.
// Geometry stays independent of the cobbled floor and the combat simulation.
// Three asymmetrically placed temples: almost intact, moderately damaged, and heavily collapsed.
const rnd=n=>{const x=Math.sin(n*127.17+46.23)*43758.5453;return x-Math.floor(x)};
const stoneColors=['#cec1a5','#d8cbb0','#b9ab90','#e1d3b7','#c4b69c','#a99f89'];
// Hand-composed asymmetric positions, carefully clear of all nine floor circles.
// Positions are fixed for repeatability: only the broken masonry is irregular.
const SITES=[
 {x:-31.8,z:-18.3,size:7.3,levels:7,state:'intacta',angle:.13},
 {x:30.7,z:2.8,size:6.2,levels:6,state:'media',angle:-.24},
 {x:9.8,z:19.0,size:5.7,levels:6,state:'destruida',angle:.37}
];
export function planoPiramides(){
 return SITES.map((site,i)=>({...site,id:i,
  height:site.levels*.53+(site.state==='intacta'?1.05:site.state==='media'?.45:0)}));
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
 // Prevent heavy black contact outlines on weathered limestone blocks.
 shadow.darkness=.28;
 shadow.bias=.001;
 shadow.normalBias=.008;
 const all=planoPiramides();
 const parent=new B.TransformNode('Ruinas y pirámides · tres estructuras',scene);
 let intact=0,mid=0,ruined=0;
 for(const site of all){
  const node=new B.TransformNode('Pirámide '+site.state+' '+(site.id+1),scene);
  node.parent=parent;node.position.set(site.x,0,site.z);node.rotation.y=site.angle;
  const mat=i=>mats[(Math.floor(rnd(site.id*1021+i*127)*mats.length))%mats.length];
  if(site.state==='intacta')intact++;
  else if(site.state==='media')mid++;
  else ruined++;
  for(let tier=0;tier<site.levels;tier++){
   const full=site.size-tier*.67;
   if(full<.9)break;
   // For ruined monuments, upper terraces are fragmented instead of
   // artificially symmetrical. The lower mass still reads as a pyramid.
   if(site.state==='destruida' && tier>=site.levels-3){
    // Only fragments of the upper three courses survive.
    const n=tier===site.levels-3?3:tier===site.levels-2?2:1;
    for(let j=0;j<n;j++){
     const patch=full*(.31+.11*rnd(site.id+tier*17+j));
     box(B,scene,node,'Terraza fracturada',(-.25+.28*j)*full,
      .08+tier*.53+.265,(-.23+.20*j)*full,patch,.45,
      patch,mat(tier+j),shadow,tier===site.levels-1?.19:0);
    }
    continue;
   }
   if(site.state==='media' && tier===site.levels-1){
    // The top course is broken on one side but still recognizably stepped.
    const patch=full*.66;
    box(B,scene,node,'Corona superior medio derrumbada',
     full*.10,.08+tier*.53+.265,-full*.09,
     patch,.45,patch*.84,mat(tier+40),shadow,.12);
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
    if(site.state==='destruida' && tier>1 && rnd(site.id*71+tier*31+j*13)<.38)continue;
    if(site.state==='media' && tier>2 && rnd(site.id*71+tier*31+j*13)<.12)continue;
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
   if(site.state==='destruida'&&i>site.levels-4)continue;
   if(site.state==='media'&&i>site.levels-2)continue;
   const y=.08+i*.53+.08;
   const z=front*(site.size/2-i*.32+.03);
   box(B,scene,node,'Escalinata central '+i,0,y,z,
    Math.max(.75,1.6-i*.08),.17,.42,mat(600+i+site.id*20),false);
  }
  if(site.state==='intacta'){
   // Small roofless sanctuary and lintel atop the complete temples.
   const top=.08+site.levels*.53,roofWidth=site.size-site.levels*.67;
   for(const px of [-1,1])for(const pz of [-1,1]){
    box(B,scene,node,'Pilar del santuario',px*roofWidth*.29,
     top+.48,pz*roofWidth*.29,.26,.9,.26,mat(731+px*8+pz),shadow);
   }
   box(B,scene,node,'Dintel del santuario',0,top+.96,0,
    roofWidth*.82,.22,roofWidth*.82,mat(809+site.id),shadow);
  }else if(site.state==='media'){
   // Moderate structural damage: missing upper masonry, loose stones nearby.
   for(let i=0;i<19;i++)debris(B,scene,node,mats,site,i,shadow);
  }else{
   // Severe, asymmetric collapse and scattered architectural fragments.
   for(let i=0;i<54;i++)debris(B,scene,node,mats,site,i,shadow);
  }
  if(site.state==='intacta')
   for(let i=0;i<5;i++)debris(B,scene,node,mats,site,i,null);
 }
 return {parent,sites:all,complete:intact,medium:mid,collapsed:ruined,
  maxHeight:Math.max(...all.map(s=>s.height))};
}
