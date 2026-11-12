export const habilidades = [
  'fuerza', 'velocidad', 'reflejos', 'resistencia', 'precision',
  'inteligencia', 'agilidad', 'valentia', 'manejo',
];

const perfiles = [
  ['Entrenador', { fuerza: 85, resistencia: 82, valentia: 82, inteligencia: 28 }],
  ['Campista', { velocidad: 22, agilidad: 30 }],
  ['Estudiante', { agilidad: 22, manejo: 25 }],
  ['Boxeador', { fuerza: 88, manejo: 82, resistencia: 32 }],
  ['Científico', { inteligencia: 88, precision: 78, valentia: 35 }],
  ['Acróbata', { valentia: 90, velocidad: 80, inteligencia: 30 }],
  ['Oficinista', { valentia: 20, reflejos: 30 }],
  ['Aficionado', { precision: 22, manejo: 30 }],
  ['Turista', { inteligencia: 25, reflejos: 35 }],
  ['Repartidor', { resistencia: 22, valentia: 30 }],
  ['Musculoso', { fuerza: 88, resistencia: 80, valentia: 22 }],
  ['Adolescente', { fuerza: 34, resistencia: 36 }, 18, 19],
  ['Paramédico', { inteligencia: 85, resistencia: 78, precision: 35 }],
  ['Velocista', { velocidad: 90, agilidad: 27, inteligencia: 31, precision: 33 }],
  ['Atleta', { inteligencia: 78, agilidad: 88, reflejos: 35 }],
  ['Beisbolista', { fuerza: 85, precision: 82, velocidad: 30, manejo: 33 }],
  ['Malabarista', { manejo: 90, precision: 82, fuerza: 32 }],
  ['Corredor', { velocidad: 30, inteligencia: 29, valentia: 30 }],
  ['Anciano', { velocidad: 28, agilidad: 28, reflejos: 30, resistencia: 30 }, 65, 100],
];

const edades = [
  [18, .95, 1], [24, .95, 1], [25, 1, 1], [34, 1, 1],
  [42, .95, .90], [57, .85, .78], [72, .72, .63],
  [90, .58, .45], [100, .52, .37],
];

export function ajustar_edad(base, edad) {
  const siguiente = edades.findIndex(([limite]) => edad <= limite);
  const [fin, fuerza_fin, movimiento_fin] = edades[siguiente];
  const [inicio, fuerza_inicio, movimiento_inicio] = edades[Math.max(0, siguiente - 1)];
  const avance = fin === inicio ? 0 : (edad - inicio) / (fin - inicio);
  const fuerza = fuerza_inicio + avance * (fuerza_fin - fuerza_inicio);
  const movimiento = movimiento_inicio + avance * (movimiento_fin - movimiento_inicio);

  return {
    ...base,
    fuerza: base.fuerza * fuerza,
    resistencia: base.resistencia * fuerza,
    velocidad: base.velocidad * movimiento,
    reflejos: base.reflejos * movimiento,
    agilidad: base.agilidad * movimiento,
  };
}

function elegir_arquetipo(base, radar, edad) {
  if (habilidades.every(habilidad => base[habilidad] > 85)) return 'Tarzán';

  let mejor = { nombre: perfiles[0][0], distancia: Infinity };
  for (const [nombre, objetivo, minimo = 18, maximo = 100] of perfiles) {
    if (edad < minimo || edad > maximo) continue;
    const ejes = Object.entries(objetivo);
    const distancia = ejes.reduce((total, [eje, valor]) =>
      total + ((nombre === 'Anciano' ? radar : base)[eje] - valor) ** 2, 0) / ejes.length;
    if (distancia < mejor.distancia) mejor = { nombre, distancia };
  }
  return mejor.nombre;
}

function sortear_ponderado(entradas, azar) {
  const total = entradas.reduce((suma, [, peso]) => suma + peso, 0);
  let boleto = azar() * total;
  for (const [valor, peso] of entradas) {
    boleto -= peso;
    if (boleto < 0) return valor;
  }
  return entradas.at(-1)[0];
}

export function crear_sorteo_objetos(catalogo) {
  const grupos = new Map();
  for (const objeto of catalogo.objetos) {
    const familia = objeto.id.slice(0, objeto.id.lastIndexOf('_'));
    if (!grupos.has(objeto.categoria)) grupos.set(objeto.categoria, new Map());
    const familias = grupos.get(objeto.categoria);
    if (!familias.has(familia)) familias.set(familia, []);
    familias.get(familia).push([objeto, objeto.peso_sorteo_variante]);
  }
  const categorias = Object.entries(catalogo.reglas.peso_sorteo_categoria)
    .map(([categoria, peso]) => [[...grupos.get(categoria).values()], peso]);

  return azar => {
    const familias = sortear_ponderado(categorias, azar);
    return sortear_ponderado(familias[Math.floor(azar() * familias.length)], azar);
  };
}

export function generar_hombres(sortear_objeto, azar = Math.random) {
  return Array.from({ length: 100 }, (_, indice) => {
    const edad = 18 + Math.floor(azar() * 83);
    // Independent draws favor middle values and leave both extremes possible.
    const base = Object.fromEntries(habilidades.map(habilidad =>
      [habilidad, Math.round((azar() + azar()) * 50)]));
    const radar = ajustar_edad(base, edad);
    const objeto = sortear_objeto(azar);
    return {
      id: indice + 1,
      escuadron: Math.floor(indice / 10) + 1,
      edad,
      arquetipo: elegir_arquetipo(base, radar, edad),
      radar,
      objeto,
      fuerza_efectiva: radar.fuerza * (1 + objeto.bono_fuerza_pb / 10000),
      velocidad_efectiva: radar.velocidad * (1 - objeto.penalizacion_velocidad_pb / 10000),
    };
  });
}
