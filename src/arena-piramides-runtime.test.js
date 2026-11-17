import test from 'node:test';
import assert from 'node:assert/strict';
import {construirPiramides} from './arena-piramides.js';

test('las tres pirámides se construyen sin pasar booleanos al generador de sombras',()=>{
 let meshes=0,casters=0;
 const v=()=>({set(){}});
 class Color3{constructor(r,g,b){this.r=r;this.g=g;this.b=b;}
  static FromHexString(hex){return new Color3(1,1,1);}
 }
 class StandardMaterial{constructor(name){this.name=name;}}
 class TransformNode{constructor(name){this.name=name;this.position=v();this.rotation={y:0};}}
 class DynamicTexture{
  constructor(){this.ctx={createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)}),
   putImageData(){}};}
  getContext(){return this.ctx;}
  update(){}
 }
 class ShadowGenerator{
  static QUALITY_LOW=1;
  constructor(){this.casters=[];}
  addShadowCaster(mesh){
   assert.ok(mesh?.position,'shadow API must receive a Babylon mesh');
   casters++;
   this.casters.push(mesh);
  }
 }
 const B={Color3,StandardMaterial,TransformNode,DynamicTexture,ShadowGenerator,
  Texture:{WRAP_ADDRESSMODE:1},
  MeshBuilder:{CreateBox(name){meshes++;return {
   name,position:v(),rotation:{x:0,y:0,z:0},receiveShadows:false
  };}}};
 const result=construirPiramides(B,{}, {name:'sun'});
 assert.equal(result.sites.length,3);
 assert.equal(result.complete,1);
 assert.equal(result.medium,1);
 assert.equal(result.collapsed,1);
 assert.ok(meshes>150,'ancient stone masonry is genuinely built');
 assert.ok(casters>10,'real shadow generator receives the meshes');
});
