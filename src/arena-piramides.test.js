import test from 'node:test';
import assert from 'node:assert/strict';
import {planoPiramides} from './arena-piramides.js';
import {crearPlanoAdoquines} from './arena-babylon.js';

test('pirámides antiguas: completas y derrumbadas con espacio de combate libre',()=>{
 const p=planoPiramides(),arena=crearPlanoAdoquines();
 assert.equal(p.length,6,'seis templos en la arena');
 assert.equal(p.filter(t=>t.ruined).length,3,'tres estructuras colapsadas');
 assert.equal(p.filter(t=>!t.ruined).length,3,'tres pirámides conservadas');
 assert.ok(p.every(t=>t.levels>=6&&t.height>3));
 for(const t of p){
  const half=t.size/2;
  assert.ok(Math.abs(t.x)+half<arena.outerWidth/2,
   'la estructura permanece dentro del borde horizontal');
  assert.ok(Math.abs(t.z)+half<arena.outerDepth/2,
   'la estructura permanece dentro del borde vertical');
  for(const c of arena.circles){
   const dx=Math.max(0,Math.abs(t.x-c.x)-half);
   const dz=Math.max(0,Math.abs(t.z-c.z)-half);
   assert.ok(Math.hypot(dx,dz)>c.r+.4,
    'no se invade ni tapa una zona circular de combate');
  }
 }
 for(let i=0;i<p.length;i++)
  for(let j=i+1;j<p.length;j++)
   assert.ok(Math.hypot(p[i].x-p[j].x,p[i].z-p[j].z)>
    (p[i].size+p[j].size)/2+.7,'pirámides separadas');
});
