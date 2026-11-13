import { ARENAS, TACTICAS, SUMINISTROS, VENTAJAS_GORILA, limitar, distancia } from './rules.js';
import { ancho, alto, limitar_posicion, altura_terreno, actualizar_altura, separar_personajes, zona_entrega, tiene_cobertura, refugio } from './terreno.js';
export { ancho, alto };
export const dificultades=['Fácil','Normal','Difícil','Extremo'];
const niveles=[[650,1,1],[775,1.12,1.06],[900,1.24,1.12],[1050,1.38,1.15],[1200,1.53,1.20],[1350,1.68,1.25],[1500,1.84,1.29],[1675,2.02,1.35],[1850,2.20,1.40],[2050,2.40,1.44],[2275,2.63,1.50],[2500,2.85,1.56]];
const efecto_vigente=(batalla,nombre)=>batalla.efectos.some(e=>e.nombre===nombre&&e.restante>0);
export const activo=h=>Boolean(h)&&h.estado!=='eliminado'&&h.estado!=='incapacitado'&&h.vida>0;
const azar_normalizado=(azar)=>limitar(azar(),0,0.999999);
const cerca=(h,g,r)=>distancia(h,g)<r;
function registrar(batalla,tipo,datos={}) {batalla.eventos.push({tipo,tiempo:300-batalla.tiempo,...datos});if(batalla.eventos.length>300)batalla.eventos.shift();}
const salud = h => limitar(h.vida / h.vida_maxima, 0, 1);

export function condiciones_combate(h) {
  const fuerza = h.radar.fuerza / 100;
  const resistencia = .45 + .42 * fuerza + .08 * h.radar.temple / 100 + .05 * h.radar.agilidad / 100;
  const lesion = 1 - salud(h);
  const valor = (h.valentia ?? 55) / 100;
  return {
    velocidad: (1 - lesion * (.70 - resistencia * .34)) * (.82 + valor * .31),
    potencia: (1 - lesion * (.79 - resistencia * .36)) * (.66 + valor * .58),
  };
}

function puede_actuar(h, g) {
  return Boolean(h) && activo(h) && !h.vuelo && !(g.fase === 'agarre' && g.sujeto === h);
}

export function danio_humano(h, disparo = false, apertura = 1, cercania = 0) {
  return (1 + h.fuerza_efectiva * .086) * condiciones_combate(h).potencia * apertura
    * (disparo ? 2.6 : 1) * (1 + (h.bono_dano ?? 0)) * (1 - .30 * limitar(cercania, 0, 1));
}

export const duracion_segunda_vida = 2300;
export const en_furia = g => g.furia > 0 || g.segunda_vida === 'activa';

export function reanudar_segunda_vida(b) {
  if (b.gorila.segunda_vida !== 'anuncio') return false;
  b.gorila.segunda_vida = 'activa';
  b.gorila.vida = b.gorila.vida_maxima;
  registrar(b, 'segunda_vida');
  return true;
}

function anunciar_segunda_vida(b) {
  const g = b.gorila;
  if (g.segunda_vida || g.vida > VENTAJAS_GORILA.segundo_aliento.umbral_vida) return false;
  g.segunda_vida = 'anuncio';
  return true;
}

export const velocidad_gorila = { persecucion: 77, repliegue: 83, embestida: 210 };
export function radio_ataque(g, accion = g.accion) {
  return ({ rugido: 145, golpe_area: g.radio + 75, agarre: g.radio + 54,
    embestida: g.radio + 34, barrido: g.radio + 38 })[accion] ?? g.radio + 38;
}
export function rango_golpe_gorila(g) {
  const fuerza = g.fuerza * (en_furia(g) ? VENTAJAS_GORILA.furia.fuerza : 1);
  return [36 * fuerza, 60 * fuerza];
}

function asignar_plan(b) {
  const hombres = b.hombres.filter(activo);
  const reparto = [...Object.entries(b.plan)];
  // No unassigned humans: tactics always total 100%.
  const grupos = reparto.map(([orden, porcentaje]) => {
    const exactos = hombres.length * porcentaje / 100;
    return { orden, cantidad: Math.floor(exactos), resto: exactos % 1 };
  });
  const pendientes = hombres.length - grupos.reduce((total, grupo) => total + grupo.cantidad, 0);
  [...grupos].sort((a, z) => z.resto - a.resto).slice(0, pendientes).forEach(grupo => grupo.cantidad++);
  grupos.sort((a, z) => Number(z.orden === 'buscar_armas') - Number(a.orden === 'buscar_armas'));
  let disponibles = [...hombres].sort((a, z) => a.id - z.id);
  for (const { orden, cantidad } of grupos) {
    if (orden === 'buscar_armas') disponibles.sort((a, z) =>
      distancia(z, b.gorila) - distancia(a, b.gorila) || a.id - z.id);
    for (const h of disponibles.slice(0, cantidad)) {
      if (h.orden !== orden) {
        h.orden = orden;
        h.buscando = null;
      }
    }
    disponibles = disponibles.slice(cantidad).sort((a, z) => a.id - z.id);
  }
  b.activos_asignados = hombres.length;
}

export function aplicar_plan(b, plan) {
  if (b.resultado) return false;
  const entradas = Object.entries(plan);
  if (entradas.length > 3 || entradas.some(([orden, valor]) =>
    !Object.hasOwn(TACTICAS, orden) || !Number.isInteger(valor) || valor < 5 || valor > 100 || valor % 5) ||
    entradas.reduce((total, [, valor]) => total + valor, 0) !== 100) return false;
  b.plan = { ...plan };
  asignar_plan(b);
  b.busqueda_en = b.transcurrido + 2;
  for (const orden of Object.keys(plan)) b.tacticas_usadas[orden] = (b.tacticas_usadas[orden] || 0) + 1;
  registrar(b, 'estrategia_actualizada');
  return true;
}

export function crear_batalla(personajes,dificultad=0,azar=Math.random,opciones={}) {
  const n=limitar(Math.floor(dificultad),0,3)*3+1+Math.floor(azar_normalizado(azar)*3);
  const [vida,fuerza,tamano]=niveles[n-1];
  const arena=ARENAS[opciones.arena]?opciones.arena:'claro';
  const batalla = {
    plan: { atacar: 100 }, activos_asignados: personajes.length, busqueda_en: 0, golpes_disponibles: 2,
    tiempo:300,transcurrido:0,resultado:'',azar,arena,bananas:0,bananas_ganadas:0,eventos:[],
    resumen:opciones.resumen||null,armas_suelo:(opciones.armas_suelo||[]).map(a=>({...a,objeto:{...a.objeto}, reserva:true})),
    entregas:[], parpadeos:[], suministros:[],proyectiles:[],efectos:[],reservas:opciones.reservas||0,tacticas_usadas:{},
    gorila:{x:760,y:320,nivel:n,vida,vida_maxima:vida,fuerza,radio:24*(tamano+azar()*.04),
      fase:'espera',reloj:2,ataques:0,energia:100,miedo:0,accion:'',recargas:{},memoria:{},
      furia:0,atrapado:0,reduccion_velocidad:0,descansando:false},
    hombres:personajes.map(personaje=>{
      const indice=personaje.id-1;
      const x = 53 + indice % 10 * 36;
      const y = 120 + Math.floor(indice / 10) * 43;
      const edad = limitar((personaje.edad - 45) / 55, 0, 1);
      const vida_maxima = (37 + personaje.radar.estrategia * .47 + personaje.radar.fuerza * .22) * (1 - edad * .27);
      return {...personaje,objeto:personaje.objeto ? {...personaje.objeto} : null,x,y,vida:vida_maxima,vida_maxima,energia:100,vx:0,vy:0,miedo:0,
        recarga:0,reaccion:0,defensa:0,valentia:40+personaje.radar.temple*.48,orden:'atacar',estado:'normal',proteccion:0,bono_dano:0,
        mejoras:[],buscando:null,oculto:false};
    }),
  };
  limitar_posicion(batalla.gorila, arena, 12);
  for (const objeto of batalla.armas_suelo) limitar_posicion(objeto, arena, 8);
  for (const actor of batalla.hombres) limitar_posicion(actor, arena, 6);
  separar_personajes(batalla.hombres, batalla.gorila, 4);
  for (const actor of [...batalla.hombres, batalla.gorila]) actor.altura = altura_terreno(actor, arena);
  return batalla;
}

export function comprar_suministro(batalla,id) {
  if (!Object.hasOwn(SUMINISTROS, id) || batalla.resultado) return false;
  const item = SUMINISTROS[id];
  if (batalla.bananas < item.costo) return false;
  if (item.solo_con_reservas) {
    const pendientes = batalla.entregas.filter(entrega => entrega.tipo === id).length;
    const vacantes = 100 - batalla.hombres.filter(activo).length;
    if (pendientes * item.cantidad >= Math.min(batalla.reservas, vacantes)) return false;
  }
  batalla.bananas -= item.costo;
  batalla.entregas.push({ ...zona_entrega(batalla.arena, batalla.azar), tipo: id, inicio: batalla.transcurrido });
  registrar(batalla, 'paquete_en_camino', { id });
  return true;
}

export const duracion_entrega = 2.2;
const intervalo_parpadeo = .16;
export const duracion_parpadeo = 6 * intervalo_parpadeo;
export const paracaidas_visible = (tiempo, aterrizaje) =>
  Math.floor((tiempo - aterrizaje) / intervalo_parpadeo) % 2 === 1;

function aplicar_suministro(batalla, entrega) {
  const { tipo: id, x, y } = entrega;
  const item = SUMINISTROS[id];
  const humanos=batalla.hombres.filter(activo);
  const sujetos=[...humanos].sort((a,b)=>(a.energia+a.vida)-(b.energia+b.vida)).slice(0,item.cantidad||0);
  if(item.energia||item.curacion||item.proteccion||item.dano_extra||item.efecto==='adrenalina'||item.efecto==='camuflaje') {
    for(const h of sujetos){
      h.energia=limitar(h.energia+(item.energia||0),0,100);
      h.vida=limitar(h.vida+(item.curacion||0),0,h.vida_maxima);
      h.proteccion=Math.max(h.proteccion,item.proteccion||0);
      h.bono_dano=Math.max(h.bono_dano,item.dano_extra||0);
      if(item.efecto)h.mejoras.push({nombre:item.efecto,restante:item.efecto_duracion||0});
    }
  }
  if(item.efecto)batalla.efectos.push({nombre:item.efecto,restante:item.efecto_duracion||0});
  if(id==='red'){batalla.gorila.reduccion_velocidad=Math.max(batalla.gorila.reduccion_velocidad,8);}
  if(id==='refuerzos'){
    // Refuerzos son personas de reserva, nunca reviven una baja.
    const capacidad=Math.min(100-batalla.hombres.filter(activo).length,batalla.reservas,item.cantidad);
    for(let i=0;i<capacidad;i++){
      const modelo=batalla.hombres[i%batalla.hombres.length];
      batalla.hombres.push({...modelo,id:batalla.hombres.length+1,vida:modelo.vida_maxima,estado:'normal',energia:100,objeto:null,x:x+(i-2)*22,y,altura:0,vz:0,vuelo:null,orden:'guardia',
        vx:0,vy:0,miedo:0,recarga:0,reaccion:0,defensa:0,valentia:40+modelo.radar.temple*.48,mejoras:[],buscando:null,oculto:false,proteccion:0,bono_dano:0,
        fuerza_efectiva:modelo.radar.fuerza,velocidad_efectiva:modelo.radar.velocidad});
    }
    batalla.reservas-=capacidad;
  }
  if (['barricada', 'senuelos', 'humo', 'trampa', 'cuerdas'].includes(id)) {
    batalla.suministros.push({ tipo: id, x, y, restante: id === 'barricada' ? 25 : item.efecto_duracion || 30 });
  } else {
    // Ground package remains until picked up.
  }
  batalla.parpadeos.push({ x, y, aterrizaje: batalla.transcurrido });
  registrar(batalla, 'paquete_entregado', { id });
}
function recompensa(batalla,danio,dt=0) {
  const multiplicador=efecto_vigente(batalla,'multiplicador')?1.5:1;
  const nuevo=(danio*.35+dt*.4)*multiplicador;
  batalla.bananas_ganadas+=nuevo;
  const enteros=Math.floor(batalla.bananas_ganadas);
  if(enteros){batalla.bananas+=enteros;batalla.bananas_ganadas-=enteros;}
}
function caminar(h,d,dt,velocidad=1) {
  if(!d)return;
  const distancia_restante=distancia(h,d);
  const ritmo = (14 + h.velocidad_efectiva * .58) * (h.energia < 20 ? .67 : 1) * velocidad;
  const giro=Math.min(1,dt*(3+h.radar.agilidad*.14));
  const escala=distancia_restante>3?Math.min(ritmo,distancia_restante/Math.max(dt,.001))/distancia_restante:0;
  h.vx+=((d.x-h.x)*escala-h.vx)*giro;h.vy+=((d.y-h.y)*escala-h.vy)*giro;
  h.x=limitar(h.x+h.vx*dt,10,ancho-10);h.y=limitar(h.y+h.vy*dt,10,alto-10);
}
export function valor_objeto(o) {
  if(!o)return 0;
  return o.tipo==='fuego'&&o.municion>0 ? 100+Math.min(40,o.municion*2)+(o.alcance||0)*.04
    : Math.max(1,10+(o.bono_fuerza_pb||0)/65+Math.min(25,(o.peso_g||0)/230));
}
export function clase_danio(o) {
  const v=valor_objeto(o);
  return v>=100?'Crítico':v>=40?'Alto':v>=18?'Medio':'Bajo';
}
function equipar(h,o) {
  h.objeto=o;
  h.fuerza_efectiva=h.radar.fuerza*(1+(o?.bono_fuerza_pb||0)/10000);
  h.velocidad_efectiva=h.radar.velocidad*(1-(o?.penalizacion_velocidad_pb||0)/10000);
}
function soltar_objeto(b,h,impulso=0) {
  if(!h.objeto)return;
  const angulo=b.azar()*Math.PI*2, objeto=h.objeto;
  equipar(h,null);
  b.armas_suelo.push({id:'soltado-'+h.id+'-'+Math.round(b.transcurrido*1000),
    objeto,x:limitar(h.x+Math.cos(angulo)*impulso,12,ancho-12),
    y:limitar(h.y+Math.sin(angulo)*impulso,12,alto-12),
    visible:true,recogido_por:null,disponible_en:b.transcurrido+.3});
  registrar(b,'objeto_soltado',{hombre:h.id,objeto:objeto.nombre});
}
export function buscar_objeto(b, h) {
  const inteligencia = limitar(h.radar.inteligencia * condiciones_combate(h).potencia / 100, 0, 1);
  const disponibles = b.armas_suelo.filter(objeto => !objeto.recogido_por && (objeto.disponible_en ?? 0) <= b.transcurrido &&
    valor_objeto(objeto.objeto) > valor_objeto(h.objeto)+1 &&
    (objeto.visible || distancia(h, objeto) <= 65 + 340 * inteligencia));
  const actual = disponibles.find(objeto => objeto.id === h.buscando);
  if (actual) return actual;
  if (!disponibles.length) return null;
  const reservados = new Set(b.hombres.filter(otro => otro !== h && otro.orden === 'buscar_armas').map(otro => otro.buscando));
  const puntuacion = objeto => distancia(h, objeto) + (reservados.has(objeto.id) ? 1000 : 0)
    - inteligencia * (objeto.objeto.tipo === 'fuego' ? 120 : Math.min(70, (objeto.objeto.bono_fuerza_pb || 0) / 20));
  return disponibles.reduce((mejor, objeto) => puntuacion(objeto) < puntuacion(mejor) ? objeto : mejor);
}

function actualizar_hombre(b, h, dt, puesto, cantidad_activos) {
  const g = b.gorila;
  const distancia_plana = distancia(h, g);
  const cerca_g = Math.hypot(distancia_plana, (h.altura - g.altura) * 1.6);
  h.recarga = Math.max(0, h.recarga - dt);
  h.defensa = Math.max(0, (h.defensa || 0) - dt);
  for (const mejora of h.mejoras) mejora.restante -= dt;
  h.mejoras = h.mejoras.filter(mejora => mejora.restante > 0);
  const templanza = h.radar.temple / 100;
  h.miedo = Math.max(0, h.miedo - dt * (cerca_g > 175 ? 8 : 2));
  const confianza = limitar(40 + templanza * 48 - h.miedo * .56 - (1 - salud(h)) * 26
    - (1 - cantidad_activos / 100) * 24 + (1 - g.vida / g.vida_maxima) * 18
    + (efecto_vigente(b, 'inspiracion') ? 18 : 0), 0, 100);
  h.valentia += (confianza - h.valentia) * Math.min(1, dt * 1.4);
  const panico = h.valentia < 22;
  h.estado = salud(h) <= .65 ? 'herido' : h.energia < 20 ? 'cansado' : panico ? 'panico' : 'normal';
  h.energia = limitar(h.energia + dt * (h.recarga > 0 ? 4.2 : 2.6) - (h.orden === 'huir' ? dt * 1.7 : 0), 0, 100);
  const rendimiento = condiciones_combate(h);
  const disparo = h.objeto?.tipo === 'fuego' && h.objeto.municion > 0;
  const alcance = disparo ? h.objeto.alcance : g.radio + 27;
  const amenazado = (g.fase === 'aviso' || g.fase === 'embestida') && g.accion !== 'rugido'
    && g.destino && distancia(h, g.destino) < g.radio + 75
    && Math.abs(h.altura - g.altura) < 35;
  if (amenazado && h.orden !== 'huir' && h.valentia >= 22) {
    if (h.energia >= 6 && h.defendio_ataque !== g.ataques) {
      h.defendio_ataque = g.ataques;
      h.energia -= 4;
    }
    if (h.defendio_ataque === g.ataques) h.defensa = .22;
  }
  let destino = h;
  h.oculto = h.orden === 'esconder' && tiene_cobertura(h, g, b.arena);
  const paquete=b.suministros.find(p=>p.tipo==='paquete'&&!p.recogido&&p.recolector===h.id);
  if(paquete) {
    destino=paquete;
    if(distancia(h,paquete)<23) {
      paquete.recogido=true;
      aplicar_suministro(b,paquete.entrega);
      registrar(b,'suministro_recogido',{hombre:h.id,tipo:paquete.entrega.tipo});
    }
  } else if (h.orden === 'huir' || (h.orden === 'atacar' && panico)) {
    destino = { x: 2 * h.x - g.x, y: 2 * h.y - g.y };
  } else if (h.orden === 'esconder' && !h.oculto) {
    destino = refugio(h, g, b.arena) ?? { x: 2 * h.x - g.x, y: 2 * h.y - g.y };
  } else if (h.orden === 'rescatar') {
    const caido = b.hombres.filter(p => p.estado === 'incapacitado' && !p.vuelo)
      .sort((a, z) => distancia(h, a) - distancia(h, z))[0];
    if (caido) {
      destino = caido;
      if (distancia(h, caido) < 38 && h.recarga <= 0) {
        caido.estado = 'herido';
        caido.vida = Math.max(8, caido.vida_maxima * .15);
        caido.orden = 'guardia';
        h.recarga = 8;
        registrar(b, 'rescate', { hombre: caido.id, paramedico: h.id });
      }
    }
  } else if (h.orden === 'distraer') {
    const largo = Math.max(distancia_plana, 1);
    const lado = h.id % 2 ? 1 : -1;
    const ajuste = limitar((115 - distancia_plana) / 36, -2, 2);
    const dx = (h.x - g.x) / largo;
    const dy = (h.y - g.y) / largo;
    destino = { x: h.x + 45 * (dx * ajuste - dy * lado), y: h.y + 45 * (dy * ajuste + dx * lado) };
  } else if (h.orden === 'buscar_armas' ||
    (h.orden !== 'huir' && h.orden !== 'esconder' && buscar_objeto(b,h) &&
    distancia(h,buscar_objeto(b,h))<35)) {
    const objeto = buscar_objeto(b, h);
    h.buscando = objeto?.id ?? null;
    if (objeto) {
      destino = objeto;
      if (distancia(h, objeto) < 48) objeto.descubierto = true;
      const inteligencia = h.radar.inteligencia / 100;
      if (distancia(h, objeto) < 14 + inteligencia * 11) {
        if (h.objeto) {
          b.armas_suelo.push({ id: 'relevo-' + h.id + '-' + b.transcurrido, objeto: h.objeto,
            x: h.x, y: h.y, visible: true, recogido_por: null, disponible_en: b.transcurrido + 5 });
        }
        equipar(h,objeto.objeto);
        objeto.recogido_por = h.id;
        registrar(b, 'arma_encontrada', { hombre: h.id, objeto: h.objeto.nombre });
      }
    } else {
      const angulo = h.id * 2.4 + b.transcurrido * .16;
      destino = { x: ancho / 2 + Math.cos(angulo) * 330, y: alto / 2 + Math.sin(angulo) * 214 };
    }
  } else if (puesto !== undefined && !(disparo && cerca_g < alcance * .85)) {
    const angulo = (puesto % 11) * Math.PI * 2 / 11 + Math.floor(puesto / 11) * .18;
    const radio = g.radio + 19 + Math.floor(puesto / 11) * 35;
    destino = { x: g.x + Math.cos(angulo) * radio, y: g.y + Math.sin(angulo) * radio };
  }
  if (amenazado && h.defensa > 0 && h.orden === 'atacar') destino = { x: 2 * h.x - g.destino.x, y: 2 * h.y - g.destino.y };
  if (h.defensa > 0) destino = { x: limitar(destino.x, 14, ancho - 14), y: limitar(destino.y, 14, alto - 14) };
  const ritmo = h.orden === 'huir' ? 1.3 : h.orden === 'esconder' ? .83 : 1;
  caminar(h, destino, dt, ritmo * rendimiento.velocidad * (altura_terreno(h, b.arena) > 8 ? .7 : 1));
  if(paquete)return;
  // An armed fighter may intentionally throw an object. Stronger fighters throw farther
  // and harder; unspent firearms are normally kept for shooting.
  const arrojable=h.objeto && (h.objeto.tipo!=='fuego' || (h.objeto.municion||0)===0);
  const fuerza=h.radar.fuerza/100;
  const alcance_lanzamiento=70+fuerza*125;
  if(arrojable && h.orden==='atacar' && !panico && h.defensa<=0 &&
      h.recarga<=0 && h.energia>=18 && cerca_g>g.radio+35 &&
      cerca_g<alcance_lanzamiento && b.golpes_disponibles>=1 &&
      b.azar()<(.13+fuerza*.28)) {
    const objeto=h.objeto;
    const inicio={x:h.x,y:h.y};
    equipar(h,null);
    const vuelo={objeto,inicio,fin:{x:g.x,y:g.y},x:h.x,y:h.y,
      transcurrido:0,duracion:.35+Math.min(.23,cerca_g/600),hombre:h.id,
      potencia:(2+valor_objeto(objeto)*.17)*(0.6+fuerza*.85)};
    b.proyectiles.push(vuelo);
    h.recarga=3.2;h.energia-=18;h.atacando_hasta=b.transcurrido+.4;
    b.golpes_disponibles-=1;
    registrar(b,'objeto_lanzado',{hombre:h.id,objeto:objeto.nombre});
    return;
  }
  if (g.vida <= 0 || h.orden !== 'atacar' || panico || h.defensa > 0 || h.recarga > 0 || h.energia < 14 ||
    cerca_g > alcance || tiene_cobertura(g, h, b.arena) || b.golpes_disponibles < 1) return;
  b.golpes_disponibles -= 1;
  h.recarga = (disparo ? 3.6 : 4.7) - h.radar.tecnica * .009;
  h.atacando_hasta = b.transcurrido + .38;
  h.energia -= disparo ? 10 : 15;
  if (disparo) {
    h.objeto.municion--;
    registrar(b, 'disparo', { hombre: h.id, restante: h.objeto.municion });
  }
  const bono_estrategia = efecto_vigente(b, 'plan') ? .15 : 0;
  const humo = efecto_vigente(b, 'humo') ? -.12 : 0;
  if (azar_normalizado(b.azar) < limitar((.21 + h.radar.precision * .007) * rendimiento.potencia + bono_estrategia + humo, .05, .95)) {
    const apertura = g.fase === 'recuperacion' ? 1.35 : 1;
    const danio = danio_humano(h, disparo, apertura, cerca_g / alcance);
    const aplicado = Math.min(g.vida, danio);
    g.vida -= aplicado;
    recompensa(b, aplicado);
  }
}

function danar_hombre(b,h,multiplicador=1, lanzamiento=false) {
  if(!activo(h))return;
  const g=b.gorila;
  const cobertura=b.suministros.some(s=>s.tipo==='barricada'&&distancia(h,s)<80)?0.65:1;
  const [minimo, maximo] = rango_golpe_gorila(g);
  const defensa = h.defensa > 0 ? .76 - h.radar.agilidad * .002 : 1;
  const azar = azar_normalizado(b.azar);
  const impacto = lanzamiento ? h.vida_maxima * (.92 + azar * .24) :
    (minimo + azar * (maximo - minimo)) * multiplicador * (1 - h.proteccion) * cobertura * defensa;
  if(h.objeto&&impacto>8&&b.azar()<limitar((impacto/h.vida_maxima-.12)*.5+
    (1-h.radar.fuerza/100)*.15,0,.83))soltar_objeto(b,h,20+Math.min(70,impacto));
  aplicar_danio_humano(b, h, impacto, 45);
}

function aplicar_danio_humano(b, h, impacto, miedo) {
  h.vida = Math.max(0, h.vida - impacto);
  h.miedo = limitar(h.miedo + miedo, 0, 100);
  if(h.vida<=0) {
    h.estado=azar_normalizado(b.azar)<.22?'incapacitado':'eliminado';
    registrar(b,'baja',{hombre:h.id,estado:h.estado});
    // Un objeto puede recuperarse del suelo, nunca duplicarse.
    if(h.objeto)soltar_objeto(b,h,7);
    for(const aliado of b.hombres)if(activo(aliado)&&distancia(aliado,h)<95)aliado.miedo=limitar(aliado.miedo+17,0,100);
  } else if (salud(h) <= .65) {
    if (h.estado !== 'herido') registrar(b, 'herido', { hombre: h.id });
    h.estado = 'herido';
  }
}
function empujar_por_contacto(b, hombres) {
  const g = b.gorila;
  const radio = g.radio + 10;
  for (const h of hombres) {
    if ((h.empuje_disponible ?? 0) > b.transcurrido || Math.abs(h.altura - g.altura) >= 22 || !cerca(h, g, radio)) continue;
    h.empuje_disponible = b.transcurrido + .4;
    aplicar_danio_humano(b, h, h.vida_maxima * .0005, 0);
    const dx = h.x - g.x;
    const dy = h.y - g.y;
    const largo = Math.hypot(dx, dy) || 1;
    h.x = limitar(h.x + (dx / largo || (dy === 0 ? 1 : 0)) * 4, 14, ancho - 14);
    h.y = limitar(h.y + dy / largo * 4, 22, alto - 22);
    h.vx *= .6;
    h.vy *= .6;
  }
}

function lanzar(b, h, origen, fuerza) {
  const dx = h.x - origen.x;
  const dy = h.y - origen.y;
  const largo = Math.hypot(dx, dy) || 1;
  h.vuelo = { x: h.x, y: h.y, dx: (dx / largo || 1) * fuerza,
    dy: dy / largo * fuerza, inicio: b.transcurrido, duracion: .82, altura: h.altura };
  h.vx = h.vy = 0;
}

function actualizar_vuelos(b) {
  for (const h of b.hombres) {
    if (!h.vuelo) continue;
    const vuelo = h.vuelo;
    const t = limitar((b.transcurrido - vuelo.inicio) / vuelo.duracion, 0, 1);
    h.x = limitar(vuelo.x + vuelo.dx * t, 10, ancho - 10);
    h.y = limitar(vuelo.y + vuelo.dy * t, 10, alto - 10);
    const piso = altura_terreno(h, b.arena);
    h.altura = Math.max(piso, vuelo.altura * (1 - t) + piso * t + 250 * t * (1 - t));
    if (t >= 1) {
      delete h.vuelo;
      h.vz = 0;
      if (vuelo.agarre) danar_hombre(b, h, 1, true);
    }
  }
}

function resolver_ataque(b,activos) {
  const g = b.gorila;
  const radio = radio_ataque(g);
  for(const h of activos) {
    const cercania = Math.hypot(distancia(h, g), (h.altura - g.altura) * 1.35);
    if (cercania > radio) continue;
    if(g.accion==='rugido'){h.miedo=limitar(h.miedo+38,0,100);continue;}
    const factor = (g.accion === 'golpe_area' ? .95 : 1) * (1 - .48 * cercania / radio);
    if (g.accion === 'barrido' && g.objetivo && h !== g.objetivo) continue;
    if (h.vuelo || tiene_cobertura(h, g, b.arena)) continue;
    if (g.accion === 'embestida') impacto_embestida(b, h);
    else {
      danar_hombre(b, h, factor);
      if (g.accion === 'golpe_area') lanzar(b, h, g, 94);
    }
  }
  g.fase = 'recuperacion';
  g.reloj = g.accion === 'golpe_area' ? .46 : en_furia(g) ? .65 : 1.15;
}
function impacto_embestida(b, h) {
  const g = b.gorila;
  g.impactados ??= new Set();
  if (g.impactados.has(h.id) || !activo(h) || h.vuelo) return;
  const cercania = Math.hypot(distancia(h, g), (h.altura - g.altura) * 1.35);
  const radio = radio_ataque(g, 'embestida');
  if (cercania > radio) return;
  g.impactados.add(h.id);
  danar_hombre(b, h, 1.35 * (1 - .45 * cercania / radio));
  lanzar(b, h, g, 94);
}

function cooldown(g,nombre,segundos){g.recargas[nombre]=segundos;}
function habilitada(g,nombre){return (g.recargas[nombre]||0)<=0;}
function mover_gorila(g, destino, dt, ritmo, arena) {
  const paso = Math.min(1, ritmo * dt / Math.max(distancia(g, destino), 1));
  const x = limitar(g.x + (destino.x - g.x) * paso, 25, ancho - 25);
  const y = limitar(g.y + (destino.y - g.y) * paso, 30, alto - 30);
  if (Math.abs(x - g.x) > .1) g.mira_izquierda = x < g.x;
  g.movimiento = Math.hypot(x - g.x, y - g.y) / dt;
  g.x = x;
  g.y = y;
  actualizar_altura(g, arena, dt);
  return paso === 1;
}

function salida_gorila(g, hombres) {
  const candidatos = Array.from({ length: 12 }, (_, i) => {
    const angulo = i * Math.PI / 6;
    return { x: limitar(g.x + Math.cos(angulo) * 180, 60, ancho - 60),
      y: limitar(g.y + Math.sin(angulo) * 150, 55, alto - 55) };
  });
  const puntuacion = punto => Math.min(...hombres.map(h => distancia(h, punto))) + distancia(g, punto) * .14;
  return candidatos.reduce((mejor, punto) => puntuacion(punto) > puntuacion(mejor) ? punto : mejor);
}

function agarrar(b, h, forzado = false) {
  const g = b.gorila;
  g.sujeto = h;
  g.fase = 'agarre';
  g.accion = 'agarre';
  g.reloj = 1.1;
  g.mira_izquierda = h.x < g.x;
  if (forzado) cooldown(g, 'agarre', VENTAJAS_GORILA.agarre.recarga);
  registrar(b, 'agarre', { hombre: h.id });
}

function alcanza_agarre(g, h) {
  return Math.hypot(distancia(g, h), (h.altura - g.altura) * 1.35) <= radio_ataque(g, 'agarre');
}

function actualizar_gorila(b,activos,dt) {
  const g=b.gorila;
  for(const key of Object.keys(g.recargas))g.recargas[key]=Math.max(0,g.recargas[key]-dt);
  g.furia=Math.max(0,g.furia-dt);g.reduccion_velocidad=Math.max(0,g.reduccion_velocidad-dt);
  g.energia=limitar(g.energia+(g.fase==='recuperacion'?dt*5:dt*.6),0,100);
  const furia = VENTAJAS_GORILA.furia;
  if (g.vida / g.vida_maxima < furia.umbral_vida && !en_furia(g) && habilitada(g, 'furia')) {
    g.furia = furia.duracion;
    cooldown(g, 'furia', furia.recarga);
    registrar(b, 'furia');
  }
  g.movimiento = 0;
  g.reloj -= dt;
  const lento = g.reduccion_velocidad > 0 ? .60 : 1;
  if (g.fase === 'repliegue') {
    if (mover_gorila(g, g.destino, dt, velocidad_gorila.repliegue * lento, b.arena) || g.reloj <= 0) {
      g.fase = 'espera';
      g.reloj = .25;
    }
    return;
  }
  if (g.fase === 'persecucion') {
    const objetivo = g.objetivo;
    if (activo(objetivo)) {
      if (puede_actuar(objetivo, g) && alcanza_agarre(g, objetivo)) {
        agarrar(b, objetivo, true);
      } else {
        g.destino = { x: objetivo.x, y: objetivo.y };
        mover_gorila(g, g.destino, dt, velocidad_gorila.persecucion * lento, b.arena);
      }
      return;
    }
    g.fase = 'espera';
    g.reloj = 0;
  }
  if (g.fase === 'agarre') {
    const h = g.sujeto;
    if (g.reloj <= 0 || !h || !activo(h)) {
      if (h && activo(h)) {
        lanzar(b, h, g, 145);
        h.vuelo.agarre = true;
        registrar(b, 'lanzamiento', { hombre: h.id });
      }
      g.sujeto = null;
      g.fase = 'recuperacion';
      g.reloj = 1.15;
    }
    return;
  }
  if(g.fase==='embestida'){
    const fatiga = g.energia < 20 ? .7 : 1;
    const impulso_furia = en_furia(g) ? VENTAJAS_GORILA.furia.velocidad : 1;
    const llego = mover_gorila(g, g.destino, dt, (g.altura > 10 ? 158 : velocidad_gorila.embestida) * lento * fatiga * impulso_furia, b.arena);
    for (const h of activos) {
      if (distancia(h, g) <= radio_ataque(g, 'embestida')) impacto_embestida(b, h);
    }
    if (llego || g.reloj <= 0) {
      g.destino = { x: g.x, y: g.y };
      resolver_ataque(b, activos);
    }
    return;
  }
  if(g.reloj>0)return;
  if(g.fase==='aviso'){
    if(g.accion==='embestida'){
      g.fase = 'embestida';
      g.impactados = new Set();
      g.reloj = 3.1;
    } else if (g.accion === 'agarre') {
      if (puede_actuar(g.sujeto, g) && alcanza_agarre(g, g.sujeto)) {
        agarrar(b, g.sujeto);
      } else {
        g.sujeto = null;
        g.accion = 'barrido';
        resolver_ataque(b, activos);
      }
    } else resolver_ataque(b,activos);
    return;
  }
  const trampa=b.suministros.find(s=>s.tipo==='trampa'&&distancia(g,s)<45);
  if(trampa){g.fase='recuperacion';g.reloj=3;trampa.restante=0;registrar(b,'trampa_activada');return;}
  const amenazas = activos.filter(h => puede_actuar(h, g) && !h.oculto);
  const cercanos = amenazas.filter(h => cerca(h, g, g.radio + 91)).length;
  const salida = VENTAJAS_GORILA.retiro_estrategico;
  if (!amenazas.length) {
    if (habilitada(g, 'repliegue')) {
      g.destino = zona_entrega(b.arena, b.azar);
      g.fase = 'repliegue';
      g.reloj = 2.6;
      cooldown(g, 'repliegue', salida.recarga);
    }
    return;
  }
  const distracciones = amenazas.filter(h => h.orden === 'distraer' && cerca(h, g, 145));
  const candidatos = distracciones.length ? distracciones : amenazas;
  const puntuacion = h => distancia(g, h) + 13 * amenazas.filter(otro => otro !== h && cerca(h, otro, 57)).length;
  const objetivo = candidatos.reduce((mejor, h) => puntuacion(h) < puntuacion(mejor) ? h : mejor);
  const cercano = amenazas.reduce((mejor, h) => distancia(g, h) < distancia(g, mejor) ? h : mejor);
  const presa = distancia(g, cercano) < g.radio + 43 ? cercano : objetivo;
  g.objetivo = presa;
  g.mira_izquierda = presa.x < g.x;
  g.destino = { x: g.x, y: g.y };
  g.reloj = Math.max(.55, 1.32 - g.nivel * .035);

  const reglas = VENTAJAS_GORILA;
  if (cercanos >= reglas.carga.min_cercanos && habilitada(g, 'carga')) {
    const señuelo = b.suministros.find(s => s.tipo === 'senuelos');
    g.accion = 'embestida';
    g.destino = señuelo ?? salida_gorila(g, amenazas);
    if (señuelo) {
      señuelo.restante = 0;
      registrar(b, 'gorila_distraido');
    }
    cooldown(g, 'carga', reglas.carga.recarga);
  } else if (cercanos >= reglas.golpe_area.min_cercanos && habilitada(g, 'golpe_area')) {
    g.accion = 'golpe_area';
    g.reloj = .35;
    cooldown(g, 'golpe_area', reglas.golpe_area.recarga);
  } else if (amenazas.some(h => cerca(h, g, radio_ataque(g, 'rugido'))) && habilitada(g, 'rugido')) {
    g.accion = 'rugido';
    cooldown(g, 'rugido', reglas.rugido.recarga);
  } else if ((cercanos >= 5 || (cercanos >= 2 && g.vida / g.vida_maxima < .38)) && habilitada(g, 'repliegue')) {
    g.destino = salida_gorila(g, amenazas);
    g.fase = 'repliegue';
    g.reloj = 2.8;
    cooldown(g, 'repliegue', salida.recarga);
    registrar(b, 'gorila_se_repliega');
    return;
  } else if (alcanza_agarre(g, presa) && habilitada(g, 'agarre')) {
    g.accion = 'agarre';
    g.sujeto = presa;
    cooldown(g, 'agarre', reglas.agarre.recarga);
  } else if (distancia(g, presa) > g.radio + 43) {
    g.fase = 'persecucion';
    return;
  } else {
    g.accion = 'barrido';
  }
  g.ataques++;
  g.fase = 'aviso';
  g.energia=limitar(g.energia-7,0,100);
  for(const h of activos)h.reaccion=(100-h.radar.agilidad)*.008;
  registrar(b,'ataque_gorila',{accion:g.accion});
}
export function avanzar_batalla(b,dt) {
  if (b.resultado || !Number.isFinite(dt) || dt <= 0 || b.gorila.segunda_vida === 'anuncio') return;
  if (anunciar_segunda_vida(b)) return;
  dt=Math.min(dt,.1);
  b.tiempo=Math.max(0,b.tiempo-dt);b.transcurrido+=dt;
  recompensa(b,0,dt);
  for(const e of b.efectos)e.restante-=dt;
  b.efectos=b.efectos.filter(e=>e.restante>0);
  for(const s of b.suministros)if(s.tipo!=='paquete'||s.recogido)s.restante-=dt;
  b.suministros=b.suministros.filter(s=>s.restante>0);
  for(const p of b.suministros.filter(s=>s.tipo==='paquete'&&!s.recogido)) {
    if(!b.hombres.some(h=>h.id===p.recolector&&activo(h)))
      p.recolector=b.hombres.filter(activo).sort((a,z)=>distancia(a,p)-distancia(z,p))[0]?.id;
  }
  b.entregas = b.entregas.filter(entrega => {
    if (b.transcurrido - entrega.inicio < duracion_entrega) return true;
    const cercano=b.hombres.filter(activo).sort((a,z)=>distancia(a,entrega)-distancia(z,entrega))[0];
    b.suministros.push({tipo:'paquete',x:entrega.x,y:entrega.y,restante:2,recogido:false,
      recolector:cercano?.id,entrega});
    registrar(b,'paquete_aterrizado',{id:entrega.tipo});
    return false;
  });
  b.parpadeos = b.parpadeos.filter(p => b.transcurrido - p.aterrizaje < duracion_parpadeo);
  b.golpes_disponibles = Math.min(2, b.golpes_disponibles + dt * 2.5);
  actualizar_vuelos(b);
  b.proyectiles=b.proyectiles.filter(p=>{
    p.transcurrido+=dt;
    const f=limitar(p.transcurrido/p.duracion,0,1);
    p.x=p.inicio.x+(p.fin.x-p.inicio.x)*f;
    p.y=p.inicio.y+(p.fin.y-p.inicio.y)*f;
    p.altura=Math.sin(Math.PI*f)*60;
    if(f<1)return true;
    b.armas_suelo.push({id:'lanzado-'+p.hombre+'-'+Math.round(b.transcurrido*1000),
      objeto:p.objeto,x:p.fin.x+12,y:p.fin.y+10,visible:true,recogido_por:null,
      disponible_en:b.transcurrido+1});
    if(b.gorila.vida>0) {
      const golpe=Math.min(b.gorila.vida,p.potencia);
      b.gorila.vida-=golpe;recompensa(b,golpe);
    }
    registrar(b,'impacto_objeto',{hombre:p.hombre,objeto:p.objeto.nombre});
    return false;
  });
  const activos=b.hombres.filter(activo);
  if(!activos.length||b.tiempo===0){b.resultado='Victoria del gorila';return;}
  for (const h of activos) h.oculto = h.orden === 'esconder' && tiene_cobertura(h, b.gorila, b.arena);
  actualizar_gorila(b,activos,dt);
  const disponibles = activos.filter(activo);
  if (disponibles.length !== b.activos_asignados || (b.plan.buscar_armas && b.transcurrido >= b.busqueda_en)) {
    asignar_plan(b);
    b.busqueda_en = b.transcurrido + 2;
  }
  const puestos = new Map(disponibles.filter(h => h.orden === 'atacar' && h.valentia >= 22).map((h, i) => [h, i]));
  const turno = Math.floor(b.transcurrido * 2.5) % activos.length;
  for (let i = 0; i < activos.length; i++) {
    const h = activos[(i + turno) % activos.length];
    if(!activo(h) || h.vuelo || (b.gorila.fase === 'agarre' && b.gorila.sujeto === h))continue;
    actualizar_hombre(b, h, dt, puestos.get(h), disponibles.length);
    if (anunciar_segunda_vida(b)) return;
  }
  const suelo = b.hombres.filter(h => activo(h) && !h.vuelo && !(b.gorila.fase === 'agarre' && b.gorila.sujeto === h));
  empujar_por_contacto(b, suelo);
  separar_personajes(suelo.filter(activo), b.gorila);
  for (const h of suelo) actualizar_altura(h, b.arena, dt);
  const g = b.gorila;
  if (g.fase === 'agarre' && g.sujeto) {
    g.sujeto.x = g.x + (g.mira_izquierda ? -22 : 22);
    g.sujeto.y = g.y + 2;
    g.sujeto.altura = Math.max(altura_terreno(g.sujeto, b.arena), g.altura + (g.reloj > .7 ? 20 : 36));
  }
  if(b.gorila.vida<=0)b.resultado='Victoria de los hombres';
  else if(!b.hombres.some(activo))b.resultado='Victoria del gorila';
}
