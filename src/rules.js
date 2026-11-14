// Reglas de juego desacopladas del renderizado.
// Todos los números de balance se calibrarán mediante simulaciones.
export const ATRIBUTOS = ['fuerza','velocidad','inteligencia','temple','precision','agilidad','estrategia','tecnica'];
export const ARENAS = {
  claro: {nombre:'Claro del bosque', reserva:.20, cobertura:0.15, terreno:'bosque', categorias:['ropa','hogar','escenario','deportes'], puntos:[[205,125],[430,170],[620,480],[810,520]]},
  selva: {nombre:'Selva y ruinas', reserva:.28, cobertura:0.60, terreno:'selva', categorias:['escenario','hogar','deportes','taller'], puntos:[[160,150],[410,130],[660,490],[880,400]]},
  canon: {nombre:'Cañón rocoso', reserva:.35, cobertura:0.25, terreno:'canon', categorias:['escenario','taller','hogar','deportes'], puntos:[[140,410],[310,140],[680,155],[850,485]]},
  hangar: {nombre:'Hangar abandonado', reserva:.60, cobertura:0.50, terreno:'industrial', categorias:['taller','oficina','exterior','hogar','armas_fuego'], puntos:[[160,120],[360,470],[680,140],[850,450]]},
};
export const TACTICAS = {
  atacar: {nombre:'Atacar', energia:1.7},
  huir: {nombre:'Huida', energia:2.0},
  esconder: {nombre:'Esconderse', energia:.35},
  buscar_armas: {nombre:'Buscar armas', energia:1.3},
  distraer: {nombre:'Distraer', energia:1.4},
  rescatar: {nombre:'Rescatar heridos', energia:1.0},
};
export const SUMINISTROS = {
  municion: {nombre:'Caja de munición',costo:60,cantidad:5,balas:5},
  energizante: {nombre:'Energizantes', costo:30, cantidad:10, energia:35, efecto:'fatiga', efecto_duracion:15},
  botiquin: {nombre:'Botiquín', costo:45, cantidad:5, curacion:25},
  comida: {nombre:'Comida', costo:20, cantidad:15, energia:15},
  adrenalina: {nombre:'Adrenalina', costo:65, cantidad:8, efecto:'adrenalina', efecto_duracion:15},
  cascos: {nombre:'Cascos', costo:45, cantidad:10, proteccion:.20},
  escudos: {nombre:'Escudos', costo:70, cantidad:6, proteccion:.35},
  chalecos: {nombre:'Chalecos', costo:55, cantidad:8, proteccion:.25},
  barricada: {nombre:'Barricada', costo:80, cobertura:30,vida:150,construccion:3,proteccion:.40,capacidad:8},
  bates: {nombre:'Bates', costo:40, cantidad:10, dano_extra:.15},
  red: {nombre:'Red de captura', costo:85, gorila_lento:8},
  cuerdas: {nombre:'Cuerdas', costo:35, cantidad:6, gorila_lento:4},
  refuerzos: {nombre:'Refuerzos', costo:150, cantidad:5},
  inspiracion: {nombre:'Inspiración', costo:90, efecto:'inspiracion', efecto_duracion:20},
};
export const VENTAJAS_GORILA = {
  furia: {umbral_vida:.30, duracion:12, recarga:20, fuerza:1.30, velocidad:1.15},
  golpe_area: {min_cercanos:8, recarga:3},
  carga: {min_cercanos:11, recarga:5},
  agarre: {recarga:3},
  rugido: {recarga:10},
  memoria: {repeticiones:3},
  detectar_emboscada: {recarga:25},
  segundo_aliento: {umbral_vida:20},
  adrenalina: {recarga:70},
  dolor: {umbral_vida:.40, recarga:60},
  trepar: {terrenos:['selva','bosque']},
  lanzar_objetos: {recarga:20},
  destruir_cobertura: {},
  ventaja_territorial: {terrenos:['selva','bosque']},
  escapar_trampa: {},
  retiro_estrategico: {recarga:5},
  recuperacion: {},
  seleccionar_objetivo: {},
  aprender_defensa: {recarga:40},
  intimidar: {recarga:45},
};
export const limitar = (n,a,b) => Math.max(a,Math.min(b,n));
export const distancia = (a,b) => Math.hypot(a.x-b.x,a.y-b.y);
export function azar_entero(azar,max) {return Math.floor(azar()*max);}
export function sortear_inventario(catalogo, arena='claro', azar=Math.random, total=100) {
  const configuracion=ARENAS[arena]||ARENAS.claro;
  const cantidad=limitar(Math.round(total*configuracion.reserva),0,total);
  const elegibles=catalogo.objetos.filter(o=>configuracion.categorias.includes(o.categoria));
  const probabilidades=catalogo.reglas.probabilidad_nivel;
  const posiciones=configuracion.puntos;
  return Array.from({length:cantidad},(_,i)=>{
    const n=azar();
    let acumulado=0, nivel=1;
    for(const [id,p] of Object.entries(probabilidades)){acumulado+=p;if(n<acumulado){nivel=Number(id);break;}}
    let lista=elegibles.filter(o=>o.nivel===nivel);
    if(!lista.length)lista=catalogo.objetos.filter(o=>o.nivel===nivel);
    const objeto={...lista[azar_entero(azar,lista.length)]};
    const base=posiciones[i%posiciones.length];
    return {id:'suelo-'+i,objeto,x:limitar(base[0]+(azar()-.5)*110,20,980),
      y:limitar(base[1]+(azar()-.5)*90,20,620),recogido_por:null,visible:azar()>.45};
  });
}
export function resumir_equipo(hombres,armas_suelo=[]) {
  const arquetipos={};
  const objetos={};
  for(const h of hombres){
    arquetipos[h.arquetipo]=(arquetipos[h.arquetipo]||0)+1;
    if(h.objeto) objetos[h.objeto.nombre]=(objetos[h.objeto.nombre]||0)+1;
  }
  return {total:hombres.length,armados:hombres.filter(h=>h.objeto).length,
    desarmados:hombres.filter(h=>!h.objeto).length,armas_arena:armas_suelo.length,
    arquetipos,objetos};
}
