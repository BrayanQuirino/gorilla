import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=file=>readFileSync(new URL('../'+file,import.meta.url),'utf8');

test('la portada dirige a arena 3D independiente, salvo combate explícito',()=>{
 const html=read('index.html');
 assert.match(html,/get\('combate'\) !== '1'/);
 assert.match(html,/new URL\('\.\/arena\.html', location\.href\)/);
 assert.match(html,/location\.replace\(url\.href\)/);
});
test('la arena no carga React ni los renderizadores antiguos',()=>{
 const html=read('arena.html');
 const script=read('src/arena-preview.js');
 const vite=read('vite.config.js');
 assert.match(html,/src\/arena-preview\.js/);
 assert.doesNotMatch(html,/main\.jsx|arena-three|arena-moba|battle\.js/i);
 assert.doesNotMatch(script.replace(/^\/\/.*$/gm,''),/\breact\b|arena-three|crear_dibujante_three|battle\.js/i);
 assert.match(script,/crear_dibujante_babylon/);
 assert.match(vite,/arena:resolve\('arena\.html'\)/);
 assert.match(html,/\?combate=1/);
});
