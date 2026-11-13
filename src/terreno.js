import { limitar } from './rules.js';

export const ancho = 1000;
export const alto = 640;
const camara = { x: 75, y: 121, ancho: 850, alto: 460 };
const camaraClaro = { ...camara, x: 100, y: 86 };
export const encuadre = arena => arena === 'claro' ? camaraClaro : camara;

// Footprints follow the bases of the painted scenery, in canvas coordinates.
const bases = {
  claro: [[486, 296, 70, 22], [766, 367, 88, 30], [251, 403, 82, 28], [125, 191, 49, 19], [891, 192, 53, 29], [531, 564, 81, 22]],
  selva: [[517, 331, 74, 22], [274, 408, 78, 22], [714, 452, 74, 23], [835, 280, 55, 19], [105, 303, 81, 24], [106, 527, 64, 25], [451, 557, 87, 27]],
  canon: [[471, 324, 112, 29], [347, 311, 52, 20], [455, 452, 69, 24], [708, 427, 49, 22], [567, 353, 45, 21], [369, 558, 73, 20], [60, 333, 75, 24]],
  hangar: [[273, 299, 68, 23], [539, 304, 61, 21], [806, 332, 54, 22], [379, 387, 67, 21], [98, 389, 55, 22], [523, 451, 52, 22], [730, 478, 57, 23]],
};
const obstaculos = Object.fromEntries(Object.entries(bases).map(([arena, lista]) => {
  const vista = encuadre(arena);
  return [arena, lista.map(([x, y, rx, ry]) => ({
    x: (x - vista.x) * ancho / vista.ancho,
    y: (y - vista.y) * alto / vista.alto,
    rx: rx * ancho / vista.ancho,
    ry: ry * alto / vista.alto,
  }))];
}));

export function limitar_posicion(actor, arena, margen = 0) {
  for (const obstaculo of obstaculos[arena]) {
    const rx = obstaculo.rx + margen;
    const ry = obstaculo.ry + margen;
    const dx = (actor.x - obstaculo.x) / rx;
    const dy = (actor.y - obstaculo.y) / ry;
    const distancia = Math.hypot(dx, dy);
    if (distancia >= 1) continue;
    actor.x = obstaculo.x + (distancia ? dx / distancia * rx * 1.002 : 0);
    actor.y = obstaculo.y + (distancia ? dy / distancia * ry * 1.002 : ry * 1.002);
  }
  actor.x = limitar(actor.x, 10, ancho - 10);
  actor.y = limitar(actor.y, 10, alto - 10);
}

export function separar_personajes(hombres, arena, gorila, vueltas = 1) {
  for (let vuelta = 0; vuelta < vueltas; vuelta++) {
    for (let i = 0; i < hombres.length; i++) {
      const a = hombres[i];
      const gx = a.x - gorila.x;
      const gy = a.y - gorila.y;
      const distancia_gorila = Math.hypot(gx, gy);
      const radio = gorila.radio + 5;
      if (distancia_gorila < radio) {
        a.x = gorila.x + (distancia_gorila ? gx / distancia_gorila * radio : radio);
        a.y = gorila.y + (distancia_gorila ? gy / distancia_gorila * radio : 0);
      }
      for (let j = i + 1; j < hombres.length; j++) {
        const b = hombres[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        if (Math.abs(dx) >= 19 || Math.abs(dy) >= 22) continue;
        const distancia = Math.hypot(dx / 19, dy / 22);
        if (distancia >= 1) continue;
        const fuerza = distancia ? (1 - distancia) * .5 / distancia : 0;
        const x = distancia ? dx * fuerza : 9.5;
        const y = dy * fuerza;
        a.x -= x;
        a.y -= y;
        b.x += x;
        b.y += y;
      }
    }
    for (const hombre of hombres) limitar_posicion(hombre, arena, 6);
  }
}

export function rodear_obstaculo(actor, destino, arena, margen = 0) {
  for (const base of obstaculos[arena]) {
    const rx = base.rx + margen;
    const ry = base.ry + margen;
    const x = (actor.x - base.x) / rx;
    const y = (actor.y - base.y) / ry;
    const dx = (destino.x - actor.x) / rx;
    const dy = (destino.y - actor.y) / ry;
    const largo = dx * dx + dy * dy;
    if (!largo) continue;
    const avance = limitar(-(x * dx + y * dy) / largo, 0, 1);
    const distancia = Math.hypot(x + dx * avance, y + dy * avance);
    if (distancia >= 1 || avance === 0) continue;
    const lado = x * dy - y * dx < 0 ? -1 : 1;
    const angulo = Math.atan2(y, x) + lado * .65;
    return { x: base.x + Math.cos(angulo) * rx * 1.26, y: base.y + Math.sin(angulo) * ry * 1.26 };
  }
  return destino;
}
