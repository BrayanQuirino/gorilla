import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import catalogo from './data/objetos.json';
import { crear_sorteo_objetos, preparar_equipo, habilidades, arquetipos } from './roster.js';
import { alto, ancho, avanzar_batalla, crear_batalla, activo, aplicar_plan, comprar_suministro, dificultades, distribucion_equipo, paramedicos_disponibles, duracion_segunda_vida, reanudar_segunda_vida, en_furia, danio_humano, dano_puno_arquetipo, eficiencia_arma, condiciones_combate } from './battle.js';
import { crear_dibujante } from './arena.js';
import { crear_dibujante_3d } from './arena3d.js';
import { ARENAS, TACTICAS, SUMINISTROS } from './rules.js';
import { encuadre } from './terreno.js';
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
export function resumen_armas_por_nivel(batalla) {
  const recuento=[1,2,3,4,5].map(nivel=>({nivel,equipadas:0,suelo:0,total:0}));
  for(const h of batalla.hombres){
    if(activo(h)&&h.objeto){
      const nivel=Math.min(5,Math.max(1,Math.floor(h.objeto.nivel||1)));
      recuento[nivel-1].equipadas++;
    }
  }
  for(const item of batalla.armas_suelo){
    if(!item.recogido_por&&item.objeto){
      const nivel=Math.min(5,Math.max(1,Math.floor(item.objeto.nivel||1)));
      recuento[nivel-1].suelo++;
    }
  }
  for(const fila of recuento)fila.total=fila.equipadas+fila.suelo;
  return recuento;
}
function ResumenArmas({batalla}) {
  const niveles=resumen_armas_por_nivel(batalla);
  const equipadas=niveles.reduce((s,n)=>s+n.equipadas,0);
  const suelo=niveles.reduce((s,n)=>s+n.suelo,0);
  return <section className="resumen-armas" aria-label="Resumen de armas por nivel">
    <div className="resumen-armas-encabezado"><h3>🧰 Inventario por nivel</h3><strong>{equipadas+suelo} objetos en juego</strong></div>
    <div className="niveles-armas">{niveles.map(n=><div className={'nivel-arma nivel-arma-'+n.nivel} key={n.nivel}>
      <span>NIVEL {['I','II','III','IV','V'][n.nivel-1]}</span><strong>{n.total}</strong>
      <small>{n.equipadas} equipadas · {n.suelo} en arena</small>
    </div>)}</div>
    <div className="total-armas"><strong>TOTAL: {equipadas+suelo}</strong>
      <span>{equipadas} equipadas · {suelo} en el suelo</span></div>
  </section>;
}
function TablaDanoIndividual({hombres}){
 const [consulta,cambiar_consulta]=useState('');
 const lista=hombres.filter(h=>String(h.id).includes(consulta)||h.arquetipo.toLowerCase().includes(consulta.toLowerCase())||
   (h.objeto?.nombre||'').toLowerCase().includes(consulta.toLowerCase()));
 const decimal=n=>n.toFixed(4).replace(/0+$/,'').replace(/\\.$/,'');
 return <section className="dano-individual" aria-label="Fuerza de daño de cada hombre">
  <div className="dano-individual-titulo"><h3>⚔️ Daño individual real (PV)</h3><small>Daño actual por impacto acertado, sin distancia ni apertura</small></div>
  <input aria-label="Buscar combatiente por número, arquetipo o arma" type="search" placeholder="Buscar #, arquetipo u objeto" value={consulta} onChange={e=>cambiar_consulta(e.target.value)}/>
  <div className="dano-tabla-contenedor"><table className="dano-tabla">
   <thead><tr><th>Humano</th><th>Objeto</th><th>Físico</th><th>Arma efectiva</th><th>Total PV</th></tr></thead>
   <tbody>{lista.map(h=>{
     const preparado=activo(h);
     const disparo=h.objeto?.tipo==='fuego'&&h.objeto.municion>0;
     const puño=dano_puno_arquetipo[h.arquetipo]??.015;
     const factor=Math.min(1,condiciones_combate(h).potencia);
     const fisico=disparo?0:puño*factor;
     const total=preparado?danio_humano(h,disparo,1,0):0;
     const extra=Math.max(0,total-fisico);
     return <tr key={h.id} className={preparado?'':'combatiente-caido'}>
       <td><strong>#{h.id}</strong> <small>{h.arquetipo}</small></td>
       <td>{h.objeto?.nombre||'Sin arma'}{h.objeto?.tipo==='fuego'?<small>{h.objeto.municion>0?' · 1 bala':' · Descargada'}</small>:null}</td>
       <td>{decimal(fisico)}</td><td>{decimal(extra)}</td><td><strong>{decimal(total)}</strong></td>
     </tr>;
   })}</tbody>
  </table></div>
  <p className="nota-dano">El objeto nunca supera su daño máximo del JSON. Inteligencia, técnica, precisión y estado del portador reducen la cifra. Los disparos no suman puñetazo.</p>
 </section>;
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
      <TablaDanoIndividual hombres={miembros}/>
    </>:<>
      <div className="indicadores">
        <Indicador titulo="Activos" valor={vivos.length} icono="👥"/>
        <Indicador titulo="Equipados" valor={equipados} icono="🧰"/>
        <Indicador titulo="Valentía %" valor={valentia} icono="⚡"/>
        <Indicador titulo="Objetos en arena" valor={batalla.armas_suelo.filter(o=>!o.recogido_por).length} icono="📦"/>
      </div>
      <ResumenArmas batalla={batalla}/>
      <TablaDanoIndividual hombres={batalla.hombres}/>
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
        {Object.entries(batalla.plan).map(([id,valor])=>{
          const porcentaje=distribucion_equipo(batalla).porcentaje(id);
          return <div key={id}><span>{TACTICAS[id].nombre}</span><progress value={porcentaje} max="100"/>
            <b>{porcentaje.toFixed(1)}% {id==='rescatar'?'🩺':''}</b></div>;
        })}
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


const iconos_suministros={
  municion:'📦',energizante:'⚡',botiquin:'🩹',comida:'🍲',adrenalina:'💉',
  cascos:'🪖',escudos:'🛡️',chalecos:'🥋',barricada:'🧱',
  bates:'🏏',red:'🕸️',cuerdas:'🪢',refuerzos:'👥',inspiracion:'🔥'
};
const beneficios={
 municion:'5 balas para recargar armas de fuego, una por arma; el sobrante queda en reserva.',
 energizante:'Recupera 35 de energía a 10 combatientes cercanos. Efecto de recuperación durante 15 s.',
 botiquin:'Cura 25 PV a 5 combatientes. El recolector lleva la ayuda a sus compañeros.',
 comida:'Recupera 15 de energía a 15 combatientes.',
 adrenalina:'Impulso de combate para 8 hombres durante 15 segundos.',
 cascos:'10 cascos visibles. Cada uno reduce un 20% del daño.',
 escudos:'6 escudos visibles. Reducen un 35% del daño.',
 chalecos:'8 chalecos visibles. Reducen un 25% del daño.',
 barricada:'Construye cobertura visible en 3 s. 150 PV, 30 s de duración, protege del 40% del daño.',
 bates:'10 bates de combate. Aumentan 15% el daño.',
 red:'Red visible sobre el gorila: lo ralentiza durante 8 s hasta que la rompe.',
 cuerdas:'6 cuerdas para sujetar al gorila durante 4 s; se tensan y finalmente se rompen.',
 refuerzos:'Llegan 5 hombres nuevos de arquetipos aleatorios, en cualquier momento.',
 inspiracion:'Inspira al equipo y eleva su valentía durante 20 segundos.'
};
function MenuEstrategia({abierto,batalla,categoria,cambiar_categoria,plan,cambiar_plan,comprar,reanudar,cancelar}){
  const maxRescate=paramedicos_disponibles(batalla);
  const rescatar=plan.rescatar||0;
  const entradas=Object.entries(TACTICAS).filter(([id])=>id!=='rescatar');
  const suma=Object.entries(plan).filter(([id])=>id!=='rescatar')
    .reduce((a,[,v])=>a+v,0);
  const distribucion=distribucion_equipo(batalla,plan);
  const porcentajeDisponible=distribucion.total?100*distribucion.restantes/distribucion.total:0;
  function porcentaje(id,valor){
    const siguiente={...plan},actual=siguiente[id]||0;
    if(valor===actual)return;
    const otros=Object.keys(siguiente).filter(k=>k!=='rescatar');
    if(valor===0){
      if(otros.length===1)return;
      delete siguiente[id];
      const destino=otros.filter(x=>x!==id).sort((a,b)=>siguiente[b]-siguiente[a])[0];
      siguiente[destino]+=actual;
    }else if(!actual){
      const donante=otros.sort((a,b)=>siguiente[b]-siguiente[a])[0];
      const cantidad=Math.min(valor,Math.max(0,siguiente[donante]-5));
      if(cantidad<5)return;
      siguiente[donante]-=cantidad;siguiente[id]=cantidad;
    }else if(valor>actual){
      let falta=valor-actual;
      for(const otro of otros.filter(x=>x!==id).sort((a,b)=>siguiente[b]-siguiente[a])){
        const mover=Math.min(falta,siguiente[otro]-5);
        siguiente[otro]-=mover;falta-=mover;
        if(!falta)break;
      }
      siguiente[id]=valor-falta;
    }else{
      const destino=otros.filter(x=>x!==id).sort((a,b)=>siguiente[b]-siguiente[a])[0];
      if(!destino)return;
      siguiente[destino]+=actual-valor;siguiente[id]=valor;
    }
    cambiar_plan(siguiente);
  }
  function cambiar_rescate(n){
    const nuevo=Math.max(0,Math.min(maxRescate,n));
    const siguiente={...plan};
    if(nuevo)siguiente.rescatar=nuevo;else delete siguiente.rescatar;
    cambiar_plan(siguiente);
  }
  const vivos=batalla.hombres.filter(activo);
  const armados=vivos.filter(h=>h.objeto).length;
  const heridos=vivos.filter(h=>h.estado==='herido').length;
  const cansados=vivos.filter(h=>h.energia<30).length;
  const caidos=batalla.hombres.filter(h=>!activo(h)).length;
  const conArmaFuego=vivos.filter(h=>h.objeto?.tipo==='fuego'&&h.objeto.municion>0).length;
  const vidaEquipo=vivos.length?Math.round(vivos.reduce((total,h)=>total+h.vida/h.vida_maxima,0)/vivos.length*100):0;
  const energiaEquipo=vivos.length?Math.round(vivos.reduce((total,h)=>total+h.energia,0)/vivos.length):0;
  const coraje=vivos.length?Math.round(vivos.reduce((total,h)=>total+h.valentia,0)/vivos.length):0;
  const indicadores=[
    {icon:'👥',etiqueta:'En combate',valor:vivos.length,sub:'de '+batalla.hombres.length},
    {icon:'🧰',etiqueta:'Armados',valor:armados,sub:conArmaFuego+' con arma de fuego'},
    {icon:'🩹',etiqueta:'Heridos',valor:heridos,sub:cansados+' agotados'},
    {icon:'💀',etiqueta:'Bajas',valor:caidos,sub:'fuera de combate'},
  ];
  const descripcionesTacticas={
    atacar:{icon:'⚔️',detalle:'Presionan al gorila; mayor daño, mayor exposición.',foco:'Ofensiva'},
    huir:{icon:'💨',detalle:'Se alejan del gorila para sobrevivir y recuperar posición.',foco:'Supervivencia'},
    esconder:{icon:'🌿',detalle:'Se refugian detrás del terreno para evitar ser vistos.',foco:'Cobertura'},
    buscar_armas:{icon:'🎒',detalle:'Recogen equipo de la arena para aumentar el daño.',foco:'Equipamiento'},
    distraer:{icon:'🎯',detalle:'Desvían la atención del gorila para proteger aliados.',foco:'Control'},
  };
  const orientacion=armados<Math.max(10,vivos.length*.3)?'Queda poco equipo armado: conviene buscar armas.'
    :heridos>vivos.length*.25?'Hay muchos heridos: considera huir y asignar paramédicos.'
    :energiaEquipo<42?'El equipo está agotado: conviene reducir la presión y reagruparse.'
    :coraje<45?'La valentía es baja: distraer y esconderse puede evitar bajas.'
    :'El equipo tiene recursos para presionar; ajusta los porcentajes según el terreno.';
  if(!abierto)return null;
  return <div className="estrategia-cortina" onMouseDown={e=>{if(e.target===e.currentTarget)cancelar();}}>
    <section className="menu-estrategia" role="dialog" aria-modal="true" aria-labelledby="titulo-estrategia">
    <header className="menu-cabecera"><h2 id="titulo-estrategia">{categoria==='Equipo'?'📊 Equipo':categoria==='Suministros'?'📦 Suministros':'⚔️ Tácticas'}</h2>
      <button type="button" onClick={cancelar} aria-label="Cerrar menú y volver al campo">✕</button></header>
    <div className="tabs-retro">
      <button aria-pressed={categoria==='Combate'} onClick={()=>cambiar_categoria('Combate')}>⚔️ Tácticas</button>
      <button aria-pressed={categoria==='Suministros'} onClick={()=>cambiar_categoria('Suministros')}>📦 Suministros</button>
      <button aria-pressed={categoria==='Equipo'} onClick={()=>cambiar_categoria('Equipo')}>📊 Equipo</button>
    </div>
    {categoria==='Equipo'?<div className="panel-equipo-integrado"><PanelEquipo batalla={batalla}/></div>:<div className="panel-tactico-layout">
      <section className="comando-panel comando-compartido" aria-label="Inteligencia táctica">
        <div className="comando-encabezado">
          <span className="comando-emblema" aria-hidden="true"><img className="comando-retrato" src={retrato_furia} alt=""/></span>
          <div><strong>CENTRO DE MANDO</strong><small>Estado del escuadrón · {ARENAS[batalla.arena].nombre}</small></div>
          <span className="comando-directo">● EN VIVO</span>
        </div>
        <div className="comando-indicadores">{indicadores.map(d=><div className="comando-dato" key={d.etiqueta}>
          <span className="comando-icono" aria-hidden="true">{d.icon}</span>
          <span><small>{d.etiqueta}</small><strong>{d.valor}</strong><em>{d.sub}</em></span>
        </div>)}</div>
        <div className="comando-graficas">
          <div className="comando-dona" style={{'--porcion':vivos.length/Math.max(1,batalla.hombres.length)*100}}>
            <span><strong>{vivos.length}</strong><small>ACTIVOS</small></span>
          </div>
          <div className="comando-barras">
            {[
              {nombre:'Salud media',n:vidaEquipo,color:'#7ed99b'},
              {nombre:'Energía',n:energiaEquipo,color:'#eec36c'},
              {nombre:'Valentía',n:coraje,color:'#8fc7f1'},
              {nombre:'Equipamiento',n:Math.round(armados/Math.max(1,vivos.length)*100),color:'#c9a4fc'},
            ].map(d=><div className="comando-medidor" key={d.nombre}>
              <div><span>{d.nombre}</span><b>{d.n}%</b></div>
              <div className="comando-pista"><i style={{width:d.n+'%',background:d.color}}/></div>
            </div>)}
          </div>
        </div>
        <div className="comando-consejo"><span>💡</span><p>{orientacion}</p></div>
      </section>
    <div className="panel-tactico-acciones">
    {categoria==='Suministros'?<>
      <p className="saldo">🍌 {batalla.bananas} · {batalla.entregas.length} paquetes en camino</p>
      <div className="lista-suministros">{Object.entries(SUMINISTROS).map(([id,item])=>
        <button className="suministro-descrito" key={id} disabled={batalla.bananas<item.costo}
          onClick={()=>comprar(id)}><span className="suministro-icono" aria-hidden="true">{iconos_suministros[id]||'📦'}</span>
          <span className="suministro-descripcion"><strong>{item.nombre}</strong><small>{beneficios[id]}</small></span>
          <b>{item.costo} 🍌</b></button>)}</div>
    </>:<>

      <div className="tactica-medicos">
        <div><strong>🩺 Paramédicos de rescate</strong><small>Cada paramédico asignado resta un combatiente de las demás tácticas.</small></div>
        <div className="contador-paramedicos">
          <button aria-label="Asignar un paramédico menos" disabled={rescatar<=0}
            onClick={()=>cambiar_rescate(rescatar-1)}>−</button>
          <strong>{rescatar} / {maxRescate}</strong>
          <button aria-label="Asignar un paramédico más" disabled={rescatar>=maxRescate}
            onClick={()=>cambiar_rescate(rescatar+1)}>+</button>
        </div>
      </div>

      <div className="tacticas-todas">{entradas.map(([id,t])=>{
        const valor=plan[id]||0;
        return <div className="tactica-fila" key={id}>
          <div className="tactica-cabecera"><strong><span className="tactica-emoji">{descripcionesTacticas[id]?.icon}</span>{t.nombre}</strong><b>{distribucion.porcentaje(id).toFixed(1)}% <small>({distribucion.cuotas[id]||0})</small></b></div>
          <div className="tactica-detalle"><span>{descripcionesTacticas[id]?.foco}</span><small>{descripcionesTacticas[id]?.detalle}</small></div>
          <div className="tactica-ajuste">
            <input type="range" aria-label={t.nombre} min="0" max="100" step="any"
              value={valor*porcentajeDisponible/100}
              onChange={e=>porcentaje(id,Math.max(0,Math.min(100,Math.round(Number(e.target.value)*100/Math.max(1,porcentajeDisponible)/5)*5)))}/>
            <button onClick={()=>porcentaje(id,valor?0:10)}>{valor?'✕':'+'}</button>
          </div>
        </div>;
      })}</div>
    </>}
    </div></div>}
    <footer><button onClick={cancelar}>Cerrar</button>
      <button className="principal" onClick={reanudar} disabled={suma!==100}>{categoria==='Combate'?'Aplicar y jugar':'Volver al juego'}</button></footer>
    </section>
  </div>;
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
  const [rayos_x, cambiar_rayos_x]=useState(false);
  const [, actualizar_panel] = useState(0);
  const canvas = useRef(null);
  const dibujar = useRef(null);
  const audio = useRef(null);
  const indice_sonido = useRef(0);
  const [sonido, cambiar_sonido] = useState(true);
  const [volumen_musica, cambiar_volumen_musica] = useState(27);
  const [volumen_efectos, cambiar_volumen_efectos] = useState(70);
  const ultimo_cuadro = useRef(null);
  const [menu_abierto,cambiar_menu_abierto] = useState(false);
  const boton_estrategia = useRef(null);
  const [arte_listo, cambiar_arte_listo] = useState(false);
  const cargando_arena = modo_visual === '3d' && !arte_listo;
  const gorila = batalla.gorila;
  const anuncio = gorila.segunda_vida === 'anuncio';
  const pausa_activa = en_pausa || panel_movil !== null || rayos_x;
  const activos = batalla.hombres.filter(activo).length;
  const segundos = Math.ceil(batalla.tiempo);
  const victoria = batalla.resultado==='Victoria de los hombres';
  const reloj = `${Math.floor(segundos / 60)}:${String(segundos % 60).padStart(2, '0')}`;

  useEffect(() => {
    audio.current=crear_audio_arcade();
    return ()=>audio.current?.cerrar();
  },[]);
  useEffect(() => {
    audio.current?.configurarArena(batalla.arena);
    audio.current?.activar(sonido && iniciada && !pausa_activa && !Boolean(batalla.resultado), anuncio);
  },[sonido,iniciada,pausa_activa,batalla.resultado,anuncio,batalla.arena]);
  // The transformation pauses the simulation: trigger its approved roar
  // from the announcement lifecycle, rather than relying on later frame events.
  const anuncio_sonorizado = useRef(false);
  useEffect(() => {
    if (!anuncio) { anuncio_sonorizado.current=false; return; }
    if (sonido && !pausa_activa && !anuncio_sonorizado.current) {
      anuncio_sonorizado.current=true;
      audio.current?.efecto('segunda_vida');
    }
  },[anuncio,sonido,pausa_activa]);
  useEffect(() => {
    audio.current?.volumenMusica(volumen_musica / 100);
    audio.current?.volumenEfectos(volumen_efectos / 100);
  },[volumen_musica,volumen_efectos]);
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
    let ultimaCelebracion;
    function animar(ahora) {
      if (anterior !== undefined && jugando && !batalla.resultado) avanzar_batalla(batalla, Math.min(.05, (ahora - anterior) / 1000) * 1.25);
      if(batalla.resultado==='Victoria de los hombres'){
        if(ultimaCelebracion===undefined)ultimaCelebracion=ahora;
        if(!pausa_activa)batalla.celebracion=Math.min(6,(ahora-ultimaCelebracion)/1000);
      }
      anterior = ahora;
      pintar();
      const eventos=batalla.eventos;
      for(const evento of eventos){
        if(evento.id <= indice_sonido.current)continue;
        indice_sonido.current=evento.id;
        if(sonido && iniciada && !pausa_activa && evento.tipo!=='segunda_vida')audio.current?.efecto(evento.tipo,evento);
      }
      if (ahora - ultimo_panel >= 100) {
        ultimo_panel = ahora;
        actualizar_panel(valor => valor + 1);
      }
      if (jugando && batalla.gorila.segunda_vida === 'anuncio') actualizar_panel(valor => valor + 1);
      else if (jugando && (!batalla.resultado || (batalla.resultado==='Victoria de los hombres' && (batalla.celebracion||0)<6))) cuadro = requestAnimationFrame(animar);
    }
    cuadro = requestAnimationFrame(animar);
    return () => {
      cancelAnimationFrame(cuadro);
      ultimo_cuadro.current = null;
    };
  }, [batalla, iniciada, pausa_activa, modo_visual, cargando_arena, anuncio]);

  useEffect(() => {
    if (!anuncio || pausa_activa) return;
    const aviso = setTimeout(() => {
      if (reanudar_segunda_vida(batalla)) actualizar_panel(valor => valor + 1);
    }, duracion_segunda_vida);
    return () => clearTimeout(aviso);
  }, [batalla, anuncio, pausa_activa]);

  useEffect(() => {
    if(!menu_abierto)return;
    function tecla(evento){
      if(evento.key==='Escape'){evento.preventDefault();cerrar_estrategia();}
    }
    window.addEventListener('keydown',tecla);
    return ()=>window.removeEventListener('keydown',tecla);
  },[menu_abierto]);

  function abrir_estrategia(seccion='Combate') {
    cambiar_categoria(seccion);
    cambiar_plan({ ...batalla.plan });
    cambiar_pausa(true);
    cambiar_menu_abierto(true);
  }

  function reanudar() {
    aplicar_plan(batalla, plan);
    cerrar_estrategia();
  }

  function cerrar_estrategia() {
    cambiar_menu_abierto(false);
    cambiar_pausa(false);
    boton_estrategia.current?.focus();
  }

  function nueva_partida(nivel = dificultad, arena = arena_elegida) {
    cambiar_rayos_x(false);
    indice_sonido.current=0;
    cambiar_arte_listo(false);
    cambiar_batalla(partida(nivel, arena));
    cambiar_panel_movil(null);
    cambiar_arquetipo_abierto(null);
    cambiar_menu_abierto(false);
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
      <div className="marca"><img className="gorila-logo" src={retrato_furia} alt="Gorila furioso"/><h1>Gorilla<span>.</span></h1><p>100 vs 1 · ARCADE</p></div>
      <div className="cabecera-acciones">
        <button onClick={()=>cambiar_sonido(v=>!v)} aria-label={sonido?'Silenciar':'Activar audio'}>{sonido?'♫':'♪̸'}</button>
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
          <Barra nombre="Equipo" valor={activos} maximo={Math.max(100,batalla.hombres.length)} detalle={activos+' / '+batalla.hombres.length}/>
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
          {victoria&&<div className="celebracion-victoria" aria-label="Victoria: los hombres celebran">🏆 ¡VICTORIA! <span>Los supervivientes celebran</span></div>}
          {menu_abierto&&<MenuEstrategia abierto={menu_abierto} batalla={batalla} categoria={categoria}
            cambiar_categoria={cambiar_categoria} plan={plan} cambiar_plan={cambiar_plan}
            comprar={comprar} reanudar={reanudar} cancelar={cerrar_estrategia}/>}
          {rayos_x&&<div className="visor-rayos-x"><div className="visor-titulo">⌖ RAYOS X · {batalla.armas_suelo.filter(o=>!o.recogido_por).length} objetos</div><svg viewBox="0 0 1000 640" preserveAspectRatio="none" aria-label="Mapa de armas en la arena">{batalla.armas_suelo.filter(o=>!o.recogido_por).map(o=>{const vista=encuadre(batalla.arena);const x=vista.x+o.x*vista.ancho/ancho;const y=vista.y+o.y*vista.alto/alto;return <g key={o.id}><circle cx={x} cy={y} r={o.objeto?.tipo==='fuego'?19:13} fill="#6efae622" stroke="#60ffe8" strokeWidth="3"/><circle cx={x} cy={y} r="4" fill="#fff3a0"/></g>;})}</svg></div>}
          {anuncio&&<div className="segunda-vida" role="status" aria-label="Segunda vida del gorila">
            <img src={retrato_furia} alt=""/>
            <strong>SEGUNDA VIDA</strong><span>+15% de vida · Furia permanente</span>
          </div>}
        </div>
        <div className="controles-arcade botones-juego">
          {!iniciada?
            <button className="principal" disabled={cargando_arena}
              onClick={()=>{audio.current?.configurarArena(batalla.arena);audio.current?.activar(sonido);if(sonido)audio.current?.efecto('inicio_batalla');cambiar_inicio(true);}}>▶ Iniciar batalla</button>:
            <button className="principal" ref={boton_estrategia}
              disabled={Boolean(batalla.resultado)||cargando_arena||anuncio}
              onClick={()=>abrir_estrategia('Combate')}>⚔️ Tácticas</button>}
          <button disabled={!iniciada||Boolean(batalla.resultado)||cargando_arena||anuncio}
            onClick={()=>abrir_estrategia('Suministros')}>📦 Suministros</button>
          <button onClick={()=>abrir_estrategia('Equipo')}>📊 Equipo</button>
          <button aria-pressed={rayos_x} onClick={()=>cambiar_rayos_x(v=>!v)}>{rayos_x?'✕ Cerrar rayos X':'⌖ Rayos X'}</button>
        </div>
      </section>

    </div>
    {panel_movil&&<div className="hoja-fondo" onClick={()=>{cambiar_panel_movil(null);cambiar_arquetipo_abierto(null);}}>
      <section role="dialog" aria-modal="true" aria-label={panel_movil==='ajustes'?'Ajustes':'Equipo'}
        className={`hoja-movil hoja-superpuesta ${panel_movil==='ajustes'?'hoja-ajustes':'hoja-equipo'}`} onClick={e=>e.stopPropagation()}>
        <div className="hoja-cabecera"><h2>{panel_movil==='ajustes'?'⚙ Ajustes':'📊 Equipo'}</h2>
          <button onClick={()=>{cambiar_panel_movil(null);cambiar_arquetipo_abierto(null);}} aria-label="Cerrar">✕</button></div>
        {panel_movil==='equipo'?<PanelEquipo batalla={batalla} seleccionInicial={arquetipo_abierto}/>:<div className="ajustes-panel ajustes-cuadricula">
          <label>Vista<select value={modo_visual} onChange={e=>{cambiar_arte_listo(false);cambiar_modo_visual(e.target.value);}}>
            <option value="3d">Arcade 2.5D</option><option value="2d">Retro 2D</option></select></label>
          <label>Arena<select value={arena_elegida} onChange={e=>{const id=e.target.value;cambiar_arena(id);nueva_partida(dificultad,id);}}>
            {Object.entries(ARENAS).map(([id,item])=><option key={id} value={id}>{item.nombre}</option>)}</select></label>
          <label>Dificultad<select value={dificultad} onChange={e=>{const n=Number(e.target.value);cambiar_dificultad(n);nueva_partida(n);}}>
            {dificultades.map((d,i)=><option key={d} value={i}>{d}</option>)}</select></label>
          <label>♫ Música {volumen_musica}%<input type="range" min="0" max="100" value={volumen_musica} onChange={e=>cambiar_volumen_musica(Number(e.target.value))} aria-label="Volumen de música"/></label>
          <label>🔊 Efectos {volumen_efectos}%<input type="range" min="0" max="100" value={volumen_efectos} onChange={e=>cambiar_volumen_efectos(Number(e.target.value))} aria-label="Volumen de efectos"/></label>
          <button className="principal reiniciar-partida" onClick={()=>{nueva_partida();cambiar_panel_movil(null);}}>↻ Nueva partida</button>
        </div>}
      </section></div>}
  </main>;
}

createRoot(document.getElementById('root')).render(<App />);
