// Evolution catalog: each purchase has explicit prerequisites and simulation effects.
// Attribute skills have five +5% levels, calculated from each fighter's birth radar.
export const FAMILIAS = {
 A:{nombre:'Atacar',color:'#e46b48',icono:'⚔️'},
 S:{nombre:'Supervivencia',color:'#54b97b',icono:'🛡️'},
 E:{nombre:'Estrategia',color:'#5aa9fa',icono:'🧠'},
 P:{nombre:'Apoyo',color:'#bb83ee',icono:'🤝'}
};
const source=[
['A01','Fuerza','fuerza',[],15,'+5% fuerza por nivel. Más daño cuerpo a cuerpo.'],
['A02','Precisión','precision',[],15,'+5% precisión por nivel. Armas usadas con mayor eficacia.'],
['A03','Técnica','tecnica',[],15,'+5% técnica por nivel. Mejora la ejecución de ataques.'],
['A04','Golpe potente',null,['A01'],30,'Los golpes físicos causan 10% más daño.'],
['A05','Ataque dirigido',null,['A02','A03'],35,'Los humanos eligen mejores oportunidades para atacar.'],
['A06','Ritmo de combate',null,['A03'],35,'Reduce 10% la recarga del golpe físico.'],
['A07','Ataque grupal',null,['A04','E05'],50,'Los aliados cercanos sincronizan sus golpes.'],
['A08','Flanqueo',null,['A05','E04'],55,'Los atacantes se sitúan en los costados del gorila.'],
['A09','Contraataque',null,['A06','S04'],60,'Un humano que esquiva puede contraatacar.'],
['A10','Cerco',null,['A07','A08'],90,'El equipo rodea al gorila desde distintos ángulos.'],
['A11','Asalto coordinado',null,['A10','A09'],140,'Combina cerco y contraataques en ofensivas grupales.'],
['S01','Agilidad','agilidad',[],15,'+5% agilidad por nivel; mejores maniobras defensivas.'],
['S02','Velocidad','velocidad',[],15,'+5% velocidad por nivel; movimiento más rápido.'],
['S03','Temple','temple',[],15,'+5% temple por nivel; más resistencia al miedo.'],
['S04','Esquivar',null,['S01'],30,'Permite evitar golpes con una probabilidad individual.'],
['S05','Retirada',null,['S02'],25,'La IA se aleja temporalmente cuando hay peligro.'],
['S06','Control del miedo',null,['S03'],30,'Reduce 20% el miedo generado por amenazas.'],
['S07','Reflejos',null,['S04','E04'],50,'Incrementa la probabilidad de esquiva ante ataques anunciados.'],
['S08','Escape táctico',null,['S05','E02'],55,'Busca espacio libre en lugar de huir en línea recta.'],
['S09','Protección mutua',null,['S06','P01'],60,'Los aliados protegen a compañeros cercanos en riesgo.'],
['S10','Evasión avanzada',null,['S07','S08'],100,'Esquiva mejor mientras se desplaza.'],
['S11','Defensa coordinada',null,['S09','E05'],110,'Mejora la protección grupal durante repliegues.'],
['S12','Esconderse',null,['S05','E04'],35,'Permite aprovechar refugios al estar bajo amenaza.'],
['E01','Inteligencia','inteligencia',[],15,'+5% inteligencia por nivel; mejor percepción y selección.'],
['E02','Estrategia','estrategia',[],15,'+5% estrategia por nivel; decisiones mejor informadas.'],
['E03','Evaluación de riesgos',null,['E01','E02'],35,'La IA sopesa amenaza, salud y distancia.'],
['E04','Observación',null,['E01'],25,'Detecta las advertencias del gorila con mayor antelación.'],
['E05','Coordinación',null,['E02'],30,'Los movimientos y ataques grupales se sincronizan.'],
['E06','Distracción',null,['E04'],40,'Algunos combatientes desvían al gorila para ayudar al grupo.'],
['E07','Anticipación',null,['E04','S07'],65,'Predice la dirección del siguiente ataque.'],
['E08','Emboscada',null,['E06','S12'],70,'Ataca con ventaja cuando sale del ocultamiento.'],
['E09','Adaptación táctica',null,['E03','E05'],75,'Cambia temporalmente prioridades con el estado de la batalla.'],
['E10','Aprendizaje',null,['E07','E09'],105,'Usa ataques recientes del gorila para mejorar la defensa.'],
['E11','Plan maestro',null,['E08','E10'],150,'Combina emboscadas, evasión y ofensiva coordinada.'],
['P01','Cooperación',null,[],20,'Mejora la ayuda mutua y evita aglomeraciones.'],
['P02','Exploración',null,[],20,'Mejora el reconocimiento de objetos en la arena.'],
['P03','Buscar armas',null,['P02'],25,'Prioriza armas útiles frente a objetos débiles.'],
['P04','Rescate',null,['P01'],35,'Permite que paramédicos asistan a caídos cercanos.'],
['P05','Cobertura',null,['P01'],40,'Busca protección para compañeros vulnerables.'],
['P06','Señales de auxilio',null,['P01','E05'],40,'Los combatientes comunican peligro a aliados próximos.'],
['P07','Distribución de armas',null,['P03','E05'],55,'Se buscan armas según la utilidad para el portador.'],
['P08','Primeros auxilios',null,['P04','E01'],60,'Los rescatados recuperan más salud.'],
['P09','Defensa de equipo',null,['P05','S09'],75,'Reduce daño sobre humanos protegidos por aliados.'],
['P10','Logística avanzada',null,['P07','E02'],95,'La búsqueda de recursos se adapta a la situación.'],
['P11','Unidad de rescate',null,['P06','P08','P09'],130,'Los paramédicos completan rescates con mayor rapidez.']
];
export const HABILIDADES_EVOLUCION=source.map(([id,nombre,atributo,requisitos,costo,beneficio])=>({
 id,nombre,atributo,requisitos,costo,beneficio,raiz:id[0],maxNivel:atributo?5:1
}));
export const POR_ID=Object.fromEntries(HABILIDADES_EVOLUCION.map(h=>[h.id,h]));
export const NIVEL_BONIFICACION=.05;
export function nivel_habilidad(b,id){return b.evolucion?.[id]||0;}
export function tiene_habilidad(b,id){return nivel_habilidad(b,id)>0;}
export function costo_habilidad(b,id){
 const h=POR_ID[id];if(!h)return Infinity;
 const nivel=nivel_habilidad(b,id);if(nivel>=h.maxNivel)return Infinity;
 return Math.round(h.costo*(nivel+1)*(nivel>0?1.15:1));
}
export function disponible_habilidad(b,id){
 const h=POR_ID[id];
 return Boolean(h)&&!b.resultado&&nivel_habilidad(b,id)<h.maxNivel&&h.requisitos.every(p=>tiene_habilidad(b,p));
}
export function bonificacion_efectiva(base,nivel){return Math.min(100,base*(1+NIVEL_BONIFICACION*nivel));}
export function evolucionar_humano(b,h){
 h.radar_base??={...h.radar};
 for(const habilidad of HABILIDADES_EVOLUCION){
  if(!habilidad.atributo)continue;
  const base=h.radar_base[habilidad.atributo];
  h.radar[habilidad.atributo]=bonificacion_efectiva(base,nivel_habilidad(b,habilidad.id));
 }
 h.valentia=Math.min(100,h.valentia);
}
export function comprar_habilidad(b,id){
 if(!disponible_habilidad(b,id))return false;
 const costo=costo_habilidad(b,id);
 if(b.bananas<costo)return false;
 b.bananas-=costo;
 b.evolucion??={};
 b.evolucion_costos??={};
 (b.evolucion_costos[id]??=[]).push(costo);
 b.evolucion[id]=(b.evolucion[id]||0)+1;
 for(const h of b.hombres)evolucionar_humano(b,h);
 b.evento_id=(b.evento_id||0)+1;
 b.eventos.push({tipo:'evolucion',id:b.evento_id,tiempo:300-b.tiempo,habilidad:id,nivel:b.evolucion[id]});
 return true;
}

// Only the latest level can be undone. Selling an ability that is required
// by an acquired descendant is forbidden, so progression stays valid.
export function bloqueos_reembolso(b,id){
 return HABILIDADES_EVOLUCION.filter(h=>nivel_habilidad(b,h.id)>0&&h.requisitos.includes(id)).map(h=>h.id);
}
export function reembolso_habilidad(b,id){
 if(!POR_ID[id]||nivel_habilidad(b,id)<=0||bloqueos_reembolso(b,id).length)return 0;
 const nivel=nivel_habilidad(b,id);
 const precio=(b.evolucion_costos?.[id]||[])[nivel-1]??Math.round(POR_ID[id].costo*nivel*(nivel>1?1.15:1));
 return Math.floor(precio*.65);
}
export function revertir_habilidad(b,id){
 if(b.resultado||!POR_ID[id]||nivel_habilidad(b,id)<=0||bloqueos_reembolso(b,id).length)return false;
 const devolucion=reembolso_habilidad(b,id);
 b.bananas+=devolucion;
 b.evolucion[id]-=1;
 b.evolucion_costos?.[id]?.pop();
 for(const humano of b.hombres)evolucionar_humano(b,humano);
 b.evento_id=(b.evento_id||0)+1;
 b.eventos.push({tipo:'evolucion_revertida',id:b.evento_id,tiempo:300-b.tiempo,habilidad:id,reembolso:devolucion});
 return true;
}

// Build a single connected axial hex grid. Every added tile touches an occupied cell.
// Parent proximity is weighted above color grouping; cross-root dependencies remain explicit.
const DIRECCIONES=[[1,0],[0,1],[-1,1],[-1,0],[0,-1],[1,-1]];
const distancia_hex=(a,b)=>Math.max(Math.abs(a.q-b.q),Math.abs(a.r-b.r),Math.abs((a.q+a.r)-(b.q+b.r)));
export function geometria_panal(){
 const ubicaciones=new Map([['BASE',{q:0,r:0}]]);
 const pendientes=new Set(HABILIDADES_EVOLUCION.map(h=>h.id));
 const origen={A:{q:3,r:-1},S:{q:-2,r:-2},E:{q:-3,r:2},P:{q:2,r:3}};
 let intentos=0;
 while(pendientes.size&&intentos++<100){
  let cambio=false;
  for(const h of HABILIDADES_EVOLUCION){
   if(!pendientes.has(h.id)||h.requisitos.some(id=>!ubicaciones.has(id)))continue;
   const ocupadas=[...ubicaciones.values()];
   const candidatos=new Map();
   for(const p of ocupadas)for(const [dq,dr] of DIRECCIONES){
    const c={q:p.q+dq,r:p.r+dr};const key=c.q+','+c.r;
    if(!ocupadas.some(v=>v.q===c.q&&v.r===c.r))candidatos.set(key,c);
   }
   const parents=h.requisitos.length?h.requisitos.map(id=>ubicaciones.get(id)):[ubicaciones.get('BASE')];
   const ancla=origen[h.raiz];
   const sibling=[...ubicaciones].filter(([id])=>id!=='BASE'&&id[0]===h.raiz).map(([,p])=>p);
   const scored=[...candidatos.values()].map(c=>({
    c,score:parents.reduce((n,p)=>n+distancia_hex(c,p)*11,0)+distancia_hex(c,ancla)*2+
    (sibling.length?Math.min(...sibling.map(p=>distancia_hex(c,p)))*2:0)+distancia_hex(c,{q:0,r:0})*.28
   })).sort((a,b)=>a.score-b.score||a.c.q-b.c.q||a.c.r-b.c.r);
   ubicaciones.set(h.id,scored[0].c);pendientes.delete(h.id);cambio=true;
  }
  if(!cambio)throw Error('Dependencias cíclicas en el árbol evolutivo');
 }
 return Object.fromEntries(ubicaciones);
}
