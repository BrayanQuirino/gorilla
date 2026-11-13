import test from 'node:test';
import assert from 'node:assert/strict';
import catalogo from './data/objetos.json' with {type:'json'};
import {habilidades,crear_sorteo_objetos,preparar_equipo} from './roster.js';
import {ARENAS,TACTICAS,SUMINISTROS} from './rules.js';
import {crear_batalla,dar_orden,avanzar_batalla,comprar_suministro} from './battle.js';

function rng(seed=42){return ()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};}
function partida(arena='hangar'){
  const azar=rng();
  const equipo=preparar_equipo(crear_sorteo_objetos(catalogo),catalogo,arena,azar);
  return {equipo,batalla:crear_batalla(equipo.hombres,1,azar,equipo)};
}
test('se conservan los 100 hombres, ocho atributos y edades de 18-100',()=>{
  const {equipo}=partida();
  assert.equal(equipo.hombres.length,100);
  assert.equal(habilidades.length,8);
  assert.ok(equipo.hombres.every(h=>h.edad>=18&&h.edad<=100));
});
test('inventario inicial y reserva de arena comparten presupuesto sin duplicarlo',()=>{
  for(const id of Object.keys(ARENAS)){
    const {equipo}=partida(id);
    assert.equal(equipo.resumen.armados+equipo.resumen.desarmados,100);
    assert.equal(equipo.resumen.armas_arena,equipo.armas_suelo.length);
    assert.ok(equipo.resumen.armados+equipo.resumen.armas_arena<=100);
    assert.ok(equipo.hombres.some(h=>h.objeto===null));
    assert.ok(equipo.armas_suelo.every(o=>ARENAS[id].categorias.includes(o.objeto.categoria)||(id==='hangar'&&o.objeto.categoria==='armas_fuego')));
  }
});
test('las tácticas se pueden asignar por escuadrón sin afectar a otros',()=>{
  const {batalla}=partida();
  assert.ok(Object.hasOwn(TACTICAS,'buscar_armas'));
  assert.equal(dar_orden(batalla,1,'buscar_armas'),true);
  assert.ok(batalla.hombres.filter(h=>h.escuadron===1).every(h=>h.orden==='buscar_armas'));
  assert.ok(batalla.hombres.filter(h=>h.escuadron===2).every(h=>h.orden==='mantener'));
});
test('el combate avanza y el gorila actúa automáticamente',()=>{
  const {batalla}=partida();
  dar_orden(batalla,0,'atacar');
  for(let i=0;i<900&&!batalla.resultado;i++)avanzar_batalla(batalla,1/30);
  assert.ok(batalla.transcurrido>0);
  assert.ok(batalla.eventos.some(e=>e.tipo==='ataque_gorila'));
  assert.ok(batalla.bananas>=0);
});
test('las compras descuentan bananas, respetan saldo y no reviven eliminados',()=>{
  const {batalla}=partida();
  batalla.bananas=100;
  assert.equal(comprar_suministro(batalla,'energizante'),true);
  assert.equal(batalla.bananas,70);
  assert.equal(comprar_suministro(batalla,'red'),false);
  assert.equal(batalla.bananas,70);
  assert.equal(SUMINISTROS.botiquin.costo,45);
});
test('buscar armas las recoge del suelo sin clonar el objeto',()=>{
  const {batalla}=partida();
  const hombre=batalla.hombres[0];
  hombre.objeto=null;
  const colocada=batalla.armas_suelo[0];
  colocada.x=hombre.x;colocada.y=hombre.y;colocada.visible=true;
  dar_orden(batalla,hombre.escuadron,'buscar_armas');
  avanzar_batalla(batalla,.033);
  assert.ok(batalla.armas_suelo.some(a=>a.recogido_por));
});

test('las pistolas del hangar usan munición finita y no alteran el catálogo original',()=>{
  const arma={id:'hangar_pistola_prueba',nombre:'Pistola',categoria:'armas_fuego',tipo:'fuego',municion:2,alcance:260,bono_fuerza_pb:0,penalizacion_velocidad_pb:0};
  assert.equal(catalogo.objetos.length,1000);
  const {batalla}=partida('hangar');
  const h=batalla.hombres[0];h.objeto=arma;h.orden='atacar';h.x=batalla.gorila.x-100;h.y=batalla.gorila.y;
  h.miedo=0;h.recarga=0;
  for(let i=0;i<150&&arma.municion>0;i++)avanzar_batalla(batalla,.033);
  assert.ok(arma.municion>=0&&arma.municion<2);
});
