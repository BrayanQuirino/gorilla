import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import catalogo from './data/objetos.json';
import { crear_sorteo_objetos, preparar_equipo, habilidades } from './roster.js';
import { alto, ancho, avanzar_batalla, crear_batalla, activo, dar_orden, comprar_suministro, dificultades } from './battle.js';
import { crear_dibujante } from './arena.js';
import { crear_dibujante_3d } from './arena3d.js';
import { ARENAS, TACTICAS, SUMINISTROS, resumir_equipo } from './rules.js';
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

function Radar({ radar, maximo = 100 }) {
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
    <polygon points={poligono(habilidades.map(eje => radar[eje] * 72 / maximo))}
      fill="#acdd7960" stroke="#b5e880" strokeWidth="2" />
  </svg>;
}

const formato = new Intl.NumberFormat('es-MX', { maximumFractionDigits: 2 });
const vistas_equipo = [
  ['habilidades', 'Habilidades'], ['perfiles', 'Perfiles'],
  ['equipo', 'Equipo'], ['fichas', 'Ficha individual'],
];
const edades = { jovenes: '18–29 años', adultos: '30–54 años', mayores: '55–69 años', ancianos: '70–100 años' };
const categorias = {
  Combate: ['atacar', 'defender', 'mantener', 'emboscada'],
  Supervivencia: ['retirar', 'huir', 'esconder', 'rescatar'],
  Exploración: ['buscar_armas', 'distraer'],
};

function Cifras({ entradas }) {
  return <dl className="cifras">
    {entradas.map(([nombre, valor]) => <div key={nombre}><dt>{nombre}</dt><dd>{formato.format(valor)}</dd></div>)}
  </dl>;
}

function PanelEquipo({ batalla, activos, vista, cambiar_vista, hombre_id, cambiar_hombre_id }) {
  const hombres = batalla.hombres;
  const disponibles = batalla.armas_suelo.filter(objeto => !objeto.recogido_por);
  const resumen = resumir_equipo(hombres, disponibles);
  const hombre = hombres.find(personaje => personaje.id === hombre_id);
  const totales = Object.fromEntries(habilidades.map(eje =>
    [eje, hombres.reduce((total, miembro) => total + miembro.radar[eje], 0)]));
  const estado = (nombre) => hombres.filter(miembro => miembro.estado === nombre).length;

  return <aside aria-label="Resumen del equipo">
    <h2>Resumen del equipo</h2>
    <Cifras entradas={[
      ['Registrados', resumen.total], ['Activos', activos],
      ['Incapacitados', estado('incapacitado')], ['Eliminados', estado('eliminado')],
    ]} />
    <div className="tabs-retro vistas-equipo" role="group" aria-label="Detalles del equipo">
      {vistas_equipo.map(([id, titulo]) => <button key={id} aria-pressed={vista === id}
        onClick={() => cambiar_vista(id)}>{titulo}</button>)}
    </div>
    <div className="ficha">
      {vista === 'habilidades' && <>
        <h2>Habilidades acumuladas</h2>
        <p>Suma de las habilidades de los {resumen.total} integrantes registrados.</p>
        <Radar radar={totales} maximo={resumen.total * 100} />
        <Cifras entradas={habilidades.map((eje, indice) => [etiquetas[indice], totales[eje]])} />
      </>}
      {vista === 'perfiles' && <>
        <h2>Edades</h2>
        <Cifras entradas={Object.entries(resumen.edades).map(([grupo, cantidad]) => [edades[grupo], cantidad])} />
        <h2>Arquetipos</h2>
        <Cifras entradas={Object.entries(resumen.arquetipos).sort((a, b) => b[1] - a[1])} />
      </>}
      {vista === 'equipo' && <>
        <h2>Equipamiento</h2>
        <Cifras entradas={[
          ['Con objeto', resumen.armados], ['Sin objeto', resumen.desarmados],
          ['Objetos en arena', resumen.armas_arena], ['Refuerzos disponibles', batalla.reservas],
        ]} />
        {resumen.armados > 0 && <><h2>Objetos en uso</h2>
          <Cifras entradas={Object.entries(resumen.objetos).sort((a, b) => b[1] - a[1])} />
        </>}
      </>}
      {vista === 'fichas' && <>
        <label>Combatiente <select aria-label="Combatiente" value={hombre_id ?? ''}
          onChange={evento => cambiar_hombre_id(Number(evento.target.value) || null)}>
          <option value="">Selecciona un combatiente</option>
          {hombres.map(personaje =>
            <option key={personaje.id} value={personaje.id}>#{personaje.id} · {personaje.arquetipo}</option>)}
        </select></label>
        {hombre && <>
          <h2>{hombre.arquetipo} <small>{hombre.edad} años</small></h2>
          <p className="estado-persona">{hombre.estado}</p>
          <Radar radar={hombre.radar} />
          <Cifras entradas={habilidades.map((eje, indice) => [etiquetas[indice], hombre.radar[eje]])} />
          <div className="objeto">
            <strong>{hombre.objeto?.nombre || 'Sin objeto'}</strong>
            {hombre.objeto && <span>+{formato.format(hombre.objeto.bono_fuerza_pb / 100)} % de fuerza · {formato.format(hombre.objeto.peso_g)} g</span>}
          </div>
          <label className="miedo">Miedo <progress value={hombre.miedo} max="100" /></label>
        </>}
      </>}
    </div>
  </aside>;
}

function MenuEstrategia({ dialogo, batalla, categoria, cambiar_categoria, ordenar, comprar, reanudar }) {
  return <dialog ref={dialogo} className="menu-estrategia" aria-labelledby="titulo-estrategia"
    onCancel={evento => { evento.preventDefault(); reanudar(); }}>
    <header>
      <h2 id="titulo-estrategia">Estrategia</h2>
      <p>Táctica para todo el equipo</p>
    </header>
    <div className="tabs-retro" role="group" aria-label="Categorías de estrategia">
      {[...Object.keys(categorias), 'Suministros'].map(nombre => <button key={nombre}
        aria-pressed={categoria === nombre} onClick={() => cambiar_categoria(nombre)}>{nombre}</button>)}
    </div>
    {categoria === 'Suministros' ? <>
      <p className="saldo">🍌 {batalla.bananas} bananas disponibles</p>
      <div className="lista-suministros">{Object.entries(SUMINISTROS).map(([id, suministro]) =>
        <button key={id} disabled={batalla.bananas < suministro.costo || (suministro.solo_con_reservas && !batalla.reservas)}
          onClick={() => comprar(id)}><span>{suministro.nombre}</span><strong>{suministro.costo} 🍌</strong></button>)}</div>
    </> : <div className="ordenes">
      {categorias[categoria].map(id => <button key={id}
        aria-pressed={batalla.estrategia === id} onClick={() => ordenar(id)}>{TACTICAS[id].nombre}</button>)}
    </div>}
    <footer>
      <p role="status">Táctica activa · {TACTICAS[batalla.estrategia].nombre}</p>
      <button className="principal" onClick={reanudar}>Reanudar</button>
    </footer>
  </dialog>;
}

function App() {
  const [dificultad, cambiar_dificultad] = useState(0);
  const [arena_elegida,cambiar_arena] = useState('claro');
  const [batalla, cambiar_batalla] = useState(() => partida(0));
  const [en_pausa, cambiar_pausa] = useState(false);
  const [modo_visual, cambiar_modo_visual] = useState('3d');
  const [categoria, cambiar_categoria] = useState('Combate');
  const [vista_equipo, cambiar_vista_equipo] = useState('habilidades');
  const [hombre_id, cambiar_hombre_id] = useState(null);
  const [, actualizar_panel] = useState(0);
  const canvas = useRef(null);
  const dibujar = useRef(null);
  const ultimo_cuadro = useRef(null);
  const dialogo = useRef(null);
  const boton_estrategia = useRef(null);
  const seleccionado = useRef(null);
  seleccionado.current = vista_equipo === 'fichas' ? hombre_id : null;
  const [arte_listo, cambiar_arte_listo] = useState(false);
  const cargando_arena = modo_visual === '3d' && !arte_listo;
  const gorila = batalla.gorila;
  const activos = batalla.hombres.filter(activo).length;
  const ultimo_evento = batalla.eventos.at(-1);
  const segundos = Math.ceil(batalla.tiempo);
  const reloj = `${Math.floor(segundos / 60)}:${String(segundos % 60).padStart(2, '0')}`;

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
      const listo = dibujar.current?.(batalla, seleccionado.current);
      if (modo_visual === '3d') cambiar_arte_listo(listo === true);
    }
    ultimo_cuadro.current = pintar;
    function animar(ahora) {
      if (anterior !== undefined && !en_pausa && !cargando_arena) avanzar_batalla(batalla, Math.min(.035, (ahora - anterior) / 1000));
      anterior = ahora;
      pintar();
      if (ahora - ultimo_panel >= 100) {
        ultimo_panel = ahora;
        actualizar_panel(valor => valor + 1);
      }
      if (!en_pausa && !cargando_arena && !batalla.resultado) cuadro = requestAnimationFrame(animar);
    }
    cuadro = requestAnimationFrame(animar);
    return () => {
      cancelAnimationFrame(cuadro);
      ultimo_cuadro.current = null;
    };
  }, [batalla, en_pausa, modo_visual, cargando_arena]);

  useEffect(() => {
    ultimo_cuadro.current?.();
  }, [hombre_id, vista_equipo]);

  function abrir_estrategia() {
    cambiar_pausa(true);
    dialogo.current.showModal();
  }

  function reanudar() {
    dialogo.current.close();
    cambiar_pausa(false);
    boton_estrategia.current?.focus();
  }

  function nueva_partida(nivel = dificultad, arena = arena_elegida) {
    cambiar_arte_listo(false);
    cambiar_batalla(partida(nivel, arena));
    cambiar_hombre_id(null);
    cambiar_vista_equipo('habilidades');
    cambiar_categoria('Combate');
    cambiar_pausa(false);
  }

  function comprar(id) {
    if (comprar_suministro(batalla, id)) {
      actualizar_panel(v => v + 1);
      ultimo_cuadro.current?.();
    }
  }

  function ordenar(orden) {
    if (dar_orden(batalla, orden)) actualizar_panel(v => v + 1);
  }

  return <main>
    <header className="cabecera">
      <div><h1>Gorilla<span>.</span></h1><p>100 hombres contra un gorila · Arcade 2.5D</p></div>
      <div className="configuracion">
        <label>Vista <select aria-label="Vista" value={modo_visual} onChange={e => { cambiar_arte_listo(false); cambiar_modo_visual(e.target.value); }}><option value="3d">Arcade 2.5D</option><option value="2d">Retro 2D</option></select></label>
        <label>Arena <select aria-label="Arena" value={arena_elegida} onChange={evento=>{const id=evento.target.value;cambiar_arena(id);nueva_partida(dificultad,id);}}>{Object.entries(ARENAS).map(([id,a])=><option value={id} key={id}>{a.nombre}</option>)}</select></label>
        <label>Dificultad <select aria-label="Dificultad" value={dificultad} onChange={evento => {
          const nivel = Number(evento.target.value);
          cambiar_dificultad(nivel);
          nueva_partida(nivel);
        }}>{dificultades.map((nombre, indice) => <option value={indice} key={nombre}>{nombre}</option>)}</select></label>
        <button onClick={() => nueva_partida()}>Nueva partida</button>
      </div>
    </header>
    <div className="tablero">
      <section className="campo" aria-label="Campo de combate">
        <div className="marcador">
          <div><small>Hombres activos</small><strong>{activos} <span>/ 100</span></strong></div>
          <div><small>Tiempo</small><strong>{reloj}</strong></div>
          <div><small>Bananas</small><strong>🍌 {batalla.bananas}</strong></div>
          <div><small>Gorila · Nivel {gorila.nivel}</small>
            <progress aria-label="Resistencia del gorila" value={gorila.vida} max={gorila.vida_maxima} /></div>
        </div>
        <div className="arena" aria-busy={cargando_arena}>
          <canvas key={modo_visual} ref={canvas} width={ancho} height={alto} aria-label={ARENAS[batalla.arena].nombre} />
          <div className="nombre-arena">{ARENAS[batalla.arena].nombre}</div>
          {(batalla.resultado || en_pausa || cargando_arena) && (
            <div className="estado" role="status">
              {batalla.resultado || (cargando_arena ? 'Cargando arena' : 'Pausa táctica')}
            </div>
          )}
        </div>
        <div className="controles-arcade">
          <button ref={boton_estrategia} className="principal" aria-haspopup="dialog"
            disabled={Boolean(batalla.resultado) || cargando_arena} onClick={abrir_estrategia}>Estrategia</button>
          <p>Táctica activa · <strong>{TACTICAS[batalla.estrategia].nombre}</strong></p>
          <p className="ultimo-evento">Último evento · {ultimo_evento?.tipo.replaceAll('_', ' ') || 'Inicio de la batalla'}</p>
        </div>
      </section>
      <PanelEquipo batalla={batalla} activos={activos} vista={vista_equipo}
        cambiar_vista={cambiar_vista_equipo} hombre_id={hombre_id} cambiar_hombre_id={cambiar_hombre_id} />
    </div>
    <section className="reglas"><h2>Reglas</h2>
      <p>El equipo combate automáticamente. Abre Estrategia para pausar la batalla y cambiar la táctica de todos. Agota la resistencia del gorila en cinco minutos.
        Si todos caen o se acaba el tiempo, gana el gorila.</p>
      <p>Cada hombre tiene ocho habilidades, una edad de 18 a 100 años y puede empezar sin objeto o con uno sorteado del catálogo de 1,000.
        La edad modifica sus habilidades físicas y el miedo puede hacerlo retroceder.</p>
    </section>
    <MenuEstrategia dialogo={dialogo} batalla={batalla} categoria={categoria}
      cambiar_categoria={cambiar_categoria} ordenar={ordenar} comprar={comprar} reanudar={reanudar} />
  </main>;
}

createRoot(document.getElementById('root')).render(<App />);
