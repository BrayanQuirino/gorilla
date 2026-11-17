import test from 'node:test';
import assert from 'node:assert/strict';
import {planoCasasAntiguas,construirCasasAntiguas,METROS_POR_UNIDAD} from './arena-casas.js';
import {planoPiramides} from './arena-piramides.js';
import {crearPlanoAdoquines} from './arena-babylon.js';

test('cuatro viviendas antiguas asimétricas, pequeñas y separadas de las plazas',()=>{
 const houses=planoCasasAntiguas();
 const {circles,outerWidth,outerDepth}=crearPlanoAdoquines();
 assert.equal(houses.length,4);
 assert.ok(Math.abs(METROS_POR_UNIDAD-40/4.76)<1e-9);
 assert.ok(houses.every(h=>h.heightMetros>=3&&h.heightMetros<=5.5),
   'los muros sobrevivientes miden aproximadamente 3 a 5 metros');
 assert.equal(new Set(houses.map(h=>h.x)).size,4);
 assert.equal(new Set(houses.map(h=>h.z)).size,4);
 for(const h of houses){
  const radius=Math.hypot(h.lengthX,h.lengthZ)+.5;
  assert.ok(Math.abs(h.x)+radius<outerWidth/2);
  assert.ok(Math.abs(h.z)+radius<outerDepth/2);
  for(const c of circles)
   assert.ok(Math.hypot(h.x-c.x,h.z-c.z)>c.r+radius+.5,
    'las ruinas no invaden círculos de combate');
  for(const p of planoPiramides())
   assert.ok(Math.hypot(Math.max(0,Math.abs(h.x-p.x)-p.size/2),
     Math.max(0,Math.abs(h.z-p.z)-p.size/2))>radius+.5,
     'las viviendas no se superponen con pirámides');
 }
});
test('la geometría de las casas crea esquinas con dos muros y escombros',()=>{
 let wallNames=[],meshes=0;
 const vec=()=>({set(){}});
 class StandardMaterial{}
 class Color3{constructor(){}static FromHexString(){return new Color3();}}
 class TransformNode{constructor(){this.position=vec();this.rotation={y:0};}}
 const B={StandardMaterial,Color3,TransformNode,
  MeshBuilder:{CreateBox(name){wallNames.push(name);meshes++;
   return {position:vec(),rotation:{x:0,y:0,z:0}};}}};
 const result=construirCasasAntiguas(B,{});
 assert.equal(result.sites.length,4);
 assert.ok(result.stoneBlocks>85);
 assert.ok(wallNames.filter(n=>n.startsWith('Muro conservado')).length>35);
 assert.ok(wallNames.filter(n=>n.startsWith('Muro colapsado')).length>15);
 assert.ok(wallNames.filter(n=>n.startsWith('Escombro')).length>50);
 assert.ok(meshes>130);
});
