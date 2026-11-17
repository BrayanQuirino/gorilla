import test from 'node:test';
import assert from 'node:assert/strict';
import {crearPlanoAdoquines} from './arena-babylon.js';

test('solo piedras enlazadas y círculo central sin decoración',()=>{
 const layout=crearPlanoAdoquines();
 assert.equal(layout.outerWidth,51,'ancho duplicado, no escala de adoquines');
 assert.equal(layout.outerDepth,34,'profundidad duplicada');
 assert.equal(layout.outerWidth*layout.outerDepth,1734,'4 veces el área original de 25.5 × 17');
 assert.ok(layout.stones.length>8500,'4 veces el área requiere miles de adoquines adicionales');
 assert.ok(layout.stones.some(s=>!s.circle && s.wx<.44 && s.wz<.38),
   'los adoquines mantienen dimensiones originales');
 assert.ok(layout.stones.some(s=>s.circle),'el círculo usa adoquines reales');
 assert.ok(layout.stones.some(s=>!s.circle),'existe un suelo exterior');
 assert.ok(layout.rings>=10,'círculo con anillos concéntricos');
 assert.equal(layout.stones.filter(s=>s.x===0&&s.z===0).length,1);
 for(const stone of layout.stones){
  assert.ok(Number.isFinite(stone.x)&&Number.isFinite(stone.z));
  assert.ok(stone.wx>0&&stone.wz>0);
  if(!stone.circle)assert.ok(Math.hypot(stone.x,stone.z)>=layout.circleRadius);
 }
});
