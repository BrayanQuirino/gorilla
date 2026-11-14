import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { avanzar_batalla, crear_batalla, aplicar_plan } from '../src/battle.js';
import { arquetipos, radar_arquetipo, crear_sorteo_objetos, generar_hombres, habilidades } from '../src/roster.js';

const catalogo = JSON.parse(readFileSync(new URL('../src/data/objetos.json', import.meta.url)));
const sortear_objeto = crear_sorteo_objetos(catalogo);

test('genera 100 adultos con ocho habilidades y objetos del catálogo', () => {
  for (const azar of [() => 0, () => .5, () => .99999]) {
    const hombres = generar_hombres(sortear_objeto, azar);
    assert.equal(hombres.length, 100);
    assert.equal(new Set(hombres.map(hombre => hombre.id)).size, 100);
    for (const hombre of hombres) {
      assert.ok(!('edad' in hombre));
      assert.ok(arquetipos.includes(hombre.arquetipo));
      assert.equal(Object.keys(hombre.radar).length, 8);
      assert.ok(catalogo.objetos.includes(hombre.objeto));
    }
  }
  assert.equal(new Set(catalogo.objetos.map(objeto => objeto.id)).size, 1000);
});

test('los arquetipos conservan atributos específicos y todos son adultos',()=>{
  assert.equal(arquetipos.length,20);
  assert.ok(radar_arquetipo.Boxeador.fuerza>radar_arquetipo.Oficinista.fuerza);
  assert.ok(radar_arquetipo.Velocista.velocidad>radar_arquetipo.Campista.velocidad);
  const equipo=generar_hombres(sortear_objeto,()=>.5);
  assert.ok(equipo.every(h=>!('edad' in h)));
});

test('cada dificultad sortea solo sus tres niveles', () => {
  const hombres = generar_hombres(sortear_objeto);
  for (let dificultad = 0; dificultad < 4; dificultad++) {
    assert.equal(crear_batalla(hombres, dificultad, () => 0).gorila.nivel, dificultad * 3 + 1);
    assert.equal(crear_batalla(hombres, dificultad, () => .999).gorila.nivel, dificultad * 3 + 3);
  }
});

test('el equipo avanza automáticamente y el tiempo tiene un desenlace', () => {
  const batalla = crear_batalla(generar_hombres(sortear_objeto), 0);
  assert.ok(batalla.hombres.every(hombre => hombre.orden === 'atacar'));
  const inicio = batalla.hombres.reduce((total, hombre) => total + hombre.x, 0);
  for (let i = 0; i < 60; i++) avanzar_batalla(batalla, 1 / 60);
  assert.ok(batalla.hombres.reduce((total, hombre) => total + hombre.x, 0) > inicio);
  // El motor limita dt a 0.1 segundos para evitar saltos físicos. Simular el reloj completo.
  batalla.tiempo = 0.05;
  avanzar_batalla(batalla, 0.1);
  assert.equal(batalla.resultado, 'Victoria del gorila');
});

test('un ataque acertado que agota la resistencia da la victoria a los hombres', () => {
  const batalla = crear_batalla(generar_hombres(sortear_objeto, () => .5), 0, () => 0);
  const hombre = batalla.hombres[0];
  hombre.x = batalla.gorila.x - 20;
  hombre.y = batalla.gorila.y;
  hombre.altura = batalla.gorila.altura;
  batalla.gorila.segunda_vida = 'activa';
  batalla.gorila.vida = 0.001;
  aplicar_plan(batalla, {atacar:100});
  for(let i=0;i<360&&batalla.resultado!=='Victoria de los hombres';i++) avanzar_batalla(batalla,1/60);
  assert.equal(batalla.resultado, 'Victoria de los hombres');
});
