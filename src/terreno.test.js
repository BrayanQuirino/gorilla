import test from 'node:test';
import assert from 'node:assert/strict';
import { obstaculo_humano, ruta_humano, corregir_paso_humano, agua_humano, altura_humano } from './terreno.js';

test('los humanos rodean montañas, no atraviesan su centro',()=>{
  const persona={id:4,x:320,y:292,vx:30,vy:0};
  const destino={x:640,y:292};
  const paso=ruta_humano(persona,destino,'claro');
  assert.notDeepEqual(paso,destino,'debe elegir un punto lateral');
  assert.equal(obstaculo_humano({x:454,y:292},'claro'),true);
  assert.equal(obstaculo_humano(paso,'claro',0),false);
  const anterior={x:320,y:292};
  persona.x=454;persona.y=292;
  corregir_paso_humano(persona,anterior,'claro');
  assert.deepEqual([persona.x,persona.y],[320,292]);
});
test('los humanos pueden cruzar el agua, sin subir montañas',()=>{
  assert.equal(agua_humano({x:40,y:540},'claro'),true);
  assert.equal(agua_humano({x:730,y:300},'claro'),false);
  assert.equal(altura_humano({x:454,y:292},'claro'),0);
});
