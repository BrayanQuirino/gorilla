import test from 'node:test';
import assert from 'node:assert/strict';
import {obstaculos_escena,obstaculo_humano,ruta_humano,corregir_paso_humano,encuadre,ancho,alto} from './terreno.js';

test('all four arenas expose corresponding 2.5D solid scenery',()=>{
 for(const arena of ['claro','selva','canon','hangar']){
  const obstacles=obstaculos_escena(arena);
  assert.ok(obstacles.length>=6,arena+' should have six or more physical props');
  assert.ok(obstacles.every(o=>o.tipo&&o.rx>0&&o.ry>0&&o.altura>0));
  assert.equal(new Set(obstacles.map(o=>o.id)).size,obstacles.length);
  assert.ok(obstacles.every(o=>Number.isFinite(o.x)&&Number.isFinite(o.y)));
 }
});

test('gorilla-sized routing does not select a straight line through a solid prop',()=>{
 for(const arena of ['claro','selva','canon','hangar']){
  const o=obstaculos_escena(arena)[0];
  const actor={id:201,x:o.x-o.rx-80,y:o.y,vx:0,vy:0};
  const destino={x:o.x+o.rx+80,y:o.y};
  const d=ruta_humano(actor,destino,arena,28);
  assert.ok(Number.isFinite(d.x)&&Number.isFinite(d.y));
  assert.notDeepEqual(d,destino,arena+' must choose a route around the prop');
  const before={x:actor.x,y:actor.y};
  actor.x=o.x;actor.y=o.y;
  corregir_paso_humano(actor,before,arena,25);
  assert.equal(obstaculo_humano(actor,arena,25),false,arena+' cannot remain inside scenery');
 }
});
