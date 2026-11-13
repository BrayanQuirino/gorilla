import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import catalogo from './data/objetos.json';
import { crear_sorteo_objetos, preparar_equipo, habilidades, arquetipos } from './roster.js';
import { alto, ancho, avanzar_batalla, crear_batalla, activo, aplicar_plan, comprar_suministro, dificultades, duracion_segunda_vida, reanudar_segunda_vida, en_furia } from './battle.js';
import { crear_dibujante } from './arena.js';
import { crear_dibujante_3d } from './arena3d.js';
import { ARENAS, TACTICAS, SUMINISTROS } from './rules.js';
import retrato_furia from './art/gorila-segunda-vida.webp';
import { crear_audio_arcade } from './audio.js';
import './style.css';

const sortear_objeto = crear_sorteo_objetos(catalogo);
const etiquetas = ['Fuerza','Velocidad','Inteligencia','Temple','Precisión','Agilidad','Estrategia','Técnica'];
function partida(nivel=0,arena='claro') {
 const equipo=preparar_equipo(sortear_objeto,catalogo,arena);
 return crear_batalla(equipo.hombres,nivel,Math.random,equipo);
}

function punto(indice, radio) {
  const angulo = indice * Math.PI * 2 / habilidades.length - Math.PI / 2;
  return [145 + radio * Math.cos(angulo), 104 + radio * Math.sin(angulo)];
}

function poligono(radios) {
  return radios.map((radio, indice) => punto(indice, radio).join(',')).join(' ');
}

function Radar({ radar }) {
  return <svg className="radar" viewBox="0 0 290 210" role="img"
    aria-label={etiquetas.map((etiqueta, indice) => `${etiqueta} ${formato.format(radar[habilidades[indice]])}`).join(', ')}>
    {[18, 36, 54, 72].map(radio => <polygon key={radio} points={poligono(Array(habilidades.length).fill(radio))}
      fill="none" stroke="#456354" />)}
    {habilidades.map((eje, indice) => {
      const [x, y] = punto(indice, 72);
      const [lx, ly] = punto(indice, 86);
      return <g key={eje}>
        <line x1="145" y1="104" x2={x} y2={y} stroke="#456354" />
        <text x={lx} y={ly} textAnchor={lx > 154 ? 'start' : lx < 136 ? 'end' : 'middle'}
          dominantBaseline="middle">{etiquetas[indice]}</text>
      </g>;
    })}
    <polygon points={poligono(habilidades.map(eje => radar[eje] * .72))}
      fill="#acdd7960" stroke="#b5e880" strokeWidth="2" />
  </svg>;
}

const formato = new Intl.NumberFormat('es-MX', { maximumFractionDigits: 2 });


function Segmento({ titulo, grupos }) {
  const total=grupos.reduce((acc,g)=>acc+g.valor,0)||1;
  return <section className="estadistica-visual">
    <h3>{titulo}</h3>
    <div className="barra-segmentos" role="img" aria-label={grupos.map(g=>g.nombre+': '+g.valor).join(', ')}>
      {grupos.filter(g=>g.valor>0).map(g=><div key={g.nombre} title={g.nombre+': '+g.valor}
        style={{width:(100*g.valor/total)+'%',background:g.color}} />)}
    </div>
    <div className="leyenda">{grupos.map(g=><span key={g.nombre}><i style={{background:g.color}} />{g.nombre} <b>{g.valor}</b></span>)}</div>
  </section>;
}
function Indicador({titulo,valor,icono}) {
  return <div className="indicador"><span aria-hidden="true">{icono}</span><strong>{formato.format(valor)}</strong><small>{titulo}</small></div>;
}
function PanelEquipo({batalla,onAbrir,seleccionInicial=null}) {
  const [seleccion,cambiar_seleccion]=useState(seleccionInicial);
  const vivos=batalla.hombres.filter(activo),total=batalla.hombres.length;
  const media=personas=>Object.fromEntries(habilidades.map(eje=>[eje,personas.length
    ? personas.reduce((sum,h)=>sum+h.radar[eje],0)/personas.length:0]));
  const promedio=media(vivos);
  const equipados=vivos.filter(h=>h.objeto).length;
  const lesionados=vivos.filter(h=>h.estado==='herido').length;
  const incapacitados=batalla.hombres.filter(h=>h.estado==='incapacitado').length;
  const eliminados=batalla.hombres.filter(h=>h.estado==='eliminado').length;
  const valentia=vivos.length?Math.round(vivos.reduce((s,h)=>s+h.valentia,0)/vivos.length):0;
  const grupos=arquetipos.map((nombre,i)=>({
    nombre,color:['#79d6bc','#efcb73','#a99de7','#f09783','#75b8ec'][i%5],
    hombres:batalla.hombres.filter(h=>h.arquetipo===nombre)
  })).filter(g=>g.hombres.length);
  const grupo=grupos.find(g=>g.nombre===seleccion);
  const miembros=grupo?.hombres||[],activos_grupo=miembros.filter(activo);
  const heridos_grupo=miembros.filter(h=>h.estado==='herido').length;
  const incap_grupo=miembros.filter(h=>h.estado==='incapacitado').length;
  const bajas_grupo=miembros.filter(h=>h.estado==='eliminado').length;
  const armados_grupo=miembros.filter(h=>h.objeto&&activo(h)).length;
  return <aside className="panel-equipo" aria-label="Estadísticas gráficas del equipo">
    <div className="panel-titulo"><h2>{grupo?grupo.nombre:'Resumen del equipo'}</h2>
      {grupo?<button onClick={()=>cambiar_seleccion(null)} aria-label="Volver a todos los arquetipos">← Todos</button>
        :<span>{vivos.length} / {total} activos</span>}</div>
    {grupo?<>
      <div className="indicadores">
        <Indicador titulo="Total" valor={miembros.length} icono="👥"/>
        <Indicador titulo="Con objetos" valor={armados_grupo} icono="🧰"/>
        <Indicador titulo="Heridos" valor={heridos_grupo} icono="🩹"/>
        <Indicador titulo="Eliminados" valor={bajas_grupo} icono="⚑"/>
      </div>
      <Segmento titulo="Estado" grupos={[
        {nombre:'Sanos',valor:Math.max(0,activos_grupo.length-heridos_grupo),color:'#76d59b'},
        {nombre:'Heridos',valor:heridos_grupo,color:'#efb95a'},
        {nombre:'Incapacitados',valor:incap_grupo,color:'#e68f64'},
        {nombre:'Eliminados',valor:bajas_grupo,color:'#b9606b'}
      ]}/>
      <Segmento titulo="Equipamiento de combatientes activos" grupos={[
        {nombre:'Con objetos',valor:armados_grupo,color:'#89d8e3'},
        {nombre:'Sin objetos',valor:activos_grupo.length-armados_grupo,color:'#6b7a85'}
      ]}/>
      <div className="equipo-radar"><h3>Habilidades de {grupo.nombre}</h3>
        <Radar radar={media(miembros)}/></div>
      <div className="atributos-graficos">
        {habilidades.map((eje,i)=><div key={eje}><span>{etiquetas[i]}</span>
          <progress value={media(miembros)[eje]} max="100"/><strong>{Math.round(media(miembros)[eje])}</strong></div>)}
      </div>
      <div className="comparativa-perfil">
        <span>Daño potencial</span><strong>{Math.round(media(miembros).fuerza*.72+media(miembros).tecnica*.28)}/100</strong>
        <span>Velocidad</span><strong>{Math.round(media(miembros).velocidad)}/100</strong>
      </div>
    </>:<>
      <div className="indicadores">
        <Indicador titulo="Activos" valor={vivos.length} icono="👥"/>
        <Indicador titulo="Equipados" valor={equipados} icono="🧰"/>
        <Indicador titulo="Valentía %" valor={valentia} icono="⚡"/>
        <Indicador titulo="Objetos en arena" valor={batalla.armas_suelo.filter(o=>!o.recogido_por).length} icono="📦"/>
      </div>
      <div className="equipo-radar"><h3>Radar del equipo completo</h3><Radar radar={promedio}/></div>
      <Segmento titulo="Estado del equipo" grupos={[
        {nombre:'Sanos',valor:Math.max(0,vivos.length-lesionados),color:'#71d58b'},
        {nombre:'Heridos',valor:lesionados,color:'#f1b34f'},
        {nombre:'Incapacitados',valor:incapacitados,color:'#e58a53'},
        {nombre:'Eliminados',valor:eliminados,color:'#bd6268'}
      ]}/>
      <h3>Arquetipos · toca para ver detalles</h3>
      <div className="arquetipos-grid">{grupos.map(g=>{
        const activos=g.hombres.filter(activo).length;
        const armados=g.hombres.filter(h=>activo(h)&&h.objeto).length;
        const heridos=g.hombres.filter(h=>h.estado==='herido').length;
        return <button className="tarjeta-arquetipo" key={g.nombre}
          onClick={()=>{if(onAbrir)onAbrir(g.nombre);else cambiar_seleccion(g.nombre);}}>
          <div className="tarjeta-cabecera"><strong>{g.nombre}</strong><b>{g.hombres.length}</b></div>
          <div className="mini-barra" aria-hidden="true">
            <i style={{width:activos/g.hombres.length*100+'%',background:g.color}}/>
          </div>
          <div className="mini-estadisticas"><span>🧰 {armados}</span><span>🩹 {heridos}</span>
            <span>✓ {activos}</span></div>
        </button>;
      })}</div>
      <div className="tacticas-grafico"><h3>Tácticas en curso</h3>
        {Object.entries(batalla.plan).map(([id,valor])=><div key={id}>
          <span>{TACTICAS[id].nombre}</span><progress value={valor} max="100"/><b>{valor}%</b>
        </div>)}
      </div>
    </>}
  </aside>;
}

function Barra({ nombre, valor, maximo, detalle }) {
  const porcentaje = Math.max(0, Math.min(100, valor / maximo * 100));
  return <div className="barra-batalla">
    <div><small>{nombre}</small><strong>{detalle}</strong></div>
    <progress aria-label={nombre} value={valor} max={maximo}
      style={{ '--color-barra': `hsl(${porcentaje * 1.2} 72% 53%)` }} />
  </div>;
}

const descripciones = {
  atacar: 'Se acercan por turnos. Se protegen automáticamente ante un ataque anunciado y recuperan energía entre golpes.',
  huir: 'Se alejan. Su velocidad depende del daño recibido, la fuerza y la valentía.',
  esconder: 'Buscan rocas o estructuras que bloqueen la visión del gorila.',
  rescatar: 'Van hacia los incapacitados y los ayudan a levantarse.',
  buscar_armas: 'Los hombres asignados más lejos del gorila buscan equipo. La inteligencia mejora la búsqueda.',
  distraer: 'Rodean al gorila a distancia para atraer su atención.',
};


function MenuEstrategia({dialogo,batalla,categoria,cambiar_categoria,plan,cambiar_plan,comprar,reanudar,cancelar}) {
  const entradas=Object.entries(TACTICAS);
  const suma=Object.values(plan).reduce((a,b)=>a+b,0);
  function porcentaje(id,valor) {
    const siguiente={...plan};
    const actual=siguiente[id]||0;
    if(valor===actual)return;
    if(valor===0) {
      if(Object.keys(siguiente).length===1)return;
      delete siguiente[id];
      const destino=Object.keys(siguiente).sort((a,b)=>siguiente[b]-siguiente[a])[0];
      siguiente[destino]+=actual;
    } else if(!actual) {
      const donante=Object.keys(siguiente).sort((a,b)=>siguiente[b]-siguiente[a])[0];
      const cantidad=Math.min(valor,Math.max(0,siguiente[donante]-5));
      if(cantidad<5)return;
      siguiente[donante]-=cantidad;siguiente[id]=cantidad;
    } else if(valor>actual) {
      let falta=valor-actual;
      for(const otro of Object.keys(siguiente).filter(x=>x!==id).sort((a,b)=>siguiente[b]-siguiente[a])) {
        const mover=Math.min(falta,siguiente[otro]-5);
        siguiente[otro]-=mover;falta-=mover;
        if(!falta)break;
      }
      siguiente[id]=valor-falta;
    } else {
      const destino=Object.keys(siguiente).filter(x=>x!==id).sort((a,b)=>siguiente[b]-siguiente[a])[0];
      if(!destino)return;
      siguiente[destino]+=actual-valor;siguiente[id]=valor;
    }
    cambiar_plan(siguiente);
  }
  return <dialog ref={dialogo} className="menu-estrategia" aria-labelledby="titulo-estrategia"
    onCancel={e=>{e.preventDefault();cancelar();}}>
    <header className="menu-cabecera"><h2 id="titulo-estrategia">{categoria==='Suministros'?'📦 Suministros':'⚔️ Tácticas'}</h2>
      <button onClick={cancelar} aria-label="Cerrar">✕</button></header>
    <div className="tabs-retro">
      <button aria-pressed={categoria!=='Suministros'} onClick={()=>cambiar_categoria('Combate')}>⚔️ Tácticas</button>
      <button aria-pressed={categoria==='Suministros'} onClick={()=>cambiar_categoria('Suministros')}>📦 Suministros</button>
    </div>
    {categoria==='Suministros'?
      <><p className="saldo">🍌 {batalla.bananas} · {batalla.entregas.length} en camino</p>
      <div className="lista-suministros">{Object.entries(SUMINISTROS).map(([id,item])=>
        <button key={id} disabled={batalla.bananas<item.costo||(item.solo_con_reservas&&!batalla.reservas)}
          onClick={()=>comprar(id)}><span>{item.nombre}</span><strong>{item.costo} 🍌</strong></button>)}</div></>
      :<><div className="total-tactico"><span>Equipo asignado</span><strong>{suma}%</strong></div>
      <div className="tacticas-todas">{entradas.map(([id,t])=>{
        const valor=plan[id]||0;
        return <div className="tactica-fila" key={id}>
          <div className="tactica-cabecera"><strong>{t.nombre}</strong><b>{valor}%</b></div>
          <div className="tactica-ajuste">
            <input type="range" aria-label={t.nombre} min="0" max="100" step="5" value={valor}
              onChange={e=>porcentaje(id,Number(e.target.value))}/>
            <button disabled={valor===0&&Math.max(...Object.values(plan))<=5}
              onClick={()=>porcentaje(id,valor?0:10)}>{valor?'✕':'+'}</button>
          </div>
        </div>;
      })}</div></>}
    <footer><button onClick={cancelar}>Cancelar</button>
      <button className="principal" onClick={reanudar} disabled={suma!==100}>Aplicar y jugar</button></footer>
  </dialog>;
}

function App() {
  const [dificultad, cambiar_dificultad] = useState(0);
  const [arena_elegida,cambiar_arena] = useState('claro');
  const [batalla, cambiar_batalla] = useState(() => partida(0));
  const [iniciada, cambiar_inicio] = useState(false);
  const [en_pausa, cambiar_pausa] = useState(false);
  const [modo_visual, cambiar_modo_visual] = useState('3d');
  const [categoria, cambiar_categoria] = useState('Combate');
  const [plan, cambiar_plan] = useState({});
  const [panel_movil, cambiar_panel_movil] = useState(null);
  const [arquetipo_abierto, cambiar_arquetipo_abierto]=useState(null);
  const [, actualizar_panel] = useState(0);
  const canvas = useRef(null);
  const dibujar = useRef(null);
  const audio = useRef(null);
  const indice_sonido = useRef(0);
  const [sonido, cambiar_sonido] = useState(true);
  const ultimo_cuadro = useRef(null);
  const dialogo = useRef(null);
  const boton_estrategia = useRef(null);
  const [arte_listo, cambiar_arte_listo] = useState(false);
  const cargando_arena = modo_visual === '3d' && !arte_listo;
  const gorila = batalla.gorila;
  const anuncio = gorila.segunda_vida === 'anuncio';
  const pausa_activa = en_pausa || panel_movil !== null;
  const activos = batalla.hombres.filter(activo).length;
  const segundos = Math.ceil(batalla.tiempo);
  const reloj = `${Math.floor(segundos / 60)}:${String(segundos % 60).padStart(2, '0')}`;

  useEffect(() => {
    audio.current=crear_audio_arcade();
    return ()=>audio.current?.cerrar();
  },[]);
  useEffect(() => {
    audio.current?.activar(sonido && iniciada && !pausa_activa && !Boolean(batalla.resultado) && !anuncio);
  },[sonido,iniciada,pausa_activa,batalla.resultado,anuncio]);
  useEffect(() => {
    const fallo = error => {
      console.warn('Vista WebGL:', error);
      cambiar_modo_visual('2d');
    };
    try {
      const render = modo_visual === '3d'
        ? crear_dibujante_3d(canvas.current, () => ultimo_cuadro.current?.(), fallo)
        : crear_dibujante(canvas.current);
      dibujar.current = render;
      return () => {
        render.liberar?.();
        dibujar.current = null;
      };
    } catch (error) {
      fallo(error);
    }
  }, [modo_visual]);

  useEffect(() => {
    let anterior;
    let ultimo_panel = 0;
    let cuadro;
    function pintar() {
      const listo = dibujar.current?.(batalla);
      if (modo_visual === '3d') cambiar_arte_listo(listo === true);
    }
    ultimo_cuadro.current = pintar;
    const jugando = iniciada && !pausa_activa && !cargando_arena && !anuncio;
    function animar(ahora) {
      if (anterior !== undefined && jugando) avanzar_batalla(batalla, Math.min(.05, (ahora - anterior) / 1000) * 1.25);
      anterior = ahora;
      pintar();
      if(sonido && iniciada && !pausa_activa) {
        const eventos=batalla.eventos;
        while(indice_sonido.current<eventos.length)audio.current?.efecto(eventos[indice_sonido.current++].tipo);
      }
      if (ahora - ultimo_panel >= 100) {
        ultimo_panel = ahora;
        actualizar_panel(valor => valor + 1);
      }
      if (jugando && batalla.gorila.segunda_vida === 'anuncio') actualizar_panel(valor => valor + 1);
      else if (jugando && !batalla.resultado) cuadro = requestAnimationFrame(animar);
    }
    cuadro = requestAnimationFrame(animar);
    return () => {
      cancelAnimationFrame(cuadro);
      ultimo_cuadro.current = null;
    };
  }, [batalla, iniciada, pausa_activa, modo_visual, cargando_arena, anuncio]);

  useEffect(() => {
    if (!anuncio) return;
    const aviso = setTimeout(() => {
      if (reanudar_segunda_vida(batalla)) actualizar_panel(valor => valor + 1);
    }, duracion_segunda_vida);
    return () => clearTimeout(aviso);
  }, [batalla, anuncio]);

  function abrir_estrategia(seccion='Combate') {
    cambiar_categoria(seccion);
    cambiar_plan({ ...batalla.plan });
    cambiar_pausa(true);
    dialogo.current.showModal();
  }

  function reanudar() {
    aplicar_plan(batalla, plan);
    cerrar_estrategia();
  }

  function cerrar_estrategia() {
    dialogo.current.close();
    cambiar_pausa(false);
    boton_estrategia.current?.focus();
  }

  function nueva_partida(nivel = dificultad, arena = arena_elegida) {
    indice_sonido.current=0;
    cambiar_arte_listo(false);
    cambiar_batalla(partida(nivel, arena));
    cambiar_panel_movil(null);
    cambiar_arquetipo_abierto(null);
    cambiar_inicio(false);
    cambiar_categoria('Combate');
    cambiar_pausa(false);
  }

  function comprar(id) {
    if (comprar_suministro(batalla, id)) {
      actualizar_panel(v => v + 1);
      ultimo_cuadro.current?.();
    }
  }

  return <main className="juego-app">
    <header className="cabecera movil-cabecera">
      <div className="marca"><h1>Gorilla<span>.</span></h1><p>100 vs 1 · ARCADE</p></div>
      <div className="cabecera-acciones">
        <button onClick={()=>{cambiar_pausa(true);cambiar_sonido(v=>!v);}} aria-label={sonido?'Silenciar':'Activar audio'}>{sonido?'♫':'♪̸'}</button>
        <button onClick={()=>{cambiar_arquetipo_abierto(null);cambiar_panel_movil('ajustes');}} aria-label="Ajustes">⚙</button>
        {iniciada&&!batalla.resultado&&<button onClick={()=>cambiar_pausa(v=>!v)} aria-label={en_pausa?'Continuar':'Pausar'}>{en_pausa?'▶':'Ⅱ'}</button>}
      </div>
    </header>
    <div className="tablero">
      <section className="campo" aria-label="Campo de combate">
        <div className="marcador">
          <div className="datos-marcador"><span>⏱ <strong>{reloj}</strong></span>
            <span>🍌 <strong>{batalla.bananas}</strong></span>
            <span>👥 <strong>{activos}</strong></span></div>
          <Barra nombre="Equipo" valor={activos} maximo={100} detalle={activos+' / 100'}/>
          <Barra nombre={'🦍 Nivel '+gorila.nivel+(en_furia(gorila)?' · Furia':'')}
            valor={gorila.vida} maximo={gorila.vida_maxima}
            detalle={Math.ceil(gorila.vida/gorila.vida_maxima*100)+'%'}/>
        </div>
        <div className="arena" aria-busy={cargando_arena}>
          <canvas key={modo_visual} ref={canvas} width={ancho} height={alto} aria-label={ARENAS[batalla.arena].nombre}/>
          <div className="nombre-arena">{ARENAS[batalla.arena].nombre}</div>
          {(batalla.resultado||!iniciada||pausa_activa||cargando_arena)&&
            <div className="estado" role="status">{batalla.resultado||
              (cargando_arena?'Cargando arena':iniciada?'Pausa':'Listos')}</div>}
          {anuncio&&<div className="segunda-vida" role="status" aria-label="Segunda vida del gorila">
            <img src={retrato_furia} alt=""/>
            <strong>SEGUNDA VIDA</strong><span>+15% de vida · Furia permanente</span>
          </div>}
        </div>
        <div className="controles-arcade botones-juego">
          {!iniciada?
            <button className="principal" disabled={cargando_arena}
              onClick={()=>{audio.current?.activar(sonido);cambiar_inicio(true);}}>▶ Iniciar batalla</button>:
            <button className="principal" ref={boton_estrategia}
              disabled={Boolean(batalla.resultado)||cargando_arena||anuncio}
              onClick={()=>abrir_estrategia('Combate')}>⚔️ Tácticas</button>}
          <button disabled={!iniciada||Boolean(batalla.resultado)||cargando_arena||anuncio}
            onClick={()=>abrir_estrategia('Suministros')}>📦 Suministros</button>
          <button onClick={()=>{cambiar_arquetipo_abierto(null);cambiar_panel_movil('equipo');}}>📊 Equipo</button>
        </div>
      </section>
      <div className="panel-escritorio"><PanelEquipo batalla={batalla} onAbrir={nombre=>{cambiar_arquetipo_abierto(nombre);cambiar_panel_movil('equipo');}}/></div>
    </div>
    {panel_movil&&<div className="hoja-fondo" onClick={()=>{cambiar_panel_movil(null);cambiar_arquetipo_abierto(null);}}>
      <section role="dialog" aria-modal="true" aria-label={panel_movil==='ajustes'?'Ajustes':'Equipo'}
        className="hoja-movil" onClick={e=>e.stopPropagation()}>
        <div className="hoja-cabecera"><h2>{panel_movil==='ajustes'?'⚙ Ajustes':'📊 Equipo'}</h2>
          <button onClick={()=>{cambiar_panel_movil(null);cambiar_arquetipo_abierto(null);}} aria-label="Cerrar">✕</button></div>
        {panel_movil==='equipo'?<PanelEquipo batalla={batalla} seleccionInicial={arquetipo_abierto}/>:<div className="ajustes-panel">
          <label>Vista<select value={modo_visual} onChange={e=>{cambiar_arte_listo(false);cambiar_modo_visual(e.target.value);}}>
            <option value="3d">Arcade 2.5D</option><option value="2d">Retro 2D</option></select></label>
          <label>Arena<select value={arena_elegida} onChange={e=>{const id=e.target.value;cambiar_arena(id);nueva_partida(dificultad,id);}}>
            {Object.entries(ARENAS).map(([id,item])=><option key={id} value={id}>{item.nombre}</option>)}</select></label>
          <label>Dificultad<select value={dificultad} onChange={e=>{const n=Number(e.target.value);cambiar_dificultad(n);nueva_partida(n);}}>
            {dificultades.map((d,i)=><option key={d} value={i}>{d}</option>)}</select></label>
          <button className="principal" onClick={()=>{nueva_partida();cambiar_panel_movil(null);}}>↻ Nueva partida</button>
        </div>}
      </section></div>}
    <MenuEstrategia dialogo={dialogo} batalla={batalla} categoria={categoria}
      cambiar_categoria={cambiar_categoria} plan={plan} cambiar_plan={cambiar_plan}
      comprar={comprar} reanudar={reanudar} cancelar={cerrar_estrategia}/>
  </main>;
}

createRoot(document.getElementById('root')).render(<App />);
