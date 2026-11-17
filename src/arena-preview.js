// Independent Babylon scene entrypoint. No React app, no battle state and no
// automatic downgrade to the old arena or combat renderer.
import { crear_dibujante_babylon } from './arena-babylon.js';
const canvas=document.getElementById('arena-canvas');
const loading=document.getElementById('loading');
const errorBox=document.getElementById('error');
const showError=(error)=>{
 const msg=error instanceof Error?error.message:String(error);
 console.error('Arena Babylon:',error);
 loading.hidden=true;
 errorBox.style.display='block';
 errorBox.textContent='Error al cargar la arena 3D: '+msg;
};
let render;
try{
 if(!window.BABYLON?.Engine)
  throw new Error('El motor Babylon.js no se pudo cargar. Revisa la conexión al CDN.');
 render=crear_dibujante_babylon(canvas,()=>{},showError);
 loading.hidden=true;
}catch(error){showError(error);}
window.addEventListener('pagehide',()=>render?.liberar?.(),{once:true});
