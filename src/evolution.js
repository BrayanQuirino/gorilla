// Evolution catalog: each purchase has explicit prerequisites and simulation effects.
// Attribute skills have five +5% levels, calculated from each fighter's birth radar.
export const FAMILIAS = {
 A:{nombre:'Atacar',color:'#e46b48',icono:'⚔️'},
 S:{nombre:'Supervivencia',color:'#54b97b',icono:'🛡️'},
 E:{nombre:'Estrategia',color:'#5aa9fa',icono:'🧠'},
 P:{nombre:'Apoyo',color:'#bb83ee',icono:'🤝'}
};
const source=[
['A00','Atacar',null,[],10,'Desarrolla el instinto ofensivo: +5% al daño físico y abre el entrenamiento de combate.'],
['S00','Supervivencia',null,[],10,'Enseña autoprotección: 5% menos daño recibido y abre las técnicas defensivas.'],
['E00','Estrategia',null,[],10,'Inicia la observación táctica: decisiones automáticas más rápidas y abre el aprendizaje.'],
['A01','Fuerza','fuerza',['A00'],15,'+5% fuerza por nivel. Más daño cuerpo a cuerpo.'],
['A02','Precisión','precision',['A00'],15,'+5% precisión por nivel. Armas usadas con mayor eficacia.'],
['A03','Técnica','tecnica',['A00'],15,'+5% técnica por nivel. Mejora la ejecución de ataques.'],
['A04','Golpe potente',null,['A01'],30,'Los golpes físicos causan 10% más daño.'],
['A05','Ataque dirigido',null,['A02','A03'],35,'Los humanos eligen mejores oportunidades para atacar.'],
['A06','Ritmo de combate',null,['A03'],35,'Reduce 10% la recarga del golpe físico.'],
['A07','Ataque grupal',null,['A04','E05'],50,'Los aliados cercanos sincronizan sus golpes.'],
['A08','Flanqueo',null,['A05','E04'],55,'Los atacantes se sitúan en los costados del gorila.'],
['A09','Contraataque',null,['A06','S04'],60,'Un humano que esquiva puede contraatacar.'],
['A10','Cerco',null,['A07','A08'],90,'El equipo rodea al gorila desde distintos ángulos.'],
['A11','Asalto coordinado',null,['A10','A09'],140,'Combina cerco y contraataques en ofensivas grupales.'],
['S01','Agilidad','agilidad',['S00'],15,'+5% agilidad por nivel; mejores maniobras defensivas.'],
['S02','Velocidad','velocidad',['S00'],15,'+5% velocidad por nivel; movimiento más rápido.'],
['S03','Temple','temple',['S00'],15,'+5% temple por nivel; más resistencia al miedo.'],
['S04','Esquivar',null,['S01'],30,'Permite evitar golpes con una probabilidad individual.'],
['S05','Retirada',null,['S02'],25,'La IA se aleja temporalmente cuando hay peligro.'],
['S06','Control del miedo',null,['S03'],30,'Reduce 20% el miedo generado por amenazas.'],
['S07','Reflejos',null,['S04','E04'],50,'Incrementa la probabilidad de esquiva ante ataques anunciados.'],
['S08','Escape táctico',null,['S05','E02'],55,'Busca espacio libre en lugar de huir en línea recta.'],
['S09','Protección mutua',null,['S06','P01'],60,'Los aliados protegen a compañeros cercanos en riesgo.'],
['S10','Evasión avanzada',null,['S07','S08'],100,'Esquiva mejor mientras se desplaza.'],
['S11','Defensa coordinada',null,['S09','E05'],110,'Mejora la protección grupal durante repliegues.'],
['S12','Esconderse',null,['S05','E04'],35,'Permite aprovechar refugios al estar bajo amenaza.'],
['E01','Inteligencia','inteligencia',['E00'],15,'+5% inteligencia por nivel; mejor percepción y selección.'],
['E02','Pensamiento táctico','estrategia',['E00'],15,'+5% estrategia por nivel; decisiones mejor informadas.'],
['E03','Evaluación de riesgos',null,['E01','E02'],35,'La IA sopesa amenaza, salud y distancia.'],
['E04','Observación',null,['E01'],25,'Detecta las advertencias del gorila con mayor antelación.'],
['E05','Coordinación',null,['E02'],30,'Los movimientos y ataques grupales se sincronizan.'],
['E06','Distracción',null,['E04'],40,'Algunos combatientes desvían al gorila para ayudar al grupo.'],
['E07','Anticipación',null,['E04','S07'],65,'Predice la dirección del siguiente ataque.'],
['E08','Emboscada',null,['E06','S12'],70,'Ataca con ventaja cuando sale del ocultamiento.'],
['E09','Adaptación táctica',null,['E03','E05'],75,'Cambia temporalmente prioridades con el estado de la batalla.'],
['E10','Aprendizaje',null,['E07','E09'],105,'Usa ataques recientes del gorila para mejorar la defensa.'],
['E11','Plan maestro',null,['E08','E10'],150,'Combina emboscadas, evasión y ofensiva coordinada.'],
['P01','Cooperación',null,['E01'],20,'Mejora la ayuda mutua y evita aglomeraciones.'],
['P02','Exploración',null,['E01'],20,'Mejora el reconocimiento de objetos en la arena.'],
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

// Visibility is based ONLY on prerequisite ownership, never on banana balance.
export function visible_habilidad(b,id){
 const skill=POR_ID[id];
 if(!skill)return false;
 return tiene_habilidad(b,id)||skill.requisitos.every(parent=>tiene_habilidad(b,parent));
}
export function habilidades_visibles(b){
 return HABILIDADES_EVOLUCION.filter(h=>visible_habilidad(b,h.id));
}
export function bananas_faltantes(b,id){
 const precio=costo_habilidad(b,id);
 return Number.isFinite(precio)?Math.max(0,Math.ceil(precio-(b.bananas||0))):0;
}

// Axial pointy-top hexagons. Positions use one cell per coordinate.
// Layout is rebuilt for the revealed subset: parents and future co-parents
// attract each other, including across branches. This keeps Cerco next to
// both Ataque grupal and Flanqueo before Cerco is revealed.
const VECTORES_HEX=[[1,0],[0,1],[-1,1],[-1,0],[0,-1],[1,-1]];
const clave_hex=p=>p.q+','+p.r;
export const distancia_hex=(a,b)=>Math.max(Math.abs(a.q-b.q),Math.abs(a.r-b.r),Math.abs(a.q+a.r-b.q-b.r));
const base_hex={q:0,r:0};
const anclas={
 A01:{q:1,r:-1},A02:{q:1,r:0},A03:{q:0,r:-1},
 S01:{q:-1,r:0},S02:{q:-1,r:1},S03:{q:0,r:1},
 E01:{q:-1,r:-1},E02:{q:-2,r:1},
 P01:{q:1,r:1},P02:{q:2,r:0}
};
function profundidad(id,cache=new Map()){
 if(cache.has(id))return cache.get(id);
 const skill=POR_ID[id];
 const value=skill.requisitos.length?1+Math.max(...skill.requisitos.map(p=>profundidad(p,cache))):1;
 cache.set(id,value);
 return value;
}
function aristas_relacionadas(visibles){
 const ids=new Set(visibles.map(h=>h.id));
 const edges=[];
 for(const h of visibles){
  if(!h.requisitos.length)edges.push(['BASE',h.id,9]);
  for(const parent of h.requisitos)if(ids.has(parent))edges.push([parent,h.id,h.id==='A10'?700:h.requisitos.length>1?90:32]);
 }
 // Even before a descendant becomes visible, its co-parents must be
 // neighbours where possible. This is the fundamental honeycomb dependency rule.
 for(const h of HABILIDADES_EVOLUCION){
  for(let i=0;i<h.requisitos.length;i++)for(let j=i+1;j<h.requisitos.length;j++){
   const a=h.requisitos[i],b=h.requisitos[j];
   if(ids.has(a)&&ids.has(b))edges.push([a,b,54]);
  }
 }
 return edges;
}
function candidatos_vecinos(positions){
 const occupied=new Set([...positions.values()].map(clave_hex));
 const c=new Map();
 for(const p of positions.values())for(const [q,r] of VECTORES_HEX){
  const cell={q:p.q+q,r:p.r+r};
  if(!occupied.has(clave_hex(cell)))c.set(clave_hex(cell),cell);
 }
 return [...c.values()];
}
function costo_mapa(positions,edges){
 let score=0;
 for(const [a,b,peso] of edges){
  const x=positions.get(a),y=positions.get(b);
  if(x&&y){const d=distancia_hex(x,y);score+=peso*Math.pow(Math.max(0,d-1),2);}
 }
 // A modest compactness term prevents disconnected branches and endless sprawl.
 for(const [id,p] of positions){
  if(id!=='BASE')score+=.30*distancia_hex(p,base_hex)**2;
 }
 return score;
}
export function geometria_panal_estado(b){
 const visibles=habilidades_visibles(b);
 const edges=aristas_relacionadas(visibles);
 const positions=new Map([['BASE',base_hex]]);
 const order=[...visibles].sort((a,z)=>profundidad(a.id)-profundidad(z.id)||a.id.localeCompare(z.id));
 const siblings=HABILIDADES_EVOLUCION.filter(h=>h.requisitos.length>1);
 for(const h of order){
  const parents=h.requisitos.length?h.requisitos.filter(p=>positions.has(p)):['BASE'];
  const candidates=candidatos_vecinos(positions);
  let best=null,bestScore=Infinity;
  for(const c of candidates){
   const cost=parents.reduce((score,id)=>score+32*(distancia_hex(c,positions.get(id))-1)**2,0);
   const peers=[...positions].filter(([id])=>id!=='BASE'&&id[0]===h.raiz).map(([,p])=>p);
   const group=peers.length?Math.min(...peers.map(p=>distancia_hex(c,p)))*1.5:0;
   const target=anclas[h.id];
   const root=target?distancia_hex(c,target)*4:0;
   const pairs=siblings.filter(s=>s.requisitos.includes(h.id)).flatMap(s=>s.requisitos.filter(id=>id!==h.id&&positions.has(id)));
   const shared=pairs.reduce((score,id)=>score+54*(distancia_hex(c,positions.get(id))-1)**2,0);
   const score=cost+group+root+shared+distancia_hex(c,base_hex)*.22;
   if(score<bestScore-1e-7||(Math.abs(score-bestScore)<1e-7&&(best===null||c.r<best.r||c.r===best.r&&c.q<best.q))){best=c;bestScore=score;}
  }
  positions.set(h.id,best);
 }
 // Deterministic relaxation: moves and swaps preserve hex sizes, keep unique
 // coordinates and reduce both parent distances and shared-child distances.
 // Accept only strict improvements so opening the panel is deterministic.
 const ids=[...positions.keys()].filter(id=>id!=='BASE');
 let score=costo_mapa(positions,edges);
 for(let pass=0;pass<5;pass++){
  let improved=false;
  for(const id of ids){
   const original=positions.get(id);
   let bestScore=score,best=null;
   const occupied=new Map([...positions].map(([k,p])=>[clave_hex(p),k]));
   const candidates=new Map();
   for(const p of positions.values())for(const [dq,dr] of VECTORES_HEX){
    const c={q:p.q+dq,r:p.r+dr};
    if(distancia_hex(c,base_hex)<=11)candidates.set(clave_hex(c),c);
   }
   for(const cell of candidates.values()){
    const other=occupied.get(clave_hex(cell));
    if(other==='BASE'||other===id)continue;
    positions.set(id,cell);
    if(other)positions.set(other,original);
    const next=costo_mapa(positions,edges);
    if(next<bestScore-1e-7){bestScore=next;best={cell,other};}
    positions.set(id,original);
    if(other)positions.set(other,cell);
   }
   if(best){
    positions.set(id,best.cell);
    if(best.other)positions.set(best.other,original);
    score=bestScore;improved=true;
   }
  }
  if(!improved)break;
 }
 return Object.fromEntries(positions);
}
// Kept for existing unit tests and compatibility with callers expecting all
// 45 hexagons. The live UI instead calls geometria_panal_estado(b).
export function geometria_panal(){
 return geometria_panal_estado({evolucion:Object.fromEntries(HABILIDADES_EVOLUCION.map(h=>[h.id,1]))});
}
