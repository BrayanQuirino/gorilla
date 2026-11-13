import { limitar } from './rules.js';

export const ancho = 1000;
export const alto = 640;
const camara = { x: 75, y: 121, ancho: 850, alto: 460 };
const camaraClaro = { ...camara, x: 100, y: 86 };
export const encuadre = arena => arena === 'claro' ? camaraClaro : camara;

// Footprints follow the bases of the painted scenery, in canvas coordinates.
const bases = {
  claro: [[486, 296, 70, 22, 116], [766, 367, 88, 30, 88], [251, 403, 82, 28, 92], [125, 191, 49, 19, 78], [891, 192, 53, 29, 58], [531, 564, 81, 22, 70]],
  selva: [[517, 331, 74, 22, 74], [274, 408, 78, 22, 72], [714, 452, 74, 23, 78], [835, 280, 55, 19, 64], [105, 303, 81, 24, 58], [106, 527, 64, 25, 117], [451, 557, 87, 27, 74]],
  canon: [[471, 324, 112, 29, 72], [347, 311, 52, 20, 48], [455, 452, 69, 24, 49], [708, 427, 49, 22, 48], [567, 353, 45, 21, 42], [369, 558, 73, 20, 66], [60, 333, 75, 24, 57]],
  hangar: [[273, 299, 68, 23, 71], [539, 304, 61, 21, 60], [806, 332, 54, 22, 64], [379, 387, 67, 21, 63], [98, 389, 55, 22, 156], [523, 451, 52, 22, 59], [730, 478, 57, 23, 75]],
};
const obstaculos = Object.fromEntries(Object.entries(bases).map(([arena, lista]) => {
  const vista = encuadre(arena);
  return [arena, lista.map(([x, y, rx, ry, altura]) => ({
    altura,
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

export function altura_terreno(actor, arena) {
  let altura = 0;
  for (const base of obstaculos[arena]) {
    const radio = Math.hypot((actor.x - base.x) / base.rx, (actor.y - base.y) / base.ry);
    altura = Math.max(altura, base.altura * limitar((1.08 - radio) / .80, 0, 1));
  }
  return altura;
}

export function actualizar_altura(actor, arena, dt) {
  const piso = altura_terreno(actor, arena);
  actor.altura ??= piso;
  actor.vz ??= 0;
  if (piso >= actor.altura) {
    actor.altura = piso;
    actor.vz = 0;
  } else {
    actor.vz -= 340 * dt;
    actor.altura = Math.max(piso, actor.altura + actor.vz * dt);
    if (actor.altura === piso) actor.vz = 0;
  }
}

export function zona_entrega(arena, azar) {
  // Open paths on each map, jittered so two deliveries need not share a tile.
  const zonas = {
    claro: [[370, 240], [552, 382], [667, 232], [418, 443]],
    selva: [[338, 238], [670, 241], [420, 430], [832, 375]],
    canon: [[353, 215], [580, 398], [730, 311], [254, 441]],
    hangar: [[382, 272], [662, 248], [572, 375], [637, 459]],
  };
  const [x, y] = zonas[arena][Math.min(3, Math.floor(azar() * 4))];
  const vista = encuadre(arena);
  const punto = { x: (x - vista.x) * ancho / vista.ancho + (azar() - .5) * 32,
    y: (y - vista.y) * alto / vista.alto + (azar() - .5) * 24 };
  limitar_posicion(punto, arena, 30);
  return punto;
}

export function separar_personajes(hombres, gorila, vueltas = 1) {
  for (let vuelta = 0; vuelta < vueltas; vuelta++) {
    for (let i = 0; i < hombres.length; i++) {
      const a = hombres[i];
      const gx = a.x - gorila.x;
      const gy = a.y - gorila.y;
      const distancia_gorila = Math.hypot(gx, gy);
      const radio = gorila.radio + 5;
      if (distancia_gorila < radio && Math.abs((a.altura ?? 0) - (gorila.altura ?? 0)) < 22) {
        a.x = gorila.x + (distancia_gorila ? gx / distancia_gorila * radio : radio);
        a.y = gorila.y + (distancia_gorila ? gy / distancia_gorila * radio : 0);
      }
      for (let j = i + 1; j < hombres.length; j++) {
        const b = hombres[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        if (Math.abs(dx) >= 23 || Math.abs(dy) >= 24 || Math.abs((a.altura ?? 0) - (b.altura ?? 0)) > 22) continue;
        const distancia = Math.hypot(dx / 23, dy / 24);
        if (distancia >= 1) continue;
        const fuerza = distancia ? (1 - distancia) * .5 / distancia : 0;
        const x = distancia ? dx * fuerza : 11.5;
        const y = dy * fuerza;
        a.x -= x;
        a.y -= y;
        b.x += x;
        b.y += y;
      }
    }
    for (const hombre of hombres) {
      hombre.x = limitar(hombre.x, 10, ancho - 10);
      hombre.y = limitar(hombre.y, 10, alto - 10);
    }
  }
}
