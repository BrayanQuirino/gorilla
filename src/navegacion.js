// Deterministic grid A* route planner for the 100-human combat arena.
// AI decisions and attack numbers remain in battle.js; this module owns only
// path selection, edge clearance, obstacle avoidance and route caching.
import {ancho,alto,obstaculos_escena,paso_construido} from './terreno.js';
const CELL=25,cols=Math.ceil(ancho/CELL),rows=Math.ceil(alto/CELL);
const DIRS=[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];
const within=(x,y)=>x>=0&&x<cols&&y>=0&&y<rows;
const node=(x,y)=>y*cols+x;
const pos=id=>({x:(id%cols+.5)*CELL,y:(Math.floor(id/cols)+.5)*CELL});
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const cellOf=p=>node(clamp(Math.floor(p.x/CELL),0,cols-1),clamp(Math.floor(p.y/CELL),0,rows-1));
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const scalable=o=>o.tipo==='roca'||o.tipo==='ruina'; // Gorillas only.
const blocked=(p,arena,radius,mode)=>{
 if(p.x<radius||p.x>ancho-radius||p.y<radius||p.y>alto-radius)return true;
 if(paso_construido(p,arena))return false;
 return obstaculos_escena(arena).some(o=>{
  if(mode==='gorila'&&scalable(o))return false;
  const dx=(p.x-o.x)/(o.rx+radius),dy=(p.y-o.y)/(o.ry+radius);
  return dx*dx+dy*dy<1;
 });
};
export const transitable=(p,arena,radio=11,tipo='humano')=>!blocked(p,arena,radio,tipo);
export function paso_libre(a,b,arena,radio=11,tipo='humano'){
 const length=dist(a,b),samples=Math.max(1,Math.ceil(length/12));
 for(let i=1;i<=samples;i++){
  const t=i/samples;
  if(blocked({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t},arena,radio,tipo))return false;
 }
 return true;
}
const heuristic=(a,b)=>{
 const dx=Math.abs(a%cols-b%cols),dy=Math.abs(Math.floor(a/cols)-Math.floor(b/cols));
 return (dx+dy)+(Math.SQRT2-2)*Math.min(dx,dy);
};
function nearestCell(target,arena,radio,mode){
 const targetCell=cellOf(target);
 if(transitable(pos(targetCell),arena,radio,mode))return targetCell;
 let best=null,score=Infinity;
 for(let r=1;r<=10&&best===null;r++){
  const cx=targetCell%cols,cy=Math.floor(targetCell/cols);
  for(let y=cy-r;y<=cy+r;y++)for(let x=cx-r;x<=cx+r;x++){
   if(!within(x,y))continue;
   const id=node(x,y),p=pos(id);
   if(!transitable(p,arena,radio,mode))continue;
   const value=dist(p,target);
   if(value<score){score=value;best=id;}
  }
 }
 return best;
}
class PriorityQueue {
 constructor(){this.heap=[]}
 push(n,priority){
  const h=this.heap;h.push({n,priority});let i=h.length-1;
  while(i>0){const p=(i-1)>>1;if(h[p].priority<=priority)break;h[i]=h[p];i=p;}h[i]={n,priority};
 }
 pop(){
  const h=this.heap,top=h[0],last=h.pop();
  if(h.length){let i=0;
   while(2*i+1<h.length){
    let child=2*i+1;if(child+1<h.length&&h[child+1].priority<h[child].priority)child++;
    if(last.priority<=h[child].priority)break;h[i]=h[child];i=child;
   }h[i]=last;
  }return top.n;
 }
 get size(){return this.heap.length}
}
function search(start,target,arena,radio,mode){
 const startNode=nearestCell(start,arena,radio,mode),goal=nearestCell(target,arena,radio,mode);
 if(startNode===null||goal===null)return [];
 const size=cols*rows,done=new Uint8Array(size),cost=new Float32Array(size),prev=new Int32Array(size);
 cost.fill(Infinity);prev.fill(-1);cost[startNode]=0;
 const open=new PriorityQueue();open.push(startNode,heuristic(startNode,goal));
 let iterations=0;
 while(open.size&&iterations++<size*3){
  const curr=open.pop();if(done[curr])continue;
  done[curr]=1;if(curr===goal)break;
  const x=curr%cols,y=Math.floor(curr/cols);
  for(const [dx,dy] of DIRS){
   const xx=x+dx,yy=y+dy;if(!within(xx,yy))continue;
   const next=node(xx,yy);if(done[next])continue;
   const currentPoint=pos(curr),nextPoint=pos(next);
   if(blocked(nextPoint,arena,radio,mode))continue;
   if(dx&&dy&&(!transitable({x:xx*CELL+CELL/2,y:y*CELL+CELL/2},arena,radio,mode)||
      !transitable({x:x*CELL+CELL/2,y:yy*CELL+CELL/2},arena,radio,mode)))continue;
   if(!paso_libre(currentPoint,nextPoint,arena,radio,mode))continue;
   const tentative=cost[curr]+(dx&&dy?Math.SQRT2:1);
   if(tentative>=cost[next])continue;
   cost[next]=tentative;prev[next]=curr;
   open.push(next,tentative+heuristic(next,goal));
  }
 }
 if(!Number.isFinite(cost[goal]))return [];
 let current=goal,path=[pos(goal)];
 while(current!==startNode&&prev[current]>=0&&path.length<size){
  current=prev[current];path.push(pos(current));
 }
 path.reverse();
 return path;
}
// Cached per agent: avoid recalculating one A* per character per frame.
// Direct line-of-sight is fast; the expensive path planner runs at most
// roughly once per second per agent, and returns the next visible waypoint.
export function siguiente_punto(actor,goal,arena,now=0,mode='humano'){
 if(!goal||!Number.isFinite(goal.x)||!Number.isFinite(goal.y))return goal;
 const radius=mode==='gorila'?Math.max(17,(actor.radio||26)*.60):11;
 const cache=actor.ruta_moba;
 const direct=paso_libre(actor,goal,arena,radius,mode);
 if(direct){actor.ruta_moba=null;return goal;}
 const changed=!cache||cache.arena!==arena||cache.mode!==mode||
  dist(cache.goal,goal)>70||now>=cache.expires;
 if(changed){
  const waypoints=search(actor,goal,arena,radius,mode);
  actor.ruta_moba={arena,mode,goal:{x:goal.x,y:goal.y},
   waypoints,index:0,expires:now+.85+(actor.id||0)%7*.13};
 }
 const route=actor.ruta_moba;
 while(route.index<route.waypoints.length-1&&dist(actor,route.waypoints[route.index])<23)route.index++;
 // Skip unobstructed waypoints; this makes movement smooth, not cell-by-cell.
 for(let i=route.waypoints.length-1;i>route.index;i--){
  if(paso_libre(actor,route.waypoints[i],arena,radius,mode)){route.index=i;break;}
 }
 return route.waypoints[route.index]||goal;
}
export function navegacion_diagnostico(arena,tipo='humano'){
 const obstacles=obstaculos_escena(arena);
 let walkable=0;
 for(let j=0;j<rows;j++)for(let i=0;i<cols;i++)
  if(transitable(pos(node(i,j)),arena,tipo==='gorila'?23:11,tipo))walkable++;
 return {arena,tipo,walkable,cells:cols*rows,obstacles:obstacles.length};
}
