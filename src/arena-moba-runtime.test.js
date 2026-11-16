import test from 'node:test';
import assert from 'node:assert/strict';
import {crear_dibujante_moba} from './arena-moba.js';
import {obstaculos_escena} from './terreno.js';

function fakeWebGL(){
 const calls={draws:0,instances:0,meshes:0};
 const extension={
  vertexAttribDivisorANGLE(){},
  drawArraysInstancedANGLE(_mode,_start,_triangles,count){calls.instances+=count;calls.draws++;}
 };
 const attributes=new Map(['aPosition','aNormal','aColor','aInstancePosition','aInstanceInfo'].map((name,i)=>[name,i]));
 const gl=new Proxy({
  ARRAY_BUFFER:1,STATIC_DRAW:2,DYNAMIC_DRAW:3,VERTEX_SHADER:4,FRAGMENT_SHADER:5,
  COMPILE_STATUS:6,LINK_STATUS:7,DEPTH_TEST:8,LEQUAL:9,CULL_FACE:10,
  FLOAT:11,TRIANGLES:12,COLOR_BUFFER_BIT:13,DEPTH_BUFFER_BIT:14,
  createShader:()=>({}),createProgram:()=>({}),createBuffer:()=>({}),
  getShaderParameter:()=>true,getProgramParameter:()=>true,
  getShaderInfoLog:()=>'',getProgramInfoLog:()=>'',getAttribLocation:(_,key)=>attributes.get(key),
  getUniformLocation:()=>({}),getExtension:()=>extension,isContextLost:()=>false,
  drawArrays(){calls.draws++},
  bufferData(){calls.meshes++}
 },{get(obj,key){return key in obj?obj[key]:(()=>{});}});
 return {gl,calls};
}
test('all arenas render 100 3D combatants through GPU instances',()=>{
 const {gl,calls}=fakeWebGL();
 const handlers=new Map();
 const canvas={
  width:1000,height:640,getContext:()=>gl,
  addEventListener:(name,cb)=>handlers.set(name,cb),
  removeEventListener:name=>handlers.delete(name)
 };
 const render=crear_dibujante_moba(canvas,()=>{},()=>{throw Error('unhandled WebGL failure')});
 const hombres=Array.from({length:100},(_,i)=>({
  id:i+1,x:50+i%10*90,y:50+Math.floor(i/10)*53,
  arquetipo:i%5===0?'Paramédico':i%5===1?'Boxeador':i%5===2?'Anciano':'Oficinista',
  estado:'normal',vida:25,vx:15,vy:12
 }));
 for(const arena of ['claro','selva','canon','hangar']){
  assert.equal(render({
   arena,hombres,gorila:{x:500,y:320,vida:700,radio:26,movimiento:10,fase:'espera'},
   armas_suelo:[],suministros:[],transcurrido:2
  }),true);
  assert.ok(obstaculos_escena(arena).length>0);
 }
 assert.equal(calls.instances,400,'100 humano meshes per frame, four different arenas');
 assert.ok(calls.draws>=20,'one ground mesh, gorilla and instanced archetype groups');
 render.liberar();
 assert.equal(handlers.size,0,'input and context handlers cleaned up');
});
