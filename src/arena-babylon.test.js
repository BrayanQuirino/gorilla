import test from 'node:test';
import assert from 'node:assert/strict';
import {crearPlanoAdoquines} from './arena-babylon.js';

test('el piso duplica el área con nueve círculos perfectamente simétricos',()=>{
 const layout=crearPlanoAdoquines();
 assert.ok(Math.abs(layout.outerWidth-51*Math.SQRT2)<1e-8);
 assert.ok(Math.abs(layout.outerDepth-34*Math.SQRT2)<1e-8);
 assert.ok(Math.abs(layout.outerWidth*layout.outerDepth-3468)<1e-8,
  'el área anterior era 1734: ahora exactamente el doble');
 assert.equal(layout.circles.length,9,'retícula simétrica de 3 por 3');
 const centers=new Set(layout.circles.map(c=>c.x.toFixed(4)+','+c.z.toFixed(4)));
 for(const c of layout.circles){
  assert.ok(centers.has((-c.x).toFixed(4)+','+c.z.toFixed(4)),
   'simetría horizontal');
  assert.ok(centers.has(c.x.toFixed(4)+','+(-c.z).toFixed(4)),
   'simetría vertical');
  assert.equal(c.r,layout.circleRadius);
 }
 assert.ok(layout.stones.length>15000,'crece el número de baldosas');
 assert.ok(layout.stones.some(s=>!s.circle&&s.wx<.44&&s.wz<.38),
   'se conserva la dimensión de las baldosas');
 assert.equal(layout.stones.filter(s=>s.circle&&s.x===0&&s.z===0).length,1);
 for(const stone of layout.stones){
  assert.ok(Number.isFinite(stone.x)&&Number.isFinite(stone.z));
  assert.ok(stone.wx>0&&stone.wz>0);
  if(!stone.circle)for(const c of layout.circles)
   assert.ok(Math.hypot(stone.x-c.x,stone.z-c.z)>=c.r);
 }
});
