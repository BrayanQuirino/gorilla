// Orthographic zoom is independent from Babylon ArcRotateCamera.radius.
// The radius must remain safely outside the arena even when pinching.
export const ZOOM_MINIMO=.22;
export const ZOOM_MAXIMO=2.6;
export function distanciaPellizco(a,b){
 return Math.hypot(a.clientX-b.clientX,a.clientY-b.clientY);
}
export function calcularZoomPellizco(zoom,distanciaAnterior,distanciaActual){
 if(!Number.isFinite(zoom)||!Number.isFinite(distanciaAnterior)||
    !Number.isFinite(distanciaActual)||distanciaAnterior<=0||distanciaActual<=0)
  return zoom;
 // Greater finger separation -> smaller ortho extents -> zoom in.
 return Math.max(ZOOM_MINIMO,Math.min(ZOOM_MAXIMO,
  zoom*distanciaAnterior/distanciaActual));
}
// Attaches only the two-finger pinch, leaving Babylon's single-finger
// rotation working normally. Returns teardown for pagehide / disposal.
export function instalarZoomTactil(canvas,getZoom,setZoom){
 let lastDistance=null;
 const start=e=>{
  if(e.touches.length===2){
   lastDistance=distanciaPellizco(e.touches[0],e.touches[1]);
   if(e.cancelable)e.preventDefault();
  }else lastDistance=null;
 };
 const move=e=>{
  if(e.touches.length!==2){lastDistance=null;return;}
  if(e.cancelable)e.preventDefault();
  const next=distanciaPellizco(e.touches[0],e.touches[1]);
  if(lastDistance&&next>0)
   setZoom(calcularZoomPellizco(getZoom(),lastDistance,next));
  lastDistance=next;
 };
 const end=e=>{
  if(e.touches.length<2)lastDistance=null;
  else lastDistance=distanciaPellizco(e.touches[0],e.touches[1]);
 };
 canvas.addEventListener('touchstart',start,{passive:false});
 canvas.addEventListener('touchmove',move,{passive:false});
 canvas.addEventListener('touchend',end,{passive:false});
 canvas.addEventListener('touchcancel',end,{passive:false});
 return ()=>{
  canvas.removeEventListener('touchstart',start);
  canvas.removeEventListener('touchmove',move);
  canvas.removeEventListener('touchend',end);
  canvas.removeEventListener('touchcancel',end);
 };
}
