import test from 'node:test';
import assert from 'node:assert/strict';
import {diagnostico_three} from './arena-three.js';

test('Three.js preview builds navigable 3D scenery and all 100 actors without pasted imagery',()=>{
 for(const arena of ['selva','hangar','canon']){
  const d=diagnostico_three(arena);
  assert.equal(d.escenaActiva,true,arena+' has actual geometry groups');
  assert.equal(d.humanos,100,arena+' simulates all 100 humans');
  assert.equal(d.estilos,20,'all original 20 archetypes are preserved');
  assert.ok(d.gruposInstanciados>=12,arena+' uses batch-instanced articulated characters');
  assert.ok(d.obstaculos>=6,arena+' has physical stage geometry');
  assert.ok(d.mallas>d.gruposInstanciados+20,arena+' includes 3D rocks, terrain and props');
  assert.equal(d.modelosGeneradosConGeometria,true);
 }
});
