import test from 'node:test';
import assert from 'node:assert/strict';
import {distanciaPellizco,calcularZoomPellizco,instalarZoomTactil,
 ZOOM_MINIMO,ZOOM_MAXIMO,zoomInicialPantalla} from './arena-zoom.js';

test('alejar dos dedos acerca la cámara ortográfica, juntarlos aleja',()=>{
 assert.equal(distanciaPellizco({clientX:0,clientY:0},{clientX:0,clientY:100}),100);
 assert.equal(calcularZoomPellizco(1,100,200),.5);
 assert.equal(calcularZoomPellizco(1,100,50),2);
 assert.equal(calcularZoomPellizco(1,100,100),1);
 assert.equal(calcularZoomPellizco(.3,100,500),.06);
 assert.equal(calcularZoomPellizco(.3,100,1500),ZOOM_MINIMO);
 assert.equal(ZOOM_MINIMO,.035);
 assert.ok(1/ZOOM_MINIMO>28);
 assert.equal(calcularZoomPellizco(2.4,100,10),ZOOM_MAXIMO);
 assert.equal(calcularZoomPellizco(1,0,100),1);
});
test('el pellizco funciona con dos dedos, respeta giro de un dedo y libera eventos',()=>{
 const callbacks=new Map();
 const canvas={
  addEventListener(name,cb,options){assert.equal(options.passive,false);callbacks.set(name,cb);},
  removeEventListener(name,cb){assert.equal(callbacks.get(name),cb);callbacks.delete(name);}
 };
 let zoom=1,called=0,prevented=0;
 const release=instalarZoomTactil(canvas,()=>zoom,z=>{zoom=z;called++;});
 const touch=(a,b)=>({touches:b===undefined?[{clientX:0,clientY:a}]:
  [{clientX:0,clientY:a},{clientX:0,clientY:b}],
  cancelable:true,preventDefault(){prevented++;}});
 callbacks.get('touchstart')(touch(0,100));
 callbacks.get('touchmove')(touch(0,200));
 assert.equal(zoom,.5);
 assert.equal(called,1);
 assert.equal(prevented,2);
 callbacks.get('touchend')({touches:[]});
 callbacks.get('touchstart')(touch(20));
 callbacks.get('touchmove')(touch(80));
 assert.equal(called,1,'un dedo debe seguir sirviendo para rotar');
 release();
 assert.equal(callbacks.size,0);
});

test('la vista móvil inicia más cercana y el escritorio conserva el encuadre',()=>{
 assert.equal(zoomInicialPantalla(390,844,true),.64);
 assert.equal(zoomInicialPantalla(844,390,true),.78);
 assert.equal(zoomInicialPantalla(390,844,false),1);
});
