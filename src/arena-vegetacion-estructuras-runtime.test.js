import test from 'node:test';
import assert from 'node:assert/strict';
import {registrarPiedraArquitectonica,construirVegetacionEstructuras}
 from './arena-vegetacion-estructuras.js';

test('Babylon runtime: actual stone faces become a lit moss mesh at 40%',()=>{
 const scene={};
 const vectors=[];
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
  applyToMesh(mesh){mesh.data=this;vectors.push(mesh);}
  static ComputeNormals(positions,indices,out){
   for(let i=0;i<positions.length;i++)out.push(0);
  }
 }
 const B={Vector3,Color3,StandardMaterial,Mesh,VertexData};
 const mesh={computeWorldMatrix(){},getWorldMatrix(){return {};}};
 registrarPiedraArquitectonica(scene,mesh,4,2,3,'Pared de caliza');
 const result=construirVegetacionEstructuras(B,scene);
 assert.equal(result.stones,1);
 assert.ok(result.faces>100);
 assert.ok(Math.abs(result.coverage-.4)<1e-10);
 assert.ok(result.ferns.tufts>=0);
 assert.ok(result.moss.data.positions.length>0);
 assert.equal(result.moss.data.normals.length,result.moss.data.positions.length);
 assert.equal(result.moss.data.colors.length/4,result.moss.data.positions.length/3);
 assert.equal(vectors.length,result.ferns.mesh?2:1);
});
