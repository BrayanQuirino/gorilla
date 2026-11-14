import test from 'node:test';
import assert from 'node:assert/strict';
import catalogo from './data/objetos.json' with {type:'json'};
import {habilidades,arquetipos,radar_arquetipo,crear_sorteo_objetos,preparar_equipo} from './roster.js';
import {altura_terreno, actualizar_altura} from './terreno.js';
import {ARENAS,TACTICAS,SUMINISTROS,distancia} from './rules.js';
import {crear_batalla,aplicar_plan,avanzar_batalla,comprar_suministro,duracion_entrega,paracaidas_visible,buscar_objeto,paramedicos_disponibles,distribucion_equipo,condiciones_combate,en_furia,reanudar_segunda_vida,danio_humano,en_cono_embestida,en_cono_golpe_area,objetivo_exploracion,objetivo_distraccion,desviar_peatones,conducta_gorila} from './battle.js';

function rng(seed=42){return ()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};}
function partida(arena='hangar'){
  const azar=rng();
  const equipo=preparar_equipo(crear_sorteo_objetos(catalogo),catalogo,arena,azar);
  return {equipo,batalla:crear_batalla(equipo.hombres,1,azar,equipo)};
}
test('se conservan 100 hombres adultos con arquetipos clásicos y ocho habilidades',()=>{
  const {equipo}=partida();
  assert.equal(equipo.hombres.length,100);
  assert.equal(habilidades.length,8);
  assert.ok(equipo.hombres.every(h=>!Object.hasOwn(h,'edad')));
  assert.ok(equipo.hombres.every(h=>arquetipos.includes(h.arquetipo)));
  assert.ok(arquetipos.every(nombre=>equipo.hombres.some(h=>h.arquetipo===nombre)));
});
test('inventario inicial y reserva de arena comparten presupuesto sin duplicarlo',()=>{
  for(const id of Object.keys(ARENAS)){
    const {equipo}=partida(id);
    assert.equal(equipo.resumen.armados+equipo.resumen.desarmados,100);
    assert.equal(equipo.resumen.armas_arena,equipo.armas_suelo.length);
    assert.ok(equipo.resumen.armados+equipo.resumen.armas_arena<=100);
    assert.ok(equipo.hombres.some(h=>h.objeto===null));
    assert.ok(equipo.armas_suelo.every(o=>ARENAS[id].categorias.includes(o.objeto.categoria)||(id==='hangar'&&o.objeto.categoria==='armas_fuego')));
  }
});
test('el plan reparte seis acciones y asigna la búsqueda a los más alejados',()=>{
  const {batalla}=partida();
  const caido=batalla.hombres.at(-1);
  caido.estado='incapacitado';
  assert.ok(Object.hasOwn(TACTICAS,'buscar_armas'));
  assert.equal(aplicar_plan(batalla,{atacar:50,buscar_armas:10,huir:40}),true);
  assert.deepEqual(batalla.plan,{atacar:50,buscar_armas:10,huir:40});
  const esperados = batalla.hombres.slice(0, -1).sort((a, b) => distancia(b, batalla.gorila) - distancia(a, batalla.gorila)).slice(0, 10);
  const buscadores = batalla.hombres.filter(h => h.orden === 'buscar_armas');
  assert.equal(buscadores.length, 10);
  assert.ok(buscadores.every(h => esperados.includes(h)));
  assert.equal(batalla.hombres.filter(h => h.orden === 'atacar').length, 50);
  assert.equal(batalla.hombres.filter(h => h.orden === 'huir').length, 40);
  assert.equal(batalla.hombres.filter(h => h.orden === 'guardia').length, 0);
  const medicos=paramedicos_disponibles(batalla);
  assert.ok(medicos>0);
  assert.equal(aplicar_plan(batalla, {atacar:35,buscar_armas:15,huir:20,esconder:15,distraer:15,rescatar:medicos}),true);
  assert.equal(Object.keys(batalla.plan).length,6);
  assert.equal(batalla.hombres.filter(h=>h.orden==='rescatar').length,medicos);
  assert.ok(batalla.hombres.filter(h=>h.orden==='rescatar').every(h=>h.arquetipo==='Paramédico'));
  assert.equal(aplicar_plan(batalla,{atacar:100,rescatar:medicos+1}),false);
  assert.equal(batalla.hombres.filter(h=>h.estado!=='incapacitado'&&h.orden==='guardia').length,0);
  assert.equal(aplicar_plan(batalla, { atacar: 96, buscar_armas: 5 }), false);
  assert.equal(aplicar_plan(batalla, { atacar: 80, huir: 10 }), false);
  for (const orden of ['defender', 'emboscada', 'mantener', 'retirar']) assert.equal(aplicar_plan(batalla, { [orden]: 100 }), false);
  assert.equal(caido.orden,'atacar');
  assert.equal(aplicar_plan(batalla,{mover:100}),false);
});
test('el combate avanza y el gorila actúa automáticamente',()=>{
  const {batalla}=partida();
  assert.equal(batalla.plan.atacar,100);
  for(let i=0;i<900&&!batalla.resultado;i++)avanzar_batalla(batalla,1/30);
  assert.ok(batalla.transcurrido>0);
  assert.ok(batalla.eventos.some(e=>e.tipo==='ataque_gorila'));
  assert.ok(batalla.bananas>=0);
});
test('las compras descuentan bananas, respetan saldo y no reviven eliminados',()=>{
  const {batalla}=partida();
  batalla.bananas=100;
  assert.equal(comprar_suministro(batalla,'energizante'),true);
  assert.equal(batalla.bananas,70);
  assert.equal(comprar_suministro(batalla,'red'),false);
  assert.equal(batalla.bananas,70);
  assert.equal(SUMINISTROS.botiquin.costo,45);
});
test('buscar armas las recoge del suelo sin clonar el objeto',()=>{
  const {batalla}=partida();
  const hombre=[...batalla.hombres].sort((a,b)=>distancia(b,batalla.gorila)-distancia(a,batalla.gorila))[0];
  hombre.objeto=null;
  const colocada=batalla.armas_suelo[0];
  colocada.x=hombre.x;colocada.y=hombre.y;colocada.visible=true;
  aplicar_plan(batalla,{buscar_armas:10,atacar:90});
  avanzar_batalla(batalla,.033);
  assert.ok(batalla.armas_suelo.some(a=>a.recogido_por));
});

test('las pistolas del hangar usan munición finita y no alteran el catálogo original',()=>{
  const arma={id:'hangar_pistola_prueba',nombre:'Pistola',categoria:'armas_fuego',tipo:'fuego',municion:2,alcance:260,bono_fuerza_pb:0,penalizacion_velocidad_pb:0};
  assert.equal(catalogo.objetos.length,1000);
  const {batalla}=partida('hangar');
  const h=batalla.hombres[0];h.objeto=arma;h.orden='atacar';h.x=batalla.gorila.x-100;h.y=batalla.gorila.y;
  h.miedo=0;h.recarga=0;
  for(let i=0;i<150&&arma.municion>0;i++)avanzar_batalla(batalla,.033);
  assert.ok(arma.municion>=0&&arma.municion<2);
});

test('humanos evitan alturas de montaña; gorila conserva elevaciones y caída',()=>{
  for(const arena of Object.keys(ARENAS)){
    const {batalla}=partida(arena);
    assert.equal(new Set(batalla.hombres.map(h=>h.x+','+h.y)).size,100);
    for (let paso=0;paso<180;paso++) {
      avanzar_batalla(batalla,1/60);
      // Only the gorilla may climb mountains. Humans stay on walkable ground.
      for (const h of batalla.hombres.filter(h=>h.vida>0&&!h.vuelo)) {
        if (batalla.gorila.sujeto!==h) assert.ok(h.altura <= 1);
      }
      assert.ok(batalla.gorila.altura >= altura_terreno(batalla.gorila,arena) - .01);
    }
  }
  const personaje={x:454,y:292,altura:0};
  actualizar_altura(personaje,'claro',.1);
  assert.ok(personaje.altura>25);
  personaje.x=30;
  actualizar_altura(personaje,'claro',.1);
  assert.ok(personaje.altura>0);
  for(let i=0;i<10;i++) actualizar_altura(personaje,'claro',.1);
  assert.equal(personaje.altura,0);
});

test('un suministro aterriza fuera de los obstáculos y se aplica una sola vez',()=>{
  for (const arena of Object.keys(ARENAS)) {
    const {batalla}=partida(arena);
    aplicar_plan(batalla,{atacar:100});
    batalla.gorila.reloj=100;
    batalla.bananas=90;
    const hombre=batalla.hombres[0];
    hombre.vida=1;
    assert.equal(comprar_suministro(batalla,'botiquin'),true);
    assert.equal(batalla.bananas,45);
    assert.equal(altura_terreno(batalla.entregas[0],arena),0);
    assert.equal(hombre.vida,1);
    for(let i=0;i<Math.ceil(duracion_entrega/.05)+2;i++) avanzar_batalla(batalla,.05);
    // A nearby collector may already have reached the package during landing.
    assert.ok(hombre.vida===1||hombre.vida===26);
    assert.equal(batalla.entregas.length,0);
    const paquete=batalla.suministros.find(p=>p.tipo==='paquete');
    if(paquete&&!paquete.recogido) {
      const recolector=batalla.hombres.find(h=>h.id===paquete.recolector);
      recolector.x=paquete.x;recolector.y=paquete.y;
      avanzar_batalla(batalla,.05);
    }
    // A collector already standing on the drop point can pick it up immediately.
    assert.ok(!paquete||paquete.recogido);
    assert.equal(batalla.eventos.filter(e=>e.tipo==='paquete_entregado').length,1);
    assert.equal(batalla.eventos.filter(e=>e.tipo==='suministro_recogido').length,1);
    assert.equal(batalla.parpadeos.length, 1);
    assert.deepEqual([.08,.24,.40,.56,.72,.88].map(t => paracaidas_visible(t, 0)),
      [false,true,false,true,false,true]);
    for (let i=0;i<22;i++) avanzar_batalla(batalla,.05);
    assert.equal(batalla.parpadeos.length,0);
  }
});

test('el agarre retiene al hombre y lo lanza en arco; la embestida proyecta a los impactados',()=>{
  const {batalla}=partida('claro');
  aplicar_plan(batalla,{atacar:100});
  const g=batalla.gorila;
  const h=batalla.hombres[0];
  Object.assign(g,{x:520,y:440,altura:0,fase:'aviso',accion:'agarre',reloj:0,sujeto:h,mira_izquierda:false});
  Object.assign(h,{x:550,y:440,altura:0});
  avanzar_batalla(batalla,.05);
  assert.equal(g.fase,'agarre');
  assert.ok(h.altura>g.altura);
  for(let i=0;i<65;i++) avanzar_batalla(batalla,.05);
  assert.ok(h.vuelo?.agarre);
  assert.ok(h.altura>35);
  for(let i=0;i<20;i++) avanzar_batalla(batalla,.05);
  assert.equal(h.vuelo,undefined);
  assert.ok(h.vida <= h.vida_maxima * .08 + .001);
  const segundo=batalla.hombres[1];
  Object.assign(g,{fase:'embestida',accion:'embestida',reloj:1,destino:{x:520,y:440}});
  Object.assign(segundo,{x:550,y:440,altura:g.altura});
  avanzar_batalla(batalla,.05);
  assert.ok(segundo.vuelo);
});

test('fuerza y valentía amortiguan la lesión e inteligencia descubre objetos ocultos', () => {
  const { batalla } = partida('claro');
  const hombre = batalla.hombres[0];
  hombre.objeto = null;
  hombre.vida = hombre.vida_maxima / 2;
  const debil = { ...hombre, valentia: 40, radar: { ...hombre.radar, fuerza: 20, inteligencia: 0 } };
  const fuerte = { ...debil, radar: { ...debil.radar, fuerza: 90, inteligencia: 100 } };
  assert.ok(condiciones_combate(fuerte).velocidad > condiciones_combate(debil).velocidad);
  assert.ok(condiciones_combate(fuerte).potencia > condiciones_combate(debil).potencia);
  assert.ok(condiciones_combate({ ...fuerte, valentia: 85 }).potencia > condiciones_combate(fuerte).potencia);
  const objeto = { id: 'oculto', x: hombre.x + 150, y: hombre.y, visible: false, objeto: { tipo: 'improvisado' } };
  batalla.armas_suelo = [objeto];
  assert.equal(buscar_objeto(batalla, debil), null);
  assert.equal(buscar_objeto(batalla, fuerte), objeto);
});

test('los ataques tienen recarga, consumen energía y dejan espacio para recuperarla', () => {
  const { batalla } = partida('claro');
  const h = batalla.hombres[0];
  batalla.hombres = [h];
  const g = batalla.gorila;
  Object.assign(g, { x: 620, y: 425, altura: 0, reloj: 100 });
  Object.assign(h, { x: 650, y: 425, altura: 0, energia: 70, objeto: null });
  batalla.azar = () => 0;
  avanzar_batalla(batalla,.05);
  const vida = g.vida;
  const energia = h.energia;
  assert.ok(vida < g.vida_maxima);
  assert.ok(h.recarga > 3);
  for (let i=0;i<20;i++) avanzar_batalla(batalla,.05);
  assert.equal(g.vida,vida);
  assert.ok(h.energia > energia);
});

test('el gorila se repliega si lo rodean y persigue a un combatiente aislado', () => {
  const { batalla } = partida('claro');
  const g = batalla.gorila;
  batalla.hombres = batalla.hombres.slice(0, 6);
  aplicar_plan(batalla, {});
  Object.assign(g, { x: 600, y: 400, altura: 0, reloj: 0, recargas: { rugido: 10 } });
  for (let i = 0; i < 6; i++) Object.assign(batalla.hombres[i], {
    x: 600 + Math.cos(i * Math.PI / 3) * 70, y: 400 + Math.sin(i * Math.PI / 3) * 70, altura: 0,
  });
  avanzar_batalla(batalla, .05);
  assert.equal(g.fase, 'repliegue');
  avanzar_batalla(batalla, .05);
  assert.ok(g.movimiento > 0);

  batalla.hombres = batalla.hombres.slice(0, 1);
  Object.assign(batalla.hombres[0], { x: 690, y: 400, altura: 0 });
  Object.assign(g, { x: 600, y: 400, altura: 0, reloj: 0, fase: 'espera' });
  avanzar_batalla(batalla, .05);
  assert.equal(g.fase, 'persecucion');
  assert.equal(g.objetivo, batalla.hombres[0]);
  avanzar_batalla(batalla, .05);
  assert.ok(g.x > 600);
  g.recargas.agarre = 99;
  batalla.hombres[0].x = g.x + 28;
  avanzar_batalla(batalla, .05);
  assert.equal(g.fase, 'agarre');
  assert.equal(g.recargas.agarre, 3);
});

test('el golpe del gorila hiere con caída de daño dentro del radio', () => {
  const { batalla } = partida('claro');
  const [cerca, lejos, fuera] = batalla.hombres;
  batalla.hombres = [cerca, lejos, fuera];
  aplicar_plan(batalla, {});
  const g = batalla.gorila;
  Object.assign(g, { x: 610, y: 450, altura: 0, fase: 'aviso', accion: 'golpe_area',
    reloj: 0, destino: { x: 610, y: 450 } });
  for (const [h, x] of [[cerca, 646], [lejos, 697], [fuera, 800]]) {
    Object.assign(h, { x, y: 450, altura: 0, vida: 65, vida_maxima: 65 });
  }
  batalla.azar = () => .7;
  avanzar_batalla(batalla, .05);
  assert.equal(cerca.estado, 'herido');
  assert.ok(cerca.vida < lejos.vida);
  assert.equal(fuera.vida, 65);
});

test('segunda vida pausa el reloj y vuelve con furia permanente una sola vez', () => {
  const { batalla } = partida('claro');
  const g = batalla.gorila;
  g.vida = 20;
  avanzar_batalla(batalla, .05);
  assert.equal(g.segunda_vida, 'anuncio');
  const tiempo = batalla.tiempo;
  avanzar_batalla(batalla, .1);
  assert.equal(batalla.tiempo, tiempo);
  assert.equal(reanudar_segunda_vida(batalla), true);
  assert.ok(Math.abs(g.vida-(20+g.vida_maxima*.15))<.0001);
  g.furia = 0;
  assert.equal(en_furia(g), true);
  assert.equal(reanudar_segunda_vida(batalla), false);
  g.vida = 0;
  avanzar_batalla(batalla, .05);
  assert.equal(batalla.resultado, 'Victoria de los hombres');
});

test('la embestida requiere once hombres y el golpe de área anuncia y recarga más rápido', () => {
  for (const [cantidad, accion, espera, recarga] of [[10, 'golpe_area', .35, 3], [11, 'embestida', 1.18, 5]]) {
    const { batalla } = partida('claro');
    batalla.hombres = batalla.hombres.slice(0, cantidad);
    aplicar_plan(batalla, {});
    const g = batalla.gorila;
    Object.assign(g, { x: 610, y: 450, altura: 0, reloj: 0, nivel: 4 });
    for (const h of batalla.hombres) Object.assign(h, { x: 650, y: 450, altura: 0 });
    avanzar_batalla(batalla, .05);
    assert.equal(g.accion, accion);
    assert.ok(Math.abs(g.reloj - espera) < .001);
    assert.equal(g.recargas[accion === 'embestida' ? 'carga' : accion], recarga);
  }
});

test('contacto sin ataque empuja pero nunca daña', () => {
  const { batalla } = partida('claro');
  batalla.hombres = batalla.hombres.slice(0, 1);
  aplicar_plan(batalla, {});
  const [h] = batalla.hombres;
  const g = batalla.gorila;
  Object.assign(g, { x: 610, y: 450, altura: 0, reloj: 100 });
  Object.assign(h, { x: 630, y: 450, altura: 0 });
  avanzar_batalla(batalla, .05);
  assert.equal(h.vida,h.vida_maxima,'el contacto sin ataque no reduce la vida');
  const vida = h.vida;
  h.x = 630;
  avanzar_batalla(batalla, .05);
  assert.equal(h.vida, vida);
});

test('arquetipos modifican potencia y velocidad sin depender de edad',()=>{
  const {batalla}=partida('claro');
  const musculo=batalla.hombres.find(h=>h.arquetipo==='Musculoso');
  const oficinista=batalla.hombres.find(h=>h.arquetipo==='Oficinista');
  assert.ok(musculo&&oficinista);
  assert.ok(radar_arquetipo.Musculoso.fuerza>radar_arquetipo.Oficinista.fuerza);
  assert.ok(musculo.fuerza_efectiva>0&&oficinista.velocidad_efectiva>0);
  assert.ok(batalla.hombres.every(h=>!('edad' in h)));
});

test('tienda aprobada: 13 artículos y compras sin reservas de refuerzos',()=>{
  const {batalla}=partida();
  assert.equal(Object.keys(SUMINISTROS).length,14);
  for(const id of ['trampa','senuelos','camuflaje','humo','radio','plan_maestro','bananas_extra'])
    assert.equal(Object.hasOwn(SUMINISTROS,id),false);
  batalla.bananas=600;
  assert.equal(comprar_suministro(batalla,'refuerzos'),true);
  assert.equal(comprar_suministro(batalla,'refuerzos'),true);
  assert.equal(batalla.bananas,300);
});

test('un paquete conserva su existencia hasta que un humano lo recoge',()=>{
  const {batalla}=partida();
  batalla.bananas=400;
  assert.equal(comprar_suministro(batalla,'cascos'),true);
  const entrega=batalla.entregas[0];
  entrega.inicio=-10;
  avanzar_batalla(batalla,.016);
  const paquete=batalla.suministros.find(s=>s.tipo==='paquete');
  assert.ok(paquete);
  assert.equal(paquete.recolector,
    [...batalla.hombres].filter(h=>h.vida>0&&h.estado!=='incapacitado').sort((a,b)=>distancia(a,paquete)-distancia(b,paquete))[0].id);
  // No expiry while the collector is walking from across the arena.
  for(let i=0;i<150&&!batalla.resultado;i++)avanzar_batalla(batalla,.016);
  assert.ok(batalla.eventos.filter(e=>e.tipo==='suministro_recogido').length<=1);
});

test('medicos asignados reducen el porcentaje real del equipo disponible para atacar',()=>{
  const {batalla}=partida('claro');
  for(let i=0;i<batalla.hombres.length;i++){
    const h=batalla.hombres[i];
    h.arquetipo=i<4?'Paramédico':'Oficinista';
    if(i>=92){h.estado='eliminado';h.vida=0;}
  }
  assert.equal(paramedicos_disponibles(batalla),4);
  assert.equal(aplicar_plan(batalla,{atacar:100,rescatar:4}),true);
  const reparto=distribucion_equipo(batalla);
  assert.equal(reparto.total,92);
  assert.equal(reparto.medicos,4);
  assert.equal(reparto.cuotas.atacar,88);
  assert.ok(Math.abs(reparto.porcentaje('atacar')-88/92*100)<.00001);
  assert.ok(reparto.porcentaje('atacar')<100);
  assert.equal(batalla.hombres.filter(h=>h.orden==='rescatar'&&h.vida>0).length,4);
});

test('embestida: cono frontal exacto de 90 grados',()=>{
  const g={x:500,y:350,direccion_embestida:{x:1,y:0}};
  assert.equal(en_cono_embestida(g,{x:600,y:350}),true);
  assert.equal(en_cono_embestida(g,{x:600,y:450}),true,'45 grados a la derecha');
  assert.equal(en_cono_embestida(g,{x:600,y:250}),true,'45 grados a la izquierda');
  assert.equal(en_cono_embestida(g,{x:590,y:460}),false,'fuera por 5-10 grados');
  assert.equal(en_cono_embestida(g,{x:500,y:450}),false,'costado');
  assert.equal(en_cono_embestida(g,{x:400,y:350}),false,'detrás');
  g.direccion_embestida={x:0,y:-1};
  assert.equal(en_cono_embestida(g,{x:500,y:200}),true,'carga hacia arriba');
  assert.equal(en_cono_embestida(g,{x:500,y:500}),false,'detrás de la carga');
});

test('balance: vida humana y daño del portador más eficiencia limitada del objeto',()=>{
 const {batalla}=partida('claro');const h=batalla.hombres.find(p=>p.arquetipo==='Oficinista');
 assert.equal(h.vida_maxima,18);
 h.objeto=null;assert.equal(danio_humano(h,false,1,0),.010*Math.min(1,condiciones_combate(h).potencia));
 const sin=danio_humano(h,false,1,0);
 h.objeto={nombre:'Zapato',dano_maximo:.001,modo_uso:'empunable'};
 assert.ok(danio_humano(h,false,1,0)>sin);
 h.objeto={nombre:'Bate',dano_maximo:.025,modo_uso:'empunable'};
 assert.ok(danio_humano(h,false,1,0)>sin);
 const arma={nombre:'Escopeta',tipo:'fuego',dano_maximo:230,municion:1,modo_uso:'disparo'};
 h.objeto=arma;
 assert.ok(danio_humano(h,true,1,0)>50);
 assert.ok(danio_humano(h,true,1,0)<=230);
});
test('los 1000 objetos tienen nivel, daño, durabilidad, modo y peso independientes',()=>{
 assert.equal(catalogo.objetos.length,1000);
 assert.ok(catalogo.objetos.every(o=>o.nivel>=1&&o.nivel<=5&&o.dano_maximo>=0&&o.modo_uso));
 assert.equal(catalogo.reglas.probabilidad_nivel['5'],.0001);
 assert.equal(catalogo.objetos.find(o=>o.nombre==='Zapato').dano_maximo,.001);
 assert.equal(catalogo.objetos.find(o=>o.nombre==='Bate').dano_maximo,.025);
 assert.equal(catalogo.objetos.find(o=>o.nombre==='Escopeta').dano_maximo,230);
 assert.ok(catalogo.objetos.filter(o=>o.tipo==='fuego').every(o=>o.municion===1));
});
test('suministros incluyen munición para cinco armas y reserva',()=>{
 assert.equal(SUMINISTROS.municion.balas,5);
 const {batalla}=partida('claro');
 batalla.bananas=60;assert.equal(comprar_suministro(batalla,'municion'),true);
});

test('búsqueda independiente recorre sectores en dos dimensiones',()=>{
  const {batalla}=partida('claro');
  const hombres=batalla.hombres.slice(0,12);
  batalla.hombres=hombres;
  for(const h of hombres)h.orden='buscar_armas';
  const metas=hombres.map(h=>objetivo_exploracion(batalla,h,.033));
  assert.ok(new Set(metas.map(p=>Math.round(p.x/15))).size>2,'exploran diferentes columnas');
  assert.ok(new Set(metas.map(p=>Math.round(p.y/15))).size>2,'exploran diferentes filas');
  const primero=hombres[0];
  const anterior=primero.exploracion.celda;
  Object.assign(primero,{x:metas[0].x,y:metas[0].y});
  objetivo_exploracion(batalla,primero,.033);
  assert.equal(primero.exploracion.visitas[anterior],1);
  assert.notEqual(primero.exploracion.celda,anterior);
});

test('los exploradores giran para evitar a un compañero frontal',()=>{
  const h={id:1,x:200,y:200};
  const destino={x:500,y:200};
  const vecino={id:2,x:228,y:202,vida:100,estado:'normal'};
  const desvio=desviar_peatones(h,destino,[h,vecino],'hangar');
  assert.notEqual(desvio.y,200,'se aparta de la trayectoria');
  assert.ok(desvio.x>h.x,'mantiene avance');
});

test('el gorila se libera de una zona muerta y persigue humanos ocultos',()=>{
  const {batalla}=partida('hangar');
  const g=batalla.gorila;
  g.fase='espera';g.reloj=100;
  for(const h of batalla.hombres){h.orden='esconder';h.oculto=true;}
  const x=g.x,y=g.y;
  for(let i=0;i<170&&!batalla.resultado;i++)avanzar_batalla(batalla,1/30);
  assert.ok(Math.hypot(g.x-x,g.y-y)>25,'no permanece inmóvil');
  assert.ok(['persecucion','repliegue','embestida','aviso','recuperacion','agarre','espera'].includes(g.fase));
});

test('100 buscadores atraviesan cada arena sin quedar bloqueados en conjunto',()=>{
  for(const arena of Object.keys(ARENAS)){
    const {batalla}=partida(arena);
    // Even without free inventory, the team must really search sectors.
    batalla.armas_suelo=[];
    assert.equal(aplicar_plan(batalla,{buscar_armas:100}),true);
    const inicial=batalla.hombres.map(h=>({x:h.x,y:h.y}));
    const gorila={x:batalla.gorila.x,y:batalla.gorila.y};
    for(let i=0;i<330&&!batalla.resultado;i++) avanzar_batalla(batalla,1/30);
    const avanzaron=batalla.hombres.filter((h,i)=>
      Math.hypot(h.x-inicial[i].x,h.y-inicial[i].y)>35).length;
    const zonas=new Set(batalla.hombres.map(h=>h.exploracion?.celda).filter(n=>n!==undefined));
    assert.ok(avanzaron>=60,arena+': más de la mitad deben desplazarse realmente; se movieron '+avanzaron);
    assert.ok(zonas.size>=6,arena+': distribuir rutas por diferentes sectores; encontrados '+zonas.size);
    assert.ok(Math.hypot(batalla.gorila.x-gorila.x,batalla.gorila.y-gorila.y)>25,arena+': gorila activo');
  }
});

test('distractores reciben puntos fijos separados, no órbitas recalculadas',()=>{
  const {batalla}=partida('claro');
  batalla.hombres.forEach(h=>h.orden='distraer');
  const hombres=batalla.hombres.slice(0,30);
  const metas=hombres.map(h=>objetivo_distraccion(batalla,h,.033));
  const coordenadas=new Set(metas.map(p=>Math.round(p.x/10)+','+Math.round(p.y/10)));
  assert.ok(coordenadas.size>=8,'los puestos no están concentrados en una misma celda');
  const h=hombres[0],meta={...metas[0]};
  for(let i=0;i<90;i++){
    h.x+=.12;h.y+=.1;
    const siguiente=objetivo_distraccion(batalla,h,.033);
    assert.ok(distancia(meta,siguiente)<.01,'no debe cambiar el objetivo cada fotograma');
  }
});
test('mezcla de búsqueda y distracción mueve la mayoría de los 100 combatientes',()=>{
 for(const arena of Object.keys(ARENAS)){
  const {batalla}=partida(arena);
  batalla.armas_suelo=[];
  assert.equal(aplicar_plan(batalla,{buscar_armas:50,distraer:50}),true);
  const inicio=batalla.hombres.map(h=>({x:h.x,y:h.y}));
  for(let i=0;i<270&&!batalla.resultado;i++)avanzar_batalla(batalla,1/30);
  const movidos=batalla.hombres.filter((h,i)=>distancia(h,inicio[i])>35).length;
  assert.ok(movidos>=50,arena+': demasiado atasco entre distractores y buscadores: '+movidos);
 }
});

test('golpe frontal limita a 45 grados y un máximo de tres víctimas',()=>{
 const {batalla}=partida('claro');
 const g=batalla.gorila;
 Object.assign(g,{x:600,y:400,altura:0,fase:'aviso',accion:'golpe_area',reloj:0,
   direccion_golpe_area:{x:1,y:0}});
 const objetivos=batalla.hombres.slice(0,6);
 batalla.hombres=objetivos;
 for(let i=0;i<6;i++){
   const h=objetivos[i];
   Object.assign(h,{x:630+i*4,y:i<4?400:460,altura:0,
     vida:100,vida_maxima:100,orden:'huir',proteccion:0,defensa:0});
 }
 assert.equal(en_cono_golpe_area(g,{x:640,y:400}),true);
 assert.equal(en_cono_golpe_area(g,{x:640,y:440}),false);
 assert.equal(en_cono_golpe_area(g,{x:560,y:400}),false);
 avanzar_batalla(batalla,.05);
 const golpeados=objetivos.filter(h=>h.vida<100);
 assert.ok(golpeados.length<=3,'jamás más de tres víctimas');
 assert.ok(golpeados.length>=1,'al menos un objetivo frontal');
 assert.ok(objetivos.slice(4).every(h=>h.vida===100),'sin daño fuera del cono');
});
test('rugido solo reduce valentía: no PV ni miedo',()=>{
 const {batalla}=partida('claro'),g=batalla.gorila;
 const h=batalla.hombres[0];
 batalla.hombres=[h];
 Object.assign(g,{x:600,y:400,altura:0,fase:'aviso',accion:'rugido',reloj:0});
 Object.assign(h,{x:630,y:400,altura:0,vida:h.vida_maxima,valentia:95,miedo:0,orden:'huir'});
 const antes=h.vida;
 avanzar_batalla(batalla,.05);
 assert.equal(h.vida,antes);
 assert.equal(h.miedo,0);
 assert.ok(h.valentia<90,'rugido redujo valentía');
 assert.ok(h.rugido_hasta>batalla.transcurrido);
});
