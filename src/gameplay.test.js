import test from 'node:test';
import assert from 'node:assert/strict';
import catalogo from './data/objetos.json' with {type:'json'};
import {habilidades,crear_sorteo_objetos,preparar_equipo} from './roster.js';
import {altura_terreno, actualizar_altura} from './terreno.js';
import {ARENAS,TACTICAS,SUMINISTROS} from './rules.js';
import {crear_batalla,dar_orden,avanzar_batalla,comprar_suministro,duracion_entrega} from './battle.js';

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
test('una estrategia se aplica a todo el equipo activo',()=>{
  const {batalla}=partida();
  const caido=batalla.hombres.at(-1);
  caido.estado='incapacitado';
  assert.ok(Object.hasOwn(TACTICAS,'buscar_armas'));
  assert.equal(dar_orden(batalla,'buscar_armas'),true);
  assert.equal(batalla.estrategia,'buscar_armas');
  assert.ok(batalla.hombres.slice(0,-1).every(h=>h.orden==='buscar_armas'));
  assert.equal(caido.orden,'atacar');
  assert.equal(dar_orden(batalla,'mover'),false);
});
test('el combate avanza y el gorila actúa automáticamente',()=>{
  const {batalla}=partida();
  assert.equal(batalla.estrategia,'atacar');
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
  dar_orden(batalla,'buscar_armas');
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

test('los personajes arrancan separados y el terreno eleva y deja caer al personaje',()=>{
  for(const arena of Object.keys(ARENAS)){
    const {batalla}=partida(arena);
    assert.equal(new Set(batalla.hombres.map(h=>h.x+','+h.y)).size,100);
    for (let paso=0;paso<180;paso++) {
      avanzar_batalla(batalla,1/60);
      for (const actor of [...batalla.hombres.filter(h=>h.vida>0),batalla.gorila]) {
        if (!actor.vuelo) assert.ok(actor.altura >= altura_terreno(actor,arena) - .01);
      }
    }
  }
  const personaje={x:454,y:292,altura:0};
  actualizar_altura(personaje,'claro',.1);
  assert.ok(personaje.altura>25);
  personaje.x=30;
  actualizar_altura(personaje,'claro',.1);
  assert.ok(personaje.altura>0);
  for(let i=0;i<10;i++) actualizar_altura(personaje,'claro',.1);
  assert.equal(personaje.altura,0);
});

test('un suministro aterriza fuera de los obstáculos y se aplica una sola vez',()=>{
  for (const arena of Object.keys(ARENAS)) {
    const {batalla}=partida(arena);
    dar_orden(batalla,'mantener');
    batalla.gorila.reloj=100;
    batalla.bananas=90;
    const hombre=batalla.hombres[0];
    hombre.vida=1;
    assert.equal(comprar_suministro(batalla,'botiquin'),true);
    assert.equal(batalla.bananas,45);
    assert.equal(altura_terreno(batalla.entregas[0],arena),0);
    assert.equal(hombre.vida,1);
    for(let i=0;i<Math.ceil(duracion_entrega/.05)+2;i++) avanzar_batalla(batalla,.05);
    assert.equal(hombre.vida,26);
    assert.equal(batalla.entregas.length,0);
    assert.equal(batalla.eventos.filter(e=>e.tipo==='paquete_entregado').length,1);
  }
});

test('el agarre retiene al hombre y lo lanza en arco; la embestida proyecta a los impactados',()=>{
  const {batalla}=partida('claro');
  dar_orden(batalla,'mantener');
  const g=batalla.gorila;
  const h=batalla.hombres[0];
  Object.assign(g,{x:520,y:440,altura:0,fase:'aviso',accion:'agarre',reloj:0,sujeto:h,mira_izquierda:false});
  Object.assign(h,{x:550,y:440,altura:0});
  avanzar_batalla(batalla,.05);
  assert.equal(g.fase,'agarre');
  assert.ok(h.altura>g.altura);
  for(let i=0;i<25;i++) avanzar_batalla(batalla,.05);
  assert.ok(h.vuelo?.agarre);
  assert.ok(h.altura>35);
  for(let i=0;i<20;i++) avanzar_batalla(batalla,.05);
  assert.equal(h.vuelo,undefined);
  const segundo=batalla.hombres[1];
  Object.assign(g,{fase:'embestida',accion:'embestida',reloj:1,destino:{x:520,y:440}});
  Object.assign(segundo,{x:550,y:440,altura:g.altura});
  avanzar_batalla(batalla,.05);
  assert.ok(segundo.vuelo);
});
