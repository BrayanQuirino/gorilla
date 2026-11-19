import test from 'node:test';
import assert from 'node:assert/strict';
import {ACABADO_ARENA,aplicarAcabadoArena} from './arena-acabado.js';

test('natural material finish uses MSAA, FXAA and subtle contrast',()=>{
 const scene={imageProcessingConfiguration:{contrast:1}},cam={};
 class DefaultRenderingPipeline{
  constructor(name,hdr,actualScene,cameras){
   assert.equal(hdr,false);
   assert.equal(actualScene,scene);
   assert.deepEqual(cameras,[cam]);
   this.imageProcessing={contrast:1};
  }
  dispose(){this.disposed=true;}
 }
 const result=aplicarAcabadoArena({DefaultRenderingPipeline},scene,cam);
 assert.equal(ACABADO_ARENA.msaa,4);
 assert.equal(result.mode,'MSAA 4x + FXAA');
 assert.equal(result.pipeline.samples,4);
 assert.equal(result.pipeline.fxaaEnabled,true);
 assert.equal(result.pipeline.imageProcessing.contrast,.94);
 result.pipeline.dispose();
 assert.equal(result.pipeline.disposed,true);
});
test('graceful fallback on old GPU/browser without post processing',()=>{
 const scene={imageProcessingConfiguration:{contrast:1}};
 const result=aplicarAcabadoArena({},scene,{});
 assert.equal(result.pipeline,null);
 assert.equal(result.mode,'webgl');
 assert.equal(scene.imageProcessingConfiguration.contrast,.94);
});
