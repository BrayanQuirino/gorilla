import test from 'node:test';
import assert from 'node:assert/strict';
import {crearPlanoCesped,COBERTURA_OBJETIVO} from './arena-cesped.js';
import {crearPlanoAdoquines} from './arena-babylon.js';
import {planoPiramides} from './arena-piramides.js';
import {planoCasasAntiguas} from './arena-casas.js';

test('40% de la suma de la superficie TOTAL, no por baldosa',()=>{
 const ground=crearPlanoAdoquines();
 const options={pyramids:planoPiramides(),houses:planoCasasAntiguas()};
 const a=crearPlanoCesped(ground,options);
 assert.equal(COBERTURA_OBJETIVO,.4);
 assert.equal(a.coveredCells,Math.round(a.totalCells*.4));
 assert.ok(Math.abs(a.coverage-.4)<1e-10);
 assert.ok(Math.abs(a.areaCovered-a.areaTotal*.4)<1e-8);
 assert.equal(a.mask.reduce((sum,x)=>sum+x,0),a.coveredCells,
  'sin doble contabilizar capas superpuestas');
 assert.ok(a.excludedCells>0);
 const b=crearPlanoCesped(ground,options);
 assert.deepEqual(a.mask,b.mask,'distribución estable y reproducible');
});
test('la invasión forma zonas completamente verdes y otras casi desnudas',()=>{
 const p=crearPlanoCesped(crearPlanoAdoquines(),{
  pyramids:planoPiramides(),houses:planoCasasAntiguas(),
  widthPx:240,heightPx:160
 });
 const {mask,widthPx:w,heightPx:h}=p,patches=[];
 // Measure 3x3-metre-ish windows. Local coverage is NOT forced to 40%.
 const span=18;
 for(let z=0;z<=h-span;z+=span)
  for(let x=0;x<=w-span;x+=span){
   let green=0;
   for(let j=z;j<z+span;j++)for(let i=x;i<x+span;i++)
    green+=mask[j*w+i];
   patches.push(green/(span*span));
  }
 assert.ok(patches.some(v=>v>.90),'parches con baldosa completamente invadida');
 assert.ok(patches.some(v=>v<.10),'pasillos y piedras todavía descubiertos');
});
test('no se dibuja vegetación bajo las bases de pirámides y casas',()=>{
 const ground=crearPlanoAdoquines();
 const pyramid=planoPiramides()[0],house=planoCasasAntiguas()[0];
 const p=crearPlanoCesped(ground,{
  pyramids:[pyramid],houses:[house],widthPx:240,heightPx:160
 });
 const at=(x,z)=>{
  const px=Math.floor((x/ground.outerWidth+.5)*p.widthPx);
  const py=Math.floor((z/ground.outerDepth+.5)*p.heightPx);
  return p.mask[py*p.widthPx+px];
 };
 assert.equal(at(pyramid.x,pyramid.z),0);
 assert.equal(at(house.x,house.z),0);
 assert.equal(p.coveredCells,Math.round(p.totalCells*.4));
});
