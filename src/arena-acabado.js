// Naturalistic finishing pass for the Babylon arena.
// These are edge-smoothing controls, not a geometry redesign.
export const ACABADO_ARENA=Object.freeze({
 msaa:4,
 fxaa:true,
 contrast:.94,
 shadowDarkness:.28
});
export function aplicarAcabadoArena(B,scene,camera){
 let pipeline=null,mode='webgl';
 if(B.DefaultRenderingPipeline){
  try{
   // MSAA removes jagged polygon edges; FXAA softens the high-frequency
   // stone seams and alpha-tested jungle grass in the final image.
   pipeline=new B.DefaultRenderingPipeline('Acabado de piedra natural',false,
    scene,[camera]);
   pipeline.samples=ACABADO_ARENA.msaa;
   pipeline.fxaaEnabled=ACABADO_ARENA.fxaa;
   pipeline.imageProcessingEnabled=true;
   if(pipeline.imageProcessing)
    pipeline.imageProcessing.contrast=ACABADO_ARENA.contrast;
   else if(scene.imageProcessingConfiguration)
    scene.imageProcessingConfiguration.contrast=ACABADO_ARENA.contrast;
   mode='MSAA 4x + FXAA';
  }catch(error){
   console.warn('Antialiasing avanzado no disponible; se conserva WebGL',error);
   try{pipeline?.dispose();}catch{}
   pipeline=null;
  }
 }
 // Subtle neutral shading rather than hard dark seams. This also works
 // without a rendering pipeline (older GPUs).
 if(!pipeline && scene.imageProcessingConfiguration)
  scene.imageProcessingConfiguration.contrast=ACABADO_ARENA.contrast;
 return {pipeline,mode};
}
