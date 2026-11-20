// Distance-aware stone pavement: render the wide view as one mipmapped
// surface, then restore all real 3D cobbles when close enough to see them.
// The combined floor is not redrawn as thousands of subpixel triangles,
// which caused the shimmering / "TV static" effect on phones.
export const UMBRAL_ADOQUIN_PX=9;
export function elegirDetallePiso(pixelesPorAdoquin,detalleActual=false){
 // Hysteresis prevents switching rapidly while the user pinches/orbits.
 return detalleActual ? pixelesPorAdoquin>=7.5 : pixelesPorAdoquin>=UMBRAL_ADOQUIN_PX;
}
const palette=[
 '#eee2ca','#e6d7ba','#f0e7d5','#dacfba',
 '#e9ddc4','#e4e0d3','#d7cbb6','#ede3ce'
];
const rand=n=>{const x=Math.sin(n*127.17+46.23)*43758.5453;return x-Math.floor(x);};
function paintCobble(ctx,s){
 const shade=palette[Math.floor(rand(s.seed*2.9)*palette.length)];
 ctx.save();
 ctx.translate(s.x,s.z);
 ctx.rotate(s.angle);
 ctx.fillStyle=shade;
 if(s.polygon){
  ctx.beginPath();
  s.polygon.forEach(([x,z],i)=>{
   if(i)ctx.lineTo(x*s.wx,z*s.wz);
   else ctx.moveTo(x*s.wx,z*s.wz);
  });
  ctx.closePath();
 }else{
  const x=s.wx/2,z=s.wz/2,chip=Math.min(x,z)*.14;
  ctx.beginPath();
  ctx.moveTo(-x+chip,-z);
  ctx.lineTo(x-chip,-z);
  ctx.lineTo(x,-z+chip);
  ctx.lineTo(x,z-chip);
  ctx.lineTo(x-chip,z);
  ctx.lineTo(-x+chip,z);
  ctx.lineTo(-x,z-chip);
  ctx.lineTo(-x,-z+chip);
  ctx.closePath();
 }
 ctx.fill();
 // A restrained weathered joint, deliberately not an outlined grid.
 ctx.strokeStyle='rgba(118,104,82,.13)';
 ctx.lineWidth=.014;
 ctx.stroke();
 ctx.restore();
}
function addGrass(ctx,plan,width,height){
 if(!plan?.mask||!plan.widthPx||!plan.heightPx)return;
 // Draw the EXACT SAME ground coverage as the existing grass renderer.
 // The wide-shot version only bakes that mask into this single surface.
 const tmp=document.createElement('canvas');
 tmp.width=plan.widthPx;tmp.height=plan.heightPx;
 const c=tmp.getContext('2d');
 const img=c.createImageData(tmp.width,tmp.height);
 for(let z=0;z<tmp.height;z++)for(let x=0;x<tmp.width;x++){
  const index=z*tmp.width+x;
  const i=((tmp.height-1-z)*tmp.width+x)*4;
  const covered=plan.mask[index]===1;
  const variation=.79+.20*rand(index*1.7+13);
  img.data[i]=Math.round(65*variation);
  img.data[i+1]=Math.round(129*variation);
  img.data[i+2]=Math.round(43*variation);
  img.data[i+3]=covered?255:0;
 }
 c.putImageData(img,0,0);
 ctx.save();
 ctx.setTransform(1,0,0,1,0,0);
 ctx.imageSmoothingEnabled=true;
 ctx.imageSmoothingQuality='high';
 ctx.drawImage(tmp,0,0,width,height);
 ctx.restore();
}
export function construirPisoLejano(B,scene,layout,grassPlan){
 const width=2048,height=1365;
 const texture=new B.DynamicTexture('Adoquines agrupados · mipmaps sin parpadeos',
  {width,height},scene,true);
 const ctx=texture.getContext();
 ctx.fillStyle='#d8ccba';
 ctx.fillRect(0,0,width,height);
 ctx.setTransform(width/layout.outerWidth,0,0,-height/layout.outerDepth,
  width/2,height/2);
 for(const stone of layout.stones)paintCobble(ctx,stone);
 addGrass(ctx,grassPlan,width,height);
 texture.update();
 texture.hasAlpha=false;
 texture.wrapU=texture.wrapV=B.Texture.CLAMP_ADDRESSMODE;
 texture.anisotropicFilteringLevel=4;
 if(typeof texture.updateSamplingMode==='function')
  texture.updateSamplingMode(B.Texture.TRILINEAR_SAMPLINGMODE);
 const mesh=B.MeshBuilder.CreateGround('Piso panorámico consolidado',
  {width:layout.outerWidth,height:layout.outerDepth,subdivisions:1},scene);
 // Slightly above detailed masonry and below grass. Only one variant is
 // visible at a time: no z-fighting or double drawing.
 mesh.position.y=.095;
 const mat=new B.StandardMaterial('Piedra panorámica suavizada',scene);
 mat.diffuseTexture=texture;
 mat.diffuseColor=B.Color3.White();
 mat.specularColor=B.Color3.Black();
 mat.emissiveColor=new B.Color3(.16,.15,.13);
 mat.backFaceCulling=false;
 mesh.material=mat;
 mesh.receiveShadows=false;
 mesh.setEnabled(false);
 return {mesh,texture,stonesBaked:layout.stones.length};
}
