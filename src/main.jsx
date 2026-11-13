import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import catalogo from './data/objetos.json';
import { crear_sorteo_objetos, preparar_equipo, habilidades, radar_arquetipo } from './roster.js';
import { alto, ancho, avanzar_batalla, crear_batalla, activo, aplicar_plan, comprar_suministro, dificultades, clase_danio, danio_humano, radio_ataque, rango_golpe_gorila, velocidad_gorila, duracion_segunda_vida, reanudar_segunda_vida, en_furia } from './battle.js';
import { crear_dibujante } from './arena.js';
import { crear_dibujante_3d } from './arena3d.js';
import { ARENAS, TACTICAS, SUMINISTROS, resumir_equipo } from './rules.js';
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
const categorias = {
  Combate: ['atacar'],
  Supervivencia: ['huir', 'esconder', 'rescatar'],
  Exploración: ['buscar_armas', 'distraer'],
};

function Cifras({ entradas }) {
  return <dl className="cifras">
    {entradas.map(([nombre, valor]) => <div key={nombre}><dt>{nombre}</dt><dd>{formato.format(valor)}</dd></div>)}
  </dl>;
}

function PanelEquipo({ batalla, perfil, cambiar_perfil }) {
  const perfiles = new Map();
  for (const hombre of batalla.hombres) {
    if (!perfiles.has(hombre.arquetipo)) perfiles.set(hombre.arquetipo, []);
    perfiles.get(hombre.arquetipo).push(hombre);
  }
  const miembros = perfiles.get(perfil);
  const radar = radar_arquetipo[perfil];
  const activos = batalla.hombres.filter(activo);
  const en_suelo = batalla.armas_suelo.filter(objeto => !objeto.recogido_por);
  const resumen = resumir_equipo(batalla.hombres, en_suelo);
  const armas = activos.filter(hombre => hombre.objeto?.tipo === 'fuego').length;
  const armas_suelo = en_suelo.filter(item => item.objeto.tipo === 'fuego').length;
  const media_valentia = activos.length ? activos.reduce((total, hombre) => total + hombre.valentia, 0) / activos.length : 0;
  const g = batalla.gorila;
  const [golpe_min, golpe_max] = rango_golpe_gorila(g);
  return <aside aria-label="Resumen del equipo">
    {miembros ? <>
      <button onClick={() => cambiar_perfil(null)}>← Todos los perfiles</button>
      <h2>{perfil}</h2>
      <p>{miembros.filter(activo).length} activos de {miembros.length} · Radar base del perfil</p>
      <Radar radar={radar} />
      <Cifras entradas={habilidades.map((eje, indice) => [etiquetas[indice], radar[eje]])} />
      <h2>Vida y daño por integrante</h2>
      <p>Daño máximo por impacto acertado, en puntos de vida del gorila. Baja hasta 30 % en el límite del alcance.</p>
      <div className="fichas-perfil">
        {miembros.map(hombre => {
          const disparo = hombre.objeto?.tipo === 'fuego' && hombre.objeto.municion > 0;
          return <div key={hombre.id}>
            <strong>#{hombre.id} · {hombre.edad} años</strong>
            <span>{formato.format(hombre.vida)} / {formato.format(hombre.vida_maxima)} PV</span>
            <small>{activo(hombre) ? `${formato.format(danio_humano(hombre, disparo, g.fase === 'recuperacion' ? 1.35 : 1))} PV máx. por ${disparo ? 'disparo' : 'golpe'} · Objeto: ${clase_danio(hombre.objeto)}` : hombre.estado}</small>
          </div>;
        })}
      </div>
    </> : <>
      <h2>Resumen del equipo</h2>
      <Cifras entradas={[
        ['Activos', activos.length], ['Con equipo', resumen.armados],
        ['Armas de fuego en uso', armas], ['Armas de fuego en arena', armas_suelo],
        ['Objetos en arena', en_suelo.length], ['Buscando armas', activos.filter(h => h.orden === 'buscar_armas').length],
      ]} />
      <h2>Por edad</h2>
      <Cifras entradas={[
        ['Adolescentes', resumen.edades.adolescentes],
        ['Adultos', resumen.edades.jovenes + resumen.edades.adultos],
        ['Mayores', resumen.edades.mayores], ['Adultos mayores', resumen.edades.ancianos],
      ]} />
      <Cifras entradas={[
        ['Heridos', activos.filter(h => h.estado === 'herido').length],
        ['Incapacitados', batalla.hombres.filter(h => h.estado === 'incapacitado').length],
        ['Eliminados', batalla.hombres.filter(h => h.estado === 'eliminado').length],
        ['Valentía media (%)', media_valentia],
      ]} />
      <details className="ficha-gorila">
        <summary>Datos del gorila</summary>
        <Cifras entradas={[
          ['Vida actual (PV)', g.vida], ['Vida máxima (PV)', g.vida_maxima],
          ['Fuerza (×)', g.fuerza], ['Persecución (u/s)', velocidad_gorila.persecucion],
          ['Repliegue (u/s)', velocidad_gorila.repliegue], ['Embestida (u/s)', velocidad_gorila.embestida], ['Alcance del golpe (u)', radio_ataque(g, 'barrido')],
          ['Daño mínimo (PV)', golpe_min], ['Daño máximo (PV)', golpe_max],
        ]} />
        <p>Daño de un golpe directo antes de defensa. Disminuye con la distancia. El lanzamiento quita entre 92 % y 116 % de la vida máxima del combatiente.</p>
      </details>
      <h2>Perfiles del equipo</h2>
      <p>Objetos clasificados por daño: Bajo · Medio · Alto · Crítico.</p>
      <div className="perfiles">
        {[...perfiles].sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0], 'es')).map(([nombre, grupo]) =>
          <button key={nombre} onClick={() => cambiar_perfil(nombre)}><span>{nombre}</span><strong>{grupo.length}</strong></button>)}
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

function MenuEstrategia({ dialogo, batalla, categoria, cambiar_categoria, plan, cambiar_plan, comprar, reanudar, cancelar }) {
  const elegidas = Object.entries(plan);
  const disponible = 100 - elegidas.reduce((total, [, porcentaje]) => total + porcentaje, 0);
  function porcentaje(id, valor) {
    const siguiente = {...plan};
    const actual=siguiente[id]||0;
    if(valor===0) {
      if(elegidas.length<=1)return;
      delete siguiente[id];
      const destino=Object.keys(siguiente).sort((a,b)=>siguiente[b]-siguiente[a])[0];
      siguiente[destino]+=actual;
    } else if(!actual) {
      if(elegidas.length>=3)return;
      const donante=Object.keys(siguiente).sort((a,b)=>siguiente[b]-siguiente[a])[0];
      const cesion=Math.min(valor,siguiente[donante]-5);
      if(cesion<5)return;
      siguiente[donante]-=cesion;
      siguiente[id]=cesion;
    } else {
      let diferencia=valor-actual;
      if(diferencia>0) {
        for(const otro of Object.keys(siguiente).filter(x=>x!==id).sort((a,b)=>siguiente[b]-siguiente[a])) {
          const movible=Math.min(diferencia,siguiente[otro]-5);
          siguiente[otro]-=movible;diferencia-=movible;
          if(!diferencia)break;
        }
        siguiente[id]=valor-diferencia;
      } else if(diferencia<0) {
        const destino=Object.keys(siguiente).filter(x=>x!==id).sort((a,b)=>siguiente[b]-siguiente[a])[0];
        if(!destino)return;
        siguiente[id]=valor;
        siguiente[destino]-=diferencia;
      }
    }
    cambiar_plan(siguiente);
  }
  return <dialog ref={dialogo} className="menu-estrategia" aria-labelledby="titulo-estrategia"
    onCancel={evento => { evento.preventDefault(); cancelar(); }}>
    <header>
      <h2 id="titulo-estrategia">Estrategia</h2>
      <p>Reparte el 100 % de los hombres activos entre un máximo de tres tácticas.</p>
    </header>
    <div className="tabs-retro" role="group" aria-label="Categorías de estrategia">
      {[...Object.keys(categorias), 'Suministros'].map(nombre => <button key={nombre}
        aria-pressed={categoria === nombre} onClick={() => cambiar_categoria(nombre)}>{nombre}</button>)}
    </div>
    {categoria === 'Suministros' ? <>
      <p className="saldo">🍌 {batalla.bananas} bananas disponibles · {batalla.entregas.length} paquetes en camino</p>
      <div className="lista-suministros">{Object.entries(SUMINISTROS).map(([id, suministro]) =>
        <button key={id} disabled={batalla.bananas < suministro.costo || (suministro.solo_con_reservas && !batalla.reservas)}
          onClick={() => comprar(id)}><span>{suministro.nombre}</span><strong>{suministro.costo} 🍌</strong></button>)}</div>
    </> : <>
      <div className="reparto-tactico">
        {elegidas.map(([id, valor]) => <div key={id}>
          <label>{TACTICAS[id].nombre} · {valor} %
            <input type="range" aria-label={`Porcentaje para ${TACTICAS[id].nombre}`}
              min="0" max="100" step="5" value={valor}
              onChange={evento => porcentaje(id, Number(evento.target.value))} />
          </label>
          <button onClick={() => porcentaje(id, 0)} aria-label={`Quitar ${TACTICAS[id].nombre}`}>Quitar</button>
        </div>)}
        <p role="status">Asignado: {100-disponible} % / 100 % · {elegidas.length} de 3 tácticas</p>
      </div>
      <div className="ordenes">
        {categorias[categoria].map(id => <button key={id} aria-pressed={Boolean(plan[id])}
          disabled={Boolean(plan[id]) || elegidas.length >= 3 || Math.max(...Object.values(plan)) <= 5}
          onClick={() => porcentaje(id, id === 'buscar_armas' ? 10 : 25)}>
          <strong>{TACTICAS[id].nombre}</strong><span>{descripciones[id]}</span>
        </button>)}
      </div>
    </>}
    <footer>
      <button onClick={cancelar}>Cerrar sin aplicar tácticas</button>
      <button className="principal" disabled={disponible!==0} onClick={reanudar}>Reanudar</button>
    </footer>
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
  const [perfil, cambiar_perfil] = useState(null);
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
  const activos = batalla.hombres.filter(activo).length;
  const ultimo_evento = batalla.eventos.at(-1);
  const segundos = Math.ceil(batalla.tiempo);
  const reloj = `${Math.floor(segundos / 60)}:${String(segundos % 60).padStart(2, '0')}`;

  useEffect(() => {
    audio.current=crear_audio_arcade();
    return ()=>audio.current?.cerrar();
  },[]);
  useEffect(() => {
    audio.current?.activar(sonido && iniciada && !en_pausa && !Boolean(batalla.resultado) && !anuncio);
  },[sonido,iniciada,en_pausa,batalla.resultado,anuncio]);
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
    const jugando = iniciada && !en_pausa && !cargando_arena && !anuncio;
    function animar(ahora) {
      if (anterior !== undefined && jugando) avanzar_batalla(batalla, Math.min(.05, (ahora - anterior) / 1000) * .65);
      anterior = ahora;
      pintar();
      if(sonido && iniciada && !en_pausa) {
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
  }, [batalla, iniciada, en_pausa, modo_visual, cargando_arena, anuncio]);

  useEffect(() => {
    if (!anuncio) return;
    const aviso = setTimeout(() => {
      if (reanudar_segunda_vida(batalla)) actualizar_panel(valor => valor + 1);
    }, duracion_segunda_vida);
    return () => clearTimeout(aviso);
  }, [batalla, anuncio]);

  function abrir_estrategia() {
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
    cambiar_perfil(null);
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
        <button type="button" aria-pressed={sonido} onClick={() => cambiar_sonido(v=>!v)}>{sonido ? "♫ Audio ON" : "♫ Audio OFF"}</button>
        <button onClick={() => nueva_partida()}>Nueva partida</button>
      </div>
    </header>
    <div className="tablero">
      <section className="campo" aria-label="Campo de combate">
        <div className="marcador">
          <div className="datos-marcador"><span>Tiempo <strong>{reloj}</strong></span><span>🍌 <strong>{batalla.bananas}</strong></span></div>
          <Barra nombre="Hombres activos" valor={activos} maximo={100} detalle={`${activos} / 100`} />
          <Barra nombre={`Gorila · Nivel ${gorila.nivel}${en_furia(gorila) ? ' · Furia' : ''}`} valor={gorila.vida} maximo={gorila.vida_maxima}
            detalle={`${Math.ceil(gorila.vida / gorila.vida_maxima * 100)} %`} />
        </div>
        <div className="arena" aria-busy={cargando_arena}>
          <canvas key={modo_visual} ref={canvas} width={ancho} height={alto} aria-label={ARENAS[batalla.arena].nombre} />
          <div className="nombre-arena">{ARENAS[batalla.arena].nombre}</div>
          {(batalla.resultado || !iniciada || en_pausa || cargando_arena) && (
            <div className="estado" role="status">
              {batalla.resultado || (cargando_arena ? 'Cargando arena' : iniciada ? 'Pausa táctica' : 'Listo para iniciar')}
            </div>
          )}
          {anuncio && <div className="segunda-vida" role="status" aria-label="Segunda vida del gorila">
            <img src={retrato_furia} alt="" />
            <strong>Segunda vida</strong>
            <span>Furia permanente</span>
          </div>}
        </div>
        <div className="controles-arcade">
          {!iniciada ? <button className="principal" disabled={cargando_arena} onClick={() => { audio.current?.activar(sonido); cambiar_inicio(true); }}>Iniciar</button> : <button ref={boton_estrategia} className="principal" aria-haspopup="dialog"
            disabled={Boolean(batalla.resultado) || cargando_arena || anuncio} onClick={abrir_estrategia}>Estrategia</button>}
          <p>Tácticas · <strong>{Object.entries(batalla.plan).map(([id, valor]) => `${TACTICAS[id].nombre} ${valor} %`).join(' · ') || 'Guardia'}</strong></p>
          <p className="ultimo-evento">Último evento · {ultimo_evento?.tipo.replaceAll('_', ' ') || 'Equipo listo'}</p>
        </div>
      </section>
      <PanelEquipo batalla={batalla} perfil={perfil} cambiar_perfil={cambiar_perfil} />
    </div>
    <section className="reglas"><h2>Reglas</h2>
      <p>Pulsa Iniciar para que el equipo entre en combate. Abre Estrategia para pausar la batalla y repartir exactamente el 100 % entre un máximo de tres tácticas. Agota la resistencia del gorila antes de que se agote el reloj.
        Si todos caen o se acaba el tiempo, gana el gorila.</p>
      <p>Cada hombre tiene ocho habilidades, una edad de 18 a 100 años y puede empezar sin objeto o con uno sorteado del catálogo de 1,000.
        La edad modifica sus habilidades físicas y el miedo puede hacerlo retroceder.</p>
    </section>
    <MenuEstrategia dialogo={dialogo} batalla={batalla} categoria={categoria}
      cambiar_categoria={cambiar_categoria} plan={plan} cambiar_plan={cambiar_plan} comprar={comprar}
      reanudar={reanudar} cancelar={cerrar_estrategia} />
  </main>;
}

createRoot(document.getElementById('root')).render(<App />);
