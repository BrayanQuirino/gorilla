import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { avanzar_batalla, crear_batalla, dar_orden } from '../src/battle.js';
import { ajustar_edad, crear_sorteo_objetos, generar_hombres, habilidades } from '../src/roster.js';

const catalogo = JSON.parse(readFileSync(new URL('../src/data/objetos.json', import.meta.url)));
const sortear_objeto = crear_sorteo_objetos(catalogo);

test('genera 100 hombres con nueve habilidades, edades válidas y equipo', () => {
  for (const azar of [() => 0, () => .5, () => .99999]) {
    const hombres = generar_hombres(sortear_objeto, azar);
    assert.equal(hombres.length, 100);
    assert.equal(new Set(hombres.map(hombre => hombre.escuadron)).size, 10);
    for (const hombre of hombres) {
      assert.ok(hombre.edad >= 18 && hombre.edad <= 100);
      assert.equal(Object.keys(hombre.radar).length, 9);
      assert.ok(catalogo.objetos.includes(hombre.objeto));
    }
  }
  assert.equal(new Set(catalogo.objetos.map(objeto => objeto.id)).size, 1000);
});

test('el ajuste por edad conserva las cuatro habilidades acordadas', () => {
  const base = Object.fromEntries(habilidades.map(habilidad => [habilidad, 100]));
  const radar = ajustar_edad(base, 72);
  assert.equal(radar.fuerza, 72);
  assert.equal(radar.velocidad, 63);
  for (const eje of ['inteligencia', 'valentia', 'precision', 'manejo']) assert.equal(radar[eje], 100);
});

test('cada dificultad sortea solo sus tres niveles', () => {
  const hombres = generar_hombres(sortear_objeto);
  for (let dificultad = 0; dificultad < 4; dificultad++) {
    assert.equal(crear_batalla(hombres, dificultad, () => 0).gorila.nivel, dificultad * 3 + 1);
    assert.equal(crear_batalla(hombres, dificultad, () => .999).gorila.nivel, dificultad * 3 + 3);
  }
});

test('una orden afecta al escuadrón seleccionado y el tiempo tiene un desenlace', () => {
  const batalla = crear_batalla(generar_hombres(sortear_objeto), 0);
  dar_orden(batalla, 1, 'mover', { x: 700, y: 250 });
  assert.equal(batalla.hombres.filter(hombre => hombre.orden === 'mover').length, 10);
  const inicio = batalla.hombres[0].x;
  for (let i = 0; i < 60; i++) avanzar_batalla(batalla, 1 / 60);
  assert.ok(batalla.hombres[0].x > inicio);
  avanzar_batalla(batalla, 300);
  assert.equal(batalla.resultado, 'Victoria del gorila');
});

test('un ataque acertado que agota la resistencia da la victoria a los hombres', () => {
  const batalla = crear_batalla(generar_hombres(sortear_objeto, () => .5), 0, () => 0);
  const hombre = batalla.hombres[0];
  hombre.x = batalla.gorila.x - 20;
  hombre.y = batalla.gorila.y;
  batalla.gorila.vida = 1;
  dar_orden(batalla, 1, 'atacar');
  avanzar_batalla(batalla, 1 / 60);
  assert.equal(batalla.resultado, 'Victoria de los hombres');
});
