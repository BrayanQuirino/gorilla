export const ancho = 1000;
export const alto = 640;
export const dificultades = ['Fácil', 'Normal', 'Difícil', 'Extremo'];

const niveles = [
  [650, 1, 1], [775, 1.12, 1.06], [900, 1.24, 1.12],
  [1050, 1.38, 1.15], [1200, 1.53, 1.20], [1350, 1.68, 1.25],
  [1500, 1.84, 1.29], [1675, 2.02, 1.35], [1850, 2.20, 1.40],
  [2050, 2.40, 1.44], [2275, 2.63, 1.50], [2500, 2.85, 1.56],
];

const limitar = (valor, minimo, maximo) => Math.min(maximo, Math.max(minimo, valor));
const distancia = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

export function crear_batalla(personajes, dificultad, azar = Math.random) {
  const nivel = dificultad * 3 + 1 + Math.floor(azar() * 3);
  const [vida, fuerza, tamano] = niveles[nivel - 1];
  return {
    tiempo: 300,
    resultado: '',
    azar,
    gorila: {
      x: 760, y: 320, nivel, vida, vida_maxima: vida, fuerza,
      radio: 24 * (tamano + azar() * .04), fase: 'espera', reloj: 2, ataques: 0,
    },
    hombres: personajes.map(personaje => {
      const indice = personaje.id - 1;
      const x = 65 + Math.floor(indice / 10) % 5 * 72 + (indice % 5) * 10;
      const y = 210 + Math.floor(indice / 50) * 150 + Math.floor(indice % 10 / 5) * 14;
      return { ...personaje, x, y, vida: 35 + personaje.radar.resistencia * .65,
        vx: 0, vy: 0, miedo: 0, recarga: 0, reaccion: 0, orden: 'mantener' };
    }),
  };
}

export function dar_orden(batalla, escuadron, orden, destino) {
  for (const hombre of batalla.hombres) {
    if (hombre.vida <= 0 || (escuadron && hombre.escuadron !== escuadron)) continue;
    hombre.orden = orden;
    if (destino) {
      const posicion = hombre.id - 1;
      const columna = escuadron ? posicion % 5 : posicion % 10;
      const fila = escuadron ? Math.floor(posicion % 10 / 5) : Math.floor(posicion / 10);
      hombre.destino = { x: limitar(destino.x + (columna - (escuadron ? 2 : 4.5)) * 12, 12, ancho - 12),
        y: limitar(destino.y + (fila - (escuadron ? .5 : 4.5)) * 12, 12, alto - 12) };
    }
  }
}

function avanzar_hombre(hombre, destino, dt) {
  const distancia_restante = distancia(hombre, destino);
  const ritmo = 24 + hombre.velocidad_efectiva * 1.05;
  const giro = Math.min(1, dt * (3 + hombre.radar.agilidad * .14));
  const escala = distancia_restante > 3 ? Math.min(ritmo, distancia_restante / dt) / distancia_restante : 0;
  hombre.vx += ((destino.x - hombre.x) * escala - hombre.vx) * giro;
  hombre.vy += ((destino.y - hombre.y) * escala - hombre.vy) * giro;
  hombre.x = limitar(hombre.x + hombre.vx * dt, 10, ancho - 10);
  hombre.y = limitar(hombre.y + hombre.vy * dt, 10, alto - 10);
}

function actualizar_hombre(batalla, hombre, dt, puesto) {
  const { gorila, azar } = batalla;
  const cerca = distancia(hombre, gorila);
  hombre.recarga -= dt;
  hombre.reaccion = Math.max(0, hombre.reaccion - dt);
  hombre.miedo = Math.max(0, hombre.miedo - dt * (cerca > 175 ? 15 : 4));
  const asustado = hombre.miedo > 12 + hombre.radar.valentia * .76;
  let destino = hombre;

  if (hombre.orden === 'mover') destino = hombre.destino;
  if (hombre.orden === 'retirar' || (hombre.orden === 'atacar' && asustado)) {
    destino = { x: hombre.x + (hombre.x - gorila.x), y: hombre.y + (hombre.y - gorila.y) };
  } else if (puesto !== undefined) {
    // The front ring has limited space. Reserve positions keep units from stacking.
    const plazas = 20;
    const angulo = (puesto % plazas) * Math.PI * 2 / plazas;
    const radio = gorila.radio + 12 + Math.floor(puesto / plazas) * 16;
    destino = {
      x: gorila.x + Math.cos(angulo) * radio,
      y: gorila.y + Math.sin(angulo) * radio,
    };
  }
  if (gorila.fase === 'aviso' && gorila.accion !== 'rugido' && hombre.reaccion === 0
      && hombre.orden !== 'retirar' && hombre.radar.inteligencia >= 36
      && distancia(hombre, gorila.destino) < 52 + hombre.radar.inteligencia * .45) {
    destino = { x: hombre.x * 2 - gorila.destino.x, y: hombre.y * 2 - gorila.destino.y };
  }
  avanzar_hombre(hombre, destino, dt);

  if (hombre.orden === 'atacar' && !asustado && hombre.reaccion === 0
      && hombre.recarga <= 0 && cerca <= gorila.radio + 21) {
    hombre.recarga = 2.4 - hombre.radar.manejo * .016;
    if (azar() < .2 + hombre.radar.precision * .0075) {
      const apertura = gorila.fase === 'recuperacion' ? 1.45 : 1;
      gorila.vida = Math.max(0, gorila.vida - (1 + hombre.fuerza_efectiva * .065) * apertura);
    }
  }
}

function resolver_ataque(batalla, activos) {
  const { gorila } = batalla;
  const radio = gorila.accion === 'rugido' ? 145 : gorila.radio + 28;
  for (const hombre of activos) {
    if (distancia(hombre, gorila.destino) > radio) continue;
    if (gorila.accion === 'rugido') {
      hombre.miedo = Math.min(100, hombre.miedo + 38);
      continue;
    }
    hombre.vida -= 24 * gorila.fuerza;
    hombre.miedo = Math.min(100, hombre.miedo + 26);
    if (hombre.vida > 0) continue;
    for (const aliado of activos) {
      if (aliado.vida > 0 && distancia(aliado, hombre) < 95) {
        aliado.miedo = Math.min(100, aliado.miedo + 14);
      }
    }
  }
  gorila.fase = 'recuperacion';
  gorila.reloj = gorila.vida < gorila.vida_maxima * .3 ? .65 : 1.15;
}

function actualizar_gorila(batalla, activos, dt) {
  const { gorila } = batalla;
  gorila.reloj -= dt;
  if (gorila.fase === 'embestida') {
    const recorrido = distancia(gorila, gorila.destino);
    const paso = Math.min(1, 620 * dt / Math.max(recorrido, 1));
    gorila.x += (gorila.destino.x - gorila.x) * paso;
    gorila.y += (gorila.destino.y - gorila.y) * paso;
    if (paso === 1) resolver_ataque(batalla, activos);
    return;
  }
  if (gorila.reloj > 0) return;
  if (gorila.fase === 'aviso') {
    if (gorila.accion === 'embestida') gorila.fase = 'embestida';
    else resolver_ataque(batalla, activos);
    return;
  }

  const objetivo = activos.reduce((mejor, hombre) =>
    distancia(hombre, gorila) < distancia(mejor, gorila) ? hombre : mejor);
  const cerca = distancia(gorila, objetivo);
  gorila.ataques += 1;
  gorila.accion = cerca > 185 ? 'embestida' : gorila.ataques % 4 === 0 ? 'rugido'
    : cerca < gorila.radio + 40 ? 'barrido' : 'embestida';
  gorila.destino = gorila.accion === 'embestida'
    ? { x: objetivo.x, y: objetivo.y } : { x: gorila.x, y: gorila.y };
  gorila.fase = 'aviso';
  gorila.reloj = Math.max(.55, 1.32 - gorila.nivel * .035);
  for (const hombre of activos) {
    hombre.reaccion = (100 - hombre.radar.reflejos) * .008;
  }
}

export function avanzar_batalla(batalla, dt) {
  if (batalla.resultado) return;
  batalla.tiempo = Math.max(0, batalla.tiempo - dt);
  const activos = batalla.hombres.filter(hombre => hombre.vida > 0);
  if (!activos.length || batalla.tiempo === 0) {
    batalla.resultado = 'Victoria del gorila';
    return;
  }
  actualizar_gorila(batalla, activos, dt);
  let puesto = 0;
  for (const hombre of activos) {
    if (hombre.vida <= 0) continue;
    const dispuesto = hombre.orden === 'atacar' && hombre.miedo <= 12 + hombre.radar.valentia * .76;
    actualizar_hombre(batalla, hombre, dt, dispuesto ? puesto++ : undefined);
  }
  if (batalla.gorila.vida <= 0) batalla.resultado = 'Victoria de los hombres';
}
