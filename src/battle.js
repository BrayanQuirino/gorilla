import { ARENAS, TACTICAS, SUMINISTROS, VENTAJAS_GORILA, limitar, distancia } from './rules.js';
import { ancho, alto, limitar_posicion, altura_terreno, actualizar_altura, separar_personajes, zona_entrega } from './terreno.js';
export { ancho, alto };
export const dificultades=['Fácil','Normal','Difícil','Extremo'];
const niveles=[[650,1,1],[775,1.12,1.06],[900,1.24,1.12],[1050,1.38,1.15],[1200,1.53,1.20],[1350,1.68,1.25],[1500,1.84,1.29],[1675,2.02,1.35],[1850,2.20,1.40],[2050,2.40,1.44],[2275,2.63,1.50],[2500,2.85,1.56]];
const efecto_vigente=(batalla,nombre)=>batalla.efectos.some(e=>e.nombre===nombre&&e.restante>0);
const armados=h=>Boolean(h.objeto);
export const activo=h=>h.estado!=='eliminado'&&h.estado!=='incapacitado'&&h.vida>0;
const azar_normalizado=(azar)=>limitar(azar(),0,0.999999);
const cerca=(h,g,r)=>distancia(h,g)<r;
function registrar(batalla,tipo,datos={}) {batalla.eventos.push({tipo,tiempo:300-batalla.tiempo,...datos});if(batalla.eventos.length>300)batalla.eventos.shift();}
export function crear_batalla(personajes,dificultad=0,azar=Math.random,opciones={}) {
  const n=limitar(Math.floor(dificultad),0,3)*3+1+Math.floor(azar_normalizado(azar)*3);
  const [vida,fuerza,tamano]=niveles[n-1];
  const arena=ARENAS[opciones.arena]?opciones.arena:'claro';
  const batalla = {
    estrategia: 'atacar',
    tiempo:300,transcurrido:0,resultado:'',azar,arena,bananas:0,bananas_ganadas:0,eventos:[],
    resumen:opciones.resumen||null,armas_suelo:(opciones.armas_suelo||[]).map(a=>({...a})),
    entregas:[], suministros:[],efectos:[],reservas:opciones.reservas||0,tacticas_usadas:{},
    gorila:{x:760,y:320,nivel:n,vida,vida_maxima:vida,fuerza,radio:24*(tamano+azar()*.04),
      fase:'espera',reloj:2,ataques:0,energia:100,miedo:0,accion:'',recargas:{},memoria:{},
      furia:0,atrapado:0,reduccion_velocidad:0,descansando:false},
    hombres:personajes.map(personaje=>{
      const indice=personaje.id-1;
      const x = 62 + indice % 10 * 30;
      const y = 154 + Math.floor(indice / 10) * 36;
      const vida_maxima=35+(personaje.radar.estrategia||50)*.65;
      return {...personaje,x,y,vida:vida_maxima,vida_maxima,energia:100,vx:0,vy:0,miedo:0,
        recarga:0,reaccion:0,orden:'atacar',estado:'normal',proteccion:0,bono_dano:0,
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

export function dar_orden(batalla, orden) {
  if (batalla.resultado || !Object.hasOwn(TACTICAS, orden)) return false;
  batalla.estrategia = orden;
  for (const hombre of batalla.hombres) {
    if (!activo(hombre)) continue;
    hombre.orden = orden;
    hombre.buscando = null;
  }
  batalla.tacticas_usadas[orden] = (batalla.tacticas_usadas[orden] || 0) + 1;
  registrar(batalla, 'orden', { orden });
  return true;
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
      batalla.hombres.push({...modelo,id:batalla.hombres.length+1,vida:modelo.vida_maxima,estado:'normal',energia:100,objeto:null,x:x+(i-2)*22,y,altura:0,vz:0,vuelo:null,orden:batalla.estrategia,
        vx:0,vy:0,miedo:0,recarga:0,reaccion:0,mejoras:[],buscando:null,oculto:false,proteccion:0,bono_dano:0,
        fuerza_efectiva:modelo.radar.fuerza,velocidad_efectiva:modelo.radar.velocidad});
    }
    batalla.reservas-=capacidad;
  }
  if (['barricada', 'senuelos', 'humo', 'trampa', 'cuerdas'].includes(id)) {
    batalla.suministros.push({ tipo: id, x, y, restante: id === 'barricada' ? 25 : item.efecto_duracion || 30 });
  } else {
    batalla.suministros.push({ tipo: 'paquete', x, y, restante: 2 });
  }
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
  const ritmo=(24+h.velocidad_efectiva*1.05)*(h.energia<20?.6:1)*velocidad;
  const giro=Math.min(1,dt*(3+h.radar.agilidad*.14));
  const escala=distancia_restante>3?Math.min(ritmo,distancia_restante/Math.max(dt,.001))/distancia_restante:0;
  h.vx+=((d.x-h.x)*escala-h.vx)*giro;h.vy+=((d.y-h.y)*escala-h.vy)*giro;
  h.x=limitar(h.x+h.vx*dt,10,ancho-10);h.y=limitar(h.y+h.vy*dt,10,alto-10);
}
function buscar_objeto(b,h) {
  const disponibles=b.armas_suelo.filter(a=>!a.recogido_por);
  if(!disponibles.length)return null;
  const conocimiento=h.radar.inteligencia/100;
  const visibles=disponibles.filter(a=>a.visible||conocimiento>.75);
  if(!visibles.length)return null;
  return visibles.reduce((m,a)=>!m||distancia(h,a)<distancia(h,m)?a:m,null);
}
function actualizar_hombre(b,h,dt,puesto) {
  const g=b.gorila,cerca_g=Math.hypot(distancia(h,g), (h.altura-g.altura)*1.6);
  h.recarga=Math.max(0,h.recarga-dt);h.reaccion=Math.max(0,h.reaccion-dt);
  for(const mejora of h.mejoras)mejora.restante-=dt;
  h.mejoras=h.mejoras.filter(m=>m.restante>0);
  const pánico=h.miedo>12+h.radar.temple*.76;
  h.miedo=limitar(h.miedo-dt*(cerca_g>175?15:4),0,100);
  const gasto=(TACTICAS[h.orden]?.energia||.25)*(h.orden==='mantener'?0.3:1);
  h.energia=limitar(h.energia-dt*gasto+(h.orden==='mantener'||h.orden==='esconder'?dt*1.3:0),0,100);
  h.estado=h.vida<h.vida_maxima*.35?'herido':h.energia<20?'cansado':pánico?'panico':'normal';
  h.oculto=h.orden==='esconder'||(h.orden==='emboscada'&&cerca_g>120);
  let destino=h;
  if(h.orden==='rescatar') {
    const caido=b.hombres.filter(p=>p.estado==='incapacitado').sort((a,z)=>distancia(h,a)-distancia(h,z))[0];
    if(caido){destino=caido;if(distancia(h,caido)<18&&h.recarga===0){
      caido.estado='herido';caido.vida=Math.max(8,caido.vida_maxima*.15);caido.orden='retirar';
      h.recarga=8;registrar(b,'rescate',{hombre:caido.id,paramedico:h.id});
    }}else h.orden='mantener';
  }
  else if(h.orden==='retirar'||h.orden==='huir'||(h.orden==='atacar'&&pánico))destino={x:h.x+(h.x-g.x),y:h.y+(h.y-g.y)};
  else if(h.orden==='distraer'){
    const distancia = Math.max(cerca_g, 1);
    const lado = h.id % 2 ? 1 : -1;
    const ajuste = limitar((105 - cerca_g) / 35, -2, 2);
    const dx = (h.x - g.x) / distancia;
    const dy = (h.y - g.y) / distancia;
    destino = { x: h.x + 45 * (dx * ajuste - dy * lado), y: h.y + 45 * (dy * ajuste + dx * lado) };
  }
  else if(h.orden==='buscar_armas'){
    const objeto=buscar_objeto(b,h);h.buscando=objeto?.id||null;
    if(objeto){destino=objeto;if(distancia(h,objeto)<15){
      h.objeto=objeto.objeto;objeto.recogido_por=h.id;
      h.fuerza_efectiva=h.radar.fuerza*(1+(h.objeto?.bono_fuerza_pb||0)/10000);
      h.velocidad_efectiva=h.radar.velocidad*(1-(h.objeto?.penalizacion_velocidad_pb||0)/10000);
      registrar(b,'arma_encontrada',{hombre:h.id,objeto:h.objeto.nombre});
      h.orden='retirar';
    }} else h.orden='esconder';
  } else if(h.orden==='esconder'||h.orden==='emboscada') {
    const cobertura=ARENAS[b.arena].cobertura;
    if(cobertura>.3)destino={x:limitar(h.x+(h.id%2?20:-20),10,990),y:limitar(h.y+(h.id%3?15:-15),10,630)};
  } else if(puesto!==undefined) {
    const angulo=(puesto%20)*Math.PI*2/20,radio=g.radio+12+Math.floor(puesto/20)*16;
    destino={x:g.x+Math.cos(angulo)*radio,y:g.y+Math.sin(angulo)*radio};
  }
  if(g.fase==='aviso'&&g.accion!=='rugido'&&h.reaccion===0&&!['huir','retirar'].includes(h.orden)
    &&h.radar.inteligencia>=36&&g.destino&&distancia(h,g.destino)<52+h.radar.inteligencia*.45) {
    destino={x:h.x*2-g.destino.x,y:h.y*2-g.destino.y};
  }
  const mov=h.orden==='huir'?1.4:h.orden==='esconder'?.5:1;
  caminar(h, destino, dt, mov * (altura_terreno(h, b.arena) > 8 ? .7 : 1));
  const emboscando=h.orden==='emboscada'&&cerca_g<g.radio+35;
  const disparo=h.objeto?.tipo==='fuego'&&h.objeto.municion>0;
  const alcance=disparo?h.objeto.alcance:g.radio+24;
  if((h.orden==='atacar'||emboscando)&&!pánico&&h.reaccion===0&&h.recarga<=0&&cerca_g<=alcance){
    h.recarga=disparo?1.15:2.4-h.radar.tecnica*.016;
    if(disparo){h.objeto.municion--;registrar(b,'disparo',{hombre:h.id,restante:h.objeto.municion});}
    const bono_estrategia=efecto_vigente(b,'plan')?.15:0;
    const humo=efecto_vigente(b,'humo')?-.12:0;
    const golpe=azar_normalizado(b.azar)<limitar(.2+h.radar.precision*.0075+bono_estrategia+humo,.05,.95);
    if(golpe){
      const apertura=g.fase==='recuperacion'?1.45:1;
      const arma=h.objeto?1+(h.objeto.bono_fuerza_pb||0)/10000:1;
      const cuerdas=b.suministros.some(s=>s.tipo==='cuerdas')?1.12:1;
      const alerta=g.memoria.emboscada?.85:1;
      const danio=(1+h.fuerza_efectiva*.065)*apertura*arma*(disparo?3:1)*(1+h.bono_dano)*(emboscando?1.35*cuerdas*alerta:1);
      const aplicado=Math.min(g.vida,danio);g.vida=Math.max(0,g.vida-aplicado);recompensa(b,aplicado);
    }
    if(emboscando)h.orden='retirar';
  }
}
function danar_hombre(b,h,multiplicador=1) {
  if(!activo(h))return;
  const g=b.gorila;
  const cobertura=b.suministros.some(s=>s.tipo==='barricada'&&distancia(h,s)<80)?0.65:1;
  const furia=g.furia>0?VENTAJAS_GORILA.furia.fuerza:1;
  const impacto=(70+azar_normalizado(b.azar)*55)*g.fuerza*furia*multiplicador*(1-h.proteccion)*cobertura;
  h.vida=Math.max(0,h.vida-impacto);h.miedo=limitar(h.miedo+45,0,100);
  if(h.vida<=0) {
    h.estado=azar_normalizado(b.azar)<.22?'incapacitado':'eliminado';
    registrar(b,'baja',{hombre:h.id,estado:h.estado});
    // Un objeto puede recuperarse del suelo, nunca duplicarse.
    if(h.objeto){b.armas_suelo.push({id:'caida-'+h.id+'-'+Math.round(b.transcurrido*100),objeto:h.objeto,x:h.x,y:h.y,visible:true,recogido_por:null});h.objeto=null;}
    for(const aliado of b.hombres)if(activo(aliado)&&distancia(aliado,h)<95)aliado.miedo=limitar(aliado.miedo+17,0,100);
  } else if(h.vida<h.vida_maxima*.4)h.estado='herido';
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
      if (vuelo.agarre) danar_hombre(b, h, .8);
    }
  }
}

function resolver_ataque(b,activos) {
  const g=b.gorila,radio=g.accion==='rugido'?145:g.accion==='golpe_area'?g.radio+75:g.radio+28;
  for(const h of activos) {
    if(!g.destino||distancia(h,g.destino)>radio)continue;
    if(g.accion==='rugido'){h.miedo=limitar(h.miedo+38,0,100);continue;}
    const factor=g.accion==='golpe_area'?.82:1;
    if (h.vuelo || Math.abs(h.altura - g.altura) > 35) continue;
    if (g.accion === 'embestida') impacto_embestida(b, h);
    else {
      danar_hombre(b, h, factor * (h.orden === 'defender' ? .75 : 1));
      if (g.accion === 'golpe_area') lanzar(b, h, g, 94);
    }
  }
  g.fase='recuperacion';g.reloj=g.vida<g.vida_maxima*.3?.65:1.15;
}
function impacto_embestida(b, h) {
  const g = b.gorila;
  g.impactados ??= new Set();
  if (g.impactados.has(h.id) || !activo(h) || h.vuelo || Math.abs(h.altura - g.altura) > 35) return;
  g.impactados.add(h.id);
  danar_hombre(b, h, h.orden === 'defender' ? .84 : 1.12);
  lanzar(b, h, g, 94);
}

function cooldown(g,nombre,segundos){g.recargas[nombre]=segundos;}
function habilitada(g,nombre){return (g.recargas[nombre]||0)<=0;}
function actualizar_gorila(b,activos,dt) {
  const g=b.gorila;
  for(const key of Object.keys(g.recargas))g.recargas[key]=Math.max(0,g.recargas[key]-dt);
  g.furia=Math.max(0,g.furia-dt);g.reduccion_velocidad=Math.max(0,g.reduccion_velocidad-dt);
  g.energia=limitar(g.energia+(g.fase==='recuperacion'?dt*5:dt*.6),0,100);
  if(g.vida/g.vida_maxima<VENTAJAS_GORILA.furia.umbral_vida&&!g.furia&&habilitada(g,'furia')){
    g.furia=12;cooldown(g,'furia',60);registrar(b,'furia');
  }
  if(g.energia<20&&habilitada(g,'segundo_aliento')&&g.fase!=='aviso'){
    g.energia=Math.min(100,g.energia+20);cooldown(g,'segundo_aliento',90);registrar(b,'segundo_aliento');
  }
  g.reloj-=dt;
  if (g.fase === 'agarre') {
    const h = g.sujeto;
    if (g.reloj <= 0 || !activo(h)) {
      if (activo(h)) {
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
    const ruta = g.destino;
    const recorrido = distancia(g, ruta);
    const lento=g.reduccion_velocidad>0?.6:1;
    const fatiga=g.energia<20?.6:1;
    const furia=g.furia>0?VENTAJAS_GORILA.furia.velocidad:1;
    const paso=Math.min(1,(g.altura > 10 ? 350 : 510)*dt*lento*fatiga*furia/Math.max(recorrido,1));
    g.x += (ruta.x - g.x) * paso;
    g.y += (ruta.y - g.y) * paso;
    actualizar_altura(g, b.arena, dt);
    for (const h of activos) {
      if (distancia(h, g) < g.radio + 10) impacto_embestida(b, h);
    }
    if (paso === 1 || g.reloj <= 0) {
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
      g.reloj = 2;
    } else if (g.accion === 'agarre') {
      if (activo(g.sujeto) && !g.sujeto.vuelo && distancia(g, g.sujeto) < g.radio + 54
        && Math.abs(g.sujeto.altura - g.altura) < 26) {
        g.fase = 'agarre';
        g.reloj = 1.1;
        registrar(b, 'agarre', { hombre: g.sujeto.id });
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
  const señuelo=b.suministros.find(s=>s.tipo==='senuelos');
  const memoria_escondite=Boolean(g.memoria.esconder||g.memoria.emboscada);
  const amenazas=activos.filter(h=>!h.oculto||distancia(h,g)<(memoria_escondite?125:70));
  const distracciones = amenazas.filter(h => h.orden === 'distraer' && cerca(h, g, 145));
  const candidatos = distracciones.length ? distracciones : amenazas.length ? amenazas : activos;
  const objetivo=candidatos.reduce((m,h)=>distancia(h,g)<distancia(m,g)?h:m);
  if(señuelo&&azar_normalizado(b.azar)<.55){
    g.accion='embestida';g.destino={x:señuelo.x,y:señuelo.y};g.fase='aviso';g.reloj=.8;
    señuelo.restante=0;registrar(b,'gorila_distraido');return;
  }
  const d=distancia(g,objetivo),cercanos=activos.filter(h=>cerca(h,g,g.radio+80)).length;
  const táctica=Object.entries(b.tacticas_usadas).sort((a,z)=>z[1]-a[1])[0];
  if(táctica&&táctica[1]>=3)g.memoria[táctica[0]]=true;
  g.ataques++;
  if (d < g.radio + 43 && habilitada(g,'agarre') && !objetivo.vuelo) {
    g.accion = 'agarre';
    g.sujeto = objetivo;
    g.mira_izquierda = objetivo.x < g.x;
    cooldown(g, 'agarre', 12);
  } else if(cercanos>=8&&habilitada(g,'golpe_area')){g.accion='golpe_area';cooldown(g,'golpe_area',35);}
  else if(g.ataques%4===0&&habilitada(g,'rugido')){g.accion='rugido';cooldown(g,'rugido',45);}
  else if(d>185&&habilitada(g,'carga')){g.accion='embestida';cooldown(g,'carga',30);}
  else g.accion=d<g.radio+40?'barrido':'embestida';
  g.destino=g.accion==='embestida'?{x:objetivo.x,y:objetivo.y}:{x:g.x,y:g.y};
  g.fase='aviso';g.reloj=Math.max(.55,1.32-g.nivel*.035);
  g.energia=limitar(g.energia-7,0,100);
  for(const h of activos)h.reaccion=(100-h.radar.agilidad)*.008;
  registrar(b,'ataque_gorila',{accion:g.accion});
}
export function avanzar_batalla(b,dt) {
  if(b.resultado||!Number.isFinite(dt)||dt<=0)return;
  dt=Math.min(dt,.1);
  b.tiempo=Math.max(0,b.tiempo-dt);b.transcurrido+=dt;
  recompensa(b,0,dt);
  for(const e of b.efectos)e.restante-=dt;
  b.efectos=b.efectos.filter(e=>e.restante>0);
  for(const s of b.suministros)s.restante-=dt;
  b.suministros=b.suministros.filter(s=>s.restante>0);
  b.entregas = b.entregas.filter(entrega => {
    if (b.transcurrido - entrega.inicio < duracion_entrega) return true;
    aplicar_suministro(b, entrega);
    return false;
  });
  actualizar_vuelos(b);
  const activos=b.hombres.filter(activo);
  if(!activos.length||b.tiempo===0){b.resultado='Victoria del gorila';return;}
  actualizar_gorila(b,activos,dt);
  let puesto=0;
  for(const h of activos){
    if(!activo(h) || h.vuelo || (b.gorila.fase === 'agarre' && b.gorila.sujeto === h))continue;
    const dispuesto=h.orden==='atacar'&&h.miedo<=12+h.radar.temple*.76;
    actualizar_hombre(b,h,dt,dispuesto?puesto++:undefined);
  }
  const suelo = b.hombres.filter(h => activo(h) && !h.vuelo && !(b.gorila.fase === 'agarre' && b.gorila.sujeto === h));
  separar_personajes(suelo, b.gorila);
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
