import test from 'node:test';
import assert from 'node:assert/strict';
import {elegirDetallePiso,UMBRAL_ADOQUIN_PX} from './arena-piso-lod.js';

test('vista distante usa un único piso panorámico; cerca mantiene adoquines 3D',()=>{
 assert.equal(UMBRAL_ADOQUIN_PX,9);
 assert.equal(elegirDetallePiso(2,false),false);
 assert.equal(elegirDetallePiso(8,false),false);
 assert.equal(elegirDetallePiso(9,false),true);
 assert.equal(elegirDetallePiso(8,true),true,'histeresis impide saltos de LOD');
 assert.equal(elegirDetallePiso(7.49,true),false);
 assert.equal(elegirDetallePiso(18,false),true);
});
test('piso panorámico usa textura con mipmaps, hierba integrada y una sola malla',async()=>{
 const {construirPisoLejano}=await import('./arena-piso-lod.js');
 const {crearPlanoAdoquines}=await import('./arena-babylon.js');
 const layout=crearPlanoAdoquines();
 const fakeContext={
  fillRect(){},save(){},restore(){},translate(){},rotate(){},
  beginPath(){},moveTo(){},lineTo(){},closePath(){},fill(){},
  stroke(){},setTransform(){},drawImage(){},createImageData(w,h){
   return {data:new Uint8ClampedArray(w*h*4)};
  },putImageData(){}
 };
 let tex,ground;
 class DynamicTexture{
  constructor(name,dimensions,scene,mips){
   assert.equal(mips,true,'mipmaps evitan shimmer');
   tex=this;this.context=fakeContext;this.dimensions=dimensions;
  }
  getContext(){return this.context;}
  update(){}
  updateSamplingMode(v){this.sampling=v;}
 }
 class StandardMaterial{}
 class Color3{static White(){return new Color3();}static Black(){return new Color3();}}
 const B={DynamicTexture,StandardMaterial,Color3,
  MeshBuilder:{CreateGround(name,options){
   ground={name,options,position:{y:0},setEnabled(v){this.enabled=v;}};
   return ground;
  }},
  Texture:{CLAMP_ADDRESSMODE:3,TRILINEAR_SAMPLINGMODE:4}};
 const oldDocument=globalThis.document;
 globalThis.document={createElement(){return {width:0,height:0,getContext(){return fakeContext;}};}};
 try{
  const plan={mask:new Uint8Array(4),widthPx:2,heightPx:2};
  const lod=construirPisoLejano(B,{},layout,plan);
  assert.equal(lod.stonesBaked,layout.stones.length);
  assert.equal(lod.mesh,ground);
  assert.equal(lod.mesh.enabled,false);
  assert.equal(lod.texture,tex);
  assert.equal(tex.sampling,B.Texture.TRILINEAR_SAMPLINGMODE);
  assert.equal(ground.position.y,.095);
 }finally{globalThis.document=oldDocument;}
});
