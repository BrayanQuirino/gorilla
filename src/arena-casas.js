// Six distinct archaeological house ruins. These are true 3D masonry layouts,
// not six copies of an L-shaped corner. All geometry uses Babylon primitives.
// Pyramids reach ~4.76 units = 40 metres; surviving walls are ~3–5 metres.
const rnd=n=>{const x=Math.sin(n*127.17+46.23)*43758.5453;return x-Math.floor(x)};
export const METROS_POR_UNIDAD=40/4.76;
const CASAS=[
 {x:-9.6,z:-7.4,angle:.26,variant:'fachada_colapsada',lengthX:2.55,lengthZ:2.05,height:.56,damage:.38},
 {x:11.0,z:-6.8,angle:-.38,variant:'patio_u',lengthX:2.75,lengthZ:2.30,height:.49,damage:.61},
 {x:-29.0,z:7.0,angle:.63,variant:'dos_camaras',lengthX:2.55,lengthZ:2.52,height:.55,damage:.49},
 {x:31.0,z:-9.3,angle:-.17,variant:'rectangular_fachada',lengthX:2.70,lengthZ:2.25,height:.58,damage:.35},
 {x:-10.5,z:19.6,angle:.44,variant:'taller_ruinoso',lengthX:2.50,lengthZ:2.15,height:.47,damage:.71},
 {x:10.2,z:-19.6,angle:-.53,variant:'compacta_anexo',lengthX:2.50,lengthZ:2.02,height:.52,damage:.58}
];
export function planoCasasAntiguas(){
 return CASAS.map((s,i)=>({...s,id:i,
  // Circular bound of an oriented rectangle plus a sparse debris apron.
  footprintRadius:Math.hypot(s.lengthX,s.lengthZ)/2+.52,
  heightMetros:+(s.height*METROS_POR_UNIDAD).toFixed(1)}));
}
function materials(B,scene){
 const colors=['#d6c7ab','#e0d3b9','#c4b79f','#d9cfb9','#cdbfa7','#bcae94',
  '#d2c4ab','#b8a98e'];
 return colors.map((hex,i)=>{
  const mat=new B.StandardMaterial('Casa · caliza envejecida '+i,scene);
  mat.diffuseColor=B.Color3.FromHexString(hex);
  mat.specularColor=new B.Color3(.014,.013,.01);
  mat.backFaceCulling=false;mat.alpha=1;
  return mat;
 });
}
function block(B,scene,node,name,x,y,z,w,h,d,mat,rotation=0){
 const mesh=B.MeshBuilder.CreateBox(name,
  {width:Math.max(.012,w),height:Math.max(.012,h),depth:Math.max(.012,d)},scene);
 mesh.parent=node;mesh.position.set(x,y,z);mesh.rotation.y=rotation;
 mesh.material=mat;mesh.receiveShadows=true;
 return mesh;
}
function createBuilder(B,scene,node,site,mats){
 let count=0;
 const make=(name,x,y,z,w,h,d,seed,rotation=0)=>{
  count++;
  return block(B,scene,node,name,x,y,z,w,h,d,
   mats[Math.floor(rnd(site.id*211+seed*19)*mats.length)],rotation);
 };
 // Real stacked, offset limestone masonry. Each wall can have an independent
 // irregular skyline and an opening through its full thickness.
 const wall=(a,b,height,opts={})=>{
  const dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz);
  const dirX=dx/len,dirZ=dz/len,rot=-Math.atan2(dz,dx);
  const step=.21,course=.105,rows=Math.ceil(height/course);
  const name=opts.name||'Muro de vivienda';
  for(let row=0;row<rows;row++){
   const bottom=row*course;
   for(let j=0;j<Math.ceil(len/step)+2;j++){
    const start=j*step-(row%2)*step*.5;
    const lo=Math.max(0,start),hi=Math.min(len,start+step);
    if(hi-lo<.048)continue;
    const u=(lo+hi)/2/len,seed=(opts.seed||0)*1000+row*61+j*13;
    const drop=(opts.ruin||0)*(u*.45+
      .55*rnd(site.id*17+(opts.seed||0)*73+j*11));
    const top=height*(1-drop);
    if(bottom+course*.45>top)continue;
    if(opts.ruin && row>1 && rnd(seed+51)<opts.ruin*.075)continue;
    if(opts.opening && u>=opts.opening[0] && u<=opts.opening[1] &&
       bottom<opts.opening[2])continue;
    // An offset run of individual blocks with hand-chipped, uneven edges.
    const pos=(lo+hi)/2,noise=(rnd(seed+91)-.5)*.012;
    const x=a[0]+dirX*pos-dirZ*noise;
    const z=a[1]+dirZ*pos+dirX*noise;
    make(name+' · sillar',x,bottom+course*.5+.006,z,
     hi-lo-.007,course-.005,.145+(rnd(seed+7)-.5)*.024,
     seed,rot);
   }
  }
 };
 const slab=(x,z,w,d,seed)=>{
  make('Losa de suelo original',x,.018,z,w,.036,d,seed);
 };
 const beam=(x,y,z,length,rotation,seed)=>{
  make('Viga antigua de madera colapsada',x,y,z,length,.045,.075,seed,rotation);
 };
 const debris=(n,seed=0,spreadX=1,spreadZ=1)=>{
  for(let j=0;j<n;j++){
   const k=site.id*201+j*43+seed*179;
   const x=(rnd(k+7)-.5)*spreadX,z=(rnd(k+41)-.5)*spreadZ;
   const h=.028+.055*rnd(k+13);
   const m=make('Escombro · bloque caído',x,h/2+.01,z,
    .075+.15*rnd(k+17),h,.07+.13*rnd(k+29),k,rnd(k+67)*6.28);
   m.rotation.x=(rnd(k+53)-.5)*.3;
   m.rotation.z=(rnd(k+59)-.5)*.3;
  }
 };
 const flooring=()=>{
  for(let x=-site.lengthX*.38;x<site.lengthX*.4;x+=.33)
   for(let z=-site.lengthZ*.4;z<site.lengthZ*.4;z+=.34)
    if(rnd(site.id*33+x*71+z*19)>.20)
     slab(x,z,.29,.30,101+x*17+z*23);
 };
 const platform=(x,z,w,d,seed)=>make('Dintel y losa tallada',x,.015,z,w,.03,d,seed);
 return {wall,make,slab,beam,debris,flooring,platform,count:()=>count};
}
// 1. Intact façade, window and door; collapsed flat roof and surviving rear.
function buildCasaFachadaColapsada(g,s){
 const x=s.lengthX/2,z=s.lengthZ/2;
 g.flooring();
 g.wall([-x,-z],[x,-z],s.height,{seed:11,opening:[.39,.62,.42]});
 g.wall([-x,z],[-x,-z],s.height*.82,{seed:12,ruin:.32});
 g.wall([x,-z],[x,z],s.height*.7,{seed:13,ruin:.66});
 g.wall([x,z],[-x,z],s.height*.61,{seed:14,ruin:.72});
 g.make('Dintel puerta principal',0,.435,-z,.66,.09,.20,18);
 g.make('Cornisa antigua frontal',-x*.60,s.height*.82,-z,.64,.055,.21,19);
 g.beam(-.32,.49,0,.95,.46,20);g.beam(.43,.28,.34,.79,-.32,21);
 g.make('Losa caída del techo',-.53,.35,.43,.76,.10,.65,22,.20);
 g.debris(29,24,3.2,2.7);
}
// 2. U-shaped house with open courtyard and tall rear wall/portal.
function buildCasaPatioU(g,s){
 const x=s.lengthX/2,z=s.lengthZ/2;
 g.flooring();
 g.wall([-x,z],[x,z],s.height,{seed:31,opening:[.43,.62,.38]});
 g.wall([-x,-z],[-x,z],s.height*.7,{seed:32,ruin:.45});
 g.wall([x,z],[x,-z],s.height*.57,{seed:33,ruin:.62});
 g.make('Dintel del gran portal del patio',.06,.4,z,.72,.073,.17,34);
 g.make('Pilar de patio derrumbado',x*.82,.10,-z*.9,.22,.2,.22,35);
 g.make('Pilar de patio derrumbado',-x*.88,.13,-z*.86,.24,.26,.22,36);
 g.make('Dintel tallado caído',.33,.085,.23,.76,.10,.20,37,.43);
 g.debris(26,38,3.3,2.7);
}
// 3. Two distinct chambers, divided by an interior wall, one roof remnant.
function buildCasaDosCamaras(g,s){
 const x=s.lengthX/2,z=s.lengthZ/2;
 g.flooring();
 g.wall([-x,-z],[x,-z],s.height*.92,{seed:51,opening:[.24,.46,.42]});
 g.wall([-x,z],[-x,-z],s.height,{seed:52,ruin:.22});
 g.wall([x,-z],[x,z],s.height*.72,{seed:53,ruin:.43});
 g.wall([-x,z],[x,z],s.height*.48,{seed:54,ruin:.77});
 g.wall([0,-z*.8],[0,z],s.height*.6,{seed:55,ruin:.53,opening:[.45,.72,.24]});
 g.make('Nicho excavado en muro antiguo',-x*.9,.18,-z*.45,.12,.24,.29,56);
 g.make('Banco de piedra interior',x*.65,.065,z*.55,.43,.13,.17,57);
 g.make('Columna desplomada',.28,.078,-.30,.12,.13,.68,58,.47);
 g.beam(-.72,.41,.51,.74,.23,59);
 g.make('Fragmento de cubierta',-.75,.43,.42,.86,.07,.67,60);
 g.debris(35,61,3.15,3.0);
}
// 4. Broad rectangular façade with a central entrance and two windows.
function buildCasaRectangularFachada(g,s){
 const x=s.lengthX/2,z=s.lengthZ/2;
 g.flooring();
 // Openings have intact masonry above their lintels.
 g.wall([-x,-z],[x,-z],s.height,{seed:71,opening:[.40,.60,.42]});
 for(const sign of [-1,1]){
  const px=sign*x*.66;
  g.make('Marco de ventana lateral',px,.22,-z-.015,.31,.09,.21,72+sign);
  g.make('Alféizar de ventana',px,.11,-z-.03,.32,.06,.23,74+sign);
 }
 g.make('Dintel entrada de vivienda',0,.435,-z,.66,.095,.23,76);
 g.make('Friso frontal erosionado',0,s.height*.96,-z,.95,.055,.22,77);
 g.wall([-x,-z],[-x,z],s.height*.66,{seed:78,ruin:.55});
 g.wall([x,z],[x,-z],s.height*.63,{seed:79,ruin:.48});
 g.wall([x,z],[-x,z],s.height*.37,{seed:80,ruin:.76});
 g.wall([-.22,-z*.3],[-.22,z],s.height*.27,{seed:81,ruin:.62});
 g.make('Escalón de ingreso',0,.035,-z-.18,.75,.07,.22,82);
 g.debris(25,83,3.0,2.8);
}
// 5. Workshop: wide side access, work bench, collapsed roof timbers.
function buildTallerRuinoso(g,s){
 const x=s.lengthX/2,z=s.lengthZ/2;
 g.flooring();
 g.wall([-x,-z],[x,-z],s.height*.59,{seed:101,ruin:.55,
  opening:[.20,.70,.4]});
 g.wall([-x,z],[-x,-z],s.height*.87,{seed:102,ruin:.48});
 g.wall([x,-z],[x,z],s.height*.43,{seed:103,ruin:.79});
 g.wall([x,z],[-x,z],s.height*.35,{seed:104,ruin:.88});
 g.make('Mesa de trabajo de piedra',-x*.46,.18,z*.35,.71,.13,.36,105);
 g.make('Base de gran umbral de taller',.32,.035,-z,.93,.07,.18,106);
 g.beam(-.54,.14,-.21,1.07,.26,107);
 g.beam(.36,.10,.22,.94,-.51,108);
 g.make('Losa grande caída en taller',.54,.09,-.14,.61,.13,.50,109,.21);
 g.debris(38,110,3.2,2.7);
}
// 6. Compact home: a distinct small side annex and internal partition.
function buildCasaCompactaAnexo(g,s){
 const x=s.lengthX/2,z=s.lengthZ/2;
 g.flooring();
 g.wall([-x,-z],[x*.35,-z],s.height*.91,{seed:131,
  opening:[.40,.67,.38]});
 g.wall([-x,z],[-x,-z],s.height*.72,{seed:132,ruin:.40});
 g.wall([x*.35,-z],[x*.35,z*.48],s.height*.69,{seed:133,ruin:.49});
 g.wall([-x,z*.48],[x*.35,z*.48],s.height*.40,{seed:134,ruin:.65});
 // A smaller lateral room attached to the primary rectangle.
 g.wall([x*.35,-z*.46],[x,-z*.46],s.height*.39,{seed:135,ruin:.57});
 g.wall([x,-z*.46],[x,z*.48],s.height*.47,{seed:136,ruin:.69});
 g.wall([x,z*.48],[x*.35,z*.48],s.height*.30,{seed:137,ruin:.79});
 g.make('Dintel de la puerta doméstica',-x*.42,.39,-z,.45,.08,.19,138);
 g.make('Piedra grande del anexo colapsado',x*.67,.13,z*.22,.49,.18,.36,139,.32);
 g.beam(x*.59,.12,-z*.05,.63,-.26,140);
 g.debris(23,141,3.1,2.5);
}
const builders={
 fachada_colapsada:buildCasaFachadaColapsada,
 patio_u:buildCasaPatioU,
 dos_camaras:buildCasaDosCamaras,
 rectangular_fachada:buildCasaRectangularFachada,
 taller_ruinoso:buildTallerRuinoso,
 compacta_anexo:buildCasaCompactaAnexo
};
export function construirCasasAntiguas(B,scene){
 const mats=materials(B,scene);
 const root=new B.TransformNode('Seis viviendas antiguas con plantas distintas',scene);
 const sites=planoCasasAntiguas();
 let stoneBlocks=0;
 for(const site of sites){
  const node=new B.TransformNode('Casa '+site.variant+' '+site.id,scene);
  node.parent=root;node.position.set(site.x,0,site.z);node.rotation.y=site.angle;
  const g=createBuilder(B,scene,node,site,mats);
  builders[site.variant](g,site);
  stoneBlocks+=g.count();
 }
 return {root,sites,stoneBlocks};
}
