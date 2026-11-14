import { ARENAS, sortear_inventario, resumir_equipo } from './rules.js';
import balance_humano from './data/hombres.json' with {type:'json'};
export const habilidades = ['fuerza','velocidad','inteligencia','temple','precision','agilidad','estrategia','tecnica'];

// Arquetipos originales: todos son adultos. Sin modificadores por edad.
export const perfiles = {
  Entrenador:{fuerza:85,temple:82,estrategia:82,inteligencia:28},
  Campista:{velocidad:22,agilidad:30},
  Estudiante:{agilidad:22,tecnica:25},
  Boxeador:{fuerza:88,tecnica:82,temple:32},
  'Científico':{inteligencia:88,precision:78,temple:35},
  'Acróbata':{temple:90,velocidad:80,inteligencia:30},
  Oficinista:{temple:20,agilidad:30},
  Aficionado:{precision:22,tecnica:30},
  Turista:{inteligencia:25,agilidad:35},
  Repartidor:{estrategia:22,temple:30},
  Musculoso:{fuerza:88,temple:22,estrategia:80},
  Adolescente:{fuerza:34,estrategia:36},
  'Paramédico':{inteligencia:85,estrategia:78,precision:35},
  Velocista:{velocidad:90,agilidad:27,inteligencia:31,precision:33},
  Atleta:{inteligencia:78,agilidad:88,estrategia:35},
  Beisbolista:{fuerza:85,precision:82,velocidad:30,tecnica:33},
  Malabarista:{tecnica:90,precision:82,fuerza:32},
  Corredor:{velocidad:30,inteligencia:29,temple:30},
  Anciano:{velocidad:28,agilidad:28,estrategia:30,temple:30},
  'Tarzán':{fuerza:90,velocidad:90,inteligencia:90,temple:90,precision:90,agilidad:90,estrategia:90,tecnica:90},
};
export const radar_arquetipo=Object.fromEntries(Object.entries(perfiles).map(([nombre,rasgos])=>
  [nombre,Object.fromEntries(habilidades.map(eje=>[eje,rasgos[eje]??50]))]));
export const arquetipos=Object.keys(perfiles);
export const vida_arquetipo=Object.fromEntries(Object.entries(balance_humano.arquetipos).map(([nombre,datos])=>[nombre,datos.vida_maxima]));
export const vida_maxima_humano=arquetipo=>vida_arquetipo[arquetipo]??20;
export const dano_puno_arquetipo=Object.fromEntries(Object.entries(balance_humano.arquetipos).map(([nombre,datos])=>[nombre,Math.max(balance_humano.dano_fisico_minimo_base,datos.dano_fisico)]));
export const dano_fisico_minimo_base=balance_humano.dano_fisico_minimo_base;
export function radar_personal(arquetipo, azar=Math.random) {
  const base=radar_arquetipo[arquetipo];
  return Object.fromEntries(habilidades.map(eje=>[eje,Math.max(5,Math.min(100,
    Math.round(base[eje]+(azar()+azar()-1)*18)))]));
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
  const probabilidades=catalogo.reglas.probabilidad_nivel;
  const niveles=Object.entries(probabilidades).map(([nivel,peso])=>({nivel:Number(nivel),peso,
    objetos:catalogo.objetos.filter(o=>o.nivel===Number(nivel))}));
  return azar=>{
    const n=sortear_ponderado(niveles.map(n=>[n,n.peso]),azar);
    return n.objetos[Math.floor(azar()*n.objetos.length)];
  };
}

export function generar_hombres(sortear_objeto, azar=Math.random, equipados=100) {
  // Guarantee all archetypes are represented, then distribute remaining slots.
  return Array.from({length:100},(_,indice)=>{
    const arquetipo=indice<arquetipos.length?arquetipos[indice]:
      arquetipos[Math.floor(azar()*arquetipos.length)];
    const radar=radar_personal(arquetipo,azar);
    const objeto=indice<equipados?sortear_objeto(azar):null;
    return {id:indice+1,arquetipo,radar,objeto,
      fuerza_efectiva:radar.fuerza*(1+(objeto?.bono_fuerza_pb||0)/10000),
      velocidad_efectiva:radar.velocidad*(1-(objeto?.penalizacion_velocidad_pb||0)/10000)};
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
