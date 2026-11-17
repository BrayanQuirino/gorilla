import test from 'node:test';
import assert from 'node:assert/strict';
import {planoCasasAntiguas,construirCasasAntiguas,METROS_POR_UNIDAD,ESCALA_CASAS} from './arena-casas.js';
import {planoPiramides} from './arena-piramides.js';
import {crearPlanoAdoquines} from './arena-babylon.js';

test('seis ruinas de casas con siluetas diferentes, a escala y sin invadir la arena',()=>{
 const houses=planoCasasAntiguas();
 const {circles,outerWidth,outerDepth}=crearPlanoAdoquines();
 assert.equal(houses.length,6);
 assert.deepEqual(new Set(houses.map(h=>h.variant)),new Set([
  'fachada_colapsada','patio_u','dos_camaras',
  'rectangular_fachada','taller_ruinoso','compacta_anexo']));
 assert.ok(Math.abs(METROS_POR_UNIDAD-40/4.76)<1e-9);
 assert.equal(ESCALA_CASAS,2);
 assert.ok(houses.every(h=>h.scale===2));
 assert.ok(houses.every(h=>h.heightMetros>=6&&h.heightMetros<=11));
 assert.ok(houses.every(h=>Math.abs(h.heightMetros-h.height*2*METROS_POR_UNIDAD)<.06));
 assert.ok(houses.every(h=>Math.abs(h.footprintRadius-(Math.hypot(h.lengthX,h.lengthZ)/2+.52)*2)<1e-9));
 assert.equal(new Set(houses.map(h=>h.x)).size,6);
 assert.equal(new Set(houses.map(h=>h.z)).size,6);
 for(const h of houses){
  const radius=h.footprintRadius;
  assert.ok(Math.abs(h.x)+radius<outerWidth/2,'dentro de límites X');
  assert.ok(Math.abs(h.z)+radius<outerDepth/2,'dentro de límites Z');
  for(const c of circles)
   assert.ok(Math.hypot(h.x-c.x,h.z-c.z)>c.r+radius+.6,
    'la ruina no invade círculos');
  for(const p of planoPiramides())
   assert.ok(Math.hypot(
     Math.max(0,Math.abs(h.x-p.x)-p.size/2),
     Math.max(0,Math.abs(h.z-p.z)-p.size/2))>radius+.6,
     'las casas no colisionan con pirámides');
 }
 for(let i=0;i<houses.length;i++)
  for(let j=i+1;j<houses.length;j++)
   assert.ok(Math.hypot(houses[i].x-houses[j].x,houses[i].z-houses[j].z)>
    houses[i].footprintRadius+houses[j].footprintRadius+.5,
    'casas separadas entre sí');
});
test('seis viviendas diferentes incluyen muros, accesos, pisos y escombros',()=>{
 const names=[];
 const vec=()=>({set(){}});
 class StandardMaterial{}
 class Color3{static FromHexString(){return new Color3();}}
 class TransformNode{constructor(){this.position=vec();this.scaling=vec();this.rotation={y:0};}}
 const B={StandardMaterial,Color3,TransformNode,
  MeshBuilder:{CreateBox(name){names.push(name);
   return {position:vec(),rotation:{x:0,y:0,z:0}};}}};
 const result=construirCasasAntiguas(B,{});
 assert.equal(result.sites.length,6);
 assert.ok(result.stoneBlocks>250,'mampostería real, no decoraciones planas');
 assert.ok(names.filter(n=>n.includes('sillar')).length>180);
 assert.ok(names.filter(n=>n.startsWith('Escombro')).length>=170);
 assert.ok(names.some(n=>n.includes('Dintel')));
 assert.ok(names.some(n=>n.includes('Banco de piedra')));
 assert.ok(names.some(n=>n.includes('Mesa de trabajo')));
 assert.ok(names.some(n=>n.includes('Viga antigua')));
 assert.ok(names.some(n=>n.includes('Pilar de patio')));
});
