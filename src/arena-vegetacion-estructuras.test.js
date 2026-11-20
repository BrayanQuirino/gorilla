import test from 'node:test';
import assert from 'node:assert/strict';
import {COBERTURA_ESTRUCTURAS,seleccionarCoberturaGlobal,
 registrarPiedraArquitectonica,contarPiedrasArquitectonicas,
 construirVegetacionEstructuras} from './arena-vegetacion-estructuras.js';
import {construirPiramides} from './arena-piramides.js';
import {construirCasasAntiguas} from './arena-casas.js';

test('40% ponderado por superficie total, no cuota por vivienda o pirámide',()=>{
 const cells=[
  {area:100,score:.9,owner:'pirámide'},
  {area:60,score:.7,owner:'pirámide'},
  {area:40,score:.2,owner:'casa'},
  {area:30,score:.8,owner:'casa'},
  {area:20,score:.5,owner:'casa'}
 ];
 const plan=seleccionarCoberturaGlobal(cells);
 assert.equal(COBERTURA_ESTRUCTURAS,.4);
 assert.equal(plan.totalArea,250);
 assert.equal(plan.coveredArea,100);
 assert.equal(plan.coverage,.4);
 assert.ok(plan.selected.length<cells.length);
 const fractional=seleccionarCoberturaGlobal(cells,.41);
 assert.ok(Math.abs(fractional.coverage-.41)<1e-12);
 assert.ok(fractional.selected.some(x=>x.fraction<1));
});
test('registra bloques de arquitectura y excluye vigas',()=>{
 const scene={},mesh={};
 registrarPiedraArquitectonica(scene,mesh,.5,.4,.3,'Piedra tallada');
 registrarPiedraArquitectonica(scene,mesh,.5,.4,.3,'Viga antigua de madera colapsada');
 assert.equal(contarPiedrasArquitectonicas(scene),1);
});
test('el constructor usa realmente los bloques de las nueve estructuras',()=>{
 const scene={};
 const vector=()=>({x:0,y:0,z:0,set(x,y,z){this.x=x;this.y=y;this.z=z;}});
 class Color3{static FromHexString(){return new Color3();}}
 class StandardMaterial{}
 class ShadowGenerator{static QUALITY_LOW=1;addShadowCaster(){}}
 class DynamicTexture{
  constructor(){this.ctx={createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)}),
   putImageData(){}};}
  getContext(){return this.ctx;}update(){}
 }
 class TransformNode{constructor(){this.position=vector();this.rotation={y:0};this.scaling=vector();}}
 const B={Color3,StandardMaterial,ShadowGenerator,DynamicTexture,TransformNode,
  Texture:{WRAP_ADDRESSMODE:1},
  MeshBuilder:{CreateBox(){return {position:vector(),rotation:{x:0,y:0,z:0}};}}};
 construirPiramides(B,scene,{});
 const fromPyramids=contarPiedrasArquitectonicas(scene);
 construirCasasAntiguas(B,scene);
 assert.ok(fromPyramids>100);
 assert.ok(contarPiedrasArquitectonicas(scene)>fromPyramids+150);
});
