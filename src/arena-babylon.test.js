import test from 'node:test';
import assert from 'node:assert/strict';
import {crearPlanoAdoquines,calcularEncuadreArena} from './arena-babylon.js';

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

test('encuadre isométrico contiene TODAS las esquinas a cualquier giro y relación de pantalla',()=>{
 const layout=crearPlanoAdoquines();
 for(const aspect of [.58,1,1.56,2.8]){
  for(const beta of [.29,.65,1.05]){
   for(let i=0;i<24;i++){
    const alpha=i*Math.PI/12;
    const fit=calcularEncuadreArena(aspect,alpha,beta);
    for(const x of [-layout.outerWidth/2,layout.outerWidth/2]){
     for(const z of [-layout.outerDepth/2,layout.outerDepth/2]){
      const screenX=-x*Math.sin(alpha)+z*Math.cos(alpha);
      const screenY=-x*Math.cos(alpha)*Math.cos(beta)-z*Math.sin(alpha)*Math.cos(beta);
      assert.ok(Math.abs(screenX)<fit*aspect,'sin recorte horizontal');
      assert.ok(Math.abs(screenY)<fit,'sin recorte vertical');
     }
    }
   }
  }
 }
});

test('anchos de piedras diferentes como en mampostería antigua',()=>{
 const exterior=crearPlanoAdoquines().stones.filter(s=>!s.circle);
 const unique=new Set(exterior.slice(0,400).map(s=>s.wx.toFixed(2)));
 assert.ok(unique.size>12,'no se repiten baldosas idénticas');
 assert.ok(Math.max(...exterior.slice(0,100).map(s=>s.wx))>
  1.4*Math.min(...exterior.slice(0,100).map(s=>s.wx)));
});

test('opción A: las nueve plazas tienen rellenos trapezoidales en juntas estrechas',()=>{
 const layout=crearPlanoAdoquines();
 for(let plaza=0;plaza<9;plaza++){
  const fillers=layout.stones.filter(stone=>stone.plaza===plaza&&stone.polygon);
  assert.ok(fillers.length>180,'hay piedras pequeñas a ambos lados de la transición');
  assert.ok(fillers.every(stone=>stone.wx<.28&&stone.wz<.22),
   'los rellenos son piezas pequeñas y no adoquines gigantes');
  assert.ok(fillers.every(stone=>stone.polygon.length===4),
   'cada pieza tiene vértices trapezoidales');
 }
 const exterior=layout.stones.filter(stone=>!stone.circle&&!stone.trimmed);
 assert.ok(exterior.every(stone=>stone.wz>=.34),'juntas horizontales casi invisibles');
});
