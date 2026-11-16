import test from 'node:test';
import assert from 'node:assert/strict';
import {diagnostico_geometria_moba} from './arena-moba.js';
import {obstaculos_escena} from './terreno.js';

test('all four arenas generate actual 3D triangle meshes, not stretched pixel art',()=>{
 for(const arena of ['claro','selva','canon','hangar']){
  const mesh=diagnostico_geometria_moba(arena);
  assert.ok(mesh.vertices>9000,arena+' needs substantial mesh geometry');
  assert.equal(mesh.obstaculos,obstaculos_escena(arena).length);
  assert.ok(mesh.colores.ground.length===3&&mesh.colores.rock.length===3);
  assert.ok(mesh.limites.x>10&&mesh.limites.z>8);
 }
});

test('each solid collider has a corresponding sculpted scene obstacle',()=>{
 for(const arena of ['claro','selva','canon','hangar']){
  assert.ok(obstaculos_escena(arena).every(o=>o.tipo&&o.rx>0&&o.ry>0&&o.altura>0));
  assert.equal(new Set(obstaculos_escena(arena).map(o=>o.id)).size,obstaculos_escena(arena).length);
 }
});
