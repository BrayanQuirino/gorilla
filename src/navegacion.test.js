import test from 'node:test';
import assert from 'node:assert/strict';
import {navegacion_diagnostico,transitable,paso_libre,siguiente_punto} from './navegacion.js';
import {obstaculos_escena} from './terreno.js';

test('every 3D arena has useful free navigation space and physical obstacles',()=>{
 for(const arena of ['claro','selva','canon','hangar']){
  const g=navegacion_diagnostico(arena);
  assert.ok(g.walkable>550&&g.walkable<g.cells,arena+' needs open ground and solid props');
  assert.ok(g.obstacles>=6);
 }
});

test('humans route around rock footprints, never cut straight through them',()=>{
 for(const arena of ['claro','selva','canon','hangar']){
  const rock=obstaculos_escena(arena).find(o=>o.tipo==='roca'||o.tipo==='contenedor')||obstaculos_escena(arena)[0];
  const human={id:7,x:rock.x-rock.rx-78,y:rock.y,vx:0,vy:0};
  const target={x:rock.x+rock.rx+78,y:rock.y};
  assert.equal(paso_libre(human,target,arena,11,'humano'),false,arena+' rock blocks a direct step');
  const next=siguiente_punto(human,target,arena,0,'humano');
  assert.ok(Number.isFinite(next.x)&&Number.isFinite(next.y));
  assert.ok(paso_libre(human,next,arena,11,'humano'),arena+' next waypoint must be accessible');
  assert.ok(Math.hypot(next.x-target.x,next.y-target.y)>8,arena+' goes around obstacle');
 }
});

test('gorilla has exclusive traversability on designated climbable rock slopes',()=>{
 for(const arena of ['claro','selva','canon']){
  const rock=obstaculos_escena(arena).find(o=>o.tipo==='roca');
  assert.ok(rock,arena+' has a climbable rock');
  assert.equal(transitable({x:rock.x,y:rock.y},arena,11,'humano'),false);
  assert.equal(transitable({x:rock.x,y:rock.y},arena,20,'gorila'),true);
 }
 const crate=obstaculos_escena('hangar').find(o=>o.tipo==='contenedor');
 assert.equal(transitable({x:crate.x,y:crate.y},'hangar',20,'gorila'),false);
});

test('100 agents can reuse routes without teleporting when a target shifts',()=>{
 const arena='selva',goal={x:520,y:350};
 for(let i=0;i<100;i++){
  const actor={id:i+1,x:40+(i%10)*92,y:60+Math.floor(i/10)*47};
  const next=siguiente_punto(actor,goal,arena,0,'humano');
  assert.ok(next&&Number.isFinite(next.x)&&Number.isFinite(next.y));
  const newer=siguiente_punto(actor,{x:540,y:355},arena,.05,'humano');
  assert.ok(newer&&Number.isFinite(newer.x));
 }
});
