// Organic jungle overgrowth on the actual upward-facing masonry surfaces.
// No square green face masks or wall-wide painted rectangles. Growth is
// expressed with irregular scalloped moss polygons and individual grass blades.
// The 40% budget is measured as a geometric UNION over all eligible upper
// surfaces of the six houses and three pyramids, never per individual stone.
export const COBERTURA_ESTRUCTURAS=.40;
const STORAGE=Symbol.for('gorilla.arena.superficiesDePiedra');
const rand=(x,y,z=0)=>{
 let n=(Math.imul(x,374761393)+Math.imul(y,668265263)+Math.imul(z,1442695041))|0;
 n=Math.imul(n^(n>>>13),1274126177);
 return ((n^(n>>>16))>>>0)/4294967295;
};
const smooth=x=>x*x*(3-2*x);
function noise(x,z,y,seed){
 const i=Math.floor(x),j=Math.floor(z),k=Math.floor(y);
 const u=smooth(x-i),v=smooth(z-j),w=smooth(y-k);
 const xy=(z0)=>{
  const a=rand(i,j,z0+seed)*(1-u)+rand(i+1,j,z0+seed)*u;
  const b=rand(i,j+1,z0+seed)*(1-u)+rand(i+1,j+1,z0+seed)*u;
  return a*(1-v)+b*v;
 };
 return xy(k)*(1-w)+xy(k+1)*w;
}
export function registrarPiedraArquitectonica(scene,mesh,w,h,d,kind){
 if(!scene||!mesh||!(w>0&&h>0&&d>0))return;
 // Timber is not limestone. Rubble, stone floors and columns do qualify.
 if(kind?.startsWith('Viga antigua'))return;
 (scene[STORAGE]??=[]).push({mesh,w,h,d,kind});
}
export function contarPiedrasArquitectonicas(scene){
 return scene?.[STORAGE]?.length||0;
}
// A face's oriented local rectangle; the underside is not exposed.
function facesOf(w,h,d){
 return [
  {o:[-w/2,h/2,-d/2],u:[w,0,0],v:[0,0,d],n:[0,1,0],top:true},
  {o:[-w/2,-h/2,-d/2],u:[w,0,0],v:[0,h,0],n:[0,0,-1]},
  {o:[w/2,-h/2,d/2],u:[-w,0,0],v:[0,h,0],n:[0,0,1]},
  {o:[-w/2,-h/2,d/2],u:[0,0,-d],v:[0,h,0],n:[-1,0,0]},
  {o:[w/2,-h/2,-d/2],u:[0,0,d],v:[0,h,0],n:[1,0,0]}
 ];
}
const magnitude=v=>Math.hypot(...v);
const add=(a,b,f=1)=>[a[0]+b[0]*f,a[1]+b[1]*f,a[2]+b[2]*f];
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
function buildFace(B,mesh,face,maxStep){
 const m=mesh.getWorldMatrix();
 const point=p=>{
  const v=B.Vector3.TransformCoordinates(new B.Vector3(...p),m);
  return [v.x,v.y,v.z];
 };
 const o=point(face.o);
 const u0=point(add(face.o,face.u));
 const v0=point(add(face.o,face.v));
 const U=u0.map((n,i)=>n-o[i]),V=v0.map((n,i)=>n-o[i]);
 const lu=magnitude(U),lv=magnitude(V);
 const nx=Math.max(1,Math.ceil(lu/maxStep)),ny=Math.max(1,Math.ceil(lv/maxStep));
 const du=U.map(x=>x/nx),dv=V.map(x=>x/ny);
 const normal=cross(du,dv),nl=magnitude(normal);
 if(nl<1e-8)return null;
 // Match actual local outward normal, even if parent has rotations.
 const outward=B.Vector3.TransformNormal(new B.Vector3(...face.n),m);
 const sign=normal[0]*outward.x+normal[1]*outward.y+normal[2]*outward.z>=0?1:-1;
 return {o,du,dv,n:normal.map(x=>x/nl*sign),area:nl,nx,ny,top:face.top};
}
export function seleccionarCoberturaGlobal(cells,coverage=COBERTURA_ESTRUCTURAS,
 surfaceArea=null){
 if(coverage<0||coverage>1)throw new Error('Cobertura inválida');
 const totalArea=surfaceArea??cells.reduce((s,c)=>s+c.area,0),goal=totalArea*coverage;
 const ordered=cells.map((c,index)=>({...c,index}))
  .sort((a,b)=>b.score-a.score||a.index-b.index);
 const selected=[];let area=0;
 for(const c of ordered){
  if(area>=goal-1e-9)break;
  const fraction=Math.min(1,(goal-area)/c.area);
  selected.push({...c,fraction});
  area+=c.area*fraction;
 }
 return {selected,totalArea,coveredArea:area,
  coverage:totalArea?area/totalArea:0};
}
// The irregular moss island is fully contained within a cell. Adjacent
// islands are not rectangles; their edges are a deliberately varied silhouette.
// Exact island area is derived from the shoelace formula, not bounding boxes.
export function poligonoMusgo(seed){
 const n=12,points=[];
 for(let k=0;k<n;k++){
  const a=(k+.10*(rand(seed,k,67)-.5))*Math.PI*2/n;
  const edge=.5/Math.max(Math.abs(Math.cos(a)),Math.abs(Math.sin(a)));
  const radius=edge*(.73+.22*rand(seed,k,73));
  points.push([Math.cos(a)*radius,Math.sin(a)*radius]);
 }
 return points;
}
export function areaPoligono(points){
 let sum=0;
 for(let i=0;i<points.length;i++){
  const a=points[i],b=points[(i+1)%points.length];
  sum+=a[0]*b[1]-b[0]*a[1];
 }
 return Math.abs(sum)*.5;
}
function createCells(B,scene){
 const cells=[],maxStep=.30;
 let surfaceArea=0;
 for(const item of scene[STORAGE]||[]){
  item.mesh.computeWorldMatrix(true);
  // Only actual terraces, roof remnants, fallen stones, lintels, wall caps:
  // vertical limestone remains natural beige (no voxel-like green walls).
  const face=buildFace(B,item.mesh,facesOf(item.w,item.h,item.d)[0],maxStep);
  if(!face||face.n[1]<.62)continue;
  for(let j=0;j<face.ny;j++)for(let i=0;i<face.nx;i++){
   const center=add(add(face.o,face.du,i+.5),face.dv,j+.5);
   const seed=(Math.round(center[0]*127)+Math.round(center[2]*89)+
    Math.round(center[1]*239))|0;
   const polygon=poligonoMusgo(seed),polygonArea=areaPoligono(polygon);
   const canopy=noise(center[0]*.55,center[2]*.55,center[1]*.35,7);
   const detail=noise(center[0]*1.8,center[2]*1.8,center[1]*1.1,17);
   const fine=rand(Math.round(center[0]*39),Math.round(center[2]*37),
    Math.round(center[1]*31));
   const score=.73*canopy+.24*detail+.03*fine+
    .05*Math.max(0,1-center[1]/7);
   cells.push({face,i,j,area:face.area*polygonArea,score,center,
    polygon,seed});
   surfaceArea+=face.area;
  }
 }
 return {cells,surfaceArea};
}
function createMossMesh(B,scene,selected){
 const positions=[],indices=[],colors=[],normals=[];
 const shades=[[.25,.38,.14],[.29,.42,.17],[.31,.43,.19],
  [.21,.35,.12],[.35,.45,.20]];
 for(const cell of selected){
  const {face,fraction,polygon,seed}=cell;
  const scale=Math.sqrt(fraction),offset=.009;
  const center=add(cell.center,face.n,offset);
  const base=positions.length/3;
  const shade=shades[Math.min(shades.length-1,
   Math.floor(rand(seed,19,29)*shades.length))];
  const centerTint=shade.map(x=>x*.93);
  positions.push(...center);colors.push(...centerTint,1);normals.push(...face.n);
  for(let k=0;k<polygon.length;k++){
   const [u,v]=polygon[k];
   const p=add(add(center,face.du,u*scale),face.dv,v*scale);
   positions.push(...p);
   // Variation makes the edges read as scattered moss, not acrylic paint.
   const variation=.90+.12*rand(seed,k,107);
   colors.push(...shade.map(x=>x*variation),1);
   normals.push(...face.n);
  }
  // Organic fan with no straight rectangular perimeter.
  for(let k=0;k<polygon.length;k++){
   indices.push(base,base+k+1,base+((k+1)%polygon.length)+1);
  }
 }
 const mesh=new B.Mesh('Musgo orgánico irregular sobre piedra',scene);
 const vd=new B.VertexData();
 vd.positions=positions;vd.indices=indices;vd.colors=colors;vd.normals=normals;
 vd.applyToMesh(mesh);
 const mat=new B.StandardMaterial('Musgo fino natural en ruinas',scene);
 mat.diffuseColor=B.Color3.White();
 mat.specularColor=new B.Color3(.006,.008,.003);
 mat.emissiveColor=new B.Color3(.045,.058,.019);
 mat.useVertexColors=true;mat.backFaceCulling=false;
 mesh.material=mat;mesh.receiveShadows=false;
 return mesh;
}
function createFerns(B,scene,selected){
 const positions=[],indices=[],colors=[];
 let tufts=0;
 for(let k=0;k<selected.length;k++){
  const c=selected[k],f=c.face;
  if(!f.top||f.n[1]<.75||c.fraction<.5||tufts>=1450||
     rand(k,17,43)>.12)continue;
  const mid=add(c.center,f.n,.013);
  const height=.09+.15*rand(k,31,47),count=4;
  for(let leaf=0;leaf<count;leaf++){
   const a=(leaf+rand(k,leaf,61)*.2)*Math.PI*2/count;
   const dir=[Math.cos(a),0,Math.sin(a)],side=[-dir[2],0,dir[0]];
   const width=.028+.022*rand(k,leaf,71),lean=height*.42;
   const corners=[
    add(mid,side,width/2),add(mid,side,-width/2),
    add(add(mid,dir,lean),[0,height,0])];
   const base=positions.length/3;
   for(let j=0;j<3;j++){
    positions.push(...corners[j]);
    colors.push(.22+j*.02,.39+j*.035,.095+j*.015,1);
   }
   indices.push(base,base+2,base+1);
  }
  tufts++;
 }
 if(!positions.length)return {mesh:null,tufts:0};
 const mesh=new B.Mesh('Hierbas tropicales en cornisas y terrazas',scene);
 const vd=new B.VertexData(),normals=[];
 B.VertexData.ComputeNormals(positions,indices,normals);
 vd.positions=positions;vd.indices=indices;vd.colors=colors;vd.normals=normals;
 vd.applyToMesh(mesh);
 const mat=new B.StandardMaterial('Brotes de selva antigua',scene);
 mat.diffuseColor=B.Color3.White();
 mat.specularColor=B.Color3.Black();
 mat.emissiveColor=new B.Color3(.085,.11,.025);
 mat.useVertexColors=true;mat.backFaceCulling=false;
 mesh.material=mat;
 return {mesh,tufts};
}
export function construirVegetacionEstructuras(B,scene){
 const {cells,surfaceArea}=createCells(B,scene);
 if(!cells.length)throw new Error('No hay caras superiores de piedra registradas');
 const plan=seleccionarCoberturaGlobal(cells,COBERTURA_ESTRUCTURAS,surfaceArea);
 const moss=createMossMesh(B,scene,plan.selected);
 const ferns=createFerns(B,scene,plan.selected);
 return {...plan,moss,ferns,faces:cells.length,stones:contarPiedrasArquitectonicas(scene),
  modo:'musgo irregular + césped 3D en superficies superiores'};
}
