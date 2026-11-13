import { ARENAS, sortear_inventario, resumir_equipo } from './rules.js';
export const habilidades = ['fuerza','velocidad','inteligencia','temple','precision','agilidad','estrategia','tecnica'];

// Se conservan los 19 arquetipos del repositorio original, sin inventar otros.
export const tipos_hombre=['Young','Adult','Older'];
export const tipo_por_edad=edad=>edad<30?'Young':edad<60?'Adult':'Older';
export const radar_arquetipo = {
  Young:{fuerza:55,velocidad:70,inteligencia:53,temple:49,precision:52,agilidad:72,estrategia:48,tecnica:49},
  Adult:{fuerza:66,velocidad:61,inteligencia:69,temple:65,precision:64,agilidad:60,estrategia:70,tecnica:67},
  Older:{fuerza:42,velocidad:38,inteligencia:78,temple:78,precision:59,agilidad:35,estrategia:81,tecnica:73},
};

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
    velocidad: base.velocidad * movimiento,
    agilidad: base.agilidad * movimiento,
  };
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

export function generar_hombres(sortear_objeto, azar = Math.random, equipados = 100) {
  return Array.from({ length: 100 }, (_, indice) => {
    const edad = 18 + Math.floor(azar() * 83);
    // Independent draws favor middle values and leave both extremes possible.
    const base = Object.fromEntries(habilidades.map(habilidad =>
      [habilidad, Math.round((azar() + azar()) * 50)]));
    const radar = ajustar_edad(base, edad);
    const objeto = indice < equipados ? sortear_objeto(azar) : null;
    return {
      id: indice + 1,
      edad,
      arquetipo: tipo_por_edad(edad),
      radar,
      objeto,
      fuerza_efectiva: radar.fuerza * (1 + (objeto?.bono_fuerza_pb || 0) / 10000),
      velocidad_efectiva: radar.velocidad * (1 - (objeto?.penalizacion_velocidad_pb || 0) / 10000),
    };
  });
}


export function preparar_equipo(sortear_objeto,catalogo,arena='claro',azar=Math.random) {
  const armas_suelo=sortear_inventario(catalogo,arena,azar);
  const disponibles=100-armas_suelo.length;
  const equipados=Array.from({length:disponibles},()=>azar()<.7).filter(Boolean).length;
  const hombres=generar_hombres(sortear_objeto,azar,equipados);
  // Distribuir los objetos por todo el equipo.
  for(let i=hombres.length-1;i>0;i--){const j=Math.floor(azar()*(i+1));
    const obj=hombres[i].objeto;hombres[i].objeto=hombres[j].objeto;hombres[j].objeto=obj;
    for(const h of [hombres[i],hombres[j]]){
      h.fuerza_efectiva=h.radar.fuerza*(1+(h.objeto?.bono_fuerza_pb||0)/10000);
      h.velocidad_efectiva=h.radar.velocidad*(1-(h.objeto?.penalizacion_velocidad_pb||0)/10000);
    }
  }
  return {hombres,armas_suelo,resumen:resumir_equipo(hombres,armas_suelo),arena:ARENAS[arena]?arena:'claro'};
}
