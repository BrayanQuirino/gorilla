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

import {obstaculos_escena} from './terreno.js';
import {construirSelvaAncestral} from './selva-scene.js';
import * as THREE from 'three';

test('Selva ancestral uses the exact same colliders as pathfinding and combat',()=>{
 const scene=new THREE.Scene();
 const selva=construirSelvaAncestral(scene);
 const original=obstaculos_escena('selva').map(o=>o.id);
 assert.deepEqual(selva.metadata.collisions,original);
 assert.equal(selva.metadata.bridgeCount,2);
 assert.equal(selva.metadata.plaza,true);
 assert.equal(selva.metadata.musicOverride,false);
 assert.equal(selva.metadata.artwork,'procedural-3d');
 const geometry=[];
 selva.root.traverse(o=>{if(o.isMesh)geometry.push(o);});
 assert.ok(geometry.length>70,'authored scene has real volumetric objects');
 assert.ok(geometry.some(o=>o.isInstancedMesh),'decorative geometry uses GPU instancing');
 selva.update(10);
});
