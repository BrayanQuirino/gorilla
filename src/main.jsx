import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import catalogo from './data/objetos.json';
import { crear_sorteo_objetos, preparar_equipo, habilidades } from './roster.js';
import { alto, ancho, avanzar_batalla, crear_batalla, dar_orden, comprar_suministro, dificultades } from './battle.js';
import { crear_dibujante } from './arena.js';
import { ARENAS, TACTICAS, SUMINISTROS } from './rules.js';
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
    aria-label={etiquetas.map((etiqueta, indice) => `${etiqueta} ${Math.round(radar[habilidades[indice]])}`).join(', ')}>
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

function App() {
  const [dificultad, cambiar_dificultad] = useState(0);
  const [arena_elegida,cambiar_arena] = useState('claro');
  const [batalla, cambiar_batalla] = useState(() => partida(0));
  const [en_pausa, cambiar_pausa] = useState(true);
  const [panel_tacticas,cambiar_panel_tacticas] = useState('combate');
  const [panel_tienda,cambiar_panel_tienda] = useState(false);
  const [escuadron, cambiar_escuadron] = useState(0);
  const [hombre_id, cambiar_hombre_id] = useState(1);
  const [, actualizar_panel] = useState(0);
  const canvas = useRef(null);
  const dibujar = useRef(null);
  const hombre = batalla.hombres[hombre_id - 1];
  const gorila = batalla.gorila;
  const activos = batalla.hombres.filter(personaje => personaje.vida > 0 && personaje.estado !== 'incapacitado' && personaje.estado !== 'eliminado').length;
  const ultimo_evento = batalla.eventos.at(-1);
  const segundos = Math.ceil(batalla.tiempo);
  const reloj = `${Math.floor(segundos / 60)}:${String(segundos % 60).padStart(2, '0')}`;

  useEffect(() => {
    dibujar.current = crear_dibujante(canvas.current);
  }, []);

  useEffect(() => {
    let anterior;
    let ultimo_panel = 0;
    let cuadro;
    function animar(ahora) {
      if (anterior !== undefined && !en_pausa) avanzar_batalla(batalla, Math.min(.035, (ahora - anterior) / 1000));
      anterior = ahora;
      dibujar.current(batalla, escuadron);
      if (ahora - ultimo_panel >= 100) {
        ultimo_panel = ahora;
        actualizar_panel(valor => valor + 1);
      }
      if (!en_pausa && !batalla.resultado) cuadro = requestAnimationFrame(animar);
    }
    cuadro = requestAnimationFrame(animar);
    return () => cancelAnimationFrame(cuadro);
  }, [batalla, en_pausa, escuadron]);

  useEffect(() => {
    function pausar(evento) {
      if (evento.code !== 'Space' || evento.repeat || evento.target.closest('button, select, input')) return;
      evento.preventDefault();
      if (!batalla.resultado) cambiar_pausa(valor => !valor);
    }
    window.addEventListener('keydown', pausar);
    return () => window.removeEventListener('keydown', pausar);
  }, [batalla]);

  function nueva_partida(nivel = dificultad,arena = arena_elegida) {
    cambiar_batalla(partida(nivel,arena));
    cambiar_escuadron(0);
    cambiar_hombre_id(1);
    cambiar_pausa(true);
  }

  function comprar(id) { if (comprar_suministro(batalla,id)) actualizar_panel(v=>v+1); }

  function seleccionar_escuadron(id) {
    cambiar_escuadron(id);
    if (id && hombre.escuadron !== id) cambiar_hombre_id((id - 1) * 10 + 1);
  }

  function ordenar(orden, destino) {
    if (!batalla.resultado) {dar_orden(batalla, escuadron, orden, destino);actualizar_panel(v=>v+1);}
  }

  function mover(evento) {
    const rect = evento.currentTarget.getBoundingClientRect();
    ordenar('mover', {
      x: (evento.clientX - rect.left) * ancho / rect.width,
      y: (evento.clientY - rect.top) * alto / rect.height,
    });
  }

  return <main>
    <header className="cabecera">
      <div><h1>Gorilla<span>.</span></h1><p>100 hombres contra un gorila · Arcade retro 2D</p></div>
      <div className="configuracion">
        <label>Arena <select value={arena_elegida} onChange={evento=>{const id=evento.target.value;cambiar_arena(id);nueva_partida(dificultad,id);}}>{Object.entries(ARENAS).map(([id,a])=><option value={id} key={id}>{a.nombre}</option>)}</select></label>
        <label>Dificultad <select value={dificultad} onChange={evento => {
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
        <div className="arena">
          <canvas ref={canvas} width={ancho} height={alto} onClick={mover} aria-label={ARENAS[batalla.arena].nombre} />
          <div className="estado" role="status">{batalla.resultado || (en_pausa ? 'Pausa táctica' : ARENAS[batalla.arena].nombre)}</div>
        </div>
        <div className="controles-arcade">
          <div className="barra-control">
            <button className="principal" disabled={Boolean(batalla.resultado)}
              onClick={() => cambiar_pausa(valor => !valor)}>{en_pausa ? '▶ INICIAR' : '⏸ PAUSAR'}</button>
            <div className="tabs-retro" role="group" aria-label="Categorías de tácticas">
              <button aria-pressed={panel_tacticas==='combate'} onClick={()=>cambiar_panel_tacticas('combate')}>⚔ Combate</button>
              <button aria-pressed={panel_tacticas==='supervivencia'} onClick={()=>cambiar_panel_tacticas('supervivencia')}>🌿 Supervivencia</button>
              <button aria-pressed={panel_tacticas==='exploracion'} onClick={()=>cambiar_panel_tacticas('exploracion')}>🔎 Exploración</button>
            </div>
            <button className="comprar-acceso" aria-pressed={panel_tienda} onClick={()=>cambiar_panel_tienda(v=>!v)}>🍌 TIENDA {panel_tienda?'▴':'▾'}</button>
          </div>
          <div className="ordenes">
            {Object.entries(TACTICAS)
              .filter(([id])=>(panel_tacticas==='combate'?['atacar','defender','mantener','emboscada']:panel_tacticas==='supervivencia'?['retirar','huir','esconder','rescatar']:['buscar_armas','distraer']).includes(id))
              .map(([id,t])=><button key={id} aria-pressed={escuadron===0?batalla.hombres.every(h=>h.orden===id):batalla.hombres.filter(h=>h.escuadron===escuadron).every(h=>h.orden===id)} onClick={()=>ordenar(id)}>{t.nombre}</button>)}
          </div>
          <div className="estado-equipo" aria-live="polite">
            <span>ESCUADRÓN: {escuadron||'TODOS'}</span>
            <span>EN ARENA: {batalla.armas_suelo.filter(o=>!o.recogido_por).length} OBJETOS</span>
            <span>ÚLTIMO EVENTO: {ultimo_evento?.tipo?.replaceAll('_',' ')||'LISTOS PARA COMBATIR'}</span>
          </div>
        </div>
        <p className="ayuda">Elige un escuadrón y toca el campo para moverlo. La barra espaciadora activa la pausa táctica. Usa los paneles para cambiar órdenes y comprar suministros; los objetos ocultos no aparecen en el mapa.</p>
      </section>
      <aside>
        <div className="panel-suministros" hidden={!panel_tienda}>
          <h2>SUMINISTROS · 🍌 {batalla.bananas}</h2>
          <div className="lista-suministros">{Object.entries(SUMINISTROS).map(([id,s])=><button key={id} disabled={batalla.bananas<s.costo||Boolean(batalla.resultado)} onClick={()=>comprar(id)} title={s.nombre}><span>{s.nombre}</span><strong>{s.costo} 🍌</strong></button>)}</div>
        </div>
        <h2>ESCUADRONES</h2>
        <div className="escuadrones">
          <button aria-pressed={escuadron === 0} onClick={() => seleccionar_escuadron(0)}>Todos</button>
          {Array.from({ length: 10 }, (_, indice) => {
            const id = indice + 1;
            const vivos = batalla.hombres.filter(personaje => personaje.escuadron === id && personaje.vida > 0 && personaje.estado !== 'incapacitado' && personaje.estado !== 'eliminado').length;
            return <button key={id} aria-label={`Escuadrón ${id}, ${vivos} activos`}
              aria-pressed={escuadron === id} onClick={() => seleccionar_escuadron(id)}>{id}<small>{vivos}</small></button>;
          })}
        </div>
        <div className="ficha">
          <label>Ficha individual <select value={hombre_id}
            onChange={evento => cambiar_hombre_id(Number(evento.target.value))}>
            {batalla.hombres.filter(personaje => !escuadron || personaje.escuadron === escuadron).map(personaje =>
              <option key={personaje.id} value={personaje.id}>#{personaje.id} · {personaje.arquetipo}</option>)}
          </select></label>
          <h2>{hombre.arquetipo} <small>{hombre.edad} años</small></h2>
          <Radar radar={hombre.radar} />
          <div className="objeto">
            <strong>{hombre.objeto?.nombre || 'Sin objeto'}</strong>
            <span>+{(hombre.objeto?.bono_fuerza_pb || 0) / 100} % de fuerza · {hombre.objeto?.peso_g || 0} g</span>
          </div>
          <label className="miedo">Miedo <progress value={hombre.miedo} max="100" /></label>
        </div>
        <div className="ficha"><h2>RESUMEN DEL SORTEO</h2><p>Armados: {batalla.resumen?.armados ?? '—'} · Sin armas: {batalla.resumen?.desarmados ?? '—'} · Objetos en arena: {batalla.resumen?.armas_arena ?? 0}</p><p>Las armas de la arena se deben descubrir con la táctica Buscar armas.</p></div>
      </aside>
    </div>
    <section className="reglas"><h2>Reglas</h2>
      <p>Dirige a 100 hombres en una arena con objetos propios. Agota la resistencia del gorila en cinco minutos.
        Si todos caen o se acaba el tiempo, gana el gorila.</p>
      <p>Cada hombre tiene ocho habilidades, una edad de 18 a 100 años y puede empezar sin objeto o con uno sorteado del catálogo de 1,000.
        La edad modifica sus habilidades físicas y el miedo puede hacerlo retroceder.</p>
    </section>
  </main>;
}

createRoot(document.getElementById('root')).render(<App />);
