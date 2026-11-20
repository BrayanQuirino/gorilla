import test from 'node:test';
import assert from 'node:assert/strict';
import {registrarPiedraArquitectonica,construirVegetacionEstructuras,
 intensidadSelvatica} from './arena-vegetacion-estructuras.js';

test('alfombra única world-space sin cuadrados verdes por bloque, cobertura 40%',()=>{
 const scene={};
 const assets=[];
 class Vector3{
  constructor(x,y,z){this.x=x;this.y=y;this.z=z;}
  static TransformCoordinates(v){return new Vector3(v.x,v.y,v.z);}
  static TransformNormal(v){return new Vector3(v.x,v.y,v.z);}
 }
 class Color3{
  constructor(){}
  static White(){return new Color3();}
  static Black(){return new Color3();}
 }
 class StandardMaterial{constructor(){this.backFaceCulling=true;}}
 class Mesh{constructor(name){this.name=name;}}
 class VertexData{
  applyToMesh(mesh){mesh.data=this;assets.push(mesh);}
  static ComputeNormals(positions,indices,out){
   for(let i=0;i<positions.length;i++)out.push(0);
  }
 }
 class DynamicTexture{
  constructor(name,{width,height}){this.width=width;this.height=height;
   this.ctx={createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)}),
    putImageData(){}};}
  getContext(){return this.ctx;}
  update(){}
 }
 const B={Vector3,Color3,StandardMaterial,Mesh,VertexData,DynamicTexture,
  Texture:{CLAMP_ADDRESSMODE:1},Material:{MATERIAL_ALPHATEST:1}};
 const mesh={computeWorldMatrix(){},getWorldMatrix(){return {};}};
 registrarPiedraArquitectonica(scene,mesh,4,2,3,'Pared de caliza');
 const result=construirVegetacionEstructuras(B,scene);
 assert.equal(result.stones,1);
 assert.ok(result.faces>0);
 assert.ok(Math.abs(result.coverage-.4)<1e-10);
 assert.ok(result.materialContinuo);
 assert.ok(result.moss.name.includes('Alfombra selvática continua'));
 assert.equal(result.overlays.length,3,'tres proyecciones globales para techo y paredes');
 assert.equal(result.moss.data.positions.length/3,4,
  'toda cara superior tiene una sola proyección con transparencia');
 assert.equal(result.moss.data.uvs.length,8);
 assert.equal(result.verticalFaces,4);
 assert.ok(result.wallTufts>0,'hojas 3D también sobresalen de las paredes');
 assert.ok(result.overlays.every(mesh=>mesh.material.useAlphaFromDiffuseTexture));
 assert.ok(result.moss.material.useAlphaFromDiffuseTexture);
 assert.ok(result.moss.material.diffuseTexture.hasAlpha);
 assert.ok(result.ferns.tufts>0);
 assert.equal(assets.length,4,'tres coberturas continuas y un follaje 3D');
 assert.ok(Math.abs(intensidadSelvatica(5,8)-intensidadSelvatica(5,8))<1e-10);
});
