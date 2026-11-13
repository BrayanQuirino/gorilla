import test from 'node:test';
import assert from 'node:assert/strict';
import { accion_humano, accion_gorila, crear_atlas, dibujar_sprite } from './sprites.js';
function context(){return {fillRect(){},clearRect(){},drawImage(){},save(){},restore(){},translate(){},scale(){}};}
test('atlas produce cuatro fotogramas por animación, sin cargar recursos externos',()=>{
 const original=globalThis.document;
 globalThis.document={createElement:()=>({width:0,height:0,getContext:()=>context()})};
 try{
  const atlas=crear_atlas();
  for(const state of ['idle','walk','attack','charge','roar','rage','hurt','down']) assert.equal(atlas.gorila.get(state).length,4);
  assert.equal(atlas.humano('walk',2,0,false,true).length,4);
  assert.equal(atlas.humano('walk',2,0,false,true),atlas.humano('walk',2,0,false,true),'sprites are cached');
  dibujar_sprite(context(),atlas.gorila.get('idle'),200,200,60,70,0);
 }finally{globalThis.document=original;}
});
test('estados de animación reflejan el motor, no el arquetipo',()=>{
 assert.equal(accion_humano({vida:0,estado:'eliminado'}),'down');
 assert.equal(accion_humano({vida:20,estado:'normal',miedo:90}),'panic');
 assert.equal(accion_humano({vida:20,estado:'normal',miedo:0,oculto:true,orden:'emboscada'}),'ambush');
 assert.equal(accion_humano({vida:20,estado:'normal',miedo:0,oculto:false,energia:100,orden:'buscar_armas'}),'search');
 assert.equal(accion_gorila({vida:100,furia:5}),'rage');
 assert.equal(accion_gorila({vida:100,furia:0,fase:'aviso',accion:'rugido'}),'roar');
});
